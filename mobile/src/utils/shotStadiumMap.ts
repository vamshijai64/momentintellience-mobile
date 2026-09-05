export type FieldSector =
  | 'THIRD_MAN'
  | 'POINT'
  | 'COVER'
  | 'MID_OFF'
  | 'LONG_OFF'
  | 'STRAIGHT'
  | 'LONG_ON'
  | 'MID_ON'
  | 'MID_WICKET'
  | 'SQUARE_LEG'
  | 'FINE_LEG';

export type CameraAngle = 'BOWLER' | 'SQUARE_LEG' | 'GULLY' | 'BIRDS_EYE';

export interface SectorInfo {
  id: FieldSector;
  label: string;
  shortLabel: string;
  degMin: number;
  degMax: number;
  idealDeg: number;
  side: 'OFF' | 'LEG' | 'STRAIGHT';
  coachingTip: string;
}

export interface ShotStadiumProfile {
  matchKeys: string[];
  defaultLabel: string;
  defaultDeg: number;
  sectorId: FieldSector;
  cameras: Record<
    CameraAngle,
    {
      perspectiveDesc: string;
      keyObservation: string;
      focusMetric: string;
    }
  >;
}

/** Field sectors on the wagon wheel (0° = Point / third-man side, 90° = straight, 180° = fine leg). */
export const FIELD_SECTORS: SectorInfo[] = [
  {
    id: 'THIRD_MAN',
    label: 'Third Man',
    shortLabel: '3rd Man',
    degMin: 0,
    degMax: 20,
    idealDeg: 12,
    side: 'OFF',
    coachingTip: 'Late cut / edge zone — keep bat soft and angled down.',
  },
  {
    id: 'POINT',
    label: 'Point',
    shortLabel: 'Point',
    degMin: 20,
    degMax: 40,
    idealDeg: 30,
    side: 'OFF',
    coachingTip: 'Cut / square drive corridor — chop down on top of the bounce.',
  },
  {
    id: 'COVER',
    label: 'Cover',
    shortLabel: 'Cover',
    degMin: 40,
    degMax: 65,
    idealDeg: 50,
    side: 'OFF',
    coachingTip: 'Classic cover-drive sector — high front elbow, bat face full.',
  },
  {
    id: 'MID_OFF',
    label: 'Mid-Off',
    shortLabel: 'Mid-Off',
    degMin: 65,
    degMax: 75,
    idealDeg: 70,
    side: 'OFF',
    coachingTip: 'Off-drive line — present the maker’s name straight past mid-off.',
  },
  {
    id: 'LONG_OFF',
    label: 'Long Off',
    shortLabel: 'Long Off',
    degMin: 75,
    degMax: 86,
    idealDeg: 80,
    side: 'OFF',
    coachingTip: 'Long-off corridor — keep the bat face full and drive under the eyes.',
  },
  {
    id: 'STRAIGHT',
    label: 'Straight',
    shortLabel: 'Straight',
    degMin: 86,
    degMax: 94,
    idealDeg: 90,
    side: 'STRAIGHT',
    coachingTip: 'Straight-drive corridor — vertical bat, top-hand control.',
  },
  {
    id: 'LONG_ON',
    label: 'Long On',
    shortLabel: 'Long On',
    degMin: 94,
    degMax: 105,
    idealDeg: 100,
    side: 'LEG',
    coachingTip: 'Long-on corridor — head still, wrists late through the on-side.',
  },
  {
    id: 'MID_ON',
    label: 'Mid-On',
    shortLabel: 'Mid-On',
    degMin: 105,
    degMax: 115,
    idealDeg: 110,
    side: 'LEG',
    coachingTip: 'On-drive line — head over front pad, wrists late.',
  },
  {
    id: 'MID_WICKET',
    label: 'Mid-Wicket',
    shortLabel: 'Mid-Wkt',
    degMin: 115,
    degMax: 140,
    idealDeg: 128,
    side: 'LEG',
    coachingTip: 'Flick / whip zone — close the face only at contact.',
  },
  {
    id: 'SQUARE_LEG',
    label: 'Square Leg',
    shortLabel: 'Sq Leg',
    degMin: 140,
    degMax: 160,
    idealDeg: 150,
    side: 'LEG',
    coachingTip: 'Pull / square-leg sector — roll wrists to keep it down.',
  },
  {
    id: 'FINE_LEG',
    label: 'Fine Leg',
    shortLabel: 'Fine Leg',
    degMin: 160,
    degMax: 180,
    idealDeg: 170,
    side: 'LEG',
    coachingTip: 'Glance / hook fine — bat face slightly closed, soft hands.',
  },
];

