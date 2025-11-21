import React, { useState, useEffect, useCallback } from 'react';                     // Importa React e hooks de estado, efeito e callback
import { Button } from '@/components/ui/button';                                     // Botão estilizado
import { Input } from '@/components/ui/input';                                       // Campo de input estilizado
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';     // Componentes de card para layout
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // Componentes de diálogo
import { useToast } from '@/hooks/use-toast';                                        // Hook para exibir notificações
import { db } from '@/integrations/firebase/client';                                 // Instância do Firestore configurado
import { useAuth } from '@/components/AuthProvider';                                 // Hook de autenticação do usuário
import { doc, onSnapshot, updateDoc, arrayRemove } from 'firebase/firestore';         // Funções do Firestore para manipulação de documentos
import { UserPlus, X } from 'lucide-react';                                          // Ícones de adicionar usuário e remover

// Tipo para perfis de participantes
interface ParticipantProfile {
  name: string;
  email: string;
}

// Props esperadas pelo componente
interface WorkshopParticipantManagerProps {
  workshopId: string;                                                                // ID do workshop
  workshopName: string;                                                              // Nome do workshop
  isCreator: boolean;                                                                // Se o usuário atual é criador do workshop
}

// Componente principal para gerenciar participantes
const WorkshopParticipantManager: React.FC<WorkshopParticipantManagerProps> = ({ workshopId, workshopName, isCreator }) => {
  const [participants, setParticipants] = useState<ParticipantProfile[]>([]);         // Lista de participantes
  const [inviteEmail, setInviteEmail] = useState('');                                // Email para convite
  const [isInviteOpen, setIsInviteOpen] = useState(false);                           // Controle do modal de convite
  const [loading, setLoading] = useState(true);                                       // Estado de carregamento inicial
  const { toast } = useToast();                                                      // Função para exibir toasts
  const { user } = useAuth();                                                        // Usuário autenticado

  // Função para buscar participantes em tempo real via snapshot
  const fetchParticipants = useCallback(() => {
    const workshopRef = doc(db, 'workshops', workshopId);                             // Referência ao documento do workshop

    const unsubscribe = onSnapshot(workshopRef, (snapshot) => {                       // Escuta atualizações em tempo real
      if (snapshot.exists()) {
        const participantEmails = snapshot.data().participants || [];                 // Lista de emails
        setParticipants(participantEmails.map((email: string) => ({ email, name: 'Unknown' }))); // Define participantes com nome desconhecido
      }
      setLoading(false);                                                              // Finaliza estado de carregamento
    });

    return unsubscribe;                                                               // Retorna função para cancelar subscrição
  }, [workshopId]);

  // Dispara busca ao montar componente
  useEffect(() => {
    const unsubscribe = fetchParticipants();                                          // Inicia listener
    return () => unsubscribe();                                                       // Cancela ao desmontar
  }, [fetchParticipants]);

  // Envia convite para participante via API backend
  const handleInviteParticipant = async () => {
    if (!inviteEmail.trim() || !user) return;                                         // Validação básica

    try {
      const token = await user.getIdToken();                                          // Obtém token do usuário

      const response = await fetch('http://localhost:3001/api/invite-workshop', {     // Chamada ao backend
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`                                          // Token JWT para autenticação
        },
        body: JSON.stringify({ recipientEmail: inviteEmail, workshopId, workshopName }),
      });

      const responseData = await response.json();                                     // Parse da resposta

      if (!response.ok) {                                                             // Em caso de erro HTTP
        throw new Error(responseData.message || `Failed to send invite. Status: ${response.status}`);
      }

      toast({ title: "Invitation Sent", description: `An invitation has been sent to ${inviteEmail}.` }); // Sucesso
      setInviteEmail('');                                                             // Limpa input
      setIsInviteOpen(false);                                                         // Fecha modal

    } catch (error: any) {
      console.error("Error details:", error);

      let description = error.message || "An unknown error occurred.";                // Mensagem padrão

      if (error instanceof SyntaxError) {                                             // Erro de JSON inválido
        description = "Received an invalid response from the server. This can happen if the API endpoint isn't working correctly.";
      }

      toast({ title: "Error Sending Invite", description, variant: "destructive" });  // Exibe toast de erro
    }
  };

  // Remove participante do Firestore
  const handleRemoveParticipant = async (emailToRemove: string) => {
    try {
      await updateDoc(doc(db, 'workshops', workshopId), {
        participants: arrayRemove(emailToRemove),                                      // Remove email do array
      });

      toast({ title: "Participant Removed", description: `${emailToRemove} has been removed.` });

    } catch (error) {
      toast({ title: "Error", description: "Failed to remove participant.", variant: "destructive" });
    }
  };

  // Exibe tela de carregamento
  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Participants ({participants.length})</CardTitle>                 {/* Exibe número de participantes */}
        </CardHeader>

        <CardContent>
          {/* Apenas criador pode convidar */}
          {isCreator && (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a Participant</DialogTitle>
                  <DialogDescription>Enter the email of the person you want to invite.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <Input type="email" placeholder="participant@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                  <Button onClick={handleInviteParticipant}>Send Invite</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Lista de participantes */}
          <div className="mt-4 space-y-2">
            {participants.map((p, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                <span>{p.email}</span>                                                {/* Exibe email do participante */}
                
                {/* Criador pode remover participantes */}
                {isCreator && (
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveParticipant(p.email)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {participants.length === 0 && (
              <p className="text-sm text-gray-500">No participants yet.</p>            // Mensagem quando lista está vazia
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkshopParticipantManager;                                            // Exporta componente
