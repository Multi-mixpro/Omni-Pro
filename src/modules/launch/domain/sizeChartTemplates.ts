export interface MeasurementTemplate {
  code: string;
  name: string;
}

export interface SizeChartTemplate {
  id: 'TOP' | 'BOTTOM' | 'HAT' | 'BAG';
  label: string;
  keywords: string[];
  defaultSizes: string[];
  measurements: MeasurementTemplate[];
}

export const SIZE_CHART_TEMPLATES: SizeChartTemplate[] = [
  {
    id: 'TOP',
    label: 'Atasan, kaos, hoodie & jaket',
    keywords: ['jaket', 'jacket', 'kaos', 'shirt', 'hoodie', 'crewneck', 'polo', 'atasan', 'jersey', 'vest'],
    defaultSizes: ['S', 'M', 'L', 'XL', '2XL'],
    measurements: [
      ['PBD', 'Panjang badan depan'], ['PBB', 'Panjang badan belakang'], ['LBH', 'Lebar bahu'],
      ['LD', 'Lebar dada'], ['LP', 'Lebar pinggang'], ['LBW', 'Lebar bawah'], ['PT', 'Panjang tangan'],
      ['LBA', 'Lebar lengan atas'], ['LM', 'Lebar manset'], ['TKA', 'Tinggi kerung lengan'],
      ['LL', 'Lebar leher'], ['KLD', 'Kedalaman leher depan'], ['KLB', 'Kedalaman leher belakang'],
      ['TK', 'Tinggi kerah'], ['PH', 'Panjang hoodie'], ['LH', 'Lebar hoodie'],
      ['PZ', 'Panjang zipper'], ['PS', 'Panjang saku'], ['LS', 'Lebar saku'],
    ].map(([code, name]) => ({ code, name })),
  },
  {
    id: 'BOTTOM',
    label: 'Celana, shorts, rok & bawahan',
    keywords: ['celana', 'pants', 'short', 'shorts', 'rok', 'skirt', 'bawahan', 'jogger'],
    defaultSizes: ['S', 'M', 'L', 'XL', '2XL'],
    measurements: [
      ['LPR', 'Lingkar pinggang rileks'], ['LPM', 'Lingkar pinggang maksimal'], ['LP', 'Lingkar pinggul'],
      ['FR', 'Front rise'], ['BR', 'Back rise'], ['PSL', 'Panjang sisi luar'], ['PI', 'Panjang inseam'],
      ['LPA', 'Lingkar paha'], ['LLT', 'Lingkar lutut'], ['LBK', 'Lingkar bukaan kaki'],
      ['TW', 'Tinggi waistband'], ['PZ', 'Panjang zipper'], ['LS', 'Lebar saku'], ['KS', 'Kedalaman saku'],
    ].map(([code, name]) => ({ code, name })),
  },
  {
    id: 'HAT',
    label: 'Topi & headwear',
    keywords: ['topi', 'hat', 'cap', 'bucket'],
    defaultSizes: ['S/M', 'L/XL'],
    measurements: [
      ['LK', 'Lingkar kepala'], ['TC', 'Tinggi crown'], ['LC', 'Lebar crown'],
      ['PV', 'Panjang visor'], ['LV', 'Lebar visor'], ['TPD', 'Tinggi panel depan'],
      ['PS', 'Panjang strap'], ['LS', 'Lebar strap'],
    ].map(([code, name]) => ({ code, name })),
  },
  {
    id: 'BAG',
    label: 'Tas & soft goods',
    keywords: ['tas', 'bag', 'pouch', 'backpack', 'sling'],
    defaultSizes: ['ONE SIZE'],
    measurements: [
      ['P', 'Panjang'], ['L', 'Lebar'], ['T', 'Tinggi'], ['D', 'Kedalaman'],
      ['PT', 'Panjang tali'], ['LT', 'Lebar tali'], ['BU', 'Bukaan utama'],
      ['UK', 'Ukuran kompartemen'], ['US', 'Ukuran saku'], ['KAP', 'Kapasitas'],
    ].map(([code, name]) => ({ code, name })),
  },
];

export function recommendSizeTemplate(category: string) {
  const normalized = category.toLowerCase();
  return SIZE_CHART_TEMPLATES.find(template => template.keywords.some(keyword => normalized.includes(keyword))) ?? SIZE_CHART_TEMPLATES[0];
}
