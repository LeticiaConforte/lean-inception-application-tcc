import React from 'react'
import {
  AlertDialog,              // Componente raiz do modal de confirmação
  AlertDialogAction,        // Botão de ação (confirmar)
  AlertDialogCancel,        // Botão de cancelamento
  AlertDialogContent,       // Container interno do modal
  AlertDialogDescription,   // Descrição textual
  AlertDialogFooter,        // Área inferior do modal (botões)
  AlertDialogHeader,        // Cabeçalho do modal
  AlertDialogTitle,         // Título do modal
} from '@/components/ui/alert-dialog'

// Props permitidas pelo componente
interface ConfirmationDialogProps {
  isOpen: boolean                 // Controla se o modal está aberto
  onClose: () => void            // Ação ao fechar
  onConfirm: () => void          // Ação ao confirmar
  title: string                  // Título exibido no diálogo
  description: string            // Texto descritivo
  confirmText?: string           // Texto do botão confirmar (opcional)
  cancelText?: string            // Texto do botão cancelar (opcional)
  icon?: React.ReactNode         // Ícone customizado opcional
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',   // Valor padrão
  cancelText = 'Cancel',     // Valor padrão
  icon,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      {/* Estrutura central do diálogo */}
      <AlertDialogContent>
        <AlertDialogHeader>
          {/* Cabeçalho com título + ícone opcional */}
          <div className="flex items-center space-x-2">
            {icon}                           {/* Mostra ícone se presente */}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        {/* Texto principal da descrição */}
        <AlertDialogDescription>
          {description}
        </AlertDialogDescription>

        {/* Botões do rodapé */}
        <AlertDialogFooter>
          {/* Botão de cancelar */}
          <AlertDialogCancel onClick={onClose}>
            {cancelText}
          </AlertDialogCancel>

          {/* Botão de confirmar ação */}
          <AlertDialogAction onClick={onConfirm}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmationDialog
