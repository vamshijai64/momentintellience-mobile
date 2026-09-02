import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { FlameHeatIcon, ImpactPointIcon, GlassIconBadge } from './icons/AppIcons';

interface BatImpactHeatmapViewProps {
  sweetSpotRatio?: number; // 0.0 - 1.0 (e.g. 0.92 for center)
  exitVelocityKmh?: number; // e.g. 118
  shotDistanceMeters?: number; // e.g. 74
  shotType?: string;
}

export const BatImpactHeatmapView: React.FC<BatImpactHeatmapViewProps> = ({
  sweetSpotRatio = 0.94,
  exitVelocityKmh = 118,
  shotDistanceMeters = 74,
  shotType = 'COVER DRIVE',
}) => {
  const isSweet = sweetSpotRatio >= 0.85;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <GlassIconBadge bg="#e0f2fe" borderColor="#bae6fd" size={36}>
            <FlameHeatIcon size={20} color="#0284c7" />
          </GlassIconBadge>
          <View>
            <Text style={styles.title}>3D BAT FACE SWEET-SPOT HEATMAP</Text>
            <Text style={styles.subtitle}>Impact Dynamics & Ball Exit Telemetry</Text>
          </View>
        </View>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>{isSweet ? 'SWEET-SPOT' : 'EDGE ZONE'}</Text>
        </View>
      </View>

      {/* Main Visual: 3D Bat Face with Thermal Gradient */}
      <View style={styles.visualRow}>
        {/* The 3D Bat Graphic */}
        <View style={styles.batContainer}>
          {/* Bat Handle */}
          <View style={styles.batHandle}>
            <View style={styles.gripLine} />
            <View style={styles.gripLine} />
            <View style={styles.gripLine} />
          </View>
          {/* Bat Shoulders */}
          <View style={styles.batShoulders} />
          {/* Bat Blade */}
          <View style={styles.batBlade}>
            {/* Upper Zone */}
            <View style={styles.bladeZoneUpper}>
              <Text style={styles.zoneText}>SPLICE</Text>
            </View>
            {/* Middle Sweet-Spot Thermal Ring */}
            <View style={styles.bladeZoneSweet}>
              <View style={styles.thermalRingOuter}>
                <View style={styles.thermalRingCore}>
                  <ImpactPointIcon size={12} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.sweetLabel}>MIDDLE SWEET-SPOT</Text>
            </View>
            {/* Toe Zone */}
            <View style={styles.bladeZoneToe}>
              <Text style={styles.zoneText}>TOE</Text>
            </View>
          </View>
        </View>

        {/* Telemetry Metrics Column */}
        <View style={styles.metricsCol}>
          {/* Exit Speed Metric */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>BALL EXIT SPEED</Text>
            <Text style={styles.metricBigSpeed}>{exitVelocityKmh} <Text style={styles.unitText}>KM/H</Text></Text>
            <Text style={styles.metricSub}>Optimal Off-Drive Acceleration</Text>
          </View>

          {/* Power Transfer Metric */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>POWER TRANSFER RATIO</Text>
            <Text style={styles.metricBigPower}>{Math.round(sweetSpotRatio * 100)}%</Text>
            <Text style={styles.metricSub}>Middle Blade Energy Efficiency</Text>
          </View>

          {/* Projected Distance */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>PROJECTED TRAJECTORY</Text>
            <Text style={styles.metricBigDist}>{shotDistanceMeters} <Text style={styles.unitText}>METERS</Text></Text>
            <Text style={styles.metricSub}>Grounded Cover Boundary (4 Runs)</Text>
          </View>
        </View>
      </View>

      {/* Bottom Summary Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <ImpactPointIcon size={14} color="#0284c7" />
          <Text style={styles.bottomText}>
            <Text style={styles.bottomBold}> Impact Quality:</Text> Ball struck the middle 3rd of the blade with full top-hand energy transmission.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flameIcon: {
    fontSize: 20,
  },
  title: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  badgePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  badgePillText: {
    color: '#15803d',
    fontSize: 9,
    fontWeight: '900',
  },
  visualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  batContainer: {
    width: 90,
    alignItems: 'center',
  },
  batHandle: {
    width: 14,
    height: 38,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#94a3b8',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  gripLine: {
    width: 12,
    height: 1.5,
    backgroundColor: '#64748b',
  },
  batShoulders: {
    width: 42,
    height: 10,
    backgroundColor: '#d97706',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  batBlade: {
    width: 52,
    height: 140,
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#d97706',
    overflow: 'hidden',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  bladeZoneUpper: {
    alignItems: 'center',
  },
  bladeZoneSweet: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.35)',
    width: '100%',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#10b981',
  },
  thermalRingOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(2, 132, 199, 0.35)',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thermalRingCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactCoreText: {
    fontSize: 10,
  },
  sweetLabel: {
    color: '#15803d',
    fontSize: 6.5,
    fontWeight: '900',
    marginTop: 2,
  },
  bladeZoneToe: {
    alignItems: 'center',
  },
  zoneText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 7,
    fontWeight: '800',
  },
  metricsCol: {
    flex: 1,
    gap: 8,
  },
  metricCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  metricBigSpeed: {
    color: '#0284c7',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  metricBigPower: {
    color: '#15803d',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  metricBigDist: {
    color: '#b45309',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  unitText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  metricSub: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '600',
    marginTop: 2,
  },
  bottomBar: {
    marginTop: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 9,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bottomText: {
    color: '#334155',
    fontSize: 10.5,
    lineHeight: 14,
    flex: 1,
  },
  bottomBold: {
    color: '#0284c7',
    fontWeight: '800',
  },
});
