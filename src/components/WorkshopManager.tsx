import React, { useState, useEffect, useCallback } from 'react';                                       // Importa React e hooks (estado, efeito, callback memoizado)
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';      // Componentes de cartão (layout visual)
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Componentes de tabela
import { Button } from '@/components/ui/button';                                                       // Botão estilizado
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'; 
                                                                                                       // Componentes de diálogo (modal)
import { Input } from '@/components/ui/input';                                                         // Campo de texto
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';// Select estilizado
import { Badge } from '@/components/ui/badge';                                                         // Badge para status
import { MoreVertical, Edit, Trash2, PlusCircle } from 'lucide-react';                                 // Ícones de ações
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
                                                                                                       // Menu de contexto (3 pontinhos)
import { useToast } from '@/hooks/use-toast';                                                          // Hook para exibir toasts
import { db } from '@/integrations/firebase/client';                                                   // Instância do Firestore configurada
import { collection, getDocs, doc, updateDoc, writeBatch, addDoc, serverTimestamp } from 'firebase/firestore';
                                                                                                       // Funções do Firestore para CRUD
import { format } from 'date-fns';                                                                     // Biblioteca para formatar datas
import { useAuth } from './AuthProvider';                                                              // Hook de autenticação para saber usuário atual

// Tipos de dados
interface Workshop {
  id: string;                                                                                          // ID do documento do workshop
  name: string;                                                                                        // Nome do workshop
  status: string;                                                                                      // Status (in_progress, completed, etc.)
  created_at: any;                                                                                     // Data de criação (Timestamp ou similar)
  created_by: string;                                                                                  // ID do usuário que criou
  workspace_id: string | null;                                                                         // ID do workspace ou null se pessoal
  ownerName?: string;                                                                                  // Nome do dono (derivado da coleção de perfis)
  workspaceName?: string;                                                                              // Nome do workspace (derivado da coleção de workspaces)
}

interface Workspace {                                                                                  // Para o seletor de workspace
  id: string;                                                                                          // ID do workspace
  name: string;                                                                                        // Nome do workspace
}

