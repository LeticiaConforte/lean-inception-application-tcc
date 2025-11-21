import KickoffTemplate from '@/components/templates/KickoffTemplate';                       // Importa o template de Kickoff
import AgendaTemplate from '@/components/templates/AgendaTemplate';                         // Importa o template da Agenda
import ParkingLotTemplate from '@/components/templates/ParkingLotTemplate';                 // Importa o template Parking Lot
import GlossaryTemplate from '@/components/templates/GlossaryTemplate';                     // Importa o template Glossário
import ProductVisionTemplate from '@/components/templates/ProductVisionTemplate';           // Importa o template Visão do Produto
import ProductIsIsNotTemplate from '@/components/templates/ProductIsIsNotTemplate';         // Importa o template Product Is / Is Not
import ProductGoalsTemplate from '@/components/templates/ProductGoalsTemplate';             // Importa o template Metas do Produto
import PersonasTemplate from '@/components/templates/PersonasTemplate';                     // Importa o template Personas
import UserJourneysTemplate from '@/components/templates/UserJourneysTemplate';             // Importa o template Jornadas do Usuário
import FeatureBrainstormingTemplate from '@/components/templates/FeatureBrainstormingTemplate'; // Importa o brainstorming de features
import TechnicalReviewTemplate from '@/components/templates/TechnicalReviewTemplate';       // Importa o template Revisão Técnica
import SequencerTemplate from '@/components/templates/SequencerTemplate';                   // Importa o sequenciador
import MVPCanvasTemplate from '@/components/templates/MVPCanvasTemplate';                   // Importa o template MVP Canvas
import WorkshopReport from '@/components/templates/WorkshopReport';                         // Importa o template de relatório final

// Interface que define a estrutura de um template salvo no Firestore
interface Template {
  id: string;                                                                               // ID do template no banco
  step_number: number;                                                                      // Número da etapa correspondente
  template_name: string;                                                                    // Nome para mapear o componente
  content: any;                                                                             // Conteúdo salvo daquela etapa
  is_locked: boolean;                                                                       // Define se o template pode ser editado ou não
}

// Props recebidas pelo TemplateRenderer
interface TemplateRendererProps {
  template: Template;                                                                       // Template atual sendo exibido
  templates: Template[];                                                                    // Lista completa de templates. usada no relatório
  workshopName: string;                                                                     // Nome do workshop atual
  participants?: string[];                                                                  // Lista de participantes (opcional)
  onTemplateChange: (newContent: any) => void;                                              // Callback para atualizar o conteúdo do template
  onGoToTemplate: (templateName: string) => void;                                           // Callback para navegar entre templates
}

// Componente responsável por renderizar o template correto baseado no nome
const TemplateRenderer: React.FC<TemplateRendererProps> = ({ 
  template,                                                                                 // Template atual
  templates,                                                                                // Lista de templates completa
  workshopName,                                                                             // Nome do workshop
  participants,                                                                             // Participantes (usado no relatório)
  onTemplateChange,                                                                         // Função chamada ao modificar conteúdo
  onGoToTemplate                                                                            // Função para navegar para outra etapa
}) => {

  if (!template) {                                                                          // Se o template ainda não foi carregado
    return <div>Select a template</div>;                                                    // Exibe mensagem padrão
  }

  // Mapeamento entre nome do template e o componente correspondente
  const components: { [key: string]: React.FC<any> } = {
    'Kickoff': KickoffTemplate,                                                             // Kickoff
    'Agenda': AgendaTemplate,                                                               // Agenda
    'Parking Lot': ParkingLotTemplate,                                                      // Parking Lot
    'Glossary': GlossaryTemplate,                                                           // Glossário
    'Product Vision': ProductVisionTemplate,                                                // Visão do Produto
    'Product Is/Is Not': ProductIsIsNotTemplate,                                            // Produto É / Não É
    'Product Goals': ProductGoalsTemplate,                                                  // Metas do Produto
    'Personas': PersonasTemplate,                                                           // Personas
    'User Journeys': UserJourneysTemplate,                                                  // Jornada do Usuário
    'Feature Brainstorming': FeatureBrainstormingTemplate,                                  // Brainstorming de Features
    'Technical Review': TechnicalReviewTemplate,                                            // Revisão Técnica
    'Sequencer': SequencerTemplate,                                                         // Sequenciamento
    'MVP Canvas': MVPCanvasTemplate,                                                        // MVP Canvas
    'Workshop Report': WorkshopReport,                                                      // Relatório final consolidado
  };

  const Component = components[template.template_name];                                     // Seleciona o componente correto pelo nome

  // Caso especial: Relatório consolidado do workshop
  if (template.template_name === 'Workshop Report') {                                       
    return Component                                                                         // Se existir. renderiza o relatório com props especiais
      ? <Component 
          templates={templates}                                                             // Passa a lista completa de templates
          workshopName={workshopName}                                                       // Nome do workshop
          participants={participants}                                                       // Lista de participantes
          onGoToTemplate={onGoToTemplate}                                                   // Permite navegar para outros templates
        />
      : <div>Template not found</div>;                                                      // Caso o componente não exista
  }

  // Renderiza qualquer outro template normal
  return Component 
    ? <Component 
        content={template.content}                                                          // Conteúdo salvo daquela etapa
        onContentChange={onTemplateChange}                                                  // Função de atualização
        isReadOnly={template.is_locked}                                                     // Bloqueia edição caso is_locked = true
      />
    : <div>Template not found</div>;                                                        // Caso não encontre o componente
};

export default TemplateRenderer;                                                             // Exporta o componente principal
