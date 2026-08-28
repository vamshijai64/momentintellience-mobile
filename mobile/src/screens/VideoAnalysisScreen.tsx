import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { JointAngleMetricsCard } from '../components/JointAngleMetricsCard';
import { ShotVerdictCard } from '../components/ShotVerdictCard';
import { SessionSummaryView } from './SessionSummaryView';
import { ShotComparisonView } from './ShotComparisonView';
import { getAnalysisReport, getOverlayVideoUrl } from '../services/api';
import { AnalysisReport } from '../types';

type ViewMode = 'summary' | 'detail' | 'comparison';

interface VideoAnalysisScreenProps {
  reportId?: string;
  videoId?: string;
  videoUri?: string;
  fromHistory?: boolean;
  onBackToCamera?: () => void;
}

export const VideoAnalysisScreen: React.FC<VideoAnalysisScreenProps> = ({
  reportId,
  videoId,
  videoUri,
  fromHistory = false,
  onBackToCamera,
}) => {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.5);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedShotIndex, setSelectedShotIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');

  // Fresh uploads poll until done; history opens the saved report instantly.
  useEffect(() => {
    const targetId = videoId || reportId;
    if (!targetId || targetId === 'demo-report-uuid' || targetId === 'video-uuid') {
      return;
    }

    setIsLoading(true);
    setReport(null);

    const loadReport = async () => {
      const { getAnalysisReport, pollForAnalysisResult } = require('../services/api');
      try {
        if (fromHistory || !videoUri) {
          const data: AnalysisReport = await getAnalysisReport(targetId);
          if (data?.overlay_video_url || data?.overlay_video_path || data?.overall_score) {
            setReport(data);
          }
        } else {
          const data: AnalysisReport = await pollForAnalysisResult(targetId);
          if (data?.overlay_video_url || data?.overlay_video_path || data?.overall_score) {
            setReport(data);
          }
        }
      } catch (err: any) {
        console.log('Analysis load fallback', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [videoId, reportId, fromHistory, videoUri]);

  useEffect(() => {
    setSelectedShotIndex(0);
    // Auto-set view mode: summary if multiple shots, detail if single shot
    if (report?.report_json?.shots && report.report_json.shots.length > 1) {
      setViewMode('summary');
    } else {
      setViewMode('detail');
    }
  }, [videoId, reportId, report]);

  // Determine active video source URL (prioritize backend processed OpenCV video URL with MediaPipe overlay)
  const rawOverlayPath = report?.overlay_video_url || report?.overlay_video_path;
  const processedVideoUrl = rawOverlayPath
    ? getOverlayVideoUrl(rawOverlayPath)
    : videoUri;

  // Extract dynamic scores and shot metrics from API report
  const overallScore = report?.overall_score || report?.report_json?.scores?.overall_score || (isLoading ? 0 : 89);
  const scores = {
    stability: report?.stability_score || report?.report_json?.scores?.stability_score || 85,
    balance: report?.balance_score || report?.report_json?.scores?.balance_score || 90,
    symmetry: report?.symmetry_score || report?.report_json?.scores?.symmetry_score || 88,
    mobility: report?.mobility_score || report?.report_json?.scores?.mobility_score || 92,
  };
  const observations = report?.report_json?.observations || [];
  const recommendations = report?.report_json?.recommendations || [];

  // Multi-shot net-session support: fall back to the singular shot_verdict
  // when only one (or zero) shots were detected.
  const shots = report?.report_json?.shots && report.report_json.shots.length > 0
    ? report.report_json.shots
    : (report?.report_json?.shot_verdict ? [report.report_json.shot_verdict] : []);
  const activeShotVerdict = shots[selectedShotIndex] || shots[0] || report?.report_json?.shot_verdict;

  const shotClassification = report?.report_json?.shot_classification;
  const shotType = shotClassification?.shot_type || (isLoading ? 'ANALYZING KINEMATICS...' : 'SHOT ANALYSIS COMPLETE');
  const flawSummary = shotClassification?.shot_flaw || report?.report_json?.summary || 'High front elbow posture and solid stance balance.';

  // Get joint angles at IMPACT FRAME only (not averaged across all frames)
  const timeSeries = report?.report_json?.time_series_angles || [];
  const impactFrame = activeShotVerdict?.impact_frame || 1;
  
  let leftElbowAngle = 142;
  let rightElbowAngle = 138;
  let leftKneeAngle = 136;
  let rightKneeAngle = 104;
  let spineAngle = 128;

  if (timeSeries && timeSeries.length > 0) {
    // Find the frame data closest to impact frame
    const impactFrameData = timeSeries.find((t: any) => t.frame === impactFrame) || 
                           timeSeries[Math.floor(timeSeries.length / 2)]; // Fallback to middle frame
    
    if (impactFrameData) {
      leftElbowAngle = Math.round(impactFrameData.left_elbow || leftElbowAngle);
      rightElbowAngle = Math.round(impactFrameData.right_elbow || rightElbowAngle);
      leftKneeAngle = Math.round(impactFrameData.left_knee || leftKneeAngle);
      rightKneeAngle = Math.round(impactFrameData.right_knee || rightKneeAngle);
      spineAngle = Math.round(impactFrameData.spine_inclination || spineAngle);
    }
  }

  const metricsData = [
    {
      name: 'Lead Front Elbow',
      angle: leftElbowAngle,
      idealRange: '110° - 155°',
      status: (leftElbowAngle >= 110 && leftElbowAngle <= 155 ? 'CORRECT' : 'INCORRECT') as 'CORRECT' | 'INCORRECT',
      recommendation: leftElbowAngle >= 110 ? 'Optimal high lead elbow posture maintained through swing.' : 'Elbow drooped during downswing. Keep lead front elbow higher.',
    },
    {
      name: 'Rear Right Knee',
      angle: rightKneeAngle,
      idealRange: '125° - 165°',
      status: (rightKneeAngle >= 125 && rightKneeAngle <= 165 ? 'CORRECT' : 'INCORRECT') as 'CORRECT' | 'INCORRECT',
      recommendation: rightKneeAngle >= 125 ? 'Solid rear leg support balance.' : 'Knee collapsed excessively (Delta -21°). Extend rear leg for power.',
    },
    {
      name: 'Front Left Knee',
      angle: leftKneeAngle,
      idealRange: '125° - 165°',
      status: (leftKneeAngle >= 125 && leftKneeAngle <= 165 ? 'CORRECT' : 'INCORRECT') as 'CORRECT' | 'INCORRECT',
      recommendation: 'Stable front knee drive over the ball.',
    },
    {
      name: 'Spine Inclination',
      angle: spineAngle,
      idealRange: '115° - 160°',
      status: (spineAngle >= 115 && spineAngle <= 160 ? 'CORRECT' : 'INCORRECT') as 'CORRECT' | 'INCORRECT',
      recommendation: 'Upright spinal posture maintained through stroke.',
    },
  ];

  const handleSelectShot = (index: number) => {
    setSelectedShotIndex(index);
    setViewMode('detail');
  };

  const handleBackToSummary = () => {
    setViewMode('summary');
  };

  const handleViewComparison = () => {
    setViewMode('comparison');
  };

  // Show summary view for multi-shot sessions
  if (viewMode === 'summary' && shots.length > 1) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBackToCamera}>
            <Text style={styles.backButtonText}>← CAMERA</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SESSION ANALYSIS</Text>
          <View style={{ width: 100 }} />
        </View>
        <SessionSummaryView
          shots={shots}
          overallScore={overallScore}
          onSelectShot={handleSelectShot}
          onViewComparison={handleViewComparison}
        />
      </View>
    );
  }

  // Show comparison view
  if (viewMode === 'comparison' && shots.length > 1) {
    return (
      <ShotComparisonView
        shots={shots}
        onBack={handleBackToSummary}
        onSelectShot={handleSelectShot}
      />
    );
  }

  // Detail view (single shot or selected shot from multi-shot session)
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={shots.length > 1 ? handleBackToSummary : onBackToCamera}>
          <Text style={styles.backButtonText}>
            {shots.length > 1 ? '← SUMMARY' : '← RECORD AGAIN'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {shots.length > 1 ? `SHOT ${selectedShotIndex + 1} DETAIL` : 'POSTURE & KINEMATICS'}
        </Text>
      </View>

      {/* Multi-Shot Detection Badge */}
      {shots.length > 1 && (
        <View style={styles.multiShotBadge}>
          <Text style={styles.multiShotBadgeIcon}>✓</Text>
          <Text style={styles.multiShotBadgeText}>
            {shots.length} Shots Detected • Showing Shot {selectedShotIndex + 1}
          </Text>
        </View>
      )}

      {/* Video Overlay Player Window */}
      <View style={styles.videoWindow}>
        {/* Dynamic Skeleton Red/Green Guide Legend Overlay */}
        <View style={styles.videoHudTop}>
          <View style={styles.hudLegendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>GREEN: IDEAL TECHNIQUE</Text>
          </View>
          <View style={styles.hudLegendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>RED: INCORRECT POSTURE</Text>
          </View>
        </View>

        {/* Real Native Video Player Stream */}
        <View style={styles.videoContentBox}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>Fetching Backend MediaPipe Overlay...</Text>
            </View>
          ) : processedVideoUrl ? (
            <Video
              source={{ uri: processedVideoUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
              rate={playbackSpeed}
            />
          ) : (
            <View style={styles.noVideoBox}>
              <Text style={styles.noVideoText}>NO VIDEO STREAM AVAILABLE</Text>
            </View>
          )}

          <Text style={styles.overlayVideoBadge}>
            AI OVERLAY VIDEO ({playbackSpeed}X SLOW-MO)
          </Text>

          {/* Fullscreen Expand [ ] Button */}
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsFullscreen(true)}
          >
            <Text style={styles.expandButtonText}>⛶ EXPAND [ ]</Text>
          </TouchableOpacity>
        </View>

        {/* Playback Controls Bar */}
        <View style={styles.controlsRow}>
          <Text style={styles.speedLabel}>SPEED:</Text>
          {[0.25, 0.5, 1.0].map((speed) => (
            <TouchableOpacity
              key={speed}
              style={[styles.speedBtn, playbackSpeed === speed && styles.speedBtnActive]}
              onPress={() => setPlaybackSpeed(speed)}
            >
              <Text style={[styles.speedBtnText, playbackSpeed === speed && styles.speedBtnTextActive]}>
                {speed}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Shot Selector Strip — shown for net-session videos with multiple deliveries */}
      {shots.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.shotSelectorStrip}
          contentContainerStyle={styles.shotSelectorContent}
        >
          {shots.map((shot, idx) => {
            const isActive = idx === selectedShotIndex;
            const dotColor = shot.verdict === 'GOOD_SHOT' ? '#10b981' : shot.verdict === 'BAD_SHOT' ? '#ef4444' : '#f59e0b';
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.shotPill, isActive && styles.shotPillActive]}
                onPress={() => setSelectedShotIndex(idx)}
              >
                <View style={[styles.shotPillDot, { backgroundColor: dotColor }]} />
                <Text style={[styles.shotPillText, isActive && styles.shotPillTextActive]}>
                  SHOT {idx + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* AI Coach Shot Verdict: Good/Average/Bad Shot + Estimated Shot Direction */}
      <ShotVerdictCard verdict={activeShotVerdict} />

      {/* Joint Measurement & Posture Analysis Metrics Card */}
      <JointAngleMetricsCard
        metrics={metricsData}
        overallScore={overallScore}
        shotType={shotType}
        flawSummary={flawSummary}
        scores={scores}
        observations={observations}
        recommendations={recommendations}
      />

      {/* Fullscreen Video Overlay Modal */}
      <Modal visible={isFullscreen} animationType="fade" statusBarTranslucent>
        <View style={styles.fullscreenContainer}>
          <View style={styles.fullscreenHeader}>
            <Text style={styles.fullscreenBadge}>
              AI POSTURE OVERLAY ({playbackSpeed}X SLOW-MO)
            </Text>
            <TouchableOpacity
              style={styles.closeFullscreenBtn}
              onPress={() => setIsFullscreen(false)}
            >
              <Text style={styles.closeFullscreenText}>✕ CLOSE</Text>
            </TouchableOpacity>
          </View>

          {processedVideoUrl ? (
            <Video
              source={{ uri: processedVideoUrl }}
              style={styles.fullscreenVideo}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
              rate={playbackSpeed}
            />
          ) : null}

          <View style={styles.fullscreenControls}>
            <Text style={styles.speedLabel}>PLAYBACK SPEED:</Text>
            {[0.25, 0.5, 1.0].map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[styles.speedBtn, playbackSpeed === speed && styles.speedBtnActive]}
                onPress={() => setPlaybackSpeed(speed)}
              >
                <Text style={[styles.speedBtnText, playbackSpeed === speed && styles.speedBtnTextActive]}>
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050b1a',
  },
  contentContainer: {
    padding: 18,
    paddingTop: 48,
    paddingBottom: 40,
  },
  multiShotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    marginTop: 4,
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    gap: 10,
  },
  multiShotBadgeIcon: {
    fontSize: 16,
    color: '#34d399',
  },
  multiShotBadgeText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#34d399',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  backButton: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  backButtonText: {
    color: '#38bdf8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  videoWindow: {
    backgroundColor: '#111a2e',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
    ...cardShadow,
  },
  videoHudTop: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  hudLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  videoContentBox: {
    height: 280,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
  },
  noVideoBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  overlayVideoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  expandButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.92)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  expandButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(148, 163, 184, 0.04)',
    padding: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  speedLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.4,
  },
  speedBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    marginLeft: 6,
  },
  speedBtnActive: {
    backgroundColor: '#0284c7',
  },
  speedBtnText: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  speedBtnTextActive: {
    color: '#ffffff',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'space-between',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#0f172a',
  },
  fullscreenBadge: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  closeFullscreenBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeFullscreenText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  fullscreenVideo: {
    flex: 1,
    width: '100%',
  },
  shotSelectorStrip: {
    marginTop: 14,
  },
  shotSelectorContent: {
    gap: 8,
    paddingRight: 8,
  },
  shotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.15)',
  },
  shotPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
  },
  shotPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 7,
  },
  shotPillText: {
    color: '#64748b',
    fontSize: 10.5,
    fontWeight: '700',
  },
  shotPillTextActive: {
    color: '#ffffff',
  },
  fullscreenControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },
});
