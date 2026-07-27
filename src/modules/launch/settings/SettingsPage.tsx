import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, KeyRound, Rocket, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/core/auth/useAuth';
import {
  createTeamUser, deactivateTeamUser, listProjectAccess, listRoles, listTeamMembers,
  reactivateTeamUser, setMemberCanLaunch, setProjectMember, type NewTeamUserInput,
} from '../data/teamRepository';
import { useProjects } from '../hooks/useLaunch';

const emptyUser = (): NewTeamUserInput => ({ username: '', pin: '', full_name: '', job_title: '', role_code: '' });

export function SettingsPage() {
  const auth = useAuth();
  const client = useQueryClient();
  const isAdmin = auth.data?.permissions.includes('launch.admin') ?? false;

  const roles = useQuery({ queryKey: ['launch-roles'], queryFn: listRoles, enabled: isAdmin });
  const members = useQuery({ queryKey: ['launch-team'], queryFn: listTeamMembers, enabled: isAdmin });
  const projects = useProjects();

  const [draft, setDraft] = useState<NewTeamUserInput>(emptyUser());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [projectId, setProjectId] = useState('');

  const access = useQuery({ queryKey: ['launch-access', projectId], queryFn: () => listProjectAccess(projectId), enabled: isAdmin && Boolean(projectId) });

  const refreshTeam = () => client.invalidateQueries({ queryKey: ['launch-team'] });
  const refreshAccess = () => client.invalidateQueries({ queryKey: ['launch-access', projectId] });

  const createUser = useMutation({ mutationFn: createTeamUser, onSuccess: () => { setDraft(emptyUser()); setNotice('Pengguna baru berhasil dibuat.'); void refreshTeam(); } });
  const deactivate = useMutation({ mutationFn: deactivateTeamUser, onSuccess: refreshTeam });
  const reactivate = useMutation({ mutationFn: reactivateTeamUser, onSuccess: refreshTeam });
  const toggleMember = useMutation({ mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) => setProjectMember(projectId, userId, enabled), onSuccess: refreshAccess });
  const toggleLaunch = useMutation({ mutationFn: ({ userId, canLaunch }: { userId: string; canLaunch: boolean }) => setMemberCanLaunch(projectId, userId, canLaunch), onSuccess: refreshAccess });

  if (!isAdmin) {
    return <div className="page-stack"><div className="state-panel"><ShieldCheck size={28} /><h3>Akses pengaturan terbatas</h3><p>Hanya owner atau admin yang dapat mengelola pengguna dan hak akses artikel.</p></div></div>;
  }

  async function submitUser(event: FormEvent) {
    event.preventDefault();
    setError(null); setNotice(null);
    try { await createUser.mutateAsync(draft); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Pengguna gagal dibuat.'); }
  }

  const accessRows = access.data ?? [];
  const memberOf = (userId: string) => accessRows.find(row => row.user_id === userId);

  return (
    <div className="page-stack">
      <section className="page-intro"><div><span className="eyebrow">Pengaturan sistem</span><h2>Pengguna & hak akses.</h2><p>Buat akun tim dengan username dan PIN, lalu tentukan siapa yang boleh merilis tiap artikel.</p></div></section>

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Tambah anggota</span><h3>Buat pengguna baru</h3><p>PIN dipakai sebagai kata sandi saat masuk. Minimal 6 digit angka.</p></div></div>
        <form onSubmit={submitUser}>
          <div className="field-grid">
            <label className="field"><span>Nama lengkap *</span><input required placeholder="Contoh: Dodi Setiawan" value={draft.full_name} onChange={e => setDraft({ ...draft, full_name: e.target.value })} /></label>
            <label className="field"><span>Username *</span><input required placeholder="dodi" value={draft.username} onChange={e => setDraft({ ...draft, username: e.target.value.toLowerCase() })} /></label>
            <label className="field"><span>PIN *</span><div className="input-icon"><KeyRound size={16} /><input required inputMode="numeric" pattern="\d{6,12}" placeholder="6-12 digit angka" value={draft.pin} onChange={e => setDraft({ ...draft, pin: e.target.value.replace(/\D/g, '') })} /></div></label>
            <label className="field"><span>Jabatan</span><input placeholder="Product Research & Costing" value={draft.job_title} onChange={e => setDraft({ ...draft, job_title: e.target.value })} /></label>
            <label className="field"><span>Role *</span><select required value={draft.role_code} onChange={e => setDraft({ ...draft, role_code: e.target.value })}><option value="">Pilih role</option>{roles.data?.map(role => <option value={role.code} key={role.code}>{role.name}</option>)}</select></label>
          </div>
          {error && <div className="form-error"><AlertCircle size={16} /> {error}</div>}
          {notice && <div className="form-notice">{notice}</div>}
          <button type="submit" className="button button-primary" disabled={createUser.isPending}><UserPlus size={17} /> {createUser.isPending ? 'Membuat…' : 'Buat pengguna'}</button>
        </form>
      </section>

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Daftar tim</span><h3>{members.data?.length ?? 0} pengguna</h3></div></div>
        {members.isLoading ? <div className="loading-grid"><span /><span /></div> : members.data?.length ? <div className="sourcing-list">{members.data.map(person => <article className="sourcing-card" key={person.id}>
          <div className="sourcing-card-head">
            <span className="material-role">{person.username.slice(0, 2).toUpperCase()}</span>
            <div><b>{person.full_name}</b><small>@{person.username} · {person.role_name ?? 'Tanpa role'}{person.job_title ? ` · ${person.job_title}` : ''}</small></div>
            <span className={`status-pill ${person.is_active ? 'status-active' : ''}`}><i />{person.is_active ? 'Aktif' : 'Nonaktif'}</span>
            {person.id !== auth.data?.profile?.id && (person.is_active
              ? <button type="button" className="button button-secondary" disabled={deactivate.isPending} onClick={() => deactivate.mutate(person.id)}>Nonaktifkan</button>
              : <button type="button" className="button button-primary" disabled={reactivate.isPending} onClick={() => reactivate.mutate(person.id)}>Aktifkan</button>)}
          </div>
        </article>)}</div> : <div className="state-panel state-empty"><Users size={28} /><h3>Belum ada pengguna lain</h3><p>Tambahkan anggota tim melalui form di atas.</p></div>}
      </section>

      <section className="content-card">
        <div className="section-head"><div><span className="eyebrow">Hak akses artikel</span><h3>Siapa yang boleh merilis artikel</h3><p>Pilih artikel, tentukan anggota yang terlibat, lalu aktifkan izin rilis untuk yang berwenang.</p></div></div>
        <label className="field"><span>Artikel</span><select value={projectId} onChange={e => setProjectId(e.target.value)}><option value="">Pilih artikel</option>{projects.data?.map(project => <option value={project.id} key={project.id}>{project.code} · {project.article_name}</option>)}</select></label>

        {projectId && (access.isLoading ? <div className="loading-grid"><span /><span /></div> : <div className="access-list">
          {members.data?.filter(person => person.is_active).map(person => {
            const row = memberOf(person.id);
            return <div className="access-row" key={person.id}>
              <div className="access-name"><b>{person.full_name}</b><small>@{person.username} · {person.role_name ?? 'Tanpa role'}</small></div>
              <label className="access-toggle"><input type="checkbox" checked={Boolean(row)} disabled={toggleMember.isPending} onChange={e => toggleMember.mutate({ userId: person.id, enabled: e.target.checked })} /><span>Terlibat</span></label>
              <label className="access-toggle"><input type="checkbox" checked={Boolean(row?.can_launch)} disabled={!row || toggleLaunch.isPending} onChange={e => toggleLaunch.mutate({ userId: person.id, canLaunch: e.target.checked })} /><span><Rocket size={13} /> Boleh merilis</span></label>
            </div>;
          })}
        </div>)}
      </section>
    </div>
  );
}
