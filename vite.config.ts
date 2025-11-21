
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// A URL de configuração do Vite: https://vitejs.dev/config/

// A função defineConfig é usada para fornecer autocompletar e validação para a configuração.
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do arquivo .env correspondente ao 'mode' (ex: .env.development).
  const env = loadEnv(mode, process.cwd(), '');
  // Atribui as variáveis de ambiente carregadas para process.env, tornando-as acessíveis em todo o ambiente Node.js da configuração.
  Object.assign(process.env, env);

  return {
    // Configurações do servidor de desenvolvimento do Vite.
    server: {
      // O endereço de host no qual o servidor irá escutar.
      host: "127.0.0.1",
      // A porta a ser usada. Tenta pegar do process.env.PORT, senão usa 8081 como padrão.
      port: Number(process.env.PORT) || 8081,
      // Configura um proxy para redirecionar requisições.
      proxy: {
        // Qualquer requisição para '/api' será redirecionada para o servidor backend.
        '/api': {
          // O alvo do proxy, geralmente o endereço do seu servidor de API.
          target: 'http://127.0.0.1:3001',
          // Necessário para servidores que rodam em virtual hosts. Ele muda a 'origem' do cabeçalho do host para o target URL.
          changeOrigin: true,
        },
      },
    },
    // Lista de plugins a serem usados pelo Vite.
    plugins: [
      // O plugin oficial para React que usa o compilador SWC (Speedy Web Compiler) para uma compilação rápida.
      react()
    ],
    // Configurações de como os módulos são resolvidos.
    resolve: {
      // Define aliases de caminho para simplificar as importações.
      alias: {
        // O alias '@' aponta para o diretório 'src'. 
        // Isso permite importações como '@/components/MyComponent' em vez de caminhos relativos como '../../components/MyComponent'.
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
