const { useId } = React;

export function TextField({
  label,
  description,
  errorMessage,
  isRequired = false,
  isDisabled = false,
  placeholder,
  value,
  defaultValue,
  onChange,
  type = 'text',
  ...rest
}) {
  const id = useId();
  const invalid = !!errorMessage;

  return (
    <div className="s2-field">
      {label ? (
        <label className="s2-field__label" htmlFor={id}>
          {label}
          {isRequired ? <span className="s2-field__required">*</span> : null}
        </label>
      ) : null}
      <div className={'s2-field__control' + (invalid ? ' is-invalid' : '')}>
        <input
          id={id}
          type={type}
          className="s2-field__input"
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={isDisabled}
          aria-invalid={invalid || undefined}
          required={isRequired || undefined}
          {...rest}
        />
      </div>
      {errorMessage || description ? (
        <span className={'s2-field__help' + (invalid ? ' is-invalid' : '')}>
          {errorMessage || description}
        </span>
      ) : null}
    </div>
  );
}
