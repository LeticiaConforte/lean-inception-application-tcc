import * as React from 'react'                                     // Importa React
import { Zap, Settings, LogOut, Camera, Shield, ArrowLeft } from 'lucide-react' // Ícones
import { useAuth } from './AuthProvider'                           // Hook de autenticação
import { useToast } from '@/hooks/use-toast'                       // Toast system
import { doc, getDoc, updateDoc } from 'firebase/firestore'        // Firestore read/update
import { db, storage } from '@/integrations/firebase/client'       // Firebase client
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage' // Upload de imagem
import { useNavigate } from 'react-router-dom'                     // Navegação
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"                             // Menu suspenso
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar" // Avatar
import { Button } from './ui/button'                               // Botão

// Props aceitas pelo Header
interface HeaderProps {
  onNavigateToHome?: () => void        // Navega para home ao clicar no logo
  onNavigateToSettings?: () => void    // Navega para settings
  showBackButton?: boolean             // Exibe botão de voltar
}

// Componente principal do Header
const Header: React.FC<HeaderProps> = ({ onNavigateToHome, onNavigateToSettings, showBackButton }) => {
  const { user, signOut, isAdmin } = useAuth()                    // Pega dados do usuário e permissões
  const { toast } = useToast()                                   // Toast
  const navigate = useNavigate()                                 // Hook de navegação
  const [userProfile, setUserProfile] = React.useState<any>(null) // Perfil do usuário salvo no Firestore
  const fileInputRef = React.useRef<HTMLInputElement>(null)       // Input oculto para upload de foto
  const [isUploading, setIsUploading] = React.useState(false)     // Estado de upload

  // Busca perfil no Firestore
  const fetchUserProfile = React.useCallback(async () => {
    if (!user) return

    try {
      const profileRef = doc(db, 'profiles', user.uid)            // Referência ao documento do perfil
      const profileSnap = await getDoc(profileRef)                // Busca o documento

      if (profileSnap.exists()) {
        setUserProfile(profileSnap.data())                        // Salva dados do perfil
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }, [user])

  // Executa busca do perfil ao carregar usuário
  React.useEffect(() => {
    if (user) {
      fetchUserProfile()
    }
  }, [user, fetchUserProfile])

  // Logout do usuário
  const handleSignOut = async () => {
    try {
      await signOut()
      toast({ title: "Signed out", description: "You've been successfully signed out." })
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error signing out.",
        variant: "destructive"
      })
    }
  }

  // Clica no botão para trocar foto → ativa input file oculto
  const handlePhotoChangeClick = () => {
    fileInputRef.current?.click()
  }

  // Upload de foto de perfil
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setIsUploading(true)
    toast({ title: "Uploading...", description: "Your new photo is being uploaded." })

    try {
      // Caminho no Storage
      const storageRef = ref(storage, `profile_pictures/${user.uid}`)
      await uploadBytes(storageRef, file)                         // Faz upload
      const photoURL = await getDownloadURL(storageRef)           // Obtém URL

      const profileRef = doc(db, 'profiles', user.uid)
      await updateDoc(profileRef, { photo_url: photoURL })        // Atualiza Firestore

      setUserProfile((prev: any) => ({ ...prev, photo_url: photoURL }))
      toast({ title: "Success!", description: "Your profile photo has been updated." })
    } catch (error) {
      console.error("Error uploading photo:", error)
      toast({
        title: "Upload Error",
        description: "Failed to update your photo.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Gera iniciais caso o usuário não tenha foto
  const getInitials = (name: string) => {
    const names = name.split(' ')
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return names[0].substring(0, 2).toUpperCase()
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">

          {/* Lado esquerdo (back + logo) */}
          <div className="flex items-center space-x-2">

            {/* Botão de voltar se habilitado */}
            {showBackButton && (
              <Button onClick={() => navigate(-1)} variant="ghost" size="icon" aria-label="Go back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            {/* Logo + ação de navegar para home */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={onNavigateToHome}>
              <div className="w-10 h-10 bg-gradient-to-br from-inception-blue to-inception-purple rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>

              <h1 className="text-xl font-bold text-gray-800">Lean Inception</h1>
            </div>
          </div>

          {/* Lado direito (avatar + menu) */}
          <div className="flex items-center space-x-4">
            {user && userProfile && (
              <DropdownMenu>

                {/* Avatar que abre menu */}
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 focus:outline-none">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={userProfile.photo_url} alt={userProfile.name} />
                      <AvatarFallback>{getInitials(userProfile.name || '')}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                {/* Conteúdo do menu */}
                <DropdownMenuContent align="end" className="w-56">

                  {/* Dados do usuário */}
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userProfile.email}</p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {/* Acesso ao painel admin, se permitido */}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Painel</span>
                    </DropdownMenuItem>
                  )}

                  {/* Trocar foto */}
                  <DropdownMenuItem onClick={handlePhotoChangeClick} disabled={isUploading}>
                    <Camera className="mr-2 h-4 w-4" />
                    <span>{isUploading ? 'Uploading...' : 'Change Photo'}</span>
                  </DropdownMenuItem>

                  {/* Configurações */}
                  {onNavigateToSettings && (
                    <DropdownMenuItem onClick={onNavigateToSettings}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  {/* Logout */}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Input oculto para upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg"
      />
    </header>
  )
}

export default Header
