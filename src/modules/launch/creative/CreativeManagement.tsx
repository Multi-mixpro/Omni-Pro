import { BarChart3, CalendarCheck, CircleDollarSign, Flag, Layers3, Timer, Wallet } from 'lucide-react';
import { channelPlatforms, type ChannelSummary } from './channelRepository';
import { button, errorText, primary } from './CreativeForms';
import type { summary } from './repository';
import type { Focus } from './schedule';

const number = new Intl.NumberFormat('id-ID');
const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export function CreativeManagement({ mode, counts, channels, pending, error, standalone, onFocus, onAds }: {
  mode: 'analytics' | 'budget'; counts?: Awaited<ReturnType<typeof summary>>; channels?: ChannelSummary[];
  pending: boolean; error: unknown; standalone: boolean; onFocus: (focus: Focus) => void; onAds: () => void;
}) {
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

  return <section className="space-y-4" aria-label={mode === 'analytics' ? 'Analitik Creative' : 'Anggaran kanal'}>
    {Boolean(error) && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{errorText(error)}</p>}
    {pending && <p role="status" className="rounded-xl bg-white p-4 text-sm text-slate-600">Memuat data dari lingkup terpilih…</p>}
    {metrics.length > 0 && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric => {
      const Icon = metric.icon;
      const content = <><span className="creative-color-icon" data-color={metric.color}><Icon size={17} /></span>
        <span className="text-sm font-medium text-slate-600">{metric.label}</span><strong className="break-words text-xl tabular-nums">{metric.value}</strong></>;
      return 'action' in metric && metric.action
        ? <button type="button" className="creative-metric-card text-left" key={metric.label} onClick={metric.action}>{content}</button>
        : <div className="creative-metric-card" key={metric.label}>{content}</div>;
    })}</div>}
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="text-lg font-bold">{mode === 'budget' ? 'Anggaran per platform' : 'Evaluasi per platform'}</h2>
          <p className="text-sm text-slate-600">{mode === 'budget' ? 'Rencana dan realisasi dari aktivitas kanal. Angka kampanye tidak dijumlahkan ulang.' : 'Evaluasi yang tercatat pada aktivitas kanal di lingkup terpilih.'}</p></div>
        {!standalone && <button type="button" className={mode === 'budget' ? primary : button} onClick={onAds}>Buka Iklan &amp; Evaluasi</button>}
      </div>
      {standalone && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Pilih kampanye untuk melihat data kanal.</p>}
      {channels && !channels.length && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Belum ada aktivitas kanal pada lingkup ini.</p>}
      {Boolean(channels?.length) && <ul className="divide-y divide-slate-100">{[...(channels ?? [])].sort((a, b) => channelPlatforms[a.platform].localeCompare(channelPlatforms[b.platform])).map(row => <li key={row.platform} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
        <strong>{channelPlatforms[row.platform]}</strong>
        {mode === 'budget' ? <span>Rencana {money.format(Number(row.budget))} · Realisasi {money.format(Number(row.spent))}</span>
          : <span>{number.format(row.evaluated)} selesai · {number.format(row.overdue)} terlambat</span>}
      </li>)}</ul>}
    </div>
  </section>;
}
