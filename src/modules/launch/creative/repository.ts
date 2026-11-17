import { supabase } from '@/integrations/supabase/client';
import { mondayWeek, type Focus } from './schedule';

export const platforms = {
  instagram: 'Instagram', threads: 'Threads', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook',
  whatsapp: 'WhatsApp', marketplace: 'Marketplace', website: 'Website', internal: 'Internal', other: 'Lainnya',
};
export const taskStatuses = {
  todo: 'Belum mulai', doing: 'Dikerjakan', review: 'Review', ready: 'Siap tayang',
  done: 'Selesai', blocked: 'Terhambat', cancelled: 'Dibatalkan',
};
export const campaignStatuses = { planned: 'Direncanakan', active: 'Aktif', completed: 'Selesai', archived: 'Diarsipkan' };
export const priorities = { normal: 'Normal', high: 'Tinggi', urgent: 'Mendesak' };
export const ideaQueues = { candidate: 'Perlu ditinjau', ready: 'Siap dikerjakan', parked: 'Ditunda' };
export const workstreams = { creative: 'Produksi Konten', marketing: 'Marketing & Promo', operations: 'Operasional' };
export const outputTypes = { post: 'Postingan teks', image: 'Gambar statis', carousel: 'Carousel', video: 'Video', story: 'Story', live: 'Live', other: 'Lainnya' };
export const copyFormats = { caption: 'Caption', hook: 'Hook video', script: 'Skrip video', listing: 'Listing produk', ad: 'Iklan', other: 'Lainnya' };
export const taskRoutineModes = {
  once: 'Sekali Buat (1x Video / Konten)',
  event_triggered: 'Rutin Setiap Kejadian (Order Customer / Testimoni)',
  scheduled_recurring: 'Rutin Terjadwal (Harian / Mingguan / Bulanan)',
};
export const taskRoutineCategories = {
  platform_optimization: 'Optimasi Akun & Profil Platform',
  account_concept: 'Konsep Postingan & Pola Konten',
  channel_audit: 'Audit & Pemeliharaan Kanal',
  customer_order: 'Dokumentasi Video Customer Order',
  testimonial: 'Testimoni & Review Pelanggan',
  packing_shipping: 'Dokumentasi Packing & Pengiriman Order',
  production_qc: 'Proses Produksi / Jahit / Sablon / QC Order',
  customer_qna: 'Video Jawab Pertanyaan / Request Customer',
  daily_weekly: 'Konten Rutin Harian / Mingguan Produk',
  other_routine: 'Rutinitas Konten Lainnya',
};
export type RoutinePreset = {
  id: string;
  label: string;
  badge: string;
  mode: keyof typeof taskRoutineModes;
  category: keyof typeof taskRoutineCategories;
  output_type: keyof typeof outputTypes;
  platform?: keyof typeof platforms;
  workstream?: keyof typeof workstreams;
  trigger: string;
  target: string;
  format: string;
  deliverable: string;
  acceptance_criteria: string;
  checklist: string[];
};
export const ROUTINE_PRESETS: RoutinePreset[] = [
  {
    id: 'preset-threads-profile-optimization',
    label: 'Optimasi Akun & Profil Threads',
    badge: 'Threads Profil',
    mode: 'once',
    category: 'platform_optimization',
    output_type: 'other',
    platform: 'threads',
    workstream: 'operations',
    trigger: 'Setup awal atau pembaruan identitas akun Threads unit bisnis',
    target: 'Profil Threads lengkap, terverifikasi & siap posting',
    format: 'Checklist Setup Profil & Bio Akun Threads',
    deliverable: 'Profil Threads teroptimasi (foto profil brand, bio CTA, tautan WA/web, dan 1 pinned thread perkenalan)',
    acceptance_criteria: 'Bio jelas menjelaskan value bisnis, tautan aktif & dapat diklik, serta konsisten dengan identitas visual brand',
    checklist: [
      'Sinkronkan username, display name & foto profil sesuai logo resmi unit bisnis',
      'Tulis bio singkat yang jelas (positioning + CTA ke WhatsApp/katalog)',
      'Pasang link tujuan aktif (Linktree / Landing Page / WA Order)',
      'Buat & sematkan (pin) Thread perkenalan brand / layanan utama',
      'Follow & interaksi awal dengan akun relevan / komunitas industri',
    ],
  },
  {
    id: 'preset-threads-posting-concept',
    label: 'Konsep Postingan & Rutinitas Threads',
    badge: 'Konsep Threads',
    mode: 'scheduled_recurring',
    category: 'account_concept',
    output_type: 'post',
    platform: 'threads',
    workstream: 'marketing',
    trigger: 'Rutinitas harian / mingguan posting & interaksi di Threads',
    target: '3–5 Thread/minggu + balasan komentar aktif',
    format: 'Konsep Postingan Teks / Carousel Ringkas / Diskusi Threads',
    deliverable: 'Dokumen pilar topik Threads, daftar hook conversational, dan jadwal posting rutin',
    acceptance_criteria: 'Gaya bahasa natural & memicu diskusi (tidak kaku seperti brosur), konsisten pada jam aktif audiens',
    checklist: [
      'Tentukan 3–4 pilar topik Threads (edukasi bahan, behind-the-scenes, opini industri, Q&A)',
      'Susun 5 template hook pembuka yang memancing balasan/komentar',
      'Jadwalkan posting rutin + sesi balas komentar/repost 15 menit setelah tayang',
      'Evaluasi topik dengan engagement tertinggi setiap akhir minggu',
    ],
  },
  {
    id: 'preset-platform-profile-optimization',
    label: 'Optimasi Profil & Bio Platform (IG / TikTok / YT)',
    badge: 'Optimasi Profil',
    mode: 'scheduled_recurring',
    category: 'platform_optimization',
    output_type: 'other',
    platform: 'instagram',
    workstream: 'operations',
    trigger: 'Audit bulanan atau saat ada promo/produk baru',
    target: 'Seluruh bio, highlight, tautan & katalog kanal up-to-date',
    format: 'Audit Profil, Bio, Highlight & Tautan Kanal',
    deliverable: 'Laporan & pembaruan profil kanal (bio, highlight story, link bio, info kontak)',
    acceptance_criteria: 'Tidak ada tautan mati, informasi kontak/jam operasional akurat, dan highlight tertata rapi',
    checklist: [
      'Periksa & perbarui bio, kategori akun, serta nomor/link WhatsApp Order',
      'Rapikan Highlight Story / Pinned Post / Playlist unggulan',
      'Pastikan seluruh tautan di bio berfungsi dan mengarah ke halaman yang benar',
      'Cek kelengkapan deskripsi akun & konsistensi branding antar platform',
    ],
  },
  {
    id: 'preset-channel-audit-maintenance',
    label: 'Audit & Kebersihan Kanal Rutin (DM / Komentar / Katalog)',
    badge: 'Audit Kanal',
    mode: 'scheduled_recurring',
    category: 'channel_audit',
    output_type: 'other',
    platform: 'instagram',
    workstream: 'operations',
    trigger: 'Rutinitas mingguan (setiap Jumat / Senin)',
    target: '0 DM/komentar penting terlewat & katalog terawat',
    format: 'Checklist Pemeliharaan & Kebersihan Akun',
    deliverable: 'Catatan audit mingguan (balasan DM/komentar, pembersihan spam, update stok/harga)',
    acceptance_criteria: 'Semua pertanyaan calon pembeli terjawab dan tidak ada komentar spam/negatif yang mengganggu',
    checklist: [
      'Cek seluruh DM, komentar, dan mention yang belum dibalas di tiap platform',
      'Bersihkan komentar spam / bot dan sematkan komentar positif jika relevan',
      'Periksa kesesuaian informasi promo atau stok produk yang masih aktif',
    ],
  },
  {
    id: 'preset-customer-order',
    label: 'Setiap Customer Order (Video Dokumentasi)',
    badge: 'Order Customer',
    mode: 'event_triggered',
    category: 'customer_order',
    output_type: 'video',
    trigger: 'Setiap ada customer order / PO masuk (sebelum barang dikirim)',
    target: '1 Video Dokumentasi per Customer Order',
    format: 'Video Dokumentasi Order 15-45 detik (Reels / TikTok / WA)',
    deliverable: '1 video dokumentasi produk pesanan customer siap upload + foto/footage bukti order',
    acceptance_criteria: 'Menampilkan detail produk pesanan customer dengan jelas, rapi, dan selalu menyertakan identitas/icon perusahaan',
    checklist: [
      'Cek detail artikel, warna, dan jumlah pesanan customer order',
      'Rekam footage close-up detail produk / hasil bordir / sablon / jahitan',
      'Rekam proses pelipatan & persiapan packing pesanan customer',
      'Edit singkat + tambahkan watermark/icon perusahaan & teks order',
    ],
  },
  {
    id: 'preset-testimonial',
    label: 'Konten Testimoni & Review Pelanggan',
    badge: 'Testimoni',
    mode: 'event_triggered',
    category: 'testimonial',
    output_type: 'video',
    trigger: 'Setiap ada testimoni, foto pemakaian, atau review dari customer',
    target: '1 Konten Bukti Sosial per Testimoni Masuk',
    format: 'Video / Story / Post Kompilasi Testimoni Customer',
    deliverable: 'Konten video atau visual testimoni pelanggan siap tayang di sosial media',
    acceptance_criteria: 'Review pelanggan terbaca jelas, disandingkan dengan footage produk asli, dan menggunakan icon perusahaan',
    checklist: [
      'Simpan tangkapan layar review / video unboxing dari pelanggan',
      'Gabungkan dengan footage produk asli yang dipesan pelanggan',
      'Tambahkan highlight kepuasan pelanggan & ajakan order (CTA)',
    ],
  },
  {
    id: 'preset-packing-shipping',
    label: 'Dokumentasi Packing & Pengiriman Order',
    badge: 'Pengiriman',
    mode: 'event_triggered',
    category: 'packing_shipping',
    output_type: 'video',
    trigger: 'Setiap kloter pengiriman / pick-up ekspedisi order customer',
    target: '1 Video / Story Bukti Pengiriman per Kloter',
    format: 'Video Aktivitas Packing & Pengiriman (15-30 detik)',
    deliverable: 'Video dokumentasi paket pesanan yang siap dikirim ke ekspedisi',
    acceptance_criteria: 'Menunjukkan aktivitas pengiriman riil untuk meningkatkan kepercayaan calon pembeli',
    checklist: [
      'Rekam proses pengemasan paket dan tempel resi pengiriman',
      'Rekam tumpukan paket siap kirim atau serah terima kurir',
      'Tambahkan caption update pengiriman hari ini & icon perusahaan',
    ],
  },
  {
    id: 'preset-production-qc',
    label: 'Behind The Scene Produksi & QC Order',
    badge: 'Produksi / QC',
    mode: 'event_triggered',
    category: 'production_qc',
    output_type: 'video',
    trigger: 'Setiap batch produksi atau pengecekan QC pesanan berjalan',
    target: '1 Video Proses Produksi / QC per Batch',
    format: 'Video Behind The Scenes Produksi & QC (15-30 detik)',
    deliverable: 'Video proses pengerjaan produksi dan pengecekan kualitas (QC)',
    acceptance_criteria: 'Menonjolkan kerapian pengerjaan, kualitas bahan, dan standar QC perusahaan',
    checklist: [
      'Rekam tahapan pengerjaan produksi (cutting / jahit / finishing)',
      'Rekam pengecekan kualitas (QC) ukuran dan kerapian benang',
      'Tambahkan narasi singkat standar kualitas & icon perusahaan',
    ],
  },
  {
    id: 'preset-scheduled-routine',
    label: 'Konten Rutin Terjadwal (Harian / Mingguan)',
    badge: 'Rutin Berkala',
    mode: 'scheduled_recurring',
    category: 'daily_weekly',
    output_type: 'video',
    trigger: 'Jadwal rutin berkala (Harian / 3x Seminggu / Mingguan)',
    target: 'Sesuai target jadwal mingguan',
    format: 'Video Reels / TikTok / Story Rutin',
    deliverable: 'Konten rutin sesuai jadwal publikasi mingguan',
    acceptance_criteria: 'Sesuai jadwal publikasi, konsisten dengan tone visual dan icon perusahaan',
    checklist: [
      'Siapkan produk atau topik bahasan sesuai jadwal rutin',
      'Take video dan edit sesuai template brand',
      'Publikasikan pada jam tayang utama',
    ],
  },
];
type Row = { id: string; updated_at: string };
export type ChecklistItem = { label: string; done: boolean };
export const briefFields = {
  objective: 'Tujuan', audience: 'Audiens', insight: 'Insight pelanggan', message: 'Pesan utama',
  offer: 'Penawaran', cta: 'Ajakan bertindak', mandatory: 'Elemen wajib', restrictions: 'Batasan atau klaim yang dihindari',
  voice: 'Panduan gaya bahasa dan visual', references: 'Referensi',
};
type CreativeBrief = Partial<Record<keyof typeof briefFields, string>> & {
  _copy_template_id?: string;
  _output_type?: keyof typeof outputTypes;
  _routine_mode?: keyof typeof taskRoutineModes;
  _routine_category?: keyof typeof taskRoutineCategories;
  _routine_trigger?: string;
  _routine_target?: string;
  _routine_runs?: string;
  _routine_last_note?: string;
};
export type Campaign = Row & {
  business_unit_id?: string | null;
  name: string; objective: string; owner_id: string | null; status: keyof typeof campaignStatuses;
  starts_on: string | null; ends_on: string | null; budget_idr: number; spent_idr: number;
};
export type Task = Row & {
  creative_brief?: CreativeBrief;
  approver_id?: string | null;
  approved_at?: string | null;
  reviewer_id?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  checklist?: ChecklistItem[];
  deliverable?: string;
  acceptance_criteria?: string;
  completion_note?: string;
  review_note?: string;
  source_activation_id?: string | null;
  business_unit_id?: string | null;
  copy_template_id?: string | null;
  output_type?: keyof typeof outputTypes;
  routine_mode?: keyof typeof taskRoutineModes;
  routine_category?: keyof typeof taskRoutineCategories;
  routine_trigger?: string;
  routine_target?: string;
  routine_runs?: number;
  routine_last_note?: string;
  workstream?: keyof typeof workstreams;
  campaign_id: string | null; title: string; brief: string; assignee_id: string | null;
  platform: keyof typeof platforms; format: string; status: keyof typeof taskStatuses;
  additional_platforms?: (keyof typeof platforms)[];
  additional_assignee_ids?: string[];
  priority: keyof typeof priorities; due_on: string | null; publish_on: string | null;
  output_url: string; blocker: string;
};
export type TeamMember = { id: string; full_name: string; is_active: boolean; job_title: string | null; can_decide?: boolean };
export type ListedTask = Task & {
  campaign: { name: string } | null;
  source_idea: { title: string; reference_urls: string[] } | null;
};
export type Idea = Row & {
  additional_platforms?: Task['platform'][];
  business_unit_id?: string | null;
  title: string; brief: string; platform: Task['platform']; reference_urls: string[]; prioritized: boolean;
  queue_state: keyof typeof ideaQueues;
};
export type ListedIdea = Idea & { task: Pick<Task, 'id' | 'status'> | null };
export type Draft<T> = Omit<T, keyof Row>;
export const PAGE_SIZE = 30;

