import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button' // Botões estilizados
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog' // Componentes do modal
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select' // Dropdown de seleção
import { useAuth } from '@/components/AuthProvider' // Contexto de autenticação
import { db } from '@/integrations/firebase/client' // Instância do Firestore
import { collection, query, where, getDocs } from 'firebase/firestore' // Funções do Firestore

// Estrutura de um workspace
interface Workspace {
  id: string          // ID do workspace
  name: string        // Nome do workspace
}

// Propriedades recebidas pelo diálogo
interface CloneWorkshopDialogProps {
  isOpen: boolean                     // Controle de visibilidade
  onClose: () => void                 // Fecha o modal
  onConfirm: (targetWorkspaceId: string | null) => void // Confirma clonagem
}

const CloneWorkshopDialog: React.FC<CloneWorkshopDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  // Lista de workspaces do usuário
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  // Workspace selecionado no dropdown
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)

  const { user } = useAuth() // Dados do usuário autenticado

  // Busca os workspaces do usuário sempre que o modal abre
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!user) return

      try {
        const workspacesRef = collection(db, 'workspaces') // Coleção "workspaces"
        const q = query(workspacesRef, where('owner_id', '==', user.uid)) // Filtra pelo usuário dono
        const querySnapshot = await getDocs(q) // Executa a consulta no Firestore

        // Converte documentos retornados em objetos Workspace
        const workspacesData = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Workspace)
        )

        setWorkspaces(workspacesData) // Atualiza estado com os workspaces encontrados
      } catch (error) {
        console.error('Error fetching workspaces: ', error)
      }
    }

    // Executa busca somente quando o modal estiver aberto
    if (isOpen) {
      fetchWorkspaces()
    }
  }, [isOpen, user]) // Reexecuta quando abre o modal ou quando o usuário muda

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {/* Cabeçalho do modal */}
        <DialogHeader>
          <DialogTitle>Clone Workshop</DialogTitle>
          <DialogDescription>
            Select a workspace to clone this workshop to, or clone it to your personal space.
          </DialogDescription>
        </DialogHeader>

        {/* Campo de seleção de destino */}
        <div className="py-4">
          <Select
            onValueChange={setSelectedWorkspace} // Atualiza o workspace selecionado
            defaultValue="personal"              // Valor padrão
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a workspace" />
            </SelectTrigger>

            <SelectContent>
              {/* Opção padrão: espaço pessoal */}
              <SelectItem value="personal">Personal Space</SelectItem>

              {/* Lista de workspaces do usuário */}
              {workspaces.map((ws) => (
                <SelectItem key={ws.id} value={ws.id}>
                  {ws.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={() =>
              onConfirm(selectedWorkspace === 'personal' ? null : selectedWorkspace)
            }
          >
            Clone
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CloneWorkshopDialog
