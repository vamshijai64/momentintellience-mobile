import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';

interface GlassIconProps {
  size?: number;
  active?: boolean;
  color?: string;
}

export const GlassHomeIcon: React.FC<GlassIconProps> = ({
  size = 24,
  active = false,
}) => {
  return (
    <View style={[styles.iconContainer, active && styles.activeGlowCyan]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="homeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={active ? '#38bdf8' : '#94a3b8'} stopOpacity={active ? 1 : 0.7} />
            <Stop offset="100%" stopColor={active ? '#0284c7' : '#475569'} stopOpacity={active ? 0.9 : 0.5} />
          </LinearGradient>
          <LinearGradient id="homeGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#38bdf8" stopOpacity={active ? 0.35 : 0.1} />
            <Stop offset="100%" stopColor="#0369a1" stopOpacity={active ? 0.15 : 0.02} />
          </LinearGradient>
        </Defs>
        {/* Glass Base */}
        <Path
          d="M3 10.182V20C3 20.5523 3.44772 21 4 21H9V14C9 13.4477 9.44772 13 10 13H14C14.5523 13 15 13.4477 15 14V21H20C20.5523 21 21 20.5523 21 20V10.182C21 9.69768 20.8248 9.22998 20.5056 8.86249L13.5056 0.812492C12.714 -0.0984973 11.286 -0.0984973 10.4944 0.812492L3.4944 8.86249C3.17522 9.22998 3 9.69768 3 10.182Z"
          fill="url(#homeGlass)"
          stroke="url(#homeGrad)"
          strokeWidth={active ? 1.8 : 1.4}
        />
        {active && (
          <Circle cx="12" cy="17" r="1.5" fill="#38bdf8" />
        )}
      </Svg>
    </View>
  );
};

export const GlassHistoryIcon: React.FC<GlassIconProps> = ({
  size = 24,
  active = false,
}) => {
  return (
    <View style={[styles.iconContainer, active && styles.activeGlowEmerald]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="histGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={active ? '#34d399' : '#94a3b8'} stopOpacity={active ? 1 : 0.7} />
            <Stop offset="100%" stopColor={active ? '#059669' : '#475569'} stopOpacity={active ? 0.9 : 0.5} />
          </LinearGradient>
          <LinearGradient id="barGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#34d399" stopOpacity={active ? 0.5 : 0.2} />
            <Stop offset="100%" stopColor="#059669" stopOpacity={active ? 0.2 : 0.05} />
          </LinearGradient>
          <LinearGradient id="barGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#38bdf8" stopOpacity={active ? 0.8 : 0.3} />
            <Stop offset="100%" stopColor="#0284c7" stopOpacity={active ? 0.3 : 0.1} />
          </LinearGradient>
        </Defs>
        {/* Outer Frame / Trend Line */}
        <Path
          d="M3 3V21H21"
          stroke="url(#histGrad)"
          strokeWidth={active ? 1.8 : 1.4}
          strokeLinecap="round"
        />
        {/* Bar 1 */}
        <Rect
          x="6"
          y="12"
          width="3.2"
          height="6"
          rx="1.6"
          fill="url(#barGrad1)"
          stroke="url(#histGrad)"
          strokeWidth={1.2}
        />
        {/* Bar 2 (Hero) */}
        <Rect
          x="11"
          y="7"
          width="3.2"
          height="11"
          rx="1.6"
          fill="url(#barGrad2)"
          stroke={active ? '#38bdf8' : '#94a3b8'}
          strokeWidth={1.4}
        />
        {/* Bar 3 */}
        <Rect
          x="16"
          y="10"
          width="3.2"
          height="8"
          rx="1.6"
          fill="url(#barGrad1)"
          stroke="url(#histGrad)"
          strokeWidth={1.2}
        />
      </Svg>
    </View>
  );
};

export const GlassProfileIcon: React.FC<GlassIconProps> = ({
  size = 24,
  active = false,
}) => {
  return (
    <View style={[styles.iconContainer, active && styles.activeGlowGold]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="profGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={active ? '#fbbf24' : '#94a3b8'} stopOpacity={active ? 1 : 0.7} />
            <Stop offset="100%" stopColor={active ? '#d97706' : '#475569'} stopOpacity={active ? 0.9 : 0.5} />
          </LinearGradient>
          <LinearGradient id="profGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#fbbf24" stopOpacity={active ? 0.35 : 0.1} />
            <Stop offset="100%" stopColor="#b45309" stopOpacity={active ? 0.15 : 0.02} />
          </LinearGradient>
        </Defs>
        {/* Head */}
        <Circle
          cx="12"
          cy="7.5"
          r="4.2"
          fill="url(#profGlass)"
          stroke="url(#profGrad)"
          strokeWidth={active ? 1.8 : 1.4}
        />
        {/* Body Arc */}
        <Path
          d="M4.5 19.5C4.5 15.634 7.85786 12.5 12 12.5C16.1421 12.5 19.5 15.634 19.5 19.5"
          fill="url(#profGlass)"
          stroke="url(#profGrad)"
          strokeWidth={active ? 1.8 : 1.4}
          strokeLinecap="round"
        />
        {active && (
          <Circle cx="12" cy="3" r="1" fill="#fbbf24" />
        )}
      </Svg>
    </View>
  );
};

export const GlassCameraActionIcon: React.FC<{ active?: boolean }> = ({ active = false }) => {
  return (
    <View style={styles.recordActionHalo}>
      <View style={styles.recordActionCore}>
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
          <Defs>
            <LinearGradient id="camGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
              <Stop offset="100%" stopColor="#e2e8f0" stopOpacity={0.9} />
            </LinearGradient>
          </Defs>
          <Path
            d="M4 8C4 6.89543 4.89543 6 6 6H7.58579C8.11622 6 8.62493 5.78929 9 5.41421L9.58579 4.82843C9.96086 4.45336 10.4696 4.24264 11 4.24264H13C13.5304 4.24264 14.0391 4.45336 14.4142 4.82843L15 5.41421C15.3751 5.78929 15.8838 6 16.4142 6H18C19.1046 6 20 6.89543 20 8V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V8Z"
            fill="rgba(255,255,255,0.15)"
            stroke="url(#camGrad)"
            strokeWidth={1.8}
          />
          <Circle cx="12" cy="12.5" r="3.2" stroke="url(#camGrad)" strokeWidth={1.8} fill="#38bdf8" />
        </Svg>
      </View>
    </View>
  );
};

export const GlassSparkleAIIcon: React.FC<GlassIconProps> = ({ size = 20, active = false }) => {
  return (
    <View style={[styles.iconContainer, active && styles.activeGlowCyan]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="aiSparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
            <Stop offset="50%" stopColor="#38bdf8" stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#0284c7" stopOpacity={0.8} />
          </LinearGradient>
          <LinearGradient id="aiGlassFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#38bdf8" stopOpacity={active ? 0.45 : 0.2} />
            <Stop offset="100%" stopColor="#0369a1" stopOpacity={active ? 0.2 : 0.05} />
          </LinearGradient>
        </Defs>
        <Path
          d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
          fill="url(#aiGlassFill)"
          stroke="url(#aiSparkGrad)"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <Circle cx="12" cy="12" r="2" fill="#ffffff" />
        <Circle cx="18" cy="6" r="1" fill="#38bdf8" />
      </Svg>
    </View>
  );
};

export const GlassVerdictTabIcon: React.FC<GlassIconProps> = ({ size = 18, active = false }) => {
  return (
    <View style={[styles.iconContainer, active && styles.activeGlowCyan]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="verdictGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={active ? '#ffffff' : '#94a3b8'} />
            <Stop offset="100%" stopColor={active ? '#38bdf8' : '#64748b'} />
          </LinearGradient>
        </Defs>
        <Circle cx="12" cy="12" r="9" stroke="url(#verdictGrad)" strokeWidth={1.5} fill={active ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)'} />
        <Circle cx="12" cy="12" r="5" stroke="url(#verdictGrad)" strokeWidth={1.2} />
        <Circle cx="12" cy="12" r="2" fill={active ? '#38bdf8' : '#cbd5e1'} />
      </Svg>
    </View>
  );
};

export const GlassMetricsTabIcon: React.FC<GlassIconProps> = ({ size = 18, active = false }) => {
  return (
    <View style={[styles.iconContainer, active && styles.activeGlowCyan]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={active ? '#ffffff' : '#94a3b8'} />
            <Stop offset="100%" stopColor={active ? '#38bdf8' : '#64748b'} />
          </LinearGradient>
        </Defs>
        <Path
          d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
          fill={active ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.05)'}
          stroke="url(#boltGrad)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

export const GlassStadiumTabIcon: React.FC<GlassIconProps> = ({ size = 18, active = false }) => {
  return (
    <View style={[styles.iconContainer, active && styles.activeGlowCyan]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="stadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={active ? '#ffffff' : '#94a3b8'} />
            <Stop offset="100%" stopColor={active ? '#38bdf8' : '#64748b'} />
          </LinearGradient>
        </Defs>
        <Path
          d="M12 4C6.48 4 2 7.13 2 11C2 13.9 4.6 16.36 8.3 17.4L7 21L12 18L17 21L15.7 17.4C19.4 16.36 22 13.9 22 11C22 7.13 17.52 4 12 4Z"
          fill={active ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)'}
          stroke="url(#stadGrad)"
          strokeWidth={1.5}
        />
        <Circle cx="12" cy="11" r="2.5" stroke="url(#stadGrad)" strokeWidth={1.2} />
      </Svg>
    </View>
  );
};

export const GlassMasterclassTabIcon: React.FC<GlassIconProps> = ({ size = 18, active = false }) => {
  return (
    <View style={[styles.iconContainer, active && styles.activeGlowCyan]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={active ? '#ffffff' : '#94a3b8'} />
            <Stop offset="100%" stopColor={active ? '#38bdf8' : '#64748b'} />
          </LinearGradient>
        </Defs>
        <Path
          d="M4 19.5V4.5C4 3.67 4.67 3 5.5 3H19C19.55 3 20 3.45 20 4V18C20 18.55 19.55 19 19 19H6C4.9 19 4 19.9 4 21C4 21.55 4.45 22 5 22H19"
          fill={active ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)'}
          stroke="url(#bookGrad)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <Path d="M8 8H16M8 12H13" stroke="url(#bookGrad)" strokeWidth={1.4} strokeLinecap="round" />
      </Svg>
    </View>
  );
};

export const GlassTripodSetupIcon: React.FC<GlassIconProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="tripodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ffffff" />
          <Stop offset="100%" stopColor="#38bdf8" />
        </LinearGradient>
      </Defs>
      <Rect x="7" y="3" width="10" height="7" rx="1.5" fill="rgba(56,189,248,0.25)" stroke="url(#tripodGrad)" strokeWidth={1.5} />
      <Circle cx="12" cy="6.5" r="2" fill="#ffffff" />
      <Path d="M12 10V14M12 14L7 21M12 14L17 21M12 14V21" stroke="url(#tripodGrad)" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
};

export const GlassFramingReticleIcon: React.FC<GlassIconProps> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="reticleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ffffff" />
          <Stop offset="100%" stopColor="#38bdf8" />
        </LinearGradient>
      </Defs>
      <Path d="M4 8V5C4 4.45 4.45 4 5 4H8" stroke="url(#reticleGrad)" strokeWidth={2} strokeLinecap="round" />
      <Path d="M16 4H19C19.55 4 20 4.45 20 5V8" stroke="url(#reticleGrad)" strokeWidth={2} strokeLinecap="round" />
      <Path d="M20 16V19C20 19.55 19.55 20 19 20H16" stroke="url(#reticleGrad)" strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 20H5C4.45 20 4 19.55 4 19V16" stroke="url(#reticleGrad)" strokeWidth={2} strokeLinecap="round" />
      <Circle cx="12" cy="12" r="3" stroke="url(#reticleGrad)" strokeWidth={1.5} fill="rgba(56,189,248,0.2)" />
    </Svg>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeGlowCyan: {
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  activeGlowEmerald: {
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  activeGlowGold: {
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  recordActionHalo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  recordActionCore: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
