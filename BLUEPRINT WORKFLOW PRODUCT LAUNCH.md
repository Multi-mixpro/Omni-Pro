# BLUEPRINT WORKFLOW PRODUCT LAUNCH OS

## 1. Tujuan Utama Sistem

Product Launch OS bukan sekadar daftar artikel atau task manager. Sistem ini harus menjadi pusat kendali seluruh proses pengembangan produk fashion, mulai dari ide awal sampai produk siap diproduksi dan dirilis.

Sistem harus membantu perusahaan untuk:

* Menjaga antrean prospek artikel tetap aktif.
* Mengumpulkan referensi produk secara terstruktur.
* Menentukan target sampel, produksi, dan peluncuran.
* Mendokumentasikan bahan, aksesori, supplier, warna, ukuran, dan biaya.
* Mengendalikan proses sampling dan revisi.
* Menghasilkan size chart yang konsisten.
* Menghitung estimasi HPP secara bertahap.
* Menjamin standar kualitas sebelum produksi massal.
* Mengetahui artikel yang terlambat, terhambat, atau siap dilanjutkan.
* Menyimpan seluruh histori keputusan dan perubahan.
* Menghasilkan dokumentasi produk yang dapat digunakan ulang.

Setiap artikel harus memiliki satu **Article Workspace** yang menjadi sumber data utama untuk seluruh informasi produk tersebut.

---

# 2. Prinsip Dasar Workflow

## 2.1 Jangan Menggunakan Satu Formulir Panjang

Owner tidak boleh dipaksa mengisi seluruh data produk pada saat membuat artikel.

Pembuatan artikel dibagi menjadi dua proses:

### Quick Article Intake

Diisi Owner atau Leader Project untuk memasukkan prospek artikel dengan cepat.

Target waktu pengisian maksimal 2–5 menit.

### Article Development Workspace

Dikerjakan secara bertahap oleh tim berdasarkan tahapan, tanggung jawab, dan kesiapan data.

Dengan struktur ini, Owner dapat terus memasukkan prospek artikel tanpa terhambat oleh detail teknis yang belum tersedia.

---

## 2.2 Pisahkan Empat Indikator Utama

Sistem jangan hanya menampilkan satu angka progres.

Setiap artikel harus memiliki empat indikator berbeda:

### Progress

Menunjukkan berapa tahapan pekerjaan yang telah selesai.

Contoh:

`62% proses pengembangan selesai`

### Data Readiness

Menunjukkan kelengkapan informasi artikel.

Contoh:

`78% data produk sudah lengkap`

### Schedule Health

Menunjukkan kondisi artikel terhadap target waktu.

Status:

* On Track
* At Risk
* Overdue
* Blocked
* Ahead of Schedule

### Cost Confidence

Menunjukkan tingkat kepastian estimasi biaya.

Status:

* Estimasi awal
* Berdasarkan penawaran supplier
* Berdasarkan sampel
* HPP produksi terverifikasi

Dengan pemisahan ini, artikel tidak terlihat “selesai” hanya karena task selesai, padahal data biaya atau size chart belum lengkap.

---

# 3. Struktur Status Artikel

## 3.1 Status Portofolio

Status ini menunjukkan posisi artikel dalam antrean keseluruhan.

* Prospect
* Backlog
* Ready to Start
* Active Development
* On Hold
* Blocked
* Ready for Production
* In Production
* Ready to Launch
* Launched
* Cancelled
* Archived

## 3.2 Tahapan Pengembangan Artikel

Workflow utama menggunakan tahapan berikut:

1. Article Intake
2. Product Brief
3. Reference and Concept
4. Variant Planning
5. Material and Supplier Sourcing
6. Draft Size Chart
7. Sampling
8. Fitting and Sample Review
9. HPP and Pricing
10. QC Standard
11. Production Readiness
12. Mass Production
13. Launch Preparation
14. Product Release
15. Post-Launch Review

Tahapan ini tidak sepenuhnya harus berjalan secara serial. Beberapa pekerjaan dapat berjalan paralel setelah persyaratan tertentu terpenuhi.

---

# 4. Peran Pengguna

## 4.1 Owner atau Leader Project

Owner bertanggung jawab terhadap arah artikel.

Hak dan aktivitas utama:

* Membuat artikel baru.
* Menentukan prioritas artikel.
* Menentukan unit bisnis dan kategori.
* Menentukan target sampel, produksi, dan rilis.
* Menetapkan durasi awal setiap tahap.
* Menunjuk PIC atau tim.
* Menentukan target harga dan target kuantitas.
* Menyetujui konsep, sampel, HPP, QC, dan produksi.
* Mengubah prioritas dan target.
* Melihat seluruh pekerjaan lintas tim.
* Menahan, membatalkan, atau mengaktifkan kembali artikel.
* Memberikan komentar dan keputusan.
* Melihat histori perubahan.

