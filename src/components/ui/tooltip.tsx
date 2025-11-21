import * as React from "react"
// Importa o React para utilizar forwardRef e JSX

import * as TooltipPrimitive from "@radix-ui/react-tooltip"
// Importa todos os componentes base de Tooltip da Radix UI

import { cn } from "@/lib/utils"
// Utilitário para concatenar classes condicionalmente

// ============================================================================
// Provider que controla todo o comportamento de tooltips na árvore
// ============================================================================
const TooltipProvider = TooltipPrimitive.Provider

// ============================================================================
// Componente raiz que representa um Tooltip individual
// ============================================================================
const Tooltip = TooltipPrimitive.Root

// ============================================================================
// Elemento que dispara a exibição do tooltip (ex: botão, ícone, texto, etc.)
// ============================================================================
const TooltipTrigger = TooltipPrimitive.Trigger

// ============================================================================
// Conteúdo do tooltip: a caixinha que aparece com o texto informativo
// ============================================================================
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(
  ({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
      ref={ref}
      // Espaço entre o trigger e o tooltip
      sideOffset={sideOffset}
      className={cn(
        // Estilos base do tooltip
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md",

        // Animações de entrada
        "animate-in fade-in-0 zoom-in-95",

        // Animações aplicadas quando fecha
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",

        // Direções específicas (slide)
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",

        className
      )}
      {...props}
    />
  )
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// ============================================================================
// Exporta todos os componentes já padronizados
// ============================================================================
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
