# Rancangan Creative Command Center

Status: rancangan 6 November 2026. Eksekusi harian dan pencatatan manual akun/konten sudah diimplementasikan di kode. Rilis perlu migrasi `20261106010000_creative_command_center.sql` setelah migrasi Hub Iklan; integrasi API, impor CSV, dan push browser belum diaktifkan.

Jika SQL Editor menampilkan `42P07: creative_channel_activations already exists`, jalankan versi terbaru migrasi Hub Iklan. Versi ini mempertahankan baris yang ada, memeriksa kolom yang dibutuhkan, serta dapat dijalankan ulang sebelum atau sesudah Command Center tanpa menghilangkan jadwal tayang aktual. Terapkan migrasi Command Center sekali jika belum tercatat sebagai sudah dijalankan.

## Masalah yang perlu diselesaikan

- Menu sekarang berupa tombol horizontal. Kanban ada, tetapi kolom hanya mengelompokkan tugas pada halaman yang sedang dimuat. Pengguna belum dapat melihat antrean sebenarnya per tahap dan PIC.
- Status siap langsung menuju selesai. `output_url` dipakai sebagai tautan hasil/aset umum, sehingga video final, tautan publik yang benar-benar tayang, dan tanggal tayang aktual belum punya tempat masing-masing.
- Aktivasi punya nama kanal bebas dan satu target/hasil saat ini. Belum ada identitas akun yang stabil atau riwayat pengikut, viewers, klik, dan belanja menurut periode. Ringkasan per platform belum menjawab akun mana yang membaik dan konten mana yang mendorong perubahan.
- Pengingat belum menjadi antrean tindakan yang punya PIC, tenggat respons, dan riwayat. Mengirim tindak lanjut, menerbitkan konten, dan mengubah belanja iklan adalah tiga tindakan berbeda.

## Sidebar dan hierarki halaman

| Kelompok | Menu | Hal pertama yang bisa dilakukan |
|---|---|---|
| Eksekusi | Pusat Kerja | Buka tugas saya hari ini, review yang menunggu, konten siap tayang, atau evaluasi terlambat. |
| Eksekusi | Produksi & Publikasi | Lanjutkan pekerjaan di Kanban; buka panel tugas untuk aset, checklist, catatan dan riwayat. |
| Eksekusi | Campaign Hub | Lihat pekerjaan, konten tayang, aktivasi, anggaran dan diskusi untuk satu kampanye. |
| Eksekusi | Kalender | Bedakan deadline produksi, review, publikasi dan evaluasi; buka record langsung dari jadwal. |
| Eksekusi | Bank Ide & Aset | Temukan referensi dan versi hasil; jadikan ide siap sebagai tugas. |
| Monitoring | Akun & Performa | Pilih akun dan periode, cek pengikut, views, jangkauan, klik dan riwayat konten. |
| Monitoring | Iklan & Evaluasi | Bandingkan rencana dan aktual, cek biaya per hasil, buat keputusan dan tugas tindak lanjut. |
| Monitoring | Kotak Tindakan | Urutkan yang perlu respons; ambil, tunda sampai tanggal tertentu, atau selesaikan tindak lanjut. |
| Monitoring | Tim & PIC | Lihat antrean per PIC dan peran; buka pekerjaan orang yang dipilih. |

Desktop memakai sidebar konsisten; HP memakai menu yang dapat dibuka dari header. Unit bisnis selalu terlihat di header. Pada tampilan lintas usaha, setiap kartu menunjukkan unit asal. Menu dan tombol memakai kemampuan akun yang sudah ada; filter unit bukan pembatas akses database. Pusat Kerja berisi tindakan, halaman detail berisi data lengkap, dan formulir muncul hanya untuk membuat/mengedit sesuatu.

## Dari ide sampai evaluasi

1. **Koordinator** menyiapkan brief dan mengaitkan kampanye, unit, PIC, serta tenggat. Satu brief dapat menghasilkan beberapa tugas bila kanal atau hasilnya berbeda.
2. **Produksi** menggeser tugas melalui **Antrean → Dikerjakan → Review → Siap tayang**. Masukan review bisa mengembalikan tugas ke **Revisi**. Hambatan dicatat dengan alasan dan langkah berikutnya tanpa menghapus posisi tahap sebelumnya. Tugas operasional tanpa publikasi boleh selesai setelah hasilnya diterima.
3. **Publisher** membuka antrean **Siap tayang**, memilih akun yang benar, lalu mencatat tautan publik dan waktu tayang aktual. Untuk konten lintas kanal, buat satu catatan publikasi per akun. Video final internal tetap bisa dilampirkan terpisah sebagai URL Cloudinary. Tombol **Catat tayang** hanya mencatat kejadian; sistem belum mengirim konten ke platform.
4. **PIC kanal** mengisi snapshot metrik pada tanggal yang disepakati atau mengimpor file. Evaluasi menghubungkan data aktual ke target awal dan menyimpan alasan **Lanjutkan / Sesuaikan / Hentikan**. Bila perlu perubahan, tombol **Buat tindak lanjut** menghasilkan tugas dengan PIC dan deadline yang kembali muncul di Pusat Kerja.
5. **Owner** meninjau pekerjaan selesai, publikasi yang benar-benar terjadi, hasil per akun, dan belanja iklan secara terpisah. Hasil kampanye bukan jumlah tugas selesai.

