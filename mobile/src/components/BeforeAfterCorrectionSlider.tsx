import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import {
  SliderCompareIcon,
  CrownGoldIcon,
  ArmFlexIcon,
  TargetIcon,
  GlassIconBadge,
} from './icons/AppIcons';

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
          <GlassIconBadge bg="#e0f2fe" borderColor="#bae6fd" size={36}>
            <SliderCompareIcon size={20} color="#0284c7" />
          </GlassIconBadge>
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
            SPLIT WIPE (50/50)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segBtn, sliderPosition === 'AFTER' && styles.segBtnActiveGold]}
          onPress={() => setSliderPosition('AFTER')}
          activeOpacity={0.8}
        >
          <View style={styles.segBtnGoldRow}>
            <CrownGoldIcon size={12} color={sliderPosition === 'AFTER' ? '#b45309' : '#64748b'} />
            <Text style={[styles.segBtnText, sliderPosition === 'AFTER' && styles.segBtnTextActiveGold]}>
              AI GOLD PRO FORM
            </Text>
          </View>
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
              <GlassIconBadge bg="#fee2e2" borderColor="#fca5a5" size={32}>
                <ArmFlexIcon size={16} color="#b91c1c" />
              </GlassIconBadge>
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
              <CrownGoldIcon size={11} color="#b45309" />
              <Text style={styles.panelBadgeTextGold}>AI GOLD STANDARD</Text>
            </View>

            {/* Skeleton Silhouette Diagram (After) */}
            <View style={styles.silhouetteBox}>
              <GlassIconBadge bg="#fef3c7" borderColor="#fde68a" size={32}>
                <TargetIcon size={16} color="#b45309" />
              </GlassIconBadge>
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
        <View style={styles.deltaHeaderRow}>
          <SliderCompareIcon size={14} color="#0284c7" />
          <Text style={styles.deltaTitle}>BIOMECHANICAL DELTA TRANSFORMATION</Text>
        </View>
        <Text style={styles.deltaText}>
          Lifting your lead front elbow by <Text style={styles.deltaHighlight}>+{idealElbowAngle - Math.round(currentElbowAngle)}°</Text> and locking head weight over the front foot increases stroke control from <Text style={styles.deltaHighlight}>70% ➔ 95% Pro Efficiency</Text>.
        </Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  splitIcon: {
    fontSize: 20,
  },
  title: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  segBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  segBtnActiveRed: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  segBtnActiveCyan: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  segBtnActiveGold: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  segBtnGoldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  segBtnText: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '800',
  },
  segBtnTextActiveRed: {
    color: '#b91c1c',
    fontWeight: '900',
  },
  segBtnTextActiveCyan: {
    color: '#0284c7',
    fontWeight: '900',
  },
  segBtnTextActiveGold: {
    color: '#b45309',
    fontWeight: '900',
  },
  stageContainer: {
    flexDirection: 'row',
    height: 180,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
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
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  afterPanel: {
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  panelBadgeRed: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  panelBadgeTextRed: {
    color: '#b91c1c',
    fontSize: 7.5,
    fontWeight: '900',
  },
  panelBadgeGold: {
    alignSelf: 'flex-end',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  panelBadgeTextGold: {
    color: '#b45309',
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
    color: '#b91c1c',
    fontSize: 7.5,
    fontWeight: '800',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  flawTagElbow: {
    color: '#b91c1c',
    fontSize: 7.5,
    fontWeight: '900',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  flawTagKnee: {
    color: '#b91c1c',
    fontSize: 7.5,
    fontWeight: '800',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  proTagTop: {
    color: '#15803d',
    fontSize: 7.5,
    fontWeight: '800',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  proTagElbow: {
    color: '#b45309',
    fontSize: 7.5,
    fontWeight: '900',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  proTagKnee: {
    color: '#15803d',
    fontSize: 7.5,
    fontWeight: '800',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  panelFooterRed: {
    color: '#b91c1c',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  panelFooterGold: {
    color: '#b45309',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  wipeDivider: {
    width: 2,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wipeHandle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wipeHandleText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  deltaCard: {
    marginTop: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  deltaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  deltaTitle: {
    color: '#0284c7',
    fontSize: 9,
    fontWeight: '900',
  },
  deltaText: {
    color: '#334155',
    fontSize: 10.5,
    lineHeight: 15,
  },
  deltaHighlight: {
    color: '#15803d',
    fontWeight: '900',
  },
});
