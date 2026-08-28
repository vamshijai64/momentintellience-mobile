import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface EnhancedOnboardingScreenProps {
  onComplete: (userProfile: UserProfile) => void;
}

interface UserProfile {
  role: 'BATTING' | 'BOWLING' | 'FIELDING';
  handedness: 'LEFT' | 'RIGHT';
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export const EnhancedOnboardingScreen: React.FC<EnhancedOnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [skipNextTime, setSkipNextTime] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    role: 'BATTING',
    handedness: 'RIGHT',
    skillLevel: 'INTERMEDIATE',
  });

  const steps = [
    {
      title: 'Welcome to CricVision AI',
      subtitle: 'Your Personal Cricket Coaching Assistant powered by Computer Vision & AI',
      type: 'WELCOME',
      icon: '🏏',
    },
    {
      title: 'You need a tripod and 3 stumps',
      subtitle: 'Place your phone on a tripod at waist level directly behind the stumps looking down the pitch.',
      icon: '📱',
      type: 'SETUP',
    },
    {
      title: 'Zoom & Calibration Check',
      subtitle: 'Adjust zoom (e.g. 2.0x–4.4x) until stumps fill the target box cleanly.',
      type: 'CALIBRATION',
      goodLabel: 'Calibrated',
      goodMsg: '✓ Perfect! Stump is properly aligned',
      badLabel: 'Not Calibrated',
      badMsg: 'Position camera to detect stump',
    },
    {
      title: 'Camera position guidelines',
      subtitle: 'Ensure batsman and stumps fill 60–80% of the camera frame.',
      type: 'POSITION',
      goodLabel: 'Good (Zoomed & Framed)',
      badLabel: 'Bad (Too far away)',
    },
    {
      title: 'What CricVision Can Analyze',
      subtitle: 'AI-powered cricket analysis at your fingertips',
      type: 'FEATURES',
      features: [
        { icon: '🎯', label: 'Shot Classification', detail: '13+ shot types detected' },
        { icon: '⚖️', label: 'LBW Decisions', detail: 'Umpire verdict engine' },
        { icon: '📊', label: 'Technique Scoring', detail: '5 biomechanical metrics' },
        { icon: '🎾', label: 'Bowling Metrics', detail: 'Speed, swing & spin' },
        { icon: '🤖', label: 'AI Coach Feedback', detail: 'Personalized recommendations' },
        { icon: '📹', label: 'Slo-Mo Analysis', detail: 'Frame-by-frame review' },
      ],
    },
    {
      title: 'Set Up Your Profile',
      subtitle: 'Customize your analysis experience',
      type: 'PROFILE',
    },
    {
      title: 'All Set! 🎉',
      subtitle: 'You\'re ready to start recording and analyzing your cricket technique',
      type: 'READY',
    },
  ];

  const active = steps[currentStep - 1];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(userProfile);
    }
  };

  const renderStepContent = () => {
    switch (active.type) {
      case 'WELCOME':
        return (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeIcon}>🏏</Text>
            <Text style={styles.welcomeTitle}>CricVision AI</Text>
            <Text style={styles.welcomeTagline}>Elevate Your Cricket Game</Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>✓ AI-Powered Shot Analysis</Text>
              <Text style={styles.featureItem}>✓ Real-Time Technique Scoring</Text>
              <Text style={styles.featureItem}>✓ Professional Coaching Feedback</Text>
            </View>
          </View>
        );

      case 'SETUP':
        return (
          <View style={styles.setupCard}>
            <View style={styles.pitchGraphic}>
              <Text style={{ fontSize: 60, marginBottom: 12 }}>🏏📱</Text>
              <Text style={styles.pitchText}>TRIPOD MOUNTED BEHIND STUMPS</Text>
              <View style={styles.setupSteps}>
                <View style={styles.setupStep}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>Set up 3 stumps on pitch</Text>
                </View>
                <View style={styles.setupStep}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.stepText}>Mount phone on tripod</Text>
                </View>
                <View style={styles.setupStep}>
                  <Text style={styles.stepNumber}>3</Text>
                  <Text style={styles.stepText}>Position behind stumps</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'CALIBRATION':
      case 'POSITION':
        return (
          <View style={styles.comparisonContainer}>
            {/* Good Example */}
            <View style={[styles.exampleCard, styles.goodCardBorder]}>
              <View style={styles.cardImageSimGood}>
                <View style={styles.creaseTrapezoidGood} />
                <View style={styles.stumpBoxGood}>
                  <View style={styles.stumpBarGood} />
                  <View style={styles.stumpBarGood} />
                  <View style={styles.stumpBarGood} />
                </View>
                <View style={styles.statusPillGood}>
                  <Text style={styles.statusPillTextGood}>✓ {active.goodMsg || 'Perfect! Properly aligned'}</Text>
                </View>
              </View>
              <Text style={styles.goodTextTag}>{active.goodLabel || 'Good'}</Text>
            </View>

            {/* Bad Example */}
            <View style={[styles.exampleCard, styles.badCardBorder]}>
              <View style={styles.cardImageSimBad}>
                <View style={styles.creaseTrapezoidBad} />
                <View style={styles.stumpBoxBad} />
                <View style={styles.statusPillBad}>
                  <Text style={styles.statusPillTextBad}>⚠ {active.badMsg || 'Needs adjustment'}</Text>
                </View>
              </View>
              <Text style={styles.badTextTag}>{active.badLabel || 'Bad'}</Text>
            </View>
          </View>
        );

      case 'FEATURES':
        return (
          <View style={styles.featuresContainer}>
            {active.features?.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                  <Text style={styles.featureDetail}>{feature.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        );

      case 'PROFILE':
        return (
          <View style={styles.profileContainer}>
            {/* Role Selection */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>Your Primary Role</Text>
              <View style={styles.roleButtons}>
                {[
                  { icon: '🏏', label: 'Batsman', value: 'BATTING' },
                  { icon: '⚡', label: 'Bowler', value: 'BOWLING' },
                  { icon: '🛡️', label: 'All-rounder', value: 'FIELDING' },
                ].map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleButton,
                      userProfile.role === role.value && styles.roleButtonActive,
                    ]}
                    onPress={() => setUserProfile({ ...userProfile, role: role.value as any })}
                  >
                    <Text style={styles.roleIcon}>{role.icon}</Text>
                    <Text style={[
                      styles.roleLabel,
                      userProfile.role === role.value && styles.roleLabelActive,
                    ]}>
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Handedness Selection */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>Batting Handedness</Text>
              <View style={styles.handednessButtons}>
                {[
                  { label: 'Right-Handed', value: 'RIGHT' },
                  { label: 'Left-Handed', value: 'LEFT' },
                ].map((hand) => (
                  <TouchableOpacity
                    key={hand.value}
                    style={[
                      styles.handButton,
                      userProfile.handedness === hand.value && styles.handButtonActive,
                    ]}
                    onPress={() => setUserProfile({ ...userProfile, handedness: hand.value as any })}
                  >
                    <Text style={[
                      styles.handLabel,
                      userProfile.handedness === hand.value && styles.handLabelActive,
                    ]}>
                      {hand.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Skill Level */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>Skill Level</Text>
              <View style={styles.skillButtons}>
                {[
                  { label: 'Beginner', value: 'BEGINNER' },
                  { label: 'Intermediate', value: 'INTERMEDIATE' },
                  { label: 'Advanced', value: 'ADVANCED' },
                ].map((skill) => (
                  <TouchableOpacity
                    key={skill.value}
                    style={[
                      styles.skillButton,
                      userProfile.skillLevel === skill.value && styles.skillButtonActive,
                    ]}
                    onPress={() => setUserProfile({ ...userProfile, skillLevel: skill.value as any })}
                  >
                    <Text style={[
                      styles.skillLabel,
                      userProfile.skillLevel === skill.value && styles.skillLabelActive,
                    ]}>
                      {skill.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 'READY':
        return (
          <View style={styles.readyCard}>
            <Text style={styles.readyIcon}>🎉</Text>
            <Text style={styles.readyTitle}>You're All Set!</Text>
            <Text style={styles.readySubtitle}>Ready to record and analyze your cricket technique</Text>
            <View style={styles.readyChecklist}>
              <Text style={styles.checklistItem}>✓ Camera setup complete</Text>
              <Text style={styles.checklistItem}>✓ Profile configured</Text>
              <Text style={styles.checklistItem}>✓ AI engine ready</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        {currentStep > 1 ? (
          <TouchableOpacity onPress={() => setCurrentStep(currentStep - 1)}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
        <TouchableOpacity onPress={() => onComplete(userProfile)}>
          <Text style={styles.skipHeaderBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Dots */}
      <View style={styles.progressDots}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index + 1 === currentStep && styles.dotActive,
              index + 1 < currentStep && styles.dotCompleted,
            ]}
          />
        ))}
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{active.title}</Text>
        <Text style={styles.subtitle}>{active.subtitle}</Text>
        {renderStepContent()}
      </ScrollView>

      {/* Footer Navigation Bar */}
      <View style={styles.footer}>
        {currentStep === 1 ? (
          <View style={{ width: 100 }} />
        ) : (
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setSkipNextTime(!skipNextTime)}
          >
            <View style={[styles.checkbox, skipNextTime && styles.checkboxActive]}>
              {skipNextTime ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.checkboxLabel}>Skip next time</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.stepCounter}>{currentStep}/{steps.length}</Text>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length ? 'Start Recording' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 44,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  skipHeaderBtn: {
    color: '#94a3b8',
    fontSize: 20,
    paddingHorizontal: 8,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e293b',
  },
  dotActive: {
    backgroundColor: '#0284c7',
    width: 24,
  },
  dotCompleted: {
    backgroundColor: '#10b981',
  },
  content: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
    lineHeight: 20,
  },
  
  // Welcome Screen
  welcomeCard: {
    width: '100%',
    padding: 32,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#0284c7',
    alignItems: 'center',
  },
  welcomeIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeTagline: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  featureList: {
    alignItems: 'flex-start',
    gap: 12,
  },
  featureItem: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '500',
  },

  // Setup Screen
  setupCard: {
    width: '100%',
    minHeight: 350,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pitchGraphic: {
    alignItems: 'center',
  },
  pitchText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 24,
  },
  setupSteps: {
    width: '100%',
    gap: 12,
  },
  setupStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    width: 32,
    height: 32,
    backgroundColor: '#0284c7',
    borderRadius: 16,
    textAlign: 'center',
    lineHeight: 32,
  },
  stepText: {
    color: '#cbd5e1',
    fontSize: 14,
    flex: 1,
  },

  // Comparison Cards (Calibration/Position)
  comparisonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  exampleCard: {
    width: '90%',
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#090d16',
  },
  goodCardBorder: {
    borderColor: '#10b981',
  },
  badCardBorder: {
    borderColor: '#ef4444',
  },
  cardImageSimGood: {
    width: '100%',
    height: 145,
    backgroundColor: '#14231b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageSimBad: {
    width: '100%',
    height: 145,
    backgroundColor: '#261416',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creaseTrapezoidGood: {
    position: 'absolute',
    width: 140,
    height: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ perspective: 100 }, { rotateX: '60deg' }],
  },
  creaseTrapezoidBad: {
    position: 'absolute',
    width: 90,
    height: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ perspective: 100 }, { rotateX: '60deg' }],
  },
  stumpBoxGood: {
    width: 32,
    height: 54,
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  stumpBarGood: {
    width: 4,
    height: 44,
    backgroundColor: '#fbbf24',
    borderRadius: 2,
  },
  stumpBoxBad: {
    width: 18,
    height: 28,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusPillGood: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusPillTextGood: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusPillBad: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statusPillTextBad: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  goodTextTag: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },
  badTextTag: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
  },

  // Features Screen
  featuresContainer: {
    width: '100%',
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    gap: 16,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureContent: {
    flex: 1,
  },
  featureLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDetail: {
    color: '#94a3b8',
    fontSize: 13,
  },

  // Profile Screen
  profileContainer: {
    width: '100%',
    gap: 24,
  },
  profileSection: {
    width: '100%',
  },
  profileSectionTitle: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e293b',
    padding: 16,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#0284c7',
    backgroundColor: '#0c1e2e',
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  roleLabelActive: {
    color: '#38bdf8',
  },
  handednessButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  handButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e293b',
    padding: 14,
    alignItems: 'center',
  },
  handButtonActive: {
    borderColor: '#0284c7',
    backgroundColor: '#0c1e2e',
  },
  handLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  handLabelActive: {
    color: '#38bdf8',
  },
  skillButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skillButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e293b',
    padding: 12,
    alignItems: 'center',
  },
  skillButtonActive: {
    borderColor: '#0284c7',
    backgroundColor: '#0c1e2e',
  },
  skillLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  skillLabelActive: {
    color: '#38bdf8',
  },

  // Ready Screen
  readyCard: {
    width: '100%',
    padding: 32,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
  },
  readyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  readyTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  readySubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  readyChecklist: {
    width: '100%',
    gap: 12,
  },
  checklistItem: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '500',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  stepCounter: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
