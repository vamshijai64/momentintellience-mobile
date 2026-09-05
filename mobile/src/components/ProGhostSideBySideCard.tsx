import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { getProTargets } from '../config/proTargets';

interface ProGhostSideBySideCardProps {
  shotType?: string;
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
  spineAngle?: number;
  overallScore?: number;
}

type JointKey = 'ELBOW' | 'HEAD' | 'KNEE' | 'FORM';

function matchPct(player: number, ideal: number, tolerance: number) {
  const abs = Math.abs(player - ideal);
  const pct = Math.max(0, Math.min(100, Math.round(100 - (abs / tolerance) * 100)));
  return pct;
}

export const ProGhostSideBySideCard: React.FC<ProGhostSideBySideCardProps> = ({
  shotType = 'Cover drive',
  leadElbowAngle = 138,
  kneeFlexionAngle = 132,
  spineAngle,
  overallScore = 88,
}) => {
  const [selectedJoint, setSelectedJoint] = useState<JointKey>('ELBOW');

  const elbow = Math.round(leadElbowAngle);
  const knee = Math.round(kneeFlexionAngle);
  const form = Math.round(overallScore);
  const spine = typeof spineAngle === 'number' ? Math.round(spineAngle) : null;
  const PRO = { ...getProTargets(shotType), form: 100 };

  const jointDetails = useMemo(() => {
    const elbowMatch = matchPct(elbow, PRO.elbow, 25);
    const kneeMatch = matchPct(knee, PRO.knee, 30);
    const headMatch = spine != null ? matchPct(spine, 12, 18) : 90;
    const formMatch = Math.max(0, Math.min(100, form));

    return {
      ELBOW: {
        title: 'Lead elbow',
        playerVal: `${elbow}°`,
        proVal: `${PRO.elbow}°`,
        diff: `${elbowMatch}% match`,
        status: elbowMatch >= 80 ? 'good' : elbowMatch >= 60 ? 'close' : 'fix',
        advice:
          elbowMatch >= 80
            ? 'Elbow height is close to the pro model — keep guiding the bat face.'
            : elbow < PRO.elbow
              ? 'Lift the front elbow higher at contact to match pro form.'
              : 'Elbow is high — stay connected through the downswing.',
      },
      HEAD: {
        title: 'Head & stack',
        playerVal: spine != null ? `${spine}° tilt` : 'Stacked',
        proVal: 'Still / stacked',
        diff: `${headMatch}% match`,
        status: headMatch >= 80 ? 'good' : headMatch >= 60 ? 'close' : 'fix',
        advice:
          headMatch >= 80
            ? 'Head position is stable over the front side.'
            : 'Keep the head still and over the front foot through the hit.',
      },
      KNEE: {
        title: 'Front knee',
        playerVal: `${knee}°`,
        proVal: `${PRO.knee}°`,
        diff: `${kneeMatch}% match`,
        status: kneeMatch >= 80 ? 'good' : kneeMatch >= 60 ? 'close' : 'fix',
        advice:
          kneeMatch >= 80
            ? 'Front knee flexion matches a solid pro stride.'
            : knee < PRO.knee
              ? 'Bend the front knee more to load the front side.'
              : 'Knee is deep — brace without collapsing inward.',
      },
      FORM: {
        title: 'Overall form',
        playerVal: `${form}`,
        proVal: `${PRO.form}`,
        diff: `${formMatch}% match`,
        status: formMatch >= 80 ? 'good' : formMatch >= 65 ? 'close' : 'fix',
        advice:
          formMatch >= 80
            ? 'Strong overall shape vs pro — polish the weakest joint next.'
            : 'Prioritize the Fix rows to close the gap with the pro model.',
      },
    } as const;
  }, [elbow, knee, spine, form, PRO.elbow, PRO.knee, PRO.form]);

  const currentInfo = jointDetails[selectedJoint];
  const syncScore = Math.round(
    (matchPct(elbow, PRO.elbow, 25) + matchPct(knee, PRO.knee, 30) + form) / 3
  );

  const statusColor =
    currentInfo.status === 'good' ? '#15803d' : currentInfo.status === 'close' ? '#b45309' : '#b91c1c';
  const statusBg =
    currentInfo.status === 'good' ? '#dcfce7' : currentInfo.status === 'close' ? '#fef3c7' : '#fee2e2';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerEyebrow}>Player vs pro</Text>
          <Text style={styles.headerTitle}>Pose comparison</Text>
          <Text style={styles.headerSub}>{shotType}</Text>
        </View>
        <View style={styles.scorePill}>
          <Text style={styles.scorePillText}>{syncScore}%</Text>
          <Text style={styles.scorePillSub}>sync</Text>
        </View>
      </View>

      <View style={styles.dualFigureBox}>
        <View style={styles.figureColumn}>
          <View style={styles.figureHeader}>
            <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.figureTitle}>You</Text>
          </View>
          <View style={styles.stickContainer}>
            <View style={[styles.headNode, styles.headPlayer]} />
            <View style={[styles.torsoLine, styles.torsoPlayer]} />
            <View style={[styles.leadArmUpper, styles.armPlayer]} />
            <View style={[styles.leadArmForearm, styles.armPlayer]} />
            <View style={[styles.batLine, styles.batPlayer]} />
            <View style={[styles.frontThigh, styles.legPlayer]} />
            <View style={[styles.frontShin, styles.legPlayer]} />
            <View style={[styles.backLeg, styles.legPlayer]} />
            <View style={styles.plumbLine} />
            <View style={[styles.jointCallout, { top: 38, left: -6 }]}>
              <Text style={styles.jointCalloutText}>{elbow}°</Text>
            </View>
          </View>
          <Text style={styles.figureScoreText}>Form {form}</Text>
        </View>

        <View style={styles.vsDivider}>
          <View style={styles.vsLine} />
          <View style={styles.vsBadge}>
            <Text style={styles.vsBadgeText}>VS</Text>
          </View>
          <View style={styles.vsLine} />
        </View>

        <View style={styles.figureColumn}>
          <View style={styles.figureHeader}>
            <View style={[styles.statusDot, { backgroundColor: '#fbbf24' }]} />
            <Text style={[styles.figureTitle, { color: '#fbbf24' }]}>Pro</Text>
          </View>
          <View style={styles.stickContainer}>
            <View style={[styles.headNode, styles.headPro]} />
            <View style={[styles.torsoLine, styles.torsoPro]} />
            <View style={[styles.leadArmUpper, styles.armPro]} />
            <View style={[styles.leadArmForearm, styles.armPro]} />
            <View style={[styles.batLine, styles.batPro]} />
            <View style={[styles.frontThigh, styles.legPro]} />
            <View style={[styles.frontShin, styles.legPro]} />
            <View style={[styles.backLeg, styles.legPro]} />
            <View style={[styles.plumbLine, { borderColor: '#fbbf24' }]} />
            <View style={[styles.jointCallout, styles.jointCalloutPro, { top: 38, left: -6 }]}>
              <Text style={[styles.jointCalloutText, { color: '#422006' }]}>{PRO.elbow}° tgt</Text>
            </View>
          </View>
          <Text style={[styles.figureScoreText, { color: '#fbbf24' }]}>Target 100</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {(
          [
            { key: 'ELBOW', label: 'Elbow' },
            { key: 'HEAD', label: 'Head' },
            { key: 'KNEE', label: 'Knee' },
            { key: 'FORM', label: 'Form' },
          ] as const
        ).map((tab) => {
          const isActive = selectedJoint === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setSelectedJoint(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.detailBox}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{currentInfo.title}</Text>
          <View style={[styles.matchPill, { backgroundColor: statusBg }]}>
            <Text style={[styles.matchPillText, { color: statusColor }]}>{currentInfo.diff}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLabel}>You</Text>
            <Text style={styles.metricItemValGreen}>{currentInfo.playerVal}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLabel}>Pro target</Text>
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
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 10,
  },
  headerEyebrow: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  headerSub: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  scorePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    alignItems: 'center',
  },
  scorePillText: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: '800',
  },
  scorePillSub: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '600',
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
    fontSize: 13,
    fontWeight: '700',
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
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  jointCalloutPro: {
    backgroundColor: '#fbbf24',
  },
  jointCalloutText: {
    color: '#022c22',
    fontSize: 10,
    fontWeight: '800',
  },
  figureScoreText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
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
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginVertical: 4,
  },
  vsBadgeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingVertical: 8,
    borderRadius: 9,
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
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#7dd3fc',
    fontWeight: '700',
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
    fontSize: 14,
    fontWeight: '700',
  },
  matchPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  matchPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  metricItem: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    padding: 10,
    borderRadius: 8,
  },
  metricItemLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  metricItemValGreen: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: '800',
  },
  metricItemValGold: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '800',
  },
  adviceText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
});
