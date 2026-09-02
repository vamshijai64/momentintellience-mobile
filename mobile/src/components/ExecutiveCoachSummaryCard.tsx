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
  onOpenScorecard?: () => void;
}

export const ExecutiveCoachSummaryCard: React.FC<ExecutiveCoachSummaryCardProps> = ({
  score = 70,
  shotType = 'COVER DRIVE',
  shotDirectionLabel = 'COVER',
  shotDirectionDeg = 47,
  leadElbowAngle = 138,
  kneeFlexionAngle = 132,
  verdict = 'GOOD SHOT',
  onOpenScorecard,
}) => {
  const isGood = score >= 68;
  const outcomeText = isGood ? 'Boundary (4 Runs)' : 'Grounded Drive (1-2 Runs)';
  const elbowDiff = Math.abs(144 - Math.round(leadElbowAngle));
  const elbowTip = leadElbowAngle >= 140 
    ? 'Lead elbow locked high with perfect extension through the stroke.' 
    : `Elevate front elbow +${elbowDiff}° during downswing to optimize sweet-spot exit speed.`;

  return (
    <View style={styles.card}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.aiDot} />
          <Text style={styles.headerCategory}>COACH VERDICT</Text>
        </View>
        <View style={[styles.verdictBadge, isGood ? styles.verdictGood : styles.verdictNeedsWork]}>
          <Text style={[styles.verdictText, isGood ? styles.verdictGoodText : styles.verdictNeedsWorkText]}>
            {verdict.replace(/_/g, ' ')} {isGood ? '✓' : '⚠️'}
          </Text>
        </View>
      </View>

      {/* Main Score & Shot Details Row */}
      <View style={styles.scoreRow}>
        {/* Glowing Circular Score Ring */}
        <View style={styles.scoreRingWrapper}>
          <View style={[styles.scoreRingOuter, isGood ? styles.scoreRingGood : styles.scoreRingAmber]}>
            <Text style={[styles.scoreNumber, isGood ? styles.textGood : styles.textAmber]}>
              {Math.round(score)}
            </Text>
            <Text style={styles.scoreScale}>/ 100</Text>
          </View>
          <Text style={styles.scoreLabel}>FORM MATCH</Text>
        </View>

        {/* Shot Details Column */}
        <View style={styles.detailsCol}>
          <Text style={styles.shotTitle} numberOfLines={1}>{shotType}</Text>
          <View style={styles.pillRow}>
            <View style={styles.infoPill}>
              <TargetIcon size={12} color="#0284c7" />
              <Text style={styles.infoPillText}>{outcomeText}</Text>
            </View>
            <View style={styles.infoPill}>
              <CompassArenaIcon size={12} color="#0284c7" />
              <Text style={styles.infoPillText}>{shotDirectionLabel} ({Math.round(shotDirectionDeg)}°)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Coach Actionable Key Insight */}
      <View style={styles.coachInsightBox}>
        <View style={styles.takeawayHeaderRow}>
          <LightbulbCueIcon size={14} color="#0284c7" />
          <Text style={styles.coachInsightLabel}>AI COACH TAKEAWAY</Text>
        </View>
        <Text style={styles.coachInsightText}>{elbowTip}</Text>
      </View>

      {/* 2 Fast Telemetry Metric Pills */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>LEAD ELBOW</Text>
          <Text style={styles.metricCardValue}>{Math.round(leadElbowAngle)}°</Text>
          <Text style={styles.metricCardSub}>Target: 144° (98% Ideal)</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>POWER TRANSFER</Text>
          <Text style={styles.metricCardValue}>94%</Text>
          <Text style={styles.metricCardSub}>Exit Speed: 118 KM/H</Text>
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  verdictBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
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
    fontWeight: '900',
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
    fontSize: 9,
    fontWeight: '700',
  },
  scoreLabel: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  shotTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
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
    paddingVertical: 3.5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoPillText: {
    color: '#334155',
    fontSize: 10.5,
    fontWeight: '600',
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
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  coachInsightText: {
    color: '#0369a1',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricCardLabel: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricCardValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  metricCardSub: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
});
