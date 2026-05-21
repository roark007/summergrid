// SummerGrid — Landing page (6 sections)

const Landing = ({ onStart, hero, onJump }) => {
  return (
    <div style={{ background: 'var(--sg-white)' }}>
      <LandingNav onStart={onStart} onJump={onJump} />
      <HeroSection onStart={onStart} headlineChoice={hero} />
      <ProblemSection />
      <GridSection onStart={onStart} />
      <HowSection />
      <ProofSection />
      <FinalCTASection onStart={onStart} />
      <LandingFooter />
    </div>
  );
};

const LandingNav = ({ onStart, onJump }) => (
  <header style={{
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
    padding: '20px 32px', display: 'flex', alignItems: 'center',
    background: 'transparent', mixBlendMode: 'difference',
  }}>
    <SGWordmark size={20} color="#fff" accent="var(--sg-accent)" />
    <nav style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 32 }}>
      {[
        { l: 'THE GRID', k: 'grid' },
        { l: 'DISCOVER', k: 'discover' },
        { l: 'COORDINATE', k: 'coordinate' },
        { l: 'PRICING', k: null },
      ].map(it => (
        <a key={it.l} onClick={() => it.k && onJump?.(it.k)} style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: '#fff',
          cursor: it.k ? 'pointer' : 'default',
        }}>{it.l}</a>
      ))}
    </nav>
    <button onClick={onStart} style={{
      fontFamily: 'var(--sg-font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em',
      color: '#fff', background: 'transparent', border: '1.5px solid #fff', borderRadius: 999,
      padding: '8px 18px', cursor: 'pointer',
    }}>START FREE →</button>
  </header>
);

