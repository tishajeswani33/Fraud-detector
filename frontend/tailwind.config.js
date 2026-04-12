/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        void:    '#07080d',
        panel:   '#0f111a',
        surface: '#161b28',
        elevated:'#1c2233',
        border:  '#232a3d',
        'border-bright': '#2e3855',
        danger:  '#ff3b5c',
        safe:    '#00e676',
        amber:   '#ffab00',
        accent:  '#6366f1',
        muted:   '#8892a4',
        text:    '#e8ecf4',
      },
      boxShadow: {
        'glow-danger': '0 0 30px rgba(255,59,92,0.25)',
        'glow-safe':   '0 0 30px rgba(0,230,118,0.25)',
        'glow-accent': '0 0 30px rgba(99,102,241,0.25)',
        'card':        '0 8px 32px rgba(0,0,0,0.4)',
        'card-hover':  '0 16px 48px rgba(0,0,0,0.5)',
      },
      animation: {
        'scan':        'scanLine 2s linear infinite',
        'slide-up':    'slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'slide-down':  'slideDown 0.3s ease-out forwards',
        'fade-in':     'fadeIn 0.3s ease-out forwards',
        'glow-danger': 'glowPulse 2s ease-in-out infinite',
        'glow-safe':   'glowPulseSafe 2s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s infinite',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'count-up':    'countUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'risk':        'risk-appear 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      keyframes: {
        scanLine: {
          '0%':   { transform: 'translateY(-100%)', opacity: '0' },
          '10%':  { opacity: '0.6' },
          '90%':  { opacity: '0.6' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 59, 92, 0.2)' },
          '50%':      { boxShadow: '0 0 40px rgba(255, 59, 92, 0.5)' },
        },
        glowPulseSafe: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 230, 118, 0.2)' },
          '50%':      { boxShadow: '0 0 40px rgba(0, 230, 118, 0.5)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'risk-appear': {
          from: { opacity: '0', transform: 'scale(0.9) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
