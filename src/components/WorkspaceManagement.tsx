import * as React from 'react';                                                                                     // Importa React e seus tipos principais
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';                                    // Importa componentes de Card da UI
import { Button } from '@/components/ui/button';                                                                    // Importa o componente de botão padrão
import { Input } from '@/components/ui/input';                                                                      // Importa campo de input de texto
import { Textarea } from '@/components/ui/textarea';                                                                // Importa campo de textarea
import { ArrowLeft, Users, Edit, Save, X, UserPlus, Calendar, Trash2, ShieldCheck, Plus } from 'lucide-react';     // Importa ícones usados na tela
import { db } from '@/integrations/firebase/client';                                                                // Importa instância do Firestore configurado
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'; // Funções do Firestore para leitura, escrita e batch
import { useToast } from '@/components/ui/use-toast';                                                               // Hook de toast para feedback visual
import { useAuth } from '@/components/AuthProvider';                                                                // Hook de autenticação para obter usuário logado
import { format } from 'date-fns';                                                                                  // Função para formatação de datas
import { TeamInviteDialog } from '@/components/TeamInviteDialog';                                                   // Dialog para convite de membros ao workspace
import NewWorkshopDialog from '@/components/NewWorkshopDialog';                                                     // Dialog para criação de novo workshop

// Interfaces
interface Workspace {                                                                                               // Define o modelo de dados de um Workspace
  id: string;                                                                                                       // ID do documento no Firestore
  name: string;                                                                                                     // Nome do workspace
  description?: string;                                                                                             // Descrição opcional
  created_at: any;                                                                                                  // Data de criação (Timestamp do Firestore)
  updated_at: any;                                                                                                  // Data de atualização (Timestamp do Firestore)
  created_by: string;                                                                                               // ID do usuário criador
  theme?: string;                                                                                                   // Tema opcional
  image_url?: string;                                                                                               // URL de imagem opcional
  default_language?: string;                                                                                        // Idioma padrão opcional
}

interface WorkspaceMemberDoc {                                                                                      // Interface para documento da coleção workspace_members
  id: string;                                                                                                       // ID do documento na coleção workspace_members
  user_id: string;                                                                                                  // ID do usuário vinculado
  workspace_id: string;                                                                                             // ID do workspace
  status: 'active' | 'invited';                                                                                     // Status do relacionamento
  role: 'admin' | 'editor';                                                                                         // Papel do usuário no workspace
}

interface Member {                                                                                                  // Interface para membro já mapeado com dados de profile
  id: string;                                                                                                       // ID da relação workspace_members
  user_id: string;                                                                                                  // ID do usuário
  email: string;                                                                                                    // E-mail do usuário
  name: string;                                                                                                     // Nome do usuário
  photo_url?: string;                                                                                               // URL da foto de perfil
  role: 'admin' | 'editor';                                                                                         // Papel do usuário no workspace
}

interface WorkspaceManagementProps {                                                                                // Props do componente principal
  workspaceId: string;                                                                                              // ID do workspace a ser gerenciado
  onBack: () => void;                                                                                               // Função chamada ao clicar em "voltar"
}

