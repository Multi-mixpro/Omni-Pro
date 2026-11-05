/**
 * Product Launch OS 3.0 - Files and Documents Panel
 */

import React, { ChangeEvent, useState } from 'react';
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Upload,
} from 'lucide-react';
import { Article, ArticleFile } from '../../../types';
import {
  deleteArticleMedia,
  uploadArticleMedia,
} from '../../../services/media';
import { ConfirmDeleteButton } from '../../shared/ConfirmDeleteButton';
import { compressImageForUpload } from '../../../utils/cloudinary';

interface FilesPanelProps {
  article: Article;
  onUpdateArticle: (updated: Article) => void;
}

function formatBytes(bytes: number) {
  if (!bytes) return 'Ukuran tidak tersedia';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function kindFor(file: File): ArticleFile['kind'] {
  if (file.type === 'application/pdf') return 'TECH_PACK';
  if (file.type.includes('spreadsheet')) return 'SIZE_CHART';
  return 'OTHER';
}

export const FilesPanel: React.FC<FilesPanelProps> = ({
  article,
  onUpdateArticle,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const files = article.files || [];
  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;

    setIsUploading(true);
    setMediaError(null);
    try {
      const uploaded: ArticleFile[] = [];
      for (const file of selected) {
        // Gambar diperkecil dulu; PDF/XLSX/DOCX dilewatkan apa adanya.
        const payload = await compressImageForUpload(file);
        uploaded.push(
          await uploadArticleMedia(article.id, payload, kindFor(file)),
        );
      }
      onUpdateArticle({
        ...article,
        files: [...uploaded, ...files],
        lastUpdated: new Date().toISOString(),
      });
    } catch (reason) {
      setMediaError(
        reason instanceof Error ? reason.message : 'Upload media gagal.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (file: ArticleFile) => {
    setDeletingId(file.id);
    setMediaError(null);
    try {
      await deleteArticleMedia(file.id);
      onUpdateArticle({
        ...article,
        files: files.filter((item) => item.id !== file.id),
        lastUpdated: new Date().toISOString(),
      });
    } catch (reason) {
      setMediaError(
        reason instanceof Error ? reason.message : 'Media belum dapat dihapus.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 text-xs text-slate-900">
      <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#087E79]" />
          <span className="font-bold text-slate-900">File & Dokumen</span>
        </div>
        <label
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[#087E79] font-bold transition-colors shadow-2xs ${
            isUploading ? 'cursor-wait opacity-70' : 'cursor-pointer hover:bg-slate-50'
          }`}
        >
          {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          <span>{isUploading ? 'Mengunggah…' : 'Upload File'}</span>
          <input
            type="file"
            multiple
            disabled={isUploading}
            accept=".png,.jpg,.jpeg,.webp,.pdf,.xlsx,.docx"
            onChange={(event) => void handleUpload(event)}
            className="sr-only"
          />
        </label>
      </div>

      {mediaError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-800">
          {mediaError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {files.length ? files.map((file) => (
          <div
            key={file.id}
            className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <FileText className={`w-5 h-5 shrink-0 ${file.kind === 'SIZE_CHART' ? 'text-indigo-600' : 'text-[#087E79]'}`} />
              <div className="min-w-0">
                <h5 className="truncate font-bold text-slate-900">{file.name}</h5>
                <span className="text-[10px] text-slate-500">
                  {file.kind.replace(/_/g, ' ')} · {formatBytes(file.bytes)}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Buka ${file.name}`}
                className="p-1.5 text-slate-500 hover:text-[#087E79] transition-colors"
              >
                {file.mimeType.startsWith('image/') ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              </a>
              {deletingId === file.id ? (
                <button type="button" disabled className="p-1.5 text-slate-400 disabled:opacity-50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </button>
              ) : (
                <ConfirmDeleteButton
                  onConfirm={() => void handleDelete(file)}
                  label={`Hapus ${file.name}`}
                  className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-50 transition-colors"
                />
              )}
            </div>
          </div>
        )) : (
          <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
            <FileText className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 font-bold text-slate-600">Belum ada dokumen tersimpan</p>
            <p className="mt-1 text-[10px] text-slate-400">Unggah tech pack, size chart, atau dokumen pendukung.</p>
          </div>
        )}
      </div>

    </div>
  );
};
