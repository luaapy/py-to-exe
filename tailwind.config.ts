import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: 'var(--bg-main)',
				foreground: 'var(--text-primary)',
				card: {
					DEFAULT: 'var(--bg-card)',
					foreground: 'var(--text-primary)'
				},
				popover: {
					DEFAULT: 'var(--bg-card)',
					foreground: 'var(--text-primary)'
				},
				primary: {
					DEFAULT: 'var(--primary)',
					foreground: '#ffffff'
				},
				secondary: {
					DEFAULT: 'var(--secondary)',
					foreground: '#ffffff'
				},
				muted: {
					DEFAULT: 'var(--bg-input)',
					foreground: 'var(--text-secondary)'
				},
				accent: {
					DEFAULT: 'var(--bg-input)',
					foreground: 'var(--text-primary)'
				},
				destructive: {
					DEFAULT: 'var(--danger)',
					foreground: '#ffffff'
				},
				border: 'var(--border)',
				input: 'var(--bg-input)',
				ring: 'var(--primary)',
				chart: {
					'1': 'var(--warning)',
					'2': 'var(--success)',
					'3': 'var(--primary)',
					'4': 'var(--secondary)',
					'5': 'var(--danger)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
};
export default config;
