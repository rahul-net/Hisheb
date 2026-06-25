import { useEffect, useRef, useState } from "react";
import { DELETE_PIN } from "@/lib/budget-store";
import { ShieldAlert } from "lucide-react";

export function PinDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPin("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    if (pin === DELETE_PIN) onConfirm();
    else setError("Incorrect PIN");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="glass w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-elegant animate-in slide-in-from-bottom">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-warm text-white">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-lg truncate">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="৪-সংখ্যার পিন দিন"
          className="mt-5 w-full rounded-2xl border border-glass-border bg-card/70 px-4 py-4 text-center text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-primary"
        />
        {error && <p className="mt-2 text-sm text-destructive text-center">ভুল পিন</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="rounded-2xl border border-glass-border bg-card/60 py-3 font-semibold hover:bg-card"
          >
            বাতিল
          </button>
          <button
            onClick={submit}
            className="rounded-2xl gradient-warm py-3 font-semibold text-white shadow-elegant active:scale-95 transition"
          >
            নিশ্চিত করুন
          </button>
        </div>
      </div>
    </div>
  );
}