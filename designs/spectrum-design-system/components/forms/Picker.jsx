const { useEffect, useRef, useState } = React;
import { Icon } from '../content/Icon.jsx';

export function Picker({
  label,
  items = [],
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  placeholder = '请选择',
  isDisabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [internalKey, setInternalKey] = useState(defaultSelectedKey);
  const rootRef = useRef(null);
  const key = selectedKey !== undefined ? selectedKey : internalKey;
  const selected = items.find((item) => item.id === key);

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const choose = (id) => {
    if (selectedKey === undefined) setInternalKey(id);
    if (onSelectionChange) onSelectionChange(id);
    setOpen(false);
  };

  return (
    <div className="s2-picker" ref={rootRef}>
      {label ? <span className="s2-field__label">{label}</span> : null}
      <button
        type="button"
        className="s2-picker__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isDisabled}
        onClick={() => setOpen(!open)}
      >
        <span className="s2-picker__value" style={!selected ? { color: 'var(--s2-text-subdued)' } : undefined}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon name="chevronDown" size={16} />
      </button>
      {open ? (
        <div className="s2-popover">
          <ul className="s2-menu" role="listbox" aria-label={label}>
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={item.id === key}
                  className="s2-menu__item"
                  onClick={() => choose(item.id)}
                >
                  {item.label}
                  <Icon name="check" size={16} className="s2-menu__check" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
