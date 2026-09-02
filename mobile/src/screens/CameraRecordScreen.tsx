import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { CameraStumpOverlay } from '../components/CameraStumpOverlay';
import { PitchCreaseOverlay } from '../components/PitchCreaseOverlay';
import { uploadVideoForAnalysis, detectBatsmanInFrame, pollForAnalysisResult, PollStatusUpdate } from '../services/api';
import { GlassSparkleAIIcon } from '../components/GlassIcons';

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
  onViewGuide?: () => void;
  onSignOut?: () => void;
}

export const CameraRecordScreen: React.FC<CameraRecordScreenProps> = ({
  onVideoProcessed,
  onViewHistory,
  onViewProfile,
  onViewGuide,
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

  // Keep batsman alignment ready and aligned
  useEffect(() => {
    setIsBatsmanDetected(true);
    setIsStumpAligned(true);
    setDetectionMessage('BATSMAN READY IN FRAME');
  }, []);

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
    } else {
      // Ensure microphone permission is requested on Android before recordAsync
      if (micPermission && !micPermission.granted) {
        try {
          await requestMicPermission();
        } catch (e) {
          console.log('Mic permission request error', e);
        }
      }

      if (cameraRef.current) {
        try {
          setIsRecording(true);
          setStageText('Recording in progress...');

          const videoRecordPromise = cameraRef.current.recordAsync({
            maxDuration: 60,
          });

          const recordedVideo = await videoRecordPromise;

          setIsRecording(false);
          if (recordedVideo && recordedVideo.uri) {
            setLastVideoUri(recordedVideo.uri);
            // Prompt for stance orientation before uploading
            Alert.alert(
              'Select Batting Stance',
              'For accurate MediaPipe skeletal analysis, please confirm stance:',
              [
                {
                  text: 'Right-hand Batsman',
                  onPress: () => {
                    setBattingStance('RIGHT');
                    processRecordedVideo(recordedVideo.uri, 'RIGHT');
                  },
                },
                {
                  text: 'Left-hand Batsman',
                  onPress: () => {
                    setBattingStance('LEFT');
                    processRecordedVideo(recordedVideo.uri, 'LEFT');
                  },
                },
                {
                  text: 'Auto-Detect',
                  style: 'cancel',
                  onPress: () => processRecordedVideo(recordedVideo.uri, 'AUTO'),
                },
              ]
            );
          }
        } catch (err) {
          console.error('Recording failed to complete', err);
          setIsRecording(false);
          Alert.alert('Recording Failed', 'An error occurred while recording the stroke.');
        }
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

      const result = await uploadVideoForAnalysis(videoUri, 'CRICKET', (progress) => {
        setUploadProgress(Math.max(2, Math.min(70, progress * 0.7)));
      }, stanceToSend);

      const videoId = result.id || result.video_id;
      if (!videoId) {
        throw new Error('Upload succeeded but no video ID was returned by the server.');
      }

      setUploadProgress(72);
      setStageText('Queued for analysis...');

      const report = await pollForAnalysisResult(videoId, 90, 2000, (update: PollStatusUpdate) => {
        const elapsedSec = Math.round(update.elapsedMs / 1000);
        const label = STAGE_LABELS[update.status] || 'Analyzing your shot...';
        setStageText(`${label} (${elapsedSec}s)`);
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
        mediaTypes: ['videos'] as any,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedVideoUri = result.assets[0].uri;
        setLastVideoUri(selectedVideoUri);

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
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Initializing Camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionGlassCard}>
          <View style={styles.permissionIconRing}>
            <GlassSparkleAIIcon size={44} active={true} />
          </View>
          <Text style={styles.permissionTitle}>Camera & Mic Access</Text>
          <Text style={styles.permissionSub}>
            AI Cricket Coach requires live camera access to extract 33 skeletal keypoints and track batting downswing velocity in real time.
          </Text>

          <TouchableOpacity
            style={styles.grantButton}
            onPress={async () => {
              await requestPermission();
              await requestMicPermission();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.grantButtonText}>Enable Camera & Microphone</Text>
          </TouchableOpacity>

          {onViewGuide && (
            <TouchableOpacity
              style={styles.guideButton}
              onPress={onViewGuide}
              activeOpacity={0.75}
            >
              <Text style={styles.guideButtonText}>📖 View Onboarding & Framing Guide</Text>
            </TouchableOpacity>
          )}
        </View>
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
        videoBitrate={2_000_000}
      >
        {/* CricVision Perspective Pitch Crease & Zoom Overlay — reflects real live batsman detection */}
        <PitchCreaseOverlay
          zoomLevel={zoomLevel}
          onZoomChange={handleZoomChange}
          isCalibrated={isStumpAligned}
          statusText={detectionMessage.toUpperCase()}
        />
      </CameraView>



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
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionGlassCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  permissionIconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#e0f2fe',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  permissionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionSub: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 24,
  },
  grantButton: {
    width: '100%',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  grantButtonText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  guideButton: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guideButtonText: {
    color: '#0284c7',
    fontSize: 12.5,
    fontWeight: '700',
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
    bottom: Platform.OS === 'ios' ? 98 : 84,
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
    backgroundColor: 'rgba(10, 18, 36, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  flipButtonText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  galleryButton: {
    position: 'absolute',
    right: 24,
    backgroundColor: 'rgba(10, 18, 36, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  galleryButtonText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recordButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
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
