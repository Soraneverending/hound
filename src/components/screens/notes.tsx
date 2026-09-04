import { useRef, useState } from "react";
import { Camera, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image";
import { formatShortTime } from "@/lib/dates";
import { haptic } from "@/lib/haptics";
import { useNorth } from "@/lib/store";

export function NotesScreen() {
  const notes = useNorth((s) => s.notes);
  const addNote = useNorth((s) => s.addNote);
  const removeNote = useNorth((s) => s.removeNote);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(file?: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      const data = await compressImage(file);
      setPhoto(data || undefined);
      haptic("light");
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    addNote(text, photo);
    setText("");
    setPhoto(undefined);
    haptic("success");
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <header>
        <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Capture</p>
        <h1 className="mt-1 font-display text-4xl font-medium tracking-[-0.03em] text-ink">
          Notes
        </h1>
      </header>

      <form
        className="rounded-3xl bg-paper p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {photo ? (
          <div className="relative mb-3 overflow-hidden rounded-2xl">
            <img src={photo} alt="" className="h-40 w-full object-cover" />
            <button
              type="button"
              className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full bg-device/70 text-forest-fg"
              onClick={() => setPhoto(undefined)}
              aria-label="Remove photo"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A sentence, a list, a still."
          rows={3}
          className="w-full resize-none bg-transparent px-2 pt-2 text-base leading-relaxed text-ink outline-none placeholder:text-faint"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void onPick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="soft"
            size="icon"
            onClick={() => fileRef.current?.click()}
            aria-label="Add photo from camera"
            disabled={busy}
          >
            <Camera className="size-5" />
          </Button>
          <Button type="submit" className="min-w-28" disabled={!text.trim() && !photo}>
            Save
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <div className="overflow-hidden rounded-3xl bg-paper">
          <img
            src="/images/compass.jpg"
            alt="Brass compass on cream paper"
            className="h-44 w-full object-cover"
          />
          <div className="p-5">
            <p className="font-display text-xl font-medium tracking-[-0.02em]">Nothing captured yet</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              On a phone, the camera button opens the real camera. Notes stay on this device.
            </p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="overflow-hidden rounded-3xl bg-paper">
              {note.photo ? (
                <img src={note.photo} alt="" className="h-44 w-full object-cover" />
              ) : null}
              <div className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium tracking-[0.12em] text-faint uppercase">
                    {formatShortTime(new Date(note.createdAt))}
                  </p>
                  {note.text ? (
                    <p className="mt-1 text-sm leading-relaxed text-ink">{note.text}</p>
                  ) : (
                    <p className="mt-1 text-sm text-muted">A captured still.</p>
                  )}
                </div>
                <button
                  type="button"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-faint hover:text-clay"
                  onClick={() => {
                    removeNote(note.id);
                    haptic("warn");
                  }}
                  aria-label="Delete note"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
