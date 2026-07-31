/**
 * Product Launch OS 3.0 - Reference Library: Points of Measure (POM) per Garment Category
 *
 * Sumber data referensi resmi untuk Size Chart. Dipakai untuk:
 *  - Auto-deteksi variabel ukuran yang relevan dengan kategori artikel
 *  - Template "Terapkan Template <kategori>" pada panel Size Chart
 *  - Daftar rekomendasi pada modal "Pilih & Kelola Variabel"
 *
 * Konvensi pengukuran mengikuti praktik tech pack garmen:
 *  - "1/2" berarti diukur datar (flat / half measurement), bukan melingkar.
 *  - HPS = High Point Shoulder (titik bahu tertinggi).
 *  - Toleransi dalam sentimeter (±).
 *
 * CATATAN: Angka ukuran per size TIDAK disimpan di sini. File ini hanya
 * mendefinisikan VARIABEL apa yang diukur; nilai target diisi oleh user
 * per artikel agar tidak ada angka spesifikasi yang dikarang sistem.
 */

import { CategoryType, MeasurementField } from '../types';

export const MEASUREMENT_FIELDS: MeasurementField[] = [
  // ============================================================
  // T-Shirt / Shirt
  // ============================================================
  { id: 'ts-01', code: 'CHEST_WIDTH_HALF', labelId: 'Lebar Dada 1/2', aliasEn: 'Chest Width 1/2', category: 'T-Shirt / Shirt', measurementMethod: 'Diukur datar 2.5cm di bawah kerung lengan, dari sisi ke sisi', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'ts-02', code: 'BODY_LENGTH_HPS', labelId: 'Panjang Badan (dari HPS)', aliasEn: 'Body Length from HPS', category: 'T-Shirt / Shirt', measurementMethod: 'Diukur dari High Point Shoulder lurus ke kelim bawah', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'ts-03', code: 'SHOULDER_WIDTH', labelId: 'Lebar Bahu', aliasEn: 'Shoulder Width', category: 'T-Shirt / Shirt', measurementMethod: 'Diukur dari ujung jahitan bahu kiri ke kanan melewati leher belakang', defaultTolerance: 0.5, importance: 'Required' },
  { id: 'ts-04', code: 'SLEEVE_LENGTH', labelId: 'Panjang Lengan', aliasEn: 'Sleeve Length', category: 'T-Shirt / Shirt', measurementMethod: 'Diukur dari ujung jahitan bahu ke ujung lengan', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'ts-05', code: 'SLEEVE_OPENING_HALF', labelId: 'Lebar Bukaan Lengan 1/2', aliasEn: 'Sleeve Opening 1/2', category: 'T-Shirt / Shirt', measurementMethod: 'Diukur datar pada ujung bukaan lengan', defaultTolerance: 0.5, importance: 'Required' },
  { id: 'ts-06', code: 'BOTTOM_SWEEP_HALF', labelId: 'Lebar Kelim Bawah 1/2', aliasEn: 'Bottom Sweep 1/2', category: 'T-Shirt / Shirt', measurementMethod: 'Diukur datar pada kelim paling bawah', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'ts-07', code: 'NECK_WIDTH', labelId: 'Lebar Leher (dalam)', aliasEn: 'Neck Width (inside)', category: 'T-Shirt / Shirt', measurementMethod: 'Diukur dari sisi dalam rib leher kiri ke kanan', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'ts-08', code: 'NECK_DROP_FRONT', labelId: 'Kedalaman Leher Depan', aliasEn: 'Front Neck Drop', category: 'T-Shirt / Shirt', measurementMethod: 'Diukur dari garis HPS turun ke titik terendah leher depan', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'ts-09', code: 'ARMHOLE_STRAIGHT', labelId: 'Kerung Lengan (lurus)', aliasEn: 'Armhole Straight', category: 'T-Shirt / Shirt', measurementMethod: 'Diukur lurus dari titik bahu ke titik bawah kerung lengan', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'ts-10', code: 'RIB_HEIGHT_NECK', labelId: 'Tinggi Rib Leher', aliasEn: 'Neck Rib Height', category: 'T-Shirt / Shirt', measurementMethod: 'Diukur tegak lurus dari jahitan sambungan rib ke tepi leher', defaultTolerance: 0.3, importance: 'Optional' },
  { id: 'ts-11', code: 'PLACKET_LENGTH', labelId: 'Panjang Placket / Kancing', aliasEn: 'Placket Length', category: 'T-Shirt / Shirt', measurementMethod: 'Khusus kemeja/polo: diukur dari HPS ke ujung bawah placket', defaultTolerance: 0.5, importance: 'Optional' },
  { id: 'ts-12', code: 'COLLAR_HEIGHT', labelId: 'Tinggi Kerah', aliasEn: 'Collar Height', category: 'T-Shirt / Shirt', measurementMethod: 'Khusus kemeja/polo: diukur pada bagian tengah belakang kerah', defaultTolerance: 0.3, importance: 'Optional' },

  // ============================================================
  // Jacket / Hoodie
  // ============================================================
  { id: 'jk-01', code: 'CHEST_WIDTH_HALF', labelId: 'Lebar Dada 1/2', aliasEn: 'Chest Width 1/2', category: 'Jacket / Hoodie', measurementMethod: 'Diukur datar 2.5cm di bawah kerung lengan', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'jk-02', code: 'BODY_LENGTH_HPS', labelId: 'Panjang Badan (dari HPS)', aliasEn: 'Body Length from HPS', category: 'Jacket / Hoodie', measurementMethod: 'Diukur dari High Point Shoulder ke kelim/rib bawah', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'jk-03', code: 'SHOULDER_WIDTH', labelId: 'Lebar Bahu', aliasEn: 'Shoulder Width', category: 'Jacket / Hoodie', measurementMethod: 'Diukur dari titik bahu kiri ke titik bahu kanan', defaultTolerance: 0.5, importance: 'Required' },
  { id: 'jk-04', code: 'SLEEVE_LENGTH', labelId: 'Panjang Lengan', aliasEn: 'Sleeve Length', category: 'Jacket / Hoodie', measurementMethod: 'Diukur dari titik bahu ke ujung manset', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'jk-05', code: 'CUFF_WIDTH_HALF', labelId: 'Lebar Manset 1/2', aliasEn: 'Cuff Opening 1/2', category: 'Jacket / Hoodie', measurementMethod: 'Diukur datar pada bukaan manset lengan', defaultTolerance: 0.5, importance: 'Required' },
  { id: 'jk-06', code: 'BOTTOM_SWEEP_HALF', labelId: 'Lebar Rib/Kelim Bawah 1/2', aliasEn: 'Bottom Sweep 1/2', category: 'Jacket / Hoodie', measurementMethod: 'Diukur datar pada kelim bawah dalam posisi rileks', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'jk-07', code: 'HOOD_HEIGHT', labelId: 'Tinggi Hood', aliasEn: 'Hood Height', category: 'Jacket / Hoodie', measurementMethod: 'Diukur dari jahitan leher ke puncak hood', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'jk-08', code: 'HOOD_WIDTH', labelId: 'Lebar Hood', aliasEn: 'Hood Width', category: 'Jacket / Hoodie', measurementMethod: 'Diukur datar pada bagian terlebar hood', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'jk-09', code: 'ARMHOLE_STRAIGHT', labelId: 'Kerung Lengan (lurus)', aliasEn: 'Armhole Straight', category: 'Jacket / Hoodie', measurementMethod: 'Diukur lurus dari titik bahu ke titik bawah kerung lengan', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'jk-10', code: 'ZIPPER_LENGTH', labelId: 'Panjang Zipper Depan', aliasEn: 'Front Zipper Length', category: 'Jacket / Hoodie', measurementMethod: 'Diukur dari ujung bawah ke ujung atas gigi zipper', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'jk-11', code: 'RIB_HEIGHT_HEM', labelId: 'Tinggi Rib Bawah', aliasEn: 'Bottom Rib Height', category: 'Jacket / Hoodie', measurementMethod: 'Diukur tegak lurus pada rib kelim bawah', defaultTolerance: 0.3, importance: 'Optional' },
  { id: 'jk-12', code: 'POCKET_PLACEMENT', labelId: 'Posisi Saku (dari HPS)', aliasEn: 'Pocket Placement from HPS', category: 'Jacket / Hoodie', measurementMethod: 'Diukur dari HPS ke tepi atas bukaan saku', defaultTolerance: 0.5, importance: 'Optional' },

  // ============================================================
  // Pants / Shorts
  // ============================================================
  { id: 'pt-01', code: 'WAIST_RELAXED', labelId: 'Lingkar Pinggang Rileks', aliasEn: 'Waist Relaxed', category: 'Pants / Shorts', measurementMethod: 'Diukur melingkar pada waistband tanpa ditarik', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'pt-02', code: 'HIP_WIDTH_HALF', labelId: 'Lebar Pinggul 1/2', aliasEn: 'Hip Width 1/2', category: 'Pants / Shorts', measurementMethod: 'Diukur datar 18cm di bawah tepi atas waistband', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'pt-03', code: 'INSEAM_LENGTH', labelId: 'Panjang Inseam', aliasEn: 'Inseam Length', category: 'Pants / Shorts', measurementMethod: 'Diukur dari pertemuan pesak (crotch) ke ujung kaki', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'pt-04', code: 'OUTSEAM_LENGTH', labelId: 'Panjang Outseam', aliasEn: 'Outseam Length', category: 'Pants / Shorts', measurementMethod: 'Diukur dari tepi atas waistband ke ujung kaki sisi luar', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'pt-05', code: 'LEG_OPENING_HALF', labelId: 'Lebar Bukaan Kaki 1/2', aliasEn: 'Leg Opening 1/2', category: 'Pants / Shorts', measurementMethod: 'Diukur datar pada ujung bawah kaki celana', defaultTolerance: 0.5, importance: 'Required' },
  { id: 'pt-06', code: 'THIGH_WIDTH_HALF', labelId: 'Lebar Paha 1/2', aliasEn: 'Thigh Width 1/2', category: 'Pants / Shorts', measurementMethod: 'Diukur datar 2.5cm di bawah pesak, tegak lurus inseam', defaultTolerance: 0.5, importance: 'Required' },
  { id: 'pt-07', code: 'FRONT_RISE', labelId: 'Pesak Depan', aliasEn: 'Front Rise', category: 'Pants / Shorts', measurementMethod: 'Diukur dari pertemuan pesak ke tepi atas waistband depan', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'pt-08', code: 'BACK_RISE', labelId: 'Pesak Belakang', aliasEn: 'Back Rise', category: 'Pants / Shorts', measurementMethod: 'Diukur dari pertemuan pesak ke tepi atas waistband belakang', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'pt-09', code: 'KNEE_WIDTH_HALF', labelId: 'Lebar Lutut 1/2', aliasEn: 'Knee Width 1/2', category: 'Pants / Shorts', measurementMethod: 'Diukur datar pada titik 33cm di bawah pesak', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'pt-10', code: 'WAIST_STRETCHED', labelId: 'Lingkar Pinggang Ditarik', aliasEn: 'Waist Stretched', category: 'Pants / Shorts', measurementMethod: 'Khusus waistband elastis: diukur melingkar saat ditarik maksimal', defaultTolerance: 1.5, importance: 'Recommended' },
  { id: 'pt-11', code: 'WAISTBAND_HEIGHT', labelId: 'Tinggi Waistband', aliasEn: 'Waistband Height', category: 'Pants / Shorts', measurementMethod: 'Diukur tegak lurus pada ban pinggang', defaultTolerance: 0.3, importance: 'Optional' },

  // ============================================================
  // Skirt / Dress
  // ============================================================
  { id: 'sd-01', code: 'BUST_WIDTH_HALF', labelId: 'Lebar Dada / Bust 1/2', aliasEn: 'Bust Width 1/2', category: 'Skirt / Dress', measurementMethod: 'Khusus dress: diukur datar pada garis bust tertinggi', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'sd-02', code: 'WAIST_WIDTH_HALF', labelId: 'Lebar Pinggang 1/2', aliasEn: 'Waist Width 1/2', category: 'Skirt / Dress', measurementMethod: 'Diukur datar pada bagian pinggang tersempit', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'sd-03', code: 'HIP_WIDTH_HALF', labelId: 'Lebar Pinggul 1/2', aliasEn: 'Hip Width 1/2', category: 'Skirt / Dress', measurementMethod: 'Diukur datar 20cm di bawah garis pinggang', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'sd-04', code: 'TOTAL_LENGTH_HPS', labelId: 'Panjang Total (dari HPS)', aliasEn: 'Total Length from HPS', category: 'Skirt / Dress', measurementMethod: 'Dress: dari HPS ke kelim bawah. Rok: dari tepi atas ban ke kelim', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'sd-05', code: 'HEM_SWEEP_HALF', labelId: 'Lebar Kelim Bawah 1/2', aliasEn: 'Hem Sweep 1/2', category: 'Skirt / Dress', measurementMethod: 'Diukur datar pada keliling kelim paling bawah', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'sd-06', code: 'SHOULDER_WIDTH', labelId: 'Lebar Bahu', aliasEn: 'Shoulder Width', category: 'Skirt / Dress', measurementMethod: 'Khusus dress berlengan: dari ujung bahu kiri ke kanan', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'sd-07', code: 'SLEEVE_LENGTH', labelId: 'Panjang Lengan', aliasEn: 'Sleeve Length', category: 'Skirt / Dress', measurementMethod: 'Khusus dress berlengan: dari titik bahu ke ujung lengan', defaultTolerance: 1.0, importance: 'Recommended' },
  { id: 'sd-08', code: 'WAIST_TO_HEM', labelId: 'Panjang Pinggang ke Kelim', aliasEn: 'Waist to Hem', category: 'Skirt / Dress', measurementMethod: 'Diukur dari garis pinggang lurus ke bawah sampai kelim', defaultTolerance: 1.0, importance: 'Recommended' },
  { id: 'sd-09', code: 'NECK_DROP_FRONT', labelId: 'Kedalaman Leher Depan', aliasEn: 'Front Neck Drop', category: 'Skirt / Dress', measurementMethod: 'Diukur dari garis HPS ke titik terendah leher depan', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'sd-10', code: 'SLIT_LENGTH', labelId: 'Panjang Belahan (Slit)', aliasEn: 'Slit Length', category: 'Skirt / Dress', measurementMethod: 'Diukur dari ujung atas belahan ke kelim bawah', defaultTolerance: 0.5, importance: 'Optional' },

  // ============================================================
  // Hat / Cap
  // ============================================================
  { id: 'ht-01', code: 'HEAD_CIRCUMFERENCE', labelId: 'Lingkar Kepala (dalam)', aliasEn: 'Inner Head Circumference', category: 'Hat / Cap', measurementMethod: 'Diukur melingkar pada sisi dalam sweatband', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'ht-02', code: 'CROWN_HEIGHT_FRONT', labelId: 'Tinggi Crown Depan', aliasEn: 'Front Crown Height', category: 'Hat / Cap', measurementMethod: 'Diukur dari tepi atas visor ke puncak crown bagian depan', defaultTolerance: 0.5, importance: 'Required' },
  { id: 'ht-03', code: 'VISOR_LENGTH', labelId: 'Panjang Visor / Lidah', aliasEn: 'Visor Length', category: 'Hat / Cap', measurementMethod: 'Diukur dari jahitan sambungan crown ke ujung terluar visor', defaultTolerance: 0.3, importance: 'Required' },
  { id: 'ht-04', code: 'VISOR_WIDTH', labelId: 'Lebar Visor', aliasEn: 'Visor Width', category: 'Hat / Cap', measurementMethod: 'Diukur pada bagian terlebar visor dari sisi ke sisi', defaultTolerance: 0.3, importance: 'Recommended' },
  { id: 'ht-05', code: 'PANEL_WIDTH', labelId: 'Lebar Panel', aliasEn: 'Panel Width', category: 'Hat / Cap', measurementMethod: 'Diukur pada bagian terlebar satu panel crown', defaultTolerance: 0.3, importance: 'Recommended' },
  { id: 'ht-06', code: 'SWEATBAND_HEIGHT', labelId: 'Tinggi Sweatband', aliasEn: 'Sweatband Height', category: 'Hat / Cap', measurementMethod: 'Diukur tegak lurus pada pita bagian dalam topi', defaultTolerance: 0.3, importance: 'Recommended' },
  { id: 'ht-07', code: 'CROWN_HEIGHT_BACK', labelId: 'Tinggi Crown Belakang', aliasEn: 'Back Crown Height', category: 'Hat / Cap', measurementMethod: 'Diukur dari tepi bawah belakang ke puncak crown', defaultTolerance: 0.5, importance: 'Optional' },
  { id: 'ht-08', code: 'CLOSURE_STRAP_LENGTH', labelId: 'Panjang Strap Penutup', aliasEn: 'Closure Strap Length', category: 'Hat / Cap', measurementMethod: 'Diukur pada strap belakang (snapback/buckle) posisi penuh', defaultTolerance: 0.5, importance: 'Optional' },
  { id: 'ht-09', code: 'BRIM_CURVE', labelId: 'Lengkungan Brim', aliasEn: 'Brim Curve Depth', category: 'Hat / Cap', measurementMethod: 'Diukur kedalaman lengkung visor dari garis lurus ke titik terdalam', defaultTolerance: 0.3, importance: 'Optional' },

  // ============================================================
  // Bag / Backpack
  // ============================================================
  { id: 'bg-01', code: 'BAG_WIDTH', labelId: 'Lebar Tas', aliasEn: 'Bag Width', category: 'Bag / Backpack', measurementMethod: 'Diukur datar pada bagian terlebar badan tas', defaultTolerance: 0.5, importance: 'Required' },
  { id: 'bg-02', code: 'BAG_HEIGHT', labelId: 'Tinggi Tas', aliasEn: 'Bag Height', category: 'Bag / Backpack', measurementMethod: 'Diukur tegak lurus dari dasar ke tepi atas badan tas', defaultTolerance: 0.5, importance: 'Required' },
  { id: 'bg-03', code: 'BAG_DEPTH_GUSSET', labelId: 'Tebal / Gusset', aliasEn: 'Depth / Gusset', category: 'Bag / Backpack', measurementMethod: 'Diukur pada bagian samping (gusset) dalam kondisi kosong', defaultTolerance: 0.5, importance: 'Required' },
  { id: 'bg-04', code: 'STRAP_LENGTH', labelId: 'Panjang Tali Bahu', aliasEn: 'Shoulder Strap Length', category: 'Bag / Backpack', measurementMethod: 'Diukur dari titik jahit atas ke titik jahit bawah, posisi terpanjang', defaultTolerance: 1.0, importance: 'Required' },
  { id: 'bg-05', code: 'STRAP_WIDTH', labelId: 'Lebar Tali Bahu', aliasEn: 'Shoulder Strap Width', category: 'Bag / Backpack', measurementMethod: 'Diukur pada bagian terlebar tali bahu', defaultTolerance: 0.3, importance: 'Required' },
  { id: 'bg-06', code: 'HANDLE_DROP', labelId: 'Handle Drop', aliasEn: 'Handle Drop', category: 'Bag / Backpack', measurementMethod: 'Diukur dari titik tertinggi handle ke tepi atas tas', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'bg-07', code: 'MAIN_ZIPPER_LENGTH', labelId: 'Panjang Zipper Utama', aliasEn: 'Main Zipper Length', category: 'Bag / Backpack', measurementMethod: 'Diukur sepanjang gigi zipper kompartemen utama', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'bg-08', code: 'FRONT_POCKET_SIZE', labelId: 'Ukuran Saku Depan', aliasEn: 'Front Pocket Size', category: 'Bag / Backpack', measurementMethod: 'Diukur lebar x tinggi pada saku depan (catat sebagai lebar)', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'bg-09', code: 'LAPTOP_SLEEVE_WIDTH', labelId: 'Lebar Sleeve Laptop', aliasEn: 'Laptop Sleeve Width', category: 'Bag / Backpack', measurementMethod: 'Diukur datar pada kompartemen laptop bagian dalam', defaultTolerance: 0.5, importance: 'Optional' },
  { id: 'bg-10', code: 'BASE_WIDTH', labelId: 'Lebar Dasar', aliasEn: 'Base Width', category: 'Bag / Backpack', measurementMethod: 'Diukur datar pada panel dasar tas', defaultTolerance: 0.5, importance: 'Optional' },

  // ============================================================
  // Accessory / Custom
  // Variabel generik: dipakai untuk produk non-standar (sarung tangan,
  // masker, scarf, pouch, dll). Nama variabel dapat diganti sesuai produk.
  // ============================================================
  { id: 'ac-01', code: 'TOTAL_LENGTH', labelId: 'Panjang Total', aliasEn: 'Total Length', category: 'Accessory / Custom', measurementMethod: 'Diukur pada dimensi terpanjang produk dalam posisi datar', defaultTolerance: 0.5, importance: 'Required' },
  { id: 'ac-02', code: 'TOTAL_WIDTH', labelId: 'Lebar Total', aliasEn: 'Total Width', category: 'Accessory / Custom', measurementMethod: 'Diukur pada dimensi terlebar produk dalam posisi datar', defaultTolerance: 0.5, importance: 'Required' },
  { id: 'ac-03', code: 'CIRCUMFERENCE', labelId: 'Lingkar', aliasEn: 'Circumference', category: 'Accessory / Custom', measurementMethod: 'Diukur melingkar pada bagian yang melingkupi tubuh (jika ada)', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'ac-04', code: 'OPENING_WIDTH', labelId: 'Lebar Bukaan', aliasEn: 'Opening Width', category: 'Accessory / Custom', measurementMethod: 'Diukur datar pada bagian bukaan/mulut produk', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'ac-05', code: 'STRAP_LENGTH', labelId: 'Panjang Tali / Strap', aliasEn: 'Strap Length', category: 'Accessory / Custom', measurementMethod: 'Diukur dari ujung ke ujung tali pada posisi terpanjang', defaultTolerance: 0.5, importance: 'Recommended' },
  { id: 'ac-06', code: 'THICKNESS', labelId: 'Ketebalan', aliasEn: 'Thickness', category: 'Accessory / Custom', measurementMethod: 'Diukur tegak lurus pada bagian tertebal produk', defaultTolerance: 0.3, importance: 'Optional' },
  { id: 'ac-07', code: 'TRIM_PLACEMENT', labelId: 'Posisi Trim / Logo', aliasEn: 'Trim / Logo Placement', category: 'Accessory / Custom', measurementMethod: 'Diukur dari tepi referensi terdekat ke titik tengah trim/logo', defaultTolerance: 0.3, importance: 'Optional' },
];

/**
 * Ambil variabel ukuran yang relevan untuk sebuah kategori.
 * Dipakai untuk auto-deteksi rekomendasi pada panel Size Chart.
 */
export function measurementFieldsForCategory(category: CategoryType): MeasurementField[] {
  return MEASUREMENT_FIELDS.filter((field) => field.category === category);
}

/**
 * Variabel wajib (Required) untuk sebuah kategori — dipakai sebagai
 * isi default ketika user menerapkan template kategori.
 */
export function requiredFieldsForCategory(category: CategoryType): MeasurementField[] {
  return measurementFieldsForCategory(category).filter((field) => field.importance === 'Required');
}

/** Jumlah variabel tersedia per kategori, untuk indikator di UI. */
export function measurementFieldCount(category: CategoryType): number {
  return measurementFieldsForCategory(category).length;
}
