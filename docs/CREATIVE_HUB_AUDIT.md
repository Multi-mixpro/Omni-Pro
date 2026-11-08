# Audit Creative Hub · 8 November 2026

Creative Hub sudah mendukung operasi harian dari ide sampai evaluasi kanal. Implementasi sekarang mencakup 15 menu dan memakai Supabase sebagai sumber data operasional. Blueprint lintas unit, kontrol keuangan, dan pengelolaan aset masih punya pekerjaan lanjutan.

| Urutan sidebar | Menu | Alur yang tersedia dan sumber data |
| --- | --- | --- |
| Ruang kerja | Pusat Kerja | Ringkasan target mingguan, hambatan, kampanye, dan agenda. Menggunakan ringkasan serta kalender dari Supabase. |
| Ruang kerja | Kotak Tindakan | Pintasan antrean dan pengingat kepada PIC utama. Pengingat tersimpan di `creative_task_events`. |
| Perencanaan | Bank Ide | Ide, referensi, prioritas, dan konversi ke tugas setelah PIC dan deadline dipilih. Menggunakan `creative_ideas` dan relasi sumber pada `creative_tasks`. |
| Perencanaan | Kampanye | Portofolio, target, PIC, diskusi, dan anggaran tingkat kampanye. Menggunakan `creative_campaigns`, komentar, dan ringkasan beban tugas. |
| Eksekusi | Produksi & Publikasi | Daftar dan Kanban, PIC serta platform tambahan, checklist, status, bukti tayang, dan hapus dari daftar aktif. Menggunakan `creative_tasks`, `creative_publications`, dan riwayat tindakan. |
| Eksekusi | Studio Brief & Copy | Brief dan naskah pada tugas produksi. Versi dan keputusan tersimpan di `creative_copy_versions` serta `creative_copy_decisions`. |
| Eksekusi | Review & Persetujuan | Antrean tugas untuk reviewer atau pemberi persetujuan yang ditugaskan. Keputusan tugas dan keputusan versi naskah dicatat terpisah. |
| Eksekusi | Kalender | Satu bulan penuh berisi deadline, jadwal tayang, tayang aktual, dan evaluasi dalam WIB. Menggunakan RPC kalender. |
| Eksekusi | Pustaka Aset | Daftar tautan hasil pada tugas. Penyimpanan, metadata, dan versi file aset memerlukan pengembangan lanjutan. |
| Kanal & hasil | Akun & Performa | Registri akun per unit, catatan metrik per periode, publikasi aktual, dan riwayat aktivasi. Angka diisi dari laporan platform. |
| Kanal & hasil | Iklan & Evaluasi | Aktivasi organik atau berbayar, target, hasil, evaluasi, dan tugas tindak lanjut. Menggunakan `creative_channel_activations`. |
| Kanal & hasil | Anggaran Kanal | Ringkasan rencana, realisasi, dan selisih per platform. Anggaran manual kampanye dihitung terpisah. |
| Kanal & hasil | Analitik Creative | Ringkasan pekerjaan, publikasi aktual, dan evaluasi. Ketersediaan angka mengikuti data yang dicatat tim. |
| Administrasi | Tim & PIC | Beban kerja dan target per orang. Tugas kolaboratif muncul pada tiap PIC terkait. |
| Administrasi | Pengaturan Akses | Izin akun sendiri, matriks bawaan role, serta pengelolaan akun untuk admin. Saklar per pengguna memakai izin efektif di Supabase setelah migrasi akses diterapkan. |

**Perbaikan audit**

