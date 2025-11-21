import { useTheme } from "next-themes"
// Hook do Next Themes para obter o tema atual (light, dark ou system)

import { Toaster as Sonner, toast } from "sonner"
// Sonner é o componente de notificações.
// Renomeamos Toaster → Sonner para evitar conflito com nosso Toaster customizado
// e também exportamos o toast (função para disparar notificações)

type ToasterProps = React.ComponentProps<typeof Sonner>
// Tipo dos props aceitos pelo componente Sonner (herdados para nosso wrapper)

// ============================================================================
// Toaster — wrapper do Sonner com integração ao theme do Next.js
// ============================================================================
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  // Obtém o tema atual (pode retornar undefined no server) por isso cai no "system"

  return (
    <Sonner
      // Garante que o Sonner use exatamente o mesmo tema usado na aplicação
      theme={theme as ToasterProps["theme"]}

      // Classe aplicada ao contêiner geral dos toasts
      className="toaster group"

      // Customização de estilos para cada parte do toast
      toastOptions={{
        classNames: {
          toast:
            // Estilo do toast em si, sincronizado com o design system
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",

          description:
            // Estilo da descrição do toast (texto secundário)
            "group-[.toast]:text-muted-foreground",

          actionButton:
            // Estilo do botão principal dentro do toast
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",

          cancelButton:
            // Estilo do botão de cancelamento do toast
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}

      {...props} // repassa qualquer outra prop recebida
    />
  )
}

// Exporta o componente Toaster e a função de emitir toasts
export { Toaster, toast }
