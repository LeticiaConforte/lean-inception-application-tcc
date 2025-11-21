import React, { useState, useRef, useLayoutEffect } from 'react'; // Importa React e os hooks useState, useRef e useLayoutEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importa componentes de cartão reutilizáveis
import { Button } from '@/components/ui/button'; // Importa componente de botão
import { Plus, X } from 'lucide-react'; // Importa ícones Plus (adicionar) e X (remover)

interface ParkingSpot { // Interface que define a estrutura de um item do Parking Lot
  id: number; // Identificador único de cada item
  text: string; // Texto da dúvida ou item estacionado
  color: string; // Classe de cor do post-it
}

interface ParkingLotTemplateProps { // Interface das propriedades do componente ParkingLotTemplate
  content: any; // Conteúdo vindo de fora, com tipagem flexível
  onContentChange: (content: any) => void; // Função callback para comunicar alterações ao componente pai
  isReadOnly?: boolean; // Flag opcional para indicar modo somente leitura
}

const AutoResizingTextarea = ({ value, onChange, className, placeholder, disabled }: any) => { // Componente textarea que ajusta sua altura automaticamente
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Referência ao elemento textarea no DOM

  useLayoutEffect(() => { // Hook que roda após o layout ser calculado
    const textarea = textareaRef.current; // Obtém o elemento referenciado
    if (textarea) { // Verifica se o textarea existe
      textarea.style.height = 'auto'; // Reseta a altura para recalcular
      textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta a altura com base no conteúdo interno
    }
  }, [value]); // Reexecuta o efeito sempre que o valor do textarea mudar

  return (
    <textarea
      ref={textareaRef} // Associa a referência ao elemento textarea
      value={value} // Valor atual exibido no campo
      onChange={onChange} // Função chamada sempre que o texto for alterado
      className={className} // Classes CSS recebidas como prop
      placeholder={placeholder} // Placeholder exibido quando o campo está vazio
      rows={1} // Define altura mínima de uma linha
      disabled={disabled} // Desabilita edição quando em modo somente leitura
    />
  );
};

