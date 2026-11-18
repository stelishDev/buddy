import { Pressable, Text, View } from "react-native";

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string; badge?: number }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View className="mx-4 mb-2 flex-row rounded-xl bg-zinc-900 p-1">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2 ${active ? "bg-zinc-700" : ""}`}
          >
            <Text className={`text-sm font-semibold ${active ? "text-zinc-50" : "text-zinc-400"}`}>{t.label}</Text>
            {t.badge ? (
              <View className="min-w-[18px] items-center rounded-full bg-indigo-500 px-1">
                <Text className="text-[11px] font-bold text-white">{t.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
