// Importa a classe principal do jsPDF para criação de PDFs
// src/utils/workshopPdf.ts
import jsPDF from 'jspdf';
// Importa o plugin jspdf-autotable para criação de tabelas
import autoTable from 'jspdf-autotable';

/* =========================================================
 * Tipos
 * ========================================================= */
// Interface que representa um template individual do workshop
export interface ReportTemplate { name: string; step: number; content: any; }

// Estrutura principal com os dados do relatório do workshop
export interface WorkshopReport {
  title: string;          // Título do relatório
  workshop: string;       // Nome do workshop
  templates: ReportTemplate[]; // Lista de templates incluídos no relatório

  // Campos opcionais de metadados
  status?: string | null;
  steps?: string | null;
  generatedAt?: string | null;
  participants?: string[] | string | null;
}

// Opções gerais para geração do relatório
export interface ReportOptions { brandName: string; }

// Contexto de desenho usado nas funções de renderização
type Ctx = { pdf: jsPDF; y: number; options: ReportOptions; workshopName: string; };

// Configuração da grid de post-its
type GridOptions = { cols?: number; padding?: number; minH?: number; };

// Nível de confiança usado nos cartões de review
type Conf = 'high'|'medium'|'low'|'';

// Estrutura de tag usada nas waves do Sequencer (ex. MVP, Increment)
type WaveTag = { label: string; color?: string };

/* =========================================================
 * Estilo e Layout
 * ========================================================= */
// Paleta de cores usada no PDF
const COLORS = {
  PRIMARY_TEXT: '#1E3A8A',
  PRIMARY_BAR: '#111827',
  SECONDARY: '#4B5563',
  BORDER: '#D1D5DB',
  NOTE_TEXT: '#1F2937',
  SECTION_TITLE_TEXT: '#FFFFFF',
};

// Constantes de margem, tamanho de página e fonte padrão
const MARGIN = 15, PAGE_W = 210, PAGE_H = 297, FONT = 'Helvetica';

// Mapeamento de classes Tailwind (bg-*) para equivalentes em hexadecimal
const tailwindToHex: Record<string,string> = {
  'bg-yellow-50':'#FEFCE8','bg-yellow-100':'#FEF9C3','bg-yellow-200':'#FEF08A','bg-yellow-300':'#FDE047','bg-yellow-400':'#FACC15','bg-yellow-500':'#EAB308',
  'bg-rose-200':'#FECDD3','bg-pink-200':'#FBCFE8','bg-green-100':'#DCFCE7','bg-green-200':'#BBF7D0',
  'bg-blue-100':'#DBEAFE','bg-blue-200':'#BFDBFE','bg-indigo-200':'#C7D2FE','bg-purple-200':'#E9D5FF',
  'bg-red-100':'#FEE2E2','bg-gray-100':'#F3F4F6','bg-gray-200':'#E5E7EB','bg-orange-200':'#FED7AA',

  // versões comuns com opacidade (mapeadas para sólido equivalente)
  'bg-yellow-200/60':'#FEF08A','bg-pink-200/60':'#FBCFE8','bg-blue-200/60':'#BFDBFE',
  'bg-green-200/60':'#BBF7D0','bg-purple-200/60':'#E9D5FF','bg-orange-200/60':'#FED7AA'
};

/* =========================================================
 * Helpers de cor
 * ========================================================= */
// Expressão regular para validar strings em formato HEX
const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/** Converte tailwind (com ou sem /opacidade) ou hex para hex */
// Normaliza uma cor em string (tailwind ou hex) para formato hex, usando fallback se necessário
function toHex(color: any, fallback: string): string {
  if (color == null) return fallback;
  const s = String(color).trim();
  if (!s) return fallback;
  if (HEX_RE.test(s)) return s;
  const base = s.replace(/\s+/g, '').replace(/\/\d{1,3}$/, '');
  return tailwindToHex[base] || fallback;
}

/** Cor específica do objeto (bg-*) */
// Tenta encontrar a cor mais apropriada em diferentes propriedades do objeto de feature
function featureColorHex(f: any, fallback = '#F3F4F6'): string {
  const c =
    f?.color ??
    f?.bg ??
    f?.bgColor ??
    f?.postitColor ??
    f?.card?.color ??
    f?.meta?.color ??
    '';
  return toHex(c, fallback);
}

/* =========================================================
 * Utils
 * ========================================================= */
// Alias para padronizar nomes de templates no relatório
const ALIASES: Record<string, string> = {
  'Technical Review': 'Technical, Business and UX Review',
  'Product Is/Is Not': 'The Product IS - IS NOT - DOES - DOES NOT',
  'Feature Sequencer': 'Sequencer',
};

// Normaliza o nome do template de acordo com o dicionário de aliases
const normalizeName = (n: string): string => ALIASES[n] || n;

// Converte valores indefinidos ou nulos em string vazia
const sanitize = (x: any): string => (x === null || typeof x === 'undefined') ? '' : String(x);

/** Normaliza símbolos: &e, &hearts;, ♥ -> <3 */
// Substitui alguns símbolos especiais por uma representação amigável
const normalizeSymbols = (s: string): string =>
  sanitize(s).replace(/(&e|&hearts;|♥)/gi, '<3');

/* -------- Confiança -------- */
// Converte um valor genérico de confiança em um Conf ('high', 'medium', 'low' ou '')
function parseConfidence(raw: any): Conf {
  const v = (typeof raw === 'object' && raw) ? (raw.value ?? raw.level ?? raw.name ?? raw.confidence ?? '') : raw;
  if (v === null || v === undefined) return '';
  const n = Number(v);
  if (!Number.isNaN(n)) { if (n >= 3) return 'high'; if (n >= 2) return 'medium'; if (n >= 1) return 'low'; }
  const s = String(v).toLowerCase().trim();
  if (/(^alta?$|^alto$|^high$|^h$)/i.test(s))   return 'high';
  if (/(^m[eé]dia$|^medium$|^m$)/i.test(s))     return 'medium';
  if (/(^baixa?$|^low$|^l$)/i.test(s))          return 'low';
  if (/^green$/.test(s))  return 'high';
  if (/^yellow$/.test(s)) return 'medium';
  if (/^red$/.test(s))    return 'low';
  return '';
}

// Busca o nível de confiança em múltiplos campos possíveis do objeto de feature
function getConfidence(f: any): Conf {
  return (
    parseConfidence(f?.confidence) ||
    parseConfidence(f?.confidenceLevel) ||
    parseConfidence(f?.review?.confidence) ||
    parseConfidence(f?.meta?.confidence) ||
    ''
  );
}

/* =========================================================
 * Texto / Estrutura
 * ========================================================= */
// Desenha um bloco de texto centralizado em formato de callout e avança o cursor vertical
function centeredCallout(ctx: Ctx, text: string, maxWidthMm: number = PAGE_W - 2 * MARGIN) {
  const width = Math.max(80, Math.min(maxWidthMm, PAGE_W - 2 * MARGIN));
  const lines = ctx.pdf.splitTextToSize(text, width) as string[];
  ctx.pdf.setFont(FONT, 'bold').setFontSize(11).setTextColor(COLORS.NOTE_TEXT);
  lines.forEach((ln, i) => ctx.pdf.text(ln, PAGE_W / 2, ctx.y + i * 5, { align: 'center' }));
  ctx.y += lines.length * 5 + 4;
}

