// Importa React e hooks necessários para estados e efeitos colaterais
import React, { useState, useEffect } from 'react';
// Importa o componente de botão da UI
import { Button } from '@/components/ui/button';
// Importa o componente de campo de entrada
import { Input } from '@/components/ui/input';
// Importa o componente de label
import { Label } from '@/components/ui/label';
// Importa ícones da biblioteca lucide-react
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';
// Importa hook de toast customizado
import { useToast } from '@/hooks/use-toast';
// Importa navegação para redirecionamento
import { useNavigate } from 'react-router-dom';
// Importa funções de autenticação do Firebase
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
// Importa instâncias de autenticação e banco do Firebase
import { auth, db } from '@/integrations/firebase/client';
// Importa contexto de autenticação da aplicação
import { useAuth } from '@/components/AuthProvider';
// Importa funções para criar documentos no Firestore
import { doc, setDoc } from 'firebase/firestore';

// Declara o componente principal de autenticação
const Auth = () => {
  // Estado para alternar entre login e cadastro
  const [isLogin, setIsLogin] = useState(true);
  // Estado para armazenar email digitado
  const [email, setEmail] = useState('');
  // Estado para senha
  const [password, setPassword] = useState('');
  // Estado para confirmação de senha (cadastro)
  const [confirmPassword, setConfirmPassword] = useState('');
  // Estado para nome completo (cadastro)
  const [fullName, setFullName] = useState('');
  // Estado de loading para evitar múltiplos envios
  const [loading, setLoading] = useState(false);
  // Hook para exibir toasts
  const { toast } = useToast();
  // Instância do hook de navegação
  const navigate = useNavigate();
  // Recupera usuário autenticado do contexto
  const { user } = useAuth();

  // Redireciona automaticamente caso o usuário já esteja logado
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Função chamada ao enviar o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita recarregar a página
    setLoading(true); // Ativa loading

    try {
      // Se for login
      if (isLogin) {
        // Tenta autenticar com email e senha
        await signInWithEmailAndPassword(auth, email, password);
        // Exibe mensagem de sucesso
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        // Redireciona para a página inicial
        navigate('/');
      } 
      // Se for cadastro
      else {
        // Valida senhas iguais
        if (password !== confirmPassword) {
          throw new Error("Passwords don't match");
        }

        // Cria usuário no Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Se a criação deu certo
        if (userCredential.user) {
          // Atualiza o nome do usuário no perfil do Firebase
          await updateProfile(userCredential.user, { displayName: fullName });

          // Cria um documento de perfil no Firestore
          const userDocRef = doc(db, 'profiles', userCredential.user.uid);
          await setDoc(userDocRef, {
            email: userCredential.user.email,
            displayName: fullName,
            uid: userCredential.user.uid,
            workspace_ids: [],
            created_at: new Date(),
          });
          
          // Exibe toast de sucesso
          toast({
            title: "Account created!",
            description: "Welcome to LeanCanvas Inception Workshop.",
          });

          // Redireciona para a home
          navigate('/');
        }
      }
    } catch (error: any) {
      // Caso credencial seja inválida
      if (error.code === 'auth/invalid-credential') {
        toast({
          title: "Error",
          description: "E-mail ou Senha incorretos",
          variant: "destructive",
        });
      } 
      // Outros erros
      else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      // Desativa loading
      setLoading(false);
    }
  };

  // JSX da página
  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo — formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo e texto superior */}
          <div className="text-center">
            {/* Ícone redondo colorido */}
            <div className="w-16 h-16 bg-gradient-to-br from-inception-blue to-inception-purple rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            {/* Nome da aplicação */}
            <h1 className="text-3xl font-bold text-gray-900">LeanCanvas</h1>
            {/* Subtítulo dinâmico */}
            <p className="text-gray-600 mt-2">
              {isLogin ? 'Welcome back to your workshop' : 'Start your inception journey'}
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo nome completo — só aparece no cadastro */}
            {!isLogin && (
              <div>
                <Label htmlFor="fullName" className="text-gray-700">Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Campo email */}
            <div>
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Campo senha */}
            <div>
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Confirmar senha — só aparece no cadastro */}
            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Confirm your password"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Botão enviar */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-inception-blue to-inception-purple hover:from-inception-blue/90 hover:to-inception-purple/90 text-white font-medium py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Alternar entre login e cadastro */}
          <div className="text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  // Alterna o modo
                  setIsLogin(!isLogin);
                  // Limpa campos
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setFullName('');
                }}
                className="text-inception-blue hover:text-inception-purple font-medium transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Lado direito — área visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-inception-blue via-inception-purple to-inception-yellow relative overflow-hidden">
        {/* Camada de escurecimento */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Conteúdo principal */}
        <div className="relative z-10 flex items-center justify-center p-12 text-white">
          <div className="text-center max-w-lg">
            {/* Título dinâmico */}
            <h2 className="text-4xl font-bold mb-6">
              {isLogin ? 'Welcome Back!' : 'Join Our Community'}
            </h2>

            {/* Subtítulo dinâmico */}
            <p className="text-xl opacity-90 mb-8">
              {isLogin 
                ? 'Continue your lean inception journey and create amazing products with your team.'
                : 'Start your lean inception workshop and transform ideas into successful products.'
              }
            </p>

            {/* Benefícios — lado direito */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-2">Interactive Canvas</h3>
                <p className="opacity-80">Collaborate in real-time with your team</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-2">Ready Templates</h3>
                <p className="opacity-80">Start with proven frameworks</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Elementos decorativos animados */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/10 rounded-full animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};

// Exporta o componente
export default Auth;