- Menu aktif memakai parameter URL sehingga refresh dan tombol Back kembali ke halaman yang benar. Sidebar menempatkan Pusat Kerja dan Kotak Tindakan di atas, diikuti Perencanaan, Eksekusi, Kanal & hasil, dan Administrasi.
- Edit tugas ikut menyegarkan detail, daftar, kalender, dan ringkasan yang bergantung pada tugas. Konversi ide dimulai tanpa memilih kampanye dari filter yang tersembunyi.
- Publikasi memerlukan akun aktif dari unit dan platform tugas. Publikasi parsial memperbarui versi tugas. Tugas beberapa platform tetap siap tayang sampai semua platform memiliki bukti.
- Brief, format, platform, dan tautan hasil yang sudah disetujui memerlukan pembukaan kembali tugas sebelum bisa diganti. Pembukaan kembali menghapus status review dan persetujuan lama.
- Saklar Lihat Creative, Kelola pekerjaan, dan Hapus tugas bisa mengatur izin khusus akun aktif. Admin bisa mengembalikan tiap saklar ke bawaan role. Hak administrator tetap dikelola lewat role. Mematikan izin lihat turut menutup edit dan hapus. Mematikan edit menutup hapus. Pemeriksaan reviewer memakai izin efektif.

**Temuan yang masih terbuka**

| Prioritas | Temuan | Dampak dan langkah berikutnya |
| --- | --- | --- |
| P1 | RLS Creative berlaku di tingkat ruang kerja | Pemilih unit bisnis menyaring tampilan. Pisahkan akses data dengan membership per unit sebelum memakai Creative untuk tim yang perlu saling terisolasi. |
| P1 | Hak lihat dan ubah anggaran mengikuti izin Creative umum | Tambahkan izin keuangan dan batas akses data anggaran jika angka hanya boleh dilihat atau diedit oleh peran tertentu. |
| P2 | Keputusan naskah dan tugas masih terpisah | Untuk konten yang mewajibkan persetujuan naskah, tautkan versi yang disetujui ke publikasi dan tentukan kapan versi terbaru harus direview ulang. |
| P2 | Catat tayang bergantung pada bukti aktual yang diinput | Rekap tayang dihitung dari bukti publikasi. Status tugas lama bisa selesai dengan catatan hasil tanpa bukti tayang. Pertahankan perbedaan ini dalam laporan. |
| P2 | Pustaka Aset berupa tautan hasil | Tambahkan registri file, versi aset, hak penggunaan, dan kebijakan pengiriman file bila tim perlu mengelola media di Creative. |
| P2 | Pengingat utama tercatat di aplikasi | Telegram dan pengingat terjadwal memerlukan integrasi. Saat ini permintaan tindak lanjut dikirim ke PIC utama. |
| P3 | Analitik dan anggaran berupa ringkasan operasional | Tambahkan ekspor, metrik biaya yang disepakati, dan buku transaksi jika dibutuhkan untuk pelaporan keuangan. Tampilan tugas tersimpan berlaku pada browser yang menyimpannya. |

**Bukti pemeriksaan**

- 15 menu dibuka di browser lokal dengan sesi admin. Tidak ada pesan gagal memuat pada pemindaian tersebut. Refresh dan Back diperiksa pada Kalender.
- Sebelum penambahan tabel saklar, 13 tabel Creative di Supabase memiliki RLS. Akun anonim tidak memiliki akses baca langsung, dan 8 RPC utama yang diperiksa tidak bisa dipanggil anonim. Pemeriksaan menemukan 8 tugas aktif, 1 tugas yang dihapus dari daftar, dan 1 publikasi. Tidak ditemukan perbedaan unit antara tugas dan kampanye, perbedaan unit publikasi, atau platform publikasi yang tidak cocok pada sampel tersebut. Data naskah dan keputusan versi masih kosong saat audit.
- Uji publikasi dan persetujuan di Supabase lulus untuk penolakan platform salah, tayang parsial, versi kedaluwarsa, penolakan edit hasil yang telah disetujui, pembukaan ulang review, dan riwayat publikasi setelah tugas dihapus. Fixture uji dibatalkan lewat rollback. [Skenario uji](../supabase/audit/creative_hub_regression.sql).
- Uji saklar lulus di PostgreSQL lokal dengan akun uji. Skenario mencakup kesesuaian izin antarmuka dan RLS, penolakan perubahan oleh akun biasa, perlindungan admin, kelayakan reviewer, serta pemulihan bawaan role. [Skenario uji saklar](../supabase/audit/creative_access_switches_regression.sql).
