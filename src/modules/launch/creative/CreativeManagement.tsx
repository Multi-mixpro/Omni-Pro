import { useState } from 'react';
import { BarChart3, CalendarCheck, CircleDollarSign, Flag, Layers3, Timer, Wallet } from 'lucide-react';
import { channelPlatforms, type ChannelSummary } from './channelRepository';
import { button, errorText, primary } from './CreativeForms';
import type { summary } from './repository';
import type { Focus } from './schedule';

const number = new Intl.NumberFormat('id-ID');
const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export function CreativeManagement({ mode: initialMode, counts, channels, pending, error, standalone, onFocus, onAds }: {
  mode: 'analytics' | 'budget'; counts?: Awaited<ReturnType<typeof summary>>; channels?: ChannelSummary[];
  pending: boolean; error: unknown; standalone: boolean; onFocus: (focus: Focus) => void; onAds: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'budget'>(initialMode);
  const mode = activeTab;

  const budget = (channels ?? []).reduce((total, row) => total + Number(row.budget), 0);
  const spent = (channels ?? []).reduce((total, row) => total + Number(row.spent), 0);
  const metrics = mode === 'analytics' && counts ? [
    { label: 'Tugas selesai', value: `${number.format(counts.done)} / ${number.format(counts.total)}`, icon: CalendarCheck, color: 'green' },
    { label: 'Target minggu ini', value: `${number.format(counts.closed)} / ${number.format(counts.target)}`, icon: Flag, color: 'blue', action: () => onFocus('week') },
    { label: 'Terlambat', value: number.format(counts.overdue), icon: Timer, color: 'orange', action: () => onFocus('overdue') },
    { label: 'Tayang aktual minggu ini', value: number.format(counts.published_week), icon: Layers3, color: 'pink' },
  ] : mode === 'budget' && channels ? [
    { label: 'Anggaran kanal', value: money.format(budget), icon: Wallet, color: 'blue' },
    { label: 'Realisasi kanal', value: money.format(spent), icon: CircleDollarSign, color: 'green' },
    { label: budget >= spent ? 'Sisa anggaran' : 'Melebihi anggaran', value: money.format(Math.abs(budget - spent)), icon: BarChart3, color: budget >= spent ? 'mint' : 'orange' },
  ] : [];

  return (
    <section className="space-y-4" aria-label={mode === 'analytics' ? 'Analitik Creative' : 'Anggaran kanal'}>
      <div className="sa-surface flex flex-wrap items-center justify-between gap-3 p-3.5 sm:px-5">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Mode Analitik dan Anggaran">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              mode === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 dark:bg-white/[0.05] dark:text-slate-300'
            }`}
          >
            <BarChart3 size={13} />
            <span>Analitik Produksi</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'budget'}
            onClick={() => setActiveTab('budget')}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              mode === 'budget'
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 dark:bg-white/[0.05] dark:text-slate-300'
            }`}
          >
            <Wallet size={13} />
            <span>Anggaran Kanal</span>
          </button>
        </div>
        {!standalone && (
          <button type="button" className={mode === 'budget' ? primary : button} onClick={onAds}>
            Buka Iklan &amp; Evaluasi
          </button>
        )}
      </div>

      {Boolean(error) && (
        <p role="alert" className="rounded-xl bg-rose-50/90 p-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-300">
          {errorText(error)}
        </p>
      )}
      {pending && (
        <p role="status" className="sa-surface p-4 text-sm text-slate-600 dark:text-slate-400">
          Memuat data dari lingkup terpilih…
        </p>
      )}

      {metrics.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(metric => {
            const Icon = metric.icon;
            const content = (
              <>
                <span className="creative-color-icon" data-color={metric.color}><Icon size={17} /></span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{metric.label}</span>
                <strong className="break-words text-xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">{metric.value}</strong>
              </>
            );
            return 'action' in metric && metric.action
              ? <button type="button" className="creative-metric-card text-left" key={metric.label} onClick={metric.action}>{content}</button>
              : <div className="creative-metric-card" key={metric.label}>{content}</div>;
          })}
        </div>
      )}

      <div className="sa-surface p-4 sm:p-5">
        <div className="mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {mode === 'budget' ? 'Anggaran per platform' : 'Evaluasi per platform'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'budget'
              ? 'Rencana dan realisasi dari aktivitas kanal. Angka kampanye tidak dijumlahkan ulang.'
              : 'Evaluasi yang tercatat pada aktivitas kanal di lingkup terpilih.'}
          </p>
        </div>

        {standalone && (
          <p className="rounded-xl bg-slate-50/80 p-3 text-sm text-slate-600 dark:bg-white/[0.04] dark:text-slate-400">
            Pilih kampanye untuk melihat data kanal.
          </p>
        )}
        {channels && !channels.length && (
          <p className="rounded-xl bg-slate-50/80 p-3 text-sm text-slate-600 dark:bg-white/[0.04] dark:text-slate-400">
            Belum ada aktivitas kanal pada lingkup ini.
          </p>
        )}
        {Boolean(channels?.length) && (
          <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {[...(channels ?? [])].sort((a, b) => channelPlatforms[a.platform].localeCompare(channelPlatforms[b.platform])).map(row => (
              <li key={row.platform} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <strong className="text-slate-900 dark:text-slate-100">{channelPlatforms[row.platform]}</strong>
                {mode === 'budget'
                  ? <span className="text-slate-600 dark:text-slate-300">Rencana {money.format(Number(row.budget))} · Realisasi {money.format(Number(row.spent))}</span>
                  : <span className="text-slate-600 dark:text-slate-300">{number.format(row.evaluated)} selesai · {number.format(row.overdue)} terlambat</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
