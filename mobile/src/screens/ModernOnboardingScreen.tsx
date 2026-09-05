import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  ImageSourcePropType,
} from 'react-native';

const { width } = Dimensions.get('window');

interface ModernOnboardingScreenProps {
  onComplete: () => void;
}

type Step = {
  kicker: string;
  title: string;
  body: string;
  image: ImageSourcePropType;
  dos: string[];
  donts: string[];
};

const STEPS: Step[] = [
  {
    kicker: 'Step 1 of 5',
    title: 'What this app actually does',
    body: 'It watches one batting shot on your phone and marks the body at the hit: head over the foot, front knee, and one short coaching line.',
    image: require('../../assets/onboard_step1.png'),
    dos: [
      'Record batting only',
      'One delivery per clip',
      'Keep the phone still until the shot finishes',
    ],
    donts: [
      'Do not film a bowler’s run-up',
      'Do not walk around with the phone',
      'Do not expect Hawk-Eye numbers',
    ],
  },
  {
    kicker: 'Step 2 of 5',
    title: 'Where to put the phone',
    body: 'Side-on from the nets, about hip height, 6–8 metres away. A tripod or a still bag is better than handheld.',
    image: require('../../assets/onboard_step2.png'),
    dos: [
      'Phone on a tripod or a still surface',
      'Hip height, landscape or portrait both work',
      'See the full batter: head, bat, both feet',
    ],
    donts: [
      'Do not stand behind the bowler',
      'Do not shoot from the ground looking up',
      'Do not let a person walk in front of the lens',
    ],
  },
  {
    kicker: 'Step 3 of 5',
    title: 'How to frame the player',
    body: 'Fill most of the screen with the batter. If they are a tiny figure in the distance, the skeleton and head-over-foot line will be wrong.',
    image: require('../../assets/onboard_step3.png'),
    dos: [
      'Head near the top of the frame',
      'Both feet visible at the bottom',
      'Stumps or crease in view if you can',
    ],
    donts: [
      'Do not crop the head or the feet',
      'Do not zoom so only the chest is visible',
      'Do not film against a dark cluttered background',
    ],
  },
  {
    kicker: 'Step 4 of 5',
    title: 'How to record the shot',
    body: 'Start recording before the bowler releases. Play one shot. Stop after the follow-through. Then choose right- or left-handed.',
    image: require('../../assets/onboard_step4.png'),
    dos: [
      'Start 1–2 seconds before the ball',
      'Play one shot, then stop',
      'Choose Right-hand or Left-hand batter',
    ],
    donts: [
      'Do not record a whole over in one file',
      'Do not pan or zoom during the shot',
      'Do not skip the batting-hand question',
    ],
  },
  {
    kicker: 'Step 5 of 5',
    title: 'How to read the result',
    body: 'Play the overlay first. One mark on the foot. One coaching sentence. Then check Stance & Balance under the video.',
    image: require('../../assets/onboard_step5.png'),
    dos: [
      'Watch the overlay once in clean mode',
      'Read Stance & Balance under the video',
      'Record again after a change',
    ],
    donts: [
      'Do not trust fake km/h or run numbers',
      'Do not skip a new recording after you change technique',
      'Do not ignore the one coaching sentence',
    ],
  },
];

export const ModernOnboardingScreen: React.FC<ModernOnboardingScreenProps> = ({ onComplete }) => {
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isLast = page === STEPS.length - 1;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, next));
    setPage(clamped);
    scrollRef.current?.scrollTo({ x: width * clamped, animated: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.topBar}>
        {page > 0 ? (
          <TouchableOpacity onPress={() => goTo(page - 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
        <View style={styles.topLogoWrap}>
          <Image
            source={require('../../assets/athletx.png')}
            style={styles.topLogo}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity onPress={onComplete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setPage(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      >
        {STEPS.map((item) => (
          <ScrollView
            key={item.kicker}
            style={styles.page}
            contentContainerStyle={styles.pageInner}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.kicker}>{item.kicker}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>

            <View style={styles.heroCard}>
              <Image source={item.image} style={styles.heroImage} resizeMode="cover" />
            </View>

            <View style={styles.listCard}>
              <Text style={styles.listTitle}>Do this</Text>
              {item.dos.map((line) => (
                <View key={line} style={styles.listRow}>
                  <Text style={styles.doMark}>✓</Text>
                  <Text style={styles.listText}>{line}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.listCard, styles.dontCard]}>
              <Text style={styles.listTitle}>Don’t do this</Text>
              {item.donts.map((line) => (
                <View key={line} style={styles.listRow}>
                  <Text style={styles.dontMark}>✕</Text>
                  <Text style={styles.listText}>{line}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View key={s.kicker} style={[styles.dot, i === page && styles.dotOn]} />
          ))}
        </View>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => (isLast ? onComplete() : goTo(page + 1))}
          activeOpacity={0.9}
        >
          <Text style={styles.nextBtnText}>{isLast ? 'Start recording' : 'Next step'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingBottom: 8,
  },
  topLogoWrap: {
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  topLogo: {
    width: 108,
    height: 32,
  },
  backText: {
    color: '#0369a1',
    fontSize: 15,
    fontWeight: '600',
    width: 48,
  },
  skipText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
    width: 48,
    textAlign: 'right',
  },
  page: {
    width,
  },
  pageInner: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  kicker: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 8,
  },
  body: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
    fontWeight: '500',
  },
  heroCard: {
    width: '100%',
    height: 210,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  dontCard: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  listTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  doMark: { color: '#15803d', fontWeight: '800', fontSize: 14, width: 16 },
  dontMark: { color: '#b91c1c', fontWeight: '800', fontSize: 14, width: 16 },
  listText: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  bottom: {
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 22,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  dotOn: {
    width: 22,
    backgroundColor: '#0284c7',
  },
  nextBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
