import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface MetricRingItem {
  label: string;
  value: string;
  target: string;
  percent: number;
  color: string;
  status: string;
}

interface BroadcastTelemetryGaugesProps {
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
  overallScore?: number;
  headOffsetRatio?: number;
}

export const BroadcastTelemetryGauges: React.FC<BroadcastTelemetryGaugesProps> = ({
  leadElbowAngle = 138,
  kneeFlexionAngle = 132,
  overallScore = 88,
  headOffsetRatio = 0.08,
}) => {
  const rings: MetricRingItem[] = [
    {
      label: 'LEAD ELBOW',
      value: `${Math.round(leadElbowAngle)}°`,
      target: '140° Ideal',
      percent: leadElbowAngle >= 130 && leadElbowAngle <= 150 ? 98 : 82,
      color: '#34d399',
      status: 'HIGH & EXTENDED',
    },
    {
      label: 'HEAD STACK',
      value: headOffsetRatio < 0.15 ? '0.08' : '0.24',
      target: '< 0.15 Plumb',
      percent: headOffsetRatio < 0.15 ? 100 : 75,
      color: '#38bdf8',
      status: 'LOCKED OVER KNEE',
    },
    {
      label: 'KNEE STRIDE',
      value: `${Math.round(kneeFlexionAngle)}°`,
      target: '135° Ideal',
      percent: kneeFlexionAngle >= 115 && kneeFlexionAngle <= 150 ? 96 : 80,
      color: '#fbbf24',
      status: 'DEEP FOUNDATION',
    },
    {
      label: 'POWER SYNC',
      value: `${Math.round(overallScore)}%`,
      target: '100% Pro Sync',
      percent: Math.min(100, Math.round(overallScore)),
      color: '#a78bfa',
      status: 'ELITE DRIVE',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>AI TELEMETRY GAUGES</Text>
          <Text style={styles.title}>BIOMECHANICAL ACCURACY</Text>
        </View>
        <View style={styles.badgeBox}>
          <Text style={styles.badgeText}>HAWK-EYE KINEMATICS</Text>
        </View>
      </View>

      {/* 4 Minimalist Neon Circular Metric Cards */}
      <View style={styles.gridRow}>
        {rings.map((ring, idx) => (
          <View key={idx} style={styles.gaugeCard}>
            {/* Circular Gauge Ring */}
            <View style={[styles.outerRing, { borderColor: `${ring.color}30` }]}>
              <View style={[styles.innerRing, { borderColor: ring.color }]}>
                <Text style={[styles.gaugeValue, { color: ring.color }]}>{ring.value}</Text>
                <Text style={styles.gaugeMatch}>{ring.percent}%</Text>
              </View>
            </View>

            {/* Label and Subtitle */}
            <Text style={styles.gaugeLabel}>{ring.label}</Text>
            <Text style={[styles.gaugeStatus, { color: ring.color }]}>{ring.status}</Text>
            <Text style={styles.gaugeTarget}>{ring.target}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a1224',
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  eyebrow: {
    color: '#38bdf8',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  badgeBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  badgeText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '800',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gaugeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  outerRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  innerRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
  },
  gaugeValue: {
    fontSize: 13.5,
    fontWeight: '900',
  },
  gaugeMatch: {
    color: '#94a3b8',
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 1,
  },
  gaugeLabel: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  gaugeStatus: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  gaugeTarget: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600',
  },
});
