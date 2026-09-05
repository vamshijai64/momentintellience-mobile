import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import Svg, { Circle, Line, Path, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { getProTargets } from '../config/proTargets';

interface ProGhostVideoOverlayProps {
  ghostOpacity?: number; // 0.0 to 1.0
  shotType?: string;
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
}

export const ProGhostVideoOverlay: React.FC<ProGhostVideoOverlayProps> = ({
  ghostOpacity = 0.65,
  shotType = 'COVER DRIVE',
  leadElbowAngle = 142,
  kneeFlexionAngle = 136,
}) => {
  if (ghostOpacity <= 0.05) return null;
  const targetElbow = getProTargets(shotType).elbow;

  return (
    <View style={[styles.container, { opacity: ghostOpacity }]} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 360 280">
        <Defs>
          <LinearGradient id="goldGlow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#fde047" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#d97706" stopOpacity="0.8" />
          </LinearGradient>
          <LinearGradient id="batGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#ca8a04" stopOpacity="0.75" />
          </LinearGradient>
        </Defs>

        {/* Center Golden Pro Silhouette Group (Target Cover Drive impact pose) */}
        <G transform="translate(140, 48)">
          {/* Ground Crease Line */}
          <Line x1="-40" y1="165" x2="100" y2="165" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />

          {/* Plumb Line (Head-over-knee vertical alignment) */}
          <Line x1="38" y1="20" x2="38" y2="165" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />

          {/* 1. Pro Head Node (Stacked over front foot) */}
          <Circle cx="38" cy="20" r="10" fill="url(#goldGlow)" stroke="#fef08a" strokeWidth="1.8" />
          {/* Eyes line / helmet grill direction */}
          <Line x1="38" y1="20" x2="48" y2="24" stroke="#ffffff" strokeWidth="1.5" />

          {/* 2. Pro Torso / Spine (Upright athletic angle) */}
          <Line x1="38" y1="28" x2="30" y2="78" stroke="url(#goldGlow)" strokeWidth="3.5" strokeLinecap="round" />

          {/* 3. Pro Lead Arm & High Front Elbow (140° Ideal Elevation) */}
          {/* Shoulder to Lead Elbow */}
          <Line x1="36" y1="36" x2="58" y2="22" stroke="url(#goldGlow)" strokeWidth="3" strokeLinecap="round" />
          {/* Lead Elbow Node (Glowing Gold Target) */}
          <Circle cx="58" cy="22" r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
          {/* Lead Elbow to Wrist Grip */}
          <Line x1="58" y1="22" x2="34" y2="68" stroke="url(#goldGlow)" strokeWidth="3" strokeLinecap="round" />
          <Circle cx="34" cy="68" r="4" fill="#fbbf24" />

          {/* 4. Pro Rear Arm (Support & Top-Hand Guide) */}
          <Line x1="34" y1="38" x2="20" y2="52" stroke="url(#goldGlow)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <Line x1="20" y1="52" x2="32" y2="70" stroke="url(#goldGlow)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

          {/* 5. Pro Bat Blade (Full Vertical Presentation through Cover) */}
          <Line x1="34" y1="68" x2="30" y2="148" stroke="url(#batGlow)" strokeWidth="4.5" strokeLinecap="round" />
          <Rect x="26" y="82" width="8" height="64" rx="2" fill="url(#batGlow)" stroke="#fef08a" strokeWidth="1" opacity="0.85" />

          {/* 6. Pro Front Leg (Solid 132° Flexion Lunge) */}
          {/* Hip to Front Knee */}
          <Line x1="30" y1="78" x2="40" y2="120" stroke="url(#goldGlow)" strokeWidth="3.2" strokeLinecap="round" />
          {/* Front Knee Node */}
          <Circle cx="40" cy="120" r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
          {/* Front Knee to Ankle / Toe */}
          <Line x1="40" y1="120" x2="38" y2="165" stroke="url(#goldGlow)" strokeWidth="3.2" strokeLinecap="round" />
          <Circle cx="38" cy="165" r="4" fill="#fbbf24" />

          {/* 7. Pro Rear Leg (Extended Braced Back Leg on Toe) */}
          {/* Hip to Back Knee */}
          <Line x1="30" y1="78" x2="-2" y2="116" stroke="url(#goldGlow)" strokeWidth="3" strokeLinecap="round" />
          <Circle cx="-2" cy="116" r="4" fill="#f59e0b" />
          {/* Back Knee to Back Toe */}
          <Line x1="-2" y1="116" x2="-22" y2="164" stroke="url(#goldGlow)" strokeWidth="3" strokeLinecap="round" />
          <Circle cx="-22" cy="164" r="3.5" fill="#d97706" />
        </G>
      </Svg>

      {/* Floating Ghost Identity Chip */}
      <View style={styles.proGhostBadge}>
        <View style={styles.goldCrownDot}>
          <Text style={styles.crownEmoji}>👑</Text>
        </View>
        <Text style={styles.proGhostText}>TEXTBOOK TARGET · {targetElbow}° ELBOW</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  proGhostBadge: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
    gap: 5,
  },
  goldCrownDot: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEmoji: {
    fontSize: 10,
  },
  proGhostText: {
    color: '#fbbf24',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
