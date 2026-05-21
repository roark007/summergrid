// SummerGrid v2 — Onboarding flow (post-signup, Clerk-style entry)
// Steps: Welcome → Partner (email invite) → Kids → Camps (+ deadlines) → Done

const ONB_STEPS = ['welcome', 'partner', 'kids', 'camps', 'done'];

const Onboarding = ({ onFinish, onCancel }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const step = ONB_STEPS[stepIdx];

  // Onboarding state (kept local — the grand grid keeps its own demo data)
  const [me] = useState({ name: 'Jordan Sato', initials: 'JS', color: '#FF5A1F' });
  const [partner, setPartner] = useState({ hasPartner: null, name: '', email: '', invited: false });
  const [kids, setKids] = useState([{ id: 'k1', name: '', age: '' }]);
  const [camps, setCamps] = useState([
    { id: 'cm1', name: '', weekIdx: 1, kidIds: [], deadline: '', knownDeadline: null },
  ]);

  const next = () => setStepIdx(i => Math.min(i + 1, ONB_STEPS.length - 1));
  const back = () => setStepIdx(i => Math.max(i - 1, 0));

  return (
    <div style={{ background: 'var(--sg-white)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <OnbHeader stepIdx={stepIdx} onCancel={onCancel}/>

      <main className="sg-onb-shell" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 32px 80px' }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          {step === 'welcome' && <StepWelcome me={me} onNext={next}/>}
          {step === 'partner' && <StepPartner me={me} partner={partner} setPartner={setPartner} onNext={next} onBack={back}/>}
          {step === 'kids' && <StepKids kids={kids} setKids={setKids} onNext={next} onBack={back}/>}
          {step === 'camps' && <StepCamps camps={camps} setCamps={setCamps} kids={kids} onNext={next} onBack={back}/>}
          {step === 'done' && <StepDone me={me} partner={partner} kids={kids} camps={camps} onFinish={onFinish}/>}
        </div>
      </main>
    </div>
  );
};

/* ============ Header (logo + progress) ============ */
const OnbHeader = ({ stepIdx, onCancel }) => {
  const total = ONB_STEPS.length;
  return (
    <header className="sg-onb-header" style={{
      borderBottom: '1px solid var(--sg-ink-10)', padding: '0 32px', height: 64,
      display: 'flex', alignItems: 'center', gap: 24,
      position: 'sticky', top: 0, background: 'var(--sg-white)', zIndex: 10,
    }}>
      <Wordmark size={18}/>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            height: 3, flex: '0 0 36px', borderRadius: 999,
            background: i <= stepIdx ? 'var(--sg-black)' : 'var(--sg-ink-10)',
            transition: 'background var(--sg-dur-fast) var(--sg-ease)',
          }}/>
        ))}
        <span className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--sg-ink-60)', marginLeft: 12 }}>
          STEP {Math.min(stepIdx + 1, total)} / {total}
        </span>
      </div>
      <button onClick={onCancel} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontFamily: 'var(--sg-font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--sg-ink-60)',
      }}>CANCEL</button>
    </header>
  );
};

/* ============ Step UI bits ============ */
const StepTitle = ({ eyebrow, children, sub }) => (
  <div style={{ marginBottom: 48, paddingBottom: 8 }}>
    <Eyebrow>{eyebrow}</Eyebrow>
    <h1 className="sg-display" style={{ fontSize: 'clamp(40px, 6vw, 76px)', margin: '16px 0 0', maxWidth: '14ch', paddingBottom: 8 }}>
      {children}
    </h1>
    {sub && <p style={{ marginTop: 24, fontSize: 17, lineHeight: 1.5, color: 'var(--sg-ink-60)', maxWidth: 560 }}>{sub}</p>}
  </div>
);

