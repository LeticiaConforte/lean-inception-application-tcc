// Importa o framework Express para criar o servidor HTTP
import express from 'express';
// Importa o CORS para permitir requisições de outras origens (front-end)
import cors from 'cors';
// Importa o SDK da Google Generative AI (Gemini)
import { GoogleGenerativeAI } from '@google/generative-ai';
// Importa o dotenv para carregar variáveis de ambiente
import dotenv from 'dotenv';

// Importa a instância do Firebase Admin e a flag de inicialização
import { admin, isFirebaseInitialized } from './lib/db-server.js';
// Importa a função responsável por envio de e-mails
import { sendEmail } from './lib/email.js';
// Importa os templates HTML de e-mail para workspace e workshop
import { getWorkspaceInviteHtml, getWorkshopInviteHtml } from './lib/emailTemplates.js';

// Carrega variáveis de ambiente a partir do arquivo .env.local
dotenv.config({ path: '.env.local' });

// Log inicial indicando start do backend
console.log('--- Backend Server Starting ---');

// Cria a aplicação Express
const app = express();
// Define a porta do servidor, priorizando variável de ambiente
const port = process.env.PORT || 3001;

// Habilita CORS para permitir chamadas do front-end
app.use(cors());
// Habilita o parsing de JSON no corpo das requisições
app.use(express.json());

// =========================
// Inicialização da IA (Google Generative AI)
// =========================

// Variável que irá armazenar a instância do SDK de IA
let genAI;
// Flag para indicar se a IA está disponível
let isAiAvailable = false;

try {
  // Lê a chave de API da IA do arquivo de ambiente
  const apiKey = process.env.GOOGLE_API_KEY;
  // Valida se a chave está configurada corretamente
  if (!apiKey || apiKey === 'SUA_CHAVE_API_AQUI') {
    throw new Error('GOOGLE_API_KEY is not configured.');
  }
  // Cria a instância do cliente da Google Generative AI
  genAI = new GoogleGenerativeAI(apiKey);
  // Marca a IA como disponível
  isAiAvailable = true;
  // Loga sucesso da inicialização da IA
  console.log('✅ Google AI SDK initialized successfully.');
} catch (error) {
  // Caso ocorra erro, loga um aviso e mantém a IA indisponível
  console.warn('⚠️ Google AI SDK failed to initialize:', error.message);
}

// =========================
// Endpoint de IA (/api/ai)
// =========================
app.post('/api/ai', async (req, res) => {
  // Loga que uma requisição chegou neste endpoint
  console.log('[Backend] Received request for /api/ai');

  // Verifica se a IA foi inicializada com sucesso
  if (!isAiAvailable) {
    console.error('[Backend] AI service is not available.');
    return res.status(503).json({ message: 'AI service is not available.' });
  }

  // Extrai mensagem e histórico do corpo da requisição
  const { message, history } = req.body;

  try {
    // Obtém o modelo generativo (Gemini 2.5 Pro)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    // Inicia um chat, com histórico se existir
    const chat = model.startChat({ history: history || [] });
    // Envia a mensagem do usuário para o modelo
    const result = await chat.sendMessage(message);
    // Extrai o texto da resposta
    const text = result.response.text();
    // Retorna a resposta para o front-end
    res.json({ message: text });

  } catch (error) {
    // Em caso de erro na chamada à API da Google AI, loga e retorna mensagem adequada
    console.error('[Backend] Error calling Google AI API:', error);
    // Monta uma mensagem mais detalhada, diferenciando erro de chave inválida
    const detailedMessage = error.message.includes('API key not valid')
      ? 'Failed to get response from AI: The provided GOOGLE_API_KEY is not valid. Please check your .env.local file.'
      : `Failed to get response from AI: ${error.message}`;
    // Retorna erro 500 para o cliente
    res.status(500).json({ message: detailedMessage, error: error.message });
  }
});


// =========================
// Função compartilhada para buscar dados do convidador
// =========================
const getInviterDetails = async (uid) => {
  // Busca o documento do perfil do usuário no Firestore
  const inviterProfile = await admin.firestore().collection('profiles').doc(uid).get();
  // Retorna o nome do convidador, ou um fallback padrão
  return inviterProfile.data()?.name || 'A colleague';
};