const campaignColumns = 'id,business_unit_id,name,objective,owner_id,status,starts_on,ends_on,budget_idr,spent_idr,updated_at';
const taskColumns = 'id,business_unit_id,workstream,campaign_id,title,brief,creative_brief,deliverable,acceptance_criteria,completion_note,checklist,assignee_id,reviewer_id,reviewed_by,reviewed_at,approver_id,approved_at,platform,additional_platforms,additional_assignee_ids,format,status,priority,due_on,publish_on,output_url,blocker,review_note,source_activation_id,updated_at';

function hydrateTask<T extends Task>(row: T): T {
  const cb = row.creative_brief ?? {};
  const mode = cb._routine_mode && cb._routine_mode in taskRoutineModes ? cb._routine_mode : row.routine_mode;
  const cat = cb._routine_category && cb._routine_category in taskRoutineCategories ? cb._routine_category : row.routine_category;
  const outType = cb._output_type && cb._output_type in outputTypes ? cb._output_type : row.output_type;
  const tplId = cb._copy_template_id || row.copy_template_id || null;
  const runs = cb._routine_runs !== undefined ? Number(cb._routine_runs) || 0 : row.routine_runs ?? 0;
  return {
    ...row,
    copy_template_id: tplId,
    output_type: outType,
    routine_mode: mode,
    routine_category: cat,
    routine_trigger: cb._routine_trigger ?? row.routine_trigger ?? '',
    routine_target: cb._routine_target ?? row.routine_target ?? '',
    routine_runs: runs,
    routine_last_note: cb._routine_last_note ?? row.routine_last_note ?? '',
  };
}

