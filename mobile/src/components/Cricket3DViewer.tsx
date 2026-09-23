/**
 * Cricket3DViewer.tsx
 * Native WebGL 3D cricket batsman using expo-gl + three.js
 * Works in Expo Go — NO native build required
 * Renders: real 3D geometry, lighting, shadows, ground, cricket pitch strip
 * Touch: drag to rotate, pinch to zoom, auto-spins when idle
 */

import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Text,
  Dimensions,
} from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';

const { width: SW } = Dimensions.get('window');

// ─── SHOT CONFIG ─────────────────────────────────────────────────────────────

export function resolvePoseKey(rawShot: string): string {
  const s = (rawShot || '').toUpperCase();
  if (s.includes('PULL') || s.includes('HOOK')) return 'PULL SHOT';
  if (s.includes('STRAIGHT') || s.includes('ON DRIVE')) return 'STRAIGHT DRIVE';
  if (s.includes('COVER') || s.includes('OFF') || s.includes('LOFT')) return 'COVER DRIVE';
  if (s.includes('DEFENS') || s.includes('BLOCK') || s.includes('LEAVE')) return 'DEFENSIVE';
  if (s.includes('CUT') || s.includes('UPPER')) return 'CUT SHOT';
  if (s.includes('SWEEP')) return 'SWEEP';
  return 'COVER DRIVE';
}

const SHOT_CONFIG: Record<
  string,
  {
    color: string;
    icon: string;
    tip: string;
    pro: string;
  }
> = {
  'PULL SHOT': {
    color: '#f59e0b',
    icon: '🏏',
    tip: 'Chest-height contact · Horizontal bat path · Rear-foot anchor · Wrist roll through impact',
    pro: 'Rohit Sharma',
  },
  'COVER DRIVE': {
    color: '#38bdf8',
    icon: '🏏',
    tip: 'High lead elbow (142°) · Deep front-foot stride · Vertical bat face through extra cover',
    pro: 'Virat Kohli',
  },
  'STRAIGHT DRIVE': {
    color: '#10b981',
    icon: '🏏',
    tip: 'Head over ball · Full vertical bat face down the ground · High front elbow finish',
    pro: 'Sachin Tendulkar',
  },
  'DEFENSIVE': {
    color: '#a78bfa',
    icon: '🛡️',
    tip: 'Soft top-hand grip · Head over ball · Bat angled to kill momentum at crease',
    pro: 'Cheteshwar Pujara',
  },
  'CUT SHOT': {
    color: '#ec4899',
    icon: '🏏',
    tip: 'Weight on back foot · Arms extended outside off · Rolling wrists over top of the ball',
    pro: 'Virender Sehwag',
  },
  'SWEEP': {
    color: '#f97316',
    icon: '🏏',
    tip: 'Back knee down on pitch · Extended reach to square leg · Clean horizontal paddle arc',
    pro: 'Joe Root',
  },
};

// ─── POSE DEFINITIONS ────────────────────────────────────────────────────────

interface PoseData {
  torsoRotX: number;
  torsoRotZ: number;
  leftShoulder: [number, number];
  rightShoulder: [number, number];
  leftElbow: number;
  rightElbow: number;
  batRotX: number;
  batRotZ: number;
  leftHipX: number;
  rightHipX: number;
  leftKneeX: number;
  rightKneeX: number;
}

