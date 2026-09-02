import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View } from 'react-native';
import { SplashScreen } from './src/screens/SplashScreen';
import { ModernOnboardingScreen } from './src/screens/ModernOnboardingScreen';
import { CameraRecordScreen } from './src/screens/CameraRecordScreen';
import { VideoAnalysisScreen } from './src/screens/VideoAnalysisScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { ShotHistoryScreen } from './src/screens/ShotHistoryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SignOutScreen } from './src/screens/SignOutScreen';
import { AppBottomNav, TabName } from './src/components/AppBottomNav';
import { markOnboardingDone, restoreAuthSession } from './src/services/api';

type AppScreen = 'LOADING' | 'GUIDE' | 'AUTH' | 'RECORD' | 'ANALYSIS' | 'HISTORY' | 'PROFILE' | 'SIGN_OUT';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('LOADING');
  const [activeReportId, setActiveReportId] = useState<string>('');
  const [activeVideoId, setActiveVideoId] = useState<string>('');
  const [activeVideoUri, setActiveVideoUri] = useState<string>('');
  const [analysisFromHistory, setAnalysisFromHistory] = useState<boolean>(false);
  const [historyAccountKey, setHistoryAccountKey] = useState<string>('boot');

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        const session = await restoreAuthSession();
        if (cancelled) return;

        if (!session.onboardingDone) {
          setCurrentScreen('GUIDE');
          return;
        }
        if (session.isLoggedIn) {
          setHistoryAccountKey(session.email || 'member');
          setCurrentScreen('RECORD');
          return;
        }
        setCurrentScreen('AUTH');
      } catch {
        if (!cancelled) setCurrentScreen('GUIDE');
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleOnboardingComplete = () => {
    setCurrentScreen('AUTH');
    markOnboardingDone().catch((err) => {
      console.log('Failed to persist onboarding flag', err);
    });
  };

  const handleVideoProcessed = (reportId: string, videoId: string, videoUri?: string) => {
    setActiveReportId(reportId);
    setActiveVideoId(videoId);
    setAnalysisFromHistory(false);
    if (videoUri) {
      setActiveVideoUri(videoUri);
    }
    setCurrentScreen('ANALYSIS');
  };

  const handleSelectHistoryVideo = (videoId: string) => {
    setActiveReportId(videoId);
    setActiveVideoId(videoId);
    setActiveVideoUri('');
    setAnalysisFromHistory(true);
    setCurrentScreen('ANALYSIS');
  };

  const showBottomNav =
    currentScreen === 'RECORD' ||
    currentScreen === 'HISTORY' ||
    currentScreen === 'PROFILE' ||
    currentScreen === 'ANALYSIS';

  const isLightShell =
    currentScreen === 'GUIDE' ||
    currentScreen === 'AUTH' ||
    currentScreen === 'LOADING' ||
    currentScreen === 'PROFILE' ||
    currentScreen === 'SIGN_OUT';

  if (currentScreen === 'LOADING') {
    return <SplashScreen statusText="Restoring your session..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f8fafc"
      />
      <View style={styles.mainContent}>
        {currentScreen === 'GUIDE' ? (
          <ModernOnboardingScreen onComplete={handleOnboardingComplete} />
        ) : currentScreen === 'AUTH' ? (
          <AuthScreen
            onAuthSuccess={(email) => {
              setHistoryAccountKey(email || `member-${Date.now()}`);
              setCurrentScreen('RECORD');
            }}
            onSkipGuest={() => {
              setHistoryAccountKey(`guest-${Date.now()}`);
              setCurrentScreen('RECORD');
            }}
          />
        ) : currentScreen === 'RECORD' ? (
          <CameraRecordScreen
            onVideoProcessed={handleVideoProcessed}
            onViewHistory={() => setCurrentScreen('HISTORY')}
            onViewProfile={() => setCurrentScreen('PROFILE')}
            onViewGuide={() => setCurrentScreen('GUIDE')}
            onSignOut={() => setCurrentScreen('SIGN_OUT')}
          />
        ) : currentScreen === 'HISTORY' ? (
          <ShotHistoryScreen
            accountKey={historyAccountKey}
            onBack={() => setCurrentScreen('RECORD')}
            onSelectVideo={handleSelectHistoryVideo}
          />
        ) : currentScreen === 'PROFILE' ? (
          <ProfileScreen
            onBack={() => setCurrentScreen('RECORD')}
            onViewHistory={() => setCurrentScreen('HISTORY')}
            onViewGuide={() => setCurrentScreen('GUIDE')}
            onSignOut={() => setCurrentScreen('SIGN_OUT')}
          />
        ) : currentScreen === 'SIGN_OUT' ? (
          <SignOutScreen
            onCancel={() => setCurrentScreen('RECORD')}
            onSignedOut={() => {
              setHistoryAccountKey(`signed-out-${Date.now()}`);
              setCurrentScreen('AUTH');
            }}
          />
        ) : (
          <VideoAnalysisScreen
            reportId={activeReportId}
            videoId={activeVideoId}
            videoUri={activeVideoUri}
            fromHistory={analysisFromHistory}
            onBackToCamera={() => setCurrentScreen('RECORD')}
          />
        )}
      </View>

      {showBottomNav && (
        <AppBottomNav
          activeTab={currentScreen as TabName}
          onTabPress={(tab) => setCurrentScreen(tab)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mainContent: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  splashLogo: {
    width: 200,
    height: 120,
    marginBottom: 8,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});
