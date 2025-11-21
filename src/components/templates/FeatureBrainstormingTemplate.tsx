import React, { useState, useRef, useLayoutEffect } from 'react'; // Importa React e hooks necessários
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importa componentes de cartão
import { Button } from '@/components/ui/button'; // Importa componente de botão
import { Plus, X } from 'lucide-react'; // Ícones usados (adicionar e remover)

interface Feature { // Interface definindo o formato de uma feature
  id: number; // Identificador único
  text: string; // Texto da feature
  color: string; // Cor aplicada ao cartão
}

interface FeatureBrainstormingTemplateProps { // Tipagem das props recebidas pelo componente principal
  content: { features: Feature[] }; // Lista de features vinda de fora
  onContentChange: (newContent: { features: Feature[] }) => void; // Função para atualizar o conteúdo
  isReadOnly?: boolean; // Indica se o template está em modo somente leitura
}

const AutoResizingTextarea = ({ value, onChange, className, placeholder, disabled }: any) => { // Textarea que cresce automaticamente
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Referência ao elemento textarea

  useLayoutEffect(() => { // Atualiza o tamanho do textarea sempre que o valor mudar
    const textarea = textareaRef.current; // Acessa o elemento DOM
    if (textarea) { // Verifica se existe
      textarea.style.height = 'auto'; // Reseta a altura
      textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta conforme conteúdo
    }
  }, [value]); // Dependência: reexecuta quando value muda

  return (
    <textarea // Retorna o componente textarea
      ref={textareaRef} // Liga a referência
      value={value} // Valor atual
      onChange={onChange} // Evento de mudança
      className={className} // Classes CSS recebidas
      placeholder={placeholder} // Placeholder opcional
      rows={1} // Altura mínima de 1 linha
      disabled={disabled} // Desabilita quando readonly
    />
  );
};

