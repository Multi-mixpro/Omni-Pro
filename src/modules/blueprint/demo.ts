import { Activity, Building2, CalendarDays, ChartNoAxesCombined, Clapperboard, FolderKanban, LayoutGrid, Lightbulb, Megaphone, Settings2, UsersRound, Wallet, Zap } from 'lucide-react';

export const modules = [
  { id: 'overview', name: 'Command Center', icon: LayoutGrid, views: ['Ringkasan', 'Tugas saya', 'Kotak tindakan'] },
  { id: 'business', name: 'Unit Bisnis', icon: Building2, views: ['Semua unit', 'Pengaturan unit'] },
  { id: 'projects', name: 'Proyek & Tugas', icon: FolderKanban, views: ['Proyek artikel', 'Tugas tim', 'Milestone', 'Persetujuan'] },
  { id: 'people', name: 'Tim & Kinerja', icon: UsersRound, views: ['Direktori tim', 'Beban kerja', 'Target & KPI'] },
  { id: 'calendar', name: 'Kalender', icon: CalendarDays, views: ['Agenda tim', 'Jadwal konten', 'Milestone proyek'] },
  { id: 'ideas', name: 'Bank Ide', icon: Lightbulb, views: ['Semua ide', 'Eksperimen', 'Sebelum & sesudah'] },
  { id: 'creative', name: 'Creative Studio', icon: Clapperboard, views: ['Brief kreatif', 'Copywriting', 'Produksi', 'Review & versi', 'Antrean tayang'] },
  { id: 'marketing', name: 'Kampanye & Iklan', icon: Megaphone, views: ['Kampanye', 'Ads Tracker', 'Akun & kanal', 'Evaluasi'] },
  { id: 'analytics', name: 'Analitik', icon: ChartNoAxesCombined, views: ['Kinerja bisnis', 'Proyek & tim', 'Marketing'] },
  { id: 'budget', name: 'Anggaran', icon: Wallet, views: ['Rencana', 'Permintaan', 'Komitmen', 'Realisasi'] },
  { id: 'knowledge', name: 'Aset & Pengetahuan', icon: Activity, views: ['Pustaka aset', 'SOP & template', 'Catatan keputusan'] },
  { id: 'automation', name: 'Otomasi & AI', icon: Zap, views: ['Aturan pengingat', 'Telegram', 'Asisten AI', 'Riwayat'] },
  { id: 'settings', name: 'Pengaturan', icon: Settings2, views: ['Organisasi', 'Akses & peran', 'Integrasi'] },
] as const;

export type ModuleId = typeof modules[number]['id'];
export type Item = { id: string; module: ModuleId; view: string; title: string; unit: string; owner: string;
  due: string; stage: number; note: string; platforms?: string[]; contributors?: string[]; origin?: string };

export const initialUnits = ['GG Supply', 'Gudskuy', 'Bakso Ujo'];
export const staff = ['Nadia', 'Raka', 'Dimas', 'Ayu'];
export const stages: Partial<Record<ModuleId, string[]>> = {
  projects: ['Prospek', 'Perencanaan', 'Pengerjaan', 'Review', 'Persetujuan', 'Launching', 'Selesai'],
  ideas: ['Ide masuk', 'Ditinjau', 'Dipilih', 'Eksperimen', 'Dievaluasi'],
  creative: ['Brief', 'Copy & produksi', 'Review', 'Persetujuan', 'Terjadwal', 'Tayang', 'Evaluasi'],
  marketing: ['Rencana', 'Siap jalan', 'Aktif', 'Evaluasi', 'Selesai'],
  budget: ['Draf', 'Diajukan', 'Disetujui', 'Komitmen', 'Realisasi'],
  knowledge: ['Draf', 'Ditinjau', 'Disetujui'],
  automation: ['Draf', 'Siap diuji', 'Aktif'],
};
export function workflow(item: Item) {
  return item.module === 'projects' && item.view !== 'Proyek artikel'
    ? ['Masuk', 'Siap', 'Dikerjakan', 'Review', 'Persetujuan', 'Selesai']
    : stages[item.module] ?? ['Draf', 'Aktif', 'Selesai'];
}

