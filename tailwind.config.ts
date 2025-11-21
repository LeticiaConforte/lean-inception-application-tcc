
import type { Config } from "tailwindcss";

export default {
	// Estratégia para aplicar o modo escuro (dark mode). 'class' significa que o dark mode é ativado 
	// quando a classe 'dark' está presente no elemento <html>.
	darkMode: ["class"],

	// Arquivos que o Tailwind CSS deve escanear para encontrar as classes de utilitário utilizadas.
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],

	// Prefixo para todas as classes do Tailwind. Vazio por padrão.
	prefix: "",

	// Onde você define a paleta de cores, fontes, espaçamentos, etc.
	theme: {
		// Configuração padrão para a classe de container.
		container: {
			center: true, // Centraliza o container por padrão.
			padding: '2rem', // Define um padding padrão para o container.
			screens: {
				'2xl': '1400px' // Define a largura máxima do container em telas muito grandes.
			}
		},

		// A seção 'extend' permite adicionar novos valores ao tema padrão do Tailwind sem sobrescrevê-lo completamente.
		extend: {
			// Cores personalizadas. Elas usam variáveis CSS (ex: var(--border)) para permitir a troca de temas.
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Cores personalizadas para o projeto Lean Inception
				inception: {
					blue: '#4F46E5',
					purple: '#7C3AED',
					pink: '#EC4899',
					yellow: '#F59E0B',
					green: '#10B981',
					orange: '#F97316',
					cyan: '#06B6D4',
					lime: '#84CC16'
				}
			},
			// Valores personalizados para o arredondamento de bordas, também usando variáveis CSS.
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			// Define animações CSS personalizadas através de keyframes.
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'pulse-slow': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.5' }
				},
				'bounce-gentle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				}
			},
			// Associa os keyframes a nomes de classes de animação para serem usadas no HTML.
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
				'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite'
			},
			// Adiciona gradientes personalizados como imagens de fundo.
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-inception': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				'gradient-workshop': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
				'gradient-creative': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
			}
		}
	},
	// Adiciona plugins para estender as funcionalidades do Tailwind, como o tailwindcss-animate.
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
