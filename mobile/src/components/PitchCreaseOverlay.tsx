import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

interface PitchCreaseOverlayProps {
  zoomLevel: number;
  onZoomChange: (newZoom: number) => void;
  isCalibrated?: boolean;
  statusText?: string;
}

export const PitchCreaseOverlay: React.FC<PitchCreaseOverlayProps> = ({
  zoomLevel = 1.0,
  onZoomChange,
  isCalibrated = false,
  statusText,
}) => {
  const statusColor = isCalibrated ? '#10b981' : '#ef4444';
  const pillText = statusText || (isCalibrated ? 'STUMP ALIGNED & CALIBRATED' : 'NO BATSMAN DETECTED');

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Outer Border Calibrated Feedback Highlight */}
      <View style={[styles.borderHighlight, { borderColor: statusColor }]} pointerEvents="none" />

      {/* Center Perspective Pitch Lines & Stump Target */}
      <View style={styles.centerPitchArea} pointerEvents="none">
        {/* White Perspective Pitch Crease Lines */}
        <View style={styles.perspectiveTrapezoid}>
          <View style={styles.creasePoppingLine} />
        </View>

        {/* Dynamic Stump Box (Green when Calibrated, Red when uncalibrated) */}
        <View style={[styles.stumpDetectionBox, { borderColor: statusColor, backgroundColor: isCalibrated ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
          <View style={styles.stumpPillar} />
          <View style={styles.stumpPillar} />
          <View style={styles.stumpPillar} />
        </View>

        {/* CricVision Calibration Status Pill Banner — reflects real live pose detection */}
        <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
          <View style={styles.checkCircleIcon}>
            <Text style={styles.checkIconText}>{isCalibrated ? '✓' : '!'}</Text>
          </View>
          <Text style={styles.statusPillText}>
            {pillText}
          </Text>
        </View>
      </View>

      {/* Right Side CricVision Zoom Slider Control Widget */}
      <View style={styles.zoomControlWidget}>
        <Text style={styles.zoomValText}>{zoomLevel.toFixed(1)}x</Text>
        
        <View style={styles.zoomTrackLine}>
          <TouchableOpacity
            style={[styles.zoomThumb, { bottom: `${((zoomLevel - 1.0) / 3.4) * 80}%` }]}
            onPress={() => onZoomChange(zoomLevel >= 4.0 ? 1.0 : zoomLevel + 0.5)}
          />
        </View>

        <TouchableOpacity
          style={styles.zoomPresetBtn}
          onPress={() => onZoomChange(zoomLevel >= 4.0 ? 1.0 : zoomLevel + 1.0)}
        >
          <Text style={styles.zoomBtnText}>1x / 4.4x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 15,
  },
  borderHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 4,
    borderRadius: 24,
  },
  centerPitchArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  perspectiveTrapezoid: {
    position: 'absolute',
    width: 220,
    height: 160,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    transform: [{ perspective: 200 }, { rotateX: '55deg' }],
  },
  creasePoppingLine: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#ffffff',
  },
  stumpDetectionBox: {
    width: 65,
    height: 110,
    borderWidth: 2.5,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 4,
    marginBottom: 20,
  },
  stumpPillar: {
    width: 6,
    height: 90,
    backgroundColor: '#fbbf24',
    borderRadius: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    marginTop: 10,
  },
  checkCircleIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkIconText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  zoomControlWidget: {
    position: 'absolute',
    right: 16,
    top: '30%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    width: 44,
    height: 180,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  zoomValText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  zoomTrackLine: {
    width: 4,
    height: 100,
    backgroundColor: '#334155',
    borderRadius: 2,
    position: 'relative',
  },
  zoomThumb: {
    position: 'absolute',
    left: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#38bdf8',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  zoomPresetBtn: {
    paddingVertical: 2,
  },
  zoomBtnText: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: 'bold',
  },
});
