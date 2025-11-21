import React, { useState, useRef, useLayoutEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Upload } from 'lucide-react';
import { compressAndConvertToBase64 } from '@/utils/imageUtils';

interface Persona {
  id: number;
  name: string;
  profile: string;
  behavior: string;
  needs: string;
  photo?: string | null;
}

interface PersonasTemplateProps {
  content: { personas: Persona[] };
  onContentChange: (newContent: { personas: Persona[] }) => void;
  isReadOnly?: boolean;
}

interface AutoResizingTextareaProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className: string;
  placeholder: string;
  disabled: boolean;
}

const AutoResizingTextarea: React.FC<AutoResizingTextareaProps> = ({ value, onChange, className, placeholder, disabled }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
      rows={1}
      disabled={disabled}
    />
  );
};

const PersonasTemplate: React.FC<PersonasTemplateProps> = ({ content, onContentChange, isReadOnly = false }) => {
  const [personas, setPersonas] = useState<Persona[]>(content?.personas || []);

  const updateAndNotify = (newPersonas: Persona[]) => {
    setPersonas(newPersonas);
    if (!isReadOnly) {
      onContentChange({ personas: newPersonas });
    }
  };

  const addPersona = () => {
    const newPersonas = [...personas, {
      id: Date.now(),
      name: 'New Persona',
      profile: '',
      behavior: '',
      needs: '',
      photo: null
    }];
    updateAndNotify(newPersonas);
  };

  const updatePersona = (id: number, field: keyof Persona, value: string) => {
    const newPersonas = personas.map((p: Persona) => p.id === id ? { ...p, [field]: value } : p);
    updateAndNotify(newPersonas);
  };

  const removePersona = (id: number) => {
    const newPersonas = personas.filter((p: Persona) => p.id !== id);
    updateAndNotify(newPersonas);
  };

  const handlePhotoUpload = async (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = event.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressAndConvertToBase64(file, 400, 400, 0.8);
        const newPersonas = personas.map((p: Persona) => p.id === id ? { ...p, photo: compressedBase64 } : p);
        updateAndNotify(newPersonas);
      } catch (error) {
        console.error('Failed to compress image:', error);
      }
    }
  };

  return (
    <div className="p-4 space-y-6 bg-white"> {/* Container principal com padding, espaçamento vertical e fundo branco */}
      <Card className="shadow-lg"> {/* Card de introdução da seção de Personas */}
        <CardHeader> {/* Cabeçalho do card */}
          <CardTitle className="text-3xl font-bold text-center text-gray-800">Personas</CardTitle> {/* Título principal da seção */}
        </CardHeader>
        <CardContent className="text-center space-y-4"> {/* Conteúdo do card, centralizado e com espaçamento vertical */}
          <p className="text-lg text-gray-700"> {/* Parágrafo explicando o objetivo das personas */}
            To effectively identify the features of a product, it is important to keep users and their goals in mind. A persona creates a realistic representation of users, helping the team to describe features from the point of view of those who will interact with the final product.
          </p>
          <div className="bg-gray-100 p-6 rounded-lg my-6"> {/* Bloco de destaque com mensagem explicativa */}
            <p className="text-xl font-semibold text-gray-800">
              A persona represents a user of the product, describing not only his/her role, but also characteristics and needs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left"> {/* Grade com três passos para construção das personas */}
            <div className="flex items-start space-x-4"> {/* Passo 1 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div> {/* Círculo numerado */}
              <p className="text-gray-700">Divide the team into three groups and ask each to describe ONE persona.</p> {/* Descrição do primeiro passo */}
            </div>
            <div className="flex items-start space-x-4"> {/* Passo 2 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div> {/* Círculo numerado */}
              <p className="text-gray-700">Each group presents its persona to the entire team.</p> {/* Descrição do segundo passo */}
            </div>
            <div className="flex items-start space-x-4"> {/* Passo 3 */}
              <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div> {/* Círculo numerado */}
              <p className="text-gray-700">Optionally, make more rounds to describe other personas. After each round, group them by similarity.</p> {/* Descrição do terceiro passo */}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-6"> {/* Grade responsiva para listar os cards de personas */}
        {personas.map((persona: Persona) => ( // Itera sobre a lista de personas
          <Card key={persona.id} className="shadow-lg relative group flex flex-col space-y-4 p-6 bg-gray-50 rounded-xl"> {/* Card individual da persona */}
            {!isReadOnly && ( /* Botão de remover aparece apenas se não estiver em modo somente leitura */
              <Button
                variant="destructive" // Estilo de botão destrutivo
                size="icon" // Botão em formato de ícone
                onClick={() => removePersona(persona.id)} // Remove a persona correspondente
                className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" // Aparece apenas ao passar o mouse no card
              >
                <X className="h-4 w-4" /> {/* Ícone X dentro do botão */}
              </Button>
            )}
            <div className="flex flex-col items-center space-y-4"> {/* Área superior com foto e nome da persona */}
              <div className={`relative w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md ${isReadOnly ? 'cursor-not-allowed' : ''}`}> {/* Container circular da foto */}
                {persona.photo ? ( /* Se houver foto, exibe a imagem */
                  <img src={persona.photo} alt={persona.name} className="w-full h-full object-cover" /> /* Imagem ocupa todo o círculo */
                ) : ( /* Caso não haja foto */
                  <Upload className="h-10 w-10 text-gray-400" /> /* Ícone de upload como placeholder */
                )}
                {!isReadOnly && ( /* Input de upload só aparece se não estiver em modo somente leitura */
                  <Input 
                    type="file" // Tipo arquivo
                    accept="image/*" // Aceita apenas imagens
                    onChange={(e) => handlePhotoUpload(persona.id, e)} // Chama função de upload ao selecionar arquivo
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" // Input invisível ocupando toda a área clicável
                    aria-label="Upload photo" // Label de acessibilidade
                  />
                )}
              </div>
              <Input
                value={persona.name} // Nome atual da persona
                onChange={(e) => updatePersona(persona.id, 'name', e.target.value)} // Atualiza o campo name ao digitar
                className="text-2xl font-bold text-center border-none focus:ring-2 focus:ring-gray-800 bg-transparent w-full rounded-md py-1" // Estilização do input de nome
                placeholder="Persona Name" // Placeholder para o nome
                disabled={isReadOnly} // Desabilita input em modo somente leitura
              />
            </div>
            <div className="space-y-4 pt-4 border-t border-gray-200"> {/* Área inferior com seções de perfil, comportamento e necessidades */}
              <div className="bg-white p-4 rounded-lg shadow-inner"> {/* Bloco de perfil */}
                <h4 className="font-semibold text-lg text-gray-800 mb-2">Profile</h4> {/* Título da seção */}
                <AutoResizingTextarea
                  value={persona.profile} // Texto do perfil
                  onChange={(e) => updatePersona(persona.id, 'profile', e.target.value)} // Atualiza o campo profile
                  className="text-gray-700 border-none resize-none focus:ring-1 focus:ring-gray-800 bg-transparent w-full rounded-md p-1" // Estilo do textarea
                  placeholder="Age, background, characteristics..." // Placeholder sugerindo conteúdo
                  disabled={isReadOnly} // Desabilita em modo somente leitura
                />
              </div>
              <div className="bg-white p-4 rounded-lg shadow-inner"> {/* Bloco de comportamento */}
                <h4 className="font-semibold text-lg text-gray-800 mb-2">Behavior</h4> {/* Título da seção */}
                <AutoResizingTextarea
                  value={persona.behavior} // Texto do comportamento
                  onChange={(e) => updatePersona(persona.id, 'behavior', e.target.value)} // Atualiza o campo behavior
                  className="text-gray-700 border-none resize-none focus:ring-1 focus:ring-gray-800 bg-transparent w-full rounded-md p-1" // Estilização do textarea
                  placeholder="How they behave, what they do..." // Placeholder de exemplo
                  disabled={isReadOnly} // Desabilita edição se for somente leitura
                />
              </div>
              <div className="bg-white p-4 rounded-lg shadow-inner"> {/* Bloco de necessidades */}
                <h4 className="font-semibold text-lg text-gray-800 mb-2">Needs</h4> {/* Título da seção */}
                <AutoResizingTextarea
                  value={persona.needs} // Texto das necessidades
                  onChange={(e) => updatePersona(persona.id, 'needs', e.target.value)} // Atualiza o campo needs
                  className="text-gray-700 border-none resize-none focus:ring-1 focus:ring-gray-800 bg-transparent w-full rounded-md p-1" // Estilo visual
                  placeholder="What they need, their goals..." // Placeholder sugerindo tipo de informação
                  disabled={isReadOnly} // Desabilita edição em modo somente leitura
                />
              </div>
            </div>
          </Card>
        ))}
        {!isReadOnly && ( /* Card de adicionar nova persona, exibido apenas quando edição é permitida */
          <Button
            variant="outline" // Estilo contornado
            onClick={addPersona} // Chama função que adiciona uma nova persona
            className="h-full min-h-[500px] border-dashed border-2 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors rounded-xl" // Estilo de card vazio com borda pontilhada
          >
            <Plus className="h-12 w-12 text-gray-400 mb-2" /> {/* Ícone grande de adicionar */}
            <span className="text-gray-600 font-semibold">Add Persona</span> {/* Texto explicativo do botão */}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PersonasTemplate; // Exporta o componente PersonasTemplate como padrão
