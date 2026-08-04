/**
 * Product Launch OS 3.0 - Workspace Panel: Materials & Accessories (BOM)
 * Enhanced with Multi-select Material Recipes, Auto-Synchronized Master Suppliers,
 * and Auto-Sync vs. Unlocked Custom Unit Price Controls.
 */

import React, { useState } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Search,
  DollarSign,
  Building2,
  Lock,
  Unlock,
  RefreshCw,
  Check,
  Filter,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  X,
  Ruler,
} from 'lucide-react';
import { Article, ArticleBOMItem, MaterialMaster, Supplier } from '../../../types';
import { ConfirmDeleteButton } from '../../shared/ConfirmDeleteButton';
import { formatIDR } from '../../../utils/calculations';

interface MaterialsPanelProps {
  article: Article;
  masterMaterials: MaterialMaster[];
  masterSuppliers: Supplier[];
  onUpdateArticle: (updated: Article) => void;
}

export const MaterialsPanel: React.FC<MaterialsPanelProps> = ({
  article,
  masterMaterials,
  masterSuppliers,
  onUpdateArticle,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Multi-select modal state
  const [selectedMatIds, setSelectedMatIds] = useState<string[]>([]);
  const [matConfigs, setMatConfigs] = useState<
    Record<string, { usageArea: string; netConsumption: number; wastePercent: number }>
  >({});

  const [modalSearch, setModalSearch] = useState('');
  const [modalCategory, setModalCategory] = useState<string>('Semua');

  // Main table filter & search
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Baris BOM yang sedang membuka editor konsumsi per-ukuran.
  const [perSizeOpen, setPerSizeOpen] = useState<Record<string, boolean>>({});

  const sizeSet = article.sizeSet && article.sizeSet.length > 0 ? article.sizeSet : [];

  /** Rata-rata konsumsi lintas ukuran, dibulatkan 2 desimal. */
  const averageOf = (bySize: Record<string, number>): number => {
    const vals = Object.values(bySize).filter((v) => Number(v) > 0);
    if (vals.length === 0) return 0;
    return Number((vals.reduce((s, v) => s + Number(v), 0) / vals.length).toFixed(2));
  };

  /**
   * Perbarui konsumsi satu ukuran. netConsumption ikut diperbarui memakai
   * rata-rata seluruh ukuran agar biaya per pcs mencerminkan konsumsi gabungan.
   */
  const handleUpdatePerSizeConsumption = (itemId: string, sizeCode: string, value: string) => {
    const updatedMaterials = (article.materials || []).map((mat) => {
      if (mat.id !== itemId) return mat;
      const bySize = { ...(mat.consumptionBySize || {}), [sizeCode]: Number(value) || 0 };
      const avgNet = averageOf(bySize);
      const gross = Number((avgNet * (1 + (mat.wastePercent || 0) / 100)).toFixed(2));
      const cost = Math.round(gross * (mat.effectiveUnitPrice || 0));
      return {
        ...mat,
        consumptionBySize: bySize,
        netConsumption: avgNet,
        grossConsumption: gross,
        costPerProduct: cost,
      };
    });
    onUpdateArticle({ ...article, materials: updatedMaterials, lastUpdated: new Date().toISOString() });
  };

  /**
   * Aktif/nonaktifkan mode per-ukuran. Saat diaktifkan, seluruh ukuran diisi
   * dengan konsumsi tunggal saat ini sebagai titik awal; saat dimatikan, angka
   * tunggal (rata-rata terakhir) tetap dipakai.
   */
  const handleTogglePerSize = (item: ArticleBOMItem) => {
    const turningOn = !item.consumptionBySize;
    const updatedMaterials = (article.materials || []).map((mat) => {
      if (mat.id !== item.id) return mat;
      if (turningOn) {
        const seed: Record<string, number> = {};
        (sizeSet.length ? sizeSet : ['M']).forEach((s) => { seed[s] = mat.netConsumption || 0; });
        return { ...mat, consumptionBySize: seed };
      }
      const { consumptionBySize: _drop, ...rest } = mat;
      return rest as ArticleBOMItem;
    });
    onUpdateArticle({ ...article, materials: updatedMaterials, lastUpdated: new Date().toISOString() });
    setPerSizeOpen((prev) => ({ ...prev, [item.id]: turningOn }));
  };

  // Handle BOM Item inline updates
  const handleUpdateBOMItem = (itemId: string, field: string, value: any) => {
    const updatedMaterials = (article.materials || []).map((mat) => {
      if (mat.id !== itemId) return mat;

      const updated = { ...mat, [field]: value };

      // If updating effectiveUnitPrice directly, mark as custom price
      if (field === 'effectiveUnitPrice') {
        const masterMat = masterMaterials.find((m) => m.id === mat.materialId);
        const newPrice = Number(value) || 0;
        if (masterMat && newPrice !== masterMat.latestPrice) {
          updated.isCustomPrice = true;
          updated.priceSourceStatus = 'Manual';
        } else {
          updated.isCustomPrice = false;
          updated.priceSourceStatus = 'Valid';
        }
      }

      if (
        field === 'netConsumption' ||
        field === 'wastePercent' ||
        field === 'effectiveUnitPrice'
      ) {
        const net = field === 'netConsumption' ? Number(value) || 0 : mat.netConsumption;
        const waste = field === 'wastePercent' ? Number(value) || 0 : mat.wastePercent;
        const price = field === 'effectiveUnitPrice' ? Number(value) || 0 : mat.effectiveUnitPrice;

        const gross = Number((net * (1 + waste / 100)).toFixed(2));
        const cost = Math.round(gross * price);

        updated.grossConsumption = gross;
        updated.costPerProduct = cost;
      }

      return updated;
    });

    onUpdateArticle({
      ...article,
      materials: updatedMaterials,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Toggle Lock/Unlock custom price for a BOM item
  const handleToggleCustomPrice = (bomItem: ArticleBOMItem) => {
    const masterMat = masterMaterials.find((m) => m.id === bomItem.materialId);
    const masterPrice = masterMat ? masterMat.latestPrice : bomItem.effectiveUnitPrice;

    const currentlyCustom = bomItem.isCustomPrice || bomItem.isCustomOverride || false;

    if (currentlyCustom) {
      // Re-lock and sync to master price
      handleUpdateBOMItem(bomItem.id, 'effectiveUnitPrice', masterPrice);
      const updatedMaterials = (article.materials || []).map((mat) => {
        if (mat.id !== bomItem.id) return mat;
        return {
          ...mat,
          effectiveUnitPrice: masterPrice,
          isCustomPrice: false,
          isCustomOverride: false,
          priceSourceStatus: 'Valid' as const,
        };
      });
      onUpdateArticle({
        ...article,
        materials: updatedMaterials,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      // Unlock for custom price entry
      const updatedMaterials = (article.materials || []).map((mat) => {
        if (mat.id !== bomItem.id) return mat;
        return {
          ...mat,
          isCustomPrice: true,
          priceSourceStatus: 'Manual' as const,
        };
      });
      onUpdateArticle({
        ...article,
        materials: updatedMaterials,
        lastUpdated: new Date().toISOString(),
      });
    }
  };

  // Reset item price back to Master Data price
  const handleResetToMasterPrice = (bomItem: ArticleBOMItem) => {
    const masterMat = masterMaterials.find((m) => m.id === bomItem.materialId);
    const masterPrice = masterMat ? masterMat.latestPrice : bomItem.effectiveUnitPrice;

    const net = bomItem.netConsumption;
    const waste = bomItem.wastePercent;
    const gross = Number((net * (1 + waste / 100)).toFixed(2));
    const cost = Math.round(gross * masterPrice);

    const updatedMaterials = (article.materials || []).map((mat) => {
      if (mat.id !== bomItem.id) return mat;
      return {
        ...mat,
        effectiveUnitPrice: masterPrice,
        isCustomPrice: false,
        isCustomOverride: false,
        priceSourceStatus: 'Valid' as const,
        grossConsumption: gross,
        costPerProduct: cost,
      };
    });

    onUpdateArticle({
      ...article,
      materials: updatedMaterials,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Open Multi-select Add Modal
  const handleOpenAddModal = () => {
    setSelectedMatIds([]);
    // Pre-populate default configs for all master materials
    const initialConfigs: Record<string, { usageArea: string; netConsumption: number; wastePercent: number }> = {};
    masterMaterials.forEach((m) => {
      let defaultArea = 'Body Utama';
      let defaultNet = 1.0;
      const defaultWaste = m.defaultWastePercent || 3;

      if (m.group === 'main_fabric') {
        defaultArea = 'Body Utama';
        defaultNet = 1.5;
      } else if (m.group === 'rib') {
        defaultArea = 'Rib Leher / Kerah';
        defaultNet = 0.2;
      } else if (m.group === 'lining') {
        defaultArea = 'Furing Saku';
        defaultNet = 0.5;
      } else if (m.group === 'zipper') {
        defaultArea = 'Resleting Utama';
        defaultNet = 1;
      } else if (m.group === 'button') {
        defaultArea = 'Kancing Depan';
        defaultNet = 4;
      } else if (m.group === 'label') {
        defaultArea = 'Label Merk & Size';
        defaultNet = 1;
      } else if (m.group === 'packaging') {
        defaultArea = 'Polybag & Hangtag';
        defaultNet = 1;
      } else if (m.group === 'thread') {
        defaultArea = 'Benang Jahit';
        defaultNet = 1;
      }

      initialConfigs[m.id] = {
        usageArea: defaultArea,
        netConsumption: defaultNet,
        wastePercent: defaultWaste,
      };
    });

    setMatConfigs(initialConfigs);
    setModalSearch('');
    setModalCategory('Semua');
    setShowAddModal(true);
  };

  // Toggle selection of a material in modal
  const handleToggleSelectMaterial = (id: string) => {
    if (selectedMatIds.includes(id)) {
      setSelectedMatIds((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedMatIds((prev) => [...prev, id]);
    }
  };

  // Filter materials for modal
  const filteredModalMaterials = masterMaterials.filter((m) => {
    const matchesCategory =
      modalCategory === 'Semua' ||
      m.group === modalCategory ||
      (modalCategory === 'Fabric' && ['main_fabric', 'lining', 'rib'].includes(m.group));
    const matchedSup = masterSuppliers.find((s) => s.id === m.preferredSupplierId);
    const supplierName = matchedSup ? matchedSup.name : m.supplierName || '';

    const matchesSearch =
      !modalSearch ||
      m.name.toLowerCase().includes(modalSearch.toLowerCase()) ||
      m.code.toLowerCase().includes(modalSearch.toLowerCase()) ||
      supplierName.toLowerCase().includes(modalSearch.toLowerCase()) ||
      m.composition.toLowerCase().includes(modalSearch.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Select all / Deselect all in modal
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredModalMaterials.map((m) => m.id);
    const allSelected = filteredIds.every((id) => selectedMatIds.includes(id));

    if (allSelected) {
      setSelectedMatIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedMatIds, ...filteredIds]));
      setSelectedMatIds(combined);
    }
  };

  // Batch Add Multiple Materials to BOM
  const handleAddMultipleMaterials = () => {
    if (selectedMatIds.length === 0) return;

    const newBOMItems: ArticleBOMItem[] = [];

    selectedMatIds.forEach((matId) => {
      const mat = masterMaterials.find((m) => m.id === matId);
      if (!mat) return;

      const sup = masterSuppliers.find((s) => s.id === mat.preferredSupplierId);

      const config = matConfigs[matId] || {
        usageArea: 'Body Utama',
        netConsumption: 1.0,
        wastePercent: mat.defaultWastePercent || 3,
      };

      const gross = Number((config.netConsumption * (1 + config.wastePercent / 100)).toFixed(2));
      const cost = Math.round(gross * mat.latestPrice);

      const newItem: ArticleBOMItem = {
        id: crypto.randomUUID(),
        materialId: mat.id,
        materialName: mat.name,
        group: mat.group,
        usageArea: config.usageArea,
        supplierId: sup?.id || mat.preferredSupplierId || '',
        supplierName: sup?.name || mat.supplierName || 'Belum terhubung ke supplier',
        netConsumption: config.netConsumption,
        consumptionUnit: mat.stockUnit,
        wastePercent: config.wastePercent,
        grossConsumption: gross,
        effectiveUnitPrice: mat.latestPrice,
        priceSourceStatus: 'Valid',
        costPerProduct: cost,
        isCustomPrice: false,
      };

      newBOMItems.push(newItem);
    });

    const updatedMaterials = [...(article.materials || []), ...newBOMItems];
    onUpdateArticle({
      ...article,
      materials: updatedMaterials,
      lastUpdated: new Date().toISOString(),
    });

    setShowAddModal(false);
  };

  const handleRemoveMaterial = (itemId: string) => {
    const updated = (article.materials || []).filter((m) => m.id !== itemId);
    onUpdateArticle({
      ...article,
      materials: updated,
      lastUpdated: new Date().toISOString(),
    });
  };

  const filteredBOM = (article.materials || []).filter((mat) => {
    const matchesCategory = categoryFilter === 'Semua' || mat.group === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      mat.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.usageArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mat.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const bomTotalCost = (article.materials || []).reduce(
    (sum, item) => sum + (item.costPerProduct || 0),
    0
  );

  return (
    <div className="space-y-4 text-xs text-slate-900">
      {/* Summary Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-slate-900">
              Total BOM Material: {formatIDR(bomTotalCost)}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              ({article.materials?.length || 0} item terdaftar)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#087E79]" />
            <span>
              Supplier otomatis terhubung ke Data Master. Harga satuan sinkron otomatis dari Master Data & dapat di-unlock untuk custom price.
            </span>
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#087E79] text-white text-xs font-bold hover:bg-[#066864] transition-colors shrink-0 shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Pilih Multi-Material (Resep BOM)</span>
        </button>
      </div>

      {/* Category Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['Semua', 'main_fabric', 'lining', 'zipper', 'rib', 'button', 'label', 'packaging', 'thread'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer capitalize ${
                categoryFilter === cat
                  ? 'bg-[#087E79] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white'
              }`}
            >
              {cat === 'Semua' ? 'Semua' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative shrink-0 w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari material / area / vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-[#087E79]"
          />
        </div>
      </div>

      {/* BOM Table */}
      {filteredBOM.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 font-extrabold text-slate-700">
                <th className="py-2.5 px-3">Item Material & Kelompok</th>
                <th className="py-2.5 px-3">Area Penggunaan</th>
                <th className="py-2.5 px-3">Supplier (Data Master)</th>
                <th className="py-2.5 px-2 text-center w-32">Konsumsi (Net + Waste%)</th>
                <th className="py-2.5 px-3 text-right w-44">Harga Satuan & Sync</th>
                <th className="py-2.5 px-3 text-right w-28">Biaya / Pcs</th>
                <th className="py-2.5 px-2 text-center w-10">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredBOM.map((mat) => {
                // Find matching master material
                const masterMat = masterMaterials.find((m) => m.id === mat.materialId);
                // Find supplier from master data
                const masterSup = masterSuppliers.find(
                  (s) => s.id === (masterMat?.preferredSupplierId || mat.supplierId)
                );
                const synchronizedSupplierName =
                  masterSup?.name || masterMat?.supplierName || mat.supplierName || 'Belum terhubung ke supplier';

                const isCustomPrice = mat.isCustomPrice || mat.isCustomOverride || false;
                const masterPrice = masterMat ? masterMat.latestPrice : mat.effectiveUnitPrice;

                const perSizeActive = !!mat.consumptionBySize;
                const isPerSizeOpen = !!perSizeOpen[mat.id];

                return (
                  <React.Fragment key={mat.id}>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    {/* Material Name & Code */}
                    <td className="py-2.5 px-3">
                      <span className="font-extrabold text-slate-900 block truncate max-w-[200px]" title={mat.materialName}>
                        {mat.materialName}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded font-mono font-bold uppercase border border-teal-200">
                          {mat.group.replace('_', ' ')}
                        </span>
                        {masterMat && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {masterMat.code}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Inline Edit Area Penggunaan */}
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={mat.usageArea || ''}
                        onChange={(e) => handleUpdateBOMItem(mat.id, 'usageArea', e.target.value)}
                        placeholder="Body Utama / Saku / Rib"
                        className="w-full p-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-[#087E79] focus:outline-none"
                      />
                    </td>

                    {/* Supplier Synchronized directly from Data Master (No dropdown!) */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <Building2 className="w-3.5 h-3.5 text-[#087E79] shrink-0" />
                          <span className="truncate max-w-[150px]" title={synchronizedSupplierName}>
                            {synchronizedSupplierName}
                          </span>
                        </div>
                        <span className="text-[9px] text-teal-700 font-semibold flex items-center gap-0.5 mt-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-[#087E79]" /> Sinkron Data Master
                        </span>
                      </div>
                    </td>

                    {/* Inline Edit Net Consumption & Waste % */}
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1 justify-center">
                        <input
                          type="number"
                          step="0.01"
                          value={mat.netConsumption || ''}
                          onChange={(e) => handleUpdateBOMItem(mat.id, 'netConsumption', e.target.value)}
                          disabled={perSizeActive}
                          title={perSizeActive ? 'Dikelola per ukuran (rata-rata otomatis)' : 'Konsumsi Bersih'}
                          className={`w-14 p-1 border rounded text-center font-mono font-bold text-xs focus:border-[#087E79] focus:outline-none ${
                            perSizeActive ? 'border-slate-200 bg-slate-100 text-slate-500' : 'border-slate-200 text-slate-900'
                          }`}
                        />
                        <span className="text-[10px] text-slate-500 font-mono">{mat.consumptionUnit}</span>
                        <span className="text-slate-300">+</span>
                        <div className="flex items-center border border-slate-200 rounded px-1 py-0.5 bg-slate-50">
                          <input
                            type="number"
                            value={mat.wastePercent || ''}
                            onChange={(e) => handleUpdateBOMItem(mat.id, 'wastePercent', e.target.value)}
                            className="w-8 text-center font-mono text-[10px] font-bold text-slate-700 focus:outline-none bg-transparent"
                            title="Waste %"
                          />
                          <span className="text-[9px] text-slate-400">%</span>
                        </div>
                      </div>
                      {/* Toggle konsumsi per-ukuran — kain ukuran besar biasanya lebih boros. */}
                      <div className="flex items-center justify-center mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (perSizeActive) {
                              setPerSizeOpen((prev) => ({ ...prev, [mat.id]: !prev[mat.id] }));
                            } else {
                              handleTogglePerSize(mat);
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-colors ${
                            perSizeActive
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                              : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                          }`}
                          title="Atur konsumsi berbeda tiap ukuran"
                        >
                          <Ruler className="w-2.5 h-2.5" />
                          <span>{perSizeActive ? `Per ukuran (avg ${mat.netConsumption})` : 'Per ukuran'}</span>
                        </button>
                      </div>
                    </td>

                    {/* Harga Satuan & Auto-Sync / Unlock Control */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center justify-end gap-1">
                          {/* Unlock/Lock Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleCustomPrice(mat)}
                            className={`p-1 rounded-md transition-all cursor-pointer border ${
                              isCustomPrice
                                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                                : 'bg-teal-50 text-[#087E79] border-teal-200 hover:bg-teal-100'
                            }`}
                            title={
                              isCustomPrice
                                ? 'Harga Custom (Unlocked). Klik untuk re-sync otomatis ke Master Data'
                                : 'Harga Terkunci & Sinkron Master Data. Klik untuk unlock & edit custom price'
                            }
                          >
                            {isCustomPrice ? (
                              <Unlock className="w-3.5 h-3.5" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <span className="text-slate-400 text-[10px]">Rp</span>

                          <input
                            type="number"
                            step="100"
                            value={mat.effectiveUnitPrice || ''}
                            onChange={(e) => handleUpdateBOMItem(mat.id, 'effectiveUnitPrice', e.target.value)}
                            className={`w-24 p-1 border rounded-lg text-right font-mono font-extrabold text-xs transition-colors focus:outline-none ${
                              isCustomPrice
                                ? 'border-amber-400 bg-amber-50/50 text-amber-900 focus:border-amber-600'
                                : 'border-slate-200 bg-slate-50/80 text-slate-900 focus:border-[#087E79]'
                            }`}
                          />
                        </div>

                        {/* Status Label & Re-sync helper */}
                        <div className="flex items-center gap-1 text-[9px]">
                          {isCustomPrice ? (
                            <>
                              <span className="px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800">
                                Custom Price
                              </span>
                              <button
                                type="button"
                                onClick={() => handleResetToMasterPrice(mat)}
                                className="text-slate-500 hover:text-[#087E79] underline flex items-center gap-0.5"
                                title={`Reset ke Master (Rp ${formatIDR(masterPrice)})`}
                              >
                                <RefreshCw className="w-2.5 h-2.5" /> Sync
                              </button>
                            </>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded font-bold bg-teal-50 text-[#087E79] border border-teal-200/80 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Sync Master ({formatIDR(masterPrice)})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Calculated Cost Per Product */}
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-[#087E79] text-xs">
                      {formatIDR(mat.costPerProduct)}
                    </td>

                    {/* Delete Item */}
                    <td className="py-2.5 px-2 text-center">
                      <ConfirmDeleteButton
                        onConfirm={() => handleRemoveMaterial(mat.id)}
                        label="Hapus item BOM"
                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      />
                    </td>
                  </tr>

                  {/* Baris editor konsumsi per-ukuran */}
                  {perSizeActive && isPerSizeOpen && (
                    <tr className="bg-indigo-50/40">
                      <td colSpan={7} className="px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-extrabold text-indigo-900 flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5" />
                            Konsumsi {mat.materialName} per ukuran ({mat.consumptionUnit})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePerSize(mat)}
                            className="text-[10px] font-bold text-slate-500 hover:text-rose-600 underline"
                          >
                            Matikan per-ukuran
                          </button>
                        </div>
                        {sizeSet.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic">
                            Tetapkan dulu rentang ukuran di lembar “Ukuran & Size Chart”.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {sizeSet.map((sz) => (
                              <div
                                key={sz}
                                className={`flex flex-col items-center rounded-lg border px-2 py-1.5 ${
                                  sz === article.baseSize ? 'border-[#087E79] bg-white' : 'border-slate-200 bg-white'
                                }`}
                              >
                                <span className="text-[9px] font-extrabold text-slate-500 uppercase">
                                  {sz}{sz === article.baseSize ? ' · base' : ''}
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={mat.consumptionBySize?.[sz] ?? ''}
                                  onChange={(e) => handleUpdatePerSizeConsumption(mat.id, sz, e.target.value)}
                                  className="w-16 mt-0.5 p-1 border border-slate-200 rounded text-center font-mono font-bold text-xs text-slate-900 focus:border-[#087E79] focus:outline-none"
                                />
                              </div>
                            ))}
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-indigo-300 bg-indigo-50/60 px-3 py-1.5">
                              <span className="text-[9px] font-extrabold text-indigo-500 uppercase">Rata-rata</span>
                              <span className="text-xs font-mono font-black text-indigo-800 mt-0.5">
                                {mat.netConsumption} {mat.consumptionUnit}
                              </span>
                            </div>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500 mt-2">
                          Biaya per pcs memakai rata-rata konsumsi ini agar HPP mencerminkan seluruh ukuran, bukan satu titik.
                        </p>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
          <Package className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
          <p className="font-semibold text-slate-900">
            {article.materials && article.materials.length > 0
              ? 'Tidak ada material yang sesuai filter kategori/pencarian.'
              : 'Belum ada material yang ditambahkan ke BOM.'}
          </p>
          <p>Gunakan tombol "Pilih Multi-Material (Resep BOM)" untuk menambahkan sekaligus beberapa kain, trimming, dan aksesori.</p>
        </div>
      )}

      {/* MULTI-SELECT ADD MATERIAL RESEP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl border border-slate-200 shadow-2xl space-y-4 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#087E79] text-white shrink-0">
                  <Layers className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      Pilih Resep Material (Multi-Select BOM)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#087E79] text-white">
                      {selectedMatIds.length} Terpilih
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Pilih beberapa bahan kain, lining, zipper, dan aksesori sekaligus. Supplier & harga otomatis disinkronkan dari Data Master.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Filter Tabs & Search Bar inside Modal */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pb-2 border-b border-slate-100">
                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none">
                  {[
                    { id: 'Semua', label: 'Semua' },
                    { id: 'main_fabric', label: 'Kain Utama' },
                    { id: 'lining', label: 'Lining' },
                    { id: 'rib', label: 'Rib' },
                    { id: 'zipper', label: 'Zipper' },
                    { id: 'button', label: 'Kancing' },
                    { id: 'label', label: 'Label' },
                    { id: 'packaging', label: 'Packaging' },
                    { id: 'thread', label: 'Benang' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setModalCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                        modalCategory === cat.id
                          ? 'bg-[#087E79] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-56 shrink-0">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kode/nama material..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#087E79]"
                  />
                </div>
              </div>

              {/* Bulk Select Control bar */}
              <div className="flex items-center justify-between bg-teal-50/60 p-2 rounded-xl border border-teal-100 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-[#087E79] font-bold hover:bg-teal-100/50 transition-colors cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Pilih Semua Terfilter ({filteredModalMaterials.length})</span>
                  </button>

                  {selectedMatIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedMatIds([])}
                      className="text-slate-500 hover:text-rose-600 font-semibold underline text-[11px]"
                    >
                      Batal Pilihan ({selectedMatIds.length})
                    </button>
                  )}
                </div>

                <span className="font-extrabold text-[#087E79]">
                  {selectedMatIds.length} item siap ditambahkan
                </span>
              </div>

              {/* Multi-select Items List */}
              <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
                {filteredModalMaterials.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-medium bg-slate-50 rounded-xl">
                    Tidak ada material ditemukan dalam Master Data.
                  </div>
                ) : (
                  filteredModalMaterials.map((mat) => {
                    const isSelected = selectedMatIds.includes(mat.id);
                    const matchedSup = masterSuppliers.find((s) => s.id === mat.preferredSupplierId);
                    const supplierName = matchedSup ? matchedSup.name : mat.supplierName || 'Belum terhubung ke supplier';
                    const config = matConfigs[mat.id] || { usageArea: 'Body Utama', netConsumption: 1.0, wastePercent: 3 };

                    return (
                      <div
                        key={mat.id}
                        onClick={() => handleToggleSelectMaterial(mat.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          isSelected
                            ? 'bg-teal-50/40 border-[#087E79] shadow-2xs ring-1 ring-[#087E79]/30'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              className={`p-0.5 rounded transition-colors ${
                                isSelected ? 'text-[#087E79]' : 'text-slate-300'
                              }`}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 fill-teal-100 text-[#087E79]" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-300" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-extrabold text-[#087E79] bg-teal-100/60 px-1.5 py-0.2 rounded">
                                  {mat.code}
                                </span>
                                <span className="text-[10px] font-extrabold text-slate-600 capitalize bg-slate-100 px-1.5 py-0.2 rounded">
                                  {mat.group.replace('_', ' ')}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-xs text-slate-900 mt-0.5 truncate">
                                {mat.name}
                              </h4>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-extrabold text-[#087E79] text-xs">
                              {formatIDR(mat.latestPrice)} / {mat.stockUnit}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold flex items-center justify-end gap-1 mt-0.5">
                              <Building2 className="w-2.5 h-2.5 text-slate-400" />
                              <span className="truncate max-w-[130px]">{supplierName}</span>
                            </div>
                          </div>
                        </div>

                        {/* If Selected, Show inline settings for Area & Consumption */}
                        {isSelected && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-2 border-t border-teal-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-teal-100"
                          >
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                Area Penggunaan
                              </label>
                              <input
                                type="text"
                                value={config.usageArea}
                                onChange={(e) =>
                                  setMatConfigs((prev) => ({
                                    ...prev,
                                    [mat.id]: { ...config, usageArea: e.target.value },
                                  }))
                                }
                                placeholder="Area penggunaan..."
                                className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-900 focus:border-[#087E79] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                Konsumsi Net ({mat.stockUnit})
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={config.netConsumption}
                                onChange={(e) =>
                                  setMatConfigs((prev) => ({
                                    ...prev,
                                    [mat.id]: { ...config, netConsumption: Number(e.target.value) },
                                  }))
                                }
                                className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-900 font-mono font-bold focus:border-[#087E79] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                Waste %
                              </label>
                              <input
                                type="number"
                                value={config.wastePercent}
                                onChange={(e) =>
                                  setMatConfigs((prev) => ({
                                    ...prev,
                                    [mat.id]: { ...config, wastePercent: Number(e.target.value) },
                                  }))
                                }
                                className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-900 font-mono font-bold focus:border-[#087E79] focus:outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs font-extrabold text-slate-700">
                {selectedMatIds.length > 0
                  ? `${selectedMatIds.length} Material Terpilih untuk Resep BOM`
                  : 'Pilih minimal 1 material'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  onClick={handleAddMultipleMaterials}
                  disabled={selectedMatIds.length === 0}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-2xs ${
                    selectedMatIds.length > 0
                      ? 'bg-[#087E79] hover:bg-[#066864] cursor-pointer'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan ({selectedMatIds.length}) Material ke BOM</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
