import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';

interface BeforeAfterCorrectionSliderProps {
  shotType?: string;
  currentElbowAngle?: number;
  idealElbowAngle?: number;
}

export const BeforeAfterCorrectionSlider: React.FC<BeforeAfterCorrectionSliderProps> = ({
  shotType = 'COVER DRIVE',
  currentElbowAngle = 138,
  idealElbowAngle = 144,
}) => {
  const [sliderPosition, setSliderPosition] = useState<'BEFORE' | 'SPLIT' | 'AFTER'>('SPLIT');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.sparkleIcon}>🎚️</Text>
          <View>
            <Text style={styles.title}>BEFORE VS AFTER AI CORRECTION</Text>
            <Text style={styles.subtitle}>Interactive Postural Transformation Slider</Text>
          </View>
        </View>
      </View>

      {/* Mode Switcher Buttons */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segBtn, sliderPosition === 'BEFORE' && styles.segBtnActiveRed]}
          onPress={() => setSliderPosition('BEFORE')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segBtnText, sliderPosition === 'BEFORE' && styles.segBtnTextActiveRed]}>
            YOUR SHOT (FLAWS)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segBtn, sliderPosition === 'SPLIT' && styles.segBtnActiveCyan]}
          onPress={() => setSliderPosition('SPLIT')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segBtnText, sliderPosition === 'SPLIT' && styles.segBtnTextActiveCyan]}>
            SPLIT WIPE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segBtn, sliderPosition === 'AFTER' && styles.segBtnActiveGold]}
          onPress={() => setSliderPosition('AFTER')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segBtnText, sliderPosition === 'AFTER' && styles.segBtnTextActiveGold]}>
            👑 AI GOLD PRO FORM
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Visual Comparison Stage */}
      <View style={styles.stageContainer}>
        {/* Left / Before Panel */}
        {(sliderPosition === 'BEFORE' || sliderPosition === 'SPLIT') && (
          <View style={[styles.stagePanel, styles.beforePanel, sliderPosition === 'SPLIT' && styles.halfWidth]}>
            <View style={styles.panelBadgeRed}>
              <Text style={styles.panelBadgeTextRed}>✕ YOUR RECORDED FORM</Text>
            </View>

            {/* Skeleton Silhouette Diagram (Before) */}
            <View style={styles.silhouetteBox}>
              <Text style={styles.silhouetteHead}>👤</Text>
              <Text style={styles.flawTagTop}>[ ! ] HEAD OFFSET: 0.08</Text>
              <Text style={styles.flawTagElbow}>[ X ] ELBOW: {Math.round(currentElbowAngle)}° (DROOPING)</Text>
              <Text style={styles.flawTagKnee}>[ ! ] KNEE: 132° (LIMITED REACH)</Text>
            </View>

            <Text style={styles.panelFooterRed}>Risk: In-Air Slice to Cover Fielder</Text>
          </View>
        )}

        {/* Divider / Wipe Bar */}
        {sliderPosition === 'SPLIT' && (
          <View style={styles.wipeDivider}>
            <View style={styles.wipeHandle}>
              <Text style={styles.wipeHandleText}>⇄</Text>
            </View>
          </View>
        )}

        {/* Right / After Panel */}
        {(sliderPosition === 'AFTER' || sliderPosition === 'SPLIT') && (
          <View style={[styles.stagePanel, styles.afterPanel, sliderPosition === 'SPLIT' && styles.halfWidth]}>
            <View style={styles.panelBadgeGold}>
              <Text style={styles.panelBadgeTextGold}>👑 AI GOLD STANDARD</Text>
            </View>

            {/* Skeleton Silhouette Diagram (After) */}
            <View style={styles.silhouetteBox}>
              <Text style={styles.silhouetteHeadGold}>👑</Text>
              <Text style={styles.proTagTop}>[ ✓ ] HEAD OVER BALL (0.00)</Text>
              <Text style={styles.proTagElbow}>[ ✓ ] ELBOW: {idealElbowAngle}° (HIGH PRO)</Text>
              <Text style={styles.proTagKnee}>[ ✓ ] KNEE: 135° (SOLID BASE)</Text>
            </View>

            <Text style={styles.panelFooterGold}>Result: Grounded 4 Runs Boundary</Text>
          </View>
        )}
      </View>

      {/* Delta Transformation Summary Card */}
      <View style={styles.deltaCard}>
        <Text style={styles.deltaTitle}>⚡ BIOMECHANICAL DELTA TRANSFORMATION:</Text>
        <Text style={styles.deltaText}>
          Lifting your lead front elbow by <Text style={styles.deltaHighlight}>+{idealElbowAngle - Math.round(currentElbowAngle)}°</Text> and locking head weight over the front foot increases stroke control from <Text style={styles.deltaHighlight}>70% ➔ 95% Pro Efficiency</Text>.
        </Text>
      </View>
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
  headerRow: {
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparkleIcon: {
    fontSize: 20,
  },
  title: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  segBtnActiveRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  segBtnActiveCyan: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  segBtnActiveGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  segBtnText: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '800',
  },
  segBtnTextActiveRed: {
    color: '#f87171',
    fontWeight: '900',
  },
  segBtnTextActiveCyan: {
    color: '#38bdf8',
    fontWeight: '900',
  },
  segBtnTextActiveGold: {
    color: '#fbbf24',
    fontWeight: '900',
  },
  stageContainer: {
    flexDirection: 'row',
    height: 180,
    backgroundColor: '#020617',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stagePanel: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 1,
  },
  beforePanel: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  afterPanel: {
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  panelBadgeRed: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  panelBadgeTextRed: {
    color: '#f87171',
    fontSize: 7.5,
    fontWeight: '900',
  },
  panelBadgeGold: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  panelBadgeTextGold: {
    color: '#fbbf24',
    fontSize: 7.5,
    fontWeight: '900',
  },
  silhouetteBox: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  silhouetteHead: {
    fontSize: 26,
    opacity: 0.8,
  },
  silhouetteHeadGold: {
    fontSize: 26,
  },
  flawTagTop: {
    color: '#fca5a5',
    fontSize: 7.5,
    fontWeight: '800',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  flawTagElbow: {
    color: '#ef4444',
    fontSize: 7.5,
    fontWeight: '900',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  flawTagKnee: {
    color: '#fca5a5',
    fontSize: 7.5,
    fontWeight: '800',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  proTagTop: {
    color: '#86efac',
    fontSize: 7.5,
    fontWeight: '800',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  proTagElbow: {
    color: '#fbbf24',
    fontSize: 7.5,
    fontWeight: '900',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  proTagKnee: {
    color: '#86efac',
    fontSize: 7.5,
    fontWeight: '800',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  panelFooterRed: {
    color: '#f87171',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  panelFooterGold: {
    color: '#fbbf24',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  wipeDivider: {
    width: 2,
    backgroundColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wipeHandle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wipeHandleText: {
    color: '#020617',
    fontSize: 10,
    fontWeight: '900',
  },
  deltaCard: {
    marginTop: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  deltaTitle: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 3,
  },
  deltaText: {
    color: '#cbd5e1',
    fontSize: 10.5,
    lineHeight: 15,
  },
  deltaHighlight: {
    color: '#34d399',
    fontWeight: '900',
  },
});
