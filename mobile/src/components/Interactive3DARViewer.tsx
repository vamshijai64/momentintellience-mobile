import React, { useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Platform,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import Svg, {
  Circle,
  Line,
  Polygon,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface Interactive3DARViewerProps {
  shotType?: string;
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
  rearKneeAngle?: number;
  spineAngle?: number;
  overallScore?: number;
  userLandmarks?: any[];
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export const Interactive3DARViewer: React.FC<Interactive3DARViewerProps> = ({
  shotType = 'COVER DRIVE',
  leadElbowAngle = 142,
  kneeFlexionAngle = 136,
  rearKneeAngle = 110,
  spineAngle = 126,
  overallScore = 88,
  userLandmarks,
}) => {
  const isPull = shotType.toUpperCase().includes('PULL');

  // 3D Orbital Camera Angles (radians)
  const [yaw, setYaw] = useState<number>(isPull ? 0.35 : -0.3); // Azimuth rotation
  const [pitch, setPitch] = useState<number>(0.12);              // Elevation tilt
  const [zoom, setZoom] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'PRO' | 'COMPARE' | 'GHOST'>('PRO');
  const [selectedJoint, setSelectedJoint] = useState<string | null>(
    isPull ? 'WRIST ROLL' : 'LEAD ELBOW'
  );

  const lastPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // PanResponder to handle smooth 360° touch rotation
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastPanRef.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx - lastPanRef.current.x;
        const dy = gestureState.dy - lastPanRef.current.y;
        lastPanRef.current = { x: gestureState.dx, y: gestureState.dy };

        setYaw((prev) => prev + dx * 0.015);
        setPitch((prev) => Math.max(-0.6, Math.min(0.7, prev - dy * 0.015)));
      },
      onPanResponderRelease: () => {
        lastPanRef.current = { x: 0, y: 0 };
      },
    })
  ).current;

  // Preset Camera Angles
  const setPresetAngle = (preset: 'BOWLER' | 'SIDE_ON' | 'GULLY' | 'TOP_DOWN') => {
    switch (preset) {
      case 'BOWLER':
        setYaw(0.0);
        setPitch(0.08);
        break;
      case 'SIDE_ON':
        setYaw(Math.PI / 2);
        setPitch(0.05);
        break;
      case 'GULLY':
        setYaw(isPull ? -Math.PI / 4 : Math.PI / 4);
        setPitch(0.15);
        break;
      case 'TOP_DOWN':
        setYaw(0.0);
        setPitch(0.65);
        break;
    }
  };

  // Reset Camera View to optimal default
  const handleResetView = () => {
    setYaw(isPull ? 0.35 : -0.3);
    setPitch(0.12);
    setZoom(1.0);
  };

  // Biomechanical Joint Data (3D coordinates in meters relative to pelvis origin)
  const proJoints: Record<string, Point3D> = useMemo(() => {
    const s = (shotType || '').toUpperCase();
    if (s.includes('PULL') || s.includes('HOOK')) {
      return {
        head: { x: 0.05, y: -0.92, z: 0.06 },
        neck: { x: 0.04, y: -0.78, z: 0.05 },
        leftShoulder: { x: -0.20, y: -0.72, z: -0.12 },
        rightShoulder: { x: 0.22, y: -0.72, z: 0.14 },
        leftElbow: { x: -0.32, y: -0.58, z: -0.06 },
        rightElbow: { x: 0.08, y: -0.56, z: 0.24 },
        leftWrist: { x: -0.22, y: -0.48, z: 0.10 },
        rightWrist: { x: -0.16, y: -0.46, z: 0.14 },
        spine: { x: 0.03, y: -0.54, z: 0.02 },
        pelvis: { x: 0.02, y: -0.32, z: 0.0 },
        leftHip: { x: -0.14, y: -0.30, z: -0.06 },
        rightHip: { x: 0.16, y: -0.30, z: 0.06 },
        leftKnee: { x: -0.26, y: -0.02, z: -0.18 },
        rightKnee: { x: 0.20, y: 0.02, z: 0.12 },
        leftAnkle: { x: -0.28, y: 0.40, z: -0.22 },
        rightAnkle: { x: 0.18, y: 0.42, z: 0.10 },
        batGrip: { x: -0.18, y: -0.47, z: 0.12 },
        batSweetSpot: { x: 0.12, y: -0.45, z: 0.24 },
        batToe: { x: 0.38, y: -0.44, z: 0.30 },
      };
    }
    if (s.includes('STRAIGHT') || s.includes('ON DRIVE')) {
      return {
        head: { x: -0.12, y: -0.89, z: -0.08 },
        neck: { x: -0.10, y: -0.75, z: -0.07 },
        leftShoulder: { x: -0.25, y: -0.68, z: -0.16 },
        rightShoulder: { x: 0.08, y: -0.67, z: 0.06 },
        leftElbow: { x: -0.40, y: -0.58, z: -0.22 },
        rightElbow: { x: -0.05, y: -0.48, z: -0.02 },
        leftWrist: { x: -0.20, y: -0.32, z: -0.08 },
        rightWrist: { x: -0.16, y: -0.30, z: -0.04 },
        spine: { x: -0.06, y: -0.49, z: -0.04 },
        pelvis: { x: 0.0, y: -0.27, z: 0.0 },
        leftHip: { x: -0.12, y: -0.25, z: -0.06 },
        rightHip: { x: 0.13, y: -0.25, z: 0.05 },
        leftKnee: { x: -0.16, y: 0.05, z: -0.14 },
        rightKnee: { x: 0.22, y: 0.08, z: 0.12 },
        leftAnkle: { x: -0.14, y: 0.42, z: -0.15 },
        rightAnkle: { x: 0.34, y: 0.40, z: 0.18 },
        batGrip: { x: -0.18, y: -0.31, z: -0.06 },
        batSweetSpot: { x: -0.14, y: 0.05, z: 0.0 },
        batToe: { x: -0.10, y: 0.40, z: 0.04 },
      };
    }
    if (s.includes('DEFENS') || s.includes('BLOCK') || s.includes('LEAVE')) {
      return {
        head: { x: -0.10, y: -0.89, z: -0.06 },
        neck: { x: -0.09, y: -0.75, z: -0.05 },
        leftShoulder: { x: -0.24, y: -0.68, z: -0.14 },
        rightShoulder: { x: 0.08, y: -0.67, z: 0.08 },
        leftElbow: { x: -0.36, y: -0.54, z: -0.18 },
        rightElbow: { x: -0.04, y: -0.46, z: 0.02 },
        leftWrist: { x: -0.18, y: -0.34, z: -0.04 },
        rightWrist: { x: -0.14, y: -0.32, z: 0.0 },
        spine: { x: -0.04, y: -0.48, z: -0.02 },
        pelvis: { x: 0.0, y: -0.27, z: 0.0 },
        leftHip: { x: -0.12, y: -0.25, z: -0.06 },
        rightHip: { x: 0.13, y: -0.25, z: 0.05 },
        leftKnee: { x: -0.14, y: 0.04, z: -0.10 },
        rightKnee: { x: 0.18, y: 0.06, z: 0.10 },
        leftAnkle: { x: -0.12, y: 0.42, z: -0.12 },
        rightAnkle: { x: 0.28, y: 0.40, z: 0.14 },
        batGrip: { x: -0.16, y: -0.33, z: -0.02 },
        batSweetSpot: { x: -0.12, y: -0.02, z: 0.02 },
        batToe: { x: -0.08, y: 0.28, z: 0.06 },
      };
    }
    if (s.includes('CUT') || s.includes('UPPER')) {
      return {
        head: { x: 0.10, y: -0.90, z: 0.08 },
        neck: { x: 0.08, y: -0.76, z: 0.06 },
        leftShoulder: { x: -0.18, y: -0.70, z: -0.10 },
        rightShoulder: { x: 0.24, y: -0.70, z: 0.16 },
        leftElbow: { x: -0.10, y: -0.56, z: 0.14 },
        rightElbow: { x: 0.28, y: -0.54, z: 0.28 },
        leftWrist: { x: 0.10, y: -0.48, z: 0.22 },
        rightWrist: { x: 0.16, y: -0.46, z: 0.24 },
        spine: { x: 0.06, y: -0.52, z: 0.04 },
        pelvis: { x: 0.04, y: -0.30, z: 0.02 },
        leftHip: { x: -0.12, y: -0.28, z: -0.04 },
        rightHip: { x: 0.18, y: -0.28, z: 0.08 },
        leftKnee: { x: -0.18, y: 0.04, z: -0.12 },
        rightKnee: { x: 0.24, y: 0.06, z: 0.16 },
        leftAnkle: { x: -0.20, y: 0.42, z: -0.14 },
        rightAnkle: { x: 0.26, y: 0.42, z: 0.18 },
        batGrip: { x: 0.13, y: -0.47, z: 0.23 },
        batSweetSpot: { x: 0.36, y: -0.50, z: 0.26 },
        batToe: { x: 0.58, y: -0.52, z: 0.28 },
      };
    }
    // Default: COVER DRIVE
    return {
      head: { x: -0.16, y: -0.88, z: -0.16 },
      neck: { x: -0.14, y: -0.74, z: -0.13 },
      leftShoulder: { x: -0.28, y: -0.68, z: -0.20 },
      rightShoulder: { x: 0.06, y: -0.66, z: 0.04 },
      leftElbow: { x: -0.42, y: -0.62, z: -0.28 },
      rightElbow: { x: -0.08, y: -0.46, z: -0.06 },
      leftWrist: { x: -0.24, y: -0.35, z: -0.15 },
      rightWrist: { x: -0.20, y: -0.33, z: -0.11 },
      spine: { x: -0.08, y: -0.48, z: -0.08 },
      pelvis: { x: 0.02, y: -0.26, z: 0.0 },
      leftHip: { x: -0.12, y: -0.24, z: -0.08 },
      rightHip: { x: 0.14, y: -0.24, z: 0.04 },
      leftKnee: { x: -0.20, y: 0.06, z: -0.18 },
      rightKnee: { x: 0.24, y: 0.10, z: 0.14 },
      leftAnkle: { x: -0.18, y: 0.42, z: -0.18 },
      rightAnkle: { x: 0.38, y: 0.40, z: 0.20 },
      batGrip: { x: -0.22, y: -0.34, z: -0.13 },
      batSweetSpot: { x: -0.21, y: 0.04, z: -0.14 },
      batToe: { x: -0.20, y: 0.38, z: -0.15 },
    };
  }, [shotType]);

  // Transform 3D Joint with Yaw & Pitch Rotation + Perspective Projection
  const project3D = (pt: Point3D) => {
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    // Yaw rotation around Y axis
    const x1 = pt.x * cosY - pt.z * sinY;
    const z1 = pt.x * sinY + pt.z * cosY;

    // Pitch rotation around X axis
    const y2 = pt.y * cosP - z1 * sinP;
    const z2 = pt.y * sinP + z1 * cosP;

    const focalLength = 320;
    const cameraDist = 2.5;
    const centerScreenX = 175;
    const centerScreenY = 160;

    const scale = (focalLength / (z2 + cameraDist)) * zoom;
    const sx = centerScreenX + x1 * scale;
    const sy = centerScreenY + y2 * scale;

    return { x: sx, y: sy, depth: z2 };
  };

  // Map joints to 2D
  const proj: Record<string, { x: number; y: number; depth: number }> = {};
  for (const [key, val] of Object.entries(proJoints)) {
    proj[key] = project3D(val);
  }

  // Calculate Bat Polygon in projected space
  const bGrip = proj.batGrip;
  const bMid = proj.batSweetSpot;
  const bToe = proj.batToe;

  const dx = bMid.y - bGrip.y;
  const dy = -(bMid.x - bGrip.x);
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const w = 12 * zoom;
  const nx = (dx / len) * w;
  const ny = (dy / len) * w;

  const batQuad = `${bGrip.x - nx * 0.4},${bGrip.y - ny * 0.4} ${
    bGrip.x + nx * 0.4
  },${bGrip.y + ny * 0.4} ${bToe.x + nx},${bToe.y + ny} ${bToe.x - nx},${
    bToe.y - ny
  }`;

  // Ground 3D Crease Grid Points
  const gCenter = project3D({ x: 0, y: 0.44, z: 0 });
  const gNorth = project3D({ x: 0, y: 0.44, z: 0.6 });
  const gSouth = project3D({ x: 0, y: 0.44, z: -0.6 });
  const gWest = project3D({ x: -0.7, y: 0.44, z: 0 });
  const gEast = project3D({ x: 0.7, y: 0.44, z: 0 });

  return (
    <View style={styles.container}>
      {/* Header with AR Badge and Score */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.hologramBadge}>
            <Text style={styles.hologramBadgeText}>3D BIOMECHANICS RADAR</Text>
          </View>
          <Text style={styles.titleText}>Biomechanical Angle Radar</Text>
        </View>

        <TouchableOpacity
          style={styles.arLaunchButton}
          onPress={handleResetView}
          activeOpacity={0.8}
        >
          <Text style={styles.arLaunchIcon}>🔄</Text>
          <Text style={styles.arLaunchText}>RESET VIEW</Text>
        </TouchableOpacity>
      </View>

      {/* Main 3D Interactive Canvas with Touch Orbit Gesture Handler */}
      <View style={styles.canvasWrapper} {...panResponder.panHandlers}>
        {/* 360° Drag Helper Instruction */}
        <View style={styles.dragPromptBadge} pointerEvents="none">
          <Text style={styles.dragPromptText}>🔄 Drag to orbit 360° · Tilt pitch</Text>
        </View>

        {/* Selected Joint Callout Badge */}
        {selectedJoint && (
          <View style={styles.jointMetricOverlay} pointerEvents="none">
            <Text style={styles.jointMetricLabel}>{selectedJoint}</Text>
            <Text style={styles.jointMetricValue}>
              {selectedJoint === 'LEAD ELBOW'
                ? `${leadElbowAngle}° (Ideal: 140°-145°)`
                : selectedJoint === 'FRONT KNEE'
                ? `${kneeFlexionAngle}° (Ideal: 135°-140°)`
                : selectedJoint === 'WRIST ROLL'
                ? '94% Kinetic Snap'
                : `${spineAngle}° Upright`}
            </Text>
          </View>
        )}

        <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 350 320">
          <Defs>
            <LinearGradient id="goldBone" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#fde047" stopOpacity="0.95" />
              <Stop offset="100%" stopColor="#d97706" stopOpacity="0.85" />
            </LinearGradient>

            <LinearGradient id="cyanBone" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <Stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
            </LinearGradient>

            <LinearGradient id="batBladeGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
              <Stop offset="50%" stopColor="#f59e0b" stopOpacity="0.85" />
              <Stop offset="100%" stopColor="#92400e" stopOpacity="0.8" />
            </LinearGradient>

            <RadialGradient id="creaseGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </RadialGradient>
          </Defs>

          {/* 1. Ground 3D Pitch Crease Ring */}
          <G opacity={0.6}>
            <Circle
              cx={gCenter.x}
              cy={gCenter.y}
              r={60 * zoom}
              fill="url(#creaseGlow)"
              stroke="#0284c7"
              strokeWidth="1.2"
              strokeDasharray="4,4"
            />
            <Line
              x1={gWest.x}
              y1={gWest.y}
              x2={gEast.x}
              y2={gEast.y}
              stroke="#38bdf8"
              strokeWidth="1.8"
              strokeDasharray="5,3"
            />
            <Line
              x1={gSouth.x}
              y1={gSouth.y}
              x2={gNorth.x}
              y2={gNorth.y}
              stroke="#0284c7"
              strokeWidth="1.2"
              strokeDasharray="3,3"
            />
          </G>

          {/* 2. Plumb Line */}
          <Line
            x1={proj.head.x}
            y1={proj.head.y}
            x2={isPull ? proj.rightAnkle.x : proj.leftAnkle.x}
            y2={isPull ? proj.rightAnkle.y : proj.leftAnkle.y}
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeDasharray="2,2"
            opacity={0.65}
          />

          {/* 3. Skeleton Limbs */}
          <G strokeLinecap="round">
            {/* Torso */}
            <Line
              x1={proj.neck.x}
              y1={proj.neck.y}
              x2={proj.spine.x}
              y2={proj.spine.y}
              stroke="url(#goldBone)"
              strokeWidth={4.5 * zoom}
            />
            <Line
              x1={proj.spine.x}
              y1={proj.spine.y}
              x2={proj.pelvis.x}
              y2={proj.pelvis.y}
              stroke="url(#goldBone)"
              strokeWidth={4.5 * zoom}
            />

            {/* Shoulder Girdle */}
            <Line
              x1={proj.leftShoulder.x}
              y1={proj.leftShoulder.y}
              x2={proj.rightShoulder.x}
              y2={proj.rightShoulder.y}
              stroke="url(#goldBone)"
              strokeWidth={3.8 * zoom}
            />

            {/* Pelvic Beam */}
            <Line
              x1={proj.leftHip.x}
              y1={proj.leftHip.y}
              x2={proj.rightHip.x}
              y2={proj.rightHip.y}
              stroke="url(#goldBone)"
              strokeWidth={3.8 * zoom}
            />

            {/* Lead Arm */}
            <Line
              x1={proj.leftShoulder.x}
              y1={proj.leftShoulder.y}
              x2={proj.leftElbow.x}
              y2={proj.leftElbow.y}
              stroke="url(#goldBone)"
              strokeWidth={3.8 * zoom}
            />
            <Line
              x1={proj.leftElbow.x}
              y1={proj.leftElbow.y}
              x2={proj.leftWrist.x}
              y2={proj.leftWrist.y}
              stroke="url(#goldBone)"
              strokeWidth={3.4 * zoom}
            />

            {/* Rear Arm */}
            <Line
              x1={proj.rightShoulder.x}
              y1={proj.rightShoulder.y}
              x2={proj.rightElbow.x}
              y2={proj.rightElbow.y}
              stroke="url(#cyanBone)"
              strokeWidth={3.2 * zoom}
            />
            <Line
              x1={proj.rightElbow.x}
              y1={proj.rightElbow.y}
              x2={proj.rightWrist.x}
              y2={proj.rightWrist.y}
              stroke="url(#cyanBone)"
              strokeWidth={3.0 * zoom}
            />

            {/* Front Leg */}
            <Line
              x1={proj.leftHip.x}
              y1={proj.leftHip.y}
              x2={proj.leftKnee.x}
              y2={proj.leftKnee.y}
              stroke="url(#goldBone)"
              strokeWidth={4.0 * zoom}
            />
            <Line
              x1={proj.leftKnee.x}
              y1={proj.leftKnee.y}
              x2={proj.leftAnkle.x}
              y2={proj.leftAnkle.y}
              stroke="url(#goldBone)"
              strokeWidth={3.8 * zoom}
            />

            {/* Rear Leg */}
            <Line
              x1={proj.rightHip.x}
              y1={proj.rightHip.y}
              x2={proj.rightKnee.x}
              y2={proj.rightKnee.y}
              stroke="url(#cyanBone)"
              strokeWidth={3.8 * zoom}
            />
            <Line
              x1={proj.rightKnee.x}
              y1={proj.rightKnee.y}
              x2={proj.rightAnkle.x}
              y2={proj.rightAnkle.y}
              stroke="url(#cyanBone)"
              strokeWidth={3.5 * zoom}
            />
          </G>

          {/* 4. 3D Cricket Bat */}
          <G>
            {/* Grip */}
            <Line
              x1={proj.leftWrist.x}
              y1={proj.leftWrist.y}
              x2={bGrip.x}
              y2={bGrip.y}
              stroke="#cbd5e1"
              strokeWidth={3.8 * zoom}
              strokeLinecap="round"
            />
            {/* Blade Quad */}
            <Polygon
              points={batQuad}
              fill="url(#batBladeGrad)"
              stroke="#fde047"
              strokeWidth={1.5}
              opacity={0.92}
            />
            {/* Sweet spot indicator */}
            <Circle
              cx={bMid.x}
              cy={bMid.y}
              r={6.5 * zoom}
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          </G>

          {/* 5. 3D Anatomical Joint Nodes */}
          <G>
            {/* Head */}
            <Circle
              cx={proj.head.x}
              cy={proj.head.y}
              r={12 * zoom}
              fill="#0284c7"
              stroke="#fde047"
              strokeWidth={2}
            />
            {/* High Lead Elbow Key Target Node */}
            <Circle
              cx={proj.leftElbow.x}
              cy={proj.leftElbow.y}
              r={6.5 * zoom}
              fill="#facc15"
              stroke="#ffffff"
              strokeWidth={2}
              onPress={() => setSelectedJoint('LEAD ELBOW')}
            />
            {/* Front Knee */}
            <Circle
              cx={proj.leftKnee.x}
              cy={proj.leftKnee.y}
              r={6.5 * zoom}
              fill="#facc15"
              stroke="#ffffff"
              strokeWidth={2}
              onPress={() => setSelectedJoint('FRONT KNEE')}
            />
            {/* Wrists */}
            <Circle
              cx={proj.leftWrist.x}
              cy={proj.leftWrist.y}
              r={5 * zoom}
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth={1.2}
              onPress={() => setSelectedJoint('WRIST ROLL')}
            />
            <Circle
              cx={proj.rightWrist.x}
              cy={proj.rightWrist.y}
              r={5 * zoom}
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth={1.2}
            />
            {/* Ankles */}
            <Circle
              cx={proj.leftAnkle.x}
              cy={proj.leftAnkle.y}
              r={4.5 * zoom}
              fill="#fbbf24"
            />
            <Circle
              cx={proj.rightAnkle.x}
              cy={proj.rightAnkle.y}
              r={4.5 * zoom}
              fill="#38bdf8"
            />
          </G>
        </Svg>
      </View>

      {/* Camera Preset Quick View Buttons */}
      <View style={styles.presetRow}>
        {(['BOWLER', 'SIDE_ON', 'GULLY', 'TOP_DOWN'] as const).map((preset) => (
          <TouchableOpacity
            key={preset}
            style={styles.presetButton}
            onPress={() => setPresetAngle(preset)}
            activeOpacity={0.8}
          >
            <Text style={styles.presetButtonText}>
              {preset === 'BOWLER'
                ? "BOWLER'S"
                : preset === 'SIDE_ON'
                ? 'PROFILE 90°'
                : preset === 'GULLY'
                ? 'GULLY 45°'
                : '360° PLAN'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Biomechanical Angle Target Badges */}
      <View style={styles.metricsSummaryGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>LEAD ELBOW</Text>
          <Text style={styles.metricCardVal}>{leadElbowAngle}°</Text>
          <Text style={styles.metricCardTarget}>Target: 142°</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>FRONT KNEE</Text>
          <Text style={styles.metricCardVal}>{kneeFlexionAngle}°</Text>
          <Text style={styles.metricCardTarget}>Target: 136°</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>SPINE TILT</Text>
          <Text style={styles.metricCardVal}>{spineAngle}°</Text>
          <Text style={styles.metricCardTarget}>Target: 126°</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    padding: 14,
    marginVertical: 12,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: {
    gap: 4,
  },
  hologramBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  hologramBadgeText: {
    color: '#38bdf8',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  arLaunchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  arLaunchIcon: {
    fontSize: 14,
  },
  arLaunchText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  canvasWrapper: {
    height: 320,
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  dragPromptBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  dragPromptText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  jointMetricOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    alignItems: 'flex-end',
    zIndex: 10,
  },
  jointMetricLabel: {
    color: '#fbbf24',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  jointMetricValue: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetButton: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetButtonText: {
    color: '#cbd5e1',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  metricsSummaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  metricCardLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
  },
  metricCardVal: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '900',
    marginVertical: 2,
  },
  metricCardTarget: {
    color: '#facc15',
    fontSize: 8.5,
    fontWeight: '600',
  },
});
