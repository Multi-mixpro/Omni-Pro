import { useEffect, useRef, useState } from 'react';
import {
  Bold,
  BookOpen,
  Check,
  Copy,
  Eraser,
  Eye,
  FileText,
  Highlighter,
  Italic,
  List,
  Maximize2,
  Minimize2,
  Palette,
  Pencil,
  Printer,
  Sparkles,
  Type,
  Underline,
  X,
  ZoomIn,
} from 'lucide-react';
import { copyFormats, outputTypes, platforms, type CopyTemplate } from './repository';

const ALLOWED_TAGS = new Set([
  'b', 'strong', 'i', 'em', 'u', 'mark', 'span', 'br', 'p', 'div', 'ul', 'ol', 'li', 'font',
]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function isRichHtml(text: string): boolean {
  return /<\/?(b|strong|i|em|u|mark|span|br|p|div|ul|ol|li|font)\b/i.test(text);
}

export function sanitizeCopyHtml(raw?: string | null): string {
  if (!raw) return '';
  if (!isRichHtml(raw)) {
    return escapeHtml(raw).replace(/\r?\n/g, '<br>');
  }
  if (typeof DOMParser === 'undefined') {
    return raw;
  }
  const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return escapeHtml(raw).replace(/\r?\n/g, '<br>');

  function cleanNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent ?? '');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const childrenHtml = Array.from(el.childNodes).map(cleanNode).join('');

    if (!ALLOWED_TAGS.has(tag)) {
      return childrenHtml;
    }
    if (tag === 'br') return '<br>';

    const safeStyles: string[] = [];
    const style = el.style;
    if (style?.color && /^[#a-zA-Z0-9(),.\s%-]{1,40}$/.test(style.color)) {
      safeStyles.push(`color:${style.color}`);
    }
    if (style?.backgroundColor && /^[#a-zA-Z0-9(),.\s%-]{1,40}$/.test(style.backgroundColor)) {
      safeStyles.push(`background-color:${style.backgroundColor}`);
    }
    if (style?.fontSize && /^[0-9.]+(px|rem|em|%)$/.test(style.fontSize)) {
      safeStyles.push(`font-size:${style.fontSize}`);
    }
    if (style?.fontWeight && /^(bold|normal|[4-9]00)$/.test(style.fontWeight)) {
      safeStyles.push(`font-weight:${style.fontWeight}`);
    }
    if (style?.fontStyle && /^(italic|normal)$/.test(style.fontStyle)) {
      safeStyles.push(`font-style:${style.fontStyle}`);
    }
    if (style?.textDecoration && /^(underline|none)$/.test(style.textDecoration)) {
      safeStyles.push(`text-decoration:${style.textDecoration}`);
    }

    const fontColor = el.getAttribute('color');
    if (tag === 'font' && fontColor && /^[#a-zA-Z0-9]{1,24}$/.test(fontColor)) {
      safeStyles.push(`color:${fontColor}`);
    }
    const fontSizeAttr = el.getAttribute('size');
    if (tag === 'font' && fontSizeAttr) {
      const sizeMap: Record<string, string> = { '1': '12px', '2': '13px', '3': '15px', '4': '18px', '5': '22px', '6': '26px' };
      if (sizeMap[fontSizeAttr]) safeStyles.push(`font-size:${sizeMap[fontSizeAttr]}`);
    }

    const outTag = tag === 'font' ? 'span' : tag;
    const styleAttr = safeStyles.length > 0 ? ` style="${safeStyles.join(';')}"` : '';
    return `<${outTag}${styleAttr}>${childrenHtml}</${outTag}>`;
  }

  return Array.from(root.childNodes).map(cleanNode).join('');
}

export function stripCopyRichText(raw?: string | null): string {
  if (!raw) return '';
  if (!isRichHtml(raw)) return raw;
  const withNewlines = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<li>/gi, '• ');
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(withNewlines, 'text/html');
    return (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
  }
  return withNewlines.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

export function formatScriptForBrief(
  template: CopyTemplate,
  customNote?: string,
  mode: 'all' | 'body' | 'notes' = 'all',
): string {
  const plainBody = stripCopyRichText(template.body);
  const explanation = [template.description?.trim(), customNote?.trim()].filter(Boolean).join('\nCatatan Tambahan: ');
  if (mode === 'body') {
    return `[Naskah: ${template.title}]\n${plainBody}`;
  }
  if (mode === 'notes') {
    return explanation
      ? `[Penjelasan & Arahan Skrip: ${template.title}]\n${explanation}`
      : `[Naskah: ${template.title}]`;
  }
  return [
    `=== LAMPIRAN SKRIP: ${template.title} (${copyFormats[template.format] ?? template.format}) ===`,
    explanation ? `Penjelasan / Arahan Skrip:\n${explanation}` : '',
    `Isi Naskah / Copywriting:\n${plainBody}`,
  ].filter(Boolean).join('\n\n');
}

export function CopyRichTextContent({
  content,
  className = '',
}: {
  content?: string | null;
  className?: string;
}) {
  const html = sanitizeCopyHtml(content);
  return (
    <div
      className={`copy-rich-content leading-relaxed break-words ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const TEXT_COLORS = [
  { label: 'Default', color: '#0f172a', swatch: 'bg-slate-900' },
  { label: 'Merah Penting', color: '#dc2626', swatch: 'bg-red-600' },
  { label: 'Teal Brand', color: '#0f766e', swatch: 'bg-teal-700' },
  { label: 'Biru Visual', color: '#2563eb', swatch: 'bg-blue-600' },
  { label: 'Ungu Kreatif', color: '#7c3aed', swatch: 'bg-violet-600' },
  { label: 'Oranye Penekanan', color: '#ea580c', swatch: 'bg-orange-600' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Kuning Hook', color: '#fef08a', swatch: 'bg-yellow-200 border-yellow-400' },
  { label: 'Hijau CTA', color: '#bbf7d0', swatch: 'bg-green-200 border-green-400' },
  { label: 'Biru Adegan', color: '#bfdbfe', swatch: 'bg-blue-200 border-blue-400' },
  { label: 'Merah Peringatan', color: '#fecaca', swatch: 'bg-red-200 border-red-400' },
];

const FONT_SIZES = [
  { label: 'Kecil', size: '12px', cmdValue: '2' },
  { label: 'Normal', size: '14px', cmdValue: '3' },
  { label: 'Subjudul (L)', size: '18px', cmdValue: '4' },
  { label: 'Judul Besar (XL)', size: '22px', cmdValue: '5' },
];

export function CopyRichTextEditor({
  name,
  defaultValue = '',
  placeholder = 'Tuliskan hook, naskah dialog video, alur adegan, atau caption di sini...',
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const initialHtml = sanitizeCopyHtml(defaultValue);
  const [htmlValue, setHtmlValue] = useState<string>(initialHtml);
  const [sourceMode, setSourceMode] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && !sourceMode && editorRef.current.innerHTML !== htmlValue) {
      editorRef.current.innerHTML = htmlValue;
    }
  }, [sourceMode]);

  function syncFromDom() {
    if (!editorRef.current) return;
    setHtmlValue(sanitizeCopyHtml(editorRef.current.innerHTML));
  }

  function runCommand(command: string, value?: string) {
    if (sourceMode) return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncFromDom();
  }

  function insertSnippet(snippetHtml: string) {
    if (sourceMode) {
      setHtmlValue(prev => `${prev}${prev ? '<br><br>' : ''}${snippetHtml}`);
      return;
    }
    editorRef.current?.focus();
    const inserted = document.execCommand('insertHTML', false, snippetHtml);
    if (!inserted && editorRef.current) {
      editorRef.current.innerHTML += `${editorRef.current.innerHTML ? '<br><br>' : ''}${snippetHtml}`;
    }
    syncFromDom();
  }

  return (
    <div className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-2xs">
      <input type="hidden" name={name} value={htmlValue} />

      {/* Rich Text Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-2.5 py-2 text-xs">
        <span className="inline-flex items-center gap-1 font-bold text-slate-600 mr-1">
          <Type className="w-3.5 h-3.5 text-teal-700" />
          <span>Text Tools:</span>
        </span>

        {/* Bold, Italic, Underline */}
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            title="Tebal (Bold)"
            onClick={() => runCommand('bold')}
            className="inline-flex items-center gap-1 rounded px-2 py-1 font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-800"
          >
            <Bold className="w-3.5 h-3.5" />
            <span>B</span>
          </button>
          <button
            type="button"
            title="Garis Miring (Italic)"
            onClick={() => runCommand('italic')}
            className="inline-flex items-center gap-1 rounded px-2 py-1 italic font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800"
          >
            <Italic className="w-3.5 h-3.5" />
            <span>I</span>
          </button>
          <button
            type="button"
            title="Garis Bawah (Underline)"
            onClick={() => runCommand('underline')}
            className="inline-flex items-center gap-1 rounded px-2 py-1 underline font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-800"
          >
            <Underline className="w-3.5 h-3.5" />
            <span>U</span>
          </button>
        </div>

        {/* Font Size Selector */}
        <label className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700">
          <span>Ukuran:</span>
          <select
            aria-label="Ukuran teks naskah"
            defaultValue="3"
            onChange={e => runCommand('fontSize', e.target.value)}
            className="bg-transparent font-bold text-teal-800 focus:outline-none cursor-pointer"
          >
            {FONT_SIZES.map(item => (
              <option key={item.cmdValue} value={item.cmdValue}>
                {item.label} ({item.size})
              </option>
            ))}
          </select>
        </label>

        {/* Text Color Palette */}
        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
          <Palette className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-600">Warna:</span>
          {TEXT_COLORS.map(item => (
            <button
              key={item.color}
              type="button"
              title={`Warna teks: ${item.label}`}
              onClick={() => runCommand('foreColor', item.color)}
              className={`w-4 h-4 rounded-full border border-white shadow-2xs transition-transform hover:scale-110 ${item.swatch}`}
            />
          ))}
        </div>

        {/* Highlight / Stabilo Palette */}
        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1">
          <Highlighter className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-600">Stabilo:</span>
          {HIGHLIGHT_COLORS.map(item => (
            <button
              key={item.color}
              type="button"
              title={`Stabilo latar: ${item.label}`}
              onClick={() => runCommand('hiliteColor', item.color)}
              className={`w-4 h-4 rounded border transition-transform hover:scale-110 ${item.swatch}`}
            />
          ))}
          <button
            type="button"
            title="Hapus Stabilo"
            onClick={() => runCommand('hiliteColor', 'transparent')}
            className="px-1 text-[10px] font-bold text-slate-500 hover:text-slate-800"
          >
            ×
          </button>
        </div>

        {/* Bullet List & Clear Format */}
        <button
          type="button"
          title="Daftar Poin (Bullet List)"
          onClick={() => runCommand('insertUnorderedList')}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100"
        >
          <List className="w-3.5 h-3.5" />
          <span>Poin</span>
        </button>

        <button
          type="button"
          title="Bersihkan Format pada Teks Terpilih"
          onClick={() => runCommand('removeFormat')}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-600 hover:bg-slate-100"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>Reset Format</span>
        </button>

        <button
          type="button"
          onClick={() => setSourceMode(prev => !prev)}
          className="ml-auto rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
        >
          {sourceMode ? 'Mode Visual' : 'Mode Teks Mentah'}
        </button>
      </div>

      {/* Quick Script Structure Chips */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-teal-50/50 px-2.5 py-1.5 text-[11px]">
        <span className="font-semibold text-teal-900">Sisipkan Struktur Cepat:</span>
        <button
          type="button"
          onClick={() => insertSnippet('<mark style="background-color:#fef08a"><b>[HOOK 0-3 Detik]</b></mark><br>')}
          className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 font-bold text-amber-900 hover:bg-amber-200"
        >
          + [HOOK 0-3s]
        </button>
        <button
          type="button"
          onClick={() => insertSnippet('<span style="color:#2563eb"><b>[ADEGAN / VISUAL]</b></span><br>')}
          className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-bold text-blue-800 hover:bg-blue-100"
        >
          + [ADEGAN VISUAL]
        </button>
        <button
          type="button"
          onClick={() => insertSnippet('<b>[DIALOG / VOICE OVER]</b><br>')}
          className="rounded-full border border-slate-300 bg-white px-2 py-0.5 font-bold text-slate-700 hover:bg-slate-100"
        >
          + [DIALOG / INTI]
        </button>
        <button
          type="button"
          onClick={() => insertSnippet('<mark style="background-color:#bbf7d0"><span style="color:#0f766e"><b>[CTA / AJAKAN]</b></span></mark><br>')}
          className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 font-bold text-emerald-900 hover:bg-emerald-200"
        >
          + [CTA]
        </button>
      </div>

      {/* Editable Content Surface */}
      {sourceMode ? (
        <textarea
          value={stripCopyRichText(htmlValue)}
          onChange={e => setHtmlValue(sanitizeCopyHtml(e.target.value))}
          rows={8}
          placeholder={placeholder}
          className="w-full p-3.5 text-sm font-mono text-slate-800 focus:outline-none"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncFromDom}
          onBlur={syncFromDom}
          data-placeholder={placeholder}
          className="min-h-[190px] max-h-[380px] overflow-y-auto p-3.5 text-sm leading-relaxed text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      )}
    </div>
  );
}

type ViewerDisplayMode = 'pdf' | 'teleprompter';
type PdfZoomLevel = '90' | '100' | '115' | '130';
type ReaderTheme = 'light' | 'sepia' | 'studio';
type ReaderFontSize = 'sm' | 'md' | 'lg' | 'xl';

const PDF_ZOOM_CLASS: Record<PdfZoomLevel, { label: string; textClass: string; maxWidth: string }> = {
  '90': { label: '90%', textClass: 'text-[14px] leading-[1.75]', maxWidth: 'max-w-[680px]' },
  '100': { label: '100% (A4 Standar)', textClass: 'text-[15.5px] leading-[1.8]', maxWidth: 'max-w-[760px]' },
  '115': { label: '115% (Nyaman)', textClass: 'text-[17.5px] leading-[1.85]', maxWidth: 'max-w-[840px]' },
  '130': { label: '130% (Besar)', textClass: 'text-[20px] leading-[1.9]', maxWidth: 'max-w-[920px]' },
};

const READER_FONT_CLASS: Record<ReaderFontSize, { label: string; bodyClass: string }> = {
  sm: { label: 'A- (14px)', bodyClass: 'text-sm leading-relaxed' },
  md: { label: 'A Normal (16px)', bodyClass: 'text-base leading-relaxed' },
  lg: { label: 'A+ Nyaman (20px)', bodyClass: 'text-xl leading-loose' },
  xl: { label: 'Teleprompter (26px)', bodyClass: 'text-2xl sm:text-[26px] leading-loose font-medium' },
};

const READER_THEME_CLASS: Record<ReaderTheme, { label: string; paper: string; card: string }> = {
  light: {
    label: 'Terang Bersih',
    paper: 'bg-white text-slate-900 border-slate-200',
    card: 'bg-slate-50 border-slate-200 text-slate-800',
  },
  sepia: {
    label: 'Hangat Nyaman',
    paper: 'bg-amber-50/70 text-stone-900 border-amber-200',
    card: 'bg-amber-100/60 border-amber-300 text-stone-900',
  },
  studio: {
    label: 'Gelap Studio',
    paper: 'bg-slate-900 text-slate-100 border-slate-700',
    card: 'bg-slate-800 border-slate-700 text-slate-200',
  },
};

export function openPrintableScriptPdf(template: CopyTemplate) {
  if (typeof window === 'undefined') return;
  const plainWords = stripCopyRichText(template.body).split(/\s+/).filter(Boolean).length;
  const estSeconds = Math.max(5, Math.round((plainWords / 130) * 60));
  const safeBodyHtml = sanitizeCopyHtml(template.body);
  const safeTitle = escapeHtml(template.title);
  const safeDesc = template.description?.trim() ? escapeHtml(template.description.trim()).replace(/\r?\n/g, '<br>') : '';
  const formatName = escapeHtml(copyFormats[template.format] ?? template.format);
  const outputName = escapeHtml(outputTypes[template.output_type] ?? template.output_type);
  const platformName = escapeHtml(template.platform ? (platforms[template.platform] ?? template.platform) : 'Semua Platform');
  const updatedDate = escapeHtml(template.updated_at.slice(0, 10));

  const htmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Naskah PDF - ${safeTitle}</title>
  <style>
    @page { size: A4 portrait; margin: 16mm 18mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 28px 16px;
      background: #323639;
      font-family: 'Segoe UI', Inter, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      max-width: 210mm;
      margin: 0 auto 16px auto;
      background: #1e293b;
      color: #f8fafc;
      padding: 10px 16px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
    }
    .toolbar button {
      background: #0f766e;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
    }
    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 20mm 18mm;
      box-shadow: 0 16px 48px rgba(0,0,0,0.45);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .doc-header {
      border-bottom: 2px solid #0f766e;
      padding-bottom: 14px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .eyebrow {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #0f766e;
      margin-bottom: 4px;
    }
    .doc-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.3;
    }
    .doc-meta-badge {
      text-align: right;
      font-size: 11px;
      color: #475569;
      white-space: nowrap;
    }
    .spec-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .spec-item span {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      font-weight: 700;
    }
    .spec-item strong {
      color: #0f172a;
      font-size: 12.5px;
    }
    .section-box {
      border: 1px solid #cbd5e1;
      border-left: 4px solid #0f766e;
      background: #f0fdfa;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 22px;
    }
    .section-label {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0f766e;
      margin-bottom: 6px;
    }
    .script-box {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 20px 22px;
      font-size: 15.5px;
      line-height: 1.85;
      color: #0f172a;
      background: #ffffff;
    }
    .doc-footer {
      margin-top: 28px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .toolbar { display: none !important; }
      .sheet { width: 100%; min-height: auto; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div><strong>📄 Pratinjau Dokumen PDF (A4)</strong> · Pilih "Save as PDF" / "Simpan sebagai PDF" pada dialog cetak</div>
    <button onclick="window.print()">🖨️ Cetak / Simpan File PDF</button>
  </div>
  <div class="sheet">
    <div>
      <div class="doc-header">
        <div>
          <div class="eyebrow">GG WORKSPACE · DOKUMEN NASKAH &amp; COPYWRITING</div>
          <h1 class="doc-title">${safeTitle}</h1>
        </div>
        <div class="doc-meta-badge">
          <div><strong>Tanggal:</strong> ${updatedDate}</div>
          <div><strong>Panjang:</strong> ${plainWords} kata (±${estSeconds} dtk)</div>
        </div>
      </div>
      <div class="spec-grid">
        <div class="spec-item"><span>Format Naskah</span><strong>${formatName}</strong></div>
        <div class="spec-item"><span>Tipe Output</span><strong>${outputName}</strong></div>
        <div class="spec-item"><span>Platform Target</span><strong>${platformName}</strong></div>
        <div class="spec-item"><span>Estimasi Durasi</span><strong>± ${estSeconds} Detik Bicara</strong></div>
      </div>
      ${safeDesc ? `
      <div class="section-box">
        <div class="section-label">I. Penjelasan Skrip / Arahan Brief &amp; Konteks Penggunaan</div>
        <div style="font-size:13.5px;line-height:1.65;color:#1e293b;">${safeDesc}</div>
      </div>
      ` : ''}
      <div>
        <div class="section-label" style="margin-bottom:8px;">${safeDesc ? 'II.' : 'I.'} Isi Naskah / Copywriting / Skrip Produksi</div>
        <div class="script-box">${safeBodyHtml}</div>
      </div>
    </div>
    <div class="doc-footer">
      <span>Dokumen Naskah Produksi Kreatif · GG Workspace</span>
      <span>Halaman 1 / 1</span>
    </div>
  </div>
  <script>setTimeout(() => { window.print(); }, 250);</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(htmlDoc);
    win.document.close();
  }
}

export function CopyScriptViewerModal({
  template,
  onClose,
  onEdit,
  onUseForIdea,
}: {
  template: CopyTemplate;
  onClose: () => void;
  onEdit?: (template: CopyTemplate) => void;
  onUseForIdea?: (template: CopyTemplate) => void;
}) {
  const [displayMode, setDisplayMode] = useState<ViewerDisplayMode>('pdf');
  const [pdfZoom, setPdfZoom] = useState<PdfZoomLevel>('100');
  const [fontSize, setFontSize] = useState<ReaderFontSize>('lg');
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('light');
  const [wideMode, setWideMode] = useState(true);
  const [copiedMode, setCopiedMode] = useState<'plain' | 'full' | null>(null);

  const plainText = stripCopyRichText(template.body);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const lineCount = plainText ? plainText.split(/\r?\n/).filter(Boolean).length : 0;
  const estSeconds = Math.max(5, Math.round((wordCount / 130) * 60));
  const pdfSlug = template.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 36) || 'naskah_skrip';

  function copyContent(mode: 'plain' | 'full') {
    const text = mode === 'plain'
      ? plainText
      : formatScriptForBrief(template, undefined, 'all');
    void navigator.clipboard?.writeText(text);
    setCopiedMode(mode);
    setTimeout(() => setCopiedMode(null), 1800);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs p-2 sm:p-5 flex items-center justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="script-viewer-title"
    >
      <div
        className={`w-full ${wideMode ? 'max-w-5xl' : 'max-w-3xl'} max-h-[calc(100vh-1.5rem)] flex flex-col rounded-3xl border border-slate-300 bg-white shadow-2xl overflow-hidden transition-all`}
      >
        {/* Top Modal Header with PDF vs Teleprompter Mode Switch */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 text-white px-5 py-3.5">
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white">
                <FileText className="w-3 h-3" />
                PDF SCRIPT VIEWER
              </span>
              <span className="text-xs font-mono text-slate-300 truncate">
                {pdfSlug}.pdf
              </span>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[11px] font-semibold text-teal-300">
                {wordCount} kata · ±{estSeconds} dtk bicara
              </span>
            </div>
            <h2 id="script-viewer-title" className="text-base sm:text-lg font-extrabold text-white break-words">
              {template.title}
            </h2>
          </div>

          {/* Mode Switcher: Mode Dokumen PDF vs Mode Teleprompter */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setDisplayMode('pdf')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-colors ${
                  displayMode === 'pdf'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📄 Mode Dokumen PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('teleprompter')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-colors ${
                  displayMode === 'teleprompter'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>🎬 Mode Teleprompter</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => openPrintableScriptPdf(template)}
              title="Cetak atau Simpan Naskah sebagai File .PDF (A4)"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-extrabold text-white shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Download PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setWideMode(w => !w)}
              title={wideMode ? 'Perkecil Jendela' : 'Perlebar Jendela'}
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              {wideMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup mode lihat naskah"
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-Toolbar: PDF Zoom Bar OR Teleprompter Controls */}
        {displayMode === 'pdf' ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 bg-[#282c2f] text-slate-200 px-5 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-700 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                Halaman 1 / 1 · Kertas A4
              </span>
              <span className="hidden sm:inline text-slate-400">
                Format: <strong className="text-slate-200">{copyFormats[template.format] ?? template.format}</strong> · Output: <strong className="text-slate-200">{outputTypes[template.output_type] ?? template.output_type}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-semibold text-slate-300 mr-1">Zoom Kertas PDF:</span>
              {(Object.keys(PDF_ZOOM_CLASS) as PdfZoomLevel[]).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPdfZoom(level)}
                  className={`rounded px-2 py-0.5 font-bold transition-colors ${
                    pdfZoom === level
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {PDF_ZOOM_CLASS[level].label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-5 py-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-slate-500 mr-1">Ukuran Teks Baca:</span>
              {(Object.keys(READER_FONT_CLASS) as ReaderFontSize[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFontSize(key)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition-colors ${
                    fontSize === key
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {READER_FONT_CLASS[key].label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-slate-500 mr-1">Tema Layar:</span>
              {(Object.keys(READER_THEME_CLASS) as ReaderTheme[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setReaderTheme(key)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition-colors ${
                    readerTheme === key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {READER_THEME_CLASS[key].label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Viewer Body */}
        {displayMode === 'pdf' ? (
          /* AUTHENTIC A4 PDF VIEWER SURFACE */
          <div className="flex-1 overflow-y-auto bg-[#323639] p-4 sm:p-8">
            <article
              aria-label="Lembar Dokumen PDF Naskah"
              className={`mx-auto w-full ${PDF_ZOOM_CLASS[pdfZoom].maxWidth} min-h-[680px] flex flex-col justify-between rounded-sm border border-slate-300 bg-white text-slate-900 shadow-[0_14px_44px_rgba(0,0,0,0.55)] p-6 sm:p-12 transition-all`}
            >
              <div className="space-y-6">
                {/* Kop Dokumen Resmi PDF */}
                <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-teal-800 pb-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-teal-800">
                      GG WORKSPACE · DOKUMEN NASKAH &amp; SKRIP PRODUKSI
                    </p>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug break-words">
                      {template.title}
                    </h3>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right text-[11px] text-slate-600 shrink-0">
                    <div className="font-bold text-slate-900">LEMBAR NASKAH A4</div>
                    <div>Diperbarui: {template.updated_at.slice(0, 10)}</div>
                    <div>{wordCount} kata · {lineCount} baris</div>
                  </div>
                </header>

                {/* Tabel Spesifikasi / Metadata Naskah */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-lg border border-slate-300 bg-slate-50/90 p-3 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Format Naskah</span>
                    <strong className="text-slate-900 font-bold">{copyFormats[template.format] ?? template.format}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Tipe Output</span>
                    <strong className="text-slate-900 font-bold">{outputTypes[template.output_type] ?? template.output_type}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Platform Target</span>
                    <strong className="text-slate-900 font-bold">
                      {template.platform ? (platforms[template.platform] ?? template.platform) : 'Semua Platform'}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimasi Durasi Bicara</span>
                    <strong className="text-teal-800 font-extrabold">± {estSeconds} Detik</strong>
                  </div>
                </div>

                {/* Bagian I: Penjelasan Skrip & Arahan Brief */}
                <section className="rounded-lg border border-teal-200 border-l-4 border-l-teal-700 bg-teal-50/50 p-4 space-y-1.5">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-teal-900">
                    I. Penjelasan Skrip / Arahan Brief &amp; Konteks Penggunaan
                  </div>
                  {template.description?.trim() ? (
                    <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
                      {template.description}
                    </p>
                  ) : (
                    <p className="text-xs italic text-slate-500">
                      Tidak ada catatan penjelasan tambahan pada skrip ini.
                    </p>
                  )}
                </section>

                {/* Bagian II: Isi Naskah / Copywriting */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      II. Isi Naskah / Copywriting / Skrip Produksi
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      Siap Baca &amp; Eksekusi
                    </span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xs">
                    <CopyRichTextContent
                      content={template.body}
                      className={`${PDF_ZOOM_CLASS[pdfZoom].textClass} text-slate-900`}
                    />
                  </div>
                </section>
              </div>

              {/* Footer Halaman Kertas A4 */}
              <footer className="mt-10 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <span>Dokumen Naskah Produksi Kreatif · GG Workspace</span>
                <span>Halaman 1 dari 1</span>
              </footer>
            </article>
          </div>
        ) : (
          /* TELEPROMPTER / STUDIO READER VIEW */
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 bg-slate-100/70">
            <div className={`rounded-2xl border p-4 space-y-1.5 ${READER_THEME_CLASS[readerTheme].card}`}>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-teal-700">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Penjelasan Skrip / Arahan Brief &amp; Konteks Penggunaan</span>
              </div>
              {template.description?.trim() ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {template.description}
                </p>
              ) : (
                <p className="text-xs italic opacity-75">
                  Belum ada catatan penjelasan khusus untuk skrip ini.
                </p>
              )}
            </div>

            <div className={`rounded-2xl border p-6 sm:p-8 shadow-xs ${READER_THEME_CLASS[readerTheme].paper}`}>
              <div className="mb-3 pb-2 border-b border-current/10 flex items-center justify-between text-xs opacity-65">
                <span className="font-bold uppercase tracking-wider">Isi Naskah / Copywriting</span>
                <span>Terakhir diperbarui: {template.updated_at.slice(0, 10)}</span>
              </div>
              <CopyRichTextContent
                content={template.body}
                className={READER_FONT_CLASS[fontSize].bodyClass}
              />
            </div>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copyContent('plain')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              {copiedMode === 'plain' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedMode === 'plain' ? 'Naskah Tersalin!' : 'Salin Naskah Bersih'}</span>
            </button>
            <button
              type="button"
              onClick={() => copyContent('full')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-900 hover:bg-teal-100"
            >
              {copiedMode === 'full' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedMode === 'full' ? 'Naskah + Penjelasan Tersalin!' : 'Salin Naskah + Penjelasan'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onUseForIdea && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUseForIdea(template);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-900 hover:bg-teal-100"
              >
                <Sparkles className="w-4 h-4" />
                <span>+ Buat Ide dari Skrip Ini</span>
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(template);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 px-4 py-2 text-xs font-bold text-white hover:bg-teal-900"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Naskah &amp; Format</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
            >
              <span>Tutup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OpenScriptReaderButton({
  onClick,
  label = 'Mode PDF / Lihat',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900 hover:bg-teal-100 transition-colors"
    >
      <Eye className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
