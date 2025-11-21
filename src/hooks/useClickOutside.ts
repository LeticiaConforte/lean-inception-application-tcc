// Importa hooks do React usados no hook personalizado
import { useEffect, useRef } from 'react';

// Declara o hook useClickOutside, que detecta cliques fora de um elemento
export function useClickOutside<T extends HTMLElement>(
  callback: () => void, // Função executada quando ocorre clique fora
  enabled = true        // Controle opcional para ativar ou desativar o hook
) {
  // Cria uma referência para o elemento alvo
  const ref = useRef<T>(null);

  // Efeito executado quando callback ou enabled mudam
  useEffect(() => {
    // Se o hook estiver desativado, não registra o event listener
    if (!enabled) return;

    // Função que será chamada sempre que ocorrer um clique no documento
    const handleClickOutside = (event: MouseEvent) => {
      // Verifica se o clique foi fora do elemento referenciado
      if (ref.current && !ref.current.contains(event.target as Node)) {
        // Executa callback fornecido pelo usuário
        callback();
      }
    };

    // Adiciona listener para detectar cliques no documento
    document.addEventListener('mousedown', handleClickOutside);

    // Remove o listener quando o hook for desmontado ou dependências mudarem
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [callback, enabled]);

  // Retorna a referência que deve ser associada ao elemento que queremos monitorar
  return ref;
}
