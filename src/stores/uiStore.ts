import { create } from 'zustand'

interface UIStore {
  expanded: boolean
  theme: 'dark' | 'light'
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[]
  setExpanded: (v: boolean) => void
  toggleTheme: () => void
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  expanded: false,
  theme: 'dark',
  toasts: [],
  setExpanded: (expanded) => set({ expanded }),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('light', next === 'light')
      return { theme: next }
    }),
  addToast: (message, type) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), message, type }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
