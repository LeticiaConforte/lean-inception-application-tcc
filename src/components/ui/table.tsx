import * as React from "react"
// Importa React e tipos para refs e componentes

import { cn } from "@/lib/utils"
// Função utilitária para combinar classes condicionalmente

// ============================================================================
// Table — wrapper de <table> com scroll responsivo
// ============================================================================
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    {/* Wrapper para permitir scroll horizontal quando a tabela estoura a largura */}
    <table
      ref={ref} // conecta o ref ao elemento <table>
      className={cn("w-full caption-bottom text-sm", className)}
      // w-full: tabela ocupa toda a largura
      // caption-bottom: legenda fica abaixo da tabela
      // text-sm: fonte padrão pequena
      {...props} // permite passar atributos normais de tabela
    />
  </div>
))
Table.displayName = "Table"

// ============================================================================
// TableHeader — wrapper para <thead>
// ============================================================================
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("[&_tr]:border-b", className)}
    // Adiciona borda inferior em todas as linhas do thead
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

// ============================================================================
// TableBody — wrapper para <tbody>
// ============================================================================
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    // Remove borda inferior da última linha do corpo
    {...props}
  />
))
TableBody.displayName = "TableBody"

// ============================================================================
// TableFooter — wrapper para <tfoot>
// ============================================================================
const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    // border-t: separa visualmente do corpo
    // bg-muted/50: leve fundo diferenciado
    // font-medium: texto mais destacado
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

// ============================================================================
// TableRow — wrapper para <tr> com hover e estado selected
// ============================================================================
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    // hover:bg-muted/50: efeito de destaque ao passar o mouse
    // data-[state=selected]:bg-muted: permite seleção de linha
    {...props}
  />
))
TableRow.displayName = "TableRow"

// ============================================================================
// TableHead — wrapper para <th>
// ============================================================================
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    // h-12: altura padrão
    // text-muted-foreground: cabeçalho com cor mais suave
    // &:has(checkbox) ajusta padding quando há checkboxes na célula
    {...props}
  />
))
TableHead.displayName = "TableHead"

// ============================================================================
// TableCell — wrapper para <td>
// ============================================================================
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0",
      className
    )}
    // p-4: padding padrão
    // align-middle: centraliza verticalmente
    {...props}
  />
))
TableCell.displayName = "TableCell"

// ============================================================================
// TableCaption — wrapper para <caption>
// ============================================================================
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    // Caption discreto para descrever a tabela
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// ============================================================================
// Exportação dos componentes
// ============================================================================
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
