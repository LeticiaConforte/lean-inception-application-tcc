
// Importa o módulo firebase-admin, utilizado para acessar serviços administrativos do Firebase (Auth, Firestore etc.)
import admin from 'firebase-admin';
// Importa módulo nativo do Node para manipulação de arquivos
import fs from 'fs';
// Importa módulo nativo do Node para resolver caminhos de diretórios e arquivos
import path from 'path';

// --- Inicialização do Firebase Admin SDK ---

// Estratégia de inicialização que prioriza ambientes em nuvem, com fallback para desenvolvimento local

// Flag que indica se o Firebase foi inicializado com sucesso
let isFirebaseInitialized = false;

// Primeira tentativa: inicialização via Application Default Credentials (ADC)
try {
  // Verifica se ainda não existe um app Firebase inicializado
  if (!admin.apps.length) {
    // Inicializa usando as credenciais padrão do ambiente
    admin.initializeApp();
    // Marca que a inicialização funcionou
    isFirebaseInitialized = true;
    // Loga o sucesso da inicialização via ADC
    console.log('✅ Firebase Admin SDK initialized successfully using Application Default Credentials.');
  } else {
    // Caso já esteja inicializado, apenas confirma a flag
    isFirebaseInitialized = true;
  }
} catch (adcError) {
  // Caso ADC falhe, inicia o fallback para o arquivo local
  console.warn('️ Firebase Admin SDK: Application Default Credentials failed. Falling back to local service account key file...');

  // Segunda tentativa: usar o arquivo local serviceAccountKey.json
  try {
    // Resolve o caminho do arquivo de credencial local
    const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    
    // Verifica se o arquivo existe
    if (!fs.existsSync(keyPath)) {
      // Se o arquivo não existir, lança um erro específico
      throw new Error(`Service account key file not found at ${keyPath}. This file is required for local development fallback.`);
    }
    
    // Lê o arquivo e converte para JSON
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    
    // Inicializa usando a credencial local, caso ainda não exista app ativo
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      // Marca que funcionou
      isFirebaseInitialized = true;
      // Loga o sucesso da inicialização via arquivo local
      console.log('✅ Firebase Admin SDK initialized successfully using local serviceAccountKey.json.');
    } else {
      // Se já estiver inicializado, apenas confirma
      isFirebaseInitialized = true;
    }
  } catch (fileError) {
    // Terceira etapa: falha crítica. Nenhum método conseguiu inicializar o Firebase
    // Gera mensagem detalhada com todas as informações e orientações de correção
    const errorMessage = `
      ====================================================================================
      ❌ CRITICAL: FIREBASE ADMIN SDK FAILED TO INITIALIZE.
      ====================================================================================
      O servidor iniciou, mas NÃO conseguiu conectar ao Firebase. Qualquer rota que dependa
      de banco de dados ou autenticação irá falhar.

      MÉTODOS TENTADOS E ERROS:
      ---------------------------------
      1. Credenciais Padrão do Ambiente (ADC):
         - Error: ${adcError.message}

      2. Arquivo Local 'serviceAccountKey.json':
         - Error: ${fileError.message}
      ---------------------------------

      AÇÃO NECESSÁRIA:
      - Em Cloud Workstations/Cloud Run:
          Garanta que a service account do runtime tenha a permissão "Firebase Admin".
      - Em Desenvolvimento Local:
          Coloque um arquivo válido 'serviceAccountKey.json' na raiz do projeto
          OU execute: gcloud auth application-default login
      ====================================================================================
    `;
    // Exibe o erro completo no console sem derrubar o servidor
    console.error(errorMessage);
    // A flag permanece false
  }
}

// --- Funções de Banco de Dados (Firestore) ---

// Obtém a instância do Firestore somente se a inicialização do Admin SDK teve sucesso.
const db = isFirebaseInitialized ? admin.firestore() : null;

/**
 * Salva o histórico completo de uma sessão de chat no Firestore.
 * O histórico é armazenado em um único documento para simplificar.
 * @param {Array} history - O array contendo todos os objetos de mensagem do chat.
 */
const saveToHistory = async (history) => {
  // Se o DB não estiver disponível, interrompe a função para evitar erros.
  if (!db) {
    console.warn('⚠️ Firestore is not available. Skipping saveToHistory.');
    return;
  }
  // Define a referência para um documento específico.
  // Usamos um ID fixo ('main_session') para sempre sobrescrever o mesmo histórico.
  const historyRef = db.collection('chat-history').doc('main_session');
  // Usa .set() para sobrescrever completamente o documento com o novo histórico.
  await historyRef.set({ messages: history });
};

/**
 * Recupera o histórico de chat do Firestore.
 * @returns {Promise<Array>} - Uma promessa que resolve para o array de histórico, ou um array vazio.
 */
const getHistory = async () => {
  // Se o DB não estiver disponível, retorna um histórico vazio.
  if (!db) {
    console.warn('⚠️ Firestore is not available. Skipping getHistory.');
    return [];
  }
  // Define a referência para o mesmo documento onde o histórico é salvo.
  const historyRef = db.collection('chat-history').doc('main_session');
  // Obtém o snapshot do documento.
  const doc = await historyRef.get();

  // Se o documento não existir, retorna um array vazio.
  if (!doc.exists) {
    return [];
  }
  // Se o documento existir, retorna o array de 'messages' ou um array vazio se o campo não existir.
  return doc.data().messages || [];
};


// Exporta o objeto admin inicializado, a flag e as novas funções
export { admin, isFirebaseInitialized, saveToHistory, getHistory };
