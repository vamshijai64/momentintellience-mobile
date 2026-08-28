import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { ShotVerdict } from '../types';

interface ShotVerdictCardProps {
  verdict?: ShotVerdict;
}

const RADIUS = 74;

const VERDICT_THEME: Record<string, { bg: string; text: string; border: string; label: string; icon: string }> = {
  GOOD_SHOT: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: '#10b981', label: 'GOOD SHOT', icon: '✓' },
  AVERAGE_SHOT: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: '#f59e0b', label: 'AVERAGE SHOT', icon: '~' },
  BAD_SHOT: { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171', border: '#ef4444', label: 'NEEDS WORK', icon: '!' },
};

const CONFIDENCE_THEME: Record<string, { text: string; label: string }> = {
  HIGH: { text: '#34d399', label: 'High Confidence' },
  MEDIUM: { text: '#fbbf24', label: 'Medium Confidence' },
  LOW: { text: '#f87171', label: 'Low Confidence' },
};

export const ShotVerdictCard: React.FC<ShotVerdictCardProps> = ({ verdict }) => {
  if (!verdict) {
    return null;
  }

  const theme = VERDICT_THEME[verdict.verdict] || VERDICT_THEME.AVERAGE_SHOT;
  const shotDirectionDeg = Math.max(0, Math.min(180, verdict.shot_direction_deg ?? 90));
  const needleRotation = 90 - shotDirectionDeg;
  const confidence = verdict.verdict_confidence ? CONFIDENCE_THEME[verdict.verdict_confidence] : null;
  const directionLabel = verdict.shot_direction_label;

  return (
    <View style={styles.cardContainer}>
      {/* Hero Row: Verdict Identity + Big Score Ring */}
      <View style={styles.heroRow}>
        <View style={styles.heroLeft}>
          <View style={[styles.verdictIconCircle, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[styles.verdictIconText, { color: theme.text }]}>{theme.icon}</Text>
          </View>
          <View style={styles.heroTextCol}>
            <Text style={styles.badgeEyebrow}>AI COACH VERDICT</Text>
            <Text style={[styles.badgeLabel, { color: theme.text }]}>{theme.label}</Text>
            {confidence && (
              <View style={styles.confidenceRow}>
                <View style={[styles.confidenceDot, { backgroundColor: confidence.text }]} />
                <Text style={[styles.confidenceText, { color: confidence.text }]}>{confidence.label}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.scoreRing, { borderColor: theme.border }]}>
          <Text style={[styles.scoreRingValue, { color: theme.text }]}>{Math.round(verdict.composite_score)}</Text>
          <Text style={styles.scoreRingLabel}>SCORE</Text>
        </View>
      </View>

      {/* Reason Text */}
      {!!verdict.reason && (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonText}>{verdict.reason}</Text>
        </View>
      )}

      {/* Technique vs Execution Sub-scores */}
      <View style={styles.subScoreRow}>
        <View style={styles.subScoreCard}>
          <Text style={styles.subScoreLabel}>TECHNIQUE</Text>
          <Text style={styles.subScoreValue}>{Math.round(verdict.technique_score)}%</Text>
          <View style={styles.subScoreTrack}>
            <View style={[styles.subScoreFill, { width: `${Math.min(100, Math.max(0, verdict.technique_score))}%`, backgroundColor: '#38bdf8' }]} />
          </View>
        </View>
        <View style={styles.subScoreCard}>
          <Text style={styles.subScoreLabel}>EXECUTION</Text>
          <Text style={styles.subScoreValue}>{Math.round(verdict.execution_score)}%</Text>
          <View style={styles.subScoreTrack}>
            <View style={[styles.subScoreFill, { width: `${Math.min(100, Math.max(0, verdict.execution_score))}%`, backgroundColor: '#a78bfa' }]} />
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Estimated Shot Direction Protractor */}
      <Text style={styles.protractorHeader}>ESTIMATED SHOT DIRECTION</Text>
      {directionLabel && (
        <Text style={[styles.directionHeadline, { color: theme.text }]}>
          Played through {directionLabel}
        </Text>
      )}
      <View style={styles.protractorWrapper}>
        <View style={styles.protractorClip}>
          <View style={styles.protractorCircle} />
        </View>

        <View
          style={[
            styles.needlePivot,
            { transform: [{ rotate: `${needleRotation}deg` }] },
          ]}
        >
          <View style={[styles.needleLine, { backgroundColor: theme.border }]} />
        </View>
        <View style={styles.protractorCenterDot} />

        <Text style={[styles.protractorTick, styles.tickLeft]}>180°</Text>
        <Text style={[styles.protractorTick, styles.tickTop]}>90°</Text>
        <Text style={[styles.protractorTick, styles.tickRight]}>0°</Text>
      </View>
      <Text style={[styles.protractorValue, { color: theme.text }]}>{Math.round(shotDirectionDeg)}° bat swing-plane proxy</Text>
      <Text style={styles.protractorDisclaimer}>
        Estimated from bat swing direction at impact, not literal ball-tracking.
      </Text>
    </View>
  );
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#111a2e',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 10,
    ...cardShadow,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  verdictIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  verdictIconText: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroTextCol: {
    flexShrink: 1,
  },
  badgeEyebrow: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  badgeLabel: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  confidenceText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scoreRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
  },
  scoreRingValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  scoreRingLabel: {
    color: '#64748b',
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  reasonBox: {
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  reasonText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  subScoreRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  subScoreCard: {
    flex: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.06)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  subScoreLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  subScoreValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  subScoreTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 8,
    overflow: 'hidden',
  },
  subScoreFill: {
    height: '100%',
    borderRadius: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    marginTop: 18,
    marginBottom: 4,
  },
  protractorHeader: {
    color: '#64748b',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 14,
    textAlign: 'center',
  },
  directionHeadline: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  protractorWrapper: {
    width: RADIUS * 2,
    height: RADIUS + 10,
    alignSelf: 'center',
    marginTop: 14,
    position: 'relative',
  },
  protractorClip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RADIUS * 2,
    height: RADIUS,
    overflow: 'hidden',
  },
  protractorCircle: {
    width: RADIUS * 2,
    height: RADIUS * 2,
    borderRadius: RADIUS,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
  },
  needlePivot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RADIUS * 2,
    height: RADIUS * 2,
  },
  needleLine: {
    position: 'absolute',
    top: 0,
    left: RADIUS - 1.5,
    width: 3,
    height: RADIUS,
    borderRadius: 2,
  },
  protractorCenterDot: {
    position: 'absolute',
    top: RADIUS - 4,
    left: RADIUS - 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  protractorTick: {
    position: 'absolute',
    color: '#475569',
    fontSize: 9.5,
    fontWeight: '700',
  },
  tickLeft: {
    left: 0,
    bottom: -2,
  },
  tickTop: {
    left: RADIUS - 13,
    top: -2,
  },
  tickRight: {
    right: 0,
    bottom: -2,
  },
  protractorValue: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
  },
  protractorDisclaimer: {
    color: '#64748b',
    fontSize: 9.5,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
    lineHeight: 13,
  },
});
