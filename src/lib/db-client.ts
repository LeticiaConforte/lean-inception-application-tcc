// Importa funções do Firestore para obter e salvar documentos
import { getDoc, doc, setDoc } from 'firebase/firestore';
// Importa a instância do Firestore configurada no cliente
import { db } from '@/integrations/firebase/client';

// Função assíncrona que busca a conversa associada a um workshop
export async function getConversation(workshopId: string) {
  // Obtém o documento da coleção "conversations" com ID igual ao workshopId
  const conversationDoc = await getDoc(doc(db, 'conversations', workshopId));
  // Se o documento existir, retorna o campo "history". Caso contrário, retorna um array vazio
  return conversationDoc.exists() ? conversationDoc.data().history : [];
}

// Função assíncrona que salva o histórico de conversa de um workshop
export async function saveConversation(workshopId: string, history: any[]) {
  // Cria ou sobrescreve o documento "conversations/{workshopId}" com o histórico fornecido
  await setDoc(doc(db, 'conversations', workshopId), { history });
}

// Exporta a instância do banco para uso em outros módulos
export { db };
