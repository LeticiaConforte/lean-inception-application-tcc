import React, { useState, useEffect } from 'react'                           // Importa React e hooks de estado/efeito
import { Button } from '@/components/ui/button'                              // Botão estilizado
import CloneWorkshopDialog from '@/components/CloneWorkshopDialog'           // Dialog de clonagem
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card' // Componentes de cartão
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog' // Dialog de confirmação
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu' // Menu contextual
import { useToast } from '@/hooks/use-toast'                                 // Hook de notificação
import { db } from '@/integrations/firebase/client'                          // Firestore
import { useAuth } from '@/components/AuthProvider'                          // Autenticação
import { useClickOutside } from '@/hooks/useClickOutside'                    // Hook para fechar ao clicar fora
import { MoreVertical, Play, Copy, Trash2, Plus } from 'lucide-react'        // Ícones
import { format } from 'date-fns'                                            // Formatação de datas
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, orderBy, writeBatch, documentId } from 'firebase/firestore' // Métodos do Firestore
import { defaultTemplates } from '@/lib/defaultTemplates'                    // Templates padrão com contagem

// Tipagem dos dados de um workshop
interface Workshop {
  id: string
  name: string
  status: string
  current_step: number
  total_steps: number
  created_by: string
  created_at: any
  updated_at: any
  workspace_id: string | null
}

// Tipagem das props do componente
interface RecentWorkshopsProps {
  onSelectWorkshop: (workshopId: string, workshopName?: string, participants?: string[], workspaceId?: string | null) => void
  onShowNewWorkshopDialog: () => void
  workspaceId?: string | null
  filters?: any
}

