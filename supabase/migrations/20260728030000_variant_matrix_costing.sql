-- Blueprint Tahap 9/12: biaya per unit per kombinasi warna x ukuran, agar
-- kebutuhan anggaran produksi massal dapat dihitung dari matriks varian
-- (kuantitas minimum x HPP per ukuran), bukan hanya HPP rata-rata artikel.

begin;

alter table public.launch_variant_matrix
  add column if not exists unit_cost numeric(12,2);

comment on column public.launch_variant_matrix.unit_cost is 'HPP per unit untuk kombinasi warna/ukuran ini; default dari HPP artikel terbaru saat matriks dibuat, dapat ditimpa per ukuran (ukuran besar biasanya memakai lebih banyak bahan).';

commit;
