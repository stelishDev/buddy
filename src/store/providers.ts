import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ProviderConfig } from "@/lib/ai/types";
import { deleteApiKey } from "@/lib/secureKeys";

interface ProvidersState {
  providers: ProviderConfig[];
  activeId: string | null;
  upsert: (p: ProviderConfig) => void;
  remove: (id: string) => void;
  setActive: (id: string) => void;
}

export const useProviders = create<ProvidersState>()(
  persist(
    (set, get) => ({
      providers: [],
      activeId: null,
      upsert: (p) =>
        set((s) => {
          const exists = s.providers.some((x) => x.id === p.id);
          return {
            providers: exists ? s.providers.map((x) => (x.id === p.id ? p : x)) : [...s.providers, p],
            activeId: s.activeId ?? p.id,
          };
        }),
      remove: (id) => {
        deleteApiKey(id).catch(() => {});
        const providers = get().providers.filter((p) => p.id !== id);
        set({
          providers,
          activeId: get().activeId === id ? (providers[0]?.id ?? null) : get().activeId,
        });
      },
      setActive: (id) => set({ activeId: id }),
    }),
    {
      name: "providers-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ providers: s.providers, activeId: s.activeId }),
    },
  ),
);

export const useActiveProvider = () =>
  useProviders((s) => s.providers.find((p) => p.id === s.activeId) ?? s.providers[0] ?? null);
