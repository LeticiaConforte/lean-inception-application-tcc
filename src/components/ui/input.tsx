import * as React from "react"
// Importa React para permitir uso de forwardRef e tipagens

import { cn } from "@/lib/utils"
// Função utilitária para combinar classes condicionalmente

// ============================================================================
// Componente Input — entrada de texto estilizada com Tailwind + Radix patterns
// ============================================================================
const Input = React.forwardRef<
  HTMLInputElement, // Tipo da ref associada ao elemento <input>
  React.ComponentProps<"input"> // Todas as props nativas de <input>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type} // Define o tipo do input (text, password, number, etc.)
      ref={ref} // Encaminha a ref externamente
      className={cn(
        // Estilos padrão do input
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base",
        "ring-offset-background file:border-0 file:bg-transparent file:text-sm",
        "file:font-medium file:text-foreground placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className // Permite adicionar ou sobrescrever classes externas
      )}
      {...props} // Props adicionais (value, onChange, etc.)
    />
  )
})
Input.displayName = "Input" // Facilita identificação no React DevTools

// Exporta o componente
export { Input }
