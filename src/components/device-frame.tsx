import type { ReactNode } from "react";

export function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="phone-stage flex min-h-dvh w-full items-center justify-center md:px-6">
      <div className="flex flex-col items-center gap-4">
        <div className="phone-slot">
          <div className="phone-frame">
            <div className="phone-island" aria-hidden="true" />
            <div className="phone-glass">{children}</div>
            <div className="phone-home" aria-hidden="true" />
          </div>
        </div>
        <p className="hidden font-sans text-sm text-muted md:block">
          North · iPhone and Android, no Mac
        </p>
      </div>
    </div>
  );
}
