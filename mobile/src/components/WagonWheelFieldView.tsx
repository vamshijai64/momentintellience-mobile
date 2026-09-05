import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { CompassRadarIcon, ImpactPointIcon, GlassIconBadge } from './icons/AppIcons';
import { WagonStadiumGround } from './StadiumGroundVisual';
import {
  FIELD_SECTORS,
  FieldSector,
  resolveStadiumShotContext,
} from '../utils/shotStadiumMap';

interface WagonWheelFieldViewProps {
  shotDirectionDeg?: number;
  shotDirectionLabel?: string;
  shotType?: string;
}

const LABEL_STYLE_BY_SECTOR: Record<FieldSector, object> = {
  THIRD_MAN: { top: 36, left: 18 },
  POINT: { top: 86, left: 12 },
  COVER: { top: 138, left: 16 },
  MID_OFF: { bottom: 44, left: 42 },
  LONG_OFF: { bottom: 20, left: 58 },
  STRAIGHT: { bottom: 8, alignSelf: 'center' },
  LONG_ON: { bottom: 20, right: 58 },
  MID_ON: { bottom: 44, right: 42 },
  MID_WICKET: { top: 138, right: 16 },
  SQUARE_LEG: { top: 86, right: 12 },
  FINE_LEG: { top: 36, right: 18 },
};

export const WagonWheelFieldView: React.FC<WagonWheelFieldViewProps> = ({
  shotDirectionDeg,
  shotDirectionLabel,
  shotType = 'COVER DRIVE',
}) => {
  const ctx = useMemo(
    () =>
      resolveStadiumShotContext({
        shotType,
        shotDirectionLabel,
        shotDirectionDeg,
      }),
    [shotType, shotDirectionLabel, shotDirectionDeg]
  );

  const labels = FIELD_SECTORS.map((sector) => ({
    id: sector.id,
    shortLabel: sector.shortLabel,
    style: LABEL_STYLE_BY_SECTOR[sector.id],
    active: sector.id === ctx.sector.id,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <GlassIconBadge bg="#e0f2fe" borderColor="#bae6fd" size={36}>
            <CompassRadarIcon size={20} color="#0284c7" />
          </GlassIconBadge>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>360° WAGON WHEEL</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {ctx.label} · {Math.round(ctx.deg)}° · {ctx.sideLabel}
            </Text>
          </View>
        </View>
        <View style={styles.badgeBox}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {shotType}
          </Text>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <WagonStadiumGround
          deg={ctx.deg}
          side={ctx.side}
          labels={labels}
          size={268}
        />
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4ade80' }]} />
          <Text style={styles.legendText}>Off-side</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#38bdf8' }]} />
          <Text style={styles.legendText}>Straight</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#fbbf24' }]} />
          <Text style={styles.legendText}>Leg-side</Text>
        </View>
      </View>

      <View style={styles.footerNote}>
        <View style={styles.footerRow}>
          <ImpactPointIcon size={14} color="#0284c7" />
          <Text style={styles.footerText}>
            <Text style={styles.footerStrong}>
              {' '}
              {ctx.sideLabel} · {ctx.sector.label}:
            </Text>{' '}
            {ctx.sector.coachingTip}
          </Text>
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
    marginVertical: 10,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    color: '#0c4a6e',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  subtitle: {
    color: '#0f172a',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 2,
  },
  badgeBox: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bae6fd',
    maxWidth: 120,
  },
  badgeText: {
    color: '#0369a1',
    fontSize: 10,
    fontWeight: '800',
  },
  fieldContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  footerNote: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  footerText: {
    color: '#64748b',
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },
  footerStrong: {
    color: '#0284c7',
    fontWeight: '800',
  },
});
