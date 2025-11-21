import { useState, useRef, useEffect, FC } from 'react'                                          // Importa hooks do React e o tipo FC para função de componente
import { Input } from '@/components/ui/input'                                                    // Campo de entrada estilizado
import { Button } from '@/components/ui/button'                                                  // Botão estilizado
import { ScrollArea } from '@/components/ui/scroll-area'                                         // Área com rolagem customizada
import {
  Send,
  Bot,
  User,
  Plus,
  History,
  Sparkles,
  ArrowLeft
} from 'lucide-react'                                                                            // Ícones usados na interface do chat
import ReactMarkdown from 'react-markdown'                                                       // Componente para renderizar Markdown
import remarkGfm from 'remark-gfm'                                                               // Plugin para suportar GFM. tabelas. listas etc.
import { getConversation } from '@/lib/db-client'                                                // Função para carregar o histórico de conversa do backend

// Estrutura de uma mensagem no chat
interface Message {
  sender: 'user' | 'ai'                                                                          // Quem enviou a mensagem. usuário ou IA
  text: string                                                                                   // Conteúdo textual da mensagem
}

// Estrutura de item de histórico retornado pela API
interface HistoryItem {
  role: 'user' | 'model'                                                                         // Papel no histórico original. usuário ou modelo
  parts: { text: string }[]                                                                      // Lista de partes com texto
}

// Propriedades esperadas pelo componente de chat do template
interface TemplateChatProps {
  workshopId: string                                                                             // ID do workshop usado para buscar o histórico
}

