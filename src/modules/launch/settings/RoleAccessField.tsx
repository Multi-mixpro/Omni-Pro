import { ShieldCheck } from 'lucide-react';
import { workspaceAccess } from '@/core/auth/workspaceAccess';
import type { RoleOption } from '../data/teamRepository';

export function RoleAccessField({ roles = [], value, onChange, className, disabled, unavailable }: {
  roles?: RoleOption[]; value: string; onChange: (code: string) => void; className: string;
  disabled?: boolean; unavailable?: boolean;
}) {
  const items = roles.map(role => ({ role, access: workspaceAccess(role.permissions.map(permission => permission.code)) }));
  const groups = [
    { label: 'Creative', matches: (access: typeof items[number]['access']) => access.creative && !access.launch },
    { label: 'Launching Artikel', matches: (access: typeof items[number]['access']) => access.launch && !access.creative },
    { label: 'Dua ruang kerja', matches: (access: typeof items[number]['access']) => access.both && !access.admin },
    { label: 'Administrasi', matches: (access: typeof items[number]['access']) => access.admin },
    { label: 'Role lain', matches: (access: typeof items[number]['access']) => !access.entry },
  ];
  const selected = items.find(item => item.role.code === value);
  return <div>
    <label className="block"><span className="mb-1 block font-bold text-slate-700">Role *</span>
      <select className={className} value={value} disabled={disabled || unavailable} required onChange={event => onChange(event.target.value)}>
        <option value="">Pilih role</option>
        {groups.map(group => {
          const options = items.filter(item => group.matches(item.access));
          return options.length > 0 && <optgroup key={group.label} label={group.label}>
            {options.map(({ role }) => <option key={role.code} value={role.code}>{role.name}</option>)}
          </optgroup>;
        })}
      </select>
    </label>
    {unavailable ? <p role="alert" className="mt-2 text-xs text-rose-700">Daftar role belum dapat dimuat. Segarkan halaman dan coba lagi.</p>
      : selected ? <div className="mt-2 space-y-2 rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs text-slate-700">
        <p>{selected.role.description}</p>
        <p className="flex items-center gap-1.5 font-bold text-sky-900"><ShieldCheck size={14} /> Izin role ini</p>
        <ul className="flex flex-wrap gap-1.5">
          {selected.role.permissions.map(permission => <li key={permission.code} className="rounded-full bg-white px-2 py-1">{permission.name}</li>)}
        </ul>
        {selected.access.creativeEdit && !selected.access.creativeRemove && <p className="font-semibold text-sky-900">Dapat mengedit Creative; tidak dapat menghapus tugas.</p>}
      </div> : <p className="mt-2 text-xs text-slate-600">Pilih role untuk melihat izin sebelum menyimpan.</p>}
  </div>;
}
