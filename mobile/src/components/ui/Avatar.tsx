import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ImageSourcePropType,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../theme';

export type AvatarSize = 'sm' | 'default' | 'lg' | 'xl';

export interface AvatarProps {
  source?: ImageSourcePropType;
  fallbackText?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  default: 44,
  lg: 60,
  xl: 80,
};

const fontMap: Record<AvatarSize, number> = {
  sm: 12,
  default: 16,
  lg: 22,
  xl: 28,
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  fallbackText = '?',
  size = 'default',
  style,
  textStyle,
}) => {
  const dimension = sizeMap[size];
  const fontSize = fontMap[size];

  return (
    <View
      style={[
        styles.avatar,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={source}
          style={{
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.fallback, { fontSize }, textStyle]}>
          {fallbackText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  fallback: {
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: 0.5,
  },
});
