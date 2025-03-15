/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // Use media query based dark mode
  theme: {
    extend: {
      colors: {
        // Refined color palette with richer dark tones
        primary: {
          50: '#E8F0FE',
          100: '#C6D8FC',
          200: '#9DB7F9',
          300: '#7B9CF5',
          400: '#5C87F5',
          500: '#3366FF', // Updated to a richer blue
          600: '#2E5CE6',
          700: '#2851CC',
          800: '#2247B3',
          900: '#1A3D99',
        },
        surface: {
          50: '#F8F9FA',
          100: '#F1F3F4',
          200: '#E8EAED',
          300: '#DADCE0',
          400: '#BDC1C6',
          500: '#9AA0A6',
          600: '#5F6368',
          700: '#3C4043',
          800: '#202124',
          900: '#1A1A1F', // Refined dark background
        },
        error: '#EA4335',
        warning: '#FBBC04',
        success: '#34A853',
        info: '#3366FF',
        priority: {
          1: '#EA4335', // red
          2: '#FBBC04', // yellow
          3: '#3366FF', // blue
          4: '#34A853', // green
          5: '#9AA0A6', // gray
        },
        // Dark theme colors - refined for a more professional look
        dark: {
          background: '#1A1A1F', // Richer dark background
          surface: {
            0: '#1A1A1F',   // Base surface
            1: '#26262E',   // 1dp elevation
            2: '#2A2A32',   // 2dp elevation
            3: '#2E2E36',   // 3dp elevation
            4: '#32323A',   // 4dp elevation
            6: '#36363E',   // 6dp elevation
            8: '#3A3A42',   // 8dp elevation
            12: '#3E3E46',  // 12dp elevation
            16: '#42424A',  // 16dp elevation
            24: '#46464E',  // 24dp elevation
          },
          do: '#303035',        // slightly purple tint (urgent/important)
          schedule: '#2A2A30',  // slightly blue tint (important)
          delegate: '#2F3029',  // slightly yellow tint (urgent)
          eliminate: '#2A2A2A', // neutral gray
          backlog: '#26262B',   // slightly indigo tint (backlog)
          text: {
            primary: '#E8EAED',   // ~87% white
            secondary: '#9AA0A6', // ~60% white
            disabled: '#5F6368',  // ~38% white
            hint: '#3C4043',      // subtle hint text
          },
          card: {
            do: '#34343A',
            schedule: '#2F2F35',
            delegate: '#34342E',
            eliminate: '#2F2F2F',
            backlog: '#2B2B30',
          },
        },
      },
      spacing: {
        // Consistent 8px spacing system
        '0.5': '4px',
        '1': '8px',
        '1.5': '12px',
        '2': '16px',
        '2.5': '20px',
        '3': '24px',
        '3.5': '28px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
        '7': '56px',
        '8': '64px',
      },
      animation: {
        'fade-in': 'fadeIn 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-out': 'fadeOut 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slideIn 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'ripple': 'ripple 600ms cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.4' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '0.05' },
          '50%': { opacity: '0.15' },
        },
      },
      boxShadow: {
        // Refined shadow system with 3 levels
        'subtle': '0 1px 2px 0 rgba(0,0,0,0.05)',
        'medium': '0 2px 4px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)',
        'strong': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        // Material Design elevation system (keeping for compatibility)
        'dp1': '0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12), 0 1px 3px 0 rgba(0,0,0,0.20)',
        'dp2': '0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20)',
        'dp3': '0 3px 4px 0 rgba(0,0,0,0.14), 0 3px 3px -2px rgba(0,0,0,0.12), 0 1px 8px 0 rgba(0,0,0,0.20)',
        'dp4': '0 4px 5px 0 rgba(0,0,0,0.14), 0 1px 10px 0 rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.20)',
        'dp6': '0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12), 0 3px 5px -1px rgba(0,0,0,0.20)',
        'dp8': '0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.20)',
        'dp12': '0 12px 17px 2px rgba(0,0,0,0.14), 0 5px 22px 4px rgba(0,0,0,0.12), 0 7px 8px -4px rgba(0,0,0,0.20)',
        'dp16': '0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.20)',
        'dp24': '0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.20)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        'pill': '9999px',
        'modern': '6px',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        display: ['Inter', 'Google Sans', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['13px', { lineHeight: '20px' }],
        'base': ['14px', { lineHeight: '22px' }],
        'lg': ['16px', { lineHeight: '24px' }],
        'xl': ['18px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '30px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 