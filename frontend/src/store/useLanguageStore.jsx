// src/store/useLanguageStore.jsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const translations = {
  fa: {
    welcome: 'خوش آمدید',
    login: 'ورود',
    register: 'ثبت نام'
  },
  en: {
    welcome: 'Welcome',
    login: 'Login',
    register: 'Register'
  }
};

const useLanguageStore = create(
  persist(
    (set) => ({
      language: 'fa',
      direction: 'rtl',
      
      setLanguage: (lang) => {
        const dir = lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr';
        set({ language: lang, direction: dir });
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;
        localStorage.setItem('language', lang);
      },
      
      setDirection: (dir) => set({ direction: dir })
    }),
    {
      name: 'language-storage',
    }
  )
);

export const useLanguageActions = () => {
  const { setLanguage, setDirection } = useLanguageStore();
  return { setLanguage, setDirection };
};

export { useLanguageStore };