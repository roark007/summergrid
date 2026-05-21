// SummerGrid — Discover screen

const DiscoverScreen = ({ children, setChildren, calendarConnected }) => {
  const [filters, setFilters] = useState({
    cats: [], schedule: 'all', priceMax: 700, ageMin: 5, ageMax: 16, distance: 25,
  });
  const [page, setPage] = useState(1);
  const PER_PAGE = 9;
  const [addModal, setAddModal] = useState(null); // campId

  const filtered = useMemo(() => SG_CAMPS.filter(c => {
    if (filters.cats.length && !filters.cats.includes(c.cat)) return false;
    if (filters.schedule !== 'all' && c.schedule !== filters.schedule) return false;
    if (c.price > filters.priceMax) return false;
    if (c.distance > filters.distance) return false;
    return true;
  }), [filters]);

  const visible = filtered.slice(0, page * PER_PAGE);

  const toggleCat = (cat) => setFilters(f => ({ ...f, cats: f.cats.includes(cat) ? f.cats.filter(x => x !== cat) : [...f.cats, cat] }));

  return (
    <div style={{ background: 'var(--sg-white)' }}>
      {/* Hero */}
      <div style={{ padding: '40px 32px 32px' }}>
        <Eyebrow>DISCOVER</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
          <h1 className="sg-display" style={{ fontSize: 'clamp(48px, 6vw, 80px)', margin: 0 }}>
            {filtered.length} <span style={{ color: 'var(--sg-accent)' }}>camps</span>.
          </h1>
          <div className="sg-mono" style={{ fontSize: 12, color: 'var(--sg-ink-60)' }}>
            WITHIN {filters.distance}KM · SEATTLE 98101
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '0 32px 24px', borderBottom: '1px solid var(--sg-ink-10)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Eyebrow style={{ marginRight: 8 }}>FILTER</Eyebrow>
          {Object.entries(SG_CAT_LABEL).map(([k, l]) => (
            <FilterChip key={k} active={filters.cats.includes(k)} onClick={() => toggleCat(k)}>{l}</FilterChip>
          ))}
          <div style={{ width: 1, height: 24, background: 'var(--sg-ink-20)', margin: '0 8px' }}/>
          {[
            { k: 'all', l: 'ANY' },
            { k: 'full-day', l: 'FULL DAY' },
            { k: 'half-day', l: 'HALF DAY' },
          ].map(s => (
            <FilterChip key={s.k} active={filters.schedule === s.k} onClick={() => setFilters(f => ({ ...f, schedule: s.k }))}>{s.l}</FilterChip>
          ))}
          <div style={{ width: 1, height: 24, background: 'var(--sg-ink-20)', margin: '0 8px' }}/>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 12px', border: '1px solid var(--sg-ink-20)', borderRadius: 999 }}>
            <Eyebrow>MAX $</Eyebrow>
            <input type="range" min="100" max="700" step="25" value={filters.priceMax}
              onChange={e => setFilters(f => ({ ...f, priceMax: parseInt(e.target.value) }))}
              style={{ width: 100, accentColor: 'var(--sg-accent)' }} />
            <span className="sg-mono" style={{ fontSize: 12, fontWeight: 600, minWidth: 40 }}>${filters.priceMax}</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 12px', border: '1px solid var(--sg-ink-20)', borderRadius: 999 }}>
            <Eyebrow>DIST KM</Eyebrow>
            <input type="range" min="5" max="50" value={filters.distance}
              onChange={e => setFilters(f => ({ ...f, distance: parseInt(e.target.value) }))}
              style={{ width: 100, accentColor: 'var(--sg-accent)' }} />
            <span className="sg-mono" style={{ fontSize: 12, fontWeight: 600, minWidth: 30 }}>{filters.distance}</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ padding: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {visible.map(c => (
            <DiscoverCard key={c.id} camp={c} onAdd={() => setAddModal(c.id)} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}>
          {visible.length < filtered.length ? (
            <SGButton variant="ghost" iconAfter="arrowDown" onClick={() => setPage(p => p + 1)}>
              LOAD MORE ({filtered.length - visible.length})
            </SGButton>
          ) : (
            <div className="sg-mono" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--sg-ink-60)' }}>
              END OF RESULTS · {filtered.length} CAMPS
            </div>
          )}
        </div>
      </div>

      {addModal && (
        <AddToGridModal
          camp={sgCampById(addModal)}
          children={children}
          onClose={() => setAddModal(null)}
          onAdd={(childId, weekIdx) => {
            setChildren(prev => prev.map(c =>
              c.id === childId ? { ...c, plan: { ...c.plan, [weekIdx]: { campId: addModal, status: 'INTERESTED' } } } : c
            ));
            setAddModal(null);
          }}
        />
      )}
    </div>
  );
};

const DiscoverCard = ({ camp, onAdd }) => {
  const [hover, setHover] = useState(false);
  return (
    <article onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      background: 'var(--sg-white)',
      border: '1px solid ' + (hover ? 'var(--sg-black)' : 'var(--sg-ink-10)'),
      transition: 'all var(--sg-dur-fast) var(--sg-ease)',
      transform: hover ? 'translateY(-2px)' : 'translateY(0)',
    }}>
      {/* Image */}
      <div style={{
        aspectRatio: '4/3', position: 'relative', overflow: 'hidden',
        background: SG_CAT_COLOR[camp.cat],
      }}>
        <image-slot id={`camp-${camp.id}`} placeholder={`PHOTO · ${camp.name}`}
          style={{ width: '100%', height: '100%', display: 'block' }} shape="rect"></image-slot>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(0deg, ${SG_CAT_COLOR[camp.cat]}cc 0%, transparent 60%)`, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: 14, left: 14 }}>
          <span style={{
            padding: '4px 10px', background: 'var(--sg-white)', color: 'var(--sg-black)',
            fontFamily: 'var(--sg-font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
            borderRadius: 999,
          }}>{SG_CAT_LABEL[camp.cat]}</span>
        </div>
        <div className="sg-display" style={{
          position: 'absolute', bottom: 14, left: 14, color: '#fff',
          fontSize: 32, lineHeight: 0.9, maxWidth: '85%',
        }}>
          {camp.name.split(' ').slice(0, 2).join(' ')}
        </div>
      </div>
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 18, lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
          {camp.name}
        </div>
        <p style={{ marginTop: 6, fontSize: 13, color: 'var(--sg-ink-60)', lineHeight: 1.4 }}>{camp.desc}</p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14,
          fontFamily: 'var(--sg-font-mono)', fontSize: 10.5, letterSpacing: '0.06em',
        }}>
          <div>
            <div style={{ color: 'var(--sg-ink-60)' }}>DIST</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{camp.distance}KM</div>
          </div>
          <div>
            <div style={{ color: 'var(--sg-ink-60)' }}>AGES</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{camp.age}</div>
          </div>
          <div>
            <div style={{ color: 'var(--sg-ink-60)' }}>OPEN</div>
            <div style={{ fontWeight: 600, marginTop: 2 }}>{camp.weeks.length}/10 WKS</div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--sg-ink-60)' }}>
              {camp.schedule === 'full-day' ? 'FULL DAY' : 'HALF DAY'}
            </div>
            <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 22, marginTop: 2 }}>${camp.price}<span style={{ color: 'var(--sg-ink-60)', fontSize: 12, fontFamily: 'var(--sg-font-mono)' }}>/WK</span></div>
          </div>
          <SGButton variant="primary" size="sm" onClick={onAdd}>ADD TO GRID</SGButton>
        </div>
      </div>
    </article>
  );
};

const AddToGridModal = ({ camp, children, onClose, onAdd }) => {
  const [childId, setChildId] = useState(children[0]?.id);
  const [weekIdx, setWeekIdx] = useState(camp.weeks[0]);
  const child = children.find(c => c.id === childId);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.5)', animation: 'sg-fade-in 200ms var(--sg-ease) both' }}/>
      <div style={{
        position: 'relative', background: 'var(--sg-white)', width: 560, maxWidth: '100%',
        animation: 'sg-fade-up 320ms var(--sg-ease) both',
      }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--sg-ink-10)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Eyebrow>ADD TO GRID</Eyebrow>
            <h2 className="sg-display" style={{ fontSize: 32, margin: '8px 0 0', textTransform: 'uppercase' }}>{camp.name}</h2>
            <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 4 }}>
              ${camp.price}/WK · {SG_CAT_LABEL[camp.cat]}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <SGIcon name="close" size={22}/>
          </button>
        </div>
        <div style={{ padding: 28, display: 'grid', gap: 24 }}>
          <div>
            <Eyebrow>WHICH KID</Eyebrow>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {children.map(c => (
                <button key={c.id} onClick={() => setChildId(c.id)} style={{
                  padding: '8px 14px 8px 8px', borderRadius: 999,
                  background: childId === c.id ? 'var(--sg-black)' : 'transparent',
                  color: childId === c.id ? 'var(--sg-white)' : 'var(--sg-black)',
                  border: '1px solid', borderColor: childId === c.id ? 'var(--sg-black)' : 'var(--sg-ink-20)',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
                  fontFamily: 'var(--sg-font-body)', fontSize: 14, fontWeight: 600,
                }}>
                  <ChildAvatar child={c} size={24}/>
                  {c.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Eyebrow>WHICH WEEK</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginTop: 12 }}>
              {SG_WEEKS.map(w => {
                const avail = camp.weeks.includes(w.idx);
                const filled = child?.plan[w.idx];
                return (
                  <button key={w.idx} disabled={!avail} onClick={() => setWeekIdx(w.idx)} style={{
                    padding: '10px 6px', textAlign: 'left',
                    background: weekIdx === w.idx ? 'var(--sg-accent)' : 'transparent',
                    color: weekIdx === w.idx ? '#fff' : (avail ? 'var(--sg-black)' : 'var(--sg-ink-40)'),
                    border: '1px solid', borderColor: weekIdx === w.idx ? 'var(--sg-accent)' : 'var(--sg-ink-20)',
                    cursor: avail ? 'pointer' : 'not-allowed',
                    opacity: avail ? 1 : 0.5,
                  }}>
                    <div className="sg-mono" style={{ fontSize: 11, fontWeight: 600 }}>{w.label}</div>
                    <div style={{ fontSize: 10, marginTop: 2 }}>{w.start}</div>
                    {filled && <div className="sg-mono" style={{ fontSize: 8, marginTop: 2, opacity: 0.7 }}>FILLED</div>}
                  </button>
                );
              })}
            </div>
            <div className="sg-mono" style={{ fontSize: 10.5, color: 'var(--sg-ink-60)', marginTop: 8, letterSpacing: '0.06em' }}>
              OPEN WEEKS ONLY · {camp.weeks.length} AVAILABLE
            </div>
          </div>
        </div>
        <div style={{ padding: '20px 28px', borderTop: '1px solid var(--sg-ink-10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sg-font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em',
            color: 'var(--sg-ink-60)',
          }}>CANCEL</button>
          <SGButton variant="primary" iconAfter="arrowR" onClick={() => onAdd(childId, weekIdx)}>
            ADD TO {child?.name.toUpperCase()} · {SG_WEEKS.find(w => w.idx === weekIdx).label}
          </SGButton>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { DiscoverScreen });
