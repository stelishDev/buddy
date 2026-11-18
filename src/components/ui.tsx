import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, Pressable, Switch, Text, TextInput, View, type TextInputProps } from "react-native";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  className = "",
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary: "bg-indigo-500 active:bg-indigo-600",
    secondary: "bg-zinc-800 active:bg-zinc-700 border border-zinc-700",
    danger: "bg-red-500/15 active:bg-red-500/25 border border-red-500/40",
    ghost: "active:bg-zinc-800",
  }[variant];
  const textColor = variant === "danger" ? "text-red-400" : variant === "primary" ? "text-white" : "text-zinc-100";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center gap-2 rounded-xl px-4 py-3 ${styles} ${disabled ? "opacity-40" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : icon ? (
        <Ionicons name={icon} size={18} color={variant === "danger" ? "#f87171" : "#fff"} />
      ) : null}
      <Text className={`font-semibold ${textColor}`}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</Text>
      <TextInput
        placeholderTextColor="#71717a"
        autoCapitalize="none"
        autoCorrect={false}
        className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-base text-zinc-100"
        {...props}
      />
      {hint ? <Text className="mt-1 text-xs text-zinc-500">{hint}</Text> : null}
    </View>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <View className="mb-6">
      <View className="mb-2 flex-row items-center justify-between px-1">
        <Text className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</Text>
        {right}
      </View>
      <View className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">{children}</View>
    </View>
  );
}

export function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center gap-3 border-b border-zinc-800 px-4 py-3">
      <View className="flex-1">
        <Text className="text-base text-zinc-100">{label}</Text>
        {description ? <Text className="mt-0.5 text-xs text-zinc-500">{description}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: "#6366f1", false: "#3f3f46" }} />
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${active ? "border-indigo-400 bg-indigo-500/20" : "border-zinc-700 bg-zinc-900 active:bg-zinc-800"}`}
    >
      <Text className={`text-sm ${active ? "text-indigo-200" : "text-zinc-300"}`}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body?: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Ionicons name={icon} size={40} color="#52525b" />
      <Text className="mt-3 text-center text-base font-semibold text-zinc-300">{title}</Text>
      {body ? <Text className="mt-1 text-center text-sm leading-5 text-zinc-500">{body}</Text> : null}
    </View>
  );
}
