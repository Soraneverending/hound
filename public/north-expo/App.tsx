import { useEffect, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { colors } from "./src/theme";
import {
  localDayKey,
  type Note,
  type Ritual,
  type TabId,
  uid,
  useNorthStorage,
} from "./src/store";

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function App() {
  const { data, ready, commit } = useNorthStorage();
  const [tab, setTab] = useState<TabId>("today");
  const [now, setNow] = useState(new Date());
  const [focusEndsAt, setFocusEndsAt] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [noteText, setNoteText] = useState("");
  const [notePhoto, setNotePhoto] = useState<string | undefined>();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (ready) setDraft(data.intentionDay === localDayKey() ? data.intention : "");
  }, [ready, data.intention, data.intentionDay]);

  const remaining = focusEndsAt
    ? Math.max(0, Math.round((focusEndsAt - now.getTime()) / 1000))
    : data.focusMinutes * 60;
  const running = Boolean(focusEndsAt && remaining > 0);

  useEffect(() => {
    if (focusEndsAt && now.getTime() >= focusEndsAt) {
      setFocusEndsAt(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [focusEndsAt, now]);

  const doneCount = data.rituals.filter((r) => r.doneDates.includes(localDayKey())).length;
  const timeLabel = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function pickPhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: false });
    if (!result.canceled && result.assets[0]?.uri) {
      setNotePhoto(result.assets[0].uri);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function saveNote() {
    if (!noteText.trim() && !notePhoto) return;
    const note: Note = {
      id: uid(),
      text: noteText.trim(),
      createdAt: Date.now(),
      photo: notePhoto,
    };
    commit({ ...data, notes: [note, ...data.notes].slice(0, 40) });
    setNoteText("");
    setNotePhoto(undefined);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function toggleRitual(id: string) {
    const day = localDayKey();
    const rituals: Ritual[] = data.rituals.map((ritual) => {
      if (ritual.id !== id) return ritual;
      const has = ritual.doneDates.includes(day);
      return {
        ...ritual,
        doneDates: has ? ritual.doneDates.filter((d) => d !== day) : [...ritual.doneDates, day],
      };
    });
    commit({ ...data, rituals });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  const screen = useMemo(() => {
    if (!ready) return <Text style={styles.muted}>Loading…</Text>;
    if (tab === "notes") {
      return (
        <View style={{ gap: 16 }}>
          <Text style={styles.kicker}>Capture</Text>
          <Text style={styles.title}>Notes</Text>
          <View style={styles.card}>
            {notePhoto ? <Image source={{ uri: notePhoto }} style={styles.photo} /> : null}
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="A sentence, a list, a still."
              placeholderTextColor={colors.faint}
              multiline
              style={styles.area}
            />
            <View style={styles.row}>
              <Pressable onPress={() => void pickPhoto()} style={styles.softBtn}>
                <Text style={styles.softBtnText}>Camera</Text>
              </Pressable>
              <Pressable onPress={saveNote} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
          {data.notes.map((note) => (
            <View key={note.id} style={styles.card}>
              {note.photo ? <Image source={{ uri: note.photo }} style={styles.photo} /> : null}
              <Text style={styles.muted}>{new Date(note.createdAt).toLocaleTimeString()}</Text>
              <Text style={styles.body}>{note.text || "A captured still."}</Text>
            </View>
          ))}
        </View>
      );
    }
    if (tab === "rituals") {
      return (
        <View style={{ gap: 16 }}>
          <Text style={styles.kicker}>Keep</Text>
          <Text style={styles.title}>Rituals</Text>
          <Text style={styles.muted}>
            {doneCount} of {data.rituals.length} marked today
          </Text>
          <View style={styles.card}>
            {data.rituals.map((ritual, i) => {
              const on = ritual.doneDates.includes(localDayKey());
              return (
                <Pressable
                  key={ritual.id}
                  onPress={() => toggleRitual(ritual.id)}
                  style={[styles.ritualRow, i > 0 && styles.ritualBorder]}
                >
                  <View style={[styles.check, on && styles.checkOn]}>
                    <Text style={{ color: on ? colors.forestFg : "transparent" }}>✓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ritualTitle, on && { color: colors.sage }]}>
                      {ritual.title}
                    </Text>
                    <Text style={styles.muted}>{ritual.hint}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }
    if (tab === "device") {
      return (
        <View style={{ gap: 16 }}>
          <Text style={styles.kicker}>Live on device</Text>
          <Text style={styles.title}>Phone</Text>
          <Text style={styles.body}>
            You are inside Expo Go on iPhone or Android. Edits you save on Windows hot-reload here.
            No Mac, no Xcode. Android can also USB-debug or run an emulator on the PC.
          </Text>
          <View style={styles.card}>
            <Text style={styles.muted}>WHAT SHOULD I CALL YOU?</Text>
            <TextInput
              value={data.name}
              onChangeText={(name) => commit({ ...data, name })}
              placeholder="Your first name"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          </View>
          <View style={styles.card}>
            <Text style={styles.body}>Start on Windows with:</Text>
            <Text style={styles.code}>npx expo start --tunnel</Text>
            <Text style={[styles.muted, { marginTop: 10 }]}>
              Scan the QR in Expo Go. Android: scan inside the app, not Camera. iPhone: Camera or
              Expo Go. Later: eas build -p android --profile preview, or ios for TestFlight.
            </Text>
          </View>
        </View>
      );
    }
    return (
      <View style={{ gap: 16 }}>
        <Text style={styles.muted}>
          {greetingFor(now)}
          {data.name ? `, ${data.name}` : ""}
        </Text>
        <Text style={styles.clock}>{timeLabel}</Text>
        <Text style={styles.muted}>{dateLabel}</Text>
        <View style={styles.card}>
          <Text style={styles.kicker}>Today’s heading</Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onEndEditing={() => commit({ ...data, intention: draft, intentionDay: localDayKey() })}
            placeholder="One sentence that would make today true."
            placeholderTextColor={colors.faint}
            multiline
            style={styles.headingInput}
          />
        </View>
        <View style={styles.grid}>
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.kicker}>Focus</Text>
            <Text style={styles.clockSmall}>{formatDuration(remaining)}</Text>
            <View style={styles.row}>
              {[5, 15, 25].map((m) => (
                <Pressable
                  key={m}
                  onPress={() => {
                    commit({ ...data, focusMinutes: m });
                    setFocusEndsAt(null);
                  }}
                  style={[styles.chip, data.focusMinutes === m && styles.chipOn]}
                >
                  <Text style={[styles.chipText, data.focusMinutes === m && styles.chipTextOn]}>
                    {m}m
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => {
                if (running) setFocusEndsAt(null);
                else setFocusEndsAt(Date.now() + data.focusMinutes * 60 * 1000);
              }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>{running ? "Stop" : "Start"}</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => setTab("rituals")} style={[styles.card, { flex: 1 }]}>
            <Text style={styles.kicker}>Rituals</Text>
            <Text style={styles.clockSmall}>
              {doneCount}/{data.rituals.length}
            </Text>
            <Text style={[styles.muted, { marginTop: 12 }]}>Small acts, kept.</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [
    tab,
    ready,
    data,
    draft,
    noteText,
    notePhoto,
    remaining,
    running,
    now,
    timeLabel,
    dateLabel,
    doneCount,
  ]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>{screen}</ScrollView>
        <View style={styles.tabbar}>
          {(
            [
              ["today", "Today"],
              ["notes", "Notes"],
              ["rituals", "Rituals"],
              ["device", "Phone"],
            ] as const
          ).map(([id, label]) => (
            <Pressable key={id} onPress={() => setTab(id)} style={styles.tab}>
              <Text style={[styles.tabLabel, tab === id && styles.tabLabelOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 32, gap: 8 },
  kicker: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  title: { color: colors.ink, fontSize: 34, fontWeight: "600", letterSpacing: -0.8 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  clock: { color: colors.ink, fontSize: 56, fontWeight: "500", letterSpacing: -1.6 },
  clockSmall: { color: colors.ink, fontSize: 36, fontWeight: "500", marginVertical: 8 },
  card: { backgroundColor: colors.paper, borderRadius: 24, padding: 16, gap: 8 },
  grid: { flexDirection: "row", gap: 10 },
  row: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "space-between" },
  area: { minHeight: 72, color: colors.ink, fontSize: 16 },
  input: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    color: colors.ink,
    backgroundColor: colors.bg,
  },
  headingInput: { color: colors.ink, fontSize: 20, fontWeight: "500", minHeight: 56 },
  photo: { width: "100%", height: 160, borderRadius: 16, backgroundColor: colors.line },
  primaryBtn: {
    backgroundColor: colors.forest,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  primaryBtnText: { color: colors.forestFg, fontWeight: "600" },
  softBtn: {
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
  },
  softBtnText: { color: colors.ink, fontWeight: "600" },
  chip: {
    height: 32,
    minWidth: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  chipOn: { backgroundColor: colors.forest },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  chipTextOn: { color: colors.forestFg },
  ritualRow: { flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 10 },
  ritualBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  check: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  checkOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  ritualTitle: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  code: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    color: colors.ink,
    backgroundColor: colors.bg,
    padding: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  tabbar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
    paddingBottom: 8,
  },
  tab: { flex: 1, height: 52, alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: 11, color: colors.faint, fontWeight: "600" },
  tabLabelOn: { color: colors.forest },
});
