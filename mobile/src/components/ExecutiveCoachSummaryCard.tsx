import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { TargetIcon, CompassArenaIcon, LightbulbCueIcon } from './icons/AppIcons';

interface ExecutiveCoachSummaryCardProps {
  score?: number;
  shotType?: string;
  shotDirectionLabel?: string;
  shotDirectionDeg?: number;
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
  verdict?: string;
  takeaway?: string;
  onOpenScorecard?: () => void;
}

export const ExecutiveCoachSummaryCard: React.FC<ExecutiveCoachSummaryCardProps> = ({
  score,
  shotType = 'Your shot',
  shotDirectionLabel,
  shotDirectionDeg,
  leadElbowAngle,
  kneeFlexionAngle,
  verdict,
  takeaway,
  onOpenScorecard,
}) => {
  const hasScore = typeof score === 'number';
  const isGood = hasScore ? score >= 68 : true;
  const verdictText = (verdict || (isGood ? 'GOOD SHOT' : 'NEEDS WORK')).replace(/_/g, ' ');
  const directionText = shotDirectionLabel
    ? `${shotDirectionLabel}${typeof shotDirectionDeg === 'number' ? ` (${Math.round(shotDirectionDeg)}°)` : ''}`
    : 'Direction not measured';
  const insight = takeaway || 'Play the video. The line and bubble on the body are the analysis.';

  return (
    <View style={styles.card}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.aiDot} />
          <Text style={styles.headerCategory}>Coach verdict</Text>
        </View>
        <View style={[styles.verdictBadge, isGood ? styles.verdictGood : styles.verdictNeedsWork]}>
          <Text style={[styles.verdictText, isGood ? styles.verdictGoodText : styles.verdictNeedsWorkText]}>
            {verdictText} {isGood ? '✓' : ''}
          </Text>
        </View>
      </View>

      {/* Main Score & Shot Details Row */}
      <View style={styles.scoreRow}>
        {/* Glowing Circular Score Ring */}
        <View style={styles.scoreRingWrapper}>
          <View style={[styles.scoreRingOuter, isGood ? styles.scoreRingGood : styles.scoreRingAmber]}>
            <Text style={[styles.scoreNumber, isGood ? styles.textGood : styles.textAmber]}>
              {hasScore ? Math.round(score as number) : '—'}
            </Text>
            <Text style={styles.scoreScale}>/ 100</Text>
          </View>
          <Text style={styles.scoreLabel}>Form match</Text>
        </View>

        {/* Shot Details Column */}
        <View style={styles.detailsCol}>
          <Text style={styles.shotTitle} numberOfLines={1}>{shotType}</Text>
          <View style={styles.pillRow}>
            <View style={styles.infoPill}>
              <TargetIcon size={12} color="#0284c7" />
              <Text style={styles.infoPillText}>{verdictText}</Text>
            </View>
            <View style={styles.infoPill}>
              <CompassArenaIcon size={12} color="#0284c7" />
              <Text style={styles.infoPillText}>{directionText}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Coach Actionable Key Insight */}
      <View style={styles.coachInsightBox}>
        <View style={styles.takeawayHeaderRow}>
          <LightbulbCueIcon size={14} color="#0284c7" />
          <Text style={styles.coachInsightLabel}>Coach takeaway</Text>
        </View>
        <Text style={styles.coachInsightText}>{insight}</Text>
      </View>

      {/* 2 Fast Telemetry Metric Pills */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Lead elbow</Text>
          <Text style={styles.metricCardValue}>{leadElbowAngle != null ? `${Math.round(leadElbowAngle)}°` : '—'}</Text>
          <Text style={styles.metricCardSub}>At impact</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Front knee</Text>
          <Text style={styles.metricCardValue}>{kneeFlexionAngle != null ? `${Math.round(kneeFlexionAngle)}°` : '—'}</Text>
          <Text style={styles.metricCardSub}>At impact</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284c7',
  },
  headerCategory: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  verdictBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  verdictGood: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verdictNeedsWork: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  verdictText: {
    fontSize: 11,
    fontWeight: '700',
  },
  verdictGoodText: {
    color: '#15803d',
  },
  verdictNeedsWorkText: {
    color: '#b45309',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  scoreRingWrapper: {
    alignItems: 'center',
  },
  scoreRingOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  scoreRingGood: {
    borderColor: '#10b981',
  },
  scoreRingAmber: {
    borderColor: '#f59e0b',
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  textGood: {
    color: '#15803d',
  },
  textAmber: {
    color: '#b45309',
  },
  scoreScale: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  scoreLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  shotTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'column',
    gap: 4,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoPillText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '500',
  },
  coachInsightBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 10,
  },
  takeawayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  coachInsightLabel: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '600',
  },
  coachInsightText: {
    color: '#0c4a6e',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricCardLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  metricCardValue: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 3,
  },
  metricCardSub: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
