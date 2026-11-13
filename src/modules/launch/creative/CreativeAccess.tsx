import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Minus, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { workspaceAccess } from '@/core/auth/workspaceAccess';
import { supabase } from '@/integrations/supabase/client';
import { listRoles, listTeamMembers, type RoleOption } from '../data/teamRepository';
import { SettingsPage } from '../settings/SettingsPage';
import { button, errorText, field } from './CreativeForms';
import { purgeCreativeDemoData } from './repository';

export const accessVariables = [
  {
    code: 'creative.view',
    shortLabel: 'Lihat Creative',
    label: 'Lihat Creative Dashboard',
    category: 'Creative Hub',
    description: 'Membuka ruang kerja Creative Hub, melihat pusat kerja, kalender, dan analitik.',
    dbSync: true,
  },
  {
    code: 'creative.ideas.manage',
    shortLabel: 'Bank Ide & Skrip',
    label: 'Kelola Bank Ide, Copywriting & Referensi',
    category: 'Creative Hub',
    description: 'Menambah dan mengedit ide konten, tabel naskah copywriting/skrip, serta katalog referensi.',
    dbSync: false,
  },
  {
    code: 'creative.edit',
    shortLabel: 'Kelola Tugas',
    label: 'Kelola Tugas & Produksi Konten',
    category: 'Creative Hub',
    description: 'Membuat, mengedit, dan memajukan tahapan tugas produksi konten hingga bukti tayang.',
    dbSync: true,
  },
  {
    code: 'creative.studio.manage',
    shortLabel: 'Studio Brief',
    label: 'Kelola Studio Brief & Versi Naskah',
    category: 'Creative Hub',
    description: 'Menyusun creative brief terstruktur dan mengelola revisi versi naskah produksi.',
    dbSync: false,
  },
  {
    code: 'creative.review.approve',
    shortLabel: 'Review & Gate',
    label: 'Review & Persetujuan Konten (Approver)',
    category: 'Creative Hub',
    description: 'Memberikan keputusan review naskah, meminta revisi, dan menyetujui konten siap tayang.',
    dbSync: false,
  },
  {
    code: 'creative.campaigns.manage',
    shortLabel: 'Kampanye & Jadwal',
    label: 'Kelola Kampanye & Jadwal Kalender',
    category: 'Creative Hub',
    description: 'Merencanakan portofolio kampanye, jadwal publikasi, dan alokasi anggaran kampanye.',
    dbSync: false,
  },
  {
    code: 'creative.channels.manage',
    shortLabel: 'Akun & Iklan',
    label: 'Kelola Akun Sosial, Iklan & Evaluasi',
    category: 'Creative Hub',
    description: 'Mengelola akun kanal, mencatat metrik performa berkala, aktivasi iklan, dan evaluasi ROAS.',
    dbSync: false,
  },
  {
    code: 'creative.tasks.remove',
    shortLabel: 'Hapus Tugas',
    label: 'Hapus Tugas & Bersihkan Dummy',
    category: 'Creative Hub',
    description: 'Mengeluarkan tugas dari daftar aktif dan membersihkan data simulasi/dummy.',
    dbSync: true,
  },
  {
    code: 'launch.view',
    shortLabel: 'Lihat Launch OS',
    label: 'Akses Lihat Product Launch OS',
    category: 'Lintas Ruang Kerja',
    description: 'Membuka ruang kerja Product Launch OS (pipeline artikel, jadwal, dan progres R&D).',
    dbSync: false,
  },
  {
    code: 'launch.admin',
    shortLabel: 'Owner / Sistem',
    label: 'Pengaturan Sistem, Pengguna & Role (Owner)',
    category: 'Administrasi Owner',
    description: 'Akses penuh Owner untuk membuat pengguna, mengatur matriks role, dan mengelola unit bisnis.',
    dbSync: false,
  },
] as const;

export type AccessVariableCode = typeof accessVariables[number]['code'];

type DbUserAccess = {
  code: 'creative.view' | 'creative.edit' | 'creative.tasks.remove';
  role_allowed: boolean;
  override_allowed: boolean | null;
  allowed: boolean;
  protected_admin: boolean;
};