const SHOT_PROFILES: ShotStadiumProfile[] = [
  {
    matchKeys: ['COVER DRIVE', 'COVER'],
    defaultLabel: 'COVER',
    defaultDeg: 50,
    sectorId: 'COVER',
    cameras: {
      BOWLER: {
        perspectiveDesc: 'Front-on view down the pitch corridor',
        keyObservation:
          'Head stayed inside the off-stump line; bat swung straight through the cover arc.',
        focusMetric: 'Corridor Alignment',
      },
      SQUARE_LEG: {
        perspectiveDesc: 'Side-on biomechanical depth view',
        keyObservation:
          'Head locked over the front knee at impact with a full forward stride.',
        focusMetric: 'Head-to-Knee Stack',
      },
      GULLY: {
        perspectiveDesc: 'Rear 45° edge & bat-face angle view',
        keyObservation:
          'Full vertical bat face presented; stroke stayed grounded through cover.',
        focusMetric: 'Edge Risk',
      },
      BIRDS_EYE: {
        perspectiveDesc: 'Top-down stadium field & wagon wheel',
        keyObservation: 'Ball accelerated through the Cover boundary on the off-side.',
        focusMetric: 'Wagon Sector',
      },
    },
  },
  {
    matchKeys: ['STRAIGHT DRIVE', 'ON DRIVE', 'OFF DRIVE'],
    defaultLabel: 'STRAIGHT',
    defaultDeg: 90,
    sectorId: 'STRAIGHT',
    cameras: {
      BOWLER: {
        perspectiveDesc: 'Front-on view down the pitch corridor',
        keyObservation:
          'Bat presented the maker’s name straight back past the bowler’s ankles.',
        focusMetric: 'Straight-Line Control',
      },
      SQUARE_LEG: {
        perspectiveDesc: 'Side-on biomechanical depth view',
        keyObservation: 'Front knee bent under the head; pendulum swing stayed vertical.',
        focusMetric: 'Vertical Swing Plane',
      },
      GULLY: {
        perspectiveDesc: 'Rear 45° edge & bat-face angle view',
        keyObservation: 'No cross-bat angle — full face returned down the ground.',
        focusMetric: 'Face Presentation',
      },
      BIRDS_EYE: {
        perspectiveDesc: 'Top-down stadium field & wagon wheel',
        keyObservation: 'Trajectory locked through the straight mid-off / mid-on corridor.',
        focusMetric: 'Wagon Sector',
      },
    },
  },
  {
    matchKeys: ['CUT SHOT', 'CUT', 'SQUARE CUT', 'LATE CUT'],
    defaultLabel: 'POINT',
    defaultDeg: 30,
    sectorId: 'POINT',
    cameras: {
      BOWLER: {
        perspectiveDesc: 'Front-on width & contact view',
        keyObservation: 'Waited for width outside off; chopped down onto the top of the bounce.',
        focusMetric: 'Width Discipline',
      },
      SQUARE_LEG: {
        perspectiveDesc: 'Side-on back-foot depth view',
        keyObservation: 'Weight transferred onto a tall back foot with a steep downward bat path.',
        focusMetric: 'Back-Foot Base',
      },
      GULLY: {
        perspectiveDesc: 'Rear 45° edge & bat-face angle view',
        keyObservation: 'Bat angled down over the ball — reduced sky chance to point/gully.',
        focusMetric: 'Chop Angle',
      },
      BIRDS_EYE: {
        perspectiveDesc: 'Top-down stadium field & wagon wheel',
        keyObservation: 'Ball exited square through Point toward the off-side boundary.',
        focusMetric: 'Wagon Sector',
      },
    },
  },
  {
    matchKeys: ['PULL SHOT', 'PULL', 'HOOK'],
    defaultLabel: 'SQUARE LEG',
    defaultDeg: 150,
    sectorId: 'SQUARE_LEG',
    cameras: {
      BOWLER: {
        perspectiveDesc: 'Front-on short-ball pick-up view',
        keyObservation: 'Got onto the back foot early and attacked the rising length.',
        focusMetric: 'Length Read',
      },
      SQUARE_LEG: {
        perspectiveDesc: 'Side-on horizontal swing view',
        keyObservation: 'Arms extended through a horizontal plane with wrists rolling at contact.',
        focusMetric: 'Wrist Roll',
      },
      GULLY: {
        perspectiveDesc: 'Rear 45° bat-path view',
        keyObservation: 'Bat stayed on top of the ball — reduced top-edge risk to fine leg.',
        focusMetric: 'Top-Edge Risk',
      },
      BIRDS_EYE: {
        perspectiveDesc: 'Top-down stadium field & wagon wheel',
        keyObservation: 'Power channeled square/fine through the leg-side pull sector.',
        focusMetric: 'Wagon Sector',
      },
    },
  },
  {
    matchKeys: ['FLICK', 'WHIP', 'LEG GLANCE', 'GLANCE'],
    defaultLabel: 'MID-WICKET',
    defaultDeg: 128,
    sectorId: 'MID_WICKET',
    cameras: {
      BOWLER: {
        perspectiveDesc: 'Front-on pad-line view',
        keyObservation: 'Let the ball come under the eyes before closing the face late.',
        focusMetric: 'Late Face Close',
      },
      SQUARE_LEG: {
        perspectiveDesc: 'Side-on wrist-snap view',
        keyObservation: 'Front hip cleared just enough; wrists snapped through mid-wicket.',
        focusMetric: 'Hip Clearance',
      },
      GULLY: {
        perspectiveDesc: 'Rear 45° leading-edge check',
        keyObservation: 'Played down the line first — no early across-the-line leading edge.',
        focusMetric: 'Leading-Edge Risk',
      },
      BIRDS_EYE: {
        perspectiveDesc: 'Top-down stadium field & wagon wheel',
        keyObservation: 'Ball exited through Mid-Wicket on a controlled leg-side arc.',
        focusMetric: 'Wagon Sector',
      },
    },
  },
  {
    matchKeys: ['SWEEP', 'SLOG SWEEP'],
    defaultLabel: 'SQUARE LEG',
    defaultDeg: 145,
    sectorId: 'SQUARE_LEG',
    cameras: {
      BOWLER: {
        perspectiveDesc: 'Front-on sweep contact view',
        keyObservation: 'Got low early and met the ball under the eyes on the full/half-volley.',
        focusMetric: 'Base Height',
      },
      SQUARE_LEG: {
        perspectiveDesc: 'Side-on sweep plane view',
        keyObservation: 'Bat swept under a stable head with a horizontal finish to square leg.',
        focusMetric: 'Sweep Plane',
      },
      GULLY: {
        perspectiveDesc: 'Rear 45° miss / top-edge check',
        keyObservation: 'Body stayed beside the ball — reduced top-edge chance to fine leg.',
        focusMetric: 'Miss Risk',
      },
      BIRDS_EYE: {
        perspectiveDesc: 'Top-down stadium field & wagon wheel',
        keyObservation: 'Trajectory locked into the square-leg / mid-wicket sweep sector.',
        focusMetric: 'Wagon Sector',
      },
    },
  },
];

