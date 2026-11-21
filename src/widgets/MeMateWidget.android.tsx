import { Column, Spacer, Text } from "@expo/ui/jetpack-compose";
import { background, cornerRadius, fillMaxSize, fillMaxWidth, height, paddingAll } from "@expo/ui/jetpack-compose/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import type { MeMateWidgetProps } from "./types";

/**
 * Android home screen widget (Jetpack Compose via Expo UI).
 * Runs in an isolated runtime: no hooks, no app state, no module-scope values —
 * everything it needs comes in through props. Updated from the app by src/widgets/sync.ts.
 */
const MeMateWidget = (props: MeMateWidgetProps, environment: WidgetEnvironment) => {
  "widget";
  const size = (environment as { widgetSize?: { width: number; height: number } }).widgetSize;
  const tall = (size?.height ?? 110) >= 180;
  const shownActions = props.actions.slice(0, tall ? 4 : 2);

  return (
    <Column modifiers={[fillMaxSize(), background("#18181b"), cornerRadius(20), paddingAll(14)]}>
      <Text color="#a5b4fc" style={{ fontSize: 12, fontWeight: "bold" }}>
        {props.openActions > 0 ? `MeMate · ${props.openActions} to do` : "MeMate"}
      </Text>
      <Spacer modifiers={[height(4)]} />
      <Text
        color="#fafafa"
        maxLines={1}
        overflow="ellipsis"
        modifiers={[fillMaxWidth()]}
        style={{ fontSize: 16, fontWeight: "bold" }}
      >
        {props.title}
      </Text>
      <Spacer modifiers={[height(4)]} />
      {shownActions.length > 0 ? (
        shownActions.map((action, i) => (
          <Text key={i} color="#e4e4e7" maxLines={1} overflow="ellipsis" style={{ fontSize: 13 }}>
            {`☐ ${action}`}
          </Text>
        ))
      ) : (
        <Text color="#a1a1aa" maxLines={tall ? 5 : 2} overflow="ellipsis" style={{ fontSize: 13 }}>
          {props.summary}
        </Text>
      )}
      {props.updatedLabel ? <Spacer modifiers={[height(4)]} /> : null}
      {props.updatedLabel ? (
        <Text color="#71717a" style={{ fontSize: 11 }}>
          {props.updatedLabel}
        </Text>
      ) : null}
    </Column>
  );
};

// Keep in sync with EMPTY_WIDGET_PROPS in ./types (inlined so this file imports only types).
export default createWidget("MeMateWidget", MeMateWidget, {
  hasMeeting: false,
  title: "No meetings yet",
  summary: "Open MeMate and start a session to see notes and action items here.",
  actions: [],
  openActions: 0,
  updatedLabel: "",
});
