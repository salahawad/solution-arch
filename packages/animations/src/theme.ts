/**
 * Design tokens — the dark "observability dashboard" look from the reference reel.
 * Shared by every concept scene so the whole library feels like one product.
 */
export const theme = {
  colors: {
    bg: '#0B0E14',
    bgGlow: '#0E1B2A',
    panel: '#11161F',
    panelBorder: '#1E2A3A',
    teal: '#2DD4BF',
    tealDim: '#1C8C80',
    coral: '#FB7185',
    coralDim: '#9F3A48',
    amber: '#FBBF24',
    text: '#F8FAFC',
    muted: '#8593A6',
    mutedDim: '#566173',
  },
  fonts: {
    sans: 'Inter, system-ui, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },
  radius: 24,
  glow: 28,
} as const;

export type ThemeColor = keyof typeof theme.colors;
