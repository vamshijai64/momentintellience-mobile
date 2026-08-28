import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { getCurrentUser, getOverlayVideoUrl, getShotHistory, isGuestEmail, ShotHistoryItem } from '../services/api';

interface ShotHistoryScreenProps {
  onBack?: () => void;
  onSelectVideo?: (videoId: string) => void;
  /** Changes when user signs in/out so history reloads for the active account. */
  accountKey?: string;
}

const VERDICT_THEME: Record<string, { text: string; bg: string; label: string }> = {
  GOOD_SHOT: { text: '#10b981', bg: '#064e3b', label: 'Good' },
  AVERAGE_SHOT: { text: '#f59e0b', bg: '#78350f', label: 'Average' },
  BAD_SHOT: { text: '#ef4444', bg: '#7f1d1d', label: 'Needs work' },
};

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const formatShotType = (shotType?: string) => {
  if (!shotType) return 'Cricket shot';
  return shotType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDayHeader = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return 'Unknown day';

  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

const groupHistoryByDay = (items: ShotHistoryItem[]) => {
  const groups = new Map<string, ShotHistoryItem[]>();

  for (const item of items) {
    const date = new Date(item.created_at);
    const key = isNaN(date.getTime())
      ? 'unknown'
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, dayItems]) => ({
      key,
      label: formatDayHeader(dayItems[0]?.created_at || key),
      items: dayItems.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    }));
};

const HistoryThumbnail: React.FC<{ overlayPath?: string; verdict?: string }> = ({
  overlayPath,
  verdict,
}) => {
  const theme = verdict ? VERDICT_THEME[verdict] : null;
  const videoUrl = overlayPath ? getOverlayVideoUrl(overlayPath) : '';

  if (videoUrl) {
    return (
      <View style={styles.thumbnailWrap}>
        <Video
          source={{ uri: videoUrl }}
          style={styles.thumbnailVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isMuted
          useNativeControls={false}
        />
        <View style={styles.thumbnailPlay}>
          <Text style={styles.thumbnailPlayIcon}>▶</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.thumbnailWrap, styles.thumbnailFallback, { backgroundColor: theme?.bg || '#1e293b' }]}>
      <Text style={styles.thumbnailFallbackIcon}>🏏</Text>
    </View>
  );
};

