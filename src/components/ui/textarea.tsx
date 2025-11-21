import * as React from "react"
// Importa o React e os tipos necessários para o forwardRef

import { cn } from "@/lib/utils"
// Função para mesclar classes condicionalmente

// ============================================================================
// Tipagem das propriedades aceitas pelo Textarea
// Estende todos os atributos nativos de <textarea>
// ============================================================================
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

// ============================================================================
// Componente Textarea
// ============================================================================
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        // Estilização base applied a todos os textareas
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          // flex: mantém o comportamento responsivo
          // min-h-[80px]: altura mínima para áreas de texto
          // w-full: ocupa toda a largura disponível
          // rounded-md: bordas arredondadas
          // border border-input: borda usando o token de tema
          // bg-background: fundo com cor do tema
          // px-3 py-2: espaçamento interno
          // text-sm: tamanho de texto consistente com inputs
          // ring-offset-background: define o fundo atrás do anel de foco

          // Placeholder estilizado
          "placeholder:text-muted-foreground",

          // Acessibilidade e foco
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",

          // Estados desabilitados
          "disabled:cursor-not-allowed disabled:opacity-50",

          className // permite sobrescrever ou acrescentar classes
        )}
        ref={ref} // encaminha a ref para o elemento textarea real
        {...props} // passa todas as props restantes
      />
    )
  }
)

Textarea.displayName = "Textarea"
// Nome amigável para debugging e DevTools

// ============================================================================
// Exportação
// ============================================================================
export { Textarea }
