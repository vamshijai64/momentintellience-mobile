import React, { useEffect, useRef, useState } from 'react';
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [cameraBusy, setCameraBusy] = useState<boolean>(false);

  // When user opens How-to from Profile/Camera, finish should return to camera — not restart auth.
  const guideReturnScreen = useRef<AppScreen>('AUTH');

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        const session = await restoreAuthSession();
        if (cancelled) return;

        setIsLoggedIn(session.isLoggedIn);
        if (session.email) {
          setHistoryAccountKey(session.email);
        }

        // Already logged in → always land on camera (and remember onboarding).
        if (session.isLoggedIn) {
          if (!session.onboardingDone) {
            await markOnboardingDone();
          }
          setCurrentScreen('RECORD');
          return;
        }

        // First launch only
        if (!session.onboardingDone) {
          guideReturnScreen.current = 'AUTH';
          setCurrentScreen('GUIDE');
          return;
        }

        setCurrentScreen('AUTH');
      } catch (err) {
        console.log('Boot session restore failed', err);
        // Prefer auth over forcing onboarding again on storage errors
        if (!cancelled) setCurrentScreen('AUTH');
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const openGuide = (returnTo: AppScreen = 'RECORD') => {
    guideReturnScreen.current = returnTo;
    setCurrentScreen('GUIDE');
  };

  const handleOnboardingComplete = async () => {
    try {
      await markOnboardingDone();
    } catch (err) {
      console.log('Failed to persist onboarding flag', err);
    }

    const next = guideReturnScreen.current;
    if (next === 'RECORD' || isLoggedIn) {
      setCurrentScreen('RECORD');
      return;
    }
    setCurrentScreen('AUTH');
  };

  const handleVideoProcessed = (reportId: string, videoId: string, videoUri?: string) => {
    setCameraBusy(false);
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
    !cameraBusy &&
    (currentScreen === 'RECORD' || currentScreen === 'HISTORY' || currentScreen === 'PROFILE');

  if (currentScreen === 'LOADING') {
    return <SplashScreen statusText="Restoring your session..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <View style={styles.mainContent}>
        {currentScreen === 'GUIDE' ? (
          <ModernOnboardingScreen onComplete={handleOnboardingComplete} />
        ) : currentScreen === 'AUTH' ? (
          <AuthScreen
            onAuthSuccess={(email) => {
              setIsLoggedIn(true);
              setHistoryAccountKey(email || `member-${Date.now()}`);
              markOnboardingDone().catch(() => undefined);
              setCurrentScreen('RECORD');
            }}
            onSkipGuest={() => {
              setIsLoggedIn(true);
              setHistoryAccountKey(`guest-${Date.now()}`);
              markOnboardingDone().catch(() => undefined);
              setCurrentScreen('RECORD');
            }}
          />
        ) : currentScreen === 'RECORD' ? (
          <CameraRecordScreen
            onVideoProcessed={handleVideoProcessed}
            onViewHistory={() => setCurrentScreen('HISTORY')}
            onViewProfile={() => setCurrentScreen('PROFILE')}
            onViewGuide={() => openGuide('RECORD')}
            onSignOut={() => setCurrentScreen('SIGN_OUT')}
            onBusyChange={setCameraBusy}
          />
        ) : currentScreen === 'HISTORY' ? (
          <ShotHistoryScreen
            accountKey={historyAccountKey}
            onBack={() => setCurrentScreen('RECORD')}
            onSelectVideo={handleSelectHistoryVideo}
            onSignOut={() => setCurrentScreen('SIGN_OUT')}
          />
        ) : currentScreen === 'PROFILE' ? (
          <ProfileScreen
            onBack={() => setCurrentScreen('RECORD')}
            onViewHistory={() => setCurrentScreen('HISTORY')}
            onViewGuide={() => openGuide('RECORD')}
            onSignOut={() => setCurrentScreen('SIGN_OUT')}
          />
        ) : currentScreen === 'SIGN_OUT' ? (
          <SignOutScreen
            onCancel={() => setCurrentScreen('RECORD')}
            onSignedOut={() => {
              setIsLoggedIn(false);
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
});
