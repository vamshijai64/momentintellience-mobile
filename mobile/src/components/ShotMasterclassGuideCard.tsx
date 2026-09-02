import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import {
  TargetIcon,
  ArmFlexIcon,
  LegStrideIcon,
  BatSwingIcon,
  BookGuideIcon,
  LightbulbCueIcon,
  AlertWarnIcon,
  GlassIconBadge,
} from './icons/AppIcons';

interface ShotGuideData {
  title: string;
  idealDelivery: string;
  mentalCue: string;
  commonMistake: string;
  proFix: string;
  checkpoints: {
    head: string;
    arms: string;
    legs: string;
    swing: string;
  };
  whenNotToPlay: string;
}

const SHOT_GUIDES: Record<string, ShotGuideData> = {
  'COVER DRIVE': {
    title: 'COVER DRIVE MASTERCLASS',
    idealDelivery: 'Overpitched or full-length delivery pitched outside off-stump (4th–5th stump line).',
    mentalCue: 'Lead with your front shoulder and nose directly over the ball before swinging the bat.',
    commonMistake: 'Dropping the lead front elbow and slashing with hands, slicing the ball in the air to Cover.',
    proFix: 'Keep lead front elbow pointing high toward Extra Cover, driving the ball firmly along the turf.',
    checkpoints: {
      head: 'Head still and locked vertically over the front knee at the point of impact.',
      arms: 'Lead elbow elevated high (140°+), top hand dominant, bottom hand relaxed.',
      legs: 'Large front-foot stride reaching the pitch of the ball, bending front knee (135°).',
      swing: 'High backlift down to a full high-elbow follow-through presenting full bat face.',
    },
    whenNotToPlay: 'Short of length or back-of-a-length deliveries that are cramping you for room.',
  },
  'PULL SHOT': {
    title: 'PULL SHOT MASTERCLASS',
    idealDelivery: 'Short-pitched delivery between waist and chest height on middle or leg stump.',
    mentalCue: 'Get on the back foot quickly and roll wrists at impact to keep the ball grounded.',
    commonMistake: 'Playing from the front foot or hitting on the up without rolling wrists, resulting in top edges.',
    proFix: 'Transfer weight back and across, arms extended fully in front of chest, rolling wrists downward.',
    checkpoints: {
      head: 'Head over the ball, eyes level watching the ball right onto the middle of the bat.',
      arms: 'Arms extended wide into horizontal swing plane (160°), rotating through the stroke.',
      legs: 'Back foot deep and across inside the line of the ball, front leg acting as pivot base.',
      swing: 'Horizontal bat swing from high backlift across the body ending behind left shoulder.',
    },
    whenNotToPlay: 'Full-length or good-length balls that are not rising above thigh height.',
  },
  'CUT SHOT': {
    title: 'CUT SHOT MASTERCLASS',
    idealDelivery: 'Short of length delivery pitching well outside off-stump with width.',
    mentalCue: 'Imagine a woodsman chopping a tree with an axe — chop down on top of the ball.',
    commonMistake: 'Reaching for balls too close to off-stump or slicing upward, edging to slip/gully.',
    proFix: 'Stay tall on the back foot, wait for width, and chop downward over the bounce.',
    checkpoints: {
      head: 'Head balanced over the back leg, eyes tracking the point of contact outside off.',
      arms: 'Arms fully extended with high backlift, chopping down from high to low.',
      legs: 'Back foot steps back and across towards off stump, remaining tall on toes.',
      swing: 'Steep downward diagonal bat angle cutting across the trajectory to Point/Third Man.',
    },
    whenNotToPlay: 'Deliveries close to off-stump with no width — risk of inside edging onto stumps.',
  },
  'FLICK SHOT': {
    title: 'FLICK SHOT MASTERCLASS',
    idealDelivery: 'Full-length delivery aimed at middle-and-leg or pads.',
    mentalCue: 'Let the ball come under your eyes before closing the bat face with wrist snap.',
    commonMistake: 'Closing the bat face too early and playing across the line, leading to leading edges.',
    proFix: 'Play straight down the line first, only closing wrists at the final microsecond of contact.',
    checkpoints: {
      head: 'Head directly over the front pad, not falling over to the off-side.',
      arms: 'Supple wrists snapping through impact, top hand guiding straight down line.',
      legs: 'Front foot strides straight down the pitch, clearing front hip slightly.',
      swing: 'Straight vertical bat downswing transitioning into wrist roll toward Mid-Wicket.',
    },
    whenNotToPlay: 'Deliveries moving away outside off-stump — never flick across the line outside off.',
  },
  'STRAIGHT DRIVE': {
    title: 'STRAIGHT DRIVE MASTERCLASS',
    idealDelivery: 'Full-pitch delivery on middle or off stump looking for swing.',
    mentalCue: 'Present the maker’s name on the bat straight back past the bowler’s ankles.',
    commonMistake: 'Swinging across the line with hard bottom-hand grip, miscuing to Mid-On.',
    proFix: 'Dominant top-hand control, presenting the full vertical face of the blade.',
    checkpoints: {
      head: 'Nose and eyes directly over the ball at contact point.',
      arms: 'Lead elbow leading straight down the ground, V-grip dominant with top hand.',
      legs: 'Straight stride alongside the line of the ball, front knee bent.',
      swing: 'Pure vertical pendulum swing finishing high over the bowler’s head.',
    },
    whenNotToPlay: 'Balls pitching short of good length.',
  },
};

