const ICON_PATHS = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
  play: <path d="M8 5.5l10 6.5-10 6.5z" fill="currentColor" stroke="none" />,
  pause: <><rect x="8" y="5.5" width="3" height="13" fill="currentColor" stroke="none" /><rect x="14" y="5.5" width="3" height="13" fill="currentColor" stroke="none" /></>,
  prev: <><path d="M7 5v14" /><path d="M19 5.5L9 12l10 6.5z" fill="currentColor" stroke="none" /></>,
  next: <><path d="M17 5v14" /><path d="M5 5.5L15 12 5 18.5z" fill="currentColor" stroke="none" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  close: <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
  grip: <><circle cx="9" cy="7" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="7" r="1.2" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="9" cy="17" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="17" r="1.2" fill="currentColor" stroke="none" /></>,
  list: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h10" /></>,
  repeat: <><path d="M17 3l3 3-3 3" /><path d="M20 6H8a4 4 0 00-4 4v1" /><path d="M7 21l-3-3 3-3" /><path d="M4 18h12a4 4 0 004-4v-1" /></>,
  shuffle: <><path d="M17 3l3 3-3 3" /><path d="M20 6h-4c-5 0-5 12-10 12H4" /><path d="M17 21l3-3-3-3" /><path d="M4 6h2c2 0 3.2 2 4.3 4.4" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V5h6v2" /><path d="M6 7l1 13h10l1-13" /></>,
  edit: <><path d="M4 20h4l10-10-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></>,
  folder: <><path d="M3 7h6l2 2h10v10H3z" /></>,
  volume: <><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16.5 9.5a4 4 0 010 5" /></>,
  chevron: <path d="M9 6l6 6-6 6" />,
};

function Icon({ name, size = 16, strokeWidth = 1.6, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {ICON_PATHS[name] || null}
    </svg>
  );
}

Object.assign(window, { Icon });
