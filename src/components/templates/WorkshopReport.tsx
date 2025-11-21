import React from 'react'; // Importa o React para criar o componente funcional
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importa componentes de Card reutilizáveis do design system
import TemplateContentRenderer from '@/components/TemplateContentRenderer'; // Importa o componente responsável por renderizar o conteúdo de cada template
import { Template } from '@/types'; // Importa o tipo Template para tipar corretamente as props

interface WorkshopReportProps {
  templates: Template[]; // Lista de templates que compõem o relatório do workshop
}

const WorkshopReport: React.FC<WorkshopReportProps> = ({ templates }) => { // Componente funcional que recebe os templates do workshop
  const reportTemplates = templates // Cria uma nova lista de templates para o relatório
    .filter((template) => template.template_name !== 'Workshop Report') // Remove o próprio template de “Workshop Report” da lista. evita recursão e duplicidade
    .sort((a, b) => a.step_number - b.step_number); // Ordena os templates pela ordem da etapa. garantindo sequência correta no relatório

  return (
    <div className="workshop-report-container bg-white p-8"> {/* Container principal do relatório. com fundo branco e padding */}
      <div className="flex justify-between items-center mb-8 print-hide"> {/* Cabeçalho do relatório. oculto na impressão por causa da classe print-hide */}
        <h1 className="text-3xl font-bold">Workshop Report</h1> {/* Título principal exibido no topo da página */}
      </div>
      <div className="printable-content"> {/* Área destinada ao conteúdo que será impresso ou exportado */}
        <p className="text-gray-600 mb-8">
          This is a summary of your workshop. You can review the content of each step below.
        </p> {/* Texto introdutório explicando que abaixo está o resumo das etapas do workshop */}
        <div className="space-y-6"> {/* Wrapper que empilha os cards das etapas com espaçamento vertical entre eles */}
          {reportTemplates.map((template) => ( // Percorre os templates filtrados e ordenados para renderizar cada etapa
            <Card key={template.id} className="break-after-page"> {/* Card de cada etapa. a classe break-after-page força quebra de página na impressão */}
              <CardHeader> {/* Cabeçalho do card da etapa */}
                <CardTitle>
                  {template.step_number}. {template.template_name}
                </CardTitle> {/* Exibe o número da etapa seguido do nome do template. por exemplo: “3. Product Vision” */}
              </CardHeader>
              <CardContent> {/* Corpo do card. onde será renderizado o conteúdo da etapa */}
                <TemplateContentRenderer template={template} isReadOnly={true} /> {/* Renderiza o conteúdo do template em modo somente leitura. sem permitir edição */}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkshopReport; // Exporta o componente WorkshopReport como padrão para uso em outras partes da aplicação
