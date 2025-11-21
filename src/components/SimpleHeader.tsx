import { useEffect, useState } from 'react'                               // Importa hooks de efeito e estado do React
import { Zap, ArrowLeft } from 'lucide-react'                             // Importa ícones (raio e seta para voltar)
import { useAuth } from '@/components/AuthProvider'                       // Hook de autenticação para acessar o usuário logado
import { db } from '@/integrations/firebase/client'                       // Instância do Firestore configurada na aplicação
import { doc, getDoc } from 'firebase/firestore'                          // Funções para ler documento do Firestore
import { useNavigate } from 'react-router-dom'                            // Hook para navegação entre rotas
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // Componentes de avatar (foto e fallback)

// Componente de cabeçalho simples exibido em páginas internas
const SimpleHeader = () => {
  const { user } = useAuth()                                              // Obtém o usuário autenticado do contexto
  const navigate = useNavigate()                                          // Hook para navegar no histórico de rotas
  const [userProfile, setUserProfile] = useState<any>(null)               // Estado para armazenar dados do perfil do usuário

  // Efeito para buscar o perfil sempre que o usuário mudar
  useEffect(() => {
    if (user) {                                                           // Só tenta buscar se existir usuário logado
      fetchUserProfile()
    }
  }, [user])                                                              // Dependência no usuário autenticado

  // Busca o documento de perfil do usuário no Firestore
  const fetchUserProfile = async () => {
    if (!user) return                                                     // Se não houver usuário, sai sem fazer nada
    try {
      const profileDocRef = doc(db, 'profiles', user.uid)                 // Referência ao documento de perfil do usuário
      const docSnap = await getDoc(profileDocRef)                         // Faz a leitura do documento
      if (docSnap.exists()) {                                             // Verifica se o documento foi encontrado
        setUserProfile(docSnap.data())                                    // Salva os dados do perfil no estado
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)                // Loga erro caso a leitura falhe
    }
  }

  // Gera as iniciais do nome do usuário para o AvatarFallback
  const getInitials = (name: string) => {
    if (!name) return ''                                                  // Se não houver nome, retorna string vazia
    const names = name.split(' ')                                         // Divide o nome completo em partes
    if (names.length > 1) {                                               // Se tiver pelo menos nome e sobrenome
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()  // Usa primeira letra do primeiro nome e do último sobrenome
    }
    return name.substring(0, 2).toUpperCase()                             // Se houver apenas um nome, usa as duas primeiras letras
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50"> {/* Cabeçalho fixo no topo com borda inferior */}
      <div className="container mx-auto px-4 py-4">                       {/* Container centralizado com espaçamento horizontal e vertical */}
        <div className="flex items-center justify-between">              {/* Linha principal. logo à esquerda e avatar à direita */}
          <div className="flex items-center space-x-4">                  {/* Agrupa botão de voltar e logo */}
            <button
              onClick={() => navigate(-1)}                               // Volta uma página no histórico ao clicar
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />                          {/* Ícone de seta para voltar */}
            </button>
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate('/')}                               // Ao clicar na marca, navega para a página inicial
            >
              <div className="w-10 h-10 bg-gradient-to-br from-inception-blue to-inception-purple rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />                   {/* Ícone da aplicação dentro de um quadrado com gradiente */}
              </div>
              <h1 className="text-xl font-bold text-gray-800">Lean Inception</h1> {/* Nome da aplicação */}
            </div>
          </div>

          <div className="flex items-center space-x-3">                  {/* Área do lado direito para o avatar do usuário */}
            {userProfile && (                                            // Só renderiza o avatar se existir perfil carregado
              <Avatar>
                <AvatarImage
                  src={userProfile.avatarUrl}                            // URL da foto de perfil, se existir
                  alt={userProfile.name}                                 // Texto alternativo com o nome do usuário
                />
                <AvatarFallback>
                  {getInitials(userProfile.name)}                        {/* Fallback com iniciais do nome */}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default SimpleHeader                                               // Exporta o cabeçalho simples como componente padrão
