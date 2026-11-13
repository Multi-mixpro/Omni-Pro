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
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b0f19' : '#1463ff');
      window.dispatchEvent(new CustomEvent('gg-theme-change', { detail: { theme, dark } }));
    };
    apply();
    try { localStorage.setItem(key, theme); } catch { /* Preference still applies to this page. */ }
    const onExternalChange = (e: Event) => {
      const next = (e as CustomEvent<{ theme?: Theme }>).detail?.theme;
      if (next && next !== theme) setTheme(next);
    };
    window.addEventListener('gg-theme-request', onExternalChange);
    system.addEventListener('change', apply);
    return () => {
      window.removeEventListener('gg-theme-request', onExternalChange);
      system.removeEventListener('change', apply);
    };
  }, [theme]);
  return <div className="workspace-theme-control" role="group" aria-label="Pilih tema tampilan">
    {(Object.entries(themes) as [Theme, { icon: typeof Sun; label: string }][]).map(([value, { icon: ModeIcon, label }]) => {
      const active = theme === value;
      return (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={active}
          title={`Tema: ${label}`}
          aria-label={`Tema: ${label}`}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all ${
            active
              ? 'bg-[#0f172a] text-white shadow-xs dark:bg-[#1f6feb]'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <ModeIcon size={13} aria-hidden="true" />
          <span className="hidden sm:inline">{label === 'Ikuti perangkat' ? 'Auto' : label}</span>
        </button>
      );
    })}
  </div>;
}
