import React from 'react'
// Importa a biblioteca React para criar o componente funcional

import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
// Importa componentes do sistema de Sheet (sidebar deslizante) do shadcn/ui

import { TemplateChat } from './TemplateChat'
// Importa o componente de chat da IA usado dentro do assistente

// Define os tipos das propriedades esperadas pelo componente AIAssistant
interface AIAssistantProps {
  open: boolean // Controla se o painel está aberto
  onOpenChange: (open: boolean) => void // Função que altera o estado de abertura
  workshopId: string // ID do workshop usado para carregar o contexto do chat
}

// Componente funcional responsável pela interface do assistente de IA
export const AIAssistant: React.FC<AIAssistantProps> = ({
  open,          // Estado de abertura vindo do componente pai
  onOpenChange,  // Função disparada quando o usuário abre/fecha o painel
  workshopId,    // ID do workshop que será enviado para o TemplateChat
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Componente Sheet que controla o painel lateral */}

      <SheetContent className="w-[500px] sm:w-[540px] p-0 flex flex-col">
        {/* Conteúdo do painel lateral com largura fixa e layout em coluna */}

        <SheetTitle className="sr-only">
          {/* Título oculto para acessibilidade */}
          AI Assistant
        </SheetTitle>

        <SheetDescription className="sr-only">
          {/* Descrição oculta. Ajuda leitores de tela */}
          Chat with the AI to get help with your workshop. You can start a new chat or view your history.
        </SheetDescription>

        <TemplateChat workshopId={workshopId} />
        {/* Componente que renderiza o chat da IA. Recebe o ID do workshop como parâmetro */}
      </SheetContent>
    </Sheet>
  )
}
