/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg:           '#09090D',
        surface:      '#0F1117',
        'surface-2':  '#14171F',
        border:       '#1C1F2B',
        'border-2':   '#252A3A',
        accent:       '#D4FF27',
        'accent-dim': '#A8CC1F',
        text:         '#ECEEF2',
        muted:        '#636878',
        'muted-2':    '#9198A8',
        danger:       '#F04438',
        success:      '#17B26A',
        warning:      '#F79009',
      },
      boxShadow: {
        'accent-glow': '0 0 0 1px rgba(212,255,39,0.15), 0 0 28px rgba(212,255,39,0.07)',
        'card':        'inset 0 1px 0 rgba(255,255,255,0.04)',
        'card-hover':  'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};
