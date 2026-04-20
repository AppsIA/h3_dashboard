import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── COLOR TOKENS ─────────────────────────────────────────────────────
      colors: {
        // Canvas / Background
        canvas:  '#0D0D0D',
        surface: {
          DEFAULT: '#141414',
          elevated: '#1A1A1A',
          overlay:  '#1F1F1F',
        },

        // Border
        border: {
          DEFAULT: '#242424',
          subtle:  '#1C1C1C',
          strong:  '#3A3A3A',
          accent:  '#FFB800',
        },

        // Text
        text: {
          primary:   '#F5F5F5',
          secondary: '#8A8A8A',
          tertiary:  '#5A5A5A',
          disabled:  '#3A3A3A',
          inverse:   '#0D0D0D',
        },

        // Accent — Âmbar-Métrica (cor identitária do H3 Dashboard)
        amber: {
          50:  '#FFF8E6',
          100: '#FFEFC0',
          200: '#FFE099',
          300: '#FFD166',
          400: '#FFC233',
          500: '#FFB800',  // primary accent
          600: '#CC9300',
          700: '#996E00',
          800: '#664A00',
          900: '#3D2A00',
          950: '#1F1500',
        },

        // Semantic / Feedback
        success: {
          DEFAULT: '#22C55E',
          muted:   '#16532A',
          bg:      '#0D2A17',
        },
        error: {
          DEFAULT: '#EF4444',
          muted:   '#7F1D1D',
          bg:      '#2A0D0D',
        },
        warning: {
          DEFAULT: '#F59E0B',
          muted:   '#78350F',
          bg:      '#2A1A05',
        },
        info: {
          DEFAULT: '#3B82F6',
          muted:   '#1E3A8A',
          bg:      '#0D1A2A',
        },

        // Platform badges
        platform: {
          meta:    { bg: '#1A2A4A', text: '#4267B2' },
          google:  { bg: '#2A1A1A', text: '#EA4335' },
          tiktok:  { bg: '#1A1A1A', text: '#F5F5F5' },
          organic: { bg: '#1A2A1A', text: '#22C55E' },
        },

        // Objective badges
        objective: {
          captacao:    { bg: '#3D2A00', text: '#FFB800' },
          venda:       { bg: '#0D2A17', text: '#22C55E' },
          alcance:     { bg: '#0D1A2A', text: '#3B82F6' },
          seguidores:  { bg: '#1F0D2A', text: '#A855F7' },
        },
      },

      // ─── TYPOGRAPHY TOKENS ────────────────────────────────────────────────
      fontFamily: {
        sans:  ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono:  ['IBM Plex Mono', 'Consolas', 'monospace'],
      },

      fontSize: {
        // Semantic scale
        'metric-hero':  ['72px', { lineHeight: '1.0',  fontWeight: '700',  letterSpacing: '-0.02em' }],
        'metric-large': ['48px', { lineHeight: '1.05', fontWeight: '600',  letterSpacing: '-0.01em' }],
        'metric-med':   ['32px', { lineHeight: '1.1',  fontWeight: '500',  letterSpacing: '0'       }],
        'metric-sm':    ['24px', { lineHeight: '1.2',  fontWeight: '500',  letterSpacing: '0'       }],
        'formula':      ['11px', { lineHeight: '1.5',  fontWeight: '400',  letterSpacing: '0'       }],
        'label-upper':  ['11px', { lineHeight: '1.4',  fontWeight: '500',  letterSpacing: '0.1em'   }],
        'caption':      ['12px', { lineHeight: '1.5',  fontWeight: '400',  letterSpacing: '0'       }],
        'body-sm':      ['13px', { lineHeight: '1.5',  fontWeight: '400',  letterSpacing: '0'       }],
        'body':         ['14px', { lineHeight: '1.6',  fontWeight: '400',  letterSpacing: '0'       }],
        'body-lg':      ['16px', { lineHeight: '1.6',  fontWeight: '400',  letterSpacing: '0'       }],
        'heading-sm':   ['18px', { lineHeight: '1.3',  fontWeight: '600',  letterSpacing: '-0.01em' }],
        'heading':      ['24px', { lineHeight: '1.2',  fontWeight: '700',  letterSpacing: '-0.02em' }],
        'heading-lg':   ['32px', { lineHeight: '1.1',  fontWeight: '700',  letterSpacing: '-0.02em' }],
      },

      // ─── SPACING TOKENS ───────────────────────────────────────────────────
      spacing: {
        '0.5':  '2px',
        '1':    '4px',
        '1.5':  '6px',
        '2':    '8px',
        '2.5':  '10px',
        '3':    '12px',
        '4':    '16px',
        '5':    '20px',
        '6':    '24px',
        '7':    '28px',
        '8':    '32px',
        '10':   '40px',
        '12':   '48px',
        '14':   '56px',
        '16':   '64px',
        '18':   '72px',
        '20':   '80px',
        '24':   '96px',
        '32':   '128px',
      },

      // ─── BORDER TOKENS ────────────────────────────────────────────────────
      borderRadius: {
        'none':  '0',
        'chip':  '2px',
        'sm':    '4px',
        'md':    '6px',
        'lg':    '8px',
        'xl':    '12px',
        'full':  '9999px',
      },

      borderWidth: {
        DEFAULT: '1px',
        '0':     '0',
        '2':     '2px',
        '4':     '4px',
      },

      // ─── SHADOW TOKENS ────────────────────────────────────────────────────
      boxShadow: {
        'none':    'none',
        'sm':      '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'DEFAULT': '0 2px 4px 0 rgba(0, 0, 0, 0.5)',
        'md':      '0 4px 8px 0 rgba(0, 0, 0, 0.5)',
        'lg':      '0 8px 16px 0 rgba(0, 0, 0, 0.6)',
        'xl':      '0 16px 32px 0 rgba(0, 0, 0, 0.7)',
        'amber':   '0 0 0 2px rgba(255, 184, 0, 0.3)',
        'focus':   '0 0 0 2px rgba(255, 184, 0, 0.5)',
        'error':   '0 0 0 2px rgba(239, 68, 68, 0.4)',
      },

      // ─── ANIMATION TOKENS ─────────────────────────────────────────────────
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      // ─── KEYFRAMES ────────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
        'slide-in': {
          from: { transform: 'translateX(-8px)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        'skeleton-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.8' },
        },
        'demo-bar-flash': {
          '0%, 100%': { opacity: '1'   },
          '50%':      { opacity: '0.8' },
        },
      },
      animation: {
        'fade-in':        'fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in':       'slide-in 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'skeleton':       'skeleton-pulse 1.5s ease-in-out infinite',
        'demo-bar-flash': 'demo-bar-flash 3s ease-in-out infinite',
      },

      // ─── BREAKPOINTS ──────────────────────────────────────────────────────
      screens: {
        'xs':  '375px',
        'sm':  '640px',
        'md':  '768px',
        'lg':  '1024px',
        'xl':  '1280px',
        '2xl': '1440px',
      },
    },
  },
  plugins: [],
}

export default config
