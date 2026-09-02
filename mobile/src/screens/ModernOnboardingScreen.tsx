import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { GlassSparkleAIIcon, GlassTripodSetupIcon, GlassFramingReticleIcon } from '../components/GlassIcons';

const { width, height } = Dimensions.get('window');

interface ModernOnboardingScreenProps {
  onComplete: () => void;
}

type Page = {
  id: number;
  brand?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
  accentSoft: string;
  accentDeep: string;
  visual: 'hero' | 'setup' | 'frame';
  steps?: { num: string; title: string; text: string }[];
};

const PAGES: Page[] = [
  {
    id: 1,
    brand: 'AI Cricket Coach',
    eyebrow: 'BATTING BIOMECHANICS',
    title: 'Transform your stroke\nwith AI Kinematics',
    subtitle:
      'Record one delivery and get instant joint angles, sweet-spot heatmaps, and pro-level masterclass blueprints.',
    accent: '#0284c7',
    accentSoft: '#e0f2fe',
    accentDeep: '#0369a1',
    visual: 'hero',
  },
  {
    id: 2,
    eyebrow: 'CAMERA CALIBRATION',
    title: 'Three steps to\nflawless AI tracking',
    subtitle: 'Proper phone positioning unlocks 33-keypoint 3D tracking with sub-millimeter precision.',
    accent: '#0284c7',
    accentSoft: '#e0f2fe',
    accentDeep: '#0369a1',
    visual: 'setup',
    steps: [
      { num: '01', title: 'Crease Alignment', text: 'Align the camera directly along the batting crease line' },
      { num: '02', title: 'Tripod Lock', text: "Position the phone level at the batsman's hip height" },
      { num: '03', title: 'Clear Contrast', text: 'Ensure crisp daylight or clear net lighting around the player' },
    ],
  },
  {
    id: 3,
    eyebrow: 'FRAMING GUIDE',
    title: 'Fill the viewfinder\nhead-to-toe',
    subtitle: 'Zoom 2–3× so the batsman fills the screen. Clear skeleton visibility ensures 99% accuracy.',
    accent: '#0284c7',
    accentSoft: '#e0f2fe',
    accentDeep: '#0369a1',
    visual: 'frame',
  },
];

export const ModernOnboardingScreen: React.FC<ModernOnboardingScreenProps> = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    );
    floatLoop.start();
    pulseLoop.start();
    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [floatAnim, pulseAnim]);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const finishOnboarding = () => {
    try {
      onComplete();
    } catch (err) {
      console.log('Onboarding complete handler error', err);
    }
  };

  const goToNextPage = () => {
    if (currentPage < PAGES.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({ x: width * nextPage, animated: true });
      setCurrentPage(nextPage);
    } else {
      finishOnboarding();
    }
  };

  const renderHeroVisual = (page: Page) => (
    <Animated.View style={[styles.heroStage, { transform: [{ translateY: floatY }, { scale: pulseAnim }] }]}>
      <View style={styles.heroRingOuter}>
        <View style={styles.heroRingMid}>
          <View style={styles.heroCore}>
            <GlassSparkleAIIcon size={36} active={true} />
            <View style={styles.heroScoreChip}>
              <Text style={styles.heroScoreText}>94%</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={[styles.floatingPill, styles.floatingPillLeft]}>
        <View style={[styles.floatingDot, { backgroundColor: '#10b981' }]} />
        <Text style={styles.floatingPillText}>High Lead Elbow 144°</Text>
      </View>
      <View style={[styles.floatingPill, styles.floatingPillRight]}>
        <View style={[styles.floatingDot, { backgroundColor: '#38bdf8' }]} />
        <Text style={styles.floatingPillText}>Power Sync 94%</Text>
      </View>
    </Animated.View>
  );

  const renderSetupVisual = (page: Page) => (
    <View style={styles.setupStage}>
      {(page.steps || []).map((step, i) => (
        <Animated.View
          key={step.num}
          style={[
            styles.setupCard,
            {
              transform: [{ translateY: floatY }],
            },
          ]}
        >
          <View style={styles.setupNumBadge}>
            <Text style={styles.setupNumText}>{step.num}</Text>
          </View>
          <View style={styles.setupCopy}>
            <Text style={styles.setupTitle}>{step.title}</Text>
            <Text style={styles.setupBody}>{step.text}</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );

  const renderFrameVisual = () => (
    <View style={styles.frameStage}>
      <View style={styles.frameCardGood}>
        <View style={styles.framePreview}>
          <View style={styles.creaseLine} />
          <View style={styles.playerBlockLarge}>
            <View style={styles.playerHead} />
            <View style={styles.playerBody} />
          </View>
          <View style={styles.stumpRow}>
            <View style={styles.stumpBar} />
            <View style={styles.stumpBar} />
            <View style={styles.stumpBar} />
          </View>
        </View>
        <View style={styles.frameTagGood}>
          <Text style={styles.frameTagGoodText}>✓ Ideal Framing (2-3x)</Text>
        </View>
        <Text style={styles.frameCaption}>Full Body · Clear Stumps</Text>
      </View>

      <View style={styles.frameCardBad}>
        <View style={[styles.framePreview, styles.framePreviewBad]}>
          <View style={styles.creaseLine} />
          <View style={styles.playerBlockTiny}>
            <View style={[styles.playerHead, { width: 8, height: 8 }]} />
            <View style={[styles.playerBody, { width: 12, height: 18 }]} />
          </View>
        </View>
        <View style={styles.frameTagBad}>
          <Text style={styles.frameTagBadText}>✗ Too Distant</Text>
        </View>
        <Text style={styles.frameCaption}>Low Skeletal Resolution</Text>
      </View>
    </View>
  );

  const renderPage = (page: Page, index: number) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.92, 1, 0.92],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    return (
      <View key={page.id} style={styles.page}>
        <View style={styles.blobCyan} />
        <View style={styles.blobBlue} />

        <Animated.View style={[styles.content, { transform: [{ scale }], opacity }]}>
          {page.brand ? (
            <View style={styles.brandRow}>
              <GlassSparkleAIIcon size={18} active={true} />
              <Text style={styles.brandMark}>{page.brand}</Text>
            </View>
          ) : null}

          <View style={styles.eyebrowPill}>
            <Text style={styles.eyebrowText}>{page.eyebrow}</Text>
          </View>

          <Text style={styles.title}>{page.title}</Text>
          <Text style={styles.subtitle}>{page.subtitle}</Text>

          <View style={styles.visualSlot}>
            {page.visual === 'hero' && renderHeroVisual(page)}
            {page.visual === 'setup' && renderSetupVisual(page)}
            {page.visual === 'frame' && renderFrameVisual()}
          </View>
        </Animated.View>
      </View>
    );
  };

  const accent = PAGES[currentPage].accent;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#faf9f6" />

      <TouchableOpacity style={styles.skipButton} onPress={finishOnboarding} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentPage(page);
        }}
      >
        {PAGES.map((page, index) => renderPage(page, index))}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.dotsContainer}>
          {PAGES.map((_, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: accent }]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: accent }]}
          onPress={goToNextPage}
          activeOpacity={0.88}
        >
          <Text style={styles.nextButtonText}>
            {currentPage === PAGES.length - 1 ? 'Start Recording' : 'Continue'}
          </Text>
          <View style={styles.arrowCircle}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.footerHint}>Swipe to explore · Takes under 30 seconds</Text>
      </View>
    </View>
  );
};

