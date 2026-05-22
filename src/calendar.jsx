import { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';
import { WEEKS, DAYS, blockPickupByDay, blockDropoffByDay, buildCarpoolIndex } from './data.js';
import { addBlock as addBlockDB, updateBlock as updateBlockDB, removeBlock as removeBlockDB, updateGroup as updateGroupDB, addChild as addChildDB, updateChild as updateChildDB, removeChild as removeChildDB, signOutUser } from './firebase.js';
import { Button, Eyebrow, Wordmark, Icon, Avatar, AvatarCluster, Drawer, Modal, Field, InputBox } from './ui.jsx';

// Context so sub-components can access group data without deep prop drilling
const CalCtx = createContext(null);
const useCal = () => useContext(CalCtx);

const fmtHM = (h) => {
  if (!h) return '';
  const [hh, mm] = h.split(':');
  const n = parseInt(hh, 10);
  const ampm = n >= 12 ? 'p' : 'a';
  const display = n > 12 ? n - 12 : (n === 0 ? 12 : n);
  return `${display}${mm !== '00' ? ':' + mm : ''}${ampm}`;
};
const fmtTimeRange = (s, e) => `${fmtHM(s)}–${fmtHM(e)}`;

const useIsMobile = (bp = 760) => {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp);
  useEffect(() => {
    const onResize = () => setM(window.innerWidth < bp);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [bp]);
  return m;
};

// ── Top-level Calendar ───────────────────────────────────────────────────────

export default function Calendar({ groupId, group, members, children, blocks, currentUser, goLanding }) {
  const [drawer, setDrawer] = useState(null);
  const [invite, setInvite] = useState(false);
  const [manage, setManage] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [view, setView] = useState('overview');
  const [weeklyIdx, setWeeklyIdx] = useState(null);
  const isMobile = useIsMobile();

  const getParent = useCallback((id) => members.find(m => m.id === id), [members]);
  const getChild  = useCallback((id) => children.find(c => c.id === id), [children]);

  const openWeekly = (idx) => {
    setWeeklyIdx(idx);
    setView('weekly');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const carpoolIndex = useMemo(() => buildCarpoolIndex(blocks), [blocks]);

  const coverageGaps = useMemo(() => WEEKS.filter(w => !blocks.some(b => b.weekIdx === w.idx)), [blocks]);

  const dueDeadlines = useMemo(() => {
    const seen = new Set();
    return blocks
      .filter(b => b.regDeadline && b.regStatus !== 'registered')
      .filter(b => { if (seen.has(b.campName)) return false; seen.add(b.campName); return true; })
      .sort((a, b) => (a.regDeadline || '').localeCompare(b.regDeadline || ''));
  }, [blocks]);

  const stats = useMemo(() => {
    const covered = WEEKS.length - coverageGaps.length;
    const shared  = Object.values(carpoolIndex).filter(arr => arr.length > 1).length;
    return { covered, total: WEEKS.length, shared, blockCount: blocks.length };
  }, [blocks, carpoolIndex, coverageGaps]);

  const addBlock    = (data)         => addBlockDB(groupId, data);
  const updateBlock = (id, patch)    => updateBlockDB(groupId, id, patch);
  const removeBlock = (id)           => removeBlockDB(groupId, id);

  const defaultWeeklyIdx = useMemo(() => {
    const first = WEEKS.find(w => blocks.some(b => b.weekIdx === w.idx));
    return (first || WEEKS[0]).idx;
  }, [blocks]);
  const activeWeeklyIdx = weeklyIdx ?? defaultWeeklyIdx;

  const ctxValue = { groupId, group, members, children, blocks, currentUser, getParent, getChild, carpoolIndex };

  return (
    <CalCtx.Provider value={ctxValue}>
      <div style={{ background: 'var(--sg-white)', minHeight: '100vh' }}>
        <CalendarChrome
          goLanding={goLanding}
          onInvite={() => setInvite(true)}
          onManage={() => setManage(true)}
          onExport={() => setExportOpen(true)}
          stats={stats}
          coverageGaps={coverageGaps}
          dueDeadlines={dueDeadlines}
          isMobile={isMobile}
        />

        <ViewTabs view={view} setView={setView} isMobile={isMobile}/>

        {view === 'overview' ? (
          <CalendarGrid
            isMobile={isMobile}
            onAddCell={(childId, weekIdx) => setDrawer({ kind: 'add', childId, weekIdx })}
            onEditBlock={(blockId) => setDrawer({ kind: 'edit', blockId })}
            onOpenWeek={openWeekly}
          />
        ) : (
          <WeeklyView
            weekIdx={activeWeeklyIdx}
            setWeekIdx={setWeeklyIdx}
            updateBlock={updateBlock}
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
                onSave={(data) => { updateBlock(drawer.blockId, data); setDrawer(null); }}
                onDelete={() => { removeBlock(drawer.blockId); setDrawer(null); }}
                onClose={() => setDrawer(null)}
                onOpenWeek={() => { openWeekly(b.weekIdx); setDrawer(null); }}
              />
            );
          })()}
        </Drawer>

        <InviteModal open={invite} onClose={() => setInvite(false)}/>
        <ManageDrawer open={manage} onClose={() => setManage(false)}/>
        <ExportModal open={exportOpen} onClose={() => setExportOpen(false)}/>
      </div>
    </CalCtx.Provider>
  );
}

// ── Chrome ───────────────────────────────────────────────────────────────────

