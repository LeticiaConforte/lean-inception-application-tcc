// Importa o hook useLocation do React Router para acessar informações da rota atual
import { useLocation } from "react-router-dom";
// Importa o useEffect para executar efeitos colaterais após renderizações
import { useEffect } from "react";

// Declara o componente NotFound
const NotFound = () => {
  // Obtém informações da localização atual da URL (como pathname)
  const location = useLocation();

  // Efeito disparado sempre que o pathname muda
  useEffect(() => {
    // Registra no console um erro indicando que a rota acessada não existe
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]); // O efeito roda novamente quando o pathname mudar

  // Retorno JSX que exibe a página de erro 404
  return (
    // Container principal com altura total da tela e centralização
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* Conteúdo centralizado */}
      <div className="text-center">
        {/* Título 404 grande */}
        <h1 className="text-4xl font-bold mb-4">404</h1>
        {/* Mensagem descritiva */}
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        {/* Link para voltar à página inicial */}
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

// Exporta o componente como padrão
export default NotFound;
