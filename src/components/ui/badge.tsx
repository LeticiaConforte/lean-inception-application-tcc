import * as React from "react" 
// Importa React para permitir uso de JSX e tipos de elementos

import { cva, type VariantProps } from "class-variance-authority" 
// cva: função para criar variantes de classe de forma organizada
// VariantProps: extrai automaticamente os tipos das variantes criadas

import { cn } from "@/lib/utils" 
// Função auxiliar para combinar classes condicionalmente

// ============================================================================
// Definição das variantes do componente Badge usando CVA
// ============================================================================
const badgeVariants = cva(
  // Classes base aplicadas a todos os badges
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      // Define os tipos de variantes disponíveis
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
          // Badge padrão com cores do tema primário

        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
          // Badge alternativo usando o tema secundário

        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
          // Badge indicando ação destrutiva/erro

        outline: "text-foreground",
        // Badge sem preenchimento, apenas texto e borda padrão
      },
    },
    defaultVariants: {
      variant: "default",
      // Variante padrão caso nenhuma seja especificada
    },
  }
)

// ============================================================================
// Tipagem das props do Badge
// ============================================================================
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, // Permite qualquer atributo padrão de <div>
    VariantProps<typeof badgeVariants> {} // Permite usar a prop "variant" com tipagem automática

// ============================================================================
// Componente Badge — usa as variantes definidas no CVA
// ============================================================================
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      // badgeVariants({ variant }) → gera as classes com base na variante passada
      // className → permite sobrescrever ou estender estilos
      {...props} // repassa outras props (ex: children)
    />
  )
}

// Exporta o componente e suas variantes para uso externo
export { Badge, badgeVariants }
