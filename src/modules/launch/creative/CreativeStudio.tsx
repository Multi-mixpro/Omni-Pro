import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Copy, Eye, FileText, Plus, Trash2 } from 'lucide-react';
import { CopyRichTextContent, CopyScriptViewerModal, stripCopyRichText } from './CopyRichText';
import { CreativePager } from './CreativeAccounts';
import { button, CopyTemplateForm, errorText, primary } from './CreativeForms';
import {
  copyFormats, copyTemplates, deleteCopyTemplate, outputTypes, PAGE_SIZE, platforms, tasks, taskStatuses,
  type CopyTemplate, type Task,
} from './repository';

export function CreativeStudio({ userId, unit, campaign, canEdit, onOpen, onEdit }: {
  userId: string; unit: string; campaign: string | null; canEdit: boolean;
  onOpen: (id: string) => void; onEdit: (task: Task) => void;
}) {
  const client = useQueryClient();
  const [activeTab, setActiveTab] = useState<'tasks' | 'templates'>('tasks');
  const [page, setPage] = useState(0);
  const [editingTemplate, setEditingTemplate] = useState<CopyTemplate | 'new' | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<CopyTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['creative', userId, 'tasks', 'studio', unit, campaign, page],
    queryFn: ({ signal }) => tasks(campaign, { platform: '', status: '', assignee: '', order: 'due_on', workstream: 'creative' }, page, signal, 'all', '', unit),
  });

  const templatesQuery = useQuery({
    queryKey: ['creative-copy-library', unit],
    queryFn: ({ signal }) => copyTemplates(signal, unit),
  });

  const removeTemplate = useMutation({
    mutationFn: (id: string) => deleteCopyTemplate(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['creative-copy-library'] });
    },
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  };

  return (
    <div className="space-y-4">
      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-100 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={activeTab === 'tasks'}
            className={activeTab === 'tasks' ? primary : button}
            onClick={() => setActiveTab('tasks')}
          >
            Tugas &amp; Naskah Aktif
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'templates'}
            className={`${activeTab === 'templates' ? primary : button} inline-flex items-center gap-1.5`}
            onClick={() => setActiveTab('templates')}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>List Tabel Copywriting &amp; Skrip</span>
            {templatesQuery.data && templatesQuery.data.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'templates' ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-800'
              }`}>
                {templatesQuery.data.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'templates' && canEdit && !editingTemplate && (
          <button
            type="button"
            className={`${primary} inline-flex items-center gap-1.5`}
            onClick={() => setEditingTemplate('new')}
          >
            <Plus className="w-4 h-4" /> Tambah ke Bank Copy
          </button>
        )}
      </div>

      {/* Editor Modal for Reusable Copy Template */}
      {editingTemplate && (
        <CopyTemplateForm
          template={editingTemplate === 'new' ? undefined : editingTemplate}
          defaultUnit={unit === 'all' || unit === 'unassigned' ? undefined : unit}
          onCancel={() => setEditingTemplate(null)}
          onSaved={() => {
            setEditingTemplate(null);
            void client.invalidateQueries({ queryKey: ['creative-copy-library'] });
          }}
        />
      )}

      {/* Tab 1: Active Tasks with brief & copy versions */}
      {activeTab === 'tasks' && (
        <section className="space-y-3 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm" aria-label="Studio brief dan copy">
          <div>
            <h2 className="text-lg font-bold">Brief dan naskah produksi</h2>
            <p className="text-sm text-slate-600">Lengkapi brief, tulis naskah, lalu buka riwayat versi dan keputusan dari tugas yang sama.</p>
          </div>
          {query.isPending && <p role="status" className="text-sm text-slate-600">Memuat tugas kreatif…</p>}
          {query.isError && <p role="alert" className="text-sm text-red-700">{errorText(query.error)}</p>}
          {query.isSuccess && !query.data.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Belum ada tugas produksi konten di lingkup ini.</p>}
          <ul className="divide-y divide-slate-100">
            {query.data?.slice(0, PAGE_SIZE).map(row => {
              const objective = row.creative_brief?.objective;
              const tpl = row.copy_template_id ? templatesQuery.data?.find(t => t.id === row.copy_template_id) : undefined;
              return (
                <li key={row.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="creative-studio-icon"><FileText size={17} /></span>
                  <div className="min-w-0 flex-1 break-words">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-semibold">{row.title}</h3>
                      {row.output_type && row.output_type !== 'other' && (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                          {outputTypes[row.output_type] ?? row.output_type}
                        </span>
                      )}
                      {tpl && (
                        <button
                          type="button"
                          onClick={() => setViewingTemplate(tpl)}
                          title="Buka Mode Lihat Nyaman untuk skrip tugas ini"
                          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <span>Skrip: {tpl.title}</span>
                          <Eye size={11} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{taskStatuses[row.status]} · {row.campaign?.name ?? 'Tanpa kampanye'}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {typeof objective === 'string' && objective ? objective : row.brief || 'Brief belum diisi.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tpl && (
                      <button
                        type="button"
                        onClick={() => setViewingTemplate(tpl)}
                        className="inline-flex items-center gap-1 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
                      >
                        <Eye size={13} />
                        <span>Mode Lihat Skrip</span>
                      </button>
                    )}
                    {canEdit && <button type="button" className={button} onClick={() => onEdit(row)}>Edit brief</button>}
                    <button type="button" className={primary} onClick={() => onOpen(row.id)}>Versi &amp; review</button>
                  </div>
                </li>
              );
            })}
          </ul>
          <CreativePager page={page} next={(query.data?.length ?? 0) > PAGE_SIZE} onPage={setPage} />
        </section>
      )}

      {/* Tab 2: Bank Copywriting & Skrip Reusable (List Tabel) */}
      {activeTab === 'templates' && (
        <section className="space-y-4 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm" aria-label="Bank copywriting dan skrip reusable">
          <div>
            <h2 className="text-lg font-bold">List Tabel Copywriting, Hook &amp; Skrip Naskah</h2>
            <p className="text-sm text-slate-600">
              Daftar naskah ini tersinkronisasi penuh dengan <strong>Bank Ide</strong> dan <strong>Form Tugas Baru</strong>.
            </p>
          </div>

          {templatesQuery.isPending && <p role="status" className="text-sm text-slate-600">Memuat koleksi bank copy…</p>}
          {templatesQuery.isError && <p role="alert" className="text-sm text-red-700">{errorText(templatesQuery.error)}</p>}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="creative-table w-full text-sm">
              <thead>
                <tr>
                  <th scope="col" className="w-60">Judul &amp; Penjelasan Skrip</th>
                  <th scope="col" className="w-40">Format &amp; Output</th>
                  <th scope="col" className="w-32">Platform</th>
                  <th scope="col">Pratinjau Copywriting / Skrip</th>
                  <th scope="col" className="w-56 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {templatesQuery.data?.map(tpl => (
                  <tr key={tpl.id} className="align-top">
                    <td>
                      <button
                        type="button"
                        onClick={() => setViewingTemplate(tpl)}
                        className="text-left font-bold text-slate-900 hover:text-teal-800 hover:underline"
                      >
                        {tpl.title}
                      </button>
                      {tpl.description ? (
                        <div className="mt-1.5 rounded-lg border border-amber-200/80 bg-amber-50/70 px-2 py-1.5 text-xs text-amber-950">
                          <span className="font-bold text-amber-900 block">Penjelasan / Arahan Brief:</span>
                          <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap leading-snug">{tpl.description}</p>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs italic text-slate-400">Belum ada catatan penjelasan</p>
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
                    <td>
                      <span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-xs font-semibold">
                        {tpl.platform ? platforms[tpl.platform] : 'Semua platform'}
                      </span>
                    </td>
                    <td>
                      <div
                        onClick={() => setViewingTemplate(tpl)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewingTemplate(tpl); } }}
                        title="Klik untuk membuka Mode Lihat Nyaman"
                        className="cursor-pointer max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 hover:border-indigo-300 hover:bg-white p-3 transition-colors dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-indigo-500/40 dark:hover:bg-white/[0.06]"
                      >
                        <CopyRichTextContent content={tpl.body} className="text-xs text-slate-800 leading-relaxed dark:text-slate-200" />
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-800 hover:bg-indigo-100 transition-colors dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-200"
                          onClick={() => setViewingTemplate(tpl)}
                          title="Buka Pratinjau Mode Dokumen PDF (A4) & Teleprompter"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Mode PDF / Lihat</span>
                        </button>
                        <button
                          type="button"
                          className={`${button} !px-2.5 !py-1 !text-xs inline-flex items-center gap-1`}
                          onClick={() => copyToClipboard(stripCopyRichText(tpl.body), tpl.id)}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedId === tpl.id ? 'Tersalin!' : 'Salin'}</span>
                        </button>
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
                            title="Hapus template ini"
                            aria-label={`Hapus ${tpl.title}`}
                            onClick={() => {
                              if (confirm(`Hapus template "${tpl.title}" dari Bank Copy?`)) {
                                removeTemplate.mutate(tpl.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {viewingTemplate && (
        <CopyScriptViewerModal
          template={viewingTemplate}
          onClose={() => setViewingTemplate(null)}
          onEdit={canEdit ? (tpl) => {
            setViewingTemplate(null);
            setActiveTab('templates');
            setEditingTemplate(tpl);
          } : undefined}
        />
      )}
    </div>
  );
}