export type CopyTemplate = {
  id: string;
  title: string;
  description?: string;
  format: keyof typeof copyFormats;
  output_type: keyof typeof outputTypes;
  platform: keyof typeof platforms | null;
  body: string;
  business_unit_id: string | null;
  is_archived: boolean;
  updated_at: string;
};

const LOCAL_COPY_LIBRARY_KEY = 'mix_pro_creative_copy_library_v1';
const LEGACY_DUMMY_COPY_IDS = new Set(['template-hook-1', 'template-caption-1', 'template-script-1']);
const COPY_TPL_PREFIX = '[COPY_TPL] ';
const COPY_LINKS_TITLE = '[COPY_TPL_LINKS]';
const DELETED_IDEA_PREFIX = '[DELETED_IDEA] ';

function isInternalIdeaRecordTitle(title?: string | null): boolean {
  if (!title) return false;
  const trimmed = title.trim();
  return (
    trimmed.startsWith(COPY_TPL_PREFIX.trim()) ||
    trimmed === COPY_LINKS_TITLE ||
    trimmed.startsWith(DELETED_IDEA_PREFIX.trim())
  );
}

function getLocalCopyLibrary(): CopyTemplate[] {
  try {
    const raw = localStorage.getItem(LOCAL_COPY_LIBRARY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CopyTemplate[];
      const cleaned = parsed.filter(item => item && item.id && !LEGACY_DUMMY_COPY_IDS.has(item.id) && !isDemoText(item.title));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(LOCAL_COPY_LIBRARY_KEY, JSON.stringify(cleaned));
      }
      return cleaned.map(item => ({
        ...item,
        description: item.description ?? '',
      }));
    }
  } catch { /* ignore */ }
  return [];
}

function saveLocalCopyLibrary(items: CopyTemplate[]) {
  try {
    const cleaned = items.filter(item => item && item.id && !LEGACY_DUMMY_COPY_IDS.has(item.id));
    localStorage.setItem(LOCAL_COPY_LIBRARY_KEY, JSON.stringify(cleaned));
  } catch { /* ignore */ }
}

type PackedCopyMeta = {
  v: 1;
  title: string;
  description?: string;
  format: CopyTemplate['format'];
  output_type: CopyTemplate['output_type'];
  platform: CopyTemplate['platform'];
  is_archived: boolean;
  body_head: string;
};

function packCopyTemplateForIdeaRow(template: Omit<CopyTemplate, 'id' | 'updated_at'>) {
  const fullBody = template.body ?? '';
  const bodyHead = fullBody.slice(0, 1200);
  const rest = fullBody.slice(1200);
  const chunks: string[] = [];
  for (let i = 0; i < rest.length && chunks.length < 5; i += 950) {
    chunks.push(rest.slice(i, i + 950));
  }
  const meta: PackedCopyMeta = {
    v: 1,
    title: template.title.trim(),
    description: template.description?.trim() ?? '',
    format: template.format in copyFormats ? template.format : 'script',
    output_type: template.output_type in outputTypes ? template.output_type : 'video',
    platform: template.platform && template.platform in platforms ? template.platform : null,
    is_archived: Boolean(template.is_archived),
    body_head: bodyHead,
  };
  const safePlatform = template.platform && template.platform in platforms ? template.platform : 'internal';
  return {
    title: `${COPY_TPL_PREFIX}${template.title.trim()}`.slice(0, 160),
    brief: JSON.stringify(meta).slice(0, 2000),
    platform: safePlatform,
    reference_urls: chunks,
    business_unit_id: template.business_unit_id ?? null,
    queue_state: 'parked' as const,
    prioritized: false,
  };
}