const LandingFooter = () => (
  <footer style={{ background: 'var(--sg-black)', color: 'var(--sg-white)', padding: '80px 48px 40px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, maxWidth: 1440, margin: '0 auto', marginBottom: 64 }}>
      <div>
        <SGWordmark size={28} color="#fff" />
        <p style={{ marginTop: 16, color: 'rgba(250,250,247,0.6)', maxWidth: 320, lineHeight: 1.6, fontSize: 14 }}>
          A planning operating system for parents managing kids' summer.
        </p>
      </div>
      {[
        { t: 'PRODUCT', l: ['The Grid', 'Discover', 'Coordinate', 'Calendar sync'] },
        { t: 'COMPANY', l: ['About', 'Careers', 'Press', 'Contact'] },
        { t: 'LEGAL', l: ['Terms', 'Privacy', 'Security'] },
      ].map(c => (
        <div key={c.t}>
          <div className="sg-eyebrow on-dark" style={{ marginBottom: 16 }}>{c.t}</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
            {c.l.map(x => <li key={x} style={{ fontSize: 14, color: 'rgba(250,250,247,0.7)' }}>{x}</li>)}
          </ul>
        </div>
      ))}
    </div>
    <div style={{ borderTop: '1px solid rgba(250,250,247,0.12)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1440, margin: '0 auto' }}>
      <div style={{ fontFamily: 'var(--sg-font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'rgba(250,250,247,0.5)' }}>
        © SUMMERGRID 2026 · MADE FOR PARENTS WHO PLAN
      </div>
      <div style={{ fontFamily: 'var(--sg-font-mono)', fontSize: 11, color: 'rgba(250,250,247,0.5)' }}>
        v1.0 · 12 WEEKS · ONE GRID
      </div>
    </div>
  </footer>
);

/* ============ HERO ============ */
const HEADLINES = {
  handled: ['SUMMER.', 'HANDLED.'],
  own: ['OWN', 'THE', 'SUMMER.'],
  twelve: ['TWELVE WEEKS.', 'ONE', 'PLAN.'],
};
const HeroSection = ({ onStart, headlineChoice = 'handled' }) => {
  const lines = HEADLINES[headlineChoice] || HEADLINES.handled;
  return (
    <section style={{
      position: 'relative', minHeight: '100vh', background: 'var(--sg-black)',
      color: 'var(--sg-white)', overflow: 'hidden',
      paddingTop: 80,
    }}>
      {/* Background photography slot */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
        <image-slot id="hero-bg" placeholder="HERO BACKDROP — drop a photo of summer light, kids in motion, or a coast"
          style={{ width: '100%', height: '100%', display: 'block', borderRadius: 0 }} shape="rect"></image-slot>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.7) 45%, rgba(10,10,10,0.4) 100%)' }}/>

      {/* Top-left badge */}
      <div style={{ position: 'absolute', top: 90, left: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Eyebrow onDark>SUMMER 2026 · PARENT OS</Eyebrow>
      </div>

      {/* Content */}
      <div style={{
        position: 'relative', padding: '120px 32px 64px',
        maxWidth: 1440, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 48,
        alignItems: 'center', minHeight: 'calc(100vh - 80px)',
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="sg-display" style={{
            margin: 0, fontSize: 'var(--sg-fs-display-xxl)',
            color: 'var(--sg-white)',
          }}>
            {lines.map((line, i) => (
              <div key={i} style={{ display: 'block' }}>
                {i === lines.length - 1 ? (
                  <span>{line.slice(0, -1)}<span style={{ color: 'var(--sg-accent)' }}>.</span></span>
                ) : line}
              </div>
            ))}
          </h1>
          <p style={{
            marginTop: 32, fontSize: 18, lineHeight: 1.5, fontWeight: 400,
            color: 'rgba(250,250,247,0.78)', maxWidth: 480,
          }}>
            Discover camps. Build a week-by-week plan. Coordinate with other parents. Done by April.
          </p>
          <div style={{
            marginTop: 40, display: 'flex', gap: 16, alignItems: 'center',
          }}>
            <SGButton variant="primary" size="lg" onClick={onStart} iconAfter="arrowR">
              START PLANNING
            </SGButton>
            <button onClick={() => document.getElementById('grid-section')?.scrollIntoView({ behavior: 'smooth' })} style={{
              background: 'transparent', border: 'none', color: 'var(--sg-white)', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
              borderBottom: '1px solid rgba(250,250,247,0.4)', padding: '6px 2px',
            }}>See the Grid</button>
          </div>

          {/* metric strip */}
          <div style={{
            marginTop: 80, display: 'flex', gap: 48,
          }}>
            {[
              { v: '10', l: 'WEEKS OF SUMMER' },
              { v: '4', l: 'PILLARS' },
              { v: '0', l: 'COMMISSION' },
            ].map(m => (
              <div key={m.l}>
                <div className="sg-mono" style={{ fontSize: 32, fontWeight: 600 }}>{m.v}</div>
                <div className="sg-eyebrow on-dark" style={{ marginTop: 4 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Grid preview */}
        <HeroGridPreview />
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        color: 'rgba(250,250,247,0.5)',
      }}>
        <div className="sg-eyebrow on-dark">SCROLL</div>
        <div style={{ width: 1, height: 32, background: 'rgba(250,250,247,0.3)' }}/>
      </div>
    </section>
  );
};

const HeroGridPreview = () => {
  // Mini grid mockup — 2 kids x 6 weeks
  const cells = [
    [
      { name: 'Tech Lab', status: 'REGISTERED', cat: 'stem' },
      { name: 'Tech Lab', status: 'REGISTERED', cat: 'stem' },
      null,
      { name: 'Trail Camp', status: 'REGISTERED', cat: 'outdoor' },
      { name: 'Trail Camp', status: 'REGISTERED', cat: 'outdoor' },
      { name: 'Sailing', status: 'WAITLIST', cat: 'water' },
    ],
    [
      { name: 'Soccer', status: 'REGISTERED', cat: 'sports' },
      { name: 'Painting', status: 'REGISTERED', cat: 'arts' },
      null,
      { name: 'Lakeshore', status: 'REGISTERED', cat: 'outdoor' },
      null,
      { name: 'Climbing', status: 'INTERESTED', cat: 'sports' },
    ],
  ];
  return (
    <div style={{
      background: 'var(--sg-white)', color: 'var(--sg-black)',
      padding: 24, position: 'relative',
      transform: 'perspective(2000px) rotateY(-6deg) rotateX(2deg)',
      transformStyle: 'preserve-3d', boxShadow: '0 40px 120px rgba(0,0,0,0.4)',
      maxWidth: 640, justifySelf: 'end',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Eyebrow>YOUR GRID · SUMMER 2026</Eyebrow>
        <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)' }}>$3,420 · 14/20 WEEKS</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(6, 1fr)', gap: 4 }}>
        <div></div>
        {['WK 24','WK 25','WK 26','WK 27','WK 28','WK 29'].map(w => (
          <div key={w} className="sg-mono" style={{ fontSize: 9, color: 'var(--sg-ink-60)', textAlign: 'center', padding: '4px 0' }}>{w}</div>
        ))}
        {cells.map((row, ri) => (
          <React.Fragment key={ri}>
            <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 14 }}>
              {ri === 0 ? 'MIRA' : 'THEO'}
            </div>
            {row.map((c, ci) => (
              <div key={ci} style={{
                aspectRatio: '1 / 1.1', minHeight: 56,
                background: c ? 'var(--sg-paper)' : 'transparent',
                border: c ? '1px solid var(--sg-ink-10)' : '1px dashed var(--sg-ink-20)',
                borderLeft: c ? `3px solid ${SG_CAT_COLOR[c.cat]}` : '1px dashed var(--sg-ink-20)',
                padding: 6, position: 'relative', overflow: 'hidden',
              }}>
                {c && (
                  <>
                    <div style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1.1, marginBottom: 4 }}>{c.name}</div>
                    <div className="sg-mono" style={{ fontSize: 7, letterSpacing: '0.05em', color: SG_STATUS[c.status].dot }}>
                      {c.status === 'INTERESTED' ? '○' : '●'} {c.status}
                    </div>
                  </>
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ============ PROBLEM ============ */
const ProblemSection = () => {
  const artifacts = [
    { rot: -6, top: '15%', left: '8%', w: 220, h: 280, kind: 'pdf', title: 'CAMP_BROCHURE_2026.PDF', sub: '14 pages · 4.2 MB' },
    { rot: 4, top: '40%', left: '22%', w: 180, h: 180, kind: 'sticky', title: 'Camp Reg\nopens Mar 4\nDON\'T FORGET', sub: '' },
    { rot: -3, top: '8%', left: '32%', w: 280, h: 200, kind: 'tab', title: 'best summer camps for 8 year olds near me — Google Search', sub: 'google.com/search' },
    { rot: 7, top: '52%', left: '5%', w: 260, h: 170, kind: 'email', title: 'Re: Re: Re: Sailing camp deposit', sub: 'mom@friendly-camp.org · 2 days ago' },
    { rot: -8, top: '60%', left: '38%', w: 200, h: 240, kind: 'sms', title: 'Hey can Theo come\nto soccer week\nof July 6?', sub: 'Hannah · iMessage' },
    { rot: 5, top: '20%', left: '52%', w: 300, h: 240, kind: 'calendar', title: 'JUNE', sub: 'wall calendar · pen marks' },
    { rot: -4, top: '55%', left: '55%', w: 220, h: 160, kind: 'sticky', title: 'wait LIST:\n- sailing\n- climbing\n- trail camp', sub: '' },
  ];
  return (
    <section style={{
      position: 'relative', background: 'var(--sg-paper)', color: 'var(--sg-black)',
      padding: '160px 32px', overflow: 'hidden', minHeight: '95vh',
    }}>
      {/* Mess of artifacts behind */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
        {artifacts.map((a, i) => (
          <ArtifactCard key={i} {...a} />
        ))}
      </div>

      <div style={{ position: 'relative', maxWidth: 1440, margin: '0 auto', zIndex: 2 }}>
        <Eyebrow>SECTION 02 · THE PROBLEM</Eyebrow>
        <h2 className="sg-display" style={{
          margin: '32px 0 0', fontSize: 'var(--sg-fs-display-l)',
          maxWidth: 1100, mixBlendMode: 'normal',
        }}>
          This is how<br/>
          most parents<br/>
          plan summer.
        </h2>
        <div style={{ display: 'flex', gap: 64, marginTop: 64, maxWidth: 900 }}>
          {[
            { n: '47', l: 'TABS OPEN' },
            { n: '12', l: 'PDF BROCHURES' },
            { n: '9', l: 'GROUP TEXTS' },
            { n: '3', l: 'STICKY NOTES LOST' },
          ].map(s => (
            <div key={s.l}>
              <div className="sg-mono" style={{ fontSize: 40, fontWeight: 600, color: 'var(--sg-accent)' }}>{s.n}</div>
              <div className="sg-eyebrow" style={{ marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ArtifactCard = ({ rot, top, left, w, h, kind, title, sub }) => {
  const base = {
    position: 'absolute', top, left,
    width: w, height: h, transform: `rotate(${rot}deg)`,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    padding: 16, display: 'flex', flexDirection: 'column',
    fontFamily: 'var(--sg-font-body)',
    fontSize: 12, lineHeight: 1.3,
  };
  const variants = {
    pdf: { background: '#fff', border: '1px solid var(--sg-ink-20)' },
    sticky: { background: '#FEE9A0', whiteSpace: 'pre-line', fontFamily: '"Comic Sans MS", "Caveat", cursive', fontSize: 17, color: '#3a2c00' },
    tab: { background: '#fff', padding: 0 },
    email: { background: '#fff', border: '1px solid var(--sg-ink-20)' },
    sms: { background: '#E5E5EA', borderRadius: 18, whiteSpace: 'pre-line' },
    calendar: { background: '#fff', border: '1px solid var(--sg-ink-20)' },
  };
  return (
    <div style={{ ...base, ...variants[kind] }}>
      {kind === 'pdf' && (
        <>
          <div className="sg-mono" style={{ fontSize: 9, color: 'var(--sg-ink-60)', letterSpacing: '0.1em' }}>PDF · A4</div>
          <div style={{ fontWeight: 700, marginTop: 8, fontSize: 11 }}>{title}</div>
          <div style={{ fontSize: 10, color: 'var(--sg-ink-60)', marginTop: 4 }}>{sub}</div>
          <div style={{ marginTop: 12, flex: 1, background: 'repeating-linear-gradient(0deg, var(--sg-ink-10) 0, var(--sg-ink-10) 1px, transparent 1px, transparent 8px)' }}/>
        </>
      )}
      {kind === 'sticky' && <div>{title}</div>}
      {kind === 'tab' && (
        <>
          <div style={{ background: '#F2F0EB', padding: '8px 12px', borderBottom: '1px solid var(--sg-ink-20)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: '#FF5F57' }}/>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: '#FEBC2E' }}/>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: '#28C840' }}/>
          </div>
          <div style={{ padding: 12, fontSize: 11 }}>
            <div style={{ background: 'var(--sg-paper)', padding: '4px 8px', borderRadius: 4, fontSize: 10, color: 'var(--sg-ink-60)', marginBottom: 8 }}>{sub}</div>
            <div style={{ fontWeight: 500, fontSize: 11, lineHeight: 1.3 }}>{title}</div>
          </div>
        </>
      )}
      {kind === 'email' && (
        <>
          <div className="sg-mono" style={{ fontSize: 9, color: 'var(--sg-ink-60)', letterSpacing: '0.08em' }}>INBOX</div>
          <div style={{ fontWeight: 600, marginTop: 8, fontSize: 12 }}>{title}</div>
          <div style={{ fontSize: 10, color: 'var(--sg-ink-60)', marginTop: 6 }}>{sub}</div>
        </>
      )}
      {kind === 'sms' && <div style={{ marginTop: 'auto' }}>{title}</div>}
      {kind === 'calendar' && (
        <>
          <div className="sg-display" style={{ fontSize: 24, color: 'var(--sg-ink-60)' }}>{title}</div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginTop: 8 }}>
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} style={{
                aspectRatio: '1', border: '1px solid var(--sg-ink-10)',
                fontSize: 8, padding: 2,
                background: [3, 8, 14, 22].includes(i) ? 'rgba(255,90,31,0.2)' : 'transparent',
                fontFamily: [3, 8, 14, 22].includes(i) ? '"Caveat", cursive' : 'var(--sg-font-mono)',
              }}>
                {[3, 8, 14].includes(i) ? '!' : i + 1}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ============ THE GRID SECTION ============ */
const GridSection = ({ onStart }) => (
  <section id="grid-section" style={{ background: 'var(--sg-white)', padding: '160px 32px 120px' }}>
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56 }}>
        <div>
          <Eyebrow>SECTION 03 · THE PRODUCT</Eyebrow>
          <h2 className="sg-display" style={{ margin: '24px 0 0', fontSize: 'var(--sg-fs-display-l)' }}>
            One grid.<br/>
            One <span style={{ color: 'var(--sg-accent)' }}>summer</span>.
          </h2>
        </div>
        <div style={{ fontFamily: 'var(--sg-font-body)', fontSize: 16, color: 'var(--sg-ink-60)', maxWidth: 380, lineHeight: 1.6 }}>
          Every week, every kid, in one view. Gaps become obvious. Plans get filled. Budget, status, and conflicts — visible.
        </div>
      </div>
      <BigGridMockup />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, marginTop: 64 }}>
        {[
          { n: '01', t: 'Every week, every kid, one view.', d: 'Two rows. Twelve weeks. Drag to fill. The whole summer at a glance.' },
          { n: '02', t: 'Gaps become obvious. Plans get filled.', d: 'Empty cells invite — they don\'t alarm. Click any week to see camps that fit.' },
          { n: '03', t: 'Budget, status, conflicts — visible.', d: 'Total spend, registrations pending, and scheduling collisions surface in real time.' },
        ].map(f => (
          <div key={f.n} style={{ borderTop: '1px solid var(--sg-black)', paddingTop: 20 }}>
            <div className="sg-mono" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--sg-accent)', marginBottom: 14 }}>{f.n}</div>
            <h3 style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 22, lineHeight: 1.1, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{f.t}</h3>
            <p style={{ marginTop: 12, color: 'var(--sg-ink-60)', fontSize: 14, lineHeight: 1.6 }}>{f.d}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const BigGridMockup = () => {
  // 2 kids × 10 weeks, more detail
  const weeks = SG_WEEKS;
  const mira = SG_INITIAL_CHILDREN[0];
  const theo = SG_INITIAL_CHILDREN[1];
  const RowCells = ({ child }) => (
    <>
      {weeks.map(w => {
        const cell = child.plan[w.idx];
        if (!cell) {
          return (
            <div key={w.idx} style={{
              minHeight: 110, border: '1px dashed var(--sg-ink-20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--sg-ink-40)', fontSize: 22, fontWeight: 300,
            }}>+</div>
          );
        }
        const camp = sgCampById(cell.campId);
        return (
          <div key={w.idx} style={{
            minHeight: 110, background: 'var(--sg-white)',
            border: '1px solid var(--sg-ink-10)',
            borderLeft: `3px solid ${SG_CAT_COLOR[camp.cat]}`,
            padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 12.5, lineHeight: 1.15, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{camp.name}</div>
              <div className="sg-mono" style={{ fontSize: 9.5, color: 'var(--sg-ink-60)' }}>
                {camp.schedule === 'full-day' ? 'FULL · ' : 'HALF · '}${camp.price}
              </div>
            </div>
            <StatusPill status={cell.status} small />
          </div>
        );
      })}
    </>
  );
  return (
    <div style={{ background: 'var(--sg-paper)', padding: 32, border: '1px solid var(--sg-ink-10)' }}>
      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--sg-ink-20)', marginBottom: 24 }}>
        <StatTile label="TOTAL SPEND" value="$3,420" accent />
        <StatTile label="WEEKS COVERED" value="14/20" hint="6 GAPS" />
        <StatTile label="PENDING" value="3" hint="WAITLISTS + INTEREST" />
        <StatTile label="CONFLICTS" value="0" />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(10, 1fr)', gap: 6 }}>
        <div></div>
        {weeks.map(w => (
          <div key={w.idx} style={{ padding: '6px 8px' }}>
            <div className="sg-mono" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em' }}>{w.label}</div>
            <div style={{ fontSize: 10, color: 'var(--sg-ink-60)' }}>{w.start}–{w.end}</div>
          </div>
        ))}
        {[mira, theo].map(child => (
          <React.Fragment key={child.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8 }}>
              <ChildAvatar child={child} size={36} />
              <div>
                <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 16, lineHeight: 1, textTransform: 'uppercase' }}>{child.name}</div>
                <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)' }}>AGE {child.age}</div>
              </div>
            </div>
            <RowCells child={child} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ============ HOW IT WORKS ============ */
const HowSection = () => {
  const steps = [
    { n: '01', t: 'DISCOVER', d: 'Find camps near you. Filter by age, type, schedule, price.', preview: 'discover' },
    { n: '02', t: 'PLAN', d: 'Drag camps onto your Grid. Cover the weeks that matter.', preview: 'plan' },
    { n: '03', t: 'COORDINATE', d: 'Invite other parents. See where your kids overlap. Sync the calendar.', preview: 'coord' },
  ];
  return (
    <section style={{ background: 'var(--sg-black)', color: 'var(--sg-white)', padding: '160px 32px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <Eyebrow onDark>SECTION 04 · HOW IT WORKS</Eyebrow>
        <h2 className="sg-display" style={{ margin: '24px 0 96px', fontSize: 'var(--sg-fs-display-l)', maxWidth: 900 }}>
          Three<br/>movements.
        </h2>
        <div style={{ display: 'grid', gap: 80 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ display: 'grid', gridTemplateColumns: '0.4fr 1fr 1.2fr', gap: 48, alignItems: 'center', borderTop: '1px solid rgba(250,250,247,0.15)', paddingTop: 48 }}>
              <div className="sg-mono" style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--sg-accent)' }}>STEP {s.n}</div>
              <div>
                <h3 className="sg-display" style={{ fontSize: 72, margin: 0 }}>{s.t}</h3>
                <p style={{ marginTop: 20, color: 'rgba(250,250,247,0.7)', fontSize: 18, lineHeight: 1.5, maxWidth: 400 }}>{s.d}</p>
              </div>
              <HowPreview kind={s.preview} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowPreview = ({ kind }) => {
  if (kind === 'discover') {
    return (
      <div style={{ background: 'var(--sg-white)', color: 'var(--sg-black)', padding: 20 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ padding: '4px 10px', background: 'var(--sg-black)', color: 'var(--sg-white)', fontSize: 11, fontFamily: 'var(--sg-font-mono)', letterSpacing: '0.06em', borderRadius: 999 }}>AGES 8-14</span>
          <span style={{ padding: '4px 10px', border: '1px solid var(--sg-ink-20)', fontSize: 11, fontFamily: 'var(--sg-font-mono)', letterSpacing: '0.06em', borderRadius: 999 }}>WATER</span>
          <span style={{ padding: '4px 10px', border: '1px solid var(--sg-ink-20)', fontSize: 11, fontFamily: 'var(--sg-font-mono)', letterSpacing: '0.06em', borderRadius: 999 }}>FULL DAY</span>
          <span style={{ padding: '4px 10px', border: '1px solid var(--sg-ink-20)', fontSize: 11, fontFamily: 'var(--sg-font-mono)', letterSpacing: '0.06em', borderRadius: 999 }}>≤ $500</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[SG_CAMPS[0], SG_CAMPS[10]].map(c => (
            <div key={c.id} style={{ border: '1px solid var(--sg-ink-10)' }}>
              <div style={{ aspectRatio: '4/3', background: SG_CAT_COLOR[c.cat], position: 'relative' }}>
                <div className="sg-display" style={{ position: 'absolute', bottom: 12, left: 12, color: 'var(--sg-white)', fontSize: 28, opacity: 0.9 }}>{SG_CAT_LABEL[c.cat]}</div>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 14, lineHeight: 1.15, textTransform: 'uppercase' }}>{c.name}</div>
                <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', marginTop: 6 }}>
                  {c.distance}KM · ${c.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === 'plan') {
    return (
      <div style={{ background: 'var(--sg-white)', color: 'var(--sg-black)', padding: 20, position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              aspectRatio: '1', border: i === 2 ? '2px solid var(--sg-accent)' : '1px dashed var(--sg-ink-20)',
              background: i === 0 || i === 3 ? 'var(--sg-paper)' : 'transparent',
              borderLeft: (i === 0 || i === 3) ? `3px solid ${SG_CAT_COLOR.outdoor}` : undefined,
              position: 'relative',
            }}>
              {(i === 0 || i === 3) && (
                <div style={{ position: 'absolute', top: 8, left: 8, right: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.1 }}>TRAIL CAMP</div>
                  <div className="sg-mono" style={{ fontSize: 8, color: 'var(--sg-ink-60)', marginTop: 4 }}>WK 27</div>
                </div>
              )}
              {i === 2 && (
                <div style={{
                  position: 'absolute', inset: 8, background: 'var(--sg-accent)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 13,
                  animation: 'sg-settle 600ms var(--sg-ease) infinite alternate',
                }}>DROP</div>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontFamily: 'var(--sg-font-mono)', fontSize: 11, color: 'var(--sg-ink-60)' }}>
          ↓ DRAGGING: SAILING ACADEMY → MIRA · WK 27
        </div>
      </div>
    );
  }
  // coord
  return (
    <div style={{ background: 'var(--sg-white)', color: 'var(--sg-black)', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: '#D8388E', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>HL</div>
        <div>
          <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase' }}>Hannah Liu</div>
          <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)' }}>3 OVERLAPPING WEEKS</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ aspectRatio: '1.2/1', background: (i === 1 || i === 2) ? 'var(--sg-accent)' : 'var(--sg-paper)', position: 'relative' }}>
            {(i === 1 || i === 2) && (
              <div style={{ position: 'absolute', inset: 0, color: '#fff', padding: 6, fontSize: 9, fontWeight: 600 }}>
                BOTH @<br/>TECH LAB
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, fontFamily: 'var(--sg-font-mono)', fontSize: 11, color: 'var(--sg-ink-60)' }}>MIRA + WREN · OVERLAP WEEKS 25–26</div>
    </div>
  );
};

/* ============ PROOF ============ */
const ProofSection = () => (
  <section style={{ background: 'var(--sg-paper)', padding: '160px 32px' }}>
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      <Eyebrow>SECTION 05 · WHO IT'S FOR</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, marginTop: 48 }}>
        {[
          'Built for parents who don\'t have a personal assistant.',
          'Designed around real summer logistics.',
          'Never miss a registration window again.',
        ].map((q, i) => (
          <blockquote key={i} style={{ margin: 0, borderLeft: '3px solid var(--sg-accent)', paddingLeft: 24 }}>
            <div className="sg-mono" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--sg-ink-60)' }}>0{i+1}</div>
            <p style={{
              marginTop: 12,
              fontFamily: 'var(--sg-font-display)', fontWeight: 800,
              fontSize: 28, lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '-0.02em',
            }}>{q}</p>
          </blockquote>
        ))}
      </div>
    </div>
  </section>
);

/* ============ FINAL CTA ============ */
const FinalCTASection = ({ onStart }) => (
  <section style={{
    background: 'var(--sg-black)', color: 'var(--sg-white)',
    padding: '160px 32px', textAlign: 'center', position: 'relative',
    minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
  }}>
    <Eyebrow onDark>SECTION 06 · DO IT</Eyebrow>
    <h2 className="sg-display" style={{
      margin: '32px 0 0', fontSize: 'var(--sg-fs-display-xl)',
    }}>
      Build your<br/>
      <span style={{ color: 'var(--sg-accent)' }}>summer</span>.
    </h2>
    <div style={{ marginTop: 56, display: 'flex', justifyContent: 'center', gap: 16 }}>
      <SGButton variant="primary" size="lg" onClick={onStart} iconAfter="arrowR">
        START PLANNING
      </SGButton>
    </div>
    <div className="sg-mono" style={{ marginTop: 24, fontSize: 11, letterSpacing: '0.1em', color: 'rgba(250,250,247,0.5)' }}>
      FREE WHILE IN BETA · NO CREDIT CARD · 8 MINUTES TO YOUR FIRST GRID
    </div>
  </section>
);

Object.assign(window, { Landing });
