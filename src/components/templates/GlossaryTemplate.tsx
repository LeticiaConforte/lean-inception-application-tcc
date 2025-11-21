import React, { useState, useRef, useLayoutEffect } from 'react'; // Importa React e hooks necessários
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Importa componentes de cartão
import { Button } from '@/components/ui/button'; // Botão reutilizável
import { Plus, X } from 'lucide-react'; // Ícones de adicionar e remover

interface Term { // Interface que define a estrutura de um termo do glossário
  id: number; // Identificador único
  term: string; // Nome do termo
  definition: string; // Definição do termo
  color: string; // Cor usada no cartão
}

interface GlossaryTemplateProps { // Interface das props recebidas pelo componente pai
  content: any; // Conteúdo inicial vindo do backend ou estado pai
  onContentChange: (content: any) => void; // Função de callback para notificar mudanças
  isReadOnly?: boolean; // Estado que controla se edição é permitida
}

const AutoResizingTextarea = ({ value, onChange, className, placeholder, disabled }: any) => { // Textarea que ajusta altura automaticamente
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Referência ao DOM do textarea

  useLayoutEffect(() => { // Ajusta altura após renderizar
    const textarea = textareaRef.current; // Referência ao textarea
    if (textarea) { // Se existir
      textarea.style.height = 'auto'; // Reseta altura
      textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta baseado no conteúdo
    }
  }, [value]); // Executa sempre que o valor mudar

  return (
    <textarea // Elemento textarea
      ref={textareaRef} // Aplica referência
      value={value} // Valor atual
      onChange={onChange} // Atualiza valor
      className={className} // Classes visuais
      placeholder={placeholder} // Texto de placeholder
      rows={1} // Altura inicial mínima
      disabled={disabled} // Desabilita caso readonly
    />
  );
};

const GlossaryTemplate: React.FC<GlossaryTemplateProps> = ({ content, onContentChange, isReadOnly = false }) => { // Componente principal
  const availableColors = ['bg-yellow-200', 'bg-pink-200', 'bg-green-200', 'bg-blue-200', 'bg-purple-200']; // Paleta de cores
  const defaultColor = 'bg-blue-200'; // Cor padrão

  const [terms, setTerms] = useState<Term[]>( // Estado local dos termos
    (content?.terms || [{ term: 'Term', definition: 'Definition...' }]).map((t: any, index: number) => ({ // Mapeia dados iniciais
      id: t.id || Date.now() + index, // Garante ID único
      term: t.term, // Nome do termo
      definition: t.definition, // Definição
      color: t.color || defaultColor, // Cor padrão se não houver
    }))
  );

  const updateAndNotify = (newTerms: Term[]) => { // Atualiza localmente e notifica componente pai
    setTerms(newTerms); // Atualiza estado
    if (!isReadOnly) { // Só notifica se edição estiver habilitada
      onContentChange({ terms: newTerms }); // Envia atualização para componente pai
    }
  };

  const addTerm = () => { // Adiciona novo termo
    const newTerms = [...terms, { id: Date.now(), term: 'Term', definition: 'Definition...', color: defaultColor }]; // Novo item
    updateAndNotify(newTerms); // Atualiza e notifica
  };

  const updateTerm = (id: number, field: 'term' | 'definition', value: string) => { // Atualiza campo específico de um termo
    const newTerms = terms.map(t => (t.id === id ? { ...t, [field]: value } : t)); // Substitui o termo editado
    updateAndNotify(newTerms); // Atualiza
  };

  const updateTermColor = (id: number, color: string) => { // Atualiza cor do termo
    const newTerms = terms.map(t => (t.id === id ? { ...t, color } : t)); // Atualiza a cor
    updateAndNotify(newTerms); // Atualiza e notifica
  };

  const removeTerm = (id: number) => { // Remove termo pelo ID
    const newTerms = terms.filter(t => t.id !== id); // Remove o selecionado
    updateAndNotify(newTerms); // Atualiza
  };

  return (
    <div className="p-4 space-y-6 bg-white"> {/* Container superior */}
      <Card className="shadow-lg"> {/* Card do título e texto inicial */}
        <CardHeader> {/* Cabeçalho */}
          <CardTitle className="text-3xl font-bold text-center text-gray-800">Glossary</CardTitle> {/* Título */}
        </CardHeader>
        <CardContent className="text-center"> {/* Corpo do texto */}
          <p className="text-lg text-gray-700"> {/* Texto explicativo */}
            Take advantage of the Lean Inception to validate, adjust and give visibility to the vocabulary of the domain. It is very important that everyone involved - business, technology and user representatives - communicate and register the generated artifacts with a common language. Make sure to check the understanding of each word in the domain, and place it in the Glossary, visible to everyone.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6"> {/* Grid dos cartões */}
        {terms.map((term) => ( // Itera cada termo
          <Card key={term.id} className={`shadow-lg relative group flex flex-col rounded-lg overflow-hidden border ${term.color}`}> {/* Card do termo */}
            {!isReadOnly && ( // Botão de remover, só aparece se editável
              <Button
                  size="icon" // Botão icônico
                  variant="ghost" // Estilo discreto
                  className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-gray-700 hover:text-red-600" // Hover + animação
                  onClick={() => removeTerm(term.id)}> {/* Remove termo */}
                  <X className="h-4 w-4" /> {/* Ícone X */}
              </Button>
            )}
            
            <div className="p-5 flex-grow flex flex-col"> {/* Área interna do card */}
                <input
                    className="font-bold text-xl bg-transparent focus:outline-none border-b-2 border-gray-400/50 pb-2 mb-3 placeholder-gray-700/80" // Input de termo
                    placeholder="Term" // Placeholder
                    value={term.term} // Valor atual
                    onChange={(e) => updateTerm(term.id, 'term', e.target.value)} // Atualiza termo
                    disabled={isReadOnly} // Desabilita se readonly
                />
                <AutoResizingTextarea
                    className="flex-grow bg-transparent focus:outline-none resize-none mt-1 text-gray-700 placeholder-gray-600/90" // Textarea de definição
                    placeholder="Definition..." // Placeholder
                    value={term.definition} // Valor
                    onChange={(e: any) => updateTerm(term.id, 'definition', e.target.value)} // Atualiza
                    disabled={isReadOnly} // Desabilita em readonly
                />
            </div>

            {!isReadOnly && ( // Seleção de cores aparece só em modo edição
              <div className="p-3 flex justify-center items-end space-x-2 bg-black/5"> {/* Fundo da paleta */}
                  {availableColors.map(color => ( // Itera cores
                      <button
                          key={color} // Chave
                          onClick={() => updateTermColor(term.id, color)} // Atualiza cor
                          className={`w-6 h-6 rounded-full cursor-pointer transition-transform transform hover:scale-110 ${color} ${term.color === color ? 'ring-2 ring-offset-1 ring-black' : 'ring-1 ring-gray-400'}`} // Estilo
                          aria-label={`Change color to ${color}`} // Acessibilidade
                          disabled={isReadOnly} // Bloqueia
                      />
                  ))}
              </div>
            )}
        </Card>
        ))}

        {!isReadOnly && ( // Card de adicionar novo termo
          <Button
            variant="outline" // Estilo
            onClick={addTerm} // Adiciona novo termo
            className="w-full h-full min-h-[240px] border-dashed border-2 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors" // Estilo visual
          >
            <Plus className="h-10 w-10 text-gray-400" /> {/* Ícone de adicionar */}
          </Button>
        )}
      </div>
    </div>
  );
};

export default GlossaryTemplate; // Exporta componente para uso externo