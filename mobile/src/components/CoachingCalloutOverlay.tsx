import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';

export type StrokePhase = 'STANCE' | 'BACKLIFT' | 'IMPACT' | 'FINISH';

export type LandmarkPoint = {
  x: number; // 0–1 in video frame
  y: number;
};

export type BodyAnchors = {
  head?: LandmarkPoint;
  leadElbow?: LandmarkPoint;
  leadWrist?: LandmarkPoint;
  leftAnkle?: LandmarkPoint;
  rightAnkle?: LandmarkPoint;
};

export interface CoachingCalloutOverlayProps {
  phase: StrokePhase;
  shotType?: string;
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
  coachingTip?: string;
  visible?: boolean;
  /** Normalized 0–1 anchors in the *video frame* (not the letterboxed viewport). */
  anchors?: BodyAnchors;
  /** Video aspect width/height. Phone cricket clips are usually portrait ~9:16. */
  videoAspect?: number;
}

interface CalloutSpec {
  id: string;
  label: string;
  kind: 'elbow' | 'backlift' | 'feet' | 'trigger';
  tone: 'good' | 'fix' | 'tip';
}

/** Default body spots inside a typical batting frame (normalized). */
const DEFAULT_ANCHORS: Required<BodyAnchors> = {
  head: { x: 0.5, y: 0.2 },
  leadElbow: { x: 0.56, y: 0.34 },
  leadWrist: { x: 0.54, y: 0.28 },
  leftAnkle: { x: 0.46, y: 0.82 },
  rightAnkle: { x: 0.54, y: 0.82 },
};

function resolveShotFamily(shotType?: string): string {
  const key = (shotType || '').toUpperCase();
  if (key.includes('PULL') || key.includes('HOOK')) return 'PULL';
  if (key.includes('CUT')) return 'CUT';
  if (key.includes('FLICK') || key.includes('GLANCE') || key.includes('WHIP')) return 'FLICK';
  if (key.includes('SWEEP')) return 'SWEEP';
  if (key.includes('STRAIGHT') || key.includes('ON DRIVE')) return 'STRAIGHT';
  return 'DRIVE';
}

function buildCallouts(
  phase: StrokePhase,
  shotFamily: string,
  leadElbowAngle?: number,
  kneeFlexionAngle?: number
): CalloutSpec[] {
  const elbowGood =
    typeof leadElbowAngle === 'number' ? leadElbowAngle >= 110 && leadElbowAngle <= 155 : true;
  const kneeGood =
    typeof kneeFlexionAngle === 'number' ? kneeFlexionAngle >= 125 && kneeFlexionAngle <= 155 : true;

  switch (phase) {
    case 'STANCE':
      return [
        {
          id: 'trigger',
          label: shotFamily === 'PULL' ? 'weight back' : 'trigger movement',
          kind: 'trigger',
          tone: 'tip',
        },
        {
          id: 'feet',
          label: 'heel to toe',
          kind: 'feet',
          tone: kneeGood ? 'good' : 'fix',
        },
      ];
    case 'BACKLIFT':
      return [
        {
          id: 'backlift',
          label: shotFamily === 'CUT' ? 'high chop' : 'backlift high',
          kind: 'backlift',
          tone: 'tip',
        },
      ];
    case 'IMPACT':
      if (shotFamily === 'PULL') {
        return [
          { id: 'elbow', label: 'roll wrists', kind: 'elbow', tone: elbowGood ? 'good' : 'fix' },
          { id: 'feet', label: 'pivot base', kind: 'feet', tone: kneeGood ? 'good' : 'fix' },
        ];
      }
      if (shotFamily === 'CUT') {
        return [
          { id: 'elbow', label: 'chop down', kind: 'elbow', tone: elbowGood ? 'good' : 'fix' },
          { id: 'feet', label: 'back foot firm', kind: 'feet', tone: kneeGood ? 'good' : 'fix' },
        ];
      }
      return [
        {
          id: 'elbow',
          label: elbowGood ? 'elbow high' : 'lift elbow',
          kind: 'elbow',
          tone: elbowGood ? 'good' : 'fix',
        },
        {
          id: 'feet',
          label: kneeGood ? 'front knee bent' : 'bend front knee',
          kind: 'feet',
          tone: kneeGood ? 'good' : 'fix',
        },
      ];
    case 'FINISH':
      return [
        {
          id: 'elbow',
          label: shotFamily === 'STRAIGHT' ? 'high follow-through' : 'balanced finish',
          kind: 'elbow',
          tone: 'tip',
        },
      ];
    default:
      return [];
  }
}

