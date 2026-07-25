import { supabase } from '@/integrations/supabase/client';

const TABLE_NAME = 'workspace_simulation_states';
const RECORD_ID = 'gg-workspace-main';
const FALLBACK_STORAGE_KEY = 'gg_workspace_bridge_state';

export const DEFAULT_SIMULATION_STATE = {
  current: 'u1',
  users: [
    {
      id: 'u1',
      name: 'Gugun Gunawan',
      ini: 'GG',
      role: 'Owner',
      title: 'Strategi, Sistem & Pengembangan Bisnis',
      active: true,
      p: {
        create: true,
        monitor: true,
        brief: true,
        supplier: true,
        hpp: true,
        sample: true,
        size: true,
        approve: true,
        access: true,
      },
    },
    {
      id: 'u2',
      name: 'Dodi Awaludin',
      ini: 'DA',
      role: 'Product Lead',
      title: 'Finalisasi Artikel & Relasi Mitra',
      active: true,
      p: {
        create: true,
        monitor: false,
        brief: true,
        supplier: true,
        hpp: true,
        sample: true,
        size: false,
        approve: false,
        access: false,
      },
    },
    {
      id: 'u3',
      name: 'Yadi',
      ini: 'YD',
      role: 'Production',
      title: 'Sampling, Pola & Standardisasi',
      active: true,
      p: {
        create: false,
        monitor: false,
        brief: false,
        supplier: false,
        hpp: true,
        sample: true,
        size: true,
        approve: false,
        access: false,
      },
    },
    {
      id: 'u4',
      name: 'Syaikhu',
      ini: 'SY',
      role: 'Sourcing & Admin',
      title: 'Supplier, Finishing & Dokumentasi',
      active: true,
      p: {
        create: false,
        monitor: false,
        brief: false,
        supplier: true,
        hpp: true,
        sample: true,
        size: true,
        approve: false,
        access: false,
      },
    },
  ],
  orders: [
    {
      id: 'o1',
      code: 'GS-WB-001',
      brand: 'GG Supply',
      name: 'Windbreaker Polos Kombinasi',
      colors: ['Petrol/Jade', 'Hitam/Putih'],
      photo: '',
      ref: 'https://example.com/windbreaker',
      priority: 'Tinggi',
      due: '2026-08-06',
      created: '2026-07-22',
      by: 'u1',
      pic: 'u2',
      support: ['u3', 'u4'],
      brief:
        'Finalisasi artikel windbreaker polos untuk stok dan custom. Visor hood wajib, zipper mengikuti warna atas, lengan mengikuti warna bawah.',
      stages: [
        ['brief', 'done', 'u1', 'Brief dan standar visual terkunci.'],
        ['material', 'done', 'u2', 'Micro despo NS menjadi kandidat utama.'],
        ['supplier', 'done', 'u4', 'Dua supplier dibandingkan.'],
        ['color', 'done', 'u2', 'Dua kombinasi awal disetujui.'],
        ['sample', 'doing', 'u3', 'Revisi panjang badan dan visor.'],
        ['hpp', 'todo', 'u2', ''],
        ['size', 'todo', 'u3', ''],
        ['final', 'todo', 'u1', ''],
      ].map(([id, status, who, note]) => ({ id, status, who, note })),
      hpp: {
        fabricPrice: 32000,
        consumption: 2.2,
        accessories: 26000,
        cutting: 8000,
        sewing: 42000,
        decoration: 0,
        finishing: 6000,
        packaging: 5000,
        transport: 4000,
        rejectPct: 3,
        overheadPct: 8,
        marginPct: 35,
        final: false,
      },
      samples: [
        {
          v: 'Sampel 01',
          date: '2026-07-24',
          status: 'Revisi',
          note: 'Badan masih buntet; visor kurang terlihat.',
        },
        {
          v: 'Sampel 02',
          date: '2026-07-27',
          status: 'Proses',
          note: 'Tambah panjang badan 15% dan perbaiki hood.',
        },
      ],
      size: [
        { s: 'S', chest: 54, length: 68, sleeve: 58, shoulder: 47 },
        { s: 'M', chest: 56, length: 70, sleeve: 59, shoulder: 49 },
        { s: 'L', chest: 58, length: 72, sleeve: 60, shoulder: 51 },
        { s: 'XL', chest: 60, length: 74, sleeve: 61, shoulder: 53 },
      ],
    },
    {
      id: 'o2',
      code: 'GD-VR-001',
      brand: 'GUDSKUY',
      name: 'Varsity Classic Jade',
      colors: ['Jade/Obsidian'],
      photo: '',
      ref: 'https://example.com/varsity',
      priority: 'Tinggi',
      due: '2026-08-12',
      created: '2026-07-23',
      by: 'u1',
      pic: 'u3',
      support: ['u2', 'u4'],
      brief:
        'Produk pembuka GUDSKUY. Pola raglan, piping putih, kancing putih 6, rib warna badan dengan 2 garis putih.',
      stages: [
        ['brief', 'done', 'u1', 'Identitas produk dan detail visual terkunci.'],
        ['material', 'doing', 'u2', 'Uji Colombia WP dan alternatif bahan doff.'],
        ['supplier', 'doing', 'u4', 'Mengumpulkan swatch dan aksesori.'],
        ['color', 'todo', 'u2', ''],
        ['sample', 'todo', 'u3', ''],
        ['hpp', 'todo', 'u2', ''],
        ['size', 'todo', 'u3', ''],
        ['final', 'todo', 'u1', ''],
      ].map(([id, status, who, note]) => ({ id, status, who, note })),
      hpp: {
        fabricPrice: 38000,
        consumption: 2.4,
        accessories: 42000,
        cutting: 9000,
        sewing: 50000,
        decoration: 18000,
        finishing: 7000,
        packaging: 7000,
        transport: 5000,
        rejectPct: 4,
        overheadPct: 10,
        marginPct: 45,
        final: false,
      },
      samples: [],
      size: [
        { s: 'S', chest: 55, length: 65, sleeve: 72, shoulder: 0 },
        { s: 'M', chest: 57, length: 67, sleeve: 74, shoulder: 0 },
        { s: 'L', chest: 59, length: 69, sleeve: 76, shoulder: 0 },
        { s: 'XL', chest: 61, length: 71, sleeve: 78, shoulder: 0 },
      ],
    },
    {
      id: 'o3',
      code: 'GS-PL-001',
      brand: 'GG Supply',
      name: 'Polo Shirt Corporate',
      colors: ['Navy', 'Hitam', 'Putih'],
      photo: '',
      ref: '',
      priority: 'Normal',
      due: '2026-08-02',
      created: '2026-07-20',
      by: 'u2',
      pic: 'u2',
      support: ['u3', 'u4'],
      brief:
        'Artikel polos dan custom corporate. Prioritas bahan stabil, nyaman, dan mudah dibordir.',
      stages: [
        ['brief', 'done', 'u2', 'Target corporate dan custom.'],
        ['material', 'done', 'u2', 'Lacoste CVC kandidat utama.'],
        ['supplier', 'done', 'u4', 'Supplier bahan dan rib tersedia.'],
        ['color', 'review', 'u2', 'Menunggu approval swatch navy.'],
        ['sample', 'doing', 'u3', 'Pembuatan sampel size M.'],
        ['hpp', 'doing', 'u2', 'Harga rib belum final.'],
        ['size', 'todo', 'u3', ''],
        ['final', 'todo', 'u1', ''],
      ].map(([id, status, who, note]) => ({ id, status, who, note })),
      hpp: {
        fabricPrice: 65000,
        consumption: 0.75,
        accessories: 12000,
        cutting: 5000,
        sewing: 24000,
        decoration: 0,
        finishing: 4000,
        packaging: 3500,
        transport: 2500,
        rejectPct: 3,
        overheadPct: 8,
        marginPct: 30,
        final: false,
      },
      samples: [
        {
          v: 'Sampel 01',
          date: '2026-07-26',
          status: 'Proses',
          note: 'Fokus kerah, placket, dan kestabilan ukuran.',
        },
      ],
      size: [
        { s: 'S', chest: 48, length: 66, sleeve: 20, shoulder: 42 },
        { s: 'M', chest: 51, length: 69, sleeve: 21, shoulder: 44 },
        { s: 'L', chest: 54, length: 72, sleeve: 22, shoulder: 46 },
        { s: 'XL', chest: 57, length: 75, sleeve: 23, shoulder: 48 },
      ],
    },
  ],
  suppliers: [
    {
      id: 's1',
      name: 'Mitra Textile A',
      cat: 'Kain',
      mat: 'Micro Despo NS',
      price: 32000,
      moq: '1 roll',
      lead: '2–3 hari',
      spec: 'Petrol, Jade, Black, White',
      status: 'Approved',
    },
    {
      id: 's2',
      name: 'Sentra Rajut B',
      cat: 'Kain',
      mat: 'Lacoste CVC',
      price: 65000,
      moq: '25 kg',
      lead: '3–5 hari',
      spec: 'Navy, Black, White',
      status: 'Review',
    },
    {
      id: 's3',
      name: 'Aksesori Prima',
      cat: 'Aksesori',
      mat: 'Zipper waterproof & stopper',
      price: 12500,
      moq: '100 pcs',
      lead: '2 hari',
      spec: 'Custom warna minimum 500 pcs',
      status: 'Approved',
    },
    {
      id: 's4',
      name: 'Label Karya',
      cat: 'Packaging',
      mat: 'Woven label & hangtag',
      price: 2800,
      moq: '500 pcs',
      lead: '7 hari',
      spec: 'Woven damask + hangtag 2 sisi',
      status: 'Review',
    },
  ],
  evals: [
    {
      date: '2026-07-25',
      type: 'Mingguan',
      title: 'Fokus finalisasi windbreaker',
      note: 'Selesaikan revisi visor, panjang badan, dan validasi HPP bahan.',
    },
  ],
  activity: [
    {
      at: '2026-07-27 15:20',
      user: 'u3',
      text: 'Memperbarui Sampel 02 Windbreaker menjadi proses.',
    },
    {
      at: '2026-07-27 11:10',
      user: 'u4',
      text: 'Menambahkan supplier zipper waterproof.',
    },
    {
      at: '2026-07-26 17:45',
      user: 'u2',
      text: 'Memperbarui kandidat bahan Varsity Classic Jade.',
    },
    {
      at: '2026-07-25 19:00',
      user: 'u1',
      text: 'Membuat evaluasi mingguan.',
    },
  ],
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_SIMULATION_STATE));
}

