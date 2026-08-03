/**
 * Gerbang masuk GG Indo Apparel.
 *
 * Satu domain menampung dua sistem yang benar-benar terpisah:
 *  - Product Launch OS  -> schema public, rute /launch/*
 *  - Presensi Multi-Unit -> schema presensi, rute /presensi/*
 *
 * Halaman ini hanya mengarahkan; tiap sistem punya login dan hak aksesnya
 * sendiri, sehingga akun salah satu sistem tidak otomatis masuk ke yang lain.
 */

import { Rocket, Fingerprint, ArrowRight } from 'lucide-react';

interface SystemCardProps {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tint: string;
  accent: string;
}

function SystemCard({ href, eyebrow, title, description, icon, tint, accent }: SystemCardProps) {
  return (
    <a
      href={href}
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
    >
      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}>
        {icon}
      </span>

      <div className="space-y-1">
        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${accent}`}>
          {eyebrow}
        </span>
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{title}</h2>
        <p className="text-xs leading-relaxed text-slate-500">{description}</p>
      </div>

      <span className={`mt-auto inline-flex items-center gap-1.5 text-xs font-bold ${accent}`}>
        Masuk ke sistem
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </a>
  );
}

export function SystemGateway() {
  return (
    <main className="min-h-screen bg-[#F6F7F9] px-5 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-extrabold text-white">
            GG
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            GG Indo Apparel
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Pilih sistem sesuai pekerjaan Anda. Setiap sistem memiliki pengguna,
            hak akses, dan data yang terpisah.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <SystemCard
            href="/launch/app/today"
            eyebrow="Kantor & Studio"
            title="Product Launch OS"
            description="Riset, sourcing, sampling, HPP, spesifikasi, QC, dan persetujuan artikel baru."
            icon={<Rocket className="h-6 w-6 text-violet-600" />}
            tint="bg-violet-100"
            accent="text-violet-700"
          />

          <SystemCard
            href="/presensi"
            eyebrow="Outlet & Lapangan"
            title="Presensi Multi-Unit"
            description="Absensi biometrik, geofence GPS, shift, izin, dan pemantauan kehadiran antar unit."
            icon={<Fingerprint className="h-6 w-6 text-emerald-600" />}
            tint="bg-emerald-100"
            accent="text-emerald-700"
          />
        </div>

        <p className="mt-8 text-center text-[11px] text-slate-400">
          Bakso Ujo · GG Supply · GUDSKUY
        </p>
      </div>
    </main>
  );
}
