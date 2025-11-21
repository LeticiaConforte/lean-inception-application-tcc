import React, { useState } from 'react'
// Importa React e o hook useState para controle de estado no componente

import { User, Briefcase, Workflow } from 'lucide-react'
// Ícones da biblioteca lucide-react usados nas abas do painel administrativo

// Componente funcional principal do painel do administrador
const AdminPanel: React.FC = () => {
  // Estado que controla qual aba está ativa no momento
  const [activeTab, setActiveTab] = useState('workspaces')

  // Função que retorna o conteúdo correspondente à aba selecionada
  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        // Conteúdo placeholder para gerenciamento de usuários
        return <div>TODO: User management interface</div>

      case 'workspaces':
        // Conteúdo placeholder para gerenciamento de workspaces
        return <div>TODO: Workspace management interface</div>

      case 'workshops':
        // Conteúdo placeholder para gerenciamento de workshops
        return <div>TODO: Workshop management interface</div>

      default:
        // Caso default (fallback)
        return <div>TODO: Workspace management interface</div>
    }
  }

  return (
    <div>
      {/* Cabeçalho principal do painel */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      {/* Navegação em abas */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          
          {/* Aba: Users */}
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center px-3 py-2 font-medium text-sm rounded-md ${
              activeTab === 'users'
                ? 'bg-gray-100 text-gray-800'   // Estilo quando ativa
                : 'text-gray-500 hover:text-gray-700' // Estilo quando inativa
            }`}
          >
            <User className="h-5 w-5 mr-2" />
            Users
          </button>

          {/* Aba: Workspaces */}
          <button
            onClick={() => setActiveTab('workspaces')}
            className={`flex items-center px-3 py-2 font-medium text-sm rounded-md ${
              activeTab === 'workspaces'
                ? 'bg-gray-100 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase className="h-5 w-5 mr-2" />
            Workspaces
          </button>

          {/* Aba: Workshops */}
          <button
            onClick={() => setActiveTab('workshops')}
            className={`flex items-center px-3 py-2 font-medium text-sm rounded-md ${
              activeTab === 'workshops'
                ? 'bg-gray-100 text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Workflow className="h-5 w-5 mr-2" />
            Workshops
          </button>
        </nav>
      </div>

      {/* Área que exibe o conteúdo da aba ativa */}
      <div>{renderContent()}</div>
    </div>
  )
}

export default AdminPanel
// Exporta o componente principal para uso em outras partes da aplicação
