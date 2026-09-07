import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { Play, Trash2, ChevronLeft } from 'lucide-react-native';
import {
  getCurrentUser,
  getOverlayVideoUrl,
  getShotHistory,
  deleteShotVideo,
  isGuestEmail,
  ShotHistoryItem,
} from '../services/api';
import { colors, radii, shadows } from '../theme';

const ACCENT = colors.accent;
const ACCENT_SOFT = colors.accentSoft;
const DANGER = colors.destructive;
const DANGER_SOFT = colors.destructiveSoft;

interface ShotHistoryScreenProps {
  onBack?: () => void;
  onSelectVideo?: (videoId: string) => void;
  onSignOut?: () => void;
  /** Changes when user signs in/out so history reloads for the active account. */
  accountKey?: string;
}

const VERDICT_THEME: Record<string, { text: string; bg: string; label: string }> = {
  GOOD_SHOT: { text: '#15803d', bg: '#dcfce7', label: 'Good' },
  AVERAGE_SHOT: { text: '#b45309', bg: '#fef3c7', label: 'Average' },
  BAD_SHOT: { text: '#b91c1c', bg: '#fee2e2', label: 'Needs work' },
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

const ThumbnailPlayBadge = () => (
  <View style={styles.thumbnailPlay} pointerEvents="none">
    <View style={styles.thumbnailPlayBadge}>
      <Play size={16} color="#ffffff" fill="#ffffff" strokeWidth={0} />
    </View>
  </View>
);

const thumbMemoryCache = new Map<string, string>();

const extractThumbnail = async (videoUrl: string, videoId: string): Promise<string | null> => {
  if (!videoUrl || !videoId) return null;

  // 1. In-memory cache
  if (thumbMemoryCache.has(videoId)) {
    return thumbMemoryCache.get(videoId)!;
  }

  // 2. Local disk cache (persistent across re-renders & app sessions)
  const cacheFile = `${FileSystem.cacheDirectory}shot_thumb_${videoId}.jpg`;
  try {
    const info = await FileSystem.getInfoAsync(cacheFile);
    if (info.exists && info.size && info.size > 0) {
      thumbMemoryCache.set(videoId, cacheFile);
      return cacheFile;
    }
  } catch {}

  // 3. Direct extraction (fast path via expo-video-thumbnails)
  try {
    const result = await VideoThumbnails.getThumbnailAsync(videoUrl, {
      time: 200,
      quality: 0.7,
    });
    if (result?.uri) {
      try {
        await FileSystem.copyAsync({ from: result.uri, to: cacheFile });
        thumbMemoryCache.set(videoId, cacheFile);
        return cacheFile;
      } catch {
        thumbMemoryCache.set(videoId, result.uri);
        return result.uri;
      }
    }
  } catch (directErr) {
    // Direct extraction on Android can fail on remote HTTP streaming URLs
  }

  // 4. Download video slice to local cache then extract (100% reliable on Android)
  const tempVideo = `${FileSystem.cacheDirectory}temp_vid_${videoId}.mp4`;
  try {
    const dlResult = await FileSystem.downloadAsync(videoUrl, tempVideo);
    if (dlResult?.uri) {
      const result = await VideoThumbnails.getThumbnailAsync(dlResult.uri, {
        time: 200,
        quality: 0.7,
      });
      // Delete temporary download to free storage
      FileSystem.deleteAsync(tempVideo, { idempotent: true }).catch(() => {});
      if (result?.uri) {
        try {
          await FileSystem.copyAsync({ from: result.uri, to: cacheFile });
          thumbMemoryCache.set(videoId, cacheFile);
          return cacheFile;
        } catch {
          thumbMemoryCache.set(videoId, result.uri);
          return result.uri;
        }
      }
    }
  } catch (dlErr) {
    FileSystem.deleteAsync(tempVideo, { idempotent: true }).catch(() => {});
  }

  return null;
};

const HistoryThumbnail: React.FC<{
  overlayPath?: string;
  thumbnailUrl?: string;
  videoId: string;
  verdict?: string;
}> = ({ overlayPath, thumbnailUrl, videoId, verdict }) => {
  const videoUrl = overlayPath ? getOverlayVideoUrl(overlayPath) : '';
  const remoteThumb = thumbnailUrl ? getOverlayVideoUrl(thumbnailUrl) : '';
  const initialThumb = remoteThumb || thumbMemoryCache.get(videoId) || '';
  const [thumbUri, setThumbUri] = useState<string>(initialThumb);
  const [isLoading, setIsLoading] = useState<boolean>(!initialThumb && !!videoUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    if (remoteThumb) {
      setThumbUri(remoteThumb);
      setIsLoading(false);
      return () => { cancelled = true; };
    }

    if (thumbMemoryCache.has(videoId)) {
      setThumbUri(thumbMemoryCache.get(videoId)!);
      setIsLoading(false);
      return () => { cancelled = true; };
    }

    if (!videoUrl) {
      setIsLoading(false);
      return () => { cancelled = true; };
    }

    setIsLoading(true);
    extractThumbnail(videoUrl, videoId).then((uri) => {
      if (cancelled) return;
      if (uri) {
        setThumbUri(uri);
        setFailed(false);
      } else {
        setFailed(true);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [videoUrl, remoteThumb, videoId]);

  if (thumbUri && !failed) {
    return (
      <View style={styles.thumbnailWrap}>
        <Image
          source={{ uri: thumbUri }}
          style={styles.thumbnailVideo}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
        <ThumbnailPlayBadge />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.thumbnailWrap, styles.thumbnailLoading]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.thumbnailWrap, styles.thumbnailFallback]}>
      <View style={styles.thumbnailFallbackGlow} />
      <ThumbnailPlayBadge />
    </View>
  );
};

const HistoryRow: React.FC<{
  item: ShotHistoryItem;
  onSelect?: (videoId: string) => void;
  onRequestDelete?: (item: ShotHistoryItem) => void;
  accountKey?: string;
}> = ({ item, onSelect, onRequestDelete }) => {
  const theme = item.verdict ? VERDICT_THEME[item.verdict] : null;
  const timeStr = new Date(item.created_at).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const score = typeof item.composite_score === 'number' ? Math.round(item.composite_score) : null;

  return (
    <View style={styles.historyRow}>
      <TouchableOpacity
        style={styles.historyRowPress}
        onPress={() => onSelect?.(item.video_id)}
        activeOpacity={0.85}
      >
        <HistoryThumbnail
          overlayPath={item.overlay_video_path || item.overlay_video_url}
          thumbnailUrl={item.thumbnail_url}
          videoId={item.video_id}
          verdict={item.verdict}
        />

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

      <TouchableOpacity
        style={styles.deleteOverlayBtn}
        onPress={() => onRequestDelete?.(item)}
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Delete shot"
      >
        <Trash2 size={15} color={DANGER} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
};

const DeleteShotModal: React.FC<{
  visible: boolean;
  item: ShotHistoryItem | null;
  deleting: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ visible, item, deleting, error, onCancel, onConfirm }) => {
  const shotLabel = formatShotType(item?.shot_type);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.deleteModalBackdrop}>
        <View style={styles.deleteModalCard}>
          <View style={styles.deleteIconWrap}>
            <Trash2 size={22} color={DANGER} strokeWidth={2.2} />
          </View>

          <Text style={styles.deleteModalTitle}>Delete this shot?</Text>
          <Text style={styles.deleteModalBody}>
            Remove <Text style={styles.deleteModalShotName}>{shotLabel}</Text> from your history.
            This cannot be undone.
          </Text>

          {!!error && <Text style={styles.deleteModalError}>{error}</Text>}

          <View style={styles.deleteModalActions}>
            <TouchableOpacity
              style={styles.deleteCancelBtn}
              onPress={onCancel}
              activeOpacity={0.85}
              disabled={deleting}
            >
              <Text style={styles.deleteCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteConfirmBtn, deleting && styles.deleteConfirmBtnDisabled]}
              onPress={onConfirm}
              activeOpacity={0.85}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.deleteConfirmText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const ShotHistoryScreen: React.FC<ShotHistoryScreenProps> = ({
  onBack,
  onSelectVideo,
  onSignOut,
  accountKey = 'default',
}) => {
  const [history, setHistory] = useState<ShotHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accountLabel, setAccountLabel] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<ShotHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setHistory([]);
      const user = await getCurrentUser();
      const guest = isGuestEmail(user.email);
      setAccountLabel(guest ? 'Guest Session' : user.email);
      const data = await getShotHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.log('Failed to load shot history', err);
      setHistory([]);
      setError(err?.message || 'Could not load shot history. Pull to refresh to try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, accountKey]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await deleteShotVideo(deleteTarget.video_id);
      setHistory((prev) => prev.filter((h) => h.video_id !== deleteTarget.video_id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'Could not delete this shot. Try again.');
    } finally {
      setIsDeleting(false);
    }
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
    <View style={styles.container}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#10b981" />
      }
    >
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
          <ChevronLeft size={16} color="#0284c7" strokeWidth={2.6} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SHOT HISTORY</Text>
        {onSignOut ? (
          <TouchableOpacity style={styles.signOutHeaderBtn} onPress={onSignOut} activeOpacity={0.7}>
            <Text style={styles.signOutHeaderText}>🚪 LOGOUT</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
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
          <Text style={styles.emptyIcon}>🏏</Text>
          <Text style={styles.emptyText}>No saved shots for this account yet</Text>
          <Text style={styles.emptySubText}>
            {accountLabel.includes('Guest')
              ? 'You are in a Guest session. Record a new shot with your camera to save it here.'
              : `Logged in as ${accountLabel}. Only shots recorded by your account will appear here.`}
          </Text>
          {onBack && (
            <TouchableOpacity style={styles.emptyRecordBtn} onPress={onBack} activeOpacity={0.8}>
              <Text style={styles.emptyRecordBtnText}>📹 RECORD YOUR FIRST SHOT</Text>
            </TouchableOpacity>
          )}
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
              <HistoryRow
                key={item.video_id}
                item={item}
                onSelect={onSelectVideo}
                onRequestDelete={(target) => {
                  setDeleteError(null);
                  setDeleteTarget(target);
                }}
              />
            ))}
          </View>
        ))
      )}
    </ScrollView>

      <DeleteShotModal
        visible={!!deleteTarget}
        item={deleteTarget}
        deleting={isDeleting}
        error={deleteError}
        onCancel={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 36,
    paddingBottom: 110,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 3,
    ...shadows.sm,
  },
  backButtonText: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  signOutHeaderBtn: {
    backgroundColor: colors.destructiveSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.destructiveBorder,
  },
  signOutHeaderText: {
    color: colors.destructiveText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSub: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 17,
  },
  todayBanner: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  todayBannerTitle: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '700',
  },
  todayBannerText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  daySection: {
    marginBottom: 20,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dayHeaderTitle: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  dayHeaderCount: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 18,
    ...shadows.sm,
  },
  statsEyebrow: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
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
    fontWeight: '800',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  statLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  trendText: {
    color: colors.mutedForeground,
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 12,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 10,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
    ...shadows.sm,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubText: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  emptyRecordBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.md,
    marginTop: 16,
  },
  emptyRecordBtnText: {
    color: colors.primaryForeground,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  historyRow: {
    position: 'relative',
    marginBottom: 10,
    overflow: 'visible',
  },
  historyRowPress: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 11,
    gap: 12,
    ...shadows.sm,
  },
  deleteOverlayBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 20,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    ...shadows.lg,
  },
  deleteIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.destructiveSoft,
    borderWidth: 1,
    borderColor: colors.destructiveBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  deleteModalTitle: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  deleteModalBody: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalShotName: {
    color: colors.foreground,
    fontWeight: '700',
  },
  deleteModalError: {
    color: colors.destructive,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 12,
  },
  deleteCancelBtn: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteCancelText: {
    color: colors.foreground,
    fontSize: 13.5,
    fontWeight: '600',
  },
  deleteConfirmBtn: {
    flex: 1,
    backgroundColor: colors.destructive,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteConfirmBtnDisabled: {
    opacity: 0.7,
  },
  deleteConfirmText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '600',
  },
  thumbnailWrap: {
    width: 58,
    height: 58,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  thumbnailLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  thumbnailVideo: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  thumbnailPlayBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  thumbnailFallbackGlow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
    color: colors.foreground,
    fontSize: 13.5,
    fontWeight: '700',
    flexShrink: 1,
    letterSpacing: -0.1,
  },
  multiBadge: {
    backgroundColor: colors.muted,
    borderRadius: radii.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiBadgeText: {
    color: colors.mutedForeground,
    fontSize: 9.5,
    fontWeight: '600',
  },
  historyRowSub: {
    color: colors.mutedForeground,
    fontSize: 11,
    marginTop: 2,
  },
  verdictPill: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  verdictPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scoreCol: {
    alignItems: 'flex-end',
    minWidth: 44,
  },
  historyRowScore: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scoreLabel: {
    color: colors.mutedForeground,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  replayHint: {
    color: colors.accent,
    fontSize: 11.5,
    fontWeight: '700',
  },
});
