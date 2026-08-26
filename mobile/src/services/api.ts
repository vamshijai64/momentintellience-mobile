import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { AnalysisReport } from '../types';

// Set custom URL here if using Ngrok / LocalTunnel / Cloud server (e.g. 'https://your-ngrok-url.ngrok-free.app/api/v1')
export const CUSTOM_API_URL: string | null = 'http://18.144.67.31:8000/api/v1';

// Dynamic API Base URL resolution for Physical Mobile Devices vs Emulators vs Web
const getDynamicApiUrl = (): string => {
  if (CUSTOM_API_URL) return CUSTOM_API_URL;
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api/v1';
  }

  // Try to automatically derive backend IP from Metro server address (works on physical phone & emulator)
  const hostUri = Constants.expoConfig?.hostUri || (Constants.manifest as any)?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:8000/api/v1`;
    }
  }

  // For physical Android/iOS devices on same Wi-Fi network fallback:
  return 'http://192.168.31.60:8000/api/v1';
};

export const API_BASE_URL = getDynamicApiUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minute timeout for video uploads & pose estimation
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const registerUser = async (email: string, password: string, fullName: string) => {
  const response = await apiClient.post('/auth/register', {
    email,
    password,
    full_name: fullName,
  });
  return response.data;
};

export const loginUser = async (email: string, password: string) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  const response = await apiClient.post('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (response.data?.access_token) {
    setAuthToken(response.data.access_token);
  }
  return response.data;
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
  const formData = new FormData();

  const cleanUri = Platform.OS === 'android' && !videoUri.startsWith('file://') && !videoUri.startsWith('content://') 
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

    if (onProgress) onProgress(15);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

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
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}.\n\nPlease verify:\n1. Server is running at ${API_BASE_URL}\n2. Phone has active internet/cellular or Wi-Fi connection.`);
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

/**
 * Polls GET /analysis/{videoId} until the report is ready. Distinguishes
 * three outcomes instead of the old "give up after 45s and return a useless
 * partial object" behavior:
 * 1. Success — report with overlay/scores is returned.
 * 2. Explicit backend failure (video.status === 'FAILED') — throws
 *    immediately with the real error_message from the server instead of
 *    burning through the remaining poll budget.
 * 3. Still processing after maxAttempts — throws a clear timeout error.
 * Transient network hiccups during polling are swallowed and retried.
 * `onStatusUpdate` lets the UI show live stage text + elapsed time instead
 * of a static spinner for the whole wait.
 */
export const pollForAnalysisResult = async (
  videoId: string,
  maxAttempts: number = 90,
  intervalMs: number = 2000,
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

  throw new Error('Analysis is taking longer than expected. Please check back shortly from Shot History.');
};

export interface FrameDetectionResult {
  batsman_detected: boolean;
  is_aligned: boolean;
  confidence?: number;
  message?: string;
}

/**
 * Sends a single camera-preview snapshot to the backend for a fast pose
 * check, used to drive the real-time "batsman detected & aligned" framing
 * HUD before recording starts (not the full analysis pipeline).
 */
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
  const response = await apiClient.get('/videos/history');
  return response.data;
};

export const askAiCoach = async (videoId: string, message: string): Promise<string> => {
  const response = await apiClient.post(`/analysis/${videoId}/chat`, { message });
  return response.data.response;
};

/**
 * Upload a video, poll for analysis completion, and return overlay video URL.
 */
export const uploadAndGetOverlay = async (
  videoUri: string,
  movementProfile: string = 'CRICKET',
  onProgress?: (percentage: number) => void,
  maxAttempts: number = 30,
  intervalMs: number = 1500,
  battingStance: 'AUTO' | 'RIGHT' | 'LEFT' = 'AUTO'
): Promise<string> => {
  // Step 1: upload video
  const uploadResult = await uploadVideoForAnalysis(videoUri, movementProfile, onProgress, battingStance);
  const videoId = uploadResult.video_id ?? uploadResult.id;
  if (!videoId) {
    throw new Error('Video ID not returned from upload');
  }
  // Step 2: poll for report until overlay is ready
  const report = await pollForAnalysisResult(videoId, maxAttempts, intervalMs);
  // Step 3: derive overlay URL
  const overlayPath = (report as any).overlay_video_url ?? (report as any).overlay_video_path;
  if (!overlayPath) {
    throw new Error('Overlay video not available in analysis report');
  }
  return overlayPath.startsWith('http') ? overlayPath : getOverlayVideoUrl(overlayPath);
};
