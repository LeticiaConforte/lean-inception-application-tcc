import React, { useState, useEffect } from 'react'; // Importa o React e os hooks useState e useEffect para gerenciar estado e efeitos colaterais
import { Button } from '@/components/ui/button'; // Importa o componente de botão estilizado da UI
import CloneWorkshopDialog from '@/components/CloneWorkshopDialog'; // Importa o diálogo usado para escolher o workspace alvo ao clonar um workshop
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Importa componentes de cartão usados para exibir cada workshop
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // Importa componentes de diálogo para o modal de exclusão
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'; // Importa componentes de menu suspenso para ações do workshop
import { useToast } from '@/hooks/use-toast'; // Hook personalizado para exibir notificações (toast) na tela
import { db } from '@/integrations/firebase/client'; // Instância do Firestore configurada para o projeto
import { useAuth } from '@/components/AuthProvider'; // Hook de contexto de autenticação para obter o usuário logado
import { useClickOutside } from '@/hooks/useClickOutside'; // Hook customizado que detecta clique fora de um elemento e dispara uma callback
import { MoreVertical, Play, Copy, Trash2, Plus } from 'lucide-react'; // Ícones importados da biblioteca Lucide usados na interface
import { format } from 'date-fns'; // Função format da biblioteca date-fns para formatar datas
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, orderBy, writeBatch } from 'firebase/firestore'; // Funções do Firestore para consultas, escrita em lote e manipulação de documentos
import { defaultTemplates } from '@/lib/defaultTemplates'; // Lista de templates padrão utilizada para calcular o total de etapas do workshop

// Tipagem dos dados de um workshop
interface Workshop { // Interface que define o formato esperado dos dados de um workshop
  id: string; // Identificador único do workshop no Firestore
  name: string; // Nome do workshop
  status: string; // Status atual do workshop (por exemplo, in_progress, done)
  current_step: number; // Etapa atual em que o workshop se encontra
  total_steps: number; // Quantidade total de etapas previstas para o workshop
  created_by: string; // ID do usuário que criou o workshop
  created_at: any; // Data de criação do workshop (Timestamp ou outro tipo compatível)
  updated_at: any; // Data da última atualização do workshop
  workspace_id: string | null; // ID do workspace ao qual o workshop pertence ou null para workshops pessoais
}

// Tipagem das props do componente
interface RecentWorkshopsProps { // Interface para as propriedades aceitas pelo componente RecentWorkshops
  onSelectWorkshop: (workshopId: string, workshopName?: string, participants?: string[], workspaceId?: string | null) => void; // Função chamada ao selecionar um workshop. Recebe ID e alguns metadados opcionais
  onShowNewWorkshopDialog: () => void; // Função chamada para abrir o diálogo de criação de um novo workshop
  workspaceId?: string | null; // ID do workspace atual filtrado. Pode ser null ou não informado
  filters?: any; // Objeto de filtros aplicado à consulta de workshops. Tipo genérico por flexibilidade
}

