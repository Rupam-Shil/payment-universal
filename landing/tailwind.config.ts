import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0b0e',
        fg: '#f5f1e8',
        muted: '#7a7a6f',
        subtle: '#44474d',
        line: '#1a1c20',
        code: '#0f1014',
        lime: '#d0f500',
        limeDim: '#8a9e00',
        ember: '#ff5e3a',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.055em',
      },
      animation: {
        'cursor-blink': 'cursor-blink 1.1s steps(2) infinite',
        'slide-up': 'slide-up 600ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 800ms ease-out both',
      },
      keyframes: {
        'cursor-blink': {
          '0%, 50%': { opacity: '1' },
          '50.01%, 100%': { opacity: '0' },
        },
        'slide-up': {
          from: { transform: 'translateY(18px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
