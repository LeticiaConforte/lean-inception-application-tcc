// Importa todas as funcionalidades do React para uso no hook
import * as React from "react"

// Define o breakpoint móvel usado pela aplicação (em pixels)
const MOBILE_BREAKPOINT = 768

// Hook personalizado que identifica se a tela atual é considerada "mobile"
export function useIsMobile() {
  // Estado que indica se a largura atual é mobile (inicia como indefinido)
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  // Efeito que roda apenas uma vez ao montar o componente
  React.useEffect(() => {
    // Cria um MediaQueryList que observa mudanças no tamanho da janela
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    // Função chamada sempre que o tamanho da tela mudar
    const onChange = () => {
      // Atualiza o estado baseado na largura real da janela
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Adiciona listener para capturar mudanças de tamanho no browser
    mql.addEventListener("change", onChange)

    // Define o estado inicial assim que o hook é montado
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // Remove o listener quando o componente é desmontado
    return () => mql.removeEventListener("change", onChange)
  }, []) // Array vazio → executa apenas no primeiro render

  // Retorna o valor final como booleano
  return !!isMobile
}
