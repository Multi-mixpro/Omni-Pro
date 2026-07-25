import React from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-4 font-sans">
      {/* Hero Section */}
      <div className="hero-sim">
        <div>
          <div className="eye-sim">Pusat operasional launching</div>
          <h1 className="h1-sim">Selamat datang, {currentUser.name.split(' ')[0]}</h1>
          <p className="p-sim" style={{ maxWidth: '780px' }}>
            Kelola peluncuran artikel GG Supply dan GUDSKUY melalui workflow yang terukur, terdokumentasi, dan tersinkron antara Owner, riset, sourcing, produksi, HPP, sampling, size chart, serta approval artikel final.
          </p>
        </div>
        <div className="actions-sim">
          {currentUser.p.create && (
            <button className="btn-sim primary" onClick={() => navigate('/app/launch/work-orders/new')}>
              ＋ Buat Perintah Kerja
            </button>
          )}
          <button className="btn-sim" onClick={() => navigate('/app/monitor')}>
            Lihat Monitoring
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid-sim kpis-sim">
        <div className="card-sim kpi-sim">
          <div className="kicon-sim ko-sim">▣</div>
          <div>
            <div className="kv-sim">3</div>
            <div className="kl-sim">Task Aktif</div>
          </div>
        </div>
        <div className="card-sim kpi-sim">
          <div className="kicon-sim kg-sim">✓</div>
          <div>
            <div className="kv-sim">0</div>
            <div className="kl-sim">Artikel Final</div>
          </div>
        </div>
        <div className="card-sim kpi-sim">
          <div className="kicon-sim ky-sim">!</div>
          <div>
            <div className="kv-sim">0</div>
            <div className="kl-sim">Perlu Perhatian</div>
          </div>
        </div>
        <div className="card-sim kpi-sim">
          <div className="kicon-sim kp-sim">↗</div>
          <div>
            <div className="kv-sim">34%</div>
            <div className="kl-sim">Kesiapan Rata-rata</div>
          </div>
        </div>
      </div>

      {/* Two Grids */}
      <div className="grid-sim two-sim" style={{ marginTop: '15px' }}>
        {/* Card 1: Progress Launching */}
        <div className="card-sim">
          <div className="chead-sim">
            <div>
              <h2 className="h2-sim">Progress Launching</h2>
              <p className="p-sim">Rangkuman kesiapan dua perusahaan.</p>
            </div>
            <span className="status-sim doing-sim">Berjalan</span>
          </div>
          <div>
            <div className="prow-sim">
              <label>GG Supply</label>
              <div className="bar-sim" style={{ height: '8px', background: 'var(--card2)', borderRadius: '999px' }}>
                <span style={{ width: '44%', height: '100%', display: 'block', background: 'linear-gradient(90deg, var(--orange), #ffb777)' }}></span>
              </div>
              <b>44%</b>
            </div>
            <div className="prow-sim">
              <label>GUDSKUY</label>
              <div className="bar-sim" style={{ height: '8px', background: 'var(--card2)', borderRadius: '999px' }}>
                <span style={{ width: '13%', height: '100%', display: 'block', background: 'linear-gradient(90deg, var(--orange), #ffb777)' }}></span>
              </div>
              <b>13%</b>
            </div>
            <div className="prow-sim">
              <label>Dokumentasi</label>
              <div className="bar-sim" style={{ height: '8px', background: 'var(--card2)', borderRadius: '999px' }}>
                <span style={{ width: '42%', height: '100%', display: 'block', background: 'linear-gradient(90deg, var(--orange), #ffb777)' }}></span>
              </div>
              <b>42%</b>
            </div>
            <div className="prow-sim">
              <label>Siap katalog</label>
              <div className="bar-sim" style={{ height: '8px', background: 'var(--card2)', borderRadius: '999px' }}>
                <span style={{ width: '16%', height: '100%', display: 'block', background: 'linear-gradient(90deg, var(--orange), #ffb777)' }}></span>
              </div>
              <b>16%</b>
            </div>
          </div>
        </div>

        {/* Card 2: Fokus Pengguna Aktif */}
        <div className="card-sim">
          <div className="chead-sim">
            <div>
              <h2 className="h2-sim">Fokus Pengguna Aktif</h2>
              <p className="p-sim">Task terdekat sesuai penugasan.</p>
            </div>
          </div>
          <div className="pipe-sim">
            <div className="pitem-sim" onClick={() => navigate('/app/launch/work-orders/o1')} style={{ cursor: 'pointer' }}>
              <div className="pnum-sim">50%</div>
              <div>
                <b>Windbreaker Polos Kombinasi</b>
                <p>Fix Sampel • Yadi</p>
              </div>
              <span className="status-sim doing-sim">Dikerjakan</span>
            </div>

            <div className="pitem-sim" onClick={() => navigate('/app/launch/work-orders/o2')} style={{ cursor: 'pointer' }}>
              <div className="pnum-sim">13%</div>
              <div>
                <b>Varsity Classic Jade</b>
                <p>Riset Bahan • Dodi Awaludin</p>
              </div>
              <span className="status-sim doing-sim">Dikerjakan</span>
            </div>

            <div className="pitem-sim" onClick={() => navigate('/app/launch/work-orders/o3')} style={{ cursor: 'pointer' }}>
              <div className="pnum-sim">38%</div>
              <div>
                <b>Polo Shirt Corporate</b>
                <p>Fix Warna • Dodi Awaludin</p>
              </div>
              <span className="status-sim review-sim">Review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
