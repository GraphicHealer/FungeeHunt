import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
  }
}

export const theme = writable<Theme>(getSystemTheme());

export function toggleTheme() {
  theme.update((t) => (t === 'light' ? 'dark' : 'light'));
}

theme.subscribe((value) => apply(value));

if (typeof window !== 'undefined') {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', (e) => {
    theme.set(e.matches ? 'dark' : 'light');
  });
}
