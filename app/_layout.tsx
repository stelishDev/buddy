import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { startWidgetSync } from "@/widgets/sync";

export default function RootLayout() {
  // Keep the home screen widget showing the latest meeting.
  useEffect(() => startWidgetSync(), []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#09090b" },
          headerTintColor: "#f4f4f5",
          headerTitleStyle: { fontWeight: "600" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: "#09090b" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Eaves" }} />
        <Stack.Screen name="session/[id]" options={{ title: "Meeting" }} />
        <Stack.Screen name="settings/index" options={{ title: "Settings" }} />
        <Stack.Screen name="settings/provider" options={{ title: "AI account", presentation: "modal" }} />
      </Stack>
    </>
  );
}
