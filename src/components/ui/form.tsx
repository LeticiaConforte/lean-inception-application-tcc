import * as React from "react"
// Importa React e suas tipagens

import * as LabelPrimitive from "@radix-ui/react-label"
// Primitiva de Label do Radix UI

import { Slot } from "@radix-ui/react-slot"
// Slot permite delegar refs/props para filhos dinamicamente

import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"
// React Hook Form: componentes e hooks para controlar formulários

import { cn } from "@/lib/utils"
// Utilitário para merge de classes

import { Label } from "@/components/ui/label"
// Componente Label estilizado (baseado no Radix)

// ============================================================================
// Form — wrapper do React Hook Form
// ============================================================================
const Form = FormProvider
// Expõe FormProvider diretamente como <Form>

// ============================================================================
// Contexto do campo individual
// ============================================================================
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName // nome do campo controlado
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)
// Contexto usado para que filhos saibam qual campo está ativo

// ============================================================================
// FormField — empacota Controller + contexto próprio
// ============================================================================
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      {/* Registra este campo no contexto */}
      <Controller {...props} />
      {/* Controller do React Hook Form: controla valor e eventos */}
    </FormFieldContext.Provider>
  )
}

// ============================================================================
// useFormField — hook para acessar dados do campo atual
// ============================================================================
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)
  // Retorna estado do campo (erro, touched, etc.)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`, // id do container
    formDescriptionId: `${id}-form-item-description`, // id da descrição
    formMessageId: `${id}-form-item-message`, // id da mensagem de erro
    ...fieldState, // inclui erro, touched, etc.
  }
}

// ============================================================================
// Contexto do <FormItem> — organiza IDs e acessibilidade
// ============================================================================
type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

// ============================================================================
// FormItem — wrapper com espaçamento e ID único
// ============================================================================
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId() // gera um ID único

  return (
    <FormItemContext.Provider value={{ id }}>
      {/* Fornece ID para os elementos filhos (Label, Control, Message...) */}
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

// ============================================================================
// FormLabel — estiliza o Label conforme existe erro ou não
// ============================================================================
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      htmlFor={formItemId}
      className={cn(error && "text-destructive", className)}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

// ============================================================================
// FormControl — envolve inputs e injeta atributos de acessibilidade
// ============================================================================
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}` // apenas descrição
          : `${formDescriptionId} ${formMessageId}` // descrição + erro
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

// ============================================================================
// FormDescription — texto auxiliar abaixo do controle
// ============================================================================
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

// ============================================================================
// FormMessage — exibe mensagem de erro quando existir
// ============================================================================
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()

  const body = error ? String(error?.message) : children
  // Se houver erro, sempre mostra a mensagem do erro

  if (!body) return null // se não tem conteúdo, não renderiza nada

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

// ============================================================================
// Exportação
// ============================================================================
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