## 4.2 Project Leader atau Pimpro

Apabila berbeda dari Owner, Pimpro bertanggung jawab menjalankan pengembangan artikel.

Aktivitas utama:

* Memecah target menjadi task.
* Menentukan urutan dan ketergantungan pekerjaan.
* Menunjuk PIC task.
* Memantau waktu dan hambatan.
* Memverifikasi kelengkapan data.
* Mengajukan persetujuan ke Owner.
* Mengubah estimasi durasi.
* Mengelola revisi sampel.

## 4.3 Tim Eksekusi

Tim dapat terdiri dari bagian riset, desain, sourcing, pola, produksi, QC, marketing, dan keuangan.

Tim dapat:

* Mengisi bagian yang ditugaskan.
* Menambahkan bahan dan supplier.
* Mengunggah foto dan dokumen.
* Memasukkan tanggal mulai dan selesai aktual.
* Menambahkan hasil riset.
* Mengubah status task.
* Menambahkan blocker.
* Mengajukan perubahan target.
* Mengajukan persetujuan.
* Memberikan komentar dan mention.
* Mengisi biaya aktual.
* Melaporkan hasil sampel dan QC.

## 4.4 Aturan Approval

Semua pengguna dapat memperbarui informasi sesuai aksesnya, tetapi keputusan penting harus menggunakan approval gate.

Data yang memerlukan approval:

* Concept Lock
* Color and Variant Lock
* Size Chart Lock
* Material Lock
* Sample Approval
* HPP Approval
* QC Approval
* Production Release
* Launch Approval

Setelah bagian dikunci, perubahan tetap dapat dilakukan, tetapi harus melalui proses revisi dan meninggalkan histori perubahan.

---

# 5. Formulir Create Artikel Baru

## 5.1 Informasi Dasar

Field utama:

* Nama artikel sementara
* Nama produk target
* Kode artikel otomatis
* Unit bisnis
* Brand
* Kategori utama
* Subkategori
* Jenis produk
* Gender atau target pengguna
* Season atau koleksi
* Project Owner
* Project Leader
* Priority
* Tingkat kerahasiaan
* Deskripsi singkat produk

Contoh kategori:

* Jacket
* T-Shirt
* Polo Shirt
* Shirt
* Hoodie
* Crewneck
* Pants
* Shorts
* Skirt
* Dress
* Vest
* Hat
* Bag
* Accessories
* Uniform
* Custom Product
* Kategori custom

## 5.2 Target Utama

* Target sampel pertama
* Target sampel final
* Target produksi massal
* Target produk keluar dari produksi
* Target mulai pemasaran
* Target tanggal rilis
* Durasi pengembangan yang diinginkan
* Target kuantitas produksi
* Target harga jual
* Target maksimal HPP
* Target margin
* Channel penjualan
* Target pasar

Owner dapat mengisi target menggunakan:

* Tanggal pasti
* Estimasi minggu
* Durasi hari
* Belum ditentukan

## 5.3 Referensi Awal

Owner dapat memasukkan:

* Foto utama produk
* Galeri gambar referensi
* Lampiran PDF
* Screenshot
* Video
* Link marketplace
* Link website
* Link media sosial
* Link supplier
* Catatan dari masing-masing referensi

Setiap referensi memiliki label:

* Siluet
* Material
* Warna
* Detail jahitan
* Fitur
* Size chart
* Packaging
* Harga pasar
* Kompetitor
* Inspirasi umum

## 5.4 Varian Awal

* Rencana warna
* Kode warna
* Nama warna internal
* Referensi swatch
* Rencana ukuran
* Variant style
* Variant material
* Variant gender
* Variant packaging
* Catatan kombinasi warna

Varian awal masih bersifat draft dan dapat dikembangkan oleh tim.

## 5.5 Tim dan Durasi Awal

Owner cukup menentukan:

* PIC utama
* Tim yang terlibat
* Estimasi jumlah hari per tahap
* Tahap yang wajib dilakukan
* Tahap yang boleh dilewati

Sistem kemudian menghasilkan workflow dan draft task berdasarkan template kategori produk.

---

# 6. Article Workspace

Setelah artikel dibuat, pengguna diarahkan ke halaman khusus artikel.

## 6.1 Header Artikel

Header harus selalu menampilkan:

* Foto utama
* Nama artikel
* Kode artikel
* Brand dan unit bisnis
* Kategori
* Status utama
* Tahap aktif
* Persentase progres
* Data readiness
* Schedule health
* Target sampel
* Target produksi
* Target rilis
* PIC
* Jumlah blocker
* Tombol approval
* Tombol tambah task
* Tombol tambah update

## 6.2 Navigasi Workspace

Gunakan navigasi tab atau sidebar:

1. Overview
2. Product Brief
3. References
4. Variants
5. Size Chart
6. Materials and BOM
7. Suppliers
8. Sampling
9. Costing and HPP
10. QC
11. Production
12. Launch
13. Tasks
14. Files
15. Discussion
16. Activity History

