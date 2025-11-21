import * as React from "react"
// Importa React para permitir uso de forwardRef e JSX

import * as SeparatorPrimitive from "@radix-ui/react-separator"
// Importa todos os componentes primitivos do Radix Separator (Root)

import { cn } from "@/lib/utils"
// Utilitário de classes dinâmicas

// ============================================================================
// Separator — componente estilizado baseado no Radix Separator
// ============================================================================
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>, // Tipo da ref externa
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> // Props aceitas pelo Root
>(
  (
    {
      className,            // Permite sobrepor/estender classes
      orientation = "horizontal", // Define se o separador é horizontal ou vertical
      decorative = true,    // Indica se é apenas decorativo (não acessível)
      ...props              // Outras props repassadas ao elemento Root
    },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}            // repassa a ref externa
      decorative={decorative} // define comportamento acessível (decorativo → ignorado por leitores de tela)
      orientation={orientation} // vertical ou horizontal
      className={cn(
        "shrink-0 bg-border", // estilo base: não encolhe e usa cor padrão para bordas

        // Define tamanho conforme orientação
        orientation === "horizontal"
          ? "h-[1px] w-full"  // Linha horizontal
          : "h-full w-[1px]", // Linha vertical

        className // Permite customização externa
      )}
      {...props} // repassa demais propriedades
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName
// Garante nome correto no React DevTools

// Exporta o componente final
export { Separator }
