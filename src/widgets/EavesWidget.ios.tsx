import { HStack, Image, Text, VStack } from "@expo/ui/swift-ui";
import { containerBackground, font, foregroundStyle, lineLimit, padding } from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import type { EavesWidgetProps } from "./types";

/**
 * iOS home screen widget (SwiftUI via Expo UI). Small, medium and large sizes.
 * Runs in an isolated runtime: no hooks, no app state, no module-scope values —
 * everything it needs comes in through props. Updated from the app by src/widgets/sync.ts.
 * Tapping a widget on iOS opens the app.
 */
const EavesWidget = (props: EavesWidgetProps, environment: WidgetEnvironment) => {
  "widget";
  const family = environment.widgetFamily;
  const small = family === "systemSmall";
  const large = family === "systemLarge" || family === "systemExtraLarge";
  const shownActions = props.actions.slice(0, large ? 5 : small ? 0 : 2);

  return (
    <VStack
      alignment="leading"
      spacing={4}
      modifiers={[containerBackground("#18181b", "widget"), padding({ all: 2 })]}
    >
      <HStack spacing={4}>
        <Image systemName="waveform" color="#818cf8" />
        <Text modifiers={[font({ size: 12, weight: "semibold" }), foregroundStyle("#a5b4fc")]}>
          {props.openActions > 0 ? `Eaves · ${props.openActions} to do` : "Eaves"}
        </Text>
      </HStack>

      <Text modifiers={[font({ size: small ? 15 : 17, weight: "bold" }), foregroundStyle("#fafafa"), lineLimit(small ? 2 : 1)]}>
        {props.title}
      </Text>

      {shownActions.length > 0 ? (
        shownActions.map((action, i) => (
          <Text key={i} modifiers={[font({ size: 13 }), foregroundStyle("#e4e4e7"), lineLimit(1)]}>
            {`☐ ${action}`}
          </Text>
        ))
      ) : (
        <Text modifiers={[font({ size: 13 }), foregroundStyle("#a1a1aa"), lineLimit(small ? 3 : large ? 8 : 2)]}>
          {props.summary}
        </Text>
      )}

      {props.updatedLabel ? (
        <Text modifiers={[font({ size: 11 }), foregroundStyle("#71717a")]}>{props.updatedLabel}</Text>
      ) : null}
    </VStack>
  );
};

// Keep in sync with EMPTY_WIDGET_PROPS in ./types (inlined so this file imports only types).
export default createWidget("EavesWidget", EavesWidget, {
  hasMeeting: false,
  title: "No meetings yet",
  summary: "Open Eaves and start a session to see notes and action items here.",
  actions: [],
  openActions: 0,
  updatedLabel: "",
});
