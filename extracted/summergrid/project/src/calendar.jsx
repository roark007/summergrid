// SummerGrid v2 — The Calendar (the product)

/* ============ Helpers ============ */
const fmtHM = (h) => {
  if (!h) return '';
  const [hh, mm] = h.split(':');
  const n = parseInt(hh, 10);
  const ampm = n >= 12 ? 'p' : 'a';
  const display = n > 12 ? n - 12 : (n === 0 ? 12 : n);
  return `${display}${mm !== '00' ? ':' + mm : ''}${ampm}`;
};
const fmtTimeRange = (s, e) => `${fmtHM(s)}–${fmtHM(e)}`;

// Responsive viewport — busy parents on phones
const useIsMobile = (bp = 760) => {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp);
  useEffect(() => {
    const onResize = () => setM(window.innerWidth < bp);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [bp]);
  return m;
};

// Group blocks by [campName, weekIdx] to detect shared (carpool) groups
const buildCarpoolIndex = (blocks) => {
  const idx = {};
  blocks.forEach(b => {
    const key = `${b.weekIdx}__${b.campName.toLowerCase()}`;
    if (!idx[key]) idx[key] = [];
    idx[key].push(b);
  });
  return idx;
};

/* ============ Top-level Calendar ============ */
const Calendar = ({ blocks, setBlocks, goLanding }) => {
  const [drawer, setDrawer] = useState(null);  // { kind: 'add' | 'edit', ... }
  const [invite, setInvite] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [view, setView] = useState('overview');           // 'overview' | 'weekly'
  const [weeklyIdx, setWeeklyIdx] = useState(null);       // selected week in WEEKLY tab
  const isMobile = useIsMobile();

  // Switch to WEEKLY tab on a given week
  const openWeekly = (idx) => {
    setWeeklyIdx(idx);
    setView('weekly');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const carpoolIndex = useMemo(() => buildCarpoolIndex(blocks), [blocks]);

  // Coverage gaps — weeks where NO child has any camp
  const coverageGaps = useMemo(() => {
    return WEEKS.filter(w => !blocks.some(b => b.weekIdx === w.idx));
  }, [blocks]);

  // Camps with registration deadlines that aren't already registered
  const dueDeadlines = useMemo(() => {
    // De-dup by [campName] — same camp doesn't need to repeat per kid
    const seen = new Set();
    return blocks
      .filter(b => b.regDeadline && b.regStatus !== 'registered')
      .filter(b => { const k = b.campName; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => (a.regDeadline || '').localeCompare(b.regDeadline || ''));
  }, [blocks]);

  const stats = useMemo(() => {
    const covered = WEEKS.length - coverageGaps.length;
    const shared = Object.values(carpoolIndex).filter(arr => arr.length > 1).length;
    return { covered, total: WEEKS.length, shared, blockCount: blocks.length };
  }, [blocks, carpoolIndex, coverageGaps]);

  const addBlock = (data) => {
    const id = 'b' + Date.now();
    setBlocks(prev => [...prev, { id, ...data }]);
  };
  const updateBlock = (id, patch) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  };
  const removeBlock = (id) => setBlocks(prev => prev.filter(b => b.id !== id));

  // Default the weekly index to first covered week, falling back to week 1
  const defaultWeeklyIdx = useMemo(() => {
    const firstCovered = WEEKS.find(w => blocks.some(b => b.weekIdx === w.idx));
    return (firstCovered || WEEKS[0]).idx;
  }, [blocks]);
  const activeWeeklyIdx = weeklyIdx ?? defaultWeeklyIdx;

  return (
    <div style={{ background: 'var(--sg-white)', minHeight: '100vh' }}>
      <CalendarChrome goLanding={goLanding} onInvite={() => setInvite(true)} onExport={() => setExportOpen(true)} stats={stats} coverageGaps={coverageGaps} dueDeadlines={dueDeadlines} isMobile={isMobile}/>

      <ViewTabs view={view} setView={setView} isMobile={isMobile}/>

      {view === 'overview' ? (
        <CalendarGrid
          blocks={blocks}
          carpoolIndex={carpoolIndex}
          isMobile={isMobile}
          onAddCell={(childId, weekIdx) => setDrawer({ kind: 'add', childId, weekIdx })}
          onEditBlock={(blockId) => setDrawer({ kind: 'edit', blockId })}
          onOpenWeek={(weekIdx) => openWeekly(weekIdx)}
        />
      ) : (
        <WeeklyView
          weekIdx={activeWeeklyIdx}
          setWeekIdx={setWeeklyIdx}
          blocks={blocks}
          updateBlock={(id, patch) => updateBlock(id, patch)}
          onEditBlock={(id) => setDrawer({ kind: 'edit', blockId: id })}
          onAddCell={(childId, wi) => setDrawer({ kind: 'add', childId, weekIdx: wi })}
          onGoOverview={() => setView('overview')}
          isMobile={isMobile}
        />
      )}

      <Drawer open={drawer?.kind === 'add' || drawer?.kind === 'edit'} onClose={() => setDrawer(null)} width={560}>
        {drawer?.kind === 'add' && (
          <BlockEditor
            mode="add"
            initial={{ childId: drawer.childId, weekIdx: drawer.weekIdx }}
            carpoolIndex={carpoolIndex}
            blocks={blocks}
            onSave={(data) => { addBlock(data); setDrawer(null); }}
            onClose={() => setDrawer(null)}
          />
        )}
        {drawer?.kind === 'edit' && (() => {
          const b = blocks.find(x => x.id === drawer.blockId);
          if (!b) return null;
          return (
            <BlockEditor
              mode="edit"
              initial={b}
              carpoolIndex={carpoolIndex}
              blocks={blocks}
              onSave={(data) => { updateBlock(drawer.blockId, data); setDrawer(null); }}
              onDelete={() => { removeBlock(drawer.blockId); setDrawer(null); }}
              onClose={() => setDrawer(null)}
              onOpenWeek={() => { openWeekly(b.weekIdx); setDrawer(null); }}
            />
          );
        })()}
      </Drawer>

      <InviteModal open={invite} onClose={() => setInvite(false)}/>
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)}/>
    </div>
  );
};

