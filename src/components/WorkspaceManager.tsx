import React, { useState, useEffect } from 'react';                                                                 // Importa React e os hooks useState/useEffect para controle de estado e efeitos colaterais
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';                  // Importa componentes de Card para estrutura visual
import { Button } from '@/components/ui/button';                                                                    // Importa componente de botão padrão da UI
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Importa componentes de diálogo (modal) para confirmações
import { db } from '@/integrations/firebase/client';                                                                // Importa instância do Firestore configurada na aplicação
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';                                          // Funções do Firestore para ler coleção, documentos e deletá-los
import { useToast } from '@/hooks/use-toast';                                                                       // Hook de toast para exibir mensagens de feedback ao usuário
import CreateWorkspaceDialog from '@/components/CreateWorkspaceDialog';                                             // Dialog personalizado para criação de novos workspaces
import WorkspaceMembersDialog from '@/components/WorkspaceMembersDialog';                                           // Dialog para visualizar membros de um workspace específico

interface Workspace {                                                                                               // Interface que define a estrutura de um Workspace
  id: string;                                                                                                       // ID do documento no Firestore
  name: string;                                                                                                     // Nome do workspace
  owner: string;                                                                                                    // Dono (proprietário) do workspace
  members: string[];                                                                                                // Lista de membros (e-mails/IDs) associados
  workshops: number;                                                                                                // Quantidade de workshops relacionados
  created_at: any;                                                                                                  // Timestamp de criação (tipo genérico por vir do Firestore)
}

