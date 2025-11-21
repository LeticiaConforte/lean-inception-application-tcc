import React, { useState, useRef, useLayoutEffect } from 'react'; // Importa React e os hooks useState, useRef e useLayoutEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importa componentes de cartão reutilizáveis da biblioteca local
import { Button } from '@/components/ui/button'; // Importa componente de botão reutilizável
import { Plus, X } from 'lucide-react'; // Importa ícones Plus (adicionar) e X (remover) da biblioteca lucide-react

interface Vision { // Interface que define a estrutura de uma visão de produto
  id: number; // Identificador único da visão
  for: string; // Campo que descreve "For" (para quem é o produto. público alvo)
  whose: string; // Campo que descreve "whose" (qual problema ou necessidade essa pessoa tem)
  the: string; // Campo que descreve "the" (nome do produto)
  isA: string; // Campo que descreve "is a" (categoria do produto)
  that: string; // Campo que descreve "that" (benefício chave do produto)
  differentFrom: string; // Campo que descreve "different from" (quem é a concorrência ou alternativa)
  ourProduct: string; // Campo que descreve "our product" (diferencial do produto em relação à concorrência)
  color: string; // Cor associada a esta visão. usada para destacar visualmente
}

interface ProductVisionTemplateProps { // Interface que define as props do componente ProductVisionTemplate
  content: any; // Conteúdo inicial vindo do componente pai. aqui tipado como any para flexibilidade
  onContentChange: (content: any) => void; // Função callback para notificar o pai quando o conteúdo mudar
  isReadOnly?: boolean; // Indica se o template está em modo somente leitura. opcional
}

const AutoResizingTextarea = ({ value, onChange, className, placeholder, disabled }: any) => { // Componente textarea que ajusta automaticamente sua altura
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Cria referência para o elemento textarea no DOM

  useLayoutEffect(() => { // Hook executado após o layout ser calculado
    const textarea = textareaRef.current; // Obtém o elemento textarea atual
    if (textarea) { // Verifica se a referência existe
      textarea.style.height = 'auto'; // Reseta a altura para permitir recálculo
      textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta a altura com base na altura do conteúdo
    }
  }, [value]); // Reexecuta o efeito sempre que o valor do textarea mudar

  return (
    <textarea
      ref={textareaRef} // Associa a referência ao elemento textarea
      value={value} // Valor exibido no campo
      onChange={onChange} // Função chamada sempre que o conteúdo do textarea for alterado
      className={className} // Classes CSS passadas via props
      placeholder={placeholder} // Texto de placeholder exibido quando o campo está vazio
      rows={1} // Define altura mínima de uma linha
      disabled={disabled} // Desabilita o campo quando estiver em modo somente leitura
    />
  );
};

