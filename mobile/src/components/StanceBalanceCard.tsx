import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';

interface CoachingCue {
  ok?: boolean;
  cue?: string;
  bottom?: string;
  bubble?: string;
  head_still_ok?: boolean;
  head_over_foot_ok?: boolean;
  knee_ok?: boolean;
  balance_ok?: boolean;
}

interface StanceBalanceCardProps {
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
  rearKneeAngle?: number;
  spineAngle?: number;
  headOffsetRatio?: number;
  shotType?: string;
  coachingCue?: CoachingCue | null;
}

type CheckStatus = 'OK' | 'FIX';

const CheckRow = ({
  title,
  detail,
  status,
}: {
  title: string;
  detail: string;
  status: CheckStatus;
}) => {
  const ok = status === 'OK';
  return (
    <View style={styles.row}>
      <View style={[styles.badge, ok ? styles.badgeOk : styles.badgeFix]}>
        <Text style={styles.badgeText}>{ok ? 'OK' : 'FIX'}</Text>
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDetail}>{detail}</Text>
      </View>
    </View>
  );
};

export const StanceBalanceCard: React.FC<StanceBalanceCardProps> = ({
  leadElbowAngle = 140,
  kneeFlexionAngle = 136,
  rearKneeAngle = 145,
  spineAngle,
  headOffsetRatio,
  shotType = 'SHOT',
  coachingCue,
}) => {
  const headOk = coachingCue
    ? coachingCue.head_still_ok !== false && coachingCue.head_over_foot_ok !== false
    : headOffsetRatio != null
      ? headOffsetRatio <= 0.12
      : true;
  const stanceOk = coachingCue?.knee_ok != null
    ? coachingCue.knee_ok
    : kneeFlexionAngle >= 120 && kneeFlexionAngle <= 170;
  const balanceOk = coachingCue?.balance_ok != null
    ? coachingCue.balance_ok
    : spineAngle != null
      ? spineAngle <= 18
      : true;
  const rearOk = rearKneeAngle >= 120 && rearKneeAngle <= 175;

  const passCount = [headOk, stanceOk, balanceOk, rearOk].filter(Boolean).length;
  const standingOk = coachingCue?.ok != null ? coachingCue.ok : passCount >= 3;

  const tip = coachingCue?.bottom
    || (!headOk
      ? 'Move the head over the marked foot and keep it still while you watch the ball.'
      : !stanceOk
        ? 'Bend the front knee a little more so the base stays stable.'
        : !balanceOk
          ? 'Keep the shoulders stacked over the hips. Do not fall to one side.'
          : 'Stance and balance look solid. Repeat this setup.');

  const headDetail = coachingCue
    ? (!coachingCue.head_still_ok
      ? 'Head moved at the hit'
      : !coachingCue.head_over_foot_ok
        ? 'Head is not over the marked foot'
        : 'Head is stacked over the marked foot')
    : (headOk ? 'Head is stacked over the marked foot' : 'Head is not over the marked foot');

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Stance & balance</Text>
      <Text style={[styles.headline, standingOk ? styles.headlineOk : styles.headlineFix]}>
        {standingOk ? 'Standing correctly' : 'Needs a small fix'}
      </Text>
      <Text style={styles.sub}>
        {shotType} · {passCount}/4 checks passed
      </Text>

      <CheckRow
        title="Head"
        detail={headDetail}
        status={headOk ? 'OK' : 'FIX'}
      />
      <CheckRow
        title="Stance"
        detail={stanceOk ? 'Front knee is ready and stable' : 'Front knee is too straight or collapsed'}
        status={stanceOk ? 'OK' : 'FIX'}
      />
      <CheckRow
        title="Balance"
        detail={balanceOk ? 'Body is stacked over the stumps' : 'Weight is falling over to one side'}
        status={balanceOk ? 'OK' : 'FIX'}
      />
      <CheckRow
        title="Rear leg"
        detail={rearOk ? 'Back leg is braced for power' : 'Back leg is collapsing'}
        status={rearOk ? 'OK' : 'FIX'}
      />

      <View style={styles.tipBox}>
        <Text style={styles.tipLabel}>What to do</Text>
        <Text style={styles.tipText}>{tip}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#64748b', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  kicker: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: 'none',
  },
  headline: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  headlineOk: { color: '#047857' },
  headlineFix: { color: '#b45309' },
  sub: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  badge: {
    minWidth: 40,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  badgeOk: { backgroundColor: '#d1fae5' },
  badgeFix: { backgroundColor: '#ffedd5' },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  rowCopy: { flex: 1 },
  rowTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  rowDetail: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  tipBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  tipLabel: {
    color: '#0369a1',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    color: '#0f172a',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
});
