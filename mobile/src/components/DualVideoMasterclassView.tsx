import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { CrownGoldIcon } from './icons/AppIcons';

interface DualVideoMasterclassViewProps {
  playerVideoUri?: string;
  proReferenceVideoUri?: string;
  shotType?: string;
}

const { width } = Dimensions.get('window');

export const DualVideoMasterclassView: React.FC<DualVideoMasterclassViewProps> = ({
  playerVideoUri,
  proReferenceVideoUri,
  shotType = 'COVER DRIVE',
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.5);
  const [activeTab, setActiveTab] = useState<'SPLIT' | 'PLAYER' | 'PRO'>('SPLIT');

  const playerVideoRef = useRef<Video>(null);
  const proVideoRef = useRef<Video>(null);

  const togglePlayPause = async () => {
    if (isPlaying) {
      await playerVideoRef.current?.pauseAsync();
      await proVideoRef.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await playerVideoRef.current?.playAsync();
      await proVideoRef.current?.playAsync();
      setIsPlaying(true);
    }
  };

  const changeSpeed = async (speed: number) => {
    setPlaybackSpeed(speed);
    await playerVideoRef.current?.setRateAsync(speed, true);
    await proVideoRef.current?.setRateAsync(speed, true);
  };

  // Fallback demonstration video for the pro benchmark if custom URL is not supplied
  const effectiveProUri = proReferenceVideoUri || playerVideoUri;

  return (
    <View style={styles.container}>
      {/* Broadcast Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.eyebrow}>BROADCAST SPLIT-SCREEN REPLAY</Text>
          <Text style={styles.title}>PLAYER VS PRO MASTERCLASS</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>SYNCED 0.5X</Text>
        </View>
      </View>

      {/* Mode Switch Tabs (SPLIT | YOUR SHOT | PRO MODEL) */}
      <View style={styles.tabRow}>
        {(['SPLIT', 'PLAYER', 'PRO'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab === 'SPLIT' ? '📺 Side-by-Side Dual View' : tab === 'PLAYER' ? '👤 Player Replay' : '👑 Pro Benchmark'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Video Viewport Container */}
      <View style={styles.viewportContainer}>
        {/* Left / Player Video Panel */}
        {(activeTab === 'SPLIT' || activeTab === 'PLAYER') && (
          <View style={[styles.videoPanel, activeTab === 'SPLIT' && styles.splitLeft]}>
            {playerVideoUri ? (
              <Video
                ref={playerVideoRef}
                source={{ uri: playerVideoUri }}
                style={styles.videoPlayer}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={isPlaying}
                isLooping
                rate={playbackSpeed}
                isMuted
              />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>Loading Replay...</Text>
              </View>
            )}
            <View style={styles.overlayTagPlayer}>
              <View style={[styles.tagDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.tagTextPlayer}>YOUR SHOT (AI OVERLAY)</Text>
            </View>
          </View>
        )}

        {/* Right / Pro Model Video Panel */}
        {(activeTab === 'SPLIT' || activeTab === 'PRO') && (
          <View style={[styles.videoPanel, activeTab === 'SPLIT' && styles.splitRight]}>
            {effectiveProUri ? (
              <Video
                ref={proVideoRef}
                source={{ uri: effectiveProUri }}
                style={styles.videoPlayer}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={isPlaying}
                isLooping
                rate={playbackSpeed}
                isMuted
              />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>Loading Masterclass...</Text>
              </View>
            )}
            {/* Pro Masterclass Gold Visual Overlay & Target HUD */}
            <View style={styles.proGoldenFilter}>
              <View style={styles.proTopBanner}>
                <View style={styles.proBannerRow}>
                  <CrownGoldIcon size={12} color="#fbbf24" />
                  <Text style={styles.proBannerText}>PRO MASTERCLASS | 100% IDEAL FORM</Text>
                </View>
              </View>

              {/* Floating Pro Keypoint Telemetry Callouts */}
              <View style={styles.proTelemetryBadgeElbow}>
                <Text style={styles.proTelemetryText}>140° LEAD ELBOW [IDEAL]</Text>
              </View>

              <View style={styles.proTelemetryBadgeKnee}>
                <Text style={styles.proTelemetryText}>135° FRONT KNEE [PERFECT]</Text>
              </View>

              <View style={styles.proTelemetryBadgeHead}>
                <Text style={styles.proTelemetryText}>HEAD OVER BALL [LOCKED]</Text>
              </View>
            </View>

            <View style={styles.overlayTagPro}>
              <View style={[styles.tagDot, { backgroundColor: '#fbbf24' }]} />
              <Text style={styles.tagTextPro}>PRO MODEL (GOLD STANDARD)</Text>
            </View>
          </View>
        )}
      </View>

      {/* Synchronized Playback Control Bar */}
      <View style={styles.controlBar}>
        <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause} activeOpacity={0.8}>
          <Text style={styles.playBtnIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          <Text style={styles.playBtnText}>{isPlaying ? 'PAUSE' : 'PLAY'}</Text>
        </TouchableOpacity>

        {/* Speed Selector Buttons */}
        <View style={styles.speedGroup}>
          {[0.25, 0.5, 1.0].map((s) => {
            const isSelected = playbackSpeed === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.speedBtn, isSelected && styles.speedBtnActive]}
                onPress={() => changeSpeed(s)}
              >
                <Text style={[styles.speedText, isSelected && styles.speedTextActive]}>
                  {s}x
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    flex: 1,
  },
  eyebrow: {
    color: '#0284c7',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803d',
  },
  liveText: {
    color: '#15803d',
    fontSize: 9,
    fontWeight: '900',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  tabText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#0284c7',
    fontWeight: '900',
  },
  viewportContainer: {
    flexDirection: 'row',
    height: 230,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  videoPanel: {
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  splitLeft: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
  },
  splitRight: {},
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  overlayTagPlayer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  overlayTagPro: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tagTextPlayer: {
    color: '#34d399',
    fontSize: 8,
    fontWeight: '800',
  },
  tagTextPro: {
    color: '#fbbf24',
    fontSize: 8,
    fontWeight: '800',
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  playBtnIcon: {
    fontSize: 12,
    color: '#ffffff',
  },
  playBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  speedGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  speedBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  speedBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  speedText: {
    color: '#64748b',
    fontSize: 10.5,
    fontWeight: '700',
  },
  speedTextActive: {
    color: '#0284c7',
    fontWeight: '900',
  },
  proGoldenFilter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    zIndex: 10,
    pointerEvents: 'none',
  },
  proTopBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf24',
    alignItems: 'center',
  },
  proBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  proBannerText: {
    color: '#fbbf24',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  proTelemetryBadgeElbow: {
    position: 'absolute',
    top: 55,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  proTelemetryBadgeKnee: {
    position: 'absolute',
    bottom: 35,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  proTelemetryBadgeHead: {
    position: 'absolute',
    top: 30,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  proTelemetryText: {
    color: '#fbbf24',
    fontSize: 7.5,
    fontWeight: '800',
  },
});
