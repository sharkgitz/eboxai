/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        background: '#09090b', // Zinc 950
        surface: '#18181b',    // Zinc 900
        surfaceHighlight: '#27272a', // Zinc 800
        border: '#27272a',     // Zinc 800
        text: {
          primary: '#f4f4f5',   // Zinc 100
          secondary: '#a1a1aa', // Zinc 400
          tertiary: '#52525b',  // Zinc 600
        },
        brand: {
          500: '#3b82f6', // Blue 500
          600: '#2563eb', // Blue 600
          glow: 'rgba(59, 130, 246, 0.5)'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