// Renderiza uma lista de passos, um abaixo do outro, respeitando o limite de largura
function renderSteps(ctx: Ctx, steps: string[]) {
  ctx.pdf.setFont(FONT,'normal').setFontSize(9).setTextColor(COLORS.NOTE_TEXT);
  steps.forEach((s: string) => {
    const lines = ctx.pdf.splitTextToSize(s, PAGE_W - 2*MARGIN) as string[];
    ctx.pdf.text(lines, MARGIN, ctx.y);
    ctx.y += lines.length * 5;
  });
  ctx.y += 6;
}

/* =========================================================
 * Header / Footer
 * ========================================================= */
// Desenha o cabeçalho padrão em cada página
function drawHeader(ctx: Ctx) {
  ctx.y = 28;
  ctx.pdf.setFontSize(9).setTextColor(COLORS.SECONDARY).text(ctx.workshopName || 'Workshop Report', MARGIN, 14);
  ctx.pdf.text(new Date().toLocaleDateString('pt-BR'), PAGE_W - MARGIN, 14, { align: 'right' });
  ctx.pdf.setDrawColor(COLORS.BORDER as any).setLineWidth(0.2).line(MARGIN, 17, PAGE_W - MARGIN, 17);
}

// Desenha o rodapé com nome da marca e numeração de páginas
function drawFooter(ctx: Ctx) {
  const pageCount = (ctx.pdf.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    ctx.pdf.setPage(i);
    ctx.pdf.setFontSize(9).setTextColor(COLORS.SECONDARY);
    ctx.pdf.text(ctx.options.brandName, MARGIN, PAGE_H - 9);
    ctx.pdf.text(`Page ${i} / ${pageCount}`, PAGE_W - MARGIN, PAGE_H - 9, { align: 'right' });
  }
}

// Verifica se há espaço suficiente na página e, se não, cria uma nova página
const checkPage = (ctx: Ctx, needed: number) => { if (ctx.y + needed > PAGE_H - 22) { ctx.pdf.addPage(); drawHeader(ctx); } };

// Desenha um título de seção simples
const title = (ctx: Ctx, t: string) => { checkPage(ctx, 14); ctx.pdf.setFont(FONT,'bold').setFontSize(16).setTextColor(COLORS.PRIMARY_TEXT).text(t, MARGIN, ctx.y); ctx.y += 10; };

// Desenha uma barra de seção (tarja escura com texto branco)
function sectionBar(ctx: Ctx, t: string) {
  checkPage(ctx, 13);
  const h = 7.5;
  ctx.pdf.setFillColor(COLORS.PRIMARY_BAR as any).rect(MARGIN, ctx.y, PAGE_W - 2*MARGIN, h, 'F');
  ctx.pdf.setFont(FONT,'bold').setFontSize(10).setTextColor(COLORS.SECTION_TITLE_TEXT);
  ctx.pdf.text(t.toUpperCase(), PAGE_W/2, ctx.y + h/2, { align:'center', baseline:'middle' });
  ctx.y += h + 8;
}

/* =========================================================
 * Grid de Post-its
 * ========================================================= */
// Desenha uma grade de post-its na largura útil da página e atualiza o cursor vertical
function drawPostItGrid(
  ctx: Ctx,
  items: any[],
  itemRenderer: (ctx: Ctx, item: any, x: number, y: number, w: number, h: number) => void,
  options: GridOptions = {}
) {
  renderPostItGridAt(ctx, MARGIN, ctx.y, PAGE_W - 2*MARGIN, items, itemRenderer, options);
  const h = measurePostItGrid(ctx, items, PAGE_W - 2*MARGIN, options);
  ctx.y += h + (options.padding ?? 5);
}

// Renderiza uma grade de post-its a partir de uma posição e largura específicas
function renderPostItGridAt(
  ctx: Ctx,
  x0: number,
  y0: number,
  width: number,
  items: any[],
  itemRenderer: (ctx: Ctx, item: any, x: number, y: number, w: number, h: number) => void,
  options: GridOptions = {}
) {
  if (!items || items.length === 0) return;
  const cols = options.cols ?? 3;
  const gap  = options.padding ?? 5;
  const minH = options.minH ?? 30;
  const cellW = (width - (cols - 1) * gap) / cols;

  let cy = y0;
  for (let i = 0; i < items.length; i += cols) {
    const rowItems = items.slice(i, i + cols);
    const heights = rowItems.map((item: any) => {
      const text = sanitize(item.text || item.name || item.term);
      let h = (ctx.pdf.splitTextToSize(text, cellW - 8) as string[]).length * 4.5 + 10;
      if ((item as any).definition) h += (ctx.pdf.splitTextToSize((item as any).definition, cellW - 8) as string[]).length * 4;
      return Math.max(minH, h);
    });
    const rowH = Math.max(...heights);
    rowItems.forEach((it: any, idx: number) => itemRenderer(ctx, it, x0 + idx * (cellW + gap), cy, cellW, rowH));
    cy += rowH + gap;
  }
}

// Calcula a altura total ocupada por uma grade de post-its
function measurePostItGrid(ctx: Ctx, items: any[], width: number, options: GridOptions = {}) {
  if (!items || items.length === 0) return 10;
  const cols = options.cols ?? 3;
  const gap  = options.padding ?? 5;
  const minH = options.minH ?? 30;
  const cellW = (width - (cols - 1) * gap) / cols;

  let total = 0;
  for (let i = 0; i < items.length; i += cols) {
    const row = items.slice(i, i + cols);
    const heights = row.map((item: any) => {
      const text = sanitize(item.text || item.name || item.term);
      let h = (ctx.pdf.splitTextToSize(text, cellW - 8) as string[]).length * 4.5 + 10;
      if ((item as any).definition) h += (ctx.pdf.splitTextToSize((item as any).definition, cellW - 8) as string[]).length * 4;
      return Math.max(minH, h);
    });
    total += Math.max(...heights) + gap;
  }
  return total;
}

/* =========================================================
 * Renderizadores simples
 * ========================================================= */
// Renderizador básico de post-it (apenas texto com cor de fundo)
const renderSimplePostIt = (ctx: Ctx, item: any, x: number, y: number, w: number, h: number) => {
  const text = item.text || item.name;
  ctx.pdf.setFillColor(toHex(item.color, '#FEF08A'));
  ctx.pdf.roundedRect(x, y, w, h, 3, 3, 'F');
  ctx.pdf.setFont(FONT,'normal').setFontSize(9).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(sanitize(text), w - 8) as string[], x + 4, y + 4);
};

// Renderizador de termo de glossário (termo + definição)
const renderGlossaryTerm = (ctx: Ctx, item: any, x: number, y: number, w: number, h: number) => {
  ctx.pdf.setFillColor(toHex(item.color, '#BFDBFE')).roundedRect(x, y, w, h, 3, 3, 'F');
  ctx.pdf.setFont(FONT,'bold').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  const termL = ctx.pdf.splitTextToSize(sanitize(item.term), w - 8) as string[];
  ctx.pdf.text(termL, x + 4, y + 5);
  ctx.pdf.setFont(FONT,'normal').setFontSize(9).setTextColor(COLORS.SECONDARY);
  const defL = ctx.pdf.splitTextToSize(sanitize(item.definition), w - 8) as string[];
  ctx.pdf.text(defL, x + 4, y + 5 + (termL.length * 4.5) + 2);
};

/* =========================================================
 * Helpers imagem
 * ========================================================= */
