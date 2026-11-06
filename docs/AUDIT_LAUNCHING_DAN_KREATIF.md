# Audit Product Launch OS dan ruang kerja Konten & Kampanye

Audit kode dan migrasi, 5 November 2026. Cakupan: alur kerja, model data, akses, konsistensi, dan pola trafik. Metrik Supabase produksi, konfigurasi role di produksi, dan data transaksi tidak diperiksa.

## Temuan dan keputusan

| Prioritas | Temuan | Keputusan |
| --- | --- | --- |
| Tinggi | Tugas launching dibentuk dari proyek artikel dan tahap produksi. Konten rutin, promo lintas produk, dan pekerjaan internal tidak punya induk yang tepat. | Tambah ruang kerja kedua dengan kampanye sebagai induk opsional. Pertahankan tugas launching di alur artikel. Tidak ada penyalinan data lama. |
| Tinggi | Workspace launching memadukan tabel operasional dan payload kompatibilitas `paten_records`; refresh mengambil banyak tabel sekaligus, termasuk riwayat komentar artikel. Menambahkan kampanye pada snapshot ini menambah trafik setiap kali launching dibuka. | Rute, tabel, dan cache kreatif terpisah. Rute kreatif tidak memasang polling, chat, atau snapshot launching. Query mengirim kolom terpilih dan 30 tugas per halaman, dengan satu baris tambahan untuk mendeteksi halaman berikutnya. |
| Tinggi | Pemilik kampanye, PIC produksi konten, deadline internal, dan tanggal tayang adalah tanggung jawab yang berbeda. Satu status umum saja tidak menunjukkan pekerjaan yang siap tayang atau tertahan. | Kampanye dan tugas punya PIC terpisah. Deadline dan tanggal tayang disimpan terpisah. Status mencakup review, siap tayang, selesai, terhambat, dan dibatalkan. Status terhambat mewajibkan alasan. |
| Tinggi | Data realisasi promo bisa sensitif. Role yang ada adalah role launching, belum ada role kreatif atau finance tersendiri. | MVP mengikuti akses tim internal: akun aktif dengan `launch.view` bisa membaca semua kampanye termasuk angka anggaran; `launch.edit` dapat mengubah, dan `launch.admin` dapat melakukan keduanya. Verifikasi kecocokan akses sebelum dipakai untuk data yang lebih sensitif. |
| Sedang | Dua orang bisa membuka tugas yang sama dan menyimpan hasil pada waktu berbeda. | Penyimpanan mengirim ID dan versi waktu baris. Perubahan ditolak jika versi sudah berganti. Angka progress dihitung di database dan tetap lengkap walaupun daftar tugas dipaginasi. |
| Sedang | Anggaran kampanye dan realisasi bukan ledger. Menyimpan aset di baris tugas menambah ukuran data. | Simpan anggaran/realisasi total dalam rupiah dan tampilkan sisanya, termasuk nilai negatif. Simpan tautan hasil HTTP(S); aset tetap di Cloudinary atau layanan penyimpanan tim. Tidak ada pembukuan, pengajuan, maupun posting otomatis ke platform. |

## Alur operasional

Setelah login, pengguna memilih **Launching Artikel** atau **Creative Dashboard**. Kedua ruang kerja punya jalan kembali ke pemilih.

Di **Bank Ide & Referensi**, tim bisa menulis ide, menambahkan sampai lima tautan, dan menandai yang perlu diprioritaskan. **Jadikan tugas** menyiapkan judul, brief, dan platform; editor melengkapi PIC, kampanye, dan jadwal. Satu ide menghasilkan maksimal satu tugas agar tidak ada penugasan ganda. Referensi tetap tersedia dari tugas dan status tugas terlihat dari bank ide.

### Ritme kerja yang disarankan

