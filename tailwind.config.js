/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#030712',
          secondary: '#0a0e1a',
          card: 'rgba(0, 45, 90, 0.35)',
        },
        cyan: {
          DEFAULT: '#00d4ff',
          dark: '#0099cc',
          glow: 'rgba(0, 212, 255, 0.2)',
        },
        blue: {
          accent: '#0066ff',
          dark: '#003380',
        },
        confidence: {
          green: '#00dd44',
          'green-glow': 'rgba(0, 221, 68, 0.25)',
          yellow: '#ffaa00',
          'yellow-glow': 'rgba(255, 170, 0, 0.25)',
          red: '#ff3344',
          'red-glow': 'rgba(255, 51, 68, 0.25)',
        },
        text: {
          primary: '#e8f4ff',
          secondary: '#8ab4cc',
          muted: '#4a6a80',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
        'spin-slow': 'spin 6s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