/* ============ Chrome (header + status) ============ */
const CalendarChrome = ({ goLanding, onInvite, onExport, stats, coverageGaps, dueDeadlines, isMobile }) => (
  <>
    {/* App nav */}
    <header style={{
      borderBottom: '1px solid var(--sg-ink-10)',
      padding: isMobile ? '0 16px' : '0 32px', height: 56, display: 'flex', alignItems: 'center', background: 'var(--sg-white)',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div onClick={goLanding} style={{ cursor: 'pointer' }}>
        <Wordmark size={isMobile ? 16 : 18}/>
      </div>
      <div style={{ flex: 1 }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12 }}>
        {!isMobile && <AvatarCluster parents={GROUP.parents} size={26}/>}
        <Button variant="ghost" size="sm" icon="share" onClick={onInvite}>{isMobile ? '' : 'INVITE'}</Button>
        <Button variant="ghost" size="sm" icon="download" onClick={onExport}>{isMobile ? '' : 'EXPORT'}</Button>
      </div>
    </header>

    {/* Group identity */}
    <div style={{ padding: isMobile ? '32px 16px 24px' : '64px 32px 32px', maxWidth: 1600, margin: '0 auto' }}>
      <Eyebrow>SUMMER 2026 · {GROUP.parents.length} FAMILIES · {CHILDREN.length} KIDS</Eyebrow>
      <h1 className="sg-display" style={{ fontSize: isMobile ? 'clamp(40px, 13vw, 64px)' : 'clamp(56px, 8vw, 112px)', margin: isMobile ? '12px 0 18px' : '16px 0 24px', maxWidth: '14ch' }}>
        {GROUP.name.split(' ').slice(0, 2).join(' ')} <span style={{ color: 'var(--sg-accent)' }}>summer{isMobile ? ' ' : <br/>}crew</span>.
      </h1>

      {/* coverage strip */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? 24 : 48, marginTop: isMobile ? 20 : 32, flexWrap: 'wrap' }}>
        <Metric label="WEEKS COVERED" value={`${stats.covered}/${stats.total}`} isMobile={isMobile}/>
        <Metric label="CAMPS LOGGED" value={stats.blockCount} isMobile={isMobile}/>
        <Metric label="SHARED PICKUPS" value={stats.shared} accent isMobile={isMobile}/>
        {coverageGaps.length > 0 && !isMobile && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--sg-paper)', border: '1px dashed var(--sg-ink-20)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--sg-accent)' }}/>
            <span className="sg-mono" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
              GAP · {coverageGaps.map(g => g.label).join(' · ')}
            </span>
          </div>
        )}
      </div>

      {coverageGaps.length > 0 && isMobile && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--sg-paper)', border: '1px dashed var(--sg-ink-20)' }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--sg-accent)', flexShrink: 0 }}/>
          <span className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.06em' }}>
            GAP · {coverageGaps.map(g => g.label).join(' · ')}
          </span>
        </div>
      )}

      {/* Registration deadlines strip */}
      {dueDeadlines.length > 0 && (
        <div style={{ marginTop: isMobile ? 16 : 24, padding: isMobile ? '12px 14px' : '14px 18px', background: 'var(--sg-black)', color: 'var(--sg-white)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 18, flexWrap: 'wrap' }}>
          <div className="sg-mono" style={{ fontSize: isMobile ? 10 : 11, letterSpacing: '0.1em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="calendar" size={13} stroke={2.5} style={{ color: 'var(--sg-accent)' }}/>
            REGISTER BY
          </div>
          <div style={{ display: 'flex', gap: isMobile ? 10 : 18, flexWrap: 'wrap', alignItems: 'center' }}>
            {dueDeadlines.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="sg-mono" style={{ fontSize: 12, fontWeight: 700, color: b.regStatus === 'closing-soon' ? 'var(--sg-accent)' : 'var(--sg-white)', letterSpacing: '0.04em' }}>
                  {b.regDeadline}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{b.campName}</span>
                {b.regStatus === 'closing-soon' && (
                  <span className="sg-mono" style={{ fontSize: 9.5, padding: '2px 6px', background: 'var(--sg-accent)', color: 'var(--sg-white)', letterSpacing: '0.06em', fontWeight: 700 }}>
                    CLOSING SOON
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </>
);

const Metric = ({ label, value, accent, isMobile }) => (
  <div>
    <Eyebrow>{label}</Eyebrow>
    <div className="sg-mono" style={{ fontSize: isMobile ? 24 : 32, fontWeight: 600, color: accent ? 'var(--sg-accent)' : 'var(--sg-black)', marginTop: 4 }}>{value}</div>
  </div>
);

/* ============ Big OVERVIEW / WEEKLY tabs ============ */
const ViewTabs = ({ view, setView, isMobile }) => {
  const [hoverId, setHoverId] = useState(null);
  const tabs = [
    { id: 'overview', label: 'OVERVIEW', hint: 'The summer at a glance' },
    { id: 'weekly',   label: 'WEEKLY',   hint: 'Day-by-day pickups & reminders' },
  ];
  return (
    <div style={{
      padding: isMobile ? '0 16px' : '0 32px',
      maxWidth: 1600, margin: '0 auto',
      position: 'sticky', top: 56, zIndex: 15,
      background: 'var(--sg-white)',
      borderBottom: '1px solid var(--sg-ink-10)',
    }}>
      <div style={{
        display: 'flex', gap: 0, alignItems: 'stretch',
        paddingTop: isMobile ? 8 : 16,
      }}>
        {tabs.map(tab => {
          const active = view === tab.id;
          const hovered = hoverId === tab.id;
          return (
            <button key={tab.id}
              onClick={() => setView(tab.id)}
              onMouseEnter={() => setHoverId(tab.id)}
              onMouseLeave={() => setHoverId(null)}
              style={{
                flex: isMobile ? 1 : '0 0 auto',
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: isMobile ? '14px 12px 14px' : '20px 32px 20px 0',
                marginRight: isMobile ? 0 : 8,
                textAlign: 'left',
                position: 'relative',
                fontFamily: 'inherit',
                opacity: active ? 1 : (hovered ? 0.85 : 0.5),
                transition: 'opacity var(--sg-dur-fast) var(--sg-ease)',
              }}
            >
              <div className="sg-display" style={{
                fontSize: isMobile ? 'clamp(28px, 8vw, 38px)' : 'clamp(40px, 5vw, 64px)',
                lineHeight: 0.92, letterSpacing: '-0.03em',
                color: active ? 'var(--sg-black)' : 'var(--sg-ink-60)',
                transition: 'color var(--sg-dur-fast) var(--sg-ease)',
              }}>
                {tab.label}
              </div>
              {!isMobile && (
                <div className="sg-mono" style={{
                  fontSize: 10.5, letterSpacing: '0.1em', fontWeight: 500,
                  color: active ? 'var(--sg-accent)' : 'var(--sg-ink-60)',
                  marginTop: 8,
                }}>
                  {tab.hint}
                </div>
              )}
              {/* Active underline */}
              <div style={{
                position: 'absolute', left: 0, right: isMobile ? 0 : 8, bottom: -1,
                height: 3, background: active ? 'var(--sg-accent)' : 'transparent',
                transition: 'background var(--sg-dur-fast) var(--sg-ease)',
              }}/>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ============ The grid itself ============ */
const CalendarGrid = ({ blocks, carpoolIndex, isMobile, onAddCell, onEditBlock, onOpenWeek }) => {
  // Group children by parent for visual clustering
  const grouped = GROUP.parents.map(p => ({
    parent: p,
    kids: CHILDREN.filter(c => c.parentId === p.id),
  })).filter(g => g.kids.length > 0);

  if (isMobile) {
    return <MobileGrid grouped={grouped} blocks={blocks} carpoolIndex={carpoolIndex} onAddCell={onAddCell} onEditBlock={onEditBlock} onOpenWeek={onOpenWeek}/>;
  }

  return (
    <div style={{ padding: '24px 32px 80px', overflowX: 'auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `220px repeat(${WEEKS.length}, minmax(150px, 1fr))`,
        gap: 6, minWidth: 1400,
      }}>
        {/* Header row */}
        <div style={{ position: 'sticky', left: 0, background: 'var(--sg-white)', zIndex: 2 }}/>
        {WEEKS.map(w => {
          const weekHas = blocks.some(b => b.weekIdx === w.idx);
          return (
            <WeekHeader key={w.idx} week={w} clickable={weekHas} onClick={() => weekHas && onOpenWeek(w.idx)}/>
          );
        })}

        {/* Family groups */}
        {grouped.map((g, gi) => (
          <React.Fragment key={g.parent.id}>
            {/* Family header */}
            <div style={{
              gridColumn: `1 / span ${WEEKS.length + 1}`,
              padding: '24px 0 8px', borderBottom: '1px solid var(--sg-ink-10)', display: 'flex', alignItems: 'center', gap: 12,
              marginTop: gi === 0 ? 0 : 16,
            }}>
              <Avatar parent={g.parent} size={24}/>
              <div className="sg-mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em' }}>
                {g.parent.short.toUpperCase()}{g.parent.isMe ? ' · YOU' : ''}{g.parent.isPartner ? ' · PARTNER' : ''}
              </div>
              <div style={{ flex: 1 }}/>
              <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>
                {g.kids.length} KID{g.kids.length > 1 ? 'S' : ''}
              </div>
            </div>

            {g.kids.map(child => (
              <React.Fragment key={child.id}>
                {/* Child name (sticky left) */}
                <div style={{
                  padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14,
                  position: 'sticky', left: 0, background: 'var(--sg-white)', zIndex: 1,
                  borderRight: '1px solid var(--sg-ink-10)',
                }}>
                  <div style={{ width: 4, height: 32, background: g.parent.color, borderRadius: 4 }}/>
                  <div>
                    <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{child.name}</div>
                    <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', marginTop: 4, letterSpacing: '0.06em' }}>AGE {child.age}</div>
                  </div>
                </div>
                {/* Cells */}
                {WEEKS.map(w => {
                  const b = blocks.find(x => x.childId === child.id && x.weekIdx === w.idx);
                  if (b) {
                    const carpoolKey = `${w.idx}__${b.campName.toLowerCase()}`;
                    const carpool = carpoolIndex[carpoolKey] || [];
                    return (
                      <CampBlock key={w.idx} block={b} parent={g.parent} carpool={carpool} onClick={() => onEditBlock(b.id)}/>
                    );
                  }
                  return (
                    <EmptyCell key={w.idx} parentColor={g.parent.color} onClick={() => onAddCell(child.id, w.idx)}/>
                  );
                })}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ============ Mobile grid: stacked per kid, per kid horiz scroll ============ */
const MobileGrid = ({ grouped, blocks, carpoolIndex, onAddCell, onEditBlock, onOpenWeek }) => {
  return (
    <div style={{ padding: '20px 0 80px' }}>
      {grouped.map((g, gi) => (
        <div key={g.parent.id} style={{ marginBottom: gi === grouped.length - 1 ? 0 : 28 }}>
          {/* Family banner */}
          <div style={{
            padding: '12px 16px 10px',
            borderBottom: '1px solid var(--sg-ink-10)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Avatar parent={g.parent} size={22}/>
            <div className="sg-mono" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em' }}>
              {g.parent.short.toUpperCase()}{g.parent.isMe ? ' · YOU' : ''}{g.parent.isPartner ? ' · PARTNER' : ''}
            </div>
            <div style={{ flex: 1 }}/>
            <div className="sg-mono" style={{ fontSize: 9.5, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>
              {g.kids.length} KID{g.kids.length > 1 ? 'S' : ''}
            </div>
          </div>

          {g.kids.map(child => (
            <div key={child.id} style={{ marginTop: 16 }}>
              {/* Kid name row */}
              <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, height: 28, background: g.parent.color, borderRadius: 4 }}/>
                <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{child.name}</div>
                <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>AGE {child.age}</div>
              </div>
              {/* Horizontal scroll strip of week cells */}
              <div style={{
                overflowX: 'auto', WebkitOverflowScrolling: 'touch',
                padding: '0 16px 4px',
                scrollSnapType: 'x mandatory',
              }}>
                <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '78%', gap: 8 }}>
                  {WEEKS.map(w => {
                    const b = blocks.find(x => x.childId === child.id && x.weekIdx === w.idx);
                    return (
                      <div key={w.idx} style={{ scrollSnapAlign: 'start' }}>
                        <div style={{ marginBottom: 6 }}>
                          <button onClick={() => b && onOpenWeek(w.idx)} disabled={!b}
                            style={{ background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: b ? 'pointer' : 'default', fontFamily: 'inherit', display: 'block', width: '100%' }}>
                            <div className="sg-mono" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em' }}>{w.label}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--sg-ink-60)', marginTop: 2 }}>{w.start}–{w.end}</div>
                          </button>
                        </div>
                        {b ? (
                          <CampBlock block={b} parent={g.parent} carpool={carpoolIndex[`${w.idx}__${b.campName.toLowerCase()}`] || []} onClick={() => onEditBlock(b.id)}/>
                        ) : (
                          <EmptyCell parentColor={g.parent.color} onClick={() => onAddCell(child.id, w.idx)}/>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const WeekHeader = ({ week, clickable, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      disabled={!clickable}
      style={{
        padding: '14px 12px', borderBottom: '1px solid var(--sg-ink-20)', background: clickable && hover ? 'var(--sg-paper)' : 'transparent',
        textAlign: 'left', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--sg-ink-20)',
        cursor: clickable ? 'pointer' : 'default', fontFamily: 'inherit', position: 'relative',
        transition: 'background var(--sg-dur-fast) var(--sg-ease)',
      }}>
      <div className="sg-mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}>{week.label}</div>
      <div style={{ fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 2 }}>{week.start}–{week.end}</div>
      {clickable && (
        <div className="sg-mono" style={{
          marginTop: 8, fontSize: 9, fontWeight: 600, color: hover ? 'var(--sg-accent)' : 'var(--sg-ink-40)',
          letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4,
          transition: 'color var(--sg-dur-fast)',
        }}>
          OPEN WEEKLY <Icon name="arrowR" size={9} stroke={2.5}/>
        </div>
      )}
    </button>
  );
};

/* ============ Camp Block ============ */
const CampBlock = ({ block, parent, carpool, onClick }) => {
  const [hover, setHover] = useState(false);
  const isShared = carpool.length > 1;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? parent.color + '20' : parent.color + '10',
        borderLeft: `3px solid ${parent.color}`,
        border: '1px solid ' + (hover ? parent.color + '60' : 'transparent'),
        borderLeftWidth: 3,
        textAlign: 'left',
        padding: '12px 12px 10px', minHeight: 116, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10,
        transition: 'background var(--sg-dur-fast) var(--sg-ease), border-color var(--sg-dur-fast)',
        fontFamily: 'inherit',
        position: 'relative', width: '100%',
      }}>
      <div>
        <div style={{
          fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 15, lineHeight: 1.15,
          textTransform: 'uppercase', letterSpacing: '-0.01em',
        }}>
          {block.campName}
        </div>
        {(block.start || block.end) && (
          <div className="sg-mono" style={{ fontSize: 10.5, color: 'var(--sg-ink-60)', marginTop: 5, letterSpacing: '0.02em' }}>
            {fmtTimeRange(block.start, block.end)}
          </div>
        )}

        {/* Deadline pill */}
        {block.regDeadline && block.regStatus !== 'registered' && (
          <div className="sg-mono" style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
            padding: '2px 7px',
            background: block.regStatus === 'closing-soon' ? 'var(--sg-accent)' : 'var(--sg-black)',
            color: 'var(--sg-white)',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
          }}>
            <Icon name="calendar" size={9} stroke={2.5}/>
            REG · {block.regDeadline.toUpperCase()}
          </div>
        )}
        {block.regStatus === 'registered' && (
          <div className="sg-mono" style={{
            display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 8,
            padding: '2px 7px', background: 'rgba(31,138,91,0.12)', color: '#1F7A3A',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
          }}>
            <Icon name="check" size={9} stroke={2.5}/> REGISTERED
          </div>
        )}
      </div>

      {/* Footer row: shared-carpool badge only — pickup details live in WEEKLY tab */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 18 }}>
        {isShared && (
          <div title={`Shared with ${carpool.length - 1} other`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', background: 'var(--sg-accent)', color: '#fff',
            fontFamily: 'var(--sg-font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
            borderRadius: 999,
          }}>
            <Icon name="link" size={9} stroke={2.5}/> SHARED · {carpool.length}
          </div>
        )}
        <div style={{ flex: 1 }}/>
        <div className="sg-mono" style={{ fontSize: 9, color: hover ? 'var(--sg-accent)' : 'var(--sg-ink-40)', letterSpacing: '0.06em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, transition: 'color var(--sg-dur-fast)' }}>
          EDIT <Icon name="arrowR" size={9} stroke={2.5}/>
        </div>
      </div>
    </button>
  );
};

// (ParentStack removed — pickup details now live in WEEKLY tab only)

/* ============ Empty Cell ============ */
const EmptyCell = ({ parentColor, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? parentColor + '08' : 'transparent',
        border: '1px dashed ' + (hover ? parentColor : 'var(--sg-ink-20)'),
        minHeight: 116, cursor: 'pointer', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all var(--sg-dur-fast) var(--sg-ease)',
        fontFamily: 'inherit',
      }}>
      <Icon name="plus" size={16} stroke={1.5} style={{ color: hover ? parentColor : 'var(--sg-ink-40)' }}/>
    </button>
  );
};

/* ============ Weekly View (top-level tab) ============ */
const WeeklyView = ({ weekIdx, setWeekIdx, blocks, updateBlock, onEditBlock, onAddCell, onGoOverview, isMobile }) => {
  return (
    <div style={{ padding: isMobile ? '0 0 80px' : '0 0 80px', maxWidth: 1600, margin: '0 auto' }}>
      <WeekPicker weekIdx={weekIdx} setWeekIdx={setWeekIdx} blocks={blocks} isMobile={isMobile}/>
      <WeekDetail
        weekIdx={weekIdx}
        blocks={blocks}
        updateBlock={updateBlock}
        onEditBlock={onEditBlock}
        onAddCell={onAddCell}
        onGoOverview={onGoOverview}
        isMobile={isMobile}
        inline
      />
    </div>
  );
};

/* Horizontal week selector pills */
const WeekPicker = ({ weekIdx, setWeekIdx, blocks, isMobile }) => {
  const scrollerRef = useRef(null);
  // Scroll active pill into view when it changes
  useEffect(() => {
    const el = scrollerRef.current?.querySelector(`[data-wk="${weekIdx}"]`);
    if (el && el.scrollIntoView) {
      const parent = scrollerRef.current;
      const eLeft = el.offsetLeft;
      const eRight = eLeft + el.offsetWidth;
      if (eLeft < parent.scrollLeft || eRight > parent.scrollLeft + parent.clientWidth) {
        parent.scrollTo({ left: eLeft - 16, behavior: 'smooth' });
      }
    }
  }, [weekIdx]);

  return (
    <div style={{ padding: isMobile ? '12px 0 16px' : '20px 0 24px', borderBottom: '1px solid var(--sg-ink-10)' }}>
      <div style={{ padding: isMobile ? '0 16px' : '0 32px' }}>
        <Eyebrow>SELECT A WEEK</Eyebrow>
      </div>
      <div ref={scrollerRef} style={{
        marginTop: 12, padding: isMobile ? '0 16px 4px' : '0 32px 4px',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap',
      }}>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          {WEEKS.map(w => {
            const active = w.idx === weekIdx;
            const has = blocks.some(b => b.weekIdx === w.idx);
            return (
              <button key={w.idx} data-wk={w.idx} onClick={() => setWeekIdx(w.idx)} style={{
                padding: '10px 16px 8px',
                background: active ? 'var(--sg-black)' : 'transparent',
                color: active ? 'var(--sg-white)' : 'var(--sg-black)',
                border: '1px solid ' + (active ? 'var(--sg-black)' : 'var(--sg-ink-20)'),
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 2, borderRadius: 4,
                transition: 'all var(--sg-dur-fast) var(--sg-ease)',
                opacity: has || active ? 1 : 0.55,
              }}>
                <span className="sg-mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}>{w.label}</span>
                <span style={{ fontSize: 10.5, color: active ? 'rgba(250,250,247,0.7)' : 'var(--sg-ink-60)' }}>{w.start}–{w.end}</span>
                {has && !active && (
                  <span style={{ position: 'absolute', width: 4, height: 4, borderRadius: 999, background: 'var(--sg-accent)', marginTop: 4, transform: 'translate(58px, -2px)' }}/>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============ Week Detail (granular day-by-day editor) ============ */
const WeekDetail = ({ weekIdx, blocks, updateBlock, onClose, onEditBlock, onAddCell, onGoOverview, isMobile, inline }) => {
  const week = WEEKS.find(w => w.idx === weekIdx);
  const weekBlocks = blocks.filter(b => b.weekIdx === weekIdx);

  // local toggle: which parents want reminder emails this week
  const [reminders, setReminders] = useState(
    Object.fromEntries(GROUP.parents.map(p => [p.id, p.isMe || false]))
  );

  // count my (Jordan's) assigned days
  const me = GROUP.parents.find(p => p.isMe);
  const myDays = useMemo(() => {
    let drop = 0, pick = 0;
    weekBlocks.forEach(b => {
      const dm = blockDropoffByDay(b);
      const pm = blockPickupByDay(b);
      DAYS.forEach(d => {
        if (dm[d.key] === me.id) drop++;
        if (pm[d.key] === me.id) pick++;
      });
    });
    return { drop, pick };
  }, [weekBlocks, me.id]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: inline ? 'auto' : '100%' }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '20px 16px' : '24px 28px',
        borderBottom: '1px solid var(--sg-ink-10)',
        ...(inline ? {} : { position: 'sticky', top: 0, background: 'var(--sg-white)', zIndex: 5 }),
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Eyebrow>WEEK DETAIL · GRANULAR PICKUP</Eyebrow>
            <h2 className="sg-display" style={{ fontSize: isMobile ? 28 : 40, margin: '12px 0 0', letterSpacing: '-0.02em', paddingBottom: 12, lineHeight: 1 }}>
              {week.label} <span style={{ color: 'var(--sg-ink-40)' }}>· {week.start}–{week.end}</span>
            </h2>
            <div style={{ fontSize: isMobile ? 12.5 : 13, color: 'var(--sg-ink-60)', marginTop: 10, maxWidth: 560 }}>
              Assign drop-off and pick-up day by day. Changes show up on the overview as soon as you save.
            </div>
          </div>
          {!inline && (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Icon name="close" size={20}/>
            </button>
          )}
        </div>

        {/* My week summary */}
        <div style={{ marginTop: 20, display: 'flex', gap: isMobile ? 12 : 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar parent={me} size={28}/>
            <div>
              <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--sg-ink-60)' }}>YOUR WEEK</div>
              <div className="sg-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                {myDays.drop} DROP-OFF{myDays.drop === 1 ? '' : 'S'} · {myDays.pick} PICK-UP{myDays.pick === 1 ? '' : 'S'}
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}/>
          <ReminderToggle
            on={reminders[me.id]}
            onToggle={() => setReminders(r => ({ ...r, [me.id]: !r[me.id] }))}
          />
        </div>
      </div>

      {/* Empty state */}
      {weekBlocks.length === 0 && (
        <div style={{ padding: isMobile ? '40px 16px' : 60, textAlign: 'center', color: 'var(--sg-ink-60)' }}>
          <div className="sg-display" style={{ fontSize: isMobile ? 24 : 28, color: 'var(--sg-ink-40)', marginBottom: 8 }}>NOTHING HERE</div>
          <div style={{ fontSize: 14, marginBottom: 20 }}>No camps scheduled for {week.label}.</div>
          {inline && onGoOverview && (
            <Button variant="secondary" icon="arrowL" onClick={onGoOverview}>BACK TO OVERVIEW</Button>
          )}
        </div>
      )}

      {/* Per-camp tables */}
      <div style={{ flex: inline ? 'none' : 1, overflowY: inline ? 'visible' : 'auto', padding: isMobile ? '20px 16px' : '24px 28px' }}>
        {weekBlocks.length > 0 && (
          <div style={{ display: 'grid', gap: isMobile ? 20 : 28 }}>
            {weekBlocks.map(b => (
              <WeekCampRow key={b.id} block={b} updateBlock={updateBlock} onOpenBlock={() => onEditBlock(b.id)} isMobile={isMobile}/>
            ))}
          </div>
        )}

        {/* Reminders summary */}
        {weekBlocks.length > 0 && (
          <div style={{ marginTop: 40, padding: isMobile ? 16 : 20, background: 'var(--sg-paper)' }}>
            <Eyebrow>EMAIL REMINDERS · NIGHT BEFORE</Eyebrow>
            <div style={{ fontSize: 13, color: 'var(--sg-ink-60)', marginTop: 8, marginBottom: 16, lineHeight: 1.5 }}>
              Each parent gets an email the evening before any day they're assigned drop-off or pick-up. Toggle yours on; others manage their own.
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {GROUP.parents.map(p => {
                const assigned = countDays(weekBlocks, p.id);
                if (assigned.total === 0) return null;
                const isMe = p.isMe;
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
                    padding: isMobile ? '10px 12px' : '12px 14px', background: 'var(--sg-white)', border: '1px solid var(--sg-ink-10)',
                  }}>
                    <Avatar parent={p} size={26}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}{isMe ? ' (you)' : ''}</div>
                      <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.04em', marginTop: 2 }}>
                        {assigned.drop} DROP-OFF · {assigned.pick} PICK-UP
                      </div>
                    </div>
                    {isMe ? (
                      <ReminderToggle
                        on={reminders[p.id]}
                        onToggle={() => setReminders(r => ({ ...r, [p.id]: !r[p.id] }))}
                      />
                    ) : (
                      <span className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em', textAlign: 'right' }}>
                        THEIR<br/>CHOICE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer — drawer mode only */}
      {!inline && (
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--sg-ink-10)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>
            CHANGES SAVE AUTOMATICALLY
          </span>
          <div style={{ flex: 1 }}/>
          <Button variant="primary" iconAfter="check" onClick={onClose}>DONE</Button>
        </div>
      )}

      {inline && weekBlocks.length > 0 && (
        <div style={{ padding: isMobile ? '8px 16px 0' : '8px 28px 0' }}>
          <span className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>
            CHANGES SAVE AUTOMATICALLY · OVERVIEW UPDATES IN SYNC
          </span>
        </div>
      )}
    </div>
  );
};

function countDays(blocks, parentId) {
  let drop = 0, pick = 0;
  blocks.forEach(b => {
    const dm = blockDropoffByDay(b);
    const pm = blockPickupByDay(b);
    DAYS.forEach(d => {
      if (dm[d.key] === parentId) drop++;
      if (pm[d.key] === parentId) pick++;
    });
  });
  return { drop, pick, total: drop + pick };
}

const ReminderToggle = ({ on, onToggle }) => (
  <button onClick={onToggle} style={{
    display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px',
    background: on ? 'var(--sg-black)' : 'transparent',
    color: on ? 'var(--sg-white)' : 'var(--sg-black)',
    border: '1px solid ' + (on ? 'var(--sg-black)' : 'var(--sg-ink-20)'),
    cursor: 'pointer', fontFamily: 'var(--sg-font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em',
    borderRadius: 999,
  }}>
    <span style={{
      width: 8, height: 8, borderRadius: 999,
      background: on ? 'var(--sg-accent)' : 'var(--sg-ink-20)',
    }}/>
    {on ? 'EMAIL ON' : 'EMAIL OFF'}
  </button>
);

/* Per-camp day table */
const WeekCampRow = ({ block, updateBlock, onOpenBlock, isMobile }) => {
  const child = getChild(block.childId);
  const childParent = getParent(child.parentId);
  const pickup = blockPickupByDay(block);
  const dropoff = blockDropoffByDay(block);

  const [picker, setPicker] = useState(null); // { kind: 'p'|'d', day: 'M' }

  const setDay = (kind, day, parentId) => {
    if (kind === 'p') {
      const next = { ...pickup, [day]: parentId };
      updateBlock(block.id, { pickupByDay: next });
    } else {
      const next = { ...dropoff, [day]: parentId };
      updateBlock(block.id, { dropoffByDay: next });
    }
    setPicker(null);
  };

  // bulk fill row to one parent
  const fillAll = (kind, parentId) => {
    const map = { M: parentId, T: parentId, W: parentId, Th: parentId, F: parentId };
    if (kind === 'p') updateBlock(block.id, { pickupByDay: map });
    else updateBlock(block.id, { dropoffByDay: map });
  };

  return (
    <div style={{ border: '1px solid var(--sg-ink-10)' }}>
      <div style={{ padding: isMobile ? '12px 14px' : '14px 16px', background: childParent.color + '10', borderLeft: `3px solid ${childParent.color}`, display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: isMobile ? 18 : 22, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
          {child.name}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.campName}</div>
          <div className="sg-mono" style={{ fontSize: 10.5, color: 'var(--sg-ink-60)', letterSpacing: '0.02em', marginTop: 2 }}>
            {fmtTimeRange(block.start, block.end)}
          </div>
        </div>
        <button onClick={onOpenBlock} style={{
          background: 'transparent', border: '1px solid var(--sg-ink-20)', padding: '6px 10px',
          fontFamily: 'var(--sg-font-mono)', fontSize: 10, letterSpacing: '0.08em', fontWeight: 600,
          cursor: 'pointer', borderRadius: 999,
        }}>EDIT CAMP</button>
      </div>

      <div style={{ padding: isMobile ? 12 : 16 }}>
        {/* Days header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '58px repeat(5, 1fr) 28px' : '90px repeat(5, 1fr) 36px',
          gap: isMobile ? 4 : 8, alignItems: 'center', marginBottom: 6,
        }}>
          <div/>
          {DAYS.map(d => (
            <div key={d.key} className="sg-mono" style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: 'var(--sg-ink-60)', letterSpacing: '0.1em', textAlign: 'center' }}>
              {isMobile ? d.key.toUpperCase() : d.full.toUpperCase()}
            </div>
          ))}
          <div/>
        </div>

        {/* Drop-off row */}
        <DayPickerRow
          label="DROP-OFF"
          dayMap={dropoff}
          onPickDay={(day) => setPicker({ kind: 'd', day })}
          fillTarget={picker?.kind === 'd' ? picker : null}
          activePicker={picker}
          onChoose={(parentId) => setDay(picker.kind, picker.day, parentId)}
          onClosePicker={() => setPicker(null)}
          onFillAll={(parentId) => fillAll('d', parentId)}
          isMobile={isMobile}
        />
        {/* Pick-up row */}
        <DayPickerRow
          label="PICK-UP"
          dayMap={pickup}
          onPickDay={(day) => setPicker({ kind: 'p', day })}
          fillTarget={picker?.kind === 'p' ? picker : null}
          activePicker={picker}
          onChoose={(parentId) => setDay(picker.kind, picker.day, parentId)}
          onClosePicker={() => setPicker(null)}
          onFillAll={(parentId) => fillAll('p', parentId)}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};

const DayPickerRow = ({ label, dayMap, onPickDay, fillTarget, activePicker, onChoose, onClosePicker, onFillAll, isMobile }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '58px repeat(5, 1fr) 28px' : '90px repeat(5, 1fr) 36px',
        gap: isMobile ? 4 : 8, alignItems: 'center', padding: '8px 0',
      }}>
        <div className="sg-mono" style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, letterSpacing: '0.08em' }}>{label}</div>
        {DAYS.map(d => {
          const parentId = dayMap[d.key];
          const p = getParent(parentId);
          const active = fillTarget?.day === d.key;
          return (
            <div key={d.key} style={{ position: 'relative' }}>
              <button
                onClick={() => onPickDay(d.key)}
                style={{
                  width: '100%', padding: isMobile ? '8px 2px' : '8px 6px', cursor: 'pointer',
                  background: active ? (p?.color || 'var(--sg-paper)') + '30' : (p?.color || '#000') + '12',
                  border: '1px solid ' + (active ? (p?.color || 'var(--sg-black)') : 'transparent'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 2 : 6,
                  fontFamily: 'inherit', borderRadius: 4, minHeight: 36,
                  transition: 'all var(--sg-dur-fast) var(--sg-ease)',
                }}>
                {p ? <Avatar parent={p} size={isMobile ? 18 : 20}/> : <Icon name="plus" size={14}/>}
                {!isMobile && <span style={{ fontSize: 11, fontWeight: 600 }}>{p ? p.short : '—'}</span>}
              </button>
              {active && (
                <ParentMenu
                  onChoose={onChoose}
                  onClose={onClosePicker}
                  current={parentId}
                />
              )}
            </div>
          );
        })}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(o => !o)}
            title="Fill the whole row" style={{
            width: isMobile ? 24 : 32, height: isMobile ? 32 : 32, background: 'transparent', border: '1px dashed var(--sg-ink-20)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 4, color: 'var(--sg-ink-60)',
          }}>
            <Icon name="link" size={isMobile ? 11 : 13} stroke={2}/>
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 8 }}>
              <div style={{
                background: 'var(--sg-white)', border: '1px solid var(--sg-ink-20)', padding: 10, minWidth: 180,
                boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
              }}>
                <div className="sg-mono" style={{ fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--sg-ink-60)', marginBottom: 8 }}>FILL WHOLE ROW</div>
                <div style={{ display: 'grid', gap: 4 }}>
                  {GROUP.parents.map(p => (
                    <button key={p.id} onClick={() => { onFillAll(p.id); setMenuOpen(false); }} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                      background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      borderRadius: 4, textAlign: 'left',
                    }}>
                      <Avatar parent={p} size={20}/>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{p.short}{p.isMe ? ' (you)' : ''}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ParentMenu = ({ onChoose, onClose, current }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onClick = (e) => { if (!e.target.closest('[data-parent-menu]')) onClose(); };
    document.addEventListener('keydown', onKey);
    setTimeout(() => document.addEventListener('mousedown', onClick), 0);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [onClose]);
  return (
    <div data-parent-menu style={{
      position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--sg-white)', border: '1px solid var(--sg-ink-20)',
      padding: 8, zIndex: 10, minWidth: 160,
      boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
    }}>
      <div className="sg-mono" style={{ fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--sg-ink-60)', padding: '4px 8px 6px' }}>ASSIGN TO</div>
      <div style={{ display: 'grid', gap: 2 }}>
        {GROUP.parents.map(p => {
          const active = current === p.id;
          return (
            <button key={p.id} onClick={() => onChoose(p.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              background: active ? 'var(--sg-paper)' : 'transparent',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 4, textAlign: 'left',
            }}>
              <Avatar parent={p} size={22}/>
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{p.short}{p.isMe ? ' (you)' : ''}</span>
              {active && <Icon name="check" size={12} stroke={2.5} style={{ marginLeft: 'auto', color: 'var(--sg-accent)' }}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ============ Block Editor (add/edit drawer) ============ */
const BlockEditor = ({ mode, initial, carpoolIndex, blocks, onSave, onDelete, onClose, onOpenWeek }) => {
  const [childId, setChildId] = useState(initial.childId);
  const [weekIdx, setWeekIdx] = useState(initial.weekIdx);
  const [campName, setCampName] = useState(initial.campName || '');
  const [start, setStart] = useState(initial.start || '09:00');
  const [end, setEnd] = useState(initial.end || '16:00');
  const [pickup, setPickup] = useState(initial.pickup || GROUP.parents.find(p => p.isMe).id);
  const [dropoff, setDropoff] = useState(initial.dropoff || GROUP.parents.find(p => p.isMe).id);
  const [notes, setNotes] = useState(initial.notes || '');
  const [regDeadline, setRegDeadline] = useState(initial.regDeadline || '');
  const [regStatus, setRegStatus] = useState(initial.regStatus || (initial.regDeadline ? 'open' : ''));

  const child = getChild(childId);
  const week = WEEKS.find(w => w.idx === weekIdx);
  const parent = getParent(child.parentId);

  // Suggested camps in this week — names already on the board for this week
  const suggestions = useMemo(() => {
    const key = blocks
      .filter(b => b.weekIdx === weekIdx && b.id !== initial.id)
      .map(b => b.campName);
    return [...new Set(key)];
  }, [blocks, weekIdx, initial.id]);

  // Carpool: same camp + same week
  const sharedWith = useMemo(() => {
    if (!campName.trim()) return [];
    const key = `${weekIdx}__${campName.toLowerCase()}`;
    return (carpoolIndex[key] || []).filter(b => b.id !== initial.id);
  }, [campName, weekIdx, carpoolIndex, initial.id]);

  const canSave = campName.trim().length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sg-ink-10)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Eyebrow>{mode === 'add' ? 'ADD A CAMP' : 'EDIT CAMP'}</Eyebrow>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <Icon name="close" size={20}/>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <Avatar parent={parent} size={28}/>
          <div className="sg-display" style={{ fontSize: 28 }}>
            {child.name.toUpperCase()} · {week.label}
          </div>
        </div>
        <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 4, letterSpacing: '0.04em' }}>
          {week.start}–{week.end}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'grid', gap: 24 }}>
        <Field label="CAMP NAME">
          <InputBox value={campName} onChange={e => setCampName(e.target.value)} placeholder="Cascadia Tech Lab" autoFocus/>
          {suggestions.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em', alignSelf: 'center' }}>OR PICK:</span>
              {suggestions.map(s => (
                <button key={s} onClick={() => setCampName(s)} style={{
                  padding: '4px 10px', borderRadius: 999, background: 'var(--sg-paper)', border: '1px solid var(--sg-ink-20)',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
                }}>{s}</button>
              ))}
            </div>
          )}
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="DROP-OFF TIME">
            <InputBox type="time" value={start} onChange={e => setStart(e.target.value)}/>
          </Field>
          <Field label="PICK-UP TIME">
            <InputBox type="time" value={end} onChange={e => setEnd(e.target.value)}/>
          </Field>
        </div>

        {/* Registration deadline — first-class field */}
        <Field label="REGISTRATION DEADLINE">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <button onClick={() => setRegStatus('open')} style={chipStyleBE(regStatus === 'open' || regStatus === 'closing-soon')}>HAS DEADLINE</button>
            <button onClick={() => { setRegStatus('registered'); setRegDeadline(''); }} style={chipStyleBE(regStatus === 'registered')}>ALREADY REGISTERED</button>
            <button onClick={() => { setRegStatus(''); setRegDeadline(''); }} style={chipStyleBE(!regStatus)}>NONE / NOT SURE</button>
          </div>
          {(regStatus === 'open' || regStatus === 'closing-soon') && (
            <>
              <InputBox placeholder="e.g. Jun 1" value={regDeadline} onChange={e => setRegDeadline(e.target.value)}/>
              <label style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <input type="checkbox" checked={regStatus === 'closing-soon'} onChange={e => setRegStatus(e.target.checked ? 'closing-soon' : 'open')}/>
                <span className="sg-mono" style={{ letterSpacing: '0.06em', color: 'var(--sg-ink-60)' }}>FLAG AS "CLOSING SOON" FOR THE GROUP</span>
              </label>
            </>
          )}
        </Field>

        {/* Shared carpool callout */}
        {sharedWith.length > 0 && (
          <div style={{ padding: 16, background: 'var(--sg-accent-soft)', borderLeft: '3px solid var(--sg-accent)' }}>
            <div className="sg-mono" style={{ fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--sg-accent-deep)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Icon name="link" size={12} stroke={2.5}/> SHARED CAMP
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              {sharedWith.length === 1 ? (
                <>{getChild(sharedWith[0].childId).name} ({getParent(getChild(sharedWith[0].childId).parentId).short}'s) is also at this camp this week. Coordinate pickup below or jump to the week view.</>
              ) : (
                <>{sharedWith.length} other kids are at this camp this week. Coordinate pickup below.</>
              )}
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {sharedWith.map(b => {
                const c = getChild(b.childId);
                const p = getParent(c.parentId);
                return (
                  <div key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 4px', background: 'var(--sg-white)', borderRadius: 999 }}>
                    <Avatar parent={p} size={18}/>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Field label="DEFAULT DROP-OFF">
          <ParentChips value={dropoff} onChange={setDropoff}/>
        </Field>
        <Field label="DEFAULT PICK-UP">
          <ParentChips value={pickup} onChange={setPickup}/>
          <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', marginTop: 8, letterSpacing: '0.04em' }}>
            DEFAULTS APPLY TO ALL 5 DAYS. ASSIGN DAY-BY-DAY IN THE {onOpenWeek ? (
              <button onClick={onOpenWeek} style={{ background: 'transparent', border: 'none', textDecoration: 'underline', color: 'var(--sg-accent-deep)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', padding: 0 }}>WEEKLY TAB</button>
            ) : 'WEEKLY TAB'}.
          </div>
        </Field>

        <Field label="NOTES (OPTIONAL)">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Theo brings a snack. Mira has soccer right after."
            style={{
              padding: '12px 14px', borderRadius: 4, border: '1px solid var(--sg-ink-20)',
              background: 'var(--sg-white)', fontSize: 14, fontFamily: 'inherit', outline: 'none', minHeight: 80, resize: 'vertical',
            }}/>
        </Field>
      </div>

      <div style={{ padding: '20px 28px', borderTop: '1px solid var(--sg-ink-10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {mode === 'edit' ? (
          <Button variant="ghost" icon="trash" onClick={onDelete}>REMOVE</Button>
        ) : <div/>}
        <Button variant="primary" iconAfter="check"
          onClick={() => canSave && onSave({
            childId, weekIdx, campName: campName.trim(), start, end, pickup, dropoff,
            notes: notes.trim(),
            ...(regStatus ? { regStatus } : { regStatus: undefined }),
            ...(regDeadline ? { regDeadline } : { regDeadline: undefined }),
          })}
          disabled={!canSave}
          style={{ opacity: canSave ? 1 : 0.5 }}>
          {mode === 'add' ? 'ADD TO GRID' : 'SAVE'}
        </Button>
      </div>
    </div>
  );
};

const chipStyleBE = (active) => ({
  padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--sg-font-mono)',
  background: active ? 'var(--sg-black)' : 'var(--sg-white)',
  color: active ? 'var(--sg-white)' : 'var(--sg-black)',
  border: '1px solid ' + (active ? 'var(--sg-black)' : 'var(--sg-ink-20)'),
  fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em',
});

const ParentChips = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {GROUP.parents.map(p => {
      const active = value === p.id;
      return (
        <button key={p.id} onClick={() => onChange(p.id)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px 6px 6px', borderRadius: 999,
          background: active ? 'var(--sg-black)' : 'transparent',
          color: active ? 'var(--sg-white)' : 'var(--sg-black)',
          border: '1px solid ' + (active ? 'var(--sg-black)' : 'var(--sg-ink-20)'),
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
          transition: 'all var(--sg-dur-fast) var(--sg-ease)',
        }}>
          <Avatar parent={p} size={22}/>
          {p.short}{p.isMe ? ' (you)' : ''}
        </button>
      );
    })}
  </div>
);

/* ============ Invite Modal ============ */
const InviteModal = ({ open, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(GROUP.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sg-ink-10)', display: 'flex', justifyContent: 'space-between' }}>
        <Eyebrow>INVITE PARENTS</Eyebrow>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" size={20}/></button>
      </div>
      <div style={{ padding: 28 }}>
        <h2 className="sg-display" style={{ fontSize: 40, margin: '0 0 12px' }}>
          One link.<br/>That's it.
        </h2>
        <p style={{ color: 'var(--sg-ink-60)', marginBottom: 24, fontSize: 15 }}>
          Send this to any parent. They land in the group and can add their kids' camps right away.
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: 6, background: 'var(--sg-paper)',
          border: '1px solid var(--sg-ink-20)', borderRadius: 4,
        }}>
          <div className="sg-mono" style={{ flex: 1, padding: '8px 10px', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {GROUP.inviteLink}
          </div>
          <Button variant="primary" size="sm" icon={copied ? 'check' : 'copy'} onClick={copy}>
            {copied ? 'COPIED' : 'COPY LINK'}
          </Button>
        </div>
        <div style={{ marginTop: 24 }}>
          <Eyebrow>ALREADY IN THE GROUP</Eyebrow>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {GROUP.parents.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--sg-paper)' }}>
                <Avatar parent={p} size={28}/>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{p.name}{p.isMe ? ' (you)' : ''}{p.isPartner ? ' (partner)' : ''}</div>
                <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--sg-ink-60)' }}>
                  {CHILDREN.filter(c => c.parentId === p.id).map(c => c.name.toUpperCase()).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* ============ Export Modal ============ */
const ExportModal = ({ open, onClose }) => {
  const [perKid, setPerKid] = useState(Object.fromEntries(CHILDREN.map(c => [c.id, c.parentId === 'p1'])));
  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sg-ink-10)', display: 'flex', justifyContent: 'space-between' }}>
        <Eyebrow>EXPORT TO CALENDAR</Eyebrow>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" size={20}/></button>
      </div>
      <div style={{ padding: 28 }}>
        <h2 className="sg-display" style={{ fontSize: 36, margin: '0 0 8px' }}>
          Sync the summer.
        </h2>
        <p style={{ color: 'var(--sg-ink-60)', marginBottom: 24, fontSize: 14 }}>
          Each camp becomes a calendar event with times, location, and pickup info.
        </p>
        <Eyebrow>WHICH KIDS</Eyebrow>
        <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
          {CHILDREN.map(c => {
            const p = getParent(c.parentId);
            return (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--sg-paper)', cursor: 'pointer' }}>
                <input type="checkbox" checked={perKid[c.id]} onChange={e => setPerKid({...perKid, [c.id]: e.target.checked})}
                  style={{ width: 16, height: 16, accentColor: 'var(--sg-accent)' }}/>
                <Avatar parent={p} size={22}/>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{c.name} <span style={{ color: 'var(--sg-ink-60)', fontWeight: 400 }}>· {p.short}</span></div>
              </label>
            );
          })}
        </div>
        <div style={{ marginTop: 24, display: 'grid', gap: 8 }}>
          <button onClick={() => alert('Connect Google — demo')} style={{
            padding: 14, background: 'var(--sg-white)', border: '1px solid var(--sg-ink-20)',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
            fontFamily: 'inherit',
          }}>
            <Icon name="google" size={22} stroke={0}/>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>Google Calendar</div>
            <Icon name="arrowR" size={16}/>
          </button>
          <button onClick={() => alert('Download .ics — demo')} style={{
            padding: 14, background: 'var(--sg-white)', border: '1px solid var(--sg-ink-20)',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left',
            fontFamily: 'inherit',
          }}>
            <Icon name="calendar" size={22}/>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>Apple Calendar / Outlook <span className="sg-mono" style={{ fontWeight: 400, fontSize: 11, color: 'var(--sg-ink-60)', marginLeft: 6 }}>.ICS</span></div>
            <Icon name="arrowR" size={16}/>
          </button>
        </div>
      </div>
    </Modal>
  );
};

Object.assign(window, { Calendar });