- **Awal minggu:** pilih ide yang bisa dituntaskan dengan kapasitas tim. Tinjau ide masuk, pindahkan yang punya brief ke **Siap dikerjakan**, lalu tetapkan PIC dan deadline saat membuat tugas. Ide yang belum cocok tetap bisa ditunda tanpa memenuhi daftar produksi.
- **Setiap hari:** buka **Deadline hari ini**, **Terlambat**, dan **Menunggu review**. Selesaikan hambatan dan review sebelum menambah pekerjaan baru. Pakai **Tayang minggu ini** untuk mengecek jadwal kanal secara terpisah dari deadline produksi.
- **Akhir minggu:** lihat pekerjaan yang jatuh tempo, berapa yang selesai, dan berapa yang tercatat tepat waktu. Catat penyebab keterlambatan dan pilih satu perbaikan proses untuk minggu depan. Uji satu variasi ide atau format per kampanye, lalu bawa hasilnya kembali ke bank ide.

Target mingguan saat ini dihitung ulang dari deadline tugas pada Senin–Minggu WIB. Memindahkan deadline atau membatalkan tugas mengubah angka; ini belum merupakan target yang dikunci atau laporan historis. Status selesai lama tanpa timestamp tetap dihitung selesai, tetapi tidak dinyatakan tepat waktu. Catatan tepat waktu hanya berlaku jika waktu transisi ke status selesai direkam setelah migrasi. Metrik kampanye seperti klik, lead, atau penjualan tetap perlu diukur terpisah dari jumlah tugas selesai.

### Operasional beberapa usaha

- **Owner/Admin:** buat satu unit per usaha/brand di **Kelola unit & tim**, pilih sektor Garment, F&B, atau Lainnya, lalu cek **Ringkasan lintas usaha**. Kartu tiap unit menunjukkan artikel aktif, artikel lewat target, pekerjaan kreatif/operasional yang selesai dari target minggu ini, dan tugas terlambat.
- **Koordinator unit:** buka unit, pilih kampanye jika relevan, lalu tentukan pos kerja, PIC, dan deadline. Gunakan Produksi Konten untuk aset, Marketing & Promo untuk distribusi/penawaran, dan Operasional untuk pekerjaan internal. Contoh F&B: persiapan materi menu (Konten), promo akhir pekan (Marketing), dan kesiapan outlet (Operasional).
- **PIC:** mulai dari **Tugas kreatif saya**, saring per unit atau pos, dan gunakan diskusi proyek untuk hambatan yang perlu ditangani bersama. Jabatan ditampilkan di pemilih PIC; jabatan adalah konteks pekerjaan, sedangkan izin tetap ditentukan role.
- **Approver:** editor bisa meminta persetujuan artikel, tetapi keputusan akhir memerlukan izin `launch.approve` atau `launch.admin`. Pada konfigurasi role bawaan, owner memiliki izin tersebut.

Unit bisnis sekarang disimpan di Supabase. Unit yang sebelumnya dibuat hanya di browser perlu dibuat ulang melalui pengaturan; data tersebut tidak disalin otomatis. Kampanye meneruskan unitnya ke semua tugas terkait. Kampanye, tugas mandiri, dan ide lama tanpa unit masuk ke **Unit belum ditetapkan** sehingga admin dapat merapikan data tanpa menebak pemiliknya. Arsip unit tidak menghapus pekerjaan lama. Filter unit membantu navigasi dan pelaporan; akses antarunit masih menggunakan izin tim yang berlaku. Pipeline artikel tetap mengikuti tahap produksi garment; untuk F&B gunakan kampanye dan tugas operasional sampai alur SOP sektor tersebut dirancang terpisah.

### Produksi konten, iklan, dan evaluasi kanal

