import React, { useState, useEffect, useRef } from 'react'; // Importa o React e os hooks useState, useEffect e useRef para gerenciar estado, efeitos colaterais e referências
import { Button } from '@/components/ui/button'; // Importa o componente de botão reutilizável da UI
import { db } from '@/integrations/firebase/client'; // Importa a instância do Firestore configurada para o projeto
import { useToast } from '@/hooks/use-toast'; // Hook customizado para exibir notificações (toasts)
import { useAuth } from '@/components/AuthProvider'; // Hook de contexto para acessar o usuário autenticado
import TemplateSidebar from './TemplateSidebar'; // Componente da sidebar com a lista de etapas/templates
import Canvas from './Canvas'; // Componente principal de edição/visualização do conteúdo do template
import CommentsDialog from './CommentsDialog'; // Diálogo de comentários associados ao template
import WorkshopHeader from './WorkshopHeader'; // Cabeçalho do workshop (nome, ações, salvar, etc.)
import { Toaster } from '@/components/ui/toaster'; // Componente global responsável por renderizar os toasts
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
} from 'firebase/firestore'; // Funções do Firestore para CRUD de documentos, consultas, batch e timestamps
import { TeamInviteDialog } from './TeamInviteDialog'; // Diálogo para convidar membros para o workspace
import { WorkshopInviteDialog } from './WorkshopInviteDialog'; // Diálogo para convidar pessoas para o workshop via link/convite
import { AIAssistant } from './AIAssistant'; // Componente do assistente de IA acoplado ao workshop
import { WorkshopVersionHistory } from './WorkshopVersionHistory'; // Componente que exibe o histórico de versões do workshop
import { generateWorkshopReport, WorkshopReport as PdfReport } from '@/utils/workshopPdf'; // Função utilitária que gera o PDF do workshop e tipo de dados esperado
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Componentes de UI para o diálogo de alerta (unsaved changes)
import { RightSidebar } from './RightSidebar'; // Componente da sidebar direita com ações (AI, exportar, invites, etc.)
import { useDialog } from './ConversationDialog'; // Hook para abrir o diálogo de conversa/IA global
import { defaultTemplates, DefaultTemplate } from '@/lib/defaultTemplates'; // Templates padrão do workshop e tipo correspondente

// Tipagem das props recebidas pelo componente WorkshopCanvas
interface WorkshopCanvasProps {
  onBack: () => void; // Função chamada quando o usuário quer voltar (sair do canvas)
  workshopId: string | null; // ID do workshop existente. Se null, um novo será criado
  workspaceId: string | null; // ID do workspace ao qual o workshop pertence ou null
  workshopName?: string; // Nome inicial do workshop (para criação). Opcional
  participants?: string[]; // Lista inicial de participantes do workshop
  createdBy: string; // ID do usuário criador do workshop
}

// Tipagem da estrutura de um template no Firestore
interface Template {
  id: string; // ID do documento do template
  step_number: number; // Número da etapa no fluxo do Lean Inception
  template_name: string; // Nome do template (ex: Product Vision, Personas, etc.)
  content: any; // Conteúdo específico daquele template (post-its, textos, etc.)
  is_locked: boolean; // Indica se a etapa está marcada como concluída (não editável)
  updated_at: any; // Data da última atualização do template
  is_counted: boolean; // Indica se essa etapa conta para o total de passos (exclui Agenda, Workshop Report, etc.)
}

// Tipagem da estrutura de um workshop no Firestore
interface Workshop {
  id: string; // ID do workshop
  name: string; // Nome do workshop
  created_by: string; // ID do usuário que criou o workshop
  workspace_id: string | null; // ID do workspace associado ou null
  is_public: boolean; // Se o workshop é público ou não
  share_token: string | null; // Token usado para compartilhamento (link público) se houver
  participants: string[]; // Lista de e-mails de participantes do workshop
  status: string; // Status atual: in_progress, completed, etc.
  current_step: number; // Quantidade de etapas concluídas
  total_steps: number; // Quantidade total de etapas contadas
}

