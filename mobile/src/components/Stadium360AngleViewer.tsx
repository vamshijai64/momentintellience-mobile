import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import {
  StadiumCameraIcon,
  ArmFlexIcon,
  CompassArenaIcon,
  CompassRadarIcon,
  GlassIconBadge,
} from './icons/AppIcons';
import { StadiumPitchGround } from './StadiumGroundVisual';
import {
  CameraAngle,
  buildCameraFocusMetric,
  resolveStadiumShotContext,
} from '../utils/shotStadiumMap';

const CAMERA_META: Record<
  CameraAngle,
  { name: string; shortName: string }
> = {
  BOWLER: { name: "BOWLER'S END", shortName: 'BOWLER' },
  SQUARE_LEG: { name: 'SQUARE LEG', shortName: 'SQ LEG' },
  GULLY: { name: 'SLIPS & GULLY', shortName: 'GULLY' },
  BIRDS_EYE: { name: "BIRD'S EYE 360°", shortName: '360°' },
};

const renderAngleIcon = (key: CameraAngle, isSelected: boolean) => {
  const color = isSelected ? '#0369a1' : '#64748b';
  switch (key) {
    case 'BOWLER':
      return <StadiumCameraIcon size={15} color={color} />;
    case 'SQUARE_LEG':
      return <ArmFlexIcon size={15} color={color} />;
    case 'GULLY':
      return <CompassArenaIcon size={15} color={color} />;
    case 'BIRDS_EYE':
      return <CompassRadarIcon size={15} color={color} />;
  }
};

interface Stadium360AngleViewerProps {
  shotType?: string;
  shotDirectionLabel?: string;
  shotDirectionDeg?: number;
}

export const Stadium360AngleViewer: React.FC<Stadium360AngleViewerProps> = ({
  shotType = 'COVER DRIVE',
  shotDirectionLabel,
  shotDirectionDeg,
}) => {
  const [selectedAngle, setSelectedAngle] = useState<CameraAngle>('BOWLER');

  const ctx = useMemo(
    () =>
      resolveStadiumShotContext({
        shotType,
        shotDirectionLabel,
        shotDirectionDeg,
      }),
    [shotType, shotDirectionLabel, shotDirectionDeg]
  );

  const cameraCopy = ctx.profile.cameras[selectedAngle];
  const focusMetric = buildCameraFocusMetric(
    selectedAngle,
    ctx.profile,
    ctx.label,
    ctx.deg
  );

  const observationByAngle = (() => {
    if (selectedAngle === 'BIRDS_EYE') {
      return `Ball exited through ${ctx.label} at ${ctx.deg}° on the ${ctx.sideLabel.toLowerCase()}.`;
    }
    if (selectedAngle === 'BOWLER' && ctx.sector.id !== 'STRAIGHT') {
      return `Drive finished toward ${ctx.label} (${ctx.deg}°) rather than dead straight — bat face stayed full through contact.`;
    }
    return cameraCopy.keyObservation;
  })();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <GlassIconBadge bg="#e0f2fe" borderColor="#bae6fd" size={36}>
            <CompassArenaIcon size={20} color="#0284c7" />
          </GlassIconBadge>
          <View style={styles.titleTextCol}>
            <Text style={styles.title}>360° VIRTUAL STADIUM</Text>
            <Text style={styles.subtitle}>Broadcast ground · camera angles for this shot</Text>
          </View>
        </View>
        <View style={styles.shotBadge}>
          <Text style={styles.shotBadgeText} numberOfLines={1}>
            {shotType}
          </Text>
        </View>
      </View>

      <View style={styles.metaStrip}>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipLabel}>SECTOR</Text>
          <Text style={styles.metaChipValue}>{ctx.sector.label}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaChip}>
          <Text style={styles.metaChipLabel}>EXIT</Text>
          <Text style={styles.metaChipValue}>{Math.round(ctx.deg)}°</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaChip}>
          <Text style={styles.metaChipLabel}>SIDE</Text>
          <Text style={styles.metaChipValue}>{ctx.sideLabel}</Text>
        </View>
      </View>

      <View style={styles.cameraRow}>
        {(Object.keys(CAMERA_META) as CameraAngle[]).map((angleKey) => {
          const cfg = CAMERA_META[angleKey];
          const isSelected = selectedAngle === angleKey;
          return (
            <TouchableOpacity
              key={angleKey}
              style={[styles.cameraBtn, isSelected && styles.cameraBtnActive]}
              onPress={() => setSelectedAngle(angleKey)}
              activeOpacity={0.85}
            >
              <View style={[styles.cameraIconBox, isSelected && styles.cameraIconBoxActive]}>
                {renderAngleIcon(angleKey, isSelected)}
              </View>
              <Text style={[styles.cameraBtnText, isSelected && styles.cameraBtnTextActive]}>
                {cfg.shortName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.screenFrame}>
        <View style={styles.screenHeader}>
          <View style={styles.screenHeaderLeft}>
            {renderAngleIcon(selectedAngle, true)}
            <Text style={styles.screenCameraTag}>{CAMERA_META[selectedAngle].name}</Text>
          </View>
          <Text style={styles.screenDescTag} numberOfLines={1}>
            {cameraCopy.perspectiveDesc}
          </Text>
        </View>

        <StadiumPitchGround
          deg={ctx.deg}
          label={ctx.label}
          sideLabel={ctx.sideLabel}
          side={ctx.side}
          height={188}
        />

        <View style={styles.observationBox}>
          <Text style={styles.observationMetric}>{focusMetric}</Text>
          <Text style={styles.observationDesc}>"{observationByAngle}"</Text>
          <Text style={styles.observationTip}>{ctx.sector.coachingTip}</Text>
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  titleTextCol: {
    flex: 1,
  },
  title: {
    color: '#0c4a6e',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  shotBadge: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: 120,
  },
  shotBadgeText: {
    color: '#0369a1',
    fontSize: 10,
    fontWeight: '800',
  },
  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  metaChip: {
    flex: 1,
    alignItems: 'center',
  },
  metaChipLabel: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metaChipValue: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  metaDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#e2e8f0',
  },
  cameraRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  cameraBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cameraBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  cameraIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cameraIconBoxActive: {
    borderColor: '#7dd3fc',
    backgroundColor: '#f0f9ff',
  },
  cameraBtnText: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  cameraBtnTextActive: {
    color: '#0369a1',
  },
  screenFrame: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  screenHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  screenCameraTag: {
    color: '#0369a1',
    fontSize: 9.5,
    fontWeight: '900',
  },
  screenDescTag: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  observationBox: {
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 11,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  observationMetric: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 3,
  },
  observationDesc: {
    color: '#334155',
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
  },
  observationTip: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
});
