const { useEffect } = React;

export function Dialog({ isOpen, onClose, title, children, footer, width }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event) => {
      if (event.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="s2-dialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && onClose) onClose();
      }}
    >
      <div className="s2-dialog" role="dialog" aria-modal="true" aria-label={title} style={width ? { width } : undefined}>
        {title ? <h2 className="s2-dialog__title">{title}</h2> : null}
        <div className="s2-dialog__body">{children}</div>
        {footer ? <div className="s2-dialog__footer">{footer}</div> : null}
      </div>
    </div>
  );
}
