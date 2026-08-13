import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { getShotHistory, ShotHistoryItem } from '../services/api';

interface ShotHistoryScreenProps {
  onBack?: () => void;
  onSelectVideo?: (videoId: string) => void;
}

const VERDICT_THEME: Record<string, { text: string; icon: string }> = {
  GOOD_SHOT: { text: '#10b981', icon: '✓' },
  AVERAGE_SHOT: { text: '#f59e0b', icon: '~' },
  BAD_SHOT: { text: '#ef4444', icon: '✗' },
};

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const ShotHistoryScreen: React.FC<ShotHistoryScreenProps> = ({ onBack, onSelectVideo }) => {
  const [history, setHistory] = useState<ShotHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setError(null);
      const data = await getShotHistory();
      setHistory(data || []);
    } catch (err) {
      console.log('Failed to load shot history', err);
      setError('Could not load shot history. Pull to refresh to try again.');
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadHistory().finally(() => setIsLoading(false));
  }, [loadHistory]);

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
  const lastWeekGoodPct = lastWeek.length > 0 ? Math.round((countBy(lastWeek, 'GOOD_SHOT') / lastWeek.length) * 100) : null;
  const thisWeekGoodPct = thisWeek.length > 0 ? Math.round((thisWeekGood / thisWeek.length) * 100) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#10b981" />}
    >
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SHOT HISTORY</Text>
      </View>

      {/* Stats Header */}
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

      {/* Shot List */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading past sessions...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : history.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No cricket sessions analyzed yet.</Text>
          <Text style={styles.emptySubText}>Record a shot to start tracking your progress.</Text>
        </View>
      ) : (
        history.map((item) => {
          const theme = item.verdict ? VERDICT_THEME[item.verdict] : null;
          const dateStr = new Date(item.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <TouchableOpacity
              key={item.video_id}
              style={styles.historyRow}
              onPress={() => onSelectVideo && onSelectVideo(item.video_id)}
            >
              <View style={[styles.verdictDot, { backgroundColor: theme?.text || '#64748b' }]} />
              <View style={styles.historyRowMain}>
                <Text style={styles.historyRowTitle}>
                  {item.shot_type || 'Shot'} {item.shot_count > 1 ? `(${item.shot_count} shots)` : ''}
                </Text>
                <Text style={styles.historyRowSub}>
                  {dateStr}{item.shot_direction_label ? ` · ${item.shot_direction_label}` : ''}
                </Text>
              </View>
              {typeof item.composite_score === 'number' && (
                <Text style={[styles.historyRowScore, { color: theme?.text || '#94a3b8' }]}>
                  {Math.round(item.composite_score)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })
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
    marginBottom: 16,
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
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 10,
  },
  verdictDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  historyRowMain: {
    flex: 1,
  },
  historyRowTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  historyRowSub: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  historyRowScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
