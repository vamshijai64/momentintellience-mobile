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
  blobA: string;
  blobB: string;
  visual: 'hero' | 'setup' | 'frame';
  steps?: { num: string; title: string; text: string }[];
};

const PAGES: Page[] = [
  {
    id: 1,
    brand: 'AI Cricket Coach',
    eyebrow: 'BATTING ANALYSIS',
    title: 'See your shot\nthe way coaches do',
    subtitle:
      'Film one delivery and get posture scores, joint angles, and clear drills — built for net sessions.',
    accent: '#0d9488',
    accentSoft: '#ccfbf1',
    accentDeep: '#0f766e',
    blobA: '#99f6e4',
    blobB: '#fef3c7',
    visual: 'hero',
  },
  {
    id: 2,
    eyebrow: 'CAMERA SETUP',
    title: 'Three steps to\na clean capture',
    subtitle: 'Steady framing is half the analysis. Follow this once and every clip improves.',
    accent: '#0d9488',
    accentSoft: '#ccfbf1',
    accentDeep: '#0f766e',
    blobA: '#99f6e4',
    blobB: '#e0f2fe',
    visual: 'setup',
    steps: [
      { num: '01', title: 'Pitch ready', text: 'Place three stumps on a clear crease line' },
      { num: '02', title: 'Tripod lock', text: "Mount the phone behind the bowler's end" },
      { num: '03', title: 'Waist height', text: "Keep the lens level with the batsman's hips" },
    ],
  },
  {
    id: 3,
    eyebrow: 'FRAMING GUIDE',
    title: 'Fill the frame\nwith the batsman',
    subtitle: 'Zoom 2–4× so the player is large and centered. Tiny figures = weak AI tracking.',
    accent: '#0d9488',
    accentSoft: '#ccfbf1',
    accentDeep: '#0f766e',
    blobA: '#99f6e4',
    blobB: '#fef3c7',
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
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
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
    outputRange: [0, -10],
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
      <View style={[styles.heroRingOuter, { borderColor: page.accentSoft }]}>
        <View style={[styles.heroRingMid, { backgroundColor: page.accentSoft }]}>
          <View style={[styles.heroCore, { backgroundColor: '#ffffff' }]}>
            <Text style={styles.heroEmoji}>🏏</Text>
            <View style={[styles.heroScoreChip, { backgroundColor: page.accent }]}>
              <Text style={styles.heroScoreText}>92</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={[styles.floatingPill, styles.floatingPillLeft, { backgroundColor: '#ffffff' }]}>
        <View style={[styles.floatingDot, { backgroundColor: '#10b981' }]} />
        <Text style={styles.floatingPillText}>Ideal elbow</Text>
      </View>
      <View style={[styles.floatingPill, styles.floatingPillRight, { backgroundColor: '#ffffff' }]}>
        <View style={[styles.floatingDot, { backgroundColor: page.accent }]} />
        <Text style={styles.floatingPillText}>Balance 88%</Text>
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
              marginLeft: i === 1 ? 18 : 0,
              marginRight: i === 2 ? 18 : 0,
            },
          ]}
        >
          <View style={[styles.setupNumBadge, { backgroundColor: page.accent }]}>
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
          <Text style={styles.frameTagGoodText}>✓ Perfect framing</Text>
        </View>
        <Text style={styles.frameCaption}>Zoomed · Full body</Text>
      </View>

      <View style={styles.frameCardBad}>
        <View style={[styles.framePreview, styles.framePreviewBad]}>
          <View style={styles.creaseLine} />
          <View style={styles.playerBlockTiny}>
            <View style={[styles.playerHead, { width: 10, height: 10 }]} />
            <View style={[styles.playerBody, { width: 14, height: 22 }]} />
          </View>
        </View>
        <View style={styles.frameTagBad}>
          <Text style={styles.frameTagBadText}>✗ Too far</Text>
        </View>
        <Text style={styles.frameCaption}>Hard for AI to track</Text>
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
        <View style={[styles.blobTL, { backgroundColor: page.blobA }]} />
        <View style={[styles.blobTR, { backgroundColor: page.blobB }]} />
        <View style={[styles.blobBR, { backgroundColor: page.accentSoft }]} />

        <Animated.View style={[styles.content, { transform: [{ scale }], opacity }]}>
          {page.brand ? (
            <Text style={[styles.brandMark, { color: page.accentDeep }]}>{page.brand}</Text>
          ) : null}

          <View style={[styles.eyebrowPill, { backgroundColor: page.accentSoft }]}>
            <Text style={[styles.eyebrowText, { color: page.accentDeep }]}>{page.eyebrow}</Text>
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
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9f6',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 32,
    right: 22,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  skipText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  page: {
    width,
    minHeight: height * 0.72,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 90 : 70,
    overflow: 'hidden',
  },
  blobTL: {
    position: 'absolute',
    top: -60,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.55,
  },
  blobTR: {
    position: 'absolute',
    top: 40,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.45,
  },
  blobBR: {
    position: 'absolute',
    bottom: 40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.5,
  },
  content: {
    width: '100%',
    alignItems: 'flex-start',
  },
  brandMark: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 18,
  },
  eyebrowPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 40,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15.5,
    color: '#64748b',
    lineHeight: 23,
    marginBottom: 28,
    maxWidth: width * 0.86,
  },
  visualSlot: {
    width: '100%',
    minHeight: 260,
    justifyContent: 'center',
  },

  // Hero visual
  heroStage: {
    width: '100%',
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingMid: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCore: {
    width: 118,
    height: 118,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  heroEmoji: {
    fontSize: 46,
  },
  heroScoreChip: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  heroScoreText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  floatingPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
    ...softShadow,
  },
  floatingPillLeft: {
    left: 4,
    top: 36,
  },
  floatingPillRight: {
    right: 4,
    bottom: 42,
  },
  floatingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  floatingPillText: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '700',
  },

  // Setup visual
  setupStage: {
    width: '100%',
    gap: 12,
  },
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    ...softShadow,
  },
  setupNumBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  setupNumText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  setupCopy: {
    flex: 1,
  },
  setupTitle: {
    color: '#0f172a',
    fontSize: 15.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  setupBody: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
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
    borderRadius: 22,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    ...softShadow,
  },
  frameCardBad: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#fecdd3',
    ...softShadow,
  },
  framePreview: {
    height: 150,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 18,
    overflow: 'hidden',
  },
  framePreviewBad: {
    backgroundColor: '#fff1f2',
  },
  creaseLine: {
    position: 'absolute',
    bottom: 28,
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: 'rgba(15,23,42,0.12)',
    borderRadius: 1,
  },
  playerBlockLarge: {
    alignItems: 'center',
    marginBottom: 6,
  },
  playerBlockTiny: {
    alignItems: 'center',
    marginBottom: 40,
    opacity: 0.55,
  },
  playerHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0f172a',
    marginBottom: 4,
  },
  playerBody: {
    width: 28,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  stumpRow: {
    flexDirection: 'row',
    gap: 5,
  },
  stumpBar: {
    width: 5,
    height: 28,
    borderRadius: 2,
    backgroundColor: '#f59e0b',
  },
  frameTagGood: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  frameTagGoodText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '800',
  },
  frameTagBad: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  frameTagBadText: {
    color: '#be123c',
    fontSize: 11,
    fontWeight: '800',
  },
  frameCaption: {
    marginTop: 6,
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },

  bottom: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 42 : 28,
    paddingTop: 8,
    backgroundColor: '#faf9f6',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    gap: 7,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingLeft: 22,
    paddingRight: 10,
    borderRadius: 22,
    ...softShadow,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16.5,
    fontWeight: '800',
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  footerHint: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 14,
  },
});
