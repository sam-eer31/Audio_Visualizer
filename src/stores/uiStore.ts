import { create } from 'zustand'

interface UIStore {
  expanded: boolean
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[]
  setExpanded: (v: boolean) => void
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  expanded: false,
  toasts: [],
  setExpanded: (expanded) => set({ expanded }),
  addToast: (message, type) =>
    set((state) => ({
      toasts: [...state.toasts, { id: crypto.randomUUID(), message, type }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
