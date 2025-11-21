"use client"
// Indica que este componente deve ser renderizado no cliente (Next.js App Router)

import { useState } from "react"
// Hook React para gerenciar estados locais

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
// Componentes de Dialog (Radix UI estilizados)
// Controlam pop-up modal, título, descrição e rodapé

import { Button } from "@/components/ui/button"
// Botão estilizado

import { Input } from "@/components/ui/input"
// Campo de input estilizado

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// Componentes do Select (Radix com estilização customizada)

import { Label } from "@/components/ui/label"
// Label estilizada, associada ao input via htmlFor

import { useToast } from "@/components/ui/use-toast"
// Hook customizado para disparar toasts de feedback ao usuário

import { useAuth } from "@/components/AuthProvider"
// Hook customizado que retorna o usuário autenticado (Firebase Auth)

// Tipagem das props esperadas pelo componente pai
interface AddMemberDialogProps {
  isOpen: boolean               // Define se o diálogo está aberto
  onClose: () => void           // Função para fechar o modal
  workspaceId: string           // ID do workspace onde o membro será adicionado
  workspaceName: string         // Nome do workspace (para constar no email de convite)
  onMemberAdded: () => void     // Callback executado ao concluir com sucesso
}

// Componente funcional do dialog para adicionar um novo membro
const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  onMemberAdded,
}) => {
  // Armazena o email digitado
  const [email, setEmail] = useState("")

  // Armazena o cargo selecionado. Valor padrão: editor
  const [role, setRole] = useState<'editor' | 'admin'>('editor')

  // Booleano que controla estado de carregamento enquanto o convite é enviado
  const [isSending, setIsSending] = useState(false)

  const { toast } = useToast()
  // Função para exibir notificações (sucesso/erro)

  const { user } = useAuth()
  // Usuário autenticado atual (via Firebase Auth)

  // Função principal que executa o envio do convite
  const handleAddMember = async () => {
    // Valida email vazio
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email.",
        variant: "destructive",
      })
      return
    }

    // Valida usuário logado
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add members.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    // Indica que a requisição está em progresso

    try {
      // Obtém token JWT do usuário autenticado para autenticação no backend
      const token = await user.getIdToken()

      // Faz chamada à API interna /api/invite
      const response = await fetch(`/api/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        // Payload com dados necessários para envio do convite
        body: JSON.stringify({
          recipientEmail: email,
          workspaceId: workspaceId,
          workspaceName: workspaceName,
          role: role,
        }),
      })

      // A API pode retornar texto puro ou JSON. Capturamos texto primeiro.
      const text = await response.text()

      try {
        // Tenta fazer parse do JSON retornado
        const result = JSON.parse(text)

        // Se a resposta não estiver OK, dispara erro
        if (!response.ok) {
          throw new Error(result.message || "Failed to add member.")
        }

        // Exibe toast de sucesso
        toast({
          title: "Success!",
          description: `Invitation sent to ${email}.`,
        })

        // Notifica componente pai
        onMemberAdded()

        // Fecha o modal
        onClose()

      } catch (e) {
        // Se cair aqui, significa que o servidor retornou algo que não é JSON
        throw new Error(`Server returned a non-JSON response: ${text}`)
      }

    } catch (error: any) {
      // Captura qualquer erro inesperado no processo
      console.error("Error adding member:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      // Finaliza estado de loading
      setIsSending(false)
    }
  }

  return (
    // Dialog controlado via props open + onOpenChange
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Conteúdo centralizado do modal */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* Título do modal */}
          <DialogTitle>Add a New Member</DialogTitle>

          {/* Descrição contextual para o usuário */}
          <DialogDescription>
            Invite a new member to collaborate in your workspace. They will receive an email to accept the invitation.
          </DialogDescription>
        </DialogHeader>

        {/* Corpo do modal */}
        <div className="flex flex-col gap-6 py-4">
          {/* Campo de email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
            />
          </div>

          {/* Campo de seleção de role */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role</Label>

            {/* Select estilizado */}
            <Select
              value={role}
              onValueChange={(value: 'editor' | 'admin') => setRole(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rodapé com botões de ação */}
        <DialogFooter className="justify-center sm:justify-center">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleAddMember} disabled={isSending}>
            {/* Botão com estado de loading */}
            {isSending ? "Sending Invite..." : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Exporta componente como default
export default AddMemberDialog
