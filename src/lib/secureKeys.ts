import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * API keys never go into the general app store. On iOS/Android they live in
 * the Keychain / Keystore via expo-secure-store. On web (dev only) we fall
 * back to AsyncStorage, which is NOT secure.
 */
const keyName = (providerId: string) => `apikey_${providerId.replace(/[^A-Za-z0-9._-]/g, "_")}`;
const isWeb = Platform.OS === "web";

export async function getApiKey(providerId: string): Promise<string | null> {
  const k = keyName(providerId);
  return isWeb ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k);
}

export async function setApiKey(providerId: string, value: string): Promise<void> {
  const k = keyName(providerId);
  if (isWeb) await AsyncStorage.setItem(k, value);
  else await SecureStore.setItemAsync(k, value);
}

export async function deleteApiKey(providerId: string): Promise<void> {
  const k = keyName(providerId);
  if (isWeb) await AsyncStorage.removeItem(k);
  else await SecureStore.deleteItemAsync(k);
}
