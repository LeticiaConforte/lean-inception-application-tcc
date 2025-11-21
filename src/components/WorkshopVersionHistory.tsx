import React, { useState } from 'react';                                                            // Importa React e o hook useState
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'; // Componentes do painel lateral (Sheet)
import { Clock } from 'lucide-react';                                                                // Ícone de relógio

// Define as props esperadas pelo componente
interface WorkshopVersionHistoryProps {
  open: boolean;                                                                                     // Controle de abertura/fechamento do painel
  onOpenChange: (open: boolean) => void;                                                             // Callback para mudança de estado
  workshopId: string;                                                                                // ID do workshop (não utilizado ainda)
  templateName: string;                                                                              // Nome do template atual
}

// Componente de histórico de versões
export const WorkshopVersionHistory: React.FC<WorkshopVersionHistoryProps> = ({ 
  open, 
  onOpenChange, 
  templateName 
}) => {

  const [versions] = useState([]);                                                                   // Estado fixo para versões, ainda vazio pois a funcionalidade não está implementada

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>                                                   {/* Componente Sheet controlado por "open" */}
      <SheetContent className="w-[500px] sm:w-[540px] p-0 flex flex-col">                            {/* Conteúdo do painel lateral, largura configurada */}
        
        <SheetHeader className="p-6 pb-4 border-b">                                                  {/* Cabeçalho do painel */}
          <SheetTitle className="flex items-center">                                                 {/* Título com ícone */}
            <Clock className="h-6 w-6 mr-2"/>                                                        {/* Ícone de relógio */}
            Workshop History                                                                          {/* Texto do título */}
          </SheetTitle>

          <SheetDescription>                                                                         {/* Descrição do painel */}
            Version history for current step: <span className="font-semibold">{templateName}</span>  {/* Exibe nome do template */}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto p-6">                                              {/* Conteúdo scrollável */}
          
          {/* Bloco da versão atual */}
          <div className="border rounded-lg p-4 bg-gray-50 mb-4">
            <div className="grid gap-1.5">
              <div className="font-semibold">Current Version</div>                                   {/* Indicador de versão atual */}
              
              <div className="text-sm text-muted-foreground">                                       {/* Data formatada dinamicamente */}
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <p className="text-sm text-muted-foreground">                                          {/* Texto informativo */}
                Active version - latest changes
              </p>
            </div>
          </div>

          {/* Exibe mensagem caso não existam versões históricas */}
          {versions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 mt-10">
              <Clock className="h-12 w-12 mx-auto text-gray-400"/>                                   {/* Ícone grande */}
              <p className="mt-4 font-semibold">No version history available</p>                     {/* Mensagem principal */}
              <p className="text-sm mt-1">Changes will appear here after modifications</p>           {/* Submensagem */}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Este bloco ficará vazio pois "versions" está sempre vazio por enquanto */}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WorkshopVersionHistory;                                                                // Exporta componente padrão
