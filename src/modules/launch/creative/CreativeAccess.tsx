import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Minus, ShieldCheck } from 'lucide-react';
import { workspaceAccess } from '@/core/auth/workspaceAccess';
import { supabase } from '@/integrations/supabase/client';
import { listRoles, listTeamMembers } from '../data/teamRepository';
import { SettingsPage } from '../settings/SettingsPage';
import { button, errorText, field } from './CreativeForms';

const capabilities = [
  { key: 'creative', label: 'Lihat Creative' },
  { key: 'creativeEdit', label: 'Kelola pekerjaan' },
  { key: 'creativeRemove', label: 'Hapus tugas' },
  { key: 'admin', label: 'Kelola akun dan role' },
] as const;

const switchSettings = [
  { code: 'creative.view', label: 'Lihat Creative', description: 'Buka Creative dan lihat data ruang kerja.' },
  { code: 'creative.edit', label: 'Kelola pekerjaan', description: 'Buat dan edit ide, tugas, kampanye, akun, serta catatan kanal.' },
  { code: 'creative.tasks.remove', label: 'Hapus tugas', description: 'Keluarkan tugas dari daftar aktif dan simpan riwayatnya.' },
] as const;
type SwitchCode = typeof switchSettings[number]['code'];
type UserAccess = {
  code: SwitchCode;
  role_allowed: boolean;
  override_allowed: boolean | null;
  allowed: boolean;
  protected_admin: boolean;
};

function AccessSwitches({ userId }: { userId: string }) {
  const client = useQueryClient();
  const [selected, setSelected] = useState('');
  const [notice, setNotice] = useState('');
  const team = useQuery({ queryKey: ['launch-team'], queryFn: listTeamMembers });
  const member = team.data?.find(person => person.id === selected);
  const key = ['creative', userId, 'access-switches', selected];
  const access = useQuery({
    queryKey: key, enabled: Boolean(member),
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.rpc('get_creative_user_access', { p_user: selected }).abortSignal(signal);
      if (error?.code === 'PGRST202') throw new Error('Saklar izin akun belum aktif di database.');
      if (error) throw error;
      return (data ?? []) as UserAccess[];
    },
  });
  const change = useMutation({
    mutationFn: async ({ code, allowed }: { code: SwitchCode; allowed: boolean | null }) => {
      const { error } = await supabase.rpc('set_creative_user_access', { p_user: selected, p_code: code, p_allowed: allowed });
      if (error) throw error;
    },
    onMutate: () => setNotice(''),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: ['creative', userId, 'team'] }),
      ]);
      setNotice('Izin akun tersimpan.');
    },
  });
  const byCode = new Map(access.data?.map(row => [row.code, row]));
  const locked = access.data?.some(row => row.protected_admin);

  return <section className="creative-access-card space-y-3" aria-labelledby="creative-access-switches">
    <div>
      <h2 id="creative-access-switches" className="font-bold">Saklar izin pengguna</h2>
      <p className="text-sm text-slate-600">Pilih akun aktif. Setiap perubahan saklar langsung tersimpan untuk akun itu.</p>
    </div>
    <label className="block max-w-md space-y-1 text-sm font-semibold">
      <span>Pengguna Creative</span>
      <select className={field} value={member?.id ?? ''} disabled={change.isPending} onChange={event => {
        setSelected(event.target.value); setNotice(''); change.reset();
      }}>
        <option value="">Pilih pengguna</option>
        {team.data?.map(person => <option key={person.id} value={person.id}>{person.full_name} · @{person.username}</option>)}
      </select>
    </label>
    {member && <p className="text-sm text-slate-600">Role saat ini · {member.role_name ?? 'Tanpa role'}</p>}
    {team.isPending || (member && access.isPending) ? <p role="status" className="text-sm text-slate-600">Memuat izin akun…</p> : null}
    {(team.error || access.error || change.error) && <p role="alert" className="text-sm text-red-700">{errorText(team.error ?? access.error ?? change.error)}</p>}
    {notice && <p role="status" className="text-sm text-teal-800">{notice}</p>}
    {locked && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Saklar akun administrator terkunci. Izin mengikuti role administrator.</p>}
    {member && access.isSuccess && <ul className="divide-y divide-slate-200" aria-busy={change.isPending}>
      {switchSettings.map(({ code, label, description }) => {
        const permission = byCode.get(code);
        if (!permission) return null;
        const prerequisite = code !== 'creative.view' && !byCode.get('creative.view')?.allowed ? 'Lihat Creative'
          : code === 'creative.tasks.remove' && !byCode.get('creative.edit')?.allowed ? 'Kelola pekerjaan' : null;
        return <li key={code} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{label}</p>
            <p className="text-xs text-slate-600">{description}</p>
            <p className="mt-1 text-xs text-slate-600">
              {prerequisite ? `Aktifkan ${prerequisite} dulu.`
                : permission.override_allowed === null ? 'Mengikuti role' : 'Izin khusus akun'}
              {' · Bawaan role '}{permission.role_allowed ? 'ON' : 'OFF'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {permission.override_allowed !== null && !locked && <button type="button" className={button}
              disabled={change.isPending} aria-label={'Kembalikan ' + label + ' ke role'}
              onClick={() => change.mutate({ code, allowed: null })}>Ikuti role</button>}
            <button type="button" role="switch" aria-label={label} aria-checked={permission.allowed}
              disabled={Boolean(prerequisite || locked || change.isPending)}
              className={'inline-flex min-h-10 min-w-20 items-center justify-between gap-2 rounded-full px-3 text-xs font-bold disabled:opacity-60 '
                + (permission.allowed ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800')}
              onClick={() => change.mutate({ code, allowed: !permission.allowed })}>
              <span aria-hidden="true" className={'h-3.5 w-3.5 shrink-0 rounded-full ' + (permission.allowed ? 'order-2 bg-white' : 'bg-slate-500')} />
              <span aria-hidden="true">{permission.allowed ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </li>;
      })}
    </ul>}
  </section>;
}

export function CreativeAccess({ permissions, userName, userId }: { permissions: string[]; userName: string; userId: string }) {
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
      <AccessSwitches userId={userId} />
      <section className="creative-access-card" aria-labelledby="creative-role-matrix">
        <h2 id="creative-role-matrix" className="font-bold">Matriks role Creative</h2>
        <p className="mb-3 text-sm text-slate-600">Izin bawaan dari Supabase untuk setiap role. Saklar izin pengguna mengatur akses khusus akun.</p>
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
