import React from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      {/* Hero Section */}
      <div className="hero">
        <div>
          <div className="eye">Pusat operasional launching</div>
          <h1>Selamat datang, {currentUser.name.split(' ')[0]}</h1>
          <p>
            Kelola peluncuran artikel GG Supply dan GUDSKUY melalui workflow yang terukur, terdokumentasi, dan tersinkron antara Owner, riset, sourcing, produksi, HPP, sampling, size chart, serta approval artikel final.
          </p>
        </div>
        <div className="actions">
          {currentUser.p.create && (
            <button className="btn primary" onClick={() => navigate('/app/launch/work-orders/new')}>
              ＋ Buat Perintah Kerja
            </button>
          )}
          <button className="btn" onClick={() => navigate('/app/monitor')}>
            Lihat Monitoring
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid kpis">
        <div className="card kpi">
          <div className="kicon ko">▣</div>
          <div>
            <div className="kv">3</div>
            <div className="kl">Task Aktif</div>
          </div>
        </div>
        <div className="card kpi">
          <div className="kicon kg">✓</div>
          <div>
            <div className="kv">0</div>
            <div className="kl">Artikel Final</div>
          </div>
        </div>
        <div className="card kpi">
          <div className="kicon ky">!</div>
          <div>
            <div className="kv">0</div>
            <div className="kl">Perlu Perhatian</div>
          </div>
        </div>
        <div className="card kpi">
          <div className="kicon kp">↗</div>
          <div>
            <div className="kv">34%</div>
            <div className="kl">Kesiapan Rata-rata</div>
          </div>
        </div>
      </div>

      {/* Two Grids */}
      <div className="grid two" style={{ marginTop: '15px' }}>
        {/* Card 1: Progress Launching */}
        <div className="card">
          <div className="chead">
            <div>
              <h2>Progress Launching</h2>
              <p>Rangkuman kesiapan dua perusahaan.</p>
            </div>
            <span className="status doing">Berjalan</span>
          </div>
          <div>
            <div className="prow">
              <label>GG Supply</label>
              <div className="bar-sim" style={{ height: '8px', background: 'var(--card2)', borderRadius: '999px' }}>
                <span style={{ width: '44%', height: '100%', display: 'block', background: 'linear-gradient(90deg, var(--orange), #ffb777)' }}></span>
              </div>
              <b>44%</b>
            </div>
            <div className="prow">
              <label>GUDSKUY</label>
              <div className="bar-sim" style={{ height: '8px', background: 'var(--card2)', borderRadius: '999px' }}>
                <span style={{ width: '13%', height: '100%', display: 'block', background: 'linear-gradient(90deg, var(--orange), #ffb777)' }}></span>
              </div>
              <b>13%</b>
            </div>
            <div className="prow">
              <label>Dokumentasi</label>
              <div className="bar-sim" style={{ height: '8px', background: 'var(--card2)', borderRadius: '999px' }}>
                <span style={{ width: '42%', height: '100%', display: 'block', background: 'linear-gradient(90deg, var(--orange), #ffb777)' }}></span>
              </div>
              <b>42%</b>
            </div>
            <div className="prow">
              <label>Siap katalog</label>
              <div className="bar-sim" style={{ height: '8px', background: 'var(--card2)', borderRadius: '999px' }}>
                <span style={{ width: '16%', height: '100%', display: 'block', background: 'linear-gradient(90deg, var(--orange), #ffb777)' }}></span>
              </div>
              <b>16%</b>
            </div>
          </div>
        </div>

        {/* Card 2: Fokus Pengguna Aktif */}
        <div className="card">
          <div className="chead">
            <div>
              <h2>Fokus Pengguna Aktif</h2>
              <p>Task terdekat sesuai penugasan.</p>
            </div>
          </div>
          <div className="pipe">
            <div className="pitem" onClick={() => navigate('/app/launch/work-orders/o1')} style={{ cursor: 'pointer' }}>
              <div className="pnum">50%</div>
              <div>
                <b>Windbreaker Polos Kombinasi</b>
                <p>Fix Sampel • Yadi</p>
              </div>
              <span className="status doing">Dikerjakan</span>
            </div>

            <div className="pitem" onClick={() => navigate('/app/launch/work-orders/o2')} style={{ cursor: 'pointer' }}>
              <div className="pnum">13%</div>
              <div>
                <b>Varsity Classic Jade</b>
                <p>Riset Bahan • Dodi Awaludin</p>
              </div>
              <span className="status doing">Dikerjakan</span>
            </div>

            <div className="pitem" onClick={() => navigate('/app/launch/work-orders/o3')} style={{ cursor: 'pointer' }}>
              <div className="pnum">38%</div>
              <div>
                <b>Polo Shirt Corporate</b>
                <p>Fix Warna • Dodi Awaludin</p>
              </div>
              <span className="status review">Review</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
