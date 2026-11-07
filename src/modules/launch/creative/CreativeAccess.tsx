import { useQuery } from '@tanstack/react-query';
import { Check, Minus, ShieldCheck } from 'lucide-react';
import { workspaceAccess } from '@/core/auth/workspaceAccess';
import { listRoles } from '../data/teamRepository';
import { SettingsPage } from '../settings/SettingsPage';

const capabilities = [
  { key: 'creative', label: 'Lihat Creative' },
  { key: 'creativeEdit', label: 'Kelola pekerjaan' },
  { key: 'creativeRemove', label: 'Hapus tugas' },
  { key: 'admin', label: 'Kelola akun dan role' },
] as const;

export function CreativeAccess({ permissions, userName }: { permissions: string[]; userName: string }) {
  const access = workspaceAccess(permissions);
  const roles = useQuery({ queryKey: ['launch-roles'], queryFn: listRoles, enabled: access.admin });
  const creativeRoles = roles.data?.map(role => ({
    ...role, access: workspaceAccess(role.permissions.map(permission => permission.code)),
  })).filter(role => role.access.creative);

  return <div className="space-y-4">
    <section className="creative-access-card" aria-labelledby="creative-my-access">
      <div className="mb-4 flex items-center gap-3">
        <span className="creative-color-icon" data-color="mint"><ShieldCheck size={17} aria-hidden="true" /></span>
        <div><h2 id="creative-my-access" className="font-bold">Akses akun saya</h2><p className="text-sm text-slate-600">{userName}</p></div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {capabilities.map(({ key, label }) => <li key={key} className="creative-access-chip" data-allowed={access[key]}>
          {access[key] ? <Check size={16} aria-hidden="true" /> : <Minus size={16} aria-hidden="true" />}
          <span>{label} <span className="sr-only">{access[key] ? 'Diizinkan' : 'Tidak diizinkan'}</span></span>
        </li>)}
      </ul>
      <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
        <li>Filter unit bisnis mengatur tampilan. Izin membaca dan mengedit Creative saat ini berlaku di tingkat ruang kerja.</li>
        <li>Jika tugas punya reviewer atau pemberi persetujuan, keputusan dicatat oleh orang yang ditugaskan dan memiliki akses edit.</li>
      </ul>
    </section>

    {access.admin && <>
      <section className="creative-access-card" aria-labelledby="creative-role-matrix">
        <h2 id="creative-role-matrix" className="font-bold">Matriks role Creative</h2>
        <p className="mb-3 text-sm text-slate-600">Izin dari Supabase untuk setiap role. Jika akun memiliki beberapa role, izin dari semua role digabung.</p>
        {roles.isPending && <p role="status" className="text-sm text-slate-600">Memuat role…</p>}
        {roles.isError && <p role="alert" className="text-sm text-rose-700">Daftar role gagal dimuat.</p>}
        {creativeRoles && <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="creative-table w-full text-sm">
            <thead><tr><th scope="col">Role</th>{capabilities.map(item => <th scope="col" key={item.key}>{item.label}</th>)}</tr></thead>
            <tbody>{creativeRoles.map(role => <tr key={role.code}>
              <th scope="row">{role.name}</th>
              {capabilities.map(({ key }) => <td key={key}><span className="creative-access-chip" data-allowed={role.access[key]}>
                {role.access[key] ? 'Ya' : 'Tidak'}
              </span></td>)}
            </tr>)}</tbody>
          </table>
        </div>}
      </section>
      <SettingsPage variant="creative" />
    </>}
  </div>;
}
