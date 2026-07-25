import React from 'react';
import { useAuth } from '@/core/auth/AuthProvider';

export const AccessSettingsPage: React.FC = () => {
  const { users, isOwner, updateUserPermissions, updateUserActive, addUser } = useAuth();

  if (!isOwner) {
    return (
      <div className="deny">
        <div style={{ fontSize: '52px' }}>🔒</div>
        <h1>Akses khusus Owner</h1>
        <p>Pengguna aktif tidak memiliki izin membuka halaman ini.</p>
      </div>
    );
  }

  const P = [
    ['create', 'Membuat Perintah'],
    ['monitor', 'Monitoring Seluruh Task'],
    ['brief', 'Mengubah Brief'],
    ['supplier', 'Kelola Supplier'],
    ['hpp', 'Input HPP'],
    ['sample', 'Kelola Sampling'],
    ['size', 'Kelola Size Chart'],
    ['approve', 'Approval Final'],
    ['access', 'Kelola Akses'],
  ] as const;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="hero">
        <div>
          <div className="eye">Role-based access control</div>
          <h1>Pengaturan Akses Pengguna</h1>
          <p>
            Owner menentukan siapa yang dapat membuat perintah kerja. Perintah dari pengguna berizin otomatis sinkron ke Kelola & Pantau. Monitoring seluruh task tetap khusus Owner.
          </p>
        </div>
        <div className="actions">
          <button
            className="btn primary"
            onClick={() => {
              const name = prompt('Nama pengguna:');
              if (name) addUser(name, 'Tim Kreatif');
            }}
          >
            ＋ Tambah Pengguna
          </button>
        </div>
      </div>

      {/* Notice */}
      <div className="notice warn">
        <span>⚠</span>
        <div>
          <b>Rekomendasi:</b> izin membuat perintah hanya diberikan kepada Owner atau koordinator. Tim produksi fokus memperbarui pekerjaan yang ditugaskan.
        </div>
      </div>

      {/* Table Wrap matching HTML simulation perfectly */}
      <div className="card" style={{ marginTop: '15px' }}>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Pengguna</th>
                {P.map((x) => (
                  <th key={x[0]} style={{ textTransform: 'uppercase' }}>{x[1]}</th>
                ))}
                <th>Aktif</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="product">
                      <div className="mav" style={{ width: '37px', height: '37px', borderRadius: '10px', fontSize: '11px' }}>
                        {u.ini}
                      </div>
                      <div>
                        <b>{u.name}</b>
                        <small>{u.role} • {u.title}</small>
                      </div>
                    </div>
                  </td>
                  {P.map((x) => (
                    <td key={x[0]}>
                      <label className="toggle-sim">
                        <input
                          type="checkbox"
                          checked={u.p[x[0]]}
                          disabled={u.id === 'u1' && (x[0] === 'monitor' || x[0] === 'access')}
                          onChange={(e) => updateUserPermissions(u.id, x[0], e.target.checked)}
                        />
                        <span></span>
                      </label>
                    </td>
                  ))}
                  <td>
                    <label className="toggle-sim">
                      <input
                        type="checkbox"
                        checked={u.active}
                        disabled={u.id === 'u1'}
                        onChange={(e) => updateUserActive(u.id, e.target.checked)}
                      />
                      <span></span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
