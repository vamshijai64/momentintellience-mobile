import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { GlassHomeIcon, GlassHistoryIcon, GlassProfileIcon } from './GlassIcons';

export type TabName = 'RECORD' | 'HISTORY' | 'PROFILE' | 'ANALYSIS';

interface AppBottomNavProps {
  activeTab: string;
  onTabPress: (tab: 'RECORD' | 'HISTORY' | 'PROFILE') => void;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.floatingWrapper}>
      <View style={styles.glassContainer}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'RECORD' && styles.navItemActive]}
          onPress={() => onTabPress('RECORD')}
          activeOpacity={0.8}
        >
          <GlassHomeIcon size={22} active={activeTab === 'RECORD'} />
          <Text style={[styles.navLabel, activeTab === 'RECORD' && styles.navLabelActive]}>
            Coach
          </Text>
          {activeTab === 'RECORD' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'HISTORY' && styles.navItemActive]}
          onPress={() => onTabPress('HISTORY')}
          activeOpacity={0.8}
        >
          <GlassHistoryIcon size={22} active={activeTab === 'HISTORY'} />
          <Text style={[styles.navLabel, activeTab === 'HISTORY' && styles.navLabelActive]}>
            History
          </Text>
          {activeTab === 'HISTORY' && <View style={styles.activeDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'PROFILE' && styles.navItemActive]}
          onPress={() => onTabPress('PROFILE')}
          activeOpacity={0.8}
        >
          <GlassProfileIcon size={22} active={activeTab === 'PROFILE'} />
          <Text style={[styles.navLabel, activeTab === 'PROFILE' && styles.navLabelActive]}>
            Profile
          </Text>
          {activeTab === 'PROFILE' && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  glassContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 420,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navItem: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    marginHorizontal: 4,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  navLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  navLabelActive: {
    color: '#15803d',
    fontWeight: '900',
  },
  activeDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#15803d',
  },
});