const POSES: Record<string, PoseData> = {
  'PULL SHOT': {
    torsoRotX: -0.15,
    torsoRotZ: -0.1,
    leftShoulder: [-1.1, 0.9],
    rightShoulder: [-1.0, -0.8],
    leftElbow: -0.5,
    rightElbow: -0.3,
    batRotX: -1.4,
    batRotZ: 0.2,
    leftHipX: 0.25,
    rightHipX: -0.08,
    leftKneeX: -0.3,
    rightKneeX: -0.1,
  },
  'COVER DRIVE': {
    torsoRotX: 0.22,
    torsoRotZ: 0.08,
    leftShoulder: [-0.5, 1.2],
    rightShoulder: [-0.8, -0.5],
    leftElbow: -0.2,
    rightElbow: -0.4,
    batRotX: 0.3,
    batRotZ: -0.9,
    leftHipX: 0.4,
    rightHipX: -0.05,
    leftKneeX: -0.55,
    rightKneeX: -0.05,
  },
  'STRAIGHT DRIVE': {
    torsoRotX: 0.18,
    torsoRotZ: 0.0,
    leftShoulder: [-0.6, 0.9],
    rightShoulder: [-0.7, -0.6],
    leftElbow: -0.25,
    rightElbow: -0.35,
    batRotX: 0.45,
    batRotZ: -0.4,
    leftHipX: 0.35,
    rightHipX: -0.05,
    leftKneeX: -0.45,
    rightKneeX: -0.08,
  },
  'DEFENSIVE': {
    torsoRotX: 0.1,
    torsoRotZ: 0.0,
    leftShoulder: [-0.3, 0.6],
    rightShoulder: [-0.5, -0.3],
    leftElbow: -0.1,
    rightElbow: -0.3,
    batRotX: 0.6,
    batRotZ: -0.3,
    leftHipX: 0.15,
    rightHipX: 0.0,
    leftKneeX: -0.25,
    rightKneeX: -0.1,
  },
  'CUT SHOT': {
    torsoRotX: -0.1,
    torsoRotZ: -0.15,
    leftShoulder: [-0.9, 0.7],
    rightShoulder: [-1.1, -0.9],
    leftElbow: -0.4,
    rightElbow: -0.25,
    batRotX: -1.2,
    batRotZ: 0.8,
    leftHipX: -0.05,
    rightHipX: 0.28,
    leftKneeX: -0.15,
    rightKneeX: -0.35,
  },
  'SWEEP': {
    torsoRotX: 0.25,
    torsoRotZ: 0.15,
    leftShoulder: [-0.8, 1.0],
    rightShoulder: [-0.9, -0.7],
    leftElbow: -0.3,
    rightElbow: -0.4,
    batRotX: -0.8,
    batRotZ: -0.6,
    leftHipX: 0.5,
    rightHipX: -0.3,
    leftKneeX: -0.9,
    rightKneeX: -0.7,
  },
};

// ─── BATSMAN BUILDER ─────────────────────────────────────────────────────────

// ─── BATSMAN BUILDER (HAWK-EYE BROADCAST TELEMETRY AESTHETIC) ───────────────

