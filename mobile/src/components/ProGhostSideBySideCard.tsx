import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

interface ProGhostSideBySideCardProps {
  shotType?: string;
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
  overallScore?: number;
}

export const ProGhostSideBySideCard: React.FC<ProGhostSideBySideCardProps> = ({
  shotType = 'COVER DRIVE',
  leadElbowAngle = 138,
  kneeFlexionAngle = 132,
  overallScore = 88,
}) => {
  const [selectedJoint, setSelectedJoint] = useState<'ELBOW' | 'HEAD' | 'KNEE' | 'BAT'>('ELBOW');

  const jointDetails = {
    ELBOW: {
      title: 'HIGH LEAD ELBOW',
      playerVal: `${Math.round(leadElbowAngle)}°`,
      proVal: '140° (Ideal)',
      diff: '98% Match',
      advice: 'High front elbow points directly along the cover drive corridor, ensuring bat face control.',
    },
    HEAD: {
      title: 'HEAD-OVER-KNEE PLUMB LINE',
      playerVal: 'Stacked (0.08)',
      proVal: '0.00 (Locked)',
      diff: '100% Match',
      advice: 'Head is vertically stacked over the lead knee, transferring 100% of body momentum into the drive.',
    },
    KNEE: {
      title: 'FRONT KNEE FLEXION',
      playerVal: `${Math.round(kneeFlexionAngle)}°`,
      proVal: '135° (Ideal)',
      diff: '97% Match',
      advice: 'Deep, stable front-knee bend creates a solid foundation to strike the ball on the up.',
    },
    BAT: {
      title: 'BAT-SWING PLANE',
      playerVal: '47° (Off-Drive)',
      proVal: '45°–55°',
      diff: '99% Match',
      advice: 'Smooth diagonal downswing plane accelerating through the cover boundary.',
    },
  };

  const currentInfo = jointDetails[selectedJoint];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerEyebrow}>SIDE-BY-SIDE VISUAL AUDIT</Text>
          <Text style={styles.headerTitle}>YOUR POSE VS PRO MASTERCLASS</Text>
        </View>
        <View style={styles.scorePill}>
          <Text style={styles.scorePillText}>97.4% SYNC</Text>
        </View>
      </View>

      {/* Visual Dual Figures Display */}
      <View style={styles.dualFigureBox}>
        {/* Left: Player Impact Silhouette */}
        <View style={styles.figureColumn}>
          <View style={styles.figureHeader}>
            <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.figureTitle}>YOUR STROKE</Text>
          </View>

          {/* Player Posture Graphic */}
          <View style={styles.stickContainer}>
            {/* Head */}
            <View style={[styles.headNode, styles.headPlayer]} />
            {/* Torso */}
            <View style={[styles.torsoLine, styles.torsoPlayer]} />
            {/* Lead Arm & Elbow */}
            <View style={[styles.leadArmUpper, styles.armPlayer]} />
            <View style={[styles.leadArmForearm, styles.armPlayer]} />
            {/* Bat */}
            <View style={[styles.batLine, styles.batPlayer]} />
            {/* Front Leg */}
            <View style={[styles.frontThigh, styles.legPlayer]} />
            <View style={[styles.frontShin, styles.legPlayer]} />
            {/* Back Leg */}
            <View style={[styles.backLeg, styles.legPlayer]} />
            {/* Plumb Line */}
            <View style={styles.plumbLine} />

            {/* Joint Callout Badge */}
            <View style={[styles.jointCallout, { top: 38, left: -6 }]}>
              <Text style={styles.jointCalloutText}>{Math.round(leadElbowAngle)}°</Text>
            </View>
          </View>

          <Text style={styles.figureScoreText}>Technique: {overallScore}%</Text>
        </View>

        {/* Center VS Divider */}
        <View style={styles.vsDivider}>
          <View style={styles.vsLine} />
          <View style={styles.vsBadge}>
            <Text style={styles.vsBadgeText}>VS</Text>
          </View>
          <View style={styles.vsLine} />
        </View>

        {/* Right: Gold Pro Benchmark Model */}
        <View style={styles.figureColumn}>
          <View style={styles.figureHeader}>
            <View style={[styles.statusDot, { backgroundColor: '#fbbf24' }]} />
            <Text style={[styles.figureTitle, { color: '#fbbf24' }]}>PRO BENCHMARK</Text>
          </View>

          {/* Pro Posture Graphic */}
          <View style={styles.stickContainer}>
            {/* Head */}
            <View style={[styles.headNode, styles.headPro]} />
            {/* Torso */}
            <View style={[styles.torsoLine, styles.torsoPro]} />
            {/* Lead Arm & Elbow */}
            <View style={[styles.leadArmUpper, styles.armPro]} />
            <View style={[styles.leadArmForearm, styles.armPro]} />
            {/* Bat */}
            <View style={[styles.batLine, styles.batPro]} />
            {/* Front Leg */}
            <View style={[styles.frontThigh, styles.legPro]} />
            <View style={[styles.frontShin, styles.legPro]} />
            {/* Back Leg */}
            <View style={[styles.backLeg, styles.legPro]} />
            {/* Plumb Line */}
            <View style={[styles.plumbLine, { borderColor: '#fbbf24' }]} />

            {/* Joint Callout Badge */}
            <View style={[styles.jointCallout, styles.jointCalloutPro, { top: 38, left: -6 }]}>
              <Text style={[styles.jointCalloutText, { color: '#022c22' }]}>140°</Text>
            </View>
          </View>

          <Text style={[styles.figureScoreText, { color: '#fbbf24' }]}>Pro Benchmark: 100%</Text>
        </View>
      </View>

      {/* Interactive Checkpoint Selector Tabs */}
      <View style={styles.tabsRow}>
        {(['ELBOW', 'HEAD', 'KNEE', 'BAT'] as const).map((key) => {
          const isActive = selectedJoint === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setSelectedJoint(key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {key === 'ELBOW' ? '🦾 Elbow' : key === 'HEAD' ? '🎯 Head' : key === 'KNEE' ? '🦵 Knee' : '🏏 Bat'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Checkpoint Detail Box */}
      <View style={styles.detailBox}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{currentInfo.title}</Text>
          <View style={styles.matchPill}>
            <Text style={styles.matchPillText}>{currentInfo.diff}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLabel}>YOU</Text>
            <Text style={styles.metricItemValGreen}>{currentInfo.playerVal}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLabel}>PRO TARGET</Text>
            <Text style={styles.metricItemValGold}>{currentInfo.proVal}</Text>
          </View>
        </View>

        <Text style={styles.adviceText}>{currentInfo.advice}</Text>
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
  headerEyebrow: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  scorePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  scorePillText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '900',
  },
  dualFigureBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  figureColumn: {
    flex: 1,
    alignItems: 'center',
  },
  figureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  figureTitle: {
    color: '#34d399',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  stickContainer: {
    width: 100,
    height: 120,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headNode: {
    position: 'absolute',
    top: 4,
    left: 42,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  headPlayer: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.3)' },
  headPro: { borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.3)' },
  torsoLine: {
    position: 'absolute',
    top: 18,
    left: 48,
    width: 3,
    height: 38,
    borderRadius: 1.5,
  },
  torsoPlayer: { backgroundColor: '#10b981' },
  torsoPro: { backgroundColor: '#fbbf24' },
  leadArmUpper: {
    position: 'absolute',
    top: 22,
    left: 28,
    width: 22,
    height: 3,
    borderRadius: 1.5,
    transform: [{ rotate: '-35deg' }],
  },
  leadArmForearm: {
    position: 'absolute',
    top: 32,
    left: 20,
    width: 22,
    height: 3,
    borderRadius: 1.5,
    transform: [{ rotate: '45deg' }],
  },
  armPlayer: { backgroundColor: '#34d399' },
  armPro: { backgroundColor: '#fbbf24' },
  batLine: {
    position: 'absolute',
    top: 40,
    left: 12,
    width: 4,
    height: 48,
    borderRadius: 2,
    transform: [{ rotate: '38deg' }],
  },
  batPlayer: { backgroundColor: '#38bdf8' },
  batPro: { backgroundColor: '#fef08a' },
  frontThigh: {
    position: 'absolute',
    top: 54,
    left: 32,
    width: 24,
    height: 3.5,
    borderRadius: 2,
    transform: [{ rotate: '-32deg' }],
  },
  frontShin: {
    position: 'absolute',
    top: 72,
    left: 24,
    width: 3.5,
    height: 38,
    borderRadius: 2,
  },
  backLeg: {
    position: 'absolute',
    top: 54,
    left: 48,
    width: 36,
    height: 3.5,
    borderRadius: 2,
    transform: [{ rotate: '35deg' }],
  },
  legPlayer: { backgroundColor: '#f97316' },
  legPro: { backgroundColor: '#f59e0b' },
  plumbLine: {
    position: 'absolute',
    top: 18,
    left: 48,
    width: 1,
    height: 92,
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#10b981',
    opacity: 0.6,
  },
  jointCallout: {
    position: 'absolute',
    backgroundColor: '#10b981',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  jointCalloutPro: {
    backgroundColor: '#fbbf24',
  },
  jointCalloutText: {
    color: '#022c22',
    fontSize: 8.5,
    fontWeight: '900',
  },
  figureScoreText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  vsDivider: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsLine: {
    flex: 1,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  vsBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginVertical: 4,
  },
  vsBadgeText: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#38bdf8',
    fontWeight: '900',
  },
  detailBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  matchPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  matchPillText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  metricItem: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    padding: 8,
    borderRadius: 6,
  },
  metricItemLabel: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricItemValGreen: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '900',
  },
  metricItemValGold: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '900',
  },
  adviceText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 15,
  },
});
