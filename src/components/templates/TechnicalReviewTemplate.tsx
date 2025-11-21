import React, { useState, useRef, useLayoutEffect } from 'react'; // Importa React e os hooks useState, useRef e useLayoutEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importa os componentes de cartão reutilizáveis da aplicação
import { Button } from '@/components/ui/button'; // Importa o componente de botão reutilizável
import { Plus, X } from 'lucide-react'; // Importa os ícones Plus e X da biblioteca de ícones lucide-react

interface Feature { // Define a interface que representa uma feature na revisão técnica
  id: number; // Identificador único da feature
  name: string; // Nome da feature
  value: string; // Valor ou descrição resumida da feature, usado como anotação de valor
  confidence: string; // Nível de confiança. usado para colorir o card visualmente
}

interface TechnicalReviewTemplateProps { // Define as propriedades esperadas pelo componente TechnicalReviewTemplate
  content: { features: Feature[] }; // Objeto de conteúdo contendo um array de features
  onContentChange: (newContent: { features: Feature[] }) => void; // Callback para notificar o componente pai sobre alterações no conteúdo
  isReadOnly?: boolean; // Indica se o componente está em modo somente leitura. opcional
}

const AutoResizingTextarea = ({ value, onChange, className, placeholder, disabled }: any) => { // Componente de textarea que ajusta a altura automaticamente
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Cria uma referência para o elemento textarea no DOM

  useLayoutEffect(() => { // Hook que roda após o layout ser calculado para ajustar a altura
    const textarea = textareaRef.current; // Obtém o elemento textarea referenciado
    if (textarea) { // Verifica se o elemento existe
      textarea.style.height = 'auto'; // Reseta a altura para recalcular
      textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta a altura de acordo com o conteúdo interno
    }
  }, [value]); // Reexecuta o efeito sempre que o valor do textarea mudar

  return (
    <textarea
      ref={textareaRef} // Associa a referência ao elemento textarea
      value={value} // Valor exibido no textarea
      onChange={onChange} // Função chamada quando o usuário altera o texto
      className={className} // Classes CSS recebidas via props para estilização
      placeholder={placeholder} // Texto exibido quando o campo está vazio
      rows={1} // Define uma linha mínima de altura
      disabled={disabled} // Desabilita o campo quando em modo somente leitura
    />
  );
};

