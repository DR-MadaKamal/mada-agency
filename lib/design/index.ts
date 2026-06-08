export { Text, Caption, Body, Heading, Title } from './primitives';
export type { TextVariant } from './primitives';
export { Button } from './primitives';
export type { ButtonVariant, ButtonSize } from './primitives';
export { Card, Badge } from './primitives';
export type { BadgeVariant } from './primitives';

export const colors = {
  accent: '#3aa791',
  accentRgb: '58, 167, 145',
  accentLight: '#5cceb4',
  accentDark: '#2d8a77',
  accentDarker: '#1f6657',
  background: '#0d0f0c',
  backgroundGradient: '#1F211F',
  textBase: '#e5e7ce',
  textMedium: '#c2c3b4',
  textSecondary: '#a8a99a',
  textMuted: '#8e8f80',
} as const;

export const logo = '/logo.png';