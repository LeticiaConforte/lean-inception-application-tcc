import {
  createContext,       // Cria um contexto React
  useContext,          // Hook para acessar o contexto
  useEffect,           // Hook para efeitos colaterais
  useState,            // Hook para estado interno
  useCallback,         // Hook para memorizar funções
  ReactNode,           // Tipo para receber children
  FC,                  // Tipo para Functional Component
} from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
// Importa funções de autenticação Firebase

import { auth } from '@/integrations/firebase/client'
// Instância de autenticação configurada

// Define o formato dos dados que o contexto vai expor
interface AuthContextType {
  user: User | null          // Usuário logado ou null
  loading: boolean           // Indica se ainda está verificando autenticação
  isAdmin: boolean           // Indica se o usuário possui o claim admin
  signOut: () => Promise<void>            // Logout
  refreshAdminStatus: () => Promise<void> // Atualiza claims de admin
}

// Cria o contexto de autenticação com valor inicial indefinido
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook personalizado para acessar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext)        // Lê o valor do contexto

  if (context === undefined) {
    // Garante que o hook só funcione dentro do provider
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context // Retorna o valor do AuthContext
}

// Provider que encapsula a lógica de autenticação
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null) // Estado do usuário logado
  const [loading, setLoading] = useState(true)        // Carregamento inicial
  const [isAdmin, setIsAdmin] = useState(false)       // Claim admin

  // Função para atualizar claims de admin
  const refreshAdminStatus = useCallback(async () => {
    if (auth.currentUser) {
      try {
        // Busca o token atualizado (com claims)
        const idTokenResult = await auth.currentUser.getIdTokenResult(true)

        // Verifica se o claim "admin" é verdadeiro
        const isAdminClaim = idTokenResult.claims.admin === true
        setIsAdmin(isAdminClaim)
      } catch (error) {
        console.error("Error refreshing admin status:", error)
        setIsAdmin(false)
      }
    } else {
      // Sem usuário logado
      setIsAdmin(false)
    }
  }, []) // Sem dependências

  // Observa mudanças na autenticação Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user) // Atualiza usuário

      if (user) {
        // Se logado, atualizar admin claim
        await refreshAdminStatus()
      } else {
        // Se deslogado, remover claim
        setIsAdmin(false)
      }

      setLoading(false) // Encerra carregamento inicial
    })

    // Remove listener ao desmontar
    return () => unsubscribe()
  }, [refreshAdminStatus])

  // Função de logout
  const signOut = async () => {
    await auth.signOut() // Firebase signOut
    setUser(null)        // Limpa estado
    setIsAdmin(false)    // Remove claim
  }

  // Valores expostos no contexto
  const value = {
    user,
    loading,
    isAdmin,
    signOut,
    refreshAdminStatus,
  }

  // Provider que disponibiliza os valores para toda a aplicação
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
