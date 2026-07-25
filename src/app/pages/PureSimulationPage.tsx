import React, { useEffect } from 'react';

export const PureSimulationPage: React.FC = () => {
  useEffect(() => {
    // Inject exact script from HTML file
    const STAGES = [
      ['brief', 'Brief Artikel'],
      ['material', 'Riset Bahan'],
      ['supplier', 'Fix Supplier'],
      ['color', 'Fix Warna'],
      ['sample', 'Fix Sampel'],
      ['hpp', 'Fix HPP'],
      ['size', 'Size Chart'],
      ['final', 'Artikel Final'],
    ];

    const DEF = {
      current: 'u1',
      users: [
        { id: 'u1', name: 'Gugun Gunawan', ini: 'GG', role: 'Owner', title: 'Strategi, Sistem & Pengembangan Bisnis', active: true, p: { create: true, monitor: true, brief: true, supplier: true, hpp: true, sample: true, size: true, approve: true, access: true } },
        { id: 'u2', name: 'Dodi Awaludin', ini: 'DA', role: 'Product Lead', title: 'Finalisasi Artikel & Relasi Mitra', active: true, p: { create: true, monitor: false, brief: true, supplier: true, hpp: true, sample: true, size: false, approve: false, access: false } },
        { id: 'u3', name: 'Yadi', ini: 'YD', role: 'Production', title: 'Sampling, Pola & Standardisasi', active: true, p: { create: false, monitor: false, brief: false, supplier: false, hpp: true, sample: true, size: true, approve: false, access: false } },
        { id: 'u4', name: 'Syaikhu', ini: 'SY', role: 'Sourcing & Admin', title: 'Supplier, Finishing & Dokumentasi', active: true, p: { create: false, monitor: false, brief: false, supplier: true, hpp: true, sample: true, size: true, approve: false, access: false } },
      ],
      orders: [
        {
          id: 'o1', code: 'GS-WB-001', brand: 'GG Supply', name: 'Windbreaker Polos Kombinasi', colors: ['Petrol/Jade', 'Hitam/Putih'], photo: '', ref: 'https://example.com/windbreaker', priority: 'Tinggi', due: '2026-08-06', created: '2026-07-22', by: 'u1', pic: 'u2', support: ['u3', 'u4'],
          brief: 'Finalisasi artikel windbreaker polos untuk stok dan custom. Visor hood wajib, zipper mengikuti warna atas, lengan mengikuti warna bawah.',
          stages: [
            ['brief', 'done', 'u1', 'Brief dan standar visual terkunci.'],
            ['material', 'done', 'u2', 'Micro despo NS menjadi kandidat utama.'],
            ['supplier', 'done', 'u4', 'Dua supplier dibandingkan.'],
            ['color', 'done', 'u2', 'Dua kombinasi awal disetujui.'],
            ['sample', 'doing', 'u3', 'Revisi panjang badan dan visor.'],
            ['hpp', 'todo', 'u2', ''],
            ['size', 'todo', 'u3', ''],
            ['final', 'todo', 'u1', ''],
          ].map((x) => ({ id: x[0], status: x[1], who: x[2], note: x[3] })),
          hpp: { fabricPrice: 32000, consumption: 2.2, accessories: 26000, cutting: 8000, sewing: 42000, decoration: 0, finishing: 6000, packaging: 5000, transport: 4000, rejectPct: 3, overheadPct: 8, marginPct: 35, final: false },
          samples: [{ v: 'Sampel 01', date: '2026-07-24', status: 'Revisi', note: 'Badan masih buntet; visor kurang terlihat.' }, { v: 'Sampel 02', date: '2026-07-27', status: 'Proses', note: 'Tambah panjang badan 15% dan perbaiki hood.' }],
          size: [{ s: 'S', chest: 54, length: 68, sleeve: 58, shoulder: 47 }, { s: 'M', chest: 56, length: 70, sleeve: 59, shoulder: 49 }, { s: 'L', chest: 58, length: 72, sleeve: 60, shoulder: 51 }, { s: 'XL', chest: 60, length: 74, sleeve: 61, shoulder: 53 }],
        },
        {
          id: 'o2', code: 'GD-VR-001', brand: 'GUDSKUY', name: 'Varsity Classic Jade', colors: ['Jade/Obsidian'], photo: '', ref: 'https://example.com/varsity', priority: 'Tinggi', due: '2026-08-12', created: '2026-07-23', by: 'u1', pic: 'u3', support: ['u2', 'u4'],
          brief: 'Produk pembuka GUDSKUY. Pola raglan, piping putih, kancing putih 6, rib warna badan dengan 2 garis putih.',
          stages: [
            ['brief', 'done', 'u1', 'Identitas produk dan detail visual terkunci.'],
            ['material', 'doing', 'u2', 'Uji Colombia WP dan alternatif bahan doff.'],
            ['supplier', 'doing', 'u4', 'Mengumpulkan swatch dan aksesori.'],
            ['color', 'todo', 'u2', ''],
            ['sample', 'todo', 'u3', ''],
            ['hpp', 'todo', 'u2', ''],
            ['size', 'todo', 'u3', ''],
            ['final', 'todo', 'u1', ''],
          ].map((x) => ({ id: x[0], status: x[1], who: x[2], note: x[3] })),
          hpp: { fabricPrice: 38000, consumption: 2.4, accessories: 42000, cutting: 9000, sewing: 50000, decoration: 18000, finishing: 7000, packaging: 7000, transport: 5000, rejectPct: 4, overheadPct: 10, marginPct: 45, final: false },
          samples: [],
          size: [{ s: 'S', chest: 55, length: 65, sleeve: 72, shoulder: 0 }, { s: 'M', chest: 57, length: 67, sleeve: 74, shoulder: 0 }, { s: 'L', chest: 59, length: 69, sleeve: 76, shoulder: 0 }, { s: 'XL', chest: 61, length: 71, sleeve: 78, shoulder: 0 }],
        },
        {
          id: 'o3', code: 'GS-PL-001', brand: 'GG Supply', name: 'Polo Shirt Corporate', colors: ['Navy', 'Hitam', 'Putih'], photo: '', ref: '', priority: 'Normal', due: '2026-08-02', created: '2026-07-20', by: 'u2', pic: 'u2', support: ['u3', 'u4'],
          brief: 'Artikel polos dan custom corporate. Prioritas bahan stabil, nyaman, dan mudah dibordir.',
          stages: [
            ['brief', 'done', 'u2', 'Target corporate dan custom.'],
            ['material', 'done', 'u2', 'Lacoste CVC kandidat utama.'],
            ['supplier', 'done', 'u4', 'Supplier bahan dan rib tersedia.'],
            ['color', 'review', 'u2', 'Menunggu approval swatch navy.'],
            ['sample', 'doing', 'u3', 'Pembuatan sampel size M.'],
            ['hpp', 'doing', 'u2', 'Harga rib belum final.'],
            ['size', 'todo', 'u3', ''],
            ['final', 'todo', 'u1', ''],
          ].map((x) => ({ id: x[0], status: x[1], who: x[2], note: x[3] })),
          hpp: { fabricPrice: 65000, consumption: 0.75, accessories: 12000, cutting: 5000, sewing: 24000, decoration: 0, finishing: 4000, packaging: 3500, transport: 2500, rejectPct: 3, overheadPct: 8, marginPct: 30, final: false },
          samples: [{ v: 'Sampel 01', date: '2026-07-26', status: 'Proses', note: 'Fokus kerah, placket, dan kestabilan ukuran.' }],
          size: [{ s: 'S', chest: 48, length: 66, sleeve: 20, shoulder: 42 }, { s: 'M', chest: 51, length: 69, sleeve: 21, shoulder: 44 }, { s: 'L', chest: 54, length: 72, sleeve: 22, shoulder: 46 }, { s: 'XL', chest: 57, length: 75, sleeve: 23, shoulder: 48 }],
        },
      ],
      suppliers: [
        { id: 's1', name: 'Mitra Textile A', cat: 'Kain', mat: 'Micro Despo NS', price: 32000, moq: '1 roll', lead: '2–3 hari', spec: 'Petrol, Jade, Black, White', status: 'Approved' },
        { id: 's2', name: 'Sentra Rajut B', cat: 'Kain', mat: 'Lacoste CVC', price: 65000, moq: '25 kg', lead: '3–5 hari', spec: 'Navy, Black, White', status: 'Review' },
        { id: 's3', name: 'Aksesori Prima', cat: 'Aksesori', mat: 'Zipper waterproof & stopper', price: 12500, moq: '100 pcs', lead: '2 hari', spec: 'Custom warna minimum 500 pcs', status: 'Approved' },
        { id: 's4', name: 'Label Karya', cat: 'Packaging', mat: 'Woven label & hangtag', price: 2800, moq: '500 pcs', lead: '7 hari', spec: 'Woven damask + hangtag 2 sisi', status: 'Review' },
      ],
      evals: [{ date: '2026-07-25', type: 'Mingguan', title: 'Fokus finalisasi windbreaker', note: 'Selesaikan revisi visor, panjang badan, dan validasi HPP bahan.' }],
      activity: [
        { at: '2026-07-27 15:20', user: 'u3', text: 'Memperbarui Sampel 02 Windbreaker menjadi proses.' },
        { at: '2026-07-27 11:10', user: 'u4', text: 'Menambahkan supplier zipper waterproof.' },
        { at: '2026-07-26 17:45', user: 'u2', text: 'Memperbarui kandidat bahan Varsity Classic Jade.' },
        { at: '2026-07-25 19:00', user: 'u1', text: 'Membuat evaluasi mingguan.' },
      ],
    };

    let S = load();
    let CF = 'all';
    let SF = 'all';
    let detailId: any = null;

    function cp(x: any) {
      return JSON.parse(JSON.stringify(x));
    }

    function load() {
      try {
        return JSON.parse(localStorage.getItem('ggWorkspaceV2') || '') || cp(DEF);
      } catch (e) {
        return cp(DEF);
      }
    }

    function save() {
      try {
        localStorage.setItem('ggWorkspaceV2', JSON.stringify(S));
      } catch (e) {}
    }

    function me() {
      return S.users.find((x: any) => x.id === S.current) || S.users[0];
    }

    function user(userId: string) {
      return S.users.find((x: any) => x.id === userId) || { name: 'Belum ditentukan', ini: '?', role: '-' };
    }

    function id(p: string) {
      return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    }

    function rp(n: any) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(+n || 0);
    }

    function date(d: any) {
      return d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    }

    function prog(o: any) {
      return Math.round((o.stages.filter((x: any) => x.status === 'done').length / o.stages.length) * 100);
    }

    function stage(o: any) {
      return o.stages.find((x: any) => x.status !== 'done') || o.stages.at(-1);
    }

    function late(o: any) {
      return new Date(o.due + 'T23:59:59') < new Date() && prog(o) < 100;
    }

    function sname(s: any) {
      return ({ todo: 'Belum dimulai', doing: 'Dikerjakan', review: 'Review', done: 'Selesai', blocked: 'Terhambat' } as any)[s] || s;
    }

    function vis() {
      return me().p.monitor ? S.orders : S.orders.filter((o: any) => o.pic === me().id || o.support.includes(me().id) || o.stages.some((s: any) => s.who === me().id));
    }

    function toast(t: string) {
      let e = document.getElementById('toast');
      if (e) {
        e.textContent = t;
        e.classList.add('on');
        setTimeout(() => e?.classList.remove('on'), 2300);
      }
    }

    function activity(t: string) {
      S.activity.unshift({ at: new Date().toISOString().slice(0, 16).replace('T', ' '), user: S.current, text: t });
      S.activity = S.activity.slice(0, 20);
      save();
    }

    (window as any).switchUser = function (v: string) {
      S.current = v;
      save();
      init();
      toast('Mode simulasi: ' + me().name);
    };

    (window as any).sidebar = function (force: any) {
      let e = document.getElementById('side'), o = document.getElementById('overlay'), v = force === undefined ? !e?.classList.contains('open') : force;
      e?.classList.toggle('open', v);
      o?.classList.toggle('on', v);
    };

    (window as any).theme = function () {
      let d = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', d ? 'light' : 'dark');
      try {
        localStorage.setItem('ggTheme', d ? 'light' : 'dark');
      } catch (e) {}
    };

    (window as any).page = function (p: string, b: any) {
      if ((p === 'monitor' && !me().p.monitor) || (p === 'access' && !me().p.access)) {
        toast('Menu ini khusus Owner.');
        return;
      }
      document.querySelectorAll('.page').forEach((x) => x.classList.remove('on'));
      document.getElementById('p-' + p)?.classList.add('on');
      document.querySelectorAll('.nav button').forEach((x) => x.classList.remove('on'));
      if (b) b.classList.add('on');
      let t: any = { dashboard: 'Dashboard', commands: 'Perintah Kerja', monitor: 'Kelola & Pantau', brands: 'GG Supply & GUDSKUY', supplier: 'Supplier & Bahan', hpp: 'Lembar HPP', sample: 'Sampling', size: 'Size Chart', reports: 'Laporan & Evaluasi', access: 'Pengaturan Akses' };
      let pt = document.getElementById('ptitle');
      if (pt) pt.textContent = t[p];
      if (p === 'monitor') renderMonitor();
      if (p === 'access') renderAccess();
      if (p === 'hpp') renderHppPage();
      if (p === 'size') renderSizePage();
      window.scrollTo(0, 0);
      (window as any).sidebar(false);
    };

    function init() {
      let u = document.getElementById('usersel');
      if (u) u.innerHTML = S.users.filter((x: any) => x.active).map((x: any) => `<option value="${x.id}" ${x.id === S.current ? 'selected' : ''}>${x.name} — ${x.role}</option>`).join('');
      let cav = document.getElementById('cav');
      if (cav) cav.textContent = me().ini;
      let wel = document.getElementById('welcome');
      if (wel) wel.textContent = 'Selamat datang, ' + me().name.split(' ')[0];
      perm();
      renderAll();
      let d = new Date();
      d.setDate(d.getDate() + 14);
      let fdue: any = document.getElementById('fdue');
      if (fdue) fdue.value = d.toISOString().slice(0, 10);
    }

    function perm() {
      document.querySelectorAll('.createbtn').forEach((x: any) => (x.style.display = me().p.create ? 'inline-flex' : 'none'));
      document.querySelectorAll('.ownernav').forEach((x: any) => (x.style.display = me().p.monitor || me().p.access ? 'flex' : 'none'));
    }

    function renderAll() {
      renderDashboard();
      renderCommands();
      renderMonitor();
      renderBrands();
      renderSuppliers();
      renderHppPage();
      renderSamples();
      renderSizePage();
      renderReports();
      renderAccess();
      let nc = document.getElementById('ncount');
      if (nc) nc.textContent = vis().length;
    }

    function renderDashboard() {
      let all = S.orders, v = vis(), done = all.filter((x: any) => prog(x) === 100).length, active = v.filter((x: any) => prog(x) < 100).length, l = v.filter(late).length, avg = all.length ? Math.round(all.reduce((a: any, o: any) => a + prog(o), 0) / all.length) : 0;
      let dk = document.getElementById('dashkpi');
      if (dk)
        dk.innerHTML = [
          ['▣', active, 'Task Aktif', 'ko'],
          ['✓', done, 'Artikel Final', 'kg'],
          ['!', l, 'Perlu Perhatian', 'ky'],
          ['↗', avg + '%', 'Kesiapan Rata-rata', 'kp'],
        ]
          .map((x) => `<div class="card kpi"><div class="kicon ${x[3]}">${x[0]}</div><div><div class="kv">${x[1]}</div><div class="kl">${x[2]}</div></div></div>`)
          .join('');

      let sp = all.filter((x: any) => x.brand === 'GG Supply'), gp = all.filter((x: any) => x.brand === 'GUDSKUY'), sa = sp.length ? Math.round(sp.reduce((a: any, o: any) => a + prog(o), 0) / sp.length) : 0, ga = gp.length ? Math.round(gp.reduce((a: any, o: any) => a + prog(o), 0) / gp.length) : 0;
      let lp = document.getElementById('launchprog');
      if (lp)
        lp.innerHTML = [
          ['GG Supply', sa, ''],
          ['GUDSKUY', ga, ''],
          ['Dokumentasi', Math.min(100, avg + 8), ''],
          ['Siap katalog', done ? 100 : Math.max(10, avg - 18), ''],
        ]
          .map((x) => `<div class="prow"><label>${x[0]}</label><div class="bar"><span style="width:${x[1]}%"></span></div><b>${x[1]}%</b></div>`)
          .join('');

      let spct = document.getElementById('sidepct');
      if (spct) spct.textContent = avg + '%';
      let sbar = document.getElementById('sidebar');
      if (sbar) sbar.style.width = avg + '%';

      let td = document.getElementById('today');
      if (td)
        td.innerHTML =
          v
            .filter((x: any) => prog(x) < 100)
            .slice(0, 4)
            .map((o: any) => {
              let s = stage(o);
              return `<div class="pitem" onclick="openDetail('${o.id}')"><div class="pnum">${prog(o)}%</div><div><b>${o.name}</b><p>${STAGES.find((x) => x[0] === s.id)?.[1]} • ${user(s.who).name}</p></div><span class="status ${s.status}">${sname(s.status)}</span></div>`;
            })
            .join('') || '<div class="empty">Tidak ada task aktif.</div>';

      let dp = document.getElementById('dashpipe');
      if (dp)
        dp.innerHTML = v
          .slice(0, 8)
          .map((o: any) => {
            let s = stage(o);
            return `<tr onclick="openDetail('${o.id}')"><td><div class="product"><div class="thumb">${o.photo ? `<img src="${o.photo}">` : '👕'}</div><div><b>${o.name}</b><small>${o.code}</small></div></div></td><td><span class="status ${s.status}">${STAGES.find((x) => x[0] === s.id)?.[1]}</span></td><td>${user(s.who).name}</td><td><div style="display:flex;gap:7px;align-items:center"><div class="bar" style="width:90px"><span style="width:${prog(o)}%"></span></div><b>${prog(o)}%</b></div></td></tr>`;
          })
          .join('');

      let act = document.getElementById('activity');
      if (act)
        act.innerHTML = S.activity
          .slice(0, 5)
          .map((a: any) => `<div class="titem"><b>${user(a.user).name}</b><p>${a.text}<br>${a.at}</p></div>`)
          .join('');
    }

    function renderCommands() {
      let cn = document.getElementById('cmdnotice');
      if (cn) cn.innerHTML = me().p.monitor ? '<span>◉</span><div><b>Mode Owner:</b> seluruh perintah, task lintas tim, bottleneck, dan keterlambatan terlihat di halaman ini.</div>' : `<span>🔒</span><div><b>Ruang kerja pribadi:</b> hanya artikel yang ditugaskan yang ditampilkan. ${me().p.create ? 'Anda diizinkan membuat perintah kerja.' : 'Anda tidak memiliki izin membuat perintah kerja.'}</div>`;
      let a = vis(), q = ((document.getElementById('cmdsearch') as any)?.value || '').toLowerCase();
      if (CF === 'GG Supply' || CF === 'GUDSKUY') a = a.filter((x: any) => x.brand === CF);
      if (CF === 'late') a = a.filter(late);
      if (q) a = a.filter((x: any) => (x.name + x.code + x.brand + user(x.pic).name).toLowerCase().includes(q));
      let g = [
        ['todo', 'Belum Dimulai', (o: any) => stage(o).status === 'todo'],
        ['doing', 'Sedang Dikerjakan', (o: any) => ['doing', 'blocked'].includes(stage(o).status)],
        ['review', 'Menunggu Review', (o: any) => stage(o).status === 'review'],
        ['done', 'Artikel Final', (o: any) => prog(o) === 100],
      ];
      let kb = document.getElementById('kanban');
      if (kb)
        kb.innerHTML = g
          .map((z) => {
            let x = a.filter(z[2]);
            return `<div class="kcol"><div class="ktitle">${z[1]}<span>${x.length}</span></div>${x.map(taskCard).join('') || '<div class="empty">Belum ada artikel</div>'}</div>`;
          })
          .join('');
    }

    function taskCard(o: any) {
      let s = stage(o), us = [o.pic, ...o.support].map(user);
      return `<div class="task" onclick="openDetail('${o.id}')"><div class="tasktop"><span class="chip ${o.brand === 'GG Supply' ? 'supply' : 'gud'}">${o.brand}</span><small style="color:${o.priority === 'Tinggi' ? 'var(--red)' : 'var(--mut)'}">${o.priority}</small></div><h4>${o.name}</h4><p>${o.code} • ${STAGES.find((x) => x[0] === s.id)?.[1]}</p><div style="display:flex;gap:7px;align-items:center;margin-top:9px"><div class="bar" style="flex:1"><span style="width:${prog(o)}%"></span></div><b class="small">${prog(o)}%</b></div><div class="taskfoot"><div class="avatars">${us.map((u: any, i: any) => `<div class="mav" style="background:${['#6d5dfc', '#2878e6', '#1e9a68', '#f97316'][i % 4]}">${u.ini}</div>`).join('')}</div><small style="color:${late(o) ? 'var(--red)' : 'var(--mut)'}">${late(o) ? 'Terlambat • ' : ''}${date(o.due)}</small></div></div>`;
    }

    function renderMonitor() {
      let m = document.getElementById('monitor');
      if (!m) return;
      if (!me().p.monitor) {
        m.innerHTML = '<div class="deny"><div style="font-size:52px">🔒</div><h1>Akses khusus Owner</h1><p>Pengguna aktif tidak memiliki izin membuka halaman ini.</p><button class="btn" onclick="page(\'dashboard\',document.querySelector(\'[data-p=dashboard]\'))">Kembali ke Dashboard</button></div>';
        return;
      }
      let a = S.orders;
      m.innerHTML = `<div class="hero"><div><div class="eye">Owner control tower</div><h1>Kelola & Pantau</h1><p>Semua perintah dari pengguna berizin otomatis masuk ke sini. Owner dapat memantau progres, PIC, deadline, HPP, sampling, size chart, dan approval.</p></div><div class="actions"><button class="btn primary" onclick="openCommand()">＋ Perintah Baru</button></div></div><div class="grid kpis">${[
        ['▣', a.length, 'Total Artikel', 'ko'],
        ['↗', a.filter((x: any) => prog(x) < 100).length, 'Dalam Proses', 'kb'],
        ['⌛', a.filter((x: any) => stage(x).status === 'review').length, 'Menunggu Review', 'ky'],
        ['!', a.filter(late).length, 'Terlambat', 'ky'],
      ].map((x) => `<div class="card kpi"><div class="kicon ${x[3]}">${x[0]}</div><div><div class="kv">${x[1]}</div><div class="kl">${x[2]}</div></div></div>`).join('')}</div><div class="card" style="margin-top:15px"><div class="chead"><div><h2>Master Task List</h2><p>Satu sumber data dengan Perintah Kerja — tidak ada input ulang.</p></div></div><div class="tablewrap"><table><thead><tr><th>Artikel</th><th>Perusahaan</th><th>Tahap</th><th>PIC</th><th>Deadline</th><th>Progres</th><th>Status</th><th></th></tr></thead><tbody>${a.map((o: any) => { let s = stage(o); return `<tr><td><div class="product"><div class="thumb">${o.photo ? `<img src="${o.photo}">` : '👕'}</div><div><b>${o.name}</b><small>${o.code}</small></div></div></td><td><span class="chip ${o.brand === 'GG Supply' ? 'supply' : 'gud'}">${o.brand}</span></td><td>${STAGES.find((x) => x[0] === s.id)?.[1]}</td><td>${user(s.who).name}</td><td>${date(o.due)}</td><td><div style="display:flex;gap:7px;align-items:center"><div class="bar" style="width:85px"><span style="width:${prog(o)}%"></span></div><b>${prog(o)}%</b></div></td><td><span class="status ${late(o) ? 'late' : s.status}">${late(o) ? 'Terlambat' : sname(s.status)}</span></td><td><button class="btn sm" onclick="openDetail('${o.id}')">Kelola</button></td></tr>`; }).join('')}</tbody></table></div></div>`;
    }

    function renderBrands() {
      let bp = document.getElementById('brandpanels');
      if (bp)
        bp.innerHTML = ['GG Supply', 'GUDSKUY']
          .map((b) => {
            let a = S.orders.filter((x: any) => x.brand === b), p = a.length ? Math.round(a.reduce((z: any, o: any) => z + prog(o), 0) / a.length) : 0, d = b === 'GG Supply' ? 'Produksi pakaian polosan siap stok dan layanan custom untuk mitra percetakan, komunitas, corporate, sekolah, resto, bengkel, pabrik, dan pelanggan perorangan.' : 'Brand fashion mandiri untuk daily wear, sportswear, outdoor, streetwear, casual wear, dan koleksi bertahap.';
            return `<div class="brandpanel ${b === 'GG Supply' ? 'ggs' : 'gdg'}">2<h2>${b}</h2><p>${d}</p><div class="stats"><div><b>${a.length}</b><small>Artikel aktif</small></div><div><b>${p}%</b><small>Kesiapan</small></div><div><b>${a.filter((x: any) => prog(x) === 100).length}</b><small>Artikel final</small></div></div></div>`;
          })
          .join('');

      let sf = document.getElementById('stageflow');
      if (sf)
        sf.innerHTML = STAGES.map((x, i) => `<div class="stage"><small>0${i + 1}</small><b>${x[1]}</b><small>${['Nama, warna, foto, link, target.', 'Kandidat kain dan konsumsi.', 'Harga, MOQ, warna, aksesori.', 'Swatch dan kode warna final.', 'Sampel awal, revisi, master.', 'Seluruh variabel biaya nyata.', 'Ukuran baku dan toleransi.', 'QC dan approval Owner.'][i]}</small></div>`).join('');
    }

    function renderSuppliers() {
      let ok = S.suppliers.filter((x: any) => x.status === 'Approved').length;
      let sk = document.getElementById('supkpi');
      if (sk)
        sk.innerHTML = [
          ['⌁', S.suppliers.length, 'Total Supplier', 'kb'],
          ['✓', ok, 'Sudah Approved', 'kg'],
          ['◫', S.suppliers.filter((x: any) => x.cat === 'Kain').length, 'Supplier Kain', 'ko'],
          ['◆', S.suppliers.filter((x: any) => x.cat === 'Aksesori').length, 'Supplier Aksesori', 'kp'],
        ]
          .map((x) => `<div class="card kpi"><div class="kicon ${x[3]}">${x[0]}</div><div><div class="kv">${x[1]}</div><div class="kl">${x[2]}</div></div></div>`)
          .join('');

      let a = S.suppliers, q = ((document.getElementById('supsearch') as any)?.value || '').toLowerCase();
      if (SF === 'Approved') a = a.filter((x: any) => x.status === 'Approved');
      else if (SF !== 'all') a = a.filter((x: any) => x.cat === SF);
      if (q) a = a.filter((x: any) => (x.name + x.mat + x.cat + x.spec).toLowerCase().includes(q));

      let st = document.getElementById('suptable');
      if (st)
        st.innerHTML = a
          .map((x: any) => `<tr><td><b>${x.name}</b></td><td>${x.cat}</td><td>${x.mat}<br><small class="mut">${x.spec || ''}</small></td><td>${rp(x.price)}</td><td>${x.moq || '-'}</td><td>${x.lead || '-'}</td><td><span class="status ${x.status === 'Approved' ? 'done' : 'review'}">${x.status}</span></td><td>${me().p.supplier ? `<button class="btn sm" onclick="toggleSupplier('${x.id}')">${x.status === 'Approved' ? 'Review ulang' : 'Approve'}</button>` : ''}</td></tr>`)
          .join('');
    }

    function renderHppPage() {
      let s: any = document.getElementById('hppsel');
      if (!s) return;
      let a = vis(), v = s.value;
      s.innerHTML = a.map((o: any) => `<option value="${o.id}">${o.code} — ${o.name}</option>`).join('');
      if (v && a.some((o: any) => o.id === v)) s.value = v;
      if (a.length) renderHpp(s.value || a[0].id);
    }

    function renderHpp(i: string) {
      let o = S.orders.find((x: any) => x.id === i);
      if (!o) return;
      let h = o.hpp, c = hcalc(h);
      let hw = document.getElementById('hppwork');
      if (hw)
        hw.innerHTML = `<div class="results" style="margin-bottom:15px"><div class="result"><small>HPP Total</small><b>${rp(c.hpp)}</b></div><div class="result"><small>Harga Jual Target (${h.marginPct}%)</small><b>${rp(c.price)}</b></div><div class="result"><small>Status HPP</small><b style="font-size:14px">${h.final ? 'FINAL' : 'BELUM FINAL'}</b></div></div>`;
    }

    function hcalc(h: any) {
      let base = +h.fabricPrice * +h.consumption + ['accessories', 'cutting', 'sewing', 'decoration', 'finishing', 'packaging', 'transport'].reduce((a: any, k: any) => a + (+h[k] || 0), 0), reject = base * (+h.rejectPct || 0) / 100, over = (base + reject) * (+h.overheadPct || 0) / 100, hpp = base + reject + over, price = hpp / (1 - (+h.marginPct || 0) / 100);
      return { base, hpp, price };
    }

    function renderSamples() {
      let sc = document.getElementById('samplecards');
      if (sc)
        sc.innerHTML = S.orders
          .map((o: any) => `<div class="card"><div class="chead"><div><b>${o.name}</b><p>${o.code}</p></div><span class="chip ${o.brand === 'GG Supply' ? 'supply' : 'gud'}">${o.brand}</span></div><p>${o.samples.length} versi sampel fisik tercatat.</p></div>`)
          .join('');
    }

    function renderSizePage() {
      let s: any = document.getElementById('sizesel');
      if (!s) return;
      let a = vis();
      s.innerHTML = a.map((o: any) => `<option value="${o.id}">${o.code} — ${o.name}</option>`).join('');
    }

    function renderReports() {
      let rk = document.getElementById('reportkpi');
      if (rk)
        rk.innerHTML = [
          ['▤', S.evals.length, 'Catatan Evaluasi', 'kb'],
          ['✓', S.orders.filter((x: any) => prog(x) === 100).length, 'Artikel Final', 'kg'],
        ]
          .map((x) => `<div class="card kpi"><div class="kicon ${x[3]}">${x[0]}</div><div><div class="kv">${x[1]}</div><div class="kl">${x[2]}</div></div></div>`)
          .join('');
    }

    function renderAccess() {
      let acc = document.getElementById('access');
      if (!acc) return;
      if (!me().p.access) {
        acc.innerHTML = '<div class="deny"><div style="font-size:52px">🔒</div><h1>Akses khusus Owner</h1><p>Pengguna aktif tidak memiliki izin membuka halaman ini.</p></div>';
        return;
      }
      let P = [
        ['create', 'Membuat Perintah'],
        ['monitor', 'Monitoring Seluruh Task'],
        ['brief', 'Mengubah Brief'],
        ['supplier', 'Kelola Supplier'],
        ['hpp', 'Input HPP'],
        ['sample', 'Kelola Sampling'],
        ['size', 'Kelola Size Chart'],
        ['approve', 'Approval Final'],
        ['access', 'Kelola Akses'],
      ];

      acc.innerHTML = `<div class="hero"><div><div class="eye">Role-based access control</div><h1>Pengaturan Akses Pengguna</h1><p>Owner menentukan siapa yang dapat membuat perintah kerja. Perintah dari pengguna berizin otomatis sinkron ke Kelola & Pantau. Monitoring seluruh task tetap khusus Owner.</p></div><div class="actions"><button class="btn primary" onclick="addUser()">＋ Tambah Pengguna</button></div></div><div class="notice warn"><span>⚠</span><div><b>Rekomendasi:</b> izin membuat perintah hanya diberikan kepada Owner atau koordinator. Tim produksi fokus memperbarui pekerjaan yang ditugaskan.</div></div><div class="card" style="margin-top:15px"><div class="tablewrap"><table><thead><tr><th>Pengguna</th>${P.map((x) => `<th>${x[1]}</th>`).join('')}<th>Aktif</th></tr></thead><tbody>${S.users.map((u: any) => `<tr><td><div class="product"><div class="mav" style="width:37px;height:37px">${u.ini}</div><div><b>${u.name}</b><small>${u.role} • ${u.title}</small></div></div></td>${P.map((x: any) => `<td><label class="toggle"><input type="checkbox" ${u.p[x[0]] ? 'checked' : ''} ${u.id === 'u1' && ['monitor', 'access'].includes(x[0]) ? 'disabled' : ''} onchange="setPerm('${u.id}','${x[0]}',this.checked)"><span></span></label></td>`).join('')}<td><label class="toggle"><input type="checkbox" ${u.active ? 'checked' : ''} ${u.id === 'u1' ? 'disabled' : ''} onchange="setActive('${u.id}',this.checked)"><span></span></label></td></tr>`).join('')}</tbody></table></div></div>`;
    }

    (window as any).setPerm = function (i: string, k: string, v: boolean) {
      let u = S.users.find((x: any) => x.id === i);
      u.p[k] = v;
      save();
      init();
      toast('Izin ' + u.name + ' diperbarui.');
    };

    (window as any).setActive = function (i: string, v: boolean) {
      let u = S.users.find((x: any) => x.id === i);
      u.active = v;
      save();
      init();
      toast('Status pengguna diperbarui.');
    };

    (window as any).addUser = function () {
      let n = prompt('Nama pengguna:');
      if (!n) return;
      let r = prompt('Peran / jabatan:', 'Tim Kreatif') || 'Pengguna', ini = n.split(' ').map((x: any) => x[0]).join('').slice(0, 2).toUpperCase();
      S.users.push({ id: id('u'), name: n, ini, role: r, title: r, active: true, p: { create: false, monitor: false, brief: false, supplier: false, hpp: false, sample: false, size: false, approve: false, access: false } });
      save();
      renderAll();
      toast('Pengguna ditambahkan.');
    };

    (window as any).openDetail = function (i: string) {
      detailId = i;
      let o = S.orders.find((x: any) => x.id === i);
      let dt = document.getElementById('detailtitle');
      if (dt) dt.innerHTML = `<div class="eye">${o.brand}</div><h2>${o.name}</h2><p class="small">${o.code} • Target ${date(o.due)}</p>`;
      (window as any).detailTab('overview');
      document.getElementById('detailmodal')?.classList.add('on');
    };

    (window as any).closeModal = function (i: string) {
      document.getElementById(i)?.classList.remove('on');
    };

    (window as any).openCommand = function () {
      if (!me().p.create) {
        toast('Tidak memiliki izin membuat perintah.');
        return;
      }
      let a = S.users.filter((x: any) => x.active);
      let fp: any = document.getElementById('fpic');
      if (fp) fp.innerHTML = a.map((x: any) => `<option value="${x.id}">${x.name} — ${x.role}</option>`).join('');
      let fs = document.getElementById('fsupport');
      if (fs) fs.innerHTML = a.map((x: any) => `<label style="display:flex;gap:7px;align-items:center;border:1px solid var(--line);padding:9px;border-radius:10px;font-size:10px"><input type="checkbox" name="support" value="${x.id}"> ${x.name}</label>`).join('');
      document.getElementById('cmdmodal')?.classList.add('on');
    };

    (window as any).submitCommand = function (e: any) {
      e.preventDefault();
      let brand = (document.getElementById('fbrand') as any).value, name = (document.getElementById('fname') as any).value.trim(), code = (document.getElementById('fcode') as any).value.trim() || `${brand === 'GG Supply' ? 'GS' : 'GD'}-${String(S.orders.length + 1).padStart(3, '0')}`, pic = (document.getElementById('fpic') as any).value, support = [...document.querySelectorAll('[name=support]:checked')].map((x: any) => x.value).filter((x: any) => x !== pic), order = {
        id: id('o'), code, brand, name, colors: (document.getElementById('fcolors') as any).value.split(',').map((x: any) => x.trim()).filter(Boolean), photo: (document.getElementById('fphoto') as any).value.trim(), ref: (document.getElementById('fref') as any).value.trim(), priority: (document.getElementById('fpriority') as any).value, due: (document.getElementById('fdue') as any).value, created: new Date().toISOString().slice(0, 10), by: S.current, pic, support, brief: (document.getElementById('fbrief') as any).value.trim(),
        stages: STAGES.map((x: any, j: any) => ({ id: x[0], status: j === 0 ? 'done' : j === 1 ? 'doing' : 'todo', who: j === 0 ? S.current : j === 1 || j === 5 ? pic : j === 2 || j === 3 ? support[0] || pic : j === 4 || j === 6 ? support[1] || pic : 'u1', note: j === 0 ? 'Brief dibuat dan perintah diterbitkan.' : '' })),
        hpp: { fabricPrice: 0, consumption: 0, accessories: 0, cutting: 0, sewing: 0, decoration: 0, finishing: 0, packaging: 0, transport: 0, rejectPct: 3, overheadPct: 8, marginPct: 35, final: false }, samples: [], size: ['S', 'M', 'L', 'XL'].map((s) => ({ s, chest: 0, length: 0, sleeve: 0, shoulder: 0 })),
      };
      S.orders.unshift(order);
      activity(`Membuat perintah kerja ${code} — ${name}.`);
      save();
      (window as any).closeModal('cmdmodal');
      (document.getElementById('cmdform') as any).reset();
      renderAll();
      toast('Perintah dibuat dan tersinkron ke Kelola & Pantau.');
    };

    (window as any).detailTab = function (t: string) {
      let o = S.orders.find((x: any) => x.id === detailId), c = '';
      if (t === 'overview')
        c = `<div class="grid two"><div><div class="photo">${o.photo ? `<img src="${o.photo}">` : '👕'}</div><div class="results" style="grid-template-columns:1fr 1fr;margin-top:10px"><div class="result"><small>Warna</small><b style="font-size:13px">${o.colors.join(', ') || '-'}</b></div><div class="result"><small>Prioritas</small><b style="font-size:13px">${o.priority}</b></div></div></div><div><h3>Arahan Perintah</h3><p>${o.brief}</p><hr style="border:0;border-top:1px solid var(--line);margin:16px 0"><h3>PIC Utama</h3><div class="pitem" style="margin-top:9px"><div class="mav" style="width:34px;height:34px">${user(o.pic).ini}</div><div><b>${user(o.pic).name}</b><p>${user(o.pic).role}</p></div><span class="chip supply">PIC</span></div></div></div>`;
      if (t === 'workflow')
        c = `<div class="pipe" style="margin-top:13px">${o.stages.map((s: any, j: any) => `<div class="pitem"><div class="pnum">${j + 1}</div><div><b>${STAGES.find((x) => x[0] === s.id)?.[1]}</b><p>${s.note || 'Belum ada catatan.'} • PIC: ${user(s.who).name}</p></div><select class="select" style="width:145px" onchange="updateStage('${o.id}','${s.id}',this.value)">${['todo', 'doing', 'review', 'blocked', 'done'].map((v) => `<option value="${v}" ${s.status === v ? 'selected' : ''}>${sname(v)}</option>`).join('')}</select></div>`).join('')}</div>`;
      
      let tabs = [['overview', 'Ringkasan'], ['workflow', 'Workflow']];
      let db = document.getElementById('detailbody');
      if (db)
        db.innerHTML = `<div class="tabs">${tabs.map((x) => `<button class="tab ${t === x[0] ? 'on' : ''}" onclick="detailTab('${x[0]}')">${x[1]}</button>`).join('')}</div>${c}`;
    };

    (window as any).updateStage = function (oi: string, si: string, v: string) {
      let o = S.orders.find((x: any) => x.id === oi), s = o.stages.find((x: any) => x.id === si);
      s.status = v;
      if (v === 'done' && !s.note) s.note = 'Tahap diselesaikan.';
      activity(`Memperbarui ${STAGES.find((x: any) => x[0] === si)?.[1]} pada ${o.name} menjadi ${sname(v)}.`);
      save();
      renderAll();
      (window as any).detailTab('workflow');
      toast('Status workflow tersinkron.');
    };

    init();
  }, []);

  return (
    <div>
      <div className="overlay" id="overlay" onClick={() => (window as any).sidebar(false)}></div>
      
      {/* 100% Pure Original Simulation UI */}
      <section className="page on" id="p-dashboard">
        <div className="hero">
          <div>
            <div className="eye">Pusat operasional launching</div>
            <h1 id="welcome">Selamat datang</h1>
            <p>Kelola peluncuran artikel GG Supply dan GUDSKUY melalui workflow yang terukur, terdokumentasi, dan tersinkron antara Owner, riset, sourcing, produksi, HPP, sampling, size chart, serta approval artikel final.</p>
          </div>
          <div className="actions">
            <button className="btn primary createbtn" onClick={() => (window as any).openCommand()}>＋ Buat Perintah Kerja</button>
            <button className="btn" onClick={() => (window as any).page('monitor')}>Lihat Monitoring</button>
          </div>
        </div>
        <div className="grid kpis" id="dashkpi"></div>
        <div className="grid two" style={{ marginTop: '15px' }}>
          <div className="card">
            <div className="chead">
              <div>
                <h2>Progress Launching</h2>
                <p>Rangkuman kesiapan dua perusahaan.</p>
              </div>
              <span className="status doing">Berjalan</span>
            </div>
            <div id="launchprog"></div>
          </div>
          <div className="card">
            <div className="chead">
              <div>
                <h2>Fokus Pengguna Aktif</h2>
                <p>Task terdekat sesuai penugasan.</p>
              </div>
            </div>
            <div id="today"></div>
          </div>
        </div>
        <div className="grid two" style={{ marginTop: '15px' }}>
          <div className="card">
            <div className="chead">
              <div>
                <h2>Pipeline Artikel Aktif</h2>
                <p>Tahap yang sedang membutuhkan tindakan.</p>
              </div>
            </div>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Artikel</th>
                    <th>Tahap</th>
                    <th>PIC</th>
                    <th>Progres</th>
                  </tr>
                </thead>
                <tbody id="dashpipe"></tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="chead">
              <div>
                <h2>Aktivitas Terbaru</h2>
                <p>Jejak perubahan sistem.</p>
              </div>
            </div>
            <div className="timeline" id="activity"></div>
          </div>
        </div>
      </section>

      <section className="page" id="p-commands">
        <div className="hero">
          <div>
            <div className="eye">Execution board</div>
            <h1>Perintah Kerja</h1>
            <p>Owner memantau seluruh task. Anggota tim hanya melihat artikel yang ditugaskan dan memperbarui bagian sesuai izin akses.</p>
          </div>
          <div className="actions">
            <button className="btn primary createbtn" onClick={() => (window as any).openCommand()}>＋ Perintah Baru</button>
          </div>
        </div>
        <div className="notice" id="cmdnotice"></div>
        <div className="toolbar" style={{ marginTop: '13px' }}>
          <div className="filters">
            <button className="filter on" onClick={(e: any) => (window as any).cmdFilter('all', e.target)}>Semua</button>
            <button className="filter" onClick={(e: any) => (window as any).cmdFilter('GG Supply', e.target)}>GG Supply</button>
            <button className="filter" onClick={(e: any) => (window as any).cmdFilter('GUDSKUY', e.target)}>GUDSKUY</button>
            <button className="filter" onClick={(e: any) => (window as any).cmdFilter('late', e.target)}>Terlambat</button>
          </div>
          <div className="search">
            <span>⌕</span>
            <input className="field" id="cmdsearch" placeholder="Cari artikel, kode, PIC..." />
          </div>
        </div>
        <div className="kanban" id="kanban"></div>
      </section>

      <section className="page" id="p-monitor"><div id="monitor"></div></section>
      <section className="page" id="p-brands">
        <div className="hero"><div><div className="eye">Dua perusahaan, satu sistem</div><h1>GG Supply & GUDSKUY</h1><p>Tujuan pasar berbeda, tetapi data artikel dan workflow produksi menggunakan standar yang sama agar mudah dikontrol.</p></div></div>
        <div className="brandpanels" id="brandpanels"></div>
        <div className="card" style={{ marginTop: '15px' }}><div className="chead"><div><h2>Workflow Artikel Terstandar</h2><p>Setiap perintah kerja otomatis memiliki delapan tahap.</p></div></div><div className="stageflow" id="stageflow"></div></div>
      </section>
      <section className="page" id="p-supplier"><div id="supkpi"></div><div id="suptable"></div></section>
      <section className="page" id="p-hpp"><div id="hppwork"></div></section>
      <section className="page" id="p-sample"><div id="samplecards"></div></section>
      <section className="page" id="p-size"><div id="sizework"></div></section>
      <section className="page" id="p-reports"><div id="reportkpi"></div></section>
      <section className="page" id="p-access"><div id="access"></div></section>

      {/* Modals */}
      <div className="modalbg" id="cmdmodal">
        <div className="modal">
          <div className="mhead"><div><h2>Buat Perintah Kerja</h2><p className="small">Otomatis tersinkron ke Kelola & Pantau.</p></div><button className="ibtn" onClick={() => (window as any).closeModal('cmdmodal')}>×</button></div>
          <div className="mbody">
            <form id="cmdform" className="formgrid" onSubmit={(e) => (window as any).submitCommand(e)}>
              <div className="fg"><label>Perusahaan</label><select id="fbrand" className="select"><option>GG Supply</option><option>GUDSKUY</option></select></div>
              <div className="fg"><label>Prioritas</label><select id="fpriority" className="select"><option>Tinggi</option><option selected>Normal</option><option>Rendah</option></select></div>
              <div className="fg"><label>Nama Produk</label><input id="fname" className="field" required placeholder="Contoh: Windbreaker Kombinasi" /></div>
              <div className="fg"><label>Kode Artikel</label><input id="fcode" className="field" placeholder="Otomatis bila kosong" /></div>
              <div className="fg full"><label>Warna Produk</label><input id="fcolors" className="field" placeholder="Petrol/Jade, Hitam/Putih" /></div>
              <div className="fg"><label>Link Referensi</label><input id="fref" type="url" className="field" placeholder="https://..." /></div>
              <div className="fg"><label>URL Foto Produk</label><input id="fphoto" type="url" className="field" placeholder="https://..." /></div>
              <div className="fg"><label>Target Selesai</label><input id="fdue" type="date" className="field" required /></div>
              <div className="fg"><label>PIC Utama</label><select id="fpic" className="select"></select></div>
              <div className="fg full"><label>Tim Pendukung</label><div className="grid three" id="fsupport"></div></div>
              <div className="fg full"><label>Arahan dan Target Output</label><textarea id="fbrief" className="area" required placeholder="Target sampel, bahan, konstruksi, custom, batas HPP, atau catatan khusus..."></textarea></div>
            </form>
          </div>
          <div className="mfoot"><button className="btn" onClick={() => (window as any).closeModal('cmdmodal')}>Batal</button><button className="btn primary" onClick={() => (document.getElementById('cmdform') as any)?.requestSubmit()}>Buat & Sinkronkan</button></div>
        </div>
      </div>

      <div className="modalbg" id="detailmodal">
        <div className="modal wide">
          <div className="mhead"><div id="detailtitle"></div><button className="ibtn" onClick={() => (window as any).closeModal('detailmodal')}>×</button></div>
          <div className="mbody" id="detailbody"></div>
        </div>
      </div>

      <div className="toast" id="toast"></div>
    </div>
  );
};
