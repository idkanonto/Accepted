"use client";

import { useId, type KeyboardEvent } from "react";

export default function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  panelId,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  panelId?: string;
}) {
  const id = useId();
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % items.length
        : event.key === "ArrowLeft"
          ? (index - 1 + items.length) % items.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    onChange(items[next].id);
    document.getElementById(`${id}-${items[next].id}`)?.focus();
  }
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map((item, index) => (
        <button
          key={item.id}
          id={`${id}-${item.id}`}
          role="tab"
          aria-selected={value === item.id}
          aria-controls={panelId}
          tabIndex={value === item.id ? 0 : -1}
          onKeyDown={(event) => navigate(event, index)}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