// =========================
// Endpoint de convite para Workspace (/api/invite)
// =========================
app.post('/api/invite', async (req, res) => {
  // Verifica se o Firebase foi inicializado
  if (!isFirebaseInitialized) {
    return res.status(503).json({ message: 'Service Unavailable: Database not connected.' });
  }

  // Extrai dados do corpo da requisição
  const { recipientEmail, workspaceId, workspaceName, role, workshops } = req.body;
  // Extrai cabeçalhos de autorização e origem (origin usado no link)
  const { authorization, origin } = req.headers;

  // Verifica se o header de autorização existe e se é Bearer Token
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Extrai o token JWT do header Authorization
    const idToken = authorization.split('Bearer ')[1];
    // Decodifica o token e obtém o UID do usuário
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const inviterUid = decodedToken.uid;

    // Verifica se o usuário autenticado é membro admin do workspace
    const memberCheck = await admin.firestore().collection('workspace_members')
      .where('workspace_id', '==', workspaceId)
      .where('user_id', '==', inviterUid)
      .limit(1).get();

    // Se não encontrou registro ou o papel não é admin, bloqueia a ação
    if (memberCheck.empty || memberCheck.docs[0].data().role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins can invite members.' });
    }

    // Busca o nome do convidador para usar no e-mail
    const inviterName = await getInviterDetails(inviterUid);

    // Tenta localizar o UID do destinatário pelo e-mail (caso já exista no Auth)
    let recipientUid = null;
    try {
      const userRecord = await admin.auth().getUserByEmail(recipientEmail);
      recipientUid = userRecord.uid;
    } catch (e) { /* usuário não existe no Auth ainda */ }

    // Cria um novo documento na coleção de membros de workspace
    const newInviteRef = admin.firestore().collection('workspace_members').doc();
    
    // Monta os dados do novo membro convidado
    const newMemberData = {
      workspace_id: workspaceId,
      email: recipientEmail,
      role: role,
      status: 'invited',
      invited_at: admin.firestore.FieldValue.serverTimestamp(),
      invited_by: inviterUid,
      user_id: recipientUid,
    };

    // Se o papel for limitado e houver lista de workshops, adiciona o campo de acesso
    if (role === 'limited' && workshops && workshops.length > 0) {
        newMemberData.accessible_workshops = workshops;
    }

    // Salva o novo membro/convite no Firestore
    await newInviteRef.set(newMemberData);

    // Monta a URL de aceitação usando o origin da requisição
    const acceptUrl = `${origin}/auth?inviteId=${newInviteRef.id}`;
    // Define o assunto do e-mail
    const emailSubject = `Acesso concedido ao Workspace: “${workspaceName}”`;
    // Gera o HTML do e-mail usando o template de workspace
    const emailHtml = getWorkspaceInviteHtml(inviterName, workspaceName, acceptUrl);

    // Envia o e-mail utilizando a função sendEmail
    const emailResult = await sendEmail({ to: recipientEmail, subject: emailSubject, html: emailHtml });

    // Se o envio de e-mail foi bem-sucedido, retorna ok
    if (emailResult.success) {
      return res.status(200).json({ message: 'Invitation sent successfully.' });
    }
    // Caso contrário, informa que o convite foi criado, mas o e-mail falhou
    return res.status(200).json({ message: 'Invitation created, but email failed.', error: emailResult.message });

  } catch (error) {
    // Loga erro interno e retorna status 500
    console.error('ERROR in /api/invite:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// =========================
// Endpoint de convite para Workshop (/api/invite-workshop)
// =========================
app.post('/api/invite-workshop', async (req, res) => {
  // Verifica se o Firebase está conectado
  if (!isFirebaseInitialized) {
    return res.status(503).json({ message: 'Service Unavailable: Database not connected.' });
  }

  // Extrai dados do corpo da requisição
  const { recipientEmail, workshopId, workshopName } = req.body;
  // Extrai autorização e origem dos cabeçalhos
  const { authorization, origin } = req.headers;

  // Valida o header de autorização
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Lê e verifica o token JWT
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const inviterUid = decodedToken.uid;

    // Referência ao documento do workshop
    const workshopRef = admin.firestore().collection('workshops').doc(workshopId);
    // Busca o documento do workshop
    const workshopDoc = await workshopRef.get();

    // Verifica se o workshop existe e se o usuário autenticado é o criador
    if (!workshopDoc.exists || workshopDoc.data().created_by !== inviterUid) {
      return res.status(403).json({ message: 'Forbidden: Only the workshop creator can invite participants.' });
    }

    // Busca o nome do convidador para uso no e-mail
    const inviterName = await getInviterDetails(inviterUid);

    // Atualiza o documento do workshop adicionando o e-mail do participante no array participants
    await workshopRef.update({
      participants: admin.firestore.FieldValue.arrayUnion(recipientEmail)
    });

    // Monta a URL de acesso direto ao workshop
    const acceptUrl = `${origin}/workshop/${workshopId}`;
    // Define o assunto do e-mail de convite
    const emailSubject = `Convite para participar do Workshop: “${workshopName}”`;
    // Gera o HTML do e-mail usando o template de workshop
    const emailHtml = getWorkshopInviteHtml(inviterName, workshopName, acceptUrl);

    // Envia o e-mail ao destinatário
    const emailResult = await sendEmail({ to: recipientEmail, subject: emailSubject, html: emailHtml });

    // Se o e-mail foi enviado com sucesso, retorna status 200
    if (emailResult.success) {
      return res.status(200).json({ message: 'Invitation sent successfully.' });
    }
    // Caso o envio falhe, informa que o participante foi adicionado, mas o e-mail deu erro
    return res.status(200).json({ message: 'Participant added, but email failed.', error: emailResult.message });

  } catch (error) {
    // Loga o erro e retorna resposta 500
    console.error('ERROR in /api/invite-workshop:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// =========================
// Inicialização do servidor HTTP
// =========================
app.listen(port, () => {
  // Loga que o servidor está rodando e ouvindo na porta configurada
  console.log(`✅ Backend server is running and listening on port ${port}`);
});
