import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
// Importa todos os componentes do Radix Collapsible.
// O Radix fornece UI primitives acessíveis como Root, Trigger e Content.

// ============================================================================
// Reexportação dos componentes principais do Collapsible
// ============================================================================

const Collapsible = CollapsiblePrimitive.Root
// Root → componente que controla o estado aberto/fechado do colapsável

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger
// Trigger → botão/elemento que alterna o estado (abre/fecha)

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent
// Content → área que expande/colapsa com animação automática do Radix

// Exporta os três componentes para uso externo
export { Collapsible, CollapsibleTrigger, CollapsibleContent }
