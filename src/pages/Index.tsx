import { useState, useEffect } from 'react'; // Importa os hooks useState e useEffect do React para gerenciar estado e efeitos colaterais
import { useAuth } from '@/components/AuthProvider'; // Importa o hook de autenticação para acessar o usuário logado
import { useToast } from '@/hooks/use-toast'; // Importa o hook de toast para exibir notificações na interface
import { db } from '@/integrations/firebase/client'; // Importa a instância do Firestore configurada para o projeto
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore'; // Importa funções do Firestore para manipulação de documentos e coleções
import RecentWorkshops from '@/components/RecentWorkshops'; // Componente que lista workshops recentes com filtros
import WorkshopCanvas from '@/components/WorkshopCanvas'; // Componente do canvas principal onde o workshop é editado
import NewWorkshopDialog from '@/components/NewWorkshopDialog'; // Modal para criação de um novo workshop
import AdminPanel from '@/components/AdminPanel'; // Painel administrativo para usuários com acesso de admin
import WorkshopFilters from '@/components/WorkshopFilters'; // Componente de filtros para a listagem de workshops
import WorkspaceSelector from '@/components/WorkspaceSelector'; // Componente para seleção de workspaces
import WorkspaceManagement from '@/components/WorkspaceManagement'; // Componente para gerenciar um workspace específico
import { Button } from '@/components/ui/button'; // Componente de botão reutilizável da UI
import { ArrowLeft } from 'lucide-react'; // Ícone de seta para a esquerda importado da biblioteca Lucide
import Header from '@/components/Header'; // Componente de cabeçalho principal da aplicação
import { ConversationDialogProvider } from '@/components/ConversationDialog'; // Provider de contexto para diálogos de conversa com IA ou similares
import { defaultTemplates } from '@/lib/defaultTemplates'; // Lista de templates padrão usados na criação de workshops

