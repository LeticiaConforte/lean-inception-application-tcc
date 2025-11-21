import React, { useState, useRef, useLayoutEffect } from 'react'; // Importa React e os hooks useState, useRef e useLayoutEffect
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importa componentes de cartão reutilizáveis
import { Button } from '@/components/ui/button'; // Importa o componente de botão
import { Plus, X } from 'lucide-react'; // Importa ícones de adicionar (Plus) e remover (X)

interface CanvasItem { // Interface que define um item genérico do canvas
  id: number; // Identificador único do item
  text: string; // Texto associado ao item
}

interface MVPCanvas { // Interface que define a estrutura de um MVP Canvas
  id: number; // Identificador único do canvas
  color: string; // Cor usada como destaque no canvas
  canvasData: { // Objeto que agrupa os blocos de conteúdo do canvas
    personas: CanvasItem[]; // Lista de itens do bloco "Segmented Personas"
    proposal: CanvasItem[]; // Lista de itens do bloco "MVP Proposal"
    features: CanvasItem[]; // Lista de itens do bloco "Features"
    result: CanvasItem[]; // Lista de itens do bloco "Expected Result"
    journeys: CanvasItem[]; // Lista de itens do bloco "Journeys"
    costSchedule: CanvasItem[]; // Lista de itens do bloco "Cost & Schedule"
    metricsValidate: CanvasItem[]; // Lista de itens do bloco "Metrics to Validate"
  };
}

interface MVPCanvasTemplateProps { // Interface das propriedades recebidas pelo componente principal
  content: any; // Conteúdo externo recebido, com estrutura flexível
  onContentChange: (content: any) => void; // Callback para enviar alterações ao componente pai
  isReadOnly?: boolean; // Indica se o template está em modo somente leitura
}

const AutoResizingTextarea = ({ value, onChange, className, placeholder, disabled }: any) => { // Componente textarea que ajusta altura automaticamente
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Referência ao elemento textarea no DOM

  useLayoutEffect(() => { // Efeito que roda após o layout ser calculado
    const textarea = textareaRef.current; // Obtém o elemento referenciado
    if (textarea) { // Verifica se o textarea existe
      textarea.style.height = 'auto'; // Reseta a altura para recálculo
      textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta a altura de acordo com o conteúdo
    }
  }, [value]); // Reexecuta o efeito sempre que o valor do textarea mudar

  return (
    <textarea
      ref={textareaRef} // Associa a referência ao elemento textarea
      value={value} // Valor atual exibido no textarea
      onChange={onChange} // Função chamada ao modificar o conteúdo
      className={className} // Classes CSS passadas por props
      placeholder={placeholder} // Texto placeholder quando vazio
      rows={1} // Altura mínima de uma linha
      disabled={disabled} // Desabilita edição quando necessário
    />
  );
};


