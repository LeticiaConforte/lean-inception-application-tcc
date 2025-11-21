import React, { useState, useRef, useLayoutEffect } from 'react'; // Importa React e os hooks useState, useRef e useLayoutEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importa componentes de layout de cartão
import { Button } from '@/components/ui/button'; // Importa componente de botão reutilizável
import { Plus, X } from 'lucide-react'; // Importa ícones de adicionar (Plus) e remover (X)

interface KickoffParticipant { // Define a estrutura de um participante do Kickoff
  id: number; // Identificador único do participante
  text: string; // Texto com nome ou descrição do participante
  color: string; // Cor de fundo associada ao participante
}

interface KickoffData { // Define a estrutura dos dados do Kickoff
  fullWorkshopParticipants: KickoffParticipant[]; // Participantes de todo o workshop
  partialWorkshopParticipants: KickoffParticipant[]; // Participantes parciais do workshop
}

interface KickoffTemplateProps { // Define as propriedades esperadas pelo componente KickoffTemplate
  content: KickoffData; // Dados iniciais do template de Kickoff
  onContentChange: (newContent: KickoffData) => void; // Função de callback para notificar alterações
  isReadOnly?: boolean; // Flag opcional para definir modo somente leitura
}

const AutoResizingTextarea = ({ value, onChange, className, placeholder, disabled }: any) => { // Componente de textarea com ajuste automático de altura
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Cria uma referência ao elemento textarea

  useLayoutEffect(() => { // Hook que roda após o layout ser calculado
    const textarea = textareaRef.current; // Obtém o elemento textarea atual
    if (textarea) { // Verifica se o textarea existe
      textarea.style.height = 'auto'; // Reseta a altura para recalcular
      textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta a altura com base no conteúdo
    }
  }, [value]); // Executa o efeito sempre que o valor do textarea mudar

  return (
    <textarea
      ref={textareaRef} // Associa a referência ao elemento textarea
      value={value} // Define o valor atual do textarea
      onChange={onChange} // Função chamada ao mudar o conteúdo
      className={className} // Classes CSS recebidas como prop
      placeholder={placeholder} // Texto placeholder exibido quando vazio
      rows={1} // Define o número mínimo de linhas
      disabled={disabled} // Desabilita o textarea quando isReadOnly for verdadeiro
    />
  );
};

