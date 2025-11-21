// Importa hooks de estado e efeito do React
import { useState, useEffect } from 'react';
// Importa hook de autenticação do contexto da aplicação
import { useAuth } from '@/components/AuthProvider';
// Importa hook de toast para mensagens de feedback
import { useToast } from '@/hooks/use-toast';
// Importa instância do Firestore configurada no cliente
import { db } from '@/integrations/firebase/client';
// Importa funções do Firestore para ler, escrever e manipular documentos
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
// Importa componente que exibe workshops recentes
import RecentWorkshops from '@/components/RecentWorkshops';
// Importa componente principal do canvas de workshop
import WorkshopCanvas from '@/components/WorkshopCanvas';
// Importa diálogo para criação de novo workshop
import NewWorkshopDialog from '@/components/NewWorkshopDialog';
// Importa painel administrativo
import AdminPanel from '@/components/AdminPanel';
// Importa filtros para listagem de workshops
import WorkshopFilters from '@/components/WorkshopFilters';
// Importa seletor de workspaces
import WorkspaceSelector from '@/components/WorkspaceSelector';
// Importa componente de gerenciamento de workspace
import WorkspaceManagement from '@/components/WorkspaceManagement';
// Importa componente de botão de UI
import { Button } from '@/components/ui/button';
// Importa ícone de seta para esquerda
import { ArrowLeft } from 'lucide-react';
// Importa cabeçalho principal da aplicação
import Header from '@/components/Header';
// Importa provider do diálogo de conversa com IA
import { ConversationDialogProvider } from '@/components/ConversationDialog';
// Importa templates padrão para criação de workshops
import { defaultTemplates } from '@/lib/defaultTemplates';

