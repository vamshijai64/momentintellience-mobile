import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import { OnboardingGuideScreen } from './src/screens/OnboardingGuideScreen';
import { CameraRecordScreen } from './src/screens/CameraRecordScreen';
import { VideoAnalysisScreen } from './src/screens/VideoAnalysisScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ShotHistoryScreen } from './src/screens/ShotHistoryScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'GUIDE' | 'AUTH' | 'RECORD' | 'ANALYSIS' | 'HISTORY'>('GUIDE');
  const [activeReportId, setActiveReportId] = useState<string>('');
  const [activeVideoId, setActiveVideoId] = useState<string>('');
  const [activeVideoUri, setActiveVideoUri] = useState<string>('');

  const handleVideoProcessed = (reportId: string, videoId: string, videoUri?: string) => {
    setActiveReportId(reportId);
    setActiveVideoId(videoId);
    if (videoUri) {
      setActiveVideoUri(videoUri);
    }
    setCurrentScreen('ANALYSIS');
  };

  const handleSelectHistoryVideo = (videoId: string) => {
    setActiveReportId(videoId);
    setActiveVideoId(videoId);
    setActiveVideoUri('');
    setCurrentScreen('ANALYSIS');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {currentScreen === 'GUIDE' ? (
        <OnboardingGuideScreen onComplete={() => setCurrentScreen('AUTH')} />
      ) : currentScreen === 'AUTH' ? (
        <AuthScreen
          onAuthSuccess={() => setCurrentScreen('RECORD')}
          onSkipGuest={() => setCurrentScreen('RECORD')}
        />
      ) : currentScreen === 'RECORD' ? (
        <CameraRecordScreen
          onVideoProcessed={handleVideoProcessed}
          onViewHistory={() => setCurrentScreen('HISTORY')}
        />
      ) : currentScreen === 'HISTORY' ? (
        <ShotHistoryScreen
          onBack={() => setCurrentScreen('RECORD')}
          onSelectVideo={handleSelectHistoryVideo}
        />
      ) : (
        <VideoAnalysisScreen
          reportId={activeReportId}
          videoId={activeVideoId}
          videoUri={activeVideoUri}
          onBackToCamera={() => setCurrentScreen('RECORD')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
