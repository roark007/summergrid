// SummerGrid — Coordinate screen + Calendar sync surface

const CoordinateScreen = ({ children, connections, calendarConnected, setCalendarConnected }) => {
  const [openFamily, setOpenFamily] = useState(null);
  const [invite, setInvite] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  return (
    <div style={{ background: 'var(--sg-white)' }}>
      <div style={{ padding: '40px 32px 24px' }}>
        <Eyebrow>COORDINATE</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, marginBottom: 32 }}>
          <h1 className="sg-display" style={{ fontSize: 'clamp(48px, 6vw, 80px)', margin: 0 }}>
            {connections.length} <span style={{ color: 'var(--sg-accent)' }}>families</span>.
          </h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <SGButton variant="ghost" icon="calendar" onClick={() => setCalOpen(true)}>
              {calendarConnected ? 'MANAGE CALENDAR' : 'SYNC CALENDAR'}
            </SGButton>
            <SGButton variant="dark" icon="plus" onClick={() => setInvite(true)}>INVITE A PARENT</SGButton>
          </div>
        </div>

        {/* Strip: total overlaps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--sg-ink-20)', borderBottom: '1px solid var(--sg-ink-20)', background: 'var(--sg-paper)' }}>
          <StatTile label="CONNECTED" value={connections.length} hint="FAMILIES" />
          <StatTile label="OVERLAPPING WEEKS" value={connections.reduce((s, f) => s + f.overlaps.length, 0)} accent />
          <StatTile label="SHARED CAMPS" value={new Set(connections.flatMap(f => f.overlaps.map(o => o.campId))).size} />
          <StatTile label="CARPOOL OPPORTUNITIES" value="3" hint="MAYBE" />
        </div>
      </div>

      <div style={{ padding: '20px 32px 80px' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          {connections.map(f => (
            <FamilyRow key={f.id} family={f} children={children} onOpen={() => setOpenFamily(f.id)} />
          ))}
        </div>
        <div style={{ marginTop: 48, padding: 32, border: '1px dashed var(--sg-ink-20)', textAlign: 'center' }}>
          <Eyebrow>INVITE</Eyebrow>
          <h3 className="sg-display" style={{ fontSize: 32, margin: '16px 0' }}>
            Plan summer<br/>with people<br/>you trust.
          </h3>
          <p style={{ color: 'var(--sg-ink-60)', maxWidth: 480, margin: '0 auto 24px' }}>
            Invite a co-parent or another family. They see your Grid for shared weeks. You see theirs. Overlaps surface.
          </p>
          <SGButton variant="primary" iconAfter="arrowR" onClick={() => setInvite(true)}>
            SEND AN INVITE
          </SGButton>
        </div>
      </div>

      {/* Overlap drawer */}
      <Drawer open={!!openFamily} onClose={() => setOpenFamily(null)} width={760}>
        {openFamily && (
          <OverlapView
            family={connections.find(f => f.id === openFamily)}
            children={children}
            onClose={() => setOpenFamily(null)}
          />
        )}
      </Drawer>

      {/* Invite modal */}
      {invite && <InviteModal onClose={() => setInvite(false)} />}

      {/* Calendar */}
      <Drawer open={calOpen} onClose={() => setCalOpen(false)} width={560}>
        <CalendarSyncPanel
          children={children}
          calendarConnected={calendarConnected}
          setCalendarConnected={setCalendarConnected}
          onClose={() => setCalOpen(false)}
        />
      </Drawer>
    </div>
  );
};

