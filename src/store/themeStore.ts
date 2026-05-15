import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      dark: false,
      toggle: () => {
        const next = !get().dark;
        set({ dark: next });
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
        // Dispatch custom event so components can react to theme changes
        window.dispatchEvent(new CustomEvent('themechange', { detail: { dark: next } }));
      },
    }),
    { name: 'civic-theme' }
  )
);

// Apply theme on load
const stored = localStorage.getItem('civic-theme');
if (stored) {
  try {
    const { state } = JSON.parse(stored);
    if (state?.dark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch {}
}
