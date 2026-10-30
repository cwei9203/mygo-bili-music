export function Badge({ children, variant = 'neutral', fillStyle = 'bold', icon }) {
  const className = [
    's2-badge',
    variant !== 'neutral' && `s2-badge--${variant}`,
    fillStyle === 'subtle' && 's2-badge--subtle',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={className}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}
