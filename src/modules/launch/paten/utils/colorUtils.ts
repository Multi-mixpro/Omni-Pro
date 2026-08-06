const COLOR_MAP: [string[], string][] = [
  [['black', 'hitam', 'jetblack'], '#121212'],
  [['navy', 'donker'], '#1B2A4A'],
  [['white', 'putih', 'natural'], '#F5F5ED'],
  [['sage'], '#6B8E78'],
  [['olive', 'army'], '#4B5320'],
  [['grey', 'gray', 'abu', 'steel', 'silver'], '#4A5568'],
  [['terracotta', 'rust'], '#C85A32'],
  [['khaki', 'beige', 'tan', 'cream'], '#C2B280'],
  [['burgundy', 'maroon', 'crimson', 'deep red'], '#800020'],
  [['yellow', 'mustard', 'kuning'], '#E3A857'],
  [['blue', 'biru', 'diva'], '#2563EB'],
  [['turquoise', 'teal', 'tosca'], '#2AAAA0'],
  [['red', 'merah'], '#DC2626'],
  [['pink', 'rosa'], '#E8769A'],
  [['orange', 'oranye', 'jingga'], '#EA7E30'],
  [['green', 'hijau', 'forest', 'jade'], '#2D6A4F'],
  [['brown', 'coklat', 'tobacco', 'tea'], '#6B4226'],
  [['purple', 'ungu', 'petrol'], '#5B2C6F'],
  [['ebony'], '#2C2C2C'],
  [['dust'], '#9E8E7E'],
  [['saga'], '#A7B89C'],
];

export function getColorHexFromName(colorName: string): string {
  const name = colorName.toLowerCase();
  for (const [keywords, hex] of COLOR_MAP) {
    if (keywords.some((k) => name.includes(k))) return hex;
  }
  return '#64748B';
}
