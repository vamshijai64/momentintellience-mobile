import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import {
  getCurrentUser,
  getShotHistory,
  UserProfile,
} from '../services/api';

interface ProfileScreenProps {
  onBack: () => void;
  onViewHistory: () => void;
  onViewGuide?: () => void;
  onSignOut: () => void;
}

const ACCENT = '#38bdf8';
const ACCENT_SOFT = 'rgba(56, 189, 248, 0.15)';
const ACCENT_DEEP = '#0284c7';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onViewHistory,
  onViewGuide,
  onSignOut,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await getCurrentUser();
      setProfile(user);
      try {
        const history = await getShotHistory();
        setSessionCount(Array.isArray(history) ? history.length : 0);
      } catch {
        setSessionCount(0);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isGuest = (profile?.email || '').includes('@ai-cricket-coach.local');
  const initials = (profile?.full_name || profile?.email || 'P')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'P';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#060b14" />
      <View style={styles.blobCyan} />
      <View style={styles.blobBlue} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Camera</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Player Profile</Text>
          <View style={{ width: 60 }} />
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.nameText}>{profile?.full_name || 'Player'}</Text>
              <Text style={styles.emailText}>{profile?.email}</Text>
              <View style={[styles.badge, isGuest ? styles.badgeGuest : styles.badgeMember]}>
                <Text style={[styles.badgeText, isGuest ? styles.badgeGuestText : styles.badgeMemberText]}>
                  {isGuest ? 'Guest on this device' : 'Signed-in member'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{sessionCount}</Text>
                <Text style={styles.statLabel}>Saved Sessions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{profile?.is_active === false ? 'Off' : 'Active'}</Text>
                <Text style={styles.statLabel}>AI Cloud Status</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Account Details</Text>
            <View style={styles.menuCard}>
              <View style={styles.menuRow}>
                <Text style={styles.menuLabel}>Full Name</Text>
                <Text style={styles.menuValue}>{profile?.full_name || '—'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.menuRow}>
                <Text style={styles.menuLabel}>Email</Text>
                <Text style={styles.menuValue} numberOfLines={1}>
                  {profile?.email || '—'}
                </Text>
              </View>
              {!!profile?.created_at && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.menuRow}>
                    <Text style={styles.menuLabel}>Member Since</Text>
                    <Text style={styles.menuValue}>
                      {new Date(profile.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={onViewHistory} activeOpacity={0.88}>
              <Text style={styles.primaryBtnText}>Open Shot History & Analytics</Text>
              <Text style={styles.primaryBtnArrow}>→</Text>
            </TouchableOpacity>

            {onViewGuide && (
              <TouchableOpacity style={styles.guideBtn} onPress={onViewGuide} activeOpacity={0.85}>
                <Text style={styles.guideBtnText}>📖 Replay Batting & Framing Guide</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.logoutBtn} onPress={onSignOut} activeOpacity={0.85}>
              <Text style={styles.logoutBtnText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const softShadow = Platform.select({
  ios: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
  },
  android: { elevation: 3 },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060b14',
  },
  blobCyan: {
    position: 'absolute',
    top: -70,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  blobBlue: {
    position: 'absolute',
    top: 60,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 28,
    paddingBottom: 110,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 6,
  },
  backArrow: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '800',
  },
  backText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerBox: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#0a1224',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    ...softShadow,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
  },
  avatarText: {
    color: '#38bdf8',
    fontSize: 24,
    fontWeight: '800',
  },
  nameText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  emailText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeGuest: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  badgeMember: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  badgeGuestText: {
    color: '#fbbf24',
  },
  badgeMemberText: {
    color: '#38bdf8',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...softShadow,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  menuCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...softShadow,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  menuValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  primaryBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    ...softShadow,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryBtnArrow: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  guideBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  guideBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutBtnText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '800',
  },
});
