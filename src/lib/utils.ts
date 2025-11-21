// Importa a função clsx e o tipo ClassValue da biblioteca "clsx"
// clsx serve para combinar e normalizar classes condicionalmente
import { clsx, type ClassValue } from "clsx"

// Importa a função twMerge, que resolve conflitos de classes do Tailwind
// Exemplo: "p-2 p-4" → o TailwindMerge mantém apenas "p-4"
import { twMerge } from "tailwind-merge"

// Função utilitária "cn" usada para combinar classes CSS de forma limpa e inteligente
export function cn(...inputs: ClassValue[]) {
  // Primeiro aplica clsx para montar a string de classes
  // Depois utiliza twMerge para resolver conflitos entre classes do Tailwind
  return twMerge(clsx(inputs))
}
