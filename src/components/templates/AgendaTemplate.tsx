import React from 'react'; // Importa a biblioteca React para criar componentes

const agendaData = [ // Declara um array contendo os dados da agenda
    { // Primeiro objeto representando a segunda-feira
      day: 'MONDAY', // Define o dia da semana
      morning: [ // Lista de atividades da manhã
        { activity: 'KICKOFF', color: 'bg-purple-200 text-purple-800' }, // Atividade e cor correspondente
        { activity: 'PRODUCT VISION', color: 'bg-yellow-200 text-yellow-800' }, // Outra atividade da manhã
      ],
      afternoon: [ // Lista de atividades da tarde
        { activity: 'IS - IS NOT - DOES - DOES NOT DO', color: 'bg-yellow-200 text-yellow-800' }, // Atividade com cor
        { activity: 'PRODUCT GOAL', color: 'bg-yellow-200 text-yellow-800' }, // Segunda atividade da tarde
      ],
    },
    { // Segundo dia: terça-feira
      day: 'TUESDAY', // Nome do dia
      morning: [{ activity: 'PERSONAS', color: 'bg-yellow-200 text-yellow-800' }], // Atividade da manhã
      afternoon: [{ activity: 'USER JOURNEYS', color: 'bg-yellow-200 text-yellow-800' }], // Atividade da tarde
    },
    { // Terceiro dia: quarta-feira
      day: 'WEDNESDAY', // Nome do dia
      morning: [{ activity: 'FEATURE BRAINSTORMING', color: 'bg-yellow-200 text-yellow-800' }], // Atividade da manhã
      afternoon: [{ activity: 'TECH, BUSINESS AND UX REVIEW', color: 'bg-yellow-200 text-yellow-800' }], // Atividade da tarde
    },
    { // Quarto dia: quinta-feira
      day: 'THURSDAY', // Nome do dia
      morning: [{ activity: 'SEQUENCER', color: 'bg-yellow-200 text-yellow-800' }], // Atividade da manhã
      afternoon: [{ activity: 'MVP CANVAS', color: 'bg-yellow-200 text-yellow-800' }], // Atividade da tarde
    },
    { // Quinto dia: sexta-feira
      day: 'FRIDAY', // Nome do dia
      morning: [{ activity: 'SHOWCASE', color: 'bg-yellow-200 text-yellow-800' }], // Atividade da manhã
      afternoon: [{ activity: 'SHOWCASE', color: 'bg-purple-200 text-purple-800' }], // Atividade da tarde com cor diferente
    },
];

const AgendaTemplate: React.FC = () => { // Declara o componente funcional AgendaTemplate tipado com React.FC
  return ( // Início da renderização do JSX
    <div className="p-6 bg-white rounded-lg shadow-md"> {/* Container principal com padding, fundo branco e sombra */}
        <div className="p-4 rounded-lg mb-6"> {/* Seção do título com espaçamento e margem inferior */}
            <h1 className="text-2xl font-bold text-gray-800">Agenda</h1> {/* Título da página */}
        </div>
      <div className="border border-black"> {/* Contêiner da tabela com borda preta */}
        <div className="grid grid-cols-5"> {/* Linha contendo os títulos dos 5 dias da semana */}
          {agendaData.map((item, index) => ( // Itera sobre os dias da agenda
            <div key={item.day} className={`font-bold text-center py-2 bg-gray-200 ${index < 4 ? 'border-r border-black' : ''}`}> {/* Coluna do dia com borda à direita, exceto na última */}
              {item.day} {/* Nome do dia */}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 border-t border-black"> {/* Linha com o título MORNING */}
          {[...Array(5)].map((_, index) => ( // Cria 5 colunas iguais
            <div key={index} className={`font-bold text-center py-2 bg-yellow-400 ${index < 4 ? 'border-r border-black' : ''}`}> {/* Estilização */}
              MORNING {/* Texto da seção */}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 h-48"> {/* Linha com as atividades da manhã */}
          {agendaData.map((item, index) => ( // Itera pelos dias novamente
            <div key={item.day} className={`p-2 space-y-2 flex flex-col ${index < 4 ? 'border-r border-black' : ''}`}> {/* Coluna com atividades da manhã */}
              {item.morning.map(task => ( // Itera pelas atividades da manhã
                <div key={task.activity} className={`p-3 rounded text-center font-semibold text-sm ${task.color}`}> {/* Caixa da atividade */}
                  {task.activity} {/* Nome da atividade */}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 border-t border-black"> {/* Linha para o LUNCH */}
          {[...Array(5)].map((_, index) => ( // Renderiza 5 colunas
            <div key={index} className={`font-bold text-center py-2 bg-yellow-500 ${index < 4 ? 'border-r border-black' : ''}`}> {/* Estilização */}
              LUNCH {/* Texto da seção */}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 border-t border-black"> {/* Linha para AFTERNOON */}
          {[...Array(5)].map((_, index) => ( // Cria 5 colunas */}
            <div key={index} className={`font-bold text-center py-2 bg-yellow-400 ${index < 4 ? 'border-r border-black' : ''}`}> {/* Estilização */}
              AFTERNOON {/* Texto da seção */}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 h-48 border-t border-black"> {/* Linha com atividades da tarde */}
          {agendaData.map((item, index) => ( // Itera os dias novamente
            <div key={item.day} className={`p-2 space-y-2 flex flex-col ${index < 4 ? 'border-r border-black' : ''}`}> {/* Coluna */}
              {item.afternoon.map(task => ( // Itera atividades da tarde
                <div key={task.activity} className={`p-3 rounded text-center font-semibold text-sm ${task.color}`}> {/* Renderiza a atividade */}
                  {task.activity} {/* Nome da atividade */}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  ); // Fim da renderização JSX
};

export default AgendaTemplate; // Exporta o componente para uso externo