// Componente principal
const RecentWorkshops: React.FC<RecentWorkshopsProps> = ({ onSelectWorkshop, onShowNewWorkshopDialog, workspaceId = null, filters = {} }) => { // Declara o componente RecentWorkshops como função de componente React tipado com RecentWorkshopsProps
  const [workshops, setWorkshops] = useState<Workshop[]>([]); // Estado que armazena a lista de workshops retornados do Firestore
  const [loading, setLoading] = useState(true); // Estado que indica se os workshops estão sendo carregados
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // Estado booleano para controlar se o diálogo de exclusão está aberto
  const [workshopToDelete, setWorkshopToDelete] = useState<Workshop | null>(null); // Estado que guarda o workshop selecionado para exclusão
  const [cloning, setCloning] = useState<string | null>(null); // Estado que guarda o ID do workshop que está sendo clonado no momento
  const [showCloneDialog, setShowCloneDialog] = useState(false); // Estado booleano que controla a visibilidade do diálogo de clonagem
  const [workshopToClone, setWorkshopToClone] = useState<Workshop | null>(null); // Estado que guarda o workshop selecionado para clonagem
  const { toast } = useToast(); // Obtém a função toast do hook para exibir notificações
  const { user } = useAuth(); // Obtém o usuário autenticado a partir do contexto de autenticação

  const dialogRef = useClickOutside<HTMLDivElement>(() => { // Utiliza o hook useClickOutside passando a função a ser executada ao clicar fora
    setDeleteDialogOpen(false); // Ao clicar fora do conteúdo do diálogo, fecha o diálogo de exclusão
  }, deleteDialogOpen); // Segundo parâmetro indica se o listener deve estar ativo com base no estado deleteDialogOpen

  const formatDate = (date: any) => { // Função utilitária para formatar uma data em texto legível
    if (!date) return 'N/A'; // Se a data estiver ausente, retorna uma string padrão indicando indisponibilidade
    const d = date?.toDate ? date.toDate() : new Date(date); // Se o objeto tiver método toDate (ex. Timestamp do Firestore) converte para Date, senão tenta criar um Date diretamente
    return format(d, 'MMM d, yyyy'); // Formata a data no padrão "Mês abreviado dia, ano", por exemplo "Jan 5, 2025"
  };

  const fetchWorkshops = async () => { // Função assíncrona responsável por buscar a lista de workshops do Firestore
    if (!user) return; // Se não houver usuário logado, não faz a busca
    setLoading(true); // Marca que o carregamento foi iniciado

    try { // Bloco try para capturar erros durante a consulta ao Firestore
      const workshopsRef = collection(db, 'workshops'); // Referência à coleção 'workshops' no Firestore
      let queryConstraints: any[] = []; // Array de restrições que serão aplicadas à consulta

      if (workspaceId && workspaceId !== 'personal') { // Se um workspaceId válido foi fornecido e não é o tipo 'personal'
        queryConstraints.push(where('workspace_id', '==', workspaceId)); // Filtra os workshops pelo workspace_id selecionado
      } else { // Caso não haja workspace ou seja workspace pessoal
        queryConstraints.push(where('workspace_id', '==', null)); // Filtra workshops sem workspace associado (pessoais)
        queryConstraints.push(where('created_by', '==', user.uid)); // E filtra também por created_by, garantindo que sejam do usuário atual
      }

      if (filters.status) { // Se houver filtro de status aplicado
        queryConstraints.push(where('status', '==', filters.status)); // Adiciona a restrição de status à consulta
      }

      if (filters.searchTerm) { // Se houver termo de busca aplicado
        queryConstraints.push(where('name', '>=', filters.searchTerm)); // Adiciona restrição para nome maior ou igual ao termo de busca
        queryConstraints.push(where('name', '<=', filters.searchTerm + '\uf8ff')); // Adiciona restrição para nome menor ou igual ao termo com sufixo, permitindo busca por prefixo
        queryConstraints.push(orderBy('name', 'asc')); // Ordena os resultados pelo nome em ordem crescente
      } else { // Se não houver termo de busca
        queryConstraints.push(orderBy('updated_at', 'desc')); // Ordena os workshops pela data de atualização mais recente primeiro
      }

      const q = query(workshopsRef, ...queryConstraints); // Cria a query combinando a referência e todas as restrições definidas
      const querySnapshot = await getDocs(q); // Executa a query no Firestore e obtém o snapshot dos documentos
      const workshopsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workshop)); // Mapeia os documentos em objetos Workshop, incluindo o id do documento
      setWorkshops(workshopsData); // Atualiza o estado com a lista de workshops carregados
    } catch (error: any) { // Captura erros gerados na execução do bloco try
      console.error('Error fetching workshops:', error); // Loga o erro detalhado no console
      toast({ title: "Error", description: `Failed to load workshops. ${error.message}`, variant: "destructive" }); // Exibe toast informando que houve falha no carregamento
    } finally { // Bloco executado sempre, independentemente de sucesso ou erro
      setLoading(false); // Marca que o carregamento foi concluído
    }
  };

  useEffect(() => { // Hook de efeito que dispara quando user, workspaceId ou filters mudam
    fetchWorkshops(); // Chama a função de busca de workshops sempre que as dependências mudarem
  }, [user, workspaceId, filters]); // Dependências do useEffect. Reexecuta o efeito nessas mudanças

  const handleDeleteClick = (workshop: Workshop, event: React.MouseEvent) => { // Função chamada ao clicar na opção de deletar em um workshop
    event.stopPropagation(); // Impede que o clique propague para o Card e dispare o onClick de seleção
    setWorkshopToDelete(workshop); // Define o workshop selecionado para exclusão
    setDeleteDialogOpen(true); // Abre o diálogo de confirmação de exclusão
  };

  const handleCloneWorkshop = (workshop: Workshop, event: React.MouseEvent) => { // Função chamada ao clicar na opção de clonar um workshop
    event.stopPropagation(); // Impede propagação do clique para o Card
    setWorkshopToClone(workshop); // Define o workshop que será clonado
    setShowCloneDialog(true); // Abre o diálogo para escolher o workspace alvo
  };

  const performClone = async (targetWorkspaceId: string | null) => { // Função assíncrona que executa a clonagem do workshop selecionado para um workspace alvo
    if (!user || !workshopToClone) return; // Garante que haja usuário logado e um workshop selecionado para clonagem
    setCloning(workshopToClone.id); // Marca o ID do workshop que está sendo clonado, para controlar o estado de carregamento na UI

    try { // Bloco try para tratar erros na clonagem
      const countedTemplates = defaultTemplates.filter(t => t.is_counted).length; // Calcula o número de templates que contam como etapas do workshop

      const newWorkshopRef = await addDoc(collection(db, 'workshops'), { // Cria um novo documento de workshop na coleção 'workshops'
        name: `${workshopToClone.name} (Copy)`, // Nome do novo workshop indicando que é uma cópia
        created_by: user.uid, // Define o criador como o usuário atual
        participants: [user.email!], // Participantes iniciais do workshop. Inclui o e-mail do criador
        current_step: 1, // Etapa inicial da cópia
        total_steps: countedTemplates, // Total de etapas baseado no número de templates contados
        workspace_id: targetWorkspaceId, // Workspace alvo para a cópia. Pode ser null
        status: 'in_progress', // Status inicial da cópia, definido como em progresso
        created_at: serverTimestamp(), // Data de criação gerada pelo servidor
        updated_at: serverTimestamp(), // Data de atualização inicial igual à criação
      });

      const templatesRef = collection(db, 'workshops', workshopToClone.id, 'templates'); // Referência à subcoleção de templates do workshop original
      const templatesQuery = query(templatesRef, orderBy('step_number')); // Cria uma query ordenando os templates pelo campo step_number
      const templatesSnapshot = await getDocs(templatesQuery); // Obtém os templates do workshop original

      if (!templatesSnapshot.empty) { // Se houver templates no workshop original
        const batch = writeBatch(db); // Cria um batch para operações em lote
        templatesSnapshot.docs.forEach(templateDoc => { // Itera sobre cada documento de template encontrado
          const newTemplateRef = doc(collection(db, 'workshops', newWorkshopRef.id, 'templates')); // Cria uma nova referência de template dentro da subcoleção do novo workshop
          batch.set(newTemplateRef, templateDoc.data()); // Adiciona ao batch um set copiando os dados do template original
        });
        await batch.commit(); // Executa todas as operações do batch no Firestore
      }

      toast({ title: 'Success', description: 'Workshop cloned successfully.' }); // Exibe toast indicando que a clonagem foi realizada com sucesso
      fetchWorkshops(); // Atualiza a listagem de workshops após a clonagem
    } catch (error: any) { // Captura erros durante o processo de clonagem
      console.error('Error cloning workshop:', error); // Loga o erro no console
      toast({ title: 'Error', description: `Failed to create a copy: ${error.message}`, variant: 'destructive' }); // Exibe toast de erro informando a falha
    } finally { // Sempre executado após o try, com sucesso ou erro
      setCloning(null); // Limpa o estado de clonagem, removendo o ID
      setShowCloneDialog(false); // Fecha o diálogo de clonagem
      setWorkshopToClone(null); // Limpa o workshop selecionado para clonagem
    }
  };

  const confirmDelete = async () => { // Função assíncrona que confirma e executa a exclusão do workshop selecionado
    if (!workshopToDelete || !user) return; // Se não houver workshop selecionado para deletar ou usuário, sai da função

    if (user.uid !== workshopToDelete.created_by) { // Verifica se o usuário atual é diferente do criador do workshop
      toast({ title: "Permission Denied", description: "You can only delete workshops you created.", variant: "destructive" }); // Exibe toast informando que o usuário não tem permissão para deletar
      return; // Encerra a função sem deletar
    }

    try { // Bloco try para tratar erros na exclusão
      const batch = writeBatch(db); // Cria um batch para executar múltiplas operações no Firestore
      const templatesRef = collection(db, 'workshops', workshopToDelete.id, 'templates'); // Referência à subcoleção de templates do workshop que será deletado
      const templatesSnapshot = await getDocs(templatesRef); // Busca todos os templates associados a esse workshop
      templatesSnapshot.docs.forEach(doc => batch.delete(doc.ref)); // Para cada template encontrado, adiciona a operação de delete ao batch

      batch.delete(doc(db, 'workshops', workshopToDelete.id)); // Adiciona ao batch a deleção do próprio documento do workshop
      await batch.commit(); // Executa todas as deleções em lote

      toast({ title: "Success", description: "Workshop deleted successfully." }); // Exibe toast informando que o workshop foi deletado com sucesso
      setWorkshops(prev => prev.filter(w => w.id !== workshopToDelete.id)); // Remove o workshop deletado da lista mantida no estado
    } catch (error: any) { // Captura erros durante o processo de exclusão
      console.error('Error deleting workshop:', error); // Loga o erro no console
      toast({ title: "Error", description: `Deletion failed: ${error.message}`, variant: "destructive" }); // Exibe toast de erro informando que a exclusão falhou
    } finally { // Sempre executado após o try
      setDeleteDialogOpen(false); // Fecha o diálogo de confirmação de exclusão
      setWorkshopToDelete(null); // Limpa o workshop selecionado para exclusão
    }
  };

  const correctTotalSteps = defaultTemplates.filter(t => t.is_counted).length; // Calcula o número correto de etapas totais com base em templates marcados como is_counted

  if (loading) { // Se o estado de loading estiver verdadeiro
    return ( // Renderiza skeletons de loading enquanto os workshops ainda são carregados
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Grid responsivo de cartões de loading */}
        {[...Array(6)].map((_, i) => ( // Cria um array com 6 itens para renderizar 6 skeletons
          <Card key={i} className="animate-pulse"> {/* Card com animação de pulsar, simulando loading */}
            <CardHeader className="pb-3"><div className="h-4 bg-gray-200 rounded w-3/4"></div></CardHeader> {/* Skeleton para o título do card */}
            <CardContent><div className="h-10 bg-gray-200 rounded mt-4"></div></CardContent> {/* Skeleton para o conteúdo do card */}
          </Card>
        ))}
      </div>
    );
  }

  return ( // Renderização principal do componente quando não está carregando
    <div className="space-y-6"> {/* Container com espaçamento vertical entre os blocos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Grid responsivo que organiza os cards dos workshops */}
        <Card
          className="border-2 border-dashed border-gray-300 hover:border-inception-blue transition-all cursor-pointer bg-gray-50 hover:bg-blue-50 min-h-[200px] flex items-center justify-center" // Estilos do card que representa a criação de novo workshop
          onClick={onShowNewWorkshopDialog} // Ao clicar, chama a função para abrir o diálogo de novo workshop
        >
          <CardContent className="text-center p-6"> {/* Conteúdo centralizado do card de novo workshop */}
            <div className="bg-inception-blue rounded-full p-3 inline-block"><Plus className="h-6 w-6 text-white" /></div> {/* Ícone de + dentro de um círculo azul */}
            <h3 className="text-base font-semibold mt-3">New Workshop</h3> {/* Título do card indicando criação de novo workshop */}
          </CardContent>
        </Card>

        {workshops.map((workshop) => { // Itera sobre a lista de workshops retornados do Firestore
          const progressPercentage = correctTotalSteps > 0 ? (workshop.current_step / correctTotalSteps) * 100 : 0; // Calcula a porcentagem de progresso com base na etapa atual e total de etapas

          return ( // Retorna um Card para cada workshop
            <Card key={workshop.id} className="hover:shadow-lg transition-shadow group min-h-[200px] flex flex-col"> {/* Card com efeito de sombra ao passar o mouse e layout em coluna */}
              <div className="cursor-pointer flex-grow" onClick={() => onSelectWorkshop(workshop.id, workshop.name, [], workshop.workspace_id)}> {/* Área clicável que seleciona e abre o workshop */}
                <CardHeader className="pb-2"> {/* Cabeçalho do card com padding inferior menor */}
                  <div className="flex items-start justify-between"> {/* Div que alinha título e menu de ações horizontalmente */}
                    <CardTitle className="text-base font-semibold group-hover:text-blue-600"> {/* Título do workshop com estilo e mudança de cor no hover do grupo */}
                      {workshop.name} {/* Exibe o nome do workshop */}
                    </CardTitle>

                    <DropdownMenu> {/* Menu suspenso de ações do workshop */}
                      <DropdownMenuTrigger asChild> {/* Define o gatilho do menu como filho (o botão) */}
                        <Button variant="ghost" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}> {/* Botão pequeno e transparente que abre o menu. Para o clique de propagar */}
                          <MoreVertical className="h-4 w-4" /> {/* Ícone de três pontos verticais indicando mais ações */}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}> {/* Conteúdo do menu alinhado à direita. Impede que o clique propague ao card */}
                        <DropdownMenuItem onClick={() => onSelectWorkshop(workshop.id, workshop.name, [], workshop.workspace_id)}> {/* Item do menu para continuar o workshop */}
                          <Play className="mr-2 h-4 w-4" />Continue {/* Ícone de play seguido do texto Continue */}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={(e) => handleCloneWorkshop(workshop, e)} disabled={cloning === workshop.id}> {/* Item do menu para clonar o workshop, desabilitado se este workshop estiver sendo clonado */}
                          <Copy className="mr-2 h-4 w-4" /> {/* Ícone de cópia */}
                          {cloning === workshop.id ? 'Cloning...' : 'Clone'} {/* Exibe Cloning... se estiver clonando este workshop, senão mostra Clone */}
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={(e) => handleDeleteClick(workshop, e)} className="text-red-600 focus:text-red-700"> {/* Item do menu para deletar o workshop, com cor de alerta */}
                          <Trash2 className="mr-2 h-4 w-4" />Delete {/* Ícone de lixeira seguido do texto Delete */}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow flex flex-col justify-end"> {/* Conteúdo do card ocupando o espaço disponível, alinhado ao final vertical */}
                  <div className="space-y-3"> {/* Espaçamento vertical entre barra de progresso e informações */}
                    <div className="w-full bg-gray-200 rounded-full h-2"> {/* Fundo da barra de progresso */}
                      <div className="bg-inception-blue h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div> {/* Parte preenchida da barra de progresso com largura baseada na porcentagem */}
                    </div>

                    <div className="flex justify-between text-xs text-gray-500"> {/* Linha com informações adicionais do workshop */}
                      <p>Updated: {formatDate(workshop.updated_at)}</p> {/* Exibe a data da última atualização do workshop formatada pela função formatDate */}
                    </div>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4"> {/* Rodapé do card com padding superior */}
                <Button className="w-full bg-inception-blue text-white hover:bg-inception-purple"
                  onClick={() => onSelectWorkshop(workshop.id, workshop.name, [], workshop.workspace_id)}> {/* Botão para abrir o workshop diretamente */}
                  Open {/* Texto do botão indicando ação de abrir */}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {workshops.length === 0 && !loading && ( // Renderiza este bloco se não houver workshops e não estiver carregando
        <div className="text-center py-12 col-span-full"> {/* Container centralizado com padding vertical */}
          <div className="bg-gray-50 rounded-lg p-8"> {/* Caixa com fundo claro e bordas arredondadas */}
            <h3 className="text-lg font-medium">No workshops found</h3> {/* Mensagem principal indicando que não há workshops */}
            <p className="text-gray-500">Create a new workshop or check your filters.</p> {/* Sugestão para criar um novo workshop ou revisar filtros */}
          </div>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}> {/* Diálogo controlado que exibe a confirmação de deleção do workshop */}
        <DialogContent ref={dialogRef}> {/* Conteúdo do diálogo, com ref usado pelo hook useClickOutside */}
          <DialogHeader> {/* Cabeçalho do diálogo */}
            <DialogTitle>Delete Workshop</DialogTitle> {/* Título do diálogo de confirmação */}
            <DialogDescription>
              Are you sure to delete "{workshopToDelete?.name}"? This is irreversible. {/* Descrição explicando que a ação é irreversível, exibindo o nome do workshop */}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end space-x-2 mt-6"> {/* Linha com botões alinhados à direita e espaçamento horizontal */}
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button> {/* Botão para cancelar a exclusão e fechar o diálogo */}
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button> {/* Botão de ação destrutiva que confirma a exclusão */}
          </div>
        </DialogContent>
      </Dialog>

      {showCloneDialog && workshopToClone && ( // Renderiza o diálogo de clonagem somente se showCloneDialog for true e houver workshopToClone definido
        <CloneWorkshopDialog
          isOpen={showCloneDialog} // Controla a abertura do diálogo de clonagem
          onClose={() => setShowCloneDialog(false)} // Função chamada ao fechar o diálogo
          onConfirm={performClone} // Função chamada ao confirmar a clonagem, recebendo o workspace alvo
        />
      )}
    </div>
  );
};

export default RecentWorkshops; // Exporta o componente RecentWorkshops como padrão, permitindo seu uso em outras partes da aplicação