const FeatureBrainstormingTemplate: React.FC<FeatureBrainstormingTemplateProps> = ({ content, onContentChange, isReadOnly = false }) => { // Componente principal
  const availableColors = ['bg-yellow-200', 'bg-rose-200', 'bg-green-200', 'bg-blue-200', 'bg-indigo-200']; // Cores disponíveis
  const defaultColor = 'bg-yellow-200'; // Cor padrão

  const [features, setFeatures] = useState<Feature[]>((content?.features || [{id: 1, text: 'New Feature'}]).map((f: any) => ({ // Estado das features
    ...f, // Copia os dados originais
    color: f.color || defaultColor, // Garante que cada feature tenha cor
  })));

  const updateAndNotify = (newFeatures: Feature[]) => { // Função para atualizar estado e notificar componente pai
    setFeatures(newFeatures); // Atualiza estado interno
    if (!isReadOnly) { // Só notifica se não for leitura
      onContentChange({ features: newFeatures }); // Dispara atualização externa
    }
  };

  const addFeature = () => { // Adiciona uma nova feature
    if (isReadOnly) return; // Bloqueia se readonly
    const newFeatures = [...features, { id: Date.now(), text: 'New Feature', color: defaultColor }]; // Cria nova feature
    updateAndNotify(newFeatures); // Atualiza estado e notifica
  };

  const updateFeatureText = (id: number, text: string) => { // Atualiza texto de uma feature
    const newFeatures = features.map(feature => (feature.id === id ? { ...feature, text } : feature)); // Substitui item pelo novo
    updateAndNotify(newFeatures); // Atualiza e notifica
  };

  const updateFeatureColor = (id: number, color: string) => { // Atualiza cor de uma feature
    if (isReadOnly) return; // Bloqueia se readonly
    const newFeatures = features.map(f => (f.id === id ? { ...f, color } : f)); // Atualiza cor
    updateAndNotify(newFeatures); // Atualiza
  };

  const removeFeature = (id: number) => { // Remove uma feature
    if (isReadOnly) return; // Bloqueia em readonly
    const newFeatures = features.filter(feature => feature.id !== id); // Filtra o item removido
    updateAndNotify(newFeatures); // Atualiza estado
  };

  return (
    <div className="p-4 space-y-6 bg-white"> {/* Container principal */}
      <Card className="shadow-lg"> {/* Card maior explicativo */}
        <CardHeader> {/* Cabeçalho do card */}
          <CardTitle className="text-3xl font-bold text-center text-gray-800">Feature Brainstorming</CardTitle> {/* Título */}
        </CardHeader>
        <CardContent className="text-center space-y-4"> {/* Conteúdo interno */}
          <p className="text-lg text-gray-700"> {/* Parágrafo explicativo */}
            A feature represents a user's action or interaction with the product, for example: printing invoices, consulting detailed statements and inviting Facebook friends. The description of a feature must be as simple as possible, aiming to meet a business goal, a persona need, and / or contemplating a step in the journey.
          </p>
          <div className="bg-gray-100 p-6 rounded-lg my-6"> {/* Caixa de destaque */}
            <p className="text-xl font-semibold text-gray-800"> {/* Texto interno */}
              The user is trying to do something, so the product must have a feature for that. What is this feature?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left"> {/* Grade com instruções */}
            <div className="flex items-start space-x-4"> {/* Passo 1 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div> {/* Número */}
              <p className="text-gray-700">Ask someone to read, slowly, the step-by-step of a user's journey.</p> {/* Descrição */}
            </div>

            <div className="flex items-start space-x-4"> {/* Passo 2 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div> {/* Número */}
              <p className="text-gray-700">While reading, other people share feature ideas.</p> {/* Descrição */}
            </div>

            <div className="flex items-start space-x-4"> {/* Passo 3 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div> {/* Número */}
              <p className="text-gray-700">When a feature is identified, describe it and place it on the board. Repeat the previous steps for all journeys.</p> {/* Descrição */}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-6"> {/* Grade das features */}
        {features.map(feature => ( // Itera sobre as features
          <Card key={feature.id} className={`${feature.color} shadow-lg relative group flex flex-col justify-between p-4 min-h-[180px] rounded-xl`}> {/* Card de cada feature */}
            {!isReadOnly && ( // Mostra o botão de remover apenas se editável
              <Button
                variant="destructive" // Estilo de remoção
                size="icon" // Ícone
                onClick={() => removeFeature(feature.id)} // Remove item
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10" // Animação e posição
              >
                <X className="h-4 w-4" /> {/* Ícone X */}
              </Button>
            )}

            <AutoResizingTextarea // Campo de texto da feature
              value={feature.text} // Texto atual
              onChange={(e: any) => updateFeatureText(feature.id, e.target.value)} // Atualiza texto
              placeholder="New Feature" // Placeholder
              className="w-full bg-transparent border-none focus:outline-none resize-none text-gray-800 text-lg flex-grow" // Estilo
              disabled={isReadOnly} // Desabilitado se readonly
            />

            {!isReadOnly && ( // Seleção de cores aparece só se editável
              <div className="flex justify-center space-x-2 mt-4"> {/* Container de cores */}
                  {availableColors.map(color => ( // Itera pelas cores
                      <button
                        key={color} // Chave
                        onClick={() => updateFeatureColor(feature.id, color)} // Muda cor
                        className={`w-7 h-7 rounded-full cursor-pointer transition-all duration-150 ease-in-out transform hover:scale-110 ${color} ${feature.color === color ? 'ring-2 ring-offset-2 ring-neutral-900' : 'ring-1 ring-neutral-400'}`} // Estilos do círculo
                        aria-label={`Change color to ${color}`} // Acessibilidade
                      />
                  ))}
              </div>
            )}
          </Card>
        ))}

        {!isReadOnly && ( // Botão de adicionar feature
          <Button
            variant="outline" // Estilo
            onClick={addFeature} // Função de adicionar
            className="min-h-[180px] border-dashed border-2 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors rounded-xl" // Layout do botão
          >
            <Plus className="h-10 w-10 text-gray-400 mb-2" /> {/* Ícone + */}
            <span className="text-gray-600 font-semibold">Add Feature</span> {/* Texto */}
          </Button>
        )}
      </div>
    </div>
  );
};

export default FeatureBrainstormingTemplate; // Exportação do componente principal
