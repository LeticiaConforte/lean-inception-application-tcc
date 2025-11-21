import React, { useState, useRef, useEffect, createContext, useContext } from 'react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'  // Sheet como container lateral
import { Input } from '@/components/ui/input'          // Campo de entrada do chat
import { Button } from '@/components/ui/button'        // Botão genérico
import { Send } from 'lucide-react'                    // Ícone de envio
import { ScrollArea } from '@/components/ui/scroll-area' // Área rolável para mensagens

// Tipo da função disponível no contexto
interface DialogContextType {
  openDialog: () => void        // Abre o diálogo quando chamado
}

// Cria o contexto do diálogo
const DialogContext = createContext<DialogContextType | undefined>(undefined)

// Provider para encapsular a aplicação e habilitar abertura global do chat
export const ConversationDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)                  // Estado controla abertura do diálogo

  const openDialog = () => setIsOpen(true)                     // Função exposta no contexto

  return (
    <DialogContext.Provider value={{ openDialog }}>
      {children}
      {/* O diálogo fica sempre montado mas abre/fecha via estado */}
      <ConversationDialog open={isOpen} onOpenChange={setIsOpen} />
    </DialogContext.Provider>
  )
}

// Hook para acessar o contexto do diálogo
export const useDialog = () => {
  const context = useContext(DialogContext)
  if (context === undefined) {
    throw new Error('useDialog must be used within a ConversationDialogProvider') // Erro caso usado fora do Provider
  }
  return context
}

// Props do componente de diálogo
interface ConversationDialogProps {
  open: boolean                           // Estado do modal
  onOpenChange: (open: boolean) => void    // Atualiza o estado externo
}

const ConversationDialog: React.FC<ConversationDialogProps> = ({ open, onOpenChange }) => {
  // Lista de mensagens exibidas no chat
  const [messages, setMessages] = useState([
    { id: 1, text: 'Welcome to the chat!', sender: 'system' },
  ])

  const [newMessage, setNewMessage] = useState('')                    // Texto digitado no input
  const scrollAreaRef = useRef<HTMLDivElement>(null)                  // Ref para auto scroll

  // Envia mensagem e adiciona ao estado
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        { id: Date.now(), text: newMessage, sender: 'user' },         // Cria nova mensagem com ID único
      ])
      setNewMessage('')                                               // Limpa campo
    }
  }

  // Faz scroll automático sempre que mensagens forem alteradas
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:w-[540px] p-0 flex flex-col">
        {/* Títulos escondidos (para acessibilidade) */}
        <SheetTitle className="sr-only">Chat</SheetTitle>
        <SheetDescription className="sr-only">
          Start a conversation with your team.
        </SheetDescription>

        {/* Estrutura principal da coluna */}
        <div className="flex flex-col h-full">
          
          {/* Cabeçalho do painel */}
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Chat</h2>
            <p className="text-sm text-muted-foreground">
              Start a conversation with your team.
            </p>
          </div>

          {/* Área de mensagens com rolagem */}
          <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Balão da mensagem */}
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input + botão de enviar */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}      // Atualiza texto
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} // Envia com Enter
              />
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
