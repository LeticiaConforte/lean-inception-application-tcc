import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog' // Modal base
import { Button } from '@/components/ui/button' // Botão estilizado
import { Textarea } from '@/components/ui/textarea' // Textarea estilizado
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar' // Avatares
import { db } from '@/integrations/firebase/client' // Firestore client
import { useAuth } from '@/components/AuthProvider' // Autenticação (Firebase)
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore' // Firestore CRUD + listener
import { formatDistanceToNow } from 'date-fns' // Formata datas relativas

// Estrutura interna de um comentário armazenado no Firestore
interface Comment {
  id: string
  author: string
  authorId: string
  text: string
  timestamp: any
  avatarUrl?: string
}

// Props recebidas pelo modal de comentários
interface CommentsDialogProps {
  open: boolean                           // Controle de visibilidade
  onOpenChange: (open: boolean) => void   // Função para abrir/fechar
  workshopId: string                      // ID do workshop
  templateId: string                      // ID do template dentro do workshop
  templateName: string                    // Nome do template exibido no modal
}

const CommentsDialog: React.FC<CommentsDialogProps> = ({
  open,
  onOpenChange,
  workshopId,
  templateId,
  templateName,
}) => {
  // Armazena conteúdo do input
  const [comment, setComment] = useState('')
  // Lista de comentários carregados do Firestore
  const [comments, setComments] = useState<Comment[]>([])

  const { user } = useAuth() // Usuário autenticado

  // Carrega comentários em tempo real com Firestore listener
  useEffect(() => {
    if (!workshopId || !templateId) return

    // Caminho: workshops -> {workshopId} -> templates -> {templateId} -> comments
    const commentsRef = collection(
      db,
      'workshops',
      workshopId,
      'templates',
      templateId,
      'comments'
    )

    // Ordena comentários por timestamp decrescente
    const q = query(commentsRef, orderBy('timestamp', 'desc'))

    // Listener em tempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,     // ID do comentário
            ...doc.data(), // Dados do Firestore
          } as Comment)
      )

      setComments(fetchedComments) // Atualiza no estado
    })

    return () => unsubscribe() // Remove listener no unmount
  }, [workshopId, templateId])

  // Adiciona um novo comentário
  const handleAddComment = async () => {
    if (comment.trim() === '' || !user) return

    const commentsRef = collection(
      db,
      'workshops',
      workshopId,
      'templates',
      templateId,
      'comments'
    )

    // Salva no Firestore
    await addDoc(commentsRef, {
      author: user.displayName || user.email, // Nome do autor
      authorId: user.uid,                    // ID do autor
      text: comment,                         // Conteúdo do comentário
      timestamp: serverTimestamp(),          // Timestamp do servidor
      avatarUrl: user.photoURL,              // Foto do usuário
    })

    setComment('') // Limpa textarea
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Step Comments</DialogTitle>
          <p className="text-sm text-gray-500">
            Comments for {templateName}
          </p>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Campo para adicionar comentários */}
          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <Button onClick={handleAddComment} className="w-full">
              Add Comment
            </Button>
          </div>

          {/* Lista de comentários */}
          <div className="space-y-4">
            <h3 className="font-semibold text-center">
              Comments ({comments.length})
            </h3>

            <div className="max-h-64 overflow-y-auto space-y-4 pr-4">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start space-x-3">
                    {/* Avatar do autor */}
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.avatarUrl} alt={c.author} />
                      <AvatarFallback>
                        {c.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Conteúdo do comentário */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{c.author}</p>

                        <p className="text-xs text-gray-500">
                          {c.timestamp
                            ? formatDistanceToNow(c.timestamp.toDate(), {
                                addSuffix: true,
                              })
                            : 'just now'}
                        </p>
                      </div>

                      <p className="text-sm text-gray-700">{c.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  No comments yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CommentsDialog