const FALLBACK_PROFILE: ShotStadiumProfile = SHOT_PROFILES[0];

export function normalizeShotKey(shotType?: string): string {
  return (shotType || '').toUpperCase().trim();
}

export function resolveShotStadiumProfile(shotType?: string): ShotStadiumProfile {
  const key = normalizeShotKey(shotType);
  if (!key) return FALLBACK_PROFILE;

  const exact = SHOT_PROFILES.find((p) => p.matchKeys.some((k) => key === k || key.includes(k)));
  if (exact) return exact;

  return FALLBACK_PROFILE;
}

export function resolveSectorFromDeg(deg: number): SectorInfo {
  const clamped = Math.max(0, Math.min(180, deg));
  const found = FIELD_SECTORS.find((s) => clamped >= s.degMin && clamped < s.degMax);
  if (found) return found;
  return FIELD_SECTORS[FIELD_SECTORS.length - 1];
}

const LABEL_ALIASES: Record<string, FieldSector> = {
  'THIRD MAN': 'THIRD_MAN',
  '3RD MAN': 'THIRD_MAN',
  POINT: 'POINT',
  COVER: 'COVER',
  'EXTRA COVER': 'COVER',
  'MID OFF': 'MID_OFF',
  'MID-OFF': 'MID_OFF',
  'LONG OFF': 'LONG_OFF',
  'LONG-OFF': 'LONG_OFF',
  STRAIGHT: 'STRAIGHT',
  'LONG ON': 'LONG_ON',
  'LONG-ON': 'LONG_ON',
  'MID ON': 'MID_ON',
  'MID-ON': 'MID_ON',
  'MID WICKET': 'MID_WICKET',
  'MID-WICKET': 'MID_WICKET',
  MIDWICKET: 'MID_WICKET',
  'SQUARE LEG': 'SQUARE_LEG',
  'SQ LEG': 'SQUARE_LEG',
  'FINE LEG': 'FINE_LEG',
};

