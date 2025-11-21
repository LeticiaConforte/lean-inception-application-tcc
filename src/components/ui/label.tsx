import * as React from "react"
// Importa React para usar forwardRef e tipagens

import * as LabelPrimitive from "@radix-ui/react-label"
// Componente base de label do Radix UI

import { cva, type VariantProps } from "class-variance-authority"
// cva permite criar variantes de estilo de forma declarativa

import { cn } from "@/lib/utils"
// Utilitário para combinar classes Tailwind condicionalmente

// ============================================================================
// Variantes do componente Label — define estilos padrão usando cva
// ============================================================================
const labelVariants = cva(
  // Classe base aplicada a todo label
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

// ============================================================================
// Componente Label — estilização sobre o LabelPrimitive.Root
// ============================================================================
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>, // Tipo da ref atrelada ao elemento raiz do Label
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants> // Permite variantes definidas pelo cva
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref} // Encaminha ref externa para o elemento nativo Radix
    className={cn(labelVariants(), className)} // Aplica estilos + permite sobrescrever via className
    {...props} // Inclui todas as props de label (htmlFor, children, etc.)
  />
))
Label.displayName = LabelPrimitive.Root.displayName // Nome amigável no DevTools

// Exporta o componente final
export { Label }
