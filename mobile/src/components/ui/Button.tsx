import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radii } from '../../theme';

export type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'accent';

export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

export interface ButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  activeOpacity?: number;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  onPress,
  iconLeft,
  iconRight,
  style,
  textStyle,
  activeOpacity = 0.75,
}) => {
  const isIconOnly = size === 'icon';

  const containerStyles = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.baseText,
    styles[`textSize_${size}`],
    styles[`textVariant_${variant}`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const indicatorColor =
    variant === 'secondary' || variant === 'outline' || variant === 'ghost'
      ? colors.foreground
      : '#ffffff';

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={activeOpacity}
    >
      {loading ? (
        <ActivityIndicator size="small" color={indicatorColor} />
      ) : (
        <View style={styles.contentRow}>
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
          {typeof children === 'string' ? (
            <Text style={textStyles}>{children}</Text>
          ) : (
            children
          )}
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },

  // Sizes
  size_sm: {
    height: 36,
    paddingHorizontal: 12,
  },
  size_default: {
    height: 44,
    paddingHorizontal: 16,
  },
  size_lg: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
  },
  size_icon: {
    width: 42,
    height: 42,
    paddingHorizontal: 0,
    borderRadius: radii.md,
  },

  // Text sizes
  textSize_sm: {
    fontSize: 13,
    fontWeight: '600',
  },
  textSize_default: {
    fontSize: 14,
    fontWeight: '600',
  },
  textSize_lg: {
    fontSize: 15,
    fontWeight: '600',
  },
  textSize_icon: {
    fontSize: 14,
  },

  // Base text
  baseText: {
    letterSpacing: -0.1,
  },

  // Variants
  variant_default: {
    backgroundColor: colors.primary,
  },
  textVariant_default: {
    color: colors.primaryForeground,
  },

  variant_secondary: {
    backgroundColor: colors.secondary,
  },
  textVariant_secondary: {
    color: colors.secondaryForeground,
  },

  variant_outline: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textVariant_outline: {
    color: colors.foreground,
  },

  variant_ghost: {
    backgroundColor: 'transparent',
  },
  textVariant_ghost: {
    color: colors.foreground,
  },

  variant_destructive: {
    backgroundColor: colors.destructive,
  },
  textVariant_destructive: {
    color: '#ffffff',
  },

  variant_accent: {
    backgroundColor: colors.accent,
  },
  textVariant_accent: {
    color: colors.accentForeground,
  },

  // Disabled
  disabled: {
    opacity: 0.5,
  },
  disabledText: {},
});
