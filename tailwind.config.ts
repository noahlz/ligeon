import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./public/**/*.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ui: {
          // Dark theme colors
          'bg-page': 'hsl(37, 10%, 8%)',      // Darkest - main page bg
          'bg-box': 'hsl(37, 7%, 14%)',       // Panel backgrounds
          'bg-element': 'hsl(37, 7%, 18%)',   // Buttons, list items
          'bg-hover': 'hsl(37, 7%, 22%)',     // Lighter bg for hover
          'bg-zebra-1': 'hsl(37, 5%, 19%)',   // Zebra stripe 1
          'bg-zebra-2': 'hsl(37, 5%, 24%)',   // Zebra stripe 2
          'text': 'hsl(0, 0%, 73%)',          // Main text
          'text-dim': 'hsl(0, 0%, 58%)',      // Dimmed text
          'text-dimmer': 'hsl(0, 0%, 42%)',   // More dimmed
          'border': 'hsl(0, 0%, 15%)',        // Borders (dimmer)
          'border-light': 'hsl(0, 0%, 20%)',  // Lighter borders
          'primary': 'hsl(209, 79%, 56%)',    // Blue
          'secondary': 'hsl(88, 62%, 37%)',   // Green
          'accent': 'hsl(22, 100%, 42%)',     // Orange
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