const FamilyRow = ({ family, children, onOpen }) => {
  const initials = family.parent.split(' ').map(s => s[0]).join('').slice(0, 2);
  const color = ['#D8388E', '#2E8B57', '#6B4ECC', '#2F6BD8'][family.id.charCodeAt(1) % 4];
  return (
    <button onClick={onOpen} style={{
      width: '100%', textAlign: 'left', background: 'var(--sg-white)',
      border: '1px solid var(--sg-ink-10)', padding: '20px 24px',
      display: 'grid', gridTemplateColumns: 'auto 1.2fr 1fr auto', gap: 24, alignItems: 'center',
      cursor: 'pointer', transition: 'all var(--sg-dur-fast) var(--sg-ease)',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--sg-paper)'; e.currentTarget.style.borderColor = 'var(--sg-black)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'var(--sg-white)'; e.currentTarget.style.borderColor = 'var(--sg-ink-10)'; }}>
      <div style={{
        width: 56, height: 56, borderRadius: 999, background: color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 18,
      }}>{initials}</div>
      <div>
        <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
          {family.parent}
        </div>
        <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 4, letterSpacing: '0.06em' }}>
          {family.kids.map(k => `${k.name.toUpperCase()} (${k.age})`).join(' · ')}
        </div>
      </div>
      <div>
        <div className="sg-mono" style={{ fontSize: 32, fontWeight: 600, color: 'var(--sg-accent)' }}>
          {family.overlaps.length}
        </div>
        <div className="sg-eyebrow">OVERLAPPING WEEKS</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--sg-ink-60)' }}>
        <span className="sg-mono" style={{ fontSize: 11, letterSpacing: '0.08em' }}>VIEW</span>
        <SGIcon name="arrowR" size={18}/>
      </div>
    </button>
  );
};

