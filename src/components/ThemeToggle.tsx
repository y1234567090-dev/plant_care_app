import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Theme, applyTheme, currentTheme } from '../theme';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => currentTheme());

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  const target = theme === 'dark' ? 'Light' : 'Dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${target.toLowerCase()} theme`}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 text-slate-500" />
      )}
      <span className="hidden sm:inline">{target}</span>
    </button>
  );
};
