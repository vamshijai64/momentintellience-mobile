import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ===========================================================
// GLB MODEL URLS – real hosted 3D cricket batsman models
// For production, host these on your FastAPI backend at
// /static/models/pull_shot.glb and /static/models/cover_drive.glb
// For now we use a Sketchfab-style glb model as a placeholder
// ===========================================================

const SHOT_MODELS: Record<string, { glb: string; usdz: string; label: string; tip: string }> = {
  'PULL SHOT': {
    glb: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    usdz: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.usdz',
    label: 'Pull Shot Technique',
    tip: 'Chest-height contact · Horizontal bat path · Rear-foot anchor · Wrist roll through impact',
  },
  'COVER DRIVE': {
    glb: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    usdz: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.usdz',
    label: 'Cover Drive Technique',
    tip: 'High lead elbow (142°) · Front-foot stride · Vertical bat face through extra cover',
  },
  'DEFENSIVE': {
    glb: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.glb',
    usdz: 'https://modelviewer.dev/shared-assets/models/RobotExpressive.usdz',
    label: 'Defensive Block',
    tip: 'Soft top-hand grip · Head over ball · Bat angled to kill momentum',
  },
};

interface ARModelWebViewProps {
  shotType?: string;
  height?: number;
  showARButton?: boolean;
}

export const ARModelWebView: React.FC<ARModelWebViewProps> = ({
  shotType = 'COVER DRIVE',
  height = 360,
  showARButton = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const model = SHOT_MODELS[shotType] || SHOT_MODELS['COVER DRIVE'];

  // Full self-contained HTML with Google model-viewer
  // model-viewer supports real ARCore (Android) + ARKit (iOS) out of the box
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>${model.label}</title>
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%; height: 100%;
      background: #020617;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden;
    }

    model-viewer {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e3a5f 100%);
      --progress-bar-color: #38bdf8;
      --progress-bar-height: 3px;
    }

    /* HUD Overlay */
    .hud {
      position: absolute;
      top: 0; left: 0; right: 0;
      padding: 10px 14px 6px;
      background: linear-gradient(to bottom, rgba(2,6,23,0.9), transparent);
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: none;
    }
    .hud-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(56,189,248,0.15);
      border: 1px solid rgba(56,189,248,0.4);
      border-radius: 20px;
      padding: 4px 10px;
    }
    .hud-dot {
      width: 7px; height: 7px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    .hud-label {
      color: #38bdf8;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .shot-label {
      color: #fbbf24;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.4px;
    }

    /* AR Button override */
    .ar-button {
      position: absolute;
      bottom: 14px;
      right: 14px;
      background: #0284c7;
      border: none;
      border-radius: 12px;
      padding: 10px 18px;
      color: white;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 20px rgba(2,132,199,0.5);
    }

    /* Interaction hint */
    .hint {
      position: absolute;
      bottom: 14px;
      left: 14px;
      color: rgba(255,255,255,0.55);
      font-size: 10px;
      font-weight: 600;
      pointer-events: none;
    }

    /* Tip card at the bottom */
    .tip-card {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: linear-gradient(to top, rgba(2,6,23,0.95), transparent);
      padding: 24px 14px 14px;
      pointer-events: none;
    }
    .tip-title {
      color: #fbbf24;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .tip-text {
      color: rgba(255,255,255,0.75);
      font-size: 11px;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <model-viewer
    id="cricket-model"
    src="${model.glb}"
    ${Platform.OS === 'ios' ? `ios-src="${model.usdz}"` : ''}
    alt="${model.label} 3D Model"
    ar
    ar-modes="webxr scene-viewer quick-look"
    ar-scale="fixed"
    camera-controls
    touch-action="pan-y"
    auto-rotate
    auto-rotate-delay="1000"
    rotation-per-second="25deg"
    shadow-intensity="1.2"
    shadow-softness="0.5"
    exposure="1.0"
    environment-image="neutral"
    camera-orbit="-30deg 70deg 2.5m"
    min-camera-orbit="auto auto 0.5m"
    max-camera-orbit="auto auto 5m"
    interaction-prompt="auto"
    interaction-prompt-style="basic"
  >
    <!-- HUD overlay -->
    <div class="hud">
      <div class="hud-badge">
        <div class="hud-dot"></div>
        <span class="hud-label">3D AR Model</span>
      </div>
      <span class="shot-label">${shotType}</span>
    </div>

    <!-- AR Launch button (shown only on AR-capable devices) -->
    ${showARButton ? `
    <button slot="ar-button" class="ar-button">
      🥽 View in AR
    </button>
    ` : ''}

    <!-- Rotate hint -->
    <div class="hint">↔ Drag to rotate · Pinch to zoom</div>

    <!-- Technique tip -->
    <div class="tip-card">
      <div class="tip-title">TEXTBOOK TECHNIQUE</div>
      <div class="tip-text">${model.tip}</div>
    </div>
  </model-viewer>

  <script>
    const mv = document.querySelector('#cricket-model');
    mv.addEventListener('ar-status', (e) => {
      // Notify React Native when AR starts/stops
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'ar-status', status: e.detail.status })
      );
    });
    mv.addEventListener('load', () => {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'loaded' })
      );
    });
  </script>
