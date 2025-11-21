import React from 'react'                                                   // Importa React
import { Navigate } from 'react-router-dom'                                 // Componente para redirecionamento
import { useAuth } from './AuthProvider'                                    // Hook de autenticação

// Tipagem das props: o componente recebe apenas children
interface ProtectedRouteProps {
  children: React.ReactNode
}

// Componente que protege rotas contra acesso não autenticado
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()                                       // Busca estado de login e carregamento

  // Enquanto o estado de autenticação está carregando, exibe um spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-inception-blue"></div>
      </div>
    )
  }

  // Se não há usuário autenticado, redireciona para /auth
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Se autenticado, rendeza normalmente os filhos
  return <>{children}</>
}

export default ProtectedRoute                                               // Exporta o componente
