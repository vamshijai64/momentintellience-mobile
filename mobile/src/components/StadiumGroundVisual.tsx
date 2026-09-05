import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { shotExitVector } from '../utils/shotStadiumMap';

type BeamSide = 'OFF' | 'LEG' | 'STRAIGHT';

const BEAM_COLORS: Record<BeamSide, { core: string; glow: string; tip: string }> = {
  OFF: { core: '#4ade80', glow: 'rgba(74, 222, 128, 0.35)', tip: '#bbf7d0' },
  STRAIGHT: { core: '#38bdf8', glow: 'rgba(56, 189, 248, 0.35)', tip: '#bae6fd' },
  LEG: { core: '#fbbf24', glow: 'rgba(251, 191, 36, 0.4)', tip: '#fde68a' },
};

interface StadiumPitchGroundProps {
  deg: number;
  label: string;
  sideLabel: string;
  side: BeamSide;
  height?: number;
}

/** Bowler's-end / side-camera stadium strip with grass, stands, pitch & exit ray. */
export const StadiumPitchGround: React.FC<StadiumPitchGroundProps> = ({
  deg,
  label,
  sideLabel,
  side,
  height = 188,
}) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const beam = shotExitVector(deg, 56);
  const colors = BEAM_COLORS[side];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={[styles.pitchFrame, { height }]}>
      <Svg width="100%" height="100%" viewBox="0 0 320 188" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#0c4a6e" />
            <Stop offset="55%" stopColor="#14532d" />
            <Stop offset="100%" stopColor="#166534" />
          </LinearGradient>
          <LinearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fcd34d" />
            <Stop offset="45%" stopColor="#f59e0b" />
            <Stop offset="100%" stopColor="#d97706" />
          </LinearGradient>
          <LinearGradient id="standGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#334155" />
            <Stop offset="100%" stopColor="#0f172a" />
          </LinearGradient>
          <RadialGradient id="spotLight" cx="50%" cy="42%" r="45%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </RadialGradient>
        </Defs>

        {/* Sky + outfield base */}
        <Rect x="0" y="0" width="320" height="188" fill="url(#skyGrad)" />

        {/* Stadium stands (top) */}
        <Path d="M0 0 H320 V34 Q160 48 0 34 Z" fill="url(#standGrad)" opacity={0.92} />
        <Rect x="0" y="26" width="320" height="4" fill="#475569" />
        {[28, 56, 84, 112, 140, 168, 196, 224, 252, 280].map((x) => (
          <Rect key={`seat-${x}`} x={x} y="8" width="18" height="14" rx="2" fill="#1e293b" opacity={0.85} />
        ))}

        {/* Floodlights */}
        <G>
          <Line x1="24" y1="34" x2="24" y2="58" stroke="#94a3b8" strokeWidth="2" />
          <Ellipse cx="24" cy="62" rx="10" ry="4" fill="#fef9c3" opacity={0.55} />
          <Line x1="296" y1="34" x2="296" y2="58" stroke="#94a3b8" strokeWidth="2" />
          <Ellipse cx="296" cy="62" rx="10" ry="4" fill="#fef9c3" opacity={0.55} />
        </G>

        {/* Mown grass stripes */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Rect
            key={`stripe-${i}`}
            x={i * 40}
            y="48"
            width="40"
            height="140"
            fill={i % 2 === 0 ? '#166534' : '#15803d'}
            opacity={0.95}
          />
        ))}

        {/* 30-yard circle hint */}
        <Ellipse cx="160" cy="108" rx="118" ry="62" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2" strokeDasharray="5 4" />

        {/* Spotlight wash */}
        <Ellipse cx="160" cy="100" rx="90" ry="70" fill="url(#spotLight)" />

        {/* Pitch */}
        <Rect x="138" y="52" width="44" height="108" rx="3" fill="url(#pitchGrad)" stroke="#fde68a" strokeWidth="1.2" />
        {/* Pitch wear marks */}
        <Line x1="149" y1="70" x2="149" y2="140" stroke="rgba(146,64,14,0.25)" strokeWidth="6" />
        <Line x1="171" y1="70" x2="171" y2="140" stroke="rgba(146,64,14,0.18)" strokeWidth="5" />

        {/* Creases */}
        <Line x1="128" y1="66" x2="192" y2="66" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" />
        <Line x1="128" y1="146" x2="192" y2="146" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" />

        {/* Stumps */}
        {[152, 160, 168].map((x) => (
          <React.Fragment key={`st-top-${x}`}>
            <Rect x={x - 1.2} y="54" width="2.4" height="11" rx="0.6" fill="#78350f" />
            <Rect x={x - 1.2} y="54" width="2.4" height="2" fill="#fbbf24" />
          </React.Fragment>
        ))}
        {[152, 160, 168].map((x) => (
          <React.Fragment key={`st-bot-${x}`}>
            <Rect x={x - 1.2} y="148" width="2.4" height="11" rx="0.6" fill="#78350f" />
            <Rect x={x - 1.2} y="148" width="2.4" height="2" fill="#fbbf24" />
          </React.Fragment>
        ))}

        {/* Exit beam glow */}
        <Line
          x1="160"
          y1="108"
          x2={160 + beam.x}
          y2={108 + beam.y}
          stroke={colors.glow}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <Line
          x1="160"
          y1="108"
          x2={160 + beam.x}
          y2={108 + beam.y}
          stroke={colors.core}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <Circle cx={160 + beam.x} cy={108 + beam.y} r="5.5" fill={colors.tip} stroke={colors.core} strokeWidth="1.5" />

        {/* Batsman marker */}
        <Circle cx="160" cy="108" r="7" fill="#0284c7" stroke="#e0f2fe" strokeWidth="2" />
        <Circle cx="160" cy="108" r="2.5" fill="#ffffff" />

        {/* Boundary rope hint */}
        <Rect x="0" y="182" width="320" height="6" fill="#86efac" opacity={0.55} />
      </Svg>

      <View style={styles.targetChip}>
        <Text style={styles.targetChipLabel}>TARGET EXIT</Text>
        <Text style={styles.targetChipValue}>
          {label} · {Math.round(deg)}°
        </Text>
      </View>

      <View style={styles.sideChip}>
        <View style={[styles.sideDot, { backgroundColor: colors.core }]} />
        <Text style={styles.sideChipText}>{sideLabel.toUpperCase()}</Text>
      </View>

      <Animated.View
        style={[
          styles.livePulse,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
          },
        ]}
      >
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE GROUND</Text>
      </Animated.View>
    </View>
  );
};