const WorkshopManager: React.FC = () => {                                                              // Componente principal de gestão de workshops
  const [workshops, setWorkshops] = useState<Workshop[]>([]);                                          // Lista de workshops carregados
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);                                      // Lista de workspaces para o select
  const [loading, setLoading] = useState(true);                                                        // Flag de carregamento
  const { toast } = useToast();                                                                        // Função para mostrar notificações
  const { user } = useAuth();                                                                          // Usuário autenticado

  // Diálogos
  const [isCreateOpen, setIsCreateOpen] = useState(false);                                             // Controle de abertura do modal de criação
  const [isEditOpen, setIsEditOpen] = useState(false);                                                 // Controle de abertura do modal de edição
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);                                             // Controle de abertura do modal de exclusão
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);                     // Workshop selecionado para editar/apagar
  const [createFormData, setCreateFormData] = useState({ name: '', status: 'in_progress', workspace_id: '' });
                                                                                                       // Estado do formulário de criação
  const [editFormData, setEditFormData] = useState({ name: '', status: '' });                          // Estado do formulário de edição

  // Função para buscar dados de workshops, perfis e workspaces
  const fetchData = useCallback(async () => {
    setLoading(true);                                                                                  // Marca como carregando
    try {
      // Busca em paralelo workshops, perfis e workspaces
      const [workshopSnap, profileSnap, workspaceSnap] = await Promise.all([
        getDocs(collection(db, 'workshops')),                                                          // Todos os workshops
        getDocs(collection(db, 'profiles')),                                                           // Todos os perfis
        getDocs(collection(db, 'workspaces')),                                                         // Todos os workspaces
      ]);

      // Cria um mapa de perfis com chave baseada em data().id, que deve ser a mesma salva em created_by
      const profilesMap = new Map(profileSnap.docs.map(p => [p.data().id, p.data().name]));
      // Cria mapa de workspaces ID -> nome
      const workspacesMap = new Map(workspaceSnap.docs.map(ws => [ws.id, ws.data().name]));
      
      // Preenche estado de workspaces para o seletor
      setWorkspaces(workspaceSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name })) as Workspace[]);

      // Monta lista de workshops enriquecendo com ownerName e workspaceName
      const workshopList = workshopSnap.docs.map(d => {
        const data = d.data();                                                                         // Dados crus do Firestore
        return {
          id: d.id,                                                                                    // ID do documento
          ...data,                                                                                     // Campos originais
          ownerName: profilesMap.get(data.created_by) || 'Utilizador Desconhecido',                   // Nome do criador ou fallback
          workspaceName: data.workspace_id ? workspacesMap.get(data.workspace_id) || '-' : 'Nenhum',  // Nome do workspace ou rótulo padrão
        } as Workshop;
      });

      // Atualiza estado com lista de workshops
      setWorkshops(workshopList);

    } catch (error) {
      console.error("Erro ao carregar dados: ", error);                                                // Log de erro para debug
      toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" }); 
                                                                                                       // Notifica erro no toast
    } finally {
      setLoading(false);                                                                               // Finaliza carregamento
    }
  }, [toast]);                                                                                         // Dependência de toast

  // Chama fetchData ao montar o componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);                                                                                     // Usa a função memoizada

  // Abre diálogo de edição e preenche formulário com dados do workshop
  const openEditDialog = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);                                                                     // Salva o workshop selecionado
    setEditFormData({ name: workshop.name, status: workshop.status });                                // Preenche formulário de edição
    setIsEditOpen(true);                                                                               // Abre modal de edição
  };

  // Abre diálogo de confirmação de exclusão
  const openDeleteDialog = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);                                                                     // Salva o workshop selecionado
    setIsDeleteOpen(true);                                                                             // Abre modal de exclusão
  };

  // Cria um novo workshop
  const handleCreate = async () => {
    // Garante que o usuário esteja autenticado
    if (!user) {
        toast({ title: "Autenticação necessária", variant: "destructive" });
        return;
    }
    // Valida nome obrigatório
    if (!createFormData.name.trim()) {
        toast({ title: "Nome em falta", description: "O nome do workshop é obrigatório.", variant: "destructive" });
        return;
    }

    try {
        // Adiciona novo documento na coleção de workshops
        await addDoc(collection(db, 'workshops'), {
            name: createFormData.name,                                                                 // Nome do workshop
            status: createFormData.status,                                                             // Status inicial
            workspace_id: createFormData.workspace_id || null,                                         // Workspace associado ou null
            created_by: user.uid,                                                                      // ID do criador
            created_at: serverTimestamp(),                                                             // Timestamp de criação
            updated_at: serverTimestamp(),                                                             // Timestamp de última atualização
            current_step: 1,                                                                           // Etapa atual padrão
            total_steps: 10,                                                                           // Total de etapas padrão
        });
        toast({ title: "Sucesso", description: "Workshop criado com sucesso." });                      // Mensagem de sucesso
        setIsCreateOpen(false);                                                                        // Fecha modal
        setCreateFormData({ name: '', status: 'in_progress', workspace_id: '' });                      // Reseta formulário
        fetchData();                                                                                   // Recarrega lista
    } catch (error) {
        console.error("Erro ao criar workshop: ", error);                                              // Log de erro
        toast({ title: "Erro", description: "Não foi possível criar o workshop.", variant: "destructive" }); 
    }
  };

  // Atualiza um workshop existente
  const handleUpdate = async () => {
    if (!selectedWorkshop) return;                                                                     // Se não houver seleção, sai
    try {
      const workshopRef = doc(db, 'workshops', selectedWorkshop.id);                                  // Referência ao doc do workshop
      await updateDoc(workshopRef, { name: editFormData.name, status: editFormData.status });         // Atualiza campos básicos
      toast({ title: "Sucesso", description: "Workshop atualizado com sucesso." });                   // Feedback de sucesso
      setIsEditOpen(false);                                                                           // Fecha modal de edição
      fetchData();                                                                                    // Recarrega lista
    } catch (error) {
      console.error("Erro ao atualizar workshop: ", error);                                           // Log de erro
      toast({ title: "Erro", description: "Não foi possível atualizar o workshop.", variant: "destructive" }); 
    }
  };

  // Exclui um workshop e seus templates
  const handleDelete = async () => {
    if (!selectedWorkshop) return;                                                                    // Garante que há workshop selecionado

    const originalWorkshops = [...workshops];                                                         // Guarda cópia para rollback
    // Otimista. remove o workshop da UI imediatamente
    setWorkshops(workshops.filter(ws => ws.id !== selectedWorkshop.id));                              // Remove da lista em memória

    try {
      const batch = writeBatch(db);                                                                   // Cria batch para operações atômicas
      const templatesRef = collection(db, 'workshops', selectedWorkshop.id, 'templates');             // Coleção de templates dentro do workshop
      const templatesSnap = await getDocs(templatesRef);                                              // Busca todos os templates
      templatesSnap.docs.forEach(d => batch.delete(d.ref));                                           // Marca cada template para exclusão no batch

      const workshopRef = doc(db, 'workshops', selectedWorkshop.id);                                  // Referência do workshop
      batch.delete(workshopRef);                                                                      // Marca o workshop para exclusão
      await batch.commit();                                                                           // Executa todas as exclusões

      toast({ title: "Sucesso", description: "Workshop apagado com sucesso." });                      // Feedback de sucesso
      setIsDeleteOpen(false);                                                                         // Fecha modal de exclusão
      // A UI já está atualizada, mas podemos re-sincronizar por segurança
      fetchData();                                                                                    // Opcionalmente recarrega dados
    } catch (error) {
      console.error("Erro ao apagar workshop: ", error);                                              // Log de erro
      toast({ 
        title: "Erro de Sincronização", 
        description: "Não foi possível apagar o workshop da base de dados. A sua visualização será restaurada.", 
        variant: "destructive" 
      });
      // Rollback. restaura a lista de workshops em caso de erro
      setWorkshops(originalWorkshops);                                                                // Volta à lista original
      setIsDeleteOpen(false);                                                                         // Fecha modal
    }
  };

  // Retorna um Badge estilizado de acordo com o status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress': return <Badge variant="secondary">Em Progresso</Badge>;                     // Status "Em Progresso"
      case 'completed': return <Badge style={{ backgroundColor: 'hsl(var(--primary))' }}>Concluído</Badge>; 
                                                                                                      // Status "Concluído" com cor primária
      default: return <Badge variant="outline">{status}</Badge>;                                      // Status genérico
    }
  };

  return (
    <Card>                                                                                             {/* Container principal em forma de Card */}
      <CardHeader className="flex flex-row items-center justify-between">                              {/* Cabeçalho do card com título e botão */}
        <div>
            <CardTitle>Gestão de Workshops</CardTitle>                                                 {/* Título da seção */}
            <CardDescription>Crie, visualize, edite e apague workshops.</CardDescription>              {/* Descrição da funcionalidade */}
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>                                                 {/* Botão para abrir modal de criação */}
            <PlusCircle className="mr-2 h-4 w-4" />                                                    {/* Ícone de adicionar */}
            Criar Workshop
        </Button>
      </CardHeader>
      <CardContent>                                                                                    {/* Corpo do card */}
        {loading ? <p>A carregar workshops...</p> : (                                                   // Se estiver carregando, mostra mensagem simples
          <Table>                                                                                      {/* Tabela com lista de workshops */}
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Criado Em</TableHead>
                <TableHead className="text-right">Ações</TableHead>                                   {/* Coluna de ações alinhada à direita */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {workshops.map((ws) => (                                                                 // Percorre lista de workshops
                <TableRow key={ws.id}>                                                                 {/* Cada linha representa um workshop */}
                  <TableCell className="font-medium">{ws.name}</TableCell>                             {/* Nome do workshop */}
                  <TableCell>{ws.workspaceName}</TableCell>                                             {/* Nome do workspace associado */}
                  <TableCell>{ws.ownerName}</TableCell>                                                {/* Nome do proprietário */}
                  <TableCell>{getStatusBadge(ws.status)}</TableCell>                                   {/* Badge com status */}
                  <TableCell>{ws.created_at?.toDate ? format(ws.created_at.toDate(), 'dd/MM/yyyy') : 'N/A'}</TableCell> 
                                                                                                      {/* Data formatada ou N/A */}
                  <TableCell className="text-right">                                                   {/* Ações (menu de contexto) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">                                          {/* Botão ícone (3 pontinhos) */}
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(ws)}>                         {/* Opção de editar */}
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(ws)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Apagar                                   {/* Opção de apagar */}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Diálogo de Criação */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>                                      {/* Modal para criar workshop */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Workshop</DialogTitle>                                             {/* Título do modal de criação */}
            <DialogDescription>
              Preencha os detalhes abaixo para criar um novo workshop.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">                                                             {/* Campos do formulário */}
            <div>
              <label htmlFor="create-ws-name">Nome do Workshop</label>                                 {/* Rótulo do input de nome */}
              <Input 
                id="create-ws-name" 
                value={createFormData.name} 
                onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}        // Atualiza nome no estado
                placeholder="Ex: Inception do Produto X"
              />
            </div>
            <div>
              <label htmlFor="create-ws-workspace">Associar ao Workspace (Opcional)</label>            {/* Rótulo do select de workspace */}
              <Select 
                value={createFormData.workspace_id} 
                onValueChange={(value) => setCreateFormData({ ...createFormData, workspace_id: value })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione um workspace" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>                                             {/* Opção para não associar workspace */}
                  {workspaces.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>                          // Lista de workspaces
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div>
              <label htmlFor="create-ws-status">Estado Inicial</label>                                 {/* Rótulo do select de status */}
              <Select 
                value={createFormData.status} 
                onValueChange={(value) => setCreateFormData({ ...createFormData, status: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>         {/* Fecha modal sem salvar */}
            <Button onClick={handleCreate}>Criar</Button>                                              {/* Chama criação do workshop */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>                                          {/* Modal para editar workshop */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Workshop</DialogTitle>                                                 {/* Título do modal de edição */}
            <DialogDescription>
              Altere as informações do workshop e clique em Guardar Alterações.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div>
              <label htmlFor="edit-ws-name">Nome do Workshop</label>                                   {/* Rótulo do input de nome */}
              <Input 
                id="edit-ws-name" 
                value={editFormData.name} 
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}            // Atualiza nome editado
              />
            </div>
            <div>
              <label htmlFor="edit-ws-status">Estado</label>                                           {/* Rótulo do select de status */}
              <Select 
                value={editFormData.status} 
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>           {/* Fecha modal sem salvar */}
            <Button onClick={handleUpdate}>Guardar Alterações</Button>                                 {/* Salva alterações */}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Apagar */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>                                      {/* Modal de confirmação de exclusão */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tem a certeza?</DialogTitle>                                                  {/* Título de alerta */}
            <DialogDescription>
              Esta ação é irreversível e irá apagar o workshop e todos os seus templates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>         {/* Cancela exclusão */}
            <Button variant="destructive" onClick={handleDelete}>Sim, Apagar Workshop</Button>         {/* Confirma exclusão */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default WorkshopManager;                                                                        // Exporta o componente como default