// Adiciona uma imagem Base64 ajustada dentro de uma caixa (boxW x boxH) preservando proporção
function addBase64ImageFit(pdf: jsPDF, base64: string, x: number, y: number, boxW: number, boxH: number) {
  try {
    const imgProps = (pdf as any).getImageProperties?.(base64);
    if (!imgProps?.width || !imgProps?.height) { pdf.addImage(base64, 'PNG', x, y, boxW, boxH); return; }
    const r = Math.min(boxW / imgProps.width, boxH / imgProps.height);
    const w = imgProps.width * r, h = imgProps.height * r;
    pdf.addImage(base64, 'PNG', x + (boxW - w)/2, y + (boxH - h)/2, w, h);
  } catch {}
}

/* =========================================================
 * KICKOFF
 * ========================================================= */
// Renderiza a seção Kickoff do relatório
function renderKickoff(ctx: Ctx, content: any) {
  const intro = `The Lean Inception starts with a kick-off, followed by a sequence of intense activities, and ends with a workshop showcase. The team directly involved with the initiative must participate in all activities; the other interested parties must participate in the kick-off and the showcase, where expectations and results are presented.`;
  ctx.pdf.setFont(FONT,'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(intro, PAGE_W - 2*MARGIN) as string[], MARGIN, ctx.y);
  ctx.y += 18;

  ctx.pdf.setFont(FONT,'bold').setFontSize(11).setTextColor(COLORS.NOTE_TEXT)
    .text('Think big, start small, learn fast!', PAGE_W/2, ctx.y, { align:'center' });
  ctx.y += 9;

  const steps = [
    '1) Ask the main sponsor to open the Lean Inception with a speech about the initiative.',
    '2) Make a brief presentation about the Lean Inception agenda and the concept of MVP.',
    '3) Ask everyone to write their names, using the color that identifies the level of participation.'
  ];
  renderSteps(ctx, steps);

  sectionBar(ctx, 'FULL WORKSHOP PARTICIPANTS');
  drawPostItGrid(ctx, content?.fullWorkshopParticipants || [], renderSimplePostIt, { cols: 3 });

  sectionBar(ctx, 'PARTIAL WORKSHOP PARTICIPANTS');
  drawPostItGrid(ctx, content?.partialWorkshopParticipants || [], renderSimplePostIt, { cols: 3 });
}

/* =========================================================
 * AGENDA
 * ========================================================= */
// Renderiza a tabela da Agenda padrão da Lean Inception
function renderAgenda(ctx: Ctx) {
  const data = [
    { d:'MONDAY',    m:['KICKOFF','PRODUCT VISION'], a:['IS - IS NOT - DOES - DOES NOT DO','PRODUCT GOAL'] },
    { d:'TUESDAY',   m:['PERSONAS'],                  a:['USER JOURNEYS'] },
    { d:'WEDNESDAY', m:['FEATURE BRAINSTORMING'],     a:['TECH, BUSINESS AND UX REVIEW'] },
    { d:'THURSDAY',  m:['SEQUENCER'],                 a:['MVP CANVAS'] },
    { d:'FRIDAY',    m:['SHOWCASE'],                  a:['SHOWCASE'] },
  ];
  (autoTable as any)(ctx.pdf, {
    startY: ctx.y,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    head: [['', ...data.map(d => d.d)]],
    body: [
      ['MORNING',   ...data.map(d => d.m.join('\n'))],
      ['LUNCH',     '', '', '', '', ''],
      ['AFTERNOON', ...data.map(d => d.a.join('\n'))],
    ],
    headStyles: { fillColor: '#E5E7EB', textColor: '#1F2937', fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: '#FACC15', halign: 'center' } },
    didParseCell: (p: any) => {
      if (p.section === 'body' && p.row.index === 1) {
        p.cell.styles.fillColor = '#EAB308';
        p.cell.styles.halign = 'center';
        p.cell.styles.fontStyle = 'bold';
      }
    }
  });
  ctx.y = (ctx.pdf as any).lastAutoTable.finalY + 10;
}

/* =========================================================
 * PARKING LOT
 * ========================================================= */