const TechnicalReviewTemplate: React.FC<TechnicalReviewTemplateProps> = ({ content, onContentChange, isReadOnly = false }) => { // Componente principal do template de revisão técnica, de negócio e UX
  const [features, setFeatures] = useState(content?.features || []); // Estado local que armazena a lista de features, inicializa com o conteúdo vindo das props ou array vazio

  const updateAndNotify = (newFeatures: Feature[]) => { // Função auxiliar para atualizar o estado e notificar o componente pai
    setFeatures(newFeatures); // Atualiza o estado interno com a nova lista de features
    if (!isReadOnly) { // Se não estiver em modo somente leitura
      onContentChange({ features: newFeatures }); // Chama o callback do pai passando o novo conteúdo
    }
  };

  const addFeature = () => { // Função para adicionar uma nova feature à lista
    if (isReadOnly) return; // Impede alterações quando o componente está em modo somente leitura
    const newFeatures = [...features, {  // Cria uma nova lista, incluindo a nova feature ao final
      id: Date.now(), // Gera um id único baseado no timestamp atual
      name: 'New Feature', // Define um nome padrão inicial para a feature
      value: '', // Inicia o campo de valor vazio
      confidence: 'High'  // Define o nível de confiança padrão como High
    }];
    updateAndNotify(newFeatures); // Atualiza o estado e notifica o componente pai
  };

  const updateFeature = (id: number, field: keyof Feature, value: string) => { // Atualiza um campo específico de uma feature a partir do id
    const newFeatures = features.map(f => f.id === id ? { ...f, [field]: value } : f); // Mapeia a lista, alterando somente a feature com id correspondente
    updateAndNotify(newFeatures); // Atualiza o estado e notifica sobre a mudança
  };

  const removeFeature = (id: number) => { // Remove uma feature da lista a partir do id
    if (isReadOnly) return; // Não permite remoção quando estiver em modo somente leitura
    const newFeatures = features.filter(f => f.id !== id); // Filtra a lista, excluindo a feature com o id informado
    updateAndNotify(newFeatures); // Atualiza o estado e notifica o componente pai
  };

  const getConfidenceColor = (confidence: string) => { // Define as classes de cor de fundo e borda conforme o nível de confiança
    switch (confidence) { // Verifica o valor da confiança
      case 'High': return 'bg-green-100 border-green-200'; // Alta confiança. card verde claro
      case 'Medium': return 'bg-yellow-100 border-yellow-200'; // Confiança média. card amarelo claro
      case 'Low': return 'bg-red-100 border-red-200'; // Baixa confiança. card vermelho claro
      default: return 'bg-gray-100 border-gray-200'; // Valor padrão. card cinza claro
    }
  };

  return (
    <div className="p-4 space-y-6 bg-white"> {/* Container principal do template com padding, espaçamento vertical e fundo branco */}
      <Card className="shadow-lg"> {/* Card de introdução e explicação da atividade */}
        <CardHeader> {/* Cabeçalho do card */}
          <CardTitle className="text-3xl font-bold text-center text-gray-800">Technical, Business and UX Review</CardTitle> {/* Título principal do template */}
        </CardHeader>
        <CardContent className="text-center space-y-4"> {/* Conteúdo textual de explicação da atividade */}
          <p className="text-lg text-gray-700">
            This review aims to discuss how the team feels about technical, business and UX understanding for each feature. From this activity, new clarifications will happen and the disagreements and doubts will become more apparent.
          </p> {/* Parágrafo explicando o objetivo da revisão técnica, de negócio e UX */}
          <div className="bg-gray-100 p-6 rounded-lg my-6"> {/* Bloco em destaque com explicação complementar */}
            <p className="text-xl font-semibold text-gray-800">
              The colors and markings will assist the team in subsequent activities to prioritize, estimate and plan.
            </p> {/* Frase destacando como as cores e marcações apoiam atividades futuras */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left"> {/* Grade com os três passos da atividade */}
            <div className="flex items-start space-x-4"> {/* Passo 1 da dinâmica */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div> {/* Círculo numerado com o passo 1 */}
              <p className="text-gray-700">Ask a person to choose and drag a feature, going through the graph and table.</p> {/* Descrição do primeiro passo */}
            </div>
            <div className="flex items-start space-x-4"> {/* Passo 2 da dinâmica */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div> {/* Círculo numerado com o passo 2 */}
              <p className="text-gray-700">Define the color according to the confidence level and make markings (on a scale of 1 to 3) of business value, effort and UX value - $, E and ♥.</p> {/* Explica a atribuição de cor e marcações de valor, esforço e UX */}
            </div>
            <div className="flex items-start space-x-4"> {/* Passo 3 da dinâmica */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div> {/* Círculo numerado com o passo 3 */}
              <p className="text-gray-700">Confirm that everyone agrees; choose the next person and return to step 1.</p> {/* Orienta a validar consenso e repetir o ciclo com a próxima pessoa */}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-6"> {/* Grade responsiva onde cada card representa uma feature */}
        {features.map(feature => ( // Itera sobre a lista de features para renderizar um card para cada uma
          <Card
            key={feature.id} // Usa o id da feature como chave única
            className={`${getConfidenceColor(feature.confidence)} shadow-lg relative group flex flex-col p-4 rounded-xl border`} // Aplica classes de cor baseadas na confiança e estilos visuais
          >
            {!isReadOnly && ( // Exibe o botão de remover somente se não estiver em modo somente leitura
              <Button
                variant="destructive" // Estilo destrutivo, indicando ação de remoção
                size="icon" // Botão em formato de ícone
                onClick={() => removeFeature(feature.id)} // Ao clicar, remove a feature correspondente
                className="absolute -top-3 -right-3 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 z-10 transition-opacity" // Posiciona o botão no canto, aparece no hover
              >
                <X className="h-4 w-4" /> {/* Ícone X representando remoção */}
              </Button>
            )}
            <AutoResizingTextarea
              value={feature.name} // Valor atual do nome da feature
              onChange={(e: any) => updateFeature(feature.id, 'name', e.target.value)} // Atualiza o campo name da feature quando o texto muda
              placeholder="New Feature" // Placeholder para o nome da feature
              className="bg-transparent border-none resize-none text-center text-lg focus:ring-1 focus:ring-gray-800 p-2 flex-grow mb-3 rounded-md" // Estilos visuais do textarea de nome
              disabled={isReadOnly} // Desabilita edição em modo somente leitura
            />
            <div className="space-y-3"> {/* Container para os campos de valor e confiança, com espaçamento vertical */}
              <input
                type="text" // Campo de texto simples para armazenar o valor
                value={feature.value} // Valor atual do campo value
                onChange={(e) => updateFeature(feature.id, 'value', e.target.value)} // Atualiza o campo value ao alterar o texto
                placeholder="Value" // Placeholder sugerindo inserção de valor
                className="w-full bg-white/70 backdrop-blur-sm border-gray-300 focus:ring-gray-800 rounded-md p-2 text-center" // Estilo visual do input de valor
                disabled={isReadOnly} // Desabilita edição se estiver em modo somente leitura
              />
              <select
                value={feature.confidence} // Valor atual do campo confidence
                onChange={(e) => updateFeature(feature.id, 'confidence', e.target.value)} // Atualiza o nível de confiança ao selecionar outra opção
                className="w-full bg-white/70 backdrop-blur-sm border-gray-300 font-medium focus:ring-gray-800 rounded-md p-2" // Estilo visual do select de confiança
                disabled={isReadOnly} // Desabilita o select quando em modo somente leitura
              >
                <option value="High">High Confidence</option> {/* Opção de alta confiança */}
                <option value="Medium">Medium Confidence</option> {/* Opção de confiança média */}
                <option value="Low">Low Confidence</option> {/* Opção de baixa confiança */}
              </select>
            </div>
          </Card>
        ))}

        {!isReadOnly && ( // Renderiza o card de adicionar apenas se não estiver em modo somente leitura
          <Button
            variant="outline" // Botão com borda simples
            onClick={addFeature} // Ao clicar, adiciona uma nova feature
            className="h-full min-h-[160px] border-dashed border-2 flex flex-col items-center justify-center hover:bg-gray-100 rounded-xl transition-colors" // Estilização do card de adição, com borda tracejada
          >
            <Plus className="h-10 w-10 text-gray-400 mb-2" /> {/* Ícone Plus destacando a ação de adicionar */}
            <span className="text-gray-600 font-semibold">Add Feature</span> {/* Texto explicativo do botão */}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TechnicalReviewTemplate; // Exporta o componente TechnicalReviewTemplate como exportação padrão
