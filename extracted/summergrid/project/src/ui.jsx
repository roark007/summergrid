// SummerGrid v2 — UI primitives

const { useState, useEffect, useRef, useMemo } = React;

/* ============ ICONS ============ */
const Icon = ({ name, size = 20, stroke = 1.6, style, ...rest }) => {
  const paths = {
    arrowR: <><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></>,
    arrowL: <><path d="M19 12H5"/><path d="M11 19l-7-7 7-7"/></>,
    arrowDown: <><path d="M12 5v14"/><path d="M19 13l-7 7-7-7"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    share: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
    car: <><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    google: <><path d="M22 12.2c0-.83-.07-1.62-.21-2.39H12v4.51h5.62a4.8 4.8 0 0 1-2.08 3.15v2.62h3.37C20.85 18.2 22 15.5 22 12.2z" fill="#4285F4" stroke="none"/><path d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.37-2.62c-.94.63-2.14 1-3.25 1-2.5 0-4.62-1.69-5.38-3.96H3.13v2.7A10 10 0 0 0 12 22z" fill="#34A853" stroke="none"/><path d="M6.62 14a6 6 0 0 1 0-3.83V7.47H3.13a10 10 0 0 0 0 9l3.5-2.46z" fill="#FBBC04" stroke="none"/><path d="M12 5.4c1.47 0 2.79.5 3.83 1.5l2.87-2.87A10 10 0 0 0 3.13 7.47l3.5 2.7C7.38 7.92 9.5 6.4 12 6.4z" fill="#EA4335" stroke="none"/></>,
    apple: <><path d="M17.5 2c-1 0-2.4.6-3.3 1.5-.8.8-1.5 2-1.3 3.3 1.1 0 2.3-.6 3.1-1.4.8-.8 1.5-2 1.5-3.4z" fill="currentColor" stroke="none"/><path d="M20 17.5c-.5 1.2-.8 1.7-1.5 2.7-1 1.4-2.4 3.2-4.2 3.2-1.6 0-2-1-4.2-1-2.2 0-2.6 1-4.2 1-1.7 0-3.1-1.6-4.1-3-2.8-4-3-8.7-1.4-11.2 1.2-1.8 3-2.8 4.7-2.8 1.8 0 2.9 1 4.3 1 1.4 0 2.3-1 4.3-1 1.6 0 3.2.8 4.4 2.3-3.9 2.1-3.2 7.6-1 8.8z" fill="currentColor" stroke="none"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} {...rest}>
      {paths[name]}
    </svg>
  );
};

/* ============ BUTTON ============ */
const Button = ({ variant = 'primary', size = 'md', icon, iconAfter, children, style, ...rest }) => {
  const [hover, setHover] = useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    fontFamily: 'var(--sg-font-body)', fontWeight: 600, lineHeight: 1, cursor: 'pointer',
    border: '1.5px solid transparent', borderRadius: 999,
    transition: 'background var(--sg-dur-fast) var(--sg-ease), color var(--sg-dur-fast), border-color var(--sg-dur-fast), transform 100ms',
    fontSize: size === 'lg' ? 16 : size === 'sm' ? 13 : 14.5,
    padding: size === 'lg' ? '20px 32px' : size === 'sm' ? '8px 16px' : '13px 22px',
    letterSpacing: '0.02em', whiteSpace: 'nowrap', userSelect: 'none',
  };
  const v = {
    primary: { background: 'var(--sg-black)', color: 'var(--sg-white)' },
    primaryHover: { background: '#2A2A2A' },
    accent: { background: 'var(--sg-accent)', color: '#fff' },
    accentHover: { background: 'var(--sg-accent-deep)' },
    inverse: { background: 'var(--sg-white)', color: 'var(--sg-black)' },
    inverseHover: { background: 'var(--sg-paper-2)' },
    ghost: { background: 'transparent', color: 'var(--sg-black)', borderColor: 'var(--sg-ink-20)' },
    ghostHover: { background: 'var(--sg-paper)' },
    ghostDark: { background: 'transparent', color: 'var(--sg-white)', borderColor: 'rgba(250,250,247,0.3)' },
    ghostDarkHover: { background: 'rgba(250,250,247,0.08)' },
  };
  const hovered = v[variant + 'Hover'] || {};
  return (
    <button
      style={{ ...base, ...v[variant], ...(hover ? hovered : {}), ...style }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={(e) => { setHover(false); e.currentTarget.style.transform = ''; }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      {...rest}>
      {icon && <Icon name={icon} size={15} stroke={2} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={15} stroke={2} />}
    </button>
  );
};

/* ============ AVATAR ============ */
const Avatar = ({ parent, size = 32, ring }) => (
  <div title={parent.name} style={{
    width: size, height: size, borderRadius: 999, background: parent.color, color: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    fontFamily: 'var(--sg-font-body)', fontWeight: 700, fontSize: size * 0.38, letterSpacing: '0.02em',
    boxShadow: ring ? `0 0 0 2px var(--sg-white), 0 0 0 4px ${parent.color}` : undefined,
  }}>
    {parent.initials}
  </div>
);

const AvatarCluster = ({ parents, size = 28, max = 4 }) => {
  const visible = parents.slice(0, max);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      {visible.map((p, i) => (
        <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.3, position: 'relative', zIndex: visible.length - i }}>
          <div style={{ boxShadow: '0 0 0 2px var(--sg-white)', borderRadius: 999 }}>
            <Avatar parent={p} size={size}/>
          </div>
        </div>
      ))}
      {parents.length > max && (
        <div style={{
          marginLeft: -size * 0.3, width: size, height: size, borderRadius: 999,
          background: 'var(--sg-paper-2)', color: 'var(--sg-ink-60)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.36, fontWeight: 600, boxShadow: '0 0 0 2px var(--sg-white)',
        }}>+{parents.length - max}</div>
      )}
    </div>
  );
};

/* ============ EYEBROW ============ */
const Eyebrow = ({ children, onDark, accent, style }) => (
  <div className={"sg-eyebrow" + (onDark ? ' on-dark' : '')} style={{ color: accent ? 'var(--sg-accent)' : undefined, ...style }}>
    {children}
  </div>
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
        position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.45)',
        animation: 'sg-fade-in 200ms var(--sg-ease) both',
      }}/>
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width, maxWidth: '100vw',
        background: 'var(--sg-white)',
        animation: 'sg-slide-right 280ms var(--sg-ease) both',
        boxShadow: '-12px 0 32px rgba(0,0,0,0.10)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {children}
      </div>
    </div>
  );
};

/* ============ MODAL ============ */
const Modal = ({ open, onClose, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.45)', animation: 'sg-fade-in 200ms var(--sg-ease) both' }}/>
      <div style={{
        position: 'relative', background: 'var(--sg-white)', width, maxWidth: '100%',
        animation: 'sg-fade-up 320ms var(--sg-ease) both',
      }}>{children}</div>
    </div>
  );
};

/* ============ WORDMARK ============ */
const Wordmark = ({ size = 22, color, accent }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'baseline',
    fontFamily: 'var(--sg-font-display)', fontWeight: 900,
    fontSize: size, lineHeight: 1, letterSpacing: '-0.04em',
    textTransform: 'uppercase', color: color || 'var(--sg-black)',
  }}>
    Summer<span style={{ color: accent || 'var(--sg-accent)' }}>Grid</span>
  </span>
);

/* ============ FIELD ============ */
const Field = ({ label, children }) => (
  <label style={{ display: 'grid', gap: 6 }}>
    {label && <Eyebrow>{label}</Eyebrow>}
    {children}
  </label>
);
const InputBox = (props) => (
  <input {...props} style={{
    padding: '12px 14px', borderRadius: 4, border: '1px solid var(--sg-ink-20)',
    background: 'var(--sg-white)', fontSize: 15, fontFamily: 'inherit', outline: 'none',
    transition: 'border-color var(--sg-dur-fast)',
    ...props.style,
  }}
  onFocus={e => e.currentTarget.style.borderColor = 'var(--sg-black)'}
  onBlur={e => e.currentTarget.style.borderColor = 'var(--sg-ink-20)'}/>
);

Object.assign(window, {
  Icon, Button, Avatar, AvatarCluster, Eyebrow, Drawer, Modal, Wordmark, Field, InputBox,
});
