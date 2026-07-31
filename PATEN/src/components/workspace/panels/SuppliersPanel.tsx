/**
 * Product Launch OS 3.0 - Source & Suppliers Comparison Panel
 */

import React from 'react';
import { Building2, Clock, ShieldCheck } from 'lucide-react';
import { Article, Supplier, MaterialMaster } from '../../../types';
import { formatIDR } from '../../../utils/calculations';
import { WhatsAppButton } from '../../shared/WhatsAppButton';

interface SuppliersPanelProps {
  article: Article;
  masterSuppliers: Supplier[];
  masterMaterials: MaterialMaster[];
  onUpdateArticle: (updated: Article) => void;
}

export const SuppliersPanel: React.FC<SuppliersPanelProps> = ({
  article,
  masterSuppliers = [],
  masterMaterials = [],
}) => {
  // Collect suppliers mapped in BOM.
  // Nilai lead time / MOQ / quality hanya diisi bila supplier benar-benar tertaut
  // di Master Data — tidak boleh dikarang, karena dipakai untuk keputusan sourcing.
  const bomSuppliers = (article.materials || []).map((bom) => {
    const sup = masterSuppliers.find((s) => s.id === bom.supplierId || s.name === bom.supplierName);
    return {
      bomItemName: bom.materialName,
      usageArea: bom.usageArea,
      isLinked: !!sup,
      supplierName: sup?.name || bom.supplierName || 'Belum Ditentukan',
      supplierCode: sup?.code || '—',
      picName: sup?.picName || '',
      picContact: sup?.picContact || '',
      leadTimeDays: sup?.leadTimeDays ?? null,
      moq: sup?.moqDefault ?? null,
      qualityScore: sup?.qualityScore ?? null,
      status: sup?.verificationStatus || null,
      costPerUnit: bom.effectiveUnitPrice || 0,
    };
  });

  return (
    <div className="space-y-4 text-xs text-slate-900">
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#087E79]" />
          <span className="font-bold text-slate-900">Pemilihan Sumber & Supplier Terlibat</span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          {bomSuppliers.length} komponen terhubung ke vendor master
        </span>
      </div>

      {bomSuppliers.length > 0 ? (
        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3">Komponen BOM</th>
                <th className="py-2.5 px-3">Area Penggunaan</th>
                <th className="py-2.5 px-3">Supplier Terpilih</th>
                <th className="py-2.5 px-3 text-center">Kontak</th>
                <th className="py-2.5 px-3 text-center">Harga Satuan</th>
                <th className="py-2.5 px-3 text-center">Lead Time</th>
                <th className="py-2.5 px-3 text-center">MOQ Default</th>
                <th className="py-2.5 px-3 text-center">Quality Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {bomSuppliers.map((sup, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{sup.bomItemName}</td>
                  <td className="py-2.5 px-3 text-slate-600">{sup.usageArea}</td>
                  <td className={`py-2.5 px-3 font-bold ${sup.isLinked ? 'text-[#087E79]' : 'text-slate-400 italic'}`}>
                    {sup.supplierName} {sup.isLinked && `(${sup.supplierCode})`}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {sup.isLinked ? (
                      <WhatsAppButton
                        phone={sup.picContact}
                        contactName={sup.picName || sup.supplierName}
                        message={`Halo ${sup.picName || sup.supplierName}, saya dari GG Indo Apparel ingin menanyakan ketersediaan ${sup.bomItemName}.`}
                      />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                    {formatIDR(sup.costPerUnit)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {sup.leadTimeDays !== null ? (
                      <span className="inline-flex items-center gap-1 font-mono text-slate-700">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {sup.leadTimeDays} Hari
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                    {sup.moq !== null ? `${sup.moq} Yard/Unit` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {sup.qualityScore !== null ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DDF4F1] text-[#087E79]">
                        {sup.qualityScore}%
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center py-6 text-slate-400 italic">
          Belum ada material yang terhubung dengan supplier. Tambahkan material pada panel BOM.
        </p>
      )}

      {/* Supplier Quality Guidelines */}
      <div className="p-3 bg-slate-100 rounded-xl flex items-center gap-3 text-[11px] text-slate-600 border border-slate-200">
        <ShieldCheck className="w-4 h-4 text-[#087E79] shrink-0" />
        <span>
          Semua harga & lead time ditarik langsung dari record valid Supplier Master. Perubahan harga master tidak akan mengubah HPP artikel yang sudah terkunci.
        </span>
      </div>
    </div>
  );
};
