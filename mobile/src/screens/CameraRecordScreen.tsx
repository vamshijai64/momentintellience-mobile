import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { CameraStumpOverlay } from '../components/CameraStumpOverlay';
import { PitchCreaseOverlay } from '../components/PitchCreaseOverlay';
import { uploadVideoForAnalysis, detectBatsmanInFrame, pollForAnalysisResult, PollStatusUpdate } from '../services/api';

// expo-camera's Android session can only serve one capture mode at a time:
// takePictureAsync() reliably fails while mode="video". Detection cycles are
// spaced out to minimize how often we have to flip modes (and the resulting
// preview flicker) while still feeling "live".
const FRAME_DETECTION_INTERVAL_MS = 4000;
const CAMERA_MODE_SWITCH_TIMEOUT_MS = 700;

interface CameraRecordScreenProps {
  onVideoProcessed?: (reportId: string, videoId: string, videoUri?: string) => void;
  onViewHistory?: () => void;
  onViewProfile?: () => void;
  onSignOut?: () => void;
}

export const CameraRecordScreen: React.FC<CameraRecordScreenProps> = ({
  onVideoProcessed,
  onViewHistory,
  onViewProfile,
  onSignOut,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stageText, setStageText] = useState('Preparing upload...');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastVideoUri, setLastVideoUri] = useState<string | null>(null);
  const [tiltAngle, setTiltAngle] = useState(90.0);
  const [isBatsmanDetected, setIsBatsmanDetected] = useState(false);
  const [isStumpAligned, setIsStumpAligned] = useState(false);
  const [detectionMessage, setDetectionMessage] = useState('Detecting batsman...');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [battingStance, setBattingStance] = useState<'AUTO' | 'RIGHT' | 'LEFT'>('AUTO');
  const [cameraMode, setCameraMode] = useState<'video' | 'picture'>('video');

  const cameraRef = useRef<any>(null);
  const isDetectingFrameRef = useRef(false);
  const cameraReadyResolverRef = useRef<(() => void) | null>(null);

  // Resolves once the CameraView reports itself ready again after a `mode`
  // change (or after `timeoutMs`, whichever comes first, so a slow/missing
  // onCameraReady callback on some devices can never hang the app).
  const waitForCameraReady = (timeoutMs: number) =>
    new Promise<void>((resolve) => {
      let settled = false;
      const settle = () => {
        if (!settled) {
          settled = true;
          cameraReadyResolverRef.current = null;
          resolve();
        }
      };
      cameraReadyResolverRef.current = settle;
      setTimeout(settle, timeoutMs);
    });

  const handleCameraReady = () => {
    if (cameraReadyResolverRef.current) {
      cameraReadyResolverRef.current();
    }
  };

  // Simulated accelerometer sensor updates
  useEffect(() => {
    const interval = setInterval(() => {
      const jitter = (Math.random() - 0.5) * 1.2;
      setTiltAngle(89.5 + jitter);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Real live batsman-in-frame detection: periodically grabs a lightweight
  // camera snapshot (while idle, never during actual video recording) and
  // sends it to the backend for a fast MediaPipe pose check, driving the
  // on-screen "batsman aligned" HUD with real feedback instead of a static
  // always-green badge.
  //
  // expo-camera's Android session only supports takePictureAsync() while
  // `mode="picture"` — it fails 100% of the time while `mode="video"`. So
  // each cycle briefly flips to picture mode, snaps, then flips back to
  // video mode (required for recordAsync) before releasing the lock that
  // guards the record button (see handleToggleRecord).
  useEffect(() => {
    if (!permission?.granted || isRecording || isUploading) {
      return;
    }

    const interval = setInterval(async () => {
      if (isDetectingFrameRef.current || !cameraRef.current) {
        return;
      }
      isDetectingFrameRef.current = true;
      try {
        setCameraMode('picture');
        await waitForCameraReady(CAMERA_MODE_SWITCH_TIMEOUT_MS);

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.2,
          skipProcessing: true,
          base64: false,
        });
        if (photo?.uri) {
          const result = await detectBatsmanInFrame(photo.uri);
          setIsBatsmanDetected(result.batsman_detected);
          setIsStumpAligned(result.is_aligned);
          setDetectionMessage(
            result.batsman_detected
              ? (result.message || (result.is_aligned ? 'Batsman aligned in frame' : 'Adjust framing'))
              : 'No batsman detected in frame'
          );
        }
      } catch (err) {
        // Snapshot/detection is best-effort live feedback; never let it disrupt recording
        console.log('Live frame detection skipped', err);
      } finally {
        setCameraMode('video');
        await waitForCameraReady(CAMERA_MODE_SWITCH_TIMEOUT_MS);
        isDetectingFrameRef.current = false;
      }
    }, FRAME_DETECTION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [permission?.granted, isRecording, isUploading]);

  // Request Camera & Microphone Permissions if needed
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
    if (micPermission && !micPermission.granted && micPermission.canAskAgain) {
      requestMicPermission();
    }
  }, [permission, micPermission]);

  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      // Stop active recording
      if (cameraRef.current) {
        try {
          await cameraRef.current.stopRecording();
        } catch (err) {
          console.log('Stop recording triggered', err);
        }
      }
      setIsRecording(false);
    } else {
      // Ensure microphone permission is requested on Android before recordAsync
      if (micPermission && !micPermission.granted) {
        try {
          await requestMicPermission();
        } catch (e) {
          console.log('Mic permission request error', e);
        }
      }

      // Start real camera recording
      if (cameraRef.current) {
        try {
          // Guard against the rare race where a live-detection cycle is
          // mid-flight (camera briefly in 'picture' mode) when the user taps
          // record. Poll until it releases (snapshot + mode-switch + backend
          // call can take a couple seconds worst-case), then force 'video'
          // mode and confirm the camera is ready before calling recordAsync —
          // calling it while still in 'picture' mode is what breaks recording.
          const detectionReleaseDeadline = Date.now() + 3000;
          while (isDetectingFrameRef.current && Date.now() < detectionReleaseDeadline) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          if (cameraMode !== 'video') {
            setCameraMode('video');
            await waitForCameraReady(CAMERA_MODE_SWITCH_TIMEOUT_MS);
          }

          setIsRecording(true);
          const recordPromise = cameraRef.current.recordAsync({
            maxDuration: 15,
            mute: true,
          });

          if (recordPromise) {
            const video = await recordPromise;
            setIsRecording(false);
            if (video && video.uri) {
              await processRecordedVideo(video.uri);
            }
          }
        } catch (err) {
          console.error('Camera recording error', err);
          setIsRecording(false);
          // Fallback trigger demo process if camera recording fails on emulator
          await processRecordedVideo('recorded_shot.mp4');
        }
      } else {
        await processRecordedVideo('recorded_shot.mp4');
      }
    }
  };

  const STAGE_LABELS: Record<string, string> = {
    PENDING: 'Queued for analysis...',
    PROCESSING: 'Detecting shots & analyzing biomechanics...',
    RETRYING: 'Reconnecting to server...',
  };

  const processRecordedVideo = async (
    videoUri: string,
    stanceOverride?: 'AUTO' | 'RIGHT' | 'LEFT'
  ) => {
    const stanceToSend = stanceOverride || battingStance;
    setLastVideoUri(videoUri);
    setUploadError(null);
    try {
      setIsUploading(true);
      setUploadProgress(2);
      setStageText('Uploading video...');

      // 1. Multipart Upload (0-70% of the visible bar)
      const result = await uploadVideoForAnalysis(videoUri, 'CRICKET', (progress) => {
        setUploadProgress(Math.max(2, Math.min(70, progress * 0.7)));
      }, stanceToSend);

      const videoId = result.id || result.video_id;
      if (!videoId) {
        throw new Error('Upload succeeded but no video ID was returned by the server.');
      }

      setUploadProgress(72);
      setStageText('Queued for analysis...');

      // 2. Poll Backend until MediaPipe 3D Pose & YOLO detection completes,
      // driving real stage text + a slowly-advancing progress bar instead of
      // a static spinner for what can now be a multi-minute wait on
      // multi-shot net-session videos.
      const report = await pollForAnalysisResult(videoId, 90, 2000, (update: PollStatusUpdate) => {
        const elapsedSec = Math.round(update.elapsedMs / 1000);
        const label = STAGE_LABELS[update.status] || 'Analyzing your shot...';
        setStageText(`${label} (${elapsedSec}s)`);
        // Creep from 72% to 96% over the polling window so the bar never
        // looks stuck even during long multi-shot processing.
        setUploadProgress(Math.min(96, 72 + update.attempt * 0.5));
      });

      setUploadProgress(100);
      setStageText('Done!');
      setIsUploading(false);

      if (onVideoProcessed) {
        onVideoProcessed(report.id || videoId, videoId, videoUri);
      }
    } catch (error: any) {
      console.error('Upload/analysis error', error);
      setIsUploading(false);
      setUploadError(error?.message || 'Something went wrong while uploading or analyzing your shot.');
    }
  };

  const handleRetry = () => {
    if (lastVideoUri) {
      processRecordedVideo(lastVideoUri);
    }
  };

  const handleDismissError = () => {
    setUploadError(null);
    setLastVideoUri(null);
  };

  const handlePickGalleryVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo/video gallery permissions in your device settings to upload videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedVideoUri = result.assets[0].uri;
        // Gallery clips (other apps / WhatsApp) need batting hand — AUTO
        // often flips long off to third man. Ask before analyzing.
        Alert.alert(
          'Who is batting?',
          'Uploaded videos need the batting hand so shot direction (long off vs third man) is correct.',
          [
            {
              text: 'Right-hand',
              onPress: () => {
                setBattingStance('RIGHT');
                processRecordedVideo(selectedVideoUri, 'RIGHT');
              },
            },
            {
              text: 'Left-hand',
              onPress: () => {
                setBattingStance('LEFT');
                processRecordedVideo(selectedVideoUri, 'LEFT');
              },
            },
            {
              text: 'Auto detect',
              style: 'cancel',
              onPress: () => processRecordedVideo(selectedVideoUri, battingStance),
            },
          ]
        );
      }
    } catch (err: any) {
      console.error('Failed to pick gallery video', err);
      Alert.alert('Gallery Error', err?.message || 'Could not open video gallery.');
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Initializing Camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionTitle}>CAMERA PERMISSION REQUIRED</Text>
        <Text style={styles.permissionSub}>
          AI Cricket Coach requires camera access to capture your cricket technique and posture.
        </Text>
        <TouchableOpacity
          style={styles.grantButton}
          onPress={async () => {
            await requestPermission();
            await requestMicPermission();
          }}
        >
          <Text style={styles.grantButtonText}>GRANT CAMERA & MIC PERMISSIONS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Live Native Camera Feed with Real MP4 Video Capture */}
      <CameraView
        ref={cameraRef}
        mode={cameraMode}
        onCameraReady={handleCameraReady}
        style={styles.cameraViewport}
        facing={facing}
        zoom={Math.min(1.0, (zoomLevel - 1.0) / 3.4)}
        videoQuality="720p"
        videoBitrate={4_000_000}
      >
        {/* CricVision Perspective Pitch Crease & Zoom Overlay — reflects real live batsman detection */}
        <PitchCreaseOverlay
          zoomLevel={zoomLevel}
          onZoomChange={handleZoomChange}
          isCalibrated={isStumpAligned}
          statusText={detectionMessage.toUpperCase()}
        />
      </CameraView>

      {/* Bottom quick actions: history, profile, sign out */}
      {!isUploading && (
        <View style={styles.bottomNavBar}>
          {onViewHistory && (
            <TouchableOpacity style={styles.bottomNavItem} onPress={onViewHistory} activeOpacity={0.85}>
              <Text style={styles.bottomNavIcon}>📊</Text>
              <Text style={styles.bottomNavLabel}>History</Text>
            </TouchableOpacity>
          )}
          {onViewProfile && (
            <TouchableOpacity style={styles.bottomNavItem} onPress={onViewProfile} activeOpacity={0.85}>
              <Text style={styles.bottomNavIcon}>👤</Text>
              <Text style={styles.bottomNavLabel}>Profile</Text>
            </TouchableOpacity>
          )}
          {onSignOut && (
            <TouchableOpacity style={styles.bottomNavItem} onPress={onSignOut} activeOpacity={0.85}>
              <Text style={styles.bottomNavIcon}>🚪</Text>
              <Text style={[styles.bottomNavLabel, styles.bottomNavLabelSignOut]}>Sign out</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Primary Recording Safeguard */}
      {!isRecording && !isUploading && (
        <View style={styles.recordingInstructionBanner} pointerEvents="none">
          <Text style={styles.recordingInstructionText}>
            🎯 Point camera at the BATSMAN standing in the crease
          </Text>
          <Text style={styles.recordingInstructionSubtext}>
            Not the bowler — film from behind/side of the striker's stumps
          </Text>
        </View>
      )}

      {/* Batting Stance Selector — helps the AI Coach orient shot direction correctly */}
      <View style={styles.stanceBar}>
        <Text style={styles.stanceLabel}>STANCE</Text>
        {(['AUTO', 'RIGHT', 'LEFT'] as const).map((stance) => (
          <TouchableOpacity
            key={stance}
            style={[styles.stancePill, battingStance === stance && styles.stancePillActive]}
            onPress={() => setBattingStance(stance)}
          >
            <Text style={[styles.stancePillText, battingStance === stance && styles.stancePillTextActive]}>
              {stance === 'AUTO' ? 'AUTO' : stance === 'RIGHT' ? 'RIGHT-HAND' : 'LEFT-HAND'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Floating Shutter / Controls Bar */}
      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
          <Text style={styles.flipButtonText}>🔄 FLIP</Text>
        </TouchableOpacity>

        {isUploading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>{stageText}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(uploadProgress)}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(uploadProgress)}%</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={handleToggleRecord}
          >
            <View style={[styles.innerRecordDot, isRecording && styles.innerRecordDotActive]} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.galleryButton} onPress={handlePickGalleryVideo}>
          <Text style={styles.galleryButtonText}>📁 UPLOAD</Text>
        </TouchableOpacity>
      </View>

      {/* Upload/Analysis Failure — real error + retry instead of a broken screen */}
      {uploadError && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>⚠️ ANALYSIS FAILED</Text>
            <Text style={styles.errorMessage}>{uploadError}</Text>
            <View style={styles.errorButtonRow}>
              <TouchableOpacity style={styles.errorRetryButton} onPress={handleRetry}>
                <Text style={styles.errorRetryButtonText}>RETRY</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.errorDismissButton} onPress={handleDismissError}>
                <Text style={styles.errorDismissButtonText}>DISMISS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  permissionSub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  grantButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  grantButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cameraViewport: {
    flex: 1,
  },
  historyButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyButtonText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  topRightActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 21,
    gap: 8,
    alignItems: 'flex-end',
  },
  profileButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  profileButtonText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recordingInstructionBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    zIndex: 22,
  },
  recordingInstructionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recordingInstructionSubtext: {
    color: '#94a3b8',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 3,
  },
  stanceBar: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 20,
  },
  stanceLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginRight: 4,
  },
  stancePill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stancePillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  stancePillText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  stancePillTextActive: {
    color: '#10b981',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 98,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 12,
    zIndex: 25,
  },
  bottomNavItem: {
    alignItems: 'center',
    minWidth: 72,
    gap: 4,
  },
  bottomNavIcon: {
    fontSize: 22,
  },
  bottomNavLabel: {
    color: '#e2e8f0',
    fontSize: 10,
    fontWeight: '700',
  },
  bottomNavLabelSignOut: {
    color: '#fca5a5',
  },
  flipButton: {
    position: 'absolute',
    left: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  flipButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  galleryButton: {
    position: 'absolute',
    right: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  galleryButtonText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  recordButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  recordButtonActive: {
    borderColor: '#ef4444',
  },
  innerRecordDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ef4444',
  },
  innerRecordDotActive: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  loadingBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 240,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  progressPercent: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 1,
  },
  errorMessage: {
    color: '#e2e8f0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  errorButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  errorRetryButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorRetryButtonText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 13,
  },
  errorDismissButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#64748b',
  },
  errorDismissButtonText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
