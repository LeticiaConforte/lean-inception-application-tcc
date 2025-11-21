import React, { useState, useRef, useLayoutEffect } from 'react'; // Importa React e os hooks useState, useRef e useLayoutEffect
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Importa os componentes de Card reutilizáveis da UI
import { Button } from '@/components/ui/button'; // Importa o componente de botão padrão da aplicação
import { Plus, X } from 'lucide-react'; // Importa os ícones Plus e X da biblioteca lucide-react

/* =========================
 * Typings
 * ========================= */
interface Step { id: number; text: string; } // Define o tipo Step. cada passo possui um id e um texto
interface Journey { id: number; persona: string; goal: string; steps: Step[]; } // Define a jornada. vinculando persona, objetivo e lista de passos
interface JourneyItem {
  id: number; // Identificador único do item de jornada (usado na renderização e manipulação)
  text: string; // Texto exibido no card correspondente a este item
  type: 'persona' | 'step' | 'goal' | 'add'; // Tipo do item. controla o estilo e comportamento (persona, step, goal ou botão de adicionar)
  journeyId: number; // Id da jornada à qual este item pertence
}
interface UserJourneysTemplateProps {
  content: any; // Conteúdo recebido do componente pai (estrutura com journeys)
  onContentChange: (content: any) => void; // Callback para comunicar alterações de conteúdo ao componente pai
  isReadOnly?: boolean; // Flag opcional para indicar modo somente leitura
}

/* =========================
 * Auto-resizing Textarea
 * ========================= */
const AutoResizingTextarea = ({ value, onChange, className, placeholder, disabled }: any) => { // Textarea reutilizável que ajusta a altura de acordo com o conteúdo
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Referência ao elemento textarea no DOM

  useLayoutEffect(() => { // Executa logo após o layout ser calculado. garantindo ajuste visual imediato
    const t = textareaRef.current; // Obtém a referência atual do textarea
    if (t) { // Se o elemento existir
      t.style.height = 'auto'; // Reseta a altura para recalcular
      t.style.height = `${t.scrollHeight}px`; // Ajusta a altura conforme o conteúdo interno
    }
  }, [value]); // Reaplica o ajuste sempre que o valor do textarea mudar

  return (
    <textarea
      ref={textareaRef} // Associa a referência ao elemento textarea
      value={value} // Valor de texto exibido no campo
      onChange={onChange} // Handler para mudanças de texto
      className={className} // Classes CSS recebidas via props
      placeholder={placeholder} // Placeholder exibido quando o campo está vazio
      rows={1} // Mínimo de uma linha de altura
      disabled={disabled} // Desabilita edição quando em modo somente leitura
    />
  );
};

/* =========================
 * Hook: columns per row (com mínimo por linha)
 * ========================= */
