import { useEffect } from "react";
import { useHound } from "@/lib/hound-store";

export function PinPulse() {
  const pulse = useHound((s) => s.pulsePins);

  useEffect(() => {
    const kick = window.setTimeout(pulse, 8000);
    const t = window.setInterval(pulse, 12000);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(t);
    };
  }, [pulse]);

  return null;
}
