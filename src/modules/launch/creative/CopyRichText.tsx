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
  Sparkles,
  Type,
  Underline,
  X,
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

type ReaderTheme = 'light' | 'sepia' | 'studio';
type ReaderFontSize = 'sm' | 'md' | 'lg' | 'xl';

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
  const [fontSize, setFontSize] = useState<ReaderFontSize>('md');
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('light');
  const [wideMode, setWideMode] = useState(false);
  const [copiedMode, setCopiedMode] = useState<'plain' | 'full' | null>(null);

  function copyContent(mode: 'plain' | 'full') {
    const text = mode === 'plain'
      ? stripCopyRichText(template.body)
      : formatScriptForBrief(template, undefined, 'all');
    void navigator.clipboard?.writeText(text);
    setCopiedMode(mode);
    setTimeout(() => setCopiedMode(null), 1800);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs p-3 sm:p-6 flex items-center justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="script-viewer-title"
    >
      <div
        className={`w-full ${wideMode ? 'max-w-5xl' : 'max-w-3xl'} max-h-[calc(100vh-2rem)] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden transition-all`}
      >
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-extrabold text-teal-900">
                <BookOpen className="w-3.5 h-3.5" />
                Mode Lihat &amp; Baca Naskah
              </span>
              <span className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                {copyFormats[template.format] ?? template.format}
              </span>
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                Output: {outputTypes[template.output_type] ?? template.output_type}
              </span>
              {template.platform && (
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                  {platforms[template.platform] ?? template.platform}
                </span>
              )}
            </div>
            <h2 id="script-viewer-title" className="text-lg sm:text-xl font-extrabold text-slate-900 break-words">
              {template.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setWideMode(w => !w)}
              title={wideMode ? 'Ukuran Fokus Baca' : 'Perlebar Layar Baca'}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {wideMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{wideMode ? 'Fokus' : 'Lebar'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup mode lihat naskah"
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader Comfort Controls Bar */}
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

        {/* Scrollable Reader Sheet */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 bg-slate-100/70">
          {/* Script Explanation / Guidance Box */}
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
                Belum ada catatan penjelasan khusus untuk skrip ini. Klik &ldquo;Edit Naskah&rdquo; untuk menambahkan arahan intonasi, visual adegan, atau konteks brief.
              </p>
            )}
          </div>

          {/* Main Formatted Script Sheet */}
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
  label = 'Mode Lihat',
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
