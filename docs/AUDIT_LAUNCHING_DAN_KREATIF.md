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

1. Koordinator membuat kampanye, menulis tujuan/brief promo, menentukan PIC, periode, dan plafon. Tugas rutin yang tidak terkait promo masuk ke **Tanpa kampanye**.
2. Untuk materi lintas kanal, buat satu tugas per hasil yang memiliki PIC, format, atau jadwal berbeda. Contoh: Reels Instagram, video TikTok, dan banner marketplace dalam satu kampanye yang sama.
3. PIC mengisi brief, deadline produksi, tanggal tayang, prioritas, dan tautan hasil. Tim dapat menyaring tugas per platform, status, PIC, atau **Tugas saya**, dan mengurutkannya berdasarkan jadwal tayang.
4. Koordinator memantau persentase selesai, hambatan, dan keterlambatan untuk seluruh lingkup terpilih. Progress = tugas selesai / tugas selain dibatalkan. Tugas aktif dengan deadline sebelum hari ini di WIB dihitung terlambat. Filter daftar tidak mengubah ringkasan lingkup.
5. Koordinator memperbarui realisasi secara manual. Kampanye dapat diarsipkan dan tugas dapat dibatalkan; keduanya tetap dapat ditinjau.

## Verifikasi sebelum rilis

- Terapkan migrasi `20261105010000_creative_workspace.sql`, `20261105020000_creative_idea_bank.sql`, lalu `20261105030000_creative_weekly_execution.sql` pada Supabase staging sebelum frontend. Belum ada migrasi atau perubahan data produksi dari audit ini.
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
