import React, { useState, useRef, useLayoutEffect } from 'react'; // Importa React e os hooks useState, useRef e useLayoutEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importa componentes de cartão reutilizáveis
import { Button } from '@/components/ui/button'; // Importa componente de botão
import { Plus, X } from 'lucide-react'; // Importa ícones Plus (adicionar) e X (remover)

interface Goal { // Define a estrutura de um objetivo (goal)
  id: number; // Identificador único do objetivo
  text: string; // Texto descritivo do objetivo
  color: string; // Classe de cor usada no cartão do objetivo
}

interface ProductGoalsTemplateProps { // Define as props esperadas pelo componente ProductGoalsTemplate
  content: any; // Conteúdo inicial genérico, vindo de fora (poderia ser tipado melhor)
  onContentChange: (newContent: any) => void; // Função callback para notificar alterações ao componente pai
  isReadOnly?: boolean; // Flag opcional indicando se o template está em modo somente leitura
}

const AutoResizingTextarea = ({ value, onChange, className, placeholder, disabled }: any) => { // Componente de textarea que ajusta automaticamente a altura
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Cria uma referência ao elemento textarea no DOM

  useLayoutEffect(() => { // Hook que roda após o layout ser calculado
    const textarea = textareaRef.current; // Obtém o elemento textarea referenciado
    if (textarea) { // Verifica se o elemento existe
      textarea.style.height = 'auto'; // Reseta a altura para permitir recálculo
      textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta a altura conforme o conteúdo interno
    }
  }, [value]); // Executa sempre que o valor do textarea mudar

  return (
    <textarea
      ref={textareaRef} // Associa a referência ao elemento textarea
      value={value} // Valor atual exibido no campo
      onChange={onChange} // Função chamada sempre que o texto for alterado
      className={className} // Classes CSS aplicadas ao textarea
      placeholder={placeholder} // Texto de placeholder quando o campo está vazio
      rows={1} // Define altura mínima de uma linha
      disabled={disabled} // Desabilita o campo caso esteja em modo somente leitura
    />
  );
};