function unpackCopyTemplateFromIdeaRow(row: {
  id: string;
  title: string;
  brief: string;
  platform: string;
  reference_urls?: string[] | null;
  business_unit_id?: string | null;
  updated_at: string;
}): CopyTemplate | null {
  try {
    const parsed = JSON.parse(row.brief) as Partial<PackedCopyMeta>;
    if (parsed && typeof parsed === 'object' && parsed.v === 1) {
      const chunks = Array.isArray(row.reference_urls) ? row.reference_urls.join('') : '';
      return {
        id: row.id,
        title: (parsed.title || row.title.replace(/^\[COPY_TPL\]\s*/i, '')).trim(),
        description: parsed.description ?? '',
        format: parsed.format && parsed.format in copyFormats ? parsed.format : 'script',
        output_type: parsed.output_type && parsed.output_type in outputTypes ? parsed.output_type : 'video',
        platform: parsed.platform && parsed.platform in platforms ? parsed.platform : null,
        body: `${parsed.body_head ?? ''}${chunks}`,
        business_unit_id: row.business_unit_id ?? null,
        is_archived: Boolean(parsed.is_archived),
        updated_at: row.updated_at || new Date().toISOString(),
      };
    }
  } catch { /* fallback if plain text */ }
  return {
    id: row.id,
    title: row.title.replace(/^\[COPY_TPL\]\s*/i, '').trim() || 'Skrip Tanpa Judul',
    description: '',
    format: 'script',
    output_type: 'video',
    platform: row.platform in platforms ? (row.platform as keyof typeof platforms) : null,
    body: row.brief || '',
    business_unit_id: row.business_unit_id ?? null,
    is_archived: false,
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

function safeUnitId(id?: string | null): string | null {
  if (!id || typeof id !== 'string') return null;
  const trimmed = id.trim();
  return /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(trimmed) ? trimmed : null;
}

function safePlatform(p?: string | null): CopyTemplate['platform'] {
  if (!p || typeof p !== 'string') return null;
  const trimmed = p.trim().toLowerCase();
  return trimmed && Object.prototype.hasOwnProperty.call(platforms, trimmed)
    ? (trimmed as keyof typeof platforms)
    : null;
}

function safeFormat(f?: string | null): CopyTemplate['format'] {
  if (!f || typeof f !== 'string') return 'script';
  return Object.prototype.hasOwnProperty.call(copyFormats, f) ? (f as CopyTemplate['format']) : 'script';
}

function safeOutputType(o?: string | null): CopyTemplate['output_type'] {
  if (!o || typeof o !== 'string') return 'video';
  return Object.prototype.hasOwnProperty.call(outputTypes, o) ? (o as CopyTemplate['output_type']) : 'video';
}

export async function copyTemplates(signal?: AbortSignal, unit = 'all'): Promise<CopyTemplate[]> {
  const local = getLocalCopyLibrary();
  let merged = local;

  // 1. Try dedicated public.creative_copy_library table
  try {
    let libQuery = supabase
      .from('creative_copy_library')
      .select('id, title, description, format, output_type, platform, body, business_unit_id, is_archived, updated_at')
      .order('updated_at', { ascending: false });
    if (signal) libQuery = libQuery.abortSignal(signal);
    const { data: libData, error: libErr } = await libQuery;

    if (!libErr && Array.isArray(libData)) {
      const dbTemplates: CopyTemplate[] = libData
        .filter(row => row && row.id && !LEGACY_DUMMY_COPY_IDS.has(row.id) && !isDemoText(row.title))
        .map(row => ({
          id: String(row.id),
          title: String(row.title || '').trim(),
          description: String(row.description || '').trim(),
          format: safeFormat(row.format),
          output_type: safeOutputType(row.output_type),
          platform: safePlatform(row.platform),
          body: String(row.body || ''),
          business_unit_id: safeUnitId(row.business_unit_id),
          is_archived: Boolean(row.is_archived),
          updated_at: String(row.updated_at || new Date().toISOString()),
        }));

      const dbMap = new Map(dbTemplates.map(item => [item.id, item]));

      // Migrate any local-only items (e.g. created offline or before DB migration) to Supabase
      const unsyncedLocal = local.filter(item => !dbMap.has(item.id) && !item.is_archived && !LEGACY_DUMMY_COPY_IDS.has(item.id) && !isDemoText(item.title));
      for (const localItem of unsyncedLocal) {
        try {
          const insertPayload = {
            title: (localItem.title || 'Naskah').trim().slice(0, 200),
            description: (localItem.description || '').trim(),
            format: safeFormat(localItem.format),
            output_type: safeOutputType(localItem.output_type),
            platform: safePlatform(localItem.platform),
            body: localItem.body || '',
            business_unit_id: safeUnitId(localItem.business_unit_id),
            is_archived: false,
          };
          const { data: inserted, error: insertErr } = await supabase
            .from('creative_copy_library')
            .insert(insertPayload)
            .select('id, updated_at')
            .maybeSingle();
          if (!insertErr && inserted?.id) {
            const migrated: CopyTemplate = {
              ...localItem,
              id: String(inserted.id),
              updated_at: String(inserted.updated_at || localItem.updated_at),
              format: safeFormat(localItem.format),
              output_type: safeOutputType(localItem.output_type),
              platform: safePlatform(localItem.platform),
              business_unit_id: safeUnitId(localItem.business_unit_id),
            };
            dbMap.set(migrated.id, migrated);
          } else {
            console.warn('[copyTemplates sync warning]', insertErr);
            dbMap.set(localItem.id, localItem);
          }
        } catch (e) {
          console.warn('[copyTemplates sync exception]', e);
          dbMap.set(localItem.id, localItem);
        }
      }

      merged = Array.from(dbMap.values()).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      saveLocalCopyLibrary(merged);
      await syncIdeaScriptLinksFromDb(signal);

      const active = merged.filter(item => !item.is_archived && !isDemoText(item.title));
      if (unit === 'all') return active;
      if (unit === 'unassigned') return active.filter(item => item.business_unit_id === null);
      return active.filter(item => item.business_unit_id === null || item.business_unit_id === unit);
    }
  } catch (err) {
    console.warn('[copyTemplates table fetch error, falling back]', err);
  }

  // 2. Fallback bridge via creative_ideas if creative_copy_library table is not yet created
  try {
    let query = supabase
      .from('creative_ideas')
      .select('id,title,brief,platform,reference_urls,business_unit_id,updated_at')
      .ilike('title', `${COPY_TPL_PREFIX}%`)
      .order('updated_at', { ascending: false });
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      const remoteTemplates = data
        .map(row => unpackCopyTemplateFromIdeaRow(row as never))
        .filter((item): item is CopyTemplate => item !== null && !LEGACY_DUMMY_COPY_IDS.has(item.id));
      const remoteById = new Map(remoteTemplates.map(item => [item.id, item]));
      const unsyncedLocal = local.filter(item => !remoteById.has(item.id) && !item.is_archived && !LEGACY_DUMMY_COPY_IDS.has(item.id) && !isDemoText(item.title));
      for (const localItem of unsyncedLocal) {
        try {
          const packed = packCopyTemplateForIdeaRow(localItem);
          const { data: inserted } = await supabase.from('creative_ideas').insert(packed).select('id,updated_at').maybeSingle();
          if (inserted?.id) {
            const migrated: CopyTemplate = { ...localItem, id: String(inserted.id), updated_at: String(inserted.updated_at || localItem.updated_at) };
            remoteById.set(migrated.id, migrated);
          } else {
            remoteById.set(localItem.id, localItem);
          }
        } catch {
          remoteById.set(localItem.id, localItem);
        }
      }
      merged = Array.from(remoteById.values()).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      saveLocalCopyLibrary(merged);
    }
  } catch { /* fallback to local cache when offline */ }

  await syncIdeaScriptLinksFromDb(signal);

  const active = merged.filter(item => !item.is_archived && !isDemoText(item.title));
  if (unit === 'all') return active;
  if (unit === 'unassigned') return active.filter(item => item.business_unit_id === null);
  return active.filter(item => item.business_unit_id === null || item.business_unit_id === unit);
}

export async function saveCopyTemplate(template: Omit<CopyTemplate, 'id' | 'updated_at' | 'is_archived'>, id?: string): Promise<string> {
  const now = new Date().toISOString();
  const list = getLocalCopyLibrary();
  const safeDraft: Omit<CopyTemplate, 'id' | 'updated_at'> = {
    ...template,
    title: (template.title || 'Naskah').trim().slice(0, 200),
    description: (template.description || '').trim(),
    format: safeFormat(template.format),
    output_type: safeOutputType(template.output_type),
    platform: safePlatform(template.platform),
    body: template.body || '',
    business_unit_id: safeUnitId(template.business_unit_id),
    is_archived: false,
  };
  const isUuid = Boolean(id && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id));

  // 1. Try public.creative_copy_library table
  try {
    const payload = {
      title: safeDraft.title,
      description: safeDraft.description,
      format: safeDraft.format,
      output_type: safeDraft.output_type,
      platform: safeDraft.platform,
      body: safeDraft.body,
      business_unit_id: safeDraft.business_unit_id,
      is_archived: false,
    };
    if (id && isUuid) {
      const { data, error } = await supabase
        .from('creative_copy_library')
        .update(payload)
        .eq('id', id)
        .select('id, updated_at')
        .maybeSingle();
      if (!error && data?.id) {
        const updatedItem: CopyTemplate = { ...safeDraft, id: String(data.id), updated_at: String(data.updated_at || now) };
        const nextList = list.some(item => item.id === id)
          ? list.map(item => item.id === id ? updatedItem : item)
          : [updatedItem, ...list];
        saveLocalCopyLibrary(nextList);
        return String(data.id);
      }
    } else {
      const { data, error } = await supabase
        .from('creative_copy_library')
        .insert(payload)
        .select('id, updated_at')
        .maybeSingle();
      if (!error && data?.id) {
        const newId = String(data.id);
        const created: CopyTemplate = { ...safeDraft, id: newId, updated_at: String(data.updated_at || now) };
        const filtered = id ? list.filter(item => item.id !== id) : list;
        saveLocalCopyLibrary([created, ...filtered]);
        return newId;
      }
    }
  } catch (err) {
    console.warn('[saveCopyTemplate table error, trying fallback]', err);
  }

  // 2. Fallback bridge via creative_ideas if creative_copy_library table does not exist
  const packed = packCopyTemplateForIdeaRow(safeDraft);
  if (id && isUuid) {
    try {
      const { data, error } = await supabase
        .from('creative_ideas')
        .update(packed)
        .eq('id', id)
        .select('id,updated_at')
        .maybeSingle();
      if (!error && data?.id) {
        const updatedItem: CopyTemplate = { ...safeDraft, id: String(data.id), updated_at: String(data.updated_at || now) };
        const nextList = list.some(item => item.id === id)
          ? list.map(item => item.id === id ? updatedItem : item)
          : [updatedItem, ...list];
        saveLocalCopyLibrary(nextList);
        return String(data.id);
      }
    } catch { /* fallback below */ }
  }

  try {
    const { data, error } = await supabase
      .from('creative_ideas')
      .insert(packed)
      .select('id,updated_at')
      .maybeSingle();
    if (!error && data?.id) {
      const newId = String(data.id);
      const created: CopyTemplate = { ...safeDraft, id: newId, updated_at: String(data.updated_at || now) };
      const filtered = id ? list.filter(item => item.id !== id) : list;
      saveLocalCopyLibrary([created, ...filtered]);
      return newId;
    }
  } catch { /* fallback to local below */ }

  if (id) {
    const updated = list.map(item => item.id === id ? { ...item, ...safeDraft, updated_at: now } : item);
    saveLocalCopyLibrary(updated);
    return id;
  }
  const fallbackId = `copy-tpl-${Date.now()}`;
  const created: CopyTemplate = { ...safeDraft, id: fallbackId, is_archived: false, updated_at: now };
  saveLocalCopyLibrary([created, ...list]);
  return fallbackId;
}

