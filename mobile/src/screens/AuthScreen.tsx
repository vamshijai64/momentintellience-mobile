import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { ensureGuestSession, loginUser, registerUser } from '../services/api';

interface AuthScreenProps {
  onAuthSuccess: (email?: string) => void;
  onSkipGuest: () => void;
}

const ACCENT = '#0d9488';
const ACCENT_SOFT = '#ccfbf1';
const ACCENT_DEEP = '#0f766e';

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

  const handleContinueAsGuest = () => {
    // Same as before: go straight to record — never block on auth errors.
    onSkipGuest();
    // Best-effort: attach this phone to a guest account so history can save.
    ensureGuestSession().catch(() => {});
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#faf9f6" />
      <View style={styles.blobTL} />
      <View style={styles.blobTR} />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBox}>
          <View style={styles.logoMark}>
            <Text style={styles.logoEmoji}>🏏</Text>
          </View>
          <Text style={styles.brandName}>AI Cricket Coach</Text>
          <Text style={styles.appSub}>
            Sign in once — your shots stay saved in History even after you close the app
          </Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, isLogin && styles.tabBtnActive]}
            onPress={() => setIsLogin(true)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, !isLogin && styles.tabBtnActive]}
            onPress={() => setIsLogin(false)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Vishal Sharma"
                placeholderTextColor="#94a3b8"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@email.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {isLogin ? 'Sign in' : 'Create account'}
                </Text>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrow}>→</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={handleContinueAsGuest}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.guestBtnText}>Continue as guest</Text>
        </TouchableOpacity>

        <Text style={styles.footerHint}>
          Guest mode also saves history on this phone. Sign in to keep it across devices.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const softShadow = Platform.select({
  ios: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
  },
  android: { elevation: 3 },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9f6',
  },
  blobTL: {
    position: 'absolute',
    top: -70,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#99f6e4',
    opacity: 0.45,
  },
  blobTR: {
    position: 'absolute',
    top: 80,
    right: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#fef3c7',
    opacity: 0.4,
  },
  contentContainer: {
    padding: 28,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 40,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: ACCENT_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#a7f3d0',
  },
  logoEmoji: {
    fontSize: 34,
  },
  brandName: {
    color: '#0f172a',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  appSub: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 5,
    marginBottom: 18,
    ...softShadow,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: ACCENT,
  },
  tabText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    ...softShadow,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontSize: 15,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  submitBtn: {
    backgroundColor: ACCENT,
    paddingVertical: 8,
    paddingLeft: 20,
    paddingRight: 8,
    borderRadius: 18,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 58,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  arrowCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  guestBtn: {
    marginTop: 22,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    minWidth: 180,
    alignItems: 'center',
  },
  guestBtnText: {
    color: ACCENT_DEEP,
    fontSize: 14,
    fontWeight: '700',
  },
  footerHint: {
    marginTop: 14,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    paddingHorizontal: 8,
  },
});
