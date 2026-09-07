import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { Camera, History, UserRound } from 'lucide-react-native';
import { colors, radii, shadows } from '../theme';

export type TabName = 'RECORD' | 'HISTORY' | 'PROFILE' | 'ANALYSIS';

interface AppBottomNavProps {
  activeTab: string;
  onTabPress: (tab: 'RECORD' | 'HISTORY' | 'PROFILE') => void;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <View style={styles.dockContainer}>
        {/* Tab 1: Coach / Camera */}
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'RECORD' && styles.navItemActive]}
          onPress={() => onTabPress('RECORD')}
          activeOpacity={0.75}
        >
          <Camera
            size={19}
            color={activeTab === 'RECORD' ? colors.primaryForeground : colors.mutedForeground}
            strokeWidth={activeTab === 'RECORD' ? 2.4 : 2}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'RECORD' && styles.navLabelActive,
            ]}
          >
            Coach
          </Text>
        </TouchableOpacity>

        {/* Tab 2: History */}
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'HISTORY' && styles.navItemActive]}
          onPress={() => onTabPress('HISTORY')}
          activeOpacity={0.75}
        >
          <History
            size={19}
            color={activeTab === 'HISTORY' ? colors.primaryForeground : colors.mutedForeground}
            strokeWidth={activeTab === 'HISTORY' ? 2.4 : 2}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'HISTORY' && styles.navLabelActive,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Profile */}
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'PROFILE' && styles.navItemActive]}
          onPress={() => onTabPress('PROFILE')}
          activeOpacity={0.75}
        >
          <UserRound
            size={19}
            color={activeTab === 'PROFILE' ? colors.primaryForeground : colors.mutedForeground}
            strokeWidth={activeTab === 'PROFILE' ? 2.4 : 2}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === 'PROFILE' && styles.navLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 14,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  dockContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 380,
    height: 60,
    backgroundColor: '#ffffff',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.lg,
  },
  navItem: {
    flex: 1,
    height: 48,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginHorizontal: 3,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  navLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.mutedForeground,
    letterSpacing: -0.2,
  },
  navLabelActive: {
    color: colors.primaryForeground,
    fontWeight: '700',
  },
});
