import React, { useState } from 'react';                                               // Importa React e hook useState
import { Button } from '@/components/ui/button';                                        // Botão estilizado
import { ArrowLeft, Save, CheckCircle, Edit, RotateCcw } from 'lucide-react';          // Ícones usados no header
import { WorkshopNameEditor } from './WorkshopNameEditor';                             // Componente de edição inline do nome do workshop

// Propriedades esperadas pelo header
interface WorkshopHeaderProps {
  workshopName: string;                                                                 // Nome do workshop
  templateName: string;                                                                 // Nome do template atual
  onBack: () => void;                                                                    // Função para voltar
  onSave: () => void;                                                                    // Ação para salvar
  saving: boolean;                                                                       // Indica se está salvando
  hasUnsavedChanges: boolean;                                                            // Indica se existem alterações não salvas
  isTemplateCompleted: boolean;                                                          // Se o template foi marcado como concluído
  onRename: (newName: string) => void;                                                   // Ação ao renomear
  onMarkComplete: () => void;                                                            // Marca ou desmarca conclusão do step
}

// Componente principal do header do workshop
const WorkshopHeader: React.FC<WorkshopHeaderProps> = ({ 
  workshopName, 
  templateName,
  onBack, 
  onSave, 
  saving, 
  hasUnsavedChanges,
  isTemplateCompleted,
  onRename,
  onMarkComplete,
}) => {

  // Controla se o nome está sendo editado no momento
  const [isEditingName, setIsEditingName] = useState(false);

  // Função que recebe novo nome e encerra o modo de edição
  const handleRename = (newName: string) => {
    onRename(newName);                                                                   // Salva no componente pai
    setIsEditingName(false);                                                             // Fecha modo de edição
  };

  // Verifica templates especiais onde ações são desabilitadas
  const isAgenda = templateName === 'Agenda';                                            // Agenda não pode ser salva
  const isWorkshopReport = templateName === 'Workshop Report';                           // Relatório não pode ser marcado como completo

  // Habilita botão de completar somente para templates normais
  const canBeCompleted = !isAgenda && !isWorkshopReport;

  return (
    <header className="bg-white border-b border-gray-200 flex-shrink-0 z-10">            {/* Header fixo com borda */}
      <div className="px-6 py-3">                                                        {/* Espaçamento interno */}
        <div className="flex items-center justify-between">                              {/* Layout principal */}
          
          {/* Lado esquerdo — voltar e editar nome */}
          <div className="flex items-center space-x-4">
            
            {/* Botão voltar */}
            <Button 
              onClick={onBack} 
              variant="ghost" 
              size="sm" 
              className="text-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />                                     {/* Ícone */}
              Back
            </Button>

            {/* Alterna entre exibição do nome e editor inline */}
            {isEditingName ? (
              <WorkshopNameEditor 
                initialName={workshopName}                                               // Nome atual
                onSave={handleRename}                                                    // Salva ao confirmar
                onCancel={() => setIsEditingName(false)}                                 // Cancela edição
              />
            ) : (
              <div className="flex items-center space-x-2">
                
                {/* Nome do workshop */}
                <h1 className="text-lg font-bold text-gray-800">
                  {workshopName}
                </h1>

                {/* Botão que ativa o modo de edição */}
                <Button 
                  onClick={() => setIsEditingName(true)} 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Edit className="h-4 w-4" />                                           {/* Ícone editar */}
                </Button>

              </div>
            )}
          </div>

          {/* Lado direito — Salvar e completar step */}
          <div className="flex items-center space-x-2">

            {/* Botão para salvar alterações */}
            <Button 
              onClick={onSave}
              disabled={saving || !hasUnsavedChanges || isAgenda}                        // Bloqueia quando não aplicável
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />                                          {/* Ícone */}
              {saving ? 'Saving...' : 'Save'}                                            {/* Texto condicional */}
            </Button>
            
            {/* Botão para marcar step como completo / reabrir */}
            {canBeCompleted && (
              <Button
                onClick={onMarkComplete}
                disabled={hasUnsavedChanges}                                             // Só pode completar se não houver alterações pendentes
                className={`${isTemplateCompleted 
                  ? 'bg-yellow-500 hover:bg-yellow-600'                                  // Reabrir
                  : 'bg-green-600 hover:bg-green-700'                                    // Completar
                } text-white`}
              >
                {/* Ícone e texto alternados */}
                {isTemplateCompleted ? (
                  <RotateCcw className="h-4 w-4 mr-2" />                                 // Reabrir step
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />                               // Marcar como concluído
                )}
                
                {isTemplateCompleted ? 'Re-open Step' : 'Mark Step Complete'}
              </Button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};

export default WorkshopHeader;                                                          // Exporta componente
