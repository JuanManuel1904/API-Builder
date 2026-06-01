/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0d0f14',
          2: '#131620',
          3: '#1a1e2e',
          4: '#202535',
          5: '#272c3f',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          2: 'rgba(255,255,255,0.12)',
          3: 'rgba(255,255,255,0.18)',
        },
        accent: {
          DEFAULT: '#6366f1',
          2: '#818cf8',
          3: '#a5b4fc',
          muted: 'rgba(99,102,241,0.15)',
        },
        text: {
          DEFAULT: '#e8eaf0',
          muted: '#6b7280',
          subtle: '#9ca3af',
        },
        node: {
          request: '#818cf8',
          auth: '#f59e0b',
          validation: '#3b82f6',
          query: '#a78bfa',
          transform: '#ec4899',
          response: '#34d399',
          external: '#fb923c',
          condition: '#f472b6',
          cache: '#22d3ee',
          logger: '#94a3b8',
        },
        method: {
          get: '#10b981',
          post: '#3b82f6',
          put: '#f59e0b',
          patch: '#8b5cf6',
          delete: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Syne', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        shimmer: 'shimmer 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