function resolveSectorFromLabel(label?: string): SectorInfo | null {
  if (!label) return null;
  const key = label.toUpperCase().replace(/_/g, ' ').trim();
  const id = LABEL_ALIASES[key];
  if (!id) return null;
  return FIELD_SECTORS.find((s) => s.id === id) || null;
}

export function resolveStadiumShotContext(opts: {
  shotType?: string;
  shotDirectionLabel?: string;
  shotDirectionDeg?: number;
}) {
  const profile = resolveShotStadiumProfile(opts.shotType);
  const hasDeg = typeof opts.shotDirectionDeg === 'number' && !Number.isNaN(opts.shotDirectionDeg);
  const rawDeg = hasDeg
    ? Math.max(0, Math.min(180, opts.shotDirectionDeg as number))
    : profile.defaultDeg;

  // Round once so SECTOR / EXIT / labels never disagree (e.g. 81.6 vs Mid-Off).
  const deg = Math.round(rawDeg);

  const labelSector = resolveSectorFromLabel(opts.shotDirectionLabel);
  const degSector = resolveSectorFromDeg(deg);

  // Degrees always win for naming so SECTOR / EXIT / target never disagree.
  // API label is only used when angle is missing.
  const sector = hasDeg ? degSector : labelSector || degSector;
  const label = sector.label;
  const side = sector.side;

  return {
    profile,
    sector,
    deg: hasDeg ? deg : sector.idealDeg,
    label,
    side,
    sideLabel: side === 'OFF' ? 'Off-Side' : side === 'LEG' ? 'Leg-Side' : 'Straight',
  };
}

export function buildCameraFocusMetric(
  angle: CameraAngle,
  profile: ShotStadiumProfile,
  label: string,
  deg: number
): string {
  const base = profile.cameras[angle].focusMetric;
  if (angle === 'BIRDS_EYE') {
    return `${base}: ${label} (${Math.round(deg)}°)`;
  }
  if (angle === 'GULLY') {
    return `${base}: checked for ${label}`;
  }
  return `${base}: ${label} line`;
}

/** Pitch / wagon beam math: 0°=left(Point), 90°=down(Straight), 180°=right(Fine Leg). */
export function shotExitVector(deg: number, radius: number) {
  const angleRad = ((deg - 90) * Math.PI) / 180;
  const x = Math.sin(angleRad) * radius;
  const y = Math.cos(angleRad) * radius;
  const rotationDeg = Math.atan2(y, x) * (180 / Math.PI);
  return { x, y, rotationDeg };
}