// Componente principal do chat do template com IA
export const TemplateChat: FC<TemplateChatProps> = ({ workshopId }) => {
  const [messages, setMessages] = useState<Message[]>([])                                       // Lista de mensagens exibidas no chat
  const [input, setInput] = useState('')                                                         // Texto atual digitado no input
  const [isLoading, setIsLoading] = useState(false)                                             // Indica se a IA está respondendo
  const [view, setView] = useState<'chat' | 'history'>('chat')                                  // Controla visualização atual. chat ou histórico

  const scrollContainerRef = useRef<HTMLDivElement>(null)                                       // Referência para o container com rolagem

  // Carrega o histórico de conversa do backend quando o chat é aberto
  useEffect(() => {
    if (view === 'chat') {                                                                      // Só carrega histórico se estiver na aba de chat
      const loadConversation = async () => {
        const conversationHistory = await getConversation(workshopId) as HistoryItem[]          // Busca histórico no backend para o workshop
        if (conversationHistory && conversationHistory.length > 0) {                            // Verifica se há itens no histórico
          const loadedMessages: Message[] = conversationHistory.map((item: HistoryItem) => ({   // Converte itens de histórico para estrutura de Message
            sender: item.role === 'user' ? 'user' : 'ai',                                       // Mapeia role de 'user' ou 'model' para 'user' ou 'ai'
            text: item.parts?.[0]?.text ?? ''                                                   // Usa o texto da primeira parte. ou string vazia
          }))
          setMessages(loadedMessages)                                                            // Atualiza estado com as mensagens carregadas
        }
      }

      if (workshopId) {                                                                         // Garante que há um workshopId válido
        loadConversation()                                                                      // Executa carregamento do histórico
      }
    }
  }, [workshopId, view])                                                                        // Reexecuta quando workshopId ou view mudam

  // Faz scroll automático para a última mensagem sempre que a lista de mensagens muda
  useEffect(() => {
    if (!scrollContainerRef.current) return                                                     // Se a ref ainda não existe. sai da função

    requestAnimationFrame(() => {                                                               // Usa requestAnimationFrame para garantir layout atualizado
      try {
        const el = scrollContainerRef.current!                                                  // Referência ao elemento de scroll
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })                               // Rola até o final com animação suave
      } catch {                                                                                 // Evita quebra da aplicação caso algo falhe na rolagem
        // Ignora erros de scroll silenciosamente
      }
    })
  }, [messages])                                                                                // Executa toda vez que a lista de mensagens é alterada

  // Envia uma nova mensagem para a API de IA
  const handleSend = async () => {
    const trimmedInput = input.trim()                                                           // Remove espaços extras do início e fim
    if (!trimmedInput || isLoading) return                                                      // Impede envio se vazio ou se já estiver carregando

    setIsLoading(true)                                                                          // Marca estado de carregamento
    setInput('')                                                                                // Limpa o campo de entrada

    const userMessage: Message = { sender: 'user', text: trimmedInput }                         // Mensagem do usuário
    const aiMessagePlaceholder: Message = { sender: 'ai', text: '' }                            // Placeholder vazio para resposta da IA

    setMessages(prev => [...prev, userMessage, aiMessagePlaceholder])                           // Adiciona mensagem do usuário e placeholder da IA

    try {
      const response = await fetch('/api/ai', {                                                 // Chamada à API da IA
        method: 'POST',                                                                         // Método HTTP POST
        headers: { 'Content-Type': 'application/json' },                                        // Informa que o corpo é JSON
        body: JSON.stringify({
          message: trimmedInput,                                                                // Mensagem atual do usuário
          history: messages.slice(0, -2)                                                        // Histórico enviado para a IA. aqui é feita uma fatia defensiva
        })
      })

      if (!response.ok) {                                                                       // Caso a resposta não seja bem sucedida
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Failed to parse error response.' }))                        // Tenta parsear o erro em JSON. ou mensagem padrão
        throw new Error(errorData.message || `AI backend error (${response.status})`)           // Lança erro com mensagem mais clara
      }

      const data = await response.json()
      const aiText = typeof data.message === 'string' ? data.message : ''                       // Garante que o texto da IA é sempre uma string

      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.sender === 'ai') {
          lastMessage.text = aiText
        }
        return newMessages
      })
    } catch (err: any) {
      console.error('Error calling AI API:', err)

      const errorMessage =
        `Sorry, an error occurred. Here is the detailed error message:\n\n---\n\n\`\`\`\n${err.message || 'An unknown error occurred.'}\n\`\`\``

      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.sender === 'ai') {
          lastMessage.text = errorMessage
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Inicia uma nova conversa limpando o histórico local
  const handleNewChat = () => {
    setMessages([])
    setView('chat')
  }

  // Visualização de histórico. ainda em desenvolvimento
  if (view === 'history') {
    return (
      <div className="flex flex-col h-full bg-background text-foreground">
        {/* Cabeçalho da aba de histórico */}
        <div className="flex items-center h-16 border-b px-4 flex-shrink-0">
          <Button
            onClick={() => setView('chat')}
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">History</h2>
        </div>
        {/* Mensagem placeholder enquanto histórico não está implementado */}
        <div className="flex-grow p-4 text-center text-muted-foreground">
          <p>O histórico de conversas estará disponível aqui em breve.</p>
        </div>
      </div>
    )
  }

  // Visualização principal de chat com a IA
  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Cabeçalho do chat */}
      <div className="flex items-center justify-between h-16 border-b px-4 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold tracking-wider">AI Assistant</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView('history')}
          >
            <History className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Área principal do chat. com rolagem */}
      <ScrollArea className="flex-grow p-4" ref={scrollContainerRef}>
        {/* Mensagem inicial quando não há mensagens e não está carregando */}
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <p>Start a new conversation to begin chatting with the AI.</p>
          </div>
        )}

        {/* Renderização das mensagens do chat */}
        {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-6 flex items-start space-x-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {/* Ícone da IA à esquerda quando a mensagem é da IA */}
              {msg.sender === 'ai' && (
                <Bot className="h-6 w-6 text-primary flex-shrink-0" />
              )}

              {/* Balão da mensagem. estilizado de forma diferente para user e IA */}
              <div
                className={`p-3 rounded-lg max-w-2xl ${msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground self-end'
                    : 'bg-muted'
                  }`}>
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {(msg.text ?? '').replace(/\\n/g, '\n')}
                  </ReactMarkdown>
                </div>
                {/* Indicador de carregamento. mostrado apenas na última mensagem da IA enquanto espera resposta */}
                {isLoading && msg.sender === 'ai' && index === messages.length - 1 && (
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse inline-block ml-2" />
                )}
              </div>

              {/* Ícone do usuário à direita quando a mensagem é do usuário */}
              {msg.sender === 'user' && (
                <User className="h-6 w-6 text-primary flex-shrink-0" />
              )}
            </div>
          ))}
      </ScrollArea>

      {/* Área de entrada de mensagem. simplificada */}
      <div className="px-4 py-3 border-t bg-background">
        <div className="relative">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={isLoading}
            className="bg-muted border-none rounded-full py-6 pl-4 pr-16 text-base" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex">
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="rounded-full bg-primary text-primary-foreground">
              {isLoading ? (
                <Sparkles className="h-5 w-5 animate-pulse" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
