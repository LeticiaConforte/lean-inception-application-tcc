// Define uma interface TypeScript chamada Template
export interface Template {
  // Identificador único do template
  id: string;

  // Nome do template (ex.: "Product Vision", "Personas", etc.)
  template_name: string;

  // Número da etapa correspondente no fluxo do Lean Inception
  step_number: number;

  // Conteúdo armazenado dentro do template (estrutura variável)
  content: any;

  // Indica se o template está bloqueado para edição
  is_locked: boolean;
}
