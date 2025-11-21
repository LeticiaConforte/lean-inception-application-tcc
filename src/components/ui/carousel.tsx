import * as React from "react"
// Importa React para hooks, forwardRef e JSX

import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
// Hook principal da biblioteca Embla para criar um carrossel controlável

import { ArrowLeft, ArrowRight } from "lucide-react"
// Ícones usados nos botões de navegação

import { cn } from "@/lib/utils"
// Função utilitária para combinar classes condicionalmente

import { Button } from "@/components/ui/button"
// Botão base da UI para estilizar os controles do carrossel

// ============================================================================
// Tipagens extraídas do próprio embla-carousel-react
// ============================================================================
type CarouselApi = UseEmblaCarouselType[1]
// O segundo item retornado pelo hook é a API do carrossel

type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
// Recupera os tipos dos parâmetros do hook original

type CarouselOptions = UseCarouselParameters[0]
// Opções de configuração do Embla

type CarouselPlugin = UseCarouselParameters[1]
// Plugins opcionais para o carrossel

// ============================================================================
// Props aceitas pelo componente <Carousel />
// ============================================================================
type CarouselProps = {
  opts?: CarouselOptions            // Opções do Embla
  plugins?: CarouselPlugin          // Plugins opcionais
  orientation?: "horizontal" | "vertical" // Orientação do carrossel
  setApi?: (api: CarouselApi) => void     // Callback externo para expor a API
}

// ============================================================================
// Tipagem compartilhada no contexto do carrossel
// ============================================================================
type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0] // Ref para o container do Embla
  api: ReturnType<typeof useEmblaCarousel>[1]         // Instância da API Embla
  scrollPrev: () => void                              // Função para avançar para trás
  scrollNext: () => void                              // Função para avançar para frente
  canScrollPrev: boolean                              // Indica se pode voltar
  canScrollNext: boolean                              // Indica se pode avançar
} & CarouselProps

// Criação do contexto global do carrossel
const CarouselContext = React.createContext<CarouselContextProps | null>(null)

// Hook externo para acessar o contexto
function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }
  return context
}

// ============================================================================
// Componente principal <Carousel />
// ============================================================================
const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",   // Orientação padrão
      opts,                         // Opções do Embla
      setApi,                       // Exposição da API
      plugins,                      // Plugins
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Inicializa Embla com opções + eixo baseado na orientação
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )

    // Estado para controlar se botões estão habilitados
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    // Callback chamado quando seleção muda
    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) return
      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    // Suporte ao teclado ← →
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    // Exposição da API via callback setApi
    React.useEffect(() => {
      if (!api || !setApi) return
      setApi(api)
    }, [api, setApi])

    // Atualiza botões e listeners
    React.useEffect(() => {
      if (!api) return

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

// ============================================================================
// Container interno do carrossel (onde os slides ficam)
// ============================================================================
const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          // Horizontal → slides lado a lado
          // Vertical → slides empilhados
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

// ============================================================================
// Cada item (slide) do carrossel
// ============================================================================
const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

// ============================================================================
// Botão de voltar
// ============================================================================
const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}       // Mantém estilo padrão outline
      size={size}             // Ícone redondo
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

// ============================================================================
// Botão de avançar
// ============================================================================
const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

// ============================================================================
// Exportação dos componentes do carrossel
// ============================================================================
export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