const WorkspaceManager: React.FC = () => {                                                                          // Define o componente funcional WorkspaceManager
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);                                                    // Estado com a lista de workspaces carregados do Firestore
  const [isCreateOpen, setIsCreateOpen] = useState(false);                                                          // Controla a abertura do dialog de criação de workspace
  const [isMembersOpen, setIsMembersOpen] = useState(false);                                                        // Controla a abertura do dialog de visualização de membros
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);                                                          // Controla a abertura do dialog de confirmação de exclusão
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);                               // Armazena o workspace atualmente selecionado para ações (membros/exclusão)
  const { toast } = useToast();                                                                                     // Inicializa o hook de toast para exibir mensagens

  const fetchWorkspaces = async () => {                                                                             // Função assíncrona para carregar a lista de workspaces do Firestore
    try {
      const querySnapshot = await getDocs(collection(db, 'workspaces'));                                            // Busca todos os documentos da coleção 'workspaces'
      const workspacesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Workspace[];        // Mapeia os documentos para objetos Workspace incluindo o ID
      setWorkspaces(workspacesData);                                                                                // Atualiza o estado local com a lista carregada
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch workspaces.', variant: 'destructive' });                // Exibe toast de erro caso a consulta falhe
    }
  };

  useEffect(() => {                                                                                                  // Efeito para carregar workspaces quando o componente é montado
    fetchWorkspaces();                                                                                              // Chama a função de carregamento inicial
  }, []);                                                                                                           // Array de dependências vazio indica que roda apenas uma vez na montagem

  const handleDelete = async () => {                                                                                // Função para confirmar e executar a exclusão de um workspace
    if (!selectedWorkspace) return;                                                                                 // Se não houver workspace selecionado, não faz nada
    try {
      await deleteDoc(doc(db, 'workspaces', selectedWorkspace.id));                                                 // Remove o documento correspondente ao workspace selecionado
      toast({ title: 'Success', description: 'Workspace deleted.' });                                               // Exibe toast de sucesso
      fetchWorkspaces();                                                                                            // Recarrega a lista para refletir a exclusão
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete workspace.', variant: 'destructive' });               // Exibe toast de erro caso a exclusão falhe
    } finally {
      setIsDeleteOpen(false);                                                                                       // Fecha o dialog de confirmação de exclusão
      setSelectedWorkspace(null);                                                                                   // Limpa o workspace selecionado
    }
  };

  return (
    <Card>                                                                                                          {/* Card principal que envolve toda a área de gestão */}
      <CardHeader>                                                                                                  {/* Cabeçalho do card com título e botão de criação */}
        <div className="flex justify-between items-center">                                                         {/* Layout flex entre título e botão */}
          <div>
            <CardTitle>Workspace Management</CardTitle>                                                             {/* Título da seção */}
            <CardDescription>Create, view, edit, and delete workspaces.</CardDescription>                           {/* Descrição breve das capacidades da tela */}
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>                                                            {/* Botão que abre o dialog de criação de workspace */}
            Create Workspace
          </Button>
        </div>
      </CardHeader>
      <CardContent>                                                                                                 {/* Conteúdo do card com tabela de workspaces */}
        <div className="overflow-x-auto">                                                                           {/* Container com scroll horizontal para tabelas largas */}
          <table className="min-w-full divide-y divide-gray-200">                                                  {/* Tabela base com divisórias entre linhas */}
            <thead className="bg-gray-50">                                                                          {/* Cabeçalho da tabela com fundo cinza claro */}
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>        {/* Coluna: Nome do workspace */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>       {/* Coluna: Dono */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>     {/* Coluna: Membros */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workshops</th>   {/* Coluna: Quantidade de workshops */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>  {/* Coluna: Data de criação */}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>    {/* Coluna: Ações (exclusão, etc.) */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">                                                   {/* Corpo da tabela com divisórias entre linhas */}
              {workspaces.map((ws) => (                                                                             // Itera sobre a lista de workspaces
                <tr key={ws.id}>                                                                                    {/* Linha para cada workspace, chaveada pelo ID */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ws.name}</td>      {/* Nome do workspace */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ws.owner}</td>                 {/* Proprietário do workspace */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">                                {/* Coluna para visualizar membros */}
                    <Button
                      variant="link"                                                                                // Estilo de botão link (sem fundo)
                      onClick={() => {                                                                              // Ao clicar, abre o dialog de membros
                        setSelectedWorkspace(ws);                                                                   // Define o workspace selecionado
                        setIsMembersOpen(true);                                                                     // Abre o dialog de membros
                      }}
                    >
                      {(ws.members || []).length} Members                                                           {/* Exibe quantidade de membros */}
                    </Button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ws.workshops}</td>             {/* Número de workshops ligados ao workspace */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">                                {/* Data de criação formatada */}
                    {ws.created_at?.toDate
                      ? new Date(ws.created_at.toDate()).toLocaleDateString()                                      // Converte timestamp Firestore para data legível
                      : 'N/A'}                                                                                      {/* Exibe N/A se não houver data */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">                       {/* Coluna de ações com alinhamento à direita */}
                    <Button
                      variant="ghost"                                                                               // Botão sem destaque visual forte
                      onClick={() => {                                                                              // Ao clicar, prepara dados para exclusão
                        setSelectedWorkspace(ws);                                                                   // Define workspace atual como selecionado
                        setIsDeleteOpen(true);                                                                      // Abre dialog de confirmação de exclusão
                      }}
                    >
                      ...                                                                                           {/* Placeholder visual para menu de ações */}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Diálogos */}
      <CreateWorkspaceDialog
        isOpen={isCreateOpen}                                                                                       // Controla se o dialog de criação está aberto
        onClose={() => setIsCreateOpen(false)}                                                                     // Fecha o dialog ao clicar em cancelar/fechar
        onWorkspaceCreated={fetchWorkspaces}                                                                       // Recarrega workspaces após criação bem-sucedida
      />
      {selectedWorkspace && (                                                                                       // Só renderiza o dialog de membros se houver workspace selecionado
        <WorkspaceMembersDialog
          isOpen={isMembersOpen}                                                                                   // Estado de abertura do dialog de membros
          onOpenChange={setIsMembersOpen}                                                                          // Permite que o dialog controle sua própria abertura
          workspaceId={selectedWorkspace.id}                                                                       // Passa ID do workspace para o dialog buscar dados
        />
      )}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>                                                  {/* Dialog genérico para confirmação de exclusão */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>                                                               {/* Título de confirmação */}
            <DialogDescription>                                                                                    {/* Explica impacto da ação */}
              This action is irreversible and will delete the workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"                                                                                    // Botão de cancelar com estilo de contorno
              onClick={() => setIsDeleteOpen(false)}                                                               // Fecha o dialog sem excluir
            >
              Cancel
            </Button>
            <Button
              variant="destructive"                                                                                // Botão de ação destrutiva (vermelho)
              onClick={handleDelete}                                                                               // Chama função de exclusão de workspace
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default WorkspaceManager;                                                                                    // Exporta o componente WorkspaceManager como padrão
