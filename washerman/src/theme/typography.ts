import { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
} as const;

export const FontSize = {
  xs: 11, sm: 12, base: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32, display: 48,
} as const;

export const Typography = {
  displayBold: { fontFamily: FontFamily.bold, fontSize: FontSize.display } as TextStyle,
  h1: { fontFamily: FontFamily.bold, fontSize: FontSize.xxxl } as TextStyle,
  h2: { fontFamily: FontFamily.bold, fontSize: FontSize.xxl } as TextStyle,
  h3: { fontFamily: FontFamily.bold, fontSize: FontSize.lg } as TextStyle,
  h4: { fontFamily: FontFamily.bold, fontSize: FontSize.md } as TextStyle,
  bodyLarge: { fontFamily: FontFamily.regular, fontSize: FontSize.md } as TextStyle,
  body: { fontFamily: FontFamily.regular, fontSize: FontSize.base } as TextStyle,
  bodyMedium: { fontFamily: FontFamily.medium, fontSize: FontSize.base } as TextStyle,
  caption: { fontFamily: FontFamily.regular, fontSize: FontSize.sm } as TextStyle,
  captionMedium: { fontFamily: FontFamily.medium, fontSize: FontSize.sm } as TextStyle,
  tiny: { fontFamily: FontFamily.regular, fontSize: FontSize.xs } as TextStyle,
  button: { fontFamily: FontFamily.bold, fontSize: FontSize.md } as TextStyle,
} as const;
