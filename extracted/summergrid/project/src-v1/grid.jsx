// SummerGrid — The Grid (core product surface)

/* ============ Helpers ============ */
const formatMoney = (n) => '$' + n.toLocaleString('en-US');

const computeStats = (children) => {
  let total = 0, covered = 0, gaps = 0, pending = 0, conflicts = 0;
  const totalCells = children.length * SG_WEEKS.length;
  children.forEach(c => {
    SG_WEEKS.forEach(w => {
      const cell = c.plan[w.idx];
      if (cell) {
        const camp = sgCampById(cell.campId);
        if (cell.status === 'REGISTERED' || cell.status === 'WAITLIST') total += camp.price;
        covered += 1;
        if (cell.status === 'WAITLIST' || cell.status === 'INTERESTED') pending += 1;
        if (cell.status === 'CONFLICT') conflicts += 1;
      } else {
        gaps += 1;
      }
    });
  });
  return { total, covered, gaps, pending, conflicts, totalCells };
};

/* ============ THE GRID ============ */
const GridScreen = ({ children, setChildren, openDiscover, calendarConnected, connections }) => {
  const [drawer, setDrawer] = useState(null); // { kind: 'empty'|'detail', childId, weekIdx, campId? }
  const [drag, setDrag] = useState(null); // { fromChildId, weekIdx, campId }
  const stats = useMemo(() => computeStats(children), [children]);
  const recentAdded = useRef(null);

  const updateCell = (childId, weekIdx, value) => {
    setChildren(prev => prev.map(c =>
      c.id === childId ? { ...c, plan: { ...c.plan, [weekIdx]: value } } : c
    ));
  };

  const addCampToCell = (childId, weekIdx, campId, status = 'INTERESTED') => {
    updateCell(childId, weekIdx, { campId, status });
    recentAdded.current = `${childId}-${weekIdx}`;
    setTimeout(() => { recentAdded.current = null; }, 700);
  };

  const onDragStart = (childId, weekIdx, campId) => setDrag({ fromChildId: childId, weekIdx, campId });
  const onDragEnd = () => setDrag(null);
  const onDrop = (toChildId, toWeekIdx) => {
    if (!drag) return;
    const fromCell = children.find(c => c.id === drag.fromChildId)?.plan[drag.weekIdx];
    const toCell = children.find(c => c.id === toChildId)?.plan[toWeekIdx];
    setChildren(prev => prev.map(c => {
      if (c.id === drag.fromChildId && c.id === toChildId) {
        return { ...c, plan: { ...c.plan, [drag.weekIdx]: toCell, [toWeekIdx]: fromCell } };
      }
      if (c.id === drag.fromChildId) {
        return { ...c, plan: { ...c.plan, [drag.weekIdx]: toCell } };
      }
      if (c.id === toChildId) {
        return { ...c, plan: { ...c.plan, [toWeekIdx]: fromCell } };
      }
      return c;
    }));
    setDrag(null);
  };

  return (
    <div style={{ background: 'var(--sg-white)', minHeight: 'calc(100vh - 64px)' }}>
      <GridHeader children={children} stats={stats} onAddChild={() => {}} openDiscover={openDiscover} calendarConnected={calendarConnected} />

      <div style={{ padding: '0 32px 80px' }}>
        <GridBoard
          children={children}
          drag={drag}
          recentAdded={recentAdded}
          connections={connections}
          onCellEmptyClick={(childId, weekIdx) => setDrawer({ kind: 'empty', childId, weekIdx })}
          onCellFilledClick={(childId, weekIdx, campId) => setDrawer({ kind: 'detail', childId, weekIdx, campId })}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
        />
        <GridLegend />
      </div>

      <Drawer open={!!drawer} onClose={() => setDrawer(null)} width={520}>
        {drawer?.kind === 'empty' && (
          <EmptyCellDrawer
            child={children.find(c => c.id === drawer.childId)}
            week={SG_WEEKS.find(w => w.idx === drawer.weekIdx)}
            onAdd={(campId) => { addCampToCell(drawer.childId, drawer.weekIdx, campId); setDrawer(null); }}
            onClose={() => setDrawer(null)}
          />
        )}
        {drawer?.kind === 'detail' && (
          <CellDetailDrawer
            child={children.find(c => c.id === drawer.childId)}
            week={SG_WEEKS.find(w => w.idx === drawer.weekIdx)}
            camp={sgCampById(drawer.campId)}
            cell={children.find(c => c.id === drawer.childId).plan[drawer.weekIdx]}
            children={children}
            connections={connections}
            onStatus={(s) => updateCell(drawer.childId, drawer.weekIdx, { ...children.find(c => c.id === drawer.childId).plan[drawer.weekIdx], status: s })}
            onRemove={() => { updateCell(drawer.childId, drawer.weekIdx, null); setDrawer(null); }}
            onDuplicate={(toChildId) => { addCampToCell(toChildId, drawer.weekIdx, drawer.campId, 'INTERESTED'); setDrawer(null); }}
            onClose={() => setDrawer(null)}
          />
        )}
      </Drawer>
    </div>
  );
};

