// Importa o componente Toaster padrão (notificações) da pasta ui
import { Toaster } from "@/components/ui/toaster";
// Importa outro tipo de Toaster (Sonner) para notificações diferenciadas
import { Toaster as Sonner } from "@/components/ui/sonner";
// Importa o Provider para tooltips (componentes com dicas ao passar o mouse)
import { TooltipProvider } from "@/components/ui/tooltip";
// Importa o QueryClient e o Provider do React Query, usados para gerenciar cache de dados
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Importa componentes do React Router para navegação
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Importa o Provider de autenticação da aplicação
import { AuthProvider } from "./components/AuthProvider";
// Importa a página principal
import Index from "./pages/Index";
// Importa a página de autenticação (login/cadastro)
import Auth from "./pages/Auth";
// Importa a página do administrador
import AdminPage from "./pages/Admin";
// Importa a página de “não encontrado”
import NotFound from "./pages/NotFound";
// Importa o wrapper de rota protegida (somente usuários logados acessam)
import ProtectedRoute from "./components/ProtectedRoute";

// Cria a instância do React Query Client para gerenciamento de requisições e cache
const queryClient = new QueryClient();

// Componente principal da aplicação
const App = () => (
  // Envolve toda a aplicação no QueryClientProvider para habilitar React Query globalmente
  <QueryClientProvider client={queryClient}>
    {/* Provider responsável por autenticar e disponibilizar informações do usuário */}
    <AuthProvider>
      {/* Provider para habilitar tooltips em toda a aplicação */}
      <TooltipProvider>
        {/* Componente de notificações padrão */}
        <Toaster />
        {/* Componente de notificações avançadas (Sonner) */}
        <Sonner />
        
        {/* Configura a navegação via BrowserRouter */}
        <BrowserRouter
          future={{
            v7_startTransition: true, // Ativa comportamento experimental do React Router
            v7_relativeSplatPath: true // Ativa paths relativos no modelo v7
          }}
        >
          {/* Define todas as rotas da aplicação */}
          <Routes>
            {/* Rota da página de login/autenticação */}
            <Route path="/auth" element={<Auth />} />

            {/* Rota protegida da página principal */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />

            {/* Rota protegida da página de admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* Rota genérica para qualquer caminho inexistente */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Exporta o componente principal App para ser usado no index.jsx/tsx
export default App;