const USER_GRANULAR_OVERRIDES_KEY = 'mix_pro_user_access_granular_v1';
const ROLE_MATRIX_OVERRIDES_KEY = 'mix_pro_role_matrix_overrides_v1';

function getLocalUserOverrides(): Record<string, Record<string, boolean | null>> {
  try {
    const raw = localStorage.getItem(USER_GRANULAR_OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Record<string, boolean | null>>) : {};
  } catch {
    return {};
  }
}

function setLocalUserOverride(userId: string, code: string, allowed: boolean | null) {
  try {
    const map = getLocalUserOverrides();
    const userMap = { ...(map[userId] ?? {}) };
    if (allowed === null) delete userMap[code];
    else userMap[code] = allowed;
    map[userId] = userMap;
    localStorage.setItem(USER_GRANULAR_OVERRIDES_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

function getLocalRoleMatrixOverrides(): Record<string, Record<string, boolean>> {
  try {
    const raw = localStorage.getItem(ROLE_MATRIX_OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Record<string, boolean>>) : {};
  } catch {
    return {};
  }
}

function setLocalRoleMatrixOverride(roleCode: string, permCode: string, allowed: boolean) {
  try {
    const map = getLocalRoleMatrixOverrides();
    map[roleCode] = { ...(map[roleCode] ?? {}), [permCode]: allowed };
    localStorage.setItem(ROLE_MATRIX_OVERRIDES_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

function clearLocalRoleMatrixOverrides() {
  try {
    localStorage.removeItem(ROLE_MATRIX_OVERRIDES_KEY);
  } catch { /* ignore */ }
}

function defaultRoleHasCapability(role: RoleOption, code: AccessVariableCode): boolean {
  if (role.code === 'owner') return true;
  const codes = new Set(role.permissions.map(p => p.code));
  const base = workspaceAccess([...codes]);
  const overrides = getLocalRoleMatrixOverrides()[role.code];
  if (overrides && typeof overrides[code] === 'boolean') {
    return overrides[code];
  }
  switch (code) {
    case 'creative.view':
      return base.creative;
    case 'creative.ideas.manage':
    case 'creative.edit':
    case 'creative.studio.manage':
      return base.creativeEdit;
    case 'creative.review.approve':
    case 'creative.campaigns.manage':
    case 'creative.channels.manage':
      return base.creativeEdit && !role.code.includes('viewer');
    case 'creative.tasks.remove':
      return base.creativeRemove;
    case 'launch.view':
      return base.launch;
    case 'launch.admin':
      return base.admin;
    default:
      return false;
  }
}

function AccessSwitches({ userId, roles }: { userId: string; roles: RoleOption[] }) {
  const client = useQueryClient();
  const [selected, setSelected] = useState('');
  const [notice, setNotice] = useState('');
  const [, setTick] = useState(0);
  const team = useQuery({ queryKey: ['launch-team'], queryFn: listTeamMembers });
  const member = team.data?.find(person => person.id === selected);
  const memberRole = roles.find(r => r.code === member?.role_code);
  const key = ['creative', userId, 'access-switches', selected];

  const access = useQuery({
    queryKey: key,
    enabled: Boolean(member),
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.rpc('get_creative_user_access', { p_user: selected }).abortSignal(signal);
      if (error?.code === 'PGRST202') return [] as DbUserAccess[];
      if (error) throw error;
      return (data ?? []) as DbUserAccess[];
    },
  });

  const change = useMutation({
    mutationFn: async ({ code, allowed, dbSync }: { code: AccessVariableCode; allowed: boolean | null; dbSync: boolean }) => {
      setLocalUserOverride(selected, code, allowed);
      if (dbSync && (code === 'creative.view' || code === 'creative.edit' || code === 'creative.tasks.remove')) {
        const { error } = await supabase.rpc('set_creative_user_access', { p_user: selected, p_code: code, p_allowed: allowed });
        if (error && error.code !== 'PGRST202') throw error;
      }
    },
    onMutate: () => setNotice(''),
    onSuccess: async () => {
      setTick(t => t + 1);
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: ['creative', userId, 'team'] }),
      ]);
      setNotice('Saklar izin pengguna berhasil disimpan.');
    },
  });

  const byCode = new Map(access.data?.map(row => [row.code, row]));
  const locked = member?.role_code === 'owner' || access.data?.some(row => row.protected_admin);
  const localOverrides = selected ? (getLocalUserOverrides()[selected] ?? {}) : {};

  return (
    <section className="creative-access-card space-y-4" aria-labelledby="creative-access-switches">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="creative-access-switches" className="text-base font-bold">Saklar Izin Pengguna (Per-User Access Control)</h2>
          <p className="text-sm text-slate-600">
            Pilih akun anggota tim untuk mengaktifkan atau menonaktifkan izin kerja secara spesifik (ON/OFF).
          </p>
        </div>
        <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-bold text-teal-800">
          {accessVariables.length} Variabel Kontrol Akses
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[260px] flex-1 max-w-md space-y-1 text-sm font-semibold">
          <span>Pengguna Creative / Workspace</span>
          <select
            className={field}
            value={member?.id ?? ''}
            disabled={change.isPending}
            onChange={event => {
              setSelected(event.target.value);
              setNotice('');
              change.reset();
            }}
          >
            <option value="">Pilih pengguna untuk diatur…</option>
            {team.data?.map(person => (
              <option key={person.id} value={person.id}>
                {person.full_name} · @{person.username} ({person.role_name ?? 'Tanpa role'})
              </option>
            ))}
          </select>
        </label>
        {member && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs">
            <span className="block text-slate-500">Role aktif pengguna:</span>
            <strong className="text-slate-900">{member.role_name ?? 'Tanpa role'}</strong>
          </div>
        )}
      </div>

      {team.isPending || (member && access.isPending) ? <p role="status" className="text-sm text-slate-600">Memuat izin akun…</p> : null}
      {(team.error || access.error || change.error) && <p role="alert" className="text-sm text-red-700">{errorText(team.error ?? access.error ?? change.error)}</p>}
      {notice && <p role="status" className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">{notice}</p>}
      {locked && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">
          Saklar akun Owner/Administrator dikunci selalu aktif (ON) untuk menjaga keamanan kendali utama sistem.
        </p>
      )}

      {member && access.isSuccess && (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-4" aria-busy={change.isPending}>
          {accessVariables.map(({ code, label, category, description, dbSync }) => {
            const dbRow = byCode.get(code as DbUserAccess['code']);
            const roleDefault = dbRow
              ? dbRow.role_allowed
              : memberRole
              ? defaultRoleHasCapability(memberRole, code)
              : false;
            const localOverride = localOverrides[code];
            const overrideValue = dbRow && dbRow.override_allowed !== null
              ? dbRow.override_allowed
              : typeof localOverride === 'boolean'
              ? localOverride
              : null;

            const viewAllowed = (() => {
              const viewDb = byCode.get('creative.view');
              if (viewDb) return viewDb.allowed;
              const viewLocal = localOverrides['creative.view'];
              return typeof viewLocal === 'boolean' ? viewLocal : (memberRole ? defaultRoleHasCapability(memberRole, 'creative.view') : true);
            })();

            const editAllowed = (() => {
              const editDb = byCode.get('creative.edit');
              if (editDb) return editDb.allowed;
              const editLocal = localOverrides['creative.edit'];
              return typeof editLocal === 'boolean' ? editLocal : (memberRole ? defaultRoleHasCapability(memberRole, 'creative.edit') : false);
            })();

            const rawAllowed = locked ? true : overrideValue !== null ? overrideValue : (dbRow ? dbRow.allowed : roleDefault);
            const prerequisite = code.startsWith('creative.') && code !== 'creative.view' && !viewAllowed
              ? 'Lihat Creative Dashboard'
              : code === 'creative.tasks.remove' && !editAllowed
              ? 'Kelola Tugas & Produksi Konten'
              : null;
            const effectiveAllowed = locked ? true : prerequisite ? false : rawAllowed;

            return (
              <li key={code} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{label}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {category}
                    </span>
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
                      {code}
                    </code>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{description}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {prerequisite
                      ? `Prasyarat: Aktifkan "${prerequisite}" terlebih dahulu.`
                      : overrideValue === null
                      ? 'Status: Mengikuti role'
                      : 'Status: Izin khusus akun (Override)'}
                    {' · Bawaan role: '}
                    <strong>{roleDefault ? 'ON' : 'OFF'}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {overrideValue !== null && !locked && (
                    <button
                      type="button"
                      className={`${button} !px-2.5 !py-1 !text-xs`}
                      disabled={change.isPending}
                      aria-label={'Kembalikan ' + label + ' ke role'}
                      onClick={() => change.mutate({ code, allowed: null, dbSync })}
                    >
                      Ikuti role
                    </button>
                  )}
                  <button
                    type="button"
                    role="switch"
                    aria-label={label}
                    aria-checked={effectiveAllowed}
                    disabled={Boolean(prerequisite || locked || change.isPending || code === 'launch.admin')}
                    className={
                      'inline-flex min-h-9 min-w-20 items-center justify-between gap-2 rounded-full px-3 text-xs font-bold transition-colors disabled:opacity-50 ' +
                      (effectiveAllowed ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-800')
                    }
                    onClick={() => change.mutate({ code, allowed: !effectiveAllowed, dbSync })}
                  >
                    <span
                      aria-hidden="true"
                      className={'h-3.5 w-3.5 shrink-0 rounded-full transition-transform ' + (effectiveAllowed ? 'order-2 bg-white' : 'bg-slate-500')}
                    />
                    <span aria-hidden="true">{effectiveAllowed ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function CreativeAccess({ permissions, userName, userId }: { permissions: string[]; userName: string; userId: string }) {
  const client = useQueryClient();
  const access = workspaceAccess(permissions);
  const isOwner = access.admin;
  const roles = useQuery({ queryKey: ['launch-roles'], queryFn: listRoles, enabled: isOwner });
  const [, setMatrixVersion] = useState(0);
  const [matrixNotice, setMatrixNotice] = useState('');
  const [demoNotice, setDemoNotice] = useState('');

  const purgeDemoMutation = useMutation({
    mutationFn: () => purgeCreativeDemoData(),
    onSuccess: (res) => {
      setDemoNotice(`Pembersihan selesai (${res.removedTasks} tugas, ${res.removedIdeas} ide, ${res.removedCampaigns} kampanye demo dibersihkan).`);
      void client.invalidateQueries({ queryKey: ['creative'] });
    },
  });

  const toggleRolePermission = async (role: RoleOption, variable: typeof accessVariables[number], nextAllowed: boolean) => {
    if (role.code === 'owner') return;
    setLocalRoleMatrixOverride(role.code, variable.code, nextAllowed);
    setMatrixVersion(v => v + 1);
    setMatrixNotice(`Izin "${variable.shortLabel}" untuk role "${role.name}" diubah menjadi ${nextAllowed ? 'ON' : 'OFF'}.`);
    void client.invalidateQueries({ queryKey: ['launch-roles'] });
  };

  const resetRoleMatrix = () => {
    clearLocalRoleMatrixOverrides();
    setMatrixVersion(v => v + 1);
    setMatrixNotice('Matriks izin role dikembalikan ke pengaturan standar bawaan.');
    void client.invalidateQueries({ queryKey: ['launch-roles'] });
  };

  const myCapabilities = accessVariables.map(v => {
    let allowed = false;
    if (isOwner) allowed = true;
    else if (v.code === 'creative.view') allowed = access.creative;
    else if (v.code === 'creative.tasks.remove') allowed = access.creativeRemove;
    else if (v.code === 'launch.view') allowed = access.launch;
    else if (v.code === 'launch.admin') allowed = access.admin;
    else allowed = access.creativeEdit;
    return { ...v, allowed };
  });

  return (
    <div className="space-y-4">
      <section className="creative-access-card" aria-labelledby="creative-my-access">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="creative-color-icon" data-color="mint"><ShieldCheck size={17} aria-hidden="true" /></span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="creative-my-access" className="font-bold">Status Akses Akun Saya</h2>
                {isOwner && (
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-violet-800">
                    Owner Role
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">{userName}</p>
            </div>
          </div>

          {isOwner && (
            <button
              type="button"
              disabled={purgeDemoMutation.isPending}
              className={`${button} !text-rose-700 hover:!bg-rose-50 inline-flex items-center gap-1.5`}
              onClick={() => {
                if (confirm('Bersihkan seluruh tugas, ide, kampanye, dan akun [DEMO] / dummy agar ruang kerja siap produksi?')) {
                  purgeDemoMutation.mutate();
                }
              }}
            >
              <Sparkles size={15} />
              <span>{purgeDemoMutation.isPending ? 'Membersihkan…' : 'Bersihkan Semua Data Demo / Dummy'}</span>
            </button>
          )}
        </div>

        {demoNotice && (
          <p role="status" className="mb-4 rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-sm font-semibold text-teal-800">
            {demoNotice}
          </p>
        )}

        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {myCapabilities.map(({ code, shortLabel, allowed }) => (
            <li key={code} className="creative-access-chip justify-between" data-allowed={allowed}>
              <span className="inline-flex items-center gap-1.5 truncate">
                {allowed ? <Check size={15} aria-hidden="true" /> : <Minus size={15} aria-hidden="true" />}
                <span className="truncate">{shortLabel}</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase opacity-80">{allowed ? 'ON' : 'OFF'}</span>
            </li>
          ))}
        </ul>
      </section>

      {isOwner ? (
        <>
          <AccessSwitches userId={userId} roles={roles.data ?? []} />

          <section className="creative-access-card space-y-3" aria-labelledby="creative-role-matrix">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="creative-role-matrix" className="text-base font-bold">Matriks Role Creative &amp; Saklar Kontrol Akses</h2>
                <p className="text-sm text-slate-600">
                  Klik saklar <strong>ON / OFF</strong> pada tabel di bawah untuk mengatur izin bawaan setiap role di seluruh variabel akses Creative Hub.
                </p>
              </div>
              <button
                type="button"
                className={`${button} !text-xs inline-flex items-center gap-1.5`}
                onClick={resetRoleMatrix}
              >
                <RotateCcw size={13} />
                <span>Reset Matriks ke Bawaan</span>
              </button>
            </div>

            {matrixNotice && (
              <p role="status" className="rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-800">
                {matrixNotice}
              </p>
            )}

            {roles.isPending && <p role="status" className="text-sm text-slate-600">Memuat matriks role…</p>}
            {roles.isError && <p role="alert" className="text-sm text-rose-700">Daftar role gagal dimuat.</p>}

            {roles.data && (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="creative-table w-full text-xs">
                  <thead>
                    <tr>
                      <th scope="col" className="min-w-[190px]">Role Pengguna</th>
                      {accessVariables.map(item => (
                        <th scope="col" key={item.code} className="min-w-[112px] text-center" title={item.description}>
                          <span className="block font-bold">{item.shortLabel}</span>
                          <span className="block font-mono text-[10px] font-normal opacity-75">{item.code}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roles.data.map(role => {
                      const isOwnerRole = role.code === 'owner';
                      return (
                        <tr key={role.code}>
                          <th scope="row" className="align-middle">
                            <span className="block font-bold text-slate-900">{role.name}</span>
                            <span className="block font-normal text-[11px] text-slate-500">{role.description}</span>
                          </th>
                          {accessVariables.map(variable => {
                            const allowed = defaultRoleHasCapability(role, variable.code);
                            const lockedCell = isOwnerRole || variable.code === 'launch.admin';
                            return (
                              <td key={variable.code} className="text-center align-middle">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-label={`${role.name} - ${variable.label}`}
                                  aria-checked={allowed}
                                  disabled={lockedCell}
                                  onClick={() => void toggleRolePermission(role, variable, !allowed)}
                                  className={
                                    'mx-auto inline-flex min-h-8 min-w-[68px] items-center justify-between gap-1.5 rounded-full px-2.5 text-[11px] font-extrabold transition-colors disabled:opacity-60 ' +
                                    (allowed
                                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300')
                                  }
                                >
                                  <span
                                    aria-hidden="true"
                                    className={
                                      'h-3 w-3 shrink-0 rounded-full ' +
                                      (allowed ? 'order-2 bg-white' : 'bg-slate-500')
                                    }
                                  />
                                  <span>{allowed ? 'ON' : 'OFF'}</span>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <SettingsPage variant="creative" />
        </>
      ) : (
        <section className="creative-access-card">
          <p className="text-sm text-slate-600">
            Menu <strong>Pengaturan Sistem — Pengguna &amp; Hak Akses</strong> serta <strong>Matriks Role</strong> hanya tersedia khusus untuk akun dengan <strong>Role Owner</strong>.
          </p>
        </section>
      )}
    </div>
  );
}
