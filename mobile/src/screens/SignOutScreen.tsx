import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { clearAuthSession, getCurrentUser, isGuestEmail, UserProfile } from '../services/api';
import { ChevronLeft, LogOut } from 'lucide-react-native';
import { colors, radii } from '../theme';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';

interface SignOutScreenProps {
  onCancel: () => void;
  onSignedOut: () => void;
}

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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBar}>
          <Button
            variant="outline"
            size="sm"
            onPress={onCancel}
            iconLeft={<ChevronLeft size={16} color={colors.foreground} />}
            style={styles.backBtn}
          >
            Back
          </Button>
          <Text style={styles.headerTitle}>Sign Out</Text>
          <View style={{ width: 64 }} />
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading account...</Text>
          </View>
        ) : (
          <View style={styles.bodyWrapper}>
            <View style={styles.iconCircle}>
              <LogOut size={26} color={colors.destructive} strokeWidth={2.2} />
            </View>

            <Text style={styles.title}>
              {isGuest ? 'End guest session?' : 'Sign out of your account?'}
            </Text>
            <Text style={styles.subtitle}>
              {isGuest
                ? 'You will return to the sign-in screen. Guest uploads on this phone remain stored locally.'
                : 'You will need to sign in again to sync new sessions. Your past uploads stay safe in the cloud.'}
            </Text>

            {profile && (
              <Card style={styles.accountCard}>
                <CardContent style={styles.accountCardContent}>
                  <Avatar fallbackText={initials} size="default" />
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{profile.full_name || 'Player'}</Text>
                    <Text style={styles.accountEmail} numberOfLines={1}>
                      {profile.email}
                    </Text>
                    <Badge variant={isGuest ? 'secondary' : 'default'} style={styles.badge}>
                      {isGuest ? 'Guest' : 'Member'}
                    </Badge>
                  </View>
                </CardContent>
              </Card>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actionColumn}>
              <Button
                variant="destructive"
                size="lg"
                onPress={handleSignOut}
                loading={signingOut}
                disabled={signingOut}
              >
                {isGuest ? 'End Session & Go to Sign In' : 'Sign Out'}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onPress={onCancel}
                disabled={signingOut}
              >
                Stay Signed In
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 22,
    paddingTop: Platform.OS === 'ios' ? 48 : 32,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    borderRadius: radii.full,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.2,
  },
  centerBox: {
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.mutedForeground,
  },
  bodyWrapper: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.destructiveSoft,
    borderWidth: 1,
    borderColor: colors.destructiveBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  accountCard: {
    width: '100%',
    marginBottom: 24,
  },
  accountCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.1,
  },
  accountEmail: {
    fontSize: 12.5,
    color: colors.mutedForeground,
    marginTop: 2,
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  actionColumn: {
    width: '100%',
    gap: 10,
  },
});
