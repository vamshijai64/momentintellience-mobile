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
import { clearAuthSession, getCurrentUser, isGuestEmail, UserProfile } from '../services/api';

interface SignOutScreenProps {
  onCancel: () => void;
  onSignedOut: () => void;
}

const ACCENT = '#0d9488';
const ACCENT_SOFT = '#ccfbf1';
const ACCENT_DEEP = '#0f766e';

export const SignOutScreen: React.FC<SignOutScreenProps> = ({ onCancel, onSignedOut }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await getCurrentUser();
      setProfile(user);
    } catch (err: any) {
      setError(err?.message || 'Could not load account details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await clearAuthSession();
      onSignedOut();
    } catch (err: any) {
      setError(err?.message || 'Could not sign out. Please try again.');
      setSigningOut(false);
    }
  };

  const isGuest = isGuestEmail(profile?.email);
  const initials = (profile?.full_name || profile?.email || '?')
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
          <TouchableOpacity style={styles.backButton} onPress={onCancel} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sign out</Text>
          <View style={{ width: 72 }} />
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={styles.loadingText}>Loading account...</Text>
          </View>
        ) : (
          <>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>{isGuest ? '👋' : '🔒'}</Text>
            </View>

            <Text style={styles.title}>
              {isGuest ? 'End guest session?' : 'Sign out of your account?'}
            </Text>
            <Text style={styles.subtitle}>
              {isGuest
                ? 'You will return to the sign-in screen. Guest uploads on this phone stay saved under the guest account until you sign in with email.'
                : 'You will need to sign in again to save new sessions to this account. Your past uploads stay linked to this email.'}
            </Text>

            {profile && (
              <View style={styles.accountCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{profile.full_name || 'Player'}</Text>
                  <Text style={styles.accountEmail} numberOfLines={1}>
                    {profile.email}
                  </Text>
                  <View style={[styles.badge, isGuest ? styles.badgeGuest : styles.badgeMember]}>
                    <Text style={[styles.badgeText, isGuest ? styles.badgeGuestText : styles.badgeMemberText]}>
                      {isGuest ? 'Guest on this phone' : 'Signed-in member'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.signOutBtn, signingOut && styles.signOutBtnDisabled]}
              onPress={handleSignOut}
              disabled={signingOut}
              activeOpacity={0.88}
            >
              {signingOut ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.signOutBtnText}>
                  {isGuest ? 'End session & go to sign in' : 'Sign out'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={signingOut}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelBtnText}>Stay signed in</Text>
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
    marginBottom: 28,
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
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#fecdd3',
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  accountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    ...softShadow,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: ACCENT_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#a7f3d0',
  },
  avatarText: {
    color: ACCENT_DEEP,
    fontSize: 18,
    fontWeight: '800',
  },
  accountInfo: {
    flex: 1,
    minWidth: 0,
  },
  accountName: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  accountEmail: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeGuest: {
    backgroundColor: '#fef3c7',
  },
  badgeMember: {
    backgroundColor: ACCENT_SOFT,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeGuestText: {
    color: '#b45309',
  },
  badgeMemberText: {
    color: ACCENT_DEEP,
  },
  errorText: {
    color: '#be123c',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  signOutBtn: {
    backgroundColor: '#be123c',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  signOutBtnDisabled: {
    opacity: 0.7,
  },
  signOutBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: {
    color: ACCENT_DEEP,
    fontSize: 14,
    fontWeight: '800',
  },
});
