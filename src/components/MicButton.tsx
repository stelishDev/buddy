import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export function MicButton({
  listening,
  paused = false,
  onPress,
}: {
  listening: boolean;
  paused?: boolean;
  onPress: () => void;
}) {
  const pulse = useSharedValue(0);
  const hearing = listening && !paused;

  useEffect(() => {
    if (hearing) pulse.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
    else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [hearing, pulse]);

  const ring = useAnimatedStyle(() => ({
    opacity: hearing ? 0.5 * (1 - pulse.value) : 0,
    transform: [{ scale: 1 + pulse.value * 0.6 }],
  }));

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 active:opacity-80">
      <View className="h-12 w-12 items-center justify-center">
        <Animated.View style={ring} className="absolute h-12 w-12 rounded-full bg-red-500" />
        <View
          className={`h-12 w-12 items-center justify-center rounded-full ${hearing ? "bg-red-500" : listening ? "bg-amber-600" : "bg-zinc-800 border border-zinc-700"}`}
        >
          <Ionicons name={listening ? "stop" : "mic"} size={22} color="#fff" />
        </View>
      </View>
      <View>
        <Text className="text-sm font-semibold text-zinc-100">
          {listening ? (paused ? "Paused" : "Listening") : "Mic off"}
        </Text>
        <Text className="text-xs text-zinc-500">
          {listening ? (paused ? "While reading aloud" : "Tap to stop") : "Tap to start listening"}
        </Text>
      </View>
    </Pressable>
  );
}
