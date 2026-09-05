import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisReport } from '../types';

// AWS Docker API (same as last time). Do not use port 80 — that is leftover nginx, not our app.
export const CUSTOM_API_URL: string | null = 'http://18.144.67.31:8000/api/v1';

const AUTH_TOKEN_KEY = '@ai_cricket_coach/auth_token';
const AUTH_EMAIL_KEY = '@ai_cricket_coach/auth_email';
const AUTH_NAME_KEY = '@ai_cricket_coach/auth_name';
const ONBOARDING_DONE_KEY = '@ai_cricket_coach/onboarding_done';
const GUEST_EMAIL_KEY = '@ai_cricket_coach/guest_email';
const GUEST_PASSWORD_KEY = '@ai_cricket_coach/guest_password';

export const isGuestEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  return (
    lower.startsWith('guest_') ||
    lower.includes('@ai-cricket-coach.local') ||
    lower.includes('@cricketcoach.com') ||
    lower.includes('guest')
  );
};

const clearGuestCredentials = async () => {
  await AsyncStorage.multiRemove([GUEST_EMAIL_KEY, GUEST_PASSWORD_KEY]);
};

// Dynamic API Base URL resolution for Physical Mobile Devices vs Emulators vs Web
const getDynamicApiUrl = (): string => {
  if (CUSTOM_API_URL) return CUSTOM_API_URL;
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api/v1';
  }

  const hostUri = Constants.expoConfig?.hostUri || (Constants.manifest as any)?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:8000/api/v1`;
    }
  }

  return 'http://192.168.31.60:8000/api/v1';
};

export const API_BASE_URL = getDynamicApiUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let memoryAuthToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  memoryAuthToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const getAuthToken = (): string | null => memoryAuthToken;

export const persistAuthSession = async (token: string, email?: string, fullName?: string) => {
  setAuthToken(token);
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  if (email) {
    await AsyncStorage.setItem(AUTH_EMAIL_KEY, email.trim().toLowerCase());
  }
  if (fullName) {
    await AsyncStorage.setItem(AUTH_NAME_KEY, fullName.trim());
  }
};

export const clearAuthSession = async () => {
  setAuthToken(null);
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  await AsyncStorage.removeItem(AUTH_EMAIL_KEY);
  await AsyncStorage.removeItem(AUTH_NAME_KEY);
  await clearGuestCredentials();
};

export const markOnboardingDone = async () => {
  await AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1');
};

export const isOnboardingDone = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
  return value === '1';
};

export type RestoredSession = {
  isLoggedIn: boolean;
  onboardingDone: boolean;
  email: string | null;
  fullName: string | null;
  isGuest: boolean;
};

/** Restore saved login so uploads/history work after app restart. */
export const restoreAuthSession = async (): Promise<RestoredSession> => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const email = await AsyncStorage.getItem(AUTH_EMAIL_KEY);
  const fullName = await AsyncStorage.getItem(AUTH_NAME_KEY);
  const onboarding = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);

  if (token) {
    setAuthToken(token);
  }

  return {
    isLoggedIn: Boolean(token),
    onboardingDone: onboarding === '1',
    email: email || null,
    fullName: fullName || null,
    isGuest: isGuestEmail(email),
  };
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  is_active?: boolean;
  created_at?: string;
};

export const getCurrentUser = async (): Promise<UserProfile> => {
  if (!getAuthToken()) {
    const savedEmail = await AsyncStorage.getItem(AUTH_EMAIL_KEY);
    if (savedEmail && !isGuestEmail(savedEmail)) {
      throw new Error('Please sign in again to view your profile.');
    }
    await ensureGuestSession();
  }
  const response = await apiClient.get('/auth/me');
  const user = response.data;
  if (user?.email) {
    await AsyncStorage.setItem(AUTH_EMAIL_KEY, String(user.email).toLowerCase());
  }
  if (user?.full_name) {
    await AsyncStorage.setItem(AUTH_NAME_KEY, String(user.full_name));
  }
  return user;
};

export const registerUser = async (email: string, password: string, fullName: string) => {
  const response = await apiClient.post('/auth/register', {
    email,
    password,
    full_name: fullName,
  }, { timeout: 10000 });
  return response.data;
};

export const loginUser = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const params = new URLSearchParams();
  params.append('username', normalizedEmail);
  params.append('password', password);
  const response = await apiClient.post('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10000,
  });
  if (response.data?.access_token) {
    const name = response.data?.user?.full_name;
    await persistAuthSession(response.data.access_token, normalizedEmail, name);
    // Member login = own history only; drop old guest credentials on this phone.
    if (!isGuestEmail(normalizedEmail)) {
      await clearGuestCredentials();
    }
  }
  return response.data;
};

/**
 * Per-device guest account so guest uploads still get a user_id
 * and appear in Shot History after the app is reopened.
 * Recovers when backend DB was reset but phone still has old credentials.
 */
export const ensureGuestSession = async (): Promise<void> => {
  if (getAuthToken()) {
    const savedEmail = await AsyncStorage.getItem(AUTH_EMAIL_KEY);
    if (savedEmail && !isGuestEmail(savedEmail)) {
      return;
    }
  }

  const createFreshGuest = async () => {
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const guestEmail = `guest_${suffix}@ai-cricket-coach.local`;
    const guestPassword = `Guest_${suffix}_Safe1`;
    await AsyncStorage.setItem(GUEST_EMAIL_KEY, guestEmail);
    await AsyncStorage.setItem(GUEST_PASSWORD_KEY, guestPassword);
    await registerUser(guestEmail, guestPassword, 'Guest Player');
    await loginUser(guestEmail, guestPassword);
  };

  let guestEmail = await AsyncStorage.getItem(GUEST_EMAIL_KEY);
  let guestPassword = await AsyncStorage.getItem(GUEST_PASSWORD_KEY);

  if (!guestEmail || !guestPassword) {
    await createFreshGuest();
    return;
  }

  try {
    await loginUser(guestEmail, guestPassword);
  } catch {
    // Stale guest after DB reset — re-register same creds, or mint a new guest.
    try {
      await registerUser(guestEmail, guestPassword, 'Guest Player');
      await loginUser(guestEmail, guestPassword);
    } catch {
      await AsyncStorage.multiRemove([GUEST_EMAIL_KEY, GUEST_PASSWORD_KEY]);
      await createFreshGuest();
    }
  }
};

export const getOverlayVideoUrl = (overlayPath: string): string => {
  if (!overlayPath) return '';
  if (overlayPath.startsWith('http://') || overlayPath.startsWith('https://')) {
    return overlayPath;
  }
  const cleanPath = overlayPath.startsWith('/') ? overlayPath : `/${overlayPath}`;
  const host = API_BASE_URL.replace('/api/v1', '');
  return `${host}${cleanPath}`;
};

export const uploadVideoForAnalysis = async (
  videoUri: string,
  movementProfile: string = 'CRICKET',
  onProgress?: (percentage: number) => void,
  battingStance: 'AUTO' | 'RIGHT' | 'LEFT' = 'AUTO'
): Promise<{ id?: string; video_id?: string; report_id?: string; overlay_video_path?: string }> => {
  // Always attach uploads to a user so Shot History works.
  if (!getAuthToken()) {
    await ensureGuestSession();
  }

  const formData = new FormData();

  const cleanUri =
    Platform.OS === 'android' && !videoUri.startsWith('file://') && !videoUri.startsWith('content://')
      ? `file://${videoUri}`
      : videoUri;

  const filename = cleanUri.split('/').pop() || 'cricket_shot.mp4';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `video/${match[1]}` : 'video/mp4';

  // @ts-ignore: FormData in React Native accepts uri/name/type object
  formData.append('file', {
    uri: cleanUri,
    name: filename,
    type: type,
  });

  formData.append('movement_profile', movementProfile);
  formData.append('batting_stance', battingStance);

  try {
    const uploadUrl = `${API_BASE_URL}/videos/upload`;
    console.log('Uploading video to:', uploadUrl);
    if (onProgress) onProgress(10);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutMs = 180000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers,
        signal: controller.signal,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError?.name === 'AbortError') {
        throw new Error(
          `Upload timed out after ${timeoutMs / 1000}s. Use Wi‑Fi (not mobile data) and keep the AWS API running on port 8000.`
        );
      }
      throw fetchError;
    }
    clearTimeout(timeoutId);

    if (onProgress) onProgress(70);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Upload network error:', error);
    if (error.message?.includes('Network request failed') || error.code === 'ERR_NETWORK') {
      throw new Error(
        `Cannot connect to backend server at ${API_BASE_URL}.\n\nPlease verify:\n1. Server is running at ${API_BASE_URL}\n2. Phone has active internet/cellular or Wi-Fi connection.`
      );
    }
    throw error;
  }
};