</body>
</html>
`;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'loaded') {
        setIsLoading(false);
      }
      if (data.type === 'ar-status') {
        console.log('AR status:', data.status);
      }
    } catch (_) {}
  };

  const handleOpenARFallback = () => {
    // Fallback: Open native Scene Viewer via deep link
    const modelUrl = model.glb;
    if (Platform.OS === 'android') {
      const sceneViewerUrl =
        `intent://arvr.google.com/scene-viewer/1.0` +
        `?file=${encodeURIComponent(modelUrl)}` +
        `&mode=ar_preferred` +
        `&title=${encodeURIComponent(model.label)}` +
        `#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`;

      Linking.canOpenURL(sceneViewerUrl)
        .then((can) => {
          if (can) {
            return Linking.openURL(sceneViewerUrl);
          }
          // Fallback: open in browser
          return Linking.openURL(
            `https://arvr.google.com/scene-viewer?file=${encodeURIComponent(modelUrl)}`
          );
        })
        .catch(() => {
          Alert.alert('AR Not Available', 'Please install Google Play Services for AR to use this feature.');
        });
    } else {
      // iOS: USDZ Quick Look
      Linking.openURL(model.usdz).catch(() => {
        Alert.alert('AR Not Available', 'Please use iOS 12+ to view in AR.');
      });
    }
  };

  if (hasError) {
    return (
      <View style={[styles.fallbackContainer, { height }]}>
        <Text style={styles.fallbackIcon}>🥽</Text>
        <Text style={styles.fallbackTitle}>3D Model Loading...</Text>
        <Text style={styles.fallbackDesc}>
          Ensure your device has an internet connection to load the 3D model.
        </Text>
        <TouchableOpacity
          style={styles.fallbackARButton}
          onPress={handleOpenARFallback}
          activeOpacity={0.8}
        >
          <Text style={styles.fallbackARButtonText}>🥽 Open Native AR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      {/* WebView with model-viewer AR */}
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={StyleSheet.absoluteFillObject}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        onMessage={handleMessage}
        scrollEnabled={false}
        overScrollMode="never"
        bounces={false}
        containerStyle={{ backgroundColor: '#020617' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.loadingText}>Loading 3D Model...</Text>
          <Text style={styles.loadingSubtext}>Requires internet connection</Text>
        </View>
      )}

      {/* Native AR Fallback Button (bottom-right overlay) */}
      <TouchableOpacity
        style={styles.nativeARButton}
        onPress={handleOpenARFallback}
        activeOpacity={0.85}
      >
        <Text style={styles.nativeARButtonText}>📱 Launch Native AR</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#020617',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingSubtext: {
    color: '#64748b',
    fontSize: 12,
  },
  nativeARButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.4)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  nativeARButtonText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  fallbackContainer: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  fallbackIcon: {
    fontSize: 40,
  },
  fallbackTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  fallbackDesc: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  fallbackARButton: {
    marginTop: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  fallbackARButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