function phaseBanner(phase: StrokePhase, shotFamily: string, coachingTip?: string): string {
  if (coachingTip && coachingTip.trim().length > 8) {
    return coachingTip.trim().slice(0, 48);
  }
  if (phase === 'STANCE') {
    return shotFamily === 'PULL'
      ? 'Get onto the back foot early'
      : 'Trigger movement back and across';
  }
  if (phase === 'BACKLIFT') return 'Keep the backlift high and free';
  if (phase === 'IMPACT') {
    if (shotFamily === 'CUT') return 'Chop down on top of the bounce';
    if (shotFamily === 'PULL') return 'Roll wrists to keep it down';
    return 'Lead with a high front elbow';
  }
  return 'Hold the pose — balance over the front side';
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/** Map a point inside the video frame into the letterboxed viewport. */
function mapToViewport(
  nx: number,
  ny: number,
  viewW: number,
  viewH: number,
  videoAspect: number
) {
  const viewAspect = viewW / Math.max(1, viewH);
  let contentW: number;
  let contentH: number;
  let offsetX: number;
  let offsetY: number;

  if (viewAspect > videoAspect) {
    // Pillarbox (portrait video in wider box)
    contentH = viewH;
    contentW = viewH * videoAspect;
    offsetX = (viewW - contentW) / 2;
    offsetY = 0;
  } else {
    // Letterbox
    contentW = viewW;
    contentH = viewW / videoAspect;
    offsetX = 0;
    offsetY = (viewH - contentH) / 2;
  }

  return {
    x: offsetX + clamp01(nx) * contentW,
    y: offsetY + clamp01(ny) * contentH,
    contentW,
    contentH,
    offsetX,
    offsetY,
  };
}

function mergeAnchors(anchors?: BodyAnchors): Required<BodyAnchors> {
  return {
    head: anchors?.head || DEFAULT_ANCHORS.head,
    leadElbow: anchors?.leadElbow || DEFAULT_ANCHORS.leadElbow,
    leadWrist: anchors?.leadWrist || DEFAULT_ANCHORS.leadWrist,
    leftAnkle: anchors?.leftAnkle || DEFAULT_ANCHORS.leftAnkle,
    rightAnkle: anchors?.rightAnkle || DEFAULT_ANCHORS.rightAnkle,
  };
}

export const CoachingCalloutOverlay: React.FC<CoachingCalloutOverlayProps> = ({
  phase,
  shotType = 'COVER DRIVE',
  leadElbowAngle,
  kneeFlexionAngle,
  coachingTip,
  visible = true,
  anchors,
  videoAspect = 9 / 16,
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [size, setSize] = useState({ w: 360, h: 280 });

  const shotFamily = useMemo(() => resolveShotFamily(shotType), [shotType]);
  const callouts = useMemo(
    () => buildCallouts(phase, shotFamily, leadElbowAngle, kneeFlexionAngle),
    [phase, shotFamily, leadElbowAngle, kneeFlexionAngle]
  );
  const banner = useMemo(
    () => phaseBanner(phase, shotFamily, coachingTip),
    [phase, shotFamily, coachingTip]
  );
  const body = useMemo(() => mergeAnchors(anchors), [anchors]);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [phase, fade]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize({ w: width, h: height });
    }
  };

  if (!visible || callouts.length === 0) return null;

  const showElbow = callouts.some((c) => c.kind === 'elbow');
  const showBacklift = callouts.some((c) => c.kind === 'backlift');
  const showFeet = callouts.some((c) => c.kind === 'feet' || c.kind === 'trigger');
  const elbowCallout = callouts.find((c) => c.kind === 'elbow');
  const backliftCallout = callouts.find((c) => c.kind === 'backlift');
  const feetCallout =
    callouts.find((c) => c.kind === 'feet') || callouts.find((c) => c.kind === 'trigger');

  const elbowPt = mapToViewport(body.leadElbow.x, body.leadElbow.y, size.w, size.h, videoAspect);
  const wristPt = mapToViewport(body.leadWrist.x, body.leadWrist.y, size.w, size.h, videoAspect);
  const headPt = mapToViewport(body.head.x, body.head.y, size.w, size.h, videoAspect);
  const leftFoot = mapToViewport(body.leftAnkle.x, body.leftAnkle.y, size.w, size.h, videoAspect);
  const rightFoot = mapToViewport(body.rightAnkle.x, body.rightAnkle.y, size.w, size.h, videoAspect);
  const feetMid = {
    x: (leftFoot.x + rightFoot.x) / 2,
    y: (leftFoot.y + rightFoot.y) / 2,
  };
  // Bat tip / high backlift ≈ above wrist toward head
  const backliftPt = {
    x: wristPt.x * 0.55 + headPt.x * 0.45,
    y: Math.min(wristPt.y, headPt.y) - size.h * 0.04,
  };

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const rElbow = Math.max(14, size.h * 0.055);
  const rBacklift = Math.max(16, size.h * 0.06);
  const rFeet = Math.max(22, size.h * 0.075);

  const labelStyle = (x: number, y: number, preferRight: boolean) => {
    const chipW = 118;
    const left = preferRight
      ? Math.min(size.w - chipW - 8, x + 18)
      : Math.max(8, x - chipW - 10);
    const top = Math.max(36, Math.min(size.h - 36, y - 14));
    return { left, top };
  };

  return (
    <Animated.View
      style={[styles.wrap, { opacity: fade }]}
      pointerEvents="none"
      onLayout={onLayout}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerText} numberOfLines={1}>
          {banner}
        </Text>
      </View>

      <Svg width={size.w} height={size.h}>
        {showElbow && (
          <>
            <Path
              d={`M ${elbowPt.x + rElbow + 8} ${elbowPt.y - rElbow - 18} Q ${elbowPt.x + rElbow + 22} ${elbowPt.y - 4} ${elbowPt.x + 8} ${elbowPt.y - 6}`}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <Polygon
              points={`${elbowPt.x + 2},${elbowPt.y - 2} ${elbowPt.x + 14},${elbowPt.y - 10} ${elbowPt.x + 12},${elbowPt.y + 6}`}
              fill="#ef4444"
            />
            <Circle
              cx={elbowPt.x}
              cy={elbowPt.y}
              r={rElbow}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
          </>
        )}

        {showBacklift && (
          <>
            <Line
              x1={backliftPt.x}
              y1={backliftPt.y - rBacklift - 16}
              x2={backliftPt.x}
              y2={backliftPt.y - rBacklift + 2}
              stroke="#ef4444"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <Polygon
              points={`${backliftPt.x},${backliftPt.y - rBacklift + 8} ${backliftPt.x - 7},${backliftPt.y - rBacklift - 4} ${backliftPt.x + 7},${backliftPt.y - rBacklift - 4}`}
              fill="#ef4444"
            />
            <Circle
              cx={backliftPt.x}
              cy={backliftPt.y}
              r={rBacklift}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
          </>
        )}

        {showFeet && (
          <>
            <Circle
              cx={feetMid.x}
              cy={feetMid.y}
              r={rFeet}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2.6"
              strokeDasharray="6 4"
            />
            <Line
              x1={feetMid.x - rFeet * 0.7}
              y1={feetMid.y - rFeet * 0.85}
              x2={feetMid.x - 8}
              y2={feetMid.y - 6}
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <Line
              x1={feetMid.x + rFeet * 0.7}
              y1={feetMid.y - rFeet * 0.85}
              x2={feetMid.x + 8}
              y2={feetMid.y - 6}
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {feetCallout?.kind === 'trigger' && (
              <Path
                d={`M ${feetMid.x - rFeet * 1.05} ${feetMid.y - rFeet * 0.85} H ${feetMid.x + rFeet * 1.05} V ${feetMid.y + rFeet * 0.95} H ${feetMid.x - rFeet * 1.05} Z`}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                opacity={0.92}
              />
            )}
          </>
        )}
      </Svg>

      {elbowCallout && (
        <Animated.View
          style={[
            styles.labelChip,
            labelStyle(elbowPt.x, elbowPt.y, elbowPt.x < size.w * 0.55),
            { transform: [{ scale }] },
          ]}
        >
          <Text style={styles.labelText}>{elbowCallout.label}</Text>
        </Animated.View>
      )}

      {backliftCallout && (
        <Animated.View
          style={[
            styles.labelChip,
            labelStyle(backliftPt.x, backliftPt.y, backliftPt.x < size.w * 0.55),
            { transform: [{ scale }] },
          ]}
        >
          <Text style={styles.labelText}>{backliftCallout.label}</Text>
        </Animated.View>
      )}

      {feetCallout && (
        <Animated.View
          style={[
            styles.labelChip,
            labelStyle(feetMid.x, feetMid.y - rFeet, feetMid.x < size.w * 0.55),
            { transform: [{ scale }] },
          ]}
        >
          <Text style={styles.labelText}>{feetCallout.label}</Text>
        </Animated.View>
      )}

      <View style={styles.phasePill}>
        <Text style={styles.phasePillText}>{phase}</Text>
      </View>
    </Animated.View>
  );
};

