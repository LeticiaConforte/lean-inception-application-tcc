import * as React from "react" // Importa React para suportar refs e componentes
import * as AvatarPrimitive from "@radix-ui/react-avatar" // Importa os componentes base de Avatar do Radix UI

import { cn } from "@/lib/utils" // Função auxiliar para concatenar classes de forma condicional

// ============================================================================
// Avatar — container principal do avatar
// ============================================================================
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>, // Define o tipo da ref com base no Root do Radix
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> // Props herdadas do componente Root do Radix
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref} // Encaminha a ref para o elemento raiz do avatar
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", 
      // relative: permite posicionamento interno
      // flex: centraliza conteúdo
      // h-10 w-10: tamanho padrão do avatar
      // shrink-0: impede encolhimento em layouts flex
      // overflow-hidden: oculta partes excedentes da imagem
      // rounded-full: torna o avatar circular
      className // Permite sobrescrever/estender estilos
    )}
    {...props} // Repasse de props adicionais do usuário
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName // Mantém o nome original para melhor debugging

// ============================================================================
// AvatarImage — imagem principal (caso carregue corretamente)
// ============================================================================
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>, // Tipo da ref baseado no Image do Radix
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> // Props herdadas do Radix Image
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref} // Ref é passada ao elemento <img>
    className={cn("aspect-square h-full w-full", className)}
    // aspect-square: mantém proporções quadradas
    // h-full w-full: faz a imagem ocupar toda a área do avatar
    {...props} // Outras props como src, alt, etc.
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName // Nome para DevTools

// ============================================================================
// AvatarFallback — texto/emoji/iniciais mostrados quando a imagem falha
// ============================================================================
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>, // Tipo da ref baseado no Fallback do Radix
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> // Props herdadas do Fallback
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref} // Ref no fallback
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      // flex + center: centraliza o conteúdo de fallback
      // h-full w-full: ocupa todo o container
      // rounded-full: mantém formato circular
      // bg-muted: fundo neutro para fallback
      className
    )}
    {...props} // Props extras, como children (iniciais, ícone, etc.)
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName // Nome para DevTools

// Exporta os três componentes para uso externo
export { Avatar, AvatarImage, AvatarFallback }
