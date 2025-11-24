import { useState, useRef, useEffect, FC } from 'react' // Importa hooks do React (useState, useRef, useEffect) e o tipo FC para tipar o componente como Function Component
import { Input } from '@/components/ui/input' // Importa o componente de input estilizado
import { Button } from '@/components/ui/button' // Importa o componente de botão estilizado
import { ScrollArea } from '@/components/ui/scroll-area' // Importa o componente de área rolável para o chat
import {
  Send,
  Bot,
  User,
  Plus,
  History,
  Sparkles,
  ArrowLeft
} from 'lucide-react' // Importa ícones usados na interface do chat
import ReactMarkdown from 'react-markdown' // Importa o componente que renderiza texto em formato Markdown
import remarkGfm from 'remark-gfm' // Plugin para suportar sintaxe estendida do GitHub Flavored Markdown
import { getConversation } from '@/lib/db-client' // Função que obtém o histórico de conversas a partir do backend ou banco

// Interface que define a estrutura de uma mensagem na UI do chat
interface Message {
  sender: 'user' | 'ai' // Identifica o remetente. Pode ser o usuário ou a IA
  text: string // Texto da mensagem
}

// Interface que representa um item do histórico retornado pelo backend
interface HistoryItem {
  role: 'user' | 'model' // Papel da mensagem no histórico. user ou model (IA)
  parts: { text: string }[] // Array de partes de mensagem. Aqui interessa o campo text
}

// Props esperadas pelo componente TemplateChat
interface TemplateChatProps {
  workshopId: string // ID do workshop ao qual o chat está associado
}

