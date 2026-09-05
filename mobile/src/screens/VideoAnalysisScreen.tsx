import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { JointAngleMetricsCard } from '../components/JointAngleMetricsCard';
import { ShotVerdictCard } from '../components/ShotVerdictCard';
import { ExecutiveCoachSummaryCard } from '../components/ExecutiveCoachSummaryCard';
import { StanceBalanceCard } from '../components/StanceBalanceCard';
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
import { BroadcastInVideoPlayer } from '../components/BroadcastInVideoPlayer';
import { ShotTechniqueChecklistCard } from '../components/ShotTechniqueChecklistCard';
import { ProGhostSideBySideCard } from '../components/ProGhostSideBySideCard';
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
  const [coachCuesEnabled, setCoachCuesEnabled] = useState<boolean>(false);
  const [playbackSnapshot, setPlaybackSnapshot] = useState<{
    positionMillis: number;
    isPlaying: boolean;
    playbackSpeed: number;
  }>({ positionMillis: 0, isPlaying: true, playbackSpeed: 0.5 });
  const [selectedShotIndex, setSelectedShotIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [showScorecardModal, setShowScorecardModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'verdict' | 'metrics' | 'stadium' | 'masterclass'>('verdict');

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
        let data: AnalysisReport = await getAnalysisReport(targetId);
        const status = String((data as any)?.status || '').toUpperCase();
        if (!fromHistory && (status === 'PENDING' || status === 'PROCESSING')) {
          data = await pollForAnalysisResult(targetId);
        }
        if (data?.overlay_video_url || data?.overlay_video_path || data?.overall_score || data?.report_json) {
          setReport(data);
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
  const overallScore = report?.overall_score ?? report?.report_json?.scores?.overall_score;
  const scores = {
    stability: report?.stability_score ?? report?.report_json?.scores?.stability_score,
    balance: report?.balance_score ?? report?.report_json?.scores?.balance_score,
    symmetry: report?.symmetry_score ?? report?.report_json?.scores?.symmetry_score,
    mobility: report?.mobility_score ?? report?.report_json?.scores?.mobility_score,
  };
  const observations = report?.report_json?.observations || [];
  const recommendations = report?.report_json?.recommendations || [];

  // Multi-shot net-session support: fall back to the singular shot_verdict
  // when only one (or zero) shots were detected.
  const shots = report?.report_json?.shots && report.report_json.shots.length > 0
    ? report.report_json.shots
    : (report?.report_json?.shot_verdict ? [report.report_json.shot_verdict] : []);
  const activeShotVerdict = shots[selectedShotIndex] || shots[0] || report?.report_json?.shot_verdict;
  const coachingCue = report?.report_json?.coaching_cue;

  const shotClassification = report?.report_json?.shot_classification;
  const shotType = activeShotVerdict?.shot_type || shotClassification?.shot_type || (isLoading ? 'Analyzing…' : 'Your shot');
  const flawSummary = coachingCue?.bottom || activeShotVerdict?.reason || shotClassification?.shot_flaw || '';

  // Get joint angles at IMPACT FRAME only (not averaged across all frames)
  const timeSeries = report?.report_json?.time_series_angles || [];
  const impactFrame = activeShotVerdict?.impact_frame || 1;
  
  let leftElbowAngle: number | undefined;
  let rightElbowAngle: number | undefined;
  let leftKneeAngle: number | undefined;
  let rightKneeAngle: number | undefined;
  let spineAngle: number | undefined;

  if (timeSeries && timeSeries.length > 0) {
    const impactFrameData = timeSeries.find((t: any) => t.frame === impactFrame) ||
                           timeSeries[Math.floor(timeSeries.length / 2)];

    if (impactFrameData) {
      if (impactFrameData.left_elbow != null) leftElbowAngle = Math.round(impactFrameData.left_elbow);
      if (impactFrameData.right_elbow != null) rightElbowAngle = Math.round(impactFrameData.right_elbow);
      if (impactFrameData.left_knee != null) leftKneeAngle = Math.round(impactFrameData.left_knee);
      if (impactFrameData.right_knee != null) rightKneeAngle = Math.round(impactFrameData.right_knee);
      if (impactFrameData.spine_inclination != null) spineAngle = Math.round(impactFrameData.spine_inclination);
    }
  }

  const totalFrames = timeSeries.length || 100;
  const calculatedImpactRatio = totalFrames > 0 
    ? Math.min(0.95, Math.max(0.05, impactFrame / totalFrames)) 
    : 0.62;

  const metricsData = [
    {
      name: 'Lead Front Elbow',
      angle: leftElbowAngle ?? 0,
      idealRange: '110° - 155°',
      status: (leftElbowAngle != null && leftElbowAngle >= 110 && leftElbowAngle <= 155 ? 'CORRECT' : 'INCORRECT') as 'CORRECT' | 'INCORRECT',
      recommendation: leftElbowAngle != null && leftElbowAngle >= 110 ? 'Lead elbow is in a good range.' : 'Keep the front elbow higher through the shot.',
    },
    {
      name: 'Rear Right Knee',
      angle: rightKneeAngle ?? 0,
      idealRange: '125° - 165°',
      status: (rightKneeAngle != null && rightKneeAngle >= 125 && rightKneeAngle <= 165 ? 'CORRECT' : 'INCORRECT') as 'CORRECT' | 'INCORRECT',
      recommendation: rightKneeAngle != null && rightKneeAngle >= 125 ? 'Back leg is braced.' : 'Do not let the back knee collapse.',
    },
    {
      name: 'Front Left Knee',
      angle: leftKneeAngle ?? 0,
      idealRange: '125° - 165°',
      status: (leftKneeAngle != null && leftKneeAngle >= 125 && leftKneeAngle <= 165 ? 'CORRECT' : 'INCORRECT') as 'CORRECT' | 'INCORRECT',
      recommendation: 'Front knee should stay bent and stable over the stride.',
    },
    {
      name: 'Spine lean',
      angle: spineAngle ?? 0,
      idealRange: '0° - 18° from upright',
      status: (spineAngle != null && spineAngle <= 18 ? 'CORRECT' : 'INCORRECT') as 'CORRECT' | 'INCORRECT',
      recommendation: 'Shoulders should stay stacked over the hips.',
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

  if (isLoading && !report) {
    return (
      <View style={styles.analyzingOnly}>
        <TouchableOpacity
          style={[styles.backButton, styles.analyzingBack]}
          onPress={onBackToCamera}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Record again</Text>
        </TouchableOpacity>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingTitle}>Analyzing your shot</Text>
        <Text style={styles.loadingSub}>Wait here, or go back and record another shot.</Text>
      </View>
    );
  }

  // Show summary view for multi-shot sessions
  if (viewMode === 'summary' && shots.length > 1) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBackToCamera}>
            <Text style={styles.backButtonText}>← Record again</Text>
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
              {shots.length > 1 ? '← Summary' : '← Record again'}
            </Text>
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>
              {shots.length > 1 ? `Shot ${selectedShotIndex + 1} of ${shots.length}` : 'Shot audit'}
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
                    Delivery {idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* 🚀 Broadcast-Grade In-Video Player with HUD, Angle Tags & Phase Scrubber */}
        {!isFullscreen ? (
          <BroadcastInVideoPlayer
            videoUri={processedVideoUrl}
            isLoading={isLoading}
            leadElbowAngle={leftElbowAngle}
            kneeFlexionAngle={leftKneeAngle}
            rearKneeAngle={rightKneeAngle}
            spineAngle={spineAngle}
            shotType={shotType}
            impactFrameRatio={calculatedImpactRatio}
            timeSeriesAngles={timeSeries}
            landmarkPositions={report?.report_json?.landmark_positions}
            coachingTip={coachingCue?.cue || coachingCue?.bottom || coachingCue?.bubble}
            onToggleFullscreen={() => setIsFullscreen(true)}
            isFullscreen={false}
            resumePlayback={playbackSnapshot}
            onPlaybackSnapshot={setPlaybackSnapshot}
            coachCuesEnabled={coachCuesEnabled}
            onCoachCuesChange={setCoachCuesEnabled}
          />
        ) : (
          <View style={styles.fullscreenPlaceholder}>
            <Text style={styles.fullscreenPlaceholderText}>Playing in expand mode…</Text>
          </View>
        )}

        <StanceBalanceCard
          shotType={shotType}
          leadElbowAngle={leftElbowAngle}
          kneeFlexionAngle={leftKneeAngle}
          rearKneeAngle={rightKneeAngle}
          spineAngle={spineAngle}
          coachingCue={coachingCue}
        />

        {/* 🌟 3-Second High-Level Executive Coach Takeaway Card for Clients */}
        <ExecutiveCoachSummaryCard
          score={activeShotVerdict?.composite_score ?? (typeof overallScore === 'number' ? Math.round(overallScore) : undefined)}
          shotType={shotType}
          shotDirectionLabel={activeShotVerdict?.shot_direction_label}
          shotDirectionDeg={activeShotVerdict?.shot_direction_deg}
          leadElbowAngle={leftElbowAngle}
          kneeFlexionAngle={leftKneeAngle}
          verdict={activeShotVerdict?.verdict}
          takeaway={coachingCue?.bottom || flawSummary}
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

            {/* 📋 4-Pillar Biomechanical Technique Checklist & Flaw Auditor */}
            <ShotTechniqueChecklistCard
              shotType={shotType}
              leadElbowAngle={leftElbowAngle}
              kneeFlexionAngle={leftKneeAngle}
              rearKneeAngle={rightKneeAngle}
              spineAngle={spineAngle}
              headOffsetRatio={coachingCue?.head_over_foot_ok === false ? 0.2 : 0.06}
              overallScore={typeof overallScore === 'number' ? Math.round(overallScore) : undefined}
            />

            {/* AI Coach Broadcast Audio Commentary Player */}
            <AICoachVoicePlayer
              score={activeShotVerdict?.composite_score ?? (typeof overallScore === 'number' ? Math.round(overallScore) : 70)}
              techniqueScore={activeShotVerdict?.technique_score ?? 63}
              executionScore={activeShotVerdict?.execution_score}
              shotType={shotType}
              verdictLabel={activeShotVerdict?.verdict || 'GOOD SHOT'}
              leadElbowAngle={leftElbowAngle}
              kneeFlexionAngle={leftKneeAngle}
              reason={coachingCue?.bottom || activeShotVerdict?.reason}
            />

            {/* Hawk-Eye Biomechanical Telemetry Gauges */}
            <BroadcastTelemetryGauges
              leadElbowAngle={leftElbowAngle}
              kneeFlexionAngle={leftKneeAngle}
              overallScore={typeof overallScore === 'number' ? overallScore : undefined}
              headOffsetRatio={coachingCue?.head_over_foot_ok === false ? 0.2 : 0.06}
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
              isHeadStacked={coachingCue?.head_over_foot_ok !== false}
            />
          </View>
        )}

        {/* TAB CONTENT: 🏟️ 3. 360° VIRTUAL STADIUM PERSPECTIVE */}
        {activeTab === 'stadium' && (
          <View style={styles.tabContentSection}>
            {/* 🏟️ 360° Virtual Stadium Perspective & Multi-Camera Simulator */}
            <Stadium360AngleViewer
              shotType={shotType}
              shotDirectionLabel={activeShotVerdict?.shot_direction_label}
              shotDirectionDeg={activeShotVerdict?.shot_direction_deg}
            />

            {/* 360° Interactive Stadium Wagon-Wheel Radar */}
            <WagonWheelFieldView
              shotDirectionDeg={activeShotVerdict?.shot_direction_deg}
              shotDirectionLabel={activeShotVerdict?.shot_direction_label}
              shotType={shotType}
            />
          </View>
        )}

        {/* TAB CONTENT: 📖 4. COACHCRICXI MASTERCLASS & DRILLS */}
        {activeTab === 'masterclass' && (
          <View style={styles.tabContentSection}>
            <DualVideoMasterclassView
              playerVideoUri={processedVideoUrl}
              shotType={shotType}
              leadElbowAngle={leftElbowAngle}
              kneeFlexionAngle={leftKneeAngle}
              spineAngle={spineAngle}
              overallScore={typeof overallScore === 'number' ? Math.round(overallScore) : undefined}
            />

            <ProGhostSideBySideCard
              shotType={shotType}
              leadElbowAngle={leftElbowAngle}
              kneeFlexionAngle={leftKneeAngle}
              spineAngle={spineAngle}
              overallScore={typeof overallScore === 'number' ? Math.round(overallScore) : 88}
            />

            {/* 📖 CoachCricXI / CricketGraph Visual Technique Blueprint Guide */}
            <ShotMasterclassGuideCard
              shotType={shotType}
            />

            {/* 4-Phase Stroke Scrubber & Masterclass Checklist */}
            <PhaseTimelineScrubber
              activePhase="IMPACT"
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
            <Text style={styles.exportBtnTitle}>Export scorecard</Text>
            <Text style={styles.exportBtnSubtitle}>Shareable match certificate with key metrics</Text>
          </View>
          <Text style={styles.exportBtnArrow}>➔</Text>
        </TouchableOpacity>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Fullscreen Video Overlay Modal */}
      <Modal visible={isFullscreen} animationType="fade" statusBarTranslucent onRequestClose={() => setIsFullscreen(false)}>
        <View style={styles.fullscreenContainer}>
          <BroadcastInVideoPlayer
            videoUri={processedVideoUrl}
            isLoading={isLoading}
            leadElbowAngle={leftElbowAngle}
            kneeFlexionAngle={leftKneeAngle}
            rearKneeAngle={rightKneeAngle}
            spineAngle={spineAngle}
            shotType={shotType}
            impactFrameRatio={calculatedImpactRatio}
            timeSeriesAngles={timeSeries}
            landmarkPositions={report?.report_json?.landmark_positions}
            coachingTip={coachingCue?.cue || coachingCue?.bottom || coachingCue?.bubble}
            onToggleFullscreen={() => setIsFullscreen(false)}
            isFullscreen={true}
            resumePlayback={playbackSnapshot}
            onPlaybackSnapshot={setPlaybackSnapshot}
            coachCuesEnabled={coachCuesEnabled}
            onCoachCuesChange={setCoachCuesEnabled}
          />
        </View>
      </Modal>

      {/* Shareable Performance Scorecard Modal */}
      <ShareableScorecardModal
        visible={showScorecardModal}
        onClose={() => setShowScorecardModal(false)}
        score={typeof overallScore === 'number' ? Math.round(overallScore) : 88}
        shotType={shotType}
        shotDirectionLabel={activeShotVerdict?.shot_direction_label}
        shotDirectionDeg={activeShotVerdict?.shot_direction_deg}
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
  analyzingOnly: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 10,
  },
  analyzingBack: {
    position: 'absolute',
    top: 16,
    left: 16,
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
    color: '#0c4a6e',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  exportBtnSubtitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 16,
  },
  exportBtnArrow: {
    color: '#0284c7',
    fontSize: 18,
    fontWeight: '700',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
    lineHeight: 18,
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
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...cardShadow,
  },
  backButtonText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#0284c7',
    fontWeight: '700',
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
    justifyContent: 'flex-end',
  },
  fullscreenPlaceholder: {
    height: 280,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  fullscreenPlaceholderText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
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
