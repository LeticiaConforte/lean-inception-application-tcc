import * as React from "react" // Importa o React para usar hooks e criação de componentes
import * as AccordionPrimitive from "@radix-ui/react-accordion" // Importa os componentes primitivos de Accordion do Radix UI
import { ChevronDown } from "lucide-react" // Ícone usado para indicar abrir/fechar o accordion

import { cn } from "@/lib/utils" // Função utilitária para concatenar classes de forma condicional

const Accordion = AccordionPrimitive.Root // Exporta diretamente o componente Root do accordion do Radix

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>, // Define o tipo da ref baseado no Item primitivo do Radix
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> // Define as props aceitas pelo componente
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref} // Encaminha a ref para o item raiz do accordion
    className={cn("border-b", className)} // Adiciona uma borda inferior e permite passar classes adicionais
    {...props} // Repasse de todas as propriedades restantes
  />
))
AccordionItem.displayName = "AccordionItem" // Define um nome amigável para o componente no React DevTools

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>, // Tipagem da ref baseada no Trigger do Radix
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> // Prop types herdando do Trigger
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex"> {/* Wrapper obrigatório do Radix. serve como container do Trigger */}
    <AccordionPrimitive.Trigger
      ref={ref} // Ref encaminhada ao Trigger real
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180", 
        // flex: estrutura do elemento
        // flex-1: ocupa todo o espaço disponível
        // justify-between: texto à esquerda, ícone à direita
        // hover:underline: sublinha ao passar o mouse
        // regra usando data-state=open: rotaciona o ícone quando o accordion está aberto
        className
      )}
      {...props} // Repasse de props
    >
      {children} // Conteúdo do gatilho do accordion (título da seção)
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" /> 
      {/* Ícone que vira ao abrir. shrink-0 evita deformações */}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName // Mantém o nome original do Trigger

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>, // Tipagem da ref para o Content do Radix
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> // Props herdadas do Content
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref} // Ref aplicada no container da área de conteúdo
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" 
    // overflow-hidden: esconde conteúdo durante animação
    // text-sm: tamanho padrão do texto
    // animações definidas via tailwind: accordion-up/down baseadas no state
    {...props} // Repasse de propriedades adicionais
  >
    <div className={cn("pb-4 pt-0", className)}> {/* Conteúdo interno com padding ajustado */}
      {children} {/* Insere o conteúdo real passado entre as tags do AccordionContent */}
    </div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName // Mantém nome útil para debugging

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } // Exporta todos os componentes customizados
