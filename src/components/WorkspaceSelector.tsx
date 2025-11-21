import React, { useState, useEffect } from 'react';                                                               // Importa React e hooks useState/useEffect para controlar estado e efeitos colaterais
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';                 // Importa componentes de cartão para estrutura visual
import { Button } from '@/components/ui/button';                                                                   // Importa o botão estilizado padrão da aplicação
import { Input } from '@/components/ui/input';                                                                     // Importa o campo de input de texto
import { Plus, Search, Users, User, Trash2 } from 'lucide-react';                                                 // Importa ícones usados na interface
import { db } from '@/integrations/firebase/client';                                                              // Instância configurada do Firestore
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';      // Funções do Firestore para consultas e operações em documentos
import { useAuth } from '@/components/AuthProvider';                                                              // Hook de autenticação para acessar o usuário logado
import { useToast } from '@/hooks/use-toast';                                                                     // Hook para exibir notificações toast
import WorkspaceCard from './WorkspaceCard';                                                                      // Componente para exibir cada card de workspace
import CreateWorkspaceDialog from './CreateWorkspaceDialog';                                                      // Diálogo para criação de novo workspace
import ConfirmationDialog from './ConfirmationDialog';                                                            // Diálogo genérico de confirmação

interface Workspace {                                                                                             // Interface que define a estrutura de um Workspace
  id: string;                                                                                                     // ID do workspace no Firestore
  name: string;                                                                                                   // Nome do workspace
  description?: string;                                                                                           // Descrição opcional
  created_at: any;                                                                                                // Data de criação (timestamp do Firestore ou similar)
  created_by: string;                                                                                             // ID do usuário criador
  updated_at: any;                                                                                                // Data da última atualização
  theme?: string;                                                                                                 // Tema opcional do workspace
  image_url?: string;                                                                                             // URL de imagem opcional
  default_language?: string;                                                                                      // Idioma padrão opcional
}

interface WorkspaceMember {                                                                                       // Interface que representa o vínculo do usuário com o workspace
  role: string;                                                                                                   // Função do usuário no workspace (por enquanto fixo em "member")
  status: string;                                                                                                 // Status de participação (exemplo: active)
  workspaces: Workspace;                                                                                          // Dados do workspace associado
}

interface WorkspaceSelectorProps {                                                                                // Props aceitas pelo componente WorkspaceSelector
  onSelectWorkspace: (workspace: Workspace | null) => void;                                                       // Callback ao selecionar um workspace ou o pessoal (null)
  onWorkspaceSettings: (workspaceId: string) => void;                                                             // Callback para abrir configurações de um workspace específico
}

