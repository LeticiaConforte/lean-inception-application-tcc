import React, { useState } from 'react';                               // Importa React e o hook useState para gerenciar estado local
import { Button } from '@/components/ui/button';                        // Botão estilizado do sistema UI
import { Input } from '@/components/ui/input';                          // Campo de input estilizado
import { Check, X } from 'lucide-react';                                // Ícones de confirmar e cancelar

// Define as props que o componente recebe
interface WorkshopNameEditorProps {
  initialName: string;                                                 // Nome atual do workshop (para preencher o input)
  onSave: (newName: string) => void;                                   // Callback disparado ao salvar um novo nome
  onCancel: () => void;                                                // Callback para cancelar a edição
}

// Componente responsável por editar o nome do workshop
export const WorkshopNameEditor: React.FC<WorkshopNameEditorProps> = ({ initialName, onSave, onCancel }) => {
  const [name, setName] = useState(initialName);                        // Estado local que armazena o nome sendo editado

  const handleSave = () => {                                           // Função chamada ao clicar em salvar
    if (name.trim()) {                                                 // Garante que não está vazio ou só espaços
      onSave(name.trim());                                             // Envia o nome atualizado para o componente pai
    }
  };

  return (
    <div className="flex items-center space-x-2">                      {/* Container horizontal com espaçamento */}
      <Input
        type="text"                                                    // Campo de texto
        value={name}                                                   // Valor atual do input
        onChange={(e) => setName(e.target.value)}                      // Atualiza o estado ao digitar
        className="text-lg font-bold"                                  // Estilo visual do input
      />
      <Button onClick={handleSave} size="sm" variant="ghost">          {/* Botão para salvar alterações */}
        <Check className="h-4 w-4" />                                  {/* Ícone de check */}
      </Button>
      <Button onClick={onCancel} size="sm" variant="ghost">            {/* Botão para cancelar edição */}
        <X className="h-4 w-4" />                                      {/* Ícone de X */}
      </Button>
    </div>
  );
};
