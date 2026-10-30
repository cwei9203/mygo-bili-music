const { useId } = React;
import { Icon } from '../content/Icon.jsx';

export function SearchField({
  label,
  placeholder = '搜索',
  value,
  defaultValue,
  onChange,
  onClear,
  isDisabled = false,
  ...rest
}) {
  const id = useId();
  const filled = value !== undefined ? String(value).length > 0 : false;

  return (
    <div className="s2-field s2-search">
      {label ? (
        <label className="s2-field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div className="s2-field__control">
        <Icon name="search" size={18} style={{ color: 'var(--s2-text-subdued)' }} />
        <input
          id={id}
          type="search"
          className="s2-field__input"
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={isDisabled}
          aria-label={label || placeholder}
          {...rest}
        />
        {filled ? (
          <button
            type="button"
            className="s2-iconbtn s2-iconbtn--s"
            aria-label="清除搜索"
            onClick={() => {
              if (onClear) onClear();
              if (onChange) onChange({ target: { value: '' } });
            }}
          >
            <Icon name="close" size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
