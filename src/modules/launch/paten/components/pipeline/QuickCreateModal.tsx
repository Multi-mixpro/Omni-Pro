/**
 * Product Launch OS 3.0 - Quick Create Article Wizard
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  X,
  Camera,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  Sparkles,
  Link as LinkIcon,
  Palette,
  Star,
  Lock,
  Unlock,
  Loader2,
  Upload,
} from 'lucide-react';
import { Article, BusinessUnit, CategoryType, MaterialMaster } from '../../types';
import { loadStoredBusinessUnits, isAllBusinessUnits } from '../../services/businessUnits';
import { formatIDR } from '../../utils/calculations';
import { optimizedImageUrl } from '../../utils/cloudinary';
import { buildCategoryDefaultSizeChart } from '../../data/measurementFields';

interface QuickCreateModalProps {
  isOpen?: boolean;
  onClose: () => void;
  activeBusinessUnit?: BusinessUnit;
  materials?: MaterialMaster[];
  ownerName?: string;
  onCreateArticle?: (article: Article) => void;
  onCreate?: (article: Article) => void;
  /** Bila diisi, modal berjalan dalam mode EDIT untuk artikel ini. */
  editArticle?: Article | null;
  onUpdateArticle?: (article: Article) => void;
  /** Kode artikel yang sudah dipakai — untuk mencegah duplikasi kode custom. */
  existingCodes?: string[];
  /**
   * Mengunggah berkas foto dari komputer ke penyimpanan media (Cloudinary)
   * dan mengembalikan URL permanennya. Hanya tersedia untuk artikel yang
   * sudah tersimpan, karena upload terikat pada project id.
   */
  onUploadPhoto?: (file: File) => Promise<string>;
}

// Complete Size Checklist Options from XS to 5XL
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

// Catatan: preset foto stok (Unsplash) dihapus. Foto stok yang tidak berhubungan
// dengan produk nyata pernah ikut tersimpan ke artikel dan menyesatkan tim produksi.
// Foto kini diunggah dari komputer ke Cloudinary, atau ditempel via URL asli produk.

// Standard Color Hex Helper for Material Master Colors

