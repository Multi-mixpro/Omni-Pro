import React, { useState } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { UserPlus, ShieldAlert } from 'lucide-react';

export const AccessSettingsPage: React.FC = () => {
  const { users, isOwner, updateUserPermissions, updateUserActive, addUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Tim Kreatif');

  if (!isOwner) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto mt-12 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Akses Khusus Owner</h2>
        <p className="text-xs text-slate-400">
          Pengguna aktif tidak memiliki izin untuk mengelola matriks hak akses pengguna.
        </p>
      </div>
    );
  }

  const permissionsList = [
    { key: 'create', label: 'Membuat Perintah' },
    { key: 'monitor', label: 'Monitoring Task' },
    { key: 'brief', label: 'Mengubah Brief' },
    { key: 'supplier', label: 'Kelola Supplier' },
    { key: 'hpp', label: 'Input HPP' },
    { key: 'sample', label: 'Kelola Sampling' },
    { key: 'size', label: 'Kelola Size Chart' },
    { key: 'approve', label: 'Approval Final' },
    { key: 'access', label: 'Kelola Akses' },
  ] as const;

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    addUser(newName, newRole);
    setNewName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
            ROLE-BASED ACCESS CONTROL (RBAC)
          </span>
          <h1 className="text-2xl font-black text-white mt-1">Pengaturan Akses Pengguna</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Owner menentukan siapa yang dapat membuat perintah kerja dan mengelola tahap produksi. Monitoring seluruh task tetap khusus Owner.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center space-x-2 shrink-0 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Warning Notice */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <strong className="font-bold">Rekomendasi Keamanan:</strong> Izin membuat perintah sebaiknya hanya diberikan kepada Owner atau Product Lead. Tim produksi fokus memperbarui pekerjaan yang ditugaskan.
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Pengguna</th>
                {permissionsList.map((p) => (
                  <th key={p.key} className="p-4 text-center">
                    {p.label}
                  </th>
                ))}
                <th className="p-4 text-center">Status Aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 font-bold text-white text-xs flex items-center justify-center">
                        {u.ini}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{u.name}</h4>
                        <p className="text-[10px] text-slate-400">
                          {u.role} • {u.title}
                        </p>
                      </div>
                    </div>
                  </td>

                  {permissionsList.map((p) => (
                    <td key={p.key} className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={u.p[p.key]}
                        disabled={u.id === 'u1' && (p.key === 'monitor' || p.key === 'access')}
                        onChange={(e) => updateUserPermissions(u.id, p.key, e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-orange-500 focus:ring-orange-500 cursor-pointer disabled:opacity-50"
                      />
                    </td>
                  ))}

                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={u.active}
                      disabled={u.id === 'u1'}
                      onChange={(e) => updateUserActive(u.id, e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Tambah Pengguna Baru</h3>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Hendra Wijaya"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Peran / Jabatan</label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
