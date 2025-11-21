import * as React from "react"
// Importa React para permitir o uso de forwardRef e elementos JSX

import { cn } from "@/lib/utils"
// Função utilitária para mesclar classes condicionalmente (className merge)

// ============================================================================
// Componente base: Card
// ============================================================================
const Card = React.forwardRef<
  HTMLDivElement,                         // Tipo do elemento referenciado
  React.HTMLAttributes<HTMLDivElement>    // Props permitidas no Card
>(({ className, ...props }, ref) => (
  <div
    ref={ref}                              // Encaminha a ref para o elemento raiz
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      // Estilos padrão: borda, fundo, cor do texto, sombra leve
      className                             // Permite sobrescrever ou adicionar classes
    )}
    {...props}                              // Repassa todas as demais props
  />
))
Card.displayName = "Card"                   // Nome exibido no React DevTools

// ============================================================================
// Cabeçalho do Card
// ============================================================================
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}                               // Encaminha a ref
    className={cn(
      "flex flex-col space-y-1.5 p-6",      // Layout em coluna, espaçamento e padding
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// ============================================================================
// Título do Card
// ============================================================================
const CardTitle = React.forwardRef<
  HTMLParagraphElement,                     // Pode ser <h3>, mas semanticamente é tratado como <p>
  React.HTMLAttributes<HTMLHeadingElement>  // Permite atributos de heading
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      // Fonte grande, peso forte, sem espaçamento extra vertical, bom para títulos
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

// ============================================================================
// Descrição do Card
// ============================================================================
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground",       // Texto pequeno e em cor suavizada
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

// ============================================================================
// Conteúdo do Card
// ============================================================================
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pt-0", className)}     // Padding geral, mas remove padding superior
    {...props}
  />
))
CardContent.displayName = "CardContent"

// ============================================================================
// Rodapé do Card
// ============================================================================
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",           // Layout horizontal, padding, sem padding superior
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// ============================================================================
// Exportação dos componentes
// ============================================================================
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
}