Pengguna tidak perlu berpindah ke banyak menu aplikasi. Semua informasi artikel tersedia dalam satu workspace.

---

# 7. Workflow Lengkap per Tahap

## Tahap 1 — Article Intake

Tujuan:

Menyimpan prospek artikel dengan cepat.

Output minimum:

* Nama artikel
* Kategori
* Foto atau referensi
* Unit bisnis
* Owner
* Target awal
* Priority

Status:

* Draft
* Submitted
* Accepted to Backlog
* Rejected
* Duplicate

Artikel belum masuk proses aktif sebelum melewati pemeriksaan minimum.

---

## Tahap 2 — Product Brief

Tim dan Owner menyempurnakan definisi produk.

Informasi:

* Tujuan produk
* Masalah yang ingin diselesaikan
* Target pengguna
* Kegunaan produk
* Segmentasi harga
* Channel penjualan
* Target kuantitas
* Target margin
* Fitur utama
* Fitur wajib
* Fitur opsional
* Larangan desain
* Benchmark kompetitor
* Risiko awal

Output:

`Product Brief Approved`

---

## Tahap 3 — Reference and Concept

Referensi tidak hanya disimpan sebagai galeri, tetapi dapat diberi anotasi.

Setiap gambar dapat memiliki:

* Pin komentar
* Bagian yang ingin ditiru
* Bagian yang tidak boleh ditiru
* Catatan material
* Catatan konstruksi
* Catatan warna
* Catatan ukuran
* Sumber
* Hak penggunaan
* Status review

Tim dapat membuat Concept Board yang berisi referensi terpilih.

Output:

* Concept direction
* Siluet utama
* Fitur utama
* Draft konstruksi
* Concept Lock

---

## Tahap 4 — Variant Planning

Gunakan matriks varian agar tidak membingungkan.

Contoh struktur:

| Colorway    | Size  | Material    | Status   | SKU      |
| ----------- | ----- | ----------- | -------- | -------- |
| Black       | S–XXL | Micro NS    | Approved | Otomatis |
| Jade–Petrol | S–XXL | Colombia WP | Draft    | Otomatis |

Fitur:

* Tambah warna dari master warna.
* Tambah warna custom.
* Simpan warna custom ke master.
* Upload swatch.
* Input kode supplier.
* Input kode warna internal.
* Menonaktifkan ukuran tertentu untuk warna tertentu.
* Membuat kombinasi warna.
* Membuat SKU otomatis.
* Menandai varian sample only.
* Menandai varian production ready.
* Menentukan minimum produksi per varian.

Output:

`Variant Matrix Approved`

---

## Tahap 5 — Material, Supplier, dan BOM

Satu artikel dapat memiliki banyak bahan dan aksesori.

Gunakan struktur Bill of Materials atau BOM.

### Kelompok Komponen

* Main fabric
* Secondary fabric
* Lining
* Interlining
* Padding
* Rib
* Webbing
* Elastic
* Zipper
* Button
* Snap
* Velcro
* Thread
* Drawcord
* Eyelet
* Label
* Patch
* Printing
* Embroidery
* Polybag
* Hangtag
* Carton
* Packaging
* Komponen custom

### Data Setiap BOM Item

* Nama komponen
* Kategori
* Material
* Supplier utama
* Supplier alternatif
* Kode supplier
* Warna
* Unit
* Konsumsi per produk
* Waste allowance
* MOQ
* Harga satuan
* Mata uang
* Minimum order
* Lead time
* Ketersediaan stok
* Validitas harga
* Status sample
* Foto material
* Dokumen supplier
* Catatan kualitas

Pengguna dapat memilih dari master atau membuat komponen baru.

Ketika komponen baru dibuat:

* Komponen tersimpan ke master.
* Dapat dipilih pada artikel lain.
* Tidak otomatis mengubah artikel lama.
* Memiliki histori harga supplier.

### Perbandingan Supplier

Sistem harus menyediakan supplier comparison:

* Harga
* MOQ
* Lead time
* Kualitas
* Konsistensi warna
* Kemampuan produksi
* Ketepatan pengiriman
* Status verifikasi
* Rating internal
* Catatan masalah terdahulu

Output:

* BOM Draft
* Supplier Candidate
* Material Lock

---

## Tahap 6 — Draft Size Chart

Size chart harus menggunakan template berdasarkan kategori produk.

## Library Variabel Ukuran untuk Atasan dan Jaket

