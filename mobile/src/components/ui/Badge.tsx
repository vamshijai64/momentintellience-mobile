import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { colors, radii } from '../../theme';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'accent';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  dot = false,
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.badge, styles[`variant_${variant}`], style]}>
      {dot && <View style={[styles.dot, styles[`dot_${variant}`]]} />}
      {typeof children === 'string' ? (
        <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // Variants
  variant_default: {
    backgroundColor: colors.primary,
  },
  text_default: {
    color: colors.primaryForeground,
  },
  dot_default: {
    backgroundColor: colors.primaryForeground,
  },

  variant_secondary: {
    backgroundColor: colors.secondary,
  },
  text_secondary: {
    color: colors.secondaryForeground,
  },
  dot_secondary: {
    backgroundColor: colors.mutedForeground,
  },

  variant_outline: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  text_outline: {
    color: colors.foreground,
  },
  dot_outline: {
    backgroundColor: colors.mutedForeground,
  },

  variant_success: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successBorder,
  },
  text_success: {
    color: colors.successText,
  },
  dot_success: {
    backgroundColor: colors.success,
  },

  variant_warning: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningBorder,
  },
  text_warning: {
    color: colors.warningText,
  },
  dot_warning: {
    backgroundColor: colors.warning,
  },

  variant_destructive: {
    backgroundColor: colors.destructiveSoft,
    borderColor: colors.destructiveBorder,
  },
  text_destructive: {
    color: colors.destructiveText,
  },
  dot_destructive: {
    backgroundColor: colors.destructive,
  },

  variant_accent: {
    backgroundColor: colors.accentSoft,
    borderColor: '#bae6fd',
  },
  text_accent: {
    color: '#0369a1',
  },
  dot_accent: {
    backgroundColor: colors.accent,
  },
});
