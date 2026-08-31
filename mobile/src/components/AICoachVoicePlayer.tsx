import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';

interface AICoachVoicePlayerProps {
  score?: number;
  techniqueScore?: number;
  executionScore?: number;
  shotType?: string;
  verdictLabel?: string;
  leadElbowAngle?: number;
  kneeFlexionAngle?: number;
  shotDirectionLabel?: string;
  reason?: string;
  commentaryText?: string;
}

export const AICoachVoicePlayer: React.FC<AICoachVoicePlayerProps> = ({
  score = 70,
  techniqueScore = 63,
  executionScore = 91,
  shotType = 'COVER DRIVE',
  verdictLabel = 'GOOD SHOT',
  leadElbowAngle = 138,
  kneeFlexionAngle = 132,
  shotDirectionLabel = 'COVER',
  reason,
  commentaryText,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Animated Audio Waveform Bars (6 bars)
  const barAnim1 = useRef(new Animated.Value(0.3)).current;
  const barAnim2 = useRef(new Animated.Value(0.7)).current;
  const barAnim3 = useRef(new Animated.Value(0.4)).current;
  const barAnim4 = useRef(new Animated.Value(0.9)).current;
  const barAnim5 = useRef(new Animated.Value(0.5)).current;
  const barAnim6 = useRef(new Animated.Value(0.8)).current;

  // Clean human-friendly verdict name
  const cleanVerdict = verdictLabel.replace(/_/g, ' ').toUpperCase();

  // Dynamically constructed commentary that perfectly matches the scorecard numbers on screen
  const defaultVoiceScript = commentaryText || (
    `${cleanVerdict}! You played a ${shotType} with an overall AI score of ${Math.round(score)} percent. ` +
    `Your technique scored ${Math.round(techniqueScore)} percent and execution scored ${Math.round(executionScore)} percent. ` +
    `Lead front elbow was at ${Math.round(leadElbowAngle)} degrees, directing the stroke through ${shotDirectionLabel}. ` +
    (reason ? `${reason}` : `Keep your head locked over the front knee to maximize power and control.`)
  );

  useEffect(() => {
    let loopAnimation: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      const createBarAnim = (anim: Animated.Value, min: number, max: number, duration: number) => {
        return Animated.sequence([
          Animated.timing(anim, { toValue: max, duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: min, duration, useNativeDriver: true }),
        ]);
      };

      loopAnimation = Animated.loop(
        Animated.parallel([
          createBarAnim(barAnim1, 0.2, 1.0, 350),
          createBarAnim(barAnim2, 0.3, 0.9, 280),
          createBarAnim(barAnim3, 0.1, 1.0, 420),
          createBarAnim(barAnim4, 0.4, 0.8, 300),
          createBarAnim(barAnim5, 0.2, 0.95, 380),
          createBarAnim(barAnim6, 0.3, 0.75, 260),
        ])
      );
      loopAnimation.start();
    } else {
      barAnim1.setValue(0.3);
      barAnim2.setValue(0.7);
      barAnim3.setValue(0.4);
      barAnim4.setValue(0.9);
      barAnim5.setValue(0.5);
      barAnim6.setValue(0.8);
    }

    return () => {
      loopAnimation?.stop();
    };
  }, [isPlaying]);

  const toggleSpeech = () => {
    try {
      let Speech: any = null;
      try {
        Speech = require('expo-speech');
      } catch (e) {
        Speech = null;
      }

      if (isPlaying) {
        if (Speech && Speech.stop) {
          Speech.stop();
        }
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        if (Speech && Speech.speak) {
          Speech.speak(defaultVoiceScript, {
            rate: 0.95,
            pitch: 1.0,
            onDone: () => setIsPlaying(false),
            onStopped: () => setIsPlaying(false),
            onError: () => setIsPlaying(false),
          });
        } else {
          // Fallback simulation timer if TTS module is linking
          setTimeout(() => {
            setIsPlaying(false);
          }, 8000);
        }
      }
    } catch (err) {
      console.warn('Speech playback error', err);
      setIsPlaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.micIcon}>🎙️</Text>
          <View>
            <Text style={styles.title}>AI COACH VOICE COMMENTARY</Text>
            <Text style={styles.subtitle}>Broadcast TV Audio Breakdown</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.transcriptBtn}
          onPress={() => setShowTranscript(!showTranscript)}
          activeOpacity={0.8}
        >
          <Text style={styles.transcriptBtnText}>
            {showTranscript ? 'HIDE SCRIPT' : 'VIEW SCRIPT'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Audio Player Control Bar */}
      <View style={styles.playerBar}>
        <TouchableOpacity 
          style={[styles.playButton, isPlaying && styles.playButtonActive]}
          onPress={toggleSpeech}
          activeOpacity={0.8}
        >
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          <Text style={styles.playLabel}>
            {isPlaying ? 'PAUSE COACH' : 'LISTEN TO COACH'}
          </Text>
        </TouchableOpacity>

        {/* Dynamic Waveform Visualizer */}
        <View style={styles.waveformContainer}>
          {[barAnim1, barAnim2, barAnim3, barAnim4, barAnim5, barAnim6].map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.waveformBar,
                {
                  transform: [{ scaleY: anim }],
                  backgroundColor: isPlaying ? '#10b981' : '#475569',
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.durationPill}>
          <Text style={styles.durationText}>{isPlaying ? 'PLAYING...' : '0:15 SEC'}</Text>
        </View>
      </View>

      {/* Spoken Transcript Dropdown Box */}
      {showTranscript && (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptLabel}>VOICE TRANSCRIPT:</Text>
          <Text style={styles.transcriptBody}>"{defaultVoiceScript}"</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a1224',
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micIcon: {
    fontSize: 20,
  },
  title: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  transcriptBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  transcriptBtnText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '800',
  },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  playButtonActive: {
    backgroundColor: '#f59e0b',
  },
  playIcon: {
    fontSize: 13,
    color: '#022c22',
  },
  playLabel: {
    color: '#022c22',
    fontSize: 11,
    fontWeight: '900',
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 24,
  },
  waveformBar: {
    width: 3.5,
    height: 20,
    borderRadius: 2,
  },
  durationPill: {
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },
  durationText: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '700',
  },
  transcriptBox: {
    marginTop: 10,
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  transcriptLabel: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 3,
  },
  transcriptBody: {
    color: '#e2e8f0',
    fontSize: 11.5,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