* Panjang badan depan
* Panjang badan belakang
* Lebar bahu
* Panjang bahu
* Lebar dada
* Lingkar dada
* Lebar pinggang
* Lingkar pinggang
* Lebar bawah
* Lingkar bawah
* Panjang lengan
* Panjang lengan dari leher
* Lebar lengan atas
* Lingkar bisep
* Lebar siku
* Lebar manset
* Lingkar manset
* Tinggi kerung lengan
* Lingkar kerung lengan
* Lebar leher
* Lingkar leher
* Kedalaman leher depan
* Kedalaman leher belakang
* Tinggi kerah
* Panjang rib bawah
* Tinggi rib bawah
* Lebar hoodie
* Tinggi hoodie
* Kedalaman hoodie
* Panjang visor hoodie
* Bukaan zipper
* Panjang saku
* Lebar saku

## Library Variabel Ukuran untuk Celana

* Lingkar pinggang rileks
* Lingkar pinggang maksimal
* Lebar pinggang
* Lingkar pinggul
* Lebar pinggul
* Front rise
* Back rise
* Panjang sisi luar
* Panjang inseam
* Lingkar paha
* Lebar paha
* Lingkar lutut
* Lebar lutut
* Lingkar bukaan kaki
* Lebar bukaan kaki
* Tinggi waistband
* Panjang zipper
* Lebar saku
* Kedalaman saku

## Library Variabel untuk Topi

* Lingkar kepala
* Tinggi crown
* Lebar crown
* Panjang visor
* Lebar visor
* Tinggi panel depan
* Panjang strap
* Lebar strap

## Library Variabel untuk Tas

* Panjang
* Lebar
* Tinggi
* Kedalaman
* Panjang tali
* Lebar tali
* Bukaan utama
* Ukuran kompartemen
* Ukuran saku
* Kapasitas

### Fitur Size Chart

* Template berdasarkan kategori.
* Tambah variabel custom.
* Simpan variabel custom ke library.
* Atur satuan sentimeter atau inci.
* Toleransi plus-minus per ukuran.
* Grading otomatis antar-size.
* Nilai target.
* Nilai aktual sampel.
* Selisih target dengan aktual.
* Status pass atau fail.
* Versi size chart.
* Lock size chart.
* Export tech pack.

Sistem harus membedakan:

* Draft measurement
* Target measurement
* Sample actual measurement
* Final production measurement

Output:

`Size Chart Lock`

---

## Tahap 7 — Sampling

Setiap artikel dapat memiliki beberapa iterasi sampel.

Contoh:

* Sample V1
* Sample V2
* Sample V3
* Pre-production sample
* Golden sample

### Data Setiap Sampel

* Nomor versi
* Tanggal permintaan
* Tanggal mulai
* Target selesai
* Tanggal diterima
* Pembuat sampel
* Supplier atau workshop
* Material yang digunakan
* Warna
* Ukuran
* Biaya sampel
* Foto depan
* Foto belakang
* Foto samping
* Foto detail
* Video fitting
* Hasil pengukuran
* Catatan konstruksi
* Catatan jahitan
* Catatan material
* Catatan warna
* Catatan fitting
* Keputusan

Keputusan sampel:

* Approved
* Approved with Revision
* Revision Required
* Rejected
* Waiting for Review

Sistem harus menyimpan alasan revisi agar masalah yang sama tidak berulang.

---

## Tahap 8 — Fitting and Sample Review

Gunakan checklist review yang terstruktur:

* Siluet
* Proporsi
* Kenyamanan
* Ukuran
* Pergerakan
* Material
* Warna
* Kerapian jahitan
* Konstruksi
* Aksesori
* Finishing
* Branding
* Label
* Packaging
* Kesesuaian dengan brief

Temuan dikategorikan sebagai:

* Critical
* Major
* Minor
* Suggestion

Setiap temuan memiliki:

* Foto
* Lokasi masalah
* Penanggung jawab
* Tindakan perbaikan
* Target selesai
* Status penyelesaian

Output:

`Sample Approval` dan penetapan `Golden Sample`.

---

## Tahap 9 — Costing dan HPP

Komponen biaya dibuat dinamis.

### Master Komponen Biaya

* Main material
* Secondary material
* Accessories
* Cutting
* Sewing
* Printing
* Embroidery
* Washing
* Finishing
* Quality control
* Packaging
* Transport
* Sample allocation
* Reject allowance
* Waste allowance
* Overhead
* Marketplace fee
* Marketing allocation
* Tax
* Komponen custom

Saat pengguna membuat komponen baru:

* Komponen disimpan ke master.
* Dapat digunakan pada artikel lain.
* Pengguna menentukan kategori biaya.
* Pengguna menentukan apakah biaya dihitung per unit, per batch, persentase, atau tetap.

### Versi Perhitungan

Sistem menyimpan beberapa versi:

* Initial Estimate
* Supplier Quotation
* Sample Cost
* Pre-production HPP
* Actual Production HPP

### Simulasi Harga

Sistem menghitung:

* HPP dasar
* HPP setelah waste
* HPP setelah reject allowance
* HPP produksi
* Harga grosir
* Harga reseller
* Harga retail
* Margin nominal
* Margin persentase
* Break-even quantity

