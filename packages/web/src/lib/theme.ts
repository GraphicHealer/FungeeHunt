import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function loadSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('fungee-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return getSystemTheme();
}

function apply(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('fungee-theme', theme);
  }
}

export const theme = writable<Theme>(loadSavedTheme());

theme.subscribe((value) => apply(value));

export function toggleTheme() {
  theme.update((t) => (t === 'light' ? 'dark' : 'light'));
}
