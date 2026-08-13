import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface CameraStumpOverlayProps {
  isStumpAligned?: boolean;
  tiltAngle?: number;
  guidanceText?: string;
  shotType?: string;
}

export const CameraStumpOverlay: React.FC<CameraStumpOverlayProps> = ({
  isStumpAligned = true,
  tiltAngle = 90,
  guidanceText = 'Align Stumps in Target Box',
  shotType = 'CRICKET SHOT',
}) => {
  const isTiltGood = Math.abs(tiltAngle - 90) <= 5;
  const targetColor = isStumpAligned && isTiltGood ? '#10b981' : '#f59e0b';

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Top Header HUD Banner */}
      <View style={styles.topHudContainer}>
        <View style={styles.hudBadge}>
          <Text style={styles.hudTitle}>CRICVISION TARGET ENGINE</Text>
          <Text style={styles.hudSubtitle}>{shotType}</Text>
        </View>

        <View style={[styles.statusBadge, { borderColor: targetColor }]}>
          <View style={[styles.statusDot, { backgroundColor: targetColor }]} />
          <Text style={[styles.statusText, { color: targetColor }]}>
            {isStumpAligned && isTiltGood ? 'TARGET CONFIRMED' : 'ALIGNING...'}
          </Text>
        </View>
      </View>

      {/* Center Guidance Silhouette Overlay */}
      <View style={styles.centerGuideContainer}>
        {/* Batsman Stance Silhouette Guide */}
        <View style={[styles.batsmanSilhouetteBox, { borderColor: targetColor }]}>
          {/* Head Target Crosshair */}
          <View style={styles.headTargetCircle}>
            <Text style={styles.targetLabelText}>HEAD</Text>
          </View>

          {/* Stance Spine Axis Line */}
          <View style={styles.spineAxisLine} />

          {/* Foot Stance Width Line */}
          <View style={styles.footBaseLine}>
            <Text style={styles.footLabelText}>FRONT FOOT</Text>
            <Text style={styles.footLabelText}>BACK FOOT</Text>
          </View>
        </View>
      </View>

      {/* Lower Stump Target Box (Yellow/Green Dashed Frame) */}
      <View style={styles.stumpTargetContainer}>
        <View style={[styles.stumpBox, { borderColor: targetColor }]}>
          {/* 3 Stump Vertical Guides */}
          <View style={styles.stumpLine} />
          <View style={styles.stumpLine} />
          <View style={styles.stumpLine} />
        </View>
        <Text style={[styles.stumpTargetLabel, { color: targetColor }]}>
          {isStumpAligned ? 'STUMPS DETECTED IN TARGET' : 'POSITION STUMPS HERE'}
        </Text>
      </View>

      {/* Bottom Guidance & Tilt Sensor Bar */}
      <View style={styles.bottomBarContainer}>
        <View style={styles.tiltMeterBox}>
          <Text style={styles.tiltLabel}>PHONE TILT:</Text>
          <Text style={[styles.tiltValue, { color: isTiltGood ? '#10b981' : '#ef4444' }]}>
            {tiltAngle.toFixed(1)}° {isTiltGood ? '(VERTICAL OK)' : '(TILT VERTICAL)'}
          </Text>
        </View>

        <View style={[styles.guidanceBanner, { backgroundColor: isStumpAligned ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)' }]}>
          <Text style={[styles.guidanceText, { color: targetColor }]}>
            {guidanceText}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 10,
  },
  topHudContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  hudBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hudTitle: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hudSubtitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  centerGuideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  batsmanSilhouetteBox: {
    width: 220,
    height: 280,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  headTargetCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
  },
  targetLabelText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  spineAxisLine: {
    width: 2,
    height: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  footBaseLine: {
    width: '80%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderColor: '#38bdf8',
    paddingTop: 4,
  },
  footLabelText: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '600',
  },
  stumpTargetContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  stumpBox: {
    width: 70,
    height: 90,
    borderWidth: 2,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  stumpLine: {
    width: 6,
    height: 70,
    backgroundColor: '#fbbf24',
    borderRadius: 3,
  },
  stumpTargetLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bottomBarContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tiltMeterBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tiltLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  tiltValue: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  guidanceBanner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  guidanceText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
