// Importa funções principais do Firebase App para inicialização e logs
import { initializeApp, getApps, getApp, onLog } from "firebase/app";
// Importa módulo de autenticação do Firebase
import { getAuth } from "firebase/auth";
// Importa Firestore, incluindo função para limpar persistência local do IndexedDB
import { getFirestore, clearIndexedDbPersistence } from "firebase/firestore";
// Importa módulo de storage do Firebase
import { getStorage } from "firebase/storage";

// Objeto de configuração do Firebase, preenchido com variáveis de ambiente do Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,                 // Chave de API do Firebase
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,         // Domínio de autenticação
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,           // ID do projeto Firebase
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,   // Bucket de armazenamento
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, // Sender ID
  appId: import.meta.env.VITE_FIREBASE_APP_ID,                   // ID da aplicação
};

// Inicializa o app Firebase apenas se ainda não existir uma instância criada
// Caso contrário, reutiliza a instância existente
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inicializa Firestore, Autenticação e Storage relacionados ao app criado
const db = getFirestore(app);  // Instância do Firestore
const auth = getAuth(app);     // Instância do Auth
const storage = getStorage(app); // Instância do Storage

// Listener de logs internos do Firebase
onLog((log) => {
  // Verifica se o log é um erro relacionado ao BloomFilter (bug interno do Firestore)
  if (log.level === 'error' && log.message.includes("BloomFilter")) {
    // Alerta sobre o erro detectado
    console.warn("Firestore BloomFilter error detected. Clearing persistence and reloading.");

    // Tenta limpar a persistência do IndexedDB, que contém o cache local do Firestore
    clearIndexedDbPersistence(db)
      .then(() => {
        // Caso tenha sucesso, recarrega a página para reconstruir o cache
        console.log("Firestore persistence cleared. Reloading page.");
        window.location.reload();
      })
      .catch((err) => {
        // Caso a limpeza falhe, registra o erro no console
        console.error("Failed to clear Firestore persistence:", err);
      });
  }
});

// Exporta as instâncias configuradas para uso em toda a aplicação
export { app, db, auth, storage };