interface WagonStadiumGroundProps {
  deg: number;
  side: BeamSide;
  labels: Array<{ id: string; shortLabel: string; style: object; active: boolean }>;
  size?: number;
}

/** Top-down circular stadium wagon-wheel ground. */
export const WagonStadiumGround: React.FC<WagonStadiumGroundProps> = ({
  deg,
  side,
  labels,
  size = 268,
}) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const radius = 102;
  const { x, y } = shotExitVector(deg, radius);
  const colors = BEAM_COLORS[side];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={[styles.wagonWrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="wagonGrass" cx="50%" cy="45%" r="65%">
            <Stop offset="0%" stopColor="#22c55e" />
            <Stop offset="55%" stopColor="#15803d" />
            <Stop offset="100%" stopColor="#14532d" />
          </RadialGradient>
          <LinearGradient id="wagonPitch" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fcd34d" />
            <Stop offset="100%" stopColor="#d97706" />
          </LinearGradient>
          <LinearGradient id="standRing" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#475569" />
            <Stop offset="100%" stopColor="#1e293b" />
          </LinearGradient>
        </Defs>

        {/* Outer stadium bowl / stands */}
        <Circle cx={cx} cy={cy} r={size / 2 - 2} fill="url(#standRing)" />
        <Circle cx={cx} cy={cy} r={size / 2 - 14} fill="#0f172a" />

        {/* Playing field */}
        <Circle cx={cx} cy={cy} r={size / 2 - 18} fill="url(#wagonGrass)" stroke="#86efac" strokeWidth="3" />

        {/* Mown rings */}
        <Circle cx={cx} cy={cy} r={size / 2 - 34} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
        <Circle cx={cx} cy={cy} r={size / 2 - 52} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="16" />

        {/* 30-yard circle */}
        <Circle
          cx={cx}
          cy={cy}
          r={78}
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.4"
          strokeDasharray="6 5"
        />

        {/* Pitch */}
        <Rect x={cx - 11} y={cy - 36} width="22" height="72" rx="3" fill="url(#wagonPitch)" stroke="#fde68a" strokeWidth="1" />
        <Line x1={cx - 14} y1={cy - 24} x2={cx + 14} y2={cy - 24} stroke="#fff" strokeWidth="1.4" />
        <Line x1={cx - 14} y1={cy + 24} x2={cx + 14} y2={cy + 24} stroke="#fff" strokeWidth="1.4" />

        {/* Single exit ray only (no second animated beam) */}
        <Line
          x1={cx}
          y1={cy + 18}
          x2={cx + x}
          y2={cy + 18 + y}
          stroke={colors.glow}
          strokeWidth="7"
          strokeLinecap="round"
          opacity={0.55}
        />
        <Line
          x1={cx}
          y1={cy + 18}
          x2={cx + x}
          y2={cy + 18 + y}
          stroke={colors.core}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <Circle
          cx={cx + x}
          cy={cy + 18 + y}
          r="5"
          fill={colors.tip}
          stroke={colors.core}
          strokeWidth="1.5"
        />

        {/* Batsman marker on top of ray */}
        <Circle cx={cx} cy={cy + 18} r="4.5" fill="#0284c7" stroke="#e0f2fe" strokeWidth="1.5" />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.wagonTarget,
          {
            top: cy + 18 - 9,
            left: cx - 9,
            borderColor: colors.core,
            transform: [
              { translateX: x },
              { translateY: y },
              {
                scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] }),
              },
            ],
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
          },
        ]}
      >
        <View style={[styles.wagonTargetInner, { backgroundColor: colors.core }]} />
      </Animated.View>

      {labels.map((item) => (
        <Text
          key={item.id}
          style={[styles.wagonLabel, item.style, item.active && styles.wagonLabelActive]}
        >
          {item.shortLabel}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  pitchFrame: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#166534',
    backgroundColor: '#14532d',
    position: 'relative',
  },
  targetChip: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(134, 239, 172, 0.45)',
  },
  targetChipLabel: {
    color: '#86efac',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  targetChipValue: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 1,
  },
  sideChip: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  sideDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sideChipText: {
    color: '#14532d',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  livePulse: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15,23,42,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    color: '#f8fafc',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  wagonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wagonTarget: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wagonTargetInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  wagonLabel: {
    position: 'absolute',
    fontSize: 8.5,
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  wagonLabelActive: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontWeight: '900',
    borderColor: '#059669',
  },
});
