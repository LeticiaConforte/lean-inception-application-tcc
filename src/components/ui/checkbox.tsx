"use client"
// Indica que este componente deve ser renderizado no cliente (Next.js App Router)

import * as React from "react"
// Importa React para hooks e tipagens

import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
// Importa o checkbox acessível do Radix UI

import { Check } from "lucide-react"
// Ícone exibido quando o checkbox está marcado

import { cn } from "@/lib/utils"
// Função utilitária para juntar classes condicionalmente

// ============================================================================
// Componente Checkbox
// ============================================================================
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>, // Tipo interno para a ref
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> // Props padrão do Radix Checkbox
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref} // Passa a ref
    className={cn(
      // Classes padrão do checkbox
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className // Permite sobrescrever ou estender classes
    )}
    {...props} // Repassa outras props (ex: checked, onCheckedChange)
  >
    {/* Indicador visual quando o checkbox está marcado */}
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-current"
        // text-current garante que o ícone segue a cor do texto aplicada ao Root
      )}
    >
      {/* Ícone de check do Lucide */}
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))

// Define displayName para facilitar debugging no React DevTools
Checkbox.displayName = CheckboxPrimitive.Root.displayName

// Exporta o componente
export { Checkbox }
