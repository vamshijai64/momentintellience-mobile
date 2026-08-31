import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, Platform } from 'react-native';

interface ProGhostToggleCardProps {
  shotType?: string;
  leadElbowDelta?: string;
  headStackMatch?: string;
  strideMatch?: string;
}

export const ProGhostToggleCard: React.FC<ProGhostToggleCardProps> = ({
  shotType = 'COVER DRIVE',
  leadElbowDelta = '+3° (Ideal 140°)',
  headStackMatch = '100% (Locked)',
  strideMatch = '96% (Optimal Base)',
}) => {
  const [ghostEnabled, setGhostEnabled] = useState(true);

  return (
    <View style={styles.container}>
      {/* Header with Switch */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.ghostIcon}>👻</Text>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>PRO GHOST SKELETON MODEL</Text>
            <Text style={styles.subtitle}>Virat Kohli / Elite Benchmark Silhouette</Text>
          </View>
        </View>

        <View style={styles.switchBox}>
          <Text style={[styles.switchLabel, ghostEnabled && styles.switchLabelActive]}>
            {ghostEnabled ? 'ON' : 'OFF'}
          </Text>
          <Switch
            value={ghostEnabled}
            onValueChange={setGhostEnabled}
            trackColor={{ false: '#334155', true: '#059669' }}
            thumbColor={ghostEnabled ? '#34d399' : '#94a3b8'}
            style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] } : undefined}
          />
        </View>
      </View>

      {ghostEnabled && (
        <View style={styles.ghostContent}>
          {/* Top Sync Rating Bar */}
          <View style={styles.syncBanner}>
            <View style={styles.legendGroup}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Player Form</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#fbbf24' }]} />
                <Text style={styles.legendText}>Gold Pro Model</Text>
              </View>
            </View>

            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>97.4% SYNC</Text>
            </View>
          </View>

          {/* Clean Delta List */}
          <View style={styles.deltaCard}>
            <Text style={styles.deltaHeader}>POSTURE DELTA AUDIT</Text>

            <View style={styles.deltaRow}>
              <Text style={styles.deltaLabel}>Lead Elbow Arc</Text>
              <View style={styles.badgeGreen}>
                <Text style={styles.badgeGreenText}>{leadElbowDelta}</Text>
              </View>
            </View>

            <View style={styles.deltaRow}>
              <Text style={styles.deltaLabel}>Head-Over-Knee</Text>
              <View style={styles.badgeGold}>
                <Text style={styles.badgeGoldText}>{headStackMatch}</Text>
              </View>
            </View>

            <View style={styles.deltaRow}>
              <Text style={styles.deltaLabel}>Front Foot Stride</Text>
              <View style={styles.badgeGreen}>
                <Text style={styles.badgeGreenText}>{strideMatch}</Text>
              </View>
            </View>
          </View>

          {/* Subtitle Note */}
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              ✨ <Text style={{ color: '#fbbf24', fontWeight: '800' }}>Ghost Overlay Active:</Text> Superimposes international pro kinematics directly on your replay video.
            </Text>
          </View>
        </View>
      )}
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
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  ghostIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    color: '#fbbf24',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  switchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
  },
  switchLabelActive: {
    color: '#34d399',
  },
  ghostContent: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  syncBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  legendGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
  },
  syncBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  syncBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
  },
  deltaCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  deltaHeader: {
    color: '#38bdf8',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  deltaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deltaLabel: {
    color: '#e2e8f0',
    fontSize: 11.5,
    fontWeight: '600',
  },
  badgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeGreenText: {
    color: '#34d399',
    fontSize: 10.5,
    fontWeight: '800',
  },
  badgeGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  badgeGoldText: {
    color: '#fbbf24',
    fontSize: 10.5,
    fontWeight: '800',
  },
  noteBox: {
    marginTop: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 8,
    padding: 9,
  },
  noteText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 15,
  },
});