const ProductGoalsTemplate: React.FC<ProductGoalsTemplateProps> = ({ content, onContentChange, isReadOnly = false }) => { // Componente principal de Product Goals
  const availableColors = ['bg-yellow-200', 'bg-rose-200', 'bg-green-200', 'bg-blue-200', 'bg-indigo-200']; // Lista de classes de cores possíveis para os cartões
  const defaultColor = 'bg-yellow-200'; // Cor padrão aplicada quando nenhuma é especificada

  const [goals, setGoals] = useState<Goal[]>((content?.goals || [{text: 'Goal'}]).map((g: any, index: number) => ({ // Estado local com a lista de objetivos
    id: g.id || Date.now() + index, // Usa id existente ou gera um novo com base no timestamp
    text: g.text, // Texto do objetivo
    color: g.color || defaultColor, // Usa cor existente ou a cor padrão
  })));

  const updateAndNotify = (newGoals: Goal[]) => { // Atualiza o estado local e notifica o componente pai
    setGoals(newGoals); // Atualiza o estado de goals
    if (!isReadOnly) { // Só notifica o pai se não estiver em modo somente leitura
      onContentChange({ goals: newGoals }); // Chama o callback passando o novo conjunto de objetivos
    }
  };

  const addGoal = () => { // Adiciona um novo objetivo à lista
    if (isReadOnly) return; // Se estiver em modo somente leitura, não faz nada
    const newGoals = [...goals, { id: Date.now(), text: 'New Goal', color: defaultColor }]; // Cria uma nova lista com um objetivo adicional
    updateAndNotify(newGoals); // Atualiza o estado e notifica o pai
  };

  const updateGoalText = (id: number, text: string) => { // Atualiza o texto de um objetivo específico
    const newGoals = goals.map(goal => (goal.id === id ? { ...goal, text } : goal)); // Substitui o objetivo correspondente pelo texto atualizado
    updateAndNotify(newGoals); // Atualiza o estado e notifica o pai
  };

  const updateGoalColor = (id: number, color: string) => { // Atualiza a cor de um objetivo específico
    if (isReadOnly) return; // Impede alterações em modo somente leitura
    const newGoals = goals.map(g => (g.id === id ? { ...g, color } : g)); // Altera a cor do objetivo com o id correspondente
    updateAndNotify(newGoals); // Atualiza o estado e notifica o pai
  };

  const removeGoal = (id: number) => { // Remove um objetivo da lista
    if (isReadOnly) return; // Impede remoção em modo somente leitura
    const newGoals = goals.filter(goal => goal.id !== id); // Filtra a lista removendo o objetivo com o id indicado
    updateAndNotify(newGoals); // Atualiza o estado e notifica o pai
  };

  return (
    <div className="p-4 space-y-6 bg-white"> {/* Container principal com padding, espaçamento vertical e fundo branco */}
      <Card className="shadow-lg"> {/* Card de introdução da atividade Product Goals */}
        <CardHeader> {/* Cabeçalho do card */}
          <CardTitle className="text-3xl font-bold text-center text-gray-800">Product Goals</CardTitle> {/* Título da seção */}
        </CardHeader>
        <CardContent className="text-center space-y-4"> {/* Conteúdo do card com textos explicativos */}
          <p className="text-lg text-gray-700"> {/* Parágrafo descrevendo o propósito da atividade */}
            Each participant must share what they understand as a business goal, and the various points of view must be discussed to reach a consensus on what is really important. This activity helps in raising and clarifying the main objectives.
          </p>
          <div className="bg-gray-100 p-6 rounded-lg my-6"> {/* Bloco de destaque com pergunta orientadora */}
            <p className="text-xl font-semibold text-gray-800">
              If you have to summarize the product in three business goals, what would they be?
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left"> {/* Grade com instruções em três passos */}
            <div className="flex items-start space-x-4"> {/* Passo 1 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div> {/* Círculo numerado */}
              <p className="text-gray-700">Divide the team into three groups and request that each group fill only the blanks selected in its respective template.</p> {/* Descrição do passo */}
            </div>
            <div className="flex items-start space-x-4"> {/* Passo 2 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div> {/* Círculo numerado */}
              <p className="text-gray-700">Ask participants to share what they have written, grouping them by similarity in the 'clusters'.</p> {/* Descrição do passo */}
            </div>
            <div className="flex items-start space-x-4"> {/* Passo 3 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div> {/* Círculo numerado */}
              <p className="text-gray-700">Define a title for each of the 'clusters'.</p> {/* Descrição do passo */}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6"> {/* Grade responsiva para exibir os cartões de objetivos */}
        {goals.map((goal) => ( // Itera sobre os objetivos para renderizar cada cartão
          <Card key={goal.id} className={`${goal.color} shadow-lg relative group flex flex-col justify-between p-4 min-h-[180px]`}> {/* Card individual com cor dinâmica */}
            {!isReadOnly && ( // Botão de remoção só aparece se não estiver em modo somente leitura
              <Button 
                size="sm" // Define tamanho pequeno do botão
                variant="destructive" // Estilo destrutivo, indicando ação de remover
                className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10" // Aparece ao passar o mouse no card
                onClick={() => removeGoal(goal.id)}> {/* Remove o objetivo correspondente */}
                <X className="h-4 w-4" /> {/* Ícone X dentro do botão */}
              </Button>
            )}
            <AutoResizingTextarea
              className="w-full bg-transparent border-none focus:outline-none resize-none text-gray-800 text-lg flex-grow" // Estilo do campo de texto do objetivo
              value={goal.text} // Texto atual do objetivo
              onChange={(e: any) => updateGoalText(goal.id, e.target.value)} // Atualiza o texto ao digitar
              disabled={isReadOnly} // Desabilita edição em modo somente leitura
              placeholder="New Goal..." // Placeholder sugerindo o conteúdo do objetivo
            />
            {!isReadOnly && ( // Seleção de cores disponível apenas quando edição é permitida
              <div className="flex justify-center space-x-2 mt-4"> {/* Container das bolinhas de cor */}
                {availableColors.map(color => ( // Itera sobre as cores disponíveis
                  <button
                    key={color} // Usa a cor como chave única
                    onClick={() => updateGoalColor(goal.id, color)} // Atualiza a cor do objetivo ao clicar
                    className={`w-7 h-7 rounded-full cursor-pointer transition-all duration-150 ease-in-out transform hover:scale-110 ${color} ${goal.color === color ? 'ring-2 ring-offset-2 ring-neutral-900' : 'ring-1 ring-neutral-400'}`} // Estilização visual das bolinhas
                    aria-label={`Change color to ${color}`} // Label de acessibilidade para leitores de tela
                  />
                ))}
              </div>
            )}
          </Card>
        ))}
        {!isReadOnly && ( // Botão para adicionar novo objetivo, exibido apenas em modo editável
          <Button
            variant="outline" // Estilo contornado
            onClick={addGoal} // Chama função que adiciona um novo objetivo
            className="min-h-[180px] border-dashed border-2 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors" // Estilo visual do card vazio
          >
            <Plus className="h-10 w-10 text-gray-400" /> {/* Ícone grande de adicionar */}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductGoalsTemplate; // Exporta o componente ProductGoalsTemplate como padrão
