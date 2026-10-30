const { useEffect, useRef, useState } = React;
import { Button } from '../actions/Button.jsx';
import { Icon } from '../content/Icon.jsx';

export function Menu({
  label = '更多',
  icon = 'more',
  items = [],
  onAction,
  variant = 'secondary',
  size = 'M',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="s2-menu-wrap" ref={rootRef}>
      <Button
        variant={variant}
        size={size}
        icon={icon}
        aria-haspopup="menu"
        aria-expanded={open}
        onPress={() => setOpen(!open)}
      >
        {label}
      </Button>
      {open ? (
        <div className="s2-popover s2-popover--start" style={{ minWidth: 192 }}>
          <ul className="s2-menu" role="menu">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  role="menuitem"
                  className="s2-menu__item"
                  onClick={() => {
                    setOpen(false);
                    if (onAction) onAction(item.id);
                  }}
                >
                  {item.icon ? <Icon name={item.icon} size={16} /> : null}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
