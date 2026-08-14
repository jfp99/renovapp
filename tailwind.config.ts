import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans-atelier)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display-atelier)', 'var(--font-sans-atelier)', 'sans-serif'],
        mono: ['var(--font-mono-atelier)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Brand — terracotta, "Atelier" direction
        brand: {
          50: '#FBF1EA',
          100: '#F6E1D2',
          200: '#EEC3B0',
          300: '#DDA186',
          400: '#C97A55',
          500: '#C2643C',
          600: '#B4552F',
          700: '#8F4324',
          800: '#743620',
          900: '#5C2B19',
        },
        // Ocre accent — chantier / matière
        accent: {
          50: '#FDF6EA',
          100: '#FAEBD1',
          200: '#F3D6A3',
          300: '#E9BC71',
          400: '#DCA24B',
          500: '#C98A2E',
          600: '#A86F22',
          700: '#8A5B1C',
        },
        // Pin green — deuxième accent (salle de bain, commun, succès)
        pine: {
          50: '#E7EFE9',
          100: '#CFE0D6',
          300: '#6E9C8B',
          400: '#3E7C6B',
          500: '#2E5A4E',
          600: '#254A40',
          700: '#1E3A32',
        },
        // keep `primary` alias for backwards compat
        primary: { 50: '#FBF1EA', 100: '#F6E1D2', 200: '#EEC3B0', 300: '#DDA186', 400: '#C97A55', 500: '#C2643C', 600: '#B4552F', 700: '#8F4324', 800: '#743620', 900: '#5C2B19' },
        ink: {
          DEFAULT: '#221C15',
          soft: '#4A4034',
          muted: '#6B5E49',
          faint: '#8A7C66',
          pale: '#A89A82',
        },
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(34,28,21,0.04), 0 1px 3px 0 rgba(34,28,21,0.06)',
        'card-hover': '0 4px 12px -2px rgba(34,28,21,0.10), 0 2px 6px -2px rgba(34,28,21,0.06)',
        float: '0 12px 32px -8px rgba(34,28,21,0.20), 0 4px 12px -4px rgba(34,28,21,0.10)',
        glow: '0 0 0 4px rgba(180,85,47,0.14)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-right': 'slide-in-right 0.22s cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
}
export default config
