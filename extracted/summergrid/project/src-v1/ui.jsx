// SummerGrid — UI primitives (buttons, pills, icons, eyebrow)

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ============ ICON ============ */
const SGIcon = ({ name, size = 20, stroke = 1.6, style, ...rest }) => {
  const paths = {
    arrowR: <><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></>,
    arrowL: <><path d="M19 12H5"/><path d="M11 19l-7-7 7-7"/></>,
    arrowDown: <><path d="M12 5v14"/><path d="M19 13l-7 7-7-7"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></>,
    filter: <><line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    google: <><path d="M22 12.2c0-.83-.07-1.62-.21-2.39H12v4.51h5.62a4.8 4.8 0 0 1-2.08 3.15v2.62h3.37C20.85 18.2 22 15.5 22 12.2z" fill="#4285F4" stroke="none"/><path d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.37-2.62c-.94.63-2.14 1-3.25 1-2.5 0-4.62-1.69-5.38-3.96H3.13v2.7A10 10 0 0 0 12 22z" fill="#34A853" stroke="none"/><path d="M6.62 14a6 6 0 0 1 0-3.83V7.47H3.13a10 10 0 0 0 0 9l3.5-2.46z" fill="#FBBC04" stroke="none"/><path d="M12 5.4c1.47 0 2.79.5 3.83 1.5l2.87-2.87A10 10 0 0 0 3.13 7.47l3.5 2.7C7.38 7.92 9.5 6.4 12 6.4z" fill="#EA4335" stroke="none"/></>,
    chevR: <polyline points="9 6 15 12 9 18"/>,
    chevD: <polyline points="6 9 12 15 18 9"/>,
    drag: <><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></>,
    pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.13.69.34.97.61"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
    swap: <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style} {...rest}>
      {paths[name]}
    </svg>
  );
};

/* ============ BUTTON ============ */
const SGButton = ({ variant = 'primary', size = 'md', icon, iconAfter, children, style, ...rest }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    fontFamily: 'var(--sg-font-body)', fontWeight: 600, lineHeight: 1, cursor: 'pointer',
    border: '1.5px solid transparent', borderRadius: 999,
    transition: 'background var(--sg-dur-fast) var(--sg-ease), color var(--sg-dur-fast), border-color var(--sg-dur-fast), transform 100ms',
    fontSize: size === 'lg' ? 16 : size === 'sm' ? 13 : 15,
    padding: size === 'lg' ? '20px 32px' : size === 'sm' ? '8px 16px' : '13px 22px',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };
  const v = {
    primary: { background: 'var(--sg-accent)', color: '#fff' },
    primaryHover: { background: 'var(--sg-accent-deep)' },
    inverse: { background: 'var(--sg-white)', color: 'var(--sg-black)' },
    inverseHover: { background: 'var(--sg-paper-2)' },
    dark: { background: 'var(--sg-black)', color: 'var(--sg-white)' },
    darkHover: { background: '#2A2A2A' },
    ghost: { background: 'transparent', color: 'var(--sg-black)', borderColor: 'var(--sg-ink-20)' },
    ghostHover: { background: 'var(--sg-paper)' },
    ghostDark: { background: 'transparent', color: 'var(--sg-white)', borderColor: 'rgba(250,250,247,0.3)' },
    ghostDarkHover: { background: 'rgba(250,250,247,0.08)' },
    link: { background: 'transparent', color: 'var(--sg-black)', padding: 0, border: 'none', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12 },
  };
  const hovered = v[variant + 'Hover'] || {};
  const [hover, setHover] = useState(false);
  return (
    <button
      style={{ ...base, ...v[variant], ...(hover ? hovered : {}), ...style }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={(e) => { setHover(false); e.currentTarget.style.transform = ''; }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      {...rest}>
      {icon && <SGIcon name={icon} size={16} stroke={2} />}
      {children}
      {iconAfter && <SGIcon name={iconAfter} size={16} stroke={2} />}
    </button>
  );
};

/* ============ STATUS PILL ============ */
const StatusPill = ({ status, small }) => {
  const s = SG_STATUS[status];
  if (!s) return null;
  const isInterested = status === 'INTERESTED';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: small ? '3px 8px' : '4px 10px',
      borderRadius: 999,
      background: isInterested ? 'transparent' : s.bg,
      border: isInterested ? '1px solid var(--sg-accent)' : '1px solid transparent',
      color: s.fg,
      fontFamily: 'var(--sg-font-mono)',
      fontSize: small ? 10 : 10.5,
      fontWeight: 600,
      letterSpacing: '0.08em',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot, display: 'inline-block' }}/>
      {s.label}
    </span>
  );
};

