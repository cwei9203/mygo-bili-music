export function ProgressBar({ label, ariaLabel, value = 0, isIndeterminate = false, showValue = false }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={'s2-progress' + (isIndeterminate ? ' is-indeterminate' : '')}
      role="progressbar"
      aria-label={label || ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isIndeterminate ? undefined : Math.round(clamped)}
    >
      {label || showValue ? (
        <div className="s2-progress__head">
          <span>{label}</span>
          {showValue && !isIndeterminate ? <span className="s2-progress__value">{Math.round(clamped)}%</span> : null}
        </div>
      ) : null}
      <div className="s2-progress__track">
        <div
          className="s2-progress__fill"
          style={isIndeterminate ? undefined : { width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
