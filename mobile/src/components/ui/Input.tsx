import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { colors, radii } from '../../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  iconLeft,
  iconRight,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
        ]}
      >
        {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={colors.mutedForeground}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.input,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderColor: colors.ring,
    borderWidth: 1.5,
  },
  inputWrapperError: {
    borderColor: colors.destructive,
  },
  iconLeft: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRight: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  helperText: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.destructive,
    marginTop: 4,
    fontWeight: '500',
  },
});
