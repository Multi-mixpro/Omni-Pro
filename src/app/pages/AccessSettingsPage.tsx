import React from 'react';
import { useAuth } from '@/core/auth/AuthProvider';

export const AccessSettingsPage: React.FC = () => {
  const { users, isOwner, updateUserPermissions, updateUserActive, addUser } = useAuth();

  if (!isOwner) {
    return (
      <div style={{ textAlign: 'center', maxWidth: '560px', margin: '90px auto' }}>
        <div style={{ fontSize: '52px' }}>🔒</div>
        <h1 className="h1-sim">Akses khusus Owner</h1>
        <p className="p-sim">Pengguna aktif tidak memiliki izin membuka halaman ini.</p>
      </div>
    );
  }

  const P = [
    ['create', 'MEMBUAT PERINTAH'],
    ['monitor', 'MONITORING SELURUH TASK'],
    ['brief', 'MENGUBAH BRIEF'],
    ['supplier', 'KELOLA SUPPLIER'],
    ['hpp', 'INPUT HPP'],
    ['sample', 'KELOLA SAMPLING'],
    ['size', 'KELOLA SIZE CHART'],
    ['approve', 'APPROVAL FINAL'],
    ['access', 'KELOLA AKSES'],
  ] as const;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="hero-sim">
        <div>
          <div className="eye-sim">Role-based access control</div>
          <h1 className="h1-sim">Pengaturan Akses Pengguna</h1>
          <p className="p-sim" style={{ maxWidth: '780px' }}>
            Owner menentukan siapa yang dapat membuat perintah kerja. Perintah dari pengguna berizin otomatis sinkron ke Kelola & Pantau. Monitoring seluruh task tetap khusus Owner.
          </p>
        </div>
        <div className="actions-sim">
          <button
            className="btn-sim primary"
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
      <div className="notice-sim warn">
        <span>⚠</span>
        <div>
          <b>Rekomendasi:</b> izin membuat perintah hanya diberikan kepada Owner atau koordinator. Tim produksi fokus memperbarui pekerjaan yang ditugaskan.
        </div>
      </div>

      {/* Table Wrap matching HTML simulation perfectly */}
      <div className="card-sim" style={{ marginTop: '15px' }}>
        <div className="tablewrap-sim">
          <table className="table-sim">
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>PENGGUNA</th>
                {P.map((x) => (
                  <th key={x[0]} style={{ textAlign: 'center' }}>{x[1]}</th>
                ))}
                <th style={{ textAlign: 'center' }}>AKTIF</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="product-sim">
                      <div className="av-sim" style={{ width: '37px', height: '37px', borderRadius: '10px', fontSize: '11px' }}>
                        {u.ini}
                      </div>
                      <div>
                        <b style={{ fontSize: '12px', color: 'var(--txt)' }}>{u.name}</b>
                        <small style={{ fontSize: '10px', color: 'var(--mut)' }}>{u.role} • {u.title}</small>
                      </div>
                    </div>
                  </td>
                  {P.map((x) => (
                    <td key={x[0]} style={{ textAlign: 'center' }}>
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
                  <td style={{ textAlign: 'center' }}>
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
