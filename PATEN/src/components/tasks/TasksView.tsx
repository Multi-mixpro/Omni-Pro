/**
 * Product Launch OS 3.0 - Global Tasks & Blockers Manager
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { Article, TaskItem, BlockerItem, DecisionRequest } from '../../types';

interface TasksViewProps {
  articles: Article[];
  tasks: TaskItem[];
  blockers: BlockerItem[];
  decisions: DecisionRequest[];
  onUpdateTask?: (task: TaskItem) => void;
  onCreateTask?: (task: TaskItem) => void;
  onResolveBlocker?: (blockerId: string) => void;
  onCreateBlocker?: (blocker: BlockerItem) => void;
  onResolveDecision?: (decisionId: string, choice: string) => void;
  currentUserName?: string;
  currentUserId?: string;
}

export const TasksView: React.FC<TasksViewProps> = ({
  articles,
  tasks,
  blockers,
  decisions,
  onUpdateTask,
  onCreateTask,
  onResolveBlocker,
  onCreateBlocker,
  onResolveDecision,
  currentUserName = 'Pengguna Aktif',
  currentUserId = '',
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'blockers' | 'decisions'>('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showBlockerModal, setShowBlockerModal] = useState(false);

  // New Task Form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskArticleId, setTaskArticleId] = useState(articles[0]?.id || '');
  const [taskPic, setTaskPic] = useState(currentUserName);
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);

  // New Blocker Form
  const [blkTitle, setBlkTitle] = useState('');
  const [blockerArticleId, setBlockerArticleId] = useState(articles[0]?.id || '');
  const [blkDesc, setBlkDesc] = useState('');
  const [blkSev, setBlkSev] = useState<'Critical' | 'Major' | 'Moderate'>('Critical');

  const handleToggleTaskStatus = (task: TaskItem) => {
    if (!onUpdateTask) return;
    const nextStatusMap: Record<string, TaskItem['status']> = {
      'Not Ready': 'In Progress',
      'Ready': 'In Progress',
      'In Progress': 'Completed',
      'Completed': 'Not Ready',
      'Waiting': 'In Progress',
      'Blocked': 'In Progress',
      'In Review': 'Completed',
    };
    onUpdateTask({
      ...task,
      status: nextStatusMap[task.status] || 'Completed',
    });
  };

  const handleSaveNewTask = () => {
    if (!taskTitle || !onCreateTask) return;
    const article = articles.find((item) => item.id === taskArticleId);
    if (!article) return;
    onCreateTask({
      id: crypto.randomUUID(),
      articleId: article.id,
      articleCode: article.code,
      articleTitle: article.name,
      title: taskTitle,
      stage: article.stage,
      picId: currentUserId,
      picName: taskPic,
      dueDate: taskDueDate,
      status: 'In Progress',
      priority: 'High',
    });
    setTaskTitle('');
    setShowTaskModal(false);
  };

  const handleSaveNewBlocker = () => {
    if (!blkTitle.trim() || !blkDesc.trim() || !onCreateBlocker) return;
    const article = articles.find((item) => item.id === blockerArticleId);
    if (!article) return;
    onCreateBlocker({
      id: crypto.randomUUID(),
      articleId: article.id,
      articleCode: article.code,
      title: blkTitle,
      description: blkDesc,
      severity: blkSev,
      ownerName: currentUserName,
      reportedDate: new Date().toISOString().split('T')[0],
      targetResolutionDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      status: 'Open',
    });
    setBlkTitle('');
    setBlkDesc('');
    setShowBlockerModal(false);
  };

  return (
    <div className="space-y-5 pb-12 max-w-5xl mx-auto">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#087E79]" />
            <h1 className="text-lg font-extrabold text-slate-900">
              Manajemen Tugas & Hambatan (Tasks & Blockers)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau seluruh tugas operasional, blocker kritis, dan permintaan keputusan lintas artikel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'tasks' && (
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#087E79] text-white text-xs font-bold hover:bg-[#066864] transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Tugas</span>
            </button>
          )}

          {activeTab === 'blockers' && (
            <button
              onClick={() => setShowBlockerModal(true)}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-2xs"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>+ Laporkan Blocker</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'tasks'
              ? 'bg-[#087E79] text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Daftar Tugas ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('blockers')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'blockers'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Blocker Kritis ({blockers.length})
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'decisions'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Keputusan Dibutuhkan ({decisions.length})
        </button>
      </div>

      {/* Tasks List */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {tasks.map((tsk) => (
            <div
              key={tsk.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[#087E79]">
                    {tsk.articleCode}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                    Priority: {tsk.priority}
                  </span>
                </div>
                <h3 className="font-extrabold text-xs text-slate-900">{tsk.title}</h3>
                <span className="text-[11px] text-slate-500 font-medium block">
                  PIC: {tsk.picName} · Target Due: {tsk.dueDate}
                </span>
              </div>

              <button
                onClick={() => handleToggleTaskStatus(tsk)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                  tsk.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : tsk.status === 'In Progress'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {tsk.status} (Klik Ubah)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Blockers List */}
      {activeTab === 'blockers' && (
        <div className="space-y-3">
          {blockers.length > 0 ? (
            blockers.map((blk) => (
              <div
                key={blk.id}
                className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-xs text-rose-700">
                    {blk.articleCode}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px]">
                    {blk.severity}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">{blk.title}</h3>
                <p className="text-xs text-slate-600 font-medium">{blk.description}</p>

                <div className="pt-2 border-t border-rose-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Dilaporkan oleh / Owner: {blk.ownerName}</span>
                  {onResolveBlocker && (
                    <button
                      onClick={() => onResolveBlocker(blk.id)}
                      className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-2xs"
                    >
                      Selesaikan Blocker
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs font-semibold">
              Tidak ada blocker aktif. Seluruh pipeline berjalan lancar!
            </div>
          )}
        </div>
      )}

      {/* Decisions List */}
      {activeTab === 'decisions' && (
        <div className="space-y-3">
          {decisions.length > 0 ? (
            decisions.map((dec) => (
              <div
                key={dec.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-indigo-600">
                    {dec.articleCode}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    Diperlukan oleh: {dec.requestedToName}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900">{dec.question}</h3>
                <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  Dampak: {dec.impactDescription}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  {dec.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => onResolveDecision && onResolveDecision(dec.id, opt)}
                      className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      Pilih: {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs font-semibold">
              Tidak ada keputusan tertunda.
            </div>
          )}
        </div>
      )}

      {/* Task Create Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900">Tambah Tugas Baru</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Tugas</label>
                <input
                  type="text"
                  placeholder="Contoh: Finalisasi Grading Size XL & XXL"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Artikel</label>
                  <select
                    value={taskArticleId}
                    onChange={(e) => setTaskArticleId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  >
                    {articles.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.code} — {article.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIC Penanggung Jawab</label>
                  <input
                    type="text"
                    value={taskPic}
                    onChange={(e) => setTaskPic(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Tenggat (Due Date)</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowTaskModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveNewTask}
                className="px-4 py-1.5 rounded-xl bg-[#087E79] text-white text-xs font-bold hover:bg-[#066864] transition-all"
              >
                Simpan Tugas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocker Create Modal */}
      {showBlockerModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-sm text-rose-700">Laporkan Blocker Kritis</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Blocker</label>
                <input
                  type="text"
                  placeholder="Contoh: Kain Utama Mengalami Shading Warna pada Batch 2"
                  value={blkTitle}
                  onChange={(e) => setBlkTitle(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Artikel</label>
                  <select
                    value={blockerArticleId}
                    onChange={(e) => setBlockerArticleId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  >
                    {articles.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.code} — {article.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Severity</label>
                  <select
                    value={blkSev}
                    onChange={(e) => setBlkSev(e.target.value as 'Critical' | 'Major' | 'Moderate')}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="Critical">Critical (Hentikan Produksi)</option>
                    <option value="Major">Major (Potensi Delay &gt;3 Hari)</option>
                    <option value="Moderate">Moderate (Perlu Penyesuaian Minor)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detail Masalah & Dampak</label>
                <textarea
                  rows={3}
                  value={blkDesc}
                  onChange={(e) => setBlkDesc(e.target.value)}
                  placeholder="Jelaskan secara ringkas lokasi hambatan dan dampaknya terhadap jadwal rilis..."
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBlockerModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSaveNewBlocker}
                disabled={!blkTitle.trim() || !blkDesc.trim()}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Kirim Laporan Blocker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
