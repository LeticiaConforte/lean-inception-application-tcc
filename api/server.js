/*
*   api/server.js
*   
*   Este arquivo configura e executa um servidor Express para fornecer a API do backend.
*   Ele é responsável por:
*   - Servir arquivos estáticos (se necessário).
*   - Configurar middlewares, como CORS e parsing de JSON.
*   - Definir rotas da API, incluindo um endpoint para interagir com a Google Generative AI.
*   - Inicializar o SDK da Google AI com a chave de API correta.
*   - Gerenciar o ciclo de vida do servidor (iniciar, parar, etc.).
*/

// ==========================
// Importações de Módulos
// ==========================
import express from 'express';                      // Framework principal para criação do servidor web.
import cors from 'cors';                          // Middleware para habilitar Cross-Origin Resource Sharing.
import { GoogleGenerativeAI } from '@google/generative-ai'; // SDK oficial da Google para a API de IA Generativa.
import { saveToHistory, getHistory } from './lib/db-server.js'; // Funções para interagir com o banco de dados (salvar e buscar histórico).
import dotenv from 'dotenv';                      // Módulo para carregar variáveis de ambiente de arquivos .env.

// ==============================
// Configuração Inicial
// ==============================
// Carrega as variáveis de ambiente do arquivo .env.local na raiz do projeto.
// A opção path é crucial para garantir que o arquivo correto seja encontrado.
dotenv.config({ path: '../.env.local' });

const app = express();                          // Cria uma instância do aplicativo Express.
const port = process.env.PORT || 3001;          // Define a porta do servidor, com fallback para 3001.

// ==================================
// Configuração de Middlewares
// ==================================
app.use(cors());                                // Habilita o CORS para todas as rotas, permitindo requisições de diferentes origens.
app.use(express.json());                        // Habilita o parsing de corpos de requisição no formato JSON.

// ===============================
// Inicialização do SDK da Google AI
// ===============================
let genAI;
let isAiAvailable = false;

try {
  // Lê a chave de API da IA do arquivo de ambiente.
  const apiKey = process.env.GEMINI_API_KEY;
  // Valida se a chave está configurada corretamente.
  if (!apiKey || apiKey === 'SUA_CHAVE_API_AQUI') {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  // Cria a instância do cliente da Google Generative AI.
  genAI = new GoogleGenerativeAI(apiKey);
  // Marca a IA como disponível.
  isAiAvailable = true;
  // Loga sucesso da inicialização da IA.
  console.log('✅ Google AI SDK initialized successfully.');
} catch (error) {
  // Caso ocorra erro, loga um aviso e mantém a IA indisponível.
  console.warn('⚠️ Google AI SDK failed to initialize:', error.message);
}

// =========================
// Endpoint de IA (/api/ai)
// =========================
app.post('/api/ai', async (req, res) => {
  // Loga que uma requisição chegou neste endpoint.
  console.log('[Backend] Received request for /api/ai');
  
  // Se a IA não estiver disponível, retorna um erro 503 (Serviço Indisponível).
  if (!isAiAvailable) {
    console.error('[Backend] AI service is not available.');
    return res.status(503).json({ message: 'AI service is not available. Check server logs for details.' });
  }

  // Extrai a mensagem e o histórico do corpo da requisição.
  const { message, history } = req.body;

  try {
    // Inicia o modelo generativo (gemini-2.5-pro).
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    // Inicia uma sessão de chat com o histórico fornecido.
    const chat = model.startChat({ history });
    // Envia a nova mensagem para o modelo.
    const result = await chat.sendMessage(message);
    // Obtém a resposta do modelo.
    const response = await result.response;
    const text = response.text();

    // Salva a interação no histórico do banco de dados.
    await saveToHistory(history.concat([{ role: 'user', parts: [{ text: message }] }, { role: 'model', parts: [{ text }] }]));

    // Retorna a resposta da IA para o cliente.
    res.json({ message: text });

  } catch (error) {
    // Em caso de erro na chamada à API da Google AI, loga e retorna mensagem adequada.
    console.error('[Backend] Error calling Google AI API:', error);
    // Monta uma mensagem mais detalhada, diferenciando erro de chave inválida.
    const detailedMessage = error.message.includes('API key not valid')
      ? 'Failed to get response from AI: The provided GEMINI_API_KEY is not valid. Please check your .env.local file.'
      : `Failed to get response from AI: ${error.message}`;
    // Retorna erro 500 para o cliente.
    res.status(500).json({ message: detailedMessage, error: error.message });
  }
});

// ===================================
// Endpoint de Histórico (/api/history)
// ===================================
app.get('/api/history', async (req, res) => {
  // Loga o recebimento da requisição de histórico.
  console.log('[Backend] Received request for /api/history');
  try {
    // Busca o histórico no banco de dados.
    const history = await getHistory();
    // Retorna o histórico para o cliente.
    res.json({ history });
  } catch (error) {
    // Em caso de erro, loga e retorna uma mensagem de erro 500.
    console.error('[Backend] Error fetching history:', error);
    res.status(500).json({ message: 'Failed to fetch history.', error: error.message });
  }
});

// ========================
// Início do Servidor
// ========================
app.listen(port, () => {
  // Loga que o servidor foi iniciado com sucesso.
  console.log(`✅ Backend server running at http://localhost:${port}`);
});
