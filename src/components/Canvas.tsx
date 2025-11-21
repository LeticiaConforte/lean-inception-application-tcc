import React from 'react'
import { Button } from '@/components/ui/button'                 // Botão estilizado
import { ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react' // Ícones
import TemplateRenderer from '@/components/TemplateRenderer'   // Renderizador dinâmico de templates

// Estrutura de um template dentro do workshop
interface Template {
  id: string                 // ID do template
  step_number: number        // Número da etapa
  template_name: string      // Nome da etapa
  content: any               // Dados da etapa
  is_locked: boolean         // Flag de bloqueio
}

// Propriedades recebidas pelo Canvas
interface CanvasProps {
  template: Template                     // Template atual renderizado
  templates: Template[]                  // Lista completa de templates
  workshopName: string                   // Nome do workshop
  participants?: string[]                // Lista opcional de participantes
  onTemplateChange: (newContent: any) => void // Atualiza conteúdo do template
  onNext: () => void                     // Avança para próxima etapa
  onPrev: () => void                     // Volta para etapa anterior
  isFirst: boolean                       // Indicador de primeira etapa
  isLast: boolean                        // Indicador de última etapa
  onOpenComments: () => void             // Abre painel de comentários
  onGoToTemplate: (templateName: string) => void // Navega diretamente para outra etapa
}

// Componente principal do Canvas (área de edição dos templates)
const Canvas: React.FC<CanvasProps> = ({
  template,
  templates,
  workshopName,
  participants,
  onTemplateChange,
  onNext,
  onPrev,
  isFirst,
  isLast,
  onOpenComments,
  onGoToTemplate,
}) => {
  const isAgenda = template.template_name === 'Agenda' // Verifica se é a etapa Agenda

  return (
    <div className="relative flex-1 flex flex-col bg-gray-50 p-6">
      {/* Barra de navegação superior */}
      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center space-x-2">
          {/* Botão para abrir comentários */}
          <Button onClick={onOpenComments} variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments
          </Button>

          {/* Botão para voltar */}
          <Button onClick={onPrev} disabled={isFirst} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Prev
          </Button>

          {/* Botão para avançar */}
          <Button onClick={onNext} disabled={isLast} variant="outline">
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Área principal onde o template é exibido */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Se a etapa estiver bloqueada e não for Agenda ou Workshop Report, mostra overlay */}
        {template.is_locked &&
          template.template_name !== 'Workshop Report' &&
          !isAgenda && (
            <div className="absolute inset-0 bg-gray-200 bg-opacity-50 z-10 flex items-center justify-center">
              <div className="text-center p-4 bg-white rounded-lg shadow-lg">
                <h3 className="text-xl font-bold">Step Complete</h3>
                <p className="text-gray-600">
                  This step has been marked as complete and is locked for editing.
                </p>
              </div>
            </div>
          )}

        {/* Renderiza o conteúdo dinâmico da etapa */}
        <TemplateRenderer
          template={template}
          templates={templates}
          workshopName={workshopName}
          participants={participants}
          onTemplateChange={onTemplateChange}
          onGoToTemplate={onGoToTemplate}
        />
      </div>
    </div>
  )
}

export default Canvas
