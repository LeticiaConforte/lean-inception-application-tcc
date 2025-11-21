// Função que gera o HTML do e-mail de convite para um workshop
// Recebe o nome do convidador, o nome do workshop e a URL de aceitação
const getWorkshopInviteHtml = (inviterName, workshopName, acceptUrl) => `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        /* Estilos CSS aplicados ao e-mail */
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; font-size: 24px; }
        .button { display: inline-block; background-color: #3498db; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; margin-bottom: 15px; }
        .footer { margin-top: 20px; font-size: 12px; color: #777; }
        .list-item { margin: 0; padding: 0; line-height: 1.4; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Título do e-mail -->
        <h1>Convite para participar do Workshop: “${workshopName}”</h1>

        <!-- Saudação básica -->
        <p>Olá,</p>

        <!-- Mensagem informando quem enviou o convite -->
        <p>Você foi convidado(a) por <strong>${inviterName}</strong> para participar do Workshop “${workshopName}”, realizado através da aplicação Lean Inception.</p>

        <!-- Explicação do propósito do workshop -->
        <p>Este workshop tem como objetivo promover a colaboração entre equipes, alinhar expectativas e definir o produto mínimo viável (MVP) de forma estruturada e eficiente.</p>

        <!-- Benefícios da participação -->
        <p>Durante o workshop, você poderá:</p>
        <p class="list-item">&bull; Participar ativamente das dinâmicas e etapas do processo;</p>
        <p class="list-item">&bull; Compartilhar ideias, insights e feedbacks;</p>
        <p class="list-item">&bull; Contribuir com a construção colaborativa do projeto;</p>
        <p class="list-item">&bull; Acompanhar em tempo real o andamento das atividades.</p>

        <br>

        <!-- Botão para aceitar e entrar no Workshop -->
        <p>Para confirmar sua participação e acessar o ambiente do workshop, clique no botão abaixo:</p>
        <p><a href="https://inception-visual-lab-main.web.app${acceptUrl}" class="button">Acessar o Workshop “${workshopName}”</a></p>

        <!-- Informação adicional de suporte -->
        <p>Em caso de dúvidas ou dificuldades de acesso, entre em contato com ${inviterName} pelo e-mail informado na aplicação.</p>

        <!-- Rodapé do e-mail -->
        <div class="footer">
          <p>Atenciosamente,<br>Equipe Lean Inception</p>
        </div>
      </div>
    </body>
  </html>
`;


// Função que gera o HTML do e-mail de convite para um workspace
// Similar ao template acima, mas com texto adaptado
const getWorkspaceInviteHtml = (inviterName, workspaceName, acceptUrl) => `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        /* Estilos CSS compartilhados */
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; font-size: 24px; }
        .button { display: inline-block; background-color: #3498db; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; margin-bottom: 15px; }
        .footer { margin-top: 20px; font-size: 12px; color: #777; }
        .list-item { margin: 0; padding: 0; line-height: 1.4; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Título do e-mail -->
        <h1>Acesso concedido ao Workspace: “${workspaceName}”</h1>

        <!-- Saudação -->
        <p>Olá,</p>

        <!-- Mensagem informando quem adicionou o usuário ao workspace -->
        <p>Você foi adicionado(a) por <strong>${inviterName}</strong> ao workspace “${workspaceName}”, dentro da aplicação Lean Inception.</p>

        <!-- Explicação do propósito do espaço -->
        <p>Este espaço foi criado para promover o trabalho colaborativo, o planejamento estratégico e o registro estruturado das atividades do workshop.</p>

        <!-- Benefícios do workspace -->
        <p>Ao acessar o workspace, você poderá:</p>
        <p class="list-item">&bull; Acompanhar o progresso das etapas do workshop;</p>
        <p class="list-item">&bull; Contribuir com ideias, anotações e comentários;</p>
        <p class="list-item">&bull; Interagir com os demais participantes em tempo real.</p>

        <br>

        <!-- Botão de acesso ao workspace -->
        <p>Clique no botão abaixo para acessar o workspace e iniciar sua participação:</p>
        <a href="https://inception-visual-lab-main.web.app${acceptUrl}" class="button">Acessar o Workspace “${workspaceName}”</a>

        <!-- Suporte -->
        <p>Caso tenha dúvidas sobre o acesso ou sobre as atividades, entre em contato com ${inviterName} pelo e-mail informado na aplicação.</p>

        <!-- Rodapé -->
        <div class="footer">
          <p>Atenciosamente,<br>Equipe Lean Inception</p>
        </div>
      </div>
    </body>
  </html>
`;

// Exporta as duas funções para uso em outros arquivos
module.exports = { getWorkshopInviteHtml, getWorkspaceInviteHtml };
