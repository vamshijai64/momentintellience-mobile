import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Optional bundled pro clips (Kohli, academy, etc.).
 *
 * 1. Put an .mp4 in:
 *    mobile/assets/pro/kohli_cover_drive.mp4
 * 2. Uncomment the matching line below.
 *
 * Do not check in copyrighted TV footage you do not have rights to.
 * Use a clip you recorded, licensed, or that is yours to use for coaching.
 */
export const BUNDLED_PRO_VIDEOS: Record<string, number | undefined> = {
  // 'COVER DRIVE': require('../../assets/pro/kohli_cover_drive.mp4'),
  // 'PULL SHOT': require('../../assets/pro/kohli_pull.mp4'),
  // ALL: require('../../assets/pro/kohli_default.mp4'),
};

const STORAGE_PREFIX = 'pro_ref_video:';

export function shotStorageKey(shotType?: string): string {
  const key = (shotType || 'ALL').toUpperCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return `${STORAGE_PREFIX}${key || 'ALL'}`;
}

export async function loadSavedProVideoUri(shotType?: string): Promise<string | null> {
  const exact = await AsyncStorage.getItem(shotStorageKey(shotType));
  if (exact) return exact;
  return AsyncStorage.getItem(shotStorageKey('ALL'));
}

export async function saveProVideoUri(shotType: string | undefined, uri: string): Promise<void> {
  await AsyncStorage.setItem(shotStorageKey(shotType), uri);
  await AsyncStorage.setItem(shotStorageKey('ALL'), uri);
}

export async function clearProVideoUri(shotType?: string): Promise<void> {
  await AsyncStorage.removeItem(shotStorageKey(shotType));
  await AsyncStorage.removeItem(shotStorageKey('ALL'));
}
