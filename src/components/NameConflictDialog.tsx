import React from 'react'                                                           // Importa React
import {
  Dialog,                                                                            // Componente de diálogo
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'                                                     // UI do diálogo
import { Button } from '@/components/ui/button'                                     // Botão
import { AlertTriangle } from 'lucide-react'                                        // Ícone de alerta

// Propriedades aceitas pelo diálogo de conflito de nome
interface NameConflictDialogProps {
  isOpen: boolean;                                                                  // Controle de abertura
  onClose: () => void;                                                              // Função para fechar
  onConfirm: () => void;                                                            // Ação ao confirmar
  name: string;                                                                     // Nome que conflitou
  type: 'workshop' | 'workspace';                                                   // Tipo do item
}

// Componente principal do diálogo
const NameConflictDialog: React.FC<NameConflictDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  name,
  type
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>                                    {/* Abre/fecha diálogo */}
      <DialogContent className="sm:max-w-[425px]">                                   {/* Conteúdo com tamanho fixo */}
        <DialogHeader>                                                               {/* Cabeçalho */}
          <DialogTitle className="flex items-center gap-2">                          {/* Título com ícone */}
            <AlertTriangle className="h-5 w-5 text-yellow-500" />                    {/* Ícone de aviso */}
            Name Already Exists                                                       {/* Título */}
          </DialogTitle>

          {/* Descrição explicando o conflito */}
          <DialogDescription>
            A {type} with the name "<strong>{name}</strong>" already exists.
            We'll automatically add "Copy" to the name to make it unique.
          </DialogDescription>
        </DialogHeader>

        {/* Rodapé com botões */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>                                {/* Botão de cancelar */}
            Cancel
          </Button>

          <Button
            onClick={onConfirm}                                                       // Confirma criação com nome ajustado
            className="bg-inception-blue hover:bg-inception-purple"
          >
            Create Anyway
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}

export default NameConflictDialog                                                    // Exporta componente
