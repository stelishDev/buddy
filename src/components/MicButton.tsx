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

export function MicButton({ listening, onPress }: { listening: boolean; onPress: () => void }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (listening) pulse.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
    else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [listening, pulse]);

  const ring = useAnimatedStyle(() => ({
    opacity: listening ? 0.5 * (1 - pulse.value) : 0,
    transform: [{ scale: 1 + pulse.value * 0.6 }],
  }));

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 active:opacity-80">
      <View className="h-12 w-12 items-center justify-center">
        <Animated.View style={ring} className="absolute h-12 w-12 rounded-full bg-red-500" />
        <View
          className={`h-12 w-12 items-center justify-center rounded-full ${listening ? "bg-red-500" : "bg-zinc-800 border border-zinc-700"}`}
        >
          <Ionicons name={listening ? "stop" : "mic"} size={22} color="#fff" />
        </View>
      </View>
      <View>
        <Text className="text-sm font-semibold text-zinc-100">{listening ? "Listening" : "Mic off"}</Text>
        <Text className="text-xs text-zinc-500">{listening ? "Tap to stop" : "Tap to start listening"}</Text>
      </View>
    </Pressable>
  );
}
