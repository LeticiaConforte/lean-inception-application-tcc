import React, { useState, useEffect, useRef } from 'react'; // Importa React e hooks para estado, efeitos colaterais e referências
import { Button } from '@/components/ui/button'; // Botão reutilizável da UI
import { db } from '@/integrations/firebase/client'; // Instância do Firestore configurada
import { useToast } from '@/hooks/use-toast'; // Hook para exibir toasts de feedback
import { useAuth } from '@/components/AuthProvider'; // Hook de autenticação do usuário
import TemplateSidebar from './TemplateSidebar'; // Sidebar de navegação entre templates
import Canvas from './Canvas'; // Área principal de edição do template
import CommentsDialog from './CommentsDialog'; // Diálogo de comentários por template
import WorkshopHeader from './WorkshopHeader'; // Cabeçalho com nome do workshop e ações
import { Toaster } from '@/components/ui/toaster'; // Componente que renderiza os toasts na tela
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  writeBatch,
  updateDoc,
} from 'firebase/firestore'; // Funções do Firestore para CRUD e consultas
import { TeamInviteDialog } from './TeamInviteDialog'; // Diálogo para convite de membros do workspace
import { WorkshopInviteDialog } from './WorkshopInviteDialog'; // Diálogo para convite de pessoas para o workshop
import { AIAssistant } from './AIAssistant'; // Painel lateral com assistente de IA
import { WorkshopVersionHistory } from './WorkshopVersionHistory'; // Histórico de versões das etapas
import { generateWorkshopReport, WorkshopReport as PdfReport } from '@/utils/workshopPdf'; // Função utilitária para gerar PDF do workshop
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Componentes de diálogo de alerta para confirmação de ações
import { RightSidebar } from './RightSidebar'; // Barra lateral direita com ações rápidas
import { useDialog } from './ConversationDialog'; // Hook para abrir o chat de conversa geral
import { defaultTemplates, DefaultTemplate } from '@/lib/defaultTemplates'; // Templates padrão usados ao criar um novo workshop ou preencher vazio

// Propriedades recebidas pelo componente principal WorkshopCanvas
interface WorkshopCanvasProps {
  onBack: () => void; // Função para voltar para a tela anterior
  workshopId: string | null; // ID do workshop, ou null ao criar um novo
  workspaceId: string | null; // ID do workspace associado, ou null para pessoal
  workshopName?: string; // Nome opcional do workshop ao criar um novo
  participants?: string[]; // Lista de e-mails dos participantes ao criar o workshop
  createdBy: string; // ID do usuário criador do workshop
}

// Estrutura de cada template armazenado no Firestore
interface Template {
  id: string; // ID do documento do template no Firestore
  step_number: number; // Número da etapa dentro do fluxo da Lean Inception
  template_name: string; // Nome do template. por exemplo 'Kickoff', 'Personas'
  content: any; // Conteúdo específico dessa etapa (post-its, textos etc.)
  is_locked: boolean; // Indica se a etapa está marcada como concluída. impede edição
  updated_at: any; // Data da última atualização do template
  is_counted: boolean; // Indica se a etapa entra na contagem de progresso
}

// Estrutura principal do workshop no Firestore
interface Workshop {
  id: string; // ID do documento do workshop
  name: string; // Nome do workshop
  created_by: string; // UID do criador
  workspace_id: string | null; // Workspace associado ou null para pessoal
  is_public: boolean; // Indica se o workshop é público
  share_token: string | null; // Token opcional para compartilhamento
  participants: string[]; // Lista de e-mails autorizados a visualizar
  status: string; // Estado do workshop. por exemplo 'in_progress' . 'completed'
  current_step: number; // Quantidade de etapas concluídas
  total_steps: number; // Quantidade total de etapas contáveis
}

