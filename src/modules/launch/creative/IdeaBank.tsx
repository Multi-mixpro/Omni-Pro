import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Copy, Eye, ExternalLink, FileText, Info, Lightbulb, Link2, Plus, RefreshCw, Search, Sparkles, Trash2 } from 'lucide-react';
import { useWorkspaceUnits } from '../data/businessWorkspace';
import { CopyRichTextContent, CopyScriptViewerModal, stripCopyRichText } from './CopyRichText';
import { button, CopyTemplateForm, errorText, field, IdeaForm, Options, primary } from './CreativeForms';
import {
  copyFormats,
  copyTemplates,
  deleteCopyTemplate,
  deleteIdea,
  getIdeaAttachedScript,
  ideas,
  ideaQueues,
  isDemoText,
  outputTypes,
  PAGE_SIZE,
  platforms,
  purgeCreativeDemoData,
  safeOutputUrl,
  taskStatuses,
  type CopyTemplate,
  type Idea,
} from './repository';

export function ReferenceLinks({ urls }: { urls: string[] }) {
  const links = [...new Set(urls.map(safeOutputUrl).filter(Boolean))];
  if (!links.length) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {links.map((url, index) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-teal-800 underline">
            <span>Referensi {index + 1} · {new URL(url).hostname}</span>
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

type IdeaBankTab = 'ideas' | 'scripts' | 'references';
type IdeaSortOrder = 'newest' | 'unit_asc' | 'unit_desc' | 'title_asc';

export function IdeaBank({ userId, canEdit, onConvert, unit }: { userId: string; canEdit: boolean; onConvert: (idea: Idea) => void; unit: string }) {
  const client = useQueryClient();
  const units = useWorkspaceUnits();
  const [activeTab, setActiveTab] = useState<IdeaBankTab>('ideas');
  const [sortBy, setSortBy] = useState<IdeaSortOrder>('newest');
  const [page, setPage] = useState(0);
  const [priority, setPriority] = useState(false);
  const [queue, setQueue] = useState('');
  const [searchIdea, setSearchIdea] = useState('');
  const [editor, setEditor] = useState<Idea | 'new' | null>(null);
  const [initialScriptForIdea, setInitialScriptForIdea] = useState<CopyTemplate | undefined>(undefined);
  const [editingTemplate, setEditingTemplate] = useState<CopyTemplate | 'new' | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<CopyTemplate | null>(null);
  const [scriptSearch, setScriptSearch] = useState('');
  const [scriptFormatFilter, setScriptFormatFilter] = useState('');
  const [scriptOutputFilter, setScriptOutputFilter] = useState('');
  const [referencePlatformFilter, setReferencePlatformFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const query = useQuery({
    queryKey: ['creative', userId, 'ideas', unit, page, priority, queue],
    queryFn: ({ signal }) => ideas(page, priority, queue, signal, unit),
  });

  const templatesQuery = useQuery({
    queryKey: ['creative-copy-library', unit],
    queryFn: ({ signal }) => copyTemplates(signal, unit),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const removeIdeaMutation = useMutation({
    mutationFn: (id: string) => deleteIdea(id),
    onSuccess: () => {
      setNotice('Ide dihapus dari daftar.');
      void client.invalidateQueries({ queryKey: ['creative', userId, 'ideas'] });
    },
  });

  const removeTemplateMutation = useMutation({
    mutationFn: (id: string) => deleteCopyTemplate(id),
    onSuccess: () => {
      setNotice('Naskah dihapus dari Bank Copywriting.');
      void client.invalidateQueries({ queryKey: ['creative-copy-library'] });
    },
  });

  const purgeDemoMutation = useMutation({
    mutationFn: () => purgeCreativeDemoData(),
    onSuccess: () => {
      setNotice('Seluruh data demo/dummy berhasil dibersihkan.');
      void client.invalidateQueries({ queryKey: ['creative'] });
    },
  });

  const saved = () => {
    setEditor(null);
    setInitialScriptForIdea(undefined);
    setPage(0);
    setNotice('Ide beserta lampiran naskah tersimpan.');
    void client.invalidateQueries({ queryKey: ['creative', userId, 'ideas'] });
    void client.invalidateQueries({ queryKey: ['creative', userId, 'tasks'] });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  };

  const unitLabel = (id?: string | null) =>
    id ? units.data?.find(row => row.id === id)?.name ?? 'Unit bisnis' : 'Semua unit / Umum';

  const unitSortKey = (id?: string | null) =>
    id ? (units.data?.find(row => row.id === id)?.name ?? 'zzz').toLowerCase() : 'zzz_umum';

  const compareBySortOrder = (
    unitA: string | null | undefined,
    unitB: string | null | undefined,
    titleA: string,
    titleB: string,
  ) => {
    if (sortBy === 'unit_asc') {
      const cmp = unitSortKey(unitA).localeCompare(unitSortKey(unitB), 'id');
      return cmp !== 0 ? cmp : titleA.localeCompare(titleB, 'id');
    }
    if (sortBy === 'unit_desc') {
      const cmp = unitSortKey(unitB).localeCompare(unitSortKey(unitA), 'id');
      return cmp !== 0 ? cmp : titleA.localeCompare(titleB, 'id');
    }
    if (sortBy === 'title_asc') {
      return titleA.localeCompare(titleB, 'id');
    }
    return 0;
  };

  const ideaRows = (query.data ?? [])
    .filter(item => {
      if (!searchIdea.trim()) return true;
      const q = searchIdea.trim().toLowerCase();
      return item.title.toLowerCase().includes(q) || item.brief.toLowerCase().includes(q);
    })
    .sort((a, b) => compareBySortOrder(a.business_unit_id, b.business_unit_id, a.title, b.title));

  const hasDemoIdeas = (query.data ?? []).some(item => isDemoText(item.title));

  const templateMap = new Map((templatesQuery.data ?? []).map(tpl => [tpl.id, tpl]));

  const filteredTemplates = (templatesQuery.data ?? [])
    .filter(tpl => {
      if (scriptFormatFilter && tpl.format !== scriptFormatFilter) return false;
      if (scriptOutputFilter && tpl.output_type !== scriptOutputFilter) return false;
      if (scriptSearch.trim()) {
        const q = scriptSearch.trim().toLowerCase();
        const plainBody = stripCopyRichText(tpl.body).toLowerCase();
        const desc = (tpl.description ?? '').toLowerCase();
        if (!tpl.title.toLowerCase().includes(q) && !plainBody.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => compareBySortOrder(a.business_unit_id, b.business_unit_id, a.title, b.title));

  const referenceEntries = (query.data ?? [])
    .flatMap(idea => {
      const validUrls = [...new Set((idea.reference_urls ?? []).map(safeOutputUrl).filter(Boolean))];
      return validUrls.map((url, idx) => {
        let hostname = url;
        try {
          hostname = new URL(url).hostname.replace(/^www\./, '');
        } catch { /* ignore */ }
        return {
          key: `${idea.id}-${idx}`,
          url,
          hostname,
          idea,
        };
      });
    })
    .filter(entry => !referencePlatformFilter || entry.idea.platform === referencePlatformFilter || entry.idea.additional_platforms?.includes(referencePlatformFilter as Idea['platform']))
    .sort((a, b) => compareBySortOrder(a.idea.business_unit_id, b.idea.business_unit_id, a.idea.title, b.idea.title));

  return (
    <div className="space-y-4">
      {/* Sub-navigation Tabs for Bank Ide */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-100 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Menu Bank Ide">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ideas'}
            aria-pressed={activeTab === 'ideas'}
            className={`${activeTab === 'ideas' ? primary : button} inline-flex items-center gap-1.5`}
            onClick={() => { setActiveTab('ideas'); setNotice(''); }}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Ide Konten</span>
            {query.data && query.data.length > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                activeTab === 'ideas' ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-800'
              }`}>
                {query.data.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'scripts'}
            aria-pressed={activeTab === 'scripts'}
            className={`${activeTab === 'scripts' ? primary : button} inline-flex items-center gap-1.5`}
            onClick={() => { setActiveTab('scripts'); setNotice(''); }}
          >
            <Bookmark className="w-4 h-4" />
            <span>List Copywriting &amp; Skrip (Tabel)</span>
            {templatesQuery.data && templatesQuery.data.length > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                activeTab === 'scripts' ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-800'
              }`}>
                {templatesQuery.data.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'references'}
            aria-pressed={activeTab === 'references'}
            className={`${activeTab === 'references' ? primary : button} inline-flex items-center gap-1.5`}
            onClick={() => { setActiveTab('references'); setNotice(''); }}
          >
            <Link2 className="w-4 h-4" />
            <span>Referensi Bank Ide</span>
            {referenceEntries.length > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                activeTab === 'references' ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-800'
              }`}>
                {referenceEntries.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && hasDemoIdeas && (
            <button
              type="button"
              disabled={purgeDemoMutation.isPending}
              className={`${button} !text-rose-700 hover:!bg-rose-50 inline-flex items-center gap-1.5`}
              onClick={() => {
                if (confirm('Bersihkan seluruh ide dan tugas [DEMO] dari ruang kerja?')) {
                  purgeDemoMutation.mutate();
                }
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{purgeDemoMutation.isPending ? 'Membersihkan…' : 'Bersihkan Data Demo'}</span>
            </button>
          )}
          {canEdit && activeTab === 'ideas' && (
            <button
              type="button"
              className={`${primary} inline-flex items-center gap-1.5`}
              onClick={() => {
                setInitialScriptForIdea(undefined);
                setEditor('new');
                setNotice('');
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Tambah ide</span>
            </button>
          )}
          {canEdit && activeTab === 'scripts' && !editingTemplate && (
            <button
              type="button"
              className={`${primary} inline-flex items-center gap-1.5`}
              onClick={() => {
                setEditingTemplate('new');
                setNotice('');
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Copy / Skrip</span>
            </button>
          )}
          {canEdit && activeTab === 'references' && (
            <button
              type="button"
              className={`${primary} inline-flex items-center gap-1.5`}
              onClick={() => {
                setInitialScriptForIdea(undefined);
                setEditor('new');
                setActiveTab('ideas');
                setNotice('');
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Ide &amp; Referensi</span>
            </button>
          )}
        </div>
      </div>

      {notice && <p role="status" className="rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-sm font-semibold text-teal-800">{notice}</p>}

      {/* TAB 1: DAFTAR IDE KONTEN */}
      {activeTab === 'ideas' && (
        <section className="space-y-4 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm" aria-labelledby="idea-bank-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="idea-bank-heading" className="text-lg font-bold">Bank Ide &amp; Perencanaan Konten</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Kumpulkan ide konten, lampirkan naskah copywriting/skrip dari tabel Bank Copy, lalu jadikan tugas produksi untuk tim.
              </p>
            </div>
          </div>

          {editor && canEdit && (
            <IdeaForm
              key={editor === 'new' ? `new-${initialScriptForIdea?.id ?? ''}` : editor.id}
              idea={editor === 'new' ? undefined : editor}
              initialTemplate={editor === 'new' ? initialScriptForIdea : undefined}
              defaultUnit={unit === 'all' || unit === 'unassigned' ? undefined : unit}
              onCancel={() => {
                setEditor(null);
                setInitialScriptForIdea(undefined);
              }}
              onSaved={saved}
            />
          )}

          <div className="flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-3">
            <label className="min-w-[200px] flex-1 text-xs font-semibold text-slate-700">
              Cari judul / catatan ide
              <div className="relative mt-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  className={`${field} !pl-8`}
                  placeholder="Ketik kata kunci ide…"
                  value={searchIdea}
                  onChange={e => setSearchIdea(e.target.value)}
                />
              </div>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Antrean
              <select className={`${field} mt-1`} value={queue} onChange={event => { setQueue(event.target.value); setPage(0); }}>
                <option value="">Semua ide</option>
                <Options values={ideaQueues} />
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Urutkan
              <select className={`${field} mt-1`} value={sortBy} onChange={event => setSortBy(event.target.value as IdeaSortOrder)}>
                <option value="newest">Terbaru</option>
                <option value="unit_asc">Unit Bisnis (A → Z)</option>
                <option value="unit_desc">Unit Bisnis (Z → A)</option>
                <option value="title_asc">Judul (A → Z)</option>
              </select>
            </label>
            <label className="inline-flex min-h-[38px] items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={priority} onChange={event => { setPriority(event.target.checked); setPage(0); }} />
              <span>Hanya ide prioritas</span>
            </label>
          </div>

          {query.isPending && <p role="status" className="text-sm text-slate-600">Memuat ide…</p>}
          {query.error && <p role="alert" className="text-sm text-red-700">Ide belum dapat dimuat: {errorText(query.error)}</p>}
          {query.isSuccess && !ideaRows.length && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">Belum ada ide pada filter ini.</p>}

          <ul className="divide-y divide-slate-200">
            {ideaRows.slice(0, PAGE_SIZE).map(idea => {
              const attachedScriptId = getIdeaAttachedScript(idea.id);
              const attachedScript = attachedScriptId ? templateMap.get(attachedScriptId) : undefined;
              return (
                <li key={idea.id} className="flex flex-wrap justify-between gap-3 py-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="break-words font-bold text-slate-900">{idea.title}</h3>
                      {idea.prioritized && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">Prioritas</span>
                      )}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {idea.task ? 'Tugas: ' + taskStatuses[idea.task.status] : ideaQueues[idea.queue_state]}
                      </span>
                      {attachedScript && (
                        <button
                          type="button"
                          onClick={() => setViewingTemplate(attachedScript)}
                          title="Buka Mode Lihat Nyaman untuk naskah ini"
                          className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
                        >
                          <FileText size={12} />
                          <span>Naskah: {attachedScript.title}</span>
                          <Eye size={11} className="ml-0.5 opacity-80" />
                        </button>
                      )}
                    </div>
                    {unit === 'all' && (
                      <p className="text-xs font-medium text-slate-600">
                        {units.data?.find(row => row.id === idea.business_unit_id)?.name ?? 'Unit belum ditetapkan'}
                      </p>
                    )}
                    <p className="text-sm text-slate-600">
                      Platform: {[idea.platform, ...(idea.additional_platforms ?? [])].map(platform => platforms[platform]).join(', ')}
                    </p>
                    {idea.brief && <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{idea.brief}</p>}
                    {attachedScript && (
                      <details className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                        <summary className="cursor-pointer font-bold text-teal-800">
                          Lihat Lampiran Skrip ({copyFormats[attachedScript.format] ?? attachedScript.format} · {outputTypes[attachedScript.output_type] ?? attachedScript.output_type})
                        </summary>
                        <div className="mt-2.5 space-y-2">
                          {attachedScript.description && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1.5 text-xs text-amber-950">
                              <strong className="inline-flex items-center gap-1 font-bold text-amber-900">
                                <Info className="w-3.5 h-3.5" /> Penjelasan Skrip:
                              </strong>
                              <p className="mt-0.5 whitespace-pre-wrap">{attachedScript.description}</p>
                            </div>
                          )}
                          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                            <CopyRichTextContent content={attachedScript.body} className="text-xs text-slate-800" />
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setViewingTemplate(attachedScript)}
                              className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100"
                            >
                              <Eye size={12} />
                              <span>Buka Mode Lihat Nyaman / Teleprompter</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(stripCopyRichText(attachedScript.body), `idea-tpl-${idea.id}`)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              <Copy size={12} />
                              <span>{copiedId === `idea-tpl-${idea.id}` ? 'Tersalin!' : 'Salin Naskah'}</span>
                            </button>
                          </div>
                        </div>
                      </details>
                    )}
                    <ReferenceLinks urls={idea.reference_urls} />
                  </div>
                  {canEdit && (
                    <div className="flex flex-wrap items-start gap-2">
                      <button
                        type="button"
                        className={button}
                        onClick={() => {
                          setEditor(idea);
                          setNotice('');
                          document.getElementById('idea-bank-heading')?.scrollIntoView({ block: 'start' });
                        }}
                      >
                        Edit ide
                      </button>
                      {!idea.task && idea.queue_state === 'ready' && (
                        <button type="button" className={primary} onClick={() => onConvert(idea)}>
                          Jadikan tugas
                        </button>
                      )}
                      <button
                        type="button"
                        className={`${button} !text-red-700 hover:!bg-red-50 inline-flex items-center gap-1`}
                        title="Hapus ide ini"
                        aria-label={`Hapus ${idea.title}`}
                        onClick={() => {
                          if (confirm(`Hapus ide "${idea.title}" dari Bank Ide?`)) {
                            removeIdeaMutation.mutate(idea.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {(page > 0 || (query.data?.length ?? 0) > PAGE_SIZE) && (
            <div className="flex flex-wrap items-center gap-2">
              <button className={button} disabled={page === 0} onClick={() => setPage(page - 1)}>Sebelumnya</button>
              <span className="text-sm">Halaman {page + 1}</span>
              <button className={button} disabled={(query.data?.length ?? 0) <= PAGE_SIZE} onClick={() => setPage(page + 1)}>Berikutnya</button>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: LIST NASKAH & COPYWRITING (TABEL) */}
      {activeTab === 'scripts' && (
        <section className="space-y-4 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm" aria-label="List Tabel Copywriting dan Skrip Naskah">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Daftar Tabel Copywriting &amp; Bank Skrip Naskah</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Simpan dan kelola daftar naskah copywriting, hook video, skrip 30-60 detik, dan caption dalam tampilan tabel. Lampirkan langsung ke Ide atau Tugas Baru.
              </p>
            </div>
          </div>

          {editingTemplate && canEdit && (
            <CopyTemplateForm
              template={editingTemplate === 'new' ? undefined : editingTemplate}
              defaultUnit={unit === 'all' || unit === 'unassigned' ? undefined : unit}
              onCancel={() => setEditingTemplate(null)}
              onSaved={() => {
                setEditingTemplate(null);
                setNotice('Naskah copywriting berhasil disimpan ke daftar tabel.');
                void client.invalidateQueries({ queryKey: ['creative-copy-library'] });
              }}
            />
          )}

          {/* Filter Bar for Copywriting Table */}
          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-end">
            <div className="grid grid-cols-1 gap-3 flex-1 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-semibold text-slate-700">
                Cari judul / isi skrip
                <div className="relative mt-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    className={`${field} !pl-8`}
                    placeholder="Cari hook, skrip, caption…"
                    value={scriptSearch}
                    onChange={e => setScriptSearch(e.target.value)}
                  />
                </div>
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Filter format naskah
                <select className={`${field} mt-1`} value={scriptFormatFilter} onChange={e => setScriptFormatFilter(e.target.value)}>
                  <option value="">Semua format naskah</option>
                  <Options values={copyFormats} />
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Filter tipe output
                <select className={`${field} mt-1`} value={scriptOutputFilter} onChange={e => setScriptOutputFilter(e.target.value)}>
                  <option value="">Semua tipe output</option>
                  <Options values={outputTypes} />
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Urutkan
                <select className={`${field} mt-1`} value={sortBy} onChange={e => setSortBy(e.target.value as IdeaSortOrder)}>
                  <option value="newest">Terbaru</option>
                  <option value="unit_asc">Unit Bisnis (A → Z)</option>
                  <option value="unit_desc">Unit Bisnis (Z → A)</option>
                  <option value="title_asc">Judul Skrip (A → Z)</option>
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={() => void templatesQuery.refetch()}
                disabled={templatesQuery.isFetching}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                title="Segarkan sinkronisasi naskah dari database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${templatesQuery.isFetching ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
                <span>{templatesQuery.isFetching ? 'Sinkronisasi…' : 'Segarkan'}</span>
              </button>
              {(scriptSearch || scriptFormatFilter || scriptOutputFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setScriptSearch('');
                    setScriptFormatFilter('');
                    setScriptOutputFilter('');
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {templatesQuery.isPending && <p role="status" className="text-sm text-slate-600">Memuat tabel naskah…</p>}
          {templatesQuery.isError && <p role="alert" className="text-sm text-red-700">{errorText(templatesQuery.error)}</p>}

          {filteredTemplates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm font-semibold text-slate-700">
                {(scriptSearch || scriptFormatFilter || scriptOutputFilter)
                  ? 'Tidak ada naskah yang cocok dengan pencarian atau filter.'
                  : 'Belum ada naskah copywriting atau skrip di database.'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {(scriptSearch || scriptFormatFilter || scriptOutputFilter)
                  ? 'Coba ganti kata kunci pencarian atau hapus filter format/output.'
                  : 'Klik "+ Tambah Copy / Skrip" untuk membuat naskah baru, atau "Segarkan" jika baru saja diinput di perangkat lain.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {(scriptSearch || scriptFormatFilter || scriptOutputFilter) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setScriptSearch('');
                      setScriptFormatFilter('');
                      setScriptOutputFilter('');
                    }}
                    className={button + ' inline-flex items-center gap-1.5'}
                  >
                    Reset Filter
                  </button>
                ) : (
                  <>
                    {canEdit && (
                      <button
                        type="button"
                        className={primary + ' inline-flex items-center gap-1.5'}
                        onClick={() => {
                          setEditingTemplate('new');
                          setNotice('');
                        }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Copy / Skrip Baru</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void templatesQuery.refetch()}
                      disabled={templatesQuery.isFetching}
                      className={button + ' inline-flex items-center gap-1.5'}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${templatesQuery.isFetching ? 'animate-spin text-teal-600' : ''}`} />
                      <span>{templatesQuery.isFetching ? 'Menyinkronkan…' : 'Segarkan Data'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="creative-table w-full text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="w-56">Judul &amp; Penjelasan Skrip</th>
                    <th scope="col" className="w-36">Format &amp; Output</th>
                    <th scope="col" className="w-36">
                      <button
                        type="button"
                        onClick={() => setSortBy(prev => prev === 'unit_asc' ? 'unit_desc' : 'unit_asc')}
                        className="inline-flex items-center gap-1 font-extrabold uppercase tracking-wider hover:text-blue-600 cursor-pointer"
                        title="Klik untuk mengurutkan berdasarkan Unit Bisnis"
                      >
                        <span>Platform &amp; Unit</span>
                        <span className="text-[10px]">
                          {sortBy === 'unit_asc' ? '▲' : sortBy === 'unit_desc' ? '▼' : '⇅'}
                        </span>
                      </button>
                    </th>
                    <th scope="col">Pratinjau Naskah Copywriting</th>
                    <th scope="col" className="w-60 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map(tpl => (
                    <tr key={tpl.id} className="align-top">
                      <td>
                        <button
                          type="button"
                          onClick={() => setViewingTemplate(tpl)}
                          className="text-left font-bold text-slate-900 hover:text-teal-800 hover:underline"
                          title="Klik untuk membuka Mode Lihat & Baca Naskah"
                        >
                          {tpl.title}
                        </button>
                        {tpl.description ? (
                          <div className="mt-1.5 rounded-lg border border-amber-200/80 bg-amber-50/70 px-2 py-1.5 text-xs text-amber-950">
                            <span className="font-bold text-amber-900 block">Penjelasan / Arahan Brief:</span>
                            <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap leading-snug">{tpl.description}</p>
                          </div>
                        ) : (
                          <p className="mt-1 text-xs italic text-slate-400">Belum ada catatan penjelasan skrip</p>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-col items-start gap-1">
                          <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                            {copyFormats[tpl.format] ?? tpl.format}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                            {outputTypes[tpl.output_type] ?? tpl.output_type}
                          </span>
                        </div>
                      </td>
                      <td className="text-xs text-slate-600">
                        <span className="block font-semibold text-slate-800">
                          {tpl.platform ? platforms[tpl.platform] : 'Semua platform'}
                        </span>
                        <span className="block mt-0.5">{unitLabel(tpl.business_unit_id)}</span>
                      </td>
                      <td>
                        <div
                          onClick={() => setViewingTemplate(tpl)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewingTemplate(tpl); } }}
                          title="Klik untuk membuka Mode Lihat Nyaman"
                          className="cursor-pointer max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 hover:border-teal-300 hover:bg-white p-3 transition-colors"
                        >
                          <CopyRichTextContent content={tpl.body} className="text-xs text-slate-800 leading-relaxed" />
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
                            onClick={() => setViewingTemplate(tpl)}
                            title="Buka Pratinjau Mode Dokumen PDF (A4) & Teleprompter"
                          >
                            <Eye size={13} />
                            <span>Mode PDF / Lihat</span>
                          </button>
                          <button
                            type="button"
                            className={`${button} !px-2.5 !py-1 !text-xs inline-flex items-center gap-1`}
                            onClick={() => copyToClipboard(stripCopyRichText(tpl.body), tpl.id)}
                          >
                            <Copy size={13} />
                            <span>{copiedId === tpl.id ? 'Tersalin!' : 'Salin'}</span>
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              className={`${primary} !px-2.5 !py-1 !text-xs`}
                              onClick={() => {
                                setInitialScriptForIdea(tpl);
                                setEditor('new');
                                setActiveTab('ideas');
                              }}
                            >
                              + Buat Ide
                            </button>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              className={`${button} !px-2.5 !py-1 !text-xs`}
                              onClick={() => setEditingTemplate(tpl)}
                            >
                              Edit
                            </button>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              className={`${button} !px-2 !py-1 !text-xs !text-red-700 hover:!bg-red-50`}
                              title="Hapus naskah ini"
                              aria-label={`Hapus ${tpl.title}`}
                              onClick={() => {
                                if (confirm(`Hapus naskah "${tpl.title}" dari tabel Bank Copy?`)) {
                                  removeTemplateMutation.mutate(tpl.id);
                                }
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: REFERENSI BANK IDE (TAB MENU TERPISAH) */}
      {activeTab === 'references' && (
        <section className="space-y-4 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm" aria-label="Referensi Bank Ide">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Katalog Referensi Bank Ide</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Daftar seluruh tautan referensi kompetitor, benchmark visual, dan contoh konten yang tersimpan di Bank Ide.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs font-semibold text-slate-700">
                Filter platform
                <select
                  className={`${field} mt-1 min-w-[160px]`}
                  value={referencePlatformFilter}
                  onChange={e => setReferencePlatformFilter(e.target.value)}
                >
                  <option value="">Semua platform</option>
                  <Options values={platforms} />
                </select>
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Urutkan
                <select
                  className={`${field} mt-1 min-w-[160px]`}
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as IdeaSortOrder)}
                >
                  <option value="newest">Terbaru</option>
                  <option value="unit_asc">Unit Bisnis (A → Z)</option>
                  <option value="unit_desc">Unit Bisnis (Z → A)</option>
                  <option value="title_asc">Judul (A → Z)</option>
                </select>
              </label>
            </div>
          </div>

          {query.isPending && <p role="status" className="text-sm text-slate-600">Memuat referensi…</p>}

          {referenceEntries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Belum ada tautan referensi pada filter ini.</p>
              <p className="mt-1 text-xs">Tambahkan tautan referensi saat membuat atau mengedit ide konten.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="creative-table w-full text-sm">
                <thead>
                  <tr>
                    <th scope="col">Sumber &amp; Tautan Referensi</th>
                    <th scope="col">Ide Terkait</th>
                    <th scope="col">Platform</th>
                    <th scope="col">Status Ide</th>
                    <th scope="col" className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {referenceEntries.map(({ key, url, hostname, idea }) => (
                    <tr key={key}>
                      <td>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-bold text-teal-800 underline break-all"
                        >
                          <span>{hostname}</span>
                          <ExternalLink size={13} className="shrink-0" />
                        </a>
                        <p className="mt-0.5 text-xs text-slate-500 truncate max-w-xs">{url}</p>
                      </td>
                      <td>
                        <strong className="block text-slate-900">{idea.title}</strong>
                        {idea.brief && <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{idea.brief}</p>}
                      </td>
                      <td>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {[idea.platform, ...(idea.additional_platforms ?? [])].map(p => platforms[p]).join(', ')}
                        </span>
                      </td>
                      <td>
                        <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                          {idea.task ? 'Tugas: ' + taskStatuses[idea.task.status] : ideaQueues[idea.queue_state]}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${button} !px-2.5 !py-1 !text-xs inline-flex items-center gap-1`}
                          >
                            <span>Buka</span>
                            <ExternalLink size={12} />
                          </a>
                          <button
                            type="button"
                            className={`${button} !px-2.5 !py-1 !text-xs inline-flex items-center gap-1`}
                            onClick={() => copyToClipboard(url, key)}
                          >
                            <Copy size={12} />
                            <span>{copiedId === key ? 'Tersalin' : 'Salin URL'}</span>
                          </button>
                          {canEdit && !idea.task && idea.queue_state === 'ready' && (
                            <button
                              type="button"
                              className={`${primary} !px-2.5 !py-1 !text-xs`}
                              onClick={() => onConvert(idea)}
                            >
                              Jadikan tugas
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {viewingTemplate && (
        <CopyScriptViewerModal
          template={viewingTemplate}
          onClose={() => setViewingTemplate(null)}
          onEdit={canEdit ? (tpl) => {
            setViewingTemplate(null);
            setActiveTab('scripts');
            setEditingTemplate(tpl);
          } : undefined}
          onUseForIdea={canEdit ? (tpl) => {
            setViewingTemplate(null);
            setInitialScriptForIdea(tpl);
            setEditor('new');
            setActiveTab('ideas');
          } : undefined}
        />
      )}
    </div>
  );
}
