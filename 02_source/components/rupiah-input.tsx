"use client";

import { useLayoutEffect, useRef } from "react";
import type { ComponentProps } from "react";
import { formatAmountInput } from "@/lib/format";

type RupiahInputProps = Omit<
  ComponentProps<"input">,
  "value" | "onChange" | "type" | "inputMode"
> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function RupiahInput({ value, onValueChange, ref, ...props }: RupiahInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const digitsBeforeCaret = useRef<number | null>(null);

  // Titik ribuan menggeser posisi karakter, jadi kursor dipulihkan berdasarkan jumlah digit di depannya.
  useLayoutEffect(() => {
    const input = inputRef.current;
    const digits = digitsBeforeCaret.current;
    digitsBeforeCaret.current = null;
    if (!input || digits === null || document.activeElement !== input) return;

    let position = 0;
    for (let seen = 0; position < value.length && seen < digits; position += 1) {
      if (/\d/.test(value[position])) seen += 1;
    }
    input.setSelectionRange(position, position);
  }, [value]);

  return (
    <div className="relative mt-1">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted"
      >
        Rp
      </span>
      <input
        {...props}
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          const raw = event.target.value;
          const caret = event.target.selectionStart ?? raw.length;
          digitsBeforeCaret.current = raw.slice(0, caret).replace(/\D/g, "").length;
          onValueChange(formatAmountInput(raw));
        }}
        className="block min-h-11 w-full rounded-control border border-line-strong bg-surface pl-10 pr-3 text-sm tabular-nums text-ink disabled:bg-surface-muted disabled:text-muted"
      />
    </div>
  );
}