// Declaração do componente principal WorkshopCanvas como Function Component
const WorkshopCanvas: React.FC<WorkshopCanvasProps> = ({
  onBack, // Função para retornar à tela anterior
  workshopId, // ID do workshop existente (se houver)
  workspaceId, // ID do workspace em que o workshop está
  workshopName = 'New Workshop', // Nome padrão do workshop, caso não seja passado
  participants = [], // Lista padrão de participantes, vazia por padrão
  createdBy, // ID do usuário criador
}) => {
  const [workshop, setWorkshop] = useState<Workshop | null>(null); // Estado com os dados do workshop atual carregado
  const [templates, setTemplates] = useState<Template[]>([]); // Estado com a lista de templates (etapas) do workshop
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null); // Template atualmente selecionado para edição
  const [loading, setLoading] = useState(true); // Estado de carregamento do workshop e templates
  const [saving, setSaving] = useState(false); // Estado indicando se uma operação de salvar está em andamento
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Controle de abertura/fechamento da sidebar de etapas
  const [isCommentsOpen, setIsCommentsOpen] = useState(false); // Controle de abertura do diálogo de comentários
  const [isTeamInviteOpen, setIsTeamInviteOpen] = useState(false); // Controle de abertura do diálogo para invites de time/workspace
  const [isWorkshopInviteOpen, setIsWorkshopInviteOpen] = useState(false); // Controle de abertura do diálogo de invite específico do workshop
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false); // Controle de abertura do assistente de IA
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Controle de abertura do histórico de versões
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Flag indicando se existem alterações não salvas no template selecionado
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false); // Indica se o diálogo de "unsaved changes" deve ser exibido
  const [nextNavigationAction, setNextNavigationAction] = useState<(() => void) | null>(null); // Armazena a ação que será executada após lidar com alterações não salvas
  const [isExporting, setIsExporting] = useState(false); // Indica se a exportação para PDF está em andamento
  const [currentWorkspaceName, setCurrentWorkspaceName] = useState(''); // Nome do workspace atual, usado no TeamInviteDialog

  const { toast } = useToast(); // Obtém a função para disparar toasts
  const { user } = useAuth(); // Usuário autenticado atual
  const { openDialog } = useDialog(); // Função para abrir o diálogo de chat/conversa global
  const workshopCreated = useRef(false); // Ref para garantir que um novo workshop não seja criado múltiplas vezes

  useEffect(() => {
    if (workspaceId) { // Se houver workspaceId, buscamos o nome do workspace
      const fetchWorkspaceName = async () => { // Função assíncrona para buscar o nome do workspace
        const workspaceRef = doc(db, 'workspaces', workspaceId); // Referência ao documento do workspace
        const workspaceSnap = await getDoc(workspaceRef); // Busca o documento no Firestore
        if (workspaceSnap.exists()) { // Se o documento existe
          setCurrentWorkspaceName(workspaceSnap.data().name); // Atualiza o nome do workspace no estado
        }
      };
      fetchWorkspaceName(); // Chama a função para carregar o nome do workspace
    }
  }, [workspaceId]); // Reexecuta o efeito quando o workspaceId mudar

  useEffect(() => {
    if (workshopId) { // Se um workshopId foi fornecido, carregamos os dados do workshop existente
      fetchWorkshopAndTemplates(workshopId); // Chama função assíncrona para carregar workshop e templates
    } else if (user && !workshopCreated.current) { // Se não há workshopId, mas temos usuário autenticado e ainda não criamos um workshop
      workshopCreated.current = true; // Marca que já criamos o workshop para não duplicar
      createNewWorkshop(); // Cria um novo workshop com base nos templates padrão
    }
  }, [workshopId, user]); // Reage a mudanças no workshopId ou no usuário

  // Função que busca os dados do workshop e seus templates a partir do Firestore
  const fetchWorkshopAndTemplates = async (id: string) => {
    setLoading(true); // Ativa estado de loading
    try {
      const workshopRef = doc(db, 'workshops', id); // Referência ao documento do workshop
      const workshopSnap = await getDoc(workshopRef); // Busca o workshop no Firestore

      if (!workshopSnap.exists() || !user) { // Se o workshop não existir ou não houver usuário autenticado
        toast({ title: "Error", description: "Workshop not found or access denied.", variant: "destructive" }); // Exibe erro
        onBack(); // Volta para a tela anterior
        return; // Encerra a função
      }

      let workshopData = { id: workshopSnap.id, ...workshopSnap.data() } as Workshop; // Monta objeto Workshop com id + dados do Firestore

      // Verifica se o usuário atual tem permissão para visualizar o workshop
      if (workshopData.created_by !== user.uid && !workshopData.participants?.includes(user.email || '') && !workshopData.is_public) {
        toast({ title: "Access Denied", description: "You don't have permission to view this workshop.", variant: "destructive" }); // Exibe erro de acesso
        onBack(); // Volta para tela anterior
        return; // Encerra
      }

      const templatesRef = collection(db, 'workshops', id, 'templates'); // Referência à subcoleção de templates do workshop
      const q = query(templatesRef, orderBy('step_number')); // Monta query para ordenar templates por step_number
      const templatesSnapshot = await getDocs(q); // Executa a query e obtém os templates

      let templatesData = templatesSnapshot.docs.map(doc => ({
        id: doc.id, // ID do template
        ...doc.data(), // Dados do documento
        is_locked: doc.data().is_locked || false, // Garante que is_locked tenha valor booleano (default false)
        is_counted: doc.data().is_counted === undefined ? doc.data().template_name !== 'Agenda' : doc.data().is_counted, // Se is_counted não existir, considera todas exceto Agenda como contáveis
      }) as Template); // Tipagem como Template

      if (templatesData.length === 0) { // Se não há templates ainda para esse workshop
        console.log("No templates found, creating from default..."); // Log informativo
        const batch = writeBatch(db); // Cria batch para operações em lote
        templatesData = defaultTemplates.map((template: DefaultTemplate) => { // Para cada template padrão
          const newTemplateRef = doc(collection(db, 'workshops', id, 'templates')); // Cria referência para novo documento de template
          batch.set(newTemplateRef, template); // Adiciona operação de criação ao batch
          return { ...template, id: newTemplateRef.id, updated_at: new Date() }; // Retorna versão do template com id local e updated_at
        });
        await batch.commit(); // Confirma o batch e cria todos os templates de uma vez
      }

      const countableTemplates = templatesData.filter(t => t.is_counted); // Filtra apenas as etapas que contam para o progresso
      const completedCount = countableTemplates.filter(t => t.is_locked).length; // Conta quantas dessas etapas já estão concluídas
      const allStepsCompleted = countableTemplates.length > 0 && completedCount === countableTemplates.length; // Verifica se todas as etapas contáveis foram concluídas
      const newStatus = allStepsCompleted ? 'completed' : 'in_progress'; // Define novo status do workshop com base nas etapas

      // Atualiza status, total_steps e current_step no Firestore se estiverem desatualizados
      if (workshopData.status !== newStatus || workshopData.total_steps !== countableTemplates.length || workshopData.current_step !== completedCount) {
        const workshopRefUpdate = doc(db, 'workshops', id); // Referência ao workshop para update
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

      // Se todas as etapas estiverem concluídas, adiciona um template "Workshop Report" caso ainda não exista
      if (allStepsCompleted && !templatesData.some(t => t.template_name === 'Workshop Report')) {
        templatesData.push({
          id: 'workshop-report', // ID fixo para o template de relatório (apenas na UI)
          step_number: 14, // Step fixo para a posição do relatório
          template_name: 'Workshop Report', // Nome do template
          content: {}, // Conteúdo inicial vazio
          is_locked: true, // Relatório é travado, não editável
          is_counted: false, // Não conta como etapa
          updated_at: new Date(), // Data local de criação
        });
        templatesData.sort((a, b) => a.step_number - b.step_number); // Garante ordem pelo step_number
      } else if (!allStepsCompleted) {
        // Se não estiver tudo completo, remove o template "Workshop Report" se existir
        templatesData = templatesData.filter(t => t.template_name !== 'Workshop Report');
      }

      setWorkshop(workshopData); // Atualiza estado do workshop
      setTemplates(templatesData); // Atualiza lista de templates

      if (templatesData.length > 0) { // Se há templates
        setSelectedTemplate(templatesData[0]); // Seleciona o primeiro template da lista
      }

    } catch (error: any) {
      console.error('Error fetching workshop:', error); // Loga erro no console
      toast({
        title: "Error",
        description: "Failed to load workshop data: " + error.message, // Mensagem detalhada do erro
        variant: "destructive",
      });
    } finally {
      setLoading(false); // Desliga estado de loading independentemente de sucesso ou erro
    }
  };

  // Função responsável por criar um novo workshop com os templates padrão
  const createNewWorkshop = async () => {
    if (!user) { // Se não há usuário autenticado
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a workshop.", // Mensagem informando a necessidade de login
        variant: "destructive",
      });
      return; // Encerra a função
    }
    setLoading(true); // Ativa loading
    try {
      const countableTemplates = defaultTemplates.filter((t: DefaultTemplate) => t.is_counted); // Lista de templates contáveis
      const newWorkshopRef = await addDoc(collection(db, 'workshops'), { // Cria novo documento de workshop no Firestore
        name: workshopName, // Nome do workshop
        created_by: createdBy, // ID do criador
        workspace_id: workspaceId, // Workspace associado
        participants: participants, // Participantes iniciais
        is_public: false, // Começa como não público
        share_token: null, // Sem token de compartilhamento inicial
        created_at: serverTimestamp(), // Timestamp de criação gerado pelo servidor
        updated_at: serverTimestamp(), // Timestamp de atualização
        status: 'in_progress', // Status inicial em progresso
        current_step: 0, // Nenhuma etapa concluída
        total_steps: countableTemplates.length, // Número total de etapas contáveis
      });

      const batch = writeBatch(db); // Cria um batch para criar todos os templates
      const newTemplates = defaultTemplates.map((template: DefaultTemplate) => { // Itera sobre templates padrão
        const newTemplateRef = doc(collection(db, 'workshops', newWorkshopRef.id, 'templates')); // Referência para cada template dentro do novo workshop
        batch.set(newTemplateRef, template); // Adiciona criação do template no batch
        return { id: newTemplateRef.id, ...template, updated_at: new Date() }; // Retorna template local com id e updated_at
      });
      await batch.commit(); // Executa o batch, criando todos os templates no Firestore

      const newWorkshopDoc = await getDoc(newWorkshopRef); // Busca os dados atualizados do workshop recém-criado
      const newWorkshopData = { id: newWorkshopDoc.id, ...newWorkshopDoc.data() } as Workshop; // Monta o objeto Workshop

      setWorkshop(newWorkshopData); // Atualiza estado do workshop
      setTemplates(newTemplates); // Atualiza lista de templates
      setSelectedTemplate(newTemplates[0]); // Seleciona o primeiro template

      toast({
        title: "Workshop Created",
        description: `Successfully created "${workshopName}".`, // Mensagem de sucesso com o nome do workshop
      });
    } catch (error: any) {
      console.error('Error creating workshop:', error); // Loga erro no console
      toast({
        title: "Error",
        description: "Failed to create new workshop: " + error.message, // Mensagem detalhada do erro
        variant: "destructive",
      });
      onBack(); // Volta para tela anterior em caso de erro
    } finally {
      setLoading(false); // Desativa loading
    }
  };

  // Função que salva o conteúdo do template selecionado
  const handleSave = async () => {
    if (!workshop || !selectedTemplate) return; // Se não há workshop ou template selecionado, não faz nada
    
    setSaving(true); // Ativa estado de salvamento
    try {
      const templateRef = doc(
        db,
        'workshops',
        workshop.id,
        'templates',
        selectedTemplate.id,
      ); // Referência ao template selecionado no Firestore
      await updateDoc(templateRef, {
        content: selectedTemplate.content, // Atualiza o conteúdo do template
        updated_at: serverTimestamp(), // Atualiza data de modificação
      });

      const workshopRef = doc(db, 'workshops', workshop.id); // Referência ao workshop no Firestore
      await updateDoc(workshopRef, { updated_at: serverTimestamp() }); // Atualiza a data de modificação do workshop

      const updatedTemplates = templates.map(t => (t.id === selectedTemplate.id ? selectedTemplate : t)); // Substitui o template atualizado na lista local
      setTemplates(updatedTemplates); // Atualiza lista de templates

      setHasUnsavedChanges(false); // Marca que não há mais alterações não salvas

      toast({
        title: "Saved!",
        description: `Your changes to "${selectedTemplate.template_name}" have been saved.`, // Mensagem informando que as alterações foram salvas
      });
    } catch (error: any) {
      console.error('Error saving workshop:', error); // Loga erro
      toast({
        title: "Error",
        description: "Failed to save changes.", // Mensagem genérica de erro ao salvar
        variant: "destructive",
      });
    } finally {
      setSaving(false); // Finaliza o estado de salvamento
    }
  };

  // Função para renomear o workshop
  const handleRenameWorkshop = async (newName: string) => {
    if (!workshop) return; // Se não há workshop carregado, não faz nada
    const workshopRef = doc(db, 'workshops', workshop.id); // Referência ao documento do workshop
    try {
      await updateDoc(workshopRef, { name: newName }); // Atualiza o nome no Firestore
      setWorkshop({ ...workshop, name: newName }); // Atualiza estado local com o novo nome
      toast({ title: 'Renamed', description: 'Workshop has been renamed.' }); // Exibe toast de sucesso
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not rename workshop.', // Mensagem de erro ao renomear
        variant: 'destructive',
      });
    }
  };

  // Função que marca/desmarca o template selecionado como completo
  const handleMarkComplete = async () => {
    if (!selectedTemplate || !workshop || hasUnsavedChanges) { // Verifica se há template, workshop e ausência de alterações não salvas
      if (hasUnsavedChanges) { // Se houver alterações não salvas
        toast({
          title: "Unsaved Changes",
          description: "Please save your changes before marking this step as complete.", // Pede para salvar antes de marcar como completo
          variant: "destructive",
        });
      }
      return; // Encerra a função
    }

    // Agenda e Workshop Report não podem ser marcados como completos
    if (selectedTemplate.template_name === 'Agenda' || selectedTemplate.template_name === 'Workshop Report') {
      return;
    }

    const newLockedState = !selectedTemplate.is_locked; // Alterna o estado de is_locked (completo/aberto)
    const templateRef = doc(db, 'workshops', workshop.id, 'templates', selectedTemplate.id); // Referência ao template no Firestore

    try {
      await updateDoc(templateRef, { is_locked: newLockedState }); // Atualiza o campo is_locked no Firestore
      
      const updatedTemplates = templates.map(t => 
        t.id === selectedTemplate.id ? { ...t, is_locked: newLockedState } : t
      ); // Atualiza a lista local com o novo estado is_locked
      setTemplates(updatedTemplates); // Aplica a nova lista

      const updatedSelectedTemplate = { ...selectedTemplate, is_locked: newLockedState }; // Atualiza o template selecionado localmente
      setSelectedTemplate(updatedSelectedTemplate); // Seta o template selecionado com o novo lock

      const countableTemplates = updatedTemplates.filter(t => t.is_counted); // Filtra templates contáveis
      const completedCount = countableTemplates.filter(t => t.is_locked).length; // Conta quantos estão completos
      const allStepsCompleted = countableTemplates.length > 0 && completedCount === countableTemplates.length; // Verifica se todas etapas contáveis foram concluídas
      const newStatus = allStepsCompleted ? 'completed' : 'in_progress'; // Determina novo status do workshop

      const workshopRefUpdate = doc(db, 'workshops', workshop.id); // Referência ao workshop para update
      await updateDoc(workshopRefUpdate, {
        status: newStatus,
        current_step: completedCount
      }); // Atualiza status e current_step no Firestore

      setWorkshop(prev => prev ? { ...prev, status: newStatus, current_step: completedCount } : null); // Atualiza estado do workshop localmente

      // Se todas as etapas forem concluídas, adiciona o template de Workshop Report caso ainda não exista
      if (allStepsCompleted && !updatedTemplates.some(t => t.template_name === 'Workshop Report')) {
        const reportTemplate = {
          id: 'workshop-report', // ID fixo do template de relatório
          step_number: 14, // Step fixo na sequência
          template_name: 'Workshop Report', // Nome do template
          content: {}, // Conteúdo inicial vazio
          is_locked: true, // Travado (não editável)
          is_counted: false, // Não contabiliza como etapa
          updated_at: new Date(), // Data local
        };
        const finalTemplates = [...updatedTemplates, reportTemplate].sort((a,b) => a.step_number - b.step_number); // Adiciona e ordena por step_number
        setTemplates(finalTemplates); // Atualiza lista com o relatório
      } else if (!allStepsCompleted) {
        // Se não estiver tudo completo, remove o relatório se existir
        setTemplates(updatedTemplates.filter(t => t.template_name !== 'Workshop Report'));
      }

      toast({
        title: `Step ${newLockedState ? 'Completed' : 'Re-opened'}`, // Título adaptado conforme marcou ou reabriu
        description: `Step "${selectedTemplate.template_name}" has been ${newLockedState ? 'marked as complete' : 're-opened'}.`, // Descrição informando a ação
      });

    } catch (error) {
      console.error('Error updating template lock state:', error); // Loga erro no console
      toast({
        title: 'Error',
        description: 'Could not update step completion status.', // Mensagem de erro ao atualizar status
        variant: 'destructive',
      });
    }
  };

  // Atualiza o conteúdo do template a partir das mudanças feitas no Canvas
  const onTemplateChange = (newContent: any) => {
    if (selectedTemplate && !selectedTemplate.is_locked) { // Só permite alteração se houver template selecionado e se não estiver travado
      const originalTemplate = templates.find(t => t.id === selectedTemplate.id); // Recupera a versão original do template na lista
      if (JSON.stringify(originalTemplate?.content) !== JSON.stringify(newContent)) { // Compara o conteúdo original com o novo (via JSON.stringify)
        setSelectedTemplate({ ...selectedTemplate, content: newContent }); // Atualiza o template selecionado com o novo conteúdo
        setHasUnsavedChanges(true); // Marca que existem alterações não salvas
      }
    }
  };

  // Executa navegação (troca de template ou voltar) respeitando alterações não salvas
  const executeNavigation = (action: () => void) => {
    if (hasUnsavedChanges) { // Se há alterações não salvas
      setNextNavigationAction(() => action); // Armazena a ação a ser executada após resolver as alterações
      setShowUnsavedChangesDialog(true); // Abre o diálogo perguntando se deseja salvar ou descartar
    } else {
      action(); // Se não há alterações, executa a ação imediatamente
    }
  };

  // Função chamada ao selecionar um template na sidebar
  const onSelectTemplate = (template: Template) => {
    executeNavigation(() => { // Usa a função que garante tratamento de alterações não salvas
      setSelectedTemplate(template); // Define o template selecionado
      setHasUnsavedChanges(false); // Reseta flag de alterações não salvas
    });
  };

  // Navega para o próximo template
  const handleNext = () => {
    if (!selectedTemplate) return; // Se não há template selecionado, não faz nada
    const currentIndex = templates.findIndex(t => t.id === selectedTemplate.id); // Obtém o índice do template atual
    if (currentIndex < templates.length - 1) { // Se não está no último template
      onSelectTemplate(templates[currentIndex + 1]); // Seleciona o próximo template
    }
  };

  // Navega para o template anterior
  const handlePrev = () => {
    if (!selectedTemplate) return; // Se não há template selecionado, não faz nada
    const currentIndex = templates.findIndex(t => t.id === selectedTemplate.id); // Obtém o índice do template atual
    if (currentIndex > 0) { // Se não está no primeiro template
      onSelectTemplate(templates[currentIndex - 1]); // Seleciona o template anterior
    }
  };
  
  // Callback de "voltar" que considera se existem alterações não salvas
  const handleBackWithCheck = () => {
    executeNavigation(onBack); // Usa executeNavigation para chamar onBack
  };

  // Confirma salvar alterações e depois executa a navegação pendente
  const handleConfirmSave = async () => {
    await handleSave(); // Salva o template atual
    if (nextNavigationAction) { // Se existe uma ação pendente de navegação
      nextNavigationAction(); // Executa a ação
    }
    setShowUnsavedChangesDialog(false); // Fecha o diálogo
    setNextNavigationAction(null); // Limpa a ação pendente
  };
  
  // Descarta as alterações e executa a navegação pendente
  const handleDiscardChanges = () => {
    const originalTemplate = templates.find(t => t.id === selectedTemplate?.id); // Recupera a versão original do template
    if (originalTemplate) {
      setSelectedTemplate(originalTemplate); // Restaura o template selecionado para o original
    }
    setHasUnsavedChanges(false); // Marca que não há alterações não salvas
    if (nextNavigationAction) { // Se existe ação pendente
      nextNavigationAction(); // Executa a ação
    }
    setShowUnsavedChangesDialog(false); // Fecha o diálogo
    setNextNavigationAction(null); // Limpa ação pendente
  };

  // Exporta o workshop para PDF usando generateWorkshopReport
  const handleExport = async () => {
    if (!workshop) return; // Se não há workshop, não exporta
    if (isExporting) return; // Evita chamadas concorrentes de export

    setIsExporting(true); // Marca que está exportando
    toast({ title: 'Exporting Workshop', description: 'Generating PDF...' }); // Toast informando início da exportação

    try {
      const filteredTemplates = templates.filter(t => t.template_name !== 'Workshop Report'); // Remove template de relatório da lista exportada
      
      const reportData: PdfReport = {
        title: "Workshop Report", // Título do relatório
        workshop: workshop.name, // Nome do workshop
        templates: filteredTemplates.map(t => ({
          name: t.template_name, // Nome da etapa
          step: t.step_number, // Número da etapa
          content: t.content, // Conteúdo daquela etapa
        })),
        status: workshop.status, // Status atual do workshop
        steps: `${workshop.current_step} / ${workshop.total_steps}`, // Progresso no formato "x / total"
        generatedAt: new Date().toLocaleDateString('pt-BR'), // Data de geração formatada em pt-BR
        participants: workshop.participants, // Lista de participantes
      };

      const pdf = generateWorkshopReport(reportData, {
        brandName: "Lean Inception", // Opções de branding para o PDF
      });

      pdf.save(`workshop-report-${workshop.name.replace(/\s+/g, '_').toLowerCase()}.pdf`); // Salva o PDF com nome baseado no workshop

      toast({ title: 'Export Successful', description: 'PDF generated.' }); // Toast de sucesso
    } catch (error: any) {
      console.error(error); // Loga erro
      toast({
        title: 'Export Failed',
        description: error?.message ?? 'Unknown error', // Mensagem de erro da exportação
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false); // Finaliza estado de exportação
    }
  };

  // Renderização de tela de loading enquanto workshop e templates estão sendo carregados
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-inception-blue"></div> {/* Spinner de carregamento */}
        <p className="ml-4 text-lg font-semibold">Loading Workshop...</p> {/* Texto informativo */}
      </div>
    );
  }

  // Caso não seja possível carregar o workshop ou template selecionado
  if (!workshop || !selectedTemplate) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg font-semibold text-red-600">Workshop could not be loaded.</p> {/* Mensagem de erro */}
        <Button onClick={onBack} className="ml-4">Go Back</Button> {/* Botão para voltar */}
      </div>
    );
  }

  const selectedIndex = templates.findIndex(t => t.id === selectedTemplate?.id); // Índice do template selecionado na lista de templates

  return (
    <div
      id={`workshop-canvas-${workshop.id}`} // ID único para o container do canvas do workshop
      className="h-screen w-screen bg-gray-50 flex flex-col overflow-hidden" // Layout de tela cheia com fundo e overflow controlado
    >
      <WorkshopHeader
        workshopName={workshop.name} // Nome do workshop exibido no header
        templateName={selectedTemplate.template_name} // Nome do template atual
        onBack={handleBackWithCheck} // Função de voltar com checagem de alterações não salvas
        onSave={handleSave} // Função de salvar alterações
        saving={saving} // Indica se está salvando (para mostrar loading no botão, por exemplo)
        hasUnsavedChanges={hasUnsavedChanges} // Indica se há alterações não salvas
        isTemplateCompleted={selectedTemplate.is_locked} // Indica se o template está concluído
        onRename={handleRenameWorkshop} // Função para renomear workshop
        onMarkComplete={handleMarkComplete} // Função para marcar etapa como completa ou reabrir
      />

      <div className="flex-grow flex overflow-hidden"> {/* Área principal com canvas e sidebar */}
        <main className="flex-1 bg-gray-50 overflow-y-auto"> {/* Área central de edição do canvas */}
          <Canvas
            template={selectedTemplate} // Template atual a ser exibido no canvas
            templates={templates} // Lista completa de templates (para navegação interna)
            workshopName={workshop.name} // Nome do workshop
            participants={workshop.participants} // Lista de participantes (para exibição no canvas se necessário)
            onTemplateChange={onTemplateChange} // Callback para alterações de conteúdo no template
            onNext={handleNext} // Navegar para próximo template
            onPrev={handlePrev} // Navegar para template anterior
            isFirst={selectedIndex === 0} // Indica se está na primeira etapa
            isLast={selectedIndex === templates.length - 1} // Indica se está na última etapa
            onOpenComments={() => setIsCommentsOpen(true)} // Abre diálogo de comentários
            onGoToTemplate={() => {}} // Placeholder para navegação direta a um template específico (não implementado aqui)
          />
        </main>

        <div className="flex border-l border-gray-200"> {/* Container da sidebar direita com divisória */}
          <RightSidebar
            onOpenTeamInvite={() => setIsTeamInviteOpen(true)} // Abre diálogo de convite de time
            onOpenWorkshopInvite={() => setIsWorkshopInviteOpen(true)} // Abre diálogo de convite de workshop
            onOpenAIAssistant={() => setIsAIAssistantOpen(true)} // Abre assistente de IA
            onOpenHistory={() => setIsHistoryOpen(true)} // Abre histórico de versões
            onOpenChat={openDialog} // Abre diálogo de chat global
            onOpenExport={handleExport} // Dispara ação de exportar PDF
            isExporting={isExporting} // Indica se está exportando para controlar UI
            isTeamInviteDisabled={true} // Desabilita opção de invite de time (por enquanto)
            isWorkshopReport={selectedTemplate.template_name === 'Workshop Report'} // Indica se template atual é o relatório (para ajustar UI)
            isSidebarOpen={isSidebarOpen} // Estado atual da sidebar de etapas
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} // Alterna abertura/fechamento da sidebar
          />

          {isSidebarOpen && ( // Renderiza a sidebar de templates apenas se estiver aberta
            <aside className="bg-white w-64 p-4 flex flex-col overflow-y-auto transition-all duration-300"> {/* Sidebar com lista de etapas */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Steps</h2> {/* Título da seção de etapas */}
              </div>
              <TemplateSidebar
                templates={templates} // Lista de templates
                selectedTemplate={selectedTemplate} // Template selecionado atualmente
                onSelectTemplate={onSelectTemplate} // Callback ao selecionar um template
              />
            </aside>
          )}
        </div>
      </div>

      {selectedTemplate && workshop && ( // Renderiza diálogo de comentários se houver template e workshop válidos
        <CommentsDialog
          open={isCommentsOpen} // Controle de abertura
          onOpenChange={setIsCommentsOpen} // Callback para atualizar estado de abertura
          workshopId={workshop.id} // ID do workshop
          templateId={selectedTemplate.id} // ID do template
          templateName={selectedTemplate.template_name} // Nome da etapa para exibição
        />
      )}
      
      {workspaceId && ( // Renderiza diálogo de convite ao time apenas se existir workspaceId
        <TeamInviteDialog
          isOpen={isTeamInviteOpen} // Controle de abertura
          onClose={() => setIsTeamInviteOpen(false)} // Função para fechar o diálogo
          workspaceId={workspaceId} // ID do workspace
          workspaceName={currentWorkspaceName} // Nome do workspace atual
          onMemberAdded={() => workshopId && fetchWorkshopAndTemplates(workshopId)} // Recarrega workshop/templates ao adicionar membro
        />
      )}
      
      {workshop && ( // Renderiza diálogo de convite ao workshop se houver workshop carregado
        <WorkshopInviteDialog
          isOpen={isWorkshopInviteOpen} // Controle de abertura
          onClose={() => setIsWorkshopInviteOpen(false)} // Fecha o diálogo
          workshopId={workshop.id} // ID do workshop
          workshopName={workshop.name} // Nome do workshop
        />
      )}

      <AIAssistant
        open={isAIAssistantOpen} // Controle de abertura do assistente de IA
        onOpenChange={setIsAIAssistantOpen} // Atualiza estado de abertura
        workshopId={workshop.id} // ID do workshop para contexto da IA
      />
      <WorkshopVersionHistory
        open={isHistoryOpen} // Controle de abertura do histórico
        onOpenChange={setIsHistoryOpen} // Atualiza estado de abertura
        workshopId={workshop.id} // ID do workshop para buscar histórico
        templateName={selectedTemplate?.template_name || ''} // Nome do template atual para contextualizar histórico
      />
      <AlertDialog
        open={showUnsavedChangesDialog} // Controla se o diálogo de alterações não salvas está aberto
        onOpenChange={setShowUnsavedChangesDialog} // Atualiza estado de abertura
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes</AlertDialogTitle> {/* Título informando que há alterações não salvas */}
            <AlertDialogDescription>
              Do you want to save your changes before proceeding? {/* Pergunta se o usuário deseja salvar antes de prosseguir */}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNextNavigationAction(null)}>Cancel</AlertDialogCancel> {/* Cancela e não executa a navegação pendente */}
            <Button variant="outline" onClick={handleDiscardChanges}>Discard and Continue</Button> {/* Descarta alterações e segue com a navegação */}
            <AlertDialogAction onClick={handleConfirmSave}>Save and Continue</AlertDialogAction> {/* Salva e depois continua a navegação */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster /> {/* Componente que renderiza os toasts na tela */}
    </div>
  );
};

export default WorkshopCanvas; // Exporta o componente como default para uso em outras partes da aplicação