function hasConfiguredSupabase() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      !import.meta.env.VITE_SUPABASE_URL.includes('placeholder') &&
      import.meta.env.VITE_SUPABASE_ANON_KEY !== 'placeholder-key',
  );
}

function normalizeState(state: unknown) {
  if (!state || typeof state !== 'object') {
    return cloneDefaultState();
  }

  return {
    ...cloneDefaultState(),
    ...JSON.parse(JSON.stringify(state)),
  };
}

export async function loadSimulationState() {
  const fallbackRaw = window.localStorage.getItem(FALLBACK_STORAGE_KEY);

  if (!hasConfiguredSupabase()) {
    return normalizeState(fallbackRaw ? JSON.parse(fallbackRaw) : cloneDefaultState());
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('state')
      .eq('id', RECORD_ID)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const state = normalizeState(data?.state ?? (fallbackRaw ? JSON.parse(fallbackRaw) : cloneDefaultState()));
    window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(state));
    return state;
  } catch (error) {
    console.warn('Gagal memuat state simulasi dari Supabase, menggunakan fallback lokal.', error);
    return normalizeState(fallbackRaw ? JSON.parse(fallbackRaw) : cloneDefaultState());
  }
}

export async function saveSimulationState(state: unknown) {
  const normalized = normalizeState(state);
  window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(normalized));

  if (!hasConfiguredSupabase()) {
    return normalized;
  }

  try {
    const { error } = await supabase.from(TABLE_NAME).upsert({
      id: RECORD_ID,
      state: normalized,
      updated_by:
        typeof normalized.current === 'string'
          ? normalized.current
          : null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn('Gagal menyimpan state simulasi ke Supabase, fallback lokal tetap aktif.', error);
  }

  return normalized;
}
