// Importa a biblioteca principal do React, necessária para componentes funcionais e JSX
import React from 'react';
// Importa o painel administrativo protegido, que controla acesso e funcionalidades da área de admin
import SecureAdminPanel from '@/components/SecureAdminPanel';
// Importa um cabeçalho simples para ser exibido no topo da página de administração
import SimpleHeader from '@/components/SimpleHeader';

// Declara o componente funcional da página de administração tipado como React.FC
const AdminPage: React.FC = () => {
  // Retorna a estrutura JSX da página de administração
  return (
    // Container principal da página, em coluna, ocupando toda a altura da tela
    <div className="flex flex-col h-screen">
      {/* Renderiza o cabeçalho simples no topo da página */}
      <SimpleHeader />
      {/* Área principal da página, que cresce para ocupar o espaço restante e permite rolagem vertical */}
      <main className="flex-1 overflow-y-auto">
        {/* Renderiza o painel administrativo seguro dentro da área principal */}
        <SecureAdminPanel />
      </main>
    </div>
  );
};

// Exporta o componente AdminPage como padrão para uso em rotas e outras partes da aplicação
export default AdminPage;
