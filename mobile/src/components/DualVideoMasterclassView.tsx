import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { CrownGoldIcon } from './icons/AppIcons';
import { clearProVideoUri, loadSavedProVideoUri, saveProVideoUri } from '../config/proReferenceVideos';
import { getProTargets } from '../config/proTargets';

interface DualVideoMasterclassViewProps {
  playerVideoUri?: string;
  proReferenceVideoUri?: string;
  shotType?: string;
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
  spineAngle?: number;
  overallScore?: number;
}

type CompareRow = {
  id: string;
  label: string;
  you: string;
  pro: string;
  delta: string;
  status: 'good' | 'close' | 'fix';
  tip: string;
};

function statusFromDelta(absDelta: number, goodMax: number, closeMax: number): CompareRow['status'] {
  if (absDelta <= goodMax) return 'good';
  if (absDelta <= closeMax) return 'close';
  return 'fix';
}

export const DualVideoMasterclassView: React.FC<DualVideoMasterclassViewProps> = ({
  playerVideoUri,
  proReferenceVideoUri,
  shotType = 'Cover drive',
  leadElbowAngle,
  kneeFlexionAngle,
  spineAngle,
  overallScore,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.5);
  const [activeTab, setActiveTab] = useState<'SPLIT' | 'PLAYER' | 'PRO'>('SPLIT');
  const [focusRow, setFocusRow] = useState('elbow');
  const [savedProUri, setSavedProUri] = useState<string | null>(null);

  const playerVideoRef = useRef<Video>(null);
  const proVideoRef = useRef<Video>(null);
  const PRO_TARGETS = getProTargets(shotType);

  const elbow = typeof leadElbowAngle === 'number' ? Math.round(leadElbowAngle) : null;
  const knee = typeof kneeFlexionAngle === 'number' ? Math.round(kneeFlexionAngle) : null;
  const spine = typeof spineAngle === 'number' ? Math.round(spineAngle) : null;

  const rows: CompareRow[] = useMemo(() => {
    const list: CompareRow[] = [];

    if (elbow != null) {
      const d = elbow - PRO_TARGETS.elbow;
      const abs = Math.abs(d);
      list.push({
        id: 'elbow',
        label: 'Lead elbow',
        you: `${elbow}°`,
        pro: `${PRO_TARGETS.elbow}°`,
        delta: d === 0 ? 'On target' : `${d > 0 ? '+' : ''}${d}°`,
        status: statusFromDelta(abs, 8, 18),
        tip:
          abs <= 8
            ? 'Elbow height matches the pro model.'
            : d < 0
              ? 'Lift the front elbow higher through contact.'
              : 'Elbow is a bit high — keep it guiding, not lifting away.',
      });
    } else {
      list.push({
        id: 'elbow',
        label: 'Lead elbow',
        you: '—',
        pro: `${PRO_TARGETS.elbow}°`,
        delta: 'Pending',
        status: 'close',
        tip: 'Elbow angle will show after analysis completes.',
      });
    }

    if (knee != null) {
      const d = knee - PRO_TARGETS.knee;
      const abs = Math.abs(d);
      list.push({
        id: 'knee',
        label: 'Front knee',
        you: `${knee}°`,
        pro: `${PRO_TARGETS.knee}°`,
        delta: d === 0 ? 'On target' : `${d > 0 ? '+' : ''}${d}°`,
        status: statusFromDelta(abs, 10, 20),
        tip:
          abs <= 10
            ? 'Front knee flexion is close to pro form.'
            : d < 0
              ? 'Bend the front knee more into the stride.'
              : 'Knee is deep — hold balance without collapsing.',
      });
    } else {
      list.push({
        id: 'knee',
        label: 'Front knee',
        you: '—',
        pro: `${PRO_TARGETS.knee}°`,
        delta: 'Pending',
        status: 'close',
        tip: 'Knee angle will show after analysis completes.',
      });
    }

    if (spine != null) {
      const d = spine - PRO_TARGETS.spine;
      const abs = Math.abs(d);
      list.push({
        id: 'spine',
        label: 'Spine tilt',
        you: `${spine}°`,
        pro: `${PRO_TARGETS.spine}°`,
        delta: d === 0 ? 'On target' : `${d > 0 ? '+' : ''}${d}°`,
        status: statusFromDelta(abs, 6, 12),
        tip:
          abs <= 6
            ? 'Body stack is close to the pro line.'
            : 'Keep shoulders stacked over hips — less side lean.',
      });
    }

    list.push({
      id: 'form',
      label: 'Overall form',
      you: typeof overallScore === 'number' ? `${Math.round(overallScore)}` : '—',
      pro: '100',
      delta:
        typeof overallScore === 'number'
          ? `${Math.max(0, 100 - Math.round(overallScore))} behind`
          : 'Pending',
      status:
        typeof overallScore === 'number'
          ? overallScore >= 80
            ? 'good'
            : overallScore >= 65
              ? 'close'
              : 'fix'
          : 'close',
      tip:
        typeof overallScore === 'number' && overallScore >= 80
          ? 'Strong match to pro shape — refine the weakest joint next.'
          : 'Focus on the red/amber rows first to close the gap.',
    });

    return list;
  }, [elbow, knee, spine, overallScore, PRO_TARGETS.elbow, PRO_TARGETS.knee, PRO_TARGETS.spine]);

  const active = rows.find((r) => r.id === focusRow) || rows[0];
  const matchScore = useMemo(() => {
    if (typeof overallScore === 'number') return Math.round(overallScore);
    const scored = rows.filter((r) => r.status !== 'close' || r.you !== '—');
    if (!scored.length) return null;
    const pts = scored.reduce((sum, r) => sum + (r.status === 'good' ? 100 : r.status === 'close' ? 72 : 48), 0);
    return Math.round(pts / scored.length);
  }, [overallScore, rows]);

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

  useEffect(() => {
    let cancelled = false;
    loadSavedProVideoUri(shotType).then((uri) => {
      if (!cancelled) setSavedProUri(uri);
    });
    return () => {
      cancelled = true;
    };
  }, [shotType]);

  const pickKohliVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow gallery access to pick a Kohli / pro clip.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'] as any,
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const uri = result.assets[0].uri;
    await saveProVideoUri(shotType, uri);
    setSavedProUri(uri);
  };

  const removeKohliVideo = async () => {
    await clearProVideoUri(shotType);
    setSavedProUri(null);
  };

  const effectiveProUri = proReferenceVideoUri || savedProUri;
  const hasRealProVideo = Boolean(effectiveProUri);

  const statusColor = (s: CompareRow['status']) =>
    s === 'good' ? '#15803d' : s === 'close' ? '#b45309' : '#b91c1c';
  const statusBg = (s: CompareRow['status']) =>
    s === 'good' ? '#dcfce7' : s === 'close' ? '#fef3c7' : '#fee2e2';
  const statusLabel = (s: CompareRow['status']) =>
    s === 'good' ? 'Match' : s === 'close' ? 'Close' : 'Fix';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.eyebrow}>Player vs pro</Text>
          <Text style={styles.title}>Masterclass comparison</Text>
          <Text style={styles.subtitle}>{shotType} · your clip on the left</Text>
        </View>
        {matchScore != null && (
          <View style={styles.scorePill}>
            <Text style={styles.scorePillValue}>{matchScore}</Text>
            <Text style={styles.scorePillLabel}>form</Text>
          </View>
        )}
      </View>

      <View style={styles.tabRow}>
        {(
          [
            { id: 'SPLIT', label: 'Split' },
            { id: 'PLAYER', label: 'You' },
            { id: 'PRO', label: 'Pro' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.viewportContainer}>
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
                <Text style={styles.placeholderText}>Loading your shot…</Text>
              </View>
            )}
            <View style={styles.overlayTagPlayer}>
              <View style={[styles.tagDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.tagTextPlayer}>You</Text>
            </View>
            {elbow != null && (
              <View style={styles.youMetricChip}>
                <Text style={styles.youMetricText}>Elbow {elbow}°</Text>
              </View>
            )}
          </View>
        )}

        {(activeTab === 'SPLIT' || activeTab === 'PRO') && (
          <View style={[styles.videoPanel, activeTab === 'SPLIT' && styles.splitRight]}>
            {hasRealProVideo ? (
              <Video
                ref={proVideoRef}
                source={{ uri: effectiveProUri as string }}
                style={styles.videoPlayer}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={isPlaying}
                isLooping
                rate={playbackSpeed}
                isMuted
              />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderKicker}>Not a second video</Text>
                <Text style={styles.placeholderText}>Pro target pose</Text>
                <Text style={styles.placeholderHint}>
                  Tap Set Kohli video below and pick a clip from your phone.
                </Text>
                <Text style={styles.proTargetLine}>Target elbow {PRO_TARGETS.elbow}°</Text>
                <Text style={styles.proTargetLine}>Knee {PRO_TARGETS.knee}°</Text>
              </View>
            )}
            <View style={styles.proFrame}>
              <View style={styles.proTopBanner}>
                <CrownGoldIcon size={12} color="#fbbf24" />
                <Text style={styles.proBannerText}>Pro model</Text>
              </View>
            </View>
            <View style={styles.overlayTagPro}>
              <View style={[styles.tagDot, { backgroundColor: '#fbbf24' }]} />
              <Text style={styles.tagTextPro}>Pro</Text>
            </View>
            <View style={styles.proMetricChip}>
              <Text style={styles.proMetricText}>Target {PRO_TARGETS.elbow}°</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.proSetRow}>
        <TouchableOpacity style={styles.setProBtn} onPress={pickKohliVideo} activeOpacity={0.85}>
          <Text style={styles.setProBtnText}>
            {hasRealProVideo ? 'Change Kohli video' : 'Set Kohli video'}
          </Text>
        </TouchableOpacity>
        {hasRealProVideo ? (
          <TouchableOpacity style={styles.clearProBtn} onPress={removeKohliVideo} activeOpacity={0.85}>
            <Text style={styles.clearProBtnText}>Remove</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.proSetHint}>
        Left is always your analysed shot. Right is only a Kohli/pro clip if you pick one from the gallery.
      </Text>

      <View style={styles.controlBar}>
        <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause} activeOpacity={0.8}>
          <Text style={styles.playBtnIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          <Text style={styles.playBtnText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
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
                  {s === 1 ? '1×' : `${s}×`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Clear analysis table */}
      <View style={styles.analysisCard}>
        <Text style={styles.analysisTitle}>Clear analysis</Text>
        <Text style={styles.analysisSub}>Tap a row to see the coaching tip</Text>

        <View style={styles.tableHead}>
          <Text style={[styles.th, styles.colLabel]}>Check</Text>
          <Text style={[styles.th, styles.colYou]}>You</Text>
          <Text style={[styles.th, styles.colPro]}>Target</Text>
          <Text style={[styles.th, styles.colGap]}>Gap</Text>
        </View>

        {rows.map((row) => {
          const selected = focusRow === row.id;
          return (
            <TouchableOpacity
              key={row.id}
              style={[styles.tableRow, selected && styles.tableRowActive]}
              onPress={() => setFocusRow(row.id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.td, styles.colLabel, styles.tdLabel]}>{row.label}</Text>
              <Text style={[styles.td, styles.colYou, styles.tdYou]}>{row.you}</Text>
              <Text style={[styles.td, styles.colPro, styles.tdPro]}>{row.pro}</Text>
              <View style={[styles.statusChip, { backgroundColor: statusBg(row.status) }]}>
                <Text style={[styles.statusChipText, { color: statusColor(row.status) }]}>
                  {statusLabel(row.status)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.tipBox}>
          <Text style={styles.tipKicker}>{active.label}</Text>
          <Text style={styles.tipDelta}>
            You {active.you} · Target {active.pro} · {active.delta}
          </Text>
          <Text style={styles.tipText}>{active.tip}</Text>
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  titleGroup: { flex: 1 },
  eyebrow: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scorePill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 58,
  },
  scorePillValue: {
    color: '#047857',
    fontSize: 18,
    fontWeight: '800',
  },
  scorePillLabel: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  tabText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0369a1',
    fontWeight: '700',
  },
  viewportContainer: {
    flexDirection: 'row',
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1,
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
    paddingHorizontal: 10,
  },
  placeholderText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  placeholderKicker: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  placeholderHint: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  proTargetLine: {
    color: '#fde68a',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  overlayTagPlayer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  overlayTagPro: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagTextPlayer: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  tagTextPro: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
  youMetricChip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  youMetricText: {
    color: '#022c22',
    fontSize: 11,
    fontWeight: '700',
  },
  proMetricChip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  proMetricText: {
    color: '#422006',
    fontSize: 11,
    fontWeight: '700',
  },
  proFrame: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.55)',
    pointerEvents: 'none',
  },
  proTopBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  proBannerText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '700',
  },
  proSetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  setProBtn: {
    flex: 1,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  setProBtnText: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '700',
  },
  clearProBtn: {
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  clearProBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  proSetHint: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 16,
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
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  playBtnIcon: {
    fontSize: 12,
    color: '#ffffff',
  },
  playBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  speedGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  speedBtn: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  speedBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  speedText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  speedTextActive: {
    color: '#0369a1',
    fontWeight: '700',
  },
  analysisCard: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  analysisTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  analysisSub: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 10,
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 4,
  },
  th: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  tableRowActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  td: {
    fontSize: 13,
    fontWeight: '600',
  },
  colLabel: { flex: 1.3 },
  colYou: { flex: 0.8, textAlign: 'center' },
  colPro: { flex: 0.8, textAlign: 'center' },
  colGap: { width: 58, textAlign: 'right' },
  tdLabel: { color: '#0f172a' },
  tdYou: { color: '#047857' },
  tdPro: { color: '#b45309' },
  statusChip: {
    width: 58,
    alignItems: 'center',
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tipBox: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipKicker: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '700',
  },
  tipDelta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  tipText: {
    color: '#0f172a',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 6,
  },
});