const ParkingLotTemplate: React.FC<ParkingLotTemplateProps> = ({ content, onContentChange, isReadOnly = false }) => { // Componente principal do Parking Lot
  const availableColors = ['bg-yellow-200', 'bg-rose-200', 'bg-green-200', 'bg-blue-200', 'bg-indigo-200']; // Lista de cores disponíveis para os post-its
  const defaultColor = 'bg-yellow-200'; // Cor padrão quando nenhuma cor é informada

  const [spots, setSpots] = useState<ParkingSpot[]>( // Estado local que armazena a lista de itens do Parking Lot
    (content?.spots || [{ text: 'New doubt' }]).map((spot: any, index: number) => ({ // Usa spots vindos de content ou cria um item padrão
      id: spot.id || Date.now() + index, // Gera um id baseado no timestamp quando não existir
      text: spot.text, // Usa o texto existente
      color: spot.color || defaultColor, // Usa a cor existente ou a cor padrão
    }))
  );

  const updateAndNotify = (newSpots: ParkingSpot[]) => { // Função auxiliar para atualizar o estado e notificar o componente pai
    setSpots(newSpots); // Atualiza o estado local com a nova lista de spots
    if (!isReadOnly) { // Só notifica se não estiver em modo somente leitura
      onContentChange({ spots: newSpots }); // Chama o callback passando o novo conteúdo
    }
  };

  const addSpot = () => { // Adiciona um novo item ao Parking Lot
    if (isReadOnly) return; // Impede adição de itens em modo somente leitura
    const newSpots = [...spots, { id: Date.now(), text: 'New doubt', color: defaultColor }]; // Cria nova lista com um item extra
    updateAndNotify(newSpots); // Atualiza o estado e notifica o pai
  };

  const updateSpotText = (id: number, text: string) => { // Atualiza o texto de um item específico
    const newSpots = spots.map(spot => (spot.id === id ? { ...spot, text } : spot)); // Substitui apenas o item com o id correspondente
    updateAndNotify(newSpots); // Atualiza e notifica
  };

  const updateSpotColor = (id: number, color: string) => { // Atualiza a cor de um item
    if (isReadOnly) return; // Impede alteração em modo somente leitura
    const newSpots = spots.map(spot => (spot.id === id ? { ...spot, color } : spot)); // Atualiza a cor do item correto
    updateAndNotify(newSpots); // Atualiza e notifica
  };

  const removeSpot = (id: number) => { // Remove um item do Parking Lot
    if (isReadOnly) return; // Impede remoção em modo somente leitura
    const newSpots = spots.filter(spot => spot.id !== id); // Cria nova lista sem o item removido
    updateAndNotify(newSpots); // Atualiza e notifica
  };

  return (
    <div className="p-4 space-y-6 bg-white"> {/* Container principal com padding e fundo branco */}
      <Card className="shadow-lg"> {/* Card de introdução do Parking Lot */}
        <CardHeader> {/* Cabeçalho do card */}
          <CardTitle className="text-3xl font-bold text-center text-gray-800">Parking Lot</CardTitle> {/* Título principal do template */}
        </CardHeader>
        <CardContent className="text-center"> {/* Conteúdo do card, centralizado */}
          <p className="text-lg text-gray-700"> {/* Parágrafo de explicação do conceito de Parking Lot */}
            The Parking Lot helps to momentarily park conversations, ideas or questions that are raised during a conversation but are not useful for discussion at that specific time. It is an essential tool for the facilitator at any time during the workshop, as it is a polite way of saying: "yes, I heard you, but this conversation is for later".
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-6"> {/* Grade responsiva para exibir os post-its */}
        {spots.map((spot) => ( // Itera sobre cada item do Parking Lot
          <Card key={spot.id} className={`${spot.color} shadow-lg relative group flex flex-col justify-between p-4 min-h-[160px]`}> {/* Card de cada spot com cor dinâmica */}
            {!isReadOnly && ( // Exibe o botão de remover apenas se não estiver em modo somente leitura
              <Button 
                size="sm" // Define o tamanho pequeno
                variant="destructive" // Estilo destrutivo para indicar remoção
                className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" // Mostra o botão ao passar o mouse
                onClick={() => removeSpot(spot.id)}> {/* Remove o spot correspondente ao clicar */}
                <X className="h-3 w-3" /> {/* Ícone X pequeno dentro do botão */}
              </Button>
            )}
            <AutoResizingTextarea
              className="w-full bg-transparent border-none focus:outline-none resize-none text-gray-800" // Estilo do textarea dentro do card
              value={spot.text} // Texto atual do spot
              onChange={(e: any) => updateSpotText(spot.id, e.target.value)} // Atualiza texto ao digitar
              disabled={isReadOnly} // Desabilita edição em modo somente leitura
            />
            {!isReadOnly && ( // Mostra o seletor de cores apenas quando edição é permitida
              <div className="flex justify-center space-x-2 mt-2"> {/* Linha de bolinhas de cor abaixo do texto */}
                {availableColors.map(color => ( // Itera sobre as cores disponíveis
                  <button
                    key={color} // Chave única baseada na cor
                    onClick={() => updateSpotColor(spot.id, color)} // Atualiza a cor do spot ao clicar
                    className={`w-6 h-6 rounded-full transition-all duration-150 ease-in-out transform hover:scale-110 ${color} ${spot.color === color ? 'ring-2 ring-offset-2 ring-neutral-900' : 'ring-1 ring-neutral-400'}`} // Estilização visual da bolinha de cor
                    aria-label={`Change color to ${color}`} // Label de acessibilidade para leitores de tela
                  />
                ))}
              </div>
            )}
          </Card>
        ))}
        {!isReadOnly && ( // Botão para adicionar novo spot, exibido somente em modo editável
          <Button
            variant="outline" // Estilo contornado
            onClick={addSpot} // Chama a função que adiciona um novo spot
            className="h-40 border-dashed border-2 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors" // Estilo com borda pontilhada e hover
          >
            <Plus className="h-8 w-8 text-gray-400" /> {/* Ícone de adicionar dentro do botão */}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ParkingLotTemplate; // Exporta o componente ParkingLotTemplate como padrão
