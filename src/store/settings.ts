import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface AssistantSettings {
  /** Periodically refresh notes while listening. */
  autoNotes: boolean;
  notesIntervalSec: number;
  /** Suggest answers when a question is heard in the meeting. */
  autoAnswer: boolean;
  /** BCP-47 language tag for speech recognition. */
  language: string;
  /** Keep audio on the device (if the OS supports on-device recognition). */
  onDeviceOnly: boolean;
}

interface SettingsState extends AssistantSettings {
  update: (patch: Partial<AssistantSettings>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      autoNotes: true,
      notesIntervalSec: 60,
      autoAnswer: false,
      language: "en-NZ",
      onDeviceOnly: false,
      update: (patch) => set(patch),
    }),
    {
      name: "settings-v1",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ update, ...rest }) => rest,
    },
  ),
);