function CalendarChrome({ goLanding, onInvite, onManage, onExport, stats, coverageGaps, dueDeadlines, isMobile }) {
  const { group, members } = useCal();
  return (
    <>
      <header style={{
        borderBottom: '1px solid var(--sg-ink-10)',
        padding: isMobile ? '0 16px' : '0 32px', height: 56, display: 'flex', alignItems: 'center',
        background: 'var(--sg-white)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div onClick={goLanding} style={{ cursor: 'pointer' }}>
          <Wordmark size={isMobile ? 16 : 18}/>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12 }}>
          {!isMobile && <AvatarCluster parents={members} size={26}/>}
          <Button variant="ghost" size="sm" icon="users" onClick={onManage}>{isMobile ? '' : 'MANAGE'}</Button>
          <Button variant="ghost" size="sm" icon="share" onClick={onInvite}>{isMobile ? '' : 'INVITE'}</Button>
          <Button variant="ghost" size="sm" icon="download" onClick={onExport}>{isMobile ? '' : 'EXPORT'}</Button>
        </div>
      </header>

      <div style={{ padding: isMobile ? '32px 16px 24px' : '64px 32px 32px', maxWidth: 1600, margin: '0 auto' }}>
        <Eyebrow>SUMMER 2026 · {members.length} FAMIL{members.length === 1 ? 'Y' : 'IES'}</Eyebrow>
        <h1 className="sg-display" style={{ fontSize: isMobile ? 'clamp(40px, 13vw, 64px)' : 'clamp(56px, 8vw, 112px)', margin: isMobile ? '12px 0 18px' : '16px 0 24px', maxWidth: '14ch' }}>
          {group?.name || 'Loading…'}
        </h1>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? 24 : 48, marginTop: isMobile ? 20 : 32, flexWrap: 'wrap' }}>
          <Metric label="WEEKS COVERED" value={`${stats.covered}/${stats.total}`} isMobile={isMobile}/>
          <Metric label="CAMPS LOGGED"  value={stats.blockCount} isMobile={isMobile}/>
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

        {dueDeadlines.length > 0 && (
          <div style={{ marginTop: isMobile ? 16 : 24, padding: isMobile ? '12px 14px' : '14px 18px', background: 'var(--sg-black)', color: 'var(--sg-white)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 18, flexWrap: 'wrap' }}>
            <div className="sg-mono" style={{ fontSize: isMobile ? 10 : 11, letterSpacing: '0.1em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="calendar" size={13} stroke={2.5} style={{ color: 'var(--sg-accent)' }}/> REGISTER BY
            </div>
            <div style={{ display: 'flex', gap: isMobile ? 10 : 18, flexWrap: 'wrap', alignItems: 'center' }}>
              {dueDeadlines.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="sg-mono" style={{ fontSize: 12, fontWeight: 700, color: b.regStatus === 'closing-soon' ? 'var(--sg-accent)' : 'var(--sg-white)', letterSpacing: '0.04em' }}>{b.regDeadline}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{b.campName}</span>
                  {b.regStatus === 'closing-soon' && (
                    <span className="sg-mono" style={{ fontSize: 9.5, padding: '2px 6px', background: 'var(--sg-accent)', color: 'var(--sg-white)', letterSpacing: '0.06em', fontWeight: 700 }}>CLOSING SOON</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const Metric = ({ label, value, accent, isMobile }) => (
  <div>
    <Eyebrow>{label}</Eyebrow>
    <div className="sg-mono" style={{ fontSize: isMobile ? 24 : 32, fontWeight: 600, color: accent ? 'var(--sg-accent)' : 'var(--sg-black)', marginTop: 4 }}>{value}</div>
  </div>
);

// ── Tabs ─────────────────────────────────────────────────────────────────────

function ViewTabs({ view, setView, isMobile }) {
  const [hoverId, setHoverId] = useState(null);
  const tabs = [
    { id: 'overview', label: 'OVERVIEW', hint: 'The summer at a glance' },
    { id: 'weekly',   label: 'WEEKLY',   hint: 'Day-by-day pickups & reminders' },
  ];
  return (
    <div style={{ padding: isMobile ? '0 16px' : '0 32px', maxWidth: 1600, margin: '0 auto', position: 'sticky', top: 56, zIndex: 15, background: 'var(--sg-white)', borderBottom: '1px solid var(--sg-ink-10)' }}>
      <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', paddingTop: isMobile ? 8 : 16 }}>
        {tabs.map(tab => {
          const active = view === tab.id;
          return (
            <button key={tab.id} onClick={() => setView(tab.id)}
              onMouseEnter={() => setHoverId(tab.id)} onMouseLeave={() => setHoverId(null)}
              style={{
                flex: isMobile ? 1 : '0 0 auto', background: 'transparent', border: 'none', cursor: 'pointer',
                padding: isMobile ? '14px 12px' : '20px 32px 20px 0', marginRight: isMobile ? 0 : 8,
                textAlign: 'left', position: 'relative', fontFamily: 'inherit',
                opacity: active ? 1 : (hoverId === tab.id ? 0.85 : 0.5),
                transition: 'opacity var(--sg-dur-fast) var(--sg-ease)',
              }}>
              <div className="sg-display" style={{ fontSize: isMobile ? 'clamp(28px, 8vw, 38px)' : 'clamp(40px, 5vw, 64px)', lineHeight: 0.92, letterSpacing: '-0.03em', color: active ? 'var(--sg-black)' : 'var(--sg-ink-60)', transition: 'color var(--sg-dur-fast) var(--sg-ease)' }}>
                {tab.label}
              </div>
              {!isMobile && <div className="sg-mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', fontWeight: 500, color: active ? 'var(--sg-accent)' : 'var(--sg-ink-60)', marginTop: 8 }}>{tab.hint}</div>}
              <div style={{ position: 'absolute', left: 0, right: isMobile ? 0 : 8, bottom: -1, height: 3, background: active ? 'var(--sg-accent)' : 'transparent', transition: 'background var(--sg-dur-fast) var(--sg-ease)' }}/>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Overview Grid ─────────────────────────────────────────────────────────────

function CalendarGrid({ isMobile, onAddCell, onEditBlock, onOpenWeek }) {
  const { members, children, blocks, carpoolIndex, getParent } = useCal();

  // Group by family unit: each "primary" parent (not partnered to anyone) becomes one row
  // with their partners shown alongside, sharing their kids.
  const primaries = members.filter(m => !m.partnerOf);
  const grouped = primaries.map(primary => {
    const partners = members.filter(m => m.partnerOf === primary.id);
    return {
      parent: primary,                       // primary parent (kept for compat with existing rendering)
      partners,                              // 0+ partners in this family unit
      parents: [primary, ...partners],       // everyone in the family unit
      kids: children.filter(c => c.parentId === primary.id),
    };
  }).filter(g => g.kids.length > 0);

  if (isMobile) {
    return <MobileGrid grouped={grouped} onAddCell={onAddCell} onEditBlock={onEditBlock} onOpenWeek={onOpenWeek}/>;
  }

  return (
    <div style={{ padding: '24px 32px 80px', overflowX: 'auto' }}>
      {blocks.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', marginBottom: 24, background: 'var(--sg-accent-soft)', border: '1px solid var(--sg-accent)', maxWidth: 560 }}>
          <Icon name="plus" size={18} stroke={2} style={{ color: 'var(--sg-accent)', flexShrink: 0 }}/>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--sg-accent)' }}>Your grid is empty</div>
            <div style={{ fontSize: 13, color: 'var(--sg-ink-60)', marginTop: 2 }}>Click any <strong>ADD CAMP</strong> cell below to start planning your summer.</div>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `220px repeat(${WEEKS.length}, minmax(150px, 1fr))`, gap: 6, minWidth: 1400 }}>
        <div style={{ position: 'sticky', left: 0, background: 'var(--sg-white)', zIndex: 2 }}/>
        {WEEKS.map(w => {
          const weekHas = blocks.some(b => b.weekIdx === w.idx);
          return <WeekHeader key={w.idx} week={w} clickable={weekHas} onClick={() => weekHas && onOpenWeek(w.idx)}/>;
        })}

        {grouped.map((g, gi) => (
          <div key={g.parent.id} style={{ display: 'contents' }}>
            <div style={{ gridColumn: `1 / span ${WEEKS.length + 1}`, padding: '24px 0 8px', borderBottom: '1px solid var(--sg-ink-10)', display: 'flex', alignItems: 'center', gap: 12, marginTop: gi === 0 ? 0 : 16 }}>
              {g.partners.length > 0 ? <AvatarCluster parents={g.parents} size={24}/> : <Avatar parent={g.parent} size={24}/>}
              <div className="sg-mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em' }}>
                {g.parents.map(p => p.short?.toUpperCase()).join(' & ')}
              </div>
              <div style={{ flex: 1 }}/>
              <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>{g.kids.length} KID{g.kids.length > 1 ? 'S' : ''}</div>
            </div>
            {g.kids.map(child => (
              <div key={child.id} style={{ display: 'contents' }}>
                <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', left: 0, background: 'var(--sg-white)', zIndex: 1, borderRight: '1px solid var(--sg-ink-10)' }}>
                  <div style={{ width: 4, height: 32, background: g.parent.color, borderRadius: 4 }}/>
                  <div>
                    <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{child.name}</div>
                    <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', marginTop: 4, letterSpacing: '0.06em' }}>AGE {child.age}</div>
                  </div>
                </div>
                {WEEKS.map(w => {
                  const b = blocks.find(x => x.childId === child.id && x.weekIdx === w.idx);
                  if (b) {
                    const carpool = carpoolIndex[`${w.idx}__${b.campName.toLowerCase()}`] || [];
                    return <CampBlock key={w.idx} block={b} parent={g.parent} carpool={carpool} onClick={() => onEditBlock(b.id)}/>;
                  }
                  return <EmptyCell key={w.idx} parentColor={g.parent.color} onClick={() => onAddCell(child.id, w.idx)}/>;
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileGrid({ grouped, onAddCell, onEditBlock, onOpenWeek }) {
  const { blocks, carpoolIndex } = useCal();
  return (
    <div style={{ padding: '20px 0 80px' }}>
      {grouped.map((g, gi) => (
        <div key={g.parent.id} style={{ marginBottom: gi === grouped.length - 1 ? 0 : 28 }}>
          <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--sg-ink-10)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar parent={g.parent} size={22}/>
            <div className="sg-mono" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em' }}>{g.parent.short?.toUpperCase()}</div>
            <div style={{ flex: 1 }}/>
            <div className="sg-mono" style={{ fontSize: 9.5, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>{g.kids.length} KID{g.kids.length > 1 ? 'S' : ''}</div>
          </div>
          {g.kids.map(child => (
            <div key={child.id} style={{ marginTop: 16 }}>
              <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 4, height: 28, background: g.parent.color, borderRadius: 4 }}/>
                <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{child.name}</div>
                <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>AGE {child.age}</div>
              </div>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px 4px', scrollSnapType: 'x mandatory' }}>
                <div style={{ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: '78%', gap: 8 }}>
                  {WEEKS.map(w => {
                    const b = blocks.find(x => x.childId === child.id && x.weekIdx === w.idx);
                    return (
                      <div key={w.idx} style={{ scrollSnapAlign: 'start' }}>
                        <div style={{ marginBottom: 6 }}>
                          <button onClick={() => b && onOpenWeek(w.idx)} disabled={!b} style={{ background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: b ? 'pointer' : 'default', fontFamily: 'inherit', display: 'block', width: '100%' }}>
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
}

function WeekHeader({ week, clickable, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} disabled={!clickable}
      style={{ padding: '14px 12px', borderBottom: '1px solid var(--sg-ink-20)', background: clickable && hover ? 'var(--sg-paper)' : 'transparent', textAlign: 'left', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--sg-ink-20)', cursor: clickable ? 'pointer' : 'default', fontFamily: 'inherit', position: 'relative', transition: 'background var(--sg-dur-fast) var(--sg-ease)' }}>
      <div className="sg-mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}>{week.label}</div>
      <div style={{ fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 2 }}>{week.start}–{week.end}</div>
      {clickable && <div className="sg-mono" style={{ marginTop: 8, fontSize: 9, fontWeight: 600, color: hover ? 'var(--sg-accent)' : 'var(--sg-ink-40)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4, transition: 'color var(--sg-dur-fast)' }}>OPEN WEEKLY <Icon name="arrowR" size={9} stroke={2.5}/></div>}
    </button>
  );
}

function CampBlock({ block, parent, carpool, onClick }) {
  const [hover, setHover] = useState(false);
  const isShared = carpool.length > 1;
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? parent.color + '20' : parent.color + '10', borderLeft: `3px solid ${parent.color}`, border: '1px solid ' + (hover ? parent.color + '60' : 'transparent'), borderLeftWidth: 3, textAlign: 'left', padding: '12px 12px 10px', minHeight: 116, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10, transition: 'background var(--sg-dur-fast) var(--sg-ease), border-color var(--sg-dur-fast)', fontFamily: 'inherit', position: 'relative', width: '100%' }}>
      <div>
        <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 15, lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{block.campName}</div>
        {(block.start || block.end) && <div className="sg-mono" style={{ fontSize: 10.5, color: 'var(--sg-ink-60)', marginTop: 5, letterSpacing: '0.02em' }}>{fmtTimeRange(block.start, block.end)}</div>}
        {block.regDeadline && block.regStatus !== 'registered' && (
          <div className="sg-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, padding: '2px 7px', background: block.regStatus === 'closing-soon' ? 'var(--sg-accent)' : 'var(--sg-black)', color: 'var(--sg-white)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>
            <Icon name="calendar" size={9} stroke={2.5}/> REG · {block.regDeadline.toUpperCase()}
          </div>
        )}
        {block.regStatus === 'registered' && (
          <div className="sg-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 8, padding: '2px 7px', background: 'rgba(31,138,91,0.12)', color: '#1F7A3A', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>
            <Icon name="check" size={9} stroke={2.5}/> REGISTERED
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 18 }}>
        {isShared && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', background: 'var(--sg-accent)', color: '#fff', fontFamily: 'var(--sg-font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', borderRadius: 999 }}>
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
}

function EmptyCell({ parentColor, onClick }) {
  const [hover, setHover] = useState(false);
  const c = hover ? parentColor : 'var(--sg-ink-40)';
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? parentColor + '08' : 'transparent', border: '1px dashed ' + (hover ? parentColor : 'var(--sg-ink-20)'), minHeight: 116, cursor: 'pointer', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all var(--sg-dur-fast) var(--sg-ease)', fontFamily: 'inherit' }}>
      <Icon name="plus" size={16} stroke={1.5} style={{ color: c }}/>
      <span style={{ fontFamily: 'var(--sg-font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: c, transition: 'color var(--sg-dur-fast)' }}>ADD CAMP</span>
    </button>
  );
}

// ── Weekly View ───────────────────────────────────────────────────────────────

function WeeklyView({ weekIdx, setWeekIdx, updateBlock, onEditBlock, onAddCell, onGoOverview, isMobile }) {
  const { blocks } = useCal();
  return (
    <div style={{ padding: '0 0 80px', maxWidth: 1600, margin: '0 auto' }}>
      <WeekPicker weekIdx={weekIdx} setWeekIdx={setWeekIdx} isMobile={isMobile}/>
      <WeekDetail weekIdx={weekIdx} updateBlock={updateBlock} onEditBlock={onEditBlock} onAddCell={onAddCell} onGoOverview={onGoOverview} isMobile={isMobile} inline/>
    </div>
  );
}

function WeekPicker({ weekIdx, setWeekIdx, isMobile }) {
  const { blocks } = useCal();
  const scrollerRef = useRef(null);
  useEffect(() => {
    const el = scrollerRef.current?.querySelector(`[data-wk="${weekIdx}"]`);
    if (el) {
      const parent = scrollerRef.current;
      const eLeft = el.offsetLeft;
      if (eLeft < parent.scrollLeft || eLeft + el.offsetWidth > parent.scrollLeft + parent.clientWidth) {
        parent.scrollTo({ left: eLeft - 16, behavior: 'smooth' });
      }
    }
  }, [weekIdx]);
  return (
    <div style={{ padding: isMobile ? '12px 0 16px' : '20px 0 24px', borderBottom: '1px solid var(--sg-ink-10)' }}>
      <div style={{ padding: isMobile ? '0 16px' : '0 32px' }}><Eyebrow>SELECT A WEEK</Eyebrow></div>
      <div ref={scrollerRef} style={{ marginTop: 12, padding: isMobile ? '0 16px 4px' : '0 32px 4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          {WEEKS.map(w => {
            const active = w.idx === weekIdx;
            const has = blocks.some(b => b.weekIdx === w.idx);
            return (
              <button key={w.idx} data-wk={w.idx} onClick={() => setWeekIdx(w.idx)} style={{ padding: '10px 16px 8px', background: active ? 'var(--sg-black)' : 'transparent', color: active ? 'var(--sg-white)' : 'var(--sg-black)', border: '1px solid ' + (active ? 'var(--sg-black)' : 'var(--sg-ink-20)'), cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, borderRadius: 4, transition: 'all var(--sg-dur-fast) var(--sg-ease)', opacity: has || active ? 1 : 0.55, position: 'relative' }}>
                <span className="sg-mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}>{w.label}</span>
                <span style={{ fontSize: 10.5, color: active ? 'rgba(250,250,247,0.7)' : 'var(--sg-ink-60)' }}>{w.start}–{w.end}</span>
                {has && !active && <span style={{ position: 'absolute', width: 4, height: 4, borderRadius: 999, background: 'var(--sg-accent)', top: 6, right: 6 }}/>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekDetail({ weekIdx, updateBlock, onEditBlock, onAddCell, onGoOverview, isMobile, inline }) {
  const { blocks, members, currentUser } = useCal();
  const week = WEEKS.find(w => w.idx === weekIdx);
  const weekBlocks = blocks.filter(b => b.weekIdx === weekIdx);
  const me = members.find(m => m.id === currentUser?.uid) || members[0];

  const [reminders, setReminders] = useState({});
  useEffect(() => {
    if (me) setReminders(r => ({ ...r, [me.id]: r[me.id] ?? true }));
  }, [me?.id]);

  const myDays = useMemo(() => {
    if (!me) return { drop: 0, pick: 0 };
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
  }, [weekBlocks, me]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: inline ? 'auto' : '100%' }}>
      <div style={{ padding: isMobile ? '20px 16px' : '24px 28px', borderBottom: '1px solid var(--sg-ink-10)' }}>
        <Eyebrow>WEEK DETAIL · GRANULAR PICKUP</Eyebrow>
        <h2 className="sg-display" style={{ fontSize: isMobile ? 28 : 40, margin: '12px 0 0', paddingBottom: 12, lineHeight: 1 }}>
          {week?.label} <span style={{ color: 'var(--sg-ink-40)' }}>· {week?.start}–{week?.end}</span>
        </h2>
        <div style={{ fontSize: isMobile ? 12.5 : 13, color: 'var(--sg-ink-60)', marginTop: 10, maxWidth: 560 }}>
          Assign drop-off and pick-up day by day. Changes sync instantly for everyone in the group.
        </div>
        {me && (
          <div style={{ marginTop: 20, display: 'flex', gap: isMobile ? 12 : 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar parent={me} size={28}/>
              <div>
                <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--sg-ink-60)' }}>YOUR WEEK</div>
                <div className="sg-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{myDays.drop} DROP-OFF{myDays.drop === 1 ? '' : 'S'} · {myDays.pick} PICK-UP{myDays.pick === 1 ? '' : 'S'}</div>
              </div>
            </div>
            <div style={{ flex: 1 }}/>
            <ReminderToggle on={!!reminders[me.id]} onToggle={() => setReminders(r => ({ ...r, [me.id]: !r[me.id] }))}/>
          </div>
        )}
      </div>

      {weekBlocks.length === 0 && (
        <div style={{ padding: isMobile ? '40px 16px' : 60, textAlign: 'center', color: 'var(--sg-ink-60)' }}>
          <div className="sg-display" style={{ fontSize: isMobile ? 24 : 28, color: 'var(--sg-ink-40)', marginBottom: 8 }}>NOTHING HERE</div>
          <div style={{ fontSize: 14, marginBottom: 20 }}>No camps scheduled for {week?.label}.</div>
          {inline && onGoOverview && <Button variant="ghost" icon="arrowL" onClick={onGoOverview}>BACK TO OVERVIEW</Button>}
        </div>
      )}

      <div style={{ flex: inline ? 'none' : 1, overflowY: inline ? 'visible' : 'auto', padding: isMobile ? '20px 16px' : '24px 28px' }}>
        {weekBlocks.length > 0 && (
          <div style={{ display: 'grid', gap: isMobile ? 20 : 28 }}>
            {weekBlocks.map(b => (
              <WeekCampRow key={b.id} block={b} updateBlock={updateBlock} onOpenBlock={() => onEditBlock(b.id)} isMobile={isMobile}/>
            ))}
          </div>
        )}
        {weekBlocks.length > 0 && (
          <div style={{ marginTop: 40, padding: isMobile ? 16 : 20, background: 'var(--sg-paper)' }}>
            <Eyebrow>EMAIL REMINDERS · NIGHT BEFORE</Eyebrow>
            <div style={{ fontSize: 13, color: 'var(--sg-ink-60)', marginTop: 8, marginBottom: 16, lineHeight: 1.5 }}>
              Each parent gets a reminder the evening before any day they're assigned. Toggle yours on; others manage their own.
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {members.map(p => {
                const assigned = countDays(weekBlocks, p.id);
                if (assigned.total === 0) return null;
                const isMe = p.id === currentUser?.uid;
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, padding: isMobile ? '10px 12px' : '12px 14px', background: 'var(--sg-white)', border: '1px solid var(--sg-ink-10)' }}>
                    <Avatar parent={p} size={26}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}{isMe ? ' (you)' : ''}</div>
                      <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.04em', marginTop: 2 }}>{assigned.drop} DROP-OFF · {assigned.pick} PICK-UP</div>
                    </div>
                    {isMe ? (
                      <ReminderToggle on={!!reminders[p.id]} onToggle={() => setReminders(r => ({ ...r, [p.id]: !r[p.id] }))}/>
                    ) : (
                      <span className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em', textAlign: 'right' }}>THEIR<br/>CHOICE</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {inline && weekBlocks.length > 0 && (
          <div style={{ padding: isMobile ? '8px 0 0' : '8px 0 0', marginTop: 8 }}>
            <span className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>CHANGES SAVE AUTOMATICALLY · ALL PARENTS SEE UPDATES IN REAL-TIME</span>
          </div>
        )}
      </div>
    </div>
  );
}

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
  <button onClick={onToggle} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: on ? 'var(--sg-black)' : 'transparent', color: on ? 'var(--sg-white)' : 'var(--sg-black)', border: '1px solid ' + (on ? 'var(--sg-black)' : 'var(--sg-ink-20)'), cursor: 'pointer', fontFamily: 'var(--sg-font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', borderRadius: 999 }}>
    <span style={{ width: 8, height: 8, borderRadius: 999, background: on ? 'var(--sg-accent)' : 'var(--sg-ink-20)' }}/>
    {on ? 'EMAIL ON' : 'EMAIL OFF'}
  </button>
);

// ── WeekCampRow ───────────────────────────────────────────────────────────────

function WeekCampRow({ block, updateBlock, onOpenBlock, isMobile }) {
  const { getChild, getParent, members } = useCal();
  const child = getChild(block.childId);
  const childParent = child ? getParent(child.parentId) : null;
  const pickup  = blockPickupByDay(block);
  const dropoff = blockDropoffByDay(block);
  const [picker, setPicker] = useState(null);

  if (!child || !childParent) return null;

  const setDay = (kind, day, parentId) => {
    if (kind === 'p') updateBlock(block.id, { pickupByDay:  { ...pickup,  [day]: parentId } });
    else              updateBlock(block.id, { dropoffByDay: { ...dropoff, [day]: parentId } });
    setPicker(null);
  };
  const fillAll = (kind, parentId) => {
    const map = { M: parentId, T: parentId, W: parentId, Th: parentId, F: parentId };
    if (kind === 'p') updateBlock(block.id, { pickupByDay: map });
    else              updateBlock(block.id, { dropoffByDay: map });
  };

  return (
    <div style={{ border: '1px solid var(--sg-ink-10)' }}>
      <div style={{ padding: isMobile ? '12px 14px' : '14px 16px', background: childParent.color + '10', borderLeft: `3px solid ${childParent.color}`, display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: isMobile ? 18 : 22, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{child.name}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.campName}</div>
          <div className="sg-mono" style={{ fontSize: 10.5, color: 'var(--sg-ink-60)', letterSpacing: '0.02em', marginTop: 2 }}>{fmtTimeRange(block.start, block.end)}</div>
        </div>
        <button onClick={onOpenBlock} style={{ background: 'transparent', border: '1px solid var(--sg-ink-20)', padding: '6px 10px', fontFamily: 'var(--sg-font-mono)', fontSize: 10, letterSpacing: '0.08em', fontWeight: 600, cursor: 'pointer', borderRadius: 999 }}>EDIT CAMP</button>
      </div>
      <div style={{ padding: isMobile ? 12 : 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '58px repeat(5, 1fr) 28px' : '90px repeat(5, 1fr) 36px', gap: isMobile ? 4 : 8, alignItems: 'center', marginBottom: 6 }}>
          <div/>
          {DAYS.map(d => <div key={d.key} className="sg-mono" style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, color: 'var(--sg-ink-60)', letterSpacing: '0.1em', textAlign: 'center' }}>{isMobile ? d.key.toUpperCase() : d.full.toUpperCase()}</div>)}
          <div/>
        </div>
        <DayPickerRow label="DROP-OFF" dayMap={dropoff} activePicker={picker} kind="d" onPickDay={day => setPicker(picker?.kind === 'd' && picker.day === day ? null : { kind: 'd', day })} onChoose={(pid) => picker && setDay(picker.kind, picker.day, pid)} onClosePicker={() => setPicker(null)} onFillAll={pid => fillAll('d', pid)} isMobile={isMobile}/>
        <DayPickerRow label="PICK-UP"  dayMap={pickup}  activePicker={picker} kind="p" onPickDay={day => setPicker(picker?.kind === 'p' && picker.day === day ? null : { kind: 'p', day })} onChoose={(pid) => picker && setDay(picker.kind, picker.day, pid)} onClosePicker={() => setPicker(null)} onFillAll={pid => fillAll('p', pid)} isMobile={isMobile}/>
      </div>
    </div>
  );
}

function DayPickerRow({ label, dayMap, activePicker, kind, onPickDay, onChoose, onClosePicker, onFillAll, isMobile }) {
  const { members, getParent } = useCal();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '58px repeat(5, 1fr) 28px' : '90px repeat(5, 1fr) 36px', gap: isMobile ? 4 : 8, alignItems: 'center', padding: '8px 0' }}>
        <div className="sg-mono" style={{ fontSize: isMobile ? 9 : 10, fontWeight: 700, letterSpacing: '0.08em' }}>{label}</div>
        {DAYS.map(d => {
          const parentId = dayMap[d.key];
          const p = getParent(parentId);
          const active = activePicker?.kind === kind && activePicker.day === d.key;
          return (
            <div key={d.key} style={{ position: 'relative' }}>
              <button onClick={() => onPickDay(d.key)} style={{ width: '100%', padding: isMobile ? '8px 2px' : '8px 6px', cursor: 'pointer', background: active ? (p?.color || 'var(--sg-paper)') + '30' : (p?.color || '#000') + '12', border: '1px solid ' + (active ? (p?.color || 'var(--sg-black)') : 'transparent'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 2 : 6, fontFamily: 'inherit', borderRadius: 4, minHeight: 36, transition: 'all var(--sg-dur-fast) var(--sg-ease)' }}>
                {p ? <Avatar parent={p} size={isMobile ? 18 : 20}/> : <Icon name="plus" size={14}/>}
                {!isMobile && <span style={{ fontSize: 11, fontWeight: 600 }}>{p ? p.short : '—'}</span>}
              </button>
              {active && <ParentMenu onChoose={onChoose} onClose={onClosePicker} current={parentId}/>}
            </div>
          );
        })}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(o => !o)} title="Fill whole row" style={{ width: isMobile ? 24 : 32, height: 32, background: 'transparent', border: '1px dashed var(--sg-ink-20)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: 'var(--sg-ink-60)' }}>
            <Icon name="link" size={isMobile ? 11 : 13} stroke={2}/>
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 8 }}>
              <div style={{ background: 'var(--sg-white)', border: '1px solid var(--sg-ink-20)', padding: 10, minWidth: 180, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
                <div className="sg-mono" style={{ fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--sg-ink-60)', marginBottom: 8 }}>FILL WHOLE ROW</div>
                <div style={{ display: 'grid', gap: 4 }}>
                  {members.map(p => (
                    <button key={p.id} onClick={() => { onFillAll(p.id); setMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 4, textAlign: 'left' }}>
                      <Avatar parent={p} size={20}/><span style={{ fontSize: 13, fontWeight: 500 }}>{p.short}</span>
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
}

function ParentMenu({ onChoose, onClose, current }) {
  const { members } = useCal();
  const ref = useRef(null);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    const onDown = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [onClose]);
  return (
    <div ref={ref} style={{ position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)', background: 'var(--sg-white)', border: '1px solid var(--sg-ink-20)', padding: 8, zIndex: 10, minWidth: 160, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}>
      <div className="sg-mono" style={{ fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--sg-ink-60)', padding: '4px 8px 6px' }}>ASSIGN TO</div>
      <div style={{ display: 'grid', gap: 2 }}>
        {members.map(p => {
          const active = current === p.id;
          return (
            <button key={p.id} onClick={() => onChoose(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: active ? 'var(--sg-paper)' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 4, textAlign: 'left' }}>
              <Avatar parent={p} size={22}/>
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{p.short}</span>
              {active && <Icon name="check" size={12} stroke={2.5} style={{ marginLeft: 'auto', color: 'var(--sg-accent)' }}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Block Editor ──────────────────────────────────────────────────────────────

function BlockEditor({ mode, initial, onSave, onDelete, onClose, onOpenWeek }) {
  const { members, children, blocks, carpoolIndex, getChild, getParent } = useCal();
  const [childId,   setChildId]   = useState(initial.childId || (children[0]?.id || ''));
  const [weekIdx,   setWeekIdx]   = useState(initial.weekIdx || 1);
  const [campName,  setCampName]  = useState(initial.campName || '');
  const [start,     setStart]     = useState(initial.start || '09:00');
  const [end,       setEnd]       = useState(initial.end   || '16:00');
  const [pickup,    setPickup]    = useState(initial.pickup  || members[0]?.id || '');
  const [dropoff,   setDropoff]   = useState(initial.dropoff || members[0]?.id || '');
  const [notes,     setNotes]     = useState(initial.notes || '');
  const [regDeadline, setRegDeadline] = useState(initial.regDeadline || '');
  const [regStatus,   setRegStatus]   = useState(initial.regStatus || '');

  const child  = getChild(childId);
  const week   = WEEKS.find(w => w.idx === weekIdx);
  const parent = child ? getParent(child.parentId) : members[0];

  const suggestions = useMemo(() => {
    const names = blocks.filter(b => b.weekIdx === weekIdx && b.id !== initial.id).map(b => b.campName);
    return [...new Set(names)];
  }, [blocks, weekIdx, initial.id]);

  const sharedWith = useMemo(() => {
    if (!campName.trim()) return [];
    const key = `${weekIdx}__${campName.toLowerCase()}`;
    return (carpoolIndex[key] || []).filter(b => b.id !== initial.id);
  }, [campName, weekIdx, carpoolIndex, initial.id]);

  const canSave = campName.trim().length > 0 && childId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sg-ink-10)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Eyebrow>{mode === 'add' ? 'ADD A CAMP' : 'EDIT CAMP'}</Eyebrow>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" size={20}/></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          {parent && <Avatar parent={parent} size={28}/>}
          <div className="sg-display" style={{ fontSize: 28 }}>
            {child?.name?.toUpperCase() || '—'} · {week?.label}
          </div>
        </div>
        <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 4, letterSpacing: '0.04em' }}>{week?.start}–{week?.end}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'grid', gap: 24 }}>
        {/* Child selector */}
        <Field label="KID">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {children.map(c => {
              const p = getParent(c.parentId);
              const active = c.id === childId;
              return (
                <button key={c.id} onClick={() => setChildId(c.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px 6px 6px', borderRadius: 999, background: active ? 'var(--sg-black)' : 'transparent', color: active ? 'var(--sg-white)' : 'var(--sg-black)', border: '1px solid ' + (active ? 'var(--sg-black)' : 'var(--sg-ink-20)'), cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all var(--sg-dur-fast) var(--sg-ease)' }}>
                  {p && <Avatar parent={p} size={20}/>}{c.name}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Week selector */}
        <Field label="WEEK">
          <select value={weekIdx} onChange={e => setWeekIdx(+e.target.value)} style={{ padding: '12px 14px', borderRadius: 4, border: '1px solid var(--sg-ink-20)', background: 'var(--sg-white)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }}>
            {WEEKS.map(w => <option key={w.idx} value={w.idx}>{w.label} · {w.start}–{w.end}</option>)}
          </select>
        </Field>

        <Field label="CAMP NAME">
          <InputBox value={campName} onChange={e => setCampName(e.target.value)} placeholder="Cascadia Tech Lab" autoFocus/>
          {suggestions.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em', alignSelf: 'center' }}>OR PICK:</span>
              {suggestions.map(s => (
                <button key={s} onClick={() => setCampName(s)} style={{ padding: '4px 10px', borderRadius: 999, background: 'var(--sg-paper)', border: '1px solid var(--sg-ink-20)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500 }}>{s}</button>
              ))}
            </div>
          )}
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="DROP-OFF TIME"><InputBox type="time" value={start} onChange={e => setStart(e.target.value)}/></Field>
          <Field label="PICK-UP TIME"><InputBox type="time" value={end}   onChange={e => setEnd(e.target.value)}/></Field>
        </div>

        <Field label="REGISTRATION DEADLINE">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {[
              { v: 'open',       l: 'HAS DEADLINE' },
              { v: 'registered', l: 'ALREADY REGISTERED' },
              { v: '',           l: 'NONE / NOT SURE' },
            ].map(opt => (
              <button key={opt.v} onClick={() => { setRegStatus(opt.v); if (opt.v !== 'open' && opt.v !== 'closing-soon') setRegDeadline(''); }} style={chipStyleBE(regStatus === opt.v || (opt.v === 'open' && regStatus === 'closing-soon'))}>{opt.l}</button>
            ))}
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

        {sharedWith.length > 0 && (
          <div style={{ padding: 16, background: 'var(--sg-accent-soft)', borderLeft: '3px solid var(--sg-accent)' }}>
            <div className="sg-mono" style={{ fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--sg-accent-deep)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Icon name="link" size={12} stroke={2.5}/> SHARED CAMP
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              {sharedWith.length === 1
                ? <>{getChild(sharedWith[0].childId)?.name} ({getParent(getChild(sharedWith[0].childId)?.parentId)?.short}'s) is also at this camp this week.</>
                : <>{sharedWith.length} other kids are at this camp this week.</>}
            </div>
          </div>
        )}

        <Field label="DEFAULT DROP-OFF"><ParentChips value={dropoff} onChange={setDropoff}/></Field>
        <Field label="DEFAULT PICK-UP">
          <ParentChips value={pickup} onChange={setPickup}/>
          <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', marginTop: 8, letterSpacing: '0.04em' }}>
            DEFAULTS APPLY TO ALL 5 DAYS. ASSIGN DAY-BY-DAY IN THE {onOpenWeek ? <button onClick={onOpenWeek} style={{ background: 'transparent', border: 'none', textDecoration: 'underline', color: 'var(--sg-accent-deep)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', padding: 0 }}>WEEKLY TAB</button> : 'WEEKLY TAB'}.
          </div>
        </Field>

        <Field label="NOTES (OPTIONAL)">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Theo brings a snack. Mira has soccer right after." style={{ padding: '12px 14px', borderRadius: 4, border: '1px solid var(--sg-ink-20)', background: 'var(--sg-white)', fontSize: 14, fontFamily: 'inherit', outline: 'none', minHeight: 80, resize: 'vertical' }}/>
        </Field>
      </div>

      <div style={{ padding: '20px 28px', borderTop: '1px solid var(--sg-ink-10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {mode === 'edit' ? <Button variant="ghost" icon="trash" onClick={onDelete}>REMOVE</Button> : <div/>}
        <Button variant="primary" iconAfter="check" onClick={() => canSave && onSave({ childId, weekIdx, campName: campName.trim(), start, end, pickup, dropoff, notes: notes.trim(), ...(regStatus ? { regStatus } : {}), ...(regDeadline ? { regDeadline } : {}) })} disabled={!canSave} style={{ opacity: canSave ? 1 : 0.5 }}>
          {mode === 'add' ? 'ADD TO GRID' : 'SAVE'}
        </Button>
      </div>
    </div>
  );
}

const chipStyleBE = (active) => ({
  padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--sg-font-mono)',
  background: active ? 'var(--sg-black)' : 'var(--sg-white)',
  color: active ? 'var(--sg-white)' : 'var(--sg-black)',
  border: '1px solid ' + (active ? 'var(--sg-black)' : 'var(--sg-ink-20)'),
  fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em',
});

function ParentChips({ value, onChange }) {
  const { members } = useCal();
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {members.map(p => {
        const active = value === p.id;
        return (
          <button key={p.id} onClick={() => onChange(p.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px 6px 6px', borderRadius: 999, background: active ? 'var(--sg-black)' : 'transparent', color: active ? 'var(--sg-white)' : 'var(--sg-black)', border: '1px solid ' + (active ? 'var(--sg-black)' : 'var(--sg-ink-20)'), cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all var(--sg-dur-fast) var(--sg-ease)' }}>
            <Avatar parent={p} size={22}/>{p.short}
          </button>
        );
      })}
    </div>
  );
}

// ── Invite Modal ──────────────────────────────────────────────────────────────

function InviteModal({ open, onClose }) {
  const { group, members } = useCal();
  const [copied, setCopied] = useState(false);
  const inviteUrl = group ? `${window.location.origin}${window.location.pathname}#/join/${group.inviteCode}` : '';
  const copy = () => {
    navigator.clipboard?.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sg-ink-10)', display: 'flex', justifyContent: 'space-between' }}>
        <Eyebrow>INVITE OTHER FAMILIES</Eyebrow>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" size={20}/></button>
      </div>
      <div style={{ padding: 28 }}>
        <h2 className="sg-display" style={{ fontSize: 40, margin: '0 0 12px' }}>One link.<br/>That's it.</h2>
        <p style={{ color: 'var(--sg-ink-60)', marginBottom: 24, fontSize: 15 }}>Send this to other parents with their own kids — they join as a separate family. To invite your partner instead (sharing your kids), use <strong>MANAGE</strong>.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, background: 'var(--sg-paper)', border: '1px solid var(--sg-ink-20)', borderRadius: 4 }}>
          <div className="sg-mono" style={{ flex: 1, padding: '8px 10px', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inviteUrl}</div>
          <Button variant="primary" size="sm" icon={copied ? 'check' : 'copy'} onClick={copy}>{copied ? 'COPIED' : 'COPY LINK'}</Button>
        </div>
        <div style={{ marginTop: 24 }}>
          <Eyebrow>ALREADY IN THE GROUP</Eyebrow>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {members.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--sg-paper)' }}>
                <Avatar parent={p} size={28}/>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--sg-ink-60)' }}>{p.email}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Export Modal ──────────────────────────────────────────────────────────────

function ExportModal({ open, onClose }) {
  const { children, getParent } = useCal();
  const [perKid, setPerKid] = useState({});
  useEffect(() => {
    setPerKid(Object.fromEntries(children.map(c => [c.id, true])));
  }, [children]);
  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sg-ink-10)', display: 'flex', justifyContent: 'space-between' }}>
        <Eyebrow>EXPORT TO CALENDAR</Eyebrow>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Icon name="close" size={20}/></button>
      </div>
      <div style={{ padding: 28 }}>
        <h2 className="sg-display" style={{ fontSize: 36, margin: '0 0 8px' }}>Sync the summer.</h2>
        <p style={{ color: 'var(--sg-ink-60)', marginBottom: 24, fontSize: 14 }}>Each camp becomes a calendar event with times and pickup info.</p>
        <Eyebrow>WHICH KIDS</Eyebrow>
        <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
          {children.map(c => {
            const p = getParent(c.parentId);
            return (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--sg-paper)', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!perKid[c.id]} onChange={e => setPerKid({ ...perKid, [c.id]: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--sg-accent)' }}/>
                {p && <Avatar parent={p} size={22}/>}
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{c.name} {p && <span style={{ color: 'var(--sg-ink-60)', fontWeight: 400 }}>· {p.short}</span>}</div>
              </label>
            );
          })}
        </div>
        <div style={{ marginTop: 24, display: 'grid', gap: 8 }}>
          <button onClick={() => alert('Google Calendar export — coming soon')} style={{ padding: 14, background: 'var(--sg-white)', border: '1px solid var(--sg-ink-20)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <Icon name="google" size={22} stroke={0}/>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>Google Calendar</div>
            <Icon name="arrowR" size={16}/>
          </button>
          <button onClick={() => alert('.ICS download — coming soon')} style={{ padding: 14, background: 'var(--sg-white)', border: '1px solid var(--sg-ink-20)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <Icon name="calendar" size={22}/>
            <div style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>Apple Calendar / Outlook <span className="sg-mono" style={{ fontWeight: 400, fontSize: 11, color: 'var(--sg-ink-60)', marginLeft: 6 }}>.ICS</span></div>
            <Icon name="arrowR" size={16}/>
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── ManageDrawer — add/edit partner, add/edit/remove kids ────────────────────

function ManageDrawer({ open, onClose }) {
  const { group, members, children, currentUser } = useCal();
  const groupId = group?.id;
  const me      = members.find(m => m.id === currentUser?.uid);

  // Family unit: I'm either a primary (everyone else with partnerOf=me is mine) or a partner (I have partnerOf set)
  const myFamilyId = me?.partnerOf || currentUser?.uid;
  const myKids     = children.filter(c => c.parentId === myFamilyId);

  // My partner: a member (other than me) in my family unit
  const partner = members.find(m => m.id !== currentUser?.uid && (m.partnerOf === myFamilyId || m.id === myFamilyId));
  const partnerNameInGroup = group?.partnerName;

  const [partnerInput, setPartnerInput] = useState('');
  const [savingPartner, setSavingPartner] = useState(false);
  const [copiedPartner, setCopiedPartner] = useState(false);
  const [copiedGeneral, setCopiedGeneral] = useState(false);
  const [newKidName, setNewKidName] = useState('');
  const [newKidAge, setNewKidAge] = useState('');
  const [savingKid, setSavingKid] = useState(false);
  const [editingKidId, setEditingKidId] = useState(null);
  const [editKidName, setEditKidName] = useState('');
  const [editKidAge, setEditKidAge] = useState('');

  useEffect(() => { setPartnerInput(partnerNameInGroup || ''); }, [partnerNameInGroup, open]);

  // Legacy groups created before partner-invite-code feature have only inviteCode.
  // Fall back to it so the partner section still works; new groups get a distinct code.
  const partnerInviteUrl = group ? `${window.location.origin}${window.location.pathname}#/join/${group.partnerInviteCode || group.inviteCode}` : '';
  const generalInviteUrl = group ? `${window.location.origin}${window.location.pathname}#/join/${group.inviteCode}` : '';

  const savePartnerName = async () => {
    if (!partnerInput.trim()) return;
    setSavingPartner(true);
    try { await updateGroupDB(groupId, { partnerName: partnerInput.trim() }); }
    catch (e) { console.error(e); alert('Could not save partner name.'); }
    finally { setSavingPartner(false); }
  };

  const copyPartner = () => {
    navigator.clipboard?.writeText(partnerInviteUrl);
    setCopiedPartner(true);
    setTimeout(() => setCopiedPartner(false), 1800);
  };
  const copyGeneral = () => {
    navigator.clipboard?.writeText(generalInviteUrl);
    setCopiedGeneral(true);
    setTimeout(() => setCopiedGeneral(false), 1800);
  };

  const addKid = async () => {
    if (!newKidName.trim()) return;
    setSavingKid(true);
    try {
      await addChildDB(groupId, {
        name: newKidName.trim(),
        age:  parseInt(newKidAge) || 0,
        parentId: myFamilyId, // shared by primary + partner
      });
      setNewKidName(''); setNewKidAge('');
    } catch (e) { console.error(e); alert('Could not add kid.'); }
    finally { setSavingKid(false); }
  };

  const startEditKid = (kid) => {
    setEditingKidId(kid.id);
    setEditKidName(kid.name);
    setEditKidAge(kid.age || '');
  };

  const saveEditKid = async () => {
    if (!editKidName.trim()) return;
    try {
      await updateChildDB(groupId, editingKidId, {
        name: editKidName.trim(),
        age:  parseInt(editKidAge) || 0,
      });
      setEditingKidId(null);
    } catch (e) { console.error(e); alert('Could not save changes.'); }
  };

  const deleteKid = async (kidId, kidName) => {
    if (!confirm(`Remove ${kidName} from the grid? Their camps will also be deleted.`)) return;
    try { await removeChildDB(groupId, kidId); }
    catch (e) { console.error(e); alert('Could not remove kid.'); }
  };

  // Show partner section only if partner hasn't actually joined yet
  const partnerHasJoined = !!partner;

  return (
    <Drawer open={open} onClose={onClose} width={520}>
      <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--sg-ink-10)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Eyebrow>MANAGE</Eyebrow>
          <h2 className="sg-display" style={{ fontSize: 28, margin: '6px 0 0' }}>YOUR FAMILY</h2>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--sg-ink-60)' }}>
          <Icon name="close" size={20}/>
        </button>
      </div>

      <div style={{ padding: '24px 28px', display: 'grid', gap: 32 }}>

        {/* ── Partner section ── */}
        <section>
          <Eyebrow>YOUR PARTNER</Eyebrow>
          {partnerHasJoined ? (
            <div style={{ marginTop: 12, padding: 16, background: 'var(--sg-paper)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar parent={partner} size={36}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{partner.name}</div>
                <div className="sg-mono" style={{ fontSize: 10.5, color: 'var(--sg-ink-60)', letterSpacing: '0.06em', marginTop: 2 }}>JOINED · {partner.email}</div>
              </div>
              <span className="sg-mono" style={{ fontSize: 10, padding: '4px 8px', background: 'var(--sg-success)', color: '#fff', letterSpacing: '0.06em', fontWeight: 600 }}>ACTIVE</span>
            </div>
          ) : (
            <div style={{ marginTop: 12, display: 'grid', gap: 14 }}>
              <Field label="PARTNER'S FIRST NAME">
                <div style={{ display: 'flex', gap: 8 }}>
                  <InputBox
                    value={partnerInput}
                    onChange={e => setPartnerInput(e.target.value)}
                    placeholder="e.g. Sarah"
                    style={{ flex: 1 }}
                  />
                  <Button variant="primary" size="sm" onClick={savePartnerName} disabled={!partnerInput.trim() || savingPartner || partnerInput.trim() === (partnerNameInGroup || '')}>
                    {savingPartner ? 'SAVING…' : 'SAVE'}
                  </Button>
                </div>
              </Field>

              <div style={{ padding: 16, background: 'var(--sg-black)', color: 'var(--sg-white)' }}>
                <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(250,250,247,0.6)', marginBottom: 10 }}>
                  {partnerNameInGroup ? `SEND TO ${partnerNameInGroup.toUpperCase()}` : 'INVITE YOUR PARTNER'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <div className="sg-mono" style={{ flex: 1, padding: '6px 8px', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(250,250,247,0.85)' }}>
                    {partnerInviteUrl}
                  </div>
                  <button onClick={copyPartner} style={{
                    padding: '8px 12px', background: copiedPartner ? 'var(--sg-accent)' : 'var(--sg-white)',
                    color: copiedPartner ? '#fff' : 'var(--sg-black)', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--sg-font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em',
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                  }}>
                    <Icon name={copiedPartner ? 'check' : 'copy'} size={12} stroke={2.5}/>
                    {copiedPartner ? 'COPIED!' : 'COPY'}
                  </button>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(250,250,247,0.55)', lineHeight: 1.5 }}>
                  This is a special link for your partner — when they join, they'll share your kids and pickups.
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Kids section ── */}
        <section>
          <Eyebrow>YOUR KIDS</Eyebrow>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {myKids.length === 0 && (
              <div style={{ padding: 16, background: 'var(--sg-paper)', fontSize: 13, color: 'var(--sg-ink-60)' }}>
                You haven't added any kids yet.
              </div>
            )}
            {myKids.map(kid => editingKidId === kid.id ? (
              <div key={kid.id} style={{ padding: 12, background: 'var(--sg-paper)', display: 'grid', gridTemplateColumns: '1fr 80px auto auto', gap: 8, alignItems: 'center' }}>
                <InputBox value={editKidName} onChange={e => setEditKidName(e.target.value)} placeholder="Name"/>
                <InputBox type="number" min="1" max="18" value={editKidAge} onChange={e => setEditKidAge(e.target.value)} placeholder="Age"/>
                <Button variant="primary" size="sm" onClick={saveEditKid}>SAVE</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingKidId(null)}>CANCEL</Button>
              </div>
            ) : (
              <div key={kid.id} style={{ padding: '12px 16px', background: 'var(--sg-paper)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{kid.name}</div>
                  {kid.age ? <div className="sg-mono" style={{ fontSize: 10.5, color: 'var(--sg-ink-60)', letterSpacing: '0.06em', marginTop: 2 }}>{kid.age} YEARS OLD</div> : null}
                </div>
                <button onClick={() => startEditKid(kid)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--sg-ink-60)', fontFamily: 'var(--sg-font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', padding: '6px 10px' }}>
                  EDIT
                </button>
                <button onClick={() => deleteKid(kid.id, kid.name)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--sg-ink-60)', padding: 4 }} title="Remove kid">
                  <Icon name="trash" size={16}/>
                </button>
              </div>
            ))}

            {/* Add new kid */}
            <div style={{ padding: 12, border: '1px dashed var(--sg-ink-20)', display: 'grid', gridTemplateColumns: '1fr 80px auto', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <InputBox value={newKidName} onChange={e => setNewKidName(e.target.value)} placeholder="Add another kid"/>
              <InputBox type="number" min="1" max="18" value={newKidAge} onChange={e => setNewKidAge(e.target.value)} placeholder="Age"/>
              <Button variant="primary" size="sm" onClick={addKid} disabled={!newKidName.trim() || savingKid}>
                {savingKid ? '…' : 'ADD'}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Other parents invite ── */}
        <section>
          <Eyebrow>INVITE OTHER FAMILIES</Eyebrow>
          <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--sg-ink-60)', lineHeight: 1.5 }}>
            For other parents bringing their own kids. They join as a separate family — you'll coordinate pickups across families.
          </div>
          <div style={{ marginTop: 12, padding: 14, background: 'var(--sg-paper)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="sg-mono" style={{ flex: 1, padding: '6px 8px', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--sg-ink-90)' }}>
              {generalInviteUrl}
            </div>
            <button onClick={copyGeneral} style={{
              padding: '8px 12px', background: copiedGeneral ? 'var(--sg-accent)' : 'var(--sg-black)',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--sg-font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}>
              <Icon name={copiedGeneral ? 'check' : 'copy'} size={12} stroke={2.5}/>
              {copiedGeneral ? 'COPIED!' : 'COPY'}
            </button>
          </div>
        </section>

        {/* ── Account / Sign out ── */}
        <section style={{ borderTop: '1px solid var(--sg-ink-10)', paddingTop: 24 }}>
          <Eyebrow>YOUR ACCOUNT</Eyebrow>
          <div style={{ marginTop: 12, padding: '14px 16px', background: 'var(--sg-paper)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{currentUser?.displayName || currentUser?.email}</div>
              {currentUser?.displayName && currentUser?.email && (
                <div className="sg-mono" style={{ fontSize: 10.5, color: 'var(--sg-ink-60)', letterSpacing: '0.04em', marginTop: 2 }}>{currentUser.email}</div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={async () => {
              if (!confirm('Sign out of SummerGrid?')) return;
              try { await signOutUser(); } catch (e) { console.error(e); }
            }}>SIGN OUT</Button>
          </div>
        </section>
      </div>
    </Drawer>
  );
}
