import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { ensureGuestSession, loginUser, registerUser } from '../services/api';
import { ArrowRight, Mail, Lock, User } from 'lucide-react-native';
import { colors, radii } from '../theme';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TabsList, TabsTrigger } from '../components/ui/Tabs';

interface AuthScreenProps {
  onAuthSuccess: (email?: string) => void;
  onSkipGuest: () => void;
}

/** FastAPI may return detail as string OR array/object — never show [object Object]. */
const formatAuthError = (error: any, fallback: string): string => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.msg) {
          const field = Array.isArray(item.loc) ? item.loc.filter((x: any) => x !== 'body').join(' ') : '';
          return field ? `${field}: ${item.msg}` : String(item.msg);
        }
        return null;
      })
      .filter(Boolean);
    if (parts.length) return parts.join('\n');
  }

  if (detail && typeof detail === 'object') {
    if (typeof detail.message === 'string') return detail.message;
    try {
      return JSON.stringify(detail);
    } catch {
      // ignore
    }
  }

  if (typeof error?.message === 'string' && error.message && !error.message.includes('[object Object]')) {
    if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
      return 'Cannot reach the server. Check Wi-Fi and that the backend is running.';
    }
    return error.message;
  }

  return fallback;
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onSkipGuest }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();

    if (!trimmedEmail || !password || (!isLogin && !trimmedName)) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      Alert.alert('Invalid email', 'Please enter a valid email like name@gmail.com');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password should be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(trimmedEmail, password);
      } else {
        await registerUser(trimmedEmail, password, trimmedName);
        await loginUser(trimmedEmail, password);
      }
      setLoading(false);
      onAuthSuccess(trimmedEmail);
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        'Could not continue',
        formatAuthError(
          error,
          'Authentication failed. Please check your details and server connection.'
        )
      );
    }
  };

  const handleContinueAsGuest = async () => {
    setLoading(true);
    try {
      await ensureGuestSession();
    } catch (err) {
      console.log('Guest session initialization notice:', err);
    } finally {
      setLoading(false);
      onSkipGuest();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={styles.headerBox}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/athletx.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appTitle}>Athletix</Text>
          <Text style={styles.appSub}>
            Sign in to sync your swing analysis, coaching drills, and shot history.
          </Text>
        </View>

        {/* Tab Switcher (Shadcn Segmented Control) */}
        <View style={styles.tabsWrapper}>
          <TabsList>
            <TabsTrigger
              value="login"
              activeValue={isLogin ? 'login' : 'register'}
              onPress={() => setIsLogin(true)}
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="register"
              activeValue={isLogin ? 'login' : 'register'}
              onPress={() => setIsLogin(false)}
            >
              Create Account
            </TabsTrigger>
          </TabsList>
        </View>

        {/* Form Card */}
        <Card style={styles.formCard}>
          <CardContent>
            {!isLogin && (
              <Input
                label="Full name"
                placeholder="e.g. Virat Kohli"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                iconLeft={<User size={16} color={colors.mutedForeground} />}
              />
            )}

            <Input
              label="Email address"
              placeholder="you@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              iconLeft={<Mail size={16} color={colors.mutedForeground} />}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              iconLeft={<Lock size={16} color={colors.mutedForeground} />}
              helperText={!isLogin ? 'At least 6 characters' : undefined}
            />

            <Button
              variant="default"
              size="lg"
              loading={loading}
              onPress={handleSubmit}
              style={styles.submitBtn}
              iconRight={<ArrowRight size={17} color={colors.primaryForeground} strokeWidth={2.4} />}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </CardContent>
        </Card>

        {/* Guest mode button */}
        <Button
          variant="outline"
          size="default"
          onPress={handleContinueAsGuest}
          disabled={loading}
          style={styles.guestBtn}
        >
          Continue as Guest
        </Button>

        <Text style={styles.footerHint}>
          Guest mode stores your sessions locally on this device.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 40,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoWrap: {
    backgroundColor: '#000000',
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandLogo: {
    width: 170,
    height: 80,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.foreground,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  appSub: {
    color: colors.mutedForeground,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 16,
  },
  tabsWrapper: {
    marginBottom: 16,
  },
  formCard: {
    padding: 20,
    borderRadius: radii.xxl,
  },
  submitBtn: {
    marginTop: 8,
    borderRadius: radii.md,
  },
  guestBtn: {
    marginTop: 20,
    alignSelf: 'center',
    borderRadius: radii.full,
    paddingHorizontal: 24,
  },
  footerHint: {
    marginTop: 14,
    textAlign: 'center',
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
