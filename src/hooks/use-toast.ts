// Importa todas as funcionalidades do React
import * as React from "react"

// Importa os tipos usados para configurar ações e propriedades do toast
import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

// Define o limite máximo de toasts simultâneos
const TOAST_LIMIT = 1
// Define o tempo até remover um toast da lista (em milissegundos)
const TOAST_REMOVE_DELAY = 1000000

// Tipo que representa um toast completo, incluindo id e campos opcionais
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

// Define os tipos de ações possíveis no reducer
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

// Contador usado para gerar IDs únicos
let count = 0

// Função que gera um ID incremental como string
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

// Define o tipo ActionType baseado em actionTypes
type ActionType = typeof actionTypes

// Define todos os tipos de ações que o reducer pode receber
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

// Define o formato do estado global dos toasts
interface State {
  toasts: ToasterToast[]
}

// Mapa usado para armazenar timeouts ativos por toastId
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

// Adiciona um toast à fila de remoção automática
const addToRemoveQueue = (toastId: string) => {
  // Se já existe um timeout, não cria outro
  if (toastTimeouts.has(toastId)) {
    return
  }

  // Cria timeout que remove o toast depois de um tempo definido
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  // Salva o timeout no mapa
  toastTimeouts.set(toastId, timeout)
}

// Reducer responsável por modificar o estado dos toasts
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    // Adiciona novo toast
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    // Atualiza toast existente pelo ID
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    // Marca toast como fechado e adiciona a fila de remoção
    case "DISMISS_TOAST": {
      const { toastId } = action

      // Efeito colateral. Adiciona à remoção automática
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }

    // Remove toast completamente do estado
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

// Lista de listeners que serão notificados quando o estado mudar
const listeners: Array<(state: State) => void> = []

// Estado mantido em memória fora do React
let memoryState: State = { toasts: [] }

// Função global que dispara ações e notifica listeners
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// Tipo base de um toast sem ID
type Toast = Omit<ToasterToast, "id">

// Função para criar um novo toast
function toast({ ...props }: Toast) {
  const id = genId()

  // Função para atualizar um toast pelo ID
  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })

  // Função que descarta o toast
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  // Adiciona toast ao estado
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

// Hook que expõe o estado dos toasts e ações relacionadas
function useToast() {
  // Estado interno do React que observa o estado global
  const [state, setState] = React.useState<State>(memoryState)

  // Adiciona e remove listener automaticamente
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

// Exporta o hook e a função toast
export { useToast, toast }
