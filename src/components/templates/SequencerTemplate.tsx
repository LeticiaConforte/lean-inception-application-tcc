import React, { useState, useRef, useLayoutEffect } from 'react'; // Importa React e os hooks useState, useRef e useLayoutEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importa os componentes de cartão reutilizáveis
import { Button } from '@/components/ui/button'; // Importa o componente de botão reutilizável
import { Plus, X } from 'lucide-react'; // Importa os ícones Plus e X da biblioteca lucide-react

interface Feature { // Interface que define a estrutura de uma Feature no sequencer
  id: number; // Identificador único da Feature
  name: string; // Nome da Feature
  value: string; // Valor percebido ou descrição de valor da Feature
  confidence: string; // Nível de confiança associado à Feature, utilizado para cor
}

interface SequencerTemplateProps { // Interface das props do componente SequencerTemplate
  content: any; // Conteúdo inicial passado pelo componente pai
  onContentChange: (content: any) => void; // Callback para notificar alterações ao componente pai
  isReadOnly?: boolean; // Flag opcional que indica se o template está em modo somente leitura
}

interface PostIt { // Interface que representa um post-it no sequencer
  id: number; // Identificador único do post-it
  label: string; // Rótulo do post-it, como MVP ou Increment
}

interface Wave { // Interface que representa uma "onda" do sequencer
  id: number; // Identificador único da onda
  name: string | null; // Nome da onda, opcional, atualmente não usado na UI
  features: Feature[]; // Lista de Features associadas a esta onda
  postIts: PostIt[]; // Lista de post-its associados a esta onda
}

const initialWaves: Wave[] = Array.from({ length: 5 }, (_, i) => ({  // Cria um array inicial com 5 ondas vazias
  id: i + 1, // Atribui um id sequencial iniciando em 1
  name: null, // Nome da onda começa como null
  features: [], // Lista de Features vazia
  postIts: []  // Lista de post-its vazia
}));

const AutoResizingTextarea = ({ value, onChange, className, placeholder, disabled }: any) => { // Componente de textarea com ajuste automático de altura
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Referência ao elemento textarea no DOM

  useLayoutEffect(() => { // Hook que roda após a renderização para ajustar o layout
    const textarea = textareaRef.current; // Obtém o elemento textarea atual
    if (textarea) { // Verifica se o elemento existe
      textarea.style.height = 'auto'; // Reseta a altura para recalcular a partir do conteúdo
      textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta a altura com base na altura do conteúdo interno
    }
  }, [value]); // Executa sempre que o valor do textarea for alterado

  return (
    <textarea
      ref={textareaRef} // Liga a referência ao elemento
      value={value} // Define o valor atual do textarea
      onChange={onChange} // Função chamada quando o conteúdo muda
      className={className} // Classes CSS passadas pelo componente pai
      placeholder={placeholder} // Texto de placeholder exibido quando vazio
      rows={1} // Altura mínima de uma linha
      disabled={disabled} // Desabilita edição quando em modo somente leitura
    />
  );
};

