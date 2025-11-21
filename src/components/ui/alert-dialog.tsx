import * as React from "react" // Importa o React para hooks, forwardRef e JSX
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog" // Importa os componentes base do AlertDialog do Radix UI

import { cn } from "@/lib/utils" // Função utilitária para mesclar classes condicionalmente
import { buttonVariants } from "@/components/ui/button" // Variantes de botões da UI (primário, outline etc.)

const AlertDialog = AlertDialogPrimitive.Root // Componente raiz do AlertDialog (controla o estado open/close)

const AlertDialogTrigger = AlertDialogPrimitive.Trigger // Elemento que dispara a abertura do dialog

const AlertDialogPortal = AlertDialogPrimitive.Portal // Portal para renderizar o dialog fora da hierarquia normal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>, // Tipagem da ref baseado no Overlay do Radix
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> // Props herdadas do Overlay
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      // fixed inset-0: cobre a tela inteira
      // bg-black/80: fundo escuro translúcido
      // animações baseadas no data-state
      className
    )}
    {...props} // Repasse das demais props
    ref={ref} // Encaminha a ref ao elemento do overlay
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName // Define o nome no DevTools

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>, // Tipagem da ref baseada no Content do Radix
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> // Props herdadas do Content
>(({ className, ...props }, ref) => (
  <AlertDialogPortal> {/* Garante que overlay + content sejam renderizados no portal */}
    <AlertDialogOverlay /> {/* Overlay atrás do conteúdo */}
    <AlertDialogPrimitive.Content
      ref={ref} // Ref encaminhada para o conteúdo da modal
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        // Centraliza o conteúdo no meio da tela usando translate
        // Animações completas: fade, zoom e slide usando data-state
        className
      )}
      {...props} // Repasse das props restantes
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName // Nome amigável para debug

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      // Layout vertical. alinha ao centro no mobile e à esquerda no desktop
      className
    )}
    {...props} // Repasse das props
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader" // Nome para DevTools

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      // Mobile: botões empilhados invertidos
      // Desktop: botões lado a lado alinhados à direita
      className
    )}
    {...props} // Repasse das props
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter" // Nome para DevTools

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>, // Tipagem da ref
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> // Props herdadas
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref} // Encaminha ref para o título
    className={cn("text-lg font-semibold", className)} // Estilo padrão do título
    {...props} // Repasse das props restantes
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName // Nome para DevTools

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>, // Tipagem da ref
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description> // Props herdadas
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref} // Encaminha ref para a descrição
    className={cn("text-sm text-muted-foreground", className)} // Estilo menor e suave
    {...props} // Repasse das props
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName // Nome para DevTools

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>, // Tipagem da ref
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> // Props herdadas
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref} // Ref para o botão principal
    className={cn(buttonVariants(), className)} // Usa o estilo padrão de botão
    {...props} // Repasse das props
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName // Nome para DevTools

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>, // Tipagem da ref
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> // Props herdadas
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref} // Ref no botão de cancelar
    className={cn(
      buttonVariants({ variant: "outline" }), // Usa variante outline no botão de cancelar
      "mt-2 sm:mt-0", // Margem no mobile, removida no desktop
      className
    )}
    {...props} // Repasse das props
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName // Nome para DevTools

export {
  AlertDialog, // Componente raiz
  AlertDialogPortal, // Portal
  AlertDialogOverlay, // Fundo escuro
  AlertDialogTrigger, // Elemento que abre o dialog
  AlertDialogContent, // Contêiner da modal
  AlertDialogHeader, // Cabeçalho
  AlertDialogFooter, // Rodapé
  AlertDialogTitle, // Título
  AlertDialogDescription, // Texto descritivo
  AlertDialogAction, // Botão confirmar
  AlertDialogCancel, // Botão cancelar
}
