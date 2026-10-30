import { Icon } from '../content/Icon.jsx';

export function Button({
  children,
  variant = 'primary',
  fillStyle = 'fill',
  size = 'M',
  disabled = false,
  icon,
  onPress,
  onClick,
  type = 'button',
  ...rest
}) {
  const className = [
    's2-btn',
    `s2-btn--${variant}`,
    size !== 'M' && `s2-btn--${size.toLowerCase()}`,
    fillStyle === 'outline' && 's2-btn--outline',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={className}
      disabled={disabled}
      onClick={onClick || onPress}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === 'S' ? 14 : 18} /> : null}
      {children}
    </button>
  );
}
