/**
 * Product Launch OS 3.0 - Article Detail View (Tech Pack / Spec Sheet Read-Only)
 */

import React from 'react';
import {
  Printer,
} from 'lucide-react';
import { Article } from '../../types';
import { formatIDR, calculateBOMTotal } from '../../utils/calculations';
import { ProductImage } from '../shared/ProductImage';

interface ArticleDetailViewProps {
  article: Article;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({ article }) => {
  const [copiedLink, setCopiedLink] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/techpack/${article.code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const bomTotal = calculateBOMTotal(article.materials || []);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 print:p-0 print:max-w-none">
      {/* Top Header & Export Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Final Specification Locked
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Product Development Pack</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
            Spesifikasi Lengkap Terintegrasi: {article.name}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            {copiedLink ? (
              <span className="text-emerald-700 font-bold">✓ Link Tersalin!</span>
            ) : (
              <span>Salin Link Techpack Digital</span>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087E79] text-white text-xs font-bold hover:bg-[#066864] transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Ekspor Tech Pack PDF</span>
          </button>
        </div>
      </div>

      {/* Tech Pack Document Area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xs">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 border-b-2 border-slate-900 pb-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-wider">
              TECH PACK & SPESIFIKASI PRODUK
            </h1>
            <p className="text-xs font-bold text-[#087E79] mt-0.5">
              Kode Artikel: {article.code} · Unit Bisnis: {article.businessUnit}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs shrink-0">
            <span className="font-extrabold text-slate-900 block">PRODUCT LAUNCH OS</span>
            <span className="text-slate-500 font-medium">Status: {article.stage}</span>
          </div>
        </div>

        {/* 1. Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProductImage
            src={article.mainImage}
            alt={article.name}
            fit="contain"
            displayWidth={520}
            className="aspect-square rounded-2xl border border-slate-200 bg-slate-50"
          />

          <div className="md:col-span-2 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-500 font-medium block">Nama Artikel</span>
                <span className="font-bold text-slate-900">{article.name}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Kategori / Subkategori</span>
                <span className="font-bold text-slate-900">
                  {article.category}{article.subCategory ? ` (${article.subCategory})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Target Gender & Season</span>
                <span className="font-bold text-slate-900">
                  {article.genderTarget}{article.seasonCollection ? ` · ${article.seasonCollection}` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Base Size</span>
                <span className="font-bold text-[#087E79]">{article.baseSize}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-900 block mb-1">Arah Brief & Konsep</span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {article.briefIntent || <span className="italic text-slate-400">Belum ada arah brief.</span>}
              </p>
            </div>

            {/* Rentang ukuran ringkas — melengkapi tabel size chart di bawah */}
            {(article.sizeSet || []).length > 0 && (
              <div>
                <span className="font-bold text-slate-900 block mb-1">Rentang Ukuran ({article.sizeSet.length})</span>
                <div className="flex flex-wrap gap-1">
                  {article.sizeSet.map((sz) => (
                    <span
                      key={sz}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black border ${
                        sz === article.baseSize
                          ? 'bg-[#087E79] text-white border-[#087E79]'
                          : 'bg-white text-slate-800 border-slate-300'
                      }`}
                    >
                      {sz}
                      {sz === article.baseSize && <span className="text-[8px] font-mono">BASE</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 1. Colorways & Variant Warna */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase border-b border-slate-200 pb-1">
            1. Varian Warna & Colorway ({(article.colorways || []).length})
          </h3>
          {(article.colorways || []).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {article.colorways.map((cw) => (
                <div
                  key={cw.id || cw.name}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <span
                    className="w-8 h-8 rounded-lg border border-slate-300 shrink-0"
                    style={{ backgroundColor: cw.hex || '#000000' }}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate text-xs">{cw.name}</div>
                    <div className="text-[10px] font-mono text-slate-500 truncate">
                      {cw.code}{cw.pantone ? ` · ${cw.pantone}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Belum ada varian warna dikunci untuk artikel ini.</p>
          )}
        </div>

        {/* 2. Materials BOM Table */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase border-b border-slate-200 pb-1">
            2. Bill of Materials (BOM) & Spesifikasi Kain
          </h3>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                <th className="py-2 px-3">Komponen</th>
                <th className="py-2 px-3">Area Penggunaan</th>
                <th className="py-2 px-3">Supplier</th>
                <th className="py-2 px-3 text-right">Konsumsi / Pcs</th>
                <th className="py-2 px-3 text-right">Harga Satuan</th>
                <th className="py-2 px-3 text-right">Biaya / Pcs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(article.materials || []).map((mat) => (
                <tr key={mat.id}>
                  <td className="py-2 px-3 font-semibold text-slate-900">{mat.materialName}</td>
                  <td className="py-2 px-3 text-slate-600">{mat.usageArea}</td>
                  <td className="py-2 px-3 text-slate-600">{mat.supplierName}</td>
                  <td className="py-2 px-3 text-right font-mono">{mat.grossConsumption} {mat.consumptionUnit}</td>
                  <td className="py-2 px-3 text-right font-mono">{formatIDR(mat.effectiveUnitPrice)}</td>
                  <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">{formatIDR(mat.costPerProduct)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={5} className="py-2.5 px-3 text-right text-slate-900">TOTAL BOM MATERIAL:</td>
                <td className="py-2.5 px-3 text-right font-mono text-[#087E79] text-sm">{formatIDR(bomTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Size Chart Table */}
        <div className="space-y-2">
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase border-b-2 border-slate-900 pb-1">
            3. Size Chart & Spesifikasi Ukuran (cm)
          </h3>

          {(article.sizeChart || []).length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-300">
              <table className="w-full text-left text-[10px] sm:text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-extrabold text-slate-800">
                    <th className="py-1 px-2 border-r border-slate-300">Variabel Pengukuran (POM)</th>
                    <th className="py-1 px-1 text-center border-r border-slate-300 w-16">Tol (±)</th>
                    {(article.sizeSet || []).map((sz) => (
                      <th key={sz} className="py-1 px-1.5 text-center border-r border-slate-300 font-extrabold text-[#087E79]">
                        {sz}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(article.sizeChart || []).map((row, idx) => (
                    <tr key={row.fieldId} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">{row.fieldName}</td>
                      <td className="py-1 px-1 text-center text-slate-500 font-mono text-[9px] border-r border-slate-200 bg-slate-50">±{row.tolerance}</td>
                      {(article.sizeSet || []).map((sz) => (
                        <td key={sz} className="py-0.5 px-1.5 text-center font-mono font-extrabold text-slate-900 border-r border-slate-200">
                          {row.targetValues[sz] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Size chart belum dikunci untuk artikel ini.</p>
          )}
        </div>

        {/* 4. HPP & Price Summary */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase border-b border-slate-200 pb-1">
            4. Ringkasan HPP & Struktur Harga Jual
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase">Ringkasan HPP Produksi</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">BOM Material & Trimming</span>
                <span className="font-mono font-semibold text-slate-900">{formatIDR(bomTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CMT & Service Subtotal</span>
                <span className="font-mono font-semibold text-slate-900">{formatIDR(article.calculatedHPP - bomTotal)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-sm text-slate-900">
                <span>HPP PRODUKSI FIX:</span>
                <span className="font-mono text-[#087E79]">{formatIDR(article.calculatedHPP)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase">Struktur Harga Jual & Margin</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">MSRP / Harga Retail</span>
                <span className="font-mono font-bold text-slate-900">{formatIDR(article.targetPriceMSRP)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Projected Gross Margin %</span>
                <span className="font-mono font-bold text-emerald-700">{article.priceSimulation?.projectedGrossMarginPercent || 70}%</span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
