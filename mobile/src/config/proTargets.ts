/** Textbook joint targets. These are NOT measured from a Kohli / pro clip. */
export function getProTargets(shotType?: string): { elbow: number; knee: number; spine: number } {
  const shot = (shotType || '').toUpperCase();
  if (shot.includes('PULL') || shot.includes('HOOK')) {
    return { elbow: 125, knee: 145, spine: 14 };
  }
  if (shot.includes('CUT')) {
    return { elbow: 118, knee: 148, spine: 10 };
  }
  if (shot.includes('SWEEP')) {
    return { elbow: 110, knee: 125, spine: 16 };
  }
  if (shot.includes('DEFENSIVE') || shot.includes('BLOCK') || shot.includes('LEAVE')) {
    return { elbow: 128, knee: 140, spine: 8 };
  }
  if (shot.includes('STRAIGHT') || shot.includes('ON DRIVE')) {
    return { elbow: 138, knee: 136, spine: 10 };
  }
  // Cover / lofted / default
  return { elbow: 140, knee: 135, spine: 12 };
}