// Renderiza a seção Parking Lot do relatório
function renderParkingLot(ctx: Ctx, content: any) {
  const desc = `The Parking Lot helps to momentarily park conversations, ideas or questions that are raised during a conversation but are not useful for discussion at that specific time. It is an essential tool for the facilitator at any time during the workshop, as it is a polite way of saying: "yes, I heard you, but this conversation is for later".`;
  ctx.pdf.setFont(FONT,'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(desc, PAGE_W - 2*MARGIN) as string[], MARGIN, ctx.y);
  ctx.y += 18;

  drawPostItGrid(ctx, content?.spots || [], renderSimplePostIt, { cols: 4 });
}

/* =========================================================
 * GLOSSARY
 * ========================================================= */
// Renderiza a seção Glossary do relatório
function renderGlossary(ctx: Ctx, content: any) {
  const desc =
`Take advantage of the Lean Inception to validate, adjust and give visibility to the vocabulary of the domain. It is very important that everyone involved - business, technology and user representatives - communicate and register the generated artifacts with a common language. Make sure to check the understanding of each word in the domain, and place it in the Glossary, visible to everyone.`;
  ctx.pdf.setFont(FONT,'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(desc, PAGE_W - 2*MARGIN) as string[], MARGIN, ctx.y);
  ctx.y += 18;

  drawPostItGrid(ctx, content?.terms || [], renderGlossaryTerm, { cols: 2, minH: 40 });
}

/* =========================================================
 * PRODUCT VISION
 * ========================================================= */
// Renderiza a seção Product Vision
function renderProductVision(ctx: Ctx, content: any) {
  const intro = `Somewhere between the idea and the launch of the MVP, the product vision helps you to walk the initial path. It defines the essence of your business value and should reflect a clear and compelling message to your customers. This activity will help you to define the product vision in a collaborative way.`;
  const mid   = `With a clear view of the product, you can determine how the initial "pieces" of the business will come together.`;
  ctx.pdf.setFont(FONT,'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(intro, PAGE_W - 2*MARGIN) as string[], MARGIN, ctx.y);
  ctx.y += 15;

  centeredCallout(ctx, mid, (PAGE_W - 2*MARGIN) - 40);

  const steps = [
    '1) Divide the team into three groups and request that each group fill only the blanks selected in its respective template.',
    '2) Ask each group to read their respective incomplete sentence and copy their post-its to the single template.',
    '3) Ask the team to consolidate a homogeneous sentence, copying or rewriting the previous notes, as needed.'
  ];
  renderSteps(ctx, steps);

  const visions = content?.visions || [];
  if (!visions.length) {
    ctx.pdf.setFont(FONT,'italic').setFontSize(9).setTextColor(COLORS.SECONDARY).text('No visions added to this section.', MARGIN, ctx.y);
    ctx.y += 8; return;
  }

  visions.forEach((v: any, i: number) => {
    sectionBar(ctx, `THE PRODUCT VISION ${visions.length > 1 ? `#${i + 1}` : ''}`);
    const rows = [
      ['For:', sanitize(v.for)], ['Whose:', sanitize(v.whose)], ['The:', sanitize(v.the)],
      ['Is a:', sanitize(v.isA)], ['That:', sanitize(v.that)], ['Different from:', sanitize(v.differentFrom)],
      ['Our product:', sanitize(v.ourProduct)],
    ];
    (autoTable as any)(ctx.pdf, {
      startY: ctx.y,
      margin: { left: MARGIN, right: MARGIN },
      head: [],
      body: rows.map(([l, t]) => [
        { content: l, styles: { fontStyle: 'bold' } },
        { content: t, styles: { fillColor: toHex(v.color, '#FEF08A') } },
      ]),
      theme: 'plain',
      columnStyles: { 0: { cellWidth: 40 } },
      styles: { fontSize: 9 }
    });
    ctx.y = (ctx.pdf as any).lastAutoTable.finalY + 10;
  });
}

/* =========================================================
 * THE PRODUCT IS / IS NOT / DOES / DOES NOT
 * ========================================================= */
// Renderiza a seção "The Product IS - IS NOT - DOES - DOES NOT"
function renderIsIsNot(ctx: Ctx, content: any) {
  const intro = `It is often easier to describe what something is not or does not do. This activity seeks classifications about the product following the four guidelines, specifically asking each positive and negative aspect about the product being or doing something.`;
  const mid   = `Deciding what NOT to do is AS IMPORTANT as deciding what to do.`;
  ctx.pdf.setFont(FONT,'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(intro, PAGE_W - 2*MARGIN) as string[], MARGIN, ctx.y);
  ctx.y += 15;

  centeredCallout(ctx, mid);

  const steps = [
    '1) Divide the team into two groups and request that each group fill only the blanks selected in its respective template.',
    "2) Ask a person to read a note. Talk about it. Group similar ones into a 'cluster'.",
    '3) Go back to step 2, then ask the same for another person in the next group, until all notes are finished.'
  ];
  renderSteps(ctx, steps);

  const groups = Array.isArray(content?.groups) ? content.groups : [];
  if (!groups.length) {
    ctx.pdf.setFont(FONT,'italic').setFontSize(9).setTextColor(COLORS.SECONDARY).text('No groups added.', MARGIN, ctx.y);
    ctx.y += 8; return;
  }

  const colGap = 6;
  const colW = (PAGE_W - 2*MARGIN - colGap) / 2;

  // Função auxiliar para desenhar o título de cada quadrante
  const quadrantTitle = (x:number, y:number, w:number, label:string) => {
    ctx.pdf.setFont(FONT,'bold').setFontSize(11).setTextColor(COLORS.NOTE_TEXT);
    ctx.pdf.text(label, x + w/2, y, { align:'center', baseline:'alphabetic' });
  };

  groups.forEach((g: any, idx: number) => {
    sectionBar(ctx, `The Product IS - IS NOT - DOES - DOES NOT #${idx + 1}`);

    const baseColor = g.color || 'bg-yellow-200';
    const withColor = (arr:any[]) => (Array.isArray(arr) ? arr.map(it => ({ ...it, color: it.color || baseColor })) : []);

    const isItems      = withColor(g.is);
    const isNotItems   = withColor(g.isNot);
    const doesItems    = withColor(g.does);
    const doesNotItems = withColor(g.doesNot);

    const opts: GridOptions = { cols: 1, padding: 5, minH: 22 };
    const titleH = 7;

    const hTopLeft  = titleH + measurePostItGrid(ctx, isItems, colW, opts);
    const hTopRight = titleH + measurePostItGrid(ctx, isNotItems, colW, opts);
    const row1H = Math.max(hTopLeft, hTopRight);

    const hBotLeft  = titleH + measurePostItGrid(ctx, doesItems, colW, opts);
    const hBotRight = titleH + measurePostItGrid(ctx, doesNotItems, colW, opts);
    const row2H = Math.max(hBotLeft, hBotRight);

    checkPage(ctx, row1H + row2H + 10);

    // Linha 1 . IS | IS NOT
    let xL = MARGIN, xR = MARGIN + colW + colGap, yRow = ctx.y;
    quadrantTitle(xL, yRow, colW, 'IS');
    quadrantTitle(xR, yRow, colW, 'IS NOT');
    renderPostItGridAt(ctx, xL, yRow + 3, colW, isItems, renderSimplePostIt, opts);
    renderPostItGridAt(ctx, xR, yRow + 3, colW, isNotItems, renderSimplePostIt, opts);
    ctx.y += row1H + 6;

    // Linha 2 . DOES | DOES NOT
    xL = MARGIN; xR = MARGIN + colW + colGap; yRow = ctx.y;
    quadrantTitle(xL, yRow, colW, 'DOES');
    quadrantTitle(xR, yRow, colW, 'DOES NOT');
    renderPostItGridAt(ctx, xL, yRow + 3, colW, doesItems, renderSimplePostIt, opts);
    renderPostItGridAt(ctx, xR, yRow + 3, colW, doesNotItems, renderSimplePostIt, opts);
    ctx.y += row2H + 6;
  });
}

/* =========================================================
 * PRODUCT GOALS
 * ========================================================= */
// Renderiza a seção Product Goals
function renderProductGoals(ctx: Ctx, content: any) {
  const desc = `Each participant must share what they understand as a business goal, and the various points of view must be discussed to reach a consensus on what is really important. This activity helps in raising and clarifying the main objectives.`;
  const mid  = `If you have to summarize the product in three business goals, what would they be?`;
  ctx.pdf.setFont(FONT,'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(desc, PAGE_W - 2*MARGIN) as string[], MARGIN, ctx.y);
  ctx.y += 15;

  centeredCallout(ctx, mid);

  const steps = [
    '1) Divide the team into three groups and request that each group fill only the blanks selected in its respective template.',
    "2) Ask participants to share what they have written, grouping them by similarity in the 'clusters'.",
    "3) Define a title for each of the 'clusters'."
  ];
  renderSteps(ctx, steps);

  drawPostItGrid(ctx, content?.goals || [], renderSimplePostIt, { cols: 3 });
}

/* =========================================================
 * PERSONAS
 * ========================================================= */
// Renderiza a seção Personas, incluindo cards para cada persona
function renderPersonas(ctx: Ctx, content: any) {
  const personas = Array.isArray(content?.personas) ? content.personas : [];
  const intro = `To effectively identify the features of a product, it is important to keep users and their goals in mind. A persona creates a realistic representation of users, helping the team to describe features from the point of view of those who will interact with the final product.`;
  const mid   = `A persona represents a user of the product, describing not only his/her role, but also characteristics and needs.`;
  ctx.pdf.setFont(FONT,'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(intro, PAGE_W - 2*MARGIN) as string[], MARGIN, ctx.y);
  ctx.y += 15;

  centeredCallout(ctx, mid, (PAGE_W - 2*MARGIN) - 40);

  const steps = [
    '1) Divide the team into three groups and ask each to describe ONE persona.',
    '2) Each group presents its persona to the entire team.',
    '3) Optionally, make more rounds to describe other personas. After each round, group them by similarity.'
  ];
  renderSteps(ctx, steps);

  if (!personas.length) {
    ctx.pdf.setFont(FONT,'italic').setFontSize(9).setTextColor(COLORS.SECONDARY).text('No personas added.', MARGIN, ctx.y);
    ctx.y += 8; return;
  }

  const cols = 2;
  const gap = 6;
  const cardW = (PAGE_W - 2*MARGIN - (cols - 1)*gap) / cols;
  const cardHMin = 60;

  // Monta a grid de cards de personas
  for (let i = 0; i < personas.length; i += cols) {
    const row = personas.slice(i, i + cols);
    const heights = row.map((p: any) => {
      const nameH = 6;
      const profileH  = (ctx.pdf.splitTextToSize(sanitize(p.profile),  cardW - 14) as string[]).length * 4.2 + 8;
      const behaviorH = (ctx.pdf.splitTextToSize(sanitize(p.behavior), cardW - 14) as string[]).length * 4.2 + 8;
      const needsH    = (ctx.pdf.splitTextToSize(sanitize(p.needs),    cardW - 14) as string[]).length * 4.2 + 8;
      const photoH = 28;
      return Math.max(cardHMin, nameH + profileH + behaviorH + needsH + photoH + 18);
    });
    const rowH = Math.max(...heights);
    checkPage(ctx, rowH + gap);

    row.forEach((p: any, idx: number) => {
      const x = MARGIN + idx * (cardW + gap);
      const y = ctx.y;
      ctx.pdf.setDrawColor(COLORS.BORDER as any).setFillColor('#F9FAFB');
      ctx.pdf.roundedRect(x, y, cardW, rowH, 3, 3, 'FD');

      const photoBox = { w: 24, h: 24 };
      const px = x + 6, py = y + 6;
      ctx.pdf.setFillColor('#E5E7EB').rect(px, py, photoBox.w, photoBox.h, 'F');
      if (p.photo) addBase64ImageFit(ctx.pdf, p.photo, px, py, photoBox.w, photoBox.h);

      ctx.pdf.setFont(FONT,'bold').setFontSize(11).setTextColor(COLORS.NOTE_TEXT);
      ctx.pdf.text(sanitize(p.name || 'Persona'), x + 6 + photoBox.w + 4, y + 12);

      let cy = y + 6 + photoBox.h + 6;
      const section = (label: string, text: string) => {
        ctx.pdf.setFont(FONT,'bold').setFontSize(9).setTextColor(COLORS.NOTE_TEXT);
        ctx.pdf.text(label, x + 6, cy);
        cy += 4.5;
        ctx.pdf.setFont(FONT,'normal').setFontSize(9).setTextColor(COLORS.SECONDARY);
        const lines: string[] = ctx.pdf.splitTextToSize(sanitize(text), cardW - 12) as string[];
        ctx.pdf.text(lines, x + 6, cy);
        cy += lines.length * 4.2 + 6;
      };

      section('Profile', p.profile || '');
      section('Behavior', p.behavior || '');
      section('Needs', p.needs || '');
    });

    ctx.y += rowH + gap;
  }
}

/* =========================================================
 * USER JOURNEYS — estilo Product Vision
 * ========================================================= */
// Renderiza a seção User Journeys no estilo de tabela similar ao Product Vision
function renderUserJourneys(ctx: Ctx, content: any) {
  const journeys = Array.isArray(content?.journeys) ? content.journeys : [];
  const intro = `The journey describes a user's journey through a sequence of steps to reach a goal. Some of these steps represent different points of contact with the product, characterizing the interaction.`;
  ctx.pdf.setFont(FONT,'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(intro, PAGE_W - 2*MARGIN) as string[], MARGIN, ctx.y);
  ctx.y += 12;

  if (!journeys.length) {
    ctx.pdf.setFont(FONT,'italic').setFontSize(9).setTextColor(COLORS.SECONDARY).text('No journeys added.', MARGIN, ctx.y);
    ctx.y += 8; return;
  }

  journeys.forEach((j: any, idx: number) => {
    sectionBar(ctx, `USER JOURNEY ${journeys.length > 1 ? `#${idx + 1}` : ''}`);

    const personaTxt = sanitize(j.persona || '—');
    const stepsArr: any[] = Array.isArray(j.steps) ? j.steps : [];
    const goalTxt = sanitize(j.goal || '—');

    // Estilo igual ao Product Vision. 2 colunas, sem grade, 2ª coluna com fill contínuo
    const baseFill = toHex(j?.color, toHex('bg-yellow-100', '#FEF9C3'));

    type Row = { label: string; value: string; fill?: string };
    const rows: Row[] = [
      { label: 'Personas:', value: personaTxt, fill: toHex(j?.personaColor, baseFill) },
      ...stepsArr.map((s: any, i: number) => ({
        label: `Step ${i + 1}:`,
        value: sanitize(s?.text || '—'),
        fill: toHex(s?.color, baseFill)
      })),
      { label: 'Goal:', value: goalTxt, fill: toHex(j?.goalColor, baseFill) },
    ];

    (autoTable as any)(ctx.pdf, {
      startY: ctx.y,
      margin: { left: MARGIN, right: MARGIN },
      theme: 'plain',
      head: [],
      body: rows.map((r: Row) => ([
        { content: r.label, styles: { fontStyle: 'bold', cellPadding: 3, textColor: COLORS.NOTE_TEXT } },
        { content: r.value, styles: { fillColor: r.fill || baseFill, cellPadding: 6, textColor: COLORS.NOTE_TEXT } },
      ])),
      columnStyles: { 0: { cellWidth: 40 } },
      styles: { fontSize: 9, lineWidth: 0 }
    });

    ctx.y = (ctx.pdf as any).lastAutoTable.finalY + 10;
  });
}

/* =========================================================
 * FEATURE BRAINSTORMING
 * ========================================================= */
// Renderiza a seção Feature Brainstorming
function renderFeatureBrainstorming(ctx: Ctx, content: any) {
  const intro = `A feature represents a user's action or interaction with the product, for example: printing invoices, consulting detailed statements and inviting Facebook friends. The description of a feature must be as simple as possible, aiming to meet a business goal, a persona need, and / or contemplating a step in the journey.`;
  const mid   = `The user is trying to do something, so the product must have a feature for that. What is this feature?`;
  ctx.pdf.setFont(FONT,'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(intro, PAGE_W - 2*MARGIN) as string[], MARGIN, ctx.y);
  ctx.y += 15;

  centeredCallout(ctx, mid, (PAGE_W - 2*MARGIN) - 30);

  const steps = [
    "1) Ask someone to read, slowly, the step-by-step of a user's journey.",
    '2) While reading, other people share feature ideas.',
    '3) When a feature is identified, describe it and place it on the board. Repeat the previous steps for all journeys.'
  ];
  renderSteps(ctx, steps);

  const features = Array.isArray(content?.features) ? content.features : [];
  drawPostItGrid(ctx, features, renderSimplePostIt, { cols: 4, minH: 24, padding: 5 });
}

/* =========================================================
 * TECHNICAL, BUSINESS AND UX REVIEW (cards)
 * ========================================================= */
// Escolhe cor de fundo do card com base na confiança
const reviewBgFor = (conf: Conf, baseHex: string) => {
  if (conf === 'high')   return '#DCFCE7';
  if (conf === 'medium') return '#FEF9C3';
  if (conf === 'low')    return '#FEE2E2';
  return baseHex || '#F3F4F6';
};

// Escolhe cor de borda do card com base na confiança
const reviewBorderFor = (conf: Conf, baseHex: string) => {
  if (conf === 'high')   return '#A7F3D0';
  if (conf === 'medium') return '#FDE68A';
  if (conf === 'low')    return '#FCA5A5';
  return baseHex ? '#CBD5E1' : '#E5E7EB';
};

// Devolve o texto do selo de confiança
const reviewLabelFor = (conf: Conf) => {
  if (conf === 'high')   return 'High Confidence';
  if (conf === 'medium') return 'Medium Confidence';
  if (conf === 'low')    return 'Low Confidence';
  return '—';
};

// Desenha um card de feature no estilo review (com confiança, valor e selo)
function renderReviewStyleFeatureCard(ctx: Ctx, f: any, x: number, y: number, w: number, h: number) {
  const conf = getConfidence(f);
  const baseHex = featureColorHex(f, '#F3F4F6'); // cor própria do cartão, se houver
  const bg = reviewBgFor(conf, baseHex);
  const bd = reviewBorderFor(conf, baseHex);

  // cartão
  ctx.pdf.setDrawColor(bd as any).setFillColor(bg as any).roundedRect(x, y, w, h, 4, 4, 'FD');

  // título (nome)
  ctx.pdf.setFont(FONT, 'normal').setFontSize(11).setTextColor(COLORS.NOTE_TEXT);
  const nameLines: string[] = ctx.pdf.splitTextToSize(normalizeSymbols(f.name || 'New Feature'), w - 14) as string[];
  ctx.pdf.text(nameLines, x + 7, y + 12);

  // “campo” de valor
  const valueBoxY = y + 16 + nameLines.length * 5;
  const valueBoxH = 10;
  ctx.pdf.setDrawColor('#D1D5DB' as any).setFillColor('#FFFFFF' as any);
  ctx.pdf.roundedRect(x + 7, valueBoxY, w - 14, valueBoxH, 2, 2, 'FD');
  ctx.pdf.setFont(FONT, 'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  const val = normalizeSymbols(f.value || f.valuation || '');
  ctx.pdf.text(val || '', x + w / 2, valueBoxY + valueBoxH / 2 + 0.5, { align: 'center', baseline: 'middle' });

  // selo de confiança
  const label = reviewLabelFor(conf);
  const badgeY = valueBoxY + valueBoxH + 6;
  const badgeH = 8;
  ctx.pdf.setDrawColor('#D1D5DB' as any).setFillColor('#FFFFFF' as any);
  ctx.pdf.roundedRect(x + 7, badgeY, w - 14, badgeH, 2, 2, 'FD');
  ctx.pdf.setFont(FONT, 'bold').setFontSize(9).setTextColor(COLORS.SECONDARY);
  ctx.pdf.text(label, x + (w / 2), badgeY + badgeH / 2 + 0.2, { align: 'center', baseline: 'middle' });
}

// Calcula a altura mínima necessária para o card de review
function calcReviewStyleCardH(ctx: Ctx, f: any, w: number) {
  const nameLines: string[] = ctx.pdf.splitTextToSize(normalizeSymbols(f.name || 'New Feature'), w - 14) as string[];
  return Math.max(36, 10 + nameLines.length * 5 + 10 + 6 + 8 + 10);
}

/* =========================================================
 * TAG (MVP / INCREMENT) — fundo escuro e fonte branca
 * ========================================================= */
// Renderiza uma tag de label (ex. MVP, Increment) com fundo colorido e texto branco
function renderLabelCard(ctx: Ctx, label: string, x: number, y: number, w: number, h: number, color?: string) {
  const fill = toHex(color, COLORS.PRIMARY_BAR);
  ctx.pdf.setDrawColor('#0B1220' as any).setFillColor(fill as any).roundedRect(x, y, w, h, 6, 6, 'FD');
  ctx.pdf.setFont(FONT,'bold').setFontSize(12).setTextColor('#FFFFFF');
  ctx.pdf.text(String(label).toUpperCase(), x + w/2, y + h/2 + 0.5, { align:'center', baseline:'middle' });
}

// Calcula altura mínima para o card de label
function calcLabelCardH(ctx: Ctx, label: string, w: number) {
  const lines: string[] = ctx.pdf.splitTextToSize(String(label), w - 14) as string[];
  return Math.max(36, 10 + lines.length * 5 + 12);
}

/* =========================================================
 * SEQUENCER — tarja colada + MVP/INCREMENT na mesma linha
 * ========================================================= */
// Renderiza a seção do Feature Sequencer com waves, tags e features
function renderSequencer(ctx: Ctx, content: any) {
  const waves = Array.isArray(content?.waves) ? content.waves : [];
  const intro = `The Feature Sequencer assists in organizing and viewing the features and the incremental validation of the product.`;
  const mid   = `Define the MVP and its subsequent increments.`;
  ctx.pdf.setFont(FONT,'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(intro, PAGE_W - 2*MARGIN) as string[], MARGIN, ctx.y);
  ctx.y += 15;

  centeredCallout(ctx, mid, (PAGE_W - 2*MARGIN) - 30);

  const steps = [
    '1) Ask people to decide the first feature.',
    '2) Bring more cards to the sequencer. Respect the rules.',
    '3) Identify the MVP and the increments of the product.'
  ];
  renderSteps(ctx, steps);

  if (!waves.length) {
    ctx.pdf.setFont(FONT,'italic').setFontSize(9).setTextColor(COLORS.SECONDARY).text('No waves added.', MARGIN, ctx.y);
    ctx.y += 8; return;
  }

  const cols = 3, gap = 6;
  const cellW = (PAGE_W - 2*MARGIN - (cols - 1) * gap) / cols;

  waves.forEach((w: any, i: number) => {
    const tags: WaveTag[] = (Array.isArray(w?.postIts) ? w.postIts : [])
      .map((p: any): WaveTag => ({ label: p?.label ?? p, color: p?.color || undefined }))
      .filter((t: WaveTag) => !!t.label);

    const feats: any[] = Array.isArray(w?.features) ? w.features : [];

    type WaveItem = { kind: 'tag'; data: WaveTag } | { kind: 'feature'; data: any };
    const tagItems: WaveItem[] = tags.map<WaveItem>((t) => ({ kind: 'tag', data: t }));
    const featureItems: WaveItem[] = feats.map<WaveItem>((f) => ({ kind: 'feature', data: f }));
    const items: WaveItem[] = [...tagItems, ...featureItems];

    if (!items.length) {
      sectionBar(ctx, `WAVE ${i + 1}${w?.name ? ` — ${sanitize(w.name)}` : ''}`);
      ctx.pdf.setFont(FONT,'italic').setFontSize(9).setTextColor(COLORS.SECONDARY)
        .text('No features in this wave.', MARGIN, ctx.y);
      ctx.y += 10;
      return;
    }

    const heightFor = (it: WaveItem) =>
      it.kind === 'tag'
        ? calcLabelCardH(ctx, String((it.data as WaveTag).label).toUpperCase(), cellW)
        : calcReviewStyleCardH(ctx, it.data as any, cellW);

    // Mede a 1ª linha para garantir que a tarja e a primeira linha fiquem juntas
    const firstRow = items.slice(0, cols);
    const firstRowH = Math.max(...firstRow.map(heightFor));
    const approxSectionBarH = 16; // ~barra+espaço
    checkPage(ctx, approxSectionBarH + firstRowH + 4);

    // Tarja do wave
    sectionBar(ctx, `WAVE ${i + 1}${w?.name ? ` — ${sanitize(w.name)}` : ''}`);

    // Linhas subsequentes. cada linha tem até 3 itens
    for (let k = 0; k < items.length; k += cols) {
      const row: WaveItem[] = items.slice(k, k + cols);
      const rowH = Math.max(...row.map(heightFor));
      checkPage(ctx, rowH + 4);

      row.forEach((it: WaveItem, idx: number) => {
        const x = MARGIN + idx * (cellW + gap);
        if (it.kind === 'tag') {
          const t = it.data as WaveTag;
          renderLabelCard(ctx, String(t.label), x, ctx.y, cellW, rowH, t.color);
        } else {
          renderReviewStyleFeatureCard(ctx, it.data, x, ctx.y, cellW, rowH);
        }
      });

      ctx.y += rowH + 4;
    }
    ctx.y += 4;
  });
}

/* =========================================================
 * MVP CANVAS (mantém cada canvas inteiro na mesma página)
 * ========================================================= */
// Escolhe cor de bloco do MVP Canvas com base em múltiplas fontes de configuração
function pickBlockColor(c: any, cd: any, key: string, fallbackTw: string) {
  const fallbackHex = toHex(fallbackTw, '#FEF9C3');
  const k1 = cd?.[`${key}Color`]; if (k1) return toHex(k1, fallbackHex);
  const k2 = c?.colors?.[key];    if (k2) return toHex(k2, fallbackHex);
  const k3 = c?.color;            if (k3) return toHex(k3, fallbackHex);
  return fallbackHex;
}

// Renderiza a seção do MVP Canvas. garantindo que cada canvas caiba integralmente na página
function renderMVPCanvas(ctx: Ctx, content: any) {
  const canvases = Array.isArray(content?.mvpCanvases) ? content.mvpCanvases : [];
  const intro = `The MVP Canvas is a visual chart that helps the team to align and define the MVP, the simplest version of the product that can be made available to the business (minimum product) and that can be effectively used and validated by the end user (viable product).`;
  const mid   = `The team has already discussed what makes up the MVP and has already talked about what is expected of it, the time has come to summarize everything.`;
  ctx.pdf.setFont(FONT,'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(intro, PAGE_W - 2*MARGIN) as string[], MARGIN, ctx.y);
  ctx.y += 15;

  centeredCallout(ctx, mid, (PAGE_W - 2*MARGIN) - 30);

  const steps = [
    '1) Divide the team into two groups and ask each group to complete the MVP canvas in their respective template.',
    '2) Ask each group to present their Canvas MVP.',
    '3) Ask the team to consolidate the seven blocks of the MVP canvas, using and changing the previous notes as needed.'
  ];
  renderSteps(ctx, steps);

  if (!canvases.length) {
    ctx.pdf.setFont(FONT,'italic').setFontSize(9).setTextColor(COLORS.SECONDARY).text('No MVP Canvas added.', MARGIN, ctx.y);
    ctx.y += 8; return;
  }

  const gap = 5;
  const gridCols = 7;
  const gridW = PAGE_W - 2*MARGIN;
  const unit = (gridW - (gridCols - 1) * gap) / gridCols;

  // Função auxiliar para calcular altura de cada bloco
  const blockH = (items: any[], w: number) => {
    const lines: string[] = (items || []).flatMap((it: any) => ctx.pdf.splitTextToSize(`• ${sanitize(it.text || '—')}`, w - 10) as string[]);
    return Math.max(26, 12 + 4 + lines.length * 4.2 + 8);
  };

  // Função auxiliar para desenhar um bloco do canvas
  const drawBlock = (x: number, y: number, w: number, h: number, titleStr: string, items: any[], colorHex: string) => {
    ctx.pdf.setDrawColor('#111827' as any).setLineWidth(0.5).setFillColor(colorHex as any);
    ctx.pdf.roundedRect(x, y, w, h, 2, 2, 'FD');
    ctx.pdf.setFont(FONT,'bold').setFontSize(9).setTextColor(COLORS.NOTE_TEXT);
    ctx.pdf.text(titleStr.toUpperCase(), x + w / 2, y + 7, { align: 'center', baseline: 'middle' });
    ctx.pdf.setFont(FONT,'normal').setFontSize(9).setTextColor(COLORS.NOTE_TEXT);

    let cy = y + 12;
    (items || []).forEach((it: any) => {
      const tx: string[] = ctx.pdf.splitTextToSize(`• ${sanitize(it.text || '—')}`, w - 10) as string[];
      ctx.pdf.text(tx, x + 5, cy);
      cy += tx.length * 4.2 + 2;
    });
  };

  // Percorre todos os canvases criados
  canvases.forEach((c: any, idx: number) => {
    // Medir a altura total do canvas antes de desenhar
    const cd = c?.canvasData || {};
    const row1 = [
      { key: 'personas', t: 'Segmented Personas', s: cd.personas, span: 2, fallback: 'bg-blue-100'   },
      { key: 'proposal', t: 'MVP Proposal',       s: cd.proposal, span: 3, fallback: 'bg-yellow-100' },
      { key: 'result',   t: 'Expected Result',    s: cd.result,   span: 2, fallback: 'bg-pink-200'   },
    ];
    const h1 = Math.max(...row1.map(b => blockH(b.s, unit * b.span + gap * (b.span - 1))));
    const wFull = unit * 7 + gap * 6;
    const h2 = blockH(cd.features, wFull);
    const row3 = [
      { key: 'journeys',        t: 'Journeys',            s: cd.journeys,        span: 2, fallback: 'bg-purple-200' },
      { key: 'costSchedule',    t: 'Cost & Schedule',     s: cd.costSchedule,    span: 3, fallback: 'bg-orange-200' },
      { key: 'metricsValidate', t: 'Metrics to Validate', s: cd.metricsValidate, span: 2, fallback: 'bg-green-200'  },
    ];
    const h3 = Math.max(...row3.map(b => blockH(b.s, unit * b.span + gap * (b.span - 1))));
    const totalCanvasHeight = 16 + h1 + 5 + h2 + 5 + h3 + 8;

    // Se não couber na página atual, inicia nova página
    checkPage(ctx, totalCanvasHeight);

    sectionBar(ctx, `MVP CANVAS ${canvases.length > 1 ? `#${idx + 1}` : ''}`);

    let x = MARGIN;

    // linha 1
    row1.forEach((b) => {
      const w = unit * b.span + gap * (b.span - 1);
      const colorHex = pickBlockColor(c, cd, b.key, b.fallback);
      drawBlock(x, ctx.y, w, h1, b.t, b.s, colorHex);
      x += w + gap;
    });
    ctx.y += h1 + 5;

    // linha 2 (full)
    {
      const colorHex = pickBlockColor(c, cd, 'features', 'bg-yellow-100');
      drawBlock(MARGIN, ctx.y, wFull, h2, 'FEATURES', cd.features, colorHex);
      ctx.y += h2 + 5;
    }

    // linha 3
    x = MARGIN;
    row3.forEach((b) => {
      const w = unit * b.span + gap * (b.span - 1);
      const colorHex = pickBlockColor(c, cd, b.key, b.fallback);
      drawBlock(x, ctx.y, w, h3, b.t, b.s, colorHex);
      x += w + gap;
    });
    ctx.y += h3 + 8;
  });
}

/* =========================================================
 * Capa – Metadados centralizados (com quebra em 2 por linha)
 * ========================================================= */
// Quebra um array em subarrays de tamanho fixo
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Formata lista de participantes para linhas de texto (2 por linha)
function formatParticipantsLines(p: string[] | string | null | undefined): string[] {
  const arr = Array.isArray(p)
    ? p
    : (p ? String(p).split(',').map(s => s.trim()).filter(Boolean) : []);
  if (!arr.length) return ['—'];
  return chunk(arr, 2).map(line => line.join(', ')); // 2 por linha
}

// Desenha metadados na capa (status, steps, generatedAt, participants)
function drawFrontMetadata(pdf: jsPDF, meta: {
  status?: string | null;
  steps?: string | null;
  generatedAt?: string | null;
  participants?: string[] | string | null;
}, startY = 150) {
  const lineH = 6, gap = 4, fontSize = 10;

  const rows: Array<[string, string[]]> = [
    ['Status: ',        [sanitize(meta.status ?? '') || '—']],
    ['Steps: ',         [sanitize(meta.steps ?? '') || '—']],
    ['Generated at: ',  [sanitize(meta.generatedAt ?? '') || '—']],
    ['Participants: ',  formatParticipantsLines(meta.participants)],
  ];

  let y = startY;

  rows.forEach(([label, values]) => {
    // largura do label
    pdf.setFont(FONT,'bold').setFontSize(fontSize);
    const labelW = pdf.getTextWidth(label);

    // primeira linha (label + primeiro valor) centralizados como conjunto
    const firstVal = String(values[0] ?? '');
    pdf.setFont(FONT,'normal').setFontSize(fontSize);
    const firstValW = pdf.getTextWidth(firstVal);
    const totalW = labelW + gap + firstValW;
    const startX = (PAGE_W / 2) - (totalW / 2);

    // label
    pdf.setFont(FONT,'bold').setTextColor(COLORS.NOTE_TEXT).setFontSize(fontSize);
    pdf.text(label, startX, y);

    // primeiro valor
    pdf.setFont(FONT,'normal').setTextColor(COLORS.SECONDARY).setFontSize(fontSize);
    pdf.text(firstVal, startX + labelW + gap, y);

    // linhas extras (apenas o valor centralizado)
    for (let i = 1; i < values.length; i++) {
      y += lineH;
      const w = pdf.getTextWidth(values[i]);
      const x = (PAGE_W / 2) - (w / 2);
      pdf.text(values[i], x, y);
    }
    y += lineH;
  });
}

/* =========================================================
 * Sumário (TOC)
 * ========================================================= */
// Renderiza a página de sumário (índice) com step, nome do template e página
function renderSummaryPage(ctx: Ctx, entries: Array<{step:number; name:string; page:number}>) {
  drawHeader(ctx);
  title(ctx, 'Summary');

  (autoTable as any)(ctx.pdf, {
    startY: ctx.y,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    head: [['Step', 'Template', 'Page']],
    body: entries.map(e => [String(e.step), e.name, String(e.page)]),
    headStyles: { fillColor: '#E5E7EB', textColor: '#1F2937', fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 20, halign: 'center' } },
    styles: { fontSize: 10 }
  });

  ctx.y = (ctx.pdf as any).lastAutoTable.finalY + 10;
}

/* =========================================================
 * Função Principal
 * ========================================================= */
// Função principal que gera o PDF completo do Workshop Report
export function generateWorkshopReport(report: WorkshopReport, options: ReportOptions): jsPDF {
  // Cria a instância do PDF no formato A4 retrato
  const pdf = new jsPDF('p', 'mm', 'a4');
  // Inicializa o contexto com y = 0 e informações de workshop
  const ctx: Ctx = { pdf, y: 0, options, workshopName: report.title || report.workshop };
  pdf.setProperties({ title: report.title, author: options.brandName }).setFont(FONT,'normal');

  // ===== CAPA =====
  drawHeader(ctx);
  pdf.setFont(FONT,'bold').setFontSize(30).setTextColor(COLORS.PRIMARY_TEXT);
  pdf.text(pdf.splitTextToSize(report.title, PAGE_W - 2*MARGIN) as string[], PAGE_W/2, 95, { align: 'center' });
  pdf.setFontSize(15).setTextColor(COLORS.SECONDARY).text(report.workshop, PAGE_W/2, 115, { align: 'center' });

  // Metadados centralizados
  drawFrontMetadata(pdf, {
    status: report.status ?? '',
    steps: report.steps ?? '',
    generatedAt: report.generatedAt ?? '',
    participants: report.participants ?? ''
  }, 150);

  // ===== PÁGINA RESERVADA PARA O SUMÁRIO =====
  pdf.addPage();
  const summaryPageIndex = (pdf.internal as any).getNumberOfPages();

  // ===== Templates =====
  // Ordena templates pela ordem de step
  const sortedTemplates = [...report.templates].sort((a, b) => a.step - b.step);
  const tocEntries: Array<{step:number; name:string; page:number}> = [];

  // Percorre todos os templates, gerando página para cada um
  for (const template of sortedTemplates) {
    const pageAtStart = (pdf.internal as any).getNumberOfPages() + 1;
    tocEntries.push({ step: template.step, name: normalizeName(template.name), page: pageAtStart });

    pdf.addPage();
    drawHeader(ctx);
    const normName = normalizeName(template.name);
    title(ctx, normName);

    // Mapa de renderizadores por nome de template
    const renderers: Record<string, (ctx: Ctx, content: any) => void> = {
      'Kickoff': renderKickoff,
      'Agenda': renderAgenda,
      'Parking Lot': renderParkingLot,
      'Glossary': renderGlossary,
      'Product Vision': renderProductVision,
      'The Product IS - IS NOT - DOES - DOES NOT': renderIsIsNot,
      'Product Goals': renderProductGoals,
      'Personas': renderPersonas,
      'User Journeys': renderUserJourneys,
      'Feature Brainstorming': renderFeatureBrainstorming,
      'Technical, Business and UX Review': renderReviewStyleSection,
      'Sequencer': renderSequencer,
      'MVP Canvas': renderMVPCanvas,
    };

    const render = renderers[normName];
    if (render) render(ctx, template.content);
    else {
      ctx.pdf.setFont(FONT,'italic').setFontSize(10).setTextColor(COLORS.SECONDARY);
      ctx.pdf.text(`Renderer for "${normName}" not implemented.`, MARGIN, ctx.y);
    }
  }

  // ===== Renderiza o SUMÁRIO =====
  pdf.setPage(summaryPageIndex);
  ctx.y = 0;
  renderSummaryPage(ctx, tocEntries);

  // ===== Rodapés =====
  drawFooter(ctx);
  return pdf;
}

/** Wrapper só para manter a assinatura semelhante às demais seções */
// Renderiza a seção de Review (Technical, Business and UX Review) usando os cards de confiança
function renderReviewStyleSection(ctx: Ctx, content: any) {
  // Reaproveita os cards do review, organizando em grid 3 colunas
  const intro = `This review aims to discuss how the team feels about technical, business and UX understanding for each feature. From this activity, new clarifications will happen and the disagreements and doubts will become more apparent.`;
  const mid   = `The colors and markings will assist the team in subsequent activities to prioritize, estimate and plan.`;

  ctx.pdf.setFont(FONT, 'normal').setFontSize(10).setTextColor(COLORS.NOTE_TEXT);
  ctx.pdf.text(ctx.pdf.splitTextToSize(intro, PAGE_W - 2 * MARGIN) as string[], MARGIN, ctx.y);
  ctx.y += 15;

  centeredCallout(ctx, mid, (PAGE_W - 2 * MARGIN) - 30);

  const steps = [
    '1) Ask a person to choose and drag a feature, going through the graph and table.',
    '2) Define the color according to the confidence level and make markings (on a scale of 1 to 3) of business value, effort and UX value . $, E and <3.',
    '3) Confirm that everyone agrees; choose the next person and return to step 1.'
  ];
  renderSteps(ctx, steps);

  const features = Array.isArray(content?.features) ? content.features : [];
  if (features.length === 0) {
    ctx.pdf.setFont(FONT, 'italic').setFontSize(9).setTextColor(COLORS.SECONDARY)
      .text('No features added.', MARGIN, ctx.y);
    ctx.y += 8;
    return;
  }

  const cols = 3;
  const gap = 6;
  const cellW = (PAGE_W - 2 * MARGIN - (cols - 1) * gap) / cols;

  for (let i = 0; i < features.length; i += cols) {
    const row = features.slice(i, i + cols);
    const rowH = Math.max(...row.map((f: any) => calcReviewStyleCardH(ctx, f, cellW)));
    checkPage(ctx, rowH + gap);
    row.forEach((f: any, idx: number) => renderReviewStyleFeatureCard(ctx, f, MARGIN + idx * (cellW + gap), ctx.y, cellW, rowH));
    ctx.y += rowH + gap;
  }
}