// Componente principal de gerenciamento de workspace
const WorkspaceManagement: React.FC<WorkspaceManagementProps> = ({
  workspaceId,                                                                                                      // ID do workspace recebido via props
  onBack                                                                                                            // Callback para voltar à lista de workspaces
}) => {
  const [workspace, setWorkspace] = React.useState<Workspace | null>(null);                                        // Armazena dados do workspace atual
  const [members, setMembers] = React.useState<Member[]>([]);                                                      // Lista de membros ativos do workspace
  const [loading, setLoading] = React.useState(true);                                                              // Estado de loading da tela
  const [isEditing, setIsEditing] = React.useState(false);                                                         // Controle do modo de edição de nome/descrição
  const [isAdmin, setIsAdmin] = React.useState(false);                                                             // Indica se o usuário atual é admin do workspace
  const [editName, setEditName] = React.useState('');                                                              // Nome em edição
  const [editDescription, setEditDescription] = React.useState('');                                                // Descrição em edição
  const [saving, setSaving] = React.useState(false);                                                               // Estado de salvamento das alterações
  const [workshopCount, setWorkshopCount] = React.useState(0);                                                     // Quantidade de workshops associados ao workspace
  const [isTeamInviteDialogOpen, setIsTeamInviteDialogOpen] = React.useState(false);                               // Controle de abertura do dialog de convite de equipe
  const [isNewWorkshopDialogOpen, setIsNewWorkshopDialogOpen] = React.useState(false);                             // Controle de abertura do dialog de novo workshop
  const { toast } = useToast();                                                                                    // Instância de toast para mensagens
  const { user } = useAuth();                                                                                      // Usuário autenticado atual

  // Busca dados do workspace, membros e contagem de workshops
  const fetchWorkspaceData = React.useCallback(async () => {
    if (!user) return;                                                                                              // Se não houver usuário, não carrega dados
    setLoading(true);                                                                                               // Inicia estado de loading
    try {
      const workspaceRef = doc(db, 'workspaces', workspaceId);                                                     // Referência ao documento do workspace
      const workspaceSnap = await getDoc(workspaceRef);                                                            // Lê o documento
      if (!workspaceSnap.exists()) throw new Error("Workspace not found");                                         // Se não existir, lança erro

      const workspaceData = { id: workspaceSnap.id, ...workspaceSnap.data() } as Workspace;                        // Monta objeto Workspace com ID
      setWorkspace(workspaceData);                                                                                 // Atualiza estado do workspace
      setEditName(workspaceData.name);                                                                             // Preenche campo de edição com nome atual
      setEditDescription(workspaceData.description || '');                                                         // Preenche campo de edição com descrição atual ou vazio

      const membersQuery = query(                                                                                  // Cria query para membros ativos do workspace
        collection(db, 'workspace_members'),
        where('workspace_id', '==', workspaceId),
        where('status', '==', 'active')
      );
      const membersSnap = await getDocs(membersQuery);                                                             // Busca membros
      const memberDocs = membersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkspaceMemberDoc));      // Mapeia docs para WorkspaceMemberDoc
      const userIds = memberDocs.map(m => m.user_id).filter(id => id);                                             // Extrai IDs de usuário válidos

      let memberDetails: Member[] = [];                                                                            // Lista detalhada de membros com dados de profile
      if (userIds.length > 0) {                                                                                    // Se houver IDs de usuários
        const profilesQuery = query(                                                                               // Query em profiles pelos IDs
          collection(db, 'profiles'),
          where('id', 'in', userIds)
        );
        const profilesSnap = await getDocs(profilesQuery);                                                         // Busca perfis
        const profilesMap = new Map(profilesSnap.docs.map(doc => [doc.data().id, doc.data()]));                   // Cria mapa id -> profile
        memberDetails = memberDocs.map(memberDoc => {                                                              // Junta dados de relação + profile
          const profile = profilesMap.get(memberDoc.user_id);                                                      // Acha profile a partir do user_id
          return {
            id: memberDoc.id,                                                                                      // ID da relação de membro
            user_id: memberDoc.user_id,                                                                            // ID do usuário
            name: profile?.name || 'Unknown User',                                                                 // Nome do usuário ou placeholder
            email: profile?.email || 'No email provided',                                                          // E-mail ou placeholder
            photo_url: profile?.photo_url,                                                                         // Foto do usuário se existir
            role: memberDoc.role || 'editor',                                                                      // Papel no workspace, padrão editor
          };
        });
      }
      setMembers(memberDetails);                                                                                   // Atualiza estado de membros

      const currentUserMember = memberDetails.find(m => m.user_id === user.uid);                                   // Encontra membro correspondente ao usuário atual
      setIsAdmin(currentUserMember?.role === 'admin');                                                             // Define se o usuário é admin

      const workshopsQuery = query(                                                                                // Query para contar workshops associadas ao workspace
        collection(db, 'workshops'),
        where('workspace_id', '==', workspaceId)
      );
      const workshopsSnap = await getDocs(workshopsQuery);                                                         // Busca workshops do workspace
      setWorkshopCount(workshopsSnap.size);                                                                        // Atualiza contagem de workshops

    } catch (error: any) {
      console.error('Error fetching workspace data:', error);                                                      // Log de erro
      toast({ title: "Error", description: "Failed to load workspace data.", variant: "destructive" });           // Toast de erro genérico
    } finally {
      setLoading(false);                                                                                           // Finaliza loading
    }
  }, [workspaceId, user, toast]);                                                                                  // Dependências do useCallback

  React.useEffect(() => {                                                                                          // Efeito para buscar dados na montagem
    fetchWorkspaceData();                                                                                          // Chama função de carregamento
  }, [fetchWorkspaceData]);                                                                                        // Reexecuta se a função mudar
  
  // Cria um workshop vinculado ao workspace atual
  const handleCreateWorkshop = async (name: string, description: string) => {
    if (!user || !workspace) return;                                                                               // Garante usuário e workspace

    const batch = writeBatch(db);                                                                                  // Inicia batch de escrita
    const workshopRef = doc(collection(db, 'workshops'));                                                          // Cria referência para novo documento em workshops

    batch.set(workshopRef, {                                                                                       // Define dados do novo workshop
      name,                                                                                                        // Nome do workshop
      description: description || null,                                                                            // Descrição ou null
      workspace_id: workspace.id,                                                                                  // ID do workspace associado
      created_by: user.uid,                                                                                        // Usuário criador
      created_at: serverTimestamp(),                                                                               // Timestamp de criação
      updated_at: serverTimestamp(),                                                                               // Timestamp de atualização
      participants: [user.email]                                                                                   // Participantes inicia com o criador via e-mail
    });

    try {
      await batch.commit();                                                                                        // Efetiva o batch
      toast({ title: "Success", description: "Workshop created successfully." });                                  // Toast de sucesso
      fetchWorkspaceData();                                                                                        // Recarrega dados para atualizar contagem
    } catch (error) {
      console.error("Error creating workshop:", error);                                                            // Log de erro
      toast({ title: "Error", description: "Failed to create workshop.", variant: "destructive" });               // Toast de erro
    }
  };

  // Remove um membro do workspace e atualiza o profile
  const handleRemoveMember = async (memberUserId: string) => {
    if (!isAdmin) {                                                                                                // Garante que apenas admin pode remover
      toast({ title: "Permission Denied", description: "Only workspace admins can remove members.", variant: "destructive" });
      return;
    }
    if (!user || !workspace) return;                                                                               // Garante usuário e workspace
    const memberToRemove = members.find(m => m.user_id === memberUserId);                                          // Localiza membro pelo user_id
    if (!memberToRemove) {                                                                                         // Se não encontrar, exibe erro
      toast({ title: "Error", description: "Member relationship not found.", variant: "destructive" });
      return;
    }
    try {
      const batch = writeBatch(db);                                                                                // Inicia batch
      const memberRef = doc(db, 'workspace_members', memberToRemove.id);                                           // Referência ao documento workspace_members
      batch.delete(memberRef);                                                                                     // Remove a relação do workspace

      const profileRef = doc(db, 'profiles', memberUserId);                                                        // Referência ao documento de profile do usuário
      const profileSnap = await getDoc(profileRef);                                                                // Lê profile
      if (profileSnap.exists()) {                                                                                  // Se o profile existir
        const currentWorkspaces = profileSnap.data().workspace_ids || [];                                          // Lista atual de workspace_ids
        const updatedWorkspaces = currentWorkspaces.filter((id: string) => id !== workspaceId);                    // Remove workspace atual da lista
        batch.update(profileRef, { workspace_ids: updatedWorkspaces });                                            // Atualiza profile com lista filtrada
      }

      await batch.commit();                                                                                        // Efetiva batch
      toast({ title: "Success", description: "Member removed successfully." });                                    // Feedback de sucesso
      fetchWorkspaceData();                                                                                        // Recarrega dados para refletir mudança
    } catch (error: any) {
      console.error('Error removing member:', error);                                                              // Log do erro
      toast({ title: "Error", description: "Failed to remove member.", variant: "destructive" });                 // Toast de erro
    }
  };
  
  // Salva alterações de nome e descrição do workspace
  const handleSave = async () => {
    if (!isAdmin) {                                                                                                // Apenas admin pode editar
      toast({ title: "Permission Denied", description: "Only workspace admins can edit workspace details.", variant: "destructive" });
      return;
    }
    if (!workspace || !user) return;                                                                               // Garante contexto
    setSaving(true);                                                                                               // Inicia estado de salvamento
    try {
      const workspaceRef = doc(db, 'workspaces', workspaceId);                                                     // Referência ao workspace
      await updateDoc(workspaceRef, {                                                                              // Atualiza dados principais
        name: editName.trim(),                                                                                     // Nome editado sem espaços extras
        description: editDescription.trim() || null,                                                               // Descrição editada ou null
        updated_at: serverTimestamp()                                                                              // Atualiza timestamp
      });
      toast({ title: "Success", description: "Workspace updated successfully." });                                 // Feedback positivo
      await fetchWorkspaceData();                                                                                  // Recarrega dados atualizados
      setIsEditing(false);                                                                                         // Sai do modo de edição
    } catch (error: any) {
      console.error('Error updating workspace:', error);                                                           // Log do erro
      toast({ title: "Error", description: "Failed to update workspace.", variant: "destructive" });              // Feedback de erro
    } finally {
      setSaving(false);                                                                                            // Finaliza estado de salvamento
    }
  };

  // Cancela edição e restaura valores originais
  const handleCancel = () => {
    if (workspace) {                                                                                               // Se workspace existir
      setEditName(workspace.name);                                                                                 // Restaura nome original
      setEditDescription(workspace.description || '');                                                             // Restaura descrição original
    }
    setIsEditing(false);                                                                                           // Sai do modo de edição
  };

  if (loading) {                                                                                                   // Exibe loader enquanto carrega
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-inception-blue"></div>
      </div>
    );
  }

  if (!workspace) {                                                                                                // Caso workspace não seja encontrado
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Workspace not found</h3>                          {/* Mensagem de erro */}
        <p className="text-gray-600 mb-4">
          The workspace you're looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button onClick={onBack} variant="outline">                                                                {/* Botão para voltar */}
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workspaces
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão de voltar para lista de workspaces */}
      <Button onClick={onBack} variant="ghost" className="text-gray-600 hover:text-gray-800 w-fit">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workspaces
      </Button>

      {/* Card principal de gerenciamento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Workspace Management</CardTitle>                                        {/* Título da seção */}
            {isAdmin && (                                                                                           
              <div className="flex items-center space-x-2">
                {/* Botão para abrir dialog de adicionar membro */}
                <Button onClick={() => setIsTeamInviteDialogOpen(true)} variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
                {/* Botão para abrir dialog de novo workshop */}
                <Button onClick={() => setIsNewWorkshopDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Workshop
                </Button>
                {/* Botão de entrar em modo de edição dos dados do workspace */}
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Bloco de edição ou visualização de nome e descrição */}
          {isEditing ? (
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter workspace name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter workspace description"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !editName.trim()}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Workspace Name</label>
                <p className="text-lg font-semibold text-gray-800">{workspace.name}</p>                            {/* Mostra nome atual */}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <p className="text-gray-600">
                  {workspace.description || 'No description provided'}                                             {/* Mostra descrição ou placeholder */}
                </p>
              </div>
            </div>
          )}

          {/* Seção de membros */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Members ({members.length})
            </h3>
            <div className="space-y-3">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar do membro */}
                    <img
                      src={member.photo_url || 'https://avatar.vercel.sh/' + member.email}
                      alt={member.name}
                      className="h-10 w-10 rounded-full bg-gray-200"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        {member.name}
                        {member.role === 'admin' && (
                          <span title="Workspace Admin">
                            <ShieldCheck className="h-4 w-4 text-blue-500" />                                    {/* Ícone de admin */}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{member.email}</p>                                     {/* E-mail do membro */}
                    </div>
                  </div>
                  {/* Botão de remoção de membro, somente para admin e não permitido remover a si mesmo */}
                  {isAdmin && user?.uid !== member.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.user_id)}
                      aria-label="Remove member"
                    >
                      <Trash2 className="h-5 w-5 text-gray-500 hover:text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Seção de estatísticas do workspace */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Workspace Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card de quantidade de membros */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Members</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {members.length}
                </p>
              </div>
              {/* Card de quantidade de workshops */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Workshops</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {workshopCount}
                </p>
              </div>
              {/* Card de data de criação do workspace */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Created</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mt-2">
                  {workspace.created_at?.toDate
                    ? format(workspace.created_at.toDate(), 'MMM d, yyyy')                                         // Formata data de criação
                    : 'N/A'}
                </p>
              </div>
              {/* Card de última atualização */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Last Updated</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mt-2">
                  {workspace.updated_at?.toDate
                    ? format(workspace.updated_at.toDate(), 'MMM d, yyyy')                                         // Formata data de atualização
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de convite de time, atrelado ao workspace atual */}
      {workspace && (
        <TeamInviteDialog
          isOpen={isTeamInviteDialogOpen}
          onClose={() => setIsTeamInviteDialogOpen(false)}
          onMemberAdded={fetchWorkspaceData}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
        />
      )}

      {/* Dialog de novo workshop vinculado ao workspace atual */}
      {workspace && (
        <NewWorkshopDialog
          isOpen={isNewWorkshopDialogOpen}
          onClose={() => setIsNewWorkshopDialogOpen(false)}
          onCreateWorkshop={handleCreateWorkshop}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
};

export default WorkspaceManagement;                                                                                 // Exporta o componente padrão