/** Pull body anchors from report landmark / time-series payloads (best-effort). */
export function extractBodyAnchors(
  landmarkFrames: any[] | undefined,
  progressRatio: number
): BodyAnchors | undefined {
  if (!landmarkFrames || landmarkFrames.length === 0) return undefined;

  const idx = Math.min(
    landmarkFrames.length - 1,
    Math.max(0, Math.floor(progressRatio * landmarkFrames.length))
  );
  const frame = landmarkFrames[idx];
  const list: any[] = Array.isArray(frame)
    ? frame
    : Array.isArray(frame?.landmarks)
      ? frame.landmarks
      : Array.isArray(frame?.points)
        ? frame.points
        : [];

  if (!list.length) {
    // Sometimes the frame itself is a name→{x,y} map
    if (frame && typeof frame === 'object' && !Array.isArray(frame)) {
      return anchorsFromNamedMap(frame);
    }
    return undefined;
  }

  const byName = (names: string[]) => {
    const hit = list.find((p) => {
      const n = String(p?.name || p?.landmark || p?.id || '').toLowerCase();
      return names.some((want) => n.includes(want));
    });
    return toPoint(hit);
  };

  const byIndex = (ids: number[]) => {
    const hit = list.find((p) => ids.includes(Number(p?.id)));
    return toPoint(hit);
  };

  // MediaPipe Pose indices: nose=0, L elbow=13, R elbow=14, L wrist=15, R wrist=16, L ankle=27, R ankle=28
  const head = byName(['nose', 'head']) || byIndex([0]);
  const leadElbow = byName(['left_elbow', 'left elbow']) || byIndex([13]);
  const leadWrist = byName(['left_wrist', 'left wrist']) || byIndex([15]);
  const leftAnkle = byName(['left_ankle', 'left ankle']) || byIndex([27]);
  const rightAnkle = byName(['right_ankle', 'right ankle']) || byIndex([28]);

  if (!head && !leadElbow && !leftAnkle) return undefined;

  return {
    head: head || undefined,
    leadElbow: leadElbow || undefined,
    leadWrist: leadWrist || undefined,
    leftAnkle: leftAnkle || undefined,
    rightAnkle: rightAnkle || undefined,
  };
}

