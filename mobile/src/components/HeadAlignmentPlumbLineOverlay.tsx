import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import {
  BodyAnchors,
  mapToViewport,
} from './CoachingCalloutOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface HeadAlignmentPlumbLineOverlayProps {
  visible?: boolean;
  anchors?: BodyAnchors;
  videoAspect?: number;
  frontFoot?: 'left' | 'right';
  shotType?: string;
}

export const HeadAlignmentPlumbLineOverlay: React.FC<HeadAlignmentPlumbLineOverlayProps> = ({
  visible = true,
  anchors,
  videoAspect = 9 / 16,
  frontFoot = 'left',
  shotType = 'COVER DRIVE',
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  // Initialize with realistic viewport dimensions so initial frame renders perfectly
  const [size, setSize] = useState({ w: SCREEN_WIDTH, h: 280 });

  useEffect(() => {
    if (visible) {
      fade.setValue(0);
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      fade.setValue(0);
    }
  }, [visible, fade]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ w: width, h: height });
  };

  const isBackFoot = useMemo(() => {
    const s = (shotType || '').toUpperCase();
    return s.includes('PULL') || s.includes('HOOK') || s.includes('CUT');
  }, [shotType]);

  // Only render if we have actual detected head and foot anchors
  const hasAnchors = Boolean(
    anchors &&
    anchors.head &&
    (anchors.leftAnkle || anchors.rightAnkle)
  );

  const headNorm = anchors?.head;
  const footNorm = useMemo(() => {
    if (!anchors) return undefined;
    const isLeft = frontFoot === 'left';
    if (isBackFoot) {
      return isLeft
        ? (anchors.rightAnkle || anchors.leftAnkle)
        : (anchors.leftAnkle || anchors.rightAnkle);
    }
    return isLeft
      ? (anchors.leftAnkle || anchors.rightAnkle)
      : (anchors.rightAnkle || anchors.leftAnkle);
  }, [anchors, frontFoot, isBackFoot]);

  // Map to viewport coordinates
  const headPt = useMemo(() => {
    if (!headNorm) return null;
    return mapToViewport(headNorm.x, headNorm.y, size.w, size.h, videoAspect);
  }, [headNorm, size.w, size.h, videoAspect]);

  const footPt = useMemo(() => {
    if (!footNorm) return null;
    return mapToViewport(footNorm.x, footNorm.y, size.w, size.h, videoAspect);
  }, [footNorm, size.w, size.h, videoAspect]);

  // Compute Plumb Line Metrics
  // Yellow Line is the true 90° vertical plumb line through the front foot
  // Blue Line connects actual Head to front foot
  const tiltDegrees = useMemo(() => {
    if (!headPt || !footPt) return 0;
    const deltaX = headPt.x - footPt.x;
    const deltaY = Math.max(1, footPt.y - headPt.y);
    const deg = Math.abs(Math.atan2(deltaX, deltaY) * (180 / Math.PI));
    return Math.round(deg * 10) / 10;
  }, [headPt, footPt]);

  const isAligned = tiltDegrees <= 3.8;

  if (!visible) return null;

  const yellowColor = '#FFE600'; // Textbook 90° Vertical Benchmark (Kohli standard)
  const blueColor = isAligned ? '#10b981' : '#0099FF'; // Actual Head Line
  const emeraldColor = '#10b981';

  // Frame plumb line bounds tightly to the batsman rather than running across the sky and pitch
  const lineTopY = headPt ? Math.max(8, headPt.y - 28) : 8;
  const lineBottomY = footPt ? Math.min(size.h - 8, footPt.y + 24) : size.h - 8;

  return (
    <Animated.View
      style={[styles.wrap, { opacity: fade }]}
      pointerEvents="none"
      onLayout={onLayout}
    >
      {hasAnchors && headPt && footPt ? (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
          {/* 1. IDEAL 90° VERTICAL PLUMB LINE (Framed from head height to foot level) */}
          <Line
            x1={footPt.x}
            y1={lineTopY}
            x2={footPt.x}
            y2={lineBottomY}
            stroke={yellowColor}
            strokeWidth={2.5}
            strokeDasharray="6 3"
            opacity={0.92}
          />

          {/* 2. ACTUAL HEAD-TO-FOOT AXIS (when head falls away from vertical) */}
          {!isAligned && (
            <>
              {/* Actual Head Axis Line */}
              <Line
                x1={headPt.x}
                y1={headPt.y}
                x2={footPt.x}
                y2={footPt.y}
                stroke={blueColor}
                strokeWidth={2.5}
                opacity={0.92}
              />

              {/* Horizontal Deviation Gap (showing offset at head height) */}
              <Line
                x1={headPt.x}
                y1={headPt.y}
                x2={footPt.x}
                y2={headPt.y}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                opacity={0.8}
              />
            </>
          )}

          {/* Target Foot Reticle (Hawkeye-style) */}
          <Circle
            cx={footPt.x}
            cy={footPt.y}
            r={12}
            fill="none"
            stroke={yellowColor}
            strokeWidth={2}
            strokeDasharray="4 2"
          />
          <Circle
            cx={footPt.x}
            cy={footPt.y}
            r={3}
            fill={yellowColor}
          />
          {/* Foot crosshair ticks */}
          <Line x1={footPt.x - 16} y1={footPt.y} x2={footPt.x - 12} y2={footPt.y} stroke={yellowColor} strokeWidth={1.5} />
          <Line x1={footPt.x + 12} y1={footPt.y} x2={footPt.x + 16} y2={footPt.y} stroke={yellowColor} strokeWidth={1.5} />

          {/* Head Target Reticle (Hawkeye-style) */}
          <Circle
            cx={headPt.x}
            cy={headPt.y}
            r={13}
            fill="none"
            stroke={isAligned ? emeraldColor : blueColor}
            strokeWidth={2}
            strokeDasharray="4 2"
          />
          <Circle
            cx={headPt.x}
            cy={headPt.y}
            r={3.5}
            fill={isAligned ? emeraldColor : blueColor}
          />
          {/* Head crosshair ticks */}
          <Line x1={headPt.x} y1={headPt.y - 17} x2={headPt.x} y2={headPt.y - 13} stroke={isAligned ? emeraldColor : blueColor} strokeWidth={1.5} />
          <Line x1={headPt.x} y1={headPt.y + 13} x2={headPt.x} y2={headPt.y + 17} stroke={isAligned ? emeraldColor : blueColor} strokeWidth={1.5} />
        </Svg>
      ) : null}

      {/* Floating Tilt Tag right beside Head when offset */}
      {!isAligned && hasAnchors && headPt && footPt && (
        <View
          style={[
            styles.floatingTiltTag,
            {
              left: Math.max(8, Math.min(size.w - 80, headPt.x > footPt.x ? headPt.x + 16 : headPt.x - 76)),
              top: Math.max(6, headPt.y - 12),
            },
          ]}
        >
          <Text style={styles.floatingTiltText}>{tiltDegrees}° tilt</Text>
        </View>
      )}

      {/* 🌟 Docked Bottom Broadcast Chyron (Never overlaps top buttons or the batsman's head!) */}
      <View style={styles.bottomPillWrap}>
        <View style={[styles.miniPill, isAligned ? styles.miniPillGood : styles.miniPillFix]}>
          <View style={[styles.pillDot, { backgroundColor: isAligned ? emeraldColor : '#f59e0b' }]} />
          <Text style={styles.pillTitle}>
            {hasAnchors
              ? isAligned
                ? 'KOHLI 0° PLUMB (PERFECT)'
                : `HEAD FALL: ${tiltDegrees}° TILT`
              : 'CALCULATING PLUMB LINE…'}
          </Text>
          <View style={styles.legendDotGroup}>
            <View style={[styles.legendBar, { backgroundColor: yellowColor }]} />
            <Text style={styles.legendSmall}>90° Ideal</Text>
            {!isAligned && hasAnchors && (
              <>
                <View style={[styles.legendBar, { backgroundColor: blueColor, marginLeft: 6 }]} />
                <Text style={styles.legendSmall}>Head Line</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 22,
  },
  bottomPillWrap: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4.5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.2,
    backgroundColor: 'rgba(8, 14, 26, 0.90)',
    gap: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  miniPillGood: {
    borderColor: '#10b981',
  },
  miniPillFix: {
    borderColor: '#f59e0b',
  },
  pillDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
  pillTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  legendDotGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
    paddingLeft: 7,
  },
  legendBar: {
    width: 9,
    height: 2.5,
    borderRadius: 1.5,
  },
  legendSmall: {
    fontSize: 8.5,
    color: '#94a3b8',
    fontWeight: '600',
  },
  floatingTiltTag: {
    position: 'absolute',
    backgroundColor: 'rgba(245, 158, 11, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    zIndex: 25,
  },
  floatingTiltText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
