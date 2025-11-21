import React from 'react'; // Importa a biblioteca React para criar componentes
import { Button } from '@/components/ui/button'; // Importa o componente de botão reutilizável

// Define a interface para o objeto Template (estrutura de cada etapa do workshop)
interface Template {
  id: string;                 // ID único do template no Firestore
  step_number: number;        // Número da etapa (ordem no fluxo da Lean Inception)
  template_name: string;      // Nome do template (ex. "Kickoff", "Personas")
  content: any;               // Conteúdo específico desse template
  is_locked: boolean;         // Indica se a etapa está marcada como concluída
  updated_at: any;            // Data da última atualização do template
  is_counted: boolean;        // Indica se essa etapa entra na contagem de progresso
}

// Define as props esperadas pelo componente TemplateSidebar
interface TemplateSidebarProps {
  templates: Template[];                         // Lista de templates do workshop
  selectedTemplate: Template | null;             // Template atualmente selecionado
  onSelectTemplate: (template: Template) => void; // Função chamada ao selecionar um template
}

// Componente funcional TemplateSidebar
const TemplateSidebar: React.FC<TemplateSidebarProps> = ({ 
  templates,            // Recebe a lista de templates via props
  selectedTemplate,     // Recebe o template selecionado via props
  onSelectTemplate      // Recebe o callback de seleção via props
}) => {
  return (
    <nav className="flex-grow pr-4"> {/* Container de navegação lateral. flex-grow para ocupar espaço vertical e pr-4 para afastar a barra de rolagem do conteúdo */}
      <ul className="space-y-1"> {/* Lista vertical com espaçamento entre os itens */}
        {templates.map((template) => ( // Itera sobre todos os templates para renderizar cada etapa
          <li key={template.id}> {/* Cada item da lista usa o ID do template como chave */}
            <Button
              variant={selectedTemplate?.id === template.id ? 'secondary' : 'ghost'} // Destaca o botão se for o template selecionado
              className="w-full justify-start h-auto py-2 px-3 text-left"           // Botão ocupa toda a largura, alinhado à esquerda, com padding
              onClick={() => onSelectTemplate(template)}                            // Ao clicar, chama o callback passando o template
            >
              <span className="text-xs text-gray-500 w-6 text-right mr-2"> {/* Coluna com o número da etapa, em texto pequeno e alinhado à direita */}
                {template.step_number}. {/* Mostra o número da etapa seguido de ponto */}
              </span>
              <span className="text-sm font-normal"> {/* Nome da etapa, com fonte pequena e peso normal */}
                {template.template_name} {/* Exibe o nome do template (ex. "Product Vision") */}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TemplateSidebar; // Exporta o componente para uso em outras partes da aplicação