Output:

`HPP Approved`

---

## Tahap 10 — QC Standard

QC tidak hanya dilakukan di akhir produksi.

QC terdiri dari:

* Material incoming QC
* Cutting QC
* Sewing inline QC
* Finishing QC
* Measurement QC
* Final product QC
* Packaging QC

### Checklist Dinamis

Checklist dibuat berdasarkan kategori produk.

Contoh pemeriksaan:

* Konsistensi warna
* Gramasi material
* Kekuatan jahitan
* Jumlah stitch
* Kerapian obras
* Posisi zipper
* Posisi label
* Posisi patch
* Simetri
* Ukuran aktual
* Toleransi ukuran
* Fungsi aksesori
* Noda
* Lubang
* Benang tersisa
* Packaging

Setiap artikel memiliki:

* Standar pass
* Toleransi
* Metode pemeriksaan
* Sample reference
* Critical defect definition
* Major defect definition
* Minor defect definition

Output:

`QC Standard Approved`

---

## Tahap 11 — Production Readiness

Sebelum produksi massal, sistem melakukan readiness check.

Checklist wajib:

* Product brief terkunci
* Varian terkunci
* Size chart terkunci
* BOM terkunci
* Supplier terpilih
* Harga supplier terverifikasi
* Golden sample disetujui
* HPP disetujui
* QC standard tersedia
* Packaging tersedia
* Material tersedia
* Kapasitas produksi tersedia
* Target kuantitas final
* Jadwal produksi tersedia

Sistem tidak boleh mengubah artikel menjadi `Ready for Production` apabila item kritis belum lengkap, kecuali Owner memberikan override dengan alasan.

Output:

`Production Release Approval`

---

## Tahap 12 — Mass Production

Data produksi:

* Nomor batch
* Workshop atau vendor
* Tanggal mulai
* Target selesai
* Kuantitas per varian
* Material issued
* Material used
* Material remaining
* Progress cutting
* Progress sewing
* Progress finishing
* Progress QC
* Quantity passed
* Quantity rejected
* Quantity reworked
* Kendala produksi
* Estimasi penyelesaian terbaru

Tahapan produksi dapat berjalan bersamaan dengan persiapan peluncuran.

---

## Tahap 13 — Launch Preparation

Launch preparation menjadi workstream paralel.

Dapat dimulai setelah Concept Lock atau Sample Approval sesuai kebutuhan.

Aktivitas:

* Penamaan produk final
* Deskripsi produk
* Selling points
* Foto produk
* Foto model
* Video produk
* Marketplace assets
* Size guide
* Packaging
* Harga jual
* SKU
* Barcode
* Stok awal
* Channel penjualan
* Jadwal konten
* Campaign
* Launch checklist

Status:

* Not Started
* In Preparation
* Waiting Product
* Ready
* Published

---

## Tahap 14 — Product Release

Artikel hanya dapat dirilis ketika:

* Produk tersedia.
* Harga jual disetujui.
* SKU aktif.
* Stok tersedia.
* Foto dan deskripsi tersedia.
* Size guide tersedia.
* QC produksi lolos.
* Channel penjualan siap.

Output:

* Tanggal rilis aktual
* Kuantitas awal
* Channel aktif
* Link produk
* Materi pemasaran
* Launch approval

---

## Tahap 15 — Post-Launch Review

Setelah rilis, sistem menyimpan evaluasi:

* Penjualan awal
* Varian terlaris
* Ukuran terlaris
* Keluhan pelanggan
* Retur
* Masalah ukuran
* Masalah material
* Selisih HPP estimasi dengan aktual
* Kinerja supplier
* Ketepatan jadwal
* Pelajaran pengembangan
* Rekomendasi restock
* Rekomendasi revisi artikel

Data ini menjadi pengetahuan untuk artikel berikutnya.

---

# 8. Sistem Task dan Penjadwalan

## 8.1 Owner Tidak Harus Menentukan Semua Tanggal

Owner cukup memasukkan:

* Target akhir
* Target sampel
* Target produksi
* Durasi estimasi
* Prioritas

Sistem menghasilkan draft jadwal berdasarkan template kategori.

Contoh template jaket:

1. Brief — 2 hari
2. Riset material — 4 hari
3. Draft size chart — 2 hari
4. Pembuatan pola — 3 hari
5. Sample V1 — 5 hari
6. Review — 2 hari
7. Revisi — 4 hari
8. Costing — 2 hari
9. Final approval — 1 hari

Tim kemudian mengisi:

* Tanggal mulai aktual
* Target selesai aktual
* Tanggal selesai aktual
* Estimasi terbaru
* Blocker
* Hasil pekerjaan

## 8.2 Jenis Tanggal

Setiap task memiliki:

* Planned Start
* Planned Finish
* Actual Start
* Actual Finish
* Forecast Finish
* Due Date