const Index = () => { // Declara o componente principal Index como função de componente React
  const [view, setView] = useState<'workspaces' | 'workshops' | 'canvas' | 'admin' | 'workspace-management'>('workspaces'); // Estado que controla qual visão está ativa na tela, iniciando em 'workspaces'
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null); // Estado que guarda o workspace selecionado atualmente
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null); // Estado que guarda o ID do workshop selecionado
  const [showNewWorkshopDialog, setShowNewWorkshopDialog] = useState(false); // Estado booleano que controla a visibilidade do modal de novo workshop
  const [userProfile, setUserProfile] = useState<any>(null); // Estado com os dados de perfil do usuário logado
  const [loadingProfile, setLoadingProfile] = useState(true); // Estado que indica se o perfil do usuário ainda está sendo carregado
  const [workshopFilters, setWorkshopFilters] = useState<any>({}); // Estado que armazena os filtros aplicados à listagem de workshops
  const [isCreatingWorkshop, setIsCreatingWorkshop] = useState(false); // Estado de controle para evitar criação duplicada de workshops
  const { user } = useAuth(); // Obtém o usuário autenticado a partir do contexto de autenticação
  const { toast } = useToast(); // Obtém a função toast para exibir notificações na tela

  useEffect(() => { // Hook de efeito que reage a mudanças no usuário autenticado
    if (user) { // Se existir um usuário autenticado
      fetchUserProfile(); // Chama a função para buscar ou criar o perfil do usuário no Firestore
    }
  }, [user]); // Dependência do efeito. Executa sempre que o objeto user mudar

  const fetchUserProfile = async () => { // Função assíncrona responsável por buscar ou criar o perfil do usuário
    if (!user) return; // Se não houver usuário, encerra a função sem fazer nada
    try { // Bloco try para capturar possíveis erros na comunicação com o Firestore
      const profileRef = doc(db, 'profiles', user.uid); // Cria uma referência ao documento de perfil do usuário na coleção 'profiles'
      const profileSnap = await getDoc(profileRef); // Busca o documento de perfil no Firestore

      if (profileSnap.exists()) { // Verifica se o documento de perfil já existe
        const profileData = profileSnap.data(); // Obtém os dados do perfil do snapshot
        if (!('workspace_ids' in profileData)) { // Verifica se a propriedade workspace_ids não existe no documento
          await updateDoc(profileRef, { workspace_ids: [] }); // Atualiza o documento adicionando a propriedade workspace_ids como array vazio
          setUserProfile({ ...profileData, workspace_ids: [] }); // Atualiza o estado local com os dados do perfil incluindo workspace_ids vazio
        } else { // Caso workspace_ids já exista
          setUserProfile(profileData); // Apenas define o estado de perfil com os dados retornados
        }
      } 
      else { // Caso o documento de perfil não exista no Firestore
        console.warn("User profile not found in Firestore. Creating one..."); // Loga um aviso no console indicando que o perfil será criado
        const newProfile = { // Define o objeto de novo perfil para o usuário
            name: user.displayName || user.email, // Nome do usuário, usando o displayName ou o e-mail como fallback
            email: user.email, // E-mail do usuário
            access_type: 'user', // Tipo de acesso padrão definido como 'user'
            id: user.uid, // ID do usuário, usando o uid fornecido pela autenticação
            created_at: new Date(), // Data de criação do perfil no lado do cliente
            workspace_ids: [], // Lista de workspaces vinculados ao usuário, inicialmente vazia
        };
        await setDoc(profileRef, newProfile); // Cria o documento de perfil com os dados definidos em newProfile
        setUserProfile(newProfile); // Atualiza o estado com o novo perfil criado
        toast({ // Exibe uma notificação de boas-vindas ao usuário
            title: "Welcome!", // Título do toast de boas-vindas
            description: "Your user profile has been created.", // Mensagem informando que o perfil foi criado
        });
      }
    } catch (error: any) { // Captura qualquer erro que ocorra dentro do bloco try
      console.error('Error fetching or creating user profile:', error); // Loga o erro detalhado no console
      toast({ // Exibe um toast de erro para o usuário
        title: "Error", // Título do toast de erro
        description: "Failed to load or create your user profile.", // Mensagem informando falha ao carregar ou criar o perfil
        variant: "destructive", // Variante visual do toast para indicar erro
      });
    } finally { // Bloco executado independentemente de sucesso ou erro no try
      setLoadingProfile(false); // Marca que o carregamento do perfil foi concluído
    }
  };

  const handleWorkspaceSelect = (workspace: any) => { // Função chamada quando um workspace é selecionado na lista
    setSelectedWorkspace(workspace); // Armazena o workspace selecionado no estado
    setView('workshops'); // Atualiza a visão atual para a tela de workshops dentro do workspace
  };

  const handleWorkspaceSettings = (workspaceId: string) => { // Função que navega para a tela de gerenciamento de um workspace
    const workspace = { id: workspaceId }; // Cria um objeto simples de workspace com o ID informado
    setSelectedWorkspace(workspace); // Atualiza o estado com o workspace selecionado para configuração
    setView('workspace-management'); // Define a visão como gerenciamento de workspace
  };

  const handleSelectWorkshop = async (id: string) => { // Função assíncrona disparada ao selecionar um workshop na lista
    if (!id) { // Se nenhum ID foi passado
      setShowNewWorkshopDialog(true); // Abre o modal para criação de um novo workshop
      return; // Encerra a função para não prosseguir
    }

    try { // Bloco try para tratar possíveis erros ao carregar o workshop
      const workshopRef = doc(db, 'workshops', id); // Cria referência ao documento do workshop na coleção 'workshops'
      const workshopSnap = await getDoc(workshopRef); // Busca o documento do workshop pelo ID

      if (workshopSnap.exists()) { // Verifica se o workshop existe no Firestore
        const workshopData = workshopSnap.data(); // Obtém os dados do workshop a partir do snapshot
        let workspaceForWorkshop = null; // Inicializa a variável que representará o workspace associado ao workshop

        if (workshopData.workspace_id) { // Se o workshop tiver um workspace associado
          const workspaceRef = doc(db, 'workspaces', workshopData.workspace_id); // Cria referência ao documento do workspace pai
          const workspaceSnap = await getDoc(workspaceRef); // Busca o documento do workspace associado
          if (workspaceSnap.exists()) { // Se o workspace existir
            workspaceForWorkshop = { id: workspaceSnap.id, ...workspaceSnap.data() }; // Monta o objeto de workspace com ID e dados
          } else { // Caso o workspace não seja encontrado
            toast({ // Exibe um toast de erro para o usuário
              title: "Error", // Título do erro
              description: `The parent workspace for workshop "${workshopData.name}" was not found.`, // Mensagem indicando que o workspace pai não foi encontrado
              variant: "destructive", // Variante visual indicando erro
            });
          }
        }

        setSelectedWorkspace(workspaceForWorkshop); // Atualiza o estado com o workspace associado, se houver
        setSelectedWorkshopId(id); // Define o ID do workshop selecionado
        setView('canvas'); // Navega para a visão do canvas do workshop
      } 
      else { // Caso o documento do workshop não exista
        toast({ title: "Error", description: "Workshop not found.", variant: "destructive" }); // Exibe toast informando que o workshop não foi encontrado
      }
    } catch (error) { // Captura erros ocorridos na busca do workshop
      console.error("Error selecting workshop:", error); // Loga o erro no console
      toast({ title: "Error", description: "An error occurred while loading the workshop.", variant: "destructive" }); // Exibe toast genérico de erro ao carregar o workshop
    }
  };

  const handleCreateWorkshop = async (name: string, description: string, workspaceId: string | null = null) => { // Função assíncrona para criar um novo workshop
    if (!user || isCreatingWorkshop) return; // Se não há usuário ou já está em processo de criação, sai para evitar duplicidade

    setIsCreatingWorkshop(true); // Seta flag indicando que a criação está em andamento
    setShowNewWorkshopDialog(false); // Fecha o modal de novo workshop

    try { // Bloco try para tratar a criação do workshop
        const countedTemplates = defaultTemplates.filter(t => t.is_counted).length; // Conta quantos templates são considerados no total de etapas
        const workshopPayload = { // Monta o objeto com os dados a serem salvos para o workshop
            name, // Nome do workshop informado pelo usuário
            description, // Descrição do workshop informada pelo usuário
            created_by: user.uid, // ID do usuário criador do workshop
            participants: [user.email!], // Lista inicial de participantes contendo o e-mail do criador
            workspace_id: workspaceId, // ID do workspace ao qual o workshop pertence, se houver
            status: 'in_progress', // Status inicial do workshop definido como em progresso
            current_step: 1, // Passo atual do workshop definido como o primeiro
            total_steps: countedTemplates, // Total de passos baseado na quantidade de templates contados
            created_at: serverTimestamp(), // Timestamp do servidor para registro da criação
            updated_at: serverTimestamp(), // Timestamp do servidor para registro da última atualização
        };

        const workshopRef = await addDoc(collection(db, 'workshops'), workshopPayload); // Cria um novo documento na coleção 'workshops' com o payload definido
        
        const batch = writeBatch(db); // Cria um batch para operações em lote no Firestore
        const templatesCollectionRef = collection(db, 'workshops', workshopRef.id, 'templates'); // Referência à subcoleção 'templates' dentro do workshop recém-criado
        defaultTemplates.forEach(template => { // Itera sobre a lista de templates padrão
            const newTemplateRef = doc(templatesCollectionRef); // Cria uma referência para um novo documento de template na subcoleção
            batch.set(newTemplateRef, template); // Adiciona ao batch a operação de criação desse template com seus dados
        });
        await batch.commit(); // Executa todas as operações em lote no Firestore

        toast({ title: "Success", description: "Workshop created successfully." }); // Exibe toast indicando que o workshop foi criado com sucesso
        
        setSelectedWorkshopId(workshopRef.id); // Define o ID do workshop recém-criado como selecionado
        setView('canvas'); // Navega para a visão de canvas para edição do workshop

    } catch (error) { // Captura qualquer erro que aconteça durante a criação do workshop
        console.error("Error creating workshop:", error); // Loga o erro no console
        toast({ title: "Error", description: "Failed to create workshop.", variant: "destructive" }); // Exibe toast de erro informando falha na criação
    } finally { // Bloco executado independentemente do sucesso ou falha
        setIsCreatingWorkshop(false); // Reseta a flag indicando que a criação foi concluída
    }
  };

  const handleBackToWorkshops = () => { // Função para voltar da tela de canvas para a lista de workshops
    setView('workshops'); // Define a visão como 'workshops'
    setSelectedWorkshopId(null); // Limpa o ID do workshop selecionado
  };

  const handleBackToWorkspaces = () => { // Função para voltar da lista de workshops para a lista de workspaces
    setView('workspaces'); // Define a visão como 'workspaces'
    setSelectedWorkspace(null); // Remove o workspace selecionado
    setWorkshopFilters({}); // Limpa os filtros de workshops aplicados
  };

  const renderContent = () => { // Função que decide qual conteúdo renderizar de acordo com o estado 'view'
    switch (view) { // Estrutura switch para avaliar o valor de 'view'
      case 'canvas': // Caso a visão atual seja 'canvas'
        return ( // Retorna o componente de canvas do workshop
          <WorkshopCanvas
            onBack={handleBackToWorkshops} // Callback para voltar para a lista de workshops
            workshopId={selectedWorkshopId!} // Passa o ID do workshop selecionado, com non null assertion
            workspaceId={selectedWorkspace?.id || null} // Passa o ID do workspace ou null se não houver
            createdBy={user!.uid} // Passa o ID do usuário criador, assumindo que user não é nulo
          />
        );
      case 'admin': // Caso a visão atual seja 'admin'
        return userProfile?.access_type === 'admin' ? ( // Verifica se o perfil do usuário indica acesso de administrador
          <div className="container mx-auto px-4 py-6"> {/* Container com espaçamentos para o painel admin */}
            <AdminPanel /> {/* Componente de painel administrativo */}
          </div>
        ) : null; // Se não for admin, não renderiza nada
      case 'workspace-management': // Caso a visão seja de gerenciamento de workspace
        return selectedWorkspace ? ( // Renderiza apenas se houver um workspace selecionado
          <div className="container mx-auto px-4 py-6"> {/* Container estilizado para o conteúdo */}
            <WorkspaceManagement
              workspaceId={selectedWorkspace.id} // Passa o ID do workspace a ser gerenciado
              onBack={() => setView('workshops')} // Callback para voltar à visão de workshops
            />
          </div>
        ) : null; // Se não houver workspace selecionado, não renderiza nada
      case 'workspaces': // Caso a visão seja a lista de workspaces
        return ( // Retorna o seletor de workspaces
          <div className="container mx-auto px-4 py-8"> {/* Container centralizado com padding */}
            <WorkspaceSelector
              onSelectWorkspace={handleWorkspaceSelect} // Callback ao selecionar um workspace
              onWorkspaceSettings={handleWorkspaceSettings} // Callback para abrir a tela de configurações de um workspace
            />
          </div>
        );
      case 'workshops': // Caso a visão seja a lista de workshops
      default: // Valor padrão, caso 'view' não corresponda a nenhum caso anterior
        return ( // Retorna a tela de workshops
          <div className="container mx-auto px-4 py-8"> {/* Container principal da lista de workshops */}
            <div className="mb-4"> {/* Div com margem inferior para separar o botão do restante */}
              <Button onClick={handleBackToWorkspaces} variant="ghost" className="text-gray-600"> {/* Botão para voltar à lista de workspaces */}
                <ArrowLeft className="h-4 w-4 mr-2" /> {/* Ícone de seta para a esquerda antes do texto */}
                Back to Workspaces {/* Texto exibido no botão */}
              </Button>
            </div>
            <div className="space-y-6"> {/* Div que aplica espaçamento vertical entre os elementos internos */}
              <WorkshopFilters onFiltersChange={setWorkshopFilters} /> {/* Componente de filtros para workshops, que atualiza o estado de filtros */}
              <RecentWorkshops 
                onSelectWorkshop={handleSelectWorkshop}  // Callback disparado ao selecionar um workshop da lista
                filters={workshopFilters} // Filtros atuais aplicados na listagem de workshops
                workspaceId={selectedWorkspace?.id || null} // ID do workspace atual ou null se não houver
                onShowNewWorkshopDialog={() => setShowNewWorkshopDialog(true)} // Callback que abre o modal de novo workshop
              />
            </div>
          </div>
        );
    }
  };

  if (loadingProfile) { // Se o perfil ainda está sendo carregado
    return ( // Renderiza uma tela de loading
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center"> {/* Tela de fundo com gradiente e centralização */}
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-inception-blue"></div> {/* Indicador de carregamento animado em forma de spinner */}
      </div>
    );
  }

  if (!user) { // Se não existe usuário autenticado
    return ( // Renderiza uma tela informando que é necessário login
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center"> {/* Tela centralizada com gradiente */}
        <p>You must be logged in to access this page.</p> {/* Mensagem informando que o usuário precisa estar logado */}
      </div>
    );
  }

  return ( // Renderização principal do componente quando há usuário e o perfil já foi carregado
    <ConversationDialogProvider> {/* Provider que envolve toda a página para habilitar diálogos de conversa */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"> {/* Div principal com fundo em gradiente e altura mínima de tela */}
        {view !== 'canvas' && ( // Condicional que exibe o Header apenas quando a visão não é o canvas
          <Header 
            onNavigateToHome={handleBackToWorkspaces}  // Callback para navegar de volta aos workspaces ao acionar o botão home
            onNavigateToSettings={selectedWorkspace ? () => handleWorkspaceSettings(selectedWorkspace.id) : undefined} // Callback para configurações se houver workspace selecionado, caso contrário undefined
          />
        )}
        {renderContent()} {/* Chamada da função que decide qual conteúdo renderizar com base na visão atual */}
        <NewWorkshopDialog
          isOpen={showNewWorkshopDialog} // Indica se o modal de novo workshop está aberto
          onClose={() => setShowNewWorkshopDialog(false)} // Callback para fechar o modal
          onCreateWorkshop={(name, description) => handleCreateWorkshop(name, description, selectedWorkspace?.id || null)} // Callback de criação de workshop, passando nome, descrição e workspace atual se existir
          workspaceId={selectedWorkspace?.id || null} // ID do workspace no qual o workshop será criado ou null
        />
      </div>
    </ConversationDialogProvider>
  );
};

export default Index; // Exporta o componente Index como exportação padrão do módulo
