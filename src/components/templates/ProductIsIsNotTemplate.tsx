import React, { useState, useRef, useLayoutEffect } from 'react'; // Importa React e os hooks useState, useRef e useLayoutEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importa componentes de cartão reutilizáveis da biblioteca interna
import { Button } from '@/components/ui/button'; // Importa componente de botão reutilizável
import { Plus, X } from 'lucide-react'; // Importa ícones Plus (adicionar) e X (remover) da biblioteca lucide-react

interface GroupItem { // Define a estrutura de um item individual dentro de um grupo
  id: number; // Identificador único do item
  text: string; // Texto descritivo do item
}

interface Group { // Define a estrutura de um grupo do quadro IS / IS NOT / DOES / DOES NOT
  id: number; // Identificador único do grupo
  is: GroupItem[]; // Lista de itens para a coluna "IS"
  isNot: GroupItem[]; // Lista de itens para a coluna "IS NOT"
  does: GroupItem[]; // Lista de itens para a coluna "DOES"
  doesNot: GroupItem[]; // Lista de itens para a coluna "DOES NOT"
  color: string; // Cor base aplicada nos itens do grupo
}

interface ProductIsIsNotTemplateProps { // Define o formato das props recebidas pelo componente principal
  content: any; // Conteúdo inicial vindo do pai. aqui tipado como any
  onContentChange: (content: any) => void; // Função callback para notificar alterações ao componente pai
  isReadOnly?: boolean; // Flag opcional indicando se o template está em modo somente leitura
}

const AutoResizingTextarea = ({ value, onChange, className, placeholder, disabled }: any) => { // Componente textarea que ajusta automaticamente sua altura
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Cria uma referência ao elemento textarea

  useLayoutEffect(() => { // Hook que roda após o React aplicar mudanças no DOM
    const textarea = textareaRef.current; // Obtém o elemento textarea referenciado
    if (textarea) { // Verifica se o elemento existe
      textarea.style.height = 'auto'; // Reseta a altura. para recalcular com base no conteúdo
      textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta a altura para o scrollHeight atual (altura do conteúdo)
    }
  }, [value]); // Reexecuta o efeito sempre que o valor do textarea mudar

  return (
    <textarea
      ref={textareaRef} // Associa a referência ao elemento textarea
      value={value} // Define o valor atual do textarea
      onChange={onChange} // Função chamada quando o usuário altera o texto
      className={className} // Classes CSS recebidas via props
      placeholder={placeholder} // Texto exibido quando o campo está vazio
      rows={1} // Define altura mínima de uma linha
      disabled={disabled} // Desabilita edição caso esteja em modo somente leitura
    />
  );
};