// Componente principal que orquestra toda a experiência da tela de workshop
const WorkshopCanvas: React.FC<WorkshopCanvasProps> = ({
  onBack, // Callback de navegação para a tela anterior
  workshopId, // ID do workshop existente, ou null
  workspaceId, // ID do workspace, ou null
  workshopName = 'New Workshop', // Nome padrão caso não seja passado
  participants = [], // Lista padrão vazia de participantes
  createdBy, // ID do criador do workshop
}) => {
  const [workshop, setWorkshop] = useState<Workshop | null>(null); // Estado com os dados do workshop
  const [templates, setTemplates] = useState<Template[]>([]); // Lista de templates do workshop
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null); // Template atualmente selecionado para edição
  const [loading, setLoading] = useState(true); // Indica se os dados ainda estão sendo carregados
  const [saving, setSaving] = useState(false); // Indica se há operação de salvamento em andamento
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Controla se a sidebar de etapas está aberta
  const [isCommentsOpen, setIsCommentsOpen] = useState(false); // Controla se o diálogo de comentários está aberto
  const [isTeamInviteOpen, setIsTeamInviteOpen] = useState(false); // Controla se o diálogo de convite de workspace está aberto
  const [isWorkshopInviteOpen, setIsWorkshopInviteOpen] = useState(false); // Controla se o diálogo de convite para o workshop está aberto
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false); // Controla se o painel de IA está aberto
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Controla se o histórico de versões está aberto
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Marca se existem alterações não salvas no template atual
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false); // Controla se o diálogo de alerta de alterações não salvas está visível
  const [nextNavigationAction, setNextNavigationAction] = useState<(() => void) | null>(null); // Armazena a navegação a ser executada após decidir salvar ou descartar
  const [isExporting, setIsExporting] = useState(false); // Indica se a exportação para PDF está em andamento
  const [currentWorkspaceName, setCurrentWorkspaceName] = useState(''); // Nome do workspace atual, usado em convites

  const { toast } = useToast(); // Hook para exibir notificações
  const { user } = useAuth(); // Usuário autenticado
  const { openDialog } = useDialog(); // Função para abrir o chat geral
  const workshopCreated = useRef(false); // Flag para garantir que um novo workshop seja criado apenas uma vez

  // Carrega o nome do workspace, se houver workspaceId
  useEffect(() => {
    if (workspaceId) {
      const fetchWorkspaceName = async () => {
        const workspaceRef = doc(db, 'workspaces', workspaceId); // Referência ao documento do workspace
        const workspaceSnap = await getDoc(workspaceRef); // Busca o documento no Firestore
        if (workspaceSnap.exists()) {
          setCurrentWorkspaceName(workspaceSnap.data().name); // Atualiza o nome do workspace a partir do Firestore
        }
      };
      fetchWorkspaceName(); // Chama a função assíncrona
    }
  }, [workspaceId]); // Roda novamente se o workspaceId mudar

  // Decide se vai carregar um workshop existente ou criar um novo
  useEffect(() => {
    if (workshopId) {
      fetchWorkshopAndTemplates(workshopId); // Carrega dados de um workshop existente
    } else if (user && !workshopCreated.current) {
      workshopCreated.current = true; // Garante que o createNewWorkshop seja chamado apenas uma vez
      createNewWorkshop(); // Cria um novo workshop e seus templates padrão
    }
  }, [workshopId, user]); // Roda quando mudar o ID ou o usuário

  // Função para carregar workshop e seus templates a partir do Firestore
  const fetchWorkshopAndTemplates = async (id: string) => {
    setLoading(true); // Ativa loading enquanto busca dados
    try {
      const workshopRef = doc(db, 'workshops', id); // Referência ao documento do workshop
      const workshopSnap = await getDoc(workshopRef); // Busca os dados do workshop

      if (!workshopSnap.exists() || !user) {
        // Se o workshop não existir ou não houver usuário logado, mostra erro e volta
        toast({ title: "Error", description: "Workshop not found or access denied.", variant: "destructive" });
        onBack();
        return;
      }

      let workshopData = { id: workshopSnap.id, ...workshopSnap.data() } as Workshop; // Mapeia dados do documento para o tipo Workshop

      // Verifica se o usuário tem permissão para ver o workshop
      if (workshopData.created_by !== user.uid && !workshopData.participants?.includes(user.email || '') && !workshopData.is_public) {
        toast({ title: "Access Denied", description: "You don't have permission to view this workshop.", variant: "destructive" });
        onBack();
        return;
      }

      const templatesRef = collection(db, 'workshops', id, 'templates'); // Coleção de templates dentro do workshop
      const q = query(templatesRef, orderBy('step_number')); // Ordena os templates pelo número da etapa
      const templatesSnapshot = await getDocs(q); // Busca todos os templates ordenados

      // Mapeia os documentos para o tipo Template, garantindo defaults para is_locked e is_counted
      let templatesData = templatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        is_locked: doc.data().is_locked || false,
        is_counted: doc.data().is_counted === undefined ? doc.data().template_name !== 'Agenda' : doc.data().is_counted,
      }) as Template);

      // Se não houver templates, cria a partir dos templates padrão
      if (templatesData.length === 0) {
        console.log("No templates found, creating from default...");
        const batch = writeBatch(db); // Cria um batch para escrever em lote
        templatesData = defaultTemplates.map((template: DefaultTemplate) => {
          const newTemplateRef = doc(collection(db, 'workshops', id, 'templates')); // Gera um novo documento para cada template
          batch.set(newTemplateRef, template); // Adiciona a operação de escrita ao batch
          return { ...template, id: newTemplateRef.id, updated_at: new Date() }; // Retorna a versão em memória com ID
        });
        await batch.commit(); // Confirma todas as escritas em lote
      }

      const countableTemplates = templatesData.filter(t => t.is_counted); // Filtra as etapas que contam para o progresso
      const completedCount = countableTemplates.filter(t => t.is_locked).length; // Conta quantas etapas estão bloqueadas (concluídas)
      const allStepsCompleted = countableTemplates.length > 0 && completedCount === countableTemplates.length; // Verifica se todas as etapas contáveis estão concluídas
      const newStatus = allStepsCompleted ? 'completed' : 'in_progress'; // Define o novo status do workshop

      // Atualiza o workshop no Firestore se status, total_steps ou current_step estiverem desatualizados
      if (workshopData.status !== newStatus || workshopData.total_steps !== countableTemplates.length || workshopData.current_step !== completedCount) {
        const workshopRefUpdate = doc(db, 'workshops', id); // Referência para atualização
        await updateDoc(workshopRefUpdate, {
          status: newStatus,
          total_steps: countableTemplates.length,
          current_step: completedCount,
        });
        workshopData = {
          ...workshopData,
          status: newStatus,
          total_steps: countableTemplates.length,
          current_step: completedCount,
        };
      }

      // Se todas as etapas estiverem concluídas e ainda não existir um template de Workshop Report, adiciona
      if (allStepsCompleted && !templatesData.some(t => t.template_name === 'Workshop Report')) {
        templatesData.push({
          id: 'workshop-report',
          step_number: 14,
          template_name: 'Workshop Report',
          content: {},
          is_locked: true,
          is_counted: false,
          updated_at: new Date(),
        });
        templatesData.sort((a, b) => a.step_number - b.step_number); // Mantém a lista ordenada por step_number
      } else if (!allStepsCompleted) {
        // Se não estiver completo, garante que o Workshop Report não apareça na lista
        templatesData = templatesData.filter(t => t.template_name !== 'Workshop Report');
      }

      setWorkshop(workshopData); // Atualiza o estado do workshop
      setTemplates(templatesData); // Atualiza a lista de templates

      if (templatesData.length > 0) {
        setSelectedTemplate(templatesData[0]); // Seleciona a primeira etapa como padrão
      }

    } catch (error: any) {
      console.error('Error fetching workshop:', error);
      toast({
        title: "Error",
        description: "Failed to load workshop data: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false); // Desativa loading independente de sucesso ou erro
    }
  };

  // Cria um novo workshop com templates padrão
  const createNewWorkshop = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a workshop.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true); // Ativa loading enquanto cria o workshop
    try {
      const countableTemplates = defaultTemplates.filter((t: DefaultTemplate) => t.is_counted); // Calcula quantas etapas contam para o progresso
      const newWorkshopRef = await addDoc(collection(db, 'workshops'), {
        name: workshopName,
        created_by: createdBy,
        workspace_id: workspaceId,
        participants: participants,
        is_public: false,
        share_token: null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        status: 'in_progress',
        current_step: 0,
        total_steps: countableTemplates.length,
      });

      const batch = writeBatch(db); // Batch para salvar todos os templates em lote
      const newTemplates = defaultTemplates.map((template: DefaultTemplate) => {
        const newTemplateRef = doc(collection(db, 'workshops', newWorkshopRef.id, 'templates')); // Documento individual de template
        batch.set(newTemplateRef, template); // Adiciona ao batch
        return { id: newTemplateRef.id, ...template, updated_at: new Date() }; // Versão em memória do template
      });
      await batch.commit(); // Persiste todos os templates

      const newWorkshopDoc = await getDoc(newWorkshopRef); // Recarrega o documento do workshop recém criado
      const newWorkshopData = { id: newWorkshopDoc.id, ...newWorkshopDoc.data() } as Workshop; // Mapeia para tipo Workshop

      setWorkshop(newWorkshopData); // Armazena o workshop no estado
      setTemplates(newTemplates); // Armazena os templates padrão com IDs
      setSelectedTemplate(newTemplates[0]); // Seleciona a primeira etapa

      toast({
        title: "Workshop Created",
        description: `Successfully created "${workshopName}".`,
      });
    } catch (error: any) {
      console.error('Error creating workshop:', error);
      toast({
        title: "Error",
        description: "Failed to create new workshop: " + error.message,
        variant: "destructive",
      });
      onBack(); // Em caso de falha, volta para tela anterior
    } finally {
      setLoading(false); // Desativa loading
    }
  };

  // Salva alterações do template atual no Firestore
  const handleSave = async () => {
    if (!workshop || !selectedTemplate) return;
    
    setSaving(true); // Indica que o salvamento está em andamento
    try {
      const templateRef = doc(
        db,
        'workshops',
        workshop.id,
        'templates',
        selectedTemplate.id,
      ); // Referência ao template atual
      await updateDoc(templateRef, {
        content: selectedTemplate.content,
        updated_at: serverTimestamp(),
      }); // Atualiza o conteúdo e a data de atualização

      const workshopRef = doc(db, 'workshops', workshop.id); // Referência ao workshop
      await updateDoc(workshopRef, { updated_at: serverTimestamp() }); // Atualiza a data de atualização do workshop
      
      const updatedTemplates = templates.map(t => (t.id === selectedTemplate.id ? selectedTemplate : t)); // Atualiza o template na lista em memória
      setTemplates(updatedTemplates); // Atualiza estado com a nova lista

      setHasUnsavedChanges(false); // Marca que não há mais alterações pendentes

      toast({
        title: "Saved!",
        description: `Your changes to "${selectedTemplate.template_name}" have been saved.`,
      });
    } catch (error: any) {
      console.error('Error saving workshop:', error);
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false); // Conclui o salvamento
    }
  };

  // Renomeia o workshop no Firestore
  const handleRenameWorkshop = async (newName: string) => {
    if (!workshop) return;
    const workshopRef = doc(db, 'workshops', workshop.id); // Referência ao workshop
    try {
      await updateDoc(workshopRef, { name: newName }); // Atualiza o nome
      setWorkshop({ ...workshop, name: newName }); // Atualiza o estado local
      toast({ title: 'Renamed', description: 'Workshop has been renamed.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not rename workshop.',
        variant: 'destructive',
      });
    }
  };

  // Marca ou desmarca a etapa atual como concluída
  const handleMarkComplete = async () => {
    if (!selectedTemplate || !workshop || hasUnsavedChanges) {
      // Se tiver alterações não salvas, avisa o usuário
      if (hasUnsavedChanges) {
        toast({
          title: "Unsaved Changes",
          description: "Please save your changes before marking this step as complete.",
          variant: "destructive",
        });
      }
      return;
    }

    // Agenda e Workshop Report não podem ser marcados como concluídos
    if (selectedTemplate.template_name === 'Agenda' || selectedTemplate.template_name === 'Workshop Report') {
      return;
    }

    const newLockedState = !selectedTemplate.is_locked; // Inverte o estado bloqueado
    const templateRef = doc(db, 'workshops', workshop.id, 'templates', selectedTemplate.id); // Referência ao template

    try {
      await updateDoc(templateRef, { is_locked: newLockedState }); // Atualiza o campo is_locked
      
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id ? { ...t, is_locked: newLockedState } : t
      ); // Gera nova lista de templates com estado atualizado
      setTemplates(updatedTemplates); // Atualiza estado global dos templates

      const updatedSelectedTemplate = { ...selectedTemplate, is_locked: newLockedState }; // Atualiza o template selecionado
      setSelectedTemplate(updatedSelectedTemplate); // Salva no estado

      // Recalcula progresso do workshop após marcar a etapa
      const countableTemplates = updatedTemplates.filter(t => t.is_counted); // Etapas que contam
      const completedCount = countableTemplates.filter(t => t.is_locked).length; // Quantidade concluída
      const allStepsCompleted = countableTemplates.length > 0 && completedCount === countableTemplates.length; // Se todas foram concluídas
      const newStatus = allStepsCompleted ? 'completed' : 'in_progress'; // Novo status

      const workshopRefUpdate = doc(db, 'workshops', workshop.id); // Referência para atualizar workshop
      await updateDoc(workshopRefUpdate, {
        status: newStatus,
        current_step: completedCount
      }); // Atualiza status e passo atual

      setWorkshop(prev => prev ? { ...prev, status: newStatus, current_step: completedCount } : null); // Atualiza estado do workshop

      // Adiciona ou remove o template de Workshop Report conforme a conclusão
      if (allStepsCompleted && !updatedTemplates.some(t => t.template_name === 'Workshop Report')) {
        const reportTemplate = {
          id: 'workshop-report',
          step_number: 14,
          template_name: 'Workshop Report',
          content: {},
          is_locked: true,
          is_counted: false,
          updated_at: new Date(),
        };
        const finalTemplates = [...updatedTemplates, reportTemplate].sort((a,b) => a.step_number - b.step_number); // Insere e ordena
        setTemplates(finalTemplates);
      } else if (!allStepsCompleted) {
        setTemplates(updatedTemplates.filter(t => t.template_name !== 'Workshop Report')); // Remove caso volte a ficar incompleto
      }

      toast({
        title: `Step ${newLockedState ? 'Completed' : 'Re-opened'}`,
        description: `Step "${selectedTemplate.template_name}" has been ${newLockedState ? 'marked as complete' : 're-opened'}.`,
      });

    } catch (error) {
      console.error('Error updating template lock state:', error);
      toast({
        title: 'Error',
        description: 'Could not update step completion status.',
        variant: 'destructive',
      });
    }
  };

  // Atualiza o conteúdo do template atual em memória e marca que há alterações não salvas
  const onTemplateChange = (newContent: any) => {
    if (selectedTemplate && !selectedTemplate.is_locked) {
      const originalTemplate = templates.find(t => t.id === selectedTemplate.id); // Template original para comparação
      if (JSON.stringify(originalTemplate?.content) !== JSON.stringify(newContent)) {
        setSelectedTemplate({ ...selectedTemplate, content: newContent }); // Atualiza conteúdo do template em edição
        setHasUnsavedChanges(true); // Marca que existem mudanças ainda não persistidas
      }
    }
  };

  // Envolve ações de navegação para checar se há alterações não salvas
  const executeNavigation = (action: () => void) => {
    if (hasUnsavedChanges) {
      setNextNavigationAction(() => action); // Guarda a ação de navegação
      setShowUnsavedChangesDialog(true); // Abre o diálogo de confirmação
    } else {
      action(); // Se não tiver alterações pendentes, navega direto
    }
  };

  // Troca o template selecionado, respeitando alerta de alterações não salvas
  const onSelectTemplate = (template: Template) => {
    executeNavigation(() => {
      setSelectedTemplate(template); // Atualiza o template selecionado
      setHasUnsavedChanges(false); // Limpa flag de alterações pendentes
    });
  };

  // Navega para o próximo template na lista
  const handleNext = () => {
    if (!selectedTemplate) return;
    const currentIndex = templates.findIndex(t => t.id === selectedTemplate.id); // Posição atual
    if (currentIndex < templates.length - 1) {
      onSelectTemplate(templates[currentIndex + 1]); // Seleciona o próximo
    }
  };

  // Navega para o template anterior
  const handlePrev = () => {
    if (!selectedTemplate) return;
    const currentIndex = templates.findIndex(t => t.id === selectedTemplate.id); // Posição atual
    if (currentIndex > 0) {
      onSelectTemplate(templates[currentIndex - 1]); // Seleciona o anterior
    }
  };
  
  // Volta para a tela anterior. mas verifica alterações não salvas
  const handleBackWithCheck = () => {
    executeNavigation(onBack); // Usa a lógica centralizada de navegação
  };

  // Usuário escolhe salvar antes de continuar navegação
  const handleConfirmSave = async () => {
    await handleSave(); // Salva o template atual
    if (nextNavigationAction) {
      nextNavigationAction(); // Executa ação de navegação armazenada
    }
    setShowUnsavedChangesDialog(false); // Fecha o diálogo
    setNextNavigationAction(null); // Limpa ação pendente
  };
  
  // Usuário escolhe descartar mudanças e continuar navegando
  const handleDiscardChanges = () => {
    const originalTemplate = templates.find(t => t.id === selectedTemplate?.id); // Recupera template original da lista
    if (originalTemplate) {
      setSelectedTemplate(originalTemplate); // Restaura conteúdo original
    }
    setHasUnsavedChanges(false); // Limpa flag de alterações
    if (nextNavigationAction) {
      nextNavigationAction(); // Executa navegação armazenada
    }
    setShowUnsavedChangesDialog(false); // Fecha diálogo
    setNextNavigationAction(null); // Limpa referência da ação
  };

  // Exporta o workshop para um PDF usando generateWorkshopReport
  const handleExport = async () => {
    if (!workshop) return;
    if (isExporting) return; // Evita exportações concorrentes

    setIsExporting(true); // Marca estado de exportação
    toast({ title: 'Exporting Workshop', description: 'Generating PDF...' });

    try {
      const filteredTemplates = templates.filter(t => t.template_name !== 'Workshop Report'); // Remove o template de relatório interno
      
      const reportData: PdfReport = {
        title: "Workshop Report", // Título do relatório
        workshop: workshop.name, // Nome do workshop
        templates: filteredTemplates.map(t => ({
          name: t.template_name,
          step: t.step_number,
          content: t.content,
        })), // Converte templates para estrutura usada pelo gerador de PDF
        status: workshop.status, // Status atual (in progress ou completed)
        steps: `${workshop.current_step} / ${workshop.total_steps}`, // Progresso formatado
        generatedAt: new Date().toLocaleDateString('pt-BR'), // Data de geração em formato brasileiro
        participants: workshop.participants, // Participantes do workshop
      };

      const pdf = generateWorkshopReport(reportData, {
        brandName: "Lean Inception",
      }); // Gera o PDF com branding

      pdf.save(`workshop-report-${workshop.name.replace(/\s+/g, '_').toLowerCase()}.pdf`); // Faz download do arquivo com nome amigável

      toast({ title: 'Export Successful', description: 'PDF generated.' });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Export Failed',
        description: error?.message ?? 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false); // Finaliza estado de exportação
    }
  };

  // Tela de loading. mostrada enquanto dados do workshop estão sendo carregados ou criados
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-inception-blue"></div> {/* Spinner animado */}
        <p className="ml-4 text-lg font-semibold">Loading Workshop...</p> {/* Mensagem de carregamento */}
      </div>
    );
  }

  // Caso não consiga carregar workshop ou template selecionado, exibe mensagem de erro e botão para voltar
  if (!workshop || !selectedTemplate) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg font-semibold text-red-600">Workshop could not be loaded.</p> {/* Mensagem de erro */}
        <Button onClick={onBack} className="ml-4">Go Back</Button> {/* Botão para voltar */}
      </div>
    );
  }

  const selectedIndex = templates.findIndex(t => t.id === selectedTemplate?.id); // Índice do template atualmente selecionado na lista

  // Estrutura principal da tela do workshop
  return (
    <div
      id={`workshop-canvas-${workshop.id}`} // ID único para o container do workshop. útil para prints ou captura de tela
      className="h-screen w-screen bg-gray-50 flex flex-col overflow-hidden" // Layout full screen com fundo cinza claro
    >
      <WorkshopHeader
        workshopName={workshop.name} // Nome atual do workshop
        templateName={selectedTemplate.template_name} // Nome da etapa atual
        onBack={handleBackWithCheck} // Voltar com checagem de alterações não salvas
        onSave={handleSave} // Ação para salvar alterações
        saving={saving} // Indica se está salvando
        hasUnsavedChanges={hasUnsavedChanges} // Informa se há alterações pendentes
        isTemplateCompleted={selectedTemplate.is_locked} // Informa se a etapa está concluída
        onRename={handleRenameWorkshop} // Callback para renomear workshop
        onMarkComplete={handleMarkComplete} // Callback para marcar etapa como concluída ou reabrir
      />

      <div className="flex-grow flex overflow-hidden"> {/* Área principal de conteúdo. ocupando todo o restante da tela */}
        <main className="flex-1 bg-gray-50 overflow-y-auto"> {/* Coluna central com o Canvas e rolagem vertical */}
          <Canvas
            template={selectedTemplate} // Template atual para renderização
            templates={templates} // Lista completa de templates. usada por alguns templates como contexto
            workshopName={workshop.name} // Nome do workshop. usado em alguns templates
            participants={workshop.participants} // Lista de participantes. usada em templates como Kickoff ou Agenda
            onTemplateChange={onTemplateChange} // Callback disparado quando conteúdo do template muda
            onNext={handleNext} // Navega para a próxima etapa
            onPrev={handlePrev} // Navega para a etapa anterior
            isFirst={selectedIndex === 0} // Indica se está na primeira etapa
            isLast={selectedIndex === templates.length - 1} // Indica se está na última etapa
            onOpenComments={() => setIsCommentsOpen(true)} // Abre o diálogo de comentários
            onGoToTemplate={() => {}} // Nesta versão não há navegação direta a partir do Canvas
          />
        </main>

        <div className="flex border-l border-gray-200"> {/* Barra lateral direita com botão de abrir sidebar e ações */}
          <RightSidebar
            onOpenTeamInvite={() => setIsTeamInviteOpen(true)} // Abre diálogo para convidar membros do workspace
            onOpenWorkshopInvite={() => setIsWorkshopInviteOpen(true)} // Abre diálogo para convidar pessoas para o workshop
            onOpenAIAssistant={() => setIsAIAssistantOpen(true)} // Abre painel do assistente de IA
            onOpenHistory={() => setIsHistoryOpen(true)} // Abre histórico de versões
            onOpenChat={openDialog} // Abre o chat geral de conversa
            onOpenExport={handleExport} // Ação de exportar para PDF
            isExporting={isExporting} // Indica se exportação está em andamento
            isTeamInviteDisabled={!workspaceId} // Desabilita team invite quando não há workspace
            isWorkshopReport={selectedTemplate.template_name === 'Workshop Report'} // Habilita botão de export apenas no relatório
            isSidebarOpen={isSidebarOpen} // Estado atual da sidebar de etapas
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} // Alterna abertura da sidebar
          />

          {isSidebarOpen && (
            <aside className="bg-white w-64 p-4 flex flex-col overflow-y-auto transition-all duration-300"> {/* Sidebar com lista de etapas */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Steps</h2> {/* Título da lista de etapas */}
              </div>
              <TemplateSidebar
                templates={templates} // Lista completa de templates
                selectedTemplate={selectedTemplate} // Template atualmente selecionado
                onSelectTemplate={onSelectTemplate} // Callback para trocar etapa
              />
            </aside>
          )}
        </div>
      </div>

      {selectedTemplate && workshop && (
        <CommentsDialog
          open={isCommentsOpen} // Controla abertura do diálogo de comentários
          onOpenChange={setIsCommentsOpen} // Atualiza estado ao abrir ou fechar
          workshopId={workshop.id} // ID do workshop
          templateId={selectedTemplate.id} // ID do template atual
          templateName={selectedTemplate.template_name} // Nome da etapa atual
        />
      )}
      
      {workspaceId && (
        <TeamInviteDialog
          isOpen={isTeamInviteOpen} // Controla abertura do diálogo de convite de workspace
          onClose={() => setIsTeamInviteOpen(false)} // Fecha diálogo
          workspaceId={workspaceId} // ID do workspace atual
          workspaceName={currentWorkspaceName} // Nome do workspace atual
          onMemberAdded={() => workshopId && fetchWorkshopAndTemplates(workshopId)} // Recarrega dados se um membro for adicionado
        />
      )}
      
      {workshop && (
        <WorkshopInviteDialog
          isOpen={isWorkshopInviteOpen} // Controla abertura do diálogo de convite ao workshop
          onClose={() => setIsWorkshopInviteOpen(false)} // Fecha diálogo
          workshopId={workshop.id} // ID do workshop atual
          workshopName={workshop.name} // Nome do workshop atual
        />
      )}

      <AIAssistant
        open={isAIAssistantOpen} // Controla painel do assistente de IA
        onOpenChange={setIsAIAssistantOpen} // Atualiza estado de abertura
        workshopId={workshop.id} // Passa ID do workshop para contexto da IA
      />
      <WorkshopVersionHistory
        open={isHistoryOpen} // Controla abertura do painel de histórico de versões
        onOpenChange={setIsHistoryOpen} // Atualiza estado do histórico
        workshopId={workshop.id} // ID do workshop. reservado para futuras consultas de versões
        templateName={selectedTemplate?.template_name || ''} // Nome da etapa atual para exibição
      />
      <AlertDialog
        open={showUnsavedChangesDialog} // Controla diálogo de alerta de alterações não salvas
        onOpenChange={setShowUnsavedChangesDialog} // Atualiza estado ao abrir ou fechar
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes</AlertDialogTitle> {/* Título do alerta */}
            <AlertDialogDescription>
              Do you want to save your changes before proceeding?
            </AlertDialogDescription> {/* Pergunta ao usuário o que fazer com as alterações */}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNextNavigationAction(null)}>Cancel</AlertDialogCancel> {/* Cancela navegação e fecha diálogo */}
            <Button variant="outline" onClick={handleDiscardChanges}>Discard and Continue</Button> {/* Descarta mudanças e segue navegação */}
            <AlertDialogAction onClick={handleConfirmSave}>Save and Continue</AlertDialogAction> {/* Salva e segue navegação */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster /> {/* Componente global de toasts. deve ficar no final para renderizar notificações */}
    </div>
  );
};

export default WorkshopCanvas; // Exporta o componente para uso em outras partes da aplicação
