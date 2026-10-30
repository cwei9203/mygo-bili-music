export function Toast({ toasts = [], onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="s2-toast-region" role="region" aria-label="通知">
      {toasts.map((toast) => (
        <div className="s2-toast" role="status" key={toast.id}>
          <span>{toast.message}</span>
          {toast.actionLabel ? (
            <button
              type="button"
              className="s2-toast__action"
              onClick={() => {
                if (toast.onAction) toast.onAction();
                if (onDismiss) onDismiss(toast.id);
              }}
            >
              {toast.actionLabel}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