function toPoint(p: any): LandmarkPoint | undefined {
  if (!p) return undefined;
  let x = p.x ?? p.X;
  let y = p.y ?? p.Y;
  if (typeof x !== 'number' || typeof y !== 'number') {
    if (typeof p.pixel_x === 'number' && typeof p.pixel_y === 'number') {
      // Assume HD-ish if no image size — treat as already normalized if <= 1.5
      x = p.pixel_x;
      y = p.pixel_y;
    } else {
      return undefined;
    }
  }
  // Normalize if values look like pixels
  if (x > 1.5 || y > 1.5) {
    const w = p.image_width || p.frame_width || 1080;
    const h = p.image_height || p.frame_height || 1920;
    x = x / w;
    y = y / h;
  }
  if (Number.isNaN(x) || Number.isNaN(y)) return undefined;
  return { x: clamp01(x), y: clamp01(y) };
}

function anchorsFromNamedMap(frame: Record<string, any>): BodyAnchors | undefined {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = frame[k] ?? frame[k.toLowerCase()] ?? frame[k.toUpperCase()];
      const pt = toPoint(v);
      if (pt) return pt;
    }
    return undefined;
  };
  const head = pick('nose', 'head');
  const leadElbow = pick('left_elbow', 'LEFT_ELBOW');
  const leadWrist = pick('left_wrist', 'LEFT_WRIST');
  const leftAnkle = pick('left_ankle', 'LEFT_ANKLE');
  const rightAnkle = pick('right_ankle', 'RIGHT_ANKLE');
  if (!head && !leadElbow && !leftAnkle) return undefined;
  return { head, leadElbow, leadWrist, leftAnkle, rightAnkle };
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  banner: {
    position: 'absolute',
    top: 44,
    alignSelf: 'center',
    maxWidth: '88%',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    zIndex: 2,
  },
  bannerText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  labelChip: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    zIndex: 3,
    maxWidth: 140,
  },
  labelText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  phasePill: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    left: '38%',
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    zIndex: 2,
  },
  phasePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
});
