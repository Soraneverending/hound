import { useEffect, useState } from "react";
import { Check, Download, MoreVertical, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyRow } from "@/components/copy-row";
import { cn } from "@/lib/cn";
import { detectPhoneOS, isStandalone, type PhoneOS } from "@/lib/platform";
import { useNorth } from "@/lib/store";

type PathId = "now" | "expo" | "store";
type Target = "ios" | "android";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
};

const TREE = `North/
  App.tsx
  app.json
  package.json
  src/
    store.ts
    theme.ts`;

export function DeviceScreen() {
  const name = useNorth((s) => s.name);
  const setName = useNorth((s) => s.setName);
  const [path, setPath] = useState<PathId>("now");
  const [target, setTarget] = useState<Target>("android");
  const [installed, setInstalled] = useState(false);
  const [detected, setDetected] = useState<PhoneOS>("other");
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const os = detectPhoneOS();
    setDetected(os);
    setInstalled(isStandalone());
    if (os === "ios") setTarget("ios");
    if (os === "android") setTarget("android");

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const android = target === "android";

  return (
    <div className="flex flex-col gap-5 pb-10">
      <header>
        <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Live on device</p>
        <h1 className="mt-1 font-display text-4xl font-medium tracking-[-0.03em] text-ink">
          Phone
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          One project, both phones. Install from the browser, or run the React Native build in Expo
          Go from Windows. No Mac for either.
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl">
        <img
          src="/images/ridge.jpg"
          alt="Misty pine ridge at first light"
          className="h-36 w-full object-cover"
        />
      </div>

      {installed ? (
        <div className="flex items-start gap-3 rounded-3xl bg-paper p-4">
          <span className="flex size-10 items-center justify-center rounded-full bg-forest text-forest-fg">
            <Check className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">Running as a home-screen app</p>
            <p className="mt-1 text-sm text-muted">
              North is in standalone mode. Camera, haptics, and notes stay on this phone.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-1 rounded-full bg-paper p-1">
        {(
          [
            ["android", "Android"],
            ["ios", "iPhone"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTarget(id)}
            className={cn(
              "h-10 rounded-full text-sm font-medium",
              target === id ? "bg-forest text-forest-fg" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-full bg-paper p-1">
        {(
          [
            ["now", "Home"],
            ["expo", "Expo"],
            ["store", "Stores"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPath(id)}
            className={cn(
              "h-10 rounded-full text-sm font-medium",
              path === id ? "bg-forest text-forest-fg" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {path === "now" ? (
        <section className="flex flex-col gap-3 rounded-3xl bg-paper p-5">
          <div className="flex items-center gap-2 text-forest">
            <Smartphone className="size-4" />
            <p className="text-xs font-medium tracking-[0.14em] uppercase">Fastest — no Node</p>
          </div>
          <p className="font-display text-2xl leading-snug font-medium tracking-[-0.03em]">
            {android ? "Install from Chrome" : "Add to Home Screen"}
          </p>

          {android && installPrompt && !installed ? (
            <Button
              className="w-full"
              onClick={async () => {
                await installPrompt.prompt();
                setInstallPrompt(null);
              }}
            >
              Install North
            </Button>
          ) : null}

          {android ? (
            <ol className="flex flex-col gap-3 text-sm leading-relaxed text-ink">
              <li className="flex gap-3">
                <span className="font-mono text-xs text-faint">01</span>
                Open this page in Chrome
                {detected === "android" ? " — you are already on Android." : " on the Android phone."}
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-faint">02</span>
                Tap the three-dot menu
                <MoreVertical className="size-4 shrink-0 text-muted" />
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-faint">03</span>
                Choose Install app or Add to Home screen, then Install
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-faint">04</span>
                Launch North from the home screen or app drawer. It opens full-screen.
              </li>
            </ol>
          ) : (
            <ol className="flex flex-col gap-3 text-sm leading-relaxed text-ink">
              <li className="flex gap-3">
                <span className="font-mono text-xs text-faint">01</span>
                Open this page in Safari
                {detected === "ios" ? " — you are already on iOS." : " on the iPhone."}
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-faint">02</span>
                Tap the Share sheet
                <Share className="size-4 shrink-0 text-muted" />
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-faint">03</span>
                Choose Add to Home Screen, then Add
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-faint">04</span>
                Launch North from the icon. It opens full-screen.
              </li>
            </ol>
          )}

          <p className="text-sm text-muted">
            {android
              ? "Use Chrome, not Instagram or Gmail’s in-app browser. Samsung Internet can install too. Camera and vibration are real on the phone."
              : "Use Safari, not Chrome on iOS and not an in-app browser. Camera and haptics are real on the phone."}
          </p>
        </section>
      ) : null}

      {path === "expo" ? (
        <section className="flex flex-col gap-3 rounded-3xl bg-paper p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">
            Windows → Expo Go → {android ? "Android" : "iPhone"}
          </p>
          <p className="font-display text-2xl leading-snug font-medium tracking-[-0.03em]">
            {android ? "Live-reload on Android from Windows" : "Live-reload without Xcode"}
          </p>
          <p className="text-sm leading-relaxed text-muted">
            {android
              ? "Android is the easy path from Windows. Expo Go is a native shell from the Play Store. You can also USB-debug or run an emulator on the PC. No Mac."
              : "You cannot compile an iOS binary on Windows. You can run JavaScript inside Expo Go from the App Store. Match the SDK Expo Go reports (currently 57 on expo.dev/go)."}
          </p>
          <ol className="flex flex-col gap-4 text-sm leading-relaxed">
            <li>
              <p className="font-medium">Install Node.js LTS on Windows</p>
              <p className="mt-1 text-muted">From nodejs.org. Restart PowerShell after setup.</p>
            </li>
            <li>
              <p className="font-medium">
                {android ? "Install Expo Go from Play Store" : "Install Expo Go from the App Store"}
              </p>
              <p className="mt-1 text-muted">
                {android
                  ? "Play Store → Expo Go. Allow camera if you will scan a QR."
                  : "App Store → Expo Go. Allow Local Network if asked."}
              </p>
            </li>
            <li>
              <p className="font-medium">Scaffold and drop in North</p>
              <div className="mt-2 flex flex-col gap-2">
                <CopyRow
                  label="Create app"
                  command="npx create-expo-app@latest North -t blank-typescript"
                />
                <CopyRow label="Enter folder" command="cd North" />
                <CopyRow
                  label="Native modules"
                  command="npx expo install expo-haptics expo-image-picker @react-native-async-storage/async-storage"
                />
              </div>
              <p className="mt-2 text-muted">Replace App.tsx and add src/ from the download. File tree:</p>
              <pre className="mt-2 overflow-x-auto rounded-2xl bg-bg p-3 font-mono text-[11px] leading-relaxed text-ink">
                {TREE}
              </pre>
            </li>
            <li>
              <p className="font-medium">Start with a tunnel — Windows firewalls often block LAN</p>
              <div className="mt-2">
                <CopyRow label="Dev server" command="npx expo start --tunnel" />
              </div>
              <p className="mt-2 text-muted">
                If tunnel asks for ngrok:{" "}
                <span className="font-mono text-ink">npm i -g @expo/ngrok</span>. Set the PC Wi-Fi
                profile to Private.
              </p>
            </li>
            <li>
              <p className="font-medium">Open on the phone</p>
              <p className="mt-1 text-muted">
                {android
                  ? "Open Expo Go and scan the QR there. Android Camera does not hand off to Expo the way iPhone Camera does. USB: enable USB debugging, connect, then press a in the Expo terminal."
                  : "Scan the QR with the iPhone Camera app or inside Expo Go. The project hot-reloads as you edit on Windows."}
              </p>
            </li>
          </ol>
          <Button asChild className="mt-1 w-full">
            <a href="/north-expo.zip" download>
              <Download className="size-4" />
              Download Expo source
            </a>
          </Button>
        </section>
      ) : null}

      {path === "store" ? (
        <section className="flex flex-col gap-3 rounded-3xl bg-paper p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Later</p>
          <p className="font-display text-2xl leading-snug font-medium tracking-[-0.03em]">
            {android ? "Play Store without a Mac" : "App Store without a Mac"}
          </p>
          {android ? (
            <>
              <p className="text-sm leading-relaxed text-muted">
                EAS Build compiles Android in the cloud. A preview APK can be sideloaded for free —
                no Play Developer account. Play Store listing needs a one-time $25 Google Play
                registration.
              </p>
              <div className="flex flex-col gap-2">
                <CopyRow label="Install EAS" command="npm i -g eas-cli" />
                <CopyRow label="Log in" command="eas login" />
                <CopyRow label="Configure" command="eas build:configure" />
                <CopyRow label="Cloud Android APK" command="eas build -p android --profile preview" />
              </div>
              <p className="text-sm text-muted">
                Install the APK on the phone (allow unknown sources). For both platforms at once:{" "}
                <span className="font-mono text-ink">eas build --platform all</span>.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-muted">
                EAS Build compiles iOS in the cloud. You still need an Apple Developer Program
                membership ($99/year) to install a custom .ipa or ship to TestFlight. Expo Go does
                not require that.
              </p>
              <div className="flex flex-col gap-2">
                <CopyRow label="Install EAS" command="npm i -g eas-cli" />
                <CopyRow label="Log in" command="eas login" />
                <CopyRow label="Configure" command="eas build:configure" />
                <CopyRow label="Cloud iOS build" command="eas build -p ios --profile preview" />
              </div>
              <p className="text-sm text-muted">
                You never open Xcode. The build runs on Expo’s Macs. Install through TestFlight.
              </p>
            </>
          )}
        </section>
      ) : null}

      <section className="rounded-3xl bg-paper p-5">
        <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">On this phone</p>
        <label htmlFor="north-rename" className="mt-3 block text-sm font-medium">
          Name
        </label>
        <input
          id="north-rename"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="What should I call you?"
          className="mt-2 h-12 w-full rounded-2xl border border-line bg-bg px-4 text-base text-ink outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-forest/30"
        />
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Notes, rituals, and focus live in this browser’s storage. Clearing site data clears them.
        </p>
      </section>
    </div>
  );
}
