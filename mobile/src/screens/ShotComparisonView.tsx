import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ShotVerdict } from '../types';

interface ShotComparisonViewProps {
  shots: ShotVerdict[];
  onBack: () => void;
  onSelectShot: (index: number) => void;
}

export const ShotComparisonView: React.FC<ShotComparisonViewProps> = ({
  shots,
  onBack,
  onSelectShot,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare Shots</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Horizontal Shot Cards */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {shots.map((shot, index) => {
          const verdictColor = 
            shot.verdict === 'GOOD_SHOT' ? '#10b981' :
            shot.verdict === 'BAD_SHOT' ? '#ef4444' : '#f59e0b';
          const verdictLabel = 
            shot.verdict === 'GOOD_SHOT' ? 'GOOD SHOT' :
            shot.verdict === 'BAD_SHOT' ? 'POOR SHOT' : 'AVERAGE SHOT';
          const verdictIcon = 
            shot.verdict === 'GOOD_SHOT' ? '✓' :
            shot.verdict === 'BAD_SHOT' ? '✗' : '~';

          return (
            <View key={index} style={styles.shotCard}>
              {/* Shot Number Badge */}
              <View style={[styles.shotBadge, { backgroundColor: verdictColor }]}>
                <Text style={styles.shotBadgeText}>SHOT {index + 1}</Text>
              </View>

              {/* Verdict */}
              <View style={[styles.verdictBadge, { borderColor: verdictColor }]}>
                <Text style={[styles.verdictIcon, { color: verdictColor }]}>{verdictIcon}</Text>
                <Text style={[styles.verdictLabel, { color: verdictColor }]}>{verdictLabel}</Text>
              </View>

              {/* Shot Type */}
              <Text style={styles.shotType}>
                {shot.shot_direction_label || 'Shot Analysis'}
              </Text>

              {/* Scores Grid */}
              <View style={styles.scoresGrid}>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>{shot.composite_score || 0}</Text>
                  <Text style={styles.scoreLabel}>Overall</Text>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>{shot.technique_score || 0}</Text>
                  <Text style={styles.scoreLabel}>Technique</Text>
                </View>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>{shot.execution_score || 0}</Text>
                  <Text style={styles.scoreLabel}>Execution</Text>
                </View>
              </View>

              {/* Shot Direction */}
              {shot.shot_direction_deg !== undefined && (
                <View style={styles.directionBox}>
                  <Text style={styles.directionLabel}>Shot Direction</Text>
                  <Text style={styles.directionValue}>{shot.shot_direction_deg}°</Text>
                </View>
              )}

              {/* Reason/Feedback */}
              {shot.reason && (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackLabel}>Analysis</Text>
                  <Text style={styles.feedbackText}>{shot.reason}</Text>
                </View>
              )}

              {/* View Details Button */}
              <TouchableOpacity
                style={[styles.detailsButton, { backgroundColor: verdictColor }]}
                onPress={() => onSelectShot(index)}
              >
                <Text style={styles.detailsButtonText}>View Full Analysis</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Swipe Indicator */}
      <View style={styles.swipeIndicator}>
        <Text style={styles.swipeText}>← Swipe to compare shots →</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  shotCard: {
    width: 320,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  shotBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  shotBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    gap: 8,
  },
  verdictIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  verdictLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  shotType: {
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 20,
  },
  scoresGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  directionBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  directionLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  directionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  feedbackBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  feedbackLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 13,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  detailsButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  swipeIndicator: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  swipeText: {
    fontSize: 12,
    color: '#64748b',
  },
});
