import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TeamMember } from '../data/teamRepository';

const field = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
const button = 'rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50';
const roles = { manager: 'Manajer', contributor: 'Kontributor', viewer: 'Pembaca' };

export function BusinessAccessSettings({ userId, profiles }: { userId: string; profiles: TeamMember[] }) {
  const client = useQueryClient();
  const [name, setName] = useState('');
  const [selectedOrganization, setOrganization] = useState('');
  const [selectedUnit, setUnit] = useState('');
  const [person, setPerson] = useState('');
  const [role, setRole] = useState<keyof typeof roles>('viewer');
  const [notice, setNotice] = useState('');

  const key = ['business-access-settings', userId];
  const setup = useQuery({ queryKey: key, queryFn: async () => {
    const [organizations, units, membership] = await Promise.all([
      supabase.from('organizations').select('id,name').order('name'),
      supabase.from('business_units').select('id,name,organization_id').order('name'),
      supabase.from('organization_memberships').select('organization_id,role').eq('user_id', userId),
    ]);
    if (organizations.error) throw organizations.error;
    if (units.error) throw units.error;
    if (membership.error) throw membership.error;
    return { organizations: organizations.data, units: units.data, membership: membership.data };
  } });

  const organization = setup.data?.organizations.find(item => item.id === selectedOrganization)
    ?? setup.data?.organizations[0];
  const organizationRole = setup.data?.membership.find(item => item.organization_id === organization?.id)?.role;
  const units = setup.data?.units.filter(item => item.organization_id === organization?.id
    || (organizationRole === 'owner' && item.organization_id === null)) ?? [];
  const unit = units.find(item => item.id === selectedUnit) ?? units[0];
  const canManage = Boolean(unit?.organization_id) && (organizationRole === 'owner' || organizationRole === 'admin');
  const members = useQuery({ queryKey: [...key, 'members', unit?.id], enabled: canManage, queryFn: async () => {
    const { data, error } = await supabase.from('business_unit_memberships').select('user_id,role')
      .eq('business_unit_id', unit!.id);
    if (error) throw error;
    return data;
  } });

  const action = useMutation({
    mutationFn: async (request: { name: string; params: Record<string, string | null> }) => {
      const { data, error } = await supabase.rpc(request.name, request.params);
      if (error) throw error;
      return data;
    },
    onMutate: () => setNotice(''),
    onSuccess: async (data, request) => {
      if (request.name === 'create_workspace_organization' && typeof data === 'string') {
        setOrganization(data);
        setName('');
      }
      await client.invalidateQueries({ queryKey: key });
      setNotice('Perubahan akses tersimpan.');
    },
  });
  const saveMember = (profile: string, nextRole: string | null) => {
    if (!unit || !profile) return;
    action.mutate({ name: 'set_workspace_unit_membership', params: { p_unit: unit.id, p_user: profile, p_role: nextRole } });
  };
  const error = action.error ?? setup.error ?? members.error;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <h3 className="font-extrabold text-slate-900">Organisasi dan akses unit</h3>
      <p className="text-sm text-slate-600">Hubungkan unit bisnis ke organisasi dan tentukan peran anggota di setiap unit.</p>
      <p className="text-sm text-slate-600">Pemetaan ini menyiapkan akses per unit. Data Launch dan Creative masih mengikuti izin modul saat ini.</p>
      {setup.isPending && <p role="status">Memuat organisasi…</p>}
      {setup.isSuccess && setup.data.organizations.length === 0 && (
        <form className="flex flex-wrap gap-2" onSubmit={event => {
          event.preventDefault();
          if (name.trim()) action.mutate({ name: 'create_workspace_organization', params: { p_name: name.trim() } });
        }}>
          <label className="grow text-sm">Nama organisasi
            <input className={field} required value={name} onChange={event => setName(event.target.value)} />
          </label>
          <button className={`${button} self-end`} disabled={action.isPending || !name.trim()}>Buat organisasi</button>
        </form>
      )}
      {organization && (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">Organisasi
            <select className={field} value={organization.id} onChange={event => { setOrganization(event.target.value); setUnit(''); setPerson(''); }}>
              {setup.data?.organizations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Unit bisnis
            <select className={field} value={unit?.id ?? ''} onChange={event => { setUnit(event.target.value); setPerson(''); }}>
              {!unit && <option value="">Belum ada unit</option>}
              {units.map(item => <option key={item.id} value={item.id}>{item.name}{item.organization_id ? '' : ' (belum terhubung)'}</option>)}
            </select>
          </label>
        </div>
      )}
      {organization && unit && !unit.organization_id && organizationRole === 'owner' && (
        <button className={button} disabled={action.isPending} onClick={() => action.mutate({
          name: 'link_workspace_business_unit', params: { p_organization: organization.id, p_unit: unit.id },
        })}>Hubungkan {unit.name} ke {organization.name}</button>
      )}
      {canManage && (
        <>
          <form className="flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); saveMember(person, role); }}>
            <label className="grow text-sm">Anggota
              <select className={field} required value={person} onChange={event => setPerson(event.target.value)}>
                <option value="">Pilih anggota aktif</option>
                {profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.full_name} ({profile.username})</option>)}
              </select>
            </label>
            <label className="text-sm">Peran unit
              <select className={field} value={role} onChange={event => setRole(event.target.value as keyof typeof roles)}>
                {Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button className={button} disabled={action.isPending || !person}>Simpan peran</button>
          </form>
          <ul className="divide-y divide-slate-100">
            {members.data?.map(member => (
              <li key={member.user_id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>{profiles.find(profile => profile.id === member.user_id)?.full_name ?? member.user_id} · {roles[member.role as keyof typeof roles]}</span>
                <button type="button" className="font-semibold text-rose-700" disabled={action.isPending}
                  onClick={() => saveMember(member.user_id, null)}>Cabut peran unit</button>
              </li>
            ))}
          </ul>
        </>
      )}
      {error && <p role="alert" className="text-sm text-rose-700">{error.message}</p>}
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
    </section>
  );
}
