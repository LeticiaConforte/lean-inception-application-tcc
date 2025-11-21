import * as React from "react"
// Importa React e tipos necessários

import { OTPInput, OTPInputContext } from "input-otp"
// Biblioteca externa especializada para inputs de código OTP

import { Dot } from "lucide-react"
// Ícone usado como separador visual

import { cn } from "@/lib/utils"
// Função utilitária para combinar classes CSS

// ============================================================================
// InputOTP — componente principal que encapsula o OTPInput
// ============================================================================
const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    // Estilo aplicado ao container externo dos slots
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    // Estilo aplicado ao input invisível usado pela lib
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

// ============================================================================
// InputOTPGroup — agrupa slots quando necessário
// ============================================================================
const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

// ============================================================================
// InputOTPSlot — representa cada "caixinha" individual do OTP
// ============================================================================
const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  // A lib fornece o contexto com o estado de cada slot

  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]
  // Recupera o caractere digitado, cursor fake e estado ativo do slot atual

  return (
    <div
      ref={ref}
      className={cn(
        // Base: slot quadrado com bordas
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        // Quando o slot está ativo: aplica foco visível
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      {...props}
    >
      {/* Exibe o caractere do usuário */}
      {char}

      {/* Fake caret: piscando quando o slot está ativo mas vazio */}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

// ============================================================================
// InputOTPSeparator — item para separar grupos de slots (ex: 3-3)
// ============================================================================
const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
    {/* Ícone simples entre grupos */}
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

// ============================================================================
// Exportação dos componentes
// ============================================================================
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
