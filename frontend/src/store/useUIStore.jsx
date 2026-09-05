// src/store/useUIStore.jsx
import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  toasts: [],
  modals: [],
  isLoading: false,
  sidebarOpen: true,
  
  addToast: (message, type = 'info') => {
    const id = Date.now();
    set(state => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    
    setTimeout(() => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 3000);
  },
  
  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id)
    }));
  },
  
  addModal: (content, options = {}) => {
    const id = Date.now();
    set(state => ({
      modals: [...state.modals, { id, content, ...options }]
    }));
    return id;
  },
  
  removeModal: (id) => {
    set(state => ({
      modals: state.modals.filter(m => m.id !== id)
    }));
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen }))
}));

export const useUIActions = () => {
  const { addToast, removeToast, addModal, removeModal, setLoading, toggleSidebar } = useUIStore();
  return { addToast, removeToast, addModal, removeModal, setLoading, toggleSidebar };
};

export { useUIStore };