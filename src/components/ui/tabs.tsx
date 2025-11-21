import * as React from "react"
// Importa React e tipos para refs e propriedades

import * as TabsPrimitive from "@radix-ui/react-tabs"
// Importa a implementação dos Tabs do Radix UI

import { cn } from "@/lib/utils"
// Função utilitária para mesclar classes condicionalmente

// ============================================================================
// Tabs — componente raiz que controla estado e lógica das abas
// ============================================================================
const Tabs = TabsPrimitive.Root
// Apenas reexporta o Root do Radix, que gerencia seleção de abas

// ============================================================================
// TabsList — container que agrupa os botões das abas
// ============================================================================
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref} // ref encaminhado para o Radix
    className={cn(
      // Estilos básicos para o container das abas
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      // inline-flex: mantém elementos lado a lado
      // h-10: altura padrão
      // rounded-md: bordas arredondadas
      // bg-muted: fundo suave
      // p-1: padding interno
      // text-muted-foreground: cor de texto menos intensa
      className
    )}
    {...props} // permite props extras
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

// ============================================================================
// TabsTrigger — botão que representa cada aba
// ============================================================================
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Layout e estilização do botão
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all",
      // inline-flex: alinhamento do conteúdo
      // whitespace-nowrap: impede quebra de linha no texto
      // px-3 py-1.5: padding horizontal e vertical
      // text-sm: fonte menor
      // font-medium: peso intermediário
      // transition-all: animações suaves

      // Acessibilidade e foco
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",

      // Estados desabilitados
      "disabled:pointer-events-none disabled:opacity-50",

      // Estado ativo da aba (Radix adiciona data-state="active")
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",

      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

// ============================================================================
// TabsContent — conteúdo exibido quando a aba está ativa
// ============================================================================
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      // Espaçamento e foco
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      // mt-2: espaço acima do conteúdo
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// ============================================================================
// Exportação dos componentes
// ============================================================================
export { Tabs, TabsList, TabsTrigger, TabsContent }