export async function deleteCopyTemplate(id: string): Promise<void> {
  const list = getLocalCopyLibrary();
  const target = list.find(item => item.id === id);
  const updated = list.map(item => item.id === id ? { ...item, is_archived: true } : item);
  saveLocalCopyLibrary(updated);

  const isUuid = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id);
  if (isUuid) {
    try {
      const { error } = await supabase.from('creative_copy_library').delete().eq('id', id);
      if (error) {
        await supabase.from('creative_copy_library').update({ is_archived: true }).eq('id', id);
      }
    } catch { /* ignore */ }
    try {
      const { error } = await supabase.from('creative_ideas').delete().eq('id', id);
      if (error && target) {
        await supabase.from('creative_ideas').update(packCopyTemplateForIdeaRow({ ...target, is_archived: true })).eq('id', id);
      }
    } catch { /* ignore */ }
  }
}

const IDEA_SCRIPT_LINKS_KEY = 'mix_pro_idea_script_links_v1';
const HIDDEN_IDEAS_KEY = 'mix_pro_hidden_ideas_v1';
const DEMO_PURGED_KEY = 'mix_pro_demo_purged_v1';

async function syncIdeaScriptLinksFromDb(signal?: AbortSignal): Promise<Record<string, string>> {
  let localMap: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(IDEA_SCRIPT_LINKS_KEY);
    if (raw) localMap = JSON.parse(raw) as Record<string, string>;
  } catch { /* ignore */ }

  try {
    let query = supabase
      .from('creative_ideas')
      .select('id,brief,updated_at')
      .eq('title', COPY_LINKS_TITLE)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query;
    if (!error && data && data[0]?.brief) {
      const remoteMap = JSON.parse(String(data[0].brief)) as Record<string, string>;
      if (remoteMap && typeof remoteMap === 'object') {
        const combined = { ...remoteMap, ...localMap };
        localStorage.setItem(IDEA_SCRIPT_LINKS_KEY, JSON.stringify(combined));
        return combined;
      }
    }
  } catch { /* ignore */ }
  return localMap;
}

async function persistIdeaScriptLinksToDb(map: Record<string, string>) {
  try {
    const serialized = JSON.stringify(map).slice(0, 2000);
    const { data: existing } = await supabase
      .from('creative_ideas')
      .select('id')
      .eq('title', COPY_LINKS_TITLE)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (existing && existing[0]?.id) {
      await supabase
        .from('creative_ideas')
        .update({ brief: serialized, queue_state: 'parked', prioritized: false })
        .eq('id', existing[0].id);
    } else {
      await supabase
        .from('creative_ideas')
        .insert({
          title: COPY_LINKS_TITLE,
          brief: serialized,
          platform: 'internal',
          queue_state: 'parked',
          prioritized: false,
        });
    }
  } catch { /* ignore */ }
}

export function getIdeaAttachedScript(ideaId?: string | null): string {
  if (!ideaId) return '';
  try {
    const raw = localStorage.getItem(IDEA_SCRIPT_LINKS_KEY);
    if (!raw) return '';
    const map = JSON.parse(raw) as Record<string, string>;
    const tplId = map[ideaId] ?? '';
    return LEGACY_DUMMY_COPY_IDS.has(tplId) ? '' : tplId;
  } catch {
    return '';
  }
}

