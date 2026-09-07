import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radii, shadows } from '../../theme';

interface TabsListProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const TabsList: React.FC<TabsListProps> = ({ children, style }) => {
  return <View style={[styles.list, style]}>{children}</View>;
};

interface TabsTriggerProps {
  value: string;
  activeValue: string;
  onPress: (value: string) => void;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  activeValue,
  onPress,
  children,
  style,
  textStyle,
}) => {
  const isActive = value === activeValue;

  return (
    <TouchableOpacity
      style={[styles.trigger, isActive && styles.triggerActive, style]}
      onPress={() => onPress(value)}
      activeOpacity={0.8}
    >
      {typeof children === 'string' ? (
        <Text
          style={[
            styles.triggerText,
            isActive && styles.triggerTextActive,
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    padding: 3,
    borderRadius: radii.md,
  },
  trigger: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerActive: {
    backgroundColor: colors.card,
    ...shadows.sm,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  triggerTextActive: {
    color: colors.foreground,
    fontWeight: '600',
  },
});
