import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Rect, Line } from 'react-native-svg';
import { Check } from 'lucide-react-native';
import {
  BodyAnchors,
  StrokePhase,
  mapToViewport,
} from './CoachingCalloutOverlay';

export interface BeforeAfterFootOverlayProps {
  phase: StrokePhase;
  visible?: boolean;
  anchors?: BodyAnchors;
  videoAspect?: number;
  /** Prefer left ankle (RH front foot). Pass 'right' for LH batsmen when known. */
  frontFoot?: 'left' | 'right';
  /** When true (AFTER), show green check; when false show amber mark. */
  isPositive?: boolean;
}

const DEFAULT_LEFT = { x: 0.46, y: 0.82 };
const DEFAULT_RIGHT = { x: 0.54, y: 0.82 };
const DEFAULT_ELBOW = { x: 0.56, y: 0.34 };

export const BeforeAfterFootOverlay: React.FC<BeforeAfterFootOverlayProps> = ({
  phase,
  visible = true,
  anchors,
  videoAspect = 9 / 16,
  frontFoot = 'left',
  isPositive = true,
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [size, setSize] = useState({ w: 360, h: 280 });

  const mode: 'BEFORE' | 'AFTER' = useMemo(() => {
    if (phase === 'IMPACT' || phase === 'FINISH') return 'AFTER';
    return 'BEFORE';
  }, [phase]);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }).start();
  }, [mode, fade]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ w: width, h: height });
  };

  if (!visible) return null;

  const leftAnkle = anchors?.leftAnkle || DEFAULT_LEFT;
  const rightAnkle = anchors?.rightAnkle || DEFAULT_RIGHT;
  const elbow = anchors?.leadElbow || DEFAULT_ELBOW;
  const footNorm = frontFoot === 'right' ? rightAnkle : leftAnkle;

  const foot = mapToViewport(footNorm.x, footNorm.y, size.w, size.h, videoAspect);
  const ringPt = mapToViewport(
    (elbow.x + footNorm.x) / 2,
    elbow.y * 0.55 + footNorm.y * 0.45,
    size.w,
    size.h,
    videoAspect
  );

  const boxW = Math.max(56, size.w * 0.22);
  const boxH = Math.max(42, size.h * 0.1);
  const boxX = foot.x - boxW / 2;
  const boxY = foot.y - boxH * 0.55;
  const tick = Math.max(8, boxW * 0.14);
  const ringR = Math.max(36, Math.min(size.w, size.h) * 0.13);

  const labelLeft = Math.min(size.w - 150, Math.max(12, ringPt.x + ringR * 0.15));
  const labelTop = Math.max(48, Math.min(size.h - 72, ringPt.y - 22));

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const stroke = '#ef4444';

  return (
    <Animated.View
      style={[styles.wrap, { opacity: fade }]}
      pointerEvents="none"
      onLayout={onLayout}
    >
      <Svg width={size.w} height={size.h}>
        {/* Focus ring (reel-style) */}
        <Circle
          cx={ringPt.x}
          cy={ringPt.y}
          r={ringR}
          fill="none"
          stroke={stroke}
          strokeWidth={5}
          opacity={0.95}
        />
        <Circle
          cx={ringPt.x}
          cy={ringPt.y}
          r={ringR * 0.72}
          fill="none"
          stroke={stroke}
          strokeWidth={2.2}
          opacity={0.45}
          strokeDasharray="5 6"
        />

        {/* Foot bounding box */}
        <Rect
          x={boxX}
          y={boxY}
          width={boxW}
          height={boxH}
          fill="none"
          stroke={stroke}
          strokeWidth={3.5}
        />
        {/* Corner ticks */}
        <Line x1={boxX} y1={boxY} x2={boxX + tick} y2={boxY} stroke={stroke} strokeWidth={4} />
        <Line x1={boxX} y1={boxY} x2={boxX} y2={boxY + tick} stroke={stroke} strokeWidth={4} />
        <Line
          x1={boxX + boxW}
          y1={boxY}
          x2={boxX + boxW - tick}
          y2={boxY}
          stroke={stroke}
          strokeWidth={4}
        />
        <Line
          x1={boxX + boxW}
          y1={boxY}
          x2={boxX + boxW}
          y2={boxY + tick}
          stroke={stroke}
          strokeWidth={4}
        />
        <Line
          x1={boxX}
          y1={boxY + boxH}
          x2={boxX + tick}
          y2={boxY + boxH}
          stroke={stroke}
          strokeWidth={4}
        />
        <Line
          x1={boxX}
          y1={boxY + boxH}
          x2={boxX}
          y2={boxY + boxH - tick}
          stroke={stroke}
          strokeWidth={4}
        />
        <Line
          x1={boxX + boxW}
          y1={boxY + boxH}
          x2={boxX + boxW - tick}
          y2={boxY + boxH}
          stroke={stroke}
          strokeWidth={4}
        />
        <Line
          x1={boxX + boxW}
          y1={boxY + boxH}
          x2={boxX + boxW}
          y2={boxY + boxH - tick}
          stroke={stroke}
          strokeWidth={4}
        />
      </Svg>

      <Animated.View
        style={[
          styles.labelRow,
          { left: labelLeft, top: labelTop, transform: [{ scale: ringScale }] },
        ]}
      >
        <Text style={styles.labelText}>{mode}</Text>
        <View
          style={[
            styles.statusBadge,
            mode === 'AFTER' && isPositive ? styles.statusGood : styles.statusWarn,
          ]}
        >
          {mode === 'AFTER' && isPositive ? (
            <Check size={16} color="#ffffff" strokeWidth={3.2} />
          ) : (
            <Text style={styles.statusMark}>{mode === 'BEFORE' ? '·' : '!'}</Text>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  labelRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusGood: {
    backgroundColor: '#16a34a',
  },
  statusWarn: {
    backgroundColor: 'rgba(71, 85, 105, 0.85)',
  },
  statusMark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
});