function useMeasuredColumns(ref: React.RefObject<HTMLElement>, deps: any[] = [], isReadOnly: boolean = false) { // Hook personalizado para calcular quantos itens cabem por linha
  const [cols, setCols] = React.useState(4); // Estado que guarda a quantidade de colunas. padrão inicial 4

  React.useEffect(() => { // Efeito que reage a mudanças de tamanho do container e dependências
    if (!ref.current) return; // Se não houver elemento associado à ref. não faz nada

    const ITEM_W = 192; // 12rem (w-48) <<< AJUSTADO . largura de um item
    const ARROW_W = 32; // 2rem  (w-8). largura reservada para a seta horizontal
    const GAP = 4;      // 4px   (gap-1). espaço entre item e seta
    const MIN_PER_ROW = isReadOnly ? 2 : 4; // Define mínimo de itens por linha. menor em modo somente leitura para melhor legibilidade

    const ro = new ResizeObserver((entries) => { // Observador de resize para acompanhar mudanças de largura no container
      const el = entries[0]?.target as HTMLElement; // Recupera o elemento observado
      if (!el) return; // Se não encontrar. interrompe
      const style = getComputedStyle(el); // Lê os estilos computados do elemento
      const paddingX = parseFloat(style.paddingLeft || '0') + parseFloat(style.paddingRight || '0'); // Soma os paddings horizontais
      const width = el.clientWidth - paddingX; // Largura útil do container. descontando paddings
      const unit = ITEM_W + ARROW_W + GAP; // Largura combinada de um bloco (item + seta + gap)
      const calc = Math.max(1, Math.floor((width + ARROW_W + GAP) / unit)); // Calcula quantos blocos cabem horizontalmente
      setCols(Math.max(MIN_PER_ROW, calc)); // Garante o mínimo por linha e atualiza o estado de colunas
    });

    ro.observe(ref.current); // Começa a observar o elemento atual
    const onWin = () => ref.current && ro.observe(ref.current); // Reobserva em caso de resize de janela. garantindo atualização
    window.addEventListener('resize', onWin); // Registra listener de resize da janela

    return () => { // Função de limpeza do efeito
      ro.disconnect(); // Interrompe o observador de resize
      window.removeEventListener('resize', onWin); // Remove o listener de resize da janela
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, isReadOnly]); // Reexecuta quando as dependências ou o modo de leitura mudam

  return cols; // Retorna a quantidade de colunas calculada
}

/* =========================
 * SVG Arrows
 * ========================= */
const ArrowRightSVG: React.FC = () => ( // Componente para seta apontando para a direita
  <svg width="28" height="14" viewBox="0 0 72 24" aria-hidden>
    <path d="M2 12 H52" stroke="black" strokeWidth="4" strokeLinecap="round" /> {/* Linha horizontal principal */}
    <path d="M52 12 L42 6 M52 12 L42 18" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> {/* Cabeça da seta */}
  </svg>
);
const ArrowLeftSVG: React.FC = () => ( // Componente para seta apontando para a esquerda (espelhada horizontalmente)
  <svg width="28" height="14" viewBox="0 0 72 24" aria-hidden style={{ transform: 'scaleX(-1)' }}>
    <path d="M2 12 H52" stroke="black" strokeWidth="4" strokeLinecap="round" /> {/* Linha horizontal principal */}
    <path d="M52 12 L42 6 M52 12 L42 18" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> {/* Cabeça da seta (espelhada) */}
  </svg>
);
const ArrowDownSVG: React.FC = () => ( // Componente para seta apontando para baixo
  <svg width="18" height="34" viewBox="0 0 24 40" aria-hidden>
    <path d="M12 2 V28" stroke="black" strokeWidth="4" strokeLinecap="round" /> {/* Linha vertical principal */}
    <path d="M12 28 L6 18 M12 28 L18 18" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> {/* Cabeça da seta para baixo */}
  </svg>
);

/* =========================
 * GridStepsBoard — shrink-wrap + serpentina
 * ========================= */
type RenderItemFn = (item: JourneyItem) => React.ReactNode; // Tipo para função que recebe um JourneyItem e retorna um nó React

const GridStepsBoard: React.FC<{ items: JourneyItem[]; renderItem: RenderItemFn; isReadOnly?: boolean; }> = ({ items, renderItem, isReadOnly }) => { // Componente que organiza os passos em linhas estilo serpentina
  const wrapperRef = React.useRef<HTMLDivElement>(null); // Referência para o wrapper que será medido pelo hook
  const itemsPerRow = useMeasuredColumns(wrapperRef, [items.length], isReadOnly); // Calcula dinamicamente quantos itens cabem por linha

  // divide sequencialmente em linhas
  const rows: JourneyItem[][] = []; // Array de linhas. cada linha contém um subconjunto de JourneyItem
  if (itemsPerRow > 0) { // Se existe um número válido de itens por linha
    for (let i = 0; i < items.length; i += itemsPerRow) rows.push(items.slice(i, i + itemsPerRow)); // Fatia o array original em subconjuntos
  } else {
    rows.push(items); // Caso extremo. adiciona todos os itens em uma única linha
  }

  return (
    <div className="w-full flex justify-center"> {/* Container que centraliza horizontalmente o board */}
      <div ref={wrapperRef} className="inline-flex flex-col gap-4"> {/* Wrapper com layout em coluna e espaçamento entre linhas */}
        {rows.map((row, rowIndex) => { // Itera sobre cada linha de itens
          const isReversed = rowIndex % 2 !== 0;           // linhas ímpares. fluxo reverso (direita para esquerda)
          const visible = isReversed ? [...row].reverse() : row; // Inverte a ordem da linha quando for uma linha ímpar
          const cols = visible.length; // Quantidade de itens na linha atual

          // (item 12rem + seta 2rem) * (n-1) + item 12rem <<< ATUALIZADO
          const template = Array.from({ length: cols - 1 }).map(() => '12rem 2rem').join(' '); // Cria padrão de colunas alternando item e seta
          const gtc = `${template} 12rem`; // Define a última coluna como item (sem seta depois)

          const rowJustify = isReversed ? 'justify-end' : 'justify-start'; // Alinhamento da linha. muda conforme direção

          // item do lado de saída (onde a seta ↓ aparece)
          const sideItem = isReversed ? visible[0] : visible[visible.length - 1]; // Item da ponta onde a seta vertical poderá aparecer
          const shouldShowDown = rowIndex < rows.length - 1 && sideItem?.type === 'step'; // Configura se deve mostrar seta para baixo. apenas se ainda houver linha abaixo e o item for um step

          // coluna para a seta ↓
          const gridColsCount = (cols - 1) * 2 + 1; // Total de colunas da grid (itens e setas intercalados)
          const downCol = isReversed ? 1 : gridColsCount; // Coluna de saída da seta para baixo. depende da direção da linha

          return (
            <div key={rowIndex} className="relative"> {/* Wrapper da linha atual. permite posicionar a seta vertical abaixo */}
              <div className={`flex ${rowJustify}`}> {/* Flex para alinhar o grid à esquerda ou à direita conforme o sentido da serpentina */}
                <div className="grid gap-1 items-center" style={{ gridTemplateColumns: gtc }}> {/* Grid que posiciona itens e setas horizontais conforme o template calculado */}
                  {visible.map((item, idx) => { // Itera sobre os itens visíveis da linha (com ordem possivelmente invertida)
                    const next = visible[idx + 1]; // Próximo item na linha. usado para decidir se haverá seta entre eles

                    // ===== Regra central =====
                    // Normal (E→D):    seta entre [item, next] se next != add e item != goal
                    // Invertida (D→E): seta entre [item, next] se item != add e next != goal
                    const showArrowToNext =
                      !!next && // Garante que há próximo item
                      (!isReversed
                        ? next.type !== 'add' && item.type !== 'goal' // Regra para linha normal. seta não aparece após goal e não aponta para add
                        : item.type !== 'add' && next.type !== 'goal'); // Regra para linha invertida. mesma lógica ajustada para ordem

                    return (
                      <React.Fragment key={item.id}> {/* Fragmento para agrupar item e possível seta em sequência */}
                        <div className="h-[100px] w-48 flex items-center justify-center">{/* <<< w-48 . container do card */}
                          {renderItem(item)} {/* Renderiza o card correspondente ao JourneyItem usando a função de renderização injetada */}
                        </div>
                        {idx < visible.length - 1 && ( // Apenas entre itens. não depois do último
                          <div className="h-[100px] w-8 flex items-center justify-center"> {/* Coluna da seta horizontal */}
                            {showArrowToNext
                              ? (isReversed ? <ArrowLeftSVG /> : <ArrowRightSVG />) // Escolhe seta esquerda ou direita conforme a direção da linha
                              : null}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* seta ↓ apenas se o lado de saída for STEP (nunca se for GOAL ou '+') */}
              {shouldShowDown && ( // Renderiza seta para baixo apenas quando apropriado (regra definida acima)
                <div className={`flex mt-2 ${rowJustify}`}> {/* Linha para posicionar a seta vertical logo abaixo da ponta da serpentina */}
                  <div className="grid" style={{ gridTemplateColumns: gtc }}> {/* Usa o mesmo template de colunas para alinhar a seta vertical */}
                    <div
                      style={{ gridColumnStart: downCol }} // Posiciona a seta na coluna calculada (fim ou início da linha)
                      className="w-48 h-10 flex items-center justify-center"   // <<< w-48 . largura igual ao card
                    >
                      <ArrowDownSVG /> {/* Seta apontando para a próxima linha */}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* =========================
 * Main Component
 * ========================= */
const UserJourneysTemplate: React.FC<UserJourneysTemplateProps> = ({
  content, onContentChange, isReadOnly = false,
}) => { // Componente principal que representa o template de Journeys de Usuário
  const [journeys, setJourneys] = useState<Journey[]>(content?.journeys || []); // Estado local com a lista de jornadas. inicializando com o conteúdo vindo das props

  const updateAndNotify = (newJourneys: Journey[]) => { setJourneys(newJourneys); if (!isReadOnly) onContentChange({ journeys: newJourneys }); }; // Atualiza o estado interno e avisa o componente pai se não estiver em modo somente leitura

  const updateJourneyItem = (journeyId: number, itemId: number, type: 'persona' | 'goal' | 'step', value: string) => { // Atualiza um campo específico da jornada (persona, goal ou step)
    const newJourneys = journeys.map((j) => { // Percorre todas as jornadas
      if (j.id !== journeyId) return j; // Se não for a jornada alvo. retorna sem modificações
      if (type === 'persona') return { ...j, persona: value }; // Atualiza o campo persona quando o tipo for persona
      if (type === 'goal') return { ...j, goal: value }; // Atualiza o campo goal quando o tipo for goal
      return { ...j, steps: j.steps.map((s) => (s.id === itemId ? { ...s, text: value } : s)) }; // Atualiza o texto de um step específico quando o tipo for step
    });
    updateAndNotify(newJourneys); // Aplica as alterações e notifica o pai
  };

  const addStep = (journeyId: number) => { // Adiciona um novo passo em uma jornada específica
    if (isReadOnly) return; // Não permite alterações em modo somente leitura
    const newJourneys = journeys.map((j) => { // Percorre as jornadas
      if (j.id !== journeyId) return j; // Ignora jornadas que não correspondem ao id indicado
      const newStep = { id: Date.now(), text: '' }; // Cria um step novo com texto vazio e id baseado em timestamp
      return { ...j, steps: [...j.steps, newStep] }; // Adiciona o novo step ao fim da lista de passos
    });
    updateAndNotify(newJourneys); // Atualiza estado e notifica o pai
  };

  const removeStep = (journeyId: number, stepId: number) => { // Remove um step específico de uma jornada
    if (isReadOnly) return; // Impede remoção quando em modo somente leitura
    updateAndNotify(journeys.map((j) => (j.id === journeyId ? { ...j, steps: j.steps.filter((s) => s.id !== stepId) } : j))); // Filtra o step pelo id dentro da jornada alvo
  };

  const addJourney = () => { // Adiciona uma nova jornada
    if (isReadOnly) return; // Bloqueia criação em modo somente leitura
    updateAndNotify([...journeys, { id: Date.now(), persona: '', goal: '', steps: [] }]); // Cria nova jornada com persona e goal vazios e sem passos
  }
  
  const removeJourney = (id: number) => { // Remove uma jornada inteira
    if (isReadOnly) return; // Não permite remoção em modo somente leitura
    updateAndNotify(journeys.filter((j) => j.id !== id)); // Filtra a jornada pelo id informado
  };

  const baseClasses =
    'w-48 p-3 border-2 rounded-xl focus:outline-none focus:ring-2 resize-none min-h-[100px] overflow-hidden flex-shrink-0 shadow-md text-center flex items-center justify-center'; // <<< w-48 . classes base compartilhadas pelas caixas de persona, step e goal

  const renderItem = (item: JourneyItem) => { // Função responsável por renderizar um JourneyItem conforme o tipo
    switch (item.type) { // Verifica o tipo do item para decidir o estilo e comportamento
      case 'persona':
        return (
          <AutoResizingTextarea
            className={`${baseClasses} bg-blue-100 border-blue-200 focus:ring-blue-400 font-semibold`} // Estilo específico para o card de persona
            value={item.text} // Texto da persona
            onChange={(e: any) => updateJourneyItem(item.journeyId, item.id, 'persona', e.target.value)} // Atualiza o campo persona da jornada correspondente
            placeholder="Persona" // Placeholder que orienta o conteúdo
            disabled={isReadOnly} // Desabilita quando em modo somente leitura
          />
        );
      case 'step':
        return (
          <div className="relative group flex-shrink-0"> {/* Wrapper que permite exibir o botão de remoção sobre o card de step */}
            <AutoResizingTextarea
              className={`${baseClasses} bg-yellow-100 border-yellow-200 focus:ring-yellow-400`} // Estilo para cards de passos (steps)
              value={item.text} // Texto do passo
              onChange={(e: any) => updateJourneyItem(item.journeyId, item.id, 'step', e.target.value)} // Atualiza o texto do passo correspondente
              placeholder="New Step" // Placeholder para indicar novo passo
              disabled={isReadOnly} // Desabilita edição em modo somente leitura
            />
            {!isReadOnly && ( // Botão de remover step exibido apenas se houver permissão de edição
              <Button
                variant="destructive" // Estilo destrutivo. indica remoção
                size="icon" // Tamanho de ícone
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 z-10" // Posicionamento do botão em cima do card com fade no hover
                onClick={() => removeStep(item.journeyId, item.id)} // Remove o passo correspondente na jornada
              >
                <X className="h-4 w-4" /> {/* Ícone de X indicando remoção */}
              </Button>
            )}
          </div>
        );
      case 'add':
        return (
          <Button
            variant="outline" // Botão com borda simples
            onClick={() => addStep(item.journeyId)} // Ao clicar. adiciona um novo passo à jornada correspondente
            className="w-48 h-[100px] border-dashed bg-gray-100 hover:bg-gray-200/60 flex items-center justify-center flex-shrink-0 shadow-inner rounded-xl" // <<< w-48 . estilo de card de adicionar
            disabled={isReadOnly} // Desabilita o clique em modo somente leitura
          >
            <Plus className="h-8 w-8 text-gray-400" /> {/* Ícone de mais para indicar adição */}
          </Button>
        );
      case 'goal':
        return (
          <AutoResizingTextarea
            className={`${baseClasses} bg-green-100 border-green-200 focus:ring-green-400 font-semibold`} // Estilo para o card de goal
            value={item.text} // Texto do objetivo
            onChange={(e: any) => updateJourneyItem(item.journeyId, item.id, 'goal', e.target.value)} // Atualiza o campo goal da jornada
            placeholder="Goal" // Placeholder indicando que ali se descreve o objetivo
            disabled={isReadOnly} // Desabilita em modo somente leitura
          />
        );
      default: return null; // Caso algum tipo inesperado apareça. não renderiza nada
    }
  };

  return (
    <div className="p-4 space-y-6 bg-white"> {/* Container raiz do template com padding e fundo branco */}
      <Card className="shadow-lg"> {/* Card de introdução da atividade de User Journeys */}
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gray-800">User Journeys</CardTitle> {/* Título do template */}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-lg text-gray-700">
            The journey describes a user's journey through a sequence of steps to reach a goal.
            Some of these steps represent different points of contact with the product, characterizing the interaction.
          </p> {/* Parágrafo explicando o conceito de user journey e a relação com o produto */}
        </CardContent>
      </Card>

      {journeys.length === 0 && !isReadOnly && ( // Quando não há nenhuma jornada e está em modo editável. exibe o botão para criar a primeira
        <div className="text-center pt-6">
          <Button
            variant="outline" // Botão com borda tracejada
            onClick={addJourney} // Ao clicar. adiciona uma nova jornada
            className="w-full border-dashed border-2 py-8 text-lg text-gray-600 hover:text-gray-800 hover:border-gray-800 transition-all" // Estilo de call to action para criar jornada
          >
            <Plus className="h-7 w-7 mr-3" /> Add New User Journey {/* Ícone e texto explicando a ação */}
          </Button>
        </div>
      )}

      {journeys.map((journey, index) => { // Renderiza um card para cada jornada existente
        const personaItem: JourneyItem = { id: journey.id, text: journey.persona, type: 'persona', journeyId: journey.id }; // Cria um JourneyItem representando a persona

        const personaBlock = (
          <div className="flex flex-col items-center mb-6"> {/* Bloco que centraliza a persona acima do board de passos */}
            <div className="h-[100px] w-48 flex items-center justify-center">{renderItem(personaItem)}</div> {/* w-48 . altura e largura fixas alinhadas com os demais itens */}
          </div>
        );

        const stepItems: JourneyItem[] = journey.steps.map((s): JourneyItem => ({ // Converte cada Step em JourneyItem do tipo step
          id: s.id, text: s.text, type: 'step', journeyId: journey.id,
        }));

        // ordem: steps → goal → add
        const itemsForBoard: JourneyItem[] = [
          ...stepItems, // Primeiro todos os passos da jornada
          { id: journey.id * -1 - 2, text: journey.goal, type: 'goal' as const, journeyId: journey.id }, // Depois o card de goal com id negativo para evitar conflito
          ...(isReadOnly ? [] : [{ id: journey.id * -1 - 1, text: '', type: 'add' as const, journeyId: journey.id } as JourneyItem]), // E por fim o card de adicionar passos. apenas no modo editável
        ];

        return (
          <Card key={journey.id} className="p-6 pt-10 relative border-2 rounded-xl overflow-hidden shadow-lg bg-gray-50/50"> {/* Card de cada jornada com borda, sombra e fundo suave */}
            {!isReadOnly && ( // Botão para remover a jornada inteira. apenas se edição for permitida
              <Button
                variant="destructive" // Estilo destrutivo. indica ação de exclusão
                size="icon" // Botão no formato de ícone
                className="absolute top-3 right-3 h-7 w-7 rounded-full z-10" // Posicionado no canto superior direito do card
                onClick={() => removeJourney(journey.id)} // Chama a função para remover a jornada
              >
                <X className="h-4 w-4" /> {/* Ícone X indicando remoção */}
              </Button>
            )}

            <div className="text-2xl font-bold text-center text-gray-700 w-full mb-6 tracking-wider">
              USER JOURNEY {journeys.length > 1 ? `#${index + 1}` : ''} {/* Título da jornada. numera quando houver mais de uma */}
            </div>

            {personaBlock} {/* Exibe o bloco com a persona da jornada */}

            <GridStepsBoard items={itemsForBoard} renderItem={renderItem} isReadOnly={isReadOnly} /> {/* Renderiza o board serpentina com passos, goal e botão de adicionar */}
          </Card>
        );
      })}

      {journeys.length > 0 && !isReadOnly && ( // Quando há pelo menos uma jornada e edição está habilitada. exibe botão para adicionar novas
        <Button
          variant="outline" // Botão com borda tracejada
          onClick={addJourney} // Ao clicar. adiciona mais uma jornada
          className="w-full border-dashed border-2 py-8 mt-6 text-lg text-gray-600 hover:text-gray-800 hover:border-gray-800 transition-all" // Estilos de destaque para ação de adicionar
        >
          <Plus className="h-7 w-7 mr-3" /> Add New User Journey {/* Ícone de mais e rótulo do botão */}
        </Button>
      )}
    </div>
  );
};

export default UserJourneysTemplate; // Exporta o componente UserJourneysTemplate como padrão