const StepFooter = ({ onBack, onNext, nextLabel = 'CONTINUE', nextDisabled, secondary }) => (
  <div style={{
    marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--sg-ink-10)',
    display: 'flex', alignItems: 'center', gap: 12,
  }}>
    {onBack && (
      <Button variant="ghost" icon="arrowL" onClick={onBack}>BACK</Button>
    )}
    <div style={{ flex: 1 }}/>
    {secondary}
    <Button variant="primary" iconAfter="arrowR" onClick={onNext} disabled={nextDisabled}
      style={{ opacity: nextDisabled ? 0.4 : 1 }}>
      {nextLabel}
    </Button>
  </div>
);

/* ============ Step 1: Welcome ============ */
const StepWelcome = ({ me, onNext }) => (
  <div>
    <StepTitle eyebrow={`WELCOME, ${me.name.split(' ')[0].toUpperCase()}`} sub="Three quick steps and your group is on the board. Skip anything you don't have yet — you can always come back.">
      Let's build your<br/>
      <span style={{ color: 'var(--sg-accent)' }}>summer crew.</span>
    </StepTitle>

    <div style={{ display: 'grid', gap: 12, maxWidth: 540 }}>
      {[
        { n: '01', t: 'Add your partner', d: 'If you co-parent, invite them by email. They get the same view, edit anything.' },
        { n: '02', t: 'Add your kids', d: 'Names and ages. They become rows on the grid.' },
        { n: '03', t: 'Add a few camps', d: 'Plus the registration deadline — so other parents know when to sign up.' },
      ].map(s => (
        <div key={s.n} style={{ display: 'flex', gap: 20, padding: '20px 0', borderBottom: '1px solid var(--sg-ink-10)' }}>
          <div className="sg-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--sg-accent)', letterSpacing: '0.08em', flex: '0 0 32px' }}>{s.n}</div>
          <div>
            <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{s.t}</div>
            <div style={{ fontSize: 14, color: 'var(--sg-ink-60)', marginTop: 4, lineHeight: 1.5 }}>{s.d}</div>
          </div>
        </div>
      ))}
    </div>

    <StepFooter onNext={onNext} nextLabel="LET'S GO"/>
  </div>
);