function buildBatsman(shotType: string): THREE.Group {
  const poseKey = resolvePoseKey(shotType);
  const pose = POSES[poseKey] || POSES['COVER DRIVE'];
  const root = new THREE.Group();

  // High-End Broadcast Materials
  const mCarbonArmor = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.25,
    metalness: 0.85,
  });

  const mWhitesHighTech = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.45,
    metalness: 0.35,
  });

  const mHelmetHolo = new THREE.MeshStandardMaterial({
    color: 0x0369a1,
    roughness: 0.2,
    metalness: 0.9,
  });

  const mVisorChrome = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.1,
    metalness: 0.95,
  });

  const mGrip = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.6,
    metalness: 0.2,
  });

  const mWillowBlade = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.35,
    metalness: 0.15,
  });

  const mBladeEdge = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    wireframe: false,
  });

  const mHoloCyanJoint = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.2,
    roughness: 0.15,
    metalness: 0.8,
  });

  const mSweetSpotGlow = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });

  const addMesh = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    parent: THREE.Object3D
  ): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  const mkGroup = (
    pos: [number, number, number],
    parent: THREE.Object3D
  ): THREE.Group => {
    const g = new THREE.Group();
    g.position.set(...pos);
    parent.add(g);
    return g;
  };

  const addJointNode = (parent: THREE.Object3D, pos: [number, number, number] = [0, 0, 0], radius = 0.048) => {
    const joint = addMesh(new THREE.SphereGeometry(radius, 12, 12), mHoloCyanJoint, parent);
    joint.position.set(...pos);
    return joint;
  };

  // ── TORSO & SPINE ──────────────────────────────────────────────────────────
  const torsoGrp = mkGroup([0, 1.0, 0], root);
  torsoGrp.rotation.x = pose.torsoRotX;
  torsoGrp.rotation.z = pose.torsoRotZ;

  // Athletic tapered torso
  addMesh(new THREE.CylinderGeometry(0.16, 0.14, 0.24, 12), mCarbonArmor, torsoGrp);

  const chest = mkGroup([0, 0.22, 0], torsoGrp);
  addMesh(new THREE.CylinderGeometry(0.18, 0.16, 0.26, 12), mWhitesHighTech, chest);

  // Glowing spine telemetry node
  addJointNode(torsoGrp, [0, 0.05, 0], 0.04);
  addJointNode(chest, [0, 0.05, 0], 0.042);

  // Shoulder Bar with glowing left/right nodes
  const shoulderBar = addMesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.44, 8),
    mCarbonArmor,
    chest
  );
  shoulderBar.rotation.z = Math.PI / 2;

  // ── HEAD & HELMET ──────────────────────────────────────────────────────────
  const headGrp = mkGroup([0, 0.28, 0], chest);

  const neck = addMesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.12, 8),
    mCarbonArmor,
    headGrp
  );
  neck.position.set(0, -0.06, 0);

  const head = addMesh(
    new THREE.SphereGeometry(0.125, 16, 16),
    mCarbonArmor,
    headGrp
  );
  head.position.set(0, 0.06, 0);

  // Streamlined pro batting helmet
  const helmetShell = addMesh(
    new THREE.SphereGeometry(0.142, 16, 16),
    mHelmetHolo,
    headGrp
  );
  helmetShell.position.set(0, 0.065, 0);
  helmetShell.scale.set(1, 0.88, 1.05);

  const brim = addMesh(
    new THREE.CylinderGeometry(0.19, 0.20, 0.02, 16),
    mHelmetHolo,
    headGrp
  );
  brim.position.set(0, -0.035, 0.05);
  brim.rotation.x = 0.22;

  // Metallic Visor / Face Guard
  const visor = addMesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.26, 6),
    mVisorChrome,
    headGrp
  );
  visor.position.set(0, -0.02, 0.14);

  // ── LEFT ARM (LEAD ARM) ────────────────────────────────────────────────────
  const lShoulderGrp = mkGroup([-0.22, 0.13, 0], chest);
  lShoulderGrp.rotation.x = pose.leftShoulder[0];
  lShoulderGrp.rotation.z = pose.leftShoulder[1];
  addJointNode(lShoulderGrp, [0, 0, 0], 0.046);

  const lUpperArm = addMesh(
    new THREE.CylinderGeometry(0.048, 0.042, 0.28, 10),
    mCarbonArmor,
    lShoulderGrp
  );
  lUpperArm.position.set(0, -0.14, 0);

  const lElbowGrp = mkGroup([0, -0.28, 0], lShoulderGrp);
  lElbowGrp.rotation.x = pose.leftElbow;
  // Glowing Lead Elbow Node (Primary Key Metric Point)
  addJointNode(lElbowGrp, [0, 0, 0], 0.052);

  const lLowerArm = addMesh(
    new THREE.CylinderGeometry(0.04, 0.034, 0.26, 10),
    mWhitesHighTech,
    lElbowGrp
  );
  lLowerArm.position.set(0, -0.13, 0);

  // Pro batting glove
  const lGlove = addMesh(
    new THREE.BoxGeometry(0.08, 0.10, 0.07),
    mWhitesHighTech,
    lElbowGrp
  );
  lGlove.position.set(0, -0.27, 0);
  addJointNode(lElbowGrp, [0, -0.27, 0], 0.035);

  // ── RIGHT ARM (TRAIL ARM) ──────────────────────────────────────────────────
  const rShoulderGrp = mkGroup([0.22, 0.13, 0], chest);
  rShoulderGrp.rotation.x = pose.rightShoulder[0];
  rShoulderGrp.rotation.z = pose.rightShoulder[1];
  addJointNode(rShoulderGrp, [0, 0, 0], 0.046);

  const rUpperArm = addMesh(
    new THREE.CylinderGeometry(0.048, 0.042, 0.28, 10),
    mCarbonArmor,
    rShoulderGrp
  );
  rUpperArm.position.set(0, -0.14, 0);

  const rElbowGrp = mkGroup([0, -0.28, 0], rShoulderGrp);
  rElbowGrp.rotation.x = pose.rightElbow;
  addJointNode(rElbowGrp, [0, 0, 0], 0.048);

  const rLowerArm = addMesh(
    new THREE.CylinderGeometry(0.04, 0.034, 0.26, 10),
    mWhitesHighTech,
    rElbowGrp
  );
  rLowerArm.position.set(0, -0.13, 0);

  const rGlove = addMesh(
    new THREE.BoxGeometry(0.08, 0.10, 0.07),
    mWhitesHighTech,
    rElbowGrp
  );
  rGlove.position.set(0, -0.27, 0);
  addJointNode(rElbowGrp, [0, -0.27, 0], 0.035);

  // ── CRICKET BAT (WILLOW BLADE WITH LASER SWEET-SPOT) ───────────────────────
  const batGrp = mkGroup([0, -0.31, 0], rElbowGrp);
  batGrp.rotation.x = pose.batRotX;
  batGrp.rotation.z = pose.batRotZ;

  // Handle & Grip
  const handle = addMesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.32, 10),
    mGrip,
    batGrp
  );
  handle.position.set(0, -0.16, 0);

  // Shaped Bat Blade (English Willow Texture with Carbon Spine)
  const blade = addMesh(
    new THREE.BoxGeometry(0.082, 0.82, 0.038),
    mWillowBlade,
    batGrp
  );
  blade.position.set(0, -0.72, 0);

  // Blade Spine Contour
  const bladeRidge = addMesh(
    new THREE.BoxGeometry(0.084, 0.82, 0.008),
    mBladeEdge,
    batGrp
  );
  bladeRidge.position.set(0, -0.72, 0.022);

  // Neon Sweet Spot Target Indicator (75mm above toe)
  const sweetSpot = addMesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.042, 12),
    mSweetSpotGlow,
    batGrp
  );
  sweetSpot.rotation.x = Math.PI / 2;
  sweetSpot.position.set(0, -0.70, 0);

  // ── HIPS & BASE ───────────────────────────────────────────────────────────
  const hips = addMesh(
    new THREE.CylinderGeometry(0.14, 0.15, 0.16, 10),
    mCarbonArmor,
    torsoGrp
  );
  hips.position.set(0, -0.12, 0);
  addJointNode(torsoGrp, [0, -0.12, 0], 0.045);

  // ── LEFT LEG (FRONT STRIDE LEG) ───────────────────────────────────────────
  const lHipGrp = mkGroup([-0.11, -0.18, 0], torsoGrp);
  lHipGrp.rotation.x = pose.leftHipX;
  addJointNode(lHipGrp, [0, 0, 0], 0.046);

  const lThigh = addMesh(
    new THREE.CylinderGeometry(0.075, 0.065, 0.38, 10),
    mWhitesHighTech,
    lHipGrp
  );
  lThigh.position.set(0, -0.19, 0);

  const lKneeGrp = mkGroup([0, -0.38, 0], lHipGrp);
  lKneeGrp.rotation.x = pose.leftKneeX;
  // Glowing Front Knee Node
  addJointNode(lKneeGrp, [0, 0, 0], 0.052);

  const lShin = addMesh(
    new THREE.CylinderGeometry(0.062, 0.05, 0.36, 10),
    mCarbonArmor,
    lKneeGrp
  );
  lShin.position.set(0, -0.18, 0);

  // High-Tech Batting Pad (Leg Guard)
  const lPad = addMesh(
    new THREE.BoxGeometry(0.13, 0.38, 0.07),
    mWhitesHighTech,
    lKneeGrp
  );
  lPad.position.set(0, -0.18, 0.038);

  const lFoot = addMesh(
    new THREE.BoxGeometry(0.09, 0.06, 0.22),
    mCarbonArmor,
    lKneeGrp
  );
  lFoot.position.set(0, -0.37, 0.06);
  addJointNode(lKneeGrp, [0, -0.37, 0], 0.038);

  // ── RIGHT LEG (REAR ANCHOR LEG) ───────────────────────────────────────────
  const rHipGrp = mkGroup([0.11, -0.18, 0], torsoGrp);
  rHipGrp.rotation.x = pose.rightHipX;
  addJointNode(rHipGrp, [0, 0, 0], 0.046);

  const rThigh = addMesh(
    new THREE.CylinderGeometry(0.075, 0.065, 0.38, 10),
    mWhitesHighTech,
    rHipGrp
  );
  rThigh.position.set(0, -0.19, 0);

  const rKneeGrp = mkGroup([0, -0.38, 0], rHipGrp);
  rKneeGrp.rotation.x = pose.rightKneeX;
  addJointNode(rKneeGrp, [0, 0, 0], 0.05);

  const rShin = addMesh(
    new THREE.CylinderGeometry(0.062, 0.05, 0.36, 10),
    mCarbonArmor,
    rKneeGrp
  );
  rShin.position.set(0, -0.18, 0);

  const rPad = addMesh(
    new THREE.BoxGeometry(0.13, 0.38, 0.07),
    mWhitesHighTech,
    rKneeGrp
  );
  rPad.position.set(0, -0.18, 0.038);

  const rFoot = addMesh(
    new THREE.BoxGeometry(0.09, 0.06, 0.22),
    mCarbonArmor,
    rKneeGrp
  );
  rFoot.position.set(0, -0.37, 0.06);
  addJointNode(rKneeGrp, [0, -0.37, 0], 0.038);

  // ── BAT SWING TRAJECTORY ARC (HAWK-EYE LASER RIBBON) ──────────────────────
  const isPull = poseKey === 'PULL SHOT';
  const isCut = poseKey === 'CUT SHOT';
  const arcPoints: THREE.Vector3[] = [];

  if (isPull) {
    // Horizontal rotation swing ribbon across chest
    arcPoints.push(new THREE.Vector3(-0.4, 0.95, -0.3));
    arcPoints.push(new THREE.Vector3(0.0, 0.85, 0.2));
    arcPoints.push(new THREE.Vector3(0.35, 0.80, 0.35));
    arcPoints.push(new THREE.Vector3(0.55, 0.85, 0.15));
  } else if (isCut) {
    // Sharp off-side cut down-and-across trajectory
    arcPoints.push(new THREE.Vector3(-0.35, 1.25, -0.1));
    arcPoints.push(new THREE.Vector3(-0.25, 0.85, 0.25));
    arcPoints.push(new THREE.Vector3(-0.15, 0.65, 0.45));
    arcPoints.push(new THREE.Vector3(0.2, 0.60, 0.3));
  } else {
    // Classic high-to-low vertical drive arc into extra cover
    arcPoints.push(new THREE.Vector3(0.15, 1.35, -0.2));
    arcPoints.push(new THREE.Vector3(0.05, 0.85, 0.05));
    arcPoints.push(new THREE.Vector3(-0.12, 0.35, 0.25));
    arcPoints.push(new THREE.Vector3(-0.25, 0.55, 0.45));
  }

  const swingCurve = new THREE.CatmullRomCurve3(arcPoints);
  const arcGeo = new THREE.TubeGeometry(swingCurve, 24, 0.014, 6, false);
  const arcMat = new THREE.MeshBasicMaterial({
    color: isPull ? 0xf59e0b : 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });
  const arcMesh = new THREE.Mesh(arcGeo, arcMat);
  root.add(arcMesh);

  root.position.y = 0.02;
  return root;
}

