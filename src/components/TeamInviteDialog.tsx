import { useState, useEffect } from 'react'                                                      // Hooks do React para estado e efeitos colaterais
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'                                                                  // Componentes de diálogo reutilizáveis
import { Button } from '@/components/ui/button'                                                  // Botão estilizado
import { Input } from '@/components/ui/input'                                                    // Campo de entrada de texto
import { useToast } from '@/components/ui/use-toast'                                             // Hook para exibir toasts de feedback
import { useAuth } from '@/components/AuthProvider'                                              // Contexto de autenticação da aplicação
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore'                                                                      // Funções do Firestore para leitura de dados
import { db } from '@/integrations/firebase/client'                                              // Instância do Firestore configurada
import { ScrollArea } from '@/components/ui/scroll-area'                                         // Área com scroll customizado
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar'                                                                  // Componente de avatar com imagem e fallback
import { User, X, Shield, Users } from 'lucide-react'                                            // Ícones da biblioteca lucide-react
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'                                                                  // Select customizado usando Radix
import { Checkbox } from '@/components/ui/checkbox'                                              // Checkbox estilizado

// Propriedades esperadas pelo diálogo de convite de time
interface TeamInviteDialogProps {
  isOpen: boolean                                                                                // Controla se o diálogo está aberto
  onClose: () => void                                                                            // Função chamada ao fechar o diálogo
  workspaceId: string                                                                            // ID do workspace atual
  workspaceName: string                                                                          // Nome do workspace atual
  onMemberAdded: () => void                                                                      // Callback quando um membro é adicionado
}

// Estrutura de um membro do time
interface Member {
  email: string                                                                                  // Email do membro
  name: string                                                                                   // Nome do membro
  photoURL?: string                                                                              // URL opcional da foto de perfil
  role: 'owner' | 'editor' | 'viewer'                                                            // Papel do membro dentro do workspace
}

// Estrutura mínima de um workshop
interface Workshop {
  id: string                                                                                     // ID do workshop
  name: string                                                                                   // Nome do workshop
}

