/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // We will map colors dynamically in CSS or use tailwind zinc/neutral grays
        // The reference image uses a very dark gray for sidebar and pure white/light gray for content
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'dot-pulse': {
          '0%, 80%, 100%': { opacity: '0.3' },
          '40%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-up': 'slide-up 0.6s ease-out forwards',
        'slide-right': 'slide-right 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'dot-pulse': 'dot-pulse 1.4s ease-in-out infinite',
      },
      backgroundImage: {
        'network-pattern': "url('data:image/svg+xml,%3Csvg width=\\'100\\'%20height=\\'100\\'%20xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M0 0h100v100H0z\\' fill=\\'none\\'/%3E%3Cpath d=\\'M0 50L50 0L100 50L50 100z\\' stroke=\\'rgba(0,0,0,0.03)\\' stroke-width=\\'1\\' fill=\\'none\\'/%3E%3Ccircle cx=\\'50\\' cy=\\'0\\' r=\\'1.5\\' fill=\\'rgba(0,0,0,0.05)\\'/%3E%3Ccircle cx=\\'100\\' cy=\\'50\\' r=\\'1.5\\' fill=\\'rgba(0,0,0,0.05)\\'/%3E%3Ccircle cx=\\'50\\' cy=\\'100\\' r=\\'1.5\\' fill=\\'rgba(0,0,0,0.05)\\'/%3E%3Ccircle cx=\\'0\\' cy=\\'50\\' r=\\'1.5\\' fill=\\'rgba(0,0,0,0.05)\\'/%3E%3C/svg%3E')",
        'network-pattern-dark': "url('data:image/svg+xml,%3Csvg width=\\'100\\'%20height=\\'100\\'%20xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M0 0h100v100H0z\\' fill=\\'none\\'/%3E%3Cpath d=\\'M0 50L50 0L100 50L50 100z\\' stroke=\\'rgba(255,255,255,0.03)\\' stroke-width=\\'1\\' fill=\\'none\\'/%3E%3Ccircle cx=\\'50\\' cy=\\'0\\' r=\\'1.5\\' fill=\\'rgba(255,255,255,0.05)\\'/%3E%3Ccircle cx=\\'100\\' cy=\\'50\\' r=\\'1.5\\' fill=\\'rgba(255,255,255,0.05)\\'/%3E%3Ccircle cx=\\'50\\' cy=\\'100\\' r=\\'1.5\\' fill=\\'rgba(255,255,255,0.05)\\'/%3E%3Ccircle cx=\\'0\\' cy=\\'50\\' r=\\'1.5\\' fill=\\'rgba(255,255,255,0.05)\\'/%3E%3C/svg%3E')"
      }
    },
  },
  plugins: [],
};
