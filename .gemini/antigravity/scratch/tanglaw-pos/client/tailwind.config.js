/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                tanglaw: {
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626', // Primary Red
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                },
                dark: {
                    bg: '#1a1a1a',
                    surface: '#2d2d2d',
                    text: '#e5e5e5',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
