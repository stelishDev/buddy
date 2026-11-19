# MeMate

A React Native app that listens to a meeting, transcribes it live, keeps running notes, and answers questions with the user's own AI account.

**Stack:** Expo SDK 58 (React Native 0.88, React 19.3) · Expo Router · NativeWind v4 (Tailwind CSS 3) · Zustand · expo-speech-recognition · expo-secure-store

## Features

- **Live transcription.** The mic uses the phone's built-in speech recogniser (iOS `SFSpeechRecognizer`, Android `SpeechRecognizer`). It restarts itself automatically so it can run for a whole meeting, and the screen stays awake while it listens.
- **Running notes.** While the mic is on, the notes are rewritten every 30 s to 5 min into Summary, Key points, Decisions, Action items and Open questions. You can share them from the Notes tab.
- **Ask anything.** Type a question at any time. Answers stream in, based on the transcript and notes.
- **Auto-answer (optional).** When someone asks a question out loud, MeMate suggests an answer in the Ask tab. It waits 20 seconds before doing this again.
- **Read aloud.** Answers and notes can be spoken with the phone's own voices (`expo-speech`), which are free, offline and add nothing to the app's size. Tap "Read aloud" on any answer, or turn on auto-read in Settings. The mic pauses while the app talks so it doesn't transcribe itself. If you use earphones, you can turn that off. Pick a voice and speed under Settings → Read aloud. On iOS, free Enhanced and Premium voices can be downloaded in Settings → Accessibility → Spoken Content.
- **Any AI account.** OpenAI, Anthropic (Claude), Google Gemini, and any OpenAI-compatible endpoint: OpenRouter, Groq, Mistral, DeepSeek, xAI, Ollama, LM Studio and more. You can add several accounts and switch between them. "Load models" fetches the account's actual model list, and "Test connection" checks that the key works.
- **Private by default.** API keys are stored in the Keychain or Keystore. Transcripts are stored on the device. Calls go straight from the phone to your chosen provider, with no backend in between.

## Getting started

```bash
npm install
npx expo install --fix      # align every Expo package to the exact SDK 58 versions
npx expo-doctor@latest      # sanity check

# Speech recognition is a native module, so use a development build (not Expo Go):
npx expo run:ios            # or: npx expo run:android
# or build in the cloud:  eas build --profile development --platform ios
```

Next, open **Settings → Add** in the app. Pick a provider, paste a key, tap **Load models**, choose a model, then **Test connection** and **Save**.

> For **Ollama or LM Studio** on your computer, use its LAN IP (e.g. `http://192.168.1.10:11434/v1`), not `localhost`. Plain `http` on iOS also needs an App Transport Security exception.

## Building with EAS

`eas.json` has three profiles:
- `development`: a dev client, installed as an APK
- `preview`: an installable APK for testing
- `production`: a store build with an auto-incremented version

**One-time setup (on your computer):**
1. The app ID (`ios.bundleIdentifier` / `android.package` in `app.json`) is `com.talspot.memate`. If you want a different ID, change it before the first build, because the Android signing key is tied to it.
2. Run `npm install && npx expo install --fix`.
3. Run `npx eas-cli@latest init`. This creates the Expo project and adds `extra.eas.projectId` to `app.json`.
4. Commit `app.json`, `package.json` and `package-lock.json`.
5. Create a token at expo.dev → Account settings → Access tokens. Add it on GitHub under the repo's Settings → Secrets and variables → Actions as **`EXPO_TOKEN`**.
6. **iOS only:** run `npx eas-cli@latest credentials -p ios` once, so Apple certificates exist before building from CI. Android generates its keystore automatically on the first build.

**Start a build:** open GitHub → Actions → **EAS Build** → **Run workflow**, then pick the platform and profile. This also works in the GitHub mobile app. When the build finishes, the install link and QR code are at expo.dev → your project → Builds.

To build locally instead, run `npx eas-cli@latest build -p android --profile preview`.

## Project layout

```
app/
  _layout.tsx            Stack navigator + global.css
  index.tsx              Meeting list / new session
  session/[id].tsx       Live session: mic, Transcript / Notes / Ask tabs, composer
  settings/index.tsx     AI accounts, assistant + speech settings
  settings/provider.tsx  Add / edit an AI account
src/
  lib/ai/client.ts       streamChat(), listModels(), testConnection() for every provider
  lib/ai/sse.ts          Streaming SSE reader (expo/fetch)
  lib/ai/presets.ts      Provider presets + default base URLs
  lib/prompts.ts         System prompts, transcript formatting, question detection
  lib/secureKeys.ts      API key storage (SecureStore)
  lib/tts.ts             Text-to-speech: speak/stop, markdown → speech, voice list
  hooks/useMeetingListener.ts  Continuous speech recognition with auto-restart
  hooks/useAssistant.ts        Ask + notes refresh with streaming
  store/                 Zustand stores persisted to AsyncStorage
  components/            UI pieces (NativeWind classes)
```

## Adding a provider type

Presets in `src/lib/ai/presets.ts` cover most providers. If a new API isn't OpenAI-compatible, add a `kind` to `ProviderKind` and a branch to `streamChat` and `listModels` in `client.ts`.

## Notes and limits

- **Consent.** Tell people before you transcribe a meeting. In many places, recording without consent is illegal.
- **iOS.** Recognition runs in short utterance-sized sessions that restart straight away, so a word can occasionally be lost at the boundary. Listening stops if the app is backgrounded.
- **Android.** Continuous mode needs Android 13 or later. Older versions fall back to restart-per-utterance. Some devices beep on each restart.
- **Better accuracy or speaker labels.** You could swap `useMeetingListener` for chunked recording with `expo-audio` and a cloud speech-to-text API (e.g. OpenAI transcription, Deepgram, AssemblyAI). The rest of the app only needs `onFinal(text)`.
- **More natural voices.** For neural voices offline, swap `src/lib/tts.ts` to use Kokoro-82M (Apache-2.0) through `react-native-sherpa-onnx`, and download the model on first use (roughly 100–300 MB). Before shipping Piper voices commercially, check their licences: the engine is now GPL-3.0, and many voices are licensed for non-commercial use only.
- **NativeWind v5.** v5 (Tailwind 4) is still a release candidate. This project uses stable v4. When v5 goes stable, follow the official v4 → v5 migration guide. The class names stay the same.
