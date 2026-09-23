import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Share2, ChevronLeft, ArrowLeft } from 'lucide-react-native';
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
import { Cricket3DViewer } from '../components/Cricket3DViewer';
import { Interactive3DARViewer } from '../components/Interactive3DARViewer';
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
  const [userSelectedShotType, setUserSelectedShotType] = useState<string | null>(null);
  const [arMode, setArMode] = useState<'WEBGL' | 'AR'>('WEBGL');
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [showScorecardModal, setShowScorecardModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'stadium' | 'verdict' | 'metrics' | 'masterclass'>('stadium');

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
  const rawOriginalPath = report?.original_video_url || (report as any)?.video_path;
  const cleanVideoUrl = rawOriginalPath ? getOverlayVideoUrl(rawOriginalPath) : videoUri;

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
  const rawAiShotType = activeShotVerdict?.shot_type || shotClassification?.shot_type || (isLoading ? 'Analyzing…' : 'COVER DRIVE');
  const shotType = userSelectedShotType || rawAiShotType;
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

  // Stance-aware limb resolution (respects Right vs Left handed batting)
  const rawStance = (report as any)?.batting_stance || (report?.report_json as any)?.batting_stance || 'AUTO';
  const isLeftHanded = rawStance.toUpperCase() === 'LEFT';
  const leadFrontElbow = isLeftHanded ? rightElbowAngle : leftElbowAngle;
  const frontKnee = isLeftHanded ? rightKneeAngle : leftKneeAngle;
  const rearKnee = isLeftHanded ? leftKneeAngle : rightKneeAngle;

  const isPullShot = shotType.toUpperCase().includes('PULL') || shotType.toUpperCase().includes('HOOK');

  const totalFrames = timeSeries.length || 100;
  const calculatedImpactRatio = totalFrames > 0 
    ? Math.min(0.95, Math.max(0.05, impactFrame / totalFrames)) 
    : 0.62;

  const metricsData = [
    {
      name: isLeftHanded ? 'Lead Right Elbow' : 'Lead Front Elbow',
      angle: leadFrontElbow ?? 0,
      idealRange: isPullShot ? '105° - 150°' : '120° - 155°',
      status: (leadFrontElbow != null && leadFrontElbow >= (isPullShot ? 105 : 120) && leadFrontElbow <= 155 ? 'CORRECT' : 'INCORRECT') as 'CORRECT' | 'INCORRECT',
      recommendation: leadFrontElbow != null && leadFrontElbow >= (isPullShot ? 105 : 120) ? 'Lead elbow is in a solid power band.' : 'Keep front elbow high through contact.',
    },
    {
      name: isLeftHanded ? 'Rear Left Knee' : 'Rear Right Knee',
      angle: rearKnee ?? 0,
      idealRange: isPullShot ? '115° - 150°' : '135° - 168°',
      status: (rearKnee != null && rearKnee >= (isPullShot ? 115 : 135) && rearKnee <= 168 ? 'CORRECT' : 'INCORRECT') as 'CORRECT' | 'INCORRECT',
      recommendation: isPullShot ? 'Back leg anchored to absorb rotation.' : 'Back leg braced and stable.',
    },
    {
      name: isLeftHanded ? 'Front Right Knee' : 'Front Left Knee',
      angle: frontKnee ?? 0,
      idealRange: isPullShot ? '125° - 165°' : '118° - 148°',
      status: (frontKnee != null && frontKnee >= (isPullShot ? 125 : 118) && frontKnee <= (isPullShot ? 165 : 148) ? 'CORRECT' : 'INCORRECT') as 'CORRECT' | 'INCORRECT',
      recommendation: isPullShot ? 'Front foot cleared for hip turn.' : 'Front knee bent firmly over the ball.',
    },
    {
      name: 'Spine Lean',
      angle: spineAngle ?? 0,
      idealRange: '0° - 18° from upright',
      status: (spineAngle != null && spineAngle <= 18 ? 'CORRECT' : 'INCORRECT') as 'CORRECT' | 'INCORRECT',
      recommendation: 'Head and spine stay stacked over the base.',
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
          <ArrowLeft size={16} color="#0369a1" strokeWidth={2.6} />
          <Text style={styles.backButtonText}>Record again</Text>
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
          <TouchableOpacity style={styles.backButton} onPress={onBackToCamera} activeOpacity={0.7}>
            <ArrowLeft size={16} color="#0369a1" strokeWidth={2.6} />
            <Text style={styles.backButtonText}>Record again</Text>
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
            {shots.length > 1 ? (
              <ChevronLeft size={16} color="#0369a1" strokeWidth={2.6} />
            ) : (
              <ArrowLeft size={16} color="#0369a1" strokeWidth={2.6} />
            )}
            <Text style={styles.backButtonText}>
              {shots.length > 1 ? 'Summary' : 'Record again'}
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
            accessibilityLabel="Share scorecard"
          >
            <Share2 size={18} color="#0284c7" strokeWidth={2.2} />
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
                  style={[styles.deliveryPill, isActive && styles.deliveryPillActive]}
                  onPress={() => setSelectedShotIndex(idx)}
                >
                  <View style={[styles.deliveryPillDot, { backgroundColor: dotColor }]} />
                  <Text style={[styles.deliveryPillText, isActive && styles.deliveryPillTextActive]}>
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
            cleanVideoUri={cleanVideoUrl}
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

        {/* 🏏 Shot Type Selector & Dynamic Calibration Bar */}
        <View style={styles.shotSelectorContainer}>
          <View style={styles.shotSelectorHeader}>
            <View style={styles.shotSelectorTitleGroup}>
              <Text style={styles.shotSelectorLabel}>DETECTED STROKE</Text>
              {userSelectedShotType && (
                <View style={styles.manualOverrideBadge}>
                  <Text style={styles.manualOverrideBadgeText}>MANUAL FIX</Text>
                </View>
              )}
            </View>
            {userSelectedShotType && (
              <TouchableOpacity onPress={() => setUserSelectedShotType(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.shotSelectorReset}>↺ Reset to AI ({rawAiShotType})</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shotPillsScroll}>
            {[
              { id: 'COVER DRIVE', label: 'COVER DRIVE' },
              { id: 'PULL SHOT', label: 'PULL SHOT' },
              { id: 'STRAIGHT DRIVE', label: 'STRAIGHT DRIVE' },
              { id: 'DEFENSIVE SHOT', label: 'DEFENSIVE' },
              { id: 'CUT SHOT', label: 'CUT SHOT' },
              { id: 'SWEEP', label: 'SWEEP' },
            ].map((st) => {
              const isSelected = shotType.toUpperCase().includes(st.id.replace(' SHOT', ''));
              const isAi = rawAiShotType.toUpperCase().includes(st.id.replace(' SHOT', ''));
              return (
                <TouchableOpacity
                  key={st.id}
                  style={[styles.shotPill, isSelected && styles.shotPillSelected]}
                  onPress={() => setUserSelectedShotType(st.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.shotPillText, isSelected && styles.shotPillTextSelected]}>
                    {st.label} {isAi ? '✨' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <StanceBalanceCard
          shotType={shotType}
          leadElbowAngle={leadFrontElbow}
          kneeFlexionAngle={frontKnee}
          rearKneeAngle={rearKnee}
          spineAngle={spineAngle}
          coachingCue={coachingCue}
        />

        {/* 🌟 3-Second High-Level Executive Coach Takeaway Card for Clients */}
        <ExecutiveCoachSummaryCard
          score={activeShotVerdict?.composite_score ?? (typeof overallScore === 'number' ? Math.round(overallScore) : undefined)}
          shotType={shotType}
          shotDirectionLabel={activeShotVerdict?.shot_direction_label}
          shotDirectionDeg={activeShotVerdict?.shot_direction_deg}
          leadElbowAngle={leadFrontElbow}
          kneeFlexionAngle={frontKnee}
          verdict={activeShotVerdict?.verdict}
          takeaway={coachingCue?.bottom || flawSummary}
          onOpenScorecard={() => setShowScorecardModal(true)}
        />

        {/* 🎙️ AI Coach Broadcast Voice Commentary Player */}
        <AICoachVoicePlayer
          score={activeShotVerdict?.composite_score ?? (typeof overallScore === 'number' ? Math.round(overallScore) : 70)}
          techniqueScore={activeShotVerdict?.technique_score ?? 63}
          executionScore={activeShotVerdict?.execution_score}
          shotType={shotType}
          verdictLabel={activeShotVerdict?.verdict || 'GOOD SHOT'}
          leadElbowAngle={leadFrontElbow}
          kneeFlexionAngle={frontKnee}
          headOverFootOk={coachingCue?.head_over_foot_ok !== false}
          reason={coachingCue?.bottom || activeShotVerdict?.reason}
        />

        {/* 🎛️ Segmented Glass Navigation Pills */}
        <View style={styles.tabContainer}>
          {[
            { id: 'stadium', label: '3D AR Lab', icon: (active: boolean) => <GlassStadiumTabIcon size={16} active={active} /> },
            { id: 'verdict', label: 'Verdict', icon: (active: boolean) => <GlassVerdictTabIcon size={16} active={active} /> },
            { id: 'metrics', label: '3D Form', icon: (active: boolean) => <GlassMetricsTabIcon size={16} active={active} /> },
          
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
              currentElbowAngle={leadFrontElbow}
              idealElbowAngle={144}
            />

            {/* Pro-Player Elite Biomechanical Technique Audit */}
            <ProComparisonRadarCard
              overallScore={typeof overallScore === 'number' ? overallScore : 88}
              shotType={shotType}
              leadElbowAngle={leadFrontElbow}
              kneeFlexionAngle={frontKnee}
              isHeadStacked={coachingCue?.head_over_foot_ok !== false}
            />
          </View>
        )}

        {/* TAB CONTENT: 🏟️ 3. 3D AR LAB & VIRTUAL STADIUM */}
        {activeTab === 'stadium' && (
          <View style={styles.tabContentSection}>
            {/* 3D Model Switcher: Three.js WebGL Hologram vs 360° Joint Vector Radar */}
            <View style={styles.arModeToggleRow}>
              <TouchableOpacity
                style={[styles.arModeBtn, arMode === 'WEBGL' && styles.arModeBtnActive]}
                onPress={() => setArMode('WEBGL')}
                activeOpacity={0.8}
              >
                <Text style={[styles.arModeBtnText, arMode === 'WEBGL' && styles.arModeBtnTextActive]}>
                  🏏 3D Hologram Pitch
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.arModeBtn, arMode === 'AR' && styles.arModeBtnActive]}
                onPress={() => setArMode('AR')}
                activeOpacity={0.8}
              >
                <Text style={[styles.arModeBtnText, arMode === 'AR' && styles.arModeBtnTextActive]}>
                  📐 360° Joint Radar
                </Text>
              </TouchableOpacity>
            </View>

            {arMode === 'WEBGL' ? (
              <Cricket3DViewer
                shotType={shotType}
                height={380}
              />
            ) : (
              <Interactive3DARViewer
                shotType={shotType}
                leadElbowAngle={leadFrontElbow}
                kneeFlexionAngle={frontKnee}
                rearKneeAngle={rearKnee}
                spineAngle={spineAngle}
                overallScore={typeof overallScore === 'number' ? Math.round(overallScore) : 88}
              />
            )}

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
              leadElbowAngle={leadFrontElbow}
              kneeFlexionAngle={frontKnee}
              spineAngle={spineAngle}
              overallScore={typeof overallScore === 'number' ? Math.round(overallScore) : undefined}
            />

            <ProGhostSideBySideCard
              shotType={shotType}
              leadElbowAngle={leadFrontElbow}
              kneeFlexionAngle={frontKnee}
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

      {/* Fullscreen Video Overlay Modal — kept inside system safe area */}
      <Modal
        visible={isFullscreen}
        animationType="fade"
        statusBarTranslucent={false}
        onRequestClose={() => setIsFullscreen(false)}
      >
        <StatusBar barStyle="light-content" backgroundColor="#020617" />
        <SafeAreaView style={styles.fullscreenSafeArea}>
          <View
            style={[
              styles.fullscreenContainer,
              Platform.OS === 'android' && {
                paddingTop: StatusBar.currentHeight ?? 0,
                paddingBottom: 12,
              },
            ]}
          >
            <BroadcastInVideoPlayer
              videoUri={processedVideoUrl}
              cleanVideoUri={cleanVideoUrl}
              isLoading={isLoading}
              leadElbowAngle={leadFrontElbow}
              kneeFlexionAngle={frontKnee}
              rearKneeAngle={rearKnee}
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
        </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
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
  fullscreenSafeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#020617',
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
    marginBottom: 6,
  },
  shotSelectorContent: {
    gap: 8,
    paddingHorizontal: 16,
  },
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  deliveryPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: '#38bdf8',
  },
  deliveryPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 7,
  },
  deliveryPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  deliveryPillTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  shotSelectorContainer: {
    backgroundColor: '#0f172a',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  shotSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shotSelectorTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shotSelectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.1,
  },
  manualOverrideBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  manualOverrideBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#f59e0b',
  },
  shotSelectorReset: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38bdf8',
  },
  shotPillsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  shotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
  },
  shotPillSelected: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderColor: '#38bdf8',
  },
  shotPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  shotPillTextSelected: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  arModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  arModeBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  arModeBtnActive: {
    backgroundColor: '#0284c7',
  },
  arModeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  arModeBtnTextActive: {
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
