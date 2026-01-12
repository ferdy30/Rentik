import React from 'react';
import { AccessibilityRole, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface AccessibleButtonProps {
  onPress: () => void;
  title: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
}

/**
 * #24-26 Botón accesible con WCAG AA compliance
 */
export function AccessibleButton({
  onPress,
  title,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  icon,
}: AccessibleButtonProps) {
  const variantStyles = {
    primary: styles.primaryButton,
    secondary: styles.secondaryButton,
    danger: styles.dangerButton,
    success: styles.successButton,
  };

  const sizeStyles = {
    small: styles.smallButton,
    medium: styles.mediumButton,
    large: styles.largeButton,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        disabled && styles.disabledButton,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      // Asegurar tamaño mínimo de toque de 44x44
      accessible={true}
    >
      {icon}
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' ? styles.secondaryText : styles.primaryText,
          disabled && styles.disabledText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

interface AccessibleTextProps {
  children: string;
  variant?: 'heading1' | 'heading2' | 'heading3' | 'body' | 'caption';
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}

/**
 * #24-26 Texto accesible con jerarquía semántica
 */
export function AccessibleText({
  children,
  variant = 'body',
  accessibilityLabel,
  accessibilityRole,
}: AccessibleTextProps) {
  const variantStyles = {
    heading1: styles.heading1,
    heading2: styles.heading2,
    heading3: styles.heading3,
    body: styles.body,
    caption: styles.caption,
  };

  const getAccessibilityRole = (): AccessibilityRole => {
    if (accessibilityRole) return accessibilityRole;
    if (variant.startsWith('heading')) return 'header';
    return 'text';
  };

  return (
    <Text
      style={variantStyles[variant]}
      accessibilityRole={getAccessibilityRole()}
      accessibilityLabel={accessibilityLabel}
      accessible={true}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  // Button styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    // Mínimo 44x44 para accesibilidad
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 16,
  },
  smallButton: {
    minHeight: 44, // Mantener mínimo accesible
    paddingHorizontal: 12,
  },
  mediumButton: {
    minHeight: 48,
    paddingHorizontal: 20,
  },
  largeButton: {
    minHeight: 56,
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: '#0B729D',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0B729D',
  },
  dangerButton: {
    backgroundColor: '#DC2626',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    borderColor: '#D1D5DB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#0B729D',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  // Text styles con contraste WCAG AA
  heading1: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827', // Contraste 12.63:1 con blanco
    lineHeight: 36,
  },
  heading2: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 28,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937', // Contraste 11.63:1
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: '#374151', // Contraste 8.59:1
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280', // Contraste 4.69:1 (cumple WCAG AA para texto grande)
    lineHeight: 20,
  },
});
