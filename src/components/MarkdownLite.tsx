import { Text, View } from "react-native";

/** Renders the small subset of markdown the prompts ask for: headings, bullets, checkboxes, bold. */
export function MarkdownLite({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <View className={className}>
      {lines.map((raw, i) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <View key={i} className="h-2" />;

        const heading = line.match(/^#{1,4}\s+(.*)$/);
        if (heading)
          return (
            <Text key={i} className="mt-2 mb-1 text-base font-semibold text-zinc-50">
              {heading[1]}
            </Text>
          );

        const task = line.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/);
        if (task)
          return (
            <View key={i} className="flex-row py-0.5">
              <Text className="w-6 text-zinc-400">{task[1].trim() ? "☑" : "☐"}</Text>
              <Inline text={task[2]} />
            </View>
          );

        const bullet = line.match(/^(\s*)(?:[-*•]|\d+\.)\s+(.*)$/);
        if (bullet)
          return (
            <View key={i} className="flex-row py-0.5" style={{ paddingLeft: Math.min(bullet[1].length, 6) * 4 }}>
              <Text className="w-5 text-zinc-500">•</Text>
              <Inline text={bullet[2]} />
            </View>
          );

        return <Inline key={i} text={line} />;
      })}
    </View>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text selectable className="flex-1 text-[15px] leading-6 text-zinc-200">
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <Text key={i} className="font-semibold text-zinc-50">
            {p.slice(2, -2)}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}
