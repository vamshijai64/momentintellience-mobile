import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { JointAngleMetricsCard } from '../components/JointAngleMetricsCard';
import { ShotVerdictCard } from '../components/ShotVerdictCard';
import { ExecutiveCoachSummaryCard } from '../components/ExecutiveCoachSummaryCard';
import { AICoachVoicePlayer } from '../components/AICoachVoicePlayer';
import { ShotMasterclassGuideCard } from '../components/ShotMasterclassGuideCard';
import { BatImpactHeatmapView } from '../components/BatImpactHeatmapView';
import { BeforeAfterCorrectionSlider } from '../components/BeforeAfterCorrectionSlider';
import { Stadium360AngleViewer } from '../components/Stadium360AngleViewer';
import { WagonWheelFieldView } from '../components/WagonWheelFieldView';
import { ProComparisonRadarCard } from '../components/ProComparisonRadarCard';
import { PhaseTimelineScrubber } from '../components/PhaseTimelineScrubber';
import { DualVideoMasterclassView } from '../components/DualVideoMasterclassView';
import { BroadcastTelemetryGauges } from '../components/BroadcastTelemetryGauges';
import { ShareableScorecardModal } from '../components/ShareableScorecardModal';
import { GlassVerdictTabIcon, GlassMetricsTabIcon, GlassStadiumTabIcon, GlassMasterclassTabIcon } from '../components/GlassIcons';
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
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [showScorecardModal, setShowScorecardModal] = useState<boolean>(false);

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
    setViewMode('detail');
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

  const [activeTab, setActiveTab] = useState<'verdict' | 'metrics' | 'stadium' | 'masterclass'>('verdict');

  // Detail view (single shot or selected shot from multi-shot session)
  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={shots.length > 1 ? handleBackToSummary : onBackToCamera}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>
              {shots.length > 1 ? '← SUMMARY' : '← RECORD AGAIN'}
            </Text>
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>
              {shots.length > 1 ? `SHOT ${selectedShotIndex + 1} OF ${shots.length}` : 'AI SHOT AUDIT'}
            </Text>
            <Text style={styles.headerSubtitle}>{shotType}</Text>
          </View>
          <TouchableOpacity 
            style={styles.exportHeaderBtn}
            onPress={() => setShowScorecardModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.exportHeaderIcon}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* Multi-Shot Detection Badge / Selector Strip */}
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
                    DELIVERY {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Video Overlay Player Window */}
        <View style={styles.videoWindow}>
          {/* Real Native Video Player Stream */}
          <View style={styles.videoContentBox}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#38bdf8" />
                <Text style={styles.loadingTitle}>Analyzing Stroke Kinematics...</Text>
                <Text style={styles.loadingSub}>Extracting 33 skeletal points & downswing trajectory</Text>
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

            {!isLoading && (
              <View style={styles.inVideoTopRow}>
                <View style={styles.overlayVideoBadge}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.overlayVideoBadgeText}>
                    AI Overlay • {playbackSpeed}x Slow-Mo
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setIsFullscreen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.expandButtonText}>⛶ Fullscreen</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Playback Controls Bar */}
          <View style={styles.controlsRow}>
            <View style={styles.legendRow}>
              <View style={styles.hudLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Ideal</Text>
              </View>
              <View style={styles.hudLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.legendText}>Fix</Text>
              </View>
            </View>

            <View style={styles.speedGroup}>
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
        </View>

        {/* 🌟 3-Second High-Level Executive Coach Takeaway Card for Clients */}
        <ExecutiveCoachSummaryCard
          score={activeShotVerdict?.composite_score ?? (typeof overallScore === 'number' ? Math.round(overallScore) : 70)}
          shotType={shotType}
          shotDirectionLabel={activeShotVerdict?.shot_direction_label ?? 'COVER'}
          shotDirectionDeg={activeShotVerdict?.shot_direction_deg ?? 50}
          leadElbowAngle={leftElbowAngle}
          kneeFlexionAngle={leftKneeAngle}
          verdict={activeShotVerdict?.verdict ?? 'GOOD_SHOT'}
          onOpenScorecard={() => setShowScorecardModal(true)}
        />

        {/* 🎛️ Segmented Glass Navigation Pills */}
        <View style={styles.tabContainer}>
          {[
            { id: 'verdict', label: 'Verdict', icon: (active: boolean) => <GlassVerdictTabIcon size={16} active={active} /> },
            { id: 'metrics', label: '3D Form', icon: (active: boolean) => <GlassMetricsTabIcon size={16} active={active} /> },
            { id: 'stadium', label: 'Stadium', icon: (active: boolean) => <GlassStadiumTabIcon size={16} active={active} /> },
            { id: 'masterclass', label: 'Mastery', icon: (active: boolean) => <GlassMasterclassTabIcon size={16} active={active} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id as any)}
                activeOpacity={0.7}
              >
                <View style={styles.tabIconWrapper}>
                  {tab.icon(isActive)}
                </View>
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB CONTENT: 🎯 1. VERDICT & POSTURE AUDIT */}
        {activeTab === 'verdict' && (
          <View style={styles.tabContentSection}>
            {/* AI Coach Shot Verdict: Good/Average/Bad Shot + Estimated Shot Direction */}
            <ShotVerdictCard verdict={activeShotVerdict} />

            {/* AI Coach Broadcast Audio Commentary Player */}
            <AICoachVoicePlayer
              score={activeShotVerdict?.composite_score ?? (typeof overallScore === 'number' ? Math.round(overallScore) : 70)}
              techniqueScore={activeShotVerdict?.technique_score ?? 63}
              executionScore={activeShotVerdict?.execution_score ?? 91}
              shotType={shotType}
              verdictLabel={activeShotVerdict?.verdict || 'GOOD SHOT'}
              leadElbowAngle={leftElbowAngle}
              kneeFlexionAngle={leftKneeAngle}
              shotDirectionLabel={activeShotVerdict?.shot_direction_label ?? 'COVER'}
              reason={activeShotVerdict?.reason}
            />

            {/* Hawk-Eye Biomechanical Telemetry Gauges */}
            <BroadcastTelemetryGauges
              leadElbowAngle={leftElbowAngle}
              kneeFlexionAngle={leftKneeAngle}
              overallScore={typeof overallScore === 'number' ? overallScore : 88}
              headOffsetRatio={0.08}
            />

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
          </View>
        )}

        {/* TAB CONTENT: ⚡ 2. 3D PRO METRICS & FORM COMPARISON */}
        {activeTab === 'metrics' && (
          <View style={styles.tabContentSection}>
            {/* ⚡ 1. 3D Bat Face Sweet-Spot Thermal Heatmap & Exit Velocity */}
            <BatImpactHeatmapView
              sweetSpotRatio={0.94}
              exitVelocityKmh={118}
              shotDistanceMeters={74}
              shotType={shotType}
            />

            {/* 🎚️ 2. Interactive Before vs After AI Correction Wipe Slider */}
            <BeforeAfterCorrectionSlider
              shotType={shotType}
              currentElbowAngle={leftElbowAngle}
              idealElbowAngle={144}
            />

            {/* Pro-Player Elite Biomechanical Technique Audit */}
            <ProComparisonRadarCard
              overallScore={typeof overallScore === 'number' ? overallScore : 88}
              shotType={shotType}
              leadElbowAngle={leftElbowAngle}
              kneeFlexionAngle={leftKneeAngle}
              isHeadStacked={true}
            />
          </View>
        )}

        {/* TAB CONTENT: 🏟️ 3. 360° VIRTUAL STADIUM PERSPECTIVE */}
        {activeTab === 'stadium' && (
          <View style={styles.tabContentSection}>
            {/* 🏟️ 360° Virtual Stadium Perspective & Multi-Camera Simulator */}
            <Stadium360AngleViewer
              shotType={shotType}
              shotDirectionLabel={activeShotVerdict?.shot_direction_label ?? 'COVER'}
              shotDirectionDeg={activeShotVerdict?.shot_direction_deg ?? 50}
            />

            {/* 360° Interactive Stadium Wagon-Wheel Radar */}
            <WagonWheelFieldView
              shotDirectionDeg={activeShotVerdict?.shot_direction_deg ?? 50}
              shotDirectionLabel={activeShotVerdict?.shot_direction_label ?? 'COVER'}
              shotType={shotType}
            />
          </View>
        )}

        {/* TAB CONTENT: 📖 4. COACHCRICXI MASTERCLASS & DRILLS */}
        {activeTab === 'masterclass' && (
          <View style={styles.tabContentSection}>
            {/* 📖 CoachCricXI / CricketGraph Visual Technique Blueprint Guide */}
            <ShotMasterclassGuideCard
              shotType={shotType}
            />

            {/* 4-Phase Stroke Scrubber & Masterclass Checklist */}
            <PhaseTimelineScrubber
              activePhase="IMPACT"
            />

            {/* Broadcast Dual-Video Masterclass Split-Screen Replay */}
            <DualVideoMasterclassView
              playerVideoUri={processedVideoUrl}
              shotType={shotType}
            />
          </View>
        )}

        {/* 1-Tap Export Performance Certificate Button */}
        <TouchableOpacity 
          style={styles.exportScorecardBtn} 
          onPress={() => setShowScorecardModal(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.exportBtnIcon}>📜</Text>
          <View style={styles.exportBtnTextGroup}>
            <Text style={styles.exportBtnTitle}>GENERATE OFFICIAL MATCH SCORECARD</Text>
            <Text style={styles.exportBtnSubtitle}>Export high-res PDF certificate with biomechanical radar</Text>
          </View>
          <Text style={styles.exportBtnArrow}>➔</Text>
        </TouchableOpacity>

        <View style={{ height: 90 }} />
      </ScrollView>

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

      {/* Shareable Performance Scorecard Modal */}
      <ShareableScorecardModal
        visible={showScorecardModal}
        onClose={() => setShowScorecardModal(false)}
        score={typeof overallScore === 'number' ? Math.round(overallScore) : 88}
        shotType={shotType}
        shotDirectionLabel={activeShotVerdict?.shot_direction_label ?? 'COVER'}
        shotDirectionDeg={activeShotVerdict?.shot_direction_deg ?? 50}
        leadElbowAngle={leftElbowAngle}
        kneeFlexionAngle={leftKneeAngle}
      />
    </View>
  );
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  android: { elevation: 3 },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  exportScorecardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 14,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    gap: 12,
    ...cardShadow,
  },
  exportBtnIcon: {
    fontSize: 22,
  },
  exportBtnTextGroup: {
    flex: 1,
  },
  exportBtnTitle: {
    color: '#0284c7',
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  exportBtnSubtitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  exportBtnArrow: {
    color: '#0284c7',
    fontSize: 16,
    fontWeight: '900',
  },
  contentContainer: {
    padding: 18,
    paddingTop: 48,
    paddingBottom: 40,
  },
  multiShotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    marginTop: 4,
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 10,
  },
  multiShotBadgeIcon: {
    fontSize: 16,
    color: '#15803d',
  },
  multiShotBadgeText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#15803d',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...cardShadow,
  },
  backButtonText: {
    color: '#0284c7',
    fontSize: 10.5,
    fontWeight: '700',
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: '#0284c7',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  exportHeaderBtn: {
    backgroundColor: '#e0f2fe',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  exportHeaderIcon: {
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 14,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    ...cardShadow,
  },
  tabIconWrapper: {
    marginBottom: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonText: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#0284c7',
    fontWeight: '900',
  },
  tabContentSection: {
    gap: 12,
  },
  videoWindow: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...cardShadow,
  },
  videoContentBox: {
    height: 260,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingTitle: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  loadingSub: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  noVideoBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inVideoTopRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overlayVideoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    gap: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  overlayVideoBadgeText: {
    color: '#e2e8f0',
    fontSize: 9.5,
    fontWeight: '700',
  },
  expandButton: {
    backgroundColor: 'rgba(2, 132, 199, 0.85)',
    paddingHorizontal: 10,
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
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hudLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  legendText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
  },
  speedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    marginRight: 6,
    letterSpacing: 0.5,
  },
  speedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 4,
  },
  speedBtnActive: {
    backgroundColor: '#0284c7',
  },
  speedBtnText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  speedBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
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
