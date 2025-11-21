import { useToast } from "@/hooks/use-toast"
// Hook customizado que retorna o estado global de toasts e funções para dispará-los

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
// Importa os componentes de Toast que você comentou anteriormente

// ============================================================================
// Componente responsável por renderizar todos os toasts ativos
// ============================================================================
export function Toaster() {
  const { toasts } = useToast()
  // Recebe a lista de toasts atuais gerenciados pelo contexto global

  return (
    // Provider do Radix Toast que envolve toda a árvore de notificação
    <ToastProvider>
      {/* Mapeia cada toast ativo para exibição na interface */}
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            {/* Container com título e descrição */}
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {/* Renderiza o título se existir */}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
              {/* Renderiza a descrição se existir */}
            </div>

            {/* Ação opcional (ex: botão de desfazer) */}
            {action}

            {/* Botão para fechar o toast */}
            <ToastClose />
          </Toast>
        )
      })}

      {/* Área onde os toasts serão posicionados na tela */}
      <ToastViewport />
    </ToastProvider>
  )
}
