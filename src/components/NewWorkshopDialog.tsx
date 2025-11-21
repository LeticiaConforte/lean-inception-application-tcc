import React, { useState } from 'react'                                             // React e estado local
import { Button } from '@/components/ui/button'                                      // Botão UI
import { Input } from '@/components/ui/input'                                        // Campo de texto
import { Label } from '@/components/ui/label'                                        // Rótulo
import { Textarea } from '@/components/ui/textarea'                                  // Campo multiline
import {
  Dialog,                                                                              // Diálogo UI
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'                                                   // Ícone "+"
import { db } from '@/integrations/firebase/client'                                   // Firestore client
import { useAuth } from '@/components/AuthProvider'                                   // Autenticação
import NameConflictDialog from '@/components/NameConflictDialog'                      // Diálogo de conflito de nome
import { collection, query, where, getDocs } from 'firebase/firestore'               // Firestore ops

// Propriedades aceitas pelo diálogo de novo workshop
interface NewWorkshopDialogProps {
  isOpen: boolean                                                                      // Controle de abertura
  onClose: () => void                                                                  // Fechar diálogo
  onCreateWorkshop: (name: string, description: string, workspaceId: string | null) => void // Callback criação
  workspaceId?: string | null                                                          // Workspace alvo
}

// Componente principal
const NewWorkshopDialog: React.FC<NewWorkshopDialogProps> = ({
  isOpen,
  onClose,
  onCreateWorkshop,
  workspaceId
}) => {
  const [workshopName, setWorkshopName] = useState('')                                 // Nome do workshop
  const [description, setDescription] = useState('')                                   // Descrição opcional
  const [loading, setLoading] = useState(false)                                        // Flag de carregamento
  const [showConflictDialog, setShowConflictDialog] = useState(false)                  // Diálogo de conflito
  const { user } = useAuth()                                                           // Usuário logado

  // Verifica se workshop com esse nome já existe para o usuário e workspace
  const checkExistingWorkshop = async (workshopName: string) => {
    if (!user) return false

    try {
      const workshopsRef = collection(db, 'workshops')                                 // Coleção workshops

      // Query base: nome + criador
      let q = query(
        workshopsRef,
        where('name', '==', workshopName.trim()),
        where('created_by', '==', user.uid)
      )

      // Se workspaceId existe, filtra por ele. Caso contrário, workspace é null
      if (workspaceId) {
        q = query(q, where('workspace_id', '==', workspaceId))
      } else {
        q = query(q, where('workspace_id', '==', null))
      }

      const querySnapshot = await getDocs(q)                                           // Executa consulta
      return !querySnapshot.empty                                                      // Se vazio → não existe
    } catch (error) {
      console.error('Error checking workshop name:', error)
      return false
    }
  }

  // Gera nome único ao detectar conflito: "Name Copy", "Name Copy 2", etc.
  const generateUniqueName = async (baseName: string): Promise<string> => {
    let uniqueName = `${baseName} Copy`
    let counter = 2

    while (await checkExistingWorkshop(uniqueName)) {
      uniqueName = `${baseName} Copy ${counter}`
      counter++
    }

    return uniqueName
  }

  // Submissão do form
  const handleSubmit = async (e?: React.FormEvent, force = false) => {
    if (e) e.preventDefault()

    if (!workshopName.trim()) return

    setLoading(true)

    let finalName = workshopName.trim()

    // Verifica duplicidade caso não esteja forçando
    if (!force) {
      const exists = await checkExistingWorkshop(finalName)
      if (exists) {
        setLoading(false)
        setShowConflictDialog(true)
        return
      }
    } else {
      // Se houve conflito, cria nome alternativo
      finalName = await generateUniqueName(workshopName.trim())
      setWorkshopName(finalName)
    }

    // Tenta criar o workshop
    try {
      await onCreateWorkshop(finalName, description.trim(), workspaceId || null)

      setWorkshopName('')                                                              // Limpa form
      setDescription('')
      setShowConflictDialog(false)
      onClose()                                                                        // Fecha diálogo
    } catch (error) {
      console.error('Error creating workshop:', error)
    } finally {
      setLoading(false)
    }
  }

  // Confirmação ao detectar nome duplicado
  const handleConflictConfirm = () => {
    setShowConflictDialog(false)
    handleSubmit(undefined, true)                                                      // Força criação
  }

  // Usuário cancelou o conflito
  const handleConflictCancel = () => {
    setShowConflictDialog(false)
  }

  // Fecha diálogo somente se não estiver criando
  const handleClose = () => {
    if (!loading) onClose()
  }

  return (
    <>
      {/* Diálogo principal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Workshop</DialogTitle>
            <DialogDescription>
              Give your new workshop a name and an optional description.
            </DialogDescription>
          </DialogHeader>

          {/* Formulário */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="workshop-name">Workshop Name</Label>
                <Input
                  id="workshop-name"
                  placeholder="Enter workshop name..."
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="workshop-description">Description (optional)</Label>
                <Textarea
                  id="workshop-description"
                  placeholder="Enter workshop description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Rodapé do diálogo */}
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>

              {/* Botão de criar */}
              <Button
                type="submit"
                disabled={!workshopName.trim() || loading}
                className="bg-inception-blue hover:bg-inception-purple"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Workshop'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de conflito de nome */}
      <NameConflictDialog
        isOpen={showConflictDialog}
        onClose={handleConflictCancel}
        onConfirm={handleConflictConfirm}
        name={workshopName}
        type="workshop"
      />
    </>
  )
}

export default NewWorkshopDialog                                                      // Exporta componente
