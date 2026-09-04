import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { ProGhostVideoOverlay } from './ProGhostVideoOverlay';

export type StrokePhase = 'STANCE' | 'BACKLIFT' | 'IMPACT' | 'FINISH';

export interface BroadcastInVideoPlayerProps {
  videoUri?: string;
  isLoading?: boolean;
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
  spineAngle?: number;
  rearKneeAngle?: number;
  exitVelocityKmh?: number;
  sweetSpotRatio?: number;
  headOffsetRatio?: number;
  shotType?: string;
  impactFrameRatio?: number;
  timeSeriesAngles?: any[];
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const BroadcastInVideoPlayer: React.FC<BroadcastInVideoPlayerProps> = ({
  videoUri,
  isLoading = false,
  leadElbowAngle = 142,
  kneeFlexionAngle = 136,
  spineAngle = 128,
  rearKneeAngle = 104,
  exitVelocityKmh = 118,
  sweetSpotRatio = 0.94,
  headOffsetRatio = 0.08,
  shotType = 'COVER DRIVE',
  impactFrameRatio = 0.62,
  timeSeriesAngles = [],
  onToggleFullscreen,
  isFullscreen = false,
}) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.5);
  const [positionMillis, setPositionMillis] = useState<number>(0);
  const [durationMillis, setDurationMillis] = useState<number>(1);
  const [showHudOverlays, setShowHudOverlays] = useState<boolean>(false);
  const [showAngleTags, setShowAngleTags] = useState<boolean>(false);
  const [showGhostOverlay, setShowGhostOverlay] = useState<boolean>(false);
  const [ghostOpacity, setGhostOpacity] = useState<number>(0.65);
  const [showTelemetryCard, setShowTelemetryCard] = useState<boolean>(false);
  const [activePhase, setActivePhase] = useState<StrokePhase>('IMPACT');

  // Pulse animation for live badge
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  // Impact moment flash animation
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Determine active phase based on current playback progress ratio
  const progressRatio = durationMillis > 0 ? positionMillis / durationMillis : 0;

  useEffect(() => {
    if (progressRatio < 0.25) {
      setActivePhase('STANCE');
    } else if (progressRatio < 0.58) {
      setActivePhase('BACKLIFT');
    } else if (progressRatio < 0.78) {
      setActivePhase('IMPACT');
    } else {
      setActivePhase('FINISH');
    }

    // Trigger subtle impact flash when entering impact zone
    if (Math.abs(progressRatio - impactFrameRatio) < 0.04) {
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 0.45, duration: 100, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [progressRatio, impactFrameRatio, flashAnim]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPositionMillis(status.positionMillis || 0);
      setDurationMillis(status.durationMillis || 1);
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const handleSpeedChange = async (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      await videoRef.current.setRateAsync(speed, true);
    }
  };

  const stepFrame = async (deltaMs: number) => {
    if (!videoRef.current) return;
    const newPos = Math.max(0, Math.min(durationMillis, positionMillis + deltaMs));
    await videoRef.current.setStatusAsync({
      positionMillis: newPos,
      shouldPlay: false,
    });
  };

  const jumpToPhase = async (phase: StrokePhase) => {
    if (!videoRef.current || durationMillis <= 0) return;
    let targetRatio = 0.1;
    if (phase === 'STANCE') targetRatio = 0.1;
    if (phase === 'BACKLIFT') targetRatio = 0.42;
    if (phase === 'IMPACT') targetRatio = impactFrameRatio;
    if (phase === 'FINISH') targetRatio = 0.88;

    const targetMillis = Math.floor(durationMillis * targetRatio);
    await videoRef.current.setStatusAsync({
      positionMillis: targetMillis,
      shouldPlay: false,
    });
    setActivePhase(phase);
  };

  const handleProgressBarPress = async (evt: any) => {
    if (!videoRef.current || durationMillis <= 0) return;
    const { locationX } = evt.nativeEvent;
    const barWidth = isFullscreen ? SCREEN_WIDTH - 48 : SCREEN_WIDTH - 64;
    const ratio = Math.max(0, Math.min(1, locationX / barWidth));
    const targetMillis = Math.floor(durationMillis * ratio);
    await videoRef.current.setStatusAsync({
      positionMillis: targetMillis,
    });
  };

  const formatTime = (millis: number) => {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 100);
    return `${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}s`;
  };

  const getStatusColor = (angle: number, min: number, max: number) => {
    if (angle >= min && angle <= max) return '#10b981';
    if (angle >= min - 8 && angle <= max + 8) return '#f59e0b';
    return '#ef4444';
  };

  // Dynamically calculate live real-time joint angles corresponding to video playback timestamp
  let liveLeadElbow = leadElbowAngle;
  let liveFrontKnee = kneeFlexionAngle;
  let liveRearKnee = rearKneeAngle;
  let liveSpine = spineAngle;

  if (timeSeriesAngles && timeSeriesAngles.length > 0) {
    const totalFrames = timeSeriesAngles.length;
    const targetFrameIdx = Math.min(
      totalFrames - 1,
      Math.max(0, Math.floor(progressRatio * totalFrames))
    );
    const frameData = timeSeriesAngles[targetFrameIdx];
    if (frameData) {
      if (typeof frameData.left_elbow === 'number') liveLeadElbow = Math.round(frameData.left_elbow);
      if (typeof frameData.left_knee === 'number') liveFrontKnee = Math.round(frameData.left_knee);
      if (typeof frameData.right_knee === 'number') liveRearKnee = Math.round(frameData.right_knee);
      if (typeof frameData.spine_inclination === 'number' || typeof frameData.spine_angle === 'number') {
        liveSpine = Math.round(frameData.spine_inclination ?? frameData.spine_angle);
      }
    }
  }

  const leadElbowColor = getStatusColor(liveLeadElbow, 110, 155);
  const kneeColor = getStatusColor(liveFrontKnee, 125, 165);
  const rearKneeColor = getStatusColor(liveRearKnee, 125, 165);

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      {/* 📹 Main Video Viewport */}
      <View style={[styles.videoViewport, isFullscreen && styles.fullscreenViewport]}>
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#38bdf8" />
            <Text style={styles.loadingTitle}>Processing Skeletal Telemetry...</Text>
            <Text style={styles.loadingSub}>Synthesizing 33 3D joints & downswing trajectory</Text>
          </View>
        ) : videoUri ? (
          <>
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={StyleSheet.absoluteFillObject}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay={isPlaying}
              rate={playbackSpeed}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />

            {/* Impact Flash Effect Layer */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.impactFlashLayer,
                {
                  opacity: flashAnim,
                },
              ]}
            />
          </>
        ) : (
          <View style={styles.noVideoBox}>
            <Text style={styles.noVideoText}>NO VIDEO STREAM AVAILABLE</Text>
          </View>
        )}

        {/* 🌟 OVERLAY LAYER 1: Top HUD Broadcast Header & Tool Bar */}
        {!isLoading && (
          <View style={[styles.topOverlayBar, isFullscreen && styles.topOverlayBarFullscreen]}>
            {/* Live Telemetry Status Pill */}
            <View style={styles.liveTelemetryBadge}>
              <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
              <Text style={styles.liveBadgeText}>
                LIVE • {playbackSpeed}X
              </Text>
            </View>

            {/* Top Quick Actions (HUD toggle, Angles toggle, Fullscreen) */}
            <View style={styles.topRightActions}>
              <TouchableOpacity
                style={[styles.hudToggleBtn, showHudOverlays && styles.hudToggleBtnActive]}
                onPress={() => setShowHudOverlays(!showHudOverlays)}
                activeOpacity={0.7}
              >
                <Text style={styles.hudToggleText}>
                  {showHudOverlays ? '👁️ HUD' : '👁️‍🗨️ CLEAN'}
                </Text>
              </TouchableOpacity>

              {showHudOverlays && (
                <TouchableOpacity
                  style={[styles.hudToggleBtn, showAngleTags && styles.hudToggleBtnActive]}
                  onPress={() => setShowAngleTags(!showAngleTags)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.hudToggleText}>📐 {showAngleTags ? 'ANGLES' : 'OFF'}</Text>
                </TouchableOpacity>
              )}

              {onToggleFullscreen && (
                <TouchableOpacity
                  style={styles.fullscreenBtn}
                  onPress={onToggleFullscreen}
                  activeOpacity={0.7}
                >
                  <Text style={styles.fullscreenBtnText}>
                    {isFullscreen ? '✕ EXIT' : '⛶ EXPAND'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* 🌟 OVERLAY LAYER 2: Floating Biomechanical Joint Angle Tags */}
        {!isLoading && showHudOverlays && showAngleTags && (
          <View style={styles.anglesOverlayLayer} pointerEvents="none">
            {/* 1. Lead Elbow Angle Tag (Top-Left) */}
            <View style={[styles.angleTag, { borderColor: leadElbowColor, top: 48, left: 10 }]}>
              <View style={[styles.angleTagDot, { backgroundColor: leadElbowColor }]} />
              <View>
                <Text style={styles.angleTagLabel}>LEAD ELBOW</Text>
                <Text style={[styles.angleTagValue, { color: leadElbowColor }]}>
                  {liveLeadElbow}° {liveLeadElbow >= 110 && liveLeadElbow <= 155 ? '✓ OPTIMAL' : '⚠ FIX'}
                </Text>
              </View>
            </View>

            {/* 2. Front Knee Flexion Tag (Center-Left) */}
            <View style={[styles.angleTag, { borderColor: kneeColor, top: 110, left: 10 }]}>
              <View style={[styles.angleTagDot, { backgroundColor: kneeColor }]} />
              <View>
                <Text style={styles.angleTagLabel}>FRONT KNEE</Text>
                <Text style={[styles.angleTagValue, { color: kneeColor }]}>
                  {liveFrontKnee}° {liveFrontKnee >= 125 && liveFrontKnee <= 155 ? '✓ STABLE' : liveFrontKnee > 155 ? '⚠ LOCKED' : '⚠ BEND'}
                </Text>
              </View>
            </View>

            {/* 3. Spine Posture Tag (Top-Right) */}
            <View style={[styles.angleTag, { borderColor: '#38bdf8', top: 48, right: 10 }]}>
              <View style={[styles.angleTagDot, { backgroundColor: '#38bdf8' }]} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.angleTagLabel}>SPINE TILT</Text>
                <Text style={[styles.angleTagValue, { color: '#38bdf8' }]}>
                  {liveSpine}° STACKED
                </Text>
              </View>
            </View>

            {/* 4. Rear Knee Collapse Tag (Bottom-Left) */}
            <View style={[styles.angleTag, { borderColor: rearKneeColor, bottom: 14, left: 10 }]}>
              <View style={[styles.angleTagDot, { backgroundColor: rearKneeColor }]} />
              <View>
                <Text style={styles.angleTagLabel}>REAR LEG</Text>
                <Text style={[styles.angleTagValue, { color: rearKneeColor }]}>
                  {liveRearKnee}° {liveRearKnee >= 125 && liveRearKnee <= 165 ? '✓ BRACED' : liveRearKnee < 125 ? '⚠ COLLAPSE' : '⚠ STIFF'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 🌟 OVERLAY LAYER 3: Broadcast Telemetry Corner Box */}
        {!isLoading && showHudOverlays && showTelemetryCard && (
          <View style={styles.telemetryCornerBox} pointerEvents="none">
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>⚡ EXIT SPEED</Text>
              <Text style={styles.telemetryVal}>{exitVelocityKmh} km/h</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>🎯 SWEET SPOT</Text>
              <Text style={styles.telemetryVal}>{Math.round(sweetSpotRatio * 100)}%</Text>
            </View>
            <View style={styles.telemetryDivider} />
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryLabel}>📐 HEAD STACK</Text>
              <Text style={[styles.telemetryVal, { color: '#10b981' }]}>
                +{headOffsetRatio}m STABLE
              </Text>
            </View>
          </View>
        )}

        {/* Center Play/Pause Tap Button (Fade In/Out indicator) */}
        <TouchableOpacity
          style={styles.centerTapArea}
          onPress={togglePlayPause}
          activeOpacity={0.9}
        >
          {!isPlaying && (
            <View style={styles.pausedIndicator}>
              <Text style={styles.pausedIcon}>▶</Text>
              <Text style={styles.pausedText}>PAUSED</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 🌟 SECTION 2: Interactive 4-Phase Stroke Scrubber Bar */}
      <View style={styles.phaseScrubberContainer}>
        {/* Stroke Phase Quick Jump Tabs */}
        <View style={styles.phaseTabsRow}>
          {(
            [
              { id: 'STANCE', label: '1. STANCE', color: '#10b981' },
              { id: 'BACKLIFT', label: '2. BACKLIFT', color: '#f59e0b' },
              { id: 'IMPACT', label: '3. IMPACT ⚡', color: '#ef4444' },
              { id: 'FINISH', label: '4. FINISH', color: '#a855f7' },
            ] as const
          ).map((phase) => {
            const isActive = activePhase === phase.id;
            return (
              <TouchableOpacity
                key={phase.id}
                style={[
                  styles.phasePill,
                  isActive && { backgroundColor: `${phase.color}22`, borderColor: phase.color },
                ]}
                onPress={() => jumpToPhase(phase.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.phasePillDot,
                    { backgroundColor: isActive ? phase.color : '#64748b' },
                  ]}
                />
                <Text
                  style={[
                    styles.phasePillText,
                    isActive && { color: phase.color, fontWeight: '800' },
                  ]}
                >
                  {phase.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Interactive Progress Timeline Scrubber Track */}
        <TouchableOpacity
          style={styles.timelineTouchArea}
          onPress={handleProgressBarPress}
          activeOpacity={0.9}
        >
          <View style={styles.timelineTrack}>
            {/* Filled Progress */}
            <View
              style={[
                styles.timelineFill,
                { width: `${Math.min(100, Math.max(0, progressRatio * 100))}%` },
              ]}
            />

            {/* Key Milestone Ticks on Timeline */}
            <View style={[styles.timelineTick, { left: '25%' }]} />
            <View style={[styles.timelineTick, { left: '58%' }]} />
            {/* Impact Point Glow Marker */}
            <View
              style={[
                styles.timelineTickImpact,
                { left: `${Math.round(impactFrameRatio * 100)}%` },
              ]}
            >
              <View style={styles.impactMarkerDot} />
            </View>
            <View style={[styles.timelineTick, { left: '78%' }]} />
          </View>
        </TouchableOpacity>

        {/* Time Stamp Row */}
        <View style={styles.timeRow}>
          <Text style={styles.timeCurrent}>{formatTime(positionMillis)}</Text>
          <Text style={styles.timePhaseBadge}>CURRENT PHASE: {activePhase}</Text>
          <Text style={styles.timeTotal}>{formatTime(durationMillis)}</Text>
        </View>
      </View>

      {/* 🌟 SECTION 3: Precision Transport & Frame Stepper Bar */}
      <View style={styles.transportControlsRow}>
        {/* Frame Step Backward (-50ms) */}
        <TouchableOpacity
          style={styles.transportBtn}
          onPress={() => stepFrame(-50)}
          activeOpacity={0.7}
        >
          <Text style={styles.transportBtnIcon}>⏪</Text>
          <Text style={styles.transportBtnSub}>-1 FRAME</Text>
        </TouchableOpacity>

        {/* Jump -0.5s */}
        <TouchableOpacity
          style={styles.transportBtnMini}
          onPress={() => stepFrame(-500)}
          activeOpacity={0.7}
        >
          <Text style={styles.transportMiniText}>-0.5s</Text>
        </TouchableOpacity>

        {/* Main Play / Pause Button */}
        <TouchableOpacity
          style={[styles.playPauseBtn, isPlaying && styles.playPauseBtnActive]}
          onPress={togglePlayPause}
          activeOpacity={0.8}
        >
          <Text style={styles.playPauseIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        {/* Jump +0.5s */}
        <TouchableOpacity
          style={styles.transportBtnMini}
          onPress={() => stepFrame(500)}
          activeOpacity={0.7}
        >
          <Text style={styles.transportMiniText}>+0.5s</Text>
        </TouchableOpacity>

        {/* Frame Step Forward (+50ms) */}
        <TouchableOpacity
          style={styles.transportBtn}
          onPress={() => stepFrame(50)}
          activeOpacity={0.7}
        >
          <Text style={styles.transportBtnIcon}>⏩</Text>
          <Text style={styles.transportBtnSub}>+1 FRAME</Text>
        </TouchableOpacity>

        {/* Direct Jump to Impact Moment */}
        <TouchableOpacity
          style={styles.impactJumpBtn}
          onPress={() => jumpToPhase('IMPACT')}
          activeOpacity={0.7}
        >
          <Text style={styles.impactJumpIcon}>⚡</Text>
          <Text style={styles.impactJumpText}>IMPACT</Text>
        </TouchableOpacity>
      </View>

      {/* 🌟 SECTION 4: Slow-Motion Speed Selector Bar */}
      <View style={styles.speedSelectorBar}>
        <Text style={styles.speedBarLabel}>BROADCAST SPEED:</Text>
        <View style={styles.speedPillsGroup}>
          {[
            { label: '0.25x Ultra-Slow', speed: 0.25 },
            { label: '0.50x Slow-Mo', speed: 0.5 },
            { label: '1.0x Realtime', speed: 1.0 },
          ].map((item) => {
            const isSelected = playbackSpeed === item.speed;
            return (
              <TouchableOpacity
                key={item.speed}
                style={[styles.speedPill, isSelected && styles.speedPillActive]}
                onPress={() => handleSpeedChange(item.speed)}
                activeOpacity={0.7}
              >
                <Text style={[styles.speedPillText, isSelected && styles.speedPillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#334155',
    overflow: 'hidden',
    marginBottom: 16,
    ...cardShadow,
  },
  fullscreenContainer: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
    margin: 0,
    backgroundColor: '#020617',
    justifyContent: 'space-between',
  },
  videoViewport: {
    height: 280,
    backgroundColor: '#020617',
    position: 'relative',
    overflow: 'hidden',
  },
  fullscreenViewport: {
    flex: 1,
    height: undefined,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingTitle: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  loadingSub: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  noVideoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  impactFlashLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fbbf24',
  },
  topOverlayBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topOverlayBarFullscreen: {
    top: Platform.OS === 'ios' ? 48 : 32,
    left: 14,
    right: 14,
  },
  liveTelemetryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 5,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    color: '#f1f5f9',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hudToggleBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  hudToggleBtnActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.85)',
    borderColor: '#38bdf8',
  },
  hudToggleText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  fullscreenBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  fullscreenBtnText: {
    color: '#38bdf8',
    fontSize: 8,
    fontWeight: '800',
  },
  anglesOverlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  angleTag: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.2,
    gap: 5,
  },
  angleTagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  angleTagLabel: {
    color: '#94a3b8',
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  angleTagValue: {
    fontSize: 9,
    fontWeight: '900',
  },
  telemetryCornerBox: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    zIndex: 6,
    gap: 4,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  telemetryLabel: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '700',
  },
  telemetryVal: {
    color: '#f8fafc',
    fontSize: 8.5,
    fontWeight: '900',
  },
  telemetryDivider: {
    height: 0.8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  centerTapArea: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  pausedIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
  },
  pausedIcon: {
    color: '#38bdf8',
    fontSize: 24,
    marginLeft: 3,
  },
  pausedText: {
    color: '#e2e8f0',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  phaseScrubberContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  phaseTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  phasePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  phasePillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  phasePillText: {
    color: '#94a3b8',
    fontSize: 8.5,
    fontWeight: '700',
  },
  timelineTouchArea: {
    paddingVertical: 6,
  },
  timelineTrack: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
  },
  timelineFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 3,
  },
  timelineTick: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  timelineTickImpact: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    marginLeft: -7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactMarkerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  timeCurrent: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timePhaseBadge: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  timeTotal: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  transportControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0b1120',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  transportBtn: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  transportBtnIcon: {
    fontSize: 12,
    color: '#e2e8f0',
  },
  transportBtnSub: {
    fontSize: 7,
    fontWeight: '800',
    color: '#94a3b8',
    marginTop: 1,
  },
  transportBtnMini: {
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  transportMiniText: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '700',
  },
  playPauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  playPauseBtnActive: {
    backgroundColor: '#0369a1',
  },
  playPauseIcon: {
    color: '#ffffff',
    fontSize: 18,
  },
  impactJumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7f1d1d',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 3,
  },
  impactJumpIcon: {
    fontSize: 11,
  },
  impactJumpText: {
    color: '#fecaca',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  speedSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  speedBarLabel: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  speedPillsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  speedPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  speedPillActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.3)',
    borderColor: '#38bdf8',
  },
  speedPillText: {
    color: '#94a3b8',
    fontSize: 8.5,
    fontWeight: '700',
  },
  speedPillTextActive: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  ghostToggleBtnActive: {
    backgroundColor: 'rgba(180, 83, 9, 0.85)',
    borderColor: '#facc15',
  },
  ghostBlendBar: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    zIndex: 10,
    gap: 6,
  },
  ghostBlendLabel: {
    color: '#fbbf24',
    fontSize: 8,
    fontWeight: '800',
  },
  ghostBlendPills: {
    flexDirection: 'row',
    gap: 4,
  },
  ghostBlendPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ghostBlendPillActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.4)',
    borderColor: '#facc15',
  },
  ghostBlendPillText: {
    color: '#94a3b8',
    fontSize: 7.5,
    fontWeight: '700',
  },
  ghostBlendPillTextActive: {
    color: '#fef08a',
    fontWeight: '800',
  },
});