/* ============ Header ============ */
const GridHeader = ({ children, stats, openDiscover, calendarConnected }) => {
  return (
    <div style={{ padding: '40px 32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <Eyebrow>SUMMER 2026 · 10 WEEKS · {children.length} KIDS</Eyebrow>
          <h1 className="sg-display" style={{ fontSize: 'clamp(48px, 6vw, 80px)', margin: '12px 0 0' }}>
            Your <span style={{ color: 'var(--sg-accent)' }}>grid</span>.
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <SGButton variant="ghost" icon="users">SHARE</SGButton>
          <SGButton variant="dark" icon="plus" onClick={openDiscover}>FIND CAMPS</SGButton>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', background: 'var(--sg-paper)', borderTop: '1px solid var(--sg-ink-20)', borderBottom: '1px solid var(--sg-ink-20)' }}>
        <StatTile label="TOTAL SPEND" value={formatMoney(stats.total)} accent />
        <StatTile label="WEEKS COVERED" value={`${stats.covered}/${stats.totalCells}`} hint={`${stats.gaps} GAPS`} />
        <StatTile label="PENDING" value={stats.pending} hint="WAITLISTS + INTERESTED" />
        <StatTile label="CONFLICTS" value={stats.conflicts} />
        <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, borderLeft: '1px solid var(--sg-ink-10)' }}>
          {calendarConnected ? (
            <>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 999, background: 'var(--sg-success-soft)',
                fontFamily: 'var(--sg-font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em',
                color: '#0D4B22',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--sg-success)' }}/>
                CALENDAR CONNECTED
              </div>
              <a style={{ fontSize: 12, color: 'var(--sg-ink-60)', cursor: 'pointer', borderBottom: '1px solid var(--sg-ink-20)' }}>Manage</a>
            </>
          ) : (
            <button onClick={() => alert('Calendar sync — connect Google or download .ics. (Demo)')} style={{
              padding: '8px 14px', background: 'var(--sg-black)', color: 'var(--sg-white)',
              border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <SGIcon name="calendar" size={14} stroke={2} /> SYNC CALENDAR
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============ Board ============ */
const GridBoard = ({ children, drag, recentAdded, connections, onCellEmptyClick, onCellFilledClick, onDragStart, onDragEnd, onDrop }) => {
  const childCol = '180px';
  return (
    <div style={{
      marginTop: 16, padding: 0, overflowX: 'auto',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${childCol} repeat(${SG_WEEKS.length}, minmax(var(--sg-cell-min, 132px), 1fr))`,
        gap: 6, minWidth: 1100,
      }}>
        {/* Header row */}
        <div></div>
        {SG_WEEKS.map(w => (
          <div key={w.idx} style={{
            padding: '8px 10px 12px', borderBottom: '1px solid var(--sg-ink-20)',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <div className="sg-mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}>{w.label}</div>
            <div style={{ fontSize: 11, color: 'var(--sg-ink-60)' }}>{w.start}–{w.end}</div>
          </div>
        ))}
        {/* Child rows */}
        {children.map((child, ci) => (
          <React.Fragment key={child.id}>
            <div style={{
              padding: 14, display: 'flex', alignItems: 'center', gap: 12,
              borderRight: '1px solid var(--sg-ink-10)',
              position: 'sticky', left: 0, background: 'var(--sg-white)', zIndex: 1,
            }}>
              <ChildAvatar child={child} size={42} />
              <div>
                <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 20, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{child.name}</div>
                <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', marginTop: 4, letterSpacing: '0.06em' }}>
                  AGE {child.age}
                </div>
              </div>
            </div>
            {SG_WEEKS.map(w => {
              const cell = child.plan[w.idx];
              const key = `${child.id}-${w.idx}`;
              const isDragOver = drag && (drag.fromChildId !== child.id || drag.weekIdx !== w.idx);
              const recent = recentAdded?.current === key;
              return cell ? (
                <CampBlock
                  key={key}
                  child={child} week={w} cell={cell}
                  connections={connections}
                  onClick={() => onCellFilledClick(child.id, w.idx, cell.campId)}
                  onDragStart={() => onDragStart(child.id, w.idx, cell.campId)}
                  onDragEnd={onDragEnd}
                  onDrop={() => onDrop(child.id, w.idx)}
                  recent={recent}
                />
              ) : (
                <EmptyCell
                  key={key}
                  onClick={() => onCellEmptyClick(child.id, w.idx)}
                  isDragTarget={isDragOver}
                  onDrop={() => onDrop(child.id, w.idx)}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ============ Camp Block ============ */
const CampBlock = ({ child, week, cell, connections, onClick, onDragStart, onDragEnd, onDrop, recent }) => {
  const camp = sgCampById(cell.campId);
  const [hover, setHover] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Find overlaps (other coordinated parents with same camp same week)
  const overlap = useMemo(() => {
    const out = [];
    connections.forEach(f => f.overlaps.forEach(o => {
      if (o.week === week.idx && o.campId === cell.campId && o.childMine === child.name) {
        out.push({ parent: f.parent, kid: o.childTheirs });
      }
    }));
    return out;
  }, [connections, week.idx, cell.campId, child.name]);

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(); }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: dragOver ? 'var(--sg-accent-soft)' : (hover ? 'var(--sg-paper)' : 'var(--sg-white)'),
        border: '1px solid ' + (cell.status === 'CONFLICT' ? 'var(--sg-danger)' : (hover ? 'var(--sg-black)' : 'var(--sg-ink-10)')),
        borderLeft: `4px solid ${SG_CAT_COLOR[camp.cat]}`,
        padding: '12px 12px 10px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10,
        cursor: 'grab', minHeight: 'var(--sg-cell-height, 132px)',
        transition: 'background var(--sg-dur-fast) var(--sg-ease), border-color var(--sg-dur-fast)',
        animation: recent ? 'sg-settle 280ms var(--sg-ease)' : undefined,
      }}>
      <div>
        <div style={{
          fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 14, lineHeight: 1.1,
          textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 6,
        }}>
          {camp.name}
        </div>
        <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.04em' }}>
          {camp.schedule === 'full-day' ? 'FULL · ' : 'HALF · '}{SG_CAT_LABEL[camp.cat]}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <StatusPill status={cell.status} small />
        <div className="sg-mono" style={{ fontSize: 11, fontWeight: 600 }}>${camp.price}</div>
      </div>
      {/* Overlap avatars */}
      {overlap.length > 0 && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: -4 }}>
          {overlap.slice(0, 2).map((o, i) => (
            <div key={i} title={`${o.parent} (${o.kid})`} style={{
              width: 20, height: 20, borderRadius: 999, border: '2px solid var(--sg-white)',
              background: ['#D8388E', '#2E8B57', '#6B4ECC'][i % 3], color: '#fff',
              fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: i === 0 ? 0 : -6,
            }}>{o.kid[0]}</div>
          ))}
        </div>
      )}
      {/* Drag handle on hover */}
      {hover && (
        <div style={{ position: 'absolute', top: 6, left: 4, color: 'var(--sg-ink-40)', pointerEvents: 'none' }}>
          <SGIcon name="drag" size={12}/>
        </div>
      )}
    </div>
  );
};

/* ============ Empty Cell ============ */
const EmptyCell = ({ onClick, isDragTarget, onDrop }) => {
  const [hover, setHover] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(); }}
      style={{
        background: dragOver ? 'var(--sg-accent-soft)' : (hover ? 'rgba(255,90,31,0.04)' : 'transparent'),
        border: '1px dashed ' + (dragOver ? 'var(--sg-accent)' : (hover ? 'var(--sg-black)' : 'var(--sg-ink-20)')),
        minHeight: 'var(--sg-cell-height, 132px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer', padding: 12,
        transition: 'all var(--sg-dur-fast) var(--sg-ease)',
        fontFamily: 'var(--sg-font-body)',
      }}>
      <SGIcon name="plus" size={20} stroke={1.5} style={{ color: hover ? 'var(--sg-accent)' : 'var(--sg-ink-40)' }}/>
      <div className="sg-mono" style={{
        fontSize: 10, letterSpacing: '0.08em',
        color: hover ? 'var(--sg-accent)' : 'var(--sg-ink-40)',
      }}>OPEN</div>
    </button>
  );
};

/* ============ Legend ============ */
const GridLegend = () => (
  <div style={{ marginTop: 32, padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--sg-ink-10)' }}>
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      <Eyebrow>LEGEND</Eyebrow>
      {Object.entries(SG_CAT_LABEL).map(([k, l]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, height: 4, background: SG_CAT_COLOR[k] }}/>
          <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.06em' }}>{l}</div>
        </div>
      ))}
    </div>
    <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--sg-ink-60)' }}>
      DRAG TO MOVE · CLICK ANY CELL TO EDIT
    </div>
  </div>
);

/* ============ Empty Cell Drawer (Discover-for-week) ============ */
const EmptyCellDrawer = ({ child, week, onAdd, onClose }) => {
  const [filter, setFilter] = useState('all');
  const ageNum = child.age;
  const candidates = useMemo(() => SG_CAMPS.filter(c => {
    if (!c.weeks.includes(week.idx)) return false;
    const [lo, hi] = c.age.split('–').map(n => parseInt(n));
    if (ageNum < lo || ageNum > hi) return false;
    if (filter !== 'all' && c.cat !== filter) return false;
    return true;
  }), [filter, ageNum, week.idx]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sg-ink-10)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Eyebrow>FILL THIS WEEK</Eyebrow>
            <h2 className="sg-display" style={{ fontSize: 36, margin: '8px 0' }}>
              {child.name} · {week.label}
            </h2>
            <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)' }}>
              {week.start}–{week.end} · AGE {child.age} · {candidates.length} MATCHES
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <SGIcon name="close" size={22}/>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>ALL</FilterChip>
          {Object.entries(SG_CAT_LABEL).map(([k, l]) => (
            <FilterChip key={k} active={filter === k} onClick={() => setFilter(k)}>{l}</FilterChip>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          {candidates.map(c => (
            <div key={c.id} style={{
              display: 'grid', gridTemplateColumns: '72px 1fr auto', gap: 16,
              padding: 14, background: 'var(--sg-paper)', alignItems: 'center',
              borderLeft: `4px solid ${SG_CAT_COLOR[c.cat]}`,
            }}>
              <div style={{ aspectRatio: '1', background: SG_CAT_COLOR[c.cat], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 14 }}>
                {SG_CAT_LABEL[c.cat].slice(0,4)}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 17, lineHeight: 1.1, textTransform: 'uppercase' }}>{c.name}</div>
                <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 4 }}>
                  {c.schedule === 'full-day' ? 'FULL' : 'HALF'} · AGES {c.age} · {c.distance}KM · ${c.price}
                </div>
              </div>
              <SGButton variant="primary" size="sm" onClick={() => onAdd(c.id)}>ADD</SGButton>
            </div>
          ))}
          {candidates.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--sg-ink-60)' }}>
              No matches. Try a different category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============ Cell Detail Drawer ============ */
const CellDetailDrawer = ({ child, week, camp, cell, children, connections, onStatus, onRemove, onDuplicate, onClose }) => {
  const otherChildren = children.filter(c => c.id !== child.id);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sg-ink-10)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Eyebrow>CAMP DETAIL</Eyebrow>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <SGIcon name="close" size={22}/>
          </button>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: SG_CAT_COLOR[camp.cat] }}/>
          <span className="sg-mono" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--sg-ink-60)' }}>{SG_CAT_LABEL[camp.cat]}</span>
        </div>
        <h2 className="sg-display" style={{ fontSize: 40, margin: '8px 0' }}>{camp.name}</h2>
        <div className="sg-mono" style={{ fontSize: 12, color: 'var(--sg-ink-60)' }}>
          {child.name.toUpperCase()} · {week.label} · {week.start}–{week.end}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'grid', gap: 24 }}>
        <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--sg-ink-90)' }}>{camp.desc}</p>

        {/* Facts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, borderTop: '1px solid var(--sg-ink-10)' }}>
          {[
            { l: 'SCHEDULE', v: camp.schedule === 'full-day' ? 'Full day · 9a–4p' : 'Half day · 9a–12p' },
            { l: 'PRICE / WEEK', v: '$' + camp.price },
            { l: 'AGES', v: camp.age },
            { l: 'DISTANCE', v: camp.distance + ' km' },
            { l: 'LOCATION', v: camp.location },
            { l: 'OPEN WEEKS', v: camp.weeks.length + ' of 10' },
          ].map(f => (
            <div key={f.l} style={{ padding: '16px 0', borderBottom: '1px solid var(--sg-ink-10)' }}>
              <div className="sg-eyebrow">{f.l}</div>
              <div style={{ marginTop: 4, fontSize: 15, fontWeight: 500 }}>{f.v}</div>
            </div>
          ))}
        </div>

        {/* Status */}
        <div>
          <Eyebrow>STATUS</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 12 }}>
            {['REGISTERED', 'WAITLIST', 'INTERESTED', 'CONFLICT'].map(s => (
              <button key={s} onClick={() => onStatus(s)} style={{
                padding: '12px 14px',
                border: '1px solid', borderColor: cell.status === s ? 'var(--sg-black)' : 'var(--sg-ink-20)',
                background: cell.status === s ? 'var(--sg-black)' : 'transparent',
                color: cell.status === s ? 'var(--sg-white)' : 'var(--sg-black)',
                fontFamily: 'var(--sg-font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-start',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: SG_STATUS[s].dot }}/>
                {SG_STATUS[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Duplicate */}
        {otherChildren.length > 0 && (
          <div>
            <Eyebrow>COPY TO SIBLING</Eyebrow>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {otherChildren.map(c => (
                <button key={c.id} onClick={() => onDuplicate(c.id)} style={{
                  padding: '8px 12px 8px 8px', borderRadius: 999, background: 'var(--sg-paper)',
                  border: '1px solid var(--sg-ink-20)', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--sg-font-body)', fontSize: 13, fontWeight: 600,
                }}>
                  <ChildAvatar child={c} size={24}/>
                  COPY TO {c.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Coordination */}
        {connections.length > 0 && (
          <div>
            <Eyebrow>COORDINATED FAMILIES</Eyebrow>
            <div style={{ marginTop: 12, fontSize: 14, color: 'var(--sg-ink-60)' }}>
              Hannah Liu's daughter Wren is also registered for this week.
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: '20px 28px', borderTop: '1px solid var(--sg-ink-10)', display: 'flex', justifyContent: 'space-between' }}>
        <SGButton variant="ghost" icon="trash" onClick={onRemove}>REMOVE</SGButton>
        <SGButton variant="dark" icon="share">SHARE WITH PARENTS</SGButton>
      </div>
    </div>
  );
};

Object.assign(window, { GridScreen });
