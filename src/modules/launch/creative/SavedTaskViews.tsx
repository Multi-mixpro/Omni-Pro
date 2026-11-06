import { useState } from 'react';
import { button, field } from './CreativeForms';
import { focusLabels, type Focus } from './schedule';
import type { Filters } from './repository';

type View = { filters: Filters; focus: Focus; mode: 'list' | 'board' };
type NamedView = View & { name: string };

function readViews(key: string): NamedView[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is NamedView => (
      item && typeof item.name === 'string' && typeof item.filters?.platform === 'string'
      && typeof item.filters?.assignee === 'string' && typeof item.filters?.status === 'string'
      && ['due_on', 'publish_on'].includes(item.filters?.order)
      && Object.prototype.hasOwnProperty.call(focusLabels, item.focus)
      && ['list', 'board'].includes(item.mode)
    )) : [];
  } catch {
    return [];
  }
}

export function SavedTaskViews({ userId, view, onApply }: { userId: string; view: View; onApply: (view: View) => void }) {
  const key = `creative-task-views:${userId}`;
  const [views, setViews] = useState(() => readViews(key));
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');
  const persist = (next: NamedView[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setViews(next);
      return true;
    } catch {
      setNotice('Browser tidak dapat menyimpan tampilan.');
      return false;
    }
  };
  return <details className="rounded-lg border border-slate-200 p-3 text-sm">
    <summary className="cursor-pointer font-semibold">Tampilan tersimpan</summary>
    <p className="my-2 text-slate-600">Simpan filter, fokus, dan mode daftar atau kanban di browser ini. Unit dan kampanye mengikuti pilihan saat ini.</p>
    <form className="flex flex-wrap items-end gap-2" onSubmit={event => {
      event.preventDefault();
      const label = name.trim();
      if (!label) return;
      if (views.some(item => item.name === label)) { setNotice('Nama sudah dipakai. Pilih nama lain.'); return; }
      if (views.length >= 12) { setNotice('Maksimal 12 tampilan tersimpan. Hapus salah satu untuk menambah tampilan.'); return; }
      if (persist([...views, { ...view, name: label }])) { setSelected(label); setName(''); setNotice('Tampilan tersimpan.'); }
    }}>
      <label className="grow">Nama tampilan<input className={field} value={name} onChange={event => setName(event.target.value)} required maxLength={60} /></label>
      <button className={button} disabled={!name.trim()}>Simpan tampilan</button>
    </form>
    {views.length > 0 && <div className="mt-2 flex flex-wrap items-end gap-2">
      <label className="grow">Pilih tampilan<select className={field} value={selected} onChange={event => setSelected(event.target.value)}>
        <option value="">Pilih…</option>{views.map(item => <option key={item.name}>{item.name}</option>)}
      </select></label>
      <button type="button" className={button} disabled={!selected} onClick={() => {
        const saved = views.find(item => item.name === selected);
        if (saved) { onApply(saved); setNotice('Tampilan diterapkan.'); }
      }}>Terapkan</button>
      <button type="button" className={button} disabled={!selected} onClick={() => {
        if (persist(views.filter(item => item.name !== selected))) { setSelected(''); setNotice('Tampilan dihapus.'); }
      }}>Hapus tampilan</button>
    </div>}
    {notice && <p role="status" className="mt-2">{notice}</p>}
  </details>;
}