export const getAnalysisReport = async (videoId: string): Promise<AnalysisReport> => {
  const response = await apiClient.get(`/analysis/${videoId}`);
  return response.data;
};

export interface PollStatusUpdate {
  status: string;
  elapsedMs: number;
  attempt: number;
}

export const pollForAnalysisResult = async (
  videoId: string,
  maxAttempts: number = 240,
  intervalMs: number = 1500,
  onStatusUpdate?: (update: PollStatusUpdate) => void
): Promise<AnalysisReport> => {
  const startTime = Date.now();

  for (let i = 0; i < maxAttempts; i++) {
    let report: any = null;
    let networkError = false;
    try {
      report = await getAnalysisReport(videoId);
    } catch (e) {
      networkError = true;
    }

    if (!networkError) {
      if (report && (report.overlay_video_url || report.overlay_video_path || report.overall_score)) {
        return report;
      }

      const status = report?.status || 'PROCESSING';
      if (status === 'FAILED') {
        throw new Error(
          report?.error_message || 'Analysis failed on the server. Please try recording again.'
        );
      }

      onStatusUpdate?.({ status, elapsedMs: Date.now() - startTime, attempt: i });
    } else {
      onStatusUpdate?.({ status: 'RETRYING', elapsedMs: Date.now() - startTime, attempt: i });
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Analysis is taking longer than expected on the server. Please check your Shot History tab in a few moments.');
};

export interface FrameDetectionResult {
  batsman_detected: boolean;
  is_aligned: boolean;
  confidence?: number;
  message?: string;
}

export const detectBatsmanInFrame = async (imageUri: string): Promise<FrameDetectionResult> => {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'frame.jpg';
  // @ts-ignore: FormData in React Native accepts uri/name/type object
  formData.append('file', {
    uri: imageUri,
    name: filename,
    type: 'image/jpeg',
  });

  const response = await apiClient.post('/videos/detect-frame', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 8000,
  });
  return response.data;
};

export interface ShotHistoryItem {
  video_id: string;
  created_at: string;
  shot_type?: string;
  verdict?: 'GOOD_SHOT' | 'AVERAGE_SHOT' | 'BAD_SHOT';
  composite_score?: number;
  shot_direction_label?: string;
  shot_count: number;
  overlay_video_path?: string;
}

export const getShotHistory = async (): Promise<ShotHistoryItem[]> => {
  const savedEmail = await AsyncStorage.getItem(AUTH_EMAIL_KEY);
  if (!getAuthToken()) {
    if (savedEmail && !isGuestEmail(savedEmail)) {
      throw new Error('Please sign in again to view your shot history.');
    }
    await ensureGuestSession();
  }
  const response = await apiClient.get('/videos/history');
  return response.data;
};

export const askAiCoach = async (videoId: string, message: string): Promise<string> => {
  const response = await apiClient.post(`/analysis/${videoId}/chat`, { message });
  return response.data.response;
};

export const uploadAndGetOverlay = async (
  videoUri: string,
  movementProfile: string = 'CRICKET',
  onProgress?: (percentage: number) => void,
  maxAttempts: number = 30,
  intervalMs: number = 1500,
  battingStance: 'AUTO' | 'RIGHT' | 'LEFT' = 'AUTO'
): Promise<string> => {
  const uploadResult = await uploadVideoForAnalysis(videoUri, movementProfile, onProgress, battingStance);
  const videoId = uploadResult.video_id ?? uploadResult.id;
  if (!videoId) {
    throw new Error('Video ID not returned from upload');
  }
  const report = await pollForAnalysisResult(videoId, maxAttempts, intervalMs);
  const overlayPath = (report as any).overlay_video_url ?? (report as any).overlay_video_path;
  if (!overlayPath) {
    throw new Error('Overlay video not available in analysis report');
  }
  return overlayPath.startsWith('http') ? overlayPath : getOverlayVideoUrl(overlayPath);
};
