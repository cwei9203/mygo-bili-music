import { Icon } from '../content/Icon.jsx';

export function IconButton({
  icon,
  label,
  variant = 'quiet',
  size = 'M',
  disabled = false,
  onPress,
  onClick,
  ...rest
}) {
  const className = [
    's2-iconbtn',
    variant === 'secondary' && 's2-iconbtn--secondary',
    size === 'S' && 's2-iconbtn--s',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick || onPress}
      {...rest}
    >
      <Icon name={icon} size={size === 'S' ? 16 : 20} />
    </button>
  );
}
