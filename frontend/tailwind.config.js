/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Deep black background scale
        navy: {
          950: '#050505',
          900: '#101010',
          800: '#171717',
          700: '#1f1f1f',
          600: '#222222',
        },
        // Cyber Security accent palette — Yellow + Green
        cyber: {
          yellow: '#FFD60A',
          green: '#A3E635',
          neon: '#39FF14',
          dark: '#222222',
        },
        // Override blue -> cyber yellow
        blue: {
          50: '#FFFDE7', 100: '#FFF9C4', 200: '#FFF59D', 300: '#FFF176',
          400: '#FFEE58', 500: '#FFD60A', 600: '#F9A825', 700: '#E65100',
          800: '#BF360C', 900: '#7C2D12', 950: '#431407',
        },
        // Override purple -> lime green
        purple: {
          50: '#F7FEE7', 100: '#ECFCCB', 200: '#D9F99D', 300: '#BEF264',
          400: '#A3E635', 500: '#84CC16', 600: '#65A30D', 700: '#4D7C0F',
          800: '#3F6212', 900: '#365314', 950: '#1A2E05',
        },
        // Emerald -> AI green (kept for safe badges)
        emerald: {
          50: '#EAFBF0', 100: '#CFF7DD', 200: '#9FEFBC', 300: '#6DE49B',
          400: '#4ADE80', 500: '#22C55E', 600: '#16A34A', 700: '#15803D',
          800: '#166534', 900: '#14532D', 950: '#052E14',
        },
        // Yellow (warning)
        yellow: {
          50: '#FFFBEA', 100: '#FEF3C7', 200: '#FDE49A', 300: '#FCD267',
          400: '#FBBF24', 500: '#FACC15', 600: '#D97F06', 700: '#B45F04',
          800: '#8A4708', 900: '#71390C', 950: '#3F1D03',
        },
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #050505 0%, #101010 50%, #171717 100%)',
        'primary-gradient': 'linear-gradient(135deg, #FFD60A, #A3E635)',
        'blue-purple': 'linear-gradient(135deg, #FFD60A, #A3E635)',
        'cyan-blue': 'linear-gradient(135deg, #FFD60A, #A3E635)',
        'danger-gradient': 'linear-gradient(135deg, #dc2626, #b91c1c)',
        'warning-gradient': 'linear-gradient(135deg, #FACC15, #D97F06)',
        'success-gradient': 'linear-gradient(135deg, #22C55E, #16A34A)',
        'glow-yellow': 'radial-gradient(ellipse at center, rgba(255,214,10,0.3) 0%, transparent 70%)',
        'glow-green': 'radial-gradient(ellipse at center, rgba(163,230,53,0.3) 0%, transparent 70%)',
        'glow-neon': 'radial-gradient(ellipse at center, rgba(57,255,20,0.2) 0%, transparent 70%)',
        'glow-blue': 'radial-gradient(ellipse at center, rgba(255,214,10,0.25) 0%, transparent 70%)',
        'glow-purple': 'radial-gradient(ellipse at center, rgba(163,230,53,0.25) 0%, transparent 70%)',
        'hero-grid': 'linear-gradient(rgba(255,214,10,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,214,10,0.05) 1px, transparent 1px)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(255,214,10,0.35), 0 0 40px rgba(255,214,10,0.15)',
        'glow-yellow': '0 0 20px rgba(255,214,10,0.35), 0 0 40px rgba(255,214,10,0.15)',
        'glow-green': '0 0 20px rgba(163,230,53,0.35), 0 0 40px rgba(163,230,53,0.15)',
        'glow-purple': '0 0 20px rgba(163,230,53,0.35), 0 0 40px rgba(163,230,53,0.15)',
        'glow-cyan': '0 0 20px rgba(255,214,10,0.35), 0 0 40px rgba(255,214,10,0.15)',
        'glow-neon': '0 0 20px rgba(57,255,20,0.3), 0 0 60px rgba(57,255,20,0.15)',
        'glow-red': '0 0 20px rgba(239,68,68,0.4), 0 0 40px rgba(239,68,68,0.2)',
        'glow-emerald': '0 0 20px rgba(34,197,94,0.4), 0 0 40px rgba(34,197,94,0.2)',
        'card-glass': '0 8px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(255,214,10,0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(163,230,53,0.6), 0 0 80px rgba(255,214,10,0.3)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