Jangan mengganti tanggal rencana ketika terjadi keterlambatan. Gunakan Forecast Finish agar sistem tetap menyimpan histori rencana awal.

## 8.3 Dependency

Task dapat memiliki ketergantungan:

* Finish to Start
* Start to Start
* Finish to Finish
* Tidak memiliki dependency

Contoh:

Foto produk dapat dipersiapkan setelah Sample Approval, sementara pembuatan deskripsi produk dapat dimulai sejak Product Brief selesai.

## 8.4 Status Task

* Not Started
* Ready
* In Progress
* Waiting
* Blocked
* In Review
* Revision
* Completed
* Cancelled

## 8.5 Blocker Management

Saat task menjadi Blocked, pengguna wajib mengisi:

* Jenis blocker
* Penjelasan
* Penanggung jawab penyelesaian
* Target penyelesaian
* Dampak
* Apakah mengubah target artikel

Blocker tampil jelas di dashboard Owner.

---

# 9. Kolaborasi Dua Sisi

## 9.1 Update Owner

Owner dapat memberikan:

* Keputusan
* Perubahan arah
* Perubahan prioritas
* Perubahan target
* Approval
* Catatan strategis

## 9.2 Update Tim

Tim dapat memberikan:

* Daily atau periodic update
* Hasil pekerjaan
* Kendala
* Kebutuhan keputusan
* Perubahan estimasi
* Dokumen dan lampiran
* Permintaan approval

## 9.3 Format Update

Setiap update sebaiknya menggunakan format:

* Apa yang selesai
* Apa yang sedang berjalan
* Apa yang terhambat
* Keputusan yang dibutuhkan
* Langkah berikutnya
* Estimasi penyelesaian

Update tersimpan dalam timeline aktivitas dan tidak menimpa update sebelumnya.

## 9.4 Decision Request

Tim dapat membuat kartu khusus `Decision Required`.

Isi:

* Pertanyaan keputusan
* Pilihan yang tersedia
* Dampak setiap pilihan
* Batas waktu keputusan
* Rekomendasi tim

Owner dapat memilih, memberikan catatan, atau meminta data tambahan.

---

# 10. Tampilan Dashboard

## 10.1 Owner Command Center

Dashboard Owner harus menampilkan:

* Jumlah prospect baru
* Artikel aktif
* Artikel at risk
* Artikel overdue
* Artikel blocked
* Artikel menunggu approval
* Artikel siap produksi
* Artikel siap launch
* Target rilis bulan ini
* Beban kerja per anggota
* Target yang berpotensi terlambat
* Supplier bermasalah
* Estimasi kebutuhan modal
* Artikel dengan HPP melebihi target

## 10.2 Pipeline Artikel

Gunakan tampilan horizontal berdasarkan tahap:

* Prospect
* Brief
* Sourcing
* Sampling
* Costing
* Production Ready
* Production
* Launch Ready
* Launched

Pengguna dapat membuka detail tanpa meninggalkan dashboard.

## 10.3 Launch Calendar

Kalender menampilkan:

* Target sample
* Target produksi
* Target foto produk
* Target stock ready
* Target rilis
* Campaign
* Restock

Artikel yang bertabrakan dalam penggunaan sumber daya harus diberi peringatan.

---

# 11. Tampilan Daftar Artikel

Sediakan beberapa mode tampilan.

## 11.1 Grid View

Setiap kartu menampilkan:

* Foto produk
* Nama artikel
* Kode artikel
* Kategori
* Unit bisnis
* Status
* Tahap aktif
* Progress
* Data readiness
* Target rilis
* Countdown
* PIC
* Blocker
* Approval yang menunggu

Grid cocok untuk eksplorasi visual produk.

## 11.2 List View

Kolom yang dapat dikustomisasi:

* Artikel
* Brand
* Kategori
* Priority
* Status
* Tahap
* Progress
* Readiness
* Schedule health
* Owner
* PIC
* Target sampel
* Target produksi
* Target rilis
* HPP estimasi
* Target harga
* Jumlah blocker
* Update terakhir

Pengguna dapat:

* Menampilkan atau menyembunyikan kolom.
* Mengurutkan data.
* Melakukan bulk update.
* Menyimpan filter menjadi Saved View.
* Export data.
* Membandingkan artikel.

## 11.3 Kanban View

Kanban dapat dikelompokkan berdasarkan:

* Tahap
* Status
* Owner
* Priority
* Schedule health
* Unit bisnis

## 11.4 Timeline atau Gantt View

Menampilkan:

* Tahapan artikel
* Durasi rencana
* Durasi aktual
* Dependency
* Forecast
* Keterlambatan
* Milestone

---

# 12. Filter dan Saved Views

Filter penting:

* Unit bisnis
* Brand
* Kategori
* Status
* Tahap
* Priority
* Owner
* PIC
* Target bulan
* Supplier
* Schedule health
* Data readiness
* HPP di atas target
* Menunggu approval
* Memiliki blocker
* Tidak memiliki update
* Belum memiliki supplier
* Belum memiliki sample
* Belum memiliki size chart final

