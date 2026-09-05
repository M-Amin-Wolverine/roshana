// src/store/useThemeStore.jsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const themes = {
  light: 'light',
  dark: 'dark',
  system: 'system'
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      mode: 'dark',
      
      setTheme: (theme) => {
        set({ theme, mode: theme });
        document.documentElement.setAttribute('data-theme', theme);
      },
      
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme, mode: newTheme });
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    }),
    {
      name: 'theme-storage',
    }
  )
);

export const useThemeActions = () => {
  const { setTheme, toggleTheme } = useThemeStore();
  return { setTheme, toggleTheme };
};

export { useThemeStore };