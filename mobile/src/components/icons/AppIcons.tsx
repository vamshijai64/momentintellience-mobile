import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  secondaryColor?: string;
  badgeBg?: string;
  badgeSize?: number;
}

/** 1. Precision Target / Head Alignment Crosshair */
export const TargetIcon: React.FC<IconProps> = ({ size = 20, color = '#0284c7' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" strokeOpacity="0.35" />
    <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="2" fill={color} />
    <Line x1="12" y1="1" x2="12" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="12" y1="20" x2="12" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="1" y1="12" x2="4" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="20" y1="12" x2="23" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/** 2. Biomechanical Arm / Elbow Joint Angle */
export const ArmFlexIcon: React.FC<IconProps> = ({ size = 20, color = '#0284c7' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Upper arm & forearm joint vector */}
    <Path
      d="M4 18L10 12L15 16L20 8"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="10" cy="12" r="3" fill={color} />
    <Circle cx="15" cy="16" r="2.5" fill={color} fillOpacity="0.6" />
    <Circle cx="20" cy="8" r="2" fill={color} />
    <Path d="M10 8C12 8 13.5 9.5 14 11" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
  </Svg>
);

/** 3. Leg / Knee Stride Foundation */
export const LegStrideIcon: React.FC<IconProps> = ({ size = 20, color = '#0284c7' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Stride angle & knee flexion */}
    <Path
      d="M6 3L11 11L8 21"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11 11L17 15L20 21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.75"
    />
    <Circle cx="11" cy="11" r="3" fill={color} />
    <Circle cx="6" cy="3" r="2.5" fill={color} />
    <Line x1="4" y1="21" x2="22" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
  </Svg>
);

/** 4. Cricket Bat Swing Plane / Follow-Through */
export const BatSwingIcon: React.FC<IconProps> = ({ size = 20, color = '#0284c7' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Bat Handle */}
    <Line x1="18" y1="4" x2="14" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    {/* Bat Blade */}
    <Rect
      x="4"
      y="9"
      width="13"
      height="6.5"
      rx="2"
      transform="rotate(-45 4 9)"
      fill={color}
      fillOpacity="0.25"
      stroke={color}
      strokeWidth="2"
    />
    {/* Swing Arc */}
    <Path
      d="M3 19C7 22 17 21 21 14"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeDasharray="2.5 2.5"
    />
  </Svg>
);

/** 5. Stance / Equilibrium Balance Scale */
export const ScaleStanceIcon: React.FC<IconProps> = ({ size = 20, color = '#0284c7' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    {/* Left Pan */}
    <Path d="M4 7L2 14C2 15.5 4 16 5 16C6 16 8 15.5 8 14L6 7" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
    {/* Right Pan */}
    <Path d="M20 7L18 14C18 15.5 20 16 21 16C22 16 24 15.5 24 14L22 7" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
    <Line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/** 6. Dynamic Backlift Energy / Lightning Lift */
export const LightningLiftIcon: React.FC<IconProps> = ({ size = 20, color = '#f59e0b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon
      points="13 2 4 14 12 14 11 22 20 10 12 10 13 2"
      fill={color}
      fillOpacity="0.25"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </Svg>
);

/** 7. Precision Impact Bullseye */
export const ImpactPointIcon: React.FC<IconProps> = ({ size = 20, color = '#10b981' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeOpacity="0.3" />
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" fill={color} fillOpacity="0.15" />
    <Circle cx="12" cy="12" r="2.5" fill={color} />
    <Path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/** 8. Championship Finish / Follow-Through Trophy */
export const TrophyFinishIcon: React.FC<IconProps> = ({ size = 20, color = '#fbbf24' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9C6 13.5 8.7 17 12 17C15.3 17 18 13.5 18 9V4H6V9Z"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <Path d="M6 6H3C2.4 6 2 6.4 2 7C2 9.5 4 11 6 11V6Z" stroke={color} strokeWidth="1.75" />
    <Path d="M18 6H21C21.6 6 22 6.4 22 7C22 9.5 20 11 18 11V6Z" stroke={color} strokeWidth="1.75" />
    <Line x1="12" y1="17" x2="12" y2="20" stroke={color} strokeWidth="2" />
    <Rect x="7" y="20" width="10" height="2.5" rx="1" fill={color} />
  </Svg>
);

/** 9. Masterclass Blueprint Book */
export const BookGuideIcon: React.FC<IconProps> = ({ size = 20, color = '#0284c7' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 19.5C4 18.1 5.1 17 6.5 17H20"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path
      d="M6.5 2H20V22H6.5C5.1 22 4 20.9 4 19.5V4.5C4 3.1 5.1 2 6.5 2Z"
      fill={color}
      fillOpacity="0.15"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <Line x1="8" y1="7" x2="16" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="8" y1="11" x2="14" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

/** 10. Pro Coach Secret Cue / Lightbulb */
export const LightbulbCueIcon: React.FC<IconProps> = ({ size = 20, color = '#f59e0b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18H15M10 21H14M12 2C7.6 2 4 5.6 4 10C4 12.8 5.4 15.2 7.6 16.6C8.2 17 8.6 17.7 8.6 18.4V18.5H15.4V18.4C15.4 17.7 15.8 17 16.4 16.6C18.6 15.2 20 12.8 20 10C20 5.6 16.4 2 12 2Z"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** 11. Warning Shield / Alert Icon */
export const AlertWarnIcon: React.FC<IconProps> = ({ size = 20, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L2 20H22L12 2Z"
      fill={color}
      fillOpacity="0.15"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="12" y1="9" x2="12" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="12" cy="17" r="1.25" fill={color} />
  </Svg>
);

/** 12. AI Coach Broadcast Microphone */
export const MicCommentaryIcon: React.FC<IconProps> = ({ size = 20, color = '#0284c7' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="8"
      y="3"
      width="8"
      height="12"
      rx="4"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth="2"
    />
    <Path
      d="M5 10V11C5 14.9 8.1 18 12 18C15.9 18 19 14.9 19 11V10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Line x1="12" y1="18" x2="12" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="8" y1="22" x2="16" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/** 13. Virtual Stadium Perspective / Multi-Camera Gimbal */
export const StadiumCameraIcon: React.FC<IconProps> = ({ size = 20, color = '#0284c7' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="2"
      y="5"
      width="14"
      height="14"
      rx="3"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth="2"
    />
    <Polygon points="16 10 22 6 22 18 16 14" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <Circle cx="9" cy="12" r="3" fill={color} />
  </Svg>
);

/** 14. 360° Compass Radar / Arena Field */
export const CompassArenaIcon: React.FC<IconProps> = ({ size = 20, color = '#0284c7' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" strokeOpacity="0.4" />
    <Polygon points="12 4 15 11 12 10 9 11 12 4" fill={color} />
    <Polygon points="12 20 15 13 12 14 9 13 12 20" fill={color} fillOpacity="0.4" />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);
export const CompassRadarIcon = CompassArenaIcon;

/** 15. Slider Equalizer / Before-After Comparison */
export const SliderCompareIcon: React.FC<IconProps> = ({ size = 20, color = '#0284c7' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Circle cx="8" cy="6" r="3" fill={color} />
    <Circle cx="16" cy="12" r="3" fill={color} />
    <Circle cx="10" cy="18" r="3" fill={color} />
  </Svg>
);

/** 16. Bat Face Thermal Flame / Sweet Spot */
export const FlameHeatIcon: React.FC<IconProps> = ({ size = 20, color = '#0284c7' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C10 6 7 8 7 13C7 16.9 9.2 20 12 20C14.8 20 17 16.9 17 13C17 9 14.5 5 12 2Z"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <Path
      d="M12 12C11 14 10 15 10 17C10 18.1 10.9 19 12 19C13.1 19 14 18.1 14 17C14 15 13 14 12 12Z"
      fill={color}
    />
  </Svg>
);

/** 17. Crown Gold Pro Masterclass */
export const CrownGoldIcon: React.FC<IconProps> = ({ size = 20, color = '#d97706' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 18L5 7L9.5 13L12 5L14.5 13L19 7L21 18H3Z"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <Circle cx="5" cy="6" r="1.5" fill={color} />
    <Circle cx="12" cy="4" r="1.5" fill={color} />
    <Circle cx="19" cy="6" r="1.5" fill={color} />
    <Line x1="4" y1="20" x2="20" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

/** 18. Glassmorphic Icon Badge Container */
export const GlassIconBadge: React.FC<{
  children: React.ReactNode;
  bg?: string;
  borderColor?: string;
  size?: number;
}> = ({ children, bg = '#e0f2fe', borderColor = '#bae6fd', size = 36 }) => (
  <View
    style={[
      styles.badgeContainer,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        borderColor: borderColor,
      },
    ]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
