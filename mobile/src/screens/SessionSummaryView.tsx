import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ShotVerdict } from '../types';

interface SessionSummaryViewProps {
  shots: ShotVerdict[];
  overallScore?: number;
  onSelectShot: (index: number) => void;
  onViewComparison: () => void;
}

export const SessionSummaryView: React.FC<SessionSummaryViewProps> = ({
  shots,
  overallScore,
  onSelectShot,
  onViewComparison,
}) => {
  const goodShots = shots.filter((s) => s.verdict === 'GOOD_SHOT').length;
  const avgShots = shots.filter((s) => s.verdict === 'AVERAGE_SHOT').length;
  const badShots = shots.filter((s) => s.verdict === 'BAD_SHOT').length;

  const avgTechniqueScore = shots.length > 0
    ? Math.round(shots.reduce((sum, s) => sum + (s.technique_score || 0), 0) / shots.length)
    : 0;
  const avgExecutionScore = shots.length > 0
    ? Math.round(shots.reduce((sum, s) => sum + (s.execution_score || 0), 0) / shots.length)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📊</Text>
        <Text style={styles.headerTitle}>SESSION SUMMARY</Text>
        <Text style={styles.headerSubtitle}>{shots.length} Shot{shots.length !== 1 ? 's' : ''} Analyzed</Text>
      </View>

      {/* Overall Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Session Score</Text>
          <Text style={[styles.statValue, styles.statValueLarge]}>
            {typeof overallScore === 'number' ? `${Math.round(overallScore)}/100` : '—'}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{avgTechniqueScore}</Text>
            <Text style={styles.statBoxLabel}>Avg Technique</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{avgExecutionScore}</Text>
            <Text style={styles.statBoxLabel}>Avg Execution</Text>
          </View>
        </View>
      </View>

      {/* Shot Breakdown Card */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Shot Breakdown</Text>
        
        <View style={styles.breakdownRow}>
          <View style={[styles.breakdownBadge, styles.goodBadge]}>
            <Text style={styles.breakdownBadgeText}>✓</Text>
          </View>
          <Text style={styles.breakdownLabel}>{goodShots} Good Shot{goodShots !== 1 ? 's' : ''}</Text>
          <View style={[styles.breakdownBar, { flex: goodShots }]} />
        </View>

        <View style={styles.breakdownRow}>
          <View style={[styles.breakdownBadge, styles.avgBadge]}>
            <Text style={styles.breakdownBadgeText}>~</Text>
          </View>
          <Text style={styles.breakdownLabel}>{avgShots} Average Shot{avgShots !== 1 ? 's' : ''}</Text>
          <View style={[styles.breakdownBar, styles.avgBar, { flex: avgShots || 0.1 }]} />
        </View>

        <View style={styles.breakdownRow}>
          <View style={[styles.breakdownBadge, styles.badBadge]}>
            <Text style={styles.breakdownBadgeText}>✗</Text>
          </View>
          <Text style={styles.breakdownLabel}>{badShots} Poor Shot{badShots !== 1 ? 's' : ''}</Text>
          <View style={[styles.breakdownBar, styles.badBar, { flex: badShots || 0.1 }]} />
        </View>
      </View>

      {/* Shot List */}
      <View style={styles.shotListCard}>
        <Text style={styles.shotListTitle}>Individual Shots</Text>
        {shots.map((shot, index) => {
          const verdictColor = 
            shot.verdict === 'GOOD_SHOT' ? '#10b981' :
            shot.verdict === 'BAD_SHOT' ? '#ef4444' : '#f59e0b';
          const verdictIcon = 
            shot.verdict === 'GOOD_SHOT' ? '✓' :
            shot.verdict === 'BAD_SHOT' ? '✗' : '~';
          
          return (
            <TouchableOpacity
              key={index}
              style={styles.shotListItem}
              onPress={() => onSelectShot(index)}
            >
              <View style={[styles.shotListBadge, { backgroundColor: `${verdictColor}33` }]}>
                <Text style={[styles.shotListBadgeText, { color: verdictColor }]}>
                  {verdictIcon}
                </Text>
              </View>
              
              <View style={styles.shotListInfo}>
                <Text style={styles.shotListNumber}>Shot {index + 1}</Text>
                <Text style={styles.shotListType}>
                  {shot.shot_direction_label || 'Shot Analysis'}
                </Text>
              </View>
              
              <View style={styles.shotListScore}>
                <Text style={styles.shotListScoreValue}>{shot.composite_score || 0}</Text>
                <Text style={styles.shotListScoreLabel}>score</Text>
              </View>
              
              <Text style={styles.shotListArrow}>→</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Compare Button */}
      {shots.length > 1 && (
        <TouchableOpacity style={styles.compareButton} onPress={onViewComparison}>
          <Text style={styles.compareButtonText}>Compare All Shots Side-by-Side</Text>
          <Text style={styles.compareButtonIcon}>⚖️</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  statValueLarge: {
    fontSize: 32,
    color: '#10b981',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  breakdownCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  breakdownBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goodBadge: {
    backgroundColor: '#10b98133',
  },
  avgBadge: {
    backgroundColor: '#f59e0b33',
  },
  badBadge: {
    backgroundColor: '#ef444433',
  },
  breakdownBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#e2e8f0',
    width: 120,
  },
  breakdownBar: {
    height: 8,
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  avgBar: {
    backgroundColor: '#f59e0b',
  },
  badBar: {
    backgroundColor: '#ef4444',
  },
  shotListCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  shotListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  shotListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  shotListBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shotListBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shotListInfo: {
    flex: 1,
  },
  shotListNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  shotListType: {
    fontSize: 12,
    color: '#64748b',
  },
  shotListScore: {
    alignItems: 'center',
    marginRight: 8,
  },
  shotListScoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  shotListScoreLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  shotListArrow: {
    fontSize: 18,
    color: '#64748b',
  },
  compareButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  compareButtonIcon: {
    fontSize: 18,
  },
});
