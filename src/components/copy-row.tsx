import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { haptic } from "@/lib/haptics";

export function CopyRow({ label, command }: { label: string; command: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-2xl bg-bg px-3 py-3">
      <p className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">{label}</p>
      <div className="mt-2 flex items-start gap-2">
        <code className="min-w-0 flex-1 font-mono text-[12px] leading-relaxed break-all text-ink">
          {command}
        </code>
        <button
          type="button"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-forest"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(command);
              setCopied(true);
              haptic("success");
              window.setTimeout(() => setCopied(false), 1600);
            } catch {
              /* clipboard can fail in some embeds */
            }
          }}
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    </div>
  );
}
