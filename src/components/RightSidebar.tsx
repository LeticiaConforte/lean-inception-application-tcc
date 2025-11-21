import React from 'react'; // Importa React
import { Button } from '@/components/ui/button'; // Componente de botão
import { Users, Bot, History, MessageSquare, FileDown, PanelLeft, PanelRight, Send } from 'lucide-react'; // Ícones
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Componentes de tooltip

interface RightSidebarProps {
  onOpenTeamInvite: () => void;          // Função para abrir convite de time
  onOpenAIAssistant: () => void;         // Função para abrir assistente de IA
  onOpenHistory: () => void;             // Função para abrir histórico
  onOpenChat: () => void;                // Função para abrir chat
  onOpenExport: () => void;              // Função para exportar PDF
  onOpenWorkshopInvite: () => void;      // Função para convidar ao workshop
  isExporting: boolean;                  // Indica se está exportando
  isTeamInviteDisabled: boolean;         // Desabilita botão de time
  isWorkshopReport: boolean;             // Só exporta se for relatório
  isSidebarOpen: boolean;                // Indica se sidebar de passos está aberta
  onToggleSidebar: () => void;           // Alterna visibilidade da sidebar de passos
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onOpenTeamInvite,          // Prop de abrir convite de time
  onOpenAIAssistant,         // Prop de abrir IA
  onOpenHistory,             // Prop de abrir histórico
  onOpenChat,                // Prop de abrir chat
  onOpenExport,              // Prop de exportar relatório
  onOpenWorkshopInvite,      // Prop de convidar ao workshop
  isExporting,               // Flag de exportação
  isTeamInviteDisabled,      // Flag de bloqueio de time
  isWorkshopReport,          // Flag de template atual ser relatório
  isSidebarOpen,             // Flag de sidebar de passos aberta
  onToggleSidebar,           // Função para abrir/fechar sidebar
}) => {
  return (
    <TooltipProvider> {/* Provider dos tooltips */}
      <aside className="bg-white w-16 flex flex-col items-center py-4 space-y-4"> {/* Sidebar lateral direita */}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onToggleSidebar} variant="ghost" size="icon"> {/* Botão para abrir/fechar steps */}
              {isSidebarOpen ? <PanelRight className="h-6 w-6" /> : <PanelLeft className="h-6 w-6" />} {/* Ícone alternado */}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {isSidebarOpen ? 'Hide Steps' : 'Show Steps'} {/* Tooltip */}
          </TooltipContent>
        </Tooltip>

        <div className="w-full px-2"> {/* Linha divisória */}
          <div className="bg-gray-200 h-px w-full"></div>
        </div>

        {!isTeamInviteDisabled && ( // Exibe se permitido
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onOpenTeamInvite} variant="ghost" size="icon"> {/* Botão time */}
                <Users className="h-6 w-6" /> {/* Ícone */}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Team Invite</p> {/* Tooltip */}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onOpenWorkshopInvite} variant="ghost" size="icon"> {/* Botão convidar workshop */}
              <Send className="h-6 w-6" /> {/* Ícone */}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Invite to Workshop</p> {/* Tooltip */}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onOpenAIAssistant} variant="ghost" size="icon"> {/* Botão IA */}
              <Bot className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>AI Assistant</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onOpenHistory} variant="ghost" size="icon"> {/* Botão histórico */}
              <History className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>History</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onOpenChat} variant="ghost" size="icon"> {/* Botão chat */}
              <MessageSquare className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Chat</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onOpenExport}                  // Exporta PDF
              disabled={!isWorkshopReport || isExporting} // Só habilita se estiver no relatório
              variant="ghost"
              size="icon"
            >
              <FileDown className="h-6 w-6" />       {/* Ícone */}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Export</p>
          </TooltipContent>
        </Tooltip>

      </aside>
    </TooltipProvider>
  );
};