Contoh Saved View:

* My Active Articles
* Waiting for Owner Approval
* Release This Month
* Overdue Sampling
* HPP Above Target
* Supplier Not Confirmed
* Ready for Production
* Launch Assets Incomplete

---

# 13. Antrean Artikel yang Selalu Hidup

Karena Owner akan terus membuat prospek artikel, gunakan empat lapisan antrean:

## Idea Pool

Masih berupa inspirasi awal.

## Prospect Backlog

Sudah memiliki informasi minimum, tetapi belum diprioritaskan.

## Ready Queue

Data awal cukup dan siap mulai ketika kapasitas tersedia.

## Active Development

Sedang dikerjakan oleh tim.

Jangan mengaktifkan seluruh artikel secara bersamaan. Gunakan batas Work in Progress agar tim tidak memiliki terlalu banyak pekerjaan aktif.

Artikel dapat dinilai menggunakan priority score:

* Potensi penjualan
* Kesesuaian strategi
* Target margin
* Ketersediaan bahan
* Kesiapan supplier
* Kompleksitas
* Kecepatan produksi
* Momentum pasar
* Kebutuhan pelanggan
* Ketersediaan kapasitas

Sistem kemudian memberikan rekomendasi:

* Start Now
* Prepare First
* Hold
* Low Priority
* Reject

Keputusan akhir tetap berada pada Owner.

---

# 14. Otomasi yang Dibutuhkan

## Saat Artikel Dibuat

Sistem otomatis:

* Membuat kode artikel.
* Membuat folder media.
* Membuat workflow berdasarkan kategori.
* Membuat draft task.
* Membuat milestone.
* Membuat checklist kelengkapan.
* Mengirim notifikasi kepada Project Leader.

## Saat Target Berubah

Sistem otomatis:

* Menghitung ulang forecast.
* Menandai task yang terdampak.
* Memberikan peringatan kepada PIC.
* Menyimpan histori target lama.
* Meminta alasan perubahan.

## Saat Task Terlambat

Sistem:

* Mengubah health menjadi At Risk atau Overdue.
* Menampilkan peringatan.
* Meminta forecast terbaru.
* Mengirim notifikasi kepada PIC dan Project Leader.

## Saat Approval Diperlukan

Sistem:

* Membuat notification.
* Menampilkan artikel di Waiting Approval.
* Menyimpan waktu permintaan.
* Menghitung lama menunggu keputusan.

## Saat Komponen Baru Dibuat

Sistem menawarkan:

* Simpan hanya untuk artikel ini.
* Simpan ke master komponen.
* Gunakan sebagai template kategori.

---

# 15. Audit, Versioning, dan Keamanan Data

Setiap perubahan penting harus memiliki:

* Pengguna yang mengubah
* Waktu perubahan
* Nilai sebelum
* Nilai sesudah
* Alasan perubahan
* Lampiran pendukung

Data yang memerlukan versi:

* Product brief
* Size chart
* BOM
* HPP
* Sample
* QC checklist
* Target jadwal
* Variant matrix

Sistem harus mendukung:

* Restore versi
* Compare versi
* Lock versi
* Duplicate artikel
* Clone artikel menjadi artikel baru
* Archive tanpa menghapus histori

---

# 16. Struktur Data Utama

Entitas inti yang direkomendasikan:

* articles
* article_categories
* article_status_history
* article_targets
* article_members
* article_references
* article_assets
* article_variants
* color_library
* size_templates
* measurement_fields
* article_size_charts
* article_measurements
* materials
* accessories
* suppliers
* supplier_materials
* supplier_quotes
* article_bom_items
* cost_component_library
* article_cost_versions
* article_cost_items
* sample_iterations
* sample_measurements
* sample_reviews
* qc_templates
* article_qc_checks
* production_batches
* launch_assets
* launch_channels
* tasks
* task_dependencies
* task_updates
* blockers
* approvals
* decisions
* comments
* notifications
* activity_logs

Struktur ini memungkinkan data master digunakan ulang tanpa mencampurkan data historis artikel.

---

# 17. Dokumentasi Akhir Artikel

Setelah artikel siap produksi, sistem dapat menghasilkan satu paket dokumentasi otomatis:

## Product Development Pack

Berisi:

* Identitas artikel
* Product brief
* Foto dan referensi
* Variant matrix
* Size chart
* BOM
* Daftar supplier
* Material specification
* HPP
* Sample history
* Golden sample
* QC checklist
* Production instruction
* Packaging instruction
* Approval history

## Launch Pack

Berisi:

* Nama produk
* Deskripsi
* Selling points
* Harga
* SKU
* Barcode
* Size guide
* Foto
* Video
* Marketplace assets
* Jadwal rilis
* Channel penjualan

