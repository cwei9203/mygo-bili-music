export function Avatar({ src, alt = '', name = '', size = 32 }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <span
      className="s2-avatar"
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.36)) }}
      title={name || alt || undefined}
    >
      {src ? <img src={src} alt={alt || name} /> : initials || '?'}
    </span>
  );
}
