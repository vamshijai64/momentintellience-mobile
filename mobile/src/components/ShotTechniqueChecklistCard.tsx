import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';

export interface TechniqueCheckpoint {
  id: string;
  title: string;
  category: string;
  icon: string;
  actualValue: string;
  idealTarget: string;
  isPassed: boolean;
  statusText: string;
  coachingImpact: string;
  correctiveDrill: {
    title: string;
    description: string;
  };
}

interface ShotTechniqueChecklistCardProps {
  shotType?: string;
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
  spineAngle?: number;
  rearKneeAngle?: number;
  headOffsetRatio?: number;
  overallScore?: number;
}

export const ShotTechniqueChecklistCard: React.FC<ShotTechniqueChecklistCardProps> = ({
  shotType = 'COVER DRIVE',
  leadElbowAngle = 142,
  kneeFlexionAngle = 136,
  spineAngle = 128,
  rearKneeAngle = 104,
  headOffsetRatio = 0.08,
  overallScore = 88,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>('elbow');

  // Evaluate 4 Biomechanical Pillars
  const isHeadPassed = headOffsetRatio <= 0.12;
  const isElbowPassed = leadElbowAngle >= 110 && leadElbowAngle <= 155;
  const isKneePassed = kneeFlexionAngle >= 125 && kneeFlexionAngle <= 155;
  const isRearLegPassed = rearKneeAngle >= 120 && rearKneeAngle <= 165;

  const checkpoints: TechniqueCheckpoint[] = [
    {
      id: 'head',
      title: 'Head-Over-Ball Alignment',
      category: 'STANCE & EYE-LINE',
      icon: '👁️',
      actualValue: `+${headOffsetRatio}m Stacked`,
      idealTarget: '≤ 0.10m Offset',
      isPassed: isHeadPassed,
      statusText: isHeadPassed ? 'STACKED OVER IMPACT' : 'HEAD FALLING AWAY',
      coachingImpact: isHeadPassed
        ? 'Eyes locked level over ball impact corridor. Eliminates outside edge risk.'
        : 'Head tilted outside off-stump during downswing, pulling center-of-mass off target.',
      correctiveDrill: {
        title: 'Tennis Ball Under Chin',
        description: 'Tuck a tennis ball under your chin and drop it at contact to keep head still over the ball.',
      },
    },
    {
      id: 'elbow',
      title: 'High Lead Elbow Guide',
      category: 'DOWNSWING PLANE',
      icon: '💪',
      actualValue: `${leadElbowAngle}° Elevation`,
      idealTarget: '110° – 155°',
      isPassed: isElbowPassed,
      statusText: isElbowPassed ? 'HIGH ELBOW DRIVE' : 'ELBOW DROOP FLAW',
      coachingImpact: isElbowPassed
        ? 'Optimal pendulum swing guide. Keeps the bat vertical along the ground.'
        : 'Lead elbow drooped prematurely, forcing bottom hand to flick and scoop the ball in the air.',
      correctiveDrill: {
        title: 'Top-Hand Shadow Drive',
        description: 'Practice 20 shadow drives holding bat only with top hand, freezing with high elbow pointing to Cover.',
      },
    },
    {
      id: 'knee',
      title: 'Front Knee Weight Stride',
      category: 'WEIGHT TRANSFER',
      icon: '🦵',
      actualValue: `${kneeFlexionAngle}° Flexion`,
      idealTarget: '125° – 150°',
      isPassed: isKneePassed,
      statusText: isKneePassed ? '100% WEIGHT ON FRONT FOOT' : 'WEIGHT STUCK BACK',
      coachingImpact: isKneePassed
        ? 'Front knee bent firmly over the front toe, absorbing full forward kinetic drive.'
        : 'Front knee too straight or locked, causing loss of downswing momentum and reach.',
      correctiveDrill: {
        title: 'Crease Lunge Hold',
        description: 'Step into a deep front-foot drive lunge and hold posture for 3 seconds after every shot.',
      },
    },
    {
      id: 'rear_leg',
      title: 'Rear Leg Brace & Balance',
      category: 'BASE ROTATION',
      icon: '⚡',
      actualValue: `${rearKneeAngle}° Extension`,
      idealTarget: '120° – 165°',
      isPassed: isRearLegPassed,
      statusText: isRearLegPassed ? 'BRACED BACK LEG' : 'REAR LEG COLLAPSED',
      coachingImpact: isRearLegPassed
        ? 'Solid rear leg balance providing a stable kinetic anchor.'
        : 'Rear knee buckled inward, reducing stroke stability and power transfer.',
      correctiveDrill: {
        title: 'Back Toe Anchor Drill',
        description: 'Keep back heel raised on toe with back leg tall and extended through impact.',
      },
    },
  ];

  const passedCount = checkpoints.filter((c) => c.isPassed).length;
  const accuracyPct = Math.round((passedCount / checkpoints.length) * 100);

  const getAccuracyTheme = (pct: number) => {
    if (pct >= 75) return { color: '#10b981', bg: '#dcfce7', label: 'HIGH-ACCURACY STROKE' };
    if (pct >= 50) return { color: '#f59e0b', bg: '#fef3c7', label: 'MODERATE TECHNIQUE' };
    return { color: '#ef4444', bg: '#fee2e2', label: 'TECHNIQUE FLAW DETECTED' };
  };

  const theme = getAccuracyTheme(accuracyPct);

  return (
    <View style={styles.cardContainer}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.badgePill, { backgroundColor: theme.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: theme.color }]} />
            <Text style={[styles.badgeText, { color: theme.color }]}>{theme.label}</Text>
          </View>
          <Text style={styles.title}>4-PILLAR SHOT AUDIT</Text>
          <Text style={styles.subtitle}>{shotType} BIOMECHANICS</Text>
        </View>

        {/* Score Ring Summary */}
        <View style={[styles.scoreBox, { borderColor: theme.color }]}>
          <Text style={[styles.scoreValue, { color: theme.color }]}>
            {passedCount}/{checkpoints.length}
          </Text>
          <Text style={styles.scoreSub}>PASS</Text>
        </View>
      </View>

      {/* Progress Accuracy Meter */}
      <View style={styles.accuracyMeterBox}>
        <View style={styles.accuracyLabels}>
          <Text style={styles.accuracyTitle}>Technique Checklist Compliance</Text>
          <Text style={[styles.accuracyPctText, { color: theme.color }]}>{accuracyPct}%</Text>
        </View>
        <View style={styles.accuracyTrack}>
          <View
            style={[
              styles.accuracyFill,
              { width: `${accuracyPct}%`, backgroundColor: theme.color },
            ]}
          />
        </View>
      </View>

      {/* 4-Checkpoint Breakdown List */}
      <View style={styles.checklistContainer}>
        {checkpoints.map((item) => {
          const isExpanded = expandedId === item.id;
          const statusBg = item.isPassed ? '#f0fdf4' : '#fef2f2';
          const statusBorder = item.isPassed ? '#bbf7d0' : '#fecaca';
          const statusColor = item.isPassed ? '#15803d' : '#b91c1c';
          const iconSymbol = item.isPassed ? '✓' : '⚠';

          return (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                { backgroundColor: statusBg, borderColor: statusBorder },
              ]}
            >
              {/* Item Header Row (Tappable) */}
              <TouchableOpacity
                style={styles.itemHeader}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.iconCircle, { borderColor: statusColor, backgroundColor: item.isPassed ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={[styles.iconSymbol, { color: statusColor }]}>{iconSymbol}</Text>
                  </View>
                  <View style={styles.itemTextGroup}>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                  </View>
                </View>

                <View style={styles.itemRight}>
                  <Text style={[styles.itemActual, { color: statusColor }]}>{item.actualValue}</Text>
                  <Text style={styles.itemTarget}>Ideal: {item.idealTarget}</Text>
                </View>
              </TouchableOpacity>

              {/* Expandable Coach Insights & Prescription Drill */}
              {isExpanded && (
                <View style={styles.expandedSection}>
                  <View style={styles.divider} />
                  
                  {/* Coaching Diagnosis */}
                  <View style={styles.diagnosisBox}>
                    <Text style={styles.diagnosisLabel}>AI COACH EVALUATION:</Text>
                    <Text style={styles.diagnosisText}>{item.coachingImpact}</Text>
                  </View>

                  {/* Corrective Drill Prescription */}
                  <View style={[styles.drillBox, { borderColor: item.isPassed ? '#86efac' : '#fca5a5' }]}>
                    <View style={styles.drillHeader}>
                      <Text style={styles.drillIcon}>🏏</Text>
                      <Text style={styles.drillTitle}>RECOMMENDED DRILL: {item.correctiveDrill.title}</Text>
                    </View>
                    <Text style={styles.drillDesc}>{item.correctiveDrill.description}</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginVertical: 10,
    ...cardShadow,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
    marginBottom: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  title: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#0284c7',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 1,
  },
  scoreBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  scoreSub: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
    marginTop: -2,
  },
  accuracyMeterBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  accuracyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  accuracyTitle: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '700',
  },
  accuracyPctText: {
    fontSize: 12,
    fontWeight: '900',
  },
  accuracyTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  accuracyFill: {
    height: '100%',
    borderRadius: 3,
  },
  checklistContainer: {
    gap: 8,
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1.2,
    overflow: 'hidden',
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSymbol: {
    fontSize: 13,
    fontWeight: '900',
  },
  itemTextGroup: {
    flex: 1,
  },
  itemCategory: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itemTitle: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemActual: {
    fontSize: 12,
    fontWeight: '900',
  },
  itemTarget: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  expandedSection: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: 8,
  },
  diagnosisBox: {
    marginBottom: 8,
  },
  diagnosisLabel: {
    color: '#475569',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  diagnosisText: {
    color: '#1e293b',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  drillBox: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  drillIcon: {
    fontSize: 12,
  },
  drillTitle: {
    color: '#0284c7',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  drillDesc: {
    color: '#475569',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
  },
});
