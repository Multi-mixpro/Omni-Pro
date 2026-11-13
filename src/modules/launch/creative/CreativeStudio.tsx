import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Copy, FileText, Plus, Trash2 } from 'lucide-react';
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
            <span>Bank Copy &amp; Skrip Reusable</span>
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
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4" aria-label="Studio brief dan copy">
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
              return (
                <li key={row.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="creative-studio-icon"><FileText size={17} /></span>
                  <div className="min-w-0 flex-1 break-words">
                    <h3 className="font-semibold">{row.title}</h3>
                    <p className="text-xs text-slate-600">{taskStatuses[row.status]} · {row.campaign?.name ?? 'Tanpa kampanye'}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {typeof objective === 'string' && objective ? objective : row.brief || 'Brief belum diisi.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
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

      {/* Tab 2: Bank Copywriting & Skrip Reusable */}
      {activeTab === 'templates' && (
        <section className="space-y-4" aria-label="Bank copywriting dan skrip reusable">
          <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold">Koleksi Copywriting, Hook &amp; Skrip Reusable</h2>
            <p className="text-sm text-slate-600">
              Simpan format hook video, caption jualan, alur skrip 30-60 detik, dan template listing yang sudah terbukti menghasilkan interaksi tinggi untuk dipakai ulang saat membuat tugas baru.
            </p>
          </div>

          {templatesQuery.isPending && <p role="status" className="text-sm text-slate-600">Memuat koleksi bank copy…</p>}
          {templatesQuery.isError && <p role="alert" className="text-sm text-red-700">{errorText(templatesQuery.error)}</p>}

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {templatesQuery.data?.map(tpl => (
              <article key={tpl.id} className="creative-template-card rounded-2xl border border-teal-100 bg-white p-4 shadow-sm flex flex-col justify-between gap-3">
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                      {copyFormats[tpl.format] ?? tpl.format}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {outputTypes[tpl.output_type] ?? tpl.output_type}
                    </span>
                    {tpl.platform && (
                      <span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-xs font-semibold">
                        {platforms[tpl.platform] ?? tpl.platform}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 leading-snug">{tpl.title}</h3>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {tpl.body}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    className={`${button} !px-3 !py-1.5 !text-xs inline-flex items-center gap-1.5`}
                    onClick={() => copyToClipboard(tpl.body, tpl.id)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedId === tpl.id ? 'Tersalin!' : 'Salin naskah'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {canEdit && (
                      <button
                        type="button"
                        className={`${button} !px-3 !py-1.5 !text-xs`}
                        onClick={() => setEditingTemplate(tpl)}
                      >
                        Edit
                      </button>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        className={`${button} !px-2.5 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50 inline-flex items-center gap-1`}
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
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
