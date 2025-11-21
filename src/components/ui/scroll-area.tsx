import * as React from "react"
// Importa React para usar forwardRef e elementos JSX

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
// Importa os componentes base de ScrollArea do Radix UI

import { cn } from "@/lib/utils"
// Função utilitária para combinar classes condicionalmente

// ============================================================================
// Componente ScrollArea — container com barra de rolagem estilizada
// ============================================================================
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>, // Tipo da ref do elemento Root
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> // Props aceitas pelo componente Root
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref} // Encaminha ref externa
    className={cn("relative overflow-hidden", className)} // Estilos base + possíveis classes externas
    {...props} // Outras props (style, etc.)
  >
    {/* Viewport — área onde o conteúdo realmente rola */}
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>

    {/* Barra de rolagem personalizada */}
    <ScrollBar />

    {/* Canto entre as barras horizontal + vertical */}
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName
// Define o nome do componente para DevTools

// ============================================================================
// Componente ScrollBar — barra de rolagem customizada
// ============================================================================
const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>, // Tipo de ref
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> // Props nativas
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref} // Ref externa
    orientation={orientation} // Define orientação: vertical ou horizontal
    className={cn(
      // Estilos base da scrollbar
      "flex touch-none select-none transition-colors",

      // Estilos específicos para orientação vertical
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",

      // Estilos específicos para orientação horizontal
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",

      className // Classes externas opcionais
    )}
    {...props}
  >
    {/* Thumb — parte "arrastável" da barra */}
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName =
  ScrollAreaPrimitive.ScrollAreaScrollbar.displayName
// Nome amigável no DevTools

// ============================================================================
// Exportação dos componentes
// ============================================================================
export { ScrollArea, ScrollBar }