const HistoryRow: React.FC<{
  item: ShotHistoryItem;
  onSelect?: (videoId: string) => void;
}> = ({ item, onSelect }) => {
  const theme = item.verdict ? VERDICT_THEME[item.verdict] : null;
  const timeStr = new Date(item.created_at).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const score = typeof item.composite_score === 'number' ? Math.round(item.composite_score) : null;

  return (
    <TouchableOpacity
      style={styles.historyRow}
      onPress={() => onSelect?.(item.video_id)}
      activeOpacity={0.85}
    >
      <HistoryThumbnail overlayPath={item.overlay_video_path} verdict={item.verdict} />

      <View style={styles.historyRowMain}>
        <View style={styles.titleRow}>
          <Text style={styles.historyRowTitle} numberOfLines={1}>
            {formatShotType(item.shot_type)}
          </Text>
          {item.shot_count > 1 && (
            <View style={styles.multiBadge}>
              <Text style={styles.multiBadgeText}>{item.shot_count} shots</Text>
            </View>
          )}
        </View>

        <Text style={styles.historyRowSub} numberOfLines={1}>
          {timeStr}
          {item.shot_direction_label ? ` · ${item.shot_direction_label}` : ''}
        </Text>

        {theme && (
          <View style={[styles.verdictPill, { backgroundColor: theme.bg }]}>
            <Text style={[styles.verdictPillText, { color: theme.text }]}>{theme.label}</Text>
          </View>
        )}
      </View>

      <View style={styles.scoreCol}>
        {score !== null ? (
          <>
            <Text style={[styles.historyRowScore, { color: theme?.text || '#94a3b8' }]}>{score}</Text>
            <Text style={styles.scoreLabel}>score</Text>
          </>
        ) : (
          <Text style={styles.replayHint}>Replay →</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const ShotHistoryScreen: React.FC<ShotHistoryScreenProps> = ({
  onBack,
  onSelectVideo,
  accountKey = 'default',
}) => {
  const [history, setHistory] = useState<ShotHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accountLabel, setAccountLabel] = useState<string>('');

  const loadHistory = useCallback(async () => {
    try {
      setError(null);
      setHistory([]);
      const user = await getCurrentUser();
      const guest = isGuestEmail(user.email);
      setAccountLabel(guest ? 'Guest on this phone' : user.email);
      const data = await getShotHistory();
      setHistory(data || []);
    } catch (err: any) {
      console.log('Failed to load shot history', err);
      setHistory([]);
      setError(err?.message || 'Could not load shot history. Pull to refresh to try again.');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadHistory().finally(() => setIsLoading(false));
  }, [loadHistory, accountKey]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  };

  const now = Date.now();
  const thisWeek = history.filter((h) => {
    const created = new Date(h.created_at).getTime();
    return !isNaN(created) && now - created <= ONE_WEEK_MS;
  });
  const lastWeek = history.filter((h) => {
    const created = new Date(h.created_at).getTime();
    return !isNaN(created) && now - created > ONE_WEEK_MS && now - created <= 2 * ONE_WEEK_MS;
  });

  const countBy = (items: ShotHistoryItem[], verdict: string) =>
    items.filter((h) => h.verdict === verdict).length;

  const thisWeekGood = countBy(thisWeek, 'GOOD_SHOT');
  const thisWeekAvg = countBy(thisWeek, 'AVERAGE_SHOT');
  const thisWeekBad = countBy(thisWeek, 'BAD_SHOT');
  const lastWeekGoodPct =
    lastWeek.length > 0 ? Math.round((countBy(lastWeek, 'GOOD_SHOT') / lastWeek.length) * 100) : null;
  const thisWeekGoodPct =
    thisWeek.length > 0 ? Math.round((thisWeekGood / thisWeek.length) * 100) : null;

  const todaySessions = history.filter((h) => formatDayHeader(h.created_at) === 'Today');
  const dailyGroups = groupHistoryByDay(history);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#10b981" />
      }
    >
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SHOT HISTORY</Text>
      </View>

      <Text style={styles.headerSub}>
        {accountLabel
          ? `Daily uploads for ${accountLabel}`
          : 'See what you recorded each day — tap to replay'}
      </Text>

      {todaySessions.length > 0 && (
        <View style={styles.todayBanner}>
          <Text style={styles.todayBannerTitle}>📅 Today</Text>
          <Text style={styles.todayBannerText}>
            {todaySessions.length} video{todaySessions.length === 1 ? '' : 's'} uploaded
          </Text>
        </View>
      )}

      <View style={styles.statsCard}>
        <Text style={styles.statsEyebrow}>THIS WEEK</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBubble}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{thisWeekGood}</Text>
            <Text style={styles.statLabel}>GOOD</Text>
          </View>
          <View style={styles.statBubble}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{thisWeekAvg}</Text>
            <Text style={styles.statLabel}>AVERAGE</Text>
          </View>
          <View style={styles.statBubble}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{thisWeekBad}</Text>
            <Text style={styles.statLabel}>BAD</Text>
          </View>
        </View>
        {thisWeekGoodPct !== null && (
          <Text style={styles.trendText}>
            {thisWeekGoodPct}% good shots this week
            {lastWeekGoodPct !== null
              ? ` (${thisWeekGoodPct >= lastWeekGoodPct ? '+' : ''}${thisWeekGoodPct - lastWeekGoodPct}pt vs last week)`
              : ''}
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading past sessions...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No saved sessions yet</Text>
          <Text style={styles.emptySubText}>
            Record a batting shot with this account. Only your uploads appear here — not other users or old guest
            sessions after you sign in.
          </Text>
        </View>
      ) : (
        dailyGroups.map((group) => (
          <View key={group.key} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayHeaderTitle}>{group.label}</Text>
              <Text style={styles.dayHeaderCount}>
                {group.items.length} upload{group.items.length === 1 ? '' : 's'}
              </Text>
            </View>
            {group.items.map((item) => (
              <HistoryRow key={item.video_id} item={item} onSelect={onSelectVideo} />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 44,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  backButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 12,
    lineHeight: 16,
  },
  todayBanner: {
    backgroundColor: '#064e3b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#10b981',
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayBannerTitle: {
    color: '#6ee7b7',
    fontSize: 13,
    fontWeight: '800',
  },
  todayBannerText: {
    color: '#d1fae5',
    fontSize: 12,
    fontWeight: '700',
  },
  daySection: {
    marginBottom: 18,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dayHeaderTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  dayHeaderCount: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 16,
  },
  statsEyebrow: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBubble: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  trendText: {
    color: '#cbd5e1',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    marginBottom: 10,
    gap: 10,
  },
  thumbnailWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  thumbnailVideo: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  thumbnailPlayIcon: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 2,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailFallbackIcon: {
    fontSize: 24,
  },
  historyRowMain: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyRowTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  multiBadge: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  multiBadgeText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: 'bold',
  },
  historyRowSub: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 3,
  },
  verdictPill: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 5,
  },
  verdictPillText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  scoreCol: {
    alignItems: 'flex-end',
    minWidth: 44,
  },
  historyRowScore: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  replayHint: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
