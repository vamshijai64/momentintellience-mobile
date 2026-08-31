import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions } from 'react-native';

interface WagonWheelFieldViewProps {
  shotDirectionDeg: number;
  shotDirectionLabel?: string;
  shotType?: string;
}

export const WagonWheelFieldView: React.FC<WagonWheelFieldViewProps> = ({
  shotDirectionDeg = 50,
  shotDirectionLabel = 'COVER',
  shotType = 'COVER DRIVE',
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Convert shot angle (0° = Point, 50° = Cover, 90° = Straight, 180° = Fine Leg)
  // to 2D ray coordinates inside the circular stadium (radius = 95)
  const radius = 95;
  // In screen coordinates: 0° is Left (Point), 50° is Down-Left (Cover), 90° is Straight Down, 180° is Right (Leg)
  const angleRad = ((shotDirectionDeg - 90) * Math.PI) / 180;
  const targetX = Math.sin(angleRad) * radius;
  const targetY = Math.cos(angleRad) * radius;
  const beamRotationDeg = Math.atan2(targetY, targetX) * (180 / Math.PI);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>360° WAGON WHEEL RADAR</Text>
          <Text style={styles.subtitle}>
            Shot Trajectory: <Text style={styles.accentText}>{shotDirectionLabel}</Text> ({Math.round(shotDirectionDeg)}°)
          </Text>
        </View>
        <View style={styles.badgeBox}>
          <Text style={styles.badgeText}>{shotType}</Text>
        </View>
      </View>

      {/* Top-Down Circular Cricket Field */}
      <View style={styles.fieldContainer}>
        {/* Outer Boundary Ring */}
        <View style={styles.boundaryRing}>
          {/* 30-Yard Circle */}
          <View style={styles.innerRing} />

          {/* Cricket Pitch Rectangle */}
          <View style={styles.pitchRect}>
            {/* Bowling Crease & Batting Crease */}
            <View style={styles.creaseLineTop} />
            <View style={styles.creaseLineBottom} />
            <View style={styles.batsmanNode} />
          </View>

          {/* Field Position Labels */}
          <Text style={[styles.fieldLabel, styles.posThirdMan]}>Third Man</Text>
          <Text style={[styles.fieldLabel, styles.posPoint]}>Point</Text>
          <Text style={[styles.fieldLabel, styles.posCover, shotDirectionDeg <= 65 && styles.posCoverActive]}>Cover 🎯</Text>
          <Text style={[styles.fieldLabel, styles.posMidOff]}>Mid-Off</Text>
          <Text style={[styles.fieldLabel, styles.posLongOff]}>Straight</Text>
          <Text style={[styles.fieldLabel, styles.posMidOn]}>Mid-On</Text>
          <Text style={[styles.fieldLabel, styles.posMidWicket]}>Mid-Wkt</Text>
          <Text style={[styles.fieldLabel, styles.posSquareLeg]}>Sq Leg</Text>
          <Text style={[styles.fieldLabel, styles.posFineLeg]}>Fine Leg</Text>

          {/* Animated Glowing Shot Trajectory Beam */}
          <View
            style={[
              styles.shotBeam,
              {
                width: radius,
                transform: [
                  { rotate: `${beamRotationDeg}deg` },
                  { translateX: radius / 2 },
                ],
              },
            ]}
          />

          {/* Impact Landing Ring */}
          <Animated.View
            style={[
              styles.targetDot,
              {
                transform: [
                  { translateX: targetX },
                  { translateY: targetY },
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.4],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.0],
                }),
              },
            ]}
          >
            <View style={styles.targetInnerDot} />
          </Animated.View>
        </View>
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>
          ⚡ <Text style={{ color: '#38bdf8', fontWeight: '700' }}>Off-Side Drive Sector:</Text> Power channeled between 35° & 60° through Cover.
        </Text>
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
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subtitle: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  accentText: {
    color: '#10b981',
    fontWeight: '800',
  },
  badgeBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  badgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
  },
  fieldContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  boundaryRing: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#064e3b',
    borderWidth: 2.5,
    borderColor: '#34d399',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  innerRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    position: 'absolute',
  },
  pitchRect: {
    width: 22,
    height: 64,
    backgroundColor: '#d97706',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderWidth: 0.8,
    borderColor: '#fef3c7',
  },
  creaseLineTop: {
    width: 18,
    height: 1.5,
    backgroundColor: '#ffffff',
  },
  creaseLineBottom: {
    width: 18,
    height: 1.5,
    backgroundColor: '#ffffff',
  },
  batsmanNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
    position: 'absolute',
    bottom: 8,
  },
  fieldLabel: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '700',
    color: '#cbd5e1',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  posThirdMan: { top: 38, left: 16 },
  posPoint: { top: 88, left: 10 },
  posCover: { top: 150, left: 12 },
  posCoverActive: {
    backgroundColor: '#10b981',
    color: '#022c22',
    fontWeight: '900',
  },
  posMidOff: { bottom: 18, left: 55 },
  posLongOff: { bottom: 8, alignSelf: 'center' },
  posMidOn: { bottom: 18, right: 55 },
  posMidWicket: { top: 150, right: 12 },
  posSquareLeg: { top: 88, right: 10 },
  posFineLeg: { top: 38, right: 16 },
  shotBeam: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#10b981',
    borderRadius: 2,
    shadowColor: '#34d399',
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  targetDot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(52, 211, 153, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  footerNote: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 11.5,
    lineHeight: 16,
  },
});
