import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import {
  StadiumCameraIcon,
  ArmFlexIcon,
  CompassArenaIcon,
  CompassRadarIcon,
  GlassIconBadge,
} from './icons/AppIcons';

type CameraAngle = 'BOWLER' | 'SQUARE_LEG' | 'GULLY' | 'BIRDS_EYE';

interface CameraAngleConfig {
  name: string;
  perspectiveDesc: string;
  keyObservation: string;
  focusMetric: string;
}

const CAMERA_ANGLES: Record<CameraAngle, CameraAngleConfig> = {
  BOWLER: {
    name: "BOWLER'S END",
    perspectiveDesc: 'Front-on view down the pitch corridor',
    keyObservation: 'Head stayed inside the line of off-stump; bat swung straight down the off-drive line.',
    focusMetric: 'Corridor Alignment: 98%',
  },
  SQUARE_LEG: {
    name: 'SQUARE LEG',
    perspectiveDesc: 'Side-on biomechanical depth view',
    keyObservation: 'Head locked directly over the front knee at impact; solid forward stride into the pitch.',
    focusMetric: 'Head-to-Knee Stack: LOCKED (0.08)',
  },
  GULLY: {
    name: 'SLIPS & GULLY',
    perspectiveDesc: 'Rear 45° edge & bat-face angle view',
    keyObservation: 'Full vertical bat face presented with zero outer edge angle risk; stroke stayed grounded.',
    focusMetric: 'Edge Risk: 0% (Clean Middle)',
  },
  BIRDS_EYE: {
    name: "BIRD'S EYE 360°",
    perspectiveDesc: 'Top-down stadium field & wagon wheel view',
    keyObservation: 'Ball accelerated through the Cover boundary at 47° off-side vector.',
    focusMetric: 'Wagon Sector: COVER (47°)',
  },
};

const renderAngleIcon = (key: CameraAngle, isSelected: boolean) => {
  const color = isSelected ? '#0284c7' : '#64748b';
  switch (key) {
    case 'BOWLER':
      return <StadiumCameraIcon size={16} color={color} />;
    case 'SQUARE_LEG':
      return <ArmFlexIcon size={16} color={color} />;
    case 'GULLY':
      return <CompassArenaIcon size={16} color={color} />;
    case 'BIRDS_EYE':
      return <CompassRadarIcon size={16} color={color} />;
  }
};

interface Stadium360AngleViewerProps {
  shotType?: string;
  shotDirectionLabel?: string;
  shotDirectionDeg?: number;
}

