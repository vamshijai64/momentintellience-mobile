import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

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

export const JointAngleMetricsCard: React.FC<JointAngleMetricsCardProps> = ({
  metrics,
  overallScore = 88.5,
  shotType = 'COVER DRIVE',
  flawSummary = 'High front elbow posture and solid stance balance.',
  scores = { stability: 85, balance: 90, symmetry: 88, mobility: 92 },
  observations = [],
  recommendations = [],
}) => {
  const getStatusColor = (status: 'CORRECT' | 'MODERATE' | 'INCORRECT') => {
    switch (status) {
      case 'CORRECT':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' };
      case 'MODERATE':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' };
      case 'INCORRECT':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: '#ef4444' };
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Top Header Summary */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.shotBadgeTitle}>SHOT DETECTED</Text>
          <Text style={styles.shotTypeTitle}>{shotType}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreNumber}>{overallScore.toFixed(0)}%</Text>
          <Text style={styles.scoreLabel}>BIOMECHANIC FORM</Text>
        </View>
      </View>

      {/* 4-Factor Movement Analytics Score Cards Grid */}
      <Text style={styles.sectionTitle}>4-FACTOR MOVEMENT KINEMATIC SCORES</Text>
      <View style={styles.scoresGrid}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreCardLabel}>STABILITY</Text>
          <Text style={[styles.scoreCardVal, { color: scores.stability >= 80 ? '#10b981' : '#f59e0b' }]}>
            {scores.stability.toFixed(0)}%
          </Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreCardLabel}>BALANCE</Text>
          <Text style={[styles.scoreCardVal, { color: scores.balance >= 80 ? '#10b981' : '#f59e0b' }]}>
            {scores.balance.toFixed(0)}%
          </Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreCardLabel}>SYMMETRY</Text>
          <Text style={[styles.scoreCardVal, { color: scores.symmetry >= 80 ? '#10b981' : '#f59e0b' }]}>
            {scores.symmetry.toFixed(0)}%
          </Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreCardLabel}>MOBILITY</Text>
          <Text style={[styles.scoreCardVal, { color: scores.mobility >= 80 ? '#10b981' : '#f59e0b' }]}>
            {scores.mobility.toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Technique Flaw Alert Banner if needed */}
      {flawSummary ? (
        <View style={styles.flawBanner}>
          <Text style={styles.flawTitle}>AI HUMAN COACH STANCE AUDIT & CORRECTION:</Text>
          <Text style={styles.flawText}>{flawSummary}</Text>
        </View>
      ) : null}

      {/* Human Coach Practice Drills / Recommendations Box */}
      <View style={styles.drillsContainer}>
        <Text style={styles.drillsHeader}>RECOMMENDED AI COACH PRACTICE DRILLS:</Text>
        {recommendations.length > 0 ? (
          recommendations.map((rec, i) => (
            <View key={i} style={styles.drillItem}>
              <Text style={styles.drillBullet}>🏏</Text>
              <Text style={styles.drillText}>{rec}</Text>
            </View>
          ))
        ) : (
          <>
            <View style={styles.drillItem}>
              <Text style={styles.drillBullet}>🏏</Text>
              <Text style={styles.drillText}>
                <Text style={styles.drillBold}>Tennis Ball Under Chin:</Text> Hold a tennis ball under chin during backlift and drop it at impact to lock head over ball.
              </Text>
            </View>
            <View style={styles.drillItem}>
              <Text style={styles.drillBullet}>🏏</Text>
              <Text style={styles.drillText}>
                <Text style={styles.drillBold}>Mirror Shadow Drives:</Text> Practice 20 shadow drives in front of mirror, holding lead elbow high towards mid-off.
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Metrics List */}
      <Text style={styles.sectionTitle}>JOINT KINEMATIC MEASUREMENTS</Text>
      {metrics.map((item: JointMetric, index: number) => {
        const theme = getStatusColor(item.status);
        return (
          <View key={index} style={[styles.metricRow, { borderColor: theme.border }]}>
            <View style={styles.metricInfo}>
              <Text style={styles.metricName}>{item.name}</Text>
              <Text style={styles.idealRangeText}>Target: {item.idealRange}</Text>
            </View>

            <View style={styles.valueContainer}>
              <Text style={[styles.angleValue, { color: theme.text }]}>
                {item.angle.toFixed(0)}°
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={[styles.statusText, { color: theme.text }]}>
                  {item.status === 'CORRECT' ? 'IDEAL [GREEN]' : item.status === 'INCORRECT' ? 'WRONG [RED]' : 'ADJUST'}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    paddingBottom: 12,
  },
  shotBadgeTitle: {
    color: '#0284c7',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  shotTypeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreNumber: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  flawBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 4,
    borderColor: '#ef4444',
    marginBottom: 14,
  },
  flawTitle: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  flawText: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    marginBottom: 8,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  idealRangeText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  angleValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  drillsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderColor: '#38bdf8',
  },
  drillsHeader: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  drillItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  drillBullet: {
    fontSize: 12,
    marginRight: 6,
  },
  drillText: {
    color: '#cbd5e1',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  drillBold: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  scoresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scoreCardLabel: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  scoreCardVal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
