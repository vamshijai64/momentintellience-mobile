import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export type StrokePhase = 'STANCE' | 'BACKLIFT' | 'IMPACT' | 'FINISH';

interface PhaseDetail {
  id: StrokePhase;
  label: string;
  subLabel: string;
  icon: string;
  score: number;
  checks: { title: string; status: 'PERFECT' | 'GOOD' | 'CHECK'; value: string }[];
  coachingTip: string;
}

const PHASES: PhaseDetail[] = [
  {
    id: 'STANCE',
    label: '1. STANCE',
    subLabel: 'Base & Setup',
    icon: '⚖️',
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
    icon: '⚡',
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
    icon: '🎯',
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
    icon: '🏆',
    score: 94,
    checks: [
      { title: 'Elbow High Finish', status: 'PERFECT', value: 'Pointing to Cover' },
      { title: 'Weight Transfer', status: 'PERFECT', value: '100% on Front Foot' },
      { title: 'Bat Face Presentation', status: 'GOOD', value: 'Full Vertical Blade' },
    ],
    coachingTip: 'Hold the pose for 2 seconds to reinforce muscle memory and balance.',
  },
];

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
              <Text style={styles.phaseIcon}>{phase.icon}</Text>
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
    marginBottom: 12,
  },
  title: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  badge: {
    color: '#94a3b8',
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  phaseBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  phaseIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  phaseLabel: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  phaseLabelActive: {
    color: '#34d399',
    fontWeight: '900',
  },
  scoreBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
    color: '#022c22',
    fontWeight: '900',
  },
  phaseCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  phaseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  phaseCardName: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  formRatingBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  formRatingText: {
    color: '#34d399',
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
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  checkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  checkIcon: {
    color: '#10b981',
    fontWeight: '900',
    fontSize: 12,
  },
  checkTitle: {
    color: '#e2e8f0',
    fontSize: 11.5,
    fontWeight: '600',
  },
  checkValueBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  checkValueText: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  tipBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 8,
    padding: 9,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  tipLabel: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
  },
  tipText: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 15,
  },
});