export function setIdeaAttachedScript(ideaId: string, templateId: string | null) {
  if (!ideaId) return;
  try {
    const raw = localStorage.getItem(IDEA_SCRIPT_LINKS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (templateId && !LEGACY_DUMMY_COPY_IDS.has(templateId)) map[ideaId] = templateId;
    else delete map[ideaId];
    localStorage.setItem(IDEA_SCRIPT_LINKS_KEY, JSON.stringify(map));
    void persistIdeaScriptLinksToDb(map);
  } catch { /* ignore */ }
}

function getHiddenIdeaIds(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_IDEAS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export async function deleteIdea(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('creative_ideas').delete().eq('id', id);
    if (error) {
      await supabase
        .from('creative_ideas')
        .update({
          title: `${DELETED_IDEA_PREFIX}${id}`.slice(0, 160),
          queue_state: 'parked',
          prioritized: false,
          brief: '',
        })
        .eq('id', id);
    }
  } catch {
    try {
      await supabase
        .from('creative_ideas')
        .update({
          title: `${DELETED_IDEA_PREFIX}${id}`.slice(0, 160),
          queue_state: 'parked',
          prioritized: false,
          brief: '',
        })
        .eq('id', id);
    } catch { /* fallback to local hide */ }
  }
  try {
    const hidden = getHiddenIdeaIds();
    hidden.add(id);
    localStorage.setItem(HIDDEN_IDEAS_KEY, JSON.stringify([...hidden]));
  } catch { /* ignore */ }
}

export function isDemoPurged(): boolean {
  try {
    return localStorage.getItem(DEMO_PURGED_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function isDemoText(text?: string | null): boolean {
  if (!text) return false;
  if (isInternalIdeaRecordTitle(text)) return true;
  return /^\s*\[DEMO\]/i.test(text) || /^DEMO[\s_]/i.test(text) || /^demo\./i.test(text.trim());
}

export async function purgeCreativeDemoData(): Promise<{ removedTasks: number; removedIdeas: number; removedCampaigns: number }> {
  let removedTasks = 0;
  let removedIdeas = 0;
  let removedCampaigns = 0;

  try {
    const { data: rpcResult } = await supabase.rpc('purge_all_creative_demo_data');
    if (rpcResult && typeof rpcResult === 'object') {
      const r = rpcResult as Record<string, number>;
      removedTasks += Number(r.removed_tasks ?? 0);
      removedIdeas += Number(r.removed_ideas ?? 0);
      removedCampaigns += Number(r.removed_campaigns ?? 0);
    }
  } catch { /* fallback to individual queries below */ }

  try {
    const { data: demoTasks } = await supabase
      .from('creative_tasks')
      .select('id,updated_at,title')
      .ilike('title', '[DEMO]%');
    if (demoTasks?.length) {
      for (const t of demoTasks) {
        try {
          await supabase.rpc('remove_creative_task', { p_task: t.id, p_version: t.updated_at });
          removedTasks++;
        } catch {
          try {
            await supabase.from('creative_tasks').delete().eq('id', t.id);
            removedTasks++;
          } catch {
            await supabase.from('creative_tasks').update({ status: 'cancelled' }).eq('id', t.id);
            removedTasks++;
          }
        }
      }
    }
  } catch { /* ignore */ }

  try {
    const { data: demoIdeas } = await supabase
      .from('creative_ideas')
      .select('id')
      .ilike('title', '[DEMO]%');
    if (demoIdeas?.length) {
      removedIdeas += demoIdeas.length;
      const { error } = await supabase.from('creative_ideas').delete().ilike('title', '[DEMO]%');
      if (error) {
        for (const idea of demoIdeas) {
          await supabase
            .from('creative_ideas')
            .update({ title: `${DELETED_IDEA_PREFIX}${idea.id}`.slice(0, 160), queue_state: 'parked', prioritized: false, brief: '' })
            .eq('id', idea.id);
        }
      }
    }
  } catch { /* ignore */ }

  try {
    await supabase.from('creative_channel_activations').delete().ilike('name', '[DEMO]%');
  } catch { /* ignore */ }

  try {
    const { data: demoCampaigns } = await supabase
      .from('creative_campaigns')
      .select('id')
      .ilike('name', '[DEMO]%');
    if (demoCampaigns?.length) {
      removedCampaigns += demoCampaigns.length;
      await supabase.from('creative_campaigns').delete().ilike('name', '[DEMO]%');
      await supabase.from('creative_campaigns').update({ status: 'archived' }).ilike('name', '[DEMO]%');
    }
  } catch { /* ignore */ }

  try {
    await supabase.from('creative_accounts').update({ is_active: false }).ilike('handle', 'demo.%');
    await supabase.from('business_units').update({ is_active: false }).eq('code', 'DEMO_CREATIVE');
  } catch { /* ignore */ }

  try {
    localStorage.setItem(DEMO_PURGED_KEY, 'true');
  } catch { /* ignore */ }

  return { removedTasks, removedIdeas, removedCampaigns };
}

export async function campaigns(page: number, signal: AbortSignal, unit = 'all') {
  const start = page * PAGE_SIZE;
  let query = supabase.from('creative_campaigns').select(campaignColumns);
  if (unit !== 'all') query = unit === 'unassigned' ? query.is('business_unit_id', null) : query.eq('business_unit_id', unit);
  const { data, error } = await query
    .order('name').order('id').range(start, start + PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  const rows = (data ?? []) as Campaign[];
  return rows.filter(row => !isDemoText(row.name));
}

export async function team(signal: AbortSignal) {
  const { data, error } = await supabase.rpc('creative_team_directory').abortSignal(signal);
  if (!error) return (data ?? []) as TeamMember[];
  if (error.code !== 'PGRST202') throw error;

  // Older databases have role grants only, before account overrides exist.
  const previous = await supabase.from('profiles')
    .select('id,full_name,is_active,job_title,user_roles(role:roles(role_permissions(permission:permissions(code))))')
    .order('full_name').abortSignal(signal);
  if (previous.error) throw previous.error;
  type Assignment = { role: { role_permissions: { permission: { code: string } | null }[] } | null };
  return ((previous.data ?? []) as unknown as (TeamMember & { user_roles: Assignment[] })[]).map(({ user_roles, ...member }) => {
    const codes = new Set(user_roles.flatMap(({ role }) => role?.role_permissions.map(item => item.permission?.code) ?? []));
    return { ...member, can_decide: member.is_active && (codes.has('launch.admin') || (codes.has('creative.view') && codes.has('creative.edit'))) };
  });
}

export type Filters = {
  platform: string; status: string; assignee: string; order: 'due_on' | 'publish_on';
  workstream?: string;
};

export async function pendingTaskDecisions(userId: string, page: number, signal: AbortSignal, unit = 'all', scope = 'all') {
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(userId)) return [];
  const start = page * PAGE_SIZE;
  let query = supabase.from('creative_tasks').select('id,title,status,due_on')
    .or(`and(status.eq.review,reviewer_id.eq.${userId}),and(status.eq.ready,approver_id.eq.${userId},approved_at.is.null)`);
  if (unit !== 'all') query = unit === 'unassigned' ? query.is('business_unit_id', null) : query.eq('business_unit_id', unit);
  if (scope !== 'all') query = scope === 'standalone' ? query.is('campaign_id', null) : query.eq('campaign_id', scope);
  const { data, error } = await query.order('due_on', { nullsFirst: false }).order('id')
    .range(start, start + PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  return ((data ?? []) as Pick<Task, 'id' | 'title' | 'status' | 'due_on'>[]).filter(row => !isDemoText(row.title));
}

export async function tasks(campaignId: string | null | 'all', filters: Filters, page: number, signal: AbortSignal,
  focus: Focus = 'all', today = '', unit = 'all') {
  const start = page * PAGE_SIZE;
  let query = supabase.from('creative_tasks').select(taskColumns + ',campaign:creative_campaigns(name),source_idea:creative_ideas(title,reference_urls)');
  if (unit !== 'all') query = unit === 'unassigned' ? query.is('business_unit_id', null) : query.eq('business_unit_id', unit);
  if (campaignId !== 'all') query = campaignId ? query.eq('campaign_id', campaignId) : query.is('campaign_id', null);
  if (filters.platform && Object.prototype.hasOwnProperty.call(platforms, filters.platform)) {
    query = query.or(`platform.eq.${filters.platform},additional_platforms.cs.{${filters.platform}}`);
  }
  if (filters.workstream) query = query.eq('workstream', filters.workstream);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.assignee === 'unassigned') query = query.is('assignee_id', null).eq('additional_assignee_ids', '{}');
  else if (/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(filters.assignee)) {
    query = query.or(`assignee_id.eq.${filters.assignee},additional_assignee_ids.cs.{${filters.assignee}}`);
  }
  if (focus === 'week' || focus === 'publish') {
    const { monday, nextMonday } = mondayWeek(today);
    const column = focus === 'week' ? 'due_on' : 'publish_on';
    query = query.gte(column, monday).lt(column, nextMonday).neq('status', 'cancelled');
  } else if (focus === 'today' || focus === 'overdue') {
    query = (focus === 'today' ? query.eq('due_on', today) : query.lt('due_on', today))
      .not('status', 'in', '(done,cancelled)');
  } else if (focus === 'review' || focus === 'blocked' || focus === 'ready') {
    query = query.eq('status', focus);
  } else if (focus === 'unplanned') {
    query = query.or('and(assignee_id.is.null,additional_assignee_ids.eq.{}),due_on.is.null').not('status', 'in', '(done,cancelled)');
  }
  const { data, error } = await query.order(filters.order, { nullsFirst: false }).order('id')
    .range(start, start + PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  const rows = ((data ?? []) as unknown as ListedTask[]).map(hydrateTask);
  return rows.filter(row => !isDemoText(row.title) && !isDemoText(row.campaign?.name));
}

export async function summary(campaignId: string | null, today: string, signal: AbortSignal, unit = 'all') {
  const { data, error } = await supabase.rpc('creative_command_summary', {
    p_campaign_id: campaignId === 'all' ? null : campaignId, p_all: campaignId === 'all', p_today: today,
    p_unit_id: unit === 'all' || unit === 'unassigned' ? null : unit, p_unassigned: unit === 'unassigned',
  })
    .abortSignal(signal).single();
  if (error) throw error;
  return data as {
    total: number; done: number; blocked: number; overdue: number;
    target: number; closed: number; on_time: number; review: number; unplanned: number; published_week: number;
  };
}

export function safeOutputUrl(value: string) {
  try {
    const url = new URL(value);
    if (/^https?:$/.test(url.protocol) && !url.username && !url.password) return url.href;
  } catch { /* Empty or malformed URL */ }
  return '';
}

export async function ideas(page: number, onlyPriority: boolean, queue: string, signal: AbortSignal, unit = 'all') {
  void syncIdeaScriptLinksFromDb(signal);
  const start = page * PAGE_SIZE;
  let query = supabase.from('creative_ideas')
    .select('*,task:creative_tasks(id,status)');
  if (unit !== 'all') query = unit === 'unassigned' ? query.is('business_unit_id', null) : query.eq('business_unit_id', unit);
  if (onlyPriority) query = query.eq('prioritized', true);
  if (queue) query = query.eq('queue_state', queue);
  if (queue === 'ready') query = query.is('task', null);
  const { data, error } = await query.order('prioritized', { ascending: false })
    .order('updated_at', { ascending: false }).order('id').range(start, start + PAGE_SIZE).abortSignal(signal);
  if (error) throw error;
  const hidden = getHiddenIdeaIds();
  return ((data ?? []) as unknown as (Omit<ListedIdea, 'task'> & { task: ListedIdea['task'] | NonNullable<ListedIdea['task']>[] })[])
    .filter(row => !hidden.has(row.id) && !isDemoText(row.title))
    .map(row => ({ ...row, task: Array.isArray(row.task) ? row.task[0] ?? null : row.task }));
}

async function save(table: string, values: Record<string, string | number | boolean | string[] | ChecklistItem[] | CreativeBrief | null | undefined>, previous?: Row) {
  let currentValues = { ...values };
  let ignoreVersionLock = false;
  for (let attempt = 0; attempt < 6; attempt++) {
    const target = supabase.from(table);
    const query = previous
      ? (ignoreVersionLock || !previous.updated_at
          ? target.update(currentValues).eq('id', previous.id)
          : target.update(currentValues).eq('id', previous.id).eq('updated_at', previous.updated_at))
      : target.insert(currentValues);
    const { data, error } = await query.select('id').maybeSingle();
    if (!error) {
      if (!data && previous && !ignoreVersionLock) {
        ignoreVersionLock = true;
        continue;
      }
      if (!data) throw new Error('Data sudah diubah pengguna lain. Segarkan dan buka ulang sebelum menyimpan.');
      return data.id as string;
    }
    const msg = typeof error.message === 'string' ? error.message : '';
    const missingColMatch =
      msg.match(/Could not find the '([^']+)' column/i) ||
      msg.match(/column (?:\w+\.)?"?([a-z0-9_]+)"? does not exist/i);
    if (missingColMatch && missingColMatch[1] && missingColMatch[1] in currentValues && missingColMatch[1] !== 'additional_platforms') {
      const nextValues = { ...currentValues };
      delete nextValues[missingColMatch[1]];
      currentValues = nextValues;
      continue;
    }
    throw error;
  }
  throw new Error('Gagal menyimpan data ke database.');
}

export const saveCampaign = (values: Draft<Campaign>, previous?: Campaign) => save('creative_campaigns', values, previous);
export async function saveTask(values: Draft<Task>, previous?: Task, sourceIdeaId?: string) {
  const hasExtendedMetadata =
    'copy_template_id' in values ||
    'output_type' in values ||
    'routine_mode' in values ||
    'routine_category' in values ||
    'routine_trigger' in values ||
    'routine_target' in values ||
    'routine_runs' in values ||
    'routine_last_note' in values;

  let payload: Record<string, string | number | boolean | string[] | ChecklistItem[] | CreativeBrief | null | undefined>;
  if (hasExtendedMetadata) {
    const {
      copy_template_id,
      output_type,
      routine_mode,
      routine_category,
      routine_trigger,
      routine_target,
      routine_runs,
      routine_last_note,
      creative_brief,
      ...dbColumns
    } = values;
    const mergedBrief: CreativeBrief = { ...(previous?.creative_brief ?? {}), ...(creative_brief ?? {}) };
    if (copy_template_id) mergedBrief._copy_template_id = copy_template_id;
    else delete mergedBrief._copy_template_id;
    if (output_type) mergedBrief._output_type = output_type;
    else delete mergedBrief._output_type;
    if (routine_mode && routine_mode !== 'once') {
      mergedBrief._routine_mode = routine_mode;
      if (routine_category) mergedBrief._routine_category = routine_category;
      if (routine_trigger) mergedBrief._routine_trigger = routine_trigger;
      else delete mergedBrief._routine_trigger;
      if (routine_target) mergedBrief._routine_target = routine_target;
      else delete mergedBrief._routine_target;
      if (routine_runs !== undefined && routine_runs > 0) mergedBrief._routine_runs = String(routine_runs);
      if (routine_last_note) mergedBrief._routine_last_note = routine_last_note;
    } else {
      delete mergedBrief._routine_mode;
      delete mergedBrief._routine_category;
      delete mergedBrief._routine_trigger;
      delete mergedBrief._routine_target;
    }
    payload = {
      ...dbColumns,
      creative_brief: mergedBrief,
      ...(!previous && sourceIdeaId ? { source_idea_id: sourceIdeaId } : {}),
    };
  } else {
    payload = { ...values, ...(!previous && sourceIdeaId ? { source_idea_id: sourceIdeaId } : {}) };
  }

  // Unconditionally ensure metadata stored inside creative_brief is never passed
  // as top-level columns to avoid PostgREST schema cache missing column errors.
  delete (payload as Record<string, unknown>).copy_template_id;
  delete (payload as Record<string, unknown>).output_type;
  delete (payload as Record<string, unknown>).routine_mode;
  delete (payload as Record<string, unknown>).routine_category;
  delete (payload as Record<string, unknown>).routine_trigger;
  delete (payload as Record<string, unknown>).routine_target;
  delete (payload as Record<string, unknown>).routine_runs;
  delete (payload as Record<string, unknown>).routine_last_note;

  try {
    return await save('creative_tasks', payload, previous);
  } catch (error) {
    if (sourceIdeaId && error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      throw new Error('Ide ini sudah dijadikan tugas. Segarkan daftar untuk melihat statusnya.');
    }
    throw error;
  }
}

export async function recordRoutineExecution(task: Task, note: string, resetForNextOrder = true) {
  const hydrated = hydrateTask(task);
  const nextRuns = (hydrated.routine_runs ?? 0) + 1;
  const timestamp = new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date());
  const entry = `[Eksekusi #${nextRuns} · ${timestamp}] ${note.trim() || 'Selesai dieksekusi'}`;
  const updatedCompletionNote = [entry, hydrated.completion_note?.trim() ?? ''].filter(Boolean).join('\n').slice(0, 2000);
  const mergedBrief: CreativeBrief = {
    ...(hydrated.creative_brief ?? {}),
    _routine_mode: hydrated.routine_mode && hydrated.routine_mode !== 'once' ? hydrated.routine_mode : 'event_triggered',
    _routine_runs: String(nextRuns),
    _routine_last_note: entry,
  };
  const resetChecklist = resetForNextOrder && hydrated.checklist?.length
    ? hydrated.checklist.map(item => ({ ...item, done: false }))
    : hydrated.checklist;
  const nextStatus: Task['status'] = resetForNextOrder
    ? (hydrated.assignee_id && hydrated.due_on && hydrated.deliverable && hydrated.acceptance_criteria ? 'doing' : 'todo')
    : hydrated.status;
  return save('creative_tasks', {
    creative_brief: mergedBrief,
    completion_note: updatedCompletionNote,
    ...(resetChecklist ? { checklist: resetChecklist } : {}),
    status: nextStatus,
    blocker: '',
  }, task);
}
export async function removeTask(task: Pick<Task, 'id' | 'updated_at'>) {
  const { error } = await supabase.rpc('remove_creative_task', {
    p_task: task.id, p_version: task.updated_at,
  });
  if (error?.code === 'PGRST202') throw new Error('Fitur hapus belum aktif di database.');
  if (error) throw error;
}
export async function saveIdea(values: Draft<Idea>, previous?: Idea) {
  const { additional_platforms, ...fields } = values;
  const payload = additional_platforms?.length || previous?.additional_platforms?.length
    ? { ...fields, additional_platforms: additional_platforms ?? [] }
    : fields;
  try {
    return await save('creative_ideas', payload, previous);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204'
      && 'message' in error && String(error.message).includes('additional_platforms')) {
      throw new Error('Penyimpanan beberapa platform belum aktif. Terapkan migrasi Bank Ide terlebih dahulu.');
    }
    throw error;
  }
}

export function setTaskChecklistItem(task: Task, index: number, done: boolean) {
  if (!task.checklist?.[index]) throw new Error('Langkah checklist tidak ditemukan.');
  const checklist = task.checklist.map((item, position) => position === index ? { ...item, done } : item);
  return save('creative_tasks', { checklist }, task);
}

export function approveTask(task: Task) {
  // The database validates the caller and records its own timestamp.
  return save('creative_tasks', { approved_at: new Date().toISOString() }, task);
}

export function advanceTask(task: Task, status: Exclude<Task['status'], 'blocked'>) {
  return save('creative_tasks', { status, blocker: '' }, task);
}

export function requestRevision(task: Task, note: string) {
  if (task.status !== 'review' || !note.trim()) throw new Error('Masukkan catatan revisi untuk tugas yang sedang direview.');
  return save('creative_tasks', { status: 'doing', review_note: note.trim(), blocker: '' }, task);
}

export async function getTask(id: string, signal: AbortSignal) {
  const { data, error } = await supabase.from('creative_tasks')
    .select(taskColumns + ',campaign:creative_campaigns(name),source_idea:creative_ideas(title,reference_urls)')
    .eq('id', id).abortSignal(signal).single();
  if (error) throw error;
  return hydrateTask(data as unknown as ListedTask);
}

export const BOARD_PAGE_SIZE = 6;

export type Workload = {
  subject_id: string | null;
  open_count: number;
  review_count: number;
  blocked_count: number;
  overdue_count: number;
  week_target: number;
  week_done: number;
};
export async function workload(group: 'team' | 'campaign', unit: string, scope: string, today: string, signal: AbortSignal) {
  const { data, error } = await supabase.rpc('creative_workload_summary', {
    p_group: group, p_unit: unit === 'all' || unit === 'unassigned' ? null : unit,
    p_unassigned: unit === 'unassigned', p_campaign: scope === 'all' || scope === 'standalone' ? null : scope,
    p_standalone: scope === 'standalone', p_today: today,
  }).abortSignal(signal);
  if (error) throw error;
  return (data ?? []) as Workload[];
}
export async function boardTasks(scope: string, unit: string, filters: Filters, focus: Focus, today: string, page: number, signal: AbortSignal) {
  const { data, error } = await supabase.rpc('creative_board', {
    p_unit: unit === 'all' || unit === 'unassigned' ? null : unit, p_unassigned: unit === 'unassigned',
    p_campaign: scope === 'all' || scope === 'standalone' ? null : scope, p_standalone: scope === 'standalone',
    p_filters: filters, p_focus: focus, p_today: today, p_page: page,
  }).abortSignal(signal);
  if (error) throw error;
  const lanes = ((data ?? []) as { stage: Task['status']; total: number; items: ListedTask[] }[]).map(lane => ({
    ...lane,
    items: (lane.items ?? []).map(hydrateTask),
  }));
  return lanes.map(lane => {
    const filtered = (lane.items ?? []).filter(item => !isDemoText(item.title) && !isDemoText(item.campaign?.name));
    const removedCount = (lane.items?.length ?? 0) - filtered.length;
    return { ...lane, items: filtered, total: Math.max(0, Number(lane.total ?? 0) - removedCount) };
  });
}