const KickoffTemplate: React.FC<KickoffTemplateProps> = ({ content, onContentChange, isReadOnly = false }) => { // Componente principal do template de Kickoff
  const availableColors = ['bg-yellow-200', 'bg-rose-200', 'bg-green-200', 'bg-blue-200', 'bg-indigo-200']; // Lista de classes de cores disponíveis
  const defaultColor = 'bg-yellow-200'; // Cor padrão para novos participantes

  const initializeParticipants = (participants: any[] | undefined): KickoffParticipant[] => // Função auxiliar para inicializar participantes
    (participants && participants.length > 0 ? participants : []).map((participant: any, index: number) => ({ // Garante um array válido e mapeia itens
      id: participant.id || Date.now() + index, // Usa ID existente ou gera um novo baseado no timestamp
      text: participant.text || 'New Participant', // Usa texto existente ou valor padrão
      color: participant.color || defaultColor, // Usa cor existente ou padrão
    }));

  const [fullWorkshopParticipants, setFullWorkshopParticipants] = useState<KickoffParticipant[]>(initializeParticipants(content?.fullWorkshopParticipants)); // Estado para participantes de todo o workshop
  const [partialWorkshopParticipants, setPartialWorkshopParticipants] = useState<KickoffParticipant[]>(initializeParticipants(content?.partialWorkshopParticipants)); // Estado para participantes parciais

  const updateAndNotify = (newFull: KickoffParticipant[], newPartial: KickoffParticipant[]) => { // Atualiza estados locais e notifica componente pai
    setFullWorkshopParticipants(newFull); // Atualiza lista de participantes completos
    setPartialWorkshopParticipants(newPartial); // Atualiza lista de participantes parciais
    if (!isReadOnly) { // Apenas notifica se não estiver em modo somente leitura
      onContentChange({ // Chama callback com novo conteúdo consolidado
        fullWorkshopParticipants: newFull,
        partialWorkshopParticipants: newPartial,
      });
    }
  };

  const addItem = (type: keyof KickoffData) => { // Adiciona novo participante em uma das listas
    if (isReadOnly) return; // Impede alteração em modo somente leitura
    const newItem = { id: Date.now(), text: 'New Participant', color: defaultColor }; // Cria novo participante com valores padrão
    if (type === 'fullWorkshopParticipants') { // Verifica se é lista de participantes completos
      updateAndNotify([...fullWorkshopParticipants, newItem], partialWorkshopParticipants); // Atualiza lista de completos
    } else { // Caso contrário, é lista de participantes parciais
      updateAndNotify(fullWorkshopParticipants, [...partialWorkshopParticipants, newItem]); // Atualiza lista de parciais
    }
  };

  const updateItem = (id: number, type: keyof KickoffData, text: string) => { // Atualiza texto de um participante específico
    if (type === 'fullWorkshopParticipants') { // Verifica qual lista deve ser atualizada
      const newItems = fullWorkshopParticipants.map(item => (item.id === id ? { ...item, text } : item)); // Atualiza texto na lista de completos
      updateAndNotify(newItems, partialWorkshopParticipants); // Notifica mudanças
    } else { // Se for lista de parciais
      const newItems = partialWorkshopParticipants.map(item => (item.id === id ? { ...item, text } : item)); // Atualiza texto na lista de parciais
      updateAndNotify(fullWorkshopParticipants, newItems); // Notifica mudanças
    }
  };

  const updateItemColor = (id: number, type: keyof KickoffData, color: string) => { // Atualiza a cor de um participante
    if (isReadOnly) return; // Impede alterações em modo somente leitura
    if (type === 'fullWorkshopParticipants') { // Verifica lista de destino
      const newItems = fullWorkshopParticipants.map(item => (item.id === id ? { ...item, color } : item)); // Atualiza cor na lista de completos
      updateAndNotify(newItems, partialWorkshopParticipants); // Notifica mudanças
    } else { // Caso seja lista de parciais
      const newItems = partialWorkshopParticipants.map(item => (item.id === id ? { ...item, color } : item)); // Atualiza cor na lista de parciais
      updateAndNotify(fullWorkshopParticipants, newItems); // Notifica mudanças
    }
  };

  const removeItem = (id: number, type: keyof KickoffData) => { // Remove um participante de uma das listas
    if (isReadOnly) return; // Bloqueia remoção em modo somente leitura
    if (type === 'fullWorkshopParticipants') { // Verifica se é lista de completos
      const newItems = fullWorkshopParticipants.filter(item => item.id !== id); // Remove item com ID correspondente
      updateAndNotify(newItems, partialWorkshopParticipants); // Atualiza estado e notifica
    } else { // Caso seja lista de parciais
      const newItems = partialWorkshopParticipants.filter(item => item.id !== id); // Remove item com ID correspondente
      updateAndNotify(fullWorkshopParticipants, newItems); // Atualiza estado e notifica
    }
  };

  const renderSection = (title: string, type: keyof KickoffData, items: KickoffParticipant[]) => ( // Função auxiliar para renderizar uma seção (full ou partial)
    <div className="space-y-3"> {/* Container da seção com espaçamento vertical */}
      <h3 className="text-xl font-bold text-center bg-black text-white py-2 rounded">{title}</h3> {/* Título da seção */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3"> {/* Grid de participantes */}
        {items.map(item => renderItem(item, type))} {/* Renderiza cada participante usando renderItem */}
        {!isReadOnly && ( // Renderiza botão de adicionar se não estiver em modo leitura
          <Button
            variant="outline" // Estilo do botão
            onClick={() => addItem(type)} // Ao clicar, adiciona participante na seção correspondente
            className="h-40 border-dashed border-2 flex items-center justify-center bg-gray-50 hover:bg-gray-100" // Estilização visual
          >
            <Plus className="h-8 w-8 text-gray-400" /> {/* Ícone de adicionar */}
          </Button>
        )}
      </div>
    </div>
  );

  const renderItem = (item: KickoffParticipant, type: keyof KickoffData) => ( // Renderiza um cartão individual de participante
    <Card key={item.id} className={`${item.color} shadow-lg relative group flex flex-col justify-between p-4 min-h-[160px]`}> {/* Card com cor dinâmica */}
      {!isReadOnly && ( // Botão de remoção visível apenas em modo edição
        <Button
          size="sm" // Tamanho pequeno
          variant="destructive" // Estilo de botão de remoção
          className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" // Mostra no hover
          onClick={() => removeItem(item.id, type)}>
          <X className="h-3 w-3" /> {/* Ícone X pequeno */}
        </Button>
      )}
      <AutoResizingTextarea
        className="w-full bg-transparent border-none focus:outline-none resize-none text-gray-800" // Estilo do textarea
        value={item.text} // Texto atual do participante
        onChange={(e: any) => updateItem(item.id, type, e.target.value)} // Atualiza texto ao digitar
        disabled={isReadOnly} // Desabilita edição em modo somente leitura
      />
      {!isReadOnly && ( // Renderiza paleta de cores somente quando editável
        <div className="flex justify-center space-x-2 mt-2"> {/* Container dos botões de cor */}
          {availableColors.map(color => (
            <button
              key={color} // Chave única por cor
              onClick={() => updateItemColor(item.id, type, color)} // Atualiza cor do participante
              className={`w-6 h-6 rounded-full transition-all duration-150 ease-in-out transform hover:scale-110 ${color} ${item.color === color ? 'ring-2 ring-offset-2 ring-neutral-900' : 'ring-1 ring-neutral-400'}`} // Estilização da bolinha de cor
              aria-label={`Change color to ${color}`} // Label de acessibilidade
            />
          ))}
        </div>
      )}
    </Card>
  );

  return (
    <div className="p-4 space-y-6 bg-white"> {/* Container principal do template */}
      <Card className="shadow-lg"> {/* Card de introdução do Kickoff */}
        <CardHeader> {/* Cabeçalho do card */}
          <CardTitle className="text-3xl font-bold text-center text-gray-800">Kickoff</CardTitle> {/* Título principal */}
        </CardHeader>
        <CardContent className="text-center space-y-4"> {/* Conteúdo do card */}
          <p className="text-lg text-gray-700"> {/* Parágrafo explicativo sobre o Kickoff */}
            The Lean Inception starts with a kick-off, followed by a sequence of intense activities, and ends with a workshop showcase. The team directly involved with the initiative must participate in all activities; the other interested parties must participate in the kick-off and the showcase, where the expectations and results obtained in the workshop are presented, respectively.
          </p>
          <div className="bg-gray-100 p-6 rounded-lg my-6"> {/* Caixa de destaque com frase */}
            <p className="text-2xl font-semibold text-gray-800">Think big, start small, learn fast!</p> {/* Frase de impacto */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left"> {/* Lista de instruções em três passos */}
            <div className="flex items-start space-x-3"> {/* Passo 1 */}
              <div className="flex-shrink-0 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold">1</div> {/* Número do passo */}
              <p className="text-gray-700">Ask the main sponsor of the initiative to open the Lean Inception with a speech about the initiative to be worked on.</p> {/* Descrição do passo */}
            </div>
            <div className="flex items-start space-x-3"> {/* Passo 2 */}
              <div className="flex-shrink-0 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold">2</div> {/* Número do passo */}
              <p className="text-gray-700">Make a brief presentation about the Lean Inception agenda and the concept of MVP.</p> {/* Descrição do passo */}
            </div>
            <div className="flex items-start space-x-3"> {/* Passo 3 */}
              <div className="flex-shrink-0 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold">3</div> {/* Número do passo */}
              <p className="text-gray-700">Ask everyone to write their names, using the color that identifies the level of participation.</p> {/* Descrição do passo */}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8 pt-6"> {/* Seções de participantes */}
        {renderSection('FULL WORKSHOP PARTICIPANTS', 'fullWorkshopParticipants', fullWorkshopParticipants)} {/* Seção para participantes completos */}
        {renderSection('PARTIAL WORKSHOP PARTICIPANTS', 'partialWorkshopParticipants', partialWorkshopParticipants)} {/* Seção para participantes parciais */}
      </div>
    </div>
  );
};

export default KickoffTemplate; // Exporta o componente KickoffTemplate como padrão