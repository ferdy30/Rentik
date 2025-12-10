/**
 * 🔤 Sistema de Tipografía Rentik
 * Fuente: Poppins
 * Estilo: Amigable, moderna, comunidad
 */

export const typography = {
  // Familia de fuentes
  fonts: {
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semiBold: 'Poppins-SemiBold',
    bold: 'Poppins-Bold',
    extraBold: 'Poppins-ExtraBold',
    black: 'Poppins-Black',
  },

  // Tamaños de texto
  sizes: {
    // Display (pantallas destacadas, splash)
    displayLarge: 40,
    displayMedium: 36,
    displaySmall: 32,

    // Títulos (headers de sección)
    titleLarge: 28,
    titleMedium: 24,
    titleSmall: 20,

    // Encabezados (subtítulos, cards)
    headingLarge: 20,
    headingMedium: 18,
    headingSmall: 16,

    // Cuerpo (texto normal)
    bodyLarge: 16,
    bodyMedium: 15,
    bodySmall: 14,

    // Caption (labels, hints, metadata)
    captionLarge: 14,
    captionMedium: 12,
    captionSmall: 11,

    // Botones
    buttonLarge: 16,
    buttonMedium: 15,
    buttonSmall: 14,
  },

  // Pesos (weights)
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
    black: '900' as const,
  },

  // Letter spacing (espaciado entre letras)
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    relaxed: 0.3,
    wide: 0.5,
    wider: 1,
  },

  // Line height (altura de línea)
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  },
};

/**
 * 🎨 Estilos de texto predefinidos
 * Uso: <Text style={textStyles.h1}>Título</Text>
 */
export const textStyles = {
  // Display (Splash, bienvenida)
  display: {
    fontFamily: typography.fonts.extraBold,
    fontSize: typography.sizes.displayMedium,
    lineHeight: typography.sizes.displayMedium * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Títulos principales
  h1: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.titleLarge,
    lineHeight: typography.sizes.titleLarge * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.normal,
  },

  h2: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.titleMedium,
    lineHeight: typography.sizes.titleMedium * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.normal,
  },

  h3: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.titleSmall,
    lineHeight: typography.sizes.titleSmall * typography.lineHeights.normal,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Subtítulos
  subtitle1: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.headingMedium,
    lineHeight: typography.sizes.headingMedium * typography.lineHeights.normal,
    letterSpacing: typography.letterSpacing.relaxed,
  },

  subtitle2: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.headingSmall,
    lineHeight: typography.sizes.headingSmall * typography.lineHeights.normal,
    letterSpacing: typography.letterSpacing.relaxed,
  },

  // Cuerpo de texto
  body1: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodyLarge,
    lineHeight: typography.sizes.bodyLarge * typography.lineHeights.relaxed,
    letterSpacing: typography.letterSpacing.normal,
  },

  body2: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodyMedium,
    lineHeight: typography.sizes.bodyMedium * typography.lineHeights.relaxed,
    letterSpacing: typography.letterSpacing.normal,
  },

  body3: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodySmall,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.relaxed,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Captions (metadata, hints)
  caption: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.captionMedium,
    lineHeight: typography.sizes.captionMedium * typography.lineHeights.normal,
    letterSpacing: typography.letterSpacing.relaxed,
  },

  captionSmall: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.captionSmall,
    lineHeight: typography.sizes.captionSmall * typography.lineHeights.normal,
    letterSpacing: typography.letterSpacing.wide,
  },

  // Botones
  button: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.buttonLarge,
    lineHeight: typography.sizes.buttonLarge * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.wide,
  },

  buttonSmall: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.buttonSmall,
    lineHeight: typography.sizes.buttonSmall * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.relaxed,
  },

  // Precios (destacados)
  price: {
    fontFamily: typography.fonts.black,
    fontSize: typography.sizes.titleSmall,
    lineHeight: typography.sizes.titleSmall * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.normal,
  },

  priceLarge: {
    fontFamily: typography.fonts.black,
    fontSize: typography.sizes.titleLarge,
    lineHeight: typography.sizes.titleLarge * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Labels de formularios
  label: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.bodySmall,
    lineHeight: typography.sizes.bodySmall * typography.lineHeights.normal,
    letterSpacing: typography.letterSpacing.relaxed,
  },

  // Input text
  input: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.bodyLarge,
    lineHeight: typography.sizes.bodyLarge * typography.lineHeights.normal,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Tab labels
  tab: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.captionMedium,
    lineHeight: typography.sizes.captionMedium * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.wide,
  },

  // Status badges
  badge: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.captionSmall,
    lineHeight: typography.sizes.captionSmall * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.wider,
  },
};

/**
 * 📱 Mapeo de fontWeight a Poppins
 * Para conversión automática
 */
export const weightToFont = {
  '100': typography.fonts.regular, // Thin -> Regular (Poppins no tiene Thin usado)
  '200': typography.fonts.regular, // ExtraLight -> Regular
  '300': typography.fonts.regular, // Light -> Regular
  '400': typography.fonts.regular, // Regular
  '500': typography.fonts.medium,  // Medium
  '600': typography.fonts.semiBold, // SemiBold
  '700': typography.fonts.bold,    // Bold
  '800': typography.fonts.extraBold, // ExtraBold
  '900': typography.fonts.black,   // Black
  'normal': typography.fonts.regular,
  'bold': typography.fonts.bold,
} as const;

/**
 * 🎯 Helper para aplicar tipografía
 * Uso: getFontFamily('600') => 'Poppins-SemiBold'
 */
export const getFontFamily = (weight: string = '400'): string => {
  return weightToFont[weight as keyof typeof weightToFont] || typography.fonts.regular;
};