const ProductIsIsNotTemplate: React.FC<ProductIsIsNotTemplateProps> = ({ content, onContentChange, isReadOnly = false }) => { // Componente principal do template "The Product IS - IS NOT - DOES - DOES NOT"
  const colors = ['bg-yellow-200/60', 'bg-pink-200/60', 'bg-blue-200/60', 'bg-green-200/60', 'bg-purple-200/60', 'bg-orange-200/60']; // Array de cores semitransparentes para diferenciar os grupos
  
  const [groups, setGroups] = useState<Group[]>( // Estado local contendo todos os grupos do quadro
    (content?.groups || [ // Usa grupos vindos do content ou inicializa com um grupo padrão
      { id: Date.now(), is: [], isNot: [], does: [], doesNot: [] } // Grupo inicial com listas vazias em cada seção
    ]).map((group: any, index: number) => ({ // Mapeia os grupos para garantir a presença da cor
      ...group, // Mantém todas as propriedades existentes do grupo
      color: group.color || colors[index % colors.length] // Define cor do grupo. reaproveitando se já existir ou usando uma por índice
    }))
  );

  const updateAndNotify = (newGroups: Group[]) => { // Atualiza o estado local e notifica o componente pai
    setGroups(newGroups); // Atualiza o estado groups com a nova lista
    if (!isReadOnly) { // Só notifica o pai se não estiver em modo somente leitura
      onContentChange({ groups: newGroups }); // Chama o callback com o objeto contendo os grupos
    }
  };

  const addGroup = () => { // Função para adicionar um novo grupo
    if (isReadOnly) return; // Se estiver em modo somente leitura. não faz nada
    const newGroups = [...groups, { // Cria um novo array de grupos com um novo item ao final
      id: Date.now(), // Gera um novo id baseado no timestamp atual
      is: [], // Inicializa a lista "IS" vazia
      isNot: [], // Inicializa a lista "IS NOT" vazia
      does: [], // Inicializa a lista "DOES" vazia
      doesNot: [], // Inicializa a lista "DOES NOT" vazia
      color: colors[groups.length % colors.length] // Define a cor com base no índice. de forma cíclica
    }];
    updateAndNotify(newGroups); // Atualiza o estado e notifica o componente pai
  };

  const removeGroup = (index: number) => { // Remove um grupo com base no índice
    if (isReadOnly) return; // Impede remoção em modo somente leitura
    const newGroups = groups.filter((_, i) => i !== index); // Cria nova lista sem o grupo no índice informado
    updateAndNotify(newGroups.map((group, i) => ({ ...group, color: colors[i % colors.length] }))); // Reatribui cores conforme a nova ordem e notifica
  };

  const addItem = (groupIndex: number, type: keyof Omit<Group, 'id' | 'color'>) => { // Adiciona um item a uma das listas (is. isNot. does. doesNot) de um grupo
    const newGroups = [...groups]; // Copia o array de grupos atual
    const newItems = [...newGroups[groupIndex][type], { id: Date.now(), text: '' }]; // Cria uma nova lista de itens com um item vazio adicional
    newGroups[groupIndex] = { ...newGroups[groupIndex], [type]: newItems }; // Atualiza o grupo específico com a lista alterada
    updateAndNotify(newGroups); // Atualiza estado e notifica pai
  };

  const updateItem = (groupIndex: number, type: keyof Omit<Group, 'id' | 'color'>, itemIndex: number, value: string) => { // Atualiza o texto de um item específico
    const newGroups = [...groups]; // Copia o estado atual dos grupos
    const newItems = [...newGroups[groupIndex][type]]; // Copia a lista de itens do tipo selecionado
    newItems[itemIndex] = { ...newItems[itemIndex], text: value }; // Atualiza o texto do item em questão
    newGroups[groupIndex] = { ...newGroups[groupIndex], [type]: newItems }; // Atualiza o grupo com a nova lista de itens
    updateAndNotify(newGroups); // Atualiza estado e notifica
  };

  const removeItem = (groupIndex: number, type: keyof Omit<Group, 'id' | 'color'>, itemIndex: number) => { // Remove um item de uma das listas do grupo
    const newGroups = [...groups]; // Copia a lista de grupos
    const newItems = newGroups[groupIndex][type].filter((_, i) => i !== itemIndex); // Filtra os itens. removendo o índice desejado
    newGroups[groupIndex] = { ...newGroups[groupIndex], [type]: newItems }; // Atualiza o grupo com a lista filtrada
    updateAndNotify(newGroups); // Atualiza estado e notifica
  };

  const renderSection = ( // Função auxiliar para renderizar uma das quatro seções de um grupo
    groupIndex: number, // Índice do grupo atual
    title: string, // Título da seção (IS. IS NOT. DOES. DOES NOT)
    type: keyof Omit<Group, 'id' | 'color'>, // Chave da lista correspondente dentro do grupo
    items: GroupItem[], // Lista de itens a serem exibidos na seção
    color: string // Cor de fundo aplicada aos itens da seção
  ) => (
    <div className={`p-4 rounded-lg shadow-inner bg-gray-50/50`}> {/* Container da seção com leve sombra interna e fundo claro */}
      <h3 className="text-xl font-bold text-center text-gray-800 mb-4 py-2">{title}</h3> {/* Título da seção centralizado */}
      <div className="space-y-3"> {/* Container dos itens. com espaçamento vertical entre eles */}
        {items.map((item, itemIndex) => ( // Itera sobre os itens da seção
          <div key={item.id} className={`relative group rounded-md shadow-sm ${color}`}> {/* Container de cada item. com cor de fundo e sombra leve */}
            <AutoResizingTextarea
              className={`w-full p-3 pr-8 border-none rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-gray-800 bg-transparent`} // Estilização do textarea interno
              value={item.text} // Texto atual do item
              onChange={(e: any) => updateItem(groupIndex, type, itemIndex, e.target.value)} // Atualiza texto ao digitar
              placeholder={`New ${title.toLowerCase()} item...`} // Placeholder com base no título da seção
              disabled={isReadOnly} // Desabilita edição em modo somente leitura
            />
            {!isReadOnly && ( // Botão de remoção exibido apenas quando não está em modo somente leitura
              <Button
                size="icon" // Define botão no formato ícone
                variant="ghost" // Usa estilo ghost (sem fundo sólido)
                className="absolute top-1/2 -translate-y-1/2 right-1 h-7 w-7 p-0 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" // Posiciona o botão à direita e só mostra no hover
                onClick={() => removeItem(groupIndex, type, itemIndex)} // Remove o item atual ao clicar
              >
                <X className="h-4 w-4" /> {/* Ícone X pequeno para remoção */}
              </Button>
            )}
          </div>
        ))}
        {!isReadOnly && ( // Botão de adicionar item na seção. visível apenas em modo edição
          <Button
            variant="ghost" // Estilo ghost. com borda tracejada definida abaixo
            onClick={() => addItem(groupIndex, type)} // Adiciona um novo item à lista ao clicar
            className="w-full h-12 border-dashed border-2 border-gray-400/60 hover:bg-black/5 flex items-center justify-center transition-colors mt-3" // Estilo do botão. com borda pontilhada
          >
            <Plus className="h-6 w-6 text-gray-500" /> {/* Ícone Plus indicando adição */}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-6 bg-white"> {/* Container principal da página. com padding e fundo branco */}
        <Card className="shadow-lg"> {/* Card de introdução explicando a atividade */}
          <CardHeader> {/* Cabeçalho do card */}
            <CardTitle className="text-3xl font-bold text-center text-gray-800">The Product IS - IS NOT - DOES - DOES NOT</CardTitle> {/* Título principal do template */}
          </CardHeader>
          <CardContent className="text-center space-y-4"> {/* Conteúdo explicativo do card. centralizado */}
            <p className="text-lg text-gray-700">
              It is often easier to describe what something is not or does not do. This activity seeks classifications about the product following the four guidelines, specifically asking each positive and negative aspect about the product being or doing something.
            </p> {/* Parágrafo explicando o propósito da atividade */}
            <div className="bg-gray-100 p-6 rounded-lg my-6"> {/* Bloco de destaque com frase chave */}
              <p className="text-xl font-semibold text-gray-800">
                Deciding what NOT to do is AS IMPORTANT as deciding what to do.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left"> {/* Grade com três passos explicativos */}
              <div className="flex items-start space-x-4"> {/* Passo 1 */}
                <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div> {/* Círculo numerado */}
                <p className="text-gray-700">Divide the team into two groups and request that each group fill only the blanks selected in its respective template.</p> {/* Descrição do passo 1 */}
              </div>
              <div className="flex items-start space-x-4"> {/* Passo 2 */}
                <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div> {/* Círculo numerado */}
                <p className="text-gray-700">Ask a person to read a note. Talk about it. Group similar ones into a 'cluster'.</p> {/* Descrição do passo 2 */}
              </div>
              <div className="flex items-start space-x-4"> {/* Passo 3 */}
                <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div> {/* Círculo numerado */}
                <p className="text-gray-700">Go back to step 2, then ask the same for another person in the next group, until all notes are finished.</p> {/* Descrição do passo 3 */}
              </div>
            </div>
          </CardContent>
        </Card>

      <div className="space-y-8"> {/* Container para todos os grupos de cartões abaixo da introdução */}
        {groups.map((group, groupIndex) => ( // Itera sobre todos os grupos para renderizar cada card
          <Card key={group.id} className="bg-white relative shadow-lg border-2 rounded-xl"> {/* Card de um grupo. com borda e sombra */}
            {!isReadOnly && groups.length > 1 && ( // Botão de remover grupo. exibido apenas se houver mais de um grupo e não estiver em modo somente leitura
              <Button
                size="icon" // Botão no formato ícone
                variant="destructive" // Estilo destrutivo para indicar ação de remoção
                className="absolute -top-3 -right-3 h-7 w-7 p-0 z-10" // Posiciona o botão no canto superior direito. fora do card
                onClick={() => removeGroup(groupIndex)} // Remove o grupo atual ao clicar
              >
                <X className="h-4 w-4" /> {/* Ícone X dentro do botão */}
              </Button>
            )}
            <CardHeader> {/* Cabeçalho do card do grupo */}
              <h3 className="text-2xl font-bold text-center tracking-wider text-gray-700">
              The Product IS - IS NOT - DOES - DOES NOT {groups.length > 1 ? `#${groupIndex + 1}` : ''}
              </h3> {/* Título do grupo. com numeração se houver mais de um */}
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Conteúdo do grupo em grade. duas colunas em telas médias */}
              {renderSection(groupIndex, 'IS', 'is', group.is, group.color)} {/* Seção "IS" do grupo atual */}
              {renderSection(groupIndex, 'IS NOT', 'isNot', group.isNot, group.color)} {/* Seção "IS NOT" do grupo atual */}
              {renderSection(groupIndex, 'DOES', 'does', group.does, group.color)} {/* Seção "DOES" do grupo atual */}
              {renderSection(groupIndex, 'DOES NOT', 'doesNot', group.doesNot, group.color)} {/* Seção "DOES NOT" do grupo atual */}
            </CardContent>
          </Card>
        ))}

        {!isReadOnly && ( // Botão para adicionar um novo grupo de cartões. mostrado apenas em modo edição
          <div className="text-center pt-6"> {/* Container centralizado para o botão de adicionar grupo */}
            <Button
              variant="outline" // Botão com estilo contornado
              onClick={addGroup} // Chama função que adiciona um novo grupo
              className="border-dashed border-2 text-gray-600 hover:text-gray-800 hover:border-gray-800 py-6 px-10" // Estilização do botão com borda tracejada
            >
              <Plus className="h-5 w-5 mr-2" /> {/* Ícone Plus com margem à direita */}
              Add Another Card {/* Texto do botão indicando adição de mais um card */}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductIsIsNotTemplate; // Exporta o componente ProductIsIsNotTemplate como exportação padrão
