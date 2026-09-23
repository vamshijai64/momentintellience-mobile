import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { Cricket3DViewer } from '../components/Cricket3DViewer';
import { colors, radii, shadows } from '../theme';

export const ARLabScreen: React.FC = () => {
  const [selectedShot, setSelectedShot] = useState<'PULL SHOT' | 'COVER DRIVE' | 'DEFENSIVE'>('PULL SHOT');

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title & Subtitle */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.livePill}>
              <View style={styles.liveGreenDot} />
              <Text style={styles.livePillText}>REALTIME 3D AR STUDIO</Text>
            </View>
          </View>
          <Text style={styles.title}>Augmented Reality Cricket Lab</Text>
          <Text style={styles.subtitle}>
            Touch and drag to inspect textbook batting technique from any 360° angle or place the 3D batsman directly into your room.
          </Text>
        </View>

        {/* Shot Selection Segmented Bar */}
        <View style={styles.shotTabs}>
          {(['PULL SHOT', 'COVER DRIVE', 'DEFENSIVE'] as const).map((shot) => {
            const isActive = selectedShot === shot;
            return (
              <TouchableOpacity
                key={shot}
                style={[styles.shotTab, isActive && styles.shotTabActive]}
                onPress={() => setSelectedShot(shot)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.shotTabText,
                    isActive && styles.shotTabTextActive,
                  ]}
                >
                  {shot === 'PULL SHOT'
                    ? '🏏 PULL SHOT'
                    : shot === 'COVER DRIVE'
                    ? '🏏 COVER DRIVE'
                    : '🛡️ DEFENSIVE'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Masterclass Pro Tip Banner */}
        <View style={styles.proTipBanner}>
          <Text style={styles.proTipBadge}>
            {selectedShot === 'PULL SHOT'
              ? 'ROHIT SHARMA TEXTBOOK TECHNIQUE'
              : selectedShot === 'COVER DRIVE'
              ? 'VIRAT KOHLI TEXTBOOK TECHNIQUE'
              : 'PUJARA TEXTBOOK TECHNIQUE'}
          </Text>
          <Text style={styles.proTipText}>
            {selectedShot === 'PULL SHOT'
              ? 'Chest-height contact · Hands swivel horizontally across body · Weight firmly anchored on back foot'
              : selectedShot === 'COVER DRIVE'
              ? 'High lead elbow (142°) · Stride forward onto crease · Bat presents full vertical face through extra cover'
              : 'Soft top-hand grip · Head aligned directly over contact point · Ball dropped dead at the crease'}
          </Text>
        </View>

        {/* ✅ REAL 3D MODEL — expo-gl + three.js WebGL (works in Expo Go) */}
        <Cricket3DViewer
          shotType={selectedShot}
          height={420}
        />

        {/* Biomechanical Checklist Card */}
        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>Key Biomechanical Targets</Text>
          <View style={styles.checklistItem}>
            <Text style={styles.checkIcon}>✅</Text>
            <View style={styles.checkTextCol}>
              <Text style={styles.checkLabel}>
                {selectedShot === 'PULL SHOT' ? 'Horizontal Bat Path' : 'Vertical Face Presentation'}
              </Text>
              <Text style={styles.checkDesc}>
                {selectedShot === 'PULL SHOT'
                  ? 'Bat blade swings parallel to pitch line to keep ball on the ground'
                  : 'Bat swings on line of off-stump toward extra cover'}
              </Text>
            </View>
          </View>

          <View style={styles.checklistItem}>
            <Text style={styles.checkIcon}>✅</Text>
            <View style={styles.checkTextCol}>
              <Text style={styles.checkLabel}>
                {selectedShot === 'PULL SHOT' ? 'Rear-Foot Anchor' : 'Front-Foot Deep Stride'}
              </Text>
              <Text style={styles.checkDesc}>
                {selectedShot === 'PULL SHOT'
                  ? 'Back leg absorbs kinetic shock, front leg swivels on ball of foot'
                  : 'Front knee bends to 136° with head aligned directly over the toe'}
              </Text>
            </View>
          </View>

          <View style={styles.checklistItem}>
            <Text style={styles.checkIcon}>✅</Text>
            <View style={styles.checkTextCol}>
              <Text style={styles.checkLabel}>
                {selectedShot === 'PULL SHOT' ? 'Wrist Roll Through Impact' : 'High Lead Elbow Elevation'}
              </Text>
              <Text style={styles.checkDesc}>
                {selectedShot === 'PULL SHOT'
                  ? 'Top hand controls the stroke; bottom hand snaps through to roll wrists'
                  : 'Lead elbow points toward target at 142° to generate clean power'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 14,
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  liveGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  livePillText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#94a3b8',
    lineHeight: 18,
  },
  shotTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
    gap: 4,
  },
  shotTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  shotTabActive: {
    backgroundColor: '#0284c7',
  },
  shotTabText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  shotTabTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  proTipBanner: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  proTipBadge: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  proTipText: {
    color: '#e2e8f0',
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 17,
  },
  checklistCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    marginTop: 10,
    gap: 12,
  },
  checklistTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkIcon: {
    fontSize: 14,
    marginTop: 2,
  },
  checkTextCol: {
    flex: 1,
    gap: 2,
  },
  checkLabel: {
    color: '#38bdf8',
    fontSize: 12.5,
    fontWeight: '700',
  },
  checkDesc: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 15,
  },
});
