import { type ReactNode, FormEvent, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  PencilLine,
  Plus,
  Rocket,
  Save,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from '@/app/router/simpleRouter';
import { signOut, useAuth } from '@/core/auth/useAuth';
import {
  createTeamUser, deleteTeamUser, listAllProfiles, listProjectAccess, listRoles, listTeamMembers,
  purgeOrphanedProfiles,
  setMemberCanLaunch,
  setProjectMember,
  updateTeamUser,
  type DeleteTeamUserResult,
  type NewTeamUserInput,
  type TeamMember,
  type UpdateTeamUserInput,
} from '../data/teamRepository';
import {
  loadStoredBusinessUnits,
  saveStoredBusinessUnits,
  type BusinessUnitItem,
} from '../paten/services/businessUnits';
import { useProjects } from '../hooks/useLaunch';

const emptyUser = (): NewTeamUserInput => ({ username: '', pin: '', full_name: '', job_title: '', role_code: '' });
const emptyEditUser = (): UpdateTeamUserInput => ({
  user_id: '',
  username: '',
  full_name: '',
  job_title: '',
  role_code: '',
  password: '',
});

const inputClass =
  'w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:border-[#087E79] focus:outline-none focus:ring-4 focus:ring-[#087E79]/10 transition-all';

/** Header seksi bergaya PATEN: badge ikon berwarna + judul. */
function SectionHead({
  step, icon, tint, title, subtitle,
}: {
  step: number;
  icon: ReactNode;
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
  const navigate = useNavigate();
  const client = useQueryClient();
  const isAdmin = auth.data?.permissions.includes('launch.admin') ?? false;

  const roles = useQuery({ queryKey: ['launch-roles'], queryFn: listRoles, enabled: isAdmin });
  const members = useQuery({ queryKey: ['launch-team'], queryFn: listTeamMembers, enabled: isAdmin });
  const allProfiles = useQuery({ queryKey: ['launch-all-profiles'], queryFn: listAllProfiles, enabled: isAdmin });
  const projects = useProjects();

  const [draft, setDraft] = useState<NewTeamUserInput>(emptyUser());
  const [editDraft, setEditDraft] = useState<UpdateTeamUserInput>(emptyEditUser());
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createNotice, setCreateNotice] = useState<string | null>(null);
  const [memberFeedback, setMemberFeedback] = useState<string | null>(null);
  const [memberFeedbackTone, setMemberFeedbackTone] = useState<'success' | 'error'>('success');
  const [projectId, setProjectId] = useState('');

  // Dynamic Business Units state
  const [buList, setBuList] = useState<BusinessUnitItem[]>(() => loadStoredBusinessUnits());
  const [showBuModal, setShowBuModal] = useState(false);
  const [buEditId, setBuEditId] = useState<string | null>(null);
  const [buName, setBuName] = useState('');
  const [buCode, setBuCode] = useState('');
  const [buDesc, setBuDesc] = useState('');

  const handleSaveBu = (e: FormEvent) => {
    e.preventDefault();
    if (!buName.trim()) return;

    let updated: BusinessUnitItem[];
    if (buEditId) {
      updated = buList.map((bu) =>
        bu.id === buEditId
          ? {
              ...bu,
              name: buName.trim(),
              code: buCode.trim().toUpperCase() || buName.trim().toUpperCase(),
              description: buDesc.trim() || 'Unit bisnis studio rilis.',
            }
          : bu
      );
    } else {
      const newBu: BusinessUnitItem = {
        id: `bu-${Date.now()}`,
        name: buName.trim(),
        code: buCode.trim().toUpperCase() || buName.trim().toUpperCase(),
        description: buDesc.trim() || 'Unit bisnis studio rilis.',
        status: 'Aktif',
      };
      updated = [...buList, newBu];
    }

    setBuList(updated);
    saveStoredBusinessUnits(updated);
    window.dispatchEvent(new Event('business-units-updated'));
    setShowBuModal(false);
    setBuEditId(null);
    setBuName('');
    setBuCode('');
    setBuDesc('');
  };

  const handleOpenNewBu = () => {
    setBuEditId(null);
    setBuName('');
    setBuCode('');
    setBuDesc('');
    setShowBuModal(true);
  };

  const handleEditBu = (bu: BusinessUnitItem) => {
    setBuEditId(bu.id);
    setBuName(bu.name);
    setBuCode(bu.code);
    setBuDesc(bu.description);
    setShowBuModal(true);
  };

  const handleDeleteBu = (id: string) => {
    if (buList.length <= 1) {
      alert('Minimal harus ada 1 Unit Bisnis.');
      return;
    }
    const updated = buList.filter((b) => b.id !== id);
    setBuList(updated);
    saveStoredBusinessUnits(updated);
    window.dispatchEvent(new Event('business-units-updated'));
  };

  const access = useQuery({
    queryKey: ['launch-access', projectId],
    queryFn: () => listProjectAccess(projectId),
    enabled: isAdmin && Boolean(projectId),
  });

  const refreshTeam = () => {
    client.invalidateQueries({ queryKey: ['launch-team'] });
    client.invalidateQueries({ queryKey: ['launch-all-profiles'] });
  };

  useEffect(() => {
    void purgeOrphanedProfiles().then(() => {
      refreshTeam();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  async function handlePurgeOrphaned() {
    setMemberFeedbackTone('success');
    setMemberFeedback('Memproses pembersihan profil tersangkut...');
    await purgeOrphanedProfiles();
    await refreshTeam();
    setMemberFeedback('Semua profil tersangkut/inaktif berhasil dibersihkan permanen!');
  }
  const refreshAccess = () => client.invalidateQueries({ queryKey: ['launch-access', projectId] });

  const createUser = useMutation({
    mutationFn: createTeamUser,
    onSuccess: () => {
      setDraft(emptyUser());
      setCreateNotice('Pengguna baru berhasil dibuat.');
      setShowCreateModal(false);
      void refreshTeam();
    },
  });
  const deleteUser = useMutation({
    mutationFn: deleteTeamUser,
    onSuccess: async (result: DeleteTeamUserResult) => {
      setMemberFeedbackTone('success');
      setMemberFeedback(result.deleted_self
        ? 'Akun berhasil dihapus. Anda akan keluar dari Product Launch OS.'
        : 'Pengguna berhasil dihapus.');
      setEditingUserId(null);
      setEditDraft(emptyEditUser());
      await refreshTeam();
      if (result.deleted_self) {
        await signOut();
        navigate('/launch/login');
      }
    },
  });
  const updateUser = useMutation({
    mutationFn: updateTeamUser,
    onSuccess: async () => {
      setMemberFeedbackTone('success');
      setMemberFeedback('Data pengguna berhasil diperbarui.');
      setEditingUserId(null);
      setEditDraft(emptyEditUser());
      await Promise.all([
        client.invalidateQueries({ queryKey: ['launch-team'] }),
        client.invalidateQueries({ queryKey: ['product-launch-auth'] }),
      ]);
    },
  });
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

  function startEdit(person: TeamMember) {
    setMemberFeedbackTone('success');
    setMemberFeedback(null);
    setEditingUserId(person.id);
    setEditDraft({
      user_id: person.id,
      username: person.username,
      full_name: person.full_name,
      job_title: person.job_title ?? '',
      role_code: person.role_code ?? '',
      password: '',
    });
  }

  function cancelEdit() {
    setEditingUserId(null);
    setEditDraft(emptyEditUser());
    setMemberFeedbackTone('success');
    setMemberFeedback(null);
  }

  async function submitUser(event: FormEvent) {
    event.preventDefault();
    setCreateError(null);
    setCreateNotice(null);
    try { await createUser.mutateAsync(draft); }
    catch (reason) { setCreateError(reason instanceof Error ? reason.message : 'Pengguna gagal dibuat.'); }
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault();
    setMemberFeedback(null);
    try {
      await updateUser.mutateAsync(editDraft);
    } catch (reason) {
      setMemberFeedback(reason instanceof Error ? reason.message : 'Data pengguna gagal diperbarui.');
    }
  }

  async function handleDeleteUser(person: TeamMember) {
    const confirmed = window.confirm(
      person.id === auth.data?.profile?.id
        ? `Hapus akun Anda sendiri (@${person.username})? Setelah dihapus Anda akan langsung keluar dari Product Launch OS.`
        : `Hapus pengguna @${person.username}? Tindakan ini akan menghapus akun login dan akses pengguna tersebut.`,
    );
    if (!confirmed) return;

    setMemberFeedbackTone('success');
    setMemberFeedback(null);
    try {
      await deleteUser.mutateAsync(person.id);
    } catch (reason) {
      setMemberFeedbackTone('error');
      setMemberFeedback(reason instanceof Error ? reason.message : 'Pengguna gagal dihapus.');
    }
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
          icon={<Plus className="w-5 h-5" />}
          tint="bg-white text-sky-600 shadow-2xs"
          title="Buat pengguna baru"
          subtitle="Form pembuatan pengguna dibuka lewat modal agar halaman utama tetap rapi."
        />

        <div className="rounded-2xl border border-sky-200 bg-white/80 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-sky-700">Modal Pengguna Baru</p>
            <p className="mt-1 text-[11px] text-slate-600">
              Buka modal hanya saat perlu membuat akun baru, agar daftar tim dan akses pengguna lebih fokus.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft(emptyUser());
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#087E79] hover:bg-[#066864] text-white font-bold transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Buka form pengguna</span>
          </button>
        </div>

        {createNotice && (
          <p className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {createNotice}
          </p>
        )}
      </div>

      {/* Langkah 2 — Daftar tim */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <SectionHead
          step={2}
          icon={<Users className="w-5 h-5" />}
          tint="bg-teal-100 text-teal-600"
          title={`Daftar tim (${members.data?.length ?? 0} pengguna)`}
          subtitle="Edit data login, role, hak akses, dan hapus pengguna bila memang sudah tidak dipakai."
        />

        {memberFeedback && (
          <p className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-bold ${
            memberFeedbackTone === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {memberFeedbackTone === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {memberFeedback}
          </p>
        )}

        {members.isLoading ? (
          <p className="text-slate-400 italic py-4 text-center">Memuat daftar tim…</p>
        ) : members.data?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {members.data.map(person => (
              <div key={person.id}
                className="rounded-xl bg-white border border-slate-200 shadow-2xs p-3 space-y-3">
                <div className="flex items-center gap-2.5">
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
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(person)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    <PencilLine className="w-3.5 h-3.5" />
                    Edit pengguna
                  </button>
                  <button
                    type="button"
                    disabled={deleteUser.isPending}
                    onClick={() => void handleDeleteUser(person)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-rose-200 bg-rose-50 text-[10px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {person.id === auth.data?.profile?.id ? 'Hapus akun utama' : 'Hapus pengguna'}
                  </button>
                </div>

                {editingUserId === person.id && (
                  <form onSubmit={submitEdit} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Edit Pengguna</p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Anda bisa ubah username login internal dan set password baru bila diperlukan.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                        aria-label="Tutup edit pengguna"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      <label className="block">
                        <span className="block font-bold text-slate-700 mb-1">Username *</span>
                        <input
                          required
                          className={`${inputClass} font-mono`}
                          value={editDraft.username}
                          onChange={e => setEditDraft(current => ({
                            ...current,
                            username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''),
                          }))}
                        />
                        <p className="mt-1 text-[10px] text-slate-500">
                          Dipakai untuk login internal. Hanya huruf kecil, angka, titik, garis bawah, atau strip.
                        </p>
                      </label>
                      <label className="block">
                        <span className="block font-bold text-slate-700 mb-1">Nama lengkap *</span>
                        <input
                          required
                          className={inputClass}
                          value={editDraft.full_name}
                          onChange={e => setEditDraft(current => ({ ...current, full_name: e.target.value }))}
                        />
                      </label>
                      <label className="block">
                        <span className="block font-bold text-slate-700 mb-1">Jabatan</span>
                        <input
                          className={inputClass}
                          value={editDraft.job_title ?? ''}
                          onChange={e => setEditDraft(current => ({ ...current, job_title: e.target.value }))}
                        />
                      </label>
                      <label className="block">
                        <span className="block font-bold text-slate-700 mb-1">Password / PIN baru</span>
                        <input
                          type="password"
                          className={`${inputClass} font-mono`}
                          value={editDraft.password ?? ''}
                          onChange={e => setEditDraft(current => ({ ...current, password: e.target.value }))}
                          placeholder="Kosongkan jika tidak ingin mengganti"
                        />
                        <p className="mt-1 text-[10px] text-slate-500">
                          Opsional. Isi hanya jika ingin mengganti password login pengguna.
                        </p>
                      </label>
                      <label className="block">
                        <span className="block font-bold text-slate-700 mb-1">Role *</span>
                        <select
                          required
                          className={inputClass}
                          value={editDraft.role_code}
                          onChange={e => setEditDraft(current => ({ ...current, role_code: e.target.value }))}
                          disabled={person.id === auth.data?.profile?.id}
                        >
                          <option value="">Pilih role</option>
                          {roles.data?.map(role => <option value={role.code} key={role.code}>{role.name}</option>)}
                        </select>
                        {person.id === auth.data?.profile?.id && (
                          <p className="mt-1 text-[10px] text-amber-700">
                            Role akun Anda dikunci di form ini untuk mencegah kehilangan akses admin.
                          </p>
                        )}
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={updateUser.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#087E79] text-white text-[11px] font-bold hover:bg-[#066864] disabled:opacity-50"
                      >
                        {updateUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {updateUser.isPending ? 'Menyimpan…' : 'Simpan perubahan'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                )}
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

        {/* Inspection Panel for All Profiles in Database */}
        <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-slate-700">
              🔍 Inspect Database: {allProfiles.data?.length ?? 0} Profil Aktif Tersimpan di Database
            </span>
            <button
              type="button"
              onClick={handlePurgeOrphaned}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[10px] transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-rose-600" />
              <span>🧹 Bersihkan Semua Profil Tersangkut / Inaktif</span>
            </button>
          </div>

          {allProfiles.data && allProfiles.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {allProfiles.data.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-mono font-extrabold text-slate-900">@{p.username}</span>
                    <span className="text-slate-500 ml-1.5 truncate inline-block max-w-[120px] align-bottom">({p.full_name})</span>
                    <span className={`ml-1.5 px-1.5 py-0.5 text-[9px] font-extrabold rounded-full ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {p.is_active ? 'Aktif' : 'Tersangkut/Inaktif'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(p)}
                    className="shrink-0 px-2.5 py-1 text-[10px] font-extrabold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                  >
                    Hapus Permanen
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">Database bersih, tidak ada akun tersangkut.</p>
          )}
        </div>
      </div>

      {/* Langkah 3 — Hak akses per artikel */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-4 space-y-3">
        <SectionHead
          step={3}
          icon={<Rocket className="w-5 h-5" />}
          tint="bg-white text-amber-600 shadow-2xs"
          title="Hak akses per artikel"
          subtitle="Pilih artikel, tentukan anggota yang terlibat, lalu aktifkan izin rilis untuk pengguna yang berwenang."
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

      {/* Langkah 4 — Kelola Unit Bisnis / Brand Studio */}
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SectionHead
            step={4}
            icon={<ShieldCheck className="w-5 h-5" />}
            tint="bg-white text-indigo-600 shadow-2xs"
            title="Kelola Unit Bisnis / Brand Studio"
            subtitle="Tambah, ubah, atau hapus unit bisnis/brand terdaftar."
          />
          <button
            type="button"
            onClick={handleOpenNewBu}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-2xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Unit Bisnis</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {buList.map((unit) => (
            <div
              key={unit.id}
              className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-xs text-slate-900 truncate">{unit.name}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-700 font-mono text-[9px] font-bold">
                    {unit.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold shrink-0">
                    {unit.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">{unit.description}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEditBu(unit)}
                  title="Edit Unit Bisnis"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  <PencilLine className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBu(unit.id)}
                  title="Hapus Unit Bisnis"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Form Tambah / Edit Unit Bisnis */}
      {showBuModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-900 text-white">
              <h3 className="font-extrabold text-sm">
                {buEditId ? 'Edit Unit Bisnis' : 'Tambah Unit Bisnis Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBuModal(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveBu} className="p-5 space-y-3.5 text-xs text-slate-900">
              <div>
                <label className="block font-extrabold text-slate-900 mb-1">
                  Nama Unit Bisnis / Brand <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: GUDSKUY, GG Supply, Streetwear Co"
                  value={buName}
                  onChange={(e) => setBuName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-extrabold text-slate-900 mb-1">Kode Prefix Singkat</label>
                <input
                  type="text"
                  placeholder="Misal: GUDSKUY, GG_SUPPLY"
                  value={buCode}
                  onChange={(e) => setBuCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-extrabold text-slate-900 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan ringkas fokus koleksi unit bisnis ini..."
                  value={buDesc}
                  onChange={(e) => setBuDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBuModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-extrabold hover:bg-indigo-700 shadow-2xs"
                >
                  Simpan Unit Bisnis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm p-4 sm:p-6">
          <div className="max-w-3xl mx-auto h-full flex items-center justify-center">
            <div className="w-full max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
              <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-100">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#087E79]">Modal Pengguna Baru</p>
                  <h2 className="mt-2 text-lg font-extrabold text-slate-900">Buat pengguna Product Launch</h2>
                  <p className="mt-1 text-[12px] text-slate-500">
                    Isi identitas, username, PIN, dan role untuk menambahkan akun tim baru.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                  }}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  aria-label="Tutup modal pengguna baru"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={submitUser} className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block font-bold text-slate-700 mb-1">Nama lengkap *</span>
                    <input
                      required
                      placeholder="Contoh: Dodi Setiawan"
                      className={inputClass}
                      value={draft.full_name}
                      onChange={e => setDraft({ ...draft, full_name: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="block font-bold text-slate-700 mb-1">Username *</span>
                    <input
                      required
                      placeholder="dodi"
                      className={`${inputClass} font-mono`}
                      value={draft.username}
                      onChange={e => setDraft({ ...draft, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') })}
                    />
                  </label>
                  <label className="block">
                    <span className="block font-bold text-slate-700 mb-1">PIN *</span>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        required
                        inputMode="numeric"
                        pattern="\d{6,12}"
                        placeholder="6-12 digit angka"
                        className={`${inputClass} pl-9 font-mono`}
                        value={draft.pin}
                        onChange={e => setDraft({ ...draft, pin: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="block font-bold text-slate-700 mb-1">Jabatan</span>
                    <input
                      placeholder="Product Research & Costing"
                      className={inputClass}
                      value={draft.job_title}
                      onChange={e => setDraft({ ...draft, job_title: e.target.value })}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="block font-bold text-slate-700 mb-1">Role *</span>
                    <select
                      required
                      className={inputClass}
                      value={draft.role_code}
                      onChange={e => setDraft({ ...draft, role_code: e.target.value })}
                    >
                      <option value="">Pilih role</option>
                      {roles.data?.map(role => <option value={role.code} key={role.code}>{role.name}</option>)}
                    </select>
                  </label>
                </div>

                {createError && (
                  <p className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {createError}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={createUser.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#087E79] hover:bg-[#066864] text-white font-bold transition-colors shadow-2xs disabled:opacity-50"
                  >
                    {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {createUser.isPending ? 'Membuat…' : 'Buat pengguna'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateError(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
