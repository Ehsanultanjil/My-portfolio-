try {
    tailwind.config = {
        darkMode: "class",
        theme: {
            extend: {
                "colors": {
                    "on-primary": "#00363a",
                    "on-error-container": "#ffdad6",
                    "on-tertiary": "#313030",
                    "on-secondary-fixed": "#1a1c1c",
                    "on-surface-variant": "#b9cacb",
                    "primary-fixed-dim": "#00dbe9",
                    "error-container": "#93000a",
                    "inverse-primary": "#006970",
                    "surface-container-low": "#1c1b1b",
                    "tertiary-container": "#dcd9d8",
                    "primary-fixed": "#7df4ff",
                    "on-tertiary-fixed-variant": "#474646",
                    "background": "#000000",
                    "inverse-surface": "#e5e2e1",
                    "outline-variant": "#3b494b",
                    "on-secondary-fixed-variant": "#454747",
                    "tertiary-fixed": "#e5e2e1",
                    "primary": "#dbfcff",
                    "on-tertiary-fixed": "#1c1b1b",
                    "secondary": "#c6c6c7",
                    "on-primary-fixed-variant": "#004f54",
                    "surface-container-high": "#2a2a2a",
                    "tertiary": "#f9f5f5",
                    "surface-dim": "#000000",
                    "on-surface": "#e5e2e1",
                    "inverse-on-surface": "#313030",
                    "on-background": "#e5e2e1",
                    "surface-container-lowest": "#050505",
                    "secondary-container": "#454747",
                    "surface-bright": "#393939",
                    "on-secondary": "#2f3131",
                    "on-secondary-container": "#b4b5b5",
                    "outline": "#849495",
                    "on-error": "#690005",
                    "primary-container": "#00f0ff",
                    "secondary-fixed-dim": "#c6c6c7",
                    "surface-container": "#0e0e0e",
                    "secondary-fixed": "#e2e2e2",
                    "on-primary-fixed": "#002022",
                    "tertiary-fixed-dim": "#c9c6c5",
                    "surface-container-highest": "#353534",
                    "on-primary-container": "#006970",
                    "on-tertiary-container": "#605e5e",
                    "surface": "#000000",
                    "surface-tint": "#00dbe9",
                    "error": "#ffb4ab",
                    "surface-variant": "#1a1a1a"
                },
                "borderRadius": {
                    "DEFAULT": "0.75rem",
                    "lg": "1.25rem",
                    "xl": "1.5rem",
                    "full": "9999px",
                    "4xl": "40px"
                },
                "spacing": {
                    "component-gap": "1rem",
                    "section-padding": "4rem",
                    "gutter": "1.5rem",
                    "container-margin": "2rem",
                    "glass-padding": "1.5rem"
                },
                "fontFamily": {
                    "headline-lg-mobile": ["Geist", "sans-serif"],
                    "label-md": ["Geist", "sans-serif"],
                    "headline-lg": ["Geist", "sans-serif"],
                    "headline-xl": ["Geist", "sans-serif"],
                    "body-md": ["Geist", "sans-serif"],
                    "body-sm": ["Geist", "sans-serif"]
                },
                "fontSize": {
                    "headline-lg-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                    "label-md": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
                    "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                    "headline-xl": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                    "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                    "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }]
                },
                "animation": {
                    "marquee": "marquee 30s linear infinite",
                },
                "keyframes": {
                    "marquee": {
                        "0%": { transform: "translateX(0)" },
                        "100%": { transform: "translateX(-50%)" },
                    }
                }
            },
        },
    }
} catch (_e) {}
