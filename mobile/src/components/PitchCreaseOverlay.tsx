import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';

interface PitchCreaseOverlayProps {
  zoomLevel: number;
  onZoomChange: (newZoom: number) => void;
  isCalibrated?: boolean;
  statusText?: string;
}

const MIN_ZOOM = 1.0;
const MAX_ZOOM = 4.4;
const ZOOM_SPAN = MAX_ZOOM - MIN_ZOOM;

export const PitchCreaseOverlay: React.FC<PitchCreaseOverlayProps> = ({
  zoomLevel = 1.0,
  onZoomChange,
  isCalibrated = false,
  statusText,
}) => {
  const statusColor = '#38bdf8';
  const pillText = statusText || 'ALIGN BATSMAN IN CREASE';

  const trackRef = useRef<View>(null);
  const trackHeightRef = useRef(100);
  const trackPageYRef = useRef(0);
  const onZoomChangeRef = useRef(onZoomChange);

  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  const applyZoomFromPageY = (pageY: number) => {
    const h = Math.max(1, trackHeightRef.current);
    const yInTrack = pageY - trackPageYRef.current;
    // Top of track = max zoom, bottom = min zoom
    const ratioFromBottom = 1 - Math.max(0, Math.min(1, yInTrack / h));
    const next = MIN_ZOOM + ratioFromBottom * ZOOM_SPAN;
    const rounded = Math.round(next * 10) / 10;
    onZoomChangeRef.current(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, rounded)));
  };

  const measureAndApply = (pageY: number) => {
    trackRef.current?.measureInWindow((_x, y, _w, h) => {
      if (h > 0) {
        trackPageYRef.current = y;
        trackHeightRef.current = h;
      }
      applyZoomFromPageY(pageY);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        measureAndApply(evt.nativeEvent.pageY);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        applyZoomFromPageY(evt.nativeEvent.pageY);
      },
    })
  ).current;

  const thumbBottomPct = Math.max(
    0,
    Math.min(100, ((zoomLevel - MIN_ZOOM) / ZOOM_SPAN) * 100)
  );

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Outer Border Calibrated Feedback Highlight */}
      <View style={[styles.borderHighlight, { borderColor: statusColor }]} pointerEvents="none" />

      {/* Center Perspective Pitch Lines & Stump Target */}
      <View style={styles.centerPitchArea} pointerEvents="none">
        <View style={styles.perspectiveTrapezoid}>
          <View style={styles.creasePoppingLine} />
        </View>

        <View
          style={[
            styles.stumpDetectionBox,
            {
              borderColor: statusColor,
              backgroundColor: isCalibrated ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            },
          ]}
        >
          <View style={styles.stumpPillar} />
          <View style={styles.stumpPillar} />
          <View style={styles.stumpPillar} />
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
          <View style={styles.checkCircleIcon}>
            <Text style={styles.checkIconText}>{isCalibrated ? '✓' : '!'}</Text>
          </View>
          <Text style={styles.statusPillText}>{pillText}</Text>
        </View>
      </View>

      {/* Right Side Zoom Slider — drag the track or thumb to change zoom */}
      <View style={styles.zoomControlWidget} pointerEvents="auto">
        <Text style={styles.zoomValText}>{zoomLevel.toFixed(1)}x</Text>

        <View
          ref={trackRef}
          style={styles.zoomTrackHitArea}
          onLayout={(e) => {
            trackHeightRef.current = e.nativeEvent.layout.height;
          }}
          {...panResponder.panHandlers}
        >
          <View style={styles.zoomTrackLine}>
            <View style={[styles.zoomTrackFill, { height: `${thumbBottomPct}%` }]} />
            <View style={[styles.zoomThumb, { bottom: `${thumbBottomPct}%` }]} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.zoomPresetBtn}
          onPress={() => onZoomChange(zoomLevel >= 3.5 ? MIN_ZOOM : MAX_ZOOM)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.zoomBtnText}>1x / 4.4x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 15,
  },
  borderHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 4,
    borderRadius: 24,
  },
  centerPitchArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  perspectiveTrapezoid: {
    position: 'absolute',
    width: 220,
    height: 160,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    transform: [{ perspective: 200 }, { rotateX: '55deg' }],
  },
  creasePoppingLine: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#ffffff',
  },
  stumpDetectionBox: {
    width: 65,
    height: 110,
    borderWidth: 2.5,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingBottom: 4,
    marginBottom: 20,
  },
  stumpPillar: {
    width: 6,
    height: 90,
    backgroundColor: '#fbbf24',
    borderRadius: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    marginTop: 10,
  },
  checkCircleIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkIconText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  zoomControlWidget: {
    position: 'absolute',
    right: 16,
    top: '28%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    width: 48,
    height: 200,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  zoomValText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  zoomTrackHitArea: {
    width: 44,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomTrackLine: {
    width: 4,
    height: '100%',
    backgroundColor: '#334155',
    borderRadius: 2,
    position: 'relative',
    overflow: 'visible',
  },
  zoomTrackFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(56, 189, 248, 0.45)',
    borderRadius: 2,
  },
  zoomThumb: {
    position: 'absolute',
    left: -8,
    marginBottom: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#38bdf8',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  zoomPresetBtn: {
    paddingVertical: 2,
  },
  zoomBtnText: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: 'bold',
  },
});