- Gunakan **Tugas** untuk produksi: pilih Kanban atau Daftar. Kolom Kanban mengikuti status tugas; aksi cepat mengubah status menggunakan versi baris. Jumlah di kolom hanya untuk halaman dan filter yang terlihat.
- Gunakan **Kampanye** sebagai induk. Satu kampanye bisa memiliki beberapa aktivasi di **Iklan & Evaluasi**, misalnya Shopee Ads dan posting organik Instagram. Masing-masing punya PIC, periode, deadline evaluasi, metrik utama, target, hasil aktual, serta catatan dan keputusan evaluasi. Aktivasi organik tidak mencatat anggaran iklan.
- Gunakan **Kalender** untuk deadline produksi, jadwal tayang yang direncanakan, dan evaluasi kanal. Ringkasan menampilkan evaluasi yang jatuh tempo atau terlambat. Pengingat muncul di aplikasi saat data dibuka atau disegarkan; tidak ada notifikasi push atau pengambilan berkala.
- Ringkasan anggaran/aktual dikelompokkan per platform. Angka kanal diisi manual dan terpisah dari total anggaran kampanye. Bandingkan biaya per hasil hanya pada aktivasi dengan metrik yang sama; hasil klik dan hasil pesanan tidak dijumlahkan sebagai satu KPI.

1. Koordinator membuat kampanye, menulis tujuan/brief promo, menentukan PIC, periode, dan plafon. Tugas rutin yang tidak terkait promo masuk ke **Tanpa kampanye**.
2. Untuk materi lintas kanal, buat satu tugas per hasil yang memiliki PIC, format, atau jadwal berbeda. Contoh: Reels Instagram, video TikTok, dan banner marketplace dalam satu kampanye yang sama.
3. PIC mengisi brief, deadline produksi, tanggal tayang, prioritas, dan tautan hasil. Tim dapat menyaring tugas per platform, status, PIC, atau **Tugas saya**, dan mengurutkannya berdasarkan jadwal tayang.
4. Koordinator memantau persentase selesai, hambatan, dan keterlambatan untuk seluruh lingkup terpilih. Progress = tugas selesai / tugas selain dibatalkan. Tugas aktif dengan deadline sebelum hari ini di WIB dihitung terlambat. Filter daftar tidak mengubah ringkasan lingkup.
5. Koordinator memperbarui realisasi secara manual. Kampanye dapat diarsipkan dan tugas dapat dibatalkan; keduanya tetap dapat ditinjau.

## Verifikasi sebelum rilis

Chat mengambang dan polling komentar sudah dilepas. Gunakan tab **Diskusi** pada artikel atau tombol **Diskusi kampanye** pada kampanye yang dipilih. Komentar biasa tidak ikut dimuat saat workspace launching disegarkan; permintaan keputusan tetap diambil untuk alur approval. Riwayat chat umum tidak ditampilkan, tetapi migrasi tidak menghapus datanya.

