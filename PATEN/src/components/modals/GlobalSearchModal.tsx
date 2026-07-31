/**
 * Product Launch OS 3.0 - Global Search Modal (Cmd+K)
 */

import React, { useState, useEffect } from 'react';
import { Search, X, Package, Building2, ArrowRight } from 'lucide-react';
import { Article, MaterialMaster, Supplier, TaskItem } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  materials: MaterialMaster[];
  suppliers: Supplier[];
  tasks: TaskItem[];
  onSelectArticle: (articleId: string) => void;
  onSelectTab: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  articles = [],
  materials = [],
  suppliers = [],
  tasks = [],
  onSelectArticle,
  onSelectTab,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredArticles = query.trim()
    ? articles.filter(
        (a) =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          a.code.toLowerCase().includes(query.toLowerCase()) ||
          a.category.toLowerCase().includes(query.toLowerCase())
      )
    : articles.slice(0, 4);

  const filteredMaterials = query.trim()
    ? materials.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.code.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredSuppliers = query.trim()
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.code.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredTasks = query.trim()
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          (t.articleCode || '').toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-3">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Input Bar */}
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Cari artikel, kode, supplier, material, tugas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Articles */}
          {filteredArticles.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Artikel ({filteredArticles.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => {
                      onSelectArticle(art.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={art.mainImage}
                        alt={art.name}
                        className="w-8 h-8 rounded-lg object-cover border"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-blue-600">
                            {art.code}
                          </span>
                          <span className="text-[10px] text-slate-400">{art.category}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {art.name}
                        </h4>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {filteredMaterials.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Materials ({filteredMaterials.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    onClick={() => {
                      onSelectTab('master');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-mono text-[11px] text-emerald-600 font-bold">
                          {mat.code}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">
                          {mat.name}
                        </h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers */}
          {filteredSuppliers.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Suppliers ({filteredSuppliers.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredSuppliers.map((sup) => (
                  <div
                    key={sup.id}
                    onClick={() => {
                      onSelectTab('master');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="font-mono text-[11px] text-amber-600 font-bold">
                          {sup.code}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">
                          {sup.name}
                        </h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty search prompt */}
          {query.trim() &&
            filteredArticles.length === 0 &&
            filteredMaterials.length === 0 &&
            filteredSuppliers.length === 0 &&
            filteredTasks.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">
                Tidak ada hasil ditemukan untuk "{query}"
              </p>
            )}
        </div>
      </div>
    </div>
  );
};
