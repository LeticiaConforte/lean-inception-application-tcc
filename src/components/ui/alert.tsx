import * as React from "react" // Importa React para hooks e criação de componentes
import { cva, type VariantProps } from "class-variance-authority" // cva permite criar variantes de estilos com classes utilitárias

import { cn } from "@/lib/utils" // Função para concatenar classes de forma condicional

// ============================================================================
// alertVariants — define variantes de estilo usando class-variance-authority
// ============================================================================
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  // relative: permite posicionar ícone interno de forma absoluta
  // w-full: largura total
  // rounded-lg: cantos arredondados
  // border p-4: borda e padding interno
  // selectors com [&>svg]: ajustam automaticamente o espaçamento quando há ícone
  {
    variants: {
      variant: {
        default: "bg-background text-foreground", // Estilo padrão neutro
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
          // Variante de alerta destrutivo: borda e texto em tom de erro
      },
    },
    defaultVariants: {
      variant: "default", // Define a variante padrão
    },
  }
)

// ============================================================================
// Alert — container do alerta estilizado
// ============================================================================
const Alert = React.forwardRef<
  HTMLDivElement, // Tipo da ref — um div real
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> 
  // Props normais de uma <div> + props de variante do cva
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref} // Encaminha a ref para o elemento root
    role="alert" // Acessibilidade: indica que é um alerta
    className={cn(alertVariants({ variant }), className)} 
    // Gera classes conforme a variante e adiciona classes extras
    {...props} // Repasse de props como id, onClick, etc.
  />
))
Alert.displayName = "Alert" // Nome amigável no React DevTools

// ============================================================================
// AlertTitle — título do alerta
// ============================================================================
const AlertTitle = React.forwardRef<
  HTMLParagraphElement, // Tipo da ref (aqui poderia ser HTMLHeadingElement, mas o tipo original é paragraph)
  React.HTMLAttributes<HTMLHeadingElement> // Props de um heading (h1/h5/etc.)
>(({ className, ...props }, ref) => (
  <h5
    ref={ref} // Encaminha ref
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    // mb-1: margem inferior suave
    // font-medium: peso da fonte
    // tracking-tight: espaçamento mais compacto
    {...props} // Repasse das props
  />
))
AlertTitle.displayName = "AlertTitle" // Nome para DevTools

// ============================================================================
// AlertDescription — texto descritivo do alerta
// ============================================================================
const AlertDescription = React.forwardRef<
  HTMLParagraphElement, // Tipo da ref
  React.HTMLAttributes<HTMLParagraphElement> // Props padrão de parágrafo
>(({ className, ...props }, ref) => (
  <div
    ref={ref} // Encaminha ref
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    // text-sm: texto menor
    // [&_p]:leading-relaxed → aplica line-height relaxado em parágrafos internos
    {...props} // Repasse das props
  />
))
AlertDescription.displayName = "AlertDescription" // Nome para DevTools

// ============================================================================
// Exportação dos componentes
// ============================================================================
export { Alert, AlertTitle, AlertDescription }
