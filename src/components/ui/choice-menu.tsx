import { useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "./button";

export function ChoiceMenu<T extends string>({
  label, value, options, onChange, disabled = false,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  function show() {
    const popup = menu.current;
    const button = trigger.current;
    if (!popup || !button) return;
    if (open) { popup.hidePopover(); return; }
    popup.showPopover();
    const rect = button.getBoundingClientRect();
    popup.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - popup.offsetWidth - 8))}px`;
    popup.style.top = `${rect.bottom + popup.offsetHeight + 8 > window.innerHeight ? Math.max(8, rect.top - popup.offsetHeight - 6) : rect.bottom + 6}px`;
    popup.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
  }
  return (
    <>
      <Button ref={trigger} variant="ghost" className="choice-trigger"
        aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={id}
        disabled={disabled || options.length === 0} onClick={show}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(); }
        }}>
        <span>{options.find((option) => option.value === value)?.label || "选择歌单"}</span>
        <ChevronDown size={14} />
      </Button>
      <div ref={menu} id={id} popover="auto" role="menu" aria-label={label}
        className="choice-menu" onToggle={(event) => setOpen(event.newState === "open")}
        onKeyDown={(event) => {
          const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
          const index = items.indexOf(document.activeElement as HTMLButtonElement);
          const next = event.key === "ArrowDown" ? (index + 1) % items.length
            : event.key === "ArrowUp" ? (index - 1 + items.length) % items.length
            : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : -1;
          if (next >= 0) { event.preventDefault(); items[next].focus(); }
          if (event.key === "Escape") { event.preventDefault(); menu.current?.hidePopover(); trigger.current?.focus(); }
          if (event.key === "Tab") menu.current?.hidePopover();
        }}>
        {options.map((option) => (
          <button key={option.value} type="button" role="menuitemradio"
            aria-checked={value === option.value} tabIndex={-1}
            onClick={() => { onChange(option.value); menu.current?.hidePopover(); trigger.current?.focus(); }}>
            <span>{option.label}</span>
            {value === option.value && <Check size={15} />}
          </button>
        ))}
      </div>
    </>
  );
}
