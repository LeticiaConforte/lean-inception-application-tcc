import * as React from "react"
// Importa React para hooks, tipos e JSX

import * as RechartsPrimitive from "recharts"
// Importa todos os componentes do Recharts como um namespace

import { cn } from "@/lib/utils"
// Função utilitária para combinar classes condicionalmente

// Format: { THEME_NAME: CSS_SELECTOR }
// Mapeia o nome do tema para o seletor CSS que será usado no <style>
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  // Objeto de configuração indexado por string. Ex. "sales", "revenue"
  [k in string]: {
    label?: React.ReactNode          // Rótulo para usar em tooltip e legenda
    icon?: React.ComponentType       // Ícone opcional a exibir na legenda ou tooltip
  } & (
    // Ou define cor diretamente
    | { color?: string; theme?: never }
    // Ou define cores por tema usando THEMES
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

// Propriedades presentes no contexto do gráfico
type ChartContextProps = {
  config: ChartConfig
}

// Cria contexto para compartilhar configuração de gráfico entre componentes filhos
const ChartContext = React.createContext<ChartContextProps | null>(null)

// Hook para consumir o contexto do gráfico
function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    // Garante que o hook só pode ser usado dentro de <ChartContainer />
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

// Container principal que envolve um ResponsiveContainer do Recharts
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    // children deve ser o render prop esperado pelo ResponsiveContainer
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  // Gera ID único baseado no hook do React
  const uniqueId = React.useId()
  // Normaliza o ID do gráfico. Remove ":" pois não são válidos em data attributes
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    // Disponibiliza config via contexto para tooltip, legend etc
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId} // Data attribute usado no <style> para escopo das CSS vars
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          // Estilos utilitários para aplicar aparência padrão aos elementos do Recharts
          className
        )}
        {...props}
      >
        {/* Injeta CSS dinâmico para variáveis de cor do gráfico */}
        <ChartStyle id={chartId} config={config} />
        {/* Container responsivo do Recharts que renderiza o gráfico filho */}
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

// Componente que injeta um <style> com variáveis de cor baseadas no tema e config
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  // Filtra apenas as chaves que possuem theme ou color definido
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  // Se não há cores configuradas, não injeta nada
  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        // Gera CSS para cada tema (light, dark)
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    // Define a cor. Dá prioridade ao theme específico se existir. Senão usa color
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    // Para cada série, define uma CSS var do tipo --color-{key}
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

// Reexports diretos de componentes primitivos do Recharts
const ChartTooltip = RechartsPrimitive.Tooltip

// Tooltip customizado com suporte a config, labels, indicadores e formatação
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean           // Oculta label principal
      hideIndicator?: boolean       // Oculta marcador visual (linha, ponto etc)
      indicator?: "line" | "dot" | "dashed" // Tipo de indicador
      nameKey?: string              // Campo a usar como chave para o nome
      labelKey?: string             // Campo a usar para buscar label no payload
    }
>(
  (
    {
      active,               // Indica se tooltip está ativa
      payload,              // Dados da tooltip (séries no ponto atual)
      className,
      indicator = "dot",    // Tipo padrão do marcador
      hideLabel = false,
      hideIndicator = false,
      label,                // Label padrão do Recharts
      labelFormatter,       // Função custom para formatar label
      labelClassName,
      formatter,            // Função custom para formatar valor
      color,                // Cor opcional global do indicador
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    // Calcula o label exibido na parte superior da tooltip
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      // Pega o primeiro item como base
      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)

      // Se não tiver labelKey, tenta usar config[label] se label for string
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      // Se foi passada labelFormatter. usa ela
      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      // Se não houver valor para o label, não renderiza
      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    // Se tooltip não está ativa ou sem payload. não mostra nada
    if (!active || !payload?.length) {
      return null
    }

    // Se há apenas uma série e o indicador não é "dot". aninha o label dentro do item
    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {/* Se não for nested. mostra o label no topo */}
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)

            // Cor do indicador. pode vir do prop color, do payload.fill ou item.color
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {/* Se houver formatter custom. deixa o caller renderizar tudo */}
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {/* Se houver ícone configurado. usa ele. se não. mostra um quadradinho indicador */}
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {/* Quando nested. label fica junto do item */}
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

// Reexporta Legend do Recharts
const ChartLegend = RechartsPrimitive.Legend

// Componente customizado para conteúdo da legenda
const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean  // Oculta ícone e exibe só label
      nameKey?: string    // Campo opcional para buscar key no payload
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    // Se não houver payload. não renderiza legenda
    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {/* Se há ícone definido e não está escondido. mostra ele. caso contrário. mostra quadradinho colorido */}
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper para descobrir a config correta com base no payload e key
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  // Se payload não é objeto. não há o que fazer
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  // Tenta extrair campo payload interno (Recharts costuma embutir dados em payload.payload)
  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  // Primeiro tenta usar payload[key] se for string
  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    // Se não. tenta em payload.payload[key]
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  // Se encontrou a key exatamente na config. retorna ela
  // Caso contrário. tenta usar a key original
  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

// Exporta todos os helpers e componentes relacionados ao gráfico
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