const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({                                                    // Declara o componente funcional WorkspaceSelector
  onSelectWorkspace,                                                                                              // Função chamada ao escolher um workspace
  onWorkspaceSettings                                                                                             // Função chamada ao abrir configurações do workspace
}) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceMember[]>([]);                                            // Lista de workspaces associados ao usuário
  const [loading, setLoading] = useState(true);                                                                   // Estado de carregamento para exibir spinner
  const [searchTerm, setSearchTerm] = useState('');                                                               // Termo de busca digitado pelo usuário
  const [showCreateDialog, setShowCreateDialog] = useState(false);                                                // Controla exibição do diálogo de criação de workspace
  const { user } = useAuth();                                                                                     // Obtém usuário autenticado
  const { toast } = useToast();                                                                                   // Permite mostrar mensagens toast
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);                                              // Controla exibição do diálogo de confirmação de exclusão
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);                             // Armazena o workspace selecionado para exclusão

  useEffect(() => {                                                                                                // Efeito que reage a mudanças de usuário logado
    if (user) {                                                                                                    // Se existe usuário autenticado
      fetchWorkspaces();                                                                                           // Carrega os workspaces do usuário
    }
  }, [user]);                                                                                                      // Reexecuta quando o usuário mudar

  const fetchWorkspaces = async () => {                                                                            // Função que busca workspaces criados pelo usuário
    if (!user) return;                                                                                            // Se não há usuário, não faz nada
    setLoading(true);                                                                                              // Ativa estado de carregamento
    try {
      const workspacesRef = collection(db, 'workspaces');                                                         // Referência à coleção "workspaces" no Firestore
      const q = query(workspacesRef, where('created_by', '==', user.uid));                                        // Cria consulta filtrando pelo usuário criador
      const querySnapshot = await getDocs(q);                                                                      // Executa a consulta e obtém os documentos

      const fetchedWorkspaces = querySnapshot.docs.map(doc => ({                                                  // Mapeia os documentos em objetos WorkspaceMember
        workspaces: { id: doc.id, ...doc.data() } as Workspace,                                                   // Constrói o objeto Workspace com id e dados
        role: 'member',                                                                                           // Role padrão "member" por enquanto
        status: 'active'                                                                                          // Status padrão "active"
      }));
      
      setWorkspaces(fetchedWorkspaces);                                                                            // Atualiza o estado com a lista de workspaces
    } catch (error: any) {                                                                                         // Em caso de erro na consulta
      console.error('Error fetching workspaces:', error);                                                          // Loga o erro no console
      toast({                                                                                                      // Mostra toast de erro ao usuário
        title: "Error",
        description: "Failed to fetch workspaces.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);                                                                                           // Desativa estado de carregamento
    }
  };

  const handleCreateWorkspace = () => {                                                                            // Função chamada ao clicar no card de criar workspace
    setShowCreateDialog(true);                                                                                     // Abre o diálogo de criação
  };

  const handleWorkspaceCreated = () => {                                                                           // Chamado quando um workspace é criado com sucesso
    fetchWorkspaces();                                                                                             // Recarrega a lista de workspaces
  };

  const handleDeleteRequest = (workspace: Workspace) => {                                                          // Dispara o fluxo de exclusão de workspace
    setWorkspaceToDelete(workspace);                                                                               // Guarda o workspace selecionado
    setShowDeleteConfirm(true);                                                                                    // Abre o diálogo de confirmação
  };

  const handleDeleteWorkspace = async () => {                                                                      // Função que efetivamente exclui o workspace
    if (!workspaceToDelete || !user) return;                                                                       // Se faltar info ou usuário, encerra

    if (user.uid !== workspaceToDelete.created_by) {                                                               // Verifica se o usuário é dono do workspace
        toast({                                                                                                    // Caso não seja, exibe erro de permissão
            title: "Permission Denied",
            description: "You are not authorized to delete this workspace.",
            variant: "destructive"
        });
        return;                                                                                                    // Sai sem excluir
    }

    try {
      await deleteDoc(doc(db, 'workspaces', workspaceToDelete.id));                                                // Deleta o documento do Firestore
      toast({                                                                                                      // Notifica sucesso para o usuário
        title: "Workspace Deleted",
        description: `Successfully deleted "${workspaceToDelete.name}".`
      });
      setWorkspaces(prev => prev.filter(member => member.workspaces.id !== workspaceToDelete.id));                 // Remove o workspace da lista em memória
    } catch (error: any) {                                                                                         // Em caso de erro na exclusão
      console.error('Error deleting workspace:', error);                                                           // Loga o erro no console
      toast({                                                                                                      // Exibe toast de erro com mensagem detalhada
        title: "Error",
        description: `Failed to delete workspace: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setShowDeleteConfirm(false);                                                                                 // Fecha o diálogo de confirmação
      setWorkspaceToDelete(null);                                                                                  // Limpa workspace selecionado
    }
  };

  const handleSelectPersonalWorkspace = () => {                                                                    // Seleção do "Personal Workspace"
    onSelectWorkspace(null);                                                                                       // Passa null para indicar workspace pessoal
  };

  const filteredWorkspaces = workspaces.filter(member =>                                                           // Filtra workspaces de acordo com o termo de busca
    member.workspaces.name.toLowerCase().includes(searchTerm.toLowerCase()) ||                                    // Verifica ocorrência no nome
    (member.workspaces.description && member.workspaces.description.toLowerCase().includes(searchTerm.toLowerCase()))
                                                                                                                   // Ou na descrição, caso exista
  );

  if (loading) {                                                                                                   // Enquanto estiver carregando dados
    return (
      <div className="flex items-center justify-center py-12">                                                     {/* Container centralizado para o spinner */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-inception-blue"></div>                 {/* Spinner simples de loading */}
      </div>
    );
  }

  return (
    <div className="space-y-6">                                                                                    {/* Conteúdo principal com espaçamento vertical */}
      <div className="flex justify-between items-center">                                                          {/* Cabeçalho com título */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Workspaces</h2>                               {/* Título principal */}
          <p className="text-xl text-gray-600">
            Select a workspace to manage your workshops or create a new one.                                       {/* Subtítulo explicativo */}
          </p>
        </div>
      </div>

      <div className="relative">                                                                                   {/* Container para campo de busca */}
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />            {/* Ícone de lupa dentro do input */}
        <Input
          placeholder="Search workspaces..."                                                                       // Placeholder do campo de busca
          value={searchTerm}                                                                                       // Valor controlado do input
          onChange={(e) => setSearchTerm(e.target.value)}                                                          // Atualiza termo de busca ao digitar
          className="pl-10"                                                                                        // Padding para não sobrepor o ícone
        />
      </div>

      <Card                                                                                                        // Card para o "Personal Workspace"
        className="workspace-card cursor-pointer hover:shadow-lg transition-all duration-300 border-blue-200 min-h-[200px] flex flex-col mb-6"
        onClick={handleSelectPersonalWorkspace}                                                                    // Seleciona o workspace pessoal ao clicar
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2 flex items-center">
                <User className="mr-2 h-5 w-5 text-blue-600" />                                                    {/* Ícone indicando workspace pessoal */}
                Personal Workspace
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Your personal workspace for individual workshops and projects.                                     {/* Descrição do workspace pessoal */}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between pt-2">
            <div></div>                                                                                            {/* Espaço reservado no lado esquerdo */}
            <Button
                onClick={(e) => {                                                                                  // Clique no botão não propaga para o card
                  e.stopPropagation();
                  handleSelectPersonalWorkspace();                                                                 // Seleciona workspace pessoal
                }}
                size="sm"
                className="bg-inception-blue hover:bg-inception-purple text-white"                                 // Estilo do botão principal
              >
                Open Workspace                                                                                     {/* Texto do botão */}
              </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">                                                   {/* Grade de cards de workspace */}
        <Card                                                                                                      // Card de criação de novo workspace
          className="border-2 border-dashed border-gray-300 hover:border-inception-blue hover:shadow-lg transition-all duration-300 cursor-pointer bg-gray-50 hover:bg-blue-50 min-h-[200px] flex flex-col"
          onClick={handleCreateWorkspace}                                                                          // Abre diálogo de criação ao clicar
        >
          <CardContent className="flex flex-col items-center justify-center flex-1 text-center p-6">
            <div className="bg-inception-blue rounded-full p-3 mb-3">
              <Plus className="h-6 w-6 text-white" />                                                              {/* Ícone de adicionar */}
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2">Create New Workspace</h3>                   {/* Título do card */}
            <p className="text-gray-600 text-sm">Create a workspace to organize your workshops</p>                 {/* Descrição breve */}
          </CardContent>
        </Card>

        {filteredWorkspaces.map((member) => (                                                                     // Mapeia e renderiza cada workspace filtrado
          <WorkspaceCard
            key={member.workspaces.id}                                                                            // Chave única do card
            workspace={{
              ...member.workspaces,                                                                              // Espalha dados do workspace
              user_role: member.role                                                                            // Adiciona papel do usuário no workspace
            }}
            onClick={() => onSelectWorkspace(member.workspaces)}                                                 // Seleciona o workspace ao clicar no card
            onDelete={() => handleDeleteRequest(member.workspaces)}                                              // Dispara fluxo de exclusão
            onManage={() => onWorkspaceSettings(member.workspaces.id)}                                           // Abre tela de configurações do workspace
            canDelete={user?.uid === member.workspaces.created_by}                                              // Permite exclusão somente ao criador
          />
        ))}
      </div>

      {filteredWorkspaces.length === 0 && searchTerm === '' && (                                                  // Caso não haja workspaces e sem termo de busca
        <div className="text-center py-12 mt-8">
          <div className="bg-gray-50 rounded-lg p-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />                                            {/* Ícone de time */}
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team workspaces yet</h3>                    {/* Mensagem de ausência de workspaces de equipe */}
            <p className="text-gray-500 mb-4">Create your first team workspace to start collaborating with your team.</p>
          </div>
        </div>
      )}

      {filteredWorkspaces.length === 0 && searchTerm !== '' && (                                                  // Caso não haja resultado para a busca
        <div className="text-center py-12 mt-8">
          <div className="bg-gray-50 rounded-lg p-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />                                            {/* Ícone de usuários */}
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces found</h3>                        {/* Mensagem de nenhum resultado */}
            <p className="text-gray-500">Try adjusting your search terms to find the workspace you're looking for.</p>
          </div>
        </div>
      )}

      <CreateWorkspaceDialog                                                                                       // Diálogo para criação de workspace
        isOpen={showCreateDialog}                                                                                  // Controla se o modal está aberto
        onClose={() => setShowCreateDialog(false)}                                                                 // Fecha o modal ao solicitar
        onWorkspaceCreated={handleWorkspaceCreated}                                                                // Callback para recarregar lista após criação
      />

      <ConfirmationDialog                                                                                          // Diálogo genérico de confirmação para exclusão
        isOpen={showDeleteConfirm}                                                                                 // Controla se o modal está aberto
        onClose={() => setShowDeleteConfirm(false)}                                                                // Fecha o modal sem confirmar
        onConfirm={handleDeleteWorkspace}                                                                           // Executa exclusão ao confirmar
        title="Delete Workspace"                                                                                    // Título do diálogo
        description={`Are you sure you want to delete "${workspaceToDelete?.name}"? This action cannot be undone.`}
                                                                                                                   // Descrição com nome do workspace
        confirmText="Delete"                                                                                       // Texto do botão de confirmação
        icon={<Trash2 className="h-6 w-6 text-red-600" />}                                                         // Ícone exibido no diálogo
      />
    </div>
  );
};

export default WorkspaceSelector;                                                                                  // Exporta o componente para uso em outras partes da aplicação