// Componente principal do chat, tipado como FC com TemplateChatProps
export const TemplateChat: FC<TemplateChatProps> = ({ workshopId }) => {
  const [messages, setMessages] = useState<Message[]>([]) // Estado que armazena a lista de mensagens do chat
  const [input, setInput] = useState('') // Estado que guarda o texto atual digitado no campo de input
  const [isLoading, setIsLoading] = useState(false) // Estado que indica se a requisição com a IA está em andamento
  const [view, setView] = useState<'chat' | 'history'>('chat') // Estado que alterna entre a visão do chat e a visão de histórico

  const scrollContainerRef = useRef<HTMLDivElement>(null) // Referência para o container rolável do chat para controlar o scroll automático

  useEffect(() => { // Efeito que carrega o histórico de conversas quando a view é 'chat' ou quando o workshopId muda
    if (view === 'chat') { // Garante que só carregue histórico quando a visão atual é o chat
      const loadConversation = async () => { // Função assíncrona interna para buscar o histórico
        const conversationHistory = await getConversation(workshopId) as HistoryItem[] // Busca o histórico usando o workshopId e tipa o resultado como HistoryItem[]
        if (conversationHistory && conversationHistory.length > 0) { // Se houver histórico e tiver pelo menos um item
          const loadedMessages: Message[] = conversationHistory.map((item: HistoryItem) => ({ // Converte o formato do histórico para o formato Message usado pela UI
            sender: item.role === 'user' ? 'user' : 'ai', // Mapeia role user para user e qualquer outro (model) para ai
            text: item.parts?.[0]?.text ?? '' // Usa o texto da primeira parte da mensagem ou string vazia como fallback
          }))
          setMessages(loadedMessages) // Atualiza o estado messages com as mensagens carregadas
        }
      }

      if (workshopId) { // Só tenta carregar o histórico se existir um workshopId válido
        loadConversation() // Chama a função assíncrona para carregar o histórico
      }
    }
  }, [workshopId, view]) // Dependências do efeito. Reexecuta quando workshopId ou view mudarem

  useEffect(() => { // Efeito responsável por rolar o container do chat sempre que as mensagens mudam
    if (!scrollContainerRef.current) return // Se a referência ainda não está definida, sai sem fazer nada

    requestAnimationFrame(() => { // Usa requestAnimationFrame para garantir que o layout esteja atualizado antes do scroll
      try {
        const el = scrollContainerRef.current! // Obtém o elemento DOM do container rolável. Usa non null assertion
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }) // Rola até o final do conteúdo com animação suave
      } catch {
        // Silencia qualquer erro de scroll sem quebrar a aplicação
      }
    })
  }, [messages]) // O efeito dispara sempre que a lista de mensagens é atualizada

  const handleSend = async () => { // Função responsável por enviar a mensagem do usuário para a API de IA
    const trimmedInput = input.trim() // Remove espaços extras no início e no fim do texto digitado
    if (!trimmedInput || isLoading) return // Se o input estiver vazio ou já estiver carregando, não faz nada

    setIsLoading(true) // Marca que a requisição com a IA está em andamento
    setInput('') // Limpa o campo de input após o envio

    const userMessage: Message = { sender: 'user', text: trimmedInput } // Cria o objeto de mensagem do usuário
    const aiMessagePlaceholder: Message = { sender: 'ai', text: '' } // Cria uma mensagem vazia da IA como placeholder para mostrar enquanto aguarda a resposta

    setMessages(prev => [...prev, userMessage, aiMessagePlaceholder]) // Adiciona a mensagem do usuário e o placeholder da IA ao histórico de mensagens

    try {
      const response = await fetch('/api/ai', { // Faz requisição POST para a rota de API que conversa com a IA
        method: 'POST', // Método HTTP POST
        headers: { 'Content-Type': 'application/json' }, // Define que o corpo da requisição é JSON
        body: JSON.stringify({
          message: trimmedInput, // Mensagem atual do usuário
          history: messages.slice(0, -2) // Histórico anterior que será enviado para a IA, excluindo as duas últimas mensagens adicionadas agora
        })
      })

      if (!response.ok) { // Se a resposta não estiver com status de sucesso
        const errorData = await response
          .json() // Tenta parsear o corpo da resposta como JSON
          .catch(() => ({ message: 'Failed to parse error response.' })) // Fallback caso o parse do JSON falhe
        throw new Error(errorData.message || `AI backend error (${response.status})`) // Lança uma Error com a mensagem retornada ou uma mensagem padrão com o status
      }

      const data = await response.json() // Faz o parse do JSON na resposta bem-sucedida
      const aiText = typeof data.message === 'string' ? data.message : '' // Garante que message seja uma string. Caso contrário, usa string vazia

      setMessages(prev => { // Atualiza o estado de messages com a resposta da IA
        const newMessages = [...prev] // Cria uma cópia rasa das mensagens atuais
        const lastMessage = newMessages[newMessages.length - 1] // Pega a última mensagem (que deve ser o placeholder da IA)
        if (lastMessage && lastMessage.sender === 'ai') { // Confere se a última mensagem realmente pertence à IA
          lastMessage.text = aiText // Substitui o texto vazio pelo texto retornado pela IA
        }
        return newMessages // Retorna o novo array de mensagens para atualizar o estado
      })
    } catch (err: any) { // Captura erros que ocorrerem durante a chamada à API de IA
      console.error('Error calling AI API:', err) // Loga o erro completo no console

      const errorMessage = // Monta uma mensagem de erro detalhada para exibir diretamente no chat
        `Sorry, an error occurred. Here is the detailed error message:\n\n---\n\n\`\`\`\n${err.message || 'An unknown error occurred.'}\n\`\`\``

      setMessages(prev => { // Atualiza o placeholder da IA com a mensagem de erro formatada
        const newMessages = [...prev] // Copia o array de mensagens atual
        const lastMessage = newMessages[newMessages.length - 1] // Obtém a última mensagem
        if (lastMessage && lastMessage.sender === 'ai') { // Garante que seja a mensagem da IA
          lastMessage.text = errorMessage // Substitui o texto pela mensagem de erro em formato Markdown
        }
        return newMessages // Retorna o array atualizado
      })
    } finally {
      setIsLoading(false) // Independentemente de sucesso ou falha, indica que o carregamento terminou
    }
  }

  const handleNewChat = () => { // Função que inicia um novo chat limpando o histórico de mensagens
    setMessages([]) // Limpa o array de mensagens
    setView('chat') // Garante que a visão esteja no modo chat
  }

  if (view === 'history') { // Renderização condicional caso a visão atual seja 'history'
    return (
      <div className="flex flex-col h-full bg-background text-foreground"> {/* Container principal do modo histórico */}
        <div className="flex items-center h-16 border-b px-4 flex-shrink-0"> {/* Barra superior com botão de voltar e título */}
          <Button
            onClick={() => setView('chat')} // Ao clicar no botão, volta para a visão de chat
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-5 w-5" /> {/* Ícone de seta para voltar */}
          </Button>
          <h2 className="text-lg font-semibold ml-2">History</h2> {/* Título indicando modo de histórico */}
        </div>
        <div className="flex-grow p-4 text-center text-muted-foreground"> {/* Área principal com mensagem informativa */}
          <p>O histórico de conversas estará disponível aqui em breve.</p> {/* Placeholder avisando que o histórico ainda será implementado */}
        </div>
      </div>
    )
  }

  return ( // Renderização principal quando a view é 'chat'
    <div className="flex flex-col h-full bg-background text-foreground"> {/* Container principal ocupando toda a altura disponível */}
      <div className="flex items-center justify-between h-16 border-b px-4 flex-shrink-0"> {/* Barra superior do chat com título e ações */}
        <div className="flex items-center space-x-2"> {/* Área para o título do assistente */}
          <h2 className="text-lg font-semibold tracking-wider">AI Assistant</h2> {/* Título da seção de chat com a IA */}
        </div>
        <div className="flex items-center space-x-2"> {/* Área com botões de ações do chat */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat} // Botão que reseta o chat e limpa as mensagens
          >
            <Plus className="h-5 w-5" /> {/* Ícone de + indicando novo chat */}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView('history')} // Botão que alterna a view para o modo histórico
          >
            <History className="h-5 w-5" /> {/* Ícone de histórico */}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-grow p-4" ref={scrollContainerRef}> {/* Área rolável que contém as mensagens do chat e é referenciada para auto-scroll */}
        {messages.length === 0 && !isLoading && ( // Se não há mensagens e não está carregando, mostra uma mensagem de boas-vindas
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <p>Start a new conversation to begin chatting with the AI.</p> {/* Mensagem instruindo o usuário a iniciar uma conversa */}
          </div>
        )}

        {messages.map((msg, index) => ( // Itera sobre o array de mensagens e renderiza cada uma
            <div
              key={index} // Usa o índice como chave da mensagem. Como é apenas UI de chat, é aceitável aqui
              className={`mb-6 flex items-start space-x-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}> {/* Define layout diferente se a mensagem for do usuário (alinhada à direita) */}
              {msg.sender === 'ai' && (
                <Bot className="h-6 w-6 text-primary flex-shrink-0" /> // Ícone de robô exibido ao lado das mensagens da IA
              )}

              <div
                className={`p-3 rounded-lg max-w-2xl ${msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground self-end' // Estilo do balão de mensagem do usuário. Fundo com cor primária e texto claro
                    : 'bg-muted' // Estilo do balão de mensagem da IA. Fundo neutro
                  }`}>
                <div className="prose dark:prose-invert max-w-none"> {/* Container com estilos de tipografia para renderização de Markdown */}
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    children={(msg.text ?? '').replace(/\\n/g, '\n')} />
                </div>
                {isLoading && msg.sender === 'ai' && index === messages.length - 1 && ( // Se está carregando, a mensagem é da IA e é a última mensagem
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse inline-block ml-2" /> // Mostra um indicador de digitação da IA (ponto pulsando)
                )}
              </div>

              {msg.sender === 'user' && (
                <User className="h-6 w-6 text-primary flex-shrink-0" /> // Ícone do usuário exibido ao lado das mensagens do usuário
              )}
            </div>
          ))}
      </ScrollArea>

      <div className="px-4 py-3 border-t bg-background"> {/* Container da área de input de mensagem na parte inferior do chat */}
        <div className="relative"> {/* Container relativo para posicionar o botão de envio dentro do input */}
          <Input
            value={input} // Valor atual do input controlado
            onChange={e => setInput(e.target.value)} // Atualiza o estado input sempre que o valor muda
            placeholder="Ask a question..." // Placeholder exibido quando o campo está vazio
            onKeyDown={e => { // Handler para eventos de teclado dentro do input
              if (e.key === 'Enter' && !e.shiftKey) { // Se a tecla pressionada for Enter sem Shift
                e.preventDefault() // Impede a quebra de linha padrão do Enter
                handleSend() // Dispara o envio da mensagem
              }
            }}
            disabled={isLoading} // Desabilita o input enquanto a requisição está em andamento para evitar múltiplos envios
            className="bg-muted border-none rounded-full py-6 pl-4 pr-16 text-base" /> {/* Estilos visuais do input: fundo neutro, bordas removidas, formato pill e padding extra */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex"> {/* Container para posicionar o botão de envio sobre o input no canto direito */}
            <Button
              onClick={handleSend} // Clique no botão dispara o envio da mensagem
              disabled={isLoading || !input.trim()} // Desabilita o botão se estiver carregando ou se não houver texto válido
              size="icon"
              className="rounded-full bg-primary text-primary-foreground"> {/* Botão circular com cor primária */}
              {isLoading ? ( // Se estiver carregando
                <Sparkles className="h-5 w-5 animate-pulse" /> // Mostra ícone com animação para indicar processamento
              ) : (
                <Send className="h-5 w-5" /> // Caso contrário, mostra ícone de envio padrão
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