// Componente principal
const RecentWorkshops: React.FC<RecentWorkshopsProps> = ({ onSelectWorkshop, onShowNewWorkshopDialog, workspaceId = null, filters = {} }) => {
  const [workshops, setWorkshops] = useState<Workshop[]>([])               // Lista de workshops
  const [loading, setLoading] = useState(true)                             // Estado de carregamento
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)          // Estado do dialog de deletar
  const [workshopToDelete, setWorkshopToDelete] = useState<Workshop | null>(null) // Item a ser deletado
  const [cloning, setCloning] = useState<string | null>(null)              // ID do workshop sendo clonado
  const [showCloneDialog, setShowCloneDialog] = useState(false)            // Estado do dialog de clone
  const [workshopToClone, setWorkshopToClone] = useState<Workshop | null>(null) // Workshop para clonar
  const { toast } = useToast()                                             // Notificações
  const { user } = useAuth()                                               // Dados do usuário

  // Fecha o dialog deletar ao clicar fora
  const dialogRef = useClickOutside<HTMLDivElement>(() => {
    setDeleteDialogOpen(false)
  }, deleteDialogOpen)

  // Formata datas vindas do Firestore
  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    const d = date?.toDate ? date.toDate() : new Date(date)
    return format(d, 'MMM d, yyyy')
  }

  // Carrega workshops com regras de permissão e filtros
  const fetchWorkshops = async () => {
    if (!user || !user.email) return
    setLoading(true)

    try {
      const workshopsRef = collection(db, 'workshops')
      let queryConstraints: any[] = []

      // Se vier workspaceId, aplica regras de membro
      if (workspaceId) {
        const memberQuery = query(
          collection(db, 'workspace_members'),
          where('workspace_id', '==', workspaceId),
          where('user_id', '==', user.uid),
          where('status', '==', 'active')
        )
        const memberSnap = await getDocs(memberQuery)

        // Usuário não pertence ao workspace
        if (memberSnap.empty) {
          setWorkshops([])
          setLoading(false)
          return
        }

        const memberData = memberSnap.docs[0].data()

        // Caso seja membro limitado, só exibe workshops permitidos
        if (memberData.role === 'limited') {
          if (memberData.accessible_workshops?.length > 0) {
            queryConstraints.push(where(documentId(), 'in', memberData.accessible_workshops))
          } else {
            setWorkshops([])
            setLoading(false)
            return
          }
        } else {
          queryConstraints.push(where('workspace_id', '==', workspaceId))
        }
      } else {
        // Espaço pessoal
        queryConstraints.push(where('workspace_id', '==', null))
        queryConstraints.push(where('participants', 'array-contains', user.email))
      }

      // Filtro de status
      if (filters.status) {
        queryConstraints.push(where('status', '==', filters.status))
      }

      // Busca com texto
      if (filters.searchTerm) {
        queryConstraints.push(where('name', '>=', filters.searchTerm))
        queryConstraints.push(where('name', '<=', filters.searchTerm + '\uf8ff'))
        queryConstraints.push(orderBy('name', 'asc'))
      } else {
        queryConstraints.push(orderBy('updated_at', 'desc'))
      }

      const q = query(workshopsRef, ...queryConstraints)
      const querySnapshot = await getDocs(q)
      const workshopsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workshop))
      setWorkshops(workshopsData)
    } catch (error: any) {
      console.error('Error fetching workshops:', error)
      toast({ title: "Error", description: `Failed to load workshops. ${error.message}`, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Recarrega ao mudar usuário ou filtros
  useEffect(() => {
    fetchWorkshops()
  }, [user, workspaceId, filters])

  // Seleciona workshop para deletar
  const handleDeleteClick = (workshop: Workshop, event: React.MouseEvent) => {
    event.stopPropagation()
    setWorkshopToDelete(workshop)
    setDeleteDialogOpen(true)
  }

  // Seleciona workshop para clonar
  const handleCloneWorkshop = (workshop: Workshop, event: React.MouseEvent) => {
    event.stopPropagation()
    setWorkshopToClone(workshop)
    setShowCloneDialog(true)
  }

  // Processa clonagem
  const performClone = async (targetWorkspaceId: string | null) => {
    if (!user || !workshopToClone) return
    setCloning(workshopToClone.id)

    try {
      const countedTemplates = defaultTemplates.filter(t => t.is_counted).length

      const newWorkshopRef = await addDoc(collection(db, 'workshops'), {
        name: `${workshopToClone.name} (Copy)`,
        created_by: user.uid,
        participants: [user.email!],
        current_step: 1,
        total_steps: countedTemplates,
        workspace_id: targetWorkspaceId,
        status: 'in_progress',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      const templatesRef = collection(db, 'workshops', workshopToClone.id, 'templates')
      const templatesQuery = query(templatesRef, orderBy('step_number'))
      const templatesSnapshot = await getDocs(templatesQuery)

      if (!templatesSnapshot.empty) {
        const batch = writeBatch(db)
        templatesSnapshot.docs.forEach(templateDoc => {
          const newTemplateRef = doc(collection(db, 'workshops', newWorkshopRef.id, 'templates'))
          batch.set(newTemplateRef, templateDoc.data())
        })
        await batch.commit()
      }

      toast({ title: 'Success', description: 'Workshop cloned successfully.' })
      fetchWorkshops()
    } catch (error: any) {
      console.error('Error cloning workshop:', error)
      toast({ title: 'Error', description: `Failed to create a copy: ${error.message}`, variant: 'destructive' })
    } finally {
      setCloning(null)
      setShowCloneDialog(false)
      setWorkshopToClone(null)
    }
  }

  // Exclui workshop e templates
  const confirmDelete = async () => {
    if (!workshopToDelete || !user) return

    // Regras de permissão
    if (user.uid !== workshopToDelete.created_by) {
      toast({ title: "Permission Denied", description: "You can only delete workshops you created.", variant: "destructive" })
      return
    }

    try {
      const batch = writeBatch(db)
      const templatesRef = collection(db, 'workshops', workshopToDelete.id, 'templates')
      const templatesSnapshot = await getDocs(templatesRef)
      templatesSnapshot.docs.forEach(doc => batch.delete(doc.ref))

      batch.delete(doc(db, 'workshops', workshopToDelete.id))
      await batch.commit()

      toast({ title: "Success", description: "Workshop deleted successfully." })
      setWorkshops(prev => prev.filter(w => w.id !== workshopToDelete.id))
    } catch (error: any) {
      console.error('Error deleting workshop:', error)
      toast({ title: "Error", description: `Deletion failed: ${error.message}`, variant: "destructive" })
    } finally {
      setDeleteDialogOpen(false)
      setWorkshopToDelete(null)
    }
  }

  // Total correto de templates contados
  const correctTotalSteps = defaultTemplates.filter(t => t.is_counted).length

  // Estado de carregamento
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3"><div className="h-4 bg-gray-200 rounded w-3/4"></div></CardHeader>
            <CardContent><div className="h-10 bg-gray-200 rounded mt-4"></div></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Card para criar novo workshop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          className="border-2 border-dashed border-gray-300 hover:border-inception-blue transition-all cursor-pointer bg-gray-50 hover:bg-blue-50 min-h-[200px] flex items-center justify-center"
          onClick={onShowNewWorkshopDialog}
        >
          <CardContent className="text-center p-6">
            <div className="bg-inception-blue rounded-full p-3 inline-block"><Plus className="h-6 w-6 text-white" /></div>
            <h3 className="text-base font-semibold mt-3">New Workshop</h3>
          </CardContent>
        </Card>

        {/* Lista de workshops */}
        {workshops.map((workshop) => {
          const progressPercentage = correctTotalSteps > 0 ? (workshop.current_step / correctTotalSteps) * 100 : 0

          return (
            <Card key={workshop.id} className="hover:shadow-lg transition-shadow group min-h-[200px] flex flex-col">
              <div className="cursor-pointer flex-grow" onClick={() => onSelectWorkshop(workshop.id, workshop.name, [], workshop.workspace_id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold group-hover:text-blue-600">
                      {workshop.name}
                    </CardTitle>

                    {/* Menu de opções */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => onSelectWorkshop(workshop.id, workshop.name, [], workshop.workspace_id)}>
                          <Play className="mr-2 h-4 w-4" />Continue
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={(e) => handleCloneWorkshop(workshop, e)} disabled={cloning === workshop.id}>
                          <Copy className="mr-2 h-4 w-4" />
                          {cloning === workshop.id ? 'Cloning...' : 'Clone'}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={(e) => handleDeleteClick(workshop, e)} className="text-red-600 focus:text-red-700">
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                {/* Progresso e data */}
                <CardContent className="flex-grow flex flex-col justify-end">
                  <div className="space-y-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-inception-blue h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <p>Updated: {formatDate(workshop.updated_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Botão abrir */}
              <CardFooter className="pt-4">
                <Button className="w-full bg-inception-blue text-white hover:bg-inception-purple"
                  onClick={() => onSelectWorkshop(workshop.id, workshop.name, [], workshop.workspace_id)}>
                  Open
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Estado vazio */}
      {workshops.length === 0 && !loading && (
        <div className="text-center py-12 col-span-full">
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-lg font-medium">No workshops found</h3>
            <p className="text-gray-500">Create a new workshop or check your filters.</p>
          </div>
        </div>
      )}

      {/* Dialog de deletar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent ref={dialogRef}>
          <DialogHeader>
            <DialogTitle>Delete Workshop</DialogTitle>
            <DialogDescription>
              Are you sure to delete "{workshopToDelete?.name}"? This is irreversible.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de clonar */}
      {showCloneDialog && workshopToClone && (
        <CloneWorkshopDialog
          isOpen={showCloneDialog}
          onClose={() => setShowCloneDialog(false)}
          onConfirm={performClone}
        />
      )}
    </div>
  )
}

export default RecentWorkshops                                              // Exporta componente
