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
import { Play, Trash2, ChevronLeft } from 'lucide-react-native';
import {
  getCurrentUser,
  getOverlayVideoUrl,
  getShotHistory,
  deleteShotVideo,
  isGuestEmail,
  ShotHistoryItem,
} from '../services/api';

const ACCENT = '#0284c7';
const ACCENT_SOFT = '#e0f2fe';
const DANGER = '#dc2626';
const DANGER_SOFT = '#fee2e2';

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

const HistoryThumbnail: React.FC<{
  overlayPath?: string;
  thumbnailUrl?: string;
  verdict?: string;
}> = ({ overlayPath, thumbnailUrl }) => {
  const videoUrl = overlayPath ? getOverlayVideoUrl(overlayPath) : '';
  const remoteThumb = thumbnailUrl ? getOverlayVideoUrl(thumbnailUrl) : '';
  const [thumbUri, setThumbUri] = useState<string>(remoteThumb);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<Video>(null);
  const didSeekRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    didSeekRef.current = false;

    if (remoteThumb) {
      setThumbUri(remoteThumb);
      return () => {
        cancelled = true;
      };
    }

    if (!videoUrl) {
      setThumbUri('');
      return () => {
        cancelled = true;
      };
    }

    setThumbUri('');
    (async () => {
      try {
        const result = await VideoThumbnails.getThumbnailAsync(videoUrl, {
          time: 600,
          quality: 0.6,
        });
        if (!cancelled && result?.uri) {
          setThumbUri(result.uri);
        }
      } catch (err) {
        console.log('History thumbnail extract failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [videoUrl, remoteThumb]);

  const showImage = !!thumbUri && !failed;
  const showVideoFallback = !showImage && !!videoUrl && !failed;

  if (showImage) {
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

  if (showVideoFallback) {
    return (
      <View style={styles.thumbnailWrap}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.thumbnailVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isMuted
          useNativeControls={false}
          pointerEvents="none"
          onLoad={async (status: AVPlaybackStatus) => {
            if (!status.isLoaded || !videoRef.current || didSeekRef.current) return;
            didSeekRef.current = true;
            const target = Math.min(500, Math.max(200, Math.floor((status.durationMillis || 1000) * 0.15)));
            try {
              await videoRef.current.setPositionAsync(target);
            } catch {
              // ignore seek errors on list recycle
            }
          }}
          onError={() => setFailed(true)}
        />
        <ThumbnailPlayBadge />
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
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 44,
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
    backgroundColor: '#ffffff',
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 2,
  },
  backButtonText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  signOutHeaderBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
  },
  signOutHeaderText: {
    color: '#dc2626',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 12,
    lineHeight: 16,
  },
  todayBanner: {
    backgroundColor: '#dcfce7',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayBannerTitle: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '800',
  },
  todayBannerText: {
    color: '#166534',
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
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
  dayHeaderCount: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
  },
  statsEyebrow: {
    color: '#0284c7',
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
    color: '#334155',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#64748b',
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
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubText: {
    color: '#64748b',
    fontSize: 11.5,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 8,
  },
  emptyRecordBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyRecordBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  historyRow: {
    position: 'relative',
    marginBottom: 10,
    overflow: 'visible',
  },
  historyRowPress: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 10,
    gap: 10,
  },
  deleteOverlayBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  deleteIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: DANGER_SOFT,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  deleteModalTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalBody: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalShotName: {
    color: ACCENT,
    fontWeight: '700',
  },
  deleteModalError: {
    color: DANGER,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  deleteCancelBtn: {
    flex: 1,
    backgroundColor: ACCENT_SOFT,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  deleteCancelText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteConfirmBtn: {
    flex: 1,
    backgroundColor: DANGER,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  deleteConfirmBtnDisabled: {
    opacity: 0.7,
  },
  deleteConfirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  thumbnailWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  thumbnailVideo: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  thumbnailPlayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
  },
  thumbnailFallbackGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
    color: '#0f172a',
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  multiBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  multiBadgeText: {
    color: '#64748b',
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
    color: '#0284c7',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
