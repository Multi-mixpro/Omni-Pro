/**
 * Product Launch OS 3.0 - Master Data Central Engine View
 * High-Density List Layout, Pop-up Detail Modal, and Full CRUD Engine
 * Enhanced with Sorting, Category Pills, Direct Price Editing,
 * Color & Size Variant Management, and Synchronized Supplier Linking.
 */

import React, { useState } from 'react';
import {
  Database,
  Search,
  Plus,
  Building2,
  Package,
  Scissors,
  Edit3,
  Trash2,
  Eye,
  X,
  Phone,
  User,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Filter,
  Palette,
  Ruler,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { Supplier, MaterialMaster, ServiceMaster, MaterialLink } from '../../types';
import { formatIDR } from '../../utils/calculations';
import { WhatsAppButton } from '../shared/WhatsAppButton';
import { MaterialLinksEditor } from '../shared/MaterialLinksEditor';

interface MasterDataViewProps {
  suppliers: Supplier[];
  materials: MaterialMaster[];
  services: ServiceMaster[];
  onAddSupplier?: (supplier: Supplier) => void;
  onUpdateSupplier?: (supplier: Supplier) => void;
  onDeleteSupplier?: (id: string) => void;
  onAddMaterial?: (material: MaterialMaster) => void;
  onUpdateMaterial?: (material: MaterialMaster) => void;
  onDeleteMaterial?: (id: string) => void;
  onAddService?: (service: ServiceMaster) => void;
  onUpdateService?: (service: ServiceMaster) => void;
  onDeleteService?: (id: string) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  suppliers,
  materials,
  services,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onAddService,
  onUpdateService,
  onDeleteService,
}) => {
  const [activeMasterTab, setActiveMasterTab] = useState<'suppliers' | 'materials' | 'services'>('materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'code' | 'moq'>('name_asc');

  // Selected item state for Detail/Edit Popup Modal
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialMaster | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceMaster | null>(null);

  // Modal view mode: 'view' | 'edit'
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

  // Modal Create state
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal Delete confirmation state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    id: string;
    type: 'supplier' | 'material' | 'service';
    name: string;
    code: string;
  } | null>(null);

  // Edit Forms state
  const [editSupForm, setEditSupForm] = useState<Partial<Supplier>>({});
  const [editMatForm, setEditMatForm] = useState<Partial<MaterialMaster>>({});
  const [editSrvForm, setEditSrvForm] = useState<Partial<ServiceMaster>>({});

  // Input states for variant tag additions in Edit Modal
  const [editColorInput, setEditColorInput] = useState('');
  const [editSizeInput, setEditSizeInput] = useState('');

  // Input states for variant tag additions in Add Modal
  const [addMatColors, setAddMatColors] = useState<string[]>(['Hitam Jetblack', 'Navy Dark', 'Off-White']);
  const [addMatSizes, setAddMatSizes] = useState<string[]>(['Lebar 185cm (72")']);
  const [addMatColorInput, setAddMatColorInput] = useState('');
  const [addMatSizeInput, setAddMatSizeInput] = useState('');
  const [addMatLinks, setAddMatLinks] = useState<MaterialLink[]>([]);

  // Add Forms state
  const [addSup, setAddSup] = useState({
    code: '',
    name: '',
    type: 'material' as Supplier['type'],
    address: 'Kawasan Industri Textile, Bandung',
    picName: '',
    picContact: '',
    verificationStatus: 'Verified' as Supplier['verificationStatus'],
    paymentTerms: 'TOP 30 Days',
    moqDefault: 100,
    leadTimeDays: 14,
    qualityScore: 95,
    onTimeDeliveryRate: 98,
    status: 'Active' as Supplier['status'],
  });

  const [addMat, setAddMat] = useState({
    code: '',
    name: '',
    group: 'main_fabric' as MaterialMaster['group'],
    composition: '100% Cotton Combed',
    gsmOrWeight: '220 GSM',
    width: '72 inch',
    stockUnit: 'kg',
    purchaseUnit: 'roll',
    conversionFactor: 50,
    defaultWastePercent: 3,
    preferredSupplierId: suppliers[0]?.id || 'sup-1',
    latestPrice: 48000,
    currency: 'IDR',
    moq: 50,
    leadTimeDays: 7,
    status: 'Active' as MaterialMaster['status'],
  });

  const [addSrv, setAddSrv] = useState({
    code: '',
    name: '',
    category: 'CMT Jahit',
    calculationMethod: 'per_unit' as ServiceMaster['calculationMethod'],
    defaultRate: 18000,
    unitLabel: 'Pcs',
  });

  // Filtering & Sorting Suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.picName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || s.type === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtering & Sorting Materials
  const filteredMaterials = materials
    .filter((m) => {
      const sup = suppliers.find((s) => s.id === m.preferredSupplierId);
      const supplierName = sup ? sup.name : m.supplierName || '';

      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.composition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.availableColors && m.availableColors.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (m.availableSizes && m.availableSizes.some((sz) => sz.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesCat = categoryFilter === 'all' || m.group === categoryFilter;
      const matchesSup = supplierFilter === 'all' || m.preferredSupplierId === supplierFilter;

      return matchesSearch && matchesCat && matchesSup;
    })
    .sort((a, b) => {
      if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
      if (sortOption === 'name_desc') return b.name.localeCompare(a.name);
      if (sortOption === 'price_asc') return a.latestPrice - b.latestPrice;
      if (sortOption === 'price_desc') return b.latestPrice - a.latestPrice;
      if (sortOption === 'code') return a.code.localeCompare(b.code);
      if (sortOption === 'moq') return a.moq - b.moq;
      return 0;
    });

  // Filtering Services
  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Open Detail Modal
  const handleOpenSupplierDetail = (sup: Supplier, mode: 'view' | 'edit' = 'view') => {
    setSelectedSupplier(sup);
    setEditSupForm({ ...sup });
    setModalMode(mode);
  };

  const handleOpenMaterialDetail = (mat: MaterialMaster, mode: 'view' | 'edit' = 'view') => {
    setSelectedMaterial(mat);
    setEditMatForm({ ...mat });
    setModalMode(mode);
  };

  const handleOpenServiceDetail = (srv: ServiceMaster, mode: 'view' | 'edit' = 'view') => {
    setSelectedService(srv);
    setEditSrvForm({ ...srv });
    setModalMode(mode);
  };

  // Close Detail Modal
  const handleCloseDetailModal = () => {
    setSelectedSupplier(null);
    setSelectedMaterial(null);
    setSelectedService(null);
    setModalMode('view');
  };

  // Jump to supplier from material modal/table
  const handleJumpToSupplier = (supplierId: string) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (sup) {
      handleCloseDetailModal();
      setActiveMasterTab('suppliers');
      handleOpenSupplierDetail(sup, 'view');
    }
  };

  // Inline Direct Price Change for Materials Table
  const handleInlinePriceChange = (mat: MaterialMaster, newPrice: number) => {
    if (!onUpdateMaterial) return;
    const sup = suppliers.find((s) => s.id === mat.preferredSupplierId);
    onUpdateMaterial({
      ...mat,
      latestPrice: Math.max(0, newPrice),
      supplierName: sup ? sup.name : mat.supplierName,
    });
  };

  // Variant color/size additions in Edit Material Form
  const handleAddColorToEditMat = () => {
    if (!editColorInput.trim()) return;
    const current = editMatForm.availableColors || [];
    if (!current.includes(editColorInput.trim())) {
      setEditMatForm((prev) => ({
        ...prev,
        availableColors: [...current, editColorInput.trim()],
      }));
    }
    setEditColorInput('');
  };

  const handleRemoveColorFromEditMat = (color: string) => {
    const current = editMatForm.availableColors || [];
    setEditMatForm((prev) => ({
      ...prev,
      availableColors: current.filter((c) => c !== color),
    }));
  };

  const handleAddSizeToEditMat = () => {
    if (!editSizeInput.trim()) return;
    const current = editMatForm.availableSizes || [];
    if (!current.includes(editSizeInput.trim())) {
      setEditMatForm((prev) => ({
        ...prev,
        availableSizes: [...current, editSizeInput.trim()],
      }));
    }
    setEditSizeInput('');
  };

  const handleRemoveSizeFromEditMat = (size: string) => {
    const current = editMatForm.availableSizes || [];
    setEditMatForm((prev) => ({
      ...prev,
      availableSizes: current.filter((s) => s !== size),
    }));
  };

  // Variant color/size additions in Add Material Form
  const handleAddColorToAddMat = () => {
    if (!addMatColorInput.trim()) return;
    if (!addMatColors.includes(addMatColorInput.trim())) {
      setAddMatColors((prev) => [...prev, addMatColorInput.trim()]);
    }
    setAddMatColorInput('');
  };

  const handleRemoveColorFromAddMat = (color: string) => {
    setAddMatColors((prev) => prev.filter((c) => c !== color));
  };

  const handleAddSizeToAddMat = () => {
    if (!addMatSizeInput.trim()) return;
    if (!addMatSizes.includes(addMatSizeInput.trim())) {
      setAddMatSizes((prev) => [...prev, addMatSizeInput.trim()]);
    }
    setAddMatSizeInput('');
  };

  const handleRemoveSizeFromAddMat = (size: string) => {
    setAddMatSizes((prev) => prev.filter((s) => s !== size));
  };

  // Save Edit Actions
  const handleSaveEditSupplier = () => {
    if (!selectedSupplier || !onUpdateSupplier) return;
    const updated: Supplier = {
      ...selectedSupplier,
      ...editSupForm,
    };
    onUpdateSupplier(updated);
    setSelectedSupplier(updated);
    setModalMode('view');
  };

  const handleSaveEditMaterial = () => {
    if (!selectedMaterial || !onUpdateMaterial) return;
    const selectedSup = suppliers.find((s) => s.id === editMatForm.preferredSupplierId);
    const updated: MaterialMaster = {
      ...selectedMaterial,
      ...editMatForm,
      supplierName: selectedSup ? selectedSup.name : selectedMaterial.supplierName,
    };
    onUpdateMaterial(updated);
    setSelectedMaterial(updated);
    setModalMode('view');
  };

  const handleSaveEditService = () => {
    if (!selectedService || !onUpdateService) return;
    const updated: ServiceMaster = {
      ...selectedService,
      ...editSrvForm,
    };
    onUpdateService(updated);
    setSelectedService(updated);
    setModalMode('view');
  };

  // Create Actions
  const handleCreateSupplier = () => {
    if (!addSup.name) return;
    if (onAddSupplier) {
      onAddSupplier({
        id: crypto.randomUUID(),
        code: addSup.code || `SUP-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        name: addSup.name,
        type: addSup.type,
        address: addSup.address,
        picName: addSup.picName,
        picContact: addSup.picContact,
        verificationStatus: addSup.verificationStatus,
        paymentTerms: addSup.paymentTerms,
        moqDefault: Number(addSup.moqDefault) || 0,
        leadTimeDays: Number(addSup.leadTimeDays) || 0,
        qualityScore: Number(addSup.qualityScore) || 0,
        onTimeDeliveryRate: Number(addSup.onTimeDeliveryRate) || 0,
        status: addSup.status,
      });
    }
    setShowAddModal(false);
    setAddSup({
      code: '',
      name: '',
      type: 'material',
      address: 'Kawasan Industri Textile, Bandung',
      picName: '',
      picContact: '',
      verificationStatus: 'Verified',
      paymentTerms: 'TOP 30 Days',
      moqDefault: 100,
      leadTimeDays: 14,
      qualityScore: 95,
      onTimeDeliveryRate: 98,
      status: 'Active',
    });
  };

  const handleCreateMaterial = () => {
    if (!addMat.name) return;
    const selectedSup = suppliers.find((s) => s.id === addMat.preferredSupplierId);

    if (onAddMaterial) {
      onAddMaterial({
        id: crypto.randomUUID(),
        code: addMat.code || `FAB-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        name: addMat.name,
        group: addMat.group,
        composition: addMat.composition,
        gsmOrWeight: addMat.gsmOrWeight,
        width: addMat.width,
        stockUnit: addMat.stockUnit,
        purchaseUnit: addMat.purchaseUnit,
        conversionFactor: Number(addMat.conversionFactor) || 1,
        defaultWastePercent: Number(addMat.defaultWastePercent) || 3,
        preferredSupplierId: addMat.preferredSupplierId || suppliers[0]?.id || 'sup-1',
        supplierName: selectedSup?.name,
        latestPrice: Number(addMat.latestPrice) || 0,
        currency: 'IDR',
        availableColors: addMatColors,
        availableSizes: addMatSizes,
        links: addMatLinks,
        moq: Number(addMat.moq) || 50,
        leadTimeDays: Number(addMat.leadTimeDays) || 7,
        status: addMat.status,
      });
    }
    setShowAddModal(false);
    setAddMatLinks([]);
    setAddMat({
      code: '',
      name: '',
      group: 'main_fabric',
      composition: '100% Cotton Combed',
      gsmOrWeight: '220 GSM',
      width: '72 inch',
      stockUnit: 'kg',
      purchaseUnit: 'roll',
      conversionFactor: 50,
      defaultWastePercent: 3,
      preferredSupplierId: suppliers[0]?.id || 'sup-1',
      latestPrice: 48000,
      currency: 'IDR',
      moq: 50,
      leadTimeDays: 7,
      status: 'Active',
    });
  };

  const handleCreateService = () => {
    if (!addSrv.name) return;
    if (onAddService) {
      onAddService({
        id: crypto.randomUUID(),
        code: addSrv.code || `CMT-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        name: addSrv.name,
        category: addSrv.category,
        calculationMethod: addSrv.calculationMethod,
        defaultRate: Number(addSrv.defaultRate) || 0,
        unitLabel: addSrv.unitLabel,
      });
    }
    setShowAddModal(false);
    setAddSrv({
      code: '',
      name: '',
      category: 'CMT Jahit',
      calculationMethod: 'per_unit',
      defaultRate: 18000,
      unitLabel: 'Pcs',
    });
  };

  // Delete Action
  const handleExecuteDelete = () => {
    if (!deleteConfirmItem) return;
    if (deleteConfirmItem.type === 'supplier' && onDeleteSupplier) {
      onDeleteSupplier(deleteConfirmItem.id);
      if (selectedSupplier?.id === deleteConfirmItem.id) handleCloseDetailModal();
    } else if (deleteConfirmItem.type === 'material' && onDeleteMaterial) {
      onDeleteMaterial(deleteConfirmItem.id);
      if (selectedMaterial?.id === deleteConfirmItem.id) handleCloseDetailModal();
    } else if (deleteConfirmItem.type === 'service' && onDeleteService) {
      onDeleteService(deleteConfirmItem.id);
      if (selectedService?.id === deleteConfirmItem.id) handleCloseDetailModal();
    }
    setDeleteConfirmItem(null);
  };

  return (
    <div className="space-y-4 pb-16 text-xs text-slate-900 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-teal-50 to-teal-100/60 border border-teal-200 p-3.5 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="p-2.5 rounded-2xl bg-white text-teal-600 shrink-0 mt-0.5 shadow-2xs">
            <Database className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-extrabold text-teal-950">
                Master Data Central Engine
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-teal-700">
                Engine V3.0
              </span>
            </div>
            <p className="text-[11px] text-teal-900/70 mt-1 max-w-xl">
              Pusat pengelolaan Master Material, Aksesori, Supplier Terintegrasi & Tarif CMT.
              Edit harga bahan baku langsung dari tabel, kelola varian warna & ukuran, dan sinkronkan dengan database supplier.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#087E79] hover:bg-[#066864] text-white text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>
            {activeMasterTab === 'suppliers' && '+ Tambah Supplier'}
            {activeMasterTab === 'materials' && '+ Tambah Material / Aksesori'}
            {activeMasterTab === 'services' && '+ Tambah CMT / Layanan'}
          </span>
        </button>
      </div>

      {/* Tabs & Filter Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Navigation Master Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <button
            onClick={() => {
              setActiveMasterTab('materials');
              setCategoryFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeMasterTab === 'materials'
                ? 'bg-[#087E79] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Materials & Trimmings ({materials.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveMasterTab('suppliers');
              setCategoryFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeMasterTab === 'suppliers'
                ? 'bg-[#087E79] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Suppliers & Vendor ({suppliers.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveMasterTab('services');
              setCategoryFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              activeMasterTab === 'services'
                ? 'bg-[#087E79] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Services & CMT ({services.length})</span>
          </button>
        </div>

        {/* Quick Category Filter Pills for Materials */}
        {activeMasterTab === 'materials' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-slate-100">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Kelompok:
            </span>
            {[
              { id: 'all', label: 'Semua Material' },
              { id: 'main_fabric', label: 'Kain Utama' },
              { id: 'lining', label: 'Furing / Lining' },
              { id: 'rib', label: 'Rib / Collar' },
              { id: 'zipper', label: 'Zipper' },
              { id: 'button', label: 'Kancing' },
              { id: 'thread', label: 'Benang' },
              { id: 'label', label: 'Label & Tag' },
              { id: 'packaging', label: 'Packaging' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setCategoryFilter(pill.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all shrink-0 cursor-pointer border ${
                  categoryFilter === pill.id
                    ? 'bg-teal-50 border-[#087E79] text-[#087E79] shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        )}

        {/* Filter & Search Bar Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          {/* Real-time Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Cari dalam master ${
                activeMasterTab === 'suppliers'
                  ? 'supplier, kode, PIC...'
                  : activeMasterTab === 'materials'
                  ? 'material, warna, ukuran, supplier...'
                  : 'layanan, kode, kategori...'
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#087E79] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Supplier & Sorting Dropdowns */}
          {activeMasterTab === 'materials' && (
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {/* Supplier Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-200 w-1/2 sm:w-auto">
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full"
                >
                  <option value="all">Semua Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-200 w-1/2 sm:w-auto">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer w-full"
                >
                  <option value="name_asc">Urut: Nama (A - Z)</option>
                  <option value="name_desc">Urut: Nama (Z - A)</option>
                  <option value="price_asc">Urut: Harga Terendah</option>
                  <option value="price_desc">Urut: Harga Tertinggi</option>
                  <option value="moq">Urut: MOQ Terkecil</option>
                  <option value="code">Urut: Kode Material</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LIST TABLE SECTION */}
      {/* 1. MATERIALS LIST TABLE */}
      {activeMasterTab === 'materials' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Kode & Supplier Master</th>
                  <th className="py-3 px-3">Nama Material & Varian</th>
                  <th className="py-3 px-3">Kelompok</th>
                  <th className="py-3 px-3">Komposisi & Spec</th>
                  <th className="py-3 px-3 min-w-[160px]">Input Harga Bahan Baku (IDR)</th>
                  <th className="py-3 px-3">MOQ & Lead Time</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada material yang sesuai dengan kriteria pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredMaterials.map((mat) => {
                    const matchedSupplier = suppliers.find((s) => s.id === mat.preferredSupplierId);
                    const supplierDisplayName = matchedSupplier ? matchedSupplier.name : mat.supplierName || 'Belum terhubung ke supplier';

                    return (
                      <tr
                        key={mat.id}
                        onClick={() => handleOpenMaterialDetail(mat, 'view')}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Kode & Synchronized Supplier Link */}
                        <td className="py-3 px-3">
                          <span className="font-mono font-extrabold text-[#087E79] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 block w-fit text-[11px]">
                            {mat.code}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (mat.preferredSupplierId) {
                                handleJumpToSupplier(mat.preferredSupplierId);
                              }
                            }}
                            className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-[#087E79] hover:underline"
                            title="Buka Profile Supplier di Master Data"
                          >
                            <Building2 className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[120px]">{supplierDisplayName}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                          </button>
                        </td>

                        {/* Nama Material & Color / Size Variant Badges */}
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-slate-900 group-hover:text-[#087E79] transition-colors">
                            {mat.name}
                          </div>

                          {/* Color and Size Variants badges */}
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {mat.availableColors && mat.availableColors.length > 0 ? (
                              mat.availableColors.slice(0, 3).map((col, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center gap-1"
                                >
                                  <Palette className="w-2.5 h-2.5 text-[#087E79]" />
                                  <span>{col}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Standard Colors</span>
                            )}

                            {mat.availableColors && mat.availableColors.length > 3 && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 rounded">
                                +{mat.availableColors.length - 3}
                              </span>
                            )}

                            {mat.availableSizes && mat.availableSizes.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-0.5">
                                <Ruler className="w-2.5 h-2.5" />
                                <span>{mat.availableSizes[0]}</span>
                              </span>
                            )}

                            {(mat.links || []).length > 0 && (
                              <span
                                title={`${mat.links?.length} tautan katalog tersimpan`}
                                className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200/80 flex items-center gap-0.5"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>{mat.links?.length} link</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Kelompok */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700 capitalize border border-slate-200">
                            {mat.group.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Komposisi & Spec */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800">{mat.composition}</div>
                          <div className="text-[11px] text-slate-500">{mat.gsmOrWeight}</div>
                        </td>

                        {/* Direct Editable Raw Material Price Input */}
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 focus-within:border-[#087E79] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#087E79]/20 transition-all">
                            <span className="font-mono text-[10px] font-bold text-slate-400">Rp</span>
                            <input
                              type="number"
                              value={mat.latestPrice}
                              onChange={(e) => handleInlinePriceChange(mat, Number(e.target.value))}
                              className="w-full font-mono font-extrabold text-[#087E79] bg-transparent focus:outline-none text-xs"
                            />
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">/{mat.stockUnit}</span>
                          </div>
                        </td>

                        {/* MOQ & Lead Time */}
                        <td className="py-3 px-3 font-medium text-slate-600">
                          <div>
                            MOQ: <span className="font-bold text-slate-800">{mat.moq}</span> {mat.stockUnit}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Lead Time: <span className="font-bold text-slate-700">{mat.leadTimeDays} Hari</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenMaterialDetail(mat, 'view')}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#087E79] hover:text-white text-slate-600 transition-colors"
                              title="Lihat Detail Pop-up"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenMaterialDetail(mat, 'edit')}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 transition-colors"
                              title="Edit Data Material & Varian"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirmItem({
                                  id: mat.id,
                                  type: 'material',
                                  name: mat.name,
                                  code: mat.code,
                                })
                              }
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-600 transition-colors"
                              title="Hapus Material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-List View */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredMaterials.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-medium">
                Tidak ada material ditemukan.
              </div>
            ) : (
              filteredMaterials.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => handleOpenMaterialDetail(mat, 'view')}
                  className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer space-y-2 active:bg-slate-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-[#087E79] bg-[#DDF4F1] px-1.5 py-0.2 rounded">
                        {mat.code}
                      </span>
                      <h3 className="font-extrabold text-xs text-slate-900 mt-1">{mat.name}</h3>
                    </div>

                    <div className="text-right shrink-0" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5">
                        <span className="font-mono text-[9px] text-slate-400">Rp</span>
                        <input
                          type="number"
                          value={mat.latestPrice}
                          onChange={(e) => handleInlinePriceChange(mat, Number(e.target.value))}
                          className="w-20 font-mono font-extrabold text-[#087E79] text-xs bg-transparent focus:outline-none"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 block font-medium">/{mat.stockUnit}</span>
                    </div>
                  </div>

                  {/* Colors / Sizes badge */}
                  <div className="flex flex-wrap gap-1">
                    {mat.availableColors?.map((c, i) => (
                      <span key={i} className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-600">
                    <span className="capitalize text-slate-500">Kelompok: {mat.group.replace('_', ' ')}</span>
                    <span className="font-bold">MOQ: {mat.moq} {mat.stockUnit}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. SUPPLIERS LIST TABLE */}
      {activeMasterTab === 'suppliers' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Supplier & Alamat</th>
                  <th className="py-3 px-4">Jenis Vendor</th>
                  <th className="py-3 px-4">PIC & Kontak</th>
                  <th className="py-3 px-4">Term Pembayaran</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada supplier yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((sup) => (
                    <tr
                      key={sup.id}
                      onClick={() => handleOpenSupplierDetail(sup, 'view')}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#087E79]">
                        {sup.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 group-hover:text-[#087E79] transition-colors">
                          {sup.name}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{sup.address}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 capitalize border border-slate-200">
                          {sup.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{sup.picName}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-500 font-mono">{sup.picContact}</span>
                          <WhatsAppButton
                            phone={sup.picContact}
                            contactName={sup.picName || sup.name}
                            message={`Halo ${sup.picName || sup.name}, saya dari GG Indo Apparel ingin menanyakan mengenai pengadaan material.`}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {sup.paymentTerms}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            sup.verificationStatus === 'Verified'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {sup.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenSupplierDetail(sup, 'view')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#087E79] hover:text-white text-slate-600 transition-colors"
                            title="Lihat Detail Pop-up"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenSupplierDetail(sup, 'edit')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 transition-colors"
                            title="Edit Data"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirmItem({
                                id: sup.id,
                                type: 'supplier',
                                name: sup.name,
                                code: sup.code,
                              })
                            }
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-600 transition-colors"
                            title="Hapus Supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SERVICES LIST TABLE */}
      {activeMasterTab === 'services' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Layanan / CMT</th>
                  <th className="py-3 px-4">Kategori Service</th>
                  <th className="py-3 px-4">Metode Perhitungan</th>
                  <th className="py-3 px-4">Tarif Standar</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada service/CMT yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((srv) => (
                    <tr
                      key={srv.id}
                      onClick={() => handleOpenServiceDetail(srv, 'view')}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#087E79]">
                        {srv.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 group-hover:text-[#087E79] transition-colors">
                          {srv.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          {srv.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600 capitalize">
                        {srv.calculationMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-[#087E79]">
                        {formatIDR(srv.defaultRate)} / {srv.unitLabel}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenServiceDetail(srv, 'view')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#087E79] hover:text-white text-slate-600 transition-colors"
                            title="Lihat Detail Pop-up"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenServiceDetail(srv, 'edit')}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 transition-colors"
                            title="Edit Data"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirmItem({
                                id: srv.id,
                                type: 'service',
                                name: srv.name,
                                code: srv.code,
                              })
                            }
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-600 transition-colors"
                            title="Hapus Service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POP-UP DETAIL / EDIT MODAL FOR MATERIAL */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl space-y-4 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#087E79] text-white">
                  <Package className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-emerald-400 font-bold">{selectedMaterial.code}</span>
                    <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300 capitalize">
                      {selectedMaterial.group.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="font-extrabold text-sm sm:text-base text-white">{selectedMaterial.name}</h2>
                </div>
              </div>

              <button
                onClick={handleCloseDetailModal}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* View vs Edit Tab Toggle inside Modal */}
            <div className="px-4 pt-1 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  onClick={() => setModalMode('view')}
                  className={`pb-2.5 px-2 transition-colors relative ${
                    modalMode === 'view' ? 'text-[#087E79] border-b-2 border-[#087E79]' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail Informasi & Spec</span>
                  </div>
                </button>
                <button
                  onClick={() => setModalMode('edit')}
                  className={`pb-2.5 px-2 transition-colors relative ${
                    modalMode === 'edit' ? 'text-[#087E79] border-b-2 border-[#087E79]' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Harga & Varian</span>
                  </div>
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">ID: {selectedMaterial.id}</span>
            </div>

            {/* Modal Body: VIEW MODE */}
            {modalMode === 'view' && (
              <div className="p-4 space-y-4 text-xs">
                {/* Highlight Price & Synchronized Supplier Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-teal-800 uppercase block">Harga Terbaru Bahan Baku</span>
                      <span className="font-mono font-extrabold text-lg text-[#087E79]">
                        {formatIDR(selectedMaterial.latestPrice)} / {selectedMaterial.stockUnit}
                      </span>
                    </div>

                    <div className="text-[10px] text-teal-800 font-bold mt-2">
                      Waste Standard: {selectedMaterial.defaultWastePercent}%
                    </div>
                  </div>

                  {/* Synchronized Preferred Supplier Card */}
                  {(() => {
                    const linkedSupplier = suppliers.find((s) => s.id === selectedMaterial.preferredSupplierId);
                    return (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Supplier Sumber</span>
                          {linkedSupplier && (
                            <button
                              onClick={() => handleJumpToSupplier(selectedMaterial.preferredSupplierId)}
                              className="text-[10px] font-bold text-[#087E79] hover:underline flex items-center gap-0.5"
                            >
                              Lihat Profile <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="font-extrabold text-slate-900 text-xs">
                          {linkedSupplier?.name || selectedMaterial.supplierName || 'Belum terhubung ke supplier'}
                        </div>

                        {linkedSupplier ? (
                          <div className="text-[11px] text-slate-500 font-medium">
                            PIC: {linkedSupplier.picName} ({linkedSupplier.picContact})
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            Pilih supplier di form edit untuk menyinkronkan data PIC & kontak.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Variant Color & Size Badges */}
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Opsi Variant Warna Tersedia ({selectedMaterial.availableColors?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMaterial.availableColors && selectedMaterial.availableColors.length > 0 ? (
                        selectedMaterial.availableColors.map((col, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-2xs flex items-center gap-1.5"
                          >
                            <Palette className="w-3.5 h-3.5 text-[#087E79]" />
                            <span>{col}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Belum ada variant warna terdaftar.</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Opsi Variant Ukuran / Lebar Kain ({selectedMaterial.availableSizes?.length || 0})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMaterial.availableSizes && selectedMaterial.availableSizes.length > 0 ? (
                        selectedMaterial.availableSizes.map((sz, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-1.5"
                          >
                            <Ruler className="w-3.5 h-3.5 text-amber-600" />
                            <span>{sz}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Lebar / Ukuran Standard ({selectedMaterial.width})</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tautan katalog & referensi web */}
                {(selectedMaterial.links || []).length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Tautan Katalog & Referensi ({selectedMaterial.links?.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {(selectedMaterial.links || []).map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          title={link.url}
                          className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-[#087E79] hover:border-[#087E79] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{link.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specs Details */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block font-medium">Komposisi Bahan</span>
                      <span className="font-bold text-slate-900">{selectedMaterial.composition}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block font-medium">Gramasi / Berat (GSM)</span>
                      <span className="font-bold text-slate-900">{selectedMaterial.gsmOrWeight}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                    <div>
                      <span className="text-slate-500 block font-medium">Minimum Order (MOQ)</span>
                      <span className="font-bold text-slate-900">
                        {selectedMaterial.moq} {selectedMaterial.stockUnit}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block font-medium">Lead Time Sourcing</span>
                      <span className="font-bold text-slate-900">{selectedMaterial.leadTimeDays} Hari Kerja</span>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() =>
                      setDeleteConfirmItem({
                        id: selectedMaterial.id,
                        type: 'material',
                        name: selectedMaterial.name,
                        code: selectedMaterial.code,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition-all border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Data</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseDetailModal}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={() => setModalMode('edit')}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#087E79] text-white font-bold hover:bg-[#066864] transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Material & Varian</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body: EDIT MODE */}
            {modalMode === 'edit' && (
              <div className="p-4 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Material / Kain</label>
                  <input
                    type="text"
                    value={editMatForm.name || ''}
                    onChange={(e) => setEditMatForm({ ...editMatForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-[#087E79]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Material</label>
                    <input
                      type="text"
                      value={editMatForm.code || ''}
                      onChange={(e) => setEditMatForm({ ...editMatForm, code: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kelompok Material</label>
                    <select
                      value={editMatForm.group || 'main_fabric'}
                      onChange={(e) => setEditMatForm({ ...editMatForm, group: e.target.value as any })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-medium capitalize"
                    >
                      <option value="main_fabric">Kain Utama</option>
                      <option value="lining">Furing / Lining</option>
                      <option value="rib">Rib / Leher</option>
                      <option value="zipper">Zipper / Ritsleting</option>
                      <option value="button">Kancing / Button</option>
                      <option value="thread">Benang</option>
                      <option value="label">Label & Tag</option>
                      <option value="packaging">Packaging</option>
                    </select>
                  </div>
                </div>

                {/* Synchronized Preferred Supplier Selection */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Sumber Supplier Utama (Master Sync)</span>
                    <span className="text-[10px] text-[#087E79] font-mono">Tersinkronisasi</span>
                  </label>
                  <select
                    value={editMatForm.preferredSupplierId || suppliers[0]?.id || ''}
                    onChange={(e) => {
                      const supId = e.target.value;
                      const matchedSup = suppliers.find((s) => s.id === supId);
                      setEditMatForm({
                        ...editMatForm,
                        preferredSupplierId: supId,
                        supplierName: matchedSup ? matchedSup.name : editMatForm.supplierName,
                      });
                    }}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-[#087E79]"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) — {s.paymentTerms}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input Harga & Satuan */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Input Harga Bahan Baku (IDR)</label>
                    <input
                      type="number"
                      value={editMatForm.latestPrice || 0}
                      onChange={(e) => setEditMatForm({ ...editMatForm, latestPrice: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono font-extrabold text-[#087E79]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Satuan Stok / Beli</label>
                    <input
                      type="text"
                      value={editMatForm.stockUnit || ''}
                      onChange={(e) => setEditMatForm({ ...editMatForm, stockUnit: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                {/* Edit Color Variants Section */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-800">Kelola Variant Warna</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tambah warna baru (mis: Off-White, Olive)..."
                      value={editColorInput}
                      onChange={(e) => setEditColorInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColorToEditMat())}
                      className="flex-1 p-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddColorToEditMat}
                      className="px-3 py-2 rounded-xl bg-[#087E79] text-white font-bold text-xs hover:bg-[#066864]"
                    >
                      + Tambah
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {editMatForm.availableColors?.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800 text-xs flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{c}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveColorFromEditMat(c)}
                          className="text-slate-400 hover:text-rose-600 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Edit Size Variants Section */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-800">Kelola Variant Ukuran / Lebar</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tambah ukuran/lebar (mis: Lebar 185cm, No 5)..."
                      value={editSizeInput}
                      onChange={(e) => setEditSizeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSizeToEditMat())}
                      className="flex-1 p-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddSizeToEditMat}
                      className="px-3 py-2 rounded-xl bg-[#087E79] text-white font-bold text-xs hover:bg-[#066864]"
                    >
                      + Tambah
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {editMatForm.availableSizes?.map((sz, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 font-bold text-amber-900 text-xs flex items-center gap-1.5"
                      >
                        <span>{sz}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSizeFromEditMat(sz)}
                          className="text-amber-500 hover:text-rose-600 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tautan katalog warna / spec sheet supplier */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-700">
                    Tautan Katalog & Referensi Web
                  </label>
                  <MaterialLinksEditor
                    links={editMatForm.links || []}
                    onChange={(links) => setEditMatForm({ ...editMatForm, links })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Komposisi Bahan</label>
                    <input
                      type="text"
                      value={editMatForm.composition || ''}
                      onChange={(e) => setEditMatForm({ ...editMatForm, composition: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gramasi (GSM)</label>
                    <input
                      type="text"
                      value={editMatForm.gsmOrWeight || ''}
                      onChange={(e) => setEditMatForm({ ...editMatForm, gsmOrWeight: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">MOQ Minimum</label>
                    <input
                      type="number"
                      value={editMatForm.moq || 0}
                      onChange={(e) => setEditMatForm({ ...editMatForm, moq: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lead Time (Hari)</label>
                    <input
                      type="number"
                      value={editMatForm.leadTimeDays || 0}
                      onChange={(e) => setEditMatForm({ ...editMatForm, leadTimeDays: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setModalMode('view')}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveEditMaterial}
                    className="px-4 py-1.5 rounded-xl bg-[#087E79] text-white font-bold hover:bg-[#066864] transition-all cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POP-UP DETAIL / EDIT MODAL FOR SUPPLIER */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl border border-slate-200 shadow-2xl space-y-4 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#087E79] text-white">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-emerald-400 font-bold">{selectedSupplier.code}</span>
                    <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300 capitalize">
                      {selectedSupplier.type}
                    </span>
                  </div>
                  <h2 className="font-extrabold text-sm sm:text-base text-white">{selectedSupplier.name}</h2>
                </div>
              </div>

              <button
                onClick={handleCloseDetailModal}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* View vs Edit Tab Toggle inside Modal */}
            <div className="px-4 pt-1 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  onClick={() => setModalMode('view')}
                  className={`pb-2.5 px-2 transition-colors relative ${
                    modalMode === 'view' ? 'text-[#087E79] border-b-2 border-[#087E79]' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail Informasi</span>
                  </div>
                </button>
                <button
                  onClick={() => setModalMode('edit')}
                  className={`pb-2.5 px-2 transition-colors relative ${
                    modalMode === 'edit' ? 'text-[#087E79] border-b-2 border-[#087E79]' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Data</span>
                  </div>
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">ID: {selectedSupplier.id}</span>
            </div>

            {/* Modal Body: VIEW MODE */}
            {modalMode === 'view' && (
              <div className="p-4 space-y-4 text-xs">
                {/* Status Badges Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Verifikasi</span>
                    <div className="font-extrabold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{selectedSupplier.verificationStatus}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pembayaran</span>
                    <div className="font-extrabold text-slate-900">{selectedSupplier.paymentTerms}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Quality Score</span>
                    <div className="font-extrabold text-[#087E79]">{selectedSupplier.qualityScore} / 100</div>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-500 block text-[10px]">Alamat Pabrik / Vendor</span>
                      <p className="font-semibold text-slate-800">{selectedSupplier.address}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-500 block text-[10px]">Nama PIC</span>
                        <span className="font-extrabold text-slate-900">{selectedSupplier.picName}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-500 block text-[10px]">No. Telepon / WA</span>
                          <span className="font-mono font-extrabold text-slate-900 truncate block">
                            {selectedSupplier.picContact}
                          </span>
                        </div>
                      </div>
                      <WhatsAppButton
                        variant="full"
                        phone={selectedSupplier.picContact}
                        contactName={selectedSupplier.picName || selectedSupplier.name}
                        message={`Halo ${selectedSupplier.picName || selectedSupplier.name}, saya dari GG Indo Apparel ingin menanyakan mengenai pengadaan material.`}
                        className="shrink-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Material yang bersumber dari supplier ini */}
                {(() => {
                  const supplierMaterials = materials.filter(
                    (mat) => mat.preferredSupplierId === selectedSupplier.id,
                  );
                  return (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-[#087E79]" />
                          Material dari Supplier Ini ({supplierMaterials.length})
                        </span>
                      </div>

                      {supplierMaterials.length > 0 ? (
                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {supplierMaterials.map((mat) => (
                            <button
                              key={mat.id}
                              type="button"
                              onClick={() => {
                                handleCloseDetailModal();
                                setActiveMasterTab('materials');
                                handleOpenMaterialDetail(mat, 'view');
                              }}
                              className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-[#087E79] transition-colors text-left"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-[10px] font-bold text-[#087E79] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                                    {mat.code}
                                  </span>
                                  <span className="font-bold text-slate-900 truncate">{mat.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 capitalize">
                                  {mat.group.replace('_', ' ')} · {mat.composition}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-mono font-extrabold text-[#087E79] text-[11px] block">
                                  {formatIDR(mat.latestPrice)}
                                </span>
                                <span className="text-[9px] text-slate-400">/{mat.stockUnit}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-1">
                          Belum ada material yang menetapkan supplier ini sebagai sumber belanja.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Modal Footer Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() =>
                      setDeleteConfirmItem({
                        id: selectedSupplier.id,
                        type: 'supplier',
                        name: selectedSupplier.name,
                        code: selectedSupplier.code,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition-all border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Data</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseDetailModal}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={() => setModalMode('edit')}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#087E79] text-white font-bold hover:bg-[#066864] transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Supplier</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body: EDIT MODE */}
            {modalMode === 'edit' && (
              <div className="p-4 space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Supplier / PT</label>
                  <input
                    type="text"
                    value={editSupForm.name || ''}
                    onChange={(e) => setEditSupForm({ ...editSupForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-[#087E79]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Supplier</label>
                    <input
                      type="text"
                      value={editSupForm.code || ''}
                      onChange={(e) => setEditSupForm({ ...editSupForm, code: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenis Vendor</label>
                    <select
                      value={editSupForm.type || 'material'}
                      onChange={(e) => setEditSupForm({ ...editSupForm, type: e.target.value as any })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-medium"
                    >
                      <option value="material">Material Supplier</option>
                      <option value="accessory">Accessory Supplier</option>
                      <option value="factory">Factory / Pabrik</option>
                      <option value="service">Service CMT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={editSupForm.address || ''}
                    onChange={(e) => setEditSupForm({ ...editSupForm, address: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama PIC</label>
                    <input
                      type="text"
                      value={editSupForm.picName || ''}
                      onChange={(e) => setEditSupForm({ ...editSupForm, picName: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kontak PIC / WA</label>
                    <input
                      type="text"
                      value={editSupForm.picContact || ''}
                      onChange={(e) => setEditSupForm({ ...editSupForm, picContact: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setModalMode('view')}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveEditSupplier}
                    className="px-4 py-1.5 rounded-xl bg-[#087E79] text-white font-bold hover:bg-[#066864] transition-all cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* POP-UP DETAIL / EDIT MODAL FOR SERVICE */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl border border-slate-200 shadow-2xl space-y-4 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#087E79] text-white">
                  <Scissors className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-emerald-400 font-bold">{selectedService.code}</span>
                    <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                      {selectedService.category}
                    </span>
                  </div>
                  <h2 className="font-extrabold text-sm sm:text-base text-white">{selectedService.name}</h2>
                </div>
              </div>

              <button
                onClick={handleCloseDetailModal}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* View vs Edit Tab Toggle inside Modal */}
            <div className="px-4 pt-1 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  onClick={() => setModalMode('view')}
                  className={`pb-2.5 px-2 transition-colors relative ${
                    modalMode === 'view' ? 'text-[#087E79] border-b-2 border-[#087E79]' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail Informasi</span>
                  </div>
                </button>
                <button
                  onClick={() => setModalMode('edit')}
                  className={`pb-2.5 px-2 transition-colors relative ${
                    modalMode === 'edit' ? 'text-[#087E79] border-b-2 border-[#087E79]' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Data</span>
                  </div>
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">ID: {selectedService.id}</span>
            </div>

            {/* Modal Body: VIEW MODE */}
            {modalMode === 'view' && (
              <div className="p-4 space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-teal-800 uppercase block">Tarif Standar CMT</span>
                    <span className="font-mono font-extrabold text-base text-[#087E79]">
                      {formatIDR(selectedService.defaultRate)} / {selectedService.unitLabel}
                    </span>
                  </div>

                  <span className="px-3 py-1 rounded-lg bg-white border border-teal-200 text-teal-900 font-bold text-[11px] capitalize">
                    {selectedService.calculationMethod.replace('_', ' ')}
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Kategori Service</span>
                    <span className="font-bold text-slate-900">{selectedService.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium">Satuan Perhitungan</span>
                    <span className="font-bold text-slate-900">{selectedService.unitLabel}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Metode Kalkulasi</span>
                    <span className="font-bold text-slate-900 capitalize">{selectedService.calculationMethod}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    onClick={() =>
                      setDeleteConfirmItem({
                        id: selectedService.id,
                        type: 'service',
                        name: selectedService.name,
                        code: selectedService.code,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition-all border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Data</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseDetailModal}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={() => setModalMode('edit')}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#087E79] text-white font-bold hover:bg-[#066864] transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Service</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Body: EDIT MODE */}
            {modalMode === 'edit' && (
              <div className="p-4 space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Layanan / CMT</label>
                  <input
                    type="text"
                    value={editSrvForm.name || ''}
                    onChange={(e) => setEditSrvForm({ ...editSrvForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-[#087E79]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Service</label>
                    <input
                      type="text"
                      value={editSrvForm.code || ''}
                      onChange={(e) => setEditSrvForm({ ...editSrvForm, code: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori Service</label>
                    <select
                      value={editSrvForm.category || 'CMT Jahit'}
                      onChange={(e) => setEditSrvForm({ ...editSrvForm, category: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-medium"
                    >
                      <option value="CMT Jahit">CMT Jahit</option>
                      <option value="Sablon & Printing">Sablon & Printing</option>
                      <option value="Bordir Komputer">Bordir Komputer</option>
                      <option value="Finishing & Washing">Finishing & Washing</option>
                      <option value="Packing & QC">Packing & QC</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tarif Standar (IDR)</label>
                    <input
                      type="number"
                      value={editSrvForm.defaultRate || 0}
                      onChange={(e) => setEditSrvForm({ ...editSrvForm, defaultRate: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Satuan Tarif</label>
                    <input
                      type="text"
                      value={editSrvForm.unitLabel || 'Pcs'}
                      onChange={(e) => setEditSrvForm({ ...editSrvForm, unitLabel: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setModalMode('view')}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveEditService}
                    className="px-4 py-1.5 rounded-xl bg-[#087E79] text-white font-bold hover:bg-[#066864] transition-all cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE MASTER ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl space-y-4 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#087E79] text-white">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {activeMasterTab === 'suppliers' && 'Tambah Supplier Baru'}
                  {activeMasterTab === 'materials' && 'Tambah Material & Aksesori Baru'}
                  {activeMasterTab === 'services' && 'Tambah CMT / Service Baru'}
                </h3>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CREATE FORM: MATERIAL & ACCESSORY */}
            {activeMasterTab === 'materials' && (
              <div className="space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Material / Aksesori *</label>
                  <input
                    type="text"
                    placeholder="Contoh: French Terry Cotton Organic 280 GSM"
                    value={addMat.name}
                    onChange={(e) => setAddMat({ ...addMat, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-[#087E79]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Material</label>
                    <input
                      type="text"
                      placeholder="FAB-205"
                      value={addMat.code}
                      onChange={(e) => setAddMat({ ...addMat, code: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kelompok Material</label>
                    <select
                      value={addMat.group}
                      onChange={(e) => setAddMat({ ...addMat, group: e.target.value as any })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-medium"
                    >
                      <option value="main_fabric">Kain Utama (Main Fabric)</option>
                      <option value="lining">Furing / Lining</option>
                      <option value="rib">Rib / Collar</option>
                      <option value="zipper">Zipper / Ritsleting</option>
                      <option value="button">Kancing / Button</option>
                      <option value="thread">Benang</option>
                      <option value="label">Label & Tag</option>
                      <option value="packaging">Packaging</option>
                    </select>
                  </div>
                </div>

                {/* Synchronized Supplier Select Dropdown */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-800 mb-1">
                    Pilih Sumber Supplier Master (Sinkronkan)
                  </label>
                  <select
                    value={addMat.preferredSupplierId}
                    onChange={(e) => setAddMat({ ...addMat, preferredSupplierId: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-[#087E79]"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) — PIC: {s.picName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input Harga & Satuan */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Input Harga Bahan Baku (IDR)</label>
                    <input
                      type="number"
                      placeholder="55000"
                      value={addMat.latestPrice}
                      onChange={(e) => setAddMat({ ...addMat, latestPrice: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono font-extrabold text-[#087E79]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Satuan Stok</label>
                    <input
                      type="text"
                      placeholder="Meter / Kg / Yard / Pcs"
                      value={addMat.stockUnit}
                      onChange={(e) => setAddMat({ ...addMat, stockUnit: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                {/* Color Variant Add Tags */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-800">Variant Warna Tersedia</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ketik warna (mis: Hitam Jetblack)..."
                      value={addMatColorInput}
                      onChange={(e) => setAddMatColorInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColorToAddMat())}
                      className="flex-1 p-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddColorToAddMat}
                      className="px-3 py-2 rounded-xl bg-[#087E79] text-white font-bold text-xs"
                    >
                      + Tambah
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {addMatColors.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-800 text-xs flex items-center gap-1"
                      >
                        <span>{c}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveColorFromAddMat(c)}
                          className="text-slate-400 hover:text-rose-600 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Size Variant Add Tags */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-800">Variant Ukuran / Lebar Kain</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ketik ukuran (mis: Lebar 185cm)..."
                      value={addMatSizeInput}
                      onChange={(e) => setAddMatSizeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSizeToAddMat())}
                      className="flex-1 p-2 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddSizeToAddMat}
                      className="px-3 py-2 rounded-xl bg-[#087E79] text-white font-bold text-xs"
                    >
                      + Tambah
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {addMatSizes.map((sz, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 font-bold text-amber-900 text-xs flex items-center gap-1"
                      >
                        <span>{sz}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSizeFromAddMat(sz)}
                          className="text-amber-500 hover:text-rose-600 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tautan katalog warna / spec sheet supplier */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-700">
                    Tautan Katalog & Referensi Web
                  </label>
                  <MaterialLinksEditor links={addMatLinks} onChange={setAddMatLinks} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Komposisi</label>
                    <input
                      type="text"
                      placeholder="100% Organic Cotton"
                      value={addMat.composition}
                      onChange={(e) => setAddMat({ ...addMat, composition: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gramasi (GSM)</label>
                    <input
                      type="text"
                      placeholder="280 GSM"
                      value={addMat.gsmOrWeight}
                      onChange={(e) => setAddMat({ ...addMat, gsmOrWeight: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCreateMaterial}
                    className="px-4 py-1.5 rounded-xl bg-[#087E79] text-white font-bold hover:bg-[#066864] transition-all cursor-pointer"
                  >
                    Tambah Ke Master Data
                  </button>
                </div>
              </div>
            )}

            {/* CREATE FORM: SUPPLIER */}
            {activeMasterTab === 'suppliers' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Supplier / PT *</label>
                  <input
                    type="text"
                    placeholder="Contoh: PT Textindo Jaya Nusantara"
                    value={addSup.name}
                    onChange={(e) => setAddSup({ ...addSup, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-[#087E79]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Supplier</label>
                    <input
                      type="text"
                      placeholder="SUP-109"
                      value={addSup.code}
                      onChange={(e) => setAddSup({ ...addSup, code: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenis Vendor</label>
                    <select
                      value={addSup.type}
                      onChange={(e) => setAddSup({ ...addSup, type: e.target.value as any })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-medium"
                    >
                      <option value="material">Material Supplier</option>
                      <option value="accessory">Accessory Supplier</option>
                      <option value="factory">Factory / Pabrik</option>
                      <option value="service">Service CMT</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat Pabrik / Kantot</label>
                  <input
                    type="text"
                    placeholder="Jl. Industri Textile No. 88, Bandung"
                    value={addSup.address}
                    onChange={(e) => setAddSup({ ...addSup, address: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama PIC</label>
                    <input
                      type="text"
                      placeholder="Ibu Sarah"
                      value={addSup.picName}
                      onChange={(e) => setAddSup({ ...addSup, picName: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. Kontak / WA</label>
                    <input
                      type="text"
                      placeholder="0812-3456-7890"
                      value={addSup.picContact}
                      onChange={(e) => setAddSup({ ...addSup, picContact: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCreateSupplier}
                    className="px-4 py-1.5 rounded-xl bg-[#087E79] text-white font-bold hover:bg-[#066864] transition-all cursor-pointer"
                  >
                    Tambah Ke Master Data
                  </button>
                </div>
              </div>
            )}

            {/* CREATE FORM: SERVICE */}
            {activeMasterTab === 'services' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Layanan / CMT *</label>
                  <input
                    type="text"
                    placeholder="Contoh: CMT Jahit Jacket Windbreaker Heavy Duty"
                    value={addSrv.name}
                    onChange={(e) => setAddSrv({ ...addSrv, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-[#087E79]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Service</label>
                    <input
                      type="text"
                      placeholder="CMT-108"
                      value={addSrv.code}
                      onChange={(e) => setAddSrv({ ...addSrv, code: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori Service</label>
                    <select
                      value={addSrv.category}
                      onChange={(e) => setAddSrv({ ...addSrv, category: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-medium"
                    >
                      <option value="CMT Jahit">CMT Jahit</option>
                      <option value="Sablon & Printing">Sablon & Printing</option>
                      <option value="Bordir Komputer">Bordir Komputer</option>
                      <option value="Finishing & Washing">Finishing & Washing</option>
                      <option value="Packing & QC">Packing & QC</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tarif Standar (IDR)</label>
                    <input
                      type="number"
                      placeholder="22000"
                      value={addSrv.defaultRate}
                      onChange={(e) => setAddSrv({ ...addSrv, defaultRate: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Satuan Tarif</label>
                    <input
                      type="text"
                      placeholder="Pcs"
                      value={addSrv.unitLabel}
                      onChange={(e) => setAddSrv({ ...addSrv, unitLabel: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCreateService}
                    className="px-4 py-1.5 rounded-xl bg-[#087E79] text-white font-bold hover:bg-[#066864] transition-all cursor-pointer"
                  >
                    Tambah Ke Master Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG MODAL */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-full bg-rose-100 text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Konfirmasi Hapus Data</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tindakan ini tidak dapat dibatalkan. Data master ini akan dihapus dari sistem.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="font-mono text-[11px] text-[#087E79] font-bold">{deleteConfirmItem.code}</div>
              <div className="font-extrabold text-slate-900">{deleteConfirmItem.name}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmItem(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-2xs cursor-pointer"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
