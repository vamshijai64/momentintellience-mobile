import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import Svg, {
  Circle,
  Line,
  Polygon,
  Rect,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ARShotMode = 'PULL SHOT' | 'COVER DRIVE' | 'DEFENSIVE';
export type ARBattingStance = 'RIGHT' | 'LEFT';

interface RealtimeARCoachOverlayProps {
  visible?: boolean;
  onClose?: () => void;
  defaultShot?: ARShotMode;
  battingStance?: ARBattingStance;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface SkeletonJoints3D {
  head: Point3D;
  neck: Point3D;
  leftShoulder: Point3D;
  rightShoulder: Point3D;
  leftElbow: Point3D;
  rightElbow: Point3D;
  leftWrist: Point3D;
  rightWrist: Point3D;
  spine: Point3D;
  pelvis: Point3D;
  leftHip: Point3D;
  rightHip: Point3D;
  leftKnee: Point3D;
  rightKnee: Point3D;
  leftAnkle: Point3D;
  rightAnkle: Point3D;
  batHandle: Point3D;
  batMiddle: Point3D;
  batToe: Point3D;
}

// Keyframe postures for PULL SHOT (Chest-height horizontal swivel, rear-foot loaded)
const PULL_SHOT_KEYFRAME: SkeletonJoints3D = {
  head: { x: 0.04, y: -0.88, z: 0.05 },
  neck: { x: 0.03, y: -0.76, z: 0.04 },
  leftShoulder: { x: -0.16, y: -0.70, z: -0.10 }, // front shoulder
  rightShoulder: { x: 0.18, y: -0.70, z: 0.12 },  // rear shoulder
  leftElbow: { x: -0.28, y: -0.56, z: -0.05 },    // high lead elbow extended horizontally
  rightElbow: { x: 0.06, y: -0.54, z: 0.22 },     // tucked rear elbow pulling through
  leftWrist: { x: -0.18, y: -0.48, z: 0.08 },     // top hand
  rightWrist: { x: -0.14, y: -0.46, z: 0.12 },    // bottom hand rolled
  spine: { x: 0.02, y: -0.52, z: 0.02 },
  pelvis: { x: 0.02, y: -0.32, z: 0.0 },
  leftHip: { x: -0.12, y: -0.30, z: -0.05 },
  rightHip: { x: 0.14, y: -0.30, z: 0.05 },
  leftKnee: { x: -0.22, y: -0.02, z: -0.15 },     // front leg lifted/swivelling on toe
  rightKnee: { x: 0.18, y: 0.02, z: 0.10 },       // braced back leg absorbing impact
  leftAnkle: { x: -0.24, y: 0.38, z: -0.18 },
  rightAnkle: { x: 0.16, y: 0.40, z: 0.08 },
  batHandle: { x: -0.16, y: -0.47, z: 0.10 },
  batMiddle: { x: 0.08, y: -0.45, z: 0.20 },      // horizontal bat path
  batToe: { x: 0.32, y: -0.44, z: 0.26 },         // toe pointing square/mid-wicket
};

// Keyframe postures for COVER DRIVE (Front-foot lunge, high lead elbow 142°, vertical bat)
const COVER_DRIVE_KEYFRAME: SkeletonJoints3D = {
  head: { x: -0.14, y: -0.84, z: -0.15 },         // head stacked over front knee
  neck: { x: -0.12, y: -0.72, z: -0.12 },
  leftShoulder: { x: -0.26, y: -0.66, z: -0.18 },
  rightShoulder: { x: 0.04, y: -0.64, z: 0.02 },
  leftElbow: { x: -0.38, y: -0.60, z: -0.25 },    // classic high front elbow (140°)
  rightElbow: { x: -0.06, y: -0.44, z: -0.04 },
  leftWrist: { x: -0.22, y: -0.34, z: -0.14 },    // firm top hand grip
  rightWrist: { x: -0.18, y: -0.32, z: -0.10 },
  spine: { x: -0.06, y: -0.46, z: -0.06 },
  pelvis: { x: 0.02, y: -0.26, z: 0.0 },
  leftHip: { x: -0.10, y: -0.24, z: -0.06 },
  rightHip: { x: 0.12, y: -0.24, z: 0.04 },
  leftKnee: { x: -0.18, y: 0.04, z: -0.16 },      // deep front knee bend
  rightKnee: { x: 0.22, y: 0.08, z: 0.12 },       // extended back leg
  leftAnkle: { x: -0.16, y: 0.40, z: -0.16 },     // firmly planted front foot on crease
  rightAnkle: { x: 0.36, y: 0.38, z: 0.18 },      // back toe trailing
  batHandle: { x: -0.20, y: -0.33, z: -0.12 },
  batMiddle: { x: -0.19, y: 0.02, z: -0.13 },     // vertical presentation
  batToe: { x: -0.18, y: 0.34, z: -0.14 },        // toe driving toward extra cover
};

// Keyframe postures for DEFENSIVE BLOCK
const DEFENSIVE_KEYFRAME: SkeletonJoints3D = {
  head: { x: -0.08, y: -0.82, z: -0.08 },
  neck: { x: -0.07, y: -0.70, z: -0.06 },
  leftShoulder: { x: -0.20, y: -0.64, z: -0.12 },
  rightShoulder: { x: 0.08, y: -0.62, z: 0.06 },
  leftElbow: { x: -0.26, y: -0.50, z: -0.14 },
  rightElbow: { x: 0.0, y: -0.42, z: 0.02 },
  leftWrist: { x: -0.14, y: -0.28, z: -0.06 },
  rightWrist: { x: -0.10, y: -0.26, z: -0.02 },
  spine: { x: -0.02, y: -0.44, z: -0.02 },
  pelvis: { x: 0.02, y: -0.24, z: 0.0 },
  leftHip: { x: -0.08, y: -0.22, z: -0.04 },
  rightHip: { x: 0.10, y: -0.22, z: 0.04 },
  leftKnee: { x: -0.10, y: 0.06, z: -0.08 },
  rightKnee: { x: 0.16, y: 0.08, z: 0.08 },
  leftAnkle: { x: -0.10, y: 0.40, z: -0.08 },
  rightAnkle: { x: 0.24, y: 0.38, z: 0.12 },
  batHandle: { x: -0.12, y: -0.27, z: -0.04 },
  batMiddle: { x: -0.10, y: 0.06, z: -0.05 },
  batToe: { x: -0.08, y: 0.36, z: -0.06 },
};

export const RealtimeARCoachOverlay: React.FC<RealtimeARCoachOverlayProps> = ({
  visible = true,
  onClose,
  defaultShot = 'COVER DRIVE',
  battingStance = 'RIGHT',
}) => {
  const [activeShot, setActiveShot] = useState<ARShotMode>(defaultShot);
  const [stance, setStance] = useState<ARBattingStance>(battingStance);
  const [arScale, setArScale] = useState<number>(1.0);
  const [arOffsetY, setArOffsetY] = useState<number>(0);
  const [showPlumbLine, setShowPlumbLine] = useState<boolean>(true);
  const [showGroundGrid, setShowGroundGrid] = useState<boolean>(true);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);

  // Animation pulse for AR holographic laser scanner
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const swingPhaseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle breathing/kinematic micro-movement in stance
    Animated.loop(
      Animated.sequence([
        Animated.timing(swingPhaseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(swingPhaseAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (!visible) return null;

  const rawKeyframe =
    activeShot === 'PULL SHOT'
      ? PULL_SHOT_KEYFRAME
      : activeShot === 'DEFENSIVE'
      ? DEFENSIVE_KEYFRAME
      : COVER_DRIVE_KEYFRAME;

  // 3D Perspective Projection Function
  // Transforms 3D coordinate (x,y,z) into 2D screen coordinate (sx, sy)
  const focalLength = 380;
  const cameraDistance = 2.4;
  const originX = SCREEN_WIDTH * 0.5;
  const originY = SCREEN_HEIGHT * 0.48 + arOffsetY;
  const isLeftHanded = stance === 'LEFT';

  const project3D = (pt: Point3D): { x: number; y: number; zDepth: number } => {
    // If left-handed stance, mirror horizontal X axis
    const worldX = isLeftHanded ? -pt.x : pt.x;
    const worldY = pt.y;
    const worldZ = pt.z;

    const scaleFactor = (focalLength / (worldZ + cameraDistance)) * arScale;
    const sx = originX + worldX * scaleFactor;
    const sy = originY + worldY * scaleFactor;

    return { x: sx, y: sy, zDepth: worldZ };
  };

  // Project all joints to 2D screen space
  const head = project3D(rawKeyframe.head);
  const neck = project3D(rawKeyframe.neck);
  const lShoulder = project3D(rawKeyframe.leftShoulder);
  const rShoulder = project3D(rawKeyframe.rightShoulder);
  const lElbow = project3D(rawKeyframe.leftElbow);
  const rElbow = project3D(rawKeyframe.rightElbow);
  const lWrist = project3D(rawKeyframe.leftWrist);
  const rWrist = project3D(rawKeyframe.rightWrist);
  const spine = project3D(rawKeyframe.spine);
  const pelvis = project3D(rawKeyframe.pelvis);
  const lHip = project3D(rawKeyframe.leftHip);
  const rHip = project3D(rawKeyframe.rightHip);
  const lKnee = project3D(rawKeyframe.leftKnee);
  const rKnee = project3D(rawKeyframe.rightKnee);
  const lAnkle = project3D(rawKeyframe.leftAnkle);
  const rAnkle = project3D(rawKeyframe.rightAnkle);
  const batHandle = project3D(rawKeyframe.batHandle);
  const batMiddle = project3D(rawKeyframe.batMiddle);
  const batToe = project3D(rawKeyframe.batToe);

  // Calculate bat blade quad in 3D
  const batWidth = 14 * arScale;
  const batPerpX = batMiddle.y - batHandle.y;
  const batPerpY = -(batMiddle.x - batHandle.x);
  const batLen = Math.sqrt(batPerpX * batPerpX + batPerpY * batPerpY) || 1;
  const nx = (batPerpX / batLen) * batWidth;
  const ny = (batPerpY / batLen) * batWidth;

  const batQuadPoints = `${batHandle.x - nx * 0.4},${batHandle.y - ny * 0.4} ${
    batHandle.x + nx * 0.4
  },${batHandle.y + ny * 0.4} ${batToe.x + nx},${batToe.y + ny} ${
    batToe.x - nx
  },${batToe.y - ny}`;

  // Ground crease plane in 3D
  const creaseBack = project3D({ x: 0, y: 0.44, z: 0.5 });
  const creaseFront = project3D({ x: 0, y: 0.44, z: -0.5 });
  const creaseLeft = project3D({ x: -0.6, y: 0.44, z: 0 });
  const creaseRight = project3D({ x: 0.6, y: 0.44, z: 0 });

  // Real-time coaching cue message based on shot type
  const coachingCue =
    activeShot === 'PULL SHOT'
      ? 'Chest-height swivel · Roll wrists along horizontal bat path'
      : activeShot === 'COVER DRIVE'
      ? 'High lead elbow (142°) · Head aligned directly over front knee'
      : 'Soft hands under eyes · Angled face downward onto pitch';

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 3D Augmented Reality Holographic SVG Layer */}
      <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Defs>
          {/* Cyber Cyan Hologram Gradient */}
          <LinearGradient id="arHoloCyan" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
          </LinearGradient>

          {/* Golden Pro Target Gradient */}
          <LinearGradient id="arGold" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#fde047" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
          </LinearGradient>

          {/* Bat Blade Gradient */}
          <LinearGradient id="arBatGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#b45309" stopOpacity="0.7" />
          </LinearGradient>

          {/* Radar Scanner Glow */}
          <RadialGradient id="arRadarGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </RadialGradient>
        </Defs>

        {/* 1. AR Ground Crease Grid (Perspective 3D Pitch Plane) */}
        {showGroundGrid && (
          <G opacity={0.65}>
            {/* Crease Ring */}
            <Circle
              cx={(lAnkle.x + rAnkle.x) / 2}
              cy={(lAnkle.y + rAnkle.y) / 2}
              r={70 * arScale}
              fill="url(#arRadarGlow)"
              stroke="#0284c7"
              strokeWidth="1.2"
              strokeDasharray="4,4"
            />
            {/* Pop Crease Line */}
            <Line
              x1={creaseLeft.x}
              y1={creaseLeft.y}
              x2={creaseRight.x}
              y2={creaseRight.y}
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="6,3"
            />
            {/* Return Crease Orthogonals */}
            <Line
              x1={creaseBack.x}
              y1={creaseBack.y}
              x2={creaseFront.x}
              y2={creaseFront.y}
              stroke="#0284c7"
              strokeWidth="1.2"
              strokeDasharray="3,3"
            />
          </G>
        )}

        {/* 2. AR Head-Over-Foot Laser Plumb Line */}
        {showPlumbLine && (
          <G opacity={0.8}>
            <Line
              x1={head.x}
              y1={head.y}
              x2={activeShot === 'PULL SHOT' ? rAnkle.x : lAnkle.x}
              y2={activeShot === 'PULL SHOT' ? rAnkle.y : lAnkle.y}
              stroke="#38bdf8"
              strokeWidth="1.6"
              strokeDasharray="3,3"
            />
            <Circle
              cx={activeShot === 'PULL SHOT' ? rAnkle.x : lAnkle.x}
              cy={activeShot === 'PULL SHOT' ? rAnkle.y : lAnkle.y}
              r={6}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
          </G>
        )}

        {/* 3. 3D Skeleton Limbs (Depth-rendered Bones) */}
        <G strokeLinecap="round" opacity={0.92}>
          {/* Spine & Torso */}
          <Line
            x1={neck.x}
            y1={neck.y}
            x2={spine.x}
            y2={spine.y}
            stroke="url(#arHoloCyan)"
            strokeWidth={4.5 * arScale}
          />
          <Line
            x1={spine.x}
            y1={spine.y}
            x2={pelvis.x}
            y2={pelvis.y}
            stroke="url(#arHoloCyan)"
            strokeWidth={4.5 * arScale}
          />

          {/* Shoulders Beam */}
          <Line
            x1={lShoulder.x}
            y1={lShoulder.y}
            x2={rShoulder.x}
            y2={rShoulder.y}
            stroke="url(#arHoloCyan)"
            strokeWidth={4 * arScale}
          />

          {/* Pelvis Beam */}
          <Line
            x1={lHip.x}
            y1={lHip.y}
            x2={rHip.x}
            y2={rHip.y}
            stroke="url(#arHoloCyan)"
            strokeWidth={3.8 * arScale}
          />

          {/* Lead Arm (Front) */}
          <Line
            x1={lShoulder.x}
            y1={lShoulder.y}
            x2={lElbow.x}
            y2={lElbow.y}
            stroke="url(#arGold)"
            strokeWidth={3.8 * arScale}
          />
          <Line
            x1={lElbow.x}
            y1={lElbow.y}
            x2={lWrist.x}
            y2={lWrist.y}
            stroke="url(#arGold)"
            strokeWidth={3.5 * arScale}
          />

          {/* Rear Arm */}
          <Line
            x1={rShoulder.x}
            y1={rShoulder.y}
            x2={rElbow.x}
            y2={rElbow.y}
            stroke="url(#arHoloCyan)"
            strokeWidth={3.2 * arScale}
          />
          <Line
            x1={rElbow.x}
            y1={rElbow.y}
            x2={rWrist.x}
            y2={rWrist.y}
            stroke="url(#arHoloCyan)"
            strokeWidth={3.0 * arScale}
          />

          {/* Front Leg */}
          <Line
            x1={lHip.x}
            y1={lHip.y}
            x2={lKnee.x}
            y2={lKnee.y}
            stroke="url(#arGold)"
            strokeWidth={4 * arScale}
          />
          <Line
            x1={lKnee.x}
            y1={lKnee.y}
            x2={lAnkle.x}
            y2={lAnkle.y}
            stroke="url(#arGold)"
            strokeWidth={3.8 * arScale}
          />

          {/* Rear Leg */}
          <Line
            x1={rHip.x}
            y1={rHip.y}
            x2={rKnee.x}
            y2={rKnee.y}
            stroke="url(#arHoloCyan)"
            strokeWidth={3.8 * arScale}
          />
          <Line
            x1={rKnee.x}
            y1={rKnee.y}
            x2={rAnkle.x}
            y2={rAnkle.y}
            stroke="url(#arHoloCyan)"
            strokeWidth={3.5 * arScale}
          />
        </G>

        {/* 4. 3D Cricket Bat (Rendered with Sweet Spot indicator) */}
        <G>
          {/* Bat Handle / Grip */}
          <Line
            x1={lWrist.x}
            y1={lWrist.y}
            x2={batHandle.x}
            y2={batHandle.y}
            stroke="#e2e8f0"
            strokeWidth={4 * arScale}
            strokeLinecap="round"
          />
          {/* Bat Blade Polygon */}
          <Polygon
            points={batQuadPoints}
            fill="url(#arBatGlow)"
            stroke="#fef08a"
            strokeWidth={1.5}
            opacity={0.88}
          />
          {/* Sweet Spot Target Ring */}
          <Circle
            cx={batMiddle.x}
            cy={batMiddle.y}
            r={7 * arScale}
            fill="#ef4444"
            opacity={0.85}
            stroke="#ffffff"
            strokeWidth={1.5}
          />
        </G>

        {/* 5. 3D Holographic Joint Nodes */}
        <G>
          {/* Head & Helmet */}
          <Circle
            cx={head.x}
            cy={head.y}
            r={13 * arScale}
            fill="url(#arHoloCyan)"
            stroke="#ffffff"
            strokeWidth={2}
          />
          {/* Helmet Grill Visor direction line */}
          <Line
            x1={head.x}
            y1={head.y}
            x2={head.x + (isLeftHanded ? -14 : 14) * arScale}
            y2={head.y + 4 * arScale}
            stroke="#ffffff"
            strokeWidth={2}
          />

          {/* High Lead Elbow Key Target Node */}
          <Circle
            cx={lElbow.x}
            cy={lElbow.y}
            r={6.5 * arScale}
            fill="#facc15"
            stroke="#ffffff"
            strokeWidth={2}
          />
          {/* Front Knee Pivot Node */}
          <Circle
            cx={lKnee.x}
            cy={lKnee.y}
            r={6.5 * arScale}
            fill="#facc15"
            stroke="#ffffff"
            strokeWidth={2}
          />

          {/* Other Joints */}
          {[neck, rElbow, lWrist, rWrist, pelvis, rKnee, lAnkle, rAnkle].map(
            (node, idx) => (
              <Circle
                key={idx}
                cx={node.x}
                cy={node.y}
                r={4.5 * arScale}
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth={1.2}
              />
            )
          )}
        </G>
      </Svg>

      {/* Floating Holographic AR HUD Controls Header */}
      <View style={styles.topHudContainer} pointerEvents="box-none">
        <View style={styles.arBadgeRow}>
          <View style={styles.arLivePill}>
            <View style={styles.liveGreenDot} />
            <Text style={styles.arLiveText}>GHOST STANCE GUIDE</Text>
          </View>

          <View style={styles.arStancePill}>
            <TouchableOpacity
              onPress={() => setStance((s) => (s === 'RIGHT' ? 'LEFT' : 'RIGHT'))}
              activeOpacity={0.8}
            >
              <Text style={styles.arStanceText}>
                STANCE: {stance === 'RIGHT' ? 'RHB' : 'LHB'} ⇄
              </Text>
            </TouchableOpacity>
          </View>

          {onClose && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Live Technique Prompt Banner */}
        <View style={styles.coachingBanner}>
          <Text style={styles.shotTitleBadge}>{activeShot}</Text>
          <Text style={styles.coachingPromptText} numberOfLines={2}>
            {coachingCue}
          </Text>
        </View>
      </View>

      {/* Bottom AR Control Dock */}
      <View style={styles.bottomDock} pointerEvents="box-none">
        {/* Shot Mode Selector */}
        <View style={styles.shotSelectorRow}>
          {(['PULL SHOT', 'COVER DRIVE', 'DEFENSIVE'] as const).map((shot) => {
            const isActive = activeShot === shot;
            return (
              <TouchableOpacity
                key={shot}
                style={[styles.shotPill, isActive && styles.shotPillActive]}
                onPress={() => setActiveShot(shot)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.shotPillText,
                    isActive && styles.shotPillTextActive,
                  ]}
                >
                  {shot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* AR Adjustment Utilities: Scale, Nudge, Grid, Plumb */}
        <View style={styles.utilityRow}>
          <TouchableOpacity
            style={styles.utilBtn}
            onPress={() => setArScale((s) => Math.max(0.7, s - 0.1))}
            activeOpacity={0.8}
          >
            <Text style={styles.utilBtnText}>－ SIZE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.utilBtn}
            onPress={() => setArScale((s) => Math.min(1.4, s + 0.1))}
            activeOpacity={0.8}
          >
            <Text style={styles.utilBtnText}>＋ SIZE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.utilBtn, showPlumbLine && styles.utilBtnActive]}
            onPress={() => setShowPlumbLine((p) => !p)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.utilBtnText,
                showPlumbLine && styles.utilBtnTextActive,
              ]}
            >
              PLUMB {showPlumbLine ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.utilBtn, showGroundGrid && styles.utilBtnActive]}
            onPress={() => setShowGroundGrid((g) => !g)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.utilBtnText,
                showGroundGrid && styles.utilBtnTextActive,
              ]}
            >
              CREASE {showGroundGrid ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 15,
  },
  topHudContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 28,
    left: 14,
    right: 14,
    gap: 8,
  },
  arBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  arLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
    gap: 6,
  },
  liveGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  arLiveText: {
    color: '#38bdf8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  arStancePill: {
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.5)',
  },
  arStanceText: {
    color: '#fbbf24',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  coachingBanner: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 4,
  },
  shotTitleBadge: {
    color: '#facc15',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  coachingPromptText: {
    color: '#f1f5f9',
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  bottomDock: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 105,
    left: 14,
    right: 14,
    gap: 8,
  },
  shotSelectorRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 4,
  },
  shotPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  shotPillActive: {
    backgroundColor: '#0284c7',
  },
  shotPillText: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  shotPillTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  utilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  utilBtn: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  utilBtnActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(2, 132, 199, 0.3)',
  },
  utilBtnText: {
    color: '#cbd5e1',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  utilBtnTextActive: {
    color: '#38bdf8',
  },
});
