import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import {
  ScaleStanceIcon,
  LightningLiftIcon,
  ImpactPointIcon,
  TrophyFinishIcon,
} from './icons/AppIcons';

export type StrokePhase = 'STANCE' | 'BACKLIFT' | 'IMPACT' | 'FINISH';

interface PhaseDetail {
  id: StrokePhase;
  label: string;
  subLabel: string;
  score: number;
  checks: { title: string; status: 'PERFECT' | 'GOOD' | 'CHECK'; value: string }[];
  coachingTip: string;
}

const PHASES: PhaseDetail[] = [
  {
    id: 'STANCE',
    label: '1. STANCE',
    subLabel: 'Base & Setup',
    score: 95,
    checks: [
      { title: 'Shoulder Level', status: 'PERFECT', value: '0° Level' },
      { title: 'Foot Base Width', status: 'PERFECT', value: '1.1x Torso' },
      { title: 'Head Stillness', status: 'GOOD', value: 'Steady Eye-Line' },
    ],
    coachingTip: 'Athletic, balanced stance with eyes level toward bowler release point.',
  },
  {
    id: 'BACKLIFT',
    label: '2. BACKLIFT',
    subLabel: 'Trigger & Lift',
    score: 91,
    checks: [
      { title: 'Backlift Line', status: 'PERFECT', value: 'Toward 1st Slip' },
      { title: 'Trigger Step', status: 'GOOD', value: 'Smooth Weight Shift' },
      { title: 'Top-Hand Grip', status: 'PERFECT', value: 'Firm "V" Grip' },
    ],
    coachingTip: 'Elevate backlift along first slip corridor with soft bottom hand.',
  },
  {
    id: 'IMPACT',
    label: '3. IMPACT',
    subLabel: 'Contact Zone',
    score: 98,
    checks: [
      { title: 'Head-over-Knee Stack', status: 'PERFECT', value: '0.08 (Stacked)' },
      { title: 'High Lead Elbow', status: 'PERFECT', value: '138° Elevation' },
      { title: 'Front Knee Flexion', status: 'PERFECT', value: '132° Stride Bend' },
    ],
    coachingTip: 'Head directly over ball impact line; lead elbow points high through Cover.',
  },
  {
    id: 'FINISH',
    label: '4. FINISH',
    subLabel: 'Follow-Through',
    score: 94,
    checks: [
      { title: 'Elbow High Finish', status: 'PERFECT', value: 'Pointing to Cover' },
      { title: 'Weight Transfer', status: 'PERFECT', value: '100% on Front Foot' },
      { title: 'Bat Face Presentation', status: 'GOOD', value: 'Full Vertical Blade' },
    ],
    coachingTip: 'Hold the pose for 2 seconds to reinforce muscle memory and balance.',
  },
];

const renderPhaseIcon = (id: StrokePhase, isActive: boolean) => {
  const iconColor = isActive ? '#15803d' : '#64748b';
  switch (id) {
    case 'STANCE':
      return <ScaleStanceIcon size={18} color={iconColor} />;
    case 'BACKLIFT':
      return <LightningLiftIcon size={18} color={isActive ? '#b45309' : '#64748b'} />;
    case 'IMPACT':
      return <ImpactPointIcon size={18} color={iconColor} />;
    case 'FINISH':
      return <TrophyFinishIcon size={18} color={isActive ? '#d97706' : '#64748b'} />;
  }
};

interface PhaseTimelineScrubberProps {
  activePhase?: StrokePhase;
  onSelectPhase?: (phase: StrokePhase) => void;
}

export const PhaseTimelineScrubber: React.FC<PhaseTimelineScrubberProps> = ({
  activePhase = 'IMPACT',
  onSelectPhase,
}) => {
  const [selectedPhaseId, setSelectedPhaseId] = useState<StrokePhase>(activePhase);

  const handlePress = (id: StrokePhase) => {
    setSelectedPhaseId(id);
    onSelectPhase?.(id);
  };

  const currentPhase = PHASES.find((p) => p.id === selectedPhaseId) || PHASES[2];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>4-PHASE STROKE TIMELINE</Text>
        <Text style={styles.badge}>MASTERCLASS INSPECTOR</Text>
      </View>

      {/* 4 Phase Pill Buttons */}
      <View style={styles.timelineRow}>
        {PHASES.map((phase) => {
          const isActive = phase.id === selectedPhaseId;
          return (
            <TouchableOpacity
              key={phase.id}
              style={[styles.phaseBtn, isActive && styles.phaseBtnActive]}
              onPress={() => handlePress(phase.id)}
              activeOpacity={0.8}
            >
              <View style={styles.iconBox}>
                {renderPhaseIcon(phase.id, isActive)}
              </View>
              <Text style={[styles.phaseLabel, isActive && styles.phaseLabelActive]}>
                {phase.id}
              </Text>
              <View style={[styles.scoreBadge, isActive && styles.scoreBadgeActive]}>
                <Text style={[styles.scoreText, isActive && styles.scoreTextActive]}>
                  {phase.score}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Active Phase Details & Biomechanical Checklist Card */}
      <View style={styles.phaseCard}>
        <View style={styles.phaseCardHeader}>
          <Text style={styles.phaseCardName}>{currentPhase.label}: {currentPhase.subLabel}</Text>
          <View style={styles.formRatingBox}>
            <Text style={styles.formRatingText}>FORM: {currentPhase.score}%</Text>
          </View>
        </View>

        {/* 3 Biomechanical Check Items */}
        <View style={styles.checksList}>
          {currentPhase.checks.map((c, idx) => (
            <View key={idx} style={styles.checkItem}>
              <View style={styles.checkLeft}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.checkTitle}>{c.title}</Text>
              </View>
              <View style={styles.checkValueBox}>
                <Text style={styles.checkValueText}>{c.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Coach Voice Tip */}
        <View style={styles.tipBox}>
          <Text style={styles.tipLabel}>COACH TIP:</Text>
          <Text style={styles.tipText}>{currentPhase.coachingTip}</Text>
        </View>
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
    marginBottom: 12,
  },
  title: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  badge: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  phaseBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  phaseBtnActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#10b981',
  },
  iconBox: {
    marginBottom: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    color: '#64748b',
    fontSize: 9.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  phaseLabelActive: {
    color: '#15803d',
    fontWeight: '900',
  },
  scoreBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  scoreBadgeActive: {
    backgroundColor: '#10b981',
  },
  scoreText: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '800',
  },
  scoreTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  phaseCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  phaseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  phaseCardName: {
    color: '#0f172a',
    fontSize: 12.5,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  formRatingBox: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  formRatingText: {
    color: '#15803d',
    fontSize: 9.5,
    fontWeight: '800',
  },
  checksList: {
    gap: 8,
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  checkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  checkIcon: {
    color: '#15803d',
    fontWeight: '900',
    fontSize: 12,
  },
  checkTitle: {
    color: '#0f172a',
    fontSize: 11.5,
    fontWeight: '600',
  },
  checkValueBox: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  checkValueText: {
    color: '#0284c7',
    fontSize: 10.5,
    fontWeight: '700',
  },
  tipBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 9,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  tipLabel: {
    color: '#0284c7',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  tipText: {
    color: '#0369a1',
    fontSize: 11,
    lineHeight: 15,
  },
});
