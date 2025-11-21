import React from 'react'                                                     // Importa o React para criar o componente
import { cn } from '@/lib/utils'                                              // Função utilitária para combinar classes CSS de forma segura

// Define os tipos aceitos pelas propriedades do StickyNote
interface StickyNoteProps {
  content: string                                                              // Texto exibido dentro do post-it
  color?: 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange'          // Paleta de cores suportadas
  size?: 'sm' | 'md' | 'lg'                                                    // Tamanho do post-it
  className?: string                                                           // Classe extra opcional
  onClick?: () => void                                                         // Callback ao clicar
  draggable?: boolean                                                          // Permite arrastar o post-it
}

// Componente funcional representando um post-it colorido
const StickyNote: React.FC<StickyNoteProps> = ({
  content,
  color = 'yellow',                                                            // Cor padrão caso nenhuma seja passada
  size = 'md',                                                                 // Tamanho padrão
  className,
  onClick,
  draggable = false                                                            // Por padrão o post-it não é arrastável
}) => {
  // Classes que definem o estilo de cada cor usando gradiente leve
  const colorClasses = {
    yellow: 'from-yellow-200 to-yellow-300 text-yellow-900',
    blue: 'from-blue-200 to-blue-300 text-blue-900',
    green: 'from-green-200 to-green-300 text-green-900',
    pink: 'from-pink-200 to-pink-300 text-pink-900',
    purple: 'from-purple-200 to-purple-300 text-purple-900',
    orange: 'from-orange-200 to-orange-300 text-orange-900'
  }

  // Classes de tamanho que ajustam largura, altura, fonte e padding
  const sizeClasses = {
    sm: 'w-20 h-20 text-xs p-2',
    md: 'w-32 h-32 text-sm p-3',
    lg: 'w-40 h-40 text-base p-4'
  }

  return (
    <div
      className={cn(
        'sticky-note',                                                         // Classe base
        colorClasses[color],                                                   // Cor selecionada
        sizeClasses[size],                                                     // Tamanho selecionado
        draggable && 'cursor-move',                                            // Muda o cursor se arrastável
        onClick && 'cursor-pointer',                                           // Cursor interativo se clicável
        className                                                               // Classes adicionais recebidas via prop
      )}
      onClick={onClick}                                                        // Dispara callback ao clicar
      draggable={draggable}                                                    // Define se pode arrastar
      onDragStart={(e) => {                                                    // Evento disparado ao começar a arrastar
        if (draggable) {
          e.dataTransfer.setData('text/plain', content)                        // Envia o conteúdo do post-it no payload do drag
        }
      }}
    >
      {/* Conteúdo centralizado vertical e horizontalmente */}
      <div className="h-full flex items-center justify-center text-center font-medium leading-tight">
        {content}                                                               {/* Exibe o texto recebido na prop */}
      </div>
    </div>
  )
}

export default StickyNote                                                      // Exporta o componente para uso externo
