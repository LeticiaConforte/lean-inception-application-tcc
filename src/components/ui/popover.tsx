import * as React from "react"
// Importa React para criação de componentes e uso de forwardRef

import * as PopoverPrimitive from "@radix-ui/react-popover"
// Importa componentes base de Popover do Radix UI

import { cn } from "@/lib/utils"
// Utilitário para combinar classes Tailwind condicionalmente

// ============================================================================
// Exporte direto dos componentes principais do Radix Popover
// ============================================================================
const Popover = PopoverPrimitive.Root
// Componente raiz do popover, controla abertura/fechamento

const PopoverTrigger = PopoverPrimitive.Trigger
// Elemento que abre o popover quando clicado

// ============================================================================
// Componente PopoverContent — estilização e animações do conteúdo do popover
// ============================================================================
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>, // Tipo exato da ref do Radix
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> // Todas as props aceitas pelo Content
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    {/* Renderiza o conteúdo do popover em um portal (fora da árvore visual normal) */}
    <PopoverPrimitive.Content
      ref={ref} // Encaminha ref externa
      align={align} // Define alinhamento (center, start, end)
      sideOffset={sideOffset} // Espaço entre o trigger e o popover
      className={cn(
        // Estilos padrão (Tailwind)
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
        // Animações baseadas no estado do popover
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        // Animações dependendo do lado onde o popover aparece
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        className // Permite sobrescrever/estender classes
      )}
      {...props} // Outras props (side, collision, etc.)
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName
// Define o nome exibido no DevTools

// ============================================================================
// Exporta todos os componentes do popover
// ============================================================================
export { Popover, PopoverTrigger, PopoverContent }