/* ============ Step 2: Partner ============ */
const StepPartner = ({ me, partner, setPartner, onNext, onBack }) => {
  const yes = partner.hasPartner === true;
  const no = partner.hasPartner === false;

  const sendInvite = () => {
    if (!partner.email.trim()) return;
    // Mock: derive a name from email if not provided
    const derived = partner.name.trim() || (partner.email.split('@')[0].split(/[._]/)[0].charAt(0).toUpperCase() + partner.email.split('@')[0].split(/[._]/)[0].slice(1));
    setPartner({ ...partner, name: derived, invited: true });
  };

  const canContinue = no || partner.invited || !partner.email;

  return (
    <div>
      <StepTitle eyebrow="STEP 01 · PARTNER">
        Anyone else helping<br/>
        run summer?
      </StepTitle>

      {partner.hasPartner === null && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 540 }}>
          <ChoiceCard
            label="YES, I HAVE A PARTNER"
            sub="Co-parent, partner, or anyone sharing pickups. They'll get an invite."
            onClick={() => setPartner({ ...partner, hasPartner: true })}
          />
          <ChoiceCard
            label="JUST ME FOR NOW"
            sub="You can always add a partner later from the group settings."
            onClick={() => setPartner({ ...partner, hasPartner: false })}
          />
        </div>
      )}

      {yes && (
        <div style={{ display: 'grid', gap: 24, maxWidth: 520 }}>
          {/* Family preview */}
          <div style={{ padding: 20, background: 'var(--sg-paper)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar parent={{ initials: me.initials, color: me.color, name: me.name }} size={40}/>
              {partner.invited && (
                <div style={{ marginLeft: -10 }}>
                  <Avatar parent={{ initials: (partner.name || partner.email)[0].toUpperCase() + (partner.name[1] || '').toUpperCase(), color: '#D81B60', name: partner.name }} size={40}/>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--sg-ink-60)' }}>YOUR FAMILY</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
                {me.name.split(' ')[0]}
                {partner.invited ? <> &nbsp;·&nbsp; {partner.name} <span className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-accent)', marginLeft: 6, letterSpacing: '0.06em' }}>INVITED</span></> : <> &nbsp;·&nbsp; <span style={{ color: 'var(--sg-ink-40)', fontWeight: 400 }}>waiting on partner</span></>}
              </div>
            </div>
          </div>

          {!partner.invited && (
            <>
              <Field label="PARTNER'S NAME (OPTIONAL)">
                <InputBox value={partner.name} onChange={e => setPartner({ ...partner, name: e.target.value })} placeholder="Richard"/>
              </Field>
              <Field label="PARTNER'S EMAIL">
                <InputBox type="email" value={partner.email} onChange={e => setPartner({ ...partner, email: e.target.value })} placeholder="richard@example.com"/>
              </Field>
              <div>
                <Button variant="accent" iconAfter="arrowR" onClick={sendInvite} disabled={!partner.email.trim()}
                  style={{ opacity: !partner.email.trim() ? 0.4 : 1 }}>
                  SEND INVITE
                </Button>
                <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', marginTop: 10, letterSpacing: '0.06em' }}>
                  THEY'LL GET AN EMAIL · CAN JOIN INSTANTLY · NO ACCOUNT SETUP REQUIRED
                </div>
              </div>
            </>
          )}

          {partner.invited && (
            <div style={{ padding: 20, background: 'var(--sg-accent-soft)', borderLeft: '3px solid var(--sg-accent)' }}>
              <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--sg-accent-deep)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="check" size={12} stroke={2.5}/> INVITE SENT
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                {partner.name || 'Your partner'} will get an email at <strong>{partner.email}</strong> with a link to join your grid. They can add kids and camps too.
              </div>
              <button onClick={() => setPartner({ ...partner, invited: false, email: '', name: '' })} style={{
                marginTop: 12, background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--sg-font-mono)', fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.08em',
              }}>UNDO · USE A DIFFERENT EMAIL</button>
            </div>
          )}
        </div>
      )}

      {no && (
        <div style={{ padding: 20, background: 'var(--sg-paper)', maxWidth: 520 }}>
          <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--sg-ink-60)' }}>SOLO ACCOUNT</div>
          <div style={{ fontSize: 15, marginTop: 6, lineHeight: 1.5 }}>
            No problem. You can invite a co-parent any time from the group menu.
          </div>
          <button onClick={() => setPartner({ ...partner, hasPartner: null })} style={{
            marginTop: 12, background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sg-font-mono)', fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.08em',
          }}>CHANGE MY MIND</button>
        </div>
      )}

      <StepFooter
        onBack={onBack}
        onNext={onNext}
        nextDisabled={partner.hasPartner === null || (yes && !partner.invited)}
        nextLabel={yes && !partner.invited ? 'INVITE FIRST' : 'CONTINUE'}
      />
    </div>
  );
};

const ChoiceCard = ({ label, sub, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left', padding: 20, cursor: 'pointer',
        background: hover ? 'var(--sg-black)' : 'var(--sg-white)',
        color: hover ? 'var(--sg-white)' : 'var(--sg-black)',
        border: '1px solid ' + (hover ? 'var(--sg-black)' : 'var(--sg-ink-20)'),
        transition: 'all var(--sg-dur-fast) var(--sg-ease)',
        fontFamily: 'inherit',
      }}>
      <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{label}</div>
      <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.4, color: hover ? 'rgba(255,255,255,0.7)' : 'var(--sg-ink-60)' }}>{sub}</div>
    </button>
  );
};

