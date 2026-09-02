import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface MetricComparison {
  name: string;
  playerValue: string;
  proTarget: string;
  matchScore: number;
  status: 'EXCELLENT' | 'GOOD' | 'ATTENTION';
  description: string;
}

interface ProComparisonRadarCardProps {
  overallScore?: number;
  shotType?: string;
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
  isHeadStacked?: boolean;
}

export const ProComparisonRadarCard: React.FC<ProComparisonRadarCardProps> = ({
  overallScore = 88,
  shotType = 'COVER DRIVE',
  leadElbowAngle = 138,
  kneeFlexionAngle = 132,
  isHeadStacked = true,
}) => {
  const comparisons: MetricComparison[] = [
    {
      name: 'High Lead Elbow',
      playerValue: `${Math.round(leadElbowAngle)}°`,
      proTarget: '135°–145°',
      matchScore: leadElbowAngle >= 130 && leadElbowAngle <= 150 ? 98 : 84,
      status: leadElbowAngle >= 130 && leadElbowAngle <= 150 ? 'EXCELLENT' : 'GOOD',
      description: 'Provides bat face control and keeps drive on the ground.',
    },
    {
      name: 'Head-Over-Knee Stack',
      playerValue: isHeadStacked ? 'Stacked (0.08)' : 'Drifted (0.24)',
      proTarget: '< 0.15 ratio',
      matchScore: isHeadStacked ? 100 : 75,
      status: isHeadStacked ? 'EXCELLENT' : 'ATTENTION',
      description: 'Transfers 100% of body weight directly behind the ball line.',
    },
    {
      name: 'Front Knee Stride Bend',
      playerValue: `${Math.round(kneeFlexionAngle)}°`,
      proTarget: '120°–145°',
      matchScore: kneeFlexionAngle >= 115 && kneeFlexionAngle <= 150 ? 96 : 80,
      status: kneeFlexionAngle >= 115 && kneeFlexionAngle <= 150 ? 'EXCELLENT' : 'GOOD',
      description: 'Stabilizes lower body foundation through impact.',
    },
    {
      name: 'Cover Drive Face Plane',
      playerValue: '52° (Off-Drive)',
      proTarget: '45°–60°',
      matchScore: 99,
      status: 'EXCELLENT',
      description: 'Pure diagonal swing-plane through Extra Cover.',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return '#10b981';
      case 'GOOD':
        return '#38bdf8';
      case 'ATTENTION':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>PRO-PLAYER BIOMECHANICAL AUDIT</Text>
          <Text style={styles.subtitle}>Benchmark: Elite International Technique</Text>
        </View>
        <View style={styles.scorePill}>
          <Text style={styles.scoreNumber}>{overallScore}%</Text>
          <Text style={styles.scoreLabel}>PRO MATCH</Text>
        </View>
      </View>

      <View style={styles.metricsList}>
        {comparisons.map((item, idx) => {
          const color = getStatusColor(item.status);
          return (
            <View key={idx} style={styles.metricItem}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricName}>{item.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${color}20`, borderColor: `${color}60` }]}>
                  <Text style={[styles.statusText, { color }]}>{item.status} ({item.matchScore}%)</Text>
                </View>
              </View>

              <View style={styles.valuesRow}>
                <View style={styles.valueBox}>
                  <Text style={styles.valueLabel}>YOUR FORM</Text>
                  <Text style={[styles.valueText, { color }]}>{item.playerValue}</Text>
                </View>
                <View style={styles.vsBox}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
                <View style={styles.valueBox}>
                  <Text style={styles.valueLabel}>PRO TARGET</Text>
                  <Text style={styles.targetText}>{item.proTarget}</Text>
                </View>
              </View>

              {/* Match Progress Bar */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${item.matchScore}%`, backgroundColor: color }]} />
              </View>

              <Text style={styles.descriptionText}>{item.description}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  scorePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
  },
  scoreNumber: {
    color: '#15803d',
    fontSize: 15,
    fontWeight: '900',
  },
  scoreLabel: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '800',
  },
  metricsList: {
    gap: 14,
  },
  metricItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricName: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueBox: {
    flex: 1,
  },
  vsBox: {
    paddingHorizontal: 12,
  },
  vsText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
  },
  valueLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '800',
  },
  targetText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  descriptionText: {
    color: '#334155',
    fontSize: 11,
    lineHeight: 15,
  },
});