function sample(module: ModuleId, view: string, title: string, unit: number, stage: number, owner: number, due = '2026-11-06', note = ''): Item {
  return { id: `${module}-${title}`, module, view, title, unit: initialUnits[unit], stage, owner: staff[owner], due, note };
}

export const samples = [
  sample('projects', 'Proyek artikel', 'Koleksi Utility Wear 01', 0, 2, 1, '2026-11-09', 'Siapkan sampel ukuran dan verifikasi costing sebelum keputusan produksi.'),
  sample('projects', 'Proyek artikel', 'Artikel Gudskuy Weekend', 1, 0, 2, '2026-11-11', 'Prospek artikel fashion, mulai dari riset bahan dan target pasar.'),
  sample('projects', 'Tugas tim', 'Validasi menu paket makan siang', 2, 3, 3, '2026-11-06'),
  sample('projects', 'Milestone', 'Sampel ukuran disetujui', 0, 1, 1, '2026-11-10'),
  sample('creative', 'Brief kreatif', 'Identitas visual GG Supply', 0, 0, 0, '2026-11-09', 'Arah visual modern untuk pelanggan garment custom. Hasil: logo, palet, dan panduan penggunaan.'),
  { ...sample('creative', 'Produksi', 'Video proses produksi 30 detik', 0, 2, 0, '2026-11-06'), platforms: ['Instagram', 'TikTok'], contributors: ['Dimas'] },
  sample('creative', 'Copywriting', 'Caption Gudskuy Weekend', 1, 1, 2, '2026-11-07'),
  sample('creative', 'Review & versi', 'Review foto menu Bakso Ujo', 2, 3, 3, '2026-11-06'),
  sample('creative', 'Antrean tayang', 'Reels menu baru Bakso Ujo', 2, 4, 3, '2026-11-08'),
  sample('ideas', 'Semua ide', 'Cerita di balik jahitan', 0, 2, 0, '2026-11-09', 'Gunakan footage produksi untuk menjelaskan perbedaan kualitas jahitan.'),
  sample('ideas', 'Eksperimen', 'Uji hook video 3 detik', 1, 3, 2, '2026-11-10'),
  sample('ideas', 'Sebelum & sesudah', 'Foto listing menu: lama vs baru', 2, 4, 3, '2026-11-10'),
  sample('marketing', 'Kampanye', 'Gudskuy Weekend Drop', 1, 2, 2, '2026-11-13'),
  sample('marketing', 'Ads Tracker', 'Iklan pencarian Bakso Ujo', 2, 2, 3, '2026-11-12'),
  sample('marketing', 'Akun & kanal', 'Instagram GG Supply', 0, 2, 0),
  sample('marketing', 'Evaluasi', 'Evaluasi promo makan siang', 2, 3, 3, '2026-11-13'),
  sample('budget', 'Rencana', 'Anggaran konten November · Rp12 juta', 0, 0, 0),
  sample('budget', 'Permintaan', 'Biaya produksi foto · Rp2,4 juta', 1, 1, 2),
  sample('budget', 'Komitmen', 'Vendor kemasan · Rp3 juta', 2, 3, 3),
  sample('budget', 'Realisasi', 'Produksi sampel · Rp1,8 juta', 0, 4, 1),
  sample('knowledge', 'Pustaka aset', 'Paket logo GG Supply', 0, 2, 0),
  sample('knowledge', 'SOP & template', 'Checklist pembukaan outlet', 2, 1, 3),
  sample('knowledge', 'Catatan keputusan', 'Standar foto produk Gudskuy', 1, 2, 2),
  sample('automation', 'Aturan pengingat', 'Pengingat H-1 untuk PIC', 0, 1, 0),
  sample('automation', 'Telegram', 'Simulasi notifikasi review', 0, 0, 0),
  sample('automation', 'Asisten AI', 'Draf breakdown tugas dari brief', 1, 0, 2),
  sample('automation', 'Riwayat', 'Pengingat jadwal konten', 2, 2, 3),
  sample('settings', 'Organisasi', 'GG Business Workspace', 0, 1, 0),
  sample('settings', 'Akses & peran', 'Reviewer dan pemberi persetujuan', 1, 1, 2),
  sample('settings', 'Integrasi', 'Media dan notifikasi', 2, 0, 3),
];