Dokumentasi dapat dilihat di sistem atau diekspor untuk kebutuhan supplier, produksi, QC, dan marketing.

---

# 18. KPI Product Launch OS

Dashboard analitik sebaiknya mengukur:

* Rata-rata waktu pengembangan artikel
* Waktu per tahap
* Jumlah revisi sampel
* First sample approval rate
* Ketepatan target sampel
* Ketepatan target produksi
* Ketepatan target launch
* Jumlah artikel blocked
* Rata-rata lama approval
* Selisih HPP estimasi dan aktual
* Persentase artikel melebihi target HPP
* Supplier lead-time accuracy
* Supplier quality score
* QC pass rate
* Reject rate
* Data completeness saat production release
* Jumlah artikel aktif per anggota tim
* Persentase artikel yang dibatalkan
* Penjualan awal setelah launch

---

# 19. Prioritas Implementasi

## Fase 1 — Fondasi Utama

Bangun terlebih dahulu:

* Quick Create Article
* Article Workspace
* Status dan tahapan
* Target dan milestone
* Task dan dependency
* Grid dan list artikel
* Product brief
* Reference management
* Variant matrix
* Size chart dinamis
* BOM material dan aksesori
* Supplier
* Sampling
* HPP
* Approval
* Comments dan activity log
* Dashboard dasar

## Fase 2 — Stabilization

Tambahkan:

* Saved views
* Kanban
* Timeline
* Notifications
* Blocker management
* Decision request
* Version comparison
* Data readiness score
* Schedule health
* Workload monitoring
* Clone article
* Category templates

## Fase 3 — Professional Optimization

Tambahkan:

* Production readiness gate
* Production batch monitoring
* QC digital
* Launch calendar
* Product Development Pack
* Launch Pack
* Supplier scorecard
* HPP variance
* Capacity planning
* Portfolio priority score
* Analytics dan KPI

---

# 20. Rekomendasi Struktur Halaman

Struktur navigasi Product Launch OS:

### Dashboard

Pusat monitoring Owner.

### Article Pipeline

Seluruh antrean artikel.

### Launch Calendar

Target sampel, produksi, dan release.

### Tasks

Daftar pekerjaan lintas artikel.

### Approvals

Semua permintaan keputusan dan persetujuan.

### Materials and Accessories

Master bahan dan aksesori.

### Suppliers

Database supplier dan histori kinerja.

### Templates

Template workflow, kategori, size chart, QC, dan biaya.

### Reports

Analitik proses pengembangan.

### Settings

Role, permission, unit bisnis, dan konfigurasi sistem.

---

# 21. Bentuk UI Article Workspace yang Direkomendasikan

Gunakan layout tiga area.

## Area Kiri

Navigasi tahapan:

* Brief
* References
* Variants
* Materials
* Size Chart
* Sampling
* HPP
* QC
* Production
* Launch

Setiap menu menampilkan indikator:

* Belum mulai
* Sedang dikerjakan
* Kurang data
* Menunggu approval
* Selesai
* Bermasalah

## Area Tengah

Lembar kerja utama sesuai menu yang dipilih.

Gunakan:

* Inline editing
* Autosave
* Table editing
* Drag and drop
* Bulk input
* Upload langsung
* Expandable sections
* Sticky action bar

## Area Kanan

Panel ringkasan tetap:

* Progress
* Readiness
* Health
* Target berikutnya
* PIC
* Task terdekat
* Blocker
* Approval
* Latest update
* Decision required

Layout ini membuat pengguna tetap mengetahui konteks artikel meskipun sedang mengisi detail teknis.

---

# 22. Kesimpulan Desain

Workflow terbaik untuk Product Launch OS adalah workflow berbasis tahapan, dependency, approval gate, dan dokumentasi versi.

Owner tidak perlu mengisi seluruh detail. Owner berfokus pada:

* Arah produk
* Prioritas
* Target
* Tim
* Anggaran
* Keputusan
* Approval

Tim berfokus pada:

* Riset
* Pengumpulan data
* Sourcing
* Size chart
* Sampling
* HPP
* QC
* Produksi
* Launch preparation

Kedua pihak tetap dapat melihat dan memperbarui data secara kolaboratif, tetapi keputusan penting dikontrol melalui approval.

Empat indikator utama—Progress, Data Readiness, Schedule Health, dan Cost Confidence—akan membuat sistem jauh lebih akurat dibandingkan task manager biasa.

Dengan rancangan ini, Product Launch OS akan menjadi:

* Pusat antrean ide dan prospek artikel.
* Sistem pengembangan produk.
* Database material dan supplier.
* Sistem dokumentasi sampel.
* Sistem kalkulasi HPP.
* Sistem kontrol kualitas.
* Sistem monitoring produksi.
* Sistem persiapan peluncuran.
* Sumber pengetahuan perusahaan untuk pengembangan produk selanjutnya.