// Declara o componente principal da página inicial
const Index = () => {
  // Estado que controla qual visão está ativa na tela
  const [view, setView] = useState<'workspaces' | 'workshops' | 'canvas' | 'admin' | 'workspace-management'>('workspaces');
  // Estado com o workspace selecionado atualmente
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  // Estado com o ID do workshop selecionado
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
  // Estado que controla se o diálogo de novo workshop está aberto
  const [showNewWorkshopDialog, setShowNewWorkshopDialog] = useState(false);
  // Estado que armazena o perfil do usuário logado
  const [userProfile, setUserProfile] = useState<any>(null);
  // Estado para indicar se o perfil ainda está sendo carregado
  const [loadingProfile, setLoadingProfile] = useState(true);
  // Estado com filtros aplicados à lista de workshops
  const [workshopFilters, setWorkshopFilters] = useState<any>({});
  // Estado de controle para evitar múltiplas criações simultâneas de workshop
  const [isCreatingWorkshop, setIsCreatingWorkshop] = useState(false);
  // Obtém o usuário autenticado do contexto de autenticação
  const { user } = useAuth();
  // Obtém função de toast para exibir notificações
  const { toast } = useToast();

  // Efeito que busca o perfil do usuário assim que ele está disponível
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // Função responsável por buscar ou criar o perfil do usuário no Firestore
  const fetchUserProfile = async () => {
    // Se não houver usuário logado, não faz nada
    if (!user) return;
    try {
      // Referência ao documento de perfil no Firestore
      const profileRef = doc(db, 'profiles', user.uid);
      // Busca o documento de perfil
      const profileSnap = await getDoc(profileRef);

      // Se o perfil existir
      if (profileSnap.exists()) {
        // Obtém dados do perfil
        const profileData = profileSnap.data();
        // Garante que a propriedade workspace_ids exista
        if (!('workspace_ids' in profileData)) {
          // Atualiza o documento adicionando workspace_ids como array vazio
          await updateDoc(profileRef, { workspace_ids: [] });
          // Atualiza o estado local com o perfil ajustado
          setUserProfile({ ...profileData, workspace_ids: [] });
        } else {
          // Se já existir workspace_ids, apenas define o perfil no estado
          setUserProfile(profileData);
        }
      } 
      // Se o perfil não existir, cria um novo
      else {
        console.warn("User profile not found in Firestore. Creating one...");
        // Monta objeto de novo perfil
        const newProfile = {
            name: user.displayName || user.email,
            email: user.email,
            access_type: 'user',
            id: user.uid,
            created_at: new Date(),
            workspace_ids: [],
        };
        // Salva o novo perfil no Firestore
        await setDoc(profileRef, newProfile);
        // Atualiza o estado com o novo perfil
        setUserProfile(newProfile);
        // Exibe mensagem de boas-vindas
        toast({
            title: "Welcome!",
            description: "Your user profile has been created.",
        });
      }
    } catch (error: any) {
      // Loga erro no console para debug
      console.error('Error fetching or creating user profile:', error);
      // Exibe toast de erro genérico para o usuário
      toast({
        title: "Error",
        description: "Failed to load or create your user profile.",
        variant: "destructive",
      });
    } finally {
      // Marca que o carregamento do perfil terminou
      setLoadingProfile(false);
    }
  };

  // Handler chamado quando um workspace é selecionado na tela
  const handleWorkspaceSelect = (workspace: any) => {
    // Atualiza workspace selecionado
    setSelectedWorkspace(workspace);
    // Troca a visão para a lista de workshops
    setView('workshops');
  };

  // Handler para criação de workspace, ainda apenas loga no console
  const handleCreateWorkspace = () => {
    console.log('Create workspace dialog will be opened');
  };

  // Handler para abrir tela de configurações/gerenciamento de workspace
  const handleWorkspaceSettings = (workspaceId: string) => {
    // Monta objeto simples de workspace com apenas o id
    const workspace = { id: workspaceId };
    // Atualiza workspace selecionado
    setSelectedWorkspace(workspace);
    // Abre visão de gerenciamento de workspace
    setView('workspace-management');
  };

  // Handler para selecionar um workshop específico
  const handleSelectWorkshop = async (id: string) => {
    // Se não houver id, abre diálogo para criar novo workshop
    if (!id) {
      setShowNewWorkshopDialog(true);
      return;
    }

    try {
      // Referência ao documento do workshop
      const workshopRef = doc(db, 'workshops', id);
      // Busca dados do workshop
      const workshopSnap = await getDoc(workshopRef);

      // Se o workshop existir
      if (workshopSnap.exists()) {
        // Obtém dados do workshop
        const workshopData = workshopSnap.data();
        // Workspace ao qual o workshop pertence, se existir
        let workspaceForWorkshop = null;

        // Se houver workspace_id associado ao workshop
        if (workshopData.workspace_id) {
          // Referência ao workspace pai
          const workspaceRef = doc(db, 'workspaces', workshopData.workspace_id);
          // Busca workspace
          const workspaceSnap = await getDoc(workspaceRef);
          // Se o workspace existir
          if (workspaceSnap.exists()) {
            // Monta objeto com id e dados do workspace
            workspaceForWorkshop = { id: workspaceSnap.id, ...workspaceSnap.data() };
          } else {
            // Se o workspace pai não for encontrado, exibe erro
            toast({
              title: "Error",
              description: `The parent workspace for workshop "${workshopData.name}" was not found.`,
              variant: "destructive",
            });
          }
        }

        // Atualiza estado com workspace encontrado (ou null)
        setSelectedWorkspace(workspaceForWorkshop);
        // Define id do workshop selecionado
        setSelectedWorkshopId(id);
        // Troca visão para o canvas
        setView('canvas');
      } 
      // Se o workshop não existir, exibe erro
      else {
        toast({ title: "Error", description: "Workshop not found.", variant: "destructive" });
      }
    } catch (error) {
      // Loga erro no console
      console.error("Error selecting workshop:", error);
      // Exibe toast de erro genérico
      toast({ title: "Error", description: "An error occurred while loading the workshop.", variant: "destructive" });
    }
  };

  // Handler para criar um novo workshop, opcionalmente ligado a um workspace
  const handleCreateWorkshop = async (name: string, description: string, workspaceId: string | null = null) => {
    // Se não houver usuário ou já estiver criando, não faz nada
    if (!user || isCreatingWorkshop) return;

    // Marca que está criando workshop
    setIsCreatingWorkshop(true);
    // Fecha o diálogo de novo workshop
    setShowNewWorkshopDialog(false);

    try {
        // Conta quantos templates padrão são contabilizados no total de etapas
        const countedTemplates = defaultTemplates.filter(t => t.is_counted).length;
        // Monta payload do novo workshop
        const workshopPayload = {
            name,
            description,
            created_by: user.uid,
            participants: [user.email!],
            workspace_id: workspaceId,
            status: 'in_progress',
            current_step: 1,
            total_steps: countedTemplates,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        };

        // Adiciona documento de workshop na coleção
        const workshopRef = await addDoc(collection(db, 'workshops'), workshopPayload);
        
        // Cria um batch para inserir os templates padrão
        const batch = writeBatch(db);
        // Referência à subcoleção de templates do workshop recém-criado
        const templatesCollectionRef = collection(db, 'workshops', workshopRef.id, 'templates');
        // Para cada template padrão, cria um documento na subcoleção
        defaultTemplates.forEach(template => {
            const newTemplateRef = doc(templatesCollectionRef);
            batch.set(newTemplateRef, template);
        });
        // Executa o batch de escrita
        await batch.commit();

        // Exibe toast de sucesso
        toast({ title: "Success", description: "Workshop created successfully." });
        
        // Define o workshop recém-criado como selecionado
        setSelectedWorkshopId(workshopRef.id);
        // Abre a visão do canvas
        setView('canvas');

    } catch (error) {
        // Em caso de erro, loga no console
        console.error("Error creating workshop:", error);
        // Exibe toast de erro
        toast({ title: "Error", description: "Failed to create workshop.", variant: "destructive" });
    } finally {
        // Libera flag de criação de workshop
        setIsCreatingWorkshop(false);
    }
  };

  // Handler para voltar da visão de canvas para a lista de workshops
  const handleBackToWorkshops = () => {
    setView('workshops');
    setSelectedWorkshopId(null);
  };

  // Handler para voltar da visão de workshops para a lista de workspaces
  const handleBackToWorkspaces = () => {
    setView('workspaces');
    setSelectedWorkspace(null);
    setWorkshopFilters({});
  };

  // Função que decide o conteúdo a ser renderizado de acordo com a visão atual
  const renderContent = () => {
    switch (view) {
      // Visão de canvas do workshop
      case 'canvas':
        return (
          <WorkshopCanvas
            onBack={handleBackToWorkshops}
            workshopId={selectedWorkshopId!}
            workspaceId={selectedWorkspace?.id || null}
            createdBy={user!.uid}
          />
        );
      // Visão de painel administrativo
      case 'admin':
        return userProfile?.access_type === 'admin' ? (
          <div className="container mx-auto px-4 py-6">
            <AdminPanel />
          </div>
        ) : null;
      // Visão de gerenciamento de workspace
      case 'workspace-management':
        return selectedWorkspace ? (
          <div className="container mx-auto px-4 py-6">
            <WorkspaceManagement
              workspaceId={selectedWorkspace.id}
              onBack={() => setView('workshops')}
            />
          </div>
        ) : null;
      // Visão de seleção de workspaces
      case 'workspaces':
        return (
          <div className="container mx-auto px-4 py-8">
            <WorkspaceSelector
              onSelectWorkspace={handleWorkspaceSelect}
              onCreateWorkspace={handleCreateWorkspace}
              onWorkspaceSettings={handleWorkspaceSettings}
            />
          </div>
        );
      // Visão de workshops dentro de um workspace
      case 'workshops':
      default:
        return (
          <div className="container mx-auto px-4 py-8">
            {/* Botão para voltar à lista de workspaces */}
            <div className="mb-4">
              <Button onClick={handleBackToWorkspaces} variant="ghost" className="text-gray-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Workspaces
              </Button>
            </div>
            {/* Filtros e lista de workshops recentes */}
            <div className="space-y-6">
              <WorkshopFilters onFiltersChange={setWorkshopFilters} />
              <RecentWorkshops 
                onSelectWorkshop={handleSelectWorkshop} 
                filters={workshopFilters}
                workspaceId={selectedWorkspace?.id || null}
                onShowNewWorkshopDialog={() => setShowNewWorkshopDialog(true)}
              />
            </div>
          </div>
        );
    }
  };

  // Se o perfil ainda estiver carregando, mostra um spinner centralizado
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-inception-blue"></div>
      </div>
    );
  }

  // Se não houver usuário logado, exibe mensagem de bloqueio de acesso
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <p>You must be logged in to access this page.</p>
      </div>
    );
  }

  // Renderização principal quando há usuário e perfil carregado
  return (
    <ConversationDialogProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Exibe o Header em todas as visões, exceto no canvas */}
        {view !== 'canvas' && (
          <Header 
            onNavigateToHome={handleBackToWorkspaces} 
            onNavigateToSettings={selectedWorkspace ? () => handleWorkspaceSettings(selectedWorkspace.id) : undefined}
          />
        )}
        {/* Renderiza o conteúdo de acordo com a visão atual */}
        {renderContent()}
        {/* Diálogo para criação de novo workshop */}
        <NewWorkshopDialog
          isOpen={showNewWorkshopDialog}
          onClose={() => setShowNewWorkshopDialog(false)}
          onCreateWorkshop={(name, description) => handleCreateWorkshop(name, description, selectedWorkspace?.id || null)}
          workspaceId={selectedWorkspace?.id || null}
        />
      </div>
    </ConversationDialogProvider>
  );
};

// Exporta o componente Index como padrão
export default Index;