export const Stadium360AngleViewer: React.FC<Stadium360AngleViewerProps> = ({
  shotType = 'COVER DRIVE',
  shotDirectionLabel = 'COVER',
  shotDirectionDeg = 47,
}) => {
  const [selectedAngle, setSelectedAngle] = useState<CameraAngle>('BOWLER');
  const current = CAMERA_ANGLES[selectedAngle];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <GlassIconBadge bg="#e0f2fe" borderColor="#bae6fd" size={36}>
            <CompassArenaIcon size={20} color="#0284c7" />
          </GlassIconBadge>
          <View>
            <Text style={styles.title}>360° VIRTUAL STADIUM PERSPECTIVE</Text>
            <Text style={styles.subtitle}>Multi-Camera Angle Coaching Simulator</Text>
          </View>
        </View>
      </View>

      {/* Camera Selector Pills */}
      <View style={styles.cameraRow}>
        {(Object.keys(CAMERA_ANGLES) as CameraAngle[]).map((angleKey) => {
          const cfg = CAMERA_ANGLES[angleKey];
          const isSelected = selectedAngle === angleKey;
          return (
            <TouchableOpacity
              key={angleKey}
              style={[styles.cameraBtn, isSelected && styles.cameraBtnActive]}
              onPress={() => setSelectedAngle(angleKey)}
              activeOpacity={0.8}
            >
              <View style={styles.cameraIconBox}>
                {renderAngleIcon(angleKey, isSelected)}
              </View>
              <Text style={[styles.cameraBtnText, isSelected && styles.cameraBtnTextActive]}>
                {cfg.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Virtual Stadium Perspective Screen */}
      <View style={styles.screenFrame}>
        {/* Top Perspective Header */}
        <View style={styles.screenHeader}>
          <View style={styles.screenHeaderLeft}>
            {renderAngleIcon(selectedAngle, true)}
            <Text style={styles.screenCameraTag}>{current.name} CAMERA</Text>
          </View>
          <Text style={styles.screenDescTag}>{current.perspectiveDesc}</Text>
        </View>

        {/* 3D Visual Pitch Box */}
        <View style={styles.pitchFieldBox}>
          {/* Pitch Lines */}
          <View style={styles.pitchStrip}>
            <View style={styles.creaseLineTop} />
            <View style={styles.stumpsTop}>
              <View style={styles.stumpWood} />
              <View style={styles.stumpWood} />
              <View style={styles.stumpWood} />
            </View>

            {/* Batsman Avatar */}
            <View style={styles.batsmanNode}>
              <Text style={styles.batsmanEmoji}>🏏</Text>
              <View style={styles.laserRay} />
            </View>

            <View style={styles.stumpsBottom}>
              <View style={styles.stumpWood} />
              <View style={styles.stumpWood} />
              <View style={styles.stumpWood} />
            </View>
            <View style={styles.creaseLineBottom} />
          </View>

          {/* Dynamic Laser Direction Arrow */}
          <View style={styles.targetCorridor}>
            <Text style={styles.corridorTag}>TARGET: {shotDirectionLabel} ({Math.round(shotDirectionDeg)}°)</Text>
          </View>
        </View>

        {/* Live Perspective Observation */}
        <View style={styles.observationBox}>
          <Text style={styles.observationMetric}>{current.focusMetric}</Text>
          <Text style={styles.observationDesc}>"{current.keyObservation}"</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  headerRow: {
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stadiumIcon: {
    fontSize: 20,
  },
  title: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  cameraRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  cameraBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cameraBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  cameraIconBox: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtnText: {
    color: '#64748b',
    fontSize: 7.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  cameraBtnTextActive: {
    color: '#0284c7',
    fontWeight: '900',
  },
  screenFrame: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  screenHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  screenCameraTag: {
    color: '#0284c7',
    fontSize: 9.5,
    fontWeight: '900',
  },
  screenDescTag: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '600',
  },
  pitchFieldBox: {
    height: 120,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  pitchStrip: {
    width: 60,
    height: '100%',
    backgroundColor: '#fef3c7',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  creaseLineTop: {
    width: 80,
    height: 1.5,
    backgroundColor: '#64748b',
  },
  creaseLineBottom: {
    width: 80,
    height: 1.5,
    backgroundColor: '#64748b',
  },
  stumpsTop: {
    flexDirection: 'row',
    gap: 3,
  },
  stumpsBottom: {
    flexDirection: 'row',
    gap: 3,
  },
  stumpWood: {
    width: 3,
    height: 10,
    backgroundColor: '#f59e0b',
    borderRadius: 1,
  },
  batsmanNode: {
    alignItems: 'center',
  },
  batsmanEmoji: {
    fontSize: 22,
  },
  laserRay: {
    width: 3,
    height: 30,
    backgroundColor: '#10b981',
    borderRadius: 1.5,
    marginTop: -4,
  },
  targetCorridor: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  corridorTag: {
    color: '#15803d',
    fontSize: 8,
    fontWeight: '900',
  },
  observationBox: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 9,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  observationMetric: {
    color: '#15803d',
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 2,
  },
  observationDesc: {
    color: '#334155',
    fontSize: 10.5,
    lineHeight: 14,
    fontStyle: 'italic',
  },
});
