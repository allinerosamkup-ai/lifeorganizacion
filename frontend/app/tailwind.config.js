import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#D946EF",
                secondary: "#D0A9D9",
                action: "#C07A92",
                "action-hover": "#B06A82",
                accent: "#FDE2D6",
                "text-dark": "#4A3B3E",
                "text-light": "#FDF8F5",
                "background-light": "#FFF5F5",
                "background-dark": "#1F1824",
                "card-light": "#FFFFFF",
                "card-dark": "#2D2436",
                "soft-purple": "#E9D5FF",
                "soft-pink": "#FBCFE8",
                "accent-teal": "#2DD4BF",
                "accent-rose": "#FB7185",
            },
            fontFamily: {
                display: ["DM Serif Display", "serif"],
                body: ["Nunito", "sans-serif"],
                sans: ["Nunito", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "1rem",
                xl: "1.5rem",
                "2xl": "2rem",
            },
            boxShadow: {
                soft: "0 4px 20px -2px rgba(219, 180, 219, 0.25)",
                glow: "0 0 15px rgba(217, 70, 239, 0.3)",
                '3d': '0 10px 20px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 -3px 0 0 rgba(0, 0, 0, 0.1), inset 0 2px 0 0 rgba(255, 255, 255, 0.5)',
                '3d-pressed': '0 2px 4px -1px rgba(0, 0, 0, 0.1), inset 0 3px 5px 0 rgba(0, 0, 0, 0.1)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'glass-inset': 'inset 0 0 0 1px rgba(255, 255, 255, 0.3), 0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            },
            backgroundImage: {
                "gradient-soft": "linear-gradient(180deg, #FFF0F5 0%, #FFE4E8 100%)",
                "gradient-dark": "linear-gradient(180deg, #2D1E2F 0%, #251820 100%)",
            },
        },
    },
    plugins: [
        typography,
        forms,
    ],
}
