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
  onSignOut: () => void;
}

const ACCENT = '#0d9488';
const ACCENT_SOFT = '#ccfbf1';
const ACCENT_DEEP = '#0f766e';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onViewHistory,
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
        setSessionCount(history?.length || 0);
      } catch {
        setSessionCount(0);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load profile. Check backend connection.');
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
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#faf9f6" />
      <View style={styles.blobTL} />
      <View style={styles.blobTR} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 72 }} />
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
                  {isGuest ? 'Guest on this phone' : 'Signed-in member'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{sessionCount}</Text>
                <Text style={styles.statLabel}>Saved sessions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{profile?.is_active === false ? 'Off' : 'On'}</Text>
                <Text style={styles.statLabel}>Account status</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.menuCard}>
              <View style={styles.menuRow}>
                <Text style={styles.menuLabel}>Full name</Text>
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
                    <Text style={styles.menuLabel}>Joined</Text>
                    <Text style={styles.menuValue}>
                      {new Date(profile.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={onViewHistory} activeOpacity={0.88}>
              <Text style={styles.primaryBtnText}>Open shot history</Text>
              <Text style={styles.primaryBtnArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={onSignOut} activeOpacity={0.85}>
              <Text style={styles.logoutBtnText}>Sign out</Text>
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
    backgroundColor: '#faf9f6',
  },
  blobTL: {
    position: 'absolute',
    top: -70,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#99f6e4',
    opacity: 0.4,
  },
  blobTR: {
    position: 'absolute',
    top: 60,
    right: -70,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fef3c7',
    opacity: 0.35,
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 28,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  backButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    color: ACCENT_DEEP,
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  centerBox: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#be123c',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...softShadow,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: ACCENT_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#a7f3d0',
  },
  avatarText: {
    color: ACCENT_DEEP,
    fontSize: 24,
    fontWeight: '800',
  },
  nameText: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  emailText: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeGuest: {
    backgroundColor: '#fef3c7',
  },
  badgeMember: {
    backgroundColor: ACCENT_SOFT,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeGuestText: {
    color: '#b45309',
  },
  badgeMemberText: {
    color: ACCENT_DEEP,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    ...softShadow,
  },
  statValue: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
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
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 18,
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
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  menuValue: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  primaryBtn: {
    backgroundColor: ACCENT,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  primaryBtnArrow: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fecdd3',
  },
  logoutBtnText: {
    color: '#be123c',
    fontSize: 14,
    fontWeight: '800',
  },
});
