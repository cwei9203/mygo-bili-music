const { useEffect, useRef } = React;
import { Icon } from '../content/Icon.jsx';

export function Checkbox({
  children,
  isSelected = false,
  isIndeterminate = false,
  isDisabled = false,
  onChange,
  ...rest
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = isIndeterminate;
  }, [isIndeterminate]);

  return (
    <label className="s2-check">
      <input
        ref={inputRef}
        type="checkbox"
        checked={isSelected}
        disabled={isDisabled}
        onChange={onChange}
        {...rest}
      />
      <span className="s2-check__box" aria-hidden="true">
        {isIndeterminate ? <span className="s2-check__dash" /> : <Icon name="check" size={12} />}
      </span>
      {children ? <span className="s2-check__label">{children}</span> : null}
    </label>
  );
}
