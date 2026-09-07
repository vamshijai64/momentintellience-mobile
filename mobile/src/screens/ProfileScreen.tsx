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
import {
  getCurrentUser,
  getShotHistory,
  UserProfile,
} from '../services/api';
import { ChevronLeft, ArrowRight, ChartColumn, BookOpen, LogOut } from 'lucide-react-native';
import { colors, radii } from '../theme';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Separator } from '../components/ui/Separator';

interface ProfileScreenProps {
  onBack: () => void;
  onViewHistory: () => void;
  onViewGuide?: () => void;
  onSignOut: () => void;
}

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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top App Header */}
        <View style={styles.headerBar}>
          <Button
            variant="outline"
            size="sm"
            onPress={onBack}
            iconLeft={<ChevronLeft size={16} color={colors.foreground} />}
            style={styles.backBtn}
          >
            Camera
          </Button>
          <Text style={styles.headerTitle}>Player Profile</Text>
          <View style={{ width: 70 }} />
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Button variant="outline" size="sm" onPress={loadProfile} style={{ marginTop: 12 }}>
              Retry
            </Button>
          </View>
        ) : (
          <>
            {/* Hero Profile Card */}
            <Card style={styles.heroCard}>
              <CardContent style={styles.heroContent}>
                <Avatar fallbackText={initials} size="lg" style={styles.avatar} />
                <Text style={styles.nameText}>{profile?.full_name || 'Player'}</Text>
                <Text style={styles.emailText}>{profile?.email}</Text>

                <Badge
                  variant={isGuest ? 'secondary' : 'default'}
                  dot
                  style={styles.badge}
                >
                  {isGuest ? 'Guest on this device' : 'Signed-in member'}
                </Badge>
              </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <CardContent>
                  <Text style={styles.statValue}>{sessionCount}</Text>
                  <Text style={styles.statLabel}>Saved Sessions</Text>
                </CardContent>
              </Card>

              <Card style={styles.statCard}>
                <CardContent>
                  <Text style={[styles.statValue, { color: colors.successText }]}>
                    {profile?.is_active === false ? 'Inactive' : 'Active'}
                  </Text>
                  <Text style={styles.statLabel}>AI Cloud Status</Text>
                </CardContent>
              </Card>
            </View>

            {/* Account Details Section */}
            <Text style={styles.sectionHeader}>Account Details</Text>
            <Card style={styles.detailsCard}>
              <CardContent>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Name</Text>
                  <Text style={styles.detailValue}>{profile?.full_name || '—'}</Text>
                </View>
                <Separator style={styles.separator} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {profile?.email || '—'}
                  </Text>
                </View>

                {!!profile?.created_at && (
                  <>
                    <Separator style={styles.separator} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Member Since</Text>
                      <Text style={styles.detailValue}>
                        {new Date(profile.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <View style={styles.actionGroup}>
              <Button
                variant="default"
                size="lg"
                onPress={onViewHistory}
                iconLeft={<ChartColumn size={17} color={colors.primaryForeground} strokeWidth={2.2} />}
                iconRight={<ArrowRight size={17} color={colors.primaryForeground} strokeWidth={2.4} />}
                style={styles.primaryActionBtn}
              >
                Open Shot History & Analytics
              </Button>

              {onViewGuide && (
                <Button
                  variant="outline"
                  size="default"
                  onPress={onViewGuide}
                  iconLeft={<BookOpen size={16} color={colors.foreground} />}
                  style={styles.secondaryActionBtn}
                >
                  Replay Batting & Framing Guide
                </Button>
              )}

              <Button
                variant="ghost"
                size="default"
                onPress={onSignOut}
                iconLeft={<LogOut size={16} color={colors.destructive} />}
                textStyle={{ color: colors.destructive, fontWeight: '600' }}
                style={styles.signOutBtn}
              >
                Sign Out
              </Button>
            </View>
          </>
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
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 24,
    paddingBottom: 110,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    borderRadius: radii.full,
    paddingHorizontal: 10,
    height: 34,
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
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  heroCard: {
    marginBottom: 14,
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    marginBottom: 12,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  emailText: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 2,
    marginBottom: 10,
  },
  badge: {
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 14,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.foreground,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  detailsCard: {
    marginBottom: 24,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.foreground,
    maxWidth: '65%',
    textAlign: 'right',
  },
  separator: {
    marginVertical: 6,
  },
  actionGroup: {
    gap: 10,
  },
  primaryActionBtn: {
    borderRadius: radii.md,
  },
  secondaryActionBtn: {
    borderRadius: radii.md,
  },
  signOutBtn: {
    marginTop: 6,
    alignSelf: 'center',
  },
});
