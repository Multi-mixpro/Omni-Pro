/**
 * Product Launch OS 3.0 - Workspace Panel: Tasks & Progress Updates
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Send,
  MessageSquare,
  AlertTriangle,
  User,
  Clock,
} from 'lucide-react';
import { Article, ProgressUpdate } from '../../../types';

interface TasksPanelProps {
  article: Article;
  updates: ProgressUpdate[];
  onAddUpdate: (update: ProgressUpdate) => void;
  currentUserName?: string;
  currentUserAvatar?: string | null;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({
  article,
  updates,
  onAddUpdate,
  currentUserName,
  currentUserAvatar,
}) => {
  const [updateType, setUpdateType] = useState<'Selesai' | 'Berjalan' | 'Hambatan' | 'Butuh Keputusan'>('Berjalan');
  const [notes, setNotes] = useState('');

  const articleUpdates = updates.filter((u) => u.articleId === article.id);

  const handlePostUpdate = () => {
    if (!notes.trim()) return;

    const newUpdate: ProgressUpdate = {
      id: crypto.randomUUID(),
      articleId: article.id,
      authorName: currentUserName || 'Pengguna Aktif',
      authorAvatar: currentUserAvatar || '',
      timestamp: new Date().toISOString(),
      updateType,
      notes,
    };

    onAddUpdate(newUpdate);
    setNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Quick Update Composer */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
        <h3 className="font-bold text-xs text-slate-900">
          Kirim Progress Update Artikel
        </h3>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {(['Berjalan', 'Selesai', 'Hambatan', 'Butuh Keputusan'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setUpdateType(t)}
              className={`px-3 py-1 rounded-full font-semibold shrink-0 transition-colors ${
                updateType === t
                  ? t === 'Hambatan'
                    ? 'bg-rose-600 text-white'
                    : t === 'Selesai'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#087E79] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Tulis update progres atau hambatan terkini..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-[#087E79] focus:outline-none"
          />
          <button
            onClick={handlePostUpdate}
            disabled={!notes.trim()}
            className="px-4 py-2 rounded-xl bg-[#087E79] text-white text-xs font-bold hover:bg-[#066864] disabled:opacity-50 transition-colors flex items-center gap-1 shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim</span>
          </button>
        </div>
      </div>

      {/* Progress Timeline Feed */}
      <div className="space-y-3">
        <h4 className="font-bold text-xs text-slate-900">
          Histori Timeline Activity
        </h4>

        {articleUpdates.length > 0 ? (
          <div className="space-y-2">
            {articleUpdates.map((upd) => (
              <div
                key={upd.id}
                className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">
                    {upd.authorName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      upd.updateType === 'Hambatan'
                        ? 'bg-rose-50 text-rose-700'
                        : upd.updateType === 'Selesai'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-[#DDF4F1] text-[#087E79]'
                    }`}
                  >
                    {upd.updateType}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {upd.notes}
                </p>
                <span className="text-[10px] text-slate-400 block">
                  {new Date(upd.timestamp).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">
            Belum ada update progres untuk artikel ini.
          </p>
        )}
      </div>
    </div>
  );
};