interface ShotMasterclassGuideCardProps {
  shotType?: string;
}

export const ShotMasterclassGuideCard: React.FC<ShotMasterclassGuideCardProps> = ({
  shotType = 'COVER DRIVE',
}) => {
  const normalizedShot = Object.keys(SHOT_GUIDES).find(
    (k) => shotType.toUpperCase().includes(k)
  ) || 'COVER DRIVE';

  const [activeTab, setActiveTab] = useState<string>(normalizedShot);
  const guide = SHOT_GUIDES[activeTab] || SHOT_GUIDES['COVER DRIVE'];

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBar}>
        <View style={styles.titleRow}>
          <GlassIconBadge bg="#e0f2fe" borderColor="#bae6fd" size={36}>
            <BookGuideIcon size={20} color="#0284c7" />
          </GlassIconBadge>
          <View>
            <Text style={styles.headerTitle}>COACHING BLUEPRINT & TECHNIQUE GUIDE</Text>
            <Text style={styles.headerSubtitle}>How to Play the Shot Correctly (CoachCricXI Style)</Text>
          </View>
        </View>
      </View>

      {/* Shot Selector Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {Object.keys(SHOT_GUIDES).map((shot) => {
          const isSelected = activeTab === shot;
          return (
            <TouchableOpacity
              key={shot}
              style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
              onPress={() => setActiveTab(shot)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabBtnText, isSelected && styles.tabBtnTextActive]}>
                {shot}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 1. When to Play This Shot (Delivery Identification) */}
      <View style={styles.deliveryCard}>
        <View style={styles.cardHeaderRow}>
          <TargetIcon size={14} color="#0284c7" />
          <Text style={styles.cardHeaderSmall}>WHEN TO PLAY THIS SHOT</Text>
        </View>
        <Text style={styles.deliveryBody}>{guide.idealDelivery}</Text>
      </View>

      {/* 2. Visual ✕ MISTAKE vs ✓ PRO FIX Side-by-Side */}
      <View style={styles.contrastGrid}>
        {/* Common Mistake Card */}
        <View style={[styles.contrastCard, styles.mistakeCard]}>
          <View style={styles.badgeRow}>
            <View style={styles.crossCircle}><Text style={styles.crossText}>✕</Text></View>
            <Text style={styles.mistakeTitle}>COMMON FLAW</Text>
          </View>
          <Text style={styles.contrastBody}>{guide.commonMistake}</Text>
        </View>

        {/* Pro Fix Card */}
        <View style={[styles.contrastCard, styles.fixCard]}>
          <View style={styles.badgeRow}>
            <View style={styles.checkCircle}><Text style={styles.checkText}>✓</Text></View>
            <Text style={styles.fixTitle}>PRO TECHNIQUE</Text>
          </View>
          <Text style={styles.contrastBody}>{guide.proFix}</Text>
        </View>
      </View>

      {/* 3. The 4 Anatomical Checkpoints (Head, Elbow, Legs, Swing) */}
      <Text style={styles.sectionHeader}>KEY ANATOMICAL CHECKPOINTS</Text>
      <View style={styles.checkpointsGrid}>
        {/* Head */}
        <View style={styles.checkCard}>
          <GlassIconBadge bg="#e0f2fe" borderColor="#bae6fd" size={38}>
            <TargetIcon size={20} color="#0284c7" />
          </GlassIconBadge>
          <View style={styles.checkTextGroup}>
            <Text style={styles.checkName}>HEAD POSITION</Text>
            <Text style={styles.checkDesc}>{guide.checkpoints.head}</Text>
          </View>
        </View>

        {/* Arms & Elbow */}
        <View style={styles.checkCard}>
          <GlassIconBadge bg="#f0fdf4" borderColor="#bbf7d0" size={38}>
            <ArmFlexIcon size={20} color="#15803d" />
          </GlassIconBadge>
          <View style={styles.checkTextGroup}>
            <Text style={styles.checkName}>LEAD ELBOW & ARMS</Text>
            <Text style={styles.checkDesc}>{guide.checkpoints.arms}</Text>
          </View>
        </View>

        {/* Legs & Stride */}
        <View style={styles.checkCard}>
          <GlassIconBadge bg="#fef3c7" borderColor="#fde68a" size={38}>
            <LegStrideIcon size={20} color="#b45309" />
          </GlassIconBadge>
          <View style={styles.checkTextGroup}>
            <Text style={styles.checkName}>FEET & STRIDE BASE</Text>
            <Text style={styles.checkDesc}>{guide.checkpoints.legs}</Text>
          </View>
        </View>

        {/* Bat Swing Plane */}
        <View style={styles.checkCard}>
          <GlassIconBadge bg="#f3e8ff" borderColor="#e9d5ff" size={38}>
            <BatSwingIcon size={20} color="#7c3aed" />
          </GlassIconBadge>
          <View style={styles.checkTextGroup}>
            <Text style={styles.checkName}>BAT SWING PLANE</Text>
            <Text style={styles.checkDesc}>{guide.checkpoints.swing}</Text>
          </View>
        </View>
      </View>

      {/* 4. Pro Mental Cue (The Secret Imagery) */}
      <View style={styles.mentalCueBox}>
        <View style={styles.cardHeaderRow}>
          <LightbulbCueIcon size={16} color="#b45309" />
          <Text style={styles.mentalLabel}>PRO COACHING SECRET CUE</Text>
        </View>
        <Text style={styles.mentalText}>"{guide.mentalCue}"</Text>
      </View>

      {/* 5. Warning: When NOT to play */}
      <View style={styles.warningBox}>
        <View style={styles.cardHeaderRow}>
          <AlertWarnIcon size={16} color="#b91c1c" />
          <Text style={styles.warningLabel}>WHEN NOT TO PLAY</Text>
        </View>
        <Text style={styles.warningText}>{guide.whenNotToPlay}</Text>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookIcon: {
    fontSize: 20,
  },
  headerTitle: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  tabsScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tabBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  tabBtnText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#0284c7',
    fontWeight: '900',
  },
  deliveryCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardHeaderSmall: {
    color: '#0284c7',
    fontSize: 9,
    fontWeight: '900',
  },
  deliveryBody: {
    color: '#0369a1',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  contrastGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  contrastCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  mistakeCard: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  fixCard: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  crossCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  mistakeTitle: {
    color: '#b91c1c',
    fontSize: 9,
    fontWeight: '900',
  },
  fixTitle: {
    color: '#15803d',
    fontSize: 9,
    fontWeight: '900',
  },
  contrastBody: {
    color: '#334155',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  checkpointsGrid: {
    gap: 6,
    marginBottom: 12,
  },
  checkCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 9,
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  checkIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  checkTextGroup: {
    flex: 1,
  },
  checkName: {
    color: '#0284c7',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  checkDesc: {
    color: '#334155',
    fontSize: 10.5,
    lineHeight: 14,
  },
  mentalCueBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 8,
  },
  mentalLabel: {
    color: '#b45309',
    fontSize: 8.5,
    fontWeight: '900',
    marginBottom: 3,
  },
  mentalText: {
    color: '#92400e',
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  warningLabel: {
    color: '#b91c1c',
    fontSize: 8.5,
    fontWeight: '900',
    marginBottom: 3,
  },
  warningText: {
    color: '#991b1b',
    fontSize: 10.5,
    lineHeight: 14,
  },
});
