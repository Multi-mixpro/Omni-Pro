import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

type Theme = 'system' | 'light' | 'dark';
const key = 'gg-workspace-theme';
const themes = {
  system: { icon: Monitor, label: 'Ikuti perangkat' },
  light: { icon: Sun, label: 'Terang' },
  dark: { icon: Moon, label: 'Gelap' },
};

export function ThemeControl() {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = document.documentElement.dataset.themePreference;
    return initial === 'light' || initial === 'dark' ? initial : 'system';
  });
  useEffect(() => {
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && system.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.dataset.themePreference = theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101724' : '#087E79');
    };
    apply();
    try { localStorage.setItem(key, theme); } catch { /* Preference still applies to this page. */ }
    system.addEventListener('change', apply);
    return () => system.removeEventListener('change', apply);
  }, [theme]);
  const Icon = themes[theme].icon;
  return <div className="workspace-theme-control">
    <Icon size={16} aria-hidden="true" />
    <select aria-label="Tema tampilan" title="Tema tampilan" value={theme} onChange={event => setTheme(event.target.value as Theme)}>
      {Object.entries(themes).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
    </select>
  </div>;
}
