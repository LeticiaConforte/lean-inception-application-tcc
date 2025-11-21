import React from 'react';                                                                 // Importa React para criação do componente
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Componentes de cartão (UI)
import { Button } from '@/components/ui/button';                                           // Botão padrão da interface
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'; // Dropdown Radix
import { Users, MoreVertical, Settings, Trash2 } from 'lucide-react';                     // Ícones usados no card

// Define o formato esperado para as props do componente
interface WorkspaceCardProps {
  workspace: {                                                                             // Objeto com dados do workspace
    id: string;                                                                            // ID do workspace
    name: string;                                                                          // Nome do workspace
    description?: string;                                                                  // Descrição opcional
    user_role: string;                                                                     // Cargo ou permissão do usuário
  };
  onClick: () => void;                                                                     // Ação ao clicar no card
  onDelete: () => void;                                                                    // Ação ao remover workspace
  onManage: () => void;                                                                    // Ação ao gerenciar workspace
  canDelete: boolean;                                                                      // Se o usuário pode deletar o workspace
}

// Componente principal do card do workspace
const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ 
  workspace, 
  onClick, 
  onDelete, 
  onManage, 
  canDelete 
}) => {
  return (
    <Card className="workspace-card hover:shadow-lg transition-all duration-300 min-h-[200px] flex flex-col">
      {/* Header do cartão */}
      <CardHeader onClick={onClick} className="cursor-pointer flex-grow">                  {/* Cabeçalho clicável */}
        <div className="flex items-start justify-between">
          
          {/* Área principal com título e descrição */}
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 flex items-center">                         {/* Título com ícone */}
              <Users className="mr-2 h-5 w-5 text-blue-600" />                             {/* Ícone de usuários */}
              {workspace.name}                                                             {/* Nome do workspace */}
            </CardTitle>

            <CardDescription className="text-sm text-gray-600">                            {/* Descrição do workspace */}
              {workspace.description || 'No description provided.'}                        {/* Descrição padrão se vazia */}
            </CardDescription>
          </div>

          {/* Menu de opções (Manage/Delete) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => e.stopPropagation()}                                       // Impede clique no card ao abrir menu
                className="ml-2 flex-shrink-0"
              >
                <MoreVertical className="h-5 w-5" />                                       {/* Ícone de menu */}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">                                              {/* Menu alinhado à direita */}

              {/* Botão "Manage" */}
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();                                                     // Impede navegação do card
                  onManage();                                                              // Chama função de gerenciamento
                }}
              >
                <Settings className="h-4 w-4 mr-2" />                                      {/* Ícone */}
                Manage
              </DropdownMenuItem>

              {/* Botão "Delete" — aparece só se permitido */}
              {canDelete && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();                                                   // Impede trigger no card
                    onDelete();                                                            // Chama função de deletar
                  }}
                  className="text-red-500"                                                 // Cor vermelha para ação destrutiva
                >
                  <Trash2 className="h-4 w-4 mr-2" />                                      {/* Ícone */}
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>

          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Footer — botão para abrir workspace */}
      <CardContent>
        <Button
          onClick={(e) => {
            e.stopPropagation();                                                           // Evita chamadas duplicadas
            onClick();                                                                     // Abre o workspace
          }}
          size="sm"
          className="bg-inception-blue hover:bg-inception-purple text-white w-full"        // Botão estilizado
        >
          Open Workspace                                                                    {/* Texto do botão */}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkspaceCard;                                                               // Exporta o componente