const softShadow = Platform.select({
  ios: {
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  android: { elevation: 3 },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 32,
    right: 22,
    zIndex: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...softShadow,
  },
  skipText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  page: {
    width,
    minHeight: height * 0.72,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    overflow: 'hidden',
  },
  blobCyan: {
    position: 'absolute',
    top: -60,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(224, 242, 254, 0.8)',
  },
  blobBlue: {
    position: 'absolute',
    top: 60,
    right: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
  },
  content: {
    width: '100%',
    alignItems: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  brandMark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  eyebrowPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 12,
  },
  eyebrowText: {
    color: '#0284c7',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 21,
    marginBottom: 24,
    maxWidth: width * 0.88,
  },
  visualSlot: {
    width: '100%',
    minHeight: 250,
    justifyContent: 'center',
  },

  // Hero visual
  heroStage: {
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingOuter: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingMid: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCore: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  heroScoreChip: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284c7',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScoreText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '900',
  },
  floatingPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    ...softShadow,
  },
  floatingPillLeft: {
    left: 2,
    top: 32,
  },
  floatingPillRight: {
    right: 2,
    bottom: 36,
  },
  floatingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  floatingPillText: {
    color: '#1e293b',
    fontSize: 11,
    fontWeight: '700',
  },

  // Setup visual
  setupStage: {
    width: '100%',
    gap: 10,
  },
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...softShadow,
  },
  setupNumBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  setupNumText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  setupCopy: {
    flex: 1,
  },
  setupTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  setupBody: {
    color: '#64748b',
    fontSize: 11.5,
    lineHeight: 16,
  },

  // Frame visual
  frameStage: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  frameCardGood: {
    flex: 1.15,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#10b981',
    ...softShadow,
  },
  frameCardBad: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#fda4af',
    ...softShadow,
  },
  framePreview: {
    height: 140,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
    overflow: 'hidden',
  },
  framePreviewBad: {
    backgroundColor: '#fff1f2',
  },
  creaseLine: {
    position: 'absolute',
    bottom: 24,
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
    borderRadius: 1,
  },
  playerBlockLarge: {
    alignItems: 'center',
    marginBottom: 6,
  },
  playerBlockTiny: {
    alignItems: 'center',
    marginBottom: 36,
    opacity: 0.5,
  },
  playerHead: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    marginBottom: 3,
  },
  playerBody: {
    width: 26,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#0369a1',
  },
  stumpRow: {
    flexDirection: 'row',
    gap: 4,
  },
  stumpBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#f59e0b',
  },
  frameTagGood: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  frameTagGoodText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800',
  },
  frameTagBad: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  frameTagBadText: {
    color: '#be123c',
    fontSize: 10,
    fontWeight: '800',
  },
  frameCaption: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },

  bottom: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 42 : 28,
    paddingTop: 8,
    backgroundColor: '#f8fafc',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingLeft: 20,
    paddingRight: 8,
    borderRadius: 20,
    backgroundColor: '#0284c7',
    ...softShadow,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  footerHint: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 12,
  },
});
