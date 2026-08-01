import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, CheckCircle2, KeyRound, Rocket, ShieldCheck, UserPlus, Users, Loader2,
} from 'lucide-react';
import { useAuth } from '@/core/auth/useAuth';
import {
  createTeamUser, deactivateTeamUser, listProjectAccess, listRoles, listTeamMembers,
  reactivateTeamUser, setMemberCanLaunch, setProjectMember, type NewTeamUserInput,
} from '../data/teamRepository';
import { useProjects } from '../hooks/useLaunch';

const emptyUser = (): NewTeamUserInput => ({ username: '', pin: '', full_name: '', job_title: '', role_code: '' });

const inputClass =
  'w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#087E79] focus:outline-none focus:ring-4 focus:ring-[#087E79]/10 transition-all';

/** Header seksi bergaya PATEN: badge ikon berwarna + judul. */
function SectionHead({
  step, icon, tint, title, subtitle,
}: {
  step: number;
  icon: React.ReactNode;
  tint: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className={`p-2.5 rounded-2xl shrink-0 ${tint}`}>{icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-white text-slate-600 text-[10px] font-extrabold border border-slate-200">
            Langkah {step}
          </span>
          <h3 className="font-extrabold text-sm text-slate-900">{title}</h3>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

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

  const access = useQuery({
    queryKey: ['launch-access', projectId],
    queryFn: () => listProjectAccess(projectId),
    enabled: isAdmin && Boolean(projectId),
  });

  const refreshTeam = () => client.invalidateQueries({ queryKey: ['launch-team'] });
  const refreshAccess = () => client.invalidateQueries({ queryKey: ['launch-access', projectId] });

  const createUser = useMutation({
    mutationFn: createTeamUser,
    onSuccess: () => { setDraft(emptyUser()); setNotice('Pengguna baru berhasil dibuat.'); void refreshTeam(); },
  });
  const deactivate = useMutation({ mutationFn: deactivateTeamUser, onSuccess: refreshTeam });
  const reactivate = useMutation({ mutationFn: reactivateTeamUser, onSuccess: refreshTeam });
  const toggleMember = useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) => setProjectMember(projectId, userId, enabled),
    onSuccess: refreshAccess,
  });
  const toggleLaunch = useMutation({
    mutationFn: ({ userId, canLaunch }: { userId: string; canLaunch: boolean }) => setMemberCanLaunch(projectId, userId, canLaunch),
    onSuccess: refreshAccess,
  });

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs">
          <span className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-600 mb-3">
            <ShieldCheck className="w-7 h-7" />
          </span>
          <h3 className="font-extrabold text-base text-slate-900">Akses pengaturan terbatas</h3>
          <p className="text-xs text-slate-500 mt-1">
            Hanya owner atau admin yang dapat mengelola pengguna dan hak akses artikel.
          </p>
        </div>
      </div>
    );
  }

  async function submitUser(event: FormEvent) {
    event.preventDefault();
    setError(null); setNotice(null);
    try { await createUser.mutateAsync(draft); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Pengguna gagal dibuat.'); }
  }

  const accessRows = access.data ?? [];
  const memberOf = (userId: string) => accessRows.find(row => row.user_id === userId);
  const activeMembers = members.data?.filter(person => person.is_active) ?? [];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 text-xs text-slate-900">
      {/* Hero */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-violet-100 text-violet-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-extrabold uppercase tracking-wider">
                Pengaturan Sistem
              </span>
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900">Pengguna &amp; Hak Akses</h1>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Buat akun tim dengan username dan PIN, lalu tentukan siapa yang boleh merilis tiap artikel.
            </p>
          </div>
        </div>
      </div>

      {/* Langkah 1 — Buat pengguna */}
      <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-200 rounded-2xl p-4 space-y-3">
        <SectionHead
          step={1}
          icon={<UserPlus className="w-5 h-5" />}
          tint="bg-white text-sky-600 shadow-2xs"
          title="Buat pengguna baru"
          subtitle="PIN dipakai sebagai kata sandi saat masuk. Minimal 6 digit angka."
        />

        <form onSubmit={submitUser} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="block">
              <span className="block font-bold text-slate-700 mb-1">Nama lengkap *</span>
              <input required placeholder="Contoh: Dodi Setiawan" className={inputClass}
                value={draft.full_name} onChange={e => setDraft({ ...draft, full_name: e.target.value })} />
            </label>
            <label className="block">
              <span className="block font-bold text-slate-700 mb-1">Username *</span>
              <input required placeholder="dodi" className={`${inputClass} font-mono`}
                value={draft.username} onChange={e => setDraft({ ...draft, username: e.target.value.toLowerCase() })} />
            </label>
            <label className="block">
              <span className="block font-bold text-slate-700 mb-1">PIN *</span>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input required inputMode="numeric" pattern="\d{6,12}" placeholder="6-12 digit angka"
                  className={`${inputClass} pl-9 font-mono`}
                  value={draft.pin} onChange={e => setDraft({ ...draft, pin: e.target.value.replace(/\D/g, '') })} />
              </div>
            </label>
            <label className="block">
              <span className="block font-bold text-slate-700 mb-1">Jabatan</span>
              <input placeholder="Product Research &amp; Costing" className={inputClass}
                value={draft.job_title} onChange={e => setDraft({ ...draft, job_title: e.target.value })} />
            </label>
            <label className="block sm:col-span-2">
              <span className="block font-bold text-slate-700 mb-1">Role *</span>
              <select required className={inputClass}
                value={draft.role_code} onChange={e => setDraft({ ...draft, role_code: e.target.value })}>
                <option value="">Pilih role</option>
                {roles.data?.map(role => <option value={role.code} key={role.code}>{role.name}</option>)}
              </select>
            </label>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
          {notice && (
            <p className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {notice}
            </p>
          )}

          <button type="submit" disabled={createUser.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#087E79] hover:bg-[#066864] text-white font-bold transition-colors shadow-2xs disabled:opacity-50">
            {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {createUser.isPending ? 'Membuat…' : 'Buat pengguna'}
          </button>
        </form>
      </div>

      {/* Langkah 2 — Daftar tim */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <SectionHead
          step={2}
          icon={<Users className="w-5 h-5" />}
          tint="bg-teal-100 text-teal-600"
          title={`Daftar tim (${members.data?.length ?? 0} pengguna)`}
          subtitle="Nonaktifkan akun yang sudah tidak bekerja tanpa menghapus riwayatnya."
        />

        {members.isLoading ? (
          <p className="text-slate-400 italic py-4 text-center">Memuat daftar tim…</p>
        ) : members.data?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {members.data.map(person => (
              <div key={person.id}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="w-9 h-9 rounded-full bg-slate-900 text-white font-mono font-bold text-[11px] grid place-items-center shrink-0">
                  {person.username.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block font-extrabold text-slate-900 truncate">{person.full_name}</b>
                  <small className="text-[10px] text-slate-500 truncate block">
                    @{person.username} · {person.role_name ?? 'Tanpa role'}{person.job_title ? ` · ${person.job_title}` : ''}
                  </small>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                  person.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {person.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
                {person.id !== auth.data?.profile?.id && (person.is_active ? (
                  <button type="button" disabled={deactivate.isPending} onClick={() => deactivate.mutate(person.id)}
                    className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 shrink-0">
                    Nonaktifkan
                  </button>
                ) : (
                  <button type="button" disabled={reactivate.isPending} onClick={() => reactivate.mutate(person.id)}
                    className="px-2.5 py-1 rounded-full bg-[#087E79] text-white text-[10px] font-bold hover:bg-[#066864] disabled:opacity-50 shrink-0">
                    Aktifkan
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Users className="mx-auto w-6 h-6 text-slate-300" />
            <p className="mt-2 font-bold text-slate-600">Belum ada pengguna lain</p>
            <p className="mt-1 text-[10px] text-slate-400">Tambahkan anggota tim melalui form di atas.</p>
          </div>
        )}
      </div>

      {/* Langkah 3 — Hak akses per artikel */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-4 space-y-3">
        <SectionHead
          step={3}
          icon={<Rocket className="w-5 h-5" />}
          tint="bg-white text-amber-600 shadow-2xs"
          title="Hak akses per artikel"
          subtitle="Pilih artikel, tentukan anggota yang terlibat, lalu aktifkan izin rilis untuk yang berwenang."
        />

        <label className="block max-w-md">
          <span className="block font-bold text-slate-700 mb-1">Artikel</span>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputClass}>
            <option value="">Pilih artikel</option>
            {projects.data?.map(project => (
              <option value={project.id} key={project.id}>{project.code} · {project.article_name}</option>
            ))}
          </select>
        </label>

        {!projectId ? (
          <p className="text-[11px] text-amber-900/60 italic">
            Pilih artikel terlebih dahulu untuk mengatur siapa yang terlibat dan boleh merilis.
          </p>
        ) : access.isLoading ? (
          <p className="text-slate-400 italic py-3">Memuat hak akses…</p>
        ) : activeMembers.length === 0 ? (
          <p className="text-[11px] text-amber-900/60 italic">Belum ada pengguna aktif untuk diatur.</p>
        ) : (
          <div className="space-y-1.5">
            {activeMembers.map(person => {
              const row = memberOf(person.id);
              return (
                <div key={person.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <b className="block font-extrabold text-slate-900 truncate">{person.full_name}</b>
                    <small className="text-[10px] text-slate-500">
                      @{person.username} · {person.role_name ?? 'Tanpa role'}
                    </small>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-bold cursor-pointer transition-colors ${
                      row ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      <input type="checkbox" className="accent-[#087E79]" checked={Boolean(row)} disabled={toggleMember.isPending}
                        onChange={e => toggleMember.mutate({ userId: person.id, enabled: e.target.checked })} />
                      <span>Terlibat</span>
                    </label>
                    <label className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-bold transition-colors ${
                      !row ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                        : row.can_launch ? 'bg-amber-50 border-amber-300 text-amber-700 cursor-pointer'
                        : 'bg-slate-50 border-slate-200 text-slate-500 cursor-pointer'
                    }`}
                      title={row ? undefined : 'Aktifkan "Terlibat" dulu sebelum memberi izin rilis'}>
                      <input type="checkbox" className="accent-amber-600" checked={Boolean(row?.can_launch)}
                        disabled={!row || toggleLaunch.isPending}
                        onChange={e => toggleLaunch.mutate({ userId: person.id, canLaunch: e.target.checked })} />
                      <Rocket className="w-3 h-3" />
                      <span>Boleh merilis</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
