import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';

export type TabName = 'RECORD' | 'HISTORY' | 'PROFILE' | 'ANALYSIS';

interface AppBottomNavProps {
  activeTab: string;
  onTabPress: (tab: 'RECORD' | 'HISTORY' | 'PROFILE') => void;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.navBar}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onTabPress('RECORD')}
        activeOpacity={0.8}
      >
        <Text style={[styles.navIcon, activeTab === 'RECORD' && styles.navIconActive]}>
          🏠
        </Text>
        <Text style={[styles.navLabel, activeTab === 'RECORD' && styles.navLabelActive]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onTabPress('HISTORY')}
        activeOpacity={0.8}
      >
        <Text style={[styles.navIcon, activeTab === 'HISTORY' && styles.navIconActive]}>
          📊
        </Text>
        <Text style={[styles.navLabel, activeTab === 'HISTORY' && styles.navLabelActive]}>
          History
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onTabPress('PROFILE')}
        activeOpacity={0.8}
      >
        <Text style={[styles.navIcon, activeTab === 'PROFILE' && styles.navIconActive]}>
          👤
        </Text>
        <Text style={[styles.navLabel, activeTab === 'PROFILE' && styles.navLabelActive]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 76 : 64,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingBottom: Platform.OS === 'ios' ? 18 : 6,
    paddingTop: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1.0,
    transform: [{ scale: 1.15 }],
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  navLabelActive: {
    color: '#0d9488',
    fontWeight: '800',
  },
});
