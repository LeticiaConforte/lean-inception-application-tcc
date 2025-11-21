// Importa o hook personalizado useToast e a função toast do diretório de hooks
import { useToast, toast } from "@/hooks/use-toast"

// Reexporta ambos, permitindo que outros módulos importem a partir deste arquivo
// Isso facilita criar um ponto único de exportação para toasts na aplicação
export { useToast, toast }