/* ============ Step 3: Kids ============ */
const StepKids = ({ kids, setKids, onNext, onBack }) => {
  const update = (id, patch) => setKids(prev => prev.map(k => k.id === id ? { ...k, ...patch } : k));
  const add = () => setKids(prev => [...prev, { id: 'k' + Date.now(), name: '', age: '' }]);
  const remove = (id) => setKids(prev => prev.filter(k => k.id !== id));

  const valid = kids.filter(k => k.name.trim().length > 0);

  return (
    <div>
      <StepTitle eyebrow="STEP 02 · KIDS" sub="Each kid becomes a row on the grid. Ages help you pick age-appropriate camps later.">
        Who are we<br/>planning for?
      </StepTitle>

      <div style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
        {kids.map((k, i) => (
          <div key={k.id} style={{
            display: 'grid', gridTemplateColumns: '32px 1fr 92px 36px', gap: 12, alignItems: 'center',
            padding: 12, background: 'var(--sg-paper)',
          }}>
            <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)', letterSpacing: '0.08em', textAlign: 'center' }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <InputBox placeholder="First name" value={k.name} onChange={e => update(k.id, { name: e.target.value })}/>
            <InputBox type="number" min="1" max="18" placeholder="Age" value={k.age} onChange={e => update(k.id, { age: e.target.value })}/>
            <button onClick={() => kids.length > 1 && remove(k.id)} disabled={kids.length <= 1}
              style={{ background: 'transparent', border: 'none', cursor: kids.length > 1 ? 'pointer' : 'not-allowed', opacity: kids.length > 1 ? 1 : 0.3, color: 'var(--sg-ink-60)' }}>
              <Icon name="close" size={16}/>
            </button>
          </div>
        ))}
        <button onClick={add} style={{
          marginTop: 4, padding: '14px 16px', background: 'transparent',
          border: '1px dashed var(--sg-ink-20)', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 10, color: 'var(--sg-ink-60)',
          fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
        }}>
          <Icon name="plus" size={14} stroke={2}/> ADD ANOTHER KID
        </button>
      </div>

      <StepFooter
        onBack={onBack}
        onNext={onNext}
        nextDisabled={valid.length === 0}
        nextLabel={valid.length === 0 ? 'NEED AT LEAST ONE' : `CONTINUE WITH ${valid.length} KID${valid.length > 1 ? 'S' : ''}`}
      />
    </div>
  );
};

