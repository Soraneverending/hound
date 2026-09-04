NORTH — Expo (Windows → iPhone and Android, no Mac)
====================================================

You cannot compile a native iOS app on Windows. You can:
  1. Live-reload JavaScript inside Expo Go on iPhone and Android (this folder).
  2. Compile Android (and iOS) in the cloud with EAS Build.

Android is the easier native path from Windows: Play Store Expo Go, USB
debugging, and a sideloadable APK with no Apple account.

Prerequisites
-------------
- Windows 10/11
- Node.js LTS from https://nodejs.org  (restart PowerShell after install)
- Phone: Expo Go from Play Store (Android) and/or App Store (iPhone)
- Optional: same Wi-Fi. If LAN fails (common on Windows), use --tunnel.

Create the project, then drop these files in
--------------------------------------------
In PowerShell:

  npx create-expo-app@latest North -t blank-typescript
  cd North
  npx expo install expo-haptics expo-image-picker @react-native-async-storage/async-storage

Copy from this zip:
  App.tsx          → project root (replace)
  src/store.ts     → src/store.ts
  src/theme.ts     → src/theme.ts
  app.json         → merge the name/slug/orientation if you want

Start on the phone
------------------
  npx expo start --tunnel

Android: open Expo Go and scan the QR inside the app (Camera does not hand off).
         USB: enable USB debugging, connect, press a in the Expo terminal.
iPhone:  scan the QR with Camera or inside Expo Go.

Windows notes
-------------
- Set the PC network profile to Private.
- Allow Node.js through Windows Firewall when prompted.
- If tunnel asks for ngrok:  npm i -g @expo/ngrok
- SDK mismatch: Expo Go must match the project's expo SDK.
  Check https://expo.dev/go  and if needed:
    npx expo install expo@~54.0.0
    npx expo install --fix

Stores later (still no Mac)
---------------------------
  npm i -g eas-cli
  eas login
  eas build:configure
  eas build -p android --profile preview
  eas build -p ios --profile preview

Android preview APK: sideload for free, no Play account.
Play Store listing: one-time $25 Google Play registration.
iOS custom binary / TestFlight: Apple Developer Program, $99/year.
Expo Go does not require either.

What this project is
--------------------
North: today clock, daily heading, notes with camera, four rituals, focus timer.
Storage is on-device (AsyncStorage). No account, no backend.
