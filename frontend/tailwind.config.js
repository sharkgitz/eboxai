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
        // New Light Theme - Soft Gray/Green
        background: '#F0F2F5',     // Soft gray background
        surface: '#FFFFFF',        // Pure white cards
        surfaceHighlight: '#F8FAF8', // Very light green tint
        border: '#E5E7EB',         // Light gray border

        text: {
          primary: '#1F2937',      // Dark gray (almost black)
          secondary: '#6B7280',    // Medium gray
          tertiary: '#9CA3AF',     // Light gray
        },

        brand: {
          50: '#F0FDF4',           // Lightest green
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',          // Primary green
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',          // Dark green for text
          900: '#14532D',
          glow: 'rgba(34, 197, 94, 0.2)'
        },

        // Accent colors for stats
        accent: {
          blue: '#3B82F6',
          orange: '#F97316',
          purple: '#8B5CF6',
          red: '#EF4444',
        }
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
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
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