/* ============ Step 4: Camps ============ */
const StepCamps = ({ camps, setCamps, kids, onNext, onBack }) => {
  const validKids = kids.filter(k => k.name.trim());
  const update = (id, patch) => setCamps(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  const add = () => setCamps(prev => [...prev, { id: 'cm' + Date.now(), name: '', weekIdx: 1, kidIds: [], deadline: '', knownDeadline: null }]);
  const remove = (id) => setCamps(prev => prev.filter(c => c.id !== id));

  const valid = camps.filter(c => c.name.trim());

  return (
    <div>
      <StepTitle eyebrow="STEP 03 · CAMPS" sub="Add what you've got so far — even ideas you're considering. Skip what you don't know.">
        What camps<br/>are you eyeing?
      </StepTitle>

      <div style={{ display: 'grid', gap: 16 }}>
        {camps.map((c, i) => (
          <CampForm
            key={c.id}
            camp={c}
            index={i}
            kids={validKids}
            onChange={(patch) => update(c.id, patch)}
            onRemove={() => camps.length > 1 && remove(c.id)}
            canRemove={camps.length > 1}
          />
        ))}
        <button onClick={add} style={{
          padding: '16px 20px', background: 'transparent',
          border: '1px dashed var(--sg-ink-20)', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 10, color: 'var(--sg-ink-60)',
          fontSize: 13, fontWeight: 500,
        }}>
          <Icon name="plus" size={14} stroke={2}/> ADD ANOTHER CAMP
        </button>
      </div>

      <StepFooter
        onBack={onBack}
        onNext={onNext}
        nextLabel={valid.length === 0 ? 'SKIP FOR NOW' : `ADD ${valid.length} CAMP${valid.length > 1 ? 'S' : ''}`}
        secondary={valid.length > 0 ? null : (
          <span className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>OPTIONAL — YOU CAN ADD LATER</span>
        )}
      />
    </div>
  );
};

const CampForm = ({ camp, index, kids, onChange, onRemove, canRemove }) => {
  const toggleKid = (kidId) => {
    const set = new Set(camp.kidIds);
    if (set.has(kidId)) set.delete(kidId); else set.add(kidId);
    onChange({ kidIds: [...set] });
  };
  return (
    <div style={{
      padding: 20, background: 'var(--sg-paper)', display: 'grid', gap: 16,
      border: '1px solid var(--sg-ink-10)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-accent)', letterSpacing: '0.08em', fontWeight: 600 }}>
          CAMP {String(index + 1).padStart(2, '0')}
        </div>
        <div style={{ flex: 1 }}/>
        {canRemove && (
          <button onClick={onRemove} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--sg-ink-60)' }}>
            <Icon name="close" size={16}/>
          </button>
        )}
      </div>

      <Field label="CAMP NAME">
        <InputBox placeholder="e.g. Cascadia Tech Lab" value={camp.name} onChange={e => onChange({ name: e.target.value })}/>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="WEEK">
          <select value={camp.weekIdx} onChange={e => onChange({ weekIdx: +e.target.value })}
            style={{ padding: '12px 14px', borderRadius: 4, border: '1px solid var(--sg-ink-20)', background: 'var(--sg-white)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }}>
            {WEEKS.map(w => <option key={w.idx} value={w.idx}>{w.label} · {w.start}</option>)}
          </select>
        </Field>
        <Field label="WHICH KIDS">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignContent: 'center', minHeight: 46 }}>
            {kids.length === 0 && <span className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>ADD KIDS FIRST</span>}
            {kids.map(k => {
              const active = camp.kidIds.includes(k.id);
              return (
                <button key={k.id} onClick={() => toggleKid(k.id)} style={{
                  padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
                  background: active ? 'var(--sg-black)' : 'var(--sg-white)',
                  color: active ? 'var(--sg-white)' : 'var(--sg-black)',
                  border: '1px solid ' + (active ? 'var(--sg-black)' : 'var(--sg-ink-20)'),
                  fontSize: 12, fontWeight: 600,
                }}>{k.name}</button>
              );
            })}
          </div>
        </Field>
      </div>

      {/* Deadline — the star of this step */}
      <div style={{ padding: 14, background: 'var(--sg-white)', border: '1px solid var(--sg-ink-10)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Icon name="calendar" size={14} style={{ color: 'var(--sg-accent)' }}/>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registration deadline</div>
          <div style={{ flex: 1 }}/>
          <span className="sg-mono" style={{ fontSize: 9.5, color: 'var(--sg-accent)', letterSpacing: '0.06em' }}>VISIBLE TO YOUR GROUP</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--sg-ink-60)', lineHeight: 1.5, marginBottom: 12 }}>
          Camps fill up fast. If you know when sign-ups close, drop it here — the whole group sees it on the grid so nobody misses the window.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => onChange({ knownDeadline: true })} style={chipStyle(camp.knownDeadline === true)}>I KNOW THE DEADLINE</button>
          <button onClick={() => onChange({ knownDeadline: false, deadline: '' })} style={chipStyle(camp.knownDeadline === false)}>NOT SURE YET</button>
          <button onClick={() => onChange({ knownDeadline: 'registered', deadline: '' })} style={chipStyle(camp.knownDeadline === 'registered')}>ALREADY REGISTERED</button>
        </div>
        {camp.knownDeadline === true && (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
            <InputBox placeholder="e.g. Jun 1, 2026 or 06/01" value={camp.deadline} onChange={e => onChange({ deadline: e.target.value })}/>
            {camp.deadline && (
              <span className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--sg-accent-deep)' }}>
                <Icon name="check" size={11} stroke={2.5} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }}/>
                ADDED
              </span>
            )}
          </div>
        )}
        {camp.knownDeadline === false && (
          <div className="sg-mono" style={{ marginTop: 10, fontSize: 10.5, color: 'var(--sg-ink-60)', letterSpacing: '0.04em' }}>
            NO PROBLEM. THE GRID WILL FLAG THIS CAMP AS "DEADLINE TBD" SO SOMEONE IN THE GROUP CAN FILL IT IN.
          </div>
        )}
      </div>
    </div>
  );
};