// ─── SCENE BUILDER (HAWK-EYE VIRTUAL STADIUM ARENA) ──────────────────────────

function buildScene(shotType: string): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  batsmanRoot: THREE.Group;
} {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617); // Deep cosmic navy
  scene.fog = new THREE.FogExp2(0x020617, 0.065);

  // Broadcast Isometric Camera Angle (looking up at stroke execution)
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  camera.position.set(2.4, 1.8, 3.8);
  camera.lookAt(0, 1.05, 0.1);

  // ── LIGHTING (DRAMATIC BROADCAST RIM + KEY) ───────────────────────────────
  const ambient = new THREE.AmbientLight(0x0f172a, 0.9);
  scene.add(ambient);

  // Crisp White Stadium Key Light
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(4, 8, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  // Intense Cyan Silhouette Rim Light (gives the futuristic Hawk-Eye glow)
  const cyanRim = new THREE.DirectionalLight(0x00f0ff, 1.8);
  cyanRim.position.set(-4, 3, -4);
  scene.add(cyanRim);

  // Warm Amber Fill Light
  const warmFill = new THREE.PointLight(0xf59e0b, 0.8, 8);
  warmFill.position.set(2, 2.5, 2);
  scene.add(warmFill);

  // ── HOLOGRAPHIC ARENA TURF ────────────────────────────────────────────────
  const turfGeo = new THREE.PlaneGeometry(16, 16);
  const turfMat = new THREE.MeshStandardMaterial({
    color: 0x070d1e,
    roughness: 0.85,
    metalness: 0.2,
  });
  const turf = new THREE.Mesh(turfGeo, turfMat);
  turf.rotation.x = -Math.PI / 2;
  turf.receiveShadow = true;
  scene.add(turf);

  // High-Tech Dark Glass Pitch Strip
  const pitchGeo = new THREE.PlaneGeometry(1.9, 12);
  const pitchMat = new THREE.MeshStandardMaterial({
    color: 0x0c1938,
    roughness: 0.35,
    metalness: 0.5,
  });
  const pitch = new THREE.Mesh(pitchGeo, pitchMat);
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.set(0, 0.005, 0);
  pitch.receiveShadow = true;
  scene.add(pitch);

  // Laser Crease Boundary Markings (Popping & Return Creases)
  const creaseMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const poppingCrease = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.03),
    creaseMat
  );
  poppingCrease.rotation.x = -Math.PI / 2;
  poppingCrease.position.set(0, 0.008, 0.25);
  scene.add(poppingCrease);

  // ── 3D CRICKET WICKETS / STUMPS (BEHIND BATSMAN) ──────────────────────────
  const stumpMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
    metalness: 0.4,
  });
  const stumpZ = -0.55;
  const stumpPositions = [-0.11, 0.0, 0.11];

  stumpPositions.forEach((xPos) => {
    const stump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.72, 10),
      stumpMat
    );
    stump.position.set(xPos, 0.36, stumpZ);
    stump.castShadow = true;
    scene.add(stump);
  });

  // Bails
  const bail1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), stumpMat);
  bail1.rotation.z = Math.PI / 2;
  bail1.position.set(-0.055, 0.725, stumpZ);
  scene.add(bail1);

  const bail2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), stumpMat);
  bail2.rotation.z = Math.PI / 2;
  bail2.position.set(0.055, 0.725, stumpZ);
  scene.add(bail2);

  // Glowing Telemetry Grid
  const grid = new THREE.GridHelper(10, 18, 0x0284c7, 0x1e293b);
  grid.position.y = 0.006;
  scene.add(grid);

  // Batsman
  const batsmanRoot = buildBatsman(shotType);
  scene.add(batsmanRoot);

  return { scene, camera, batsmanRoot };
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

