import React from 'react';                                                                                         // Importa a biblioteca React para criar o componente funcional
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; 
                                                                                                                   // Importa componentes estruturais do sistema de diálogos (modal)
import { Button } from '@/components/ui/button';                                                                    // Importa o componente de botão da UI

interface WorkspaceMembersDialogProps {                                                                            // Define as props esperadas pelo componente
  isOpen: boolean;                                                                                                 // Controla se o diálogo está aberto
  onOpenChange: (isOpen: boolean) => void;                                                                         // Função para alterar o estado de abertura
  workspaceId: string;                                                                                             // ID do workspace, utilizado futuramente para buscar membros
}

const WorkspaceMembersDialog: React.FC<WorkspaceMembersDialogProps> = ({ isOpen, onOpenChange, workspaceId }) => { // Cria o componente funcional que recebe as props acima
  // Lógica para buscar e gerenciar membros do workspace será adicionada aqui                                      // Comentário indicando que a implementação virá depois

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>                                                             {/* Componente principal de diálogo, controlado por isOpen */}
      <DialogContent>                                                                                              {/* Conteúdo interno do modal */}
        <DialogHeader>                                                                                             {/* Área de cabeçalho com título e descrição */}
          <DialogTitle>Workspace Members</DialogTitle>                                                             {/* Título do modal */}
          <DialogDescription>                                                                                      {/* Descrição explicando funcionalidade */}
            Manage members for workspace {workspaceId}                                                             {/* Exibe o ID do workspace para referência */}
          </DialogDescription>
        </DialogHeader>
        <div>                                                                                                      {/* Corpo do modal com conteúdo placeholder */}
          <p>Member management UI will be here.</p>                                                                {/* Texto temporário indicando futura interface */}
        </div>
        <DialogFooter>                                                                                             {/* Rodapé com ações */}
          <Button                                                                                                   // Botão para fechar o modal
            variant="outline"                                                                                      // Estilo do botão
            onClick={() => onOpenChange(false)}                                                                     // Ao clicar, fecha o diálogo
          >
            Close                                                                                                  {/* Texto do botão */}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceMembersDialog;                                                                              // Exporta o componente para uso em outras partes da aplicação
