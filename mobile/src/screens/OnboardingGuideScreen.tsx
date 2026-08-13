import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface OnboardingGuideScreenProps {
  onComplete: () => void;
}

export const OnboardingGuideScreen: React.FC<OnboardingGuideScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [skipNextTime, setSkipNextTime] = useState(false);

  const steps = [
    {
      title: 'You need a tripod and 3 stumps',
      subtitle: 'Place your phone on a tripod at waist level directly behind the stumps looking down the pitch.',
      icon: '🏏',
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
      title: 'Don\'t block the camera',
      subtitle: 'Ensure no fielders, bowlers, or nets obstruct the line of sight to the batsman.',
      type: 'OBSTRUCTION',
      goodLabel: 'Good (Clear Line of Sight)',
      badLabel: 'Obstructing (Player blocking camera)',
    },
    {
      title: 'Proper Lighting Standards',
      subtitle: 'Use well-lit outdoor pitch or bright indoor nets for best MediaPipe pose accuracy.',
      type: 'LIGHTING',
      goodLabel: 'Good (Bright Daylight)',
      badLabel: 'Bad (Underexposed Shadow)',
    },
  ];

  const active = steps[currentStep - 1];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
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
        <TouchableOpacity onPress={onComplete}>
          <Text style={styles.skipHeaderBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{active.title}</Text>
        <Text style={styles.subtitle}>{active.subtitle}</Text>

        {/* Visual Calibration Cards matching CricVision design */}
        {active.type === 'SETUP' ? (
          <View style={styles.setupCard}>
            <View style={styles.pitchGraphic}>
              <Text style={{ fontSize: 50, marginBottom: 12 }}>🏏📱</Text>
              <Text style={styles.pitchText}>TRIPOD MOUNTED BEHIND STUMPS</Text>
            </View>
          </View>
        ) : (
          <View style={styles.comparisonContainer}>
            {/* Good / Calibrated Example Card */}
            <View style={[styles.exampleCard, styles.goodCardBorder]}>
              <View style={styles.cardImageSimGood}>
                {/* Simulated Perspective Pitch Crease Box */}
                <View style={styles.creaseTrapezoidGood} />
                <View style={styles.stumpBoxGood}>
                  <View style={styles.stumpBarGood} />
                  <View style={styles.stumpBarGood} />
                  <View style={styles.stumpBarGood} />
                </View>
                <View style={styles.statusPillGood}>
                  <Text style={styles.statusPillTextGood}>✓ {active.goodMsg || 'Perfect! Stump is properly aligned'}</Text>
                </View>
              </View>
              <Text style={styles.goodTextTag}>{active.goodLabel || 'Good'}</Text>
            </View>

            {/* Bad / Not Calibrated Example Card */}
            <View style={[styles.exampleCard, styles.badCardBorder]}>
              <View style={styles.cardImageSimBad}>
                <View style={styles.creaseTrapezoidBad} />
                <View style={styles.stumpBoxBad} />
                <View style={styles.statusPillBad}>
                  <Text style={styles.statusPillTextBad}>⚠ {active.badMsg || 'Position camera to detect stump'}</Text>
                </View>
              </View>
              <Text style={styles.badTextTag}>{active.badLabel || 'Bad'}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation Bar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setSkipNextTime(!skipNextTime)}
        >
          <View style={[styles.checkbox, skipNextTime && styles.checkboxActive]}>
            {skipNextTime ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>Skip next time</Text>
        </TouchableOpacity>

        <Text style={styles.stepCounter}>{currentStep}/{steps.length}</Text>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{currentStep === steps.length ? 'Start Camera' : 'Next'}</Text>
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
    fontSize: 18,
    paddingHorizontal: 8,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  setupCard: {
    width: '100%',
    height: 320,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
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
  },
  comparisonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  exampleCard: {
    width: '90%',
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
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
    position: 'relative',
  },
  cardImageSimBad: {
    width: '100%',
    height: 145,
    backgroundColor: '#261416',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    marginVertical: 4,
  },
  badTextTag: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 4,
  },
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