const ProductVisionTemplate: React.FC<ProductVisionTemplateProps> = ({ content, onContentChange, isReadOnly = false }) => { // Componente principal que renderiza o template de visão de produto
  const colors = ['bg-yellow-200', 'bg-pink-200', 'bg-blue-200', 'bg-green-200']; // Paleta de cores usadas para diferenciar visualmente cada visão

  const [visions, setVisions] = useState<Vision[]>( // Estado local contendo a lista de visões de produto
    (content?.visions || [{ // Usa as visões vindas de content ou inicializa com uma visão padrão
      id: Date.now(), // Cria id inicial com base no timestamp atual
      for: '', // Inicializa campo "for" vazio
      whose: '', // Inicializa campo "whose" vazio
      the: '', // Inicializa campo "the" vazio
      isA: '', // Inicializa campo "isA" vazio
      that: '', // Inicializa campo "that" vazio
      differentFrom: '', // Inicializa campo "differentFrom" vazio
      ourProduct: '' // Inicializa campo "ourProduct" vazio
    }]).map((vision: any, index: number) => ({ // Mapeia as visões para garantir a cor padrão
      ...vision, // Mantém todas as propriedades existentes da visão
      color: vision.color || colors[index % colors.length] // Usa a cor existente ou uma cor da paleta com base no índice
    }))
  );

  const updateAndNotify = (newVisions: Vision[]) => { // Função auxiliar para atualizar o estado e notificar o componente pai
    setVisions(newVisions); // Atualiza o estado local com a nova lista de visões
    if (!isReadOnly) { // Só notifica o componente pai se não estiver em modo somente leitura
      onContentChange({ visions: newVisions }); // Chama o callback passando o novo conteúdo
    }
  };

  const addVision = () => { // Adiciona uma nova visão à lista
    const newVisions = [...visions, { // Cria uma nova lista incluindo mais uma visão
      id: Date.now(), // Gera novo id baseado no timestamp
      for: '', // Campo "for" começa vazio
      whose: '', // Campo "whose" começa vazio
      the: '', // Campo "the" começa vazio
      isA: '', // Campo "isA" começa vazio
      that: '', // Campo "that" começa vazio
      differentFrom: '', // Campo "differentFrom" começa vazio
      ourProduct: '', // Campo "ourProduct" começa vazio
      color: colors[visions.length % colors.length] // Define cor com base na quantidade atual de visões. de forma cíclica
    }];
    updateAndNotify(newVisions); // Atualiza o estado e notifica o pai
  };

  const updateVision = (index: number, field: keyof Vision, value: string) => { // Atualiza um campo específico de uma visão
    const newVisions = [...visions]; // Cria cópia rasa da lista de visões
    newVisions[index] = { ...newVisions[index], [field]: value }; // Atualiza apenas o campo indicado na visão correspondente
    updateAndNotify(newVisions); // Atualiza o estado e notifica
  };

  const removeVision = (index: number) => { // Remove uma visão com base no índice
    if (visions.length > 1) { // Garante que pelo menos uma visão continue existindo
      const newVisions = visions.filter((_, i) => i !== index); // Filtra a visão que deve ser removida
      updateAndNotify(newVisions); // Atualiza estado e notifica o componente pai
    }
  };

  return (
    <div className="p-4 space-y-6 bg-white"> {/* Container principal com padding. espaçamento vertical e fundo branco */}
      <Card className="shadow-lg"> {/* Card introdutório com explicação da Product Vision */}
        <CardHeader> {/* Cabeçalho do card */}
          <CardTitle className="text-3xl font-bold text-center text-gray-800">Product Vision</CardTitle> {/* Título principal do template */}
        </CardHeader>
        <CardContent className="text-center space-y-4"> {/* Conteúdo central com texto explicativo e instruções */}
          <p className="text-lg text-gray-700"> {/* Parágrafo que contextualiza a importância da visão de produto */}
            Somewhere between the idea and the launch of the MVP, the product vision helps you to walk the initial path. It defines the essence of your business value and should reflect a clear and compelling message to your customers. This activity will help you to define the product vision in a collaborative way.
          </p>
          <div className="bg-gray-100 p-6 rounded-lg my-6"> {/* Bloco de destaque com uma frase importante sobre visão */}
            <p className="text-xl font-semibold text-gray-800">
              With a clear view of the product, you can determine how the initial "pieces" of the business will come together.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left"> {/* Grade com três instruções em colunas */}
            <div className="flex items-start space-x-4"> {/* Passo 1 da atividade */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div> {/* Círculo numerado */}
              <p className="text-gray-700">Divide the team into three groups and request that each group fill only the blanks selected in its respective template.</p> {/* Descrição do passo 1 */}
            </div>
            <div className="flex items-start space-x-4"> {/* Passo 2 da atividade */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div> {/* Círculo numerado */}
              <p className="text-gray-700">Ask each group to read their respective incomplete sentence and copy their post-its to the single template.</p> {/* Descrição do passo 2 */}
            </div>
            <div className="flex items-start space-x-4"> {/* Passo 3 da atividade */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div> {/* Círculo numerado */}
              <p className="text-gray-700">Ask the team to consolidate a homogeneous sentence, copying or rewriting the previous notes, as needed.</p> {/* Descrição do passo 3 */}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8"> {/* Container para a lista de visões renderizadas abaixo do card introdutório */}
        {visions.map((vision, visionIndex) => ( // Itera sobre cada visão para renderizar um card correspondente
          <Card key={vision.id} className="bg-white relative shadow-lg border-t-4" style={{borderColor: vision.color}}> {/* Card individual de cada visão com borda superior colorida */}
            {!isReadOnly && visions.length > 1 && ( // Botão de remoção da visão. exibido apenas se houver mais de uma e não estiver em modo somente leitura
              <Button
                size="icon" // Define botão no formato de ícone
                variant="ghost" // Estilo ghost. sem fundo sólido
                className="absolute top-2 right-2 h-8 w-8 p-0 z-10 text-gray-500 hover:text-red-600" // Posiciona o botão no canto superior direito do card
                onClick={() => removeVision(visionIndex)} // Chama a função de remover passando o índice da visão
              >
                <X className="h-5 w-5" /> {/* Ícone X dentro do botão para indicar remoção */}
              </Button>
            )}
            <CardContent className="p-8"> {/* Conteúdo interno do card da visão */}
              <h3 className="text-2xl font-bold text-center mb-8 tracking-wider text-gray-700">
                THE PRODUCT VISION {visions.length > 1 ? `#${visionIndex + 1}` : ''} {/* Título com numeração opcional caso haja múltiplas visões */}
              </h3>
              
              <div className="space-y-8 max-w-3xl mx-auto text-lg"> {/* Container interno para os campos da frase de visão. centralizado e com espaçamento vertical */}
                <div className="grid grid-cols-3 items-center"> {/* Linha do campo "For" */}
                  <span className="font-semibold">For:</span> {/* Rótulo do campo */}
                  <AutoResizingTextarea
                    className={`col-span-2 ${vision.color} p-3 rounded-md text-center focus:ring-2 focus:ring-offset-2 focus:ring-gray-800`} // Estilo do textarea com fundo colorido
                    value={vision.for} // Valor atual do campo "for"
                    onChange={(e: any) => updateVision(visionIndex, 'for', e.target.value)} // Atualiza a visão ao alterar o texto
                    placeholder="target audience" // Placeholder sugerindo o conteúdo do campo
                    disabled={isReadOnly} // Desabilita edição em modo somente leitura
                  />
                </div>

                <div className="grid grid-cols-3 items-center"> {/* Linha do campo "whose" */}
                  <span className="font-semibold">whose:</span> {/* Rótulo do campo */}
                  <AutoResizingTextarea
                    className={`col-span-2 ${vision.color} p-3 rounded-md text-center focus:ring-2 focus:ring-offset-2 focus:ring-gray-800`} // Estilo do textarea
                    value={vision.whose} // Valor atual de "whose"
                    onChange={(e: any) => updateVision(visionIndex, 'whose', e.target.value)} // Atualiza o campo "whose"
                    placeholder="problem statement" // Placeholder indicando que é a descrição do problema
                    disabled={isReadOnly} // Desabilita edição se estiver somente leitura
                  />
                </div>

                <div className="grid grid-cols-5 items-center gap-4"> {/* Linha com dois campos: "the" e "is a" */}
                  <span className="font-semibold text-right">the:</span> {/* Rótulo alinhado à direita para o campo "the" */}
                  <AutoResizingTextarea
                    className={`col-span-2 ${vision.color} p-3 rounded-md text-center focus:ring-2 focus:ring-offset-2 focus:ring-gray-800`} // Estilo do textarea
                    value={vision.the} // Valor atual de "the"
                    onChange={(e: any) => updateVision(visionIndex, 'the', e.target.value)} // Atualiza o campo "the"
                    placeholder="product name" // Placeholder indicando nome do produto
                    disabled={isReadOnly} // Desabilita edição em modo somente leitura
                  />
                  <span className="font-semibold text-right">is a:</span> {/* Rótulo para o campo "is a" */}
                  <AutoResizingTextarea
                    className={`col-span-2 ${vision.color} p-3 rounded-md text-center focus:ring-2 focus:ring-offset-2 focus:ring-gray-800`} // Estilo do textarea
                    value={vision.isA} // Valor atual de "isA"
                    onChange={(e: any) => updateVision(visionIndex, 'isA', e.target.value)} // Atualiza o campo "isA"
                    placeholder="product category" // Placeholder indicando a categoria do produto
                    disabled={isReadOnly} // Desabilita edição quando for somente leitura
                  />
                </div>

                <div className="grid grid-cols-3 items-center"> {/* Linha do campo "that" */}
                  <span className="font-semibold">that:</span> {/* Rótulo do campo */}
                  <AutoResizingTextarea
                    className={`col-span-2 ${vision.color} p-3 rounded-md text-center focus:ring-2 focus:ring-offset-2 focus:ring-gray-800`} // Estilo visual do textarea
                    value={vision.that} // Valor atual de "that"
                    onChange={(e: any) => updateVision(visionIndex, 'that', e.target.value)} // Atualiza o campo "that"
                    placeholder="key benefit" // Placeholder para o benefício chave
                    disabled={isReadOnly} // Desabilita edição se estiver somente leitura
                  />
                </div>

                <div className="grid grid-cols-3 items-center"> {/* Linha do campo "Different from" */}
                  <span className="font-semibold">Different from:</span> {/* Rótulo do campo */}
                  <AutoResizingTextarea
                    className={`col-span-2 ${vision.color} p-3 rounded-md text-center focus:ring-2 focus:ring-offset-2 focus:ring-gray-800`} // Estilo do textarea
                    value={vision.differentFrom} // Valor atual de "differentFrom"
                    onChange={(e: any) => updateVision(visionIndex, 'differentFrom', e.target.value)} // Atualiza o campo "differentFrom"
                    placeholder="competition" // Placeholder que indica tratar da concorrência
                    disabled={isReadOnly} // Desabilita edição em modo somente leitura
                  />
                </div>

                <div className="grid grid-cols-3 items-center"> {/* Linha do campo "our product" */}
                  <span className="font-semibold">our product:</span> {/* Rótulo do campo */}
                  <AutoResizingTextarea
                    className={`col-span-2 ${vision.color} p-3 rounded-md text-center focus:ring-2 focus:ring-offset-2 focus:ring-gray-800`} // Estilo do textarea
                    value={vision.ourProduct} // Valor atual de "ourProduct"
                    onChange={(e: any) => updateVision(visionIndex, 'ourProduct', e.target.value)} // Atualiza o campo "ourProduct"
                    placeholder="differentiator" // Placeholder indicando que é o diferencial do produto
                    disabled={isReadOnly} // Desabilita edição se estiver em modo somente leitura
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {!isReadOnly && ( // Se não estiver em modo somente leitura. exibe botão para adicionar nova visão de produto
          <div className="text-center pt-6"> {/* Container centralizado para o botão de adicionar visão */}
            <Button
              variant="outline" // Botão com estilo contornado
              onClick={addVision} // Chama a função que adiciona uma nova visão
              className="border-dashed border-2 text-gray-600 hover:text-gray-800 hover:border-gray-800" // Estilização com borda pontilhada e efeito de hover
            >
              <Plus className="h-5 w-5 mr-2" /> {/* Ícone Plus ao lado esquerdo do texto */}
              Add Another Product Vision {/* Texto explicando a ação do botão */}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductVisionTemplate; // Exporta o componente ProductVisionTemplate como exportação padrão
