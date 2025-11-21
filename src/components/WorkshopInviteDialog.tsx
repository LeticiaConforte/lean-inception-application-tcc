import { useState } from 'react';                                                     // Hook de estado do React
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';  
                                                                                      // Componentes de diálogo (Radix + shadcn)
import { Button } from '@/components/ui/button';                                       // Botão estilizado
import { Input } from '@/components/ui/input';                                         // Campo de input estilizado
import { useToast } from '@/components/ui/use-toast';                                  // Hook para exibir toasts
import { useAuth } from '@/components/AuthProvider';                                   // Hook personalizado para autenticação

// Tipagem das propriedades aceitáveis pelo componente
interface WorkshopInviteDialogProps {
  isOpen: boolean;                                                                     // Controle de abertura do diálogo
  onClose: () => void;                                                                 // Função para fechar o diálogo
  workshopId: string;                                                                  // ID do workshop
  workshopName: string;                                                                // Nome do workshop
}

// Componente principal do modal de convite
export const WorkshopInviteDialog: React.FC<WorkshopInviteDialogProps> = ({ 
    isOpen, 
    onClose, 
    workshopId, 
    workshopName 
}) => {

  // Estado para o email do convidado
  const [recipientEmail, setRecipientEmail] = useState('');

  // Estado para indicar envio em andamento
  const [isSending, setIsSending] = useState(false);

  // Toasts para feedback ao usuário
  const { toast } = useToast();

  // Dados do usuário logado
  const { user } = useAuth();

  // Função acionada ao clicar em "Send Invite"
  const handleSendInvite = async () => {

    // Valida campo de email vazio
    if (!recipientEmail) {
      toast({ title: "Error", description: "Please enter an email.", variant: "destructive" });
      return;
    }

    // Garante que apenas usuários autenticados enviem convites
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to send invites.", variant: "destructive" });
        return;
    }

    // Define estado para indicar carregamento
    setIsSending(true);

    try {
        // Obtém token do usuário autenticado para validar o backend
        const token = await user.getIdToken();

        // Chamada para a API backend que envia o email de convite
        const response = await fetch(`/api/invite-workshop`, { 
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`                                         // Token enviado para autenticação
            },
            body: JSON.stringify({
              recipientEmail: recipientEmail,                                          // Email do convidado
              workshopId: workshopId,                                                  // ID do workshop
              workshopName: workshopName,                                              // Nome do workshop
              senderName: user.displayName || user.email,                              // Nome de quem enviou
            }),
        });

        // Extrai a resposta
        const result = await response.json();

        // Se a API retornar erro, lança exceção
        if (!response.ok) {
            throw new Error(result.message || 'Failed to send invitation.');
        }

        // Feedback positivo
        toast({ 
            title: "Success!", 
            description: `Invitation sent to ${recipientEmail}.`
        });
        
        // Limpa o campo e fecha o modal
        setRecipientEmail('');
        onClose();

    } catch (error: any) {
      // Log para debugging
      console.error('Error sending invite:', error);

      // Feedback negativo
      toast({ 
          title: "Invitation Error", 
          description: error.message || "An unknown error occurred.", 
          variant: "destructive" 
      });

    } finally {
      // Finaliza estado de carregamento
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>                                       {/* Abre/fecha o modal */}
      <DialogContent className="max-w-md">                                             {/* Caixa do modal */}
        
        <DialogHeader>
          <DialogTitle>Invite to Workshop</DialogTitle>                                 {/* Título */}
          <DialogDescription>
            Invite someone to collaborate on the "{workshopName}" workshop.             {/* Descrição */}
          </DialogDescription>
        </DialogHeader>

        {/* Corpo do modal */}
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}                       // Atualiza email digitado
            />
          </div>
        </div>

        {/* Rodapé com botões */}
        <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>               {/* Fecha modal */}
            <Button 
              onClick={handleSendInvite} 
              disabled={isSending || !recipientEmail}                                   // Bloqueia se vazio ou carregando
            >
              {isSending ? 'Sending...' : 'Send Invite'}                                 {/* Feedback visual */}
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
