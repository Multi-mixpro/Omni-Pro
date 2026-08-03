/**
 * Product Launch OS 3.0 - Workspace Panel: Sampling & Fitting
 */

import React, { ChangeEvent, useState } from 'react';
import {
  CheckCircle2,
  FlaskConical,
  Plus,
  Loader2,
  Upload,
} from 'lucide-react';
import { Article, SampleIteration, SampleFinding } from '../../../types';
import { uploadArticleMedia } from '../../../services/media';
import { optimizedImageUrl } from '../../../utils/cloudinary';

interface SamplingPanelProps {
  article: Article;
  onUpdateArticle: (updated: Article) => void;
}

export const SamplingPanel: React.FC<SamplingPanelProps> = ({
  article,
  onUpdateArticle,
}) => {
  const [showAddFindingModal, setShowAddFindingModal] = useState(false);
  const [location, setLocation] = useState('Kerung Lengan / Armhole');
  const [severity, setSeverity] = useState<'Critical' | 'Major' | 'Minor'>('Major');
  const [note, setNote] = useState('');
  const [findingPhoto, setFindingPhoto] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const iterations = article.sampleIterations || [];
  const latestSample = iterations[iterations.length - 1];

  const handleCreateIteration = () => {
    const nextNumber = Math.min(iterations.length + 1, 3);
    const iterationName: SampleIteration['iterationName'] = iterations.length >= 3
      ? 'Pre-Production'
      : (`Sample V${nextNumber}` as SampleIteration['iterationName']);
    const nextIteration: SampleIteration = {
      id: crypto.randomUUID(),
      iterationName,
      dateReceived: new Date().toISOString().slice(0, 10),
      workshopName: '',
      targetSize: article.baseSize || article.sizeSet?.[0] || '',
      colorwayName: article.colorways?.find((color) => color.isSampleColor)?.name
        || article.colorways?.[0]?.name
        || '',
      status: 'Pending Review',
      measurementActuals: [],
      findings: [],
      decisionNote: '',
      isGoldenSample: false,
    };
    onUpdateArticle({
      ...article,
      stage: 'Sampling',
      sampleIterations: [...iterations, nextIteration],
      lastUpdated: new Date().toISOString(),
    });
  };

  const handlePromoteGoldenSample = () => {
    if (!latestSample || latestSample.status !== 'Approved') return;
    onUpdateArticle({
      ...article,
      sampleIterations: [
        ...iterations,
        {
          ...latestSample,
          id: crypto.randomUUID(),
          iterationName: 'Golden Sample',
          dateReceived: new Date().toISOString().slice(0, 10),
          status: 'Pending Review',
          isGoldenSample: true,
          findings: latestSample.findings.map((finding) => ({
            ...finding,
            id: crypto.randomUUID(),
          })),
        },
      ],
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleToggleFinding = (findingId: string) => {
    if (!latestSample) return;
    onUpdateArticle({
      ...article,
      sampleIterations: iterations.map((sample) => sample.id === latestSample.id
        ? {
          ...sample,
          findings: sample.findings.map((finding) => finding.id === findingId
            ? { ...finding, status: finding.status === 'Open' ? 'Resolved' : 'Open' }
            : finding),
        }
        : sample),
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleAddFinding = async () => {
    if (!note.trim() || !latestSample) return;

    setIsUploading(true);
    setUploadError(null);
    let photoUrl: string | undefined;
    try {
      if (findingPhoto) {
        const media = await uploadArticleMedia(
          article.id,
          findingPhoto,
          'SAMPLE_EVIDENCE',
        );
        photoUrl = media.url;
      }
    } catch (reason) {
      setUploadError(
        reason instanceof Error ? reason.message : 'Foto temuan gagal diunggah.',
      );
      setIsUploading(false);
      return;
    }

    const newFinding: SampleFinding = {
      id: crypto.randomUUID(),
      location,
      severity,
      category: 'Fitting',
      note,
      photoUrl,
      status: 'Open',
    };

    const updatedIterations = iterations.map((samp) => {
      if (samp.id === latestSample.id) {
        return {
          ...samp,
          findings: [...samp.findings, newFinding],
        };
      }
      return samp;
    });

    onUpdateArticle({
      ...article,
      sampleIterations: updatedIterations,
      lastUpdated: new Date().toISOString(),
    });

    setNote('');
    setFindingPhoto(null);
    setIsUploading(false);
    setShowAddFindingModal(false);
  };

  const handleSetDecision = (decisionStatus: SampleIteration['status']) => {
    if (!latestSample) return;

    const updatedIterations = iterations.map((samp) => {
      if (samp.id === latestSample.id) {
        return {
          ...samp,
          status: decisionStatus,
        };
      }
      return samp;
    });

    onUpdateArticle({
      ...article,
      sampleIterations: updatedIterations,
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4 text-xs text-slate-900">
      {/* Sample Iterations Timeline Bar */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <span className="font-bold text-xs text-slate-900">
            Sampel Terakhir: {latestSample?.iterationName || 'Sample V1'}
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Status: <span className="font-bold text-[#087E79]">{latestSample?.status || 'Pending Review'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs font-semibold">
          <button
            onClick={handleCreateIteration}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Iterasi Baru
          </button>
          {latestSample?.status === 'Approved' && !latestSample.isGoldenSample && (
            <button
              onClick={handlePromoteGoldenSample}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 font-bold text-indigo-700 hover:bg-indigo-100"
            >
              Buat Golden Sample
            </button>
          )}
          <button
            onClick={() => handleSetDecision('Approved with Revision')}
            disabled={!latestSample}
            className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-bold border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-40"
          >
            Approved w/ Revision
          </button>
          <button
            onClick={() => handleSetDecision('Approved')}
            disabled={!latestSample || latestSample.findings.some((finding) => finding.status === 'Open' && finding.severity === 'Critical')}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-2xs disabled:opacity-40"
          >
            Setujui Sampel
          </button>
        </div>
      </div>

      {/* Findings List */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-xs text-slate-900">
            Catatan Fitting & Temuan Defect ({(latestSample?.findings || []).length})
          </h3>
          <button
            onClick={() => setShowAddFindingModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-[#087E79] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Temuan Fitting</span>
          </button>
        </div>

        {(latestSample?.findings || []).length > 0 ? (
          <div className="space-y-2 text-xs">
            {(latestSample?.findings || []).map((fnd) => (
              <div
                key={fnd.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {fnd.location}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px]">
                    {fnd.severity}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{fnd.note}</p>
                <button
                  type="button"
                  onClick={() => handleToggleFinding(fnd.id)}
                  className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
                    fnd.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200'
                  }`}
                >
                  {fnd.status === 'Resolved' && <CheckCircle2 className="h-3 w-3" />}
                  {fnd.status === 'Resolved' ? 'Resolved' : 'Tandai selesai'}
                </button>
                {fnd.photoUrl && (
                  <a href={fnd.photoUrl} target="_blank" rel="noreferrer" className="block pt-1">
                    <img
                      src={optimizedImageUrl(fnd.photoUrl, 200)}
                      alt={`Bukti temuan ${fnd.location}`}
                      className="h-28 w-full rounded-lg border border-slate-200 object-cover"
                    />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">
            Belum ada catatan temuan fitting. Sampel fit dengan baik.
          </p>
        )}
      </div>

      {/* Add Finding Modal */}
      {showAddFindingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Tambah Temuan / Revisi Fitting</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Lokasi / Bagian Pakaian
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as 'Critical' | 'Major' | 'Minor')}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs"
                >
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Catatan Detail Revisi
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Misal: Kerung lengan agak sempit 1cm saat diangkat..."
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Foto Bukti <span className="font-normal text-slate-400">(opsional)</span>
                </label>
                <label className="flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-center text-[11px] font-semibold text-slate-600 hover:border-[#087E79] hover:bg-teal-50">
                  <Upload className="h-4 w-4 text-[#087E79]" />
                  <span>{findingPhoto ? findingPhoto.name : 'Pilih JPG, PNG, atau WEBP (maks. 10 MB)'}</span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    className="sr-only"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setFindingPhoto(event.target.files?.[0] || null);
                      setUploadError(null);
                    }}
                  />
                </label>
                {uploadError && (
                  <p className="mt-1.5 text-[10px] font-semibold text-rose-700">{uploadError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowAddFindingModal(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => void handleAddFinding()}
                disabled={isUploading || !note.trim()}
                className="px-4 py-1.5 rounded-xl bg-[#087E79] text-white text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-1.5"
              >
                {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isUploading ? 'Mengunggah…' : 'Simpan Catatan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
