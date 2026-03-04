import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    // Dark mode disabled — app uses its own tokens via CSS variables
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // ── Legacy tokens (kept for backward compat) ──
                primary: "#D6517D",         // updated to new accent
                secondary: "#D0A9D9",
                action: "#D6517D",
                "action-hover": "#C04371",
                accent: "#FDE2D6",
                "text-dark": "#1C1917",
                "text-light": "#FAF8F5",
                "background-light": "#FAF8F5",
                "background-dark": "#1F1824",
                "card-light": "#FFFFFF",
                "card-dark": "#2D2436",
                "soft-purple": "#E9D5FF",
                "soft-pink": "#FBCFE8",
                "accent-teal": "#2DD4BF",
                "accent-rose": "#FB7185",

                // ── Airia Flow design tokens ──
                airia: {
                    50: "#FEF1F6",
                    100: "#FDE2EE",
                    200: "#FAC5DC",
                    300: "#F599C1",
                    400: "#ED6CA3",
                    500: "#D6517D",  // primary accent
                    600: "#C04371",
                    700: "#A33562",
                    800: "#7A2649",
                    900: "#521830",
                },
            },
            fontFamily: {
                display: ["DM Serif Display", "Georgia", "serif"],
                body: ["Nunito", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
                sans: ["Nunito", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
                serif: ["DM Serif Display", "Georgia", "serif"],
            },
            borderRadius: {
                DEFAULT: "12px",
                sm: "8px",
                md: "16px",
                lg: "20px",
                xl: "28px",
                "2xl": "32px",
                "3xl": "36px",
                "4xl": "44px",
            },
            boxShadow: {
                // Design system shadows
                card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
                float: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
                modal: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
                // Legacy compat
                soft: "0 4px 20px -2px rgba(219, 180, 219, 0.25)",
                glow: "0 0 15px rgba(214, 81, 125, 0.30)",
                '3d': '0 10px 20px -5px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05), inset 0 -3px 0 0 rgba(0,0,0,0.1), inset 0 2px 0 0 rgba(255,255,255,0.5)',
                '3d-pressed': '0 2px 4px -1px rgba(0,0,0,0.1), inset 0 3px 5px 0 rgba(0,0,0,0.1)',
                glass: '0 8px 32px 0 rgba(31,38,135,0.07)',
                'glass-inset': 'inset 0 0 0 1px rgba(255,255,255,0.3), 0 8px 32px 0 rgba(31,38,135,0.07)',
            },
            backgroundImage: {
                // Legacy
                "gradient-soft": "linear-gradient(180deg, #FFF0F5 0%, #FFE4E8 100%)",
                "gradient-dark": "linear-gradient(180deg, #2D1E2F 0%, #251820 100%)",
                // Airia brand gradient
                "gradient-airia": "linear-gradient(135deg, #D6517D 0%, #7C3AED 100%)",
                "gradient-page": "linear-gradient(160deg, #FAF8F5 0%, #F5EFF5 40%, #F0EAF8 100%)",
            },
            transitionTimingFunction: {
                spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
            },
            transitionDuration: {
                fast: "150ms",
                base: "250ms",
                slow: "400ms",
            },
            animation: {
                "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
                "fade-in-up": "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
                "scale-in": "scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both",
                shimmer: "shimmer 1.4s ease-in-out infinite",
            },
        },
    },
    plugins: [
        typography,
        forms,
    ],
};
