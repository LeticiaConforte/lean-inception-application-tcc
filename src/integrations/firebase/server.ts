// Importa funções para inicializar o Firebase Admin no ambiente servidor
import { initializeApp, getApps, cert } from 'firebase-admin/app';
// Importa módulo de autenticação do Firebase Admin
import { getAuth } from 'firebase-admin/auth';
// Importa módulo Firestore do Firebase Admin
import { getFirestore } from 'firebase-admin/firestore';

// Aviso: no ambiente do Vite Server, todas as variáveis de ambiente vêm de `import.meta.env`.
// Elas precisam ter o prefixo `VITE_` no arquivo .env.local.

// Obtém a chave da service account como string JSON
const serviceAccountJSON = import.meta.env.VITE_FIREBASE_SERVICE_ACCOUNT_KEY as string;

// Se a variável de ambiente não existir, interrompe a execução com erro crítico
if (!serviceAccountJSON) {
  throw new Error('CRITICAL: The VITE_FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set in your .env.local file. The server cannot start.');
}

// Variável que armazenará o objeto da service account após o parse
let serviceAccount;
try {
  // Tenta converter a string JSON em objeto
  serviceAccount = JSON.parse(serviceAccountJSON);
} catch (e: any) {
    // Se falhar, lança erro crítico informando problema ao fazer parse
    throw new Error(`CRITICAL: Failed to parse VITE_FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it is a valid JSON string. Error: ${e.message}`);
}

// Inicialização do Firebase Admin
let app;
if (!getApps().length) {
  // Se não existir instância inicializada, cria uma nova
  app = initializeApp({
    credential: cert(serviceAccount),                      // Configura credenciais usando a service account
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL, // URL do banco de dados (se aplicável)
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // Bucket de storage
  });
} else {
  // Caso já exista uma instância, apenas reutiliza a primeira
  app = getApps()[0];
}

// Inicializa o módulo de autenticação do Firebase Admin
const adminAuth = getAuth(app);
// Inicializa o módulo Firestore Admin
const db = getFirestore(app);

// Exporta instâncias configuradas para uso externo
export { app as adminApp, adminAuth, db };