const SequencerTemplate: React.FC<SequencerTemplateProps> = ({ content, onContentChange, isReadOnly = false }) => { // Componente principal do template Sequencer

  const getInitialState = (): Wave[] => { // Função auxiliar para montar o estado inicial das ondas
    if (content?.waves && Array.isArray(content.waves) && content.waves.length > 0) { // Verifica se há ondas válidas no conteúdo recebido
        return content.waves.map((wave: any) => ({ // Mapeia cada onda recebida
            ...wave, // Mantém todas as propriedades existentes da onda
            features: Array.isArray(wave.features) ? wave.features : [], // Garante que features seja sempre um array
            postIts: Array.isArray(wave.postIts) ? wave.postIts : [] // Garante que postIts seja sempre um array
        }));
    }
    return initialWaves; // Caso não haja ondas válidas no conteúdo, usa as ondas iniciais padrão
  };

  const [waves, setWaves] = useState<Wave[]>(getInitialState()); // Estado que guarda todas as ondas do sequencer
  const [showMenu, setShowMenu] = useState<{ waveIndex: number; itemIndex: number } | null>(null); // Estado que define qual menu de adicionar está aberto

  const hasMVP = () => waves.some(wave => wave.postIts.some(p => p.label === 'MVP')); // Função que verifica se já existe um post-it MVP em alguma onda

  const rules = [ // Lista de regras exibidas no painel lateral do sequencer
    "A wave can contain a maximum of three features.", // Regra 1
    "A wave cannot contain more than one red card.", // Regra 2
    "A wave cannot contain three cards, only yellow or red.", // Regra 3
    "The total effort of the cards cannot exceed five E's.", // Regra 4
    "The sum of the value of the cards cannot be less than four $ and four hearts.", // Regra 5
    "If one card depends on another, that other card must be on some previous wave." // Regra 6
  ];

  const updateAndNotify = (newWaves: Wave[]) => { // Atualiza o estado local e notifica o componente pai
    setWaves(newWaves); // Atualiza o estado de waves
    if (!isReadOnly) { // Apenas notifica se não estiver em modo somente leitura
      onContentChange({ waves: newWaves }); // Chama o callback do pai com o novo conteúdo
    }
  };

  const getConfidenceColor = (confidence: string) => { // Retorna a classe de cor baseada no nível de confiança
    switch (confidence) { // Avalia o valor da confiança
      case 'green': return 'bg-green-100'; // Alta confiança, cor verde clara
      case 'yellow': return 'bg-yellow-100'; // Confiança média, cor amarela clara
      case 'red': return 'bg-red-100'; // Baixa confiança, cor vermelha clara
      default: return 'bg-gray-100'; // Padrão, fundo cinza claro
    }
  };

  const addFeature = (waveIndex: number) => { // Adiciona uma nova Feature em uma onda específica
    if (isReadOnly) return; // Não permite alteração em modo somente leitura

    const newWaves = waves.map((wave, index) => { // Percorre todas as ondas
      if (index === waveIndex) { // Encontra a onda alvo pelo índice
        if (wave.features.length >= 3) return wave; // Se já houver três Features, não adiciona mais
        return {
          ...wave, // Mantém demais propriedades da onda
          features: [ // Atualiza a lista de Features
            ...wave.features, // Mantém as Features atuais
            { id: Date.now(), name: 'New Feature', value: '', confidence: 'yellow' } // Adiciona uma nova Feature padrão
          ]
        };
      }
      return wave; // Para as outras ondas, retorna sem alterações
    });

    updateAndNotify(newWaves); // Atualiza o estado e notifica o pai
    setShowMenu(null); // Fecha o menu de adicionar
  };

  const addPostIt = (waveIndex: number, label: string) => { // Adiciona um post-it de tipo específico em uma onda
    if (isReadOnly) return; // Impede alterações em modo somente leitura
    if ((label === 'MVP' && hasMVP()) || (label === 'Increment' && !hasMVP())) { // Regras de consistência para MVP e Increment
      setShowMenu(null); // Fecha o menu sem adicionar
      return; // Encerra se as regras não forem respeitadas
    }

    const newWaves = waves.map((wave, index) => { // Percorre todas as ondas
      if (index === waveIndex) { // Localiza a onda alvo
        return {
          ...wave, // Mantém demais propriedades
          postIts: [...wave.postIts, { id: Date.now(), label }] // Adiciona um novo post-it com o rótulo informado
        };
      }
      return wave; // Retorna ondas não alteradas
    });

    updateAndNotify(newWaves); // Atualiza o estado e notifica o pai
    setShowMenu(null); // Fecha o menu de adicionar
  };

  const updateFeature = (waveIndex: number, featureIndex: number, field: keyof Feature, value: string) => { // Atualiza um campo de uma Feature específica
    const newWaves = waves.map((wave, wIndex) => { // Mapeia as ondas
      if (wIndex === waveIndex) { // Localiza a onda desejada
        return {
          ...wave, // Mantém as demais propriedades
          features: wave.features.map((feature, fIndex) => { // Mapeia as Features da onda
            if (fIndex === featureIndex) { // Localiza a Feature alvo
              return { ...feature, [field]: value }; // Atualiza apenas o campo indicado
            }
            return feature; // Mantém as outras Features intactas
          })
        };
      }
      return wave; // Retorna ondas que não foram alteradas
    });
    updateAndNotify(newWaves); // Atualiza estado e notifica
  };

  const removeFeature = (waveIndex: number, featureIndex: number) => { // Remove uma Feature de uma onda
    if (isReadOnly) return; // Não permite remoção em modo somente leitura
    const newWaves = waves.map((wave, wIndex) => { // Mapeia as ondas
      if (wIndex === waveIndex) { // Localiza a onda alvo
        return {
          ...wave, // Mantém demais dados
          features: wave.features.filter((_, fIndex) => fIndex !== featureIndex) // Remove a Feature no índice informado
        };
      }
      return wave; // Outras ondas permanecem sem alteração
    });
    updateAndNotify(newWaves); // Atualiza estado e notifica
  };

  const removePostIt = (waveIndex: number, postItId: number) => { // Remove um post-it de uma onda
    if (isReadOnly) return; // Impede alterações em modo somente leitura
    
    const postItToRemove = waves[waveIndex]?.postIts.find(p => p.id === postItId); // Localiza o post-it que será removido
    
    let newWaves = waves.map((wave, wIndex) => { // Mapeia as ondas
      if (wIndex === waveIndex) { // Localiza a onda alvo
        return {
          ...wave, // Mantém demais propriedades
          postIts: wave.postIts.filter(p => p.id !== postItId) // Remove o post-it pelo id
        };
      }
      return wave; // Outras ondas permanecem iguais
    });

    if (postItToRemove && postItToRemove.label === 'MVP') { // Se o post-it removido for o MVP
      newWaves = newWaves.map(w => ({ // Para todas as ondas
        ...w, // Mantém propriedades
        postIts: w.postIts.filter(p => p.label !== 'Increment') // Remove todos os post-its Increment pois perdem o sentido sem MVP
      }));
    }

    updateAndNotify(newWaves); // Atualiza estado e notifica o componente pai
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-white" onClick={() => setShowMenu(null)}> {/* Container principal com espaçamento, padding e fundo branco. ao clicar fora fecha o menu */}
        <Card className="shadow-lg"> {/* Card de introdução do Sequencer */}
          <CardHeader> {/* Cabeçalho do card */}
            <CardTitle className="text-3xl font-bold text-center text-gray-800">Sequencer</CardTitle> {/* Título principal do template */}
          </CardHeader>
          <CardContent className="text-center space-y-4"> {/* Conteúdo com descrição e instruções */}
            <p className="text-lg text-gray-700">
              The Feature Sequencer assists in organizing and viewing the features and the incremental validation of the product.
            </p> {/* Texto explicando o propósito do Sequencer */}
            <div className="bg-gray-100 p-6 rounded-lg my-6"> {/* Bloco de destaque com frase chave */}
              <p className="text-xl font-semibold text-gray-800">
                Define the MVP and its subsequent increments.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left"> {/* Grade com três passos de instrução */}
              <div className="flex items-start space-x-4"> {/* Passo 1 */}
                <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div> {/* Círculo numerado */}
                <p className="text-gray-700">Ask people to decide the first feature.</p> {/* Descrição do primeiro passo */}
              </div>
              <div className="flex items-start space-x-4"> {/* Passo 2 */}
                <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div> {/* Círculo numerado */}
                <p className="text-gray-700">Bring more cards to the sequencer. Respect the rules.</p> {/* Descrição do segundo passo */}
              </div>
              <div className="flex items-start space-x-4"> {/* Passo 3 */}
                <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div> {/* Círculo numerado */}
                <p className="text-gray-700">Identify the MVP and the increments of the product.</p> {/* Descrição do terceiro passo */}
              </div>
            </div>
          </CardContent>
        </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8"> {/* Layout principal dividido em coluna de regras e colunas das ondas */}
        <div className="lg:col-span-1"> {/* Coluna lateral com as regras */}
          <Card className="shadow-lg sticky top-6"> {/* Card fixo com as regras do sequencer */}
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">RULES</CardTitle> {/* Título da seção de regras */}
            </CardHeader>
            <CardContent>
              <div className="space-y-4"> {/* Lista de regras com espaçamento vertical */}
                {rules.map((rule, index) => ( // Itera sobre o array de regras
                  <div key={index} className="flex items-start space-x-3"> {/* Item de regra com número e texto */}
                    <div className="flex-shrink-0 text-sm font-bold text-gray-600">#{index + 1}</div> {/* Número da regra */}
                    <p className="text-sm text-gray-700">{rule}</p> {/* Texto da regra */}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3"> {/* Coluna principal que contém as ondas do sequencer */}
          <div className="space-y-8"> {/* Espaçamento vertical entre ondas */}
            {waves.map((wave, waveIndex) => { // Itera sobre cada onda
                const { features, postIts } = wave; // Desestrutura as features e postIts da onda atual
                const combinedItems = [...features, ...postIts].sort((a, b) => a.id - b.id); // Combina e ordena por id para manter a ordem de criação

                return (
                  <div key={wave.id} className="relative group bg-gray-50/70 p-4 rounded-xl shadow-md"> {/* Container visual de uma onda */}
                    <div className="flex items-center mb-4"> {/* Cabeçalho da onda com número e cards */}
                      <div className="bg-gray-800 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0">
                        {waveIndex + 1} {/* Número sequencial da onda */}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1"> {/* Grade que contém Features e postIts */}
                        {combinedItems.map((item) => { // Itera sobre o array combinado de itens
                            if ('name' in item) { // Verifica se o item possui propriedade name, indicando que é uma Feature
                                const featureIndex = features.findIndex(f => f.id === item.id); // Obtém o índice da Feature na lista original
                                return (
                                    <Card 
                                        key={item.id} 
                                        className={`relative group min-h-[160px] shadow-lg transition-shadow border-2 ${getConfidenceColor(item.confidence)}`} // Card da Feature com cor baseada na confiança
                                    >
                                        {!isReadOnly && ( // Botão de remoção exibido apenas em modo edição
                                          <Button
                                            size="icon"
                                            variant="destructive"
                                            className="absolute -top-3 -right-3 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10" // Botão aparece ao passar o mouse
                                            onClick={(e) => { e.stopPropagation(); removeFeature(waveIndex, featureIndex); }} // Remove a Feature clicada sem disparar clique no container
                                          >
                                            <X className="h-4 w-4" /> {/* Ícone de remoção */}
                                          </Button>
                                        )}
                                        <CardContent className="p-3 space-y-3 h-full flex flex-col justify-between"> {/* Conteúdo da Feature com layout em coluna */}
                                        <AutoResizingTextarea
                                            value={item.name} // Nome da Feature
                                            onChange={(e: any) => updateFeature(waveIndex, featureIndex, 'name', e.target.value)} // Atualiza o campo name
                                            placeholder="Feature name" // Placeholder do título
                                            className="w-full bg-transparent border-none outline-none resize-none text-base text-center flex-grow focus:ring-1 focus:ring-gray-800 rounded-md p-2" // Estilo do textarea do nome
                                            disabled={isReadOnly} // Desabilita em modo somente leitura
                                        />
                                        <div className="space-y-2"> {/* Container para os campos Value e Confidence */}
                                          <input
                                            type="text" // Campo de texto simples para Value
                                            value={item.value} // Valor atual
                                            onChange={(e) => updateFeature(waveIndex, featureIndex, 'value', e.target.value)} // Atualiza o campo value
                                            placeholder="Value" // Placeholder do valor
                                            className="w-full bg-white/70 backdrop-blur-sm border-gray-300 focus:ring-gray-800 rounded-md p-2 text-center" // Estilo do input de valor
                                            disabled={isReadOnly} // Desabilita em modo somente leitura
                                          />
                                          <select
                                            value={item.confidence} // Valor atual de confidence
                                            onChange={(e) => updateFeature(waveIndex, featureIndex, 'confidence', e.target.value)} // Atualiza o campo confidence
                                            className="w-full bg-white/70 backdrop-blur-sm font-medium focus:ring-gray-800 rounded-md p-2" // Estilo do select de confiança
                                            disabled={isReadOnly}> {/* Desabilita quando somente leitura */}
                                              <option value="green">High</option> {/* Opção Alta confiança */}
                                              <option value="yellow">Medium</option> {/* Opção Média confiança */}
                                              <option value="red">Low</option> {/* Opção Baixa confiança */}
                                          </select>
                                        </div>
                                        </CardContent>
                                    </Card>
                                );
                            } else { // Caso contrário, o item é um post-it
                                return (
                                    <Card 
                                        key={item.id} 
                                        className="relative group min-h-[160px] bg-gray-800 text-white flex items-center justify-center shadow-xl" // Card escuro para post-it MVP ou Increment
                                    >
                                        {!isReadOnly && ( // Botão de remoção exibido apenas quando edição é permitida
                                          <Button
                                              size="icon"
                                              variant="destructive"
                                              className="absolute -top-3 -right-3 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10" // Botão aparece no hover
                                              onClick={(e) => { e.stopPropagation(); removePostIt(waveIndex, item.id); }} // Remove o post-it
                                          >
                                              <X className="h-4 w-4" /> {/* Ícone de remoção */}
                                          </Button>
                                        )}
                                        <CardContent className="p-3"> {/* Conteúdo do post-it */}
                                            <p className="text-2xl tracking-wider uppercase">{item.label}</p> {/* Exibe o rótulo do post-it em destaque */}
                                        </CardContent>
                                    </Card>
                                );
                            }
                        })}

                        {!isReadOnly && ( // Coluna de adicionar novo item na onda, apenas em modo edição
                            <div className="relative">
                                <Button
                                    variant="outline" // Botão contornado
                                    onClick={(e) => { e.stopPropagation(); setShowMenu({ waveIndex, itemIndex: features.length }); }} // Abre o menu de seleção de tipo de item
                                    className="h-full min-h-[160px] border-dashed border-2 hover:bg-gray-200/50 flex flex-col items-center justify-center w-full transition-colors" // Estilo do botão com borda tracejada
                                >
                                    <Plus className="h-8 w-8 text-gray-400 mb-1" /> {/* Ícone Plus */}
                                    <span className="text-gray-500 font-semibold">Add</span> {/* Texto do botão */}
                                </Button>
                                {showMenu && showMenu.waveIndex === waveIndex && showMenu.itemIndex === features.length && ( // Exibe o menu suspenso se o estado coincidir
                                    <div className="absolute top-0 left-0 w-full bg-white shadow-lg rounded-md z-20 border" onClick={(e) => e.stopPropagation()}> {/* Menu de seleção de item */}
                                        <Button variant="ghost" className="w-full justify-start p-3 text-sm hover:bg-gray-100" onClick={() => addFeature(waveIndex)} disabled={features.length >= 3}>Feature</Button> {/* Opção para adicionar Feature, desabilita se já houver 3 */}
                                        <Button variant="ghost" className="w-full justify-start p-3 text-sm hover:bg-gray-100" onClick={() => addPostIt(waveIndex, 'MVP')} disabled={hasMVP()}>MVP</Button> {/* Opção para adicionar MVP, desabilita se já existir um MVP */}
                                        <Button variant="ghost" className="w-full justify-start p-3 text-sm hover:bg-gray-100" onClick={() => addPostIt(waveIndex, 'Increment')} disabled={!hasMVP()}>Increment</Button> {/* Opção para adicionar Increment, desabilita se ainda não houver MVP */}
                                        <Button variant="ghost" className="w-full justify-start p-3 text-sm text-red-500 hover:bg-red-50" onClick={() => setShowMenu(null)}>Cancel</Button> {/* Opção para cancelar e fechar o menu */}
                                    </div>
                                )}
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequencerTemplate; // Exporta o componente SequencerTemplate como exportação padrão
