import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog' // Modal base
import { Button } from '@/components/ui/button'        // Botão estilizado
import { Input } from '@/components/ui/input'          // Campo de texto
import { Textarea } from '@/components/ui/textarea'    // Área de texto
import { Label } from '@/components/ui/label'          // Rótulos
import { db } from '@/integrations/firebase/client'     // Instância do Firestore
import { useAuth } from '@/components/AuthProvider'     // Contexto de autenticação
import { useToast } from '@/hooks/use-toast'            // Toast system
import { collection, query, where, getDocs, serverTimestamp, doc, arrayUnion, getDoc, writeBatch } from 'firebase/firestore' // Firestore utilities
import NameConflictDialog from '@/components/NameConflictDialog' // Dialogo p/ conflitos de nome

// Props recebidas pelo componente
interface CreateWorkspaceDialogProps {
  isOpen: boolean                         // Controla a abertura do modal
  onClose: () => void                     // Fecha o modal
  onWorkspaceCreated: () => void          // Callback após criação
}

// Componente principal
const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
  isOpen,
  onClose,
  onWorkspaceCreated
}) => {
  const [name, setName] = useState('')                     // Nome do workspace
  const [description, setDescription] = useState('')       // Descrição
  const [isCreating, setIsCreating] = useState(false)      // Estado loading
  const [showConflictDialog, setShowConflictDialog] = useState(false) // Controle do diálogo de conflito
  const { user } = useAuth()                               // Usuário autenticado
  const { toast } = useToast()                             // Toast

  // Verifica se o usuário já possui workspace com o mesmo nome
  const checkExistingWorkspace = async (workspaceName: string) => {
    if (!user) return false

    const q = query(
      collection(db, 'workspaces'),
      where('name', '==', workspaceName.trim()),           // Mesmo nome
      where('created_by', '==', user.uid)                  // Criado pelo mesmo usuário
    )

    const querySnapshot = await getDocs(q)
    return !querySnapshot.empty                             // true se já existir
  }

  // Gera nome único caso haja conflito
  const generateUniqueName = async (baseName: string): Promise<string> => {
    let uniqueName = `${baseName} Copy`
    let counter = 2

    while (await checkExistingWorkspace(uniqueName)) {
      uniqueName = `${baseName} Copy ${counter}`            // Adiciona números
      counter++
    }

    return uniqueName
  }

  // Criador do workspace
  const handleCreate = async (force = false) => {
    if (!name.trim() || !user) return

    let finalName = name.trim()

    // Se não for forçado e já existe, exibe o diálogo de conflito
    if (!force) {
      const exists = await checkExistingWorkspace(finalName)
      if (exists) {
        setShowConflictDialog(true)
        return
      }
    }

    setIsCreating(true)
    try {
      // Se for forçado, gera nome único automaticamente
      if (force) {
        finalName = await generateUniqueName(name.trim())
      }

      const batch = writeBatch(db)                          // Inicia transação batch
      
      const workspaceRef = doc(collection(db, 'workspaces')) // Novo documento

      // Criador como primeiro membro
      const ownerMember = {
        email: user.email,
        name: user.displayName || 'Owner',
        photoURL: user.photoURL || '',
        role: 'owner',
      }

      // Dados principais do workspace
      batch.set(workspaceRef, {
        name: finalName,
        description: description.trim() || null,
        created_by: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        members: [ownerMember],                             // Injeta dono como membro
      })

      // Vincula workspace ao perfil do usuário
      const userProfileRef = doc(db, 'profiles', user.uid)
      const profileSnap = await getDoc(userProfileRef)

      if (profileSnap.exists()) {
        batch.update(userProfileRef, {
          workspace_ids: arrayUnion(workspaceRef.id)         // Adiciona ao array
        })
      } else {
        // Se não existir, cria perfil com workspace associado
        batch.set(userProfileRef, {
          name: user.displayName || user.email,
          email: user.email,
          created_at: serverTimestamp(),
          workspace_ids: [workspaceRef.id],
        })
      }

      await batch.commit()                                  // Salva tudo

      toast({ title: "Success", description: "Workspace created successfully." })

      setName('')                                           // Reset dos campos
      setDescription('')
      setShowConflictDialog(false)
      onClose()                                             // Fecha modal
      onWorkspaceCreated()                                  // Notifica sucesso
    } catch (error) {
      console.error('Error creating workspace:', error)
      toast({
        title: "Error",
        description: "Failed to create workspace.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Usuário confirma criação com nome automático
  const handleConflictConfirm = () => {
    setShowConflictDialog(false)
    handleCreate(true)                                      // Força nome único
  }

  const handleConflictCancel = () => {
    setShowConflictDialog(false)
  }

  return (
    <>
      {/* Modal de criação */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create a workspace to organize your workshops and collaborate with your team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            
            {/* Campo nome */}
            <div>
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                placeholder="Enter workspace name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Campo descrição */}
            <div>
              <Label htmlFor="workspace-description">Description (optional)</Label>
              <Textarea
                id="workspace-description"
                placeholder="Enter workspace description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose} disabled={isCreating}>
                Cancel
              </Button>

              <Button
                onClick={() => handleCreate()}
                disabled={!name.trim() || isCreating}
                className="bg-inception-blue hover:bg-inception-purple"
              >
                {isCreating ? 'Creating...' : 'Create Workspace'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de conflito de nome */}
      <NameConflictDialog
        isOpen={showConflictDialog}
        onClose={handleConflictCancel}
        onConfirm={handleConflictConfirm}
        name={name}
        type="workspace"
      />
    </>
  )
}

export default CreateWorkspaceDialog
