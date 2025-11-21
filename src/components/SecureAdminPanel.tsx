import React, { useState, useEffect } from 'react'                                                // Importa React e hooks de estado/efeito
import { useNavigate } from 'react-router-dom'                                                    // Hook para navegação entre rotas
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'  // Componentes de card
import { Button } from '@/components/ui/button'                                                   // Botão estilizado
import { Input } from '@/components/ui/input'                                                     // Campo de texto padrão
import { Label } from '@/components/ui/label'                                                     // Rótulo de formulário
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select' // Select customizado
import { Badge } from '@/components/ui/badge'                                                     // Etiqueta de status
import { UserPlus, Download, Edit, Trash2, Shield, AlertTriangle, Users, Briefcase, Star } from 'lucide-react' // Ícones
import { db } from '@/integrations/firebase/client'                                              // Instância do Firestore
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore' // Funções do Firestore
import { useToast } from '@/hooks/use-toast'                                                     // Hook de toast da aplicação
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog' // Diálogo modal
import { Alert, AlertDescription } from '@/components/ui/alert'                                  // Alerta visual
import { useAuth } from '@/components/AuthProvider'                                              // Contexto de autenticação com admin flag
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"                 // Abas para seções do painel
import WorkspaceManager from './WorkspaceManager'                                                // Gerenciador de workspaces
import WorkshopManager from './WorkshopManager'                                                  // Gerenciador de workshops

// Interface que descreve o modelo de perfil armazenado no Firestore
interface Profile {
  id: string                                // ID do documento no Firestore
  name: string                              // Nome do usuário
  email: string                             // Email do usuário
  access_type: string                       // Tipo de acesso. ex. 'admin', 'user'
  status: string                            // Status da conta. ex. 'active', 'inactive'
  created_at: any                           // Data de criação. geralmente Timestamp do Firestore
}

