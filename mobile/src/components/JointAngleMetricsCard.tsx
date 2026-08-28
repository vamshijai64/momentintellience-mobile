import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';

interface JointMetric {
  name: string;
  angle: number;
  idealRange: string;
  status: 'CORRECT' | 'MODERATE' | 'INCORRECT';
  recommendation?: string;
}

interface JointAngleMetricsCardProps {
  metrics: JointMetric[];
  overallScore?: number;
  shotType?: string;
  flawSummary?: string;
  scores?: {
    stability: number;
    balance: number;
    symmetry: number;
    mobility: number;
  };
  observations?: string[];
  recommendations?: string[];
}

const STATUS_THEME = {
  CORRECT: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: '#10b981', label: 'IDEAL' },
  MODERATE: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: '#f59e0b', label: 'ADJUST' },
  INCORRECT: { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171', border: '#ef4444', label: 'OFF TARGET' },
} as const;

export const JointAngleMetricsCard: React.FC<JointAngleMetricsCardProps> = ({
  metrics,
  overallScore = 88.5,
  shotType = 'COVER DRIVE',
  flawSummary = 'High front elbow posture and solid stance balance.',
  scores = { stability: 85, balance: 90, symmetry: 88, mobility: 92 },
  observations = [],
  recommendations = [],
}) => {
  const scoreColor = overallScore >= 80 ? '#34d399' : overallScore >= 60 ? '#fbbf24' : '#f87171';

  const scoreItems = [
    { label: 'STABILITY', value: scores.stability },
    { label: 'BALANCE', value: scores.balance },
    { label: 'SYMMETRY', value: scores.symmetry },
    { label: 'MOBILITY', value: scores.mobility },
  ];

  return (
    <View style={styles.cardContainer}>
      {/* Top Header Summary */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.shotBadgeTitle}>SHOT DETECTED</Text>
          <Text style={styles.shotTypeTitle} numberOfLines={1}>{shotType}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreNumber, { color: scoreColor }]}>{overallScore.toFixed(0)}%</Text>
          <Text style={styles.scoreLabel}>BIOMECHANIC FORM</Text>
        </View>
      </View>

      {/* 4-Factor Movement Analytics Score Cards Grid */}
      <Text style={styles.sectionTitle}>MOVEMENT KINEMATIC SCORES</Text>
      <View style={styles.scoresGrid}>
        {scoreItems.map((item) => {
          const color = item.value >= 80 ? '#34d399' : item.value >= 55 ? '#fbbf24' : '#f87171';
          return (
            <View key={item.label} style={styles.scoreCard}>
              <Text style={styles.scoreCardLabel}>{item.label}</Text>
              <Text style={[styles.scoreCardVal, { color }]}>{item.value.toFixed(0)}%</Text>
              <View style={styles.scoreCardTrack}>
                <View style={[styles.scoreCardFill, { width: `${Math.min(100, Math.max(0, item.value))}%`, backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Technique Flaw Alert Banner if needed */}
      {flawSummary ? (
        <View style={styles.flawBanner}>
          <Text style={styles.flawTitle}>COACH STANCE AUDIT</Text>
          <Text style={styles.flawText}>{flawSummary}</Text>
        </View>
      ) : null}

      {/* Human Coach Practice Drills / Recommendations Box */}
      <View style={styles.drillsContainer}>
        <Text style={styles.drillsHeader}>RECOMMENDED PRACTICE DRILLS</Text>
        {recommendations.length > 0 ? (
          recommendations.map((rec, i) => (
            <View key={i} style={styles.drillItem}>
              <View style={styles.drillBulletCircle}>
                <Text style={styles.drillBullet}>🏏</Text>
              </View>
              <Text style={styles.drillText}>{rec}</Text>
            </View>
          ))
        ) : (
          <>
            <View style={styles.drillItem}>
              <View style={styles.drillBulletCircle}>
                <Text style={styles.drillBullet}>🏏</Text>
              </View>
              <Text style={styles.drillText}>
                <Text style={styles.drillBold}>Tennis Ball Under Chin: </Text>
                Hold a tennis ball under chin during backlift and drop it at impact to lock head over ball.
              </Text>
            </View>
            <View style={styles.drillItem}>
              <View style={styles.drillBulletCircle}>
                <Text style={styles.drillBullet}>🏏</Text>
              </View>
              <Text style={styles.drillText}>
                <Text style={styles.drillBold}>Mirror Shadow Drives: </Text>
                Practice 20 shadow drives in front of a mirror, holding the lead elbow high toward mid-off.
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Metrics List */}
      <Text style={styles.sectionTitle}>JOINT KINEMATIC MEASUREMENTS</Text>
      <View style={styles.metricsList}>
        {metrics.map((item: JointMetric, index: number) => {
          const theme = STATUS_THEME[item.status];
          return (
            <View key={index} style={styles.metricRow}>
              <View style={[styles.metricAccent, { backgroundColor: theme.border }]} />
              <View style={styles.metricInfo}>
                <Text style={styles.metricName}>{item.name}</Text>
                <Text style={styles.idealRangeText}>Target {item.idealRange}</Text>
              </View>

              <View style={styles.valueContainer}>
                <Text style={[styles.angleValue, { color: theme.text }]}>
                  {item.angle.toFixed(0)}°
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={[styles.statusText, { color: theme.text }]}>{theme.label}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  shotBadgeTitle: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  shotTypeTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: '800',
  },
  scoreLabel: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 12,
  },
  metricsList: {
    gap: 10,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.06)',
    padding: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  metricAccent: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
  },
  idealRangeText: {
    color: '#94a3b8',
    fontSize: 11.5,
    marginTop: 3,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  angleValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  flawBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  flawTitle: {
    color: '#f87171',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  flawText: {
    color: '#fca5a5',
    fontSize: 13,
    marginTop: 5,
    lineHeight: 18,
  },
  drillsContainer: {
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
  },
  drillsHeader: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  drillItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  drillBulletCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  drillBullet: {
    fontSize: 11,
  },
  drillText: {
    color: '#cbd5e1',
    fontSize: 12.5,
    flex: 1,
    lineHeight: 18,
  },
  drillBold: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scoresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.06)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  scoreCardLabel: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  scoreCardVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 5,
  },
  scoreCardTrack: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 8,
    overflow: 'hidden',
  },
  scoreCardFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});
