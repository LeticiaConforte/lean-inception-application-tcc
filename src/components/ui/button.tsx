import * as React from "react"
// Importa React para possibilitar o uso de JSX e referencias com forwardRef

import { Slot } from "@radix-ui/react-slot"
// Slot permite trocar o elemento raiz do botão mantendo estilos (útil para composições)

import { cva, type VariantProps } from "class-variance-authority"
// cva: permite criar variantes de classes organizadas e reutilizáveis
// VariantProps: extrai automaticamente os tipos das variantes criadas pelo cva

import { cn } from "@/lib/utils"
// Função utilitária para concatenar classes condicionalmente

// ============================================================================
// Definição das variantes do botão com CVA
// ============================================================================
const buttonVariants = cva(
  // Classes base aplicadas a todos os botões
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // Tipos de botões disponíveis
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Botão principal usando cor do tema

        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Botão crítico (excluir, remover)

        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        // Botão com borda, fundo neutro

        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Botão secundário com outra paleta do tema

        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Botão sem borda ou preenchimento, apenas interação visual

        link: "text-primary underline-offset-4 hover:underline",
        // Botão visualmente similar a um hyperlink
      },

      // Tamanhos do botão
      size: {
        default: "h-10 px-4 py-2",
        // Tamanho padrão

        sm: "h-9 rounded-md px-3",
        // Botão menor

        lg: "h-11 rounded-md px-8",
        // Botão maior

        icon: "h-10 w-10",
        // Botão quadrado para ícones
      },
    },

    defaultVariants: {
      variant: "default",
      // Variante padrão

      size: "default",
      // Tamanho padrão
    },
  }
)

// ============================================================================
// Tipagem das props do Button
// ============================================================================
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, // Permite qualquer atributo de <button>
    VariantProps<typeof buttonVariants> {                // Permite usar variant e size tipados
  asChild?: boolean                                      // Define se o botão deve usar Slot ao invés de <button>
}

// ============================================================================
// Componente Button — altamente configurável e preparado para composição
// ============================================================================
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {

    // Se asChild for true, substitui o elemento raiz por um Slot
    // Isso permite reutilizar o estilo em outros elementos (ex: <a>, <Link>, etc.)
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        // buttonVariants gera classes conforme variant e size
        // className permite adicionar classes adicionais
        ref={ref} // encaminha ref para o elemento real
        {...props} // repassa demais props do botão
      />
    )
  }
)

Button.displayName = "Button" // Nome do componente no React DevTools

// Exporta o componente e suas variantes
export { Button, buttonVariants }