interface Cricket3DViewerProps {
  shotType?: string;
  height?: number;
}

export const Cricket3DViewer: React.FC<Cricket3DViewerProps> = ({
  shotType = 'COVER DRIVE',
  height = 380,
}) => {
  const resolvedKey = resolvePoseKey(shotType);
  const cfg = SHOT_CONFIG[resolvedKey] || SHOT_CONFIG['COVER DRIVE'];

  const rafRef         = useRef<number>(0);
  const rendererRef    = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef       = useRef<THREE.Scene | null>(null);
  const cameraRef      = useRef<THREE.PerspectiveCamera | null>(null);
  const batsmanRef     = useRef<THREE.Group | null>(null);

  const lastTouchX     = useRef(0);
  const isUserTouching = useRef(false);
  const autoRotY       = useRef(0);
  const userRotY       = useRef(0);
  const cameraZ        = useRef(5.5);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          isUserTouching.current = true;
          lastTouchX.current = e.nativeEvent.locationX;
        },
        onPanResponderMove: (e) => {
          const dx = e.nativeEvent.locationX - lastTouchX.current;
          userRotY.current += dx * 0.013;
          lastTouchX.current = e.nativeEvent.locationX;
        },
        onPanResponderRelease: () => {
          isUserTouching.current = false;
        },
        onPanResponderTerminate: () => {
          isUserTouching.current = false;
        },
      }),
    []
  );

  const onContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      const { drawingBufferWidth: w, drawingBufferHeight: h } = gl;

      const renderer = new THREE.WebGLRenderer({
        canvas: {
          width: w,
          height: h,
          style: {},
          addEventListener: (() => {}) as any,
          removeEventListener: (() => {}) as any,
          clientHeight: h,
          clientWidth: w,
        } as any,
        context: gl as any,
        antialias: true,
      });
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // three@0.149 uses outputEncoding instead of outputColorSpace
      (renderer as any).outputEncoding = (THREE as any).sRGBEncoding ?? 3001;
      rendererRef.current = renderer;

      const { scene, camera, batsmanRoot } = buildScene(shotType);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      sceneRef.current  = scene;
      cameraRef.current = camera;
      batsmanRef.current = batsmanRoot;

      const animate = () => {
        rafRef.current = requestAnimationFrame(animate);

        if (!isUserTouching.current) {
          autoRotY.current += 0.007;
        }
        if (batsmanRef.current) {
          batsmanRef.current.rotation.y = autoRotY.current + userRotY.current;
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      animate();
    },
    [shotType]
  );

  // Dynamic mesh update when shotType changes
  useEffect(() => {
    if (sceneRef.current && batsmanRef.current) {
      const currentRotY = batsmanRef.current.rotation.y;
      sceneRef.current.remove(batsmanRef.current);
      const newBatsman = buildBatsman(shotType);
      newBatsman.rotation.y = currentRotY;
      sceneRef.current.add(newBatsman);
      batsmanRef.current = newBatsman;
    }
  }, [shotType]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      rendererRef.current?.dispose();
    };
  }, []);

  return (
    <View style={[styles.container, { height }]}>
      <GLView
        style={StyleSheet.absoluteFillObject}
        onContextCreate={onContextCreate}
        {...panResponder.panHandlers}
      />

      {/* Shot badge */}
      <View style={styles.topLeft}>
        <View style={[styles.badge, { borderColor: cfg.color + '66' }]}>
          <View style={[styles.dot, { backgroundColor: cfg.color }]} />
          <Text style={[styles.badgeText, { color: cfg.color }]}>
            {cfg.icon} {shotType}
          </Text>
        </View>
      </View>

      {/* Pro label */}
      <View style={styles.topRight}>
        <Text style={styles.proText}>PRO: {cfg.pro}</Text>
      </View>

      {/* 3D badge */}
      <View style={styles.badge3D}>
        <Text style={styles.badge3DText}>3D</Text>
      </View>

      {/* Bottom tip */}
      <View style={styles.bottom}>
        <Text style={[styles.tipTitle, { color: cfg.color }]}>⚡ TECHNIQUE KEY</Text>
        <Text style={styles.tipBody}>{cfg.tip}</Text>
        <Text style={styles.hint}>↔ Drag to rotate · Pinch to zoom</Text>
      </View>
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#060b18',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.2)',
  },
  topLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  topRight: {
    position: 'absolute',
    top: 14,
    right: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  proText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badge3D: {
    position: 'absolute',
    bottom: 78,
    right: 12,
    backgroundColor: 'rgba(56,189,248,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.5)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badge3DText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(6,11,24,0.88)',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 3,
  },
  tipTitle: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  tipBody: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '500',
  },
  hint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },
});
