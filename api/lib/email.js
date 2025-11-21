// Importa o Nodemailer, responsável por enviar e-mails pelo Node.js
import nodemailer from 'nodemailer';
// Importa funcionalidades do Google APIs (usado para OAuth2)
import { google } from 'googleapis';
// Importa o dotenv para carregar variáveis de ambiente do arquivo .env
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente definidas no arquivo .env
dotenv.config();

// Lê o e-mail do remetente do Gmail configurado nas variáveis de ambiente
const gmailUser = process.env.GMAIL_USER;
// Lê o Client ID da API do Google
const clientId = process.env.GOOGLE_CLIENT_ID;
// Lê o Client Secret da API do Google
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
// Lê o Refresh Token gerado no OAuth Playground
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

// Obtém a classe OAuth2 da lib googleapis
const OAuth2 = google.auth.OAuth2;

// Cria uma instância do cliente OAuth2 usando as credenciais do Google
const oauth2Client = new OAuth2(
  clientId,
  clientSecret,
  "https://developers.google.com/oauthplayground" // URL de redirecionamento utilizada ao gerar o token
);

// Define o refresh token para permitir gerar access tokens automaticamente
oauth2Client.setCredentials({
  refresh_token: refreshToken
});

// Função que obtém um access token válido a partir do refresh token
const getAccessToken = () => {
  return new Promise((resolve, reject) => {
    // Solicita ao Google um access token novo
    oauth2Client.getAccessToken((err, token) => {
      // Caso erre, a promise é rejeitada
      if (err) {
        reject("Failed to create access token :( " + err);
      }
      // Caso funcione, resolve com o token
      resolve(token);
    });
  });
};

// Função que cria o transporter do Nodemailer configurado com OAuth2
const createTransporter = async () => {
  // Obtém o access token válido
  const accessToken = await getAccessToken();

  // Cria o transporter do Nodemailer com autenticação OAuth2 do Gmail
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: gmailUser,
      clientId: clientId,
      clientSecret: clientSecret,
      refreshToken: refreshToken,
      accessToken: accessToken,
    },
  });
};

/**
 * Envia um e-mail real utilizando Nodemailer com Gmail + OAuth2.
 * A função depende das variáveis de ambiente definidas no arquivo .env.local.
 *
 * @param {object} mail - Objeto contendo os dados do e-mail.
 * @param {string} mail.to - Destinatário.
 * @param {string} mail.subject - Assunto.
 * @param {string} mail.html - Corpo HTML do e-mail.
 */
export const sendEmail = async ({ to, subject, html }) => {
  // Configura os dados do e-mail
  const mailOptions = {
    from: `"Lean Inception" <${gmailUser}>`, // Remetente exibido
    to: to,                                  // Destinatário
    subject: subject,                        // Assunto
    html: html,                              // Conteúdo em HTML
  };

  try {
    // Cria o transporter configurado com OAuth2
    const transporter = await createTransporter();
    // Envia o e-mail usando o Nodemailer
    const info = await transporter.sendMail(mailOptions);
    // Loga no terminal que o e-mail foi enviado com sucesso
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    // Retorna status de sucesso
    return { success: true, message: 'Email sent successfully.' };
  } catch (error) {
    // Caso aconteça erro durante o envio, loga e retorna um objeto indicando falha
    console.error("Error sending email via Nodemailer/Gmail:", error);
    return { success: false, message: `Failed to send email: ${error.message}` };
  }
};