- Terapkan migrasi `20261105010000_creative_workspace.sql`, `20261105020000_creative_idea_bank.sql`, lalu `20261105030000_creative_weekly_execution.sql` pada Supabase staging sebelum frontend. Belum ada migrasi atau perubahan data produksi dari audit ini.
- Setelah itu, terapkan `20261105040000_project_discussions.sql`. Uji komentar lama pada artikel, pengiriman komentar di dua kampanye berbeda, penolakan komentar tanpa proyek, dan pastikan tab tertutup tidak memuat komentar.
- Lanjutkan dengan `20261105050000_multi_business_workspace.sql`. Buat satu unit uji Garment dan satu F&B dari akun admin, masukkan pekerjaan di masing-masing unit, lalu cocokkan ringkasan, filter daftar, dan tampilan **Tugas kreatif saya**. Uji juga pemindahan unit kampanye beserta tugasnya, akses pengaturan dari akun nonadmin, dan penolakan keputusan approval dari editor yang bukan approver.
- Jalankan `supabase/audit/media_and_logging.sql` di SQL Editor proyek yang tepat sebelum menerapkan `20261105060000_guard_inline_media.sql`. Laporan menampilkan jumlah referensi dan ukuran teks yang tersimpan, termasuk Base64 lama dan pengaturan log, tanpa menampilkan isi foto. Angka ini bukan jumlah foto unik atau ukuran fisik database. Bila ada Base64 lama, pindahkan file ke Cloudinary dan perbarui referensi yang terkait setelah URL baru diverifikasi. Migrasi mencegah Base64 baru dan tidak menghapus data lama.
- Setelah frontend dirilis, buka dashboard proyek spesifik (bukan **All projects**), cek sumber log di Logs Explorer dan bandingkan Log Ingestion serta Database Egress selama beberapa hari. Uji dengan tab workspace dibiarkan terbuka: snapshot tidak lagi dimuat berkala; gunakan tombol **Segarkan** untuk mengambil perubahan tim. Jangan ubah pengaturan logging global sebelum sumber volume terbesar teridentifikasi.
- Jalankan `supabase/audit/workspace_sync_health.sql` setelah migrasi. Pastikan semua objek ada, RLS aktif, tabel workspace tidak terbit di Realtime, dan jumlah perbedaan unit/approval nol. Uji juga dua sesi editor: Creative memeriksa versi baris saat update. Launching memeriksa revisi payload PATEN, tetapi tabel operasional dan bridge masih ditulis lewat permintaan terpisah; kegagalan di tengah penyimpanan masih bisa menyisakan perubahan parsial. Saat konflik, tekan **Segarkan**, periksa data, lalu terapkan ulang perubahan yang diperlukan. Perbaikan lanjutan: pindahkan perubahan operasional dan bridge ke RPC transaksional per jenis record.
- Terapkan `20261105070000_creative_channel_evaluation.sql` sebelum frontend Hub Iklan dan Kalender. Pada staging, buat satu aktivasi berbayar dan satu organik untuk kampanye yang sama, uji jadwal kalender, penutupan evaluasi, filter per unit/platform, dan akses akun hanya baca.
- Uji perubahan status selesai lalu dibuka kembali, deadline sebelum dan sesudah batas minggu, serta pastikan ide tanpa brief atau tanpa PIC/deadline tidak masuk produksi.
- Uji login ke pemilih ruang kerja, akses langsung ke masing-masing rute, dan konversi satu ide dari dua tab. Pastikan hanya satu tugas yang tersimpan serta referensinya tetap bisa dibuka.
- Coba dengan editor, akun aktif hanya baca, dan akun nonaktif. Pastikan editor bisa membuat kampanye dan tugas, akun baca tidak bisa menulis melalui API, dan akun nonaktif tidak bisa membaca kedua tabel. Konfirmasi bahwa pihak yang dapat melihat anggaran memang sesuai kebijakan tim.
- Buat tugas dalam dan di luar kampanye. Uji status terhambat, tanggal tayang, paginasi, dana melebihi plafon, serta edit dari dua tab yang memuat versi sama. Gunakan **Segarkan** untuk mengambil perubahan rekan.
- Buka rute kreatif dan cek Network: tidak ada permintaan snapshot, komentar launching, atau WebSocket. Pantau ukuran respons dan frekuensi query sebelum/sesudah rilis; audit kode ini tidak menghasilkan estimasi GB produksi.

## Urutan pengembangan berikutnya

1. Jika akses dana perlu dibatasi, pisahkan role kreatif dan finance serta data anggaran sebelum rollout luas. Tambah catatan perubahan status/anggaran apabila diperlukan untuk audit pengeluaran.
2. Jika tim perlu menelusuri promo peluncuran produk tertentu, tambah relasi kampanye–artikel opsional. Jangan gunakan artikel sebagai syarat membuat kampanye.
3. Setelah satu siklus pemakaian, evaluasi kebutuhan tampilan kalender, pengingat deadline, dan KPI per platform. Ukur frekuensi penggunaan serta egress sebelum memperkenalkan sinkronisasi otomatis.
4. Untuk launching, ukur tabel/payload yang mendominasi snapshot. Prioritaskan pengambilan detail per artikel dan pembaruan inkremental; audit data media inline lama terpisah sebelum migrasi apa pun.