const OverlapView = ({ family, children, onClose }) => {
  // Merged grid: my children + their children, with overlap highlighted
  const merged = useMemo(() => {
    const mine = children.map(c => ({ ...c, mine: true }));
    const theirs = family.kids.map((k, i) => ({
      id: `t-${family.id}-${i}`, name: k.name, age: k.age,
      color: ['#D8388E', '#2E8B57', '#6B4ECC'][i % 3],
      initials: k.name.slice(0, 2).toUpperCase(),
      mine: false,
      plan: Object.fromEntries(SG_WEEKS.map(w => {
        const overlap = family.overlaps.find(o => o.childTheirs === k.name && o.week === w.idx);
        if (overlap) return [w.idx, { campId: overlap.campId, status: 'REGISTERED' }];
        // Sprinkle some plausible plan
        if ((w.idx + i) % 3 === 0) return [w.idx, { campId: SG_CAMPS[(w.idx + i) % SG_CAMPS.length].id, status: 'REGISTERED' }];
        return [w.idx, null];
      })),
    }));
    return [...mine, ...theirs];
  }, [family, children]);

  const overlapKey = (name, weekIdx) => family.overlaps.some(o => o.childMine === name && o.week === weekIdx) ||
    family.overlaps.some(o => o.childTheirs === name && o.week === weekIdx);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sg-ink-10)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Eyebrow>OVERLAP VIEW</Eyebrow>
            <h2 className="sg-display" style={{ fontSize: 32, margin: '8px 0' }}>
              You × {family.parent.split(' ')[0]}
            </h2>
            <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)' }}>
              {family.overlaps.length} OVERLAPPING WEEKS · ORANGE = MATCH
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <SGIcon name="close" size={22}/>
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: `120px repeat(${SG_WEEKS.length}, minmax(56px, 1fr))`, gap: 4,
        }}>
          <div></div>
          {SG_WEEKS.map(w => (
            <div key={w.idx} className="sg-mono" style={{ fontSize: 9, fontWeight: 600, color: 'var(--sg-ink-60)', textAlign: 'center', padding: '4px 0' }}>{w.label}</div>
          ))}
          {merged.map((c, idx) => (
            <React.Fragment key={c.id}>
              {idx === children.length && (
                <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed var(--sg-ink-20)', margin: '12px 0', position: 'relative' }}>
                  <span className="sg-mono" style={{
                    position: 'absolute', top: -8, left: 0, background: 'var(--sg-white)', padding: '0 8px',
                    fontSize: 10, letterSpacing: '0.08em', color: 'var(--sg-ink-60)',
                  }}>{family.parent.toUpperCase()}'S KIDS</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px' }}>
                <ChildAvatar child={c} size={28}/>
                <div>
                  <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>{c.name}</div>
                  <div className="sg-mono" style={{ fontSize: 9, color: 'var(--sg-ink-60)' }}>AGE {c.age}</div>
                </div>
              </div>
              {SG_WEEKS.map(w => {
                const cell = c.plan[w.idx];
                const camp = cell ? sgCampById(cell.campId) : null;
                const overlap = overlapKey(c.name, w.idx);
                return (
                  <div key={w.idx} style={{
                    minHeight: 56,
                    background: overlap ? 'var(--sg-accent)' : (camp ? 'var(--sg-paper)' : 'transparent'),
                    color: overlap ? '#fff' : 'var(--sg-black)',
                    border: camp ? '1px solid var(--sg-ink-10)' : '1px dashed var(--sg-ink-20)',
                    borderLeft: camp ? `3px solid ${overlap ? '#fff' : SG_CAT_COLOR[camp.cat]}` : '1px dashed var(--sg-ink-20)',
                    padding: 5, fontSize: 9, fontWeight: 600, overflow: 'hidden',
                  }}>
                    {camp && (
                      <>
                        <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, lineHeight: 1.1, textTransform: 'uppercase' }}>
                          {camp.name.split(' ').slice(0,2).join(' ')}
                        </div>
                        {overlap && <div className="sg-mono" style={{ fontSize: 8, marginTop: 3, opacity: 0.9 }}>★ BOTH</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Overlap list */}
        <div style={{ marginTop: 32 }}>
          <Eyebrow>SHARED WEEKS</Eyebrow>
          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            {family.overlaps.map((o, i) => {
              const camp = sgCampById(o.campId);
              const w = SG_WEEKS.find(x => x.idx === o.week);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--sg-paper)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: SG_CAT_COLOR[camp.cat] }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase' }}>
                      {camp.name}
                    </div>
                    <div className="sg-mono" style={{ fontSize: 10.5, color: 'var(--sg-ink-60)', marginTop: 2 }}>
                      {w.label} · {w.start}–{w.end} · {o.childMine.toUpperCase()} + {o.childTheirs.toUpperCase()}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 10px', background: 'var(--sg-accent)', color: '#fff',
                    fontFamily: 'var(--sg-font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                    borderRadius: 999,
                  }}>OVERLAP</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ padding: '20px 28px', borderTop: '1px solid var(--sg-ink-10)', display: 'flex', justifyContent: 'space-between' }}>
        <SGButton variant="ghost" icon="users">SUGGEST CARPOOL</SGButton>
        <SGButton variant="dark" icon="calendar">SYNC TO CALENDAR</SGButton>
      </div>
    </div>
  );
};

const InviteModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.5)', animation: 'sg-fade-in 200ms var(--sg-ease) both' }}/>
      <div style={{
        position: 'relative', background: 'var(--sg-white)', width: 500, maxWidth: '100%',
        animation: 'sg-fade-up 320ms var(--sg-ease) both',
      }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sg-ink-10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>INVITE A PARENT</Eyebrow>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><SGIcon name="close" size={22}/></button>
        </div>
        <div style={{ padding: 28 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 999, background: 'var(--sg-success-soft)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sg-success)',
                marginBottom: 20,
              }}>
                <SGIcon name="check" size={28} stroke={2.5}/>
              </div>
              <h3 className="sg-display" style={{ fontSize: 40, margin: 0 }}>Sent<span style={{ color: 'var(--sg-accent)' }}>.</span></h3>
              <p style={{ marginTop: 12, color: 'var(--sg-ink-60)' }}>{email} will receive your invite within a minute.</p>
              <SGButton variant="dark" style={{ marginTop: 24 }} onClick={onClose}>DONE</SGButton>
            </div>
          ) : (
            <>
              <h3 className="sg-display" style={{ fontSize: 36, margin: '0 0 8px' }}>Add a parent.</h3>
              <p style={{ color: 'var(--sg-ink-60)', margin: '0 0 24px' }}>
                They'll see your Grid for shared weeks only. You can revoke access anytime.
              </p>
              <Field label="Email address" placeholder="hannah@home.com" value={email} onChange={e => setEmail(e.target.value)}/>
              <div style={{ marginTop: 14 }}>
                <Field label="Note (optional)" placeholder="Want to coordinate summer?" />
              </div>
              <SGButton variant="primary" style={{ marginTop: 20, width: '100%' }} iconAfter="arrowR"
                onClick={() => { if (email) setSent(true); }}>
                SEND INVITE
              </SGButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============ Calendar Sync Panel ============ */
const CalendarSyncPanel = ({ children, calendarConnected, setCalendarConnected, onClose }) => {
  const [perChild, setPerChild] = useState(Object.fromEntries(children.map(c => [c.id, true])));
  const registeredCount = children.reduce((acc, c) => acc + Object.values(c.plan).filter(p => p && p.status === 'REGISTERED').length, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sg-ink-10)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Eyebrow>CALENDAR SYNC</Eyebrow>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><SGIcon name="close" size={22}/></button>
        </div>
        <h2 className="sg-display" style={{ fontSize: 36, margin: '12px 0 4px' }}>
          {registeredCount} <span style={{ color: 'var(--sg-accent)' }}>events</span>.
        </h2>
        <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)' }}>
          REGISTERED CAMPS · DAILY START/END · 30-MIN REMINDERS
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'grid', gap: 28 }}>
        <div>
          <Eyebrow>SYNC FOR</Eyebrow>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {children.map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--sg-paper)', cursor: 'pointer' }}>
                <ChildAvatar child={c} size={36}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase' }}>{c.name}</div>
                  <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)' }}>
                    {Object.values(c.plan).filter(p => p && p.status === 'REGISTERED').length} REGISTERED EVENTS
                  </div>
                </div>
                <input type="checkbox" checked={perChild[c.id]}
                  onChange={e => setPerChild({ ...perChild, [c.id]: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--sg-accent)' }}/>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Eyebrow>CONNECT</Eyebrow>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            <button onClick={() => setCalendarConnected(true)} style={{
              padding: 16, background: 'var(--sg-white)', border: '1px solid var(--sg-ink-20)',
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left',
            }}>
              <SGIcon name="google" size={26} stroke={0}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Google Calendar</div>
                <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 2 }}>
                  {calendarConnected ? 'CONNECTED · jordan@home.com' : 'ONE-CLICK OAUTH'}
                </div>
              </div>
              <SGIcon name={calendarConnected ? 'check' : 'arrowR'} size={18}/>
            </button>
            <button onClick={() => alert('Downloads .ics — demo')} style={{
              padding: 16, background: 'var(--sg-white)', border: '1px solid var(--sg-ink-20)',
              display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left',
            }}>
              <SGIcon name="calendar" size={22}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Apple Calendar / Outlook</div>
                <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 2 }}>DOWNLOAD .ICS FILE</div>
              </div>
              <SGIcon name="arrowR" size={18}/>
            </button>
          </div>
        </div>

        <div style={{ padding: 16, background: 'var(--sg-paper)', borderLeft: '3px solid var(--sg-accent)' }}>
          <div className="sg-mono" style={{ fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--sg-ink-60)', marginBottom: 6 }}>EXAMPLE EVENT</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Cascadia Tech Lab · Mira</div>
          <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 4 }}>
            MON–FRI · 9:00 AM – 4:00 PM · DOWNTOWN MAKER HUB
          </div>
          <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 2 }}>
            ⏰ 30-MIN REMINDER · PICK-UP 4 PM
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { CoordinateScreen });
