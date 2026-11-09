"use client";
import { useId } from "react";
import { Info } from "lucide-react";

export default function InfoTip({ text }: { text: string }) {
  const id = useId();
  return (
    <span className="info-tip">
      <button
        type="button"
        className="info-trigger"
        aria-label="More information"
        aria-describedby={id}
      >
        <Info size={15} />
      </button>
      <span id={id} role="tooltip">
        {text}
      </span>
    </span>
  );
}
