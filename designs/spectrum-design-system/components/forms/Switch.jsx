export function Switch({
  children,
  isSelected = false,
  isDisabled = false,
  onChange,
  ...rest
}) {
  return (
    <label className="s2-switch">
      <input
        type="checkbox"
        role="switch"
        checked={isSelected}
        disabled={isDisabled}
        onChange={onChange}
        {...rest}
      />
      <span className="s2-switch__track" aria-hidden="true">
        <span className="s2-switch__thumb" />
      </span>
      {children ? <span className="s2-switch__label">{children}</span> : null}
    </label>
  );
}
