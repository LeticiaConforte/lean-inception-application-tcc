# Lean Inception Application

## Visão Geral

A **Lean Inception Application** é uma ferramenta colaborativa em tempo real projetada para facilitar a realização de workshops de Lean Inception. Ela digitaliza e automatiza as atividades do método, permitindo que equipes distribuídas definam em conjunto a Visão do Produto, Personas, Jornadas de Usuário, Features e o Canvas MVP.

Esta aplicação foi construída com uma arquitetura moderna, utilizando **React**, **TypeScript**, **Node.js** e **Firebase** para oferecer uma experiência de usuário fluida e responsiva.

---

## Funcionalidades Principais

*   **Workshops Colaborativos:** Múltiplos usuários podem interagir em um mesmo workshop em tempo real.
*   **Templates Dinâmicos:** Utilize templates consagrados da metodologia Lean Inception, como Visão do Produto, Personas, Canvas MVP, e mais.
*   **Gerenciamento de Workspaces:** Organize workshops e equipes em workspaces dedicados.
*   **Autenticação e Segurança:** Sistema de autenticação seguro com gerenciamento de permissões (admin, usuário).
*   **Exportação de Relatórios:** Gere e exporte relatórios consolidados dos workshops em formato PDF.
*   **Assistente com IA:** Um assistente integrado para auxiliar nas atividades e brainstorming.

---

## Arquitetura e Documentação Técnica

O projeto é dividido em um **frontend (React)**, um **backend (Node.js/Express)** e utiliza os serviços do **Firebase** (Firestore, Auth, Storage) como Backend-as-a-Service.

Para um mergulho profundo na arquitetura, estrutura de arquivos, tecnologias e decisões de design, consulte a nossa documentação técnica completa:

➡️ **[Documentação Técnica Detalhada (TECHNICAL_DOCUMENTATION.md)](./TECHNICAL_DOCUMENTATION.md)**

---

## Pré-requisitos

Antes de começar, certifique-se de ter o seguinte:

*   **Node.js:** Versão 18 ou superior. Você pode baixá-lo em [nodejs.org](https://nodejs.org/en/).
*   **npm:** Geralmente instalado junto com o Node.js.
*   **Conta Google:**
    *   Para acesso ao [Firebase](https://firebase.google.com/) e criação de um projeto.
    *   Para a funcionalidade de envio de e-mails.
*   **Chave de API do Google AI:** Necessária para a funcionalidade do AI Assistant. Você pode obter uma em [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## Rodando Localmente

Siga estes passos para configurar e executar o projeto em sua máquina local.

### 1. Clone o Repositório

```bash
git clone https://github.com/LeticiaConforte/lean-inception-application.git
cd lean-inception-application
```

### 2. Instale as Dependências

Este comando instalará todas as dependências necessárias para o frontend e o backend.

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente (.env)

Você precisará criar dois arquivos `.env` para armazenar as credenciais e configurações do projeto.

#### a) Frontend (`/.env`)

Na **raiz do projeto**, crie um arquivo chamado `.env`. Ele conterá as credenciais do seu cliente Firebase.

```
# Adicione as credenciais do seu projeto Firebase.
# Você pode encontrá-las no Console do Firebase > Configurações do Projeto > Geral > "Suas Apps" > "Configuração de SDK".
VITE_FIREBASE_API_KEY="SUA_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="SEU_AUTH_DOMAIN.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="SEU_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="SEU_STORAGE_BUCKET.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="SEU_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="SEU_APP_ID"
```

#### b) Backend (`/backend/.env`)

Na pasta **`backend/`**, crie um arquivo chamado `.env`. Ele conterá as credenciais do servidor, da API de IA e do serviço de e-mail.

```
# Porta do servidor backend (padrão 3001)
PORT=3001

# Chave de API do Google AI (Gemini)
# Obtenha em https://aistudio.google.com/app/apikey
GEMINI_API_KEY="SUA_CHAVE_GEMINI_API"

# Credenciais para envio de e-mail via Gmail
# O e-mail que enviará os convites
GOOGLE_EMAIL_USER="seu-email@gmail.com"
# ATENÇÃO: Esta NÃO é a sua senha normal do Gmail.
# É uma "Senha de App" que você precisa gerar nas configurações de segurança da sua Conta Google.
# Pré-requisito: A autenticação de dois fatores deve estar ativada.
# Veja como gerar: https://support.google.com/accounts/answer/185833
GOOGLE_EMAIL_PASS="sua_senha_de_app_de_16_digitos"

# Credenciais da Conta de Serviço do Firebase (para o Admin SDK)
# Gere no Console do Firebase > Configurações do Projeto > Contas de Serviço > Gerar nova chave privada.
# Copie TODO o conteúdo do arquivo JSON gerado e cole aqui em uma única linha.
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account", "project_id": "...", ...}'
```

### 4. Execute o Ambiente de Desenvolvimento

Este comando iniciará o servidor de desenvolvimento do Vite (frontend) e o servidor Node.js (backend) simultaneamente.

```bash
npm run dev
```

### 5. Acesse a Aplicação

Abra seu navegador e acesse [http://localhost:5173](http://localhost:5173) (ou a porta que o Vite indicar no terminal).

---

## Criando o Primeiro Administrador

Após executar a aplicação pela primeira vez, você precisará de um usuário administrador para gerenciar o sistema.

1.  **Crie uma conta:** Registre um novo usuário normalmente através da interface da aplicação.
2.  **Promova o usuário a admin:** Execute o seguinte comando no terminal, na raiz do projeto, substituindo `<email-do-usuario>` pelo e-mail que você acabou de registrar.

```bash
node make-admin.js <email-do-usuario>
```

---

## Contribuindo

Contribuições são muito bem-vindas! Se você tem ideias para novas funcionalidades, melhorias ou correções de bugs, sinta-se à vontade para abrir uma **Issue** ou enviar um **Pull Request**.
