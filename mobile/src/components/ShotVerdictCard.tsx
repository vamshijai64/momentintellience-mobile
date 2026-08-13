import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ShotVerdict } from '../types';

interface ShotVerdictCardProps {
  verdict?: ShotVerdict;
}

const RADIUS = 68;

const VERDICT_THEME: Record<string, { bg: string; text: string; border: string; label: string; icon: string }> = {
  GOOD_SHOT: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981', label: 'GOOD SHOT', icon: '✓' },
  AVERAGE_SHOT: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b', label: 'AVERAGE SHOT', icon: '~' },
  BAD_SHOT: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444', label: 'BAD SHOT', icon: '✗' },
};

const CONFIDENCE_THEME: Record<string, { text: string; label: string }> = {
  HIGH: { text: '#10b981', label: 'HIGH CONFIDENCE' },
  MEDIUM: { text: '#f59e0b', label: 'MEDIUM CONFIDENCE' },
  LOW: { text: '#ef4444', label: 'LOW CONFIDENCE' },
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
    <View style={[styles.cardContainer, { borderColor: theme.border }]}>
      {/* AI Coach Verdict Badge */}
      <View style={[styles.badgeRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
        <View>
          <Text style={styles.badgeEyebrow}>AI COACH VERDICT</Text>
          <Text style={[styles.badgeLabel, { color: theme.text }]}>
            {theme.icon} {theme.label}
          </Text>
        </View>
        <View style={styles.scoreBubble}>
          <Text style={[styles.scoreBubbleValue, { color: theme.text }]}>
            {Math.round(verdict.composite_score)}
          </Text>
          <Text style={styles.scoreBubbleLabel}>SCORE</Text>
        </View>
      </View>

      {confidence && (
        <View style={styles.confidenceRow}>
          <View style={[styles.confidenceDot, { backgroundColor: confidence.text }]} />
          <Text style={[styles.confidenceText, { color: confidence.text }]}>{confidence.label}</Text>
        </View>
      )}

      {/* Reason Text */}
      <Text style={styles.reasonText}>{verdict.reason}</Text>

      {/* Technique vs Execution Sub-scores */}
      <View style={styles.subScoreRow}>
        <View style={styles.subScoreCard}>
          <Text style={styles.subScoreLabel}>TECHNIQUE</Text>
          <Text style={styles.subScoreValue}>{Math.round(verdict.technique_score)}%</Text>
        </View>
        <View style={styles.subScoreCard}>
          <Text style={styles.subScoreLabel}>EXECUTION</Text>
          <Text style={styles.subScoreValue}>{Math.round(verdict.execution_score)}%</Text>
        </View>
      </View>

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
          <View style={styles.needleLine} />
        </View>
        <View style={styles.protractorCenterDot} />

        <Text style={[styles.protractorTick, styles.tickLeft]}>180°</Text>
        <Text style={[styles.protractorTick, styles.tickTop]}>90°</Text>
        <Text style={[styles.protractorTick, styles.tickRight]}>0°</Text>
      </View>
      <Text style={styles.protractorValue}>{Math.round(shotDirectionDeg)}° (bat swing-plane proxy)</Text>
      <Text style={styles.protractorDisclaimer}>
        Estimated from bat swing direction at impact, not literal ball-tracking.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginVertical: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  badgeEyebrow: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  badgeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  scoreBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
  },
  scoreBubbleValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreBubbleLabel: {
    color: '#64748b',
    fontSize: 7,
    fontWeight: 'bold',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  confidenceText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  reasonText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
  directionHeadline: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  subScoreRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  subScoreCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  subScoreLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  subScoreValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  protractorHeader: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 16,
    textAlign: 'center',
  },
  protractorWrapper: {
    width: RADIUS * 2,
    height: RADIUS + 8,
    alignSelf: 'center',
    marginTop: 10,
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
    borderColor: 'rgba(148, 163, 184, 0.5)',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
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
    left: RADIUS - 1,
    width: 2,
    height: RADIUS,
    backgroundColor: '#10b981',
  },
  protractorCenterDot: {
    position: 'absolute',
    top: RADIUS - 3,
    left: RADIUS - 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  protractorTick: {
    position: 'absolute',
    color: '#64748b',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tickLeft: {
    left: 0,
    bottom: -2,
  },
  tickTop: {
    left: RADIUS - 12,
    top: -2,
  },
  tickRight: {
    right: 0,
    bottom: -2,
  },
  protractorValue: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  protractorDisclaimer: {
    color: '#64748b',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
  },
});
