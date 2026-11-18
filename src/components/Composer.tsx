import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

export function Composer({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [text, setText] = useState("");
  const send = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
  };
  return (
    <View className="flex-row items-end gap-2 border-t border-zinc-800 bg-zinc-950 px-3 py-2">
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ask a question about the meeting…"
        placeholderTextColor="#71717a"
        multiline
        className="max-h-32 min-h-[44px] flex-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-base text-zinc-100"
        onSubmitEditing={send}
        submitBehavior="submit"
        returnKeyType="send"
      />
      <Pressable
        onPress={send}
        disabled={!text.trim() || disabled}
        className={`h-11 w-11 items-center justify-center rounded-full ${text.trim() && !disabled ? "bg-indigo-500 active:bg-indigo-600" : "bg-zinc-800"}`}
      >
        <Ionicons name="arrow-up" size={22} color="#fff" />
      </Pressable>
    </View>
  );
}
