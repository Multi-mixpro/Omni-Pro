const families = {
  slate: 'neutral', gray: 'neutral', zinc: 'neutral', stone: 'neutral',
  blue: 'blue', sky: 'blue', cyan: 'blue', indigo: 'blue',
  teal: 'mint', emerald: 'mint', green: 'mint', lime: 'mint',
  yellow: 'gold', amber: 'gold', orange: 'gold',
  red: 'coral', rose: 'coral', pink: 'coral',
  violet: 'violet', purple: 'violet', fuchsia: 'violet',
};
const shades = {
  surface: { 50: 'surface', 100: 'raised', 200: 'strong', 300: 'stronger' },
  ink: { 400: 'muted', 500: 'muted', 600: 'muted', 700: 'text', 800: 'text', 900: 'text', 950: 'text' },
  line: { 50: 'line', 100: 'line', 200: 'line', 300: 'line' },
};
const rgb = hex => hex.slice(1).match(/../g).map(channel => parseInt(channel, 16)).join(' ');

// Map utilities by purpose so a surface, an accent label and an action can use
// the same Tailwind family without inheriting each other's contrast rules.
function themed(colors, purpose) {
  const mapped = { ...colors };
  for (const [family, tone] of Object.entries(families)) {
    if (!colors[family]) continue;
    const palette = { ...colors[family] };
    for (const [shade, slot] of Object.entries(shades[purpose])) {
      const value = palette[shade];
      if (!value || (purpose === 'surface' && tone !== 'neutral' && Number(shade) > 200)) continue;
      const fallback = purpose === 'ink' && Number(shade) <= (tone === 'neutral' ? 500 : 600)
        ? colors[family][tone === 'neutral' ? 600 : 700]
        : value;
      palette[shade] = `rgb(var(--theme-${tone}-${slot}, ${rgb(fallback)}) / <alpha-value>)`;
    }
    mapped[family] = palette;
  }
  if (purpose === 'surface') mapped.white = 'rgb(var(--theme-paper, 255 255 255) / <alpha-value>)';
  return mapped;
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    backgroundColor: ({ theme }) => themed(theme('colors'), 'surface'),
    gradientColorStops: ({ theme }) => themed(theme('colors'), 'surface'),
    textColor: ({ theme }) => themed(theme('colors'), 'ink'),
    borderColor: ({ theme }) => ({ DEFAULT: theme('colors.gray.200'), ...themed(theme('colors'), 'line') }),
  },
  plugins: [],
};
