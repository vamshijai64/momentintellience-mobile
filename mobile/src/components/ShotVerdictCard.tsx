import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { ShotVerdict } from '../types';
import { colors, radii, shadows } from '../theme';

interface ShotVerdictCardProps {
  verdict?: ShotVerdict;
}

const RADIUS = 74;

const VERDICT_THEME: Record<string, { bg: string; text: string; border: string; label: string; icon: string }> = {
  GOOD_SHOT: { bg: colors.successSoft, text: colors.successText, border: colors.successBorder, label: 'GOOD SHOT', icon: '✓' },
  AVERAGE_SHOT: { bg: colors.warningSoft, text: colors.warningText, border: colors.warningBorder, label: 'AVERAGE SHOT', icon: '~' },
  BAD_SHOT: { bg: colors.destructiveSoft, text: colors.destructiveText, border: colors.destructiveBorder, label: 'NEEDS WORK', icon: '!' },
};

const CONFIDENCE_THEME: Record<string, { text: string; label: string }> = {
  HIGH: { text: colors.successText, label: 'High Confidence' },
  MEDIUM: { text: colors.warningText, label: 'Medium Confidence' },
  LOW: { text: colors.destructiveText, label: 'Low Confidence' },
};

export const ShotVerdictCard: React.FC<ShotVerdictCardProps> = ({ verdict }) => {
  if (!verdict) {
    return null;
  }

  const theme = VERDICT_THEME[verdict.verdict] || VERDICT_THEME.AVERAGE_SHOT;
  const shotDirectionDeg = Math.max(0, Math.min(180, verdict.shot_direction_deg ?? 90));
  // 0° (Off-side / Cover) on LEFT, 90° (Straight) on TOP, 180° (Leg-side / Fine Leg) on RIGHT
  const needleRotation = -(90 - shotDirectionDeg);
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
            <View style={[styles.subScoreFill, { width: `${Math.min(100, Math.max(0, verdict.technique_score))}%`, backgroundColor: '#0284c7' }]} />
          </View>
        </View>
        <View style={styles.subScoreCard}>
          <Text style={styles.subScoreLabel}>EXECUTION</Text>
          <Text style={styles.subScoreValue}>{Math.round(verdict.execution_score)}%</Text>
          <View style={styles.subScoreTrack}>
            <View style={[styles.subScoreFill, { width: `${Math.min(100, Math.max(0, verdict.execution_score))}%`, backgroundColor: '#7c3aed' }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  android: { elevation: 3 },
  default: {},
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 10,
    ...shadows.sm,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  verdictIconText: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroTextCol: {
    flexShrink: 1,
  },
  badgeEyebrow: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  badgeLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  scoreRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  scoreRingValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scoreRingLabel: {
    color: colors.mutedForeground,
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 1,
  },
  reasonBox: {
    backgroundColor: colors.muted,
    borderRadius: radii.md,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reasonText: {
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 18.5,
    fontWeight: '500',
  },
  subScoreRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  subScoreCard: {
    flex: 1,
    backgroundColor: colors.muted,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subScoreLabel: {
    color: colors.mutedForeground,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  subScoreValue: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: -0.3,
  },
  subScoreTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: 8,
    overflow: 'hidden',
  },
  subScoreFill: {
    height: '100%',
    borderRadius: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 16,
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