// Componente principal do painel administrativo seguro
const SecureAdminPanel: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([])    // Lista de perfis carregados do banco
  const [isDialogOpen, setIsDialogOpen] = useState(false)    // Controle de abertura do diálogo de edição/criação
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null) // Perfil em edição, se houver
  const [formData, setFormData] = useState({                 // Estado do formulário de usuário
    name: '',
    email: '',
    access_type: 'user',
    status: 'active',
  })
  const { toast } = useToast()                               // Função para exibir notificações
  const { isAdmin, refreshAdminStatus } = useAuth()          // Flags e função de refresh de admin do contexto de auth
  const navigate = useNavigate()                             // Navegação para outras rotas

  // Efeito para garantir que o status de admin está atualizado e buscar perfis se for admin
  useEffect(() => {
    refreshAdminStatus()                                     // Atualiza claims de admin no token
    if (isAdmin) {                                           // Se for admin, carrega os perfis
      fetchProfiles()
    }
  }, [isAdmin])                                              // Reexecuta quando isAdmin mudar

  // Volta para a página inicial
  const handleBack = () => {
    navigate('/')                                            // Navega para a rota raiz
  }

  // Busca todos os perfis de usuário para exibição
  const fetchProfiles = async () => {
    if (!isAdmin) {                                          // Bloqueia acesso se não for admin
      toast({
        title: "Access Denied",
        description: "You don't have permission to view user profiles.",
        variant: "destructive",
      })
      return
    }

    try {
      const profilesCollection = collection(db, 'profiles')  // Referência à coleção 'profiles'
      const q = query(profilesCollection, orderBy('created_at', 'desc')) // Ordena por data de criação
      const querySnapshot = await getDocs(q)                 // Executa consulta
      const profilesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Profile[] // Mapeia docs para objetos Profile
      setProfiles(profilesData)                              // Atualiza estado de perfis
    } catch (error: any) {
      console.error('Error fetching profiles:', error)       // Log no console
      toast({
        title: "Error",
        description: "Failed to fetch users. Please check your permissions.",
        variant: "destructive",
      })
    }
  }

  // Envio do formulário de criação/edição de usuário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()                                       // Evita recarregar a página
    
    if (!isAdmin) {                                          // Garante que apenas admin pode editar
      toast({
        title: "Access Denied",
        description: "You don't have permission to modify user profiles.",
        variant: "destructive",
      })
      return
    }
    
    try {
      if (editingProfile) {                                  // Se existe um perfil em edição
        const profileDoc = doc(db, 'profiles', editingProfile.id) // Referência ao documento do perfil
        await updateDoc(profileDoc, {                        // Atualiza campos permitidos
          name: formData.name,
          access_type: formData.access_type,
          status: formData.status,
        })
        
        toast({
          title: "Success",
          description: "User updated successfully.",
        })
      } else {
        // Fluxo de criação está desabilitado. reforça a política de criação via página de auth
        toast({
          title: "Feature Not Available",
          description: "User creation requires additional setup. Users can sign up through the auth page.",
          variant: "destructive",
        })
        return
      }

      setIsDialogOpen(false)                                 // Fecha o modal
      setEditingProfile(null)                                // Limpa perfil em edição
      setFormData({                                          // Reseta formulário
        name: '',
        email: '',
        access_type: 'user',
        status: 'active',
      })
      fetchProfiles()                                        // Recarrega lista de usuários
    } catch (error: any) {
      console.error('Error updating profile:', error)        // Log de erro
      toast({
        title: "Error",
        description: "Failed to update user. You may not have sufficient permissions.",
        variant: "destructive",
      })
    }
  }

  // Exclui um usuário da coleção 'profiles'
  const deleteUser = async (id: string) => {
    if (!isAdmin) {                                          // Verifica permissão
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete user profiles.",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteDoc(doc(db, 'profiles', id))               // Deleta o documento do Firestore
      
      setProfiles(profiles.filter(p => p.id !== id))         // Remove do estado local
      toast({
        title: "Success",
        description: "User deleted successfully.",
      })
    } catch (error: any) {
      console.error('Error deleting profile:', error)        // Log do erro
      toast({
        title: "Error",
        description: "Failed to delete user. This may require additional permissions.",
        variant: "destructive",
      })
    }
  }

  // Exporta todos os usuários em CSV simples
  const exportUsers = () => {
    if (!isAdmin) {                                          // Impede exportação sem permissão
      toast({
        title: "Access Denied",
        description: "You don't have permission to export user data.",
        variant: "destructive",
      })
      return
    }

    // Monta conteúdo CSV. primeira linha é o cabeçalho
    const csvContent = [
      ['Name', 'Email', 'Access Type', 'Status', 'Created At'],
      ...profiles.map(profile => [
        profile.name,
        profile.email,
        profile.access_type,
        profile.status,
        profile.created_at?.toDate
          ? new Date(profile.created_at.toDate()).toLocaleDateString()
          : 'N/A',
      ]),
    ]
      .map(row => row.join(','))                             // Junta colunas por vírgula
      .join('\n')                                            // Junta linhas por quebra de linha

    const blob = new Blob([csvContent], { type: 'text/csv' }) // Cria Blob com tipo CSV
    const url = window.URL.createObjectURL(blob)             // Gera URL temporária
    const a = document.createElement('a')                    // Cria elemento <a> para disparar download
    a.href = url
    a.download = 'users.csv'                                 // Nome do arquivo
    a.click()                                                // Dispara download
    window.URL.revokeObjectURL(url)                          // Libera URL da memória
  }

  // Abre o diálogo de edição com os dados do perfil selecionado
  const openEditDialog = (profile: Profile) => {
    setEditingProfile(profile)                               // Define perfil atual
    setFormData({                                            // Preenche formulário com dados existentes
      name: profile.name,
      email: profile.email,
      access_type: profile.access_type,
      status: profile.status,
    })
    setIsDialogOpen(true)                                    // Abre o modal
  }

  // Comportamento quando usuário não é admin. mostra tela de acesso negado
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />          {/* Ícone de alerta */}
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Shield className="h-4 w-4" />                 {/* Ícone de escudo */}
              <AlertDescription>
                You do not have administrator privileges to access this panel.
              </AlertDescription>
            </Alert>
            <Button onClick={handleBack} className="w-full mt-4">
              Back                                           {/* Botão para voltar para a home */}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Define classes de cor de badge conforme status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200' // Ativo em verde
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200'       // Inativo em vermelho
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'    // Default em cinza
    }
  }

  // Define classes de cor de badge para tipo de acesso
  const getAccessTypeColor = (accessType: string) => {
    switch (accessType) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200' // Admin em roxo
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200'       // User em azul
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'       // Outro em cinza
    }
  }

  // Renderização principal do painel admin quando o usuário é administrador
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1> {/* Título da página */}
        </div>

        {/* Abas para alternar entre seções: Users, Workspaces, Workshops */}
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="workspaces">
              <Briefcase className="mr-2 h-4 w-4" />
              Workspaces
            </TabsTrigger>
            <TabsTrigger value="workshops">
              <Star className="mr-2 h-4 w-4" />
              Workshops
            </TabsTrigger>
          </TabsList>
          
          {/* Aba de usuários do sistema */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>System Users</CardTitle>       {/* Título da seção */}
                    <CardDescription>
                      Manage user accounts and permissions with enhanced security
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    {/* Botão para exportar CSV */}
                    <Button onClick={exportUsers} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>

                    {/* Diálogo de criação/edição de usuário. criação está desativada  */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button disabled className="bg-gray-300 text-gray-500">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add User (Disabled)
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingProfile ? 'Edit User' : 'Add New User'}
                          </DialogTitle>
                          <DialogDescription>
                            {editingProfile
                              ? 'Update user information and permissions.'
                              : 'User creation requires Admin API setup.'}
                          </DialogDescription>
                        </DialogHeader>

                        {/* Formulário de edição/criação */}
                        <form onSubmit={handleSubmit}>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="name">Name</Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                  setFormData({ ...formData, name: e.target.value })
                                }
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                  setFormData({ ...formData, email: e.target.value })
                                }
                                disabled={!!editingProfile}    // Email não pode ser alterado ao editar
                                required
                              />
                            </div>

                            <div>
                              <Label htmlFor="access_type">Access Type</Label>
                              <Select
                                value={formData.access_type}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, access_type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Administrator</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="status">Status</Label>
                              <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, status: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Rodapé do diálogo. botões de cancelar e salvar */}
                          <DialogFooter className="mt-6">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              className="bg-inception-blue hover:bg-inception-purple"
                            >
                              {editingProfile ? 'Update' : 'Create'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Lista de perfis exibidos em linhas com badges e ações */}
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-4 border rounded-lg transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {profile.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {profile.email}
                            </p>
                          </div>

                          {/* Badge para tipo de acesso */}
                          <Badge
                            className={`text-xs ${getAccessTypeColor(
                              profile.access_type,
                            )}`}
                          >
                            {profile.access_type}
                          </Badge>

                          {/* Badge para status */}
                          <Badge
                            className={`text-xs ${getStatusColor(
                              profile.status,
                            )}`}
                          >
                            {profile.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Ações: editar e deletar */}
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => openEditDialog(profile)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteUser(profile.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de gerenciamento de workspaces */}
          <TabsContent value="workspaces">
            <WorkspaceManager />                             {/* Componente dedicado para workspaces */}
          </TabsContent>
          
          {/* Aba de gerenciamento de workshops */}
          <TabsContent value="workshops">
            <WorkshopManager />                             {/* Componente dedicado para workshops */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default SecureAdminPanel                              // Exporta o painel admin como default