// Componente principal do diálogo de convite e gerenciamento de acesso
export const TeamInviteDialog: React.FC<TeamInviteDialogProps> = ({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  onMemberAdded
}) => {
  const [newInviteEmail, setNewInviteEmail] = useState('')                                       // Estado para armazenar o email digitado para convite
  const [isSending, setIsSending] = useState(false)                                              // Indica se um convite está sendo enviado
  const [members, setMembers] = useState<Member[]>([])                                           // Lista de membros do workspace
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)                                // Indica carregamento dos membros
  const [accessLevel, setAccessLevel] = useState('editor')                                       // Nível de acesso selecionado. 'editor' ou 'limited'
  const [workshops, setWorkshops] = useState<Workshop[]>([])                                     // Lista de workshops do workspace para acesso limitado
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>([])                       // IDs dos workshops selecionados para acesso limitado
  const { toast } = useToast()                                                                   // Função para exibir mensagens de feedback
  const { user } = useAuth()                                                                     // Usuário autenticado atual

  // Efeito para buscar membros e workshops sempre que o diálogo abrir ou o accessLevel mudar
  useEffect(() => {
    const fetchMembersAndWorkshops = async () => {
      if (!workspaceId) return                                                                   // Se não tiver workspaceId. não faz nada
      setIsLoadingMembers(true)                                                                 // Inicia indicador de loading

      try {
        // Busca dados do workspace. aqui foi usado 'workshops' em vez de 'workspaces'
        const workspaceRef = doc(db, 'workspaces', workspaceId)                                  // Referência ao documento do workspace
        const workspaceSnap = await getDoc(workspaceRef)                                        // Lê dados do Firestore

        if (workspaceSnap.exists()) {
          const workspaceData = workspaceSnap.data()                                            // Dados brutos do documento
          let currentMembers: Member[] = workspaceData.members || []                            // Lista de membros salvos. ou array vazio

          const ownerId = workspaceData.created_by                                              // ID do criador do workspace
          const ownerInList = currentMembers.some(member => member.role === 'owner')            // Verifica se já existe um membro marcado como owner

          // Se não há owner na lista. tenta buscar o perfil do criador para adicioná-lo
          if (ownerId && !ownerInList) {
            const ownerProfileRef = doc(db, 'profiles', ownerId)                                // Referência ao perfil do owner
            const ownerProfileSnap = await getDoc(ownerProfileRef)                              // Lê o documento de perfil

            if (ownerProfileSnap.exists()) {
              const ownerProfileData = ownerProfileSnap.data()                                  // Dados do perfil do owner
              currentMembers.unshift({                                                          // Insere o owner no início da lista
                email: ownerProfileData.email,
                name: ownerProfileData.name || 'Owner',
                photoURL: ownerProfileData.photoURL || '',
                role: 'owner'
              })
            }
          }

          setMembers(currentMembers)                                                            // Atualiza o estado de membros com a lista final
        }

        // Se o nível de acesso for limitado. carrega os workshops do workspace
        if (accessLevel === 'limited') {
          const workshopsQuery = query(
            collection(db, 'workshops'),                                                        // Coleção de workshops
            where('workspace_id', '==', workspaceId)                                            // Filtra pelos workshops do workspace atual
          )
          const workshopsSnap = await getDocs(workshopsQuery)                                   // Executa a consulta
          const workshopsData = workshopsSnap.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name as string
          }))                                                                                   // Mapeia para array de Workshops
          setWorkshops(workshopsData)                                                           // Salva workshops no estado
        }
      } catch (error) {
        console.error('Error fetching data:', error)                                             // Log de erro no console
        toast({
          title: 'Error',
          description: 'Could not load team members or workshops.',
          variant: 'destructive'
        })                                                                                      // Feedback de erro para o usuário
      } finally {
        setIsLoadingMembers(false)                                                              // Finaliza o estado de loading
      }
    }

    if (isOpen) {                                                                               // Executa apenas quando o diálogo está aberto
      fetchMembersAndWorkshops()
    }
  }, [isOpen, workspaceId, toast, accessLevel])                                                 // Dependências do efeito

  // Lógica de envio do convite
  const handleSendInvite = async () => {
    if (!newInviteEmail) {                                                                      // Valida se o email foi preenchido
      toast({
        title: 'Error',
        description: 'Please enter an email.',
        variant: 'destructive'
      })
      return
    }

    // Evita duplicar convite para quem já é membro
    if (members.some(m => m.email === newInviteEmail)) {
      toast({
        title: 'Duplicate',
        description: 'This user is already a member.',
        variant: 'destructive'
      })
      return
    }

    if (!user) {                                                                                // Garante que o usuário esteja logado
      toast({
        title: 'Error',
        description: 'You must be logged in.',
        variant: 'destructive'
      })
      return
    }

    // Se o acesso for limitado. exige ao menos um workshop selecionado
    if (accessLevel === 'limited' && selectedWorkshops.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one workshop for limited access.',
        variant: 'destructive'
      })
      return
    }

    setIsSending(true)                                                                          // Marca estado como enviando convite

    try {
      const token = await user.getIdToken()                                                     // Token de autenticação do Firebase
      const response = await fetch('/api/invite', {                                             // Chamada à API de convite
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`                                                   // Envia token no cabeçalho de autorização
        },
        body: JSON.stringify({
          recipientEmail: newInviteEmail,                                                      // Email de quem será convidado
          workspaceId: workspaceId,                                                            // ID do workspace
          workspaceName: workspaceName,                                                        // Nome do workspace
          role: accessLevel,                                                                   // Nível de acesso. 'editor' ou 'limited'
          workshops: accessLevel === 'limited' ? selectedWorkshops : []                        // Workshops permitidos se acesso limitado
        })
      })

      const result = await response.json()                                                     // Tenta ler o corpo como JSON

      if (!response.ok) {                                                                      // Se o status não for OK. lança erro com mensagem
        throw new Error(result.message || 'Failed to send invitation.')
      }

      toast({
        title: 'Success!',
        description: `Invitation sent to ${newInviteEmail}.`
      })                                                                                       // Notifica sucesso

      onMemberAdded()                                                                          // Notifica o componente pai que um membro foi adicionado
      setNewInviteEmail('')                                                                    // Limpa campo de email
      setSelectedWorkshops([])                                                                 // Limpa seleção de workshops
      setAccessLevel('editor')                                                                 // Reseta nível de acesso para editor
    } catch (error: any) {
      console.error('Error sending invite:', error)                                            // Log do erro
      toast({
        title: 'Invitation Error',
        description: error.message,
        variant: 'destructive'
      })                                                                                       // Notifica erro
    } finally {
      setIsSending(false)                                                                      // Finaliza estado de envio
    }
  }

  // Adiciona ou remove workshop da seleção de acesso limitado
  const handleWorkshopSelection = (workshopId: string) => {
    setSelectedWorkshops(prev =>
      prev.includes(workshopId)                                                                // Se já está selecionado. remove
        ? prev.filter(id => id !== workshopId)
        : [...prev, workshopId]                                                                // Se não. adiciona à lista
    )
  }

  // Placeholder para remover membro do time. ainda não implementado
  const handleRemoveMember = async () => {
    toast({
      title: 'Note',
      description: 'Member removal not yet implemented.'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>                                               {/* Diálogo controlado externamente */}
      <DialogContent className="max-w-2xl">                                                     {/* Conteúdo com largura máxima maior */}
        <DialogHeader>
          <DialogTitle>Invite & Manage Access</DialogTitle>                                     {/* Título do diálogo */}
          <DialogDescription>
            Add new members and set their permissions for the '{workspaceName}' workspace.      {/* Descrição com nome do workspace */}
          </DialogDescription>
        </DialogHeader>

        {/* Área principal dividida em blocos */}
        <div className="grid gap-6 py-4">
          {/* Seção de convite de novo membro */}
          <div>
            <label className="font-medium text-sm mb-2 block">Invite New Member</label>         {/* Rótulo do formulário */}
            <div className="flex flex-col sm:flex-row gap-4">                                   {/* Layout responsivo para email. select e botão */}
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={newInviteEmail}
                onChange={e => setNewInviteEmail(e.target.value)}                               // Atualiza estado com email digitado
                className="flex-grow"
              />
              <Select value={accessLevel} onValueChange={setAccessLevel}>                       {/* Select para nível de acesso */}
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select access level" />                              {/* Placeholder do select */}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />                                       {/* Ícone de usuários */}
                      Full Access                                                               {/* Rótulo do nível 'editor' */}
                    </div>
                  </SelectItem>
                  <SelectItem value="limited">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />                                      {/* Ícone de escudo */}
                      Specific Workshops                                                        {/* Rótulo do nível limitado */}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSendInvite}
                disabled={isSending || !newInviteEmail}                                         // Desabilita se enviando ou email vazio
                className="w-full sm:w-auto"
              >
                {isSending ? 'Sending...' : 'Send Invite'}                                      {/* Texto condicional do botão */}
              </Button>
            </div>
          </div>

          {/* Se nível for limitado. mostra lista de workshops para seleção */}
          {accessLevel === 'limited' && (
            <div>
              <label className="font-medium text-sm mb-2 block">
                Select Accessible Workshops
              </label>
              <ScrollArea className="h-40 border rounded-md p-4">                               {/* Área com scroll para lista de workshops */}
                {workshops.length > 0 ? (
                  workshops.map(ws => (
                    <div key={ws.id} className="flex items-center space-x-2 my-2">
                      <Checkbox
                        id={ws.id}
                        checked={selectedWorkshops.includes(ws.id)}                             // Marca se o workshop está selecionado
                        onCheckedChange={() => handleWorkshopSelection(ws.id)}                 // Alterna seleção
                      />
                      <label
                        htmlFor={ws.id}
                        className="text-sm font-medium leading-none"
                      >
                        {ws.name}                                                               {/* Nome do workshop */}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center">
                    No workshops in this workspace.                                             {/* Mensagem se não houver workshops */}
                  </p>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Lista de membros do time */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              Team Members ({members.length})                                                   {/* Exibe quantidade de membros */}
            </h3>
            <ScrollArea className="h-48 w-full pr-4">                                           {/* Área com scroll para lista de membros */}
              {isLoadingMembers ? (
                <p className="text-sm text-center text-gray-500 py-4">
                  Loading members...                                                            {/* Feedback enquanto carrega */}
                </p>
              ) : members.length > 0 ? (
                <div className="space-y-3">
                  {members.map(member => (
                    <div
                      key={member.email}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={member.photoURL}
                            alt={member.name}
                          />                                                                     {/* Foto do membro */}
                          <AvatarFallback>
                            <User className="h-4 w-4" />                                       {/* Ícone fallback se não houver foto */}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {member.name}                                                       {/* Nome do membro */}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.email}                                                      {/* Email do membro */}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm capitalize text-gray-600 font-medium px-2 py-1 bg-gray-200 rounded-md">
                          {member.role}                                                        {/* Papel do membro. ex. owner. editor */}
                        </span>
                        {member.role !== 'owner' && (                                          // Só permite remover se não for owner
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-red-500"
                            onClick={() => handleRemoveMember()}
                          >
                            <X className="h-4 w-4" />                                         {/* Ícone de remover */}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center text-gray-500 py-6">
                  Invite your first team member!                                                {/* Mensagem caso ainda não haja membros */}
                </p>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Done                                                                                {/* Botão para fechar o diálogo */}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
