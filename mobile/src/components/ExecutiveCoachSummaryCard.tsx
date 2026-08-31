import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';

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
  const outcomeText = isGood ? 'BOUNDARY (4 RUNS)' : 'GROUNDED STROKE (1-2 RUNS)';
  const proStyleName = 'ELITE MASTERCLASS DRIVE';
  const elbowDiff = Math.abs(144 - Math.round(leadElbowAngle));
  const elbowFix = leadElbowAngle >= 140 ? 'MAINTAIN HIGH ELBOW' : `LIFT LEAD ELBOW +${elbowDiff}°`;

  return (
    <View style={styles.container}>
      {/* Top Gold Pill Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandGroup}>
          <Text style={styles.starIcon}>🌟</Text>
          <Text style={styles.headerTitle}>AI COACH EXECUTIVE TAKEAWAY</Text>
        </View>
        <View style={[styles.verdictPill, isGood ? styles.verdictPillGood : styles.verdictPillAvg]}>
          <Text style={[styles.verdictPillText, isGood ? styles.verdictGoodText : styles.verdictAvgText]}>
            {verdict.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {/* Main Plain English Summary */}
      <Text style={styles.summaryHeadline}>
        "Clean {shotType} accelerated through the {shotDirectionLabel} boundary! Head balance was locked over the ball, with solid front-foot commitment."
      </Text>

      {/* 3 Core Client Pillars */}
      <View style={styles.pillarsRow}>
        {/* Pillar 1: Shot Outcome */}
        <View style={[styles.pillarCard, styles.pillarBorderCyan]}>
          <Text style={styles.pillarIcon}>🎯</Text>
          <Text style={styles.pillarCategory}>SHOT OUTCOME</Text>
          <Text style={styles.pillarBigVal}>{outcomeText}</Text>
          <Text style={styles.pillarSub}>Through {shotDirectionLabel} ({Math.round(shotDirectionDeg)}°)</Text>
        </View>

        {/* Pillar 2: #1 Posture Fix */}
        <View style={[styles.pillarCard, styles.pillarBorderAmber]}>
          <Text style={styles.pillarIcon}>🦾</Text>
          <Text style={styles.pillarCategory}>#1 POSTURE FIX</Text>
          <Text style={styles.pillarBigValAmber}>{elbowFix}</Text>
          <Text style={styles.pillarSub}>At Impact: {Math.round(leadElbowAngle)}° (Ideal: 144°)</Text>
        </View>

        {/* Pillar 3: Pro Benchmark */}
        <View style={[styles.pillarCard, styles.pillarBorderGreen]}>
          <Text style={styles.pillarIcon}>👑</Text>
          <Text style={styles.pillarCategory}>PRO BENCHMARK</Text>
          <Text style={styles.pillarBigValGreen}>{Math.round(score)}% MATCH</Text>
          <Text style={styles.pillarSub}>{proStyleName}</Text>
        </View>
      </View>

      {/* Bottom 1-Tap Quick Action Row */}
      {onOpenScorecard && (
        <TouchableOpacity style={styles.quickShareBar} onPress={onOpenScorecard} activeOpacity={0.8}>
          <Text style={styles.quickShareText}>📤 TAP TO EXPORT OFFICIAL MATCH SCORECARD</Text>
          <Text style={styles.quickShareArrow}>➔</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a1224',
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    ...Platform.select({
      ios: { shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starIcon: {
    fontSize: 16,
  },
  headerTitle: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  verdictPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verdictPillGood: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  verdictPillAvg: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  verdictPillText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  verdictGoodText: {
    color: '#34d399',
  },
  verdictAvgText: {
    color: '#fbbf24',
  },
  summaryHeadline: {
    color: '#f8fafc',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 14,
  },
  pillarsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillarCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  pillarBorderCyan: {
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  pillarBorderAmber: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  pillarBorderGreen: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  pillarIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  pillarCategory: {
    color: '#94a3b8',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  pillarBigVal: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 14,
  },
  pillarBigValAmber: {
    color: '#fbbf24',
    fontSize: 10.5,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 14,
  },
  pillarBigValGreen: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 14,
  },
  pillarSub: {
    color: '#64748b',
    fontSize: 7.5,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  quickShareBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  quickShareText: {
    color: '#38bdf8',
    fontSize: 9.5,
    fontWeight: '800',
  },
  quickShareArrow: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '900',
  },
});
