import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const ACCENT = '#0d9488';
const ACCENT_DEEP = '#0f766e';

interface SplashScreenProps {
  statusText?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  statusText = 'Restoring your session...',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#faf9f6" />
      
      {/* Subtle Background Glow Blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Main App Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/cricsense_logo_transparent.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Brand Name & Tagline */}
        <Text style={styles.brandTitle}>AI Cricket Coach</Text>
        <Text style={styles.brandTagline}>
          Pro Shot Analysis & Movement Intelligence
        </Text>

        {/* Loader Indicator */}
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </Animated.View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>v1.0.0</Text>
        </View>
        <Text style={styles.footerText}>Powered by Moment Intelligence AI</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blobTop: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#ccfbf1',
    opacity: 0.6,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#fef3c7',
    opacity: 0.5,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: width * 0.6,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 36,
  },
  loaderBox: {
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: ACCENT_DEEP,
    letterSpacing: -0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