## Data yang perlu ditambahkan

| Entitas | Hubungan dan bidang utama |
|---|---|
| Akun kanal | ID stabil; unit, platform, handle atau ID akun, tautan profil, PIC, status aktif. Aktivasi lama dengan nama bebas dipetakan manual bila ambigu. |
| Publikasi | Relasi tugas–akun; jadwal dan waktu aktual, URL publik, bukti, status. Simpan beberapa publikasi dari satu tugas bila kanal berbeda. |
| Snapshot akun | Akun, periode, sumber, waktu diambil, pengikut akhir periode, views, jangkauan, klik, dan metrik yang tersedia. Impor ulang periode/sumber yang sama memperbarui snapshot tanpa menduplikasi baris. |
| Snapshot konten/iklan | Relasi publikasi atau aktivasi; periode, paid/organic, hasil per metrik, belanja dan pendapatan teratribusi bila ada. Simpan tautan laporan sebagai bukti. |
| Riwayat tindakan | Record, tindakan, PIC/pelaku, waktu, alasan dan tautan. Pindah tahap/approval memeriksa versi baris; perubahan dan pencatatan peristiwa disimpan dalam satu transaksi. |

Pengikut adalah nilai kumulatif pada tanggal tertentu: pertumbuhan = snapshot akhir dikurangi snapshot awal, bukan penjumlahan follower harian. Views bukan viewers unik; jangkauan antar akun tidak dijumlahkan sebagai audiens unik. Bedakan klik profil, klik tautan, dan sesi situs jika sumbernya berbeda. Tampilkan data kosong sebagai **belum tersedia**, bukan nol. Biaya per hasil memakai satu metrik dan periode yang sama; ROAS hanya ditampilkan jika belanja dan pendapatan teratribusi tersedia untuk periode yang sama. Pisahkan paid dan organic serta hindari menghitung hasil dua kali di tingkat akun dan konten.

## Push, biaya, dan urutan pengerjaan

- **Tahap 1 — eksekusi harian:** sidebar, Pusat Kerja, Kanban per tahap dengan hitungan server, kartu tugas yang bisa ditindak, dan bukti tayang. Kotak Tindakan menarik antrian dari deadline, review, dan tindakan yang ditugaskan. Cegah duplikasi tindak lanjut untuk item dan tenggat yang sama.
- **Tahap 2 — monitoring:** master akun, snapshot per akun/konten/iklan, pembaruan manual atau impor CSV dari laporan, perbandingan periode, dan evaluasi yang bisa menghasilkan tugas. Mulai dengan data dua unit usaha sebelum memperluas cakupan.
- **Tahap 3 — integrasi:** push browser opsional untuk pengingat yang benar-benar perlu, sesuai izin pengguna, dengan jam tenang WIB dan batas pengiriman. Sinkronisasi metrik via API resmi dibuat terpisah per platform setelah akses akun dikonfirmasi. Publikasi otomatis atau perubahan budget iklan memerlukan integrasi dan izin tersendiri.

Tidak menghidupkan kembali chat realtime atau polling workspace. Tampilkan ringkasan lewat query agregat, ambil detail sesuai halaman, dan simpan snapshot per periode. Aset tetap berupa tautan Cloudinary atau tautan platform; video tidak ditaruh sebagai Base64 di database. Pengingat dalam aplikasi diperbarui setelah aksi atau saat pengguna menyegarkan tampilan.

Kriteria penerimaan pertama: dari **Pusat Kerja**, PIC bisa membuka satu kartu, mengajukan review, dan mencatat bukti tayang tanpa mengisi ulang judul atau brief. Owner bisa membedakan **siap tayang** dan **sudah tayang** per akun, serta membuka evaluasi iklan terlambat dalam satu klik. Sebagai verifikasi data, impor ulang periode yang sama tidak menduplikasi hasil, dan laporan tidak menjumlahkan pengikut antar tanggal.
