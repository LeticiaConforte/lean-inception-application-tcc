import React from 'react';                                                                    // Importa o React necessário para JSX
import KickoffTemplate from './templates/KickoffTemplate';                                   // Template de Kickoff
import AgendaTemplate from './templates/AgendaTemplate';                                     // Template da Agenda
import ParkingLotTemplate from './templates/ParkingLotTemplate';                             // Template de Parking Lot
import GlossaryTemplate from './templates/GlossaryTemplate';                                 // Template de Glossário
import ProductVisionTemplate from './templates/ProductVisionTemplate';                       // Template de Visão do Produto
import ProductIsIsNotTemplate from './templates/ProductIsIsNotTemplate';                     // Template Product Is / Is Not
import ProductGoalsTemplate from './templates/ProductGoalsTemplate';                         // Template de Metas do Produto
import PersonasTemplate from './templates/PersonasTemplate';                                 // Template de Personas
import UserJourneysTemplate from './templates/UserJourneysTemplate';                         // Template de Jornadas do Usuário
import FeatureBrainstormingTemplate from './templates/FeatureBrainstormingTemplate';         // Template de Brainstorming de Features
import TechnicalReviewTemplate from './templates/TechnicalReviewTemplate';                   // Template de Revisão Técnica
import SequencerTemplate from './templates/SequencerTemplate';                               // Template de Sequenciamento
import MVPCanvasTemplate from './templates/MVPCanvasTemplate';                               // Template do MVP Canvas

// Define a estrutura obrigatória de um template vindo do Firestore
interface Template {
  id: string;                                                                                 // ID do documento no Firestore
  step_number: number;                                                                        // Número da etapa dentro do workshop
  template_name: string;                                                                      // Nome do template para mapear o componente
  content: any;                                                                               // Conteúdo salvo do template
  is_locked: boolean;                                                                         // Indica se o template está bloqueado
}

// Props aceitas pelo renderer de template
interface TemplateContentRendererProps {
  template: Template;                                                                         // Template que deve ser renderizado
  isReadOnly?: boolean;                                                                       // Modo somente leitura para bloquear edição
  [key: string]: any;                                                                         // Permite receber props adicionais
}

// Componente responsável por decidir qual template renderizar com base no nome
const TemplateContentRenderer: React.FC<TemplateContentRendererProps> = ({
  template,                                                                                   // Template atual a ser exibido
  isReadOnly,                                                                                 // Modo edição ou leitura
  ...props                                                                                     // Demais propriedades repassadas
}) => {

  if (!template) {                                                                            // Se nenhum template foi enviado. retorna null
    return null;
  }

  // Mapeamento entre o nome do template salvo no Firestore e o componente React correspondente
  const components: { [key: string]: React.FC<any> } = {
    'Kickoff': KickoffTemplate,                                                               // Kickoff
    'Agenda': AgendaTemplate,                                                                 // Agenda
    'Parking Lot': ParkingLotTemplate,                                                       // Parking Lot
    'Glossary': GlossaryTemplate,                                                             // Glossário
    'Product Vision': ProductVisionTemplate,                                                  // Visão do Produto
    'Product Is/Is Not': ProductIsIsNotTemplate,                                              // Produto É / Não É
    'Product Goals': ProductGoalsTemplate,                                                    // Metas do Produto
    'Personas': PersonasTemplate,                                                             // Personas
    'User Journeys': UserJourneysTemplate,                                                    // Jornada do Usuário
    'Feature Brainstorming': FeatureBrainstormingTemplate,                                    // Brainstorming de Features
    'Technical Review': TechnicalReviewTemplate,                                              // Revisão Técnica
    'Sequencer': SequencerTemplate,                                                           // Sequenciamento
    'MVP Canvas': MVPCanvasTemplate,                                                          // MVP Canvas
  };

  const Component = components[template.template_name];                                       // Seleciona o componente pelo nome do template

  if (!Component) {                                                                           // Caso o nome não esteja mapeado
    return <div>Template not found</div>;                                                     // Exibe mensagem padrão
  }

  const { onContentChange, ...rest } = props;                                                 // Extrai callback de mudança de conteúdo. repassa resto

  // Renderiza o template correto. repassando conteúdo. função de atualização e modo de leitura
  return (
    <Component
      content={template.content}                                                               // Conteúdo vindo do Firestore
      onContentChange={onContentChange || (() => {})}                                          // Callback caso o template permita edição
      isReadOnly={isReadOnly}                                                                  // Passa flag de somente visualização
      {...rest}                                                                                // Passa qualquer outra prop adicional
    />
  );
};

export default TemplateContentRenderer;                                                        // Exporta o componente para uso externo