const chipStyle = (active) => ({
  padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--sg-font-mono)',
  background: active ? 'var(--sg-black)' : 'var(--sg-white)',
  color: active ? 'var(--sg-white)' : 'var(--sg-black)',
  border: '1px solid ' + (active ? 'var(--sg-black)' : 'var(--sg-ink-20)'),
  fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em',
});

/* ============ Step 5: Done ============ */
const StepDone = ({ me, partner, kids, camps, onFinish }) => {
  const validKids = kids.filter(k => k.name.trim());
  const validCamps = camps.filter(c => c.name.trim());
  const withDeadline = validCamps.filter(c => c.deadline);

  return (
    <div>
      <StepTitle eyebrow="ALL SET">
        Your grid is<br/>
        <span style={{ color: 'var(--sg-accent)' }}>live.</span>
      </StepTitle>

      <div style={{ display: 'grid', gap: 16, maxWidth: 560, marginBottom: 32 }}>
        <SummaryRow icon="users" label="FAMILY">
          {me.name.split(' ')[0]}{partner.invited && <>  &nbsp;·&nbsp; {partner.name} <span className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-accent)', marginLeft: 6, letterSpacing: '0.06em' }}>INVITED</span></>}
        </SummaryRow>
        <SummaryRow icon="users" label={`${validKids.length} KID${validKids.length === 1 ? '' : 'S'}`}>
          {validKids.length > 0 ? validKids.map(k => `${k.name}${k.age ? ' (' + k.age + ')' : ''}`).join(' · ') : <span style={{ color: 'var(--sg-ink-40)' }}>add later</span>}
        </SummaryRow>
        <SummaryRow icon="calendar" label={`${validCamps.length} CAMP${validCamps.length === 1 ? '' : 'S'}`}>
          {validCamps.length > 0 ? validCamps.map(c => c.name).join(' · ') : <span style={{ color: 'var(--sg-ink-40)' }}>add later</span>}
        </SummaryRow>
        {withDeadline.length > 0 && (
          <div style={{ padding: 16, background: 'var(--sg-accent-soft)', borderLeft: '3px solid var(--sg-accent)' }}>
            <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--sg-accent-deep)', marginBottom: 6 }}>
              <Icon name="calendar" size={11} stroke={2.5} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }}/>
              {withDeadline.length} DEADLINE{withDeadline.length > 1 ? 'S' : ''} ON THE BOARD
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
              The group sees a "REGISTER BY" pill on these camps and a heads-up at the top of the grid. No one misses sign-up day.
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 14, color: 'var(--sg-ink-60)', marginBottom: 24, lineHeight: 1.6, maxWidth: 560 }}>
        Next up: invite other parents from the grid. They land in your group, add their kids, and you can start coordinating pickups day by day.
      </div>

      <Button variant="accent" size="lg" iconAfter="arrowR" onClick={onFinish}>OPEN MY GRID</Button>
    </div>
  );
};

const SummaryRow = ({ icon, label, children }) => (
  <div style={{ padding: '16px 18px', background: 'var(--sg-paper)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
    <Icon name={icon} size={16} style={{ color: 'var(--sg-ink-60)', marginTop: 2 }}/>
    <div style={{ flex: 1 }}>
      <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--sg-ink-60)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500 }}>{children}</div>
    </div>
  </div>
);

Object.assign(window, { Onboarding });
