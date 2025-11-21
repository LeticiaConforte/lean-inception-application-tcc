// Declara a interface que define a estrutura de um template padrão
export interface DefaultTemplate {
  step_number: number;       // Número da etapa dentro do fluxo do workshop
  template_name: string;     // Nome do template exibido na interface
  content: any;              // Estrutura de dados inicial do template
  is_locked: boolean;        // Indica se o template pode ser editado pelo usuário
  is_counted: boolean;       // Indica se o template conta como etapa no progresso total
}

// Exporta array contendo todos os templates padrão usados para inicializar um novo workshop
export const defaultTemplates: DefaultTemplate[] = [
    // Template da etapa 1: Kickoff
    { step_number: 1, template_name: 'Kickoff', content: {}, is_locked: false, is_counted: true },

    // Template da etapa 2: Agenda (pré-preenchida e não conta como etapa)
    { step_number: 2, template_name: 'Agenda', content: {}, is_locked: true, is_counted: false },

    // Template da etapa 3: Parking Lot
    { step_number: 3, template_name: 'Parking Lot', content: { items: [] }, is_locked: false, is_counted: true },

    // Template da etapa 4: Glossary
    { step_number: 4, template_name: 'Glossary', content: { terms: [] }, is_locked: false, is_counted: true },

    // Template da etapa 5: Product Vision
    { step_number: 5, template_name: 'Product Vision', content: { vision: '' }, is_locked: false, is_counted: true },

    // Template da etapa 6: Product Is/Is Not
    { step_number: 6, template_name: 'Product Is/Is Not', content: { is: [], isNot: [], does: [], doesNot: [] }, is_locked: false, is_counted: true },

    // Template da etapa 7: Product Goals
    { step_number: 7, template_name: 'Product Goals', content: { goals: [] }, is_locked: false, is_counted: true },

    // Template da etapa 8: Personas
    { step_number: 8, template_name: 'Personas', content: { personas: [] }, is_locked: false, is_counted: true },

    // Template da etapa 9: User Journeys
    { step_number: 9, template_name: 'User Journeys', content: { journeys: [] }, is_locked: false, is_counted: true },

    // Template da etapa 10: Feature Brainstorming
    { step_number: 10, template_name: 'Feature Brainstorming', content: { features: [] }, is_locked: false, is_counted: true },

    // Template da etapa 11: Technical Review
    { step_number: 11, template_name: 'Technical Review', content: { reviews: [] }, is_locked: false, is_counted: true },

    // Template da etapa 12: Sequencer (organização das ondas)
    { step_number: 12, template_name: 'Sequencer', content: { waves: [] }, is_locked: false, is_counted: true },

    // Template da etapa 13: MVP Canvas
    { step_number: 13, template_name: 'MVP Canvas', content: {}, is_locked: false, is_counted: true },

    // Template da etapa 14: Workshop Report (não conta como etapa)
    { step_number: 14, template_name: 'Workshop Report', content: {}, is_locked: false, is_counted: false },
];