/* ============ EYEBROW ============ */
const Eyebrow = ({ children, onDark, accent, style }) => (
  <div className={"sg-eyebrow" + (onDark ? ' on-dark' : '')} style={{ color: accent ? 'var(--sg-accent)' : undefined, ...style }}>
    {children}
  </div>
);

/* ============ CHILD AVATAR ============ */
const ChildAvatar = ({ child, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: 999, background: child.color,
    color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--sg-font-body)', fontWeight: 700, fontSize: size * 0.4,
    letterSpacing: '0.02em', flexShrink: 0,
  }}>
    {child.initials}
  </div>
);

/* ============ FILTER CHIP ============ */
const FilterChip = ({ active, children, onClick, icon }) => (
  <button onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 999,
    background: active ? 'var(--sg-black)' : 'transparent',
    color: active ? 'var(--sg-white)' : 'var(--sg-black)',
    border: '1px solid ' + (active ? 'var(--sg-black)' : 'var(--sg-ink-20)'),
    fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'all var(--sg-dur-fast) var(--sg-ease)',
    fontFamily: 'var(--sg-font-body)',
  }}>
    {icon && <SGIcon name={icon} size={14} />}
    {children}
  </button>
);

/* ============ DRAWER ============ */
const Drawer = ({ open, onClose, children, width = 480 }) => {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.5)',
        animation: 'sg-fade-in 200ms var(--sg-ease) both',
      }}/>
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width, maxWidth: '100vw', background: 'var(--sg-white)',
        animation: 'sg-slide-right 280ms var(--sg-ease) both',
        boxShadow: '-12px 0 32px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {children}
      </div>
    </div>
  );
};

/* ============ NAV BAR (auth'd) ============ */
const NavBar = ({ route, onNav, calendarConnected }) => {
  const items = [
    { key: 'grid', label: 'GRID' },
    { key: 'discover', label: 'DISCOVER' },
    { key: 'coordinate', label: 'COORDINATE' },
  ];
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--sg-white)',
      borderBottom: '1px solid var(--sg-ink-10)',
      padding: '0 32px',
      height: 64, display: 'flex', alignItems: 'center',
    }}>
      <div onClick={() => onNav('grid')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        <SGWordmark size={20} />
      </div>
      <nav style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 6 }}>
        {items.map(it => (
          <button key={it.key} onClick={() => onNav(it.key)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sg-font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.12em',
            color: route === it.key ? 'var(--sg-black)' : 'var(--sg-ink-60)',
            padding: '8px 16px', position: 'relative',
          }}>
            {it.label}
            {route === it.key && <span style={{
              position: 'absolute', left: 16, right: 16, bottom: -22, height: 2, background: 'var(--sg-accent)',
            }}/>}
          </button>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {calendarConnected && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 999, background: 'var(--sg-paper)',
            fontFamily: 'var(--sg-font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--sg-success)' }}/>
            CALENDAR CONNECTED
          </div>
        )}
        <button onClick={() => onNav('settings')} style={{
          width: 36, height: 36, borderRadius: 999, border: '1px solid var(--sg-ink-20)',
          background: 'var(--sg-paper)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
        }}>JS</button>
      </div>
    </header>
  );
};

/* ============ WORDMARK ============ */
const SGWordmark = ({ size = 24, color, accent }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'baseline',
    fontFamily: 'var(--sg-font-display)', fontWeight: 900,
    fontSize: size, lineHeight: 1, letterSpacing: '-0.04em',
    textTransform: 'uppercase', color: color || 'var(--sg-black)',
  }}>
    Summer<span style={{ color: accent || 'var(--sg-accent)' }}>Grid</span>
  </span>
);

/* ============ STAT TILE ============ */
const StatTile = ({ label, value, hint, accent }) => (
  <div style={{ padding: '14px 20px', borderRight: '1px solid var(--sg-ink-10)' }}>
    <div className="sg-eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>{label}</div>
    <div className="sg-mono" style={{ fontSize: 22, fontWeight: 600, color: accent ? 'var(--sg-accent)' : 'var(--sg-black)' }}>{value}</div>
    {hint && <div style={{ fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 2 }}>{hint}</div>}
  </div>
);

Object.assign(window, {
  SGIcon, SGButton, StatusPill, Eyebrow, ChildAvatar, FilterChip, Drawer, NavBar, SGWordmark, StatTile,
});
