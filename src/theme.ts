export type Theme = 'dark' | 'light';

const THEME_KEY = 'plant_care_theme_v1';

export function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Fall through to the default
  }
  return 'dark';
}

export function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // The choice just won't survive a reload
  }
}

/** Call once before the first render so the page never flashes the wrong theme. */
export function initTheme(): void {
  document.documentElement.setAttribute('data-theme', loadTheme());
}
