import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { colors, radii, shadows } from '../../theme';

interface CardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

interface CardHeaderProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => {
  return <View style={[styles.cardHeader, style]}>{children}</View>;
};

interface CardTitleProps {
  children?: React.ReactNode;
  style?: TextStyle;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, style }) => {
  return <Text style={[styles.cardTitle, style]}>{children}</Text>;
};

interface CardDescriptionProps {
  children?: React.ReactNode;
  style?: TextStyle;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, style }) => {
  return <Text style={[styles.cardDescription, style]}>{children}</Text>;
};

interface CardContentProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => {
  return <View style={[styles.cardContent, style]}>{children}</View>;
};

interface CardFooterProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => {
  return <View style={[styles.cardFooter, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    ...shadows.sm,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginTop: 3,
  },
  cardContent: {
    // Body layout wrapper
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
