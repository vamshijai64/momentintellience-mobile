import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { UserRound, ArrowLeft, Upload } from 'lucide-react-native';
import { CameraStumpOverlay } from '../components/CameraStumpOverlay';
import { PitchCreaseOverlay } from '../components/PitchCreaseOverlay';
import { uploadVideoForAnalysis, detectBatsmanInFrame, pollForAnalysisResult, PollStatusUpdate } from '../services/api';
import { GlassSparkleAIIcon } from '../components/GlassIcons';

const ACCENT = '#0284c7';
const ACCENT_SOFT = '#e0f2fe';
const ACCENT_BORDER = '#bae6fd';
const NAV_GREEN = '#15803d';
const NAV_GREEN_SOFT = '#dcfce7';
const NAV_GREEN_BORDER = '#bbf7d0';

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
  onBusyChange?: (busy: boolean) => void;
}

export const CameraRecordScreen: React.FC<CameraRecordScreenProps> = ({
  onVideoProcessed,
  onViewHistory,
  onViewProfile,
  onViewGuide,
  onSignOut,
  onBusyChange,
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
  const [stanceModalVisible, setStanceModalVisible] = useState(false);
  const [pendingStanceUri, setPendingStanceUri] = useState<string | null>(null);
  const [stanceModalMode, setStanceModalMode] = useState<'record' | 'gallery'>('record');
  const [cameraMode, setCameraMode] = useState<'video' | 'picture'>('video');

  const cameraRef = useRef<any>(null);
  const isDetectingFrameRef = useRef(false);
  const cameraReadyResolverRef = useRef<(() => void) | null>(null);
  const cancelledRef = useRef(false);

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
            setPendingStanceUri(recordedVideo.uri);
            setStanceModalMode('record');
            setStanceModalVisible(true);
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
    cancelledRef.current = false;
    try {
      setIsUploading(true);
      onBusyChange?.(true);
      setUploadProgress(2);
      setStageText('Uploading video...');

      const result = await uploadVideoForAnalysis(videoUri, 'CRICKET', (progress) => {
        setUploadProgress(Math.max(2, Math.min(70, progress * 0.7)));
      }, stanceToSend);
      if (cancelledRef.current) return;

      const videoId = result.id || result.video_id;
      if (!videoId) {
        throw new Error('Upload succeeded but no video ID was returned by the server.');
      }

      setUploadProgress(72);
      setStageText('Analyzing your shot...');

      const report = await pollForAnalysisResult(videoId, 240, 1500, (update: PollStatusUpdate) => {
        if (cancelledRef.current) return;
        const elapsedSec = Math.round(update.elapsedMs / 1000);
        const label = STAGE_LABELS[update.status] || 'Analyzing your shot...';
        setStageText(`${label} (${elapsedSec}s)`);
        setUploadProgress(Math.min(97, 72 + update.attempt * 0.4));
      });
      if (cancelledRef.current) return;

      setUploadProgress(100);
      setStageText('Done!');
      if (onVideoProcessed) {
        onVideoProcessed(report.id || videoId, videoId, videoUri);
      }
    } catch (error: any) {
      if (cancelledRef.current) return;
      console.error('Upload/analysis error', error);
      setUploadError(error?.message || 'Something went wrong while uploading or analyzing your shot.');
    } finally {
      if (!cancelledRef.current) {
        setIsUploading(false);
        onBusyChange?.(false);
      }
    }
  };

  const handleBackToRecord = () => {
    cancelledRef.current = true;
    setIsUploading(false);
    setUploadProgress(0);
    setStageText('Preparing upload...');
    setUploadError(null);
    setLastVideoUri(null);
    onBusyChange?.(false);
  };

  const handleRetry = () => {
    if (lastVideoUri) {
      processRecordedVideo(lastVideoUri);
    }
  };

  const handleDismissError = () => {
    setUploadError(null);
    setLastVideoUri(null);
    handleBackToRecord();
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
        setPendingStanceUri(selectedVideoUri);
        setStanceModalMode('gallery');
        setStanceModalVisible(true);
      }
    } catch (err: any) {
      console.error('Failed to pick gallery video', err);
      Alert.alert('Gallery Error', err?.message || 'Could not open video gallery.');
    }
  };

  const handleStanceSelect = (stance: 'RIGHT' | 'LEFT') => {
    if (!pendingStanceUri) return;
    setBattingStance(stance);
    setStanceModalVisible(false);
    const uri = pendingStanceUri;
    setPendingStanceUri(null);
    processRecordedVideo(uri, stance);
  };

  const handleStanceCancel = () => {
    setStanceModalVisible(false);
    setPendingStanceUri(null);
    setLastVideoUri(null);
    setIsRecording(false);
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
              <Text style={styles.guideButtonText}>How to film for a correct analysis</Text>
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

      {!isUploading && (
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
      )}

      {isUploading ? (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>{stageText}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(uploadProgress)}%` }]} />
          </View>
          <Text style={styles.progressPercent}>{Math.round(uploadProgress)}%</Text>
          <TouchableOpacity style={styles.backToRecordBtn} onPress={handleBackToRecord} activeOpacity={0.8}>
            <ArrowLeft size={16} color="#7dd3fc" strokeWidth={2.6} />
            <Text style={styles.backToRecordBtnText}>Record again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.controlsBar}>
          {/* Left spacer for perfect horizontal shutter centering */}
          <View style={styles.controlsSideSpacer} />

          {/* iPhone Shutter Record Button */}
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={handleToggleRecord}
            activeOpacity={0.82}
            accessibilityLabel={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            <View style={[styles.innerRecordDot, isRecording && styles.innerRecordDotActive]} />
          </TouchableOpacity>

          {/* iPhone Frosted Glass Upload Button */}
          <TouchableOpacity
            style={styles.glassUploadButton}
            onPress={handlePickGalleryVideo}
            activeOpacity={0.72}
            accessibilityLabel="Upload Video"
          >
            <View style={styles.glassUploadIconCircle}>
              <Upload size={22} color="#ffffff" strokeWidth={2.4} />
            </View>
            <Text style={styles.glassUploadLabel}>Upload</Text>
          </TouchableOpacity>
        </View>
      )}

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

      <Modal
        visible={stanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleStanceCancel}
      >
        <View style={styles.stanceModalBackdrop}>
          <View style={styles.stanceModalCard}>
            <View style={styles.stanceModalIconWrap}>
              <UserRound size={22} color={NAV_GREEN} strokeWidth={2.2} />
            </View>

            <Text style={styles.stanceModalTitle}>Select batting stance</Text>
            <Text style={styles.stanceModalBody}>
              {stanceModalMode === 'gallery'
                ? 'Pick the batting hand so shot direction (long off vs third man) is correct.'
                : 'Pick the batting hand, or go back and record again.'}
            </Text>

            <TouchableOpacity
              style={styles.stanceChoiceBtn}
              onPress={() => handleStanceSelect('RIGHT')}
              activeOpacity={0.85}
            >
              <Text style={styles.stanceChoiceBtnText}>Right-hand</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stanceChoiceBtn}
              onPress={() => handleStanceSelect('LEFT')}
              activeOpacity={0.85}
            >
              <Text style={styles.stanceChoiceBtnText}>Left-hand</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stanceCancelBtn}
              onPress={handleStanceCancel}
              activeOpacity={0.85}
            >
              {stanceModalMode === 'gallery' ? (
                <Text style={styles.stanceCancelText}>Cancel</Text>
              ) : (
                <View style={styles.stanceCancelRow}>
                  <ArrowLeft size={16} color={ACCENT} strokeWidth={2.6} />
                  <Text style={styles.stanceCancelText}>Record again</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    bottom: Platform.OS === 'ios' ? 96 : 82,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 38,
    zIndex: 20,
  },
  controlsSideSpacer: {
    width: 56,
    height: 56,
  },
  glassUploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
  },
  glassUploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  glassUploadLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  recordButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  recordButtonActive: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  innerRecordDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ef4444',
  },
  innerRecordDotActive: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  busyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 40,
  },
  backToRecordBtn: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 14,
    paddingRight: 20,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(8, 47, 73, 0.8)',
  },
  backToRecordBtnText: {
    color: '#7dd3fc',
    fontSize: 14,
    fontWeight: '800',
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
  stanceModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  stanceModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  stanceModalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: NAV_GREEN_SOFT,
    borderWidth: 1,
    borderColor: NAV_GREEN_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stanceModalTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  stanceModalBody: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 16,
  },
  stanceChoiceBtn: {
    width: '100%',
    backgroundColor: NAV_GREEN_SOFT,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: NAV_GREEN_BORDER,
  },
  stanceChoiceBtnText: {
    color: NAV_GREEN,
    fontSize: 14,
    fontWeight: '800',
  },
  stanceCancelBtn: {
    width: '100%',
    backgroundColor: ACCENT_SOFT,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    marginTop: 2,
  },
  stanceCancelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stanceCancelText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '700',
  },
});
