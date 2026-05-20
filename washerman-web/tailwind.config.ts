import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { primary: '#0A1628', secondary: '#0F1F3D', tertiary: '#162952' },
        gold: { DEFAULT: '#F5C842', light: '#F7D56E', dark: '#D4A832', muted: 'rgba(245,200,66,0.15)' },
        surface: { border: 'rgba(255,255,255,0.08)', hover: 'rgba(255,255,255,0.04)' },
        text: { primary: '#F0F4FF', secondary: '#8A9BB8', disabled: '#4A5A7A' },
        status: {
          pending: '#F39C12', accepted: '#3498DB', collecting: '#9B59B6',
          collected: '#2980B9', in_progress: '#E67E22', ready: '#27AE60',
          delivered: '#2ECC71', cancelled: '#E74C3C', declined: '#E74C3C',
        },
        success: '#2ECC71',
        warning: '#F39C12',
        error: '#E74C3C',
        info: '#3498DB',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(135deg, #050D1F 0%, #0F1F3D 100%)',
        'gradient-gold': 'linear-gradient(135deg, #F5C842 0%, #D4A832 100%)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-gold': 'pulse-gold 2s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