const MVPCanvasTemplate: React.FC<MVPCanvasTemplateProps> = ({ content, onContentChange, isReadOnly = false }) => { // Componente principal do MVP Canvas
  const colors = ['bg-yellow-200/50', 'bg-pink-200/50', 'bg-blue-200/50', 'bg-green-200/50']; // Lista de cores semitransparentes para canva(s)

  const [mvpCanvases, setMvpCanvases] = useState<MVPCanvas[]>( // Estado local que guarda todos os MVP canvases
    (content?.mvpCanvases || [{ // Usa conteúdo vindo de fora ou cria um canvas padrão
      id: Date.now(), // Gera um id baseado no timestamp atual
      canvasData: { // Inicializa todos os blocos vazios
        personas: [], proposal: [], features: [],
        result: [], journeys: [], costSchedule: [], metricsValidate: []
      }
    }]).map((canvas: any, index: number) => ({ // Faz o mapeamento para garantir cor e estrutura
      ...canvas, // Copia as propriedades existentes do canvas
      color: canvas.color || colors[index % colors.length] // Define uma cor, usando a lista ciclicamente
    }))
  );

  const updateAndNotify = (newCanvases: MVPCanvas[]) => { // Função auxiliar para atualizar estado e notificar o componente pai
    setMvpCanvases(newCanvases); // Atualiza o estado local com a nova lista de canvases
    if (!isReadOnly) { // Só notifica se não estiver em modo somente leitura
      onContentChange({ mvpCanvases: newCanvases }); // Chama o callback com o novo conteúdo
    }
  };

  const addMVPCanvas = () => { // Adiciona um novo MVP Canvas
    if (isReadOnly) return; // Impede alteração em modo somente leitura
    const newCanvases = [...mvpCanvases, { // Cria um novo array de canvases
      id: Date.now(), // Gera um novo id para o canvas
      color: colors[mvpCanvases.length % colors.length], // Escolhe cor baseada na quantidade atual
      canvasData: { personas: [], proposal: [], features: [], result: [], journeys: [], costSchedule: [], metricsValidate: [] } // Inicializa blocos vazios
    }];
    updateAndNotify(newCanvases); // Atualiza estado e notifica
  };

  const removeMVPCanvas = (canvasIndex: number) => { // Remove um canvas específico pelo índice
    if (isReadOnly || mvpCanvases.length <= 1) return; // Não permite remover em modo leitura ou se houver apenas um canvas
    const newCanvases = mvpCanvases.filter((_, i) => i !== canvasIndex); // Filtra para remover o índice desejado
    updateAndNotify(newCanvases); // Atualiza e notifica
  };

  const addItem = (canvasIndex: number, section: keyof MVPCanvas['canvasData']) => { // Adiciona um item a uma seção específica de um canvas
    if (isReadOnly) return; // Bloqueia em modo somente leitura
    const newCanvases = [...mvpCanvases]; // Cria cópia do array de canvases
    newCanvases[canvasIndex].canvasData[section].push({ id: Date.now(), text: '' }); // Adiciona um novo item vazio à seção escolhida
    updateAndNotify(newCanvases); // Atualiza e notifica
  };

  const updateItem = (canvasIndex: number, section: keyof MVPCanvas['canvasData'], index: number, text: string) => { // Atualiza o texto de um item específico
    const newCanvases = [...mvpCanvases]; // Copia o array atual
    newCanvases[canvasIndex].canvasData[section][index].text = text; // Modifica o texto do item em questão
    updateAndNotify(newCanvases); // Atualiza e notifica
  };

  const removeItem = (canvasIndex: number, section: keyof MVPCanvas['canvasData'], index: number) => { // Remove um item de uma seção
    if (isReadOnly) return; // Impede remoção se for somente leitura
    const newCanvases = [...mvpCanvases]; // Copia a lista de canvases
    newCanvases[canvasIndex].canvasData[section].splice(index, 1); // Remove o item pelo índice
    updateAndNotify(newCanvases); // Atualiza e notifica
  };

  const renderSection = ( // Função auxiliar para renderizar uma seção do MVP Canvas
    canvasIndex: number, // Índice do canvas atual
    title: string, // Título da seção
    section: keyof MVPCanvas['canvasData'], // Nome da seção dentro de canvasData
    className: string = "", // Classes extras para controle de grid e layout
    noteColor: string // Cor de fundo aplicada às notas da seção
  ) => (
    <div className={`border-2 border-gray-800 p-4 space-y-3 flex flex-col ${className}`}> {/* Container da seção com borda e padding */}
      <h3 className="font-bold text-center text-sm uppercase tracking-wider text-gray-700">{title}</h3> {/* Título da seção em caixa alta */}
      <div className="space-y-2 flex-grow"> {/* Container para as notas, com espaço vertical entre elas */}
        {mvpCanvases[canvasIndex].canvasData[section].map((item, index) => ( // Itera pelos itens da seção
          <div key={item.id} className="relative group"> {/* Wrapper para cada nota, com grupo para hover */}
            <AutoResizingTextarea
              className={`w-full p-2 border-none outline-none resize-none rounded-md text-sm ${noteColor} focus:ring-2 focus:ring-gray-800`} // Estilo visual da nota
              value={item.text} // Texto atual da nota
              onChange={(e: any) => updateItem(canvasIndex, section, index, e.target.value)} // Atualiza texto ao digitar
              placeholder="Enter item..." // Texto de placeholder
              disabled={isReadOnly} // Desabilita em modo somente leitura
            />
            {!isReadOnly && ( // Botão de remover nota, só aparece se for editável
              <Button
                size="icon" // Tamanho ícone
                variant="destructive" // Estilo destrutivo para remoção
                className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10" // Mostra no hover da nota
                onClick={() => removeItem(canvasIndex, section, index)} // Remove item da seção
              >
                <X className="h-4 w-4" /> {/* Ícone X dentro do botão */}
              </Button>
            )}
          </div>
        ))}
      </div>
      {!isReadOnly && ( // Botão para adicionar notas, somente quando não for somente leitura
        <Button
          variant="outline" // Estilo contornado
          onClick={() => addItem(canvasIndex, section)} // Adiciona novo item na seção correspondente
          className="w-full h-10 border-dashed border-gray-400 text-xs hover:bg-gray-100 transition-colors" // Estilo com borda tracejada
        >
          <Plus className="h-4 w-4" /> {/* Ícone de adicionar */}
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-4 space-y-6 bg-white"> {/* Container principal do template MVP Canvas */}
      <Card className="shadow-lg"> {/* Card de introdução e explicação do MVP Canvas */}
        <CardHeader> {/* Cabeçalho do card de introdução */}
          <CardTitle className="text-3xl font-bold text-center text-gray-800">MVP Canvas</CardTitle> {/* Título principal */}
        </CardHeader>
        <CardContent className="text-center space-y-4"> {/* Conteúdo do card de introdução */}
          <p className="text-lg text-gray-700"> {/* Parágrafo explicando o conceito de MVP Canvas */}
            The MVP Canvas is a visual chart that helps the team to align and define the MVP, the simplest version of the product that can be made available to the business (minimum product) and that can be effectively used and validated by the end user (viable product).
          </p>
          <div className="bg-gray-100 p-6 rounded-lg my-6"> {/* Caixa de destaque com mensagem de apoio */}
            <p className="text-xl font-semibold text-gray-800">
              The team has already discussed what makes up the MVP and has already talked about what is expected of it, the time has come to summarize everything.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left"> {/* Lista de passos para usar o MVP Canvas */}
            <div className="flex items-start space-x-4"> {/* Passo 1 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div> {/* Círculo numerado */}
              <p className="text-gray-700">Divide the team into two groups and ask each group to complete the MVP canvas in their respective template.</p> {/* Descrição do passo */}
            </div>
            <div className="flex items-start space-x-4"> {/* Passo 2 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div> {/* Círculo numerado */}
              <p className="text-gray-700">Ask each group to present their Canvas MVP.</p> {/* Descrição do passo */}
            </div>
            <div className="flex items-start space-x-4"> {/* Passo 3 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div> {/* Círculo numerado */}
              <p className="text-gray-700">Ask the team to consolidate the seven blocks of the MVP canvas, using and changing the previous notes as needed.</p> {/* Descrição do passo */}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-12"> {/* Container para todos os MVP canvases criados */}
        {mvpCanvases.map((canvas, canvasIndex) => ( // Itera sobre cada canvas existente
          <Card key={canvas.id} className="relative p-6 border-2 rounded-xl shadow-lg"> {/* Card que envolve cada MVP Canvas */}
            {mvpCanvases.length > 1 && !isReadOnly && ( // Botão para remover o canvas, se houver mais de um e for editável
              <Button
                size="icon" // Botão em formato de ícone
                variant="destructive" // Estilo destrutivo para remoção
                className="absolute top-3 right-3 h-7 w-7 p-0 z-10" // Posicionamento no canto superior direito
                onClick={() => removeMVPCanvas(canvasIndex)} // Remove o canvas atual
              >
                <X className="h-4 w-4" /> {/* Ícone X dentro do botão */}
              </Button>
            )}
            
            <div className="max-w-7xl mx-auto"> {/* Limita a largura máxima do conteúdo do canvas */}
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-800 tracking-wider"> {/* Título do canvas individual */}
                MVP CANVAS {mvpCanvases.length > 1 ? `#${canvasIndex + 1}` : ''} {/* Adiciona numeração quando há mais de um canvas */}
              </h2>
              
              <div className="grid grid-cols-7 gap-0 border-4 border-gray-800 rounded-xl overflow-hidden bg-gray-50"> {/* Grade principal do layout do canvas */}
                {renderSection(canvasIndex, 'Segmented Personas', 'personas', 'col-span-2', canvas.color)} {/* Bloco de personas segmentadas */}
                {renderSection(canvasIndex, 'MVP Proposal', 'proposal', 'col-span-3', canvas.color)} {/* Bloco da proposta do MVP */}
                {renderSection(canvasIndex, 'Expected Result', 'result', 'col-span-2', canvas.color)} {/* Bloco de resultados esperados */}
                {renderSection(canvasIndex, 'Features', 'features', 'col-span-7', canvas.color)} {/* Bloco de funcionalidades do MVP */}
                {renderSection(canvasIndex, 'Journeys', 'journeys', 'col-span-2', canvas.color)} {/* Bloco de jornadas */}
                {renderSection(canvasIndex, 'Cost & Schedule', 'costSchedule', 'col-span-3', canvas.color)} {/* Bloco de custo e cronograma */}
                {renderSection(canvasIndex, 'Metrics to Validate', 'metricsValidate', 'col-span-2', canvas.color)} {/* Bloco de métricas de validação */}
              </div>

              <div className="mt-6 text-center text-sm text-gray-600 italic"> {/* Frase de apoio ao final do canvas */}
                "Do not waste time, money and effort creating the wrong product. Validate your idea and build your MVP!"
              </div>
            </div>
          </Card>
        ))}
        
        {!isReadOnly && ( // Botão para adicionar um novo MVP Canvas, visível apenas se edição estiver habilitada
          <div className="text-center mt-8"> {/* Centraliza o botão de adicionar canvas */}
            <Button
              variant="outline" // Estilo do botão
              onClick={addMVPCanvas} // Chama função que adiciona um novo canvas
              className="border-dashed border-2 py-8 px-12 text-lg text-gray-600 hover:text-gray-800 hover:border-gray-800 transition-all" // Estilo com borda tracejada e hover
            >
              <Plus className="h-6 w-6 mr-3" /> {/* Ícone de adicionar com margem à direita */}
              Add Another MVP Canvas {/* Texto do botão */}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MVPCanvasTemplate; // Exporta o componente MVPCanvasTemplate como padrão
