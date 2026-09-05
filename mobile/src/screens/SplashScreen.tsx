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
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/athletx.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.brandTagline}>
          AI-powered sports performance intelligence
        </Text>

        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>v1.0.0</Text>
        </View>
        <Text style={styles.footerText}>Athletix · Sports Performance AI</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: width * 0.72,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 36,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  loaderBox: {
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93c5fd',
    letterSpacing: -0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
});