function getColorHexFromName(colorName: string): string {
  const name = colorName.toLowerCase();
  if (name.includes('black') || name.includes('hitam') || name.includes('jetblack')) return '#121212';
  if (name.includes('navy') || name.includes('donker')) return '#1B2A4A';
  if (name.includes('white') || name.includes('putih') || name.includes('natural')) return '#F5F5ED';
  if (name.includes('sage') || name.includes('green') || name.includes('hijau')) return '#6B8E78';
  if (name.includes('olive') || name.includes('army')) return '#4B5320';
  if (name.includes('grey') || name.includes('abu') || name.includes('steel')) return '#4A5568';
  if (name.includes('terracotta') || name.includes('rust')) return '#C85A32';
  if (name.includes('khaki') || name.includes('beige') || name.includes('tan')) return '#C2B280';
  if (name.includes('burgundy') || name.includes('maroon') || name.includes('crimson')) return '#800020';
  if (name.includes('yellow') || name.includes('mustard') || name.includes('kuning')) return '#E3A857';
  if (name.includes('blue') || name.includes('biru')) return '#2563EB';
  if (name.includes('red') || name.includes('merah')) return '#DC2626';
  return '#64748B';
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen = true,
  onClose,
  activeBusinessUnit = 'Semua Unit Bisnis',
  materials = [],
  ownerName = 'Pengguna Aktif',
  onCreateArticle,
  onCreate,
  editArticle = null,
  onUpdateArticle,
  existingCodes = [],
  onUploadPhoto,
}) => {
  const isEditMode = !!editArticle;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Kode artikel: default dibuat otomatis & terkunci. User dapat membuka kunci
  // untuk memakai skema penomoran sendiri.
  const [articleCode, setArticleCode] = useState(
    () => editArticle?.code ?? `GG-JKT-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
  );
  const [isCodeLocked, setIsCodeLocked] = useState(true);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Form State: Step 1 — pada mode edit, diisi dari artikel yang sedang diubah.
  const [name, setName] = useState(editArticle?.name ?? '');
  const [category, setCategory] = useState<CategoryType>(editArticle?.category ?? 'Jacket / Hoodie');
  const [subCategory, setSubCategory] = useState(editArticle?.subCategory ?? 'Outerwear Technical');
  // "Semua Unit Bisnis" adalah filter tampilan, bukan unit nyata — jangan
  // dipakai sebagai unit artikel baru. Jatuhkan ke unit terdaftar pertama.
  const defaultBusinessUnit: BusinessUnit = isAllBusinessUnits(activeBusinessUnit)
    ? (loadStoredBusinessUnits()[0]?.name ?? 'Mainline Studio')
    : activeBusinessUnit;
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit>(editArticle?.businessUnit ?? defaultBusinessUnit);
  const [genderTarget, setGenderTarget] = useState<'Men' | 'Women' | 'Unisex' | 'Kids'>(
    editArticle?.genderTarget ?? 'Unisex',
  );
  const [seasonCollection, setSeasonCollection] = useState(editArticle?.seasonCollection ?? '');

  // Form State: Step 2 - Photos (Max 8-10 Photos) & References (1+ Links)
  // Starts empty: real articles must not launch with unrelated stock photos
  // silently attached. Preset thumbnails below remain an opt-in convenience.
  const [productPhotos, setProductPhotos] = useState<Array<{ id: string; url: string; label: string; isPrimary: boolean }>>(
    () => {
      if (!editArticle) return [];
      const gallery = editArticle.galleryImages?.length
        ? editArticle.galleryImages
        : editArticle.mainImage
        ? [editArticle.mainImage]
        : [];
      return gallery.map((url, idx) => ({
        id: `photo-${idx}`,
        url,
        label: idx === 0 ? 'Foto Utama' : 'Detail',
        isPrimary: url === editArticle.mainImage,
      }));
    },
  );
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoLabel, setNewPhotoLabel] = useState('Zoom Detail');

  // Reference Links (Starts with default 1 column, max unlimited/3+ links)
  const [referenceLinks, setReferenceLinks] = useState<string[]>(() => {
    const existing = (editArticle?.references || []).map((ref) => ref.url).filter(Boolean) as string[];
    return existing.length > 0 ? existing : [''];
  });
  const [briefIntent, setBriefIntent] = useState(editArticle?.briefIntent ?? '');
  const [targetUserDescription, setTargetUserDescription] = useState(editArticle?.targetUserDescription ?? '');

  // Form State: Step 3 - Targets & Colorways & Complete Sizes (XS - 5XL)
  const [targetSampleDate, setTargetSampleDate] = useState(() => {
    if (editArticle?.targetSampleDate) return editArticle.targetSampleDate;
    const date = new Date();
    date.setDate(date.getDate() + 21);
    return date.toISOString().slice(0, 10);
  });
  const [targetReleaseDate, setTargetReleaseDate] = useState(() => {
    if (editArticle?.targetReleaseDate) return editArticle.targetReleaseDate;
    const date = new Date();
    date.setDate(date.getDate() + 60);
    return date.toISOString().slice(0, 10);
  });

  // Target Prices DEFAULT TO 0 as requested
  const [targetPriceMSRP, setTargetPriceMSRP] = useState<number>(editArticle?.targetPriceMSRP ?? 0);
  const [targetHPP, setTargetHPP] = useState<number>(editArticle?.targetHPP ?? 0);

  // Size Set Checklist: Default all sizes selected (XS - 5XL)
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    editArticle?.sizeSet?.length ? [...editArticle.sizeSet] : [...ALL_SIZES],
  );

  // Known obsolete dummy preset color names to filter out
  const OBSOLETE_DUMMY_COLOR_NAMES = useMemo(
    () => [
      'obsidian black',
      'midnight navy',
      'off-white natural',
      'sage green',
      'steel grey',
      'terracotta rust',
      'dark charcoal',
      'olive army',
      'muted beige / khaki',
      'burgundy crimson',
    ],
    [],
  );

  // Selected Color Variants from Registered Materials (Starts 100% CLEAN/EMPTY for new articles)
  const [selectedColorways, setSelectedColorways] = useState<
    Array<{ id: string; code: string; name: string; hex: string; materialSource?: string }>
  >(() => {
    if (editArticle?.colorways?.length) {
      const validSelected = editArticle.colorways
        .filter(
          (col) =>
            !OBSOLETE_DUMMY_COLOR_NAMES.includes(col.name.trim().toLowerCase()) &&
            col.name.trim().toLowerCase() !== 'black solid wp',
        )
        .map((col) => ({
          id: col.id,
          code: col.code,
          name: col.name,
          hex: col.hex,
        }));

      if (validSelected.length > 0) return validSelected;
    }
    return [];
  });

  // Auto-purge any obsolete dummy colorways when modal is opened or editArticle changes
  useEffect(() => {
    setSelectedColorways((prev) => {
      return prev.filter(
        (col) =>
          !OBSOLETE_DUMMY_COLOR_NAMES.includes(col.name.trim().toLowerCase()) &&
          col.name.trim().toLowerCase() !== 'black solid wp',
      );
    });
  }, [editArticle, OBSOLETE_DUMMY_COLOR_NAMES]);

  // Custom Hex Overrides map (colorName -> customHex)
  const [customHexOverrides, setCustomHexOverrides] = useState<Record<string, string>>({});

  const handleUpdateColorHex = (colorName: string, newHex: string) => {
    setCustomHexOverrides((prev) => ({ ...prev, [colorName]: newHex }));

    // Also update selectedColorways if this colorway is currently selected
    setSelectedColorways((prev) =>
      prev.map((c) => (c.name === colorName ? { ...c, hex: newHex } : c))
    );
  };

  // Material Filter & Color Search State in Step 3
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('ALL');
  const [colorSearchQuery, setColorSearchQuery] = useState<string>('');
  const [customMaterialColors, setCustomMaterialColors] = useState<
    Array<{ name: string; code: string; hex: string; material: string }>
  >([]);

  // Inline Custom Color Form State
  const [isAddCustomColorOpen, setIsAddCustomColorOpen] = useState(false);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorCode, setCustomColorCode] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#3B82F6');
  const [customColorMaterial, setCustomColorMaterial] = useState('WP COLUMBIA');

  // Combined Available Colorways Catalog derived EXCLUSIVELY from Master Data (`materials` prop) + Custom Created
  const catalogMaterialColors = useMemo<{ name: string; code: string; hex: string; material: string }[]>(() => {
    const map = new Map<string, { name: string; code: string; hex: string; material: string }>();

    // 1. Extract colors directly from Master Materials prop (Database / Master Data Central)
    if (materials && materials.length > 0) {
      materials.forEach((mat) => {
        if (mat.availableColors && Array.isArray(mat.availableColors) && mat.availableColors.length > 0) {
          mat.availableColors.forEach((colName: string, idx: number) => {
            const key = `${mat.name.trim().toLowerCase()}:::${colName.trim().toLowerCase()}`;
            if (!map.has(key)) {
              const hex = customHexOverrides[colName.trim()] || getColorHexFromName(colName);
              map.set(key, {
                name: colName.trim(),
                code: `${mat.code ? mat.code.slice(-3) : 'MAT'}-${(idx + 1).toString().padStart(2, '0')}`,
                hex,
                material: mat.name.trim(),
              });
            }
          });
        }
      });
    }

    // 2. Add custom created colors during current session
    customMaterialColors.forEach((col) => {
      const key = `${col.material.trim().toLowerCase()}:::${col.name.trim().toLowerCase()}`;
      const hex = customHexOverrides[col.name.trim()] || col.hex;
      map.set(key, { ...col, hex });
    });

    return Array.from(map.values());
  }, [materials, customMaterialColors, customHexOverrides]);

  // List of unique Material names available in the catalog for filtering
  const availableMaterialNames = useMemo<string[]>(() => {
    const set = new Set<string>();
    catalogMaterialColors.forEach((item: { material: string }) => set.add(item.material));
    return Array.from(set);
  }, [catalogMaterialColors]);

  // Filtered catalog based on selectedMaterialFilter AND colorSearchQuery
  const filteredCatalogColors = useMemo<{ name: string; code: string; hex: string; material: string }[]>(() => {
    let list = catalogMaterialColors;

    if (selectedMaterialFilter !== 'ALL') {
      list = list.filter(
        (item: { material: string }) => item.material.toLowerCase() === selectedMaterialFilter.toLowerCase()
      );
    }

    if (colorSearchQuery.trim()) {
      const q = colorSearchQuery.toLowerCase().trim();
      list = list.filter(
        (item: { name: string; code: string; material: string }) =>
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.material.toLowerCase().includes(q)
      );
    }

    return list;
  }, [catalogMaterialColors, selectedMaterialFilter, colorSearchQuery]);

  const handleAddCustomColorway = () => {
    if (!customColorName.trim()) {
      setNotice('Nama varian warna tidak boleh kosong.');
      return;
    }
    const code = customColorCode.trim() || `CLR-${Math.floor(10 + Math.random() * 90)}`;
    const newColor = {
      name: customColorName.trim(),
      code,
      hex: customColorHex,
      material: customColorMaterial.trim() || 'Custom Fabric',
    };
    setCustomMaterialColors((prev) => [...prev, newColor]);

    // Auto-select newly added colorway
    setSelectedColorways((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        code,
        name: newColor.name,
        hex: newColor.hex,
        materialSource: newColor.material,
      },
    ]);

    setCustomColorName('');
    setCustomColorCode('');
    setIsAddCustomColorOpen(false);
    setNotice(`Varian warna '${newColor.name}' (${newColor.material}) berhasil ditambahkan!`);
  };

  // Boleh disimpan bila nama terisi dan kode artikel valid (tidak kosong/bentrok).
  const canSubmit = !!name.trim() && !!articleCode.trim() && !codeError;

  if (isOpen === false) return null;

  // Maximum Photos Allowed (8 - 10)
  const MAX_PHOTOS = 10;

  // Handler for Photos
  const handleAddPhoto = (urlToAdd: string, labelToAdd: string = 'Sisi Lain') => {
    if (!urlToAdd.trim()) return;
    if (productPhotos.length >= MAX_PHOTOS) {
      setNotice(`Maksimal ${MAX_PHOTOS} foto produk untuk menampilkan detail dari semua sisi.`);
      return;
    }
    const isFirst = productPhotos.length === 0;
    const newPhoto = {
      id: crypto.randomUUID(),
      url: urlToAdd.trim(),
      label: labelToAdd,
      isPrimary: isFirst,
    };
    setProductPhotos((prev) => [...prev, newPhoto]);
    setNewPhotoUrl('');
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  /** Unggah satu atau beberapa berkas foto dari komputer / HP ke Cloudinary / Local Base64. */
  const handleUploadFiles = async (files: FileList | Array<File> | null) => {
    if (!files || files.length === 0) return;

    const room = MAX_PHOTOS - productPhotos.length;
    if (room <= 0) {
      setNotice(`Maksimal ${MAX_PHOTOS} foto produk.`);
      return;
    }

    const queue = Array.from(files).slice(0, room);
    setIsUploading(true);
    setUploadError(null);
    try {
      for (const file of queue) {
        let url = '';
        if (onUploadPhoto) {
          try {
            url = await onUploadPhoto(file);
          } catch {
            url = await readFileAsDataUrl(file);
          }
        } else {
          url = await readFileAsDataUrl(file);
        }

        if (!url) continue;

        setProductPhotos((prev) => {
          if (prev.length >= MAX_PHOTOS) return prev;
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              url,
              label: file.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Foto Produk',
              isPrimary: prev.length === 0,
            },
          ];
        });
      }
      if (files.length > room) {
        setNotice(`Hanya ${room} foto diunggah — batas maksimal ${MAX_PHOTOS} foto.`);
      }
    } catch (reason) {
      setUploadError(
        reason instanceof Error ? reason.message : 'Foto gagal diunggah. Coba lagi.',
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setProductPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      // Ensure at least one primary photo if any photo remains
      if (filtered.length > 0 && !filtered.some((p) => p.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimaryPhoto = (id: string) => {
    setProductPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isPrimary: p.id === id,
      }))
    );
  };

  // Handlers for Reference Links
  const handleAddReferenceLink = () => {
    setReferenceLinks((prev) => [...prev, '']);
  };

  const handleUpdateReferenceLink = (index: number, value: string) => {
    setReferenceLinks((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleRemoveReferenceLink = (index: number) => {
    setReferenceLinks((prev) => prev.filter((_, i) => i !== index));
  };

  // Handlers for Size Checklist
  const handleToggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleSelectAllSizes = () => {
    setSelectedSizes([...ALL_SIZES]);
  };

  const handleSelectStandardSizes = () => {
    setSelectedSizes(['S', 'M', 'L', 'XL']);
  };

  // Handlers for Color Variants
  const handleToggleColorway = (col: { name: string; code: string; hex: string; material?: string }) => {
    const exists = selectedColorways.some((c) => c.name === col.name);
    if (exists) {
      setSelectedColorways((prev) => prev.filter((c) => c.name !== col.name));
    } else {
      setSelectedColorways((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          code: col.code,
          name: col.name,
          hex: col.hex,
          materialSource: col.material,
        },
      ]);
    }
  };

  const handleSubmit = (isDraft: boolean) => {
    if (!name.trim()) return;

    // Kode artikel: pakai nilai dari field (otomatis bila terkunci, custom bila dibuka).
    const code = articleCode.trim() || `GG-${category.slice(0, 3).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

    // Tanpa foto: biarkan kosong. Jangan diam-diam memasang foto stok
    // yang tidak berhubungan dengan produk nyata.
    const primaryPhoto = productPhotos.find((p) => p.isPrimary)?.url || productPhotos[0]?.url || '';
    const galleryUrls = productPhotos.map((p) => p.url);

    const validLinks = referenceLinks.filter((link) => link.trim() !== '');

    const colorwayList = selectedColorways.map((col, idx) => ({
      id: col.id || `col-${idx}`,
      code: col.code,
      name: col.name,
      hex: col.hex,
      isSampleColor: idx === 0,
    }));
    const sizeList = selectedSizes.length > 0 ? selectedSizes : ['S', 'M', 'L', 'XL'];
    const referenceList = validLinks.map((url, idx) => ({
      id: `ref-${idx}`,
      title: `Referensi Brief #${idx + 1}`,
      url,
      type: 'link' as const,
      label: 'detail' as const,
    }));

    // MODE EDIT: gabungkan hanya field yang dikelola form ini.
    // Data dari lembar kerja lain (BOM, size chart, batch, HPP, dll.) dipertahankan.
    if (isEditMode && editArticle) {
      const updated: Article = {
        ...editArticle,
        code,
        name,
        category,
        subCategory,
        businessUnit,
        genderTarget,
        seasonCollection,
        mainImage: primaryPhoto,
        galleryImages: galleryUrls,
        targetSampleDate,
        targetReleaseDate,
        briefIntent,
        targetUserDescription,
        references: referenceList,
        targetPriceMSRP,
        targetHPP,
        colorways: colorwayList,
        sizeSet: sizeList,
        baseSize: sizeList.includes(editArticle.baseSize) ? editArticle.baseSize : sizeList[0],
        lastUpdated: new Date().toISOString(),
      };
      onUpdateArticle?.(updated);
      onClose();
      return;
    }

    const newArticle: Article = {
      id: crypto.randomUUID(),
      code,
      name,
      category,
      subCategory,
      businessUnit,
      genderTarget,
      seasonCollection,
      mainImage: primaryPhoto,
      galleryImages: galleryUrls,
      stage: isDraft ? 'Prospect' : 'Specification',
      status: isDraft ? 'Draft' : 'Active',
      workflowProgressPercent: isDraft ? 10 : 25,
      dataCompletenessPercent: 40,
      scheduleHealth: 'On Track',
      costConfidence: 'Low - Estimate',
      productionReadiness: 'Not Ready',
      targetSampleDate,
      targetReleaseDate,
      ownerName,
      pimproName: ownerName,
      briefIntent,
      targetUserDescription,
      acceptanceCriteria: '',
      references: referenceList,
      targetPriceMSRP,
      targetHPP,
      materials: [],
      colorways: colorwayList,
      sizeSet: sizeList,
      baseSize: sizeList.includes('M') ? 'M' : sizeList[0] || 'M',
      sizeChart: (editArticle as unknown as Article | null)?.sizeChart?.length ? (editArticle as unknown as Article).sizeChart : buildCategoryDefaultSizeChart(category, sizeList),
      sampleIterations: [],
      costComponents: [
        { id: 'cc-1', name: 'Material & Accessory Subtotal', category: 'Material', calculationMethod: 'per_unit', amount: targetHPP * 0.65, isIncluded: true, isCustom: false },
        { id: 'cc-2', name: 'CMT Jahit & Potong', category: 'CMT & Service', calculationMethod: 'per_unit', amount: targetHPP * 0.25, isIncluded: true, isCustom: false },
        { id: 'cc-3', name: 'Packaging & Finishing', category: 'Packaging & Logistics', calculationMethod: 'per_unit', amount: targetHPP * 0.10, isIncluded: true, isCustom: false },
      ],
      calculatedHPP: targetHPP,
      priceSimulation: {
        targetMarginPercent: targetPriceMSRP > 0 ? Number((((targetPriceMSRP - targetHPP) / targetPriceMSRP) * 100).toFixed(1)) : 0,
        sellingChannel: 'E-Commerce & Retail',
        channelFeePercent: 10,
        discountBufferPercent: 10,
        suggestedMSRP: targetPriceMSRP,
        wholesalePrice: Math.round(targetPriceMSRP * 0.55),
        resellerPrice: Math.round(targetPriceMSRP * 0.70),
        projectedGrossMarginPercent: targetPriceMSRP > 0 ? Number((((targetPriceMSRP - targetHPP) / targetPriceMSRP) * 100).toFixed(1)) : 0,
        breakEvenQuantity: 50,
      },
      scenarios: [],
      readinessChecklist: [
        { id: 'rc-1', requirement: 'Product Brief Terkunci', stage: 'Prospect', isCritical: true, isCompleted: true, ownerRole: 'Pimpro' },
        { id: 'rc-2', requirement: 'BOM & Material Utama Ditetapkan', stage: 'Specification', isCritical: true, isCompleted: false, ownerRole: 'Sourcing' },
      ],
      batches: [],
      blockerCount: 0,
      pendingApprovalCount: 0,
      lastUpdated: new Date().toISOString(),
      workspacePanels: [
        { key: 'brief', title: 'Product Brief', subtitle: 'Target, referensi, & spesifikasi awal', isExpanded: true, isPinned: true, status: 'Complete', completenessPercent: 100, missingRequiredCount: 0, ownerRole: 'Pimpro' },
        { key: 'materials', title: 'Materials & Accessories', subtitle: 'Pilihan kain, trimming & BOM', isExpanded: true, isPinned: true, status: 'Incomplete', completenessPercent: 30, missingRequiredCount: 2, ownerRole: 'Sourcing' },
        { key: 'colors', title: 'Colors & Variants', subtitle: 'Colorway & SKU matrix', isExpanded: true, isPinned: false, status: 'Complete', completenessPercent: 100, missingRequiredCount: 0, ownerRole: 'Designer' },
        { key: 'sizes', title: 'Sizes & Size Chart', subtitle: 'Spesifikasi ukuran & sampel aktual', isExpanded: true, isPinned: false, status: 'Incomplete', completenessPercent: 40, missingRequiredCount: 1, ownerRole: 'Pattern Maker' },
        { key: 'hpp', title: 'HPP & Pricing', subtitle: 'Kalkulasi HPP & simulasi harga jual', isExpanded: true, isPinned: true, status: 'Incomplete', completenessPercent: 50, missingRequiredCount: 1, ownerRole: 'Finance' },
        { key: 'stock', title: 'Stock & Production Budget', subtitle: 'Matriks warna x ukuran x kuantitas', isExpanded: false, isPinned: false, status: 'Incomplete', completenessPercent: 20, missingRequiredCount: 1, ownerRole: 'Pimpro' },
      ],
    };

    const handler = onCreateArticle || onCreate;
    if (handler) handler(newArticle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#087E79] text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="font-extrabold text-sm sm:text-base text-white">
                {isEditMode ? 'Edit Data Artikel' : 'Tambah Prospek Artikel Baru'}
              </h2>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {isEditMode
                ? `Langkah ${step} dari 3 — Ubah data dasar ${editArticle?.code}. Data lembar kerja lain tidak terpengaruh.`
                : `Langkah ${step} dari 3 — Isi data spesifikasi cepat dalam 2-4 menit`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {notice && (
          <div className="mx-4 mt-3 px-3.5 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between gap-2">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="p-0.5 rounded-full text-amber-500 hover:bg-amber-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Wizard Steps Indicator */}
        <div className="grid grid-cols-3 border-b border-slate-200 text-[11px] font-bold text-center bg-slate-50">
          <div
            onClick={() => setStep(1)}
            className={`py-2.5 px-3 cursor-pointer transition-all border-r border-slate-200 ${
              step === 1
                ? 'bg-white text-[#087E79] border-b-2 border-b-[#087E79] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            1. Identitas Artikel
          </div>
          <div
            onClick={() => name && setStep(2)}
            className={`py-2.5 px-3 cursor-pointer transition-all border-r border-slate-200 ${
              step === 2
                ? 'bg-white text-[#087E79] border-b-2 border-b-[#087E79] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            2. Foto & Referensi ({productPhotos.length} Foto)
          </div>
          <div
            onClick={() => name && setStep(3)}
            className={`py-2.5 px-3 cursor-pointer transition-all ${
              step === 3
                ? 'bg-white text-[#087E79] border-b-2 border-b-[#087E79] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            3. Target & Warna ({selectedSizes.length} Size)
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-900 text-xs">
          {/* STEP 1: IDENTITAS ARTIKEL */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Kode Artikel — otomatis & terkunci, dapat dibuka untuk penomoran custom */}
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">
                  Kode Artikel / ID Produk
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={articleCode}
                    readOnly={isCodeLocked}
                    onChange={(e) => {
                      const next = e.target.value.toUpperCase();
                      setArticleCode(next);
                      const clash = existingCodes.some(
                        (c) => c.trim().toUpperCase() === next.trim().toUpperCase(),
                      );
                      setCodeError(
                        !next.trim()
                          ? 'Kode artikel tidak boleh kosong.'
                          : clash
                          ? 'Kode ini sudah dipakai artikel lain.'
                          : null,
                      );
                    }}
                    placeholder="Misal: GG-JKT-2026-001"
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all shadow-2xs focus:outline-none ${
                      isCodeLocked
                        ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                        : codeError
                        ? 'border-rose-300 bg-white text-slate-900 focus:border-rose-500'
                        : 'border-amber-300 bg-white text-slate-900 focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCodeLocked((locked) => !locked);
                      setCodeError(null);
                    }}
                    title={isCodeLocked ? 'Buka kunci untuk mengubah kode' : 'Kunci kode artikel'}
                    className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold transition-colors shrink-0 border ${
                      isCodeLocked
                        ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                        : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    {isCodeLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isCodeLocked ? 'Terkunci' : 'Bisa Diubah'}</span>
                  </button>
                </div>
                <p className={`text-[10px] mt-1 ${codeError ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                  {codeError
                    || (isCodeLocked
                      ? 'Kode dibuat otomatis. Buka kunci bila ingin memakai skema penomoran sendiri.'
                      : 'Mode custom aktif — pastikan kode unik dan konsisten dengan penomoran Anda.')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">
                  Nama Artikel / Produk <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Alpine Utility Tactical Oversized Jacket"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#087E79] focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">
                    Kategori Utama
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const nextCategory = e.target.value as CategoryType;
                      setCategory(nextCategory);
                      // Kode otomatis ikut prefix kategori — kecuali user memakai kode custom
                      // atau sedang mengedit artikel yang kodenya sudah beredar.
                      if (isCodeLocked && !isEditMode) {
                        setArticleCode(
                          `GG-${nextCategory.slice(0, 3).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
                        );
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#087E79] focus:outline-none cursor-pointer"
                  >
                    <option value="Jacket / Hoodie">Jacket / Hoodie</option>
                    <option value="T-Shirt / Shirt">T-Shirt / Shirt</option>
                    <option value="Pants / Shorts">Pants / Shorts</option>
                    <option value="Skirt / Dress">Skirt / Dress</option>
                    <option value="Hat / Cap">Hat / Cap</option>
                    <option value="Bag / Backpack">Bag / Backpack</option>
                    <option value="Accessory / Custom">Accessory / Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">
                    Subkategori / Style
                  </label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="Outerwear Technical / Heavyweight Tee"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#087E79] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">
                    Unit Bisnis
                  </label>
                  <select
                    value={businessUnit}
                    onChange={(e) => setBusinessUnit(e.target.value as BusinessUnit)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#087E79] focus:outline-none cursor-pointer"
                  >
                    {/* Sertakan unit artikel saat ini walau sudah dihapus/di-rename,
                        agar penetapan lama tidak diam-diam berpindah. */}
                    {Array.from(
                      new Set(
                        [
                          !isAllBusinessUnits(businessUnit) ? (businessUnit as string) : '',
                          ...loadStoredBusinessUnits().map((bu) => bu.name),
                        ].filter(Boolean),
                      ),
                    ).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">
                    Target Gender
                  </label>
                  <select
                    value={genderTarget}
                    onChange={(e) => setGenderTarget(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#087E79] focus:outline-none cursor-pointer"
                  >
                    <option value="Unisex">Unisex</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">
                    Season / Koleksi
                  </label>
                  <input
                    type="text"
                    value={seasonCollection}
                    onChange={(e) => setSeasonCollection(e.target.value)}
                    placeholder="FW2026 - Urban Explorer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#087E79] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FOTO PRODUK UTAMA (MAX 8-10 FOTO SISI ALL ANGLE) & LINK REFERENSI (1+ DEFAULT) */}
          {step === 2 && (
            <div className="space-y-5">
              {/* SECTION: FOTO PRODUK UTAMA (MULTIPLE ANGLES MAX 8-10) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900">
                      Foto Produk Utama & Angle Tampak ({productPhotos.length}/{MAX_PHOTOS} Foto)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tambahkan beberapa foto untuk menampilkan detail tampak depan, belakang, samping, zoom material, & packaging (Maksimal {MAX_PHOTOS} foto).
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DDF4F1] text-[#087E79] border border-[#087E79]/20">
                    Max {MAX_PHOTOS} Foto
                  </span>
                </div>

                {/* Grid Gallery of Product Photos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {productPhotos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className={`group relative rounded-xl overflow-hidden border-2 bg-white transition-all shadow-2xs ${
                        photo.isPrimary ? 'border-[#087E79] ring-2 ring-[#087E79]/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="aspect-square relative overflow-hidden bg-slate-100">
                        <img src={optimizedImageUrl(photo.url, 200)} alt={photo.label} className="w-full h-full object-cover" />

                        {/* Primary Badge */}
                        {photo.isPrimary && (
                          <div className="absolute top-1.5 left-1.5 bg-[#087E79] text-white px-2 py-0.5 rounded-md text-[9px] font-extrabold flex items-center gap-1 shadow-md">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>Foto Utama</span>
                          </div>
                        )}

                        {/* Actions Overlay */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                          {!photo.isPrimary && (
                            <button
                              onClick={() => handleSetPrimaryPhoto(photo.id)}
                              className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-[#087E79] text-[10px] font-bold transition-all"
                              title="Jadikan Foto Utama"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer"
                            title="Hapus Foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Angle Tag Input/Select */}
                      <div className="p-1.5 bg-white border-t border-slate-100">
                        <input
                          type="text"
                          value={photo.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProductPhotos((prev) =>
                              prev.map((p) => (p.id === photo.id ? { ...p, label: val } : p))
                            );
                          }}
                          placeholder="Label Sisi (cth: Tampak Depan)"
                          className="w-full text-[10px] font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 focus:outline-none focus:border-[#087E79]"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Add Photo Tile — pemilih berkas lokal / HP */}
                  {productPhotos.length < MAX_PHOTOS && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.webp,.png,.jpg,.jpeg,.gif,.bmp,.svg,.avif,.heic,.heif"
                        multiple
                        className="hidden"
                        onChange={(e) => void handleUploadFiles(e.target.files)}
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        title="Pilih foto dari komputer / HP Anda"
                        className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-3 text-center transition-all min-h-[120px] ${
                          isUploading
                            ? 'border-[#087E79] bg-[#DDF4F1]/20 cursor-wait'
                            : 'border-emerald-300 hover:border-[#087E79] bg-emerald-50/40 hover:bg-[#DDF4F1]/20 cursor-pointer shadow-2xs'
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-6 h-6 text-[#087E79] mb-1 animate-spin" />
                            <span className="text-[11px] font-bold text-[#087E79]">Mengunggah…</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 mb-1 text-[#087E79]" />
                            <span className="text-[11px] font-extrabold text-[#087E79]">
                              📁 Unggah Foto dari Lokal
                            </span>
                            <span className="text-[9px] font-semibold text-slate-500 mt-0.5">
                              Pilih berkas dari Komputer / HP ({productPhotos.length}/{MAX_PHOTOS})
                            </span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {uploadError && (
                  <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                    {uploadError}
                  </p>
                )}

                {/* Custom URL Add Row */}
                <div className="space-y-2 pt-2 border-t border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Atau tambahkan lewat URL foto:
                  </span>

                  {/* Manual URL Input Bar */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      placeholder="Atau tempel URL foto sisi/detail tambahan..."
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-[#087E79] focus:outline-none"
                    />
                    <select
                      value={newPhotoLabel}
                      onChange={(e) => setNewPhotoLabel(e.target.value)}
                      className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      <option value="Tampak Depan">Depan</option>
                      <option value="Tampak Belakang">Belakang</option>
                      <option value="Tampak Samping">Samping</option>
                      <option value="Zoom Detail Material">Zoom Detail</option>
                      <option value="Fitting / Lookbook">Fitting</option>
                      <option value="Label & Packaging">Label</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    <button
                      type="button"
                      disabled={!newPhotoUrl.trim() || productPhotos.length >= MAX_PHOTOS}
                      onClick={() => handleAddPhoto(newPhotoUrl, newPhotoLabel)}
                      className="px-3.5 py-2 rounded-xl bg-[#087E79] hover:bg-[#066864] text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      + Tambah Foto
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: LINK REFERENSI BRIEF (DEFAULT 1 KOLOM, CAN ADD 3 OR MORE) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4 text-[#087E79]" />
                      <span>Link Referensi Brief & Moodboard ({referenceLinks.length} Link)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Masukkan link referensi acuan brief, Pinterest, Instagram, Figma, atau produk kompetitor (Minimal 1 kolom default, dapat ditambah 3+ link).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddReferenceLink}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#087E79]/10 hover:bg-[#087E79]/20 text-[#087E79] font-bold text-[11px] transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Link Referensi</span>
                  </button>
                </div>

                {/* Dynamic Reference Link Input Columns */}
                <div className="space-y-2">
                  {referenceLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-400 w-6 text-center shrink-0">
                        #{idx + 1}
                      </span>
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => handleUpdateReferenceLink(idx, e.target.value)}
                        placeholder={`https://pinterest.com/pin/... atau link referensi #${idx + 1}`}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:border-[#087E79] focus:outline-none transition-all"
                      />
                      {referenceLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveReferenceLink(idx)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                          title="Hapus Kolom Link Ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: ARAH DESAIN & BRIEF */}
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1">
                  Arah Desain & Concept Brief Singkat
                </label>
                <textarea
                  rows={3}
                  value={briefIntent}
                  onChange={(e) => setBriefIntent(e.target.value)}
                  placeholder="Jelaskan inspirasi konsep, fitur kunci, atau target spesifikasi unik produk ini..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-[#087E79] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: TARGET HARGA (DEFAULT 0), CHECKLIST SIZE (XS - 5XL), & VARIANT WARNA BAHAN BAKU */}
          {step === 3 && (
            <div className="space-y-5">
              {/* SECTION: TARGET HARGA JUAL & HPP (DEFAULT 0) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#087E79]" />
                    <span>Target Finansial & Harga Jual (Default 0)</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">Estimasi Awal Margin</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Target Harga Jual / MSRP (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={targetPriceMSRP}
                      onChange={(e) => setTargetPriceMSRP(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono font-extrabold text-slate-900 focus:bg-white focus:border-[#087E79] focus:outline-none"
                    />
                    <span className="text-[11px] font-mono font-extrabold text-[#087E79] block">
                      {formatIDR(targetPriceMSRP)}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Target HPP / Modal BOM (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={targetHPP}
                      onChange={(e) => setTargetHPP(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono font-extrabold text-slate-900 focus:bg-white focus:border-[#087E79] focus:outline-none"
                    />
                    <span className="text-[11px] font-mono font-semibold text-slate-600 block">
                      {formatIDR(targetHPP)}{' '}
                      <span className="text-[#087E79] font-bold">
                        (Est Margin:{' '}
                        {targetPriceMSRP > 0
                          ? (((targetPriceMSRP - targetHPP) / targetPriceMSRP) * 100).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: CHECKLIST SIZE LENGKAP (XS SAMPAI 5XL) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900">
                      Checklist Size Set Lengkap ({selectedSizes.length} Ukuran Terpilih)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilih variasi ukuran produk dari size XS sampai 5XL yang akan dikembangkan.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectAllSizes}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold transition-all"
                    >
                      Pilih Semua (XS-5XL)
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectStandardSizes}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold transition-all"
                    >
                      S - XL
                    </button>
                  </div>
                </div>

                {/* Grid Checklist Sizes XS to 5XL */}
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 pt-1">
                  {ALL_SIZES.map((size) => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleToggleSize(size)}
                        className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#087E79] text-white border-[#087E79] shadow-2xs scale-102 font-extrabold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <span className="text-xs">{size}</span>
                        {isSelected ? (
                          <Check className="w-3 h-3 mt-0.5" />
                        ) : (
                          <span className="text-[9px] text-slate-400 mt-0.5">+</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: VARIANT WARNA BAHAN BAKU YANG TERDAFTAR (MULTI SELECT BY MATERIAL) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-[#087E79]" />
                      <span>Pilih Varian Warna Bahan Baku Terdaftar ({selectedColorways.length} Terpilih)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilih varian warna langsung berdasarkan bahan baku terdaftar (seperti Kain WP Columbia, Cotton Fleece, Cotton Combed, dll).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddCustomColorOpen((prev) => !prev)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-2xs self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddCustomColorOpen ? 'Tutup Form Warna' : '+ Tambah Warna Custom'}</span>
                  </button>
                </div>

                {/* Inline Form to Add Custom Colorway */}
                {isAddCustomColorOpen && (
                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-3 animate-fadeIn">
                    <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Form Tambah Varian Warna Bahan Baku Baru:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Nama Warna</label>
                        <input
                          type="text"
                          value={customColorName}
                          onChange={(e) => setCustomColorName(e.target.value)}
                          placeholder="misal: Steel Blue WP"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Kode Warna</label>
                        <input
                          type="text"
                          value={customColorCode}
                          onChange={(e) => setCustomColorCode(e.target.value)}
                          placeholder="misal: COL-11"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Bahan Baku</label>
                        <select
                          value={customColorMaterial}
                          onChange={(e) => setCustomColorMaterial(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-900"
                        >
                          <option value="Kain WP Columbia">Kain WP Columbia</option>
                          <option value="Cotton Fleece Heavyweight 330gsm">Cotton Fleece 330gsm</option>
                          <option value="Cordura Nylon Waterproof 600D">Cordura Nylon 600D</option>
                          <option value="Cotton Combed 30s">Cotton Combed 30s</option>
                          <option value="Taslan Milky Waterproof">Taslan Milky Waterproof</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.name}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Warna Swatch</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={customColorHex}
                            onChange={(e) => setCustomColorHex(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border border-slate-300 p-0.5"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomColorway}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-[#087E79] hover:bg-[#066561] text-white font-bold text-xs shadow-2xs"
                          >
                            + Tambahkan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Colorways Badges Row */}
                <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 min-h-[48px]">
                  {selectedColorways.length === 0 ? (
                    <div className="w-full text-center py-1.5 px-2">
                      <span className="text-xs font-semibold text-slate-400">
                        Belum ada varian warna terpilih. Silakan klik varian warna dari katalog di bawah untuk menambahkan.
                      </span>
                    </div>
                  ) : (
                    selectedColorways.map((col) => (
                      <div
                        key={col.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-2xs animate-fadeIn"
                      >
                        {/* Swatch Circle with Custom Color Picker */}
                        <div
                          className="relative flex items-center justify-center shrink-0"
                          onClick={(e) => e.stopPropagation()}
                          title="Klik untuk ubah warna HEX custom"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/50 block shadow-2xs cursor-pointer"
                            style={{ backgroundColor: col.hex }}
                          />
                          <input
                            type="color"
                            value={col.hex}
                            onChange={(e) => handleUpdateColorHex(col.name, e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="Klik untuk ubah warna HEX custom"
                          />
                        </div>

                        <span>{col.name}</span>
                        <span className="font-mono text-[9px] text-slate-400">({col.code})</span>
                        {col.materialSource && (
                          <span className="text-[9px] bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                            {col.materialSource}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleColorway(col)}
                          className="text-slate-400 hover:text-rose-400 ml-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Material Select Dropdown & Search Control Bar */}
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-[11px] font-extrabold text-slate-800 block">
                      Filter Varian Warna Berdasarkan Bahan Baku Terdaftar:
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Menampilkan {filteredCatalogColors.length} dari {catalogMaterialColors.length} varian warna
                    </span>
                  </div>

                  {/* Controls Row: Material Dropdown Select + Live Material Search Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    {/* Material Select Dropdown ke Bawah (6 columns) */}
                    <div className="sm:col-span-6 relative">
                      <select
                        value={selectedMaterialFilter}
                        onChange={(e) => setSelectedMaterialFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:border-[#087E79] focus:outline-none shadow-2xs cursor-pointer appearance-none pr-8"
                      >
                        <option value="ALL">✨ Semua Bahan Baku ({catalogMaterialColors.length} Warna)</option>
                        {availableMaterialNames.map((matName: string) => {
                          const count = catalogMaterialColors.filter(
                            (c: { material: string }) => c.material.toLowerCase() === matName.toLowerCase()
                          ).length;
                          return (
                            <option key={matName} value={matName}>
                              🧥 {matName} ({count} Warna)
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                        ▼
                      </div>
                    </div>

                    {/* Live Material Search Input Box (6 columns) */}
                    <div className="sm:col-span-6 relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={colorSearchQuery}
                        onChange={(e) => setColorSearchQuery(e.target.value)}
                        placeholder="Cari data material / bahan baku (misal: WP COLUMBIA)..."
                        className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#087E79] focus:outline-none shadow-2xs"
                      />
                      {colorSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setColorSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Palette Grid from Filtered Catalog Colors */}
                  {filteredCatalogColors.length === 0 ? (
                    <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-300">
                      <p className="text-xs font-semibold text-slate-500">
                        Tidak ada varian warna atau bahan baku yang cocok dengan pencarian Anda.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMaterialFilter('ALL');
                          setColorSearchQuery('');
                        }}
                        className="mt-2 text-xs font-extrabold text-[#087E79] underline hover:text-[#066561]"
                      >
                        Reset Filter &amp; Pencarian
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-[260px] overflow-y-auto pr-1">
                      {filteredCatalogColors.map((rawColor: { name: string; code: string; hex: string; material: string }) => {
                        const isSelected = selectedColorways.some((c) => c.name === rawColor.name);
                        return (
                          <div
                            key={`${rawColor.material}-${rawColor.code}`}
                            onClick={() => handleToggleColorway(rawColor)}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 border-[#087E79] text-slate-900 shadow-2xs font-extrabold'
                                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Swatch Circle with Interactive Custom Hex Color Picker */}
                              <div
                                className="relative flex items-center justify-center shrink-0"
                                onClick={(e) => e.stopPropagation()}
                                title="Klik lingkaran warna untuk ubah warna HEX custom"
                              >
                                <span
                                  className="w-5 h-5 rounded-full border border-slate-300 shrink-0 shadow-2xs block cursor-pointer transition-transform hover:scale-110"
                                  style={{ backgroundColor: rawColor.hex }}
                                />
                                <input
                                  type="color"
                                  value={rawColor.hex}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleUpdateColorHex(rawColor.name, e.target.value);
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  title="Klik lingkaran warna untuk ubah warna HEX custom"
                                />
                              </div>

                              <div>
                                <div className="text-xs font-bold leading-tight">{rawColor.name}</div>
                                <div className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 mt-0.5">
                                  <span>{rawColor.material}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                {rawColor.code}
                              </span>
                              {isSelected && <Check className="w-4 h-4 text-[#087E79]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: TANGGAL TARGET SAMPLING & RILIS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">
                    Target Tanggal Sampel Selesai
                  </label>
                  <input
                    type="date"
                    value={targetSampleDate}
                    onChange={(e) => setTargetSampleDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-[#087E79] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 mb-1">
                    Target Tanggal Rilis Artikel
                  </label>
                  <input
                    type="date"
                    value={targetReleaseDate}
                    onChange={(e) => setTargetReleaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-[#087E79] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {isEditMode ? (
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
            >
              Batal
            </button>
          ) : (
            <button
              onClick={() => handleSubmit(true)}
              disabled={!canSubmit}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              Simpan Draft
            </button>
          )}

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep((step - 1) as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Kembali
              </button>
            )}

            {isEditMode && (
              <button
                onClick={() => handleSubmit(false)}
                disabled={!canSubmit}
                className="flex items-center gap-1.5 px-5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => canSubmit && setStep((step + 1) as any)}
                disabled={!canSubmit}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#087E79] hover:bg-[#066864] text-white text-xs font-bold disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Lanjut</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              !isEditMode && (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={!canSubmit}
                  className="flex items-center gap-1.5 px-5 py-1.5 rounded-xl bg-[#087E79] hover:bg-[#066864] text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Terbitkan Prospek</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
