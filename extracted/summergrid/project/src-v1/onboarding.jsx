// SummerGrid — Auth + 4-step Onboarding

/* ============ AUTH ============ */
const AuthScreen = ({ onSignIn, onBack }) => {
  const [mode, setMode] = useState('signup');
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr',
      background: 'var(--sg-white)',
    }}>
      {/* Left: form */}
      <div style={{ padding: '48px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div onClick={onBack} style={{ cursor: 'pointer' }}>
              <SGWordmark size={20} />
            </div>
            <div className="sg-mono" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--sg-ink-60)' }}>
              {mode === 'signup' ? 'NEW' : 'WELCOME BACK'} · 60 SECONDS
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 440, width: '100%' }}>
          <Eyebrow>{mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}</Eyebrow>
          <h1 className="sg-display" style={{ fontSize: 'var(--sg-fs-display-m)', margin: '16px 0 32px' }}>
            {mode === 'signup' ? <>Take<br/>summer.</> : <>Back to<br/>the grid.</>}
          </h1>
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Email" placeholder="you@home.com" type="email" />
            <Field label="Password" placeholder="••••••••" type="password" />
            {mode === 'signup' && <Field label="What should we call you?" placeholder="Jordan" />}
          </div>
          <SGButton variant="primary" size="lg" style={{ marginTop: 24, width: '100%' }} onClick={onSignIn} iconAfter="arrowR">
            {mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </SGButton>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--sg-ink-20)' }}/>
            <span style={{ fontFamily: 'var(--sg-font-mono)', fontSize: 11, color: 'var(--sg-ink-60)', letterSpacing: '0.08em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--sg-ink-20)' }}/>
          </div>
          <button onClick={onSignIn} style={{
            width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '14px 22px', borderRadius: 999, border: '1.5px solid var(--sg-ink-20)',
            background: 'transparent', cursor: 'pointer', fontFamily: 'var(--sg-font-body)',
            fontSize: 15, fontWeight: 600,
          }}>
            <SGIcon name="google" size={18} stroke={0} />
            CONTINUE WITH GOOGLE
          </button>
          <div style={{ marginTop: 28, fontSize: 14, color: 'var(--sg-ink-60)' }}>
            {mode === 'signup' ? 'Already have an account? ' : 'New here? '}
            <button onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--sg-black)',
              borderBottom: '1px solid var(--sg-black)', padding: 0,
            }}>{mode === 'signup' ? 'Sign in' : 'Create one'}</button>
          </div>
        </div>
        <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--sg-ink-60)' }}>
          BY CONTINUING YOU AGREE TO THE TERMS AND PRIVACY POLICY.
        </div>
      </div>

      {/* Right: editorial panel */}
      <div style={{
        background: 'var(--sg-black)', color: 'var(--sg-white)', position: 'relative',
        padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
          <image-slot id="auth-bg" placeholder="AUTH BACKDROP — kids mid-motion, golden hour"
            style={{ width: '100%', height: '100%', display: 'block' }} shape="rect"></image-slot>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(140deg, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.3) 50%, var(--sg-accent) 200%)' }}/>
        <div style={{ position: 'relative' }}>
          <Eyebrow onDark>WHY SUMMERGRID</Eyebrow>
        </div>
        <div style={{ position: 'relative' }}>
          <div className="sg-display" style={{ fontSize: 'var(--sg-fs-display-m)', lineHeight: 0.9 }}>
            "I planned ten<br/>weeks in <span style={{ color: 'var(--sg-accent)' }}>one</span><br/>afternoon."
          </div>
          <div style={{ marginTop: 32, fontSize: 14, color: 'rgba(250,250,247,0.7)' }}>
            — Beta tester · Mother of two · April 2026
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 48 }}>
          {[
            { v: '8 MIN', l: 'TO FIRST GRID' },
            { v: '$0', l: 'TO START' },
            { v: '10', l: 'WEEKS PLANNED' },
          ].map(s => (
            <div key={s.l}>
              <div className="sg-mono" style={{ fontSize: 24, fontWeight: 600 }}>{s.v}</div>
              <div className="sg-eyebrow on-dark" style={{ marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, ...rest }) => (
  <label style={{ display: 'grid', gap: 6 }}>
    <span className="sg-eyebrow">{label}</span>
    <input {...rest} style={{
      padding: '14px 18px', borderRadius: 4, border: '1px solid var(--sg-ink-20)',
      background: 'var(--sg-paper)', fontSize: 15, fontFamily: 'var(--sg-font-body)',
      outline: 'none', transition: 'border-color var(--sg-dur-fast)',
    }} onFocus={e => e.currentTarget.style.borderColor = 'var(--sg-black)'}
       onBlur={e => e.currentTarget.style.borderColor = 'var(--sg-ink-20)'}/>
  </label>
);

/* ============ ONBOARDING ============ */
const Onboarding = ({ onDone, onBack, initialChildren, setChildren }) => {
  const [step, setStep] = useState(1);
  const [kids, setKids] = useState(initialChildren && initialChildren.length ? initialChildren : []);
  const [postal, setPostal] = useState('98101');
  const [distance, setDistance] = useState(25);
  const [budget, setBudget] = useState(500);
  const [schedule, setSchedule] = useState('either');
  const [priorities, setPriorities] = useState(['LOW HASSLE', 'OUTDOORS']);

  const next = () => {
    if (step < 4) setStep(step + 1);
    else {
      if (kids.length > 0) setChildren(kids);
      onDone();
    }
  };
  const back = () => { if (step > 1) setStep(step - 1); else onBack(); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sg-white)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sg-ink-10)' }}>
        <SGWordmark size={18} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                width: 28, height: 3,
                background: i <= step ? 'var(--sg-accent)' : 'var(--sg-ink-20)',
              }}/>
            ))}
          </div>
          <div className="sg-mono" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--sg-ink-60)' }}>
            STEP {step} / 4
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {step === 1 && <Step1 kids={kids} setKids={setKids} />}
        {step === 2 && <Step2 postal={postal} setPostal={setPostal} distance={distance} setDistance={setDistance} />}
        {step === 3 && <Step3 budget={budget} setBudget={setBudget} schedule={schedule} setSchedule={setSchedule} priorities={priorities} setPriorities={setPriorities} />}
        {step === 4 && <Step4 onDone={() => { if (kids.length > 0) setChildren(kids); onDone(); }} />}
      </div>

      {/* Footer nav */}
      {step < 4 && (
        <div style={{ padding: '24px 32px', borderTop: '1px solid var(--sg-ink-10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={back} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sg-font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em',
            color: 'var(--sg-ink-60)', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <SGIcon name="arrowL" size={14}/> BACK
          </button>
          <SGButton variant="dark" size="lg" onClick={next} iconAfter="arrowR" disabled={step === 1 && kids.length === 0}>
            {step === 3 ? 'BUILD MY GRID' : 'CONTINUE'}
          </SGButton>
        </div>
      )}
    </div>
  );
};

const StepBody = ({ children, title, sub, num }) => (
  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.1fr', maxWidth: 1440, margin: '0 auto', width: '100%' }}>
    <div style={{ padding: '80px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Eyebrow>STEP {num} OF 4</Eyebrow>
      <h2 className="sg-display" style={{ fontSize: 'var(--sg-fs-display-m)', margin: '20px 0 24px' }}>{title}</h2>
      <p style={{ fontSize: 18, color: 'var(--sg-ink-60)', lineHeight: 1.5, maxWidth: 460 }}>{sub}</p>
    </div>
    <div style={{ padding: '80px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--sg-paper)' }}>
      {children}
    </div>
  </div>
);

/* Step 1: Children */
const KID_COLORS = ['#FF5A1F', '#2F6BD8', '#D8388E', '#2E8B57', '#6B4ECC', '#C49B1D'];
const INTEREST_CHIPS = ['STEM', 'SPORTS', 'ARTS', 'OUTDOOR', 'MUSIC', 'WATER', 'ANIMALS'];

const Step1 = ({ kids, setKids }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState([]);
  const addKid = () => {
    if (!name.trim()) return;
    const color = KID_COLORS[kids.length % KID_COLORS.length];
    const initials = name.trim().slice(0, 2).toUpperCase();
    setKids([...kids, {
      id: 'k' + Date.now(), name: name.trim(), age: parseInt(age) || 8, color, initials,
      interests, plan: Object.fromEntries(SG_WEEKS.map(w => [w.idx, null])),
    }]);
    setName(''); setAge(''); setInterests([]);
  };
  const removeKid = (id) => setKids(kids.filter(k => k.id !== id));
  return (
    <StepBody num="01" title={<><span>Who are we planning for?</span></>} sub="Add a card for each kid. You can edit anything later — names, ages, interests, even the order. We use this to filter what shows up on your Grid.">
      <div style={{ maxWidth: 540 }}>
        {/* Existing kids */}
        {kids.length > 0 && (
          <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
            {kids.map(k => (
              <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'var(--sg-white)', border: '1px solid var(--sg-ink-10)' }}>
                <ChildAvatar child={k} size={44}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase' }}>{k.name}</div>
                  <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)' }}>
                    AGE {k.age}{k.interests.length ? ' · ' + k.interests.join(' · ') : ''}
                  </div>
                </div>
                <button onClick={() => removeKid(k.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--sg-ink-60)' }}>
                  <SGIcon name="close" size={18}/>
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Add form */}
        <div style={{ padding: 20, border: '1px dashed var(--sg-ink-20)', background: 'var(--sg-white)' }}>
          <Eyebrow>ADD A CHILD</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 14 }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" style={{
              padding: '12px 14px', borderRadius: 4, border: '1px solid var(--sg-ink-20)',
              background: 'var(--sg-white)', fontSize: 15, fontFamily: 'inherit', outline: 'none',
            }}/>
            <input value={age} onChange={e => setAge(e.target.value)} placeholder="Age" type="number" min="3" max="18" style={{
              padding: '12px 14px', borderRadius: 4, border: '1px solid var(--sg-ink-20)',
              background: 'var(--sg-white)', fontSize: 15, fontFamily: 'inherit', outline: 'none',
            }}/>
          </div>
          <div style={{ marginTop: 14 }}>
            <div className="sg-eyebrow" style={{ marginBottom: 8 }}>INTERESTS (OPTIONAL)</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {INTEREST_CHIPS.map(c => (
                <FilterChip key={c} active={interests.includes(c)} onClick={() =>
                  setInterests(interests.includes(c) ? interests.filter(x => x !== c) : [...interests, c])}>
                  {c}
                </FilterChip>
              ))}
            </div>
          </div>
          <SGButton variant="primary" style={{ marginTop: 16 }} icon="plus" onClick={addKid}>
            ADD {name ? name.toUpperCase() : 'CHILD'}
          </SGButton>
        </div>
        {kids.length === 0 && (
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--sg-ink-60)' }}>
            Add at least one child to continue.
          </div>
        )}
      </div>
    </StepBody>
  );
};

/* Step 2: location */
const Step2 = ({ postal, setPostal, distance, setDistance }) => {
  // simulated camp count
  const count = Math.round(8 + distance * 1.6);
  return (
    <StepBody num="02" title={<>Where are<br/>you?</>} sub="We use your postal code to surface camps within driving distance. We never share it.">
      <div style={{ maxWidth: 540 }}>
        <Eyebrow>POSTAL CODE</Eyebrow>
        <input value={postal} onChange={e => setPostal(e.target.value)} style={{
          marginTop: 12, width: '100%', padding: '20px 24px',
          fontSize: 32, fontFamily: 'var(--sg-font-mono)', fontWeight: 600, letterSpacing: '0.06em',
          border: '1px solid var(--sg-ink-20)', background: 'var(--sg-white)', outline: 'none',
        }}/>
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Eyebrow>DISTANCE</Eyebrow>
            <div className="sg-mono" style={{ fontSize: 14, fontWeight: 600 }}>{distance} KM</div>
          </div>
          <input type="range" min="5" max="50" value={distance} onChange={e => setDistance(parseInt(e.target.value))} style={{
            width: '100%', marginTop: 16, accentColor: 'var(--sg-accent)',
          }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--sg-font-mono)', fontSize: 11, color: 'var(--sg-ink-60)', marginTop: 4 }}>
            <span>5</span><span>10</span><span>25</span><span>50</span>
          </div>
        </div>
        <div style={{ marginTop: 40, padding: 24, background: 'var(--sg-black)', color: 'var(--sg-white)' }}>
          <Eyebrow onDark>WE FOUND</Eyebrow>
          <div className="sg-display" style={{ fontSize: 72, color: 'var(--sg-white)', marginTop: 8 }}>
            {count} <span style={{ color: 'var(--sg-accent)' }}>camps</span>
          </div>
          <div style={{ fontFamily: 'var(--sg-font-mono)', fontSize: 12, color: 'rgba(250,250,247,0.6)', marginTop: 8 }}>
            WITHIN {distance}KM OF {postal}
          </div>
        </div>
      </div>
    </StepBody>
  );
};

/* Step 3: preferences */
const Step3 = ({ budget, setBudget, schedule, setSchedule, priorities, setPriorities }) => {
  const PRIOS = ['LOW HASSLE', 'OUTDOORS', 'NEW SKILLS', 'WITH FRIENDS', 'NEAR HOME', 'AFFORDABLE'];
  return (
    <StepBody num="03" title={<>What kind<br/>of summer?</>} sub="Optional. Skip anything you don't care about — we'll keep the filters wide.">
      <div style={{ maxWidth: 540 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Eyebrow>WEEKLY BUDGET CEILING</Eyebrow>
            <div className="sg-mono" style={{ fontSize: 14, fontWeight: 600 }}>${budget}/WK</div>
          </div>
          <input type="range" min="100" max="1000" step="25" value={budget} onChange={e => setBudget(parseInt(e.target.value))} style={{
            width: '100%', marginTop: 16, accentColor: 'var(--sg-accent)',
          }}/>
        </div>
        <div style={{ marginTop: 32 }}>
          <Eyebrow>SCHEDULE PREFERENCE</Eyebrow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 12 }}>
            {[
              { k: 'full-day', l: 'FULL DAY' },
              { k: 'half-day', l: 'HALF DAY' },
              { k: 'either', l: 'EITHER' },
            ].map(o => (
              <button key={o.k} onClick={() => setSchedule(o.k)} style={{
                padding: '14px 12px', border: '1px solid', borderColor: schedule === o.k ? 'var(--sg-black)' : 'var(--sg-ink-20)',
                background: schedule === o.k ? 'var(--sg-black)' : 'var(--sg-white)',
                color: schedule === o.k ? 'var(--sg-white)' : 'var(--sg-black)',
                fontFamily: 'var(--sg-font-body)', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em',
                cursor: 'pointer', transition: 'all var(--sg-dur-fast)',
              }}>{o.l}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 32 }}>
          <Eyebrow>WHAT MATTERS MOST</Eyebrow>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {PRIOS.map(p => (
              <FilterChip key={p} active={priorities.includes(p)}
                onClick={() => setPriorities(priorities.includes(p) ? priorities.filter(x => x !== p) : [...priorities, p])}>
                {p}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>
    </StepBody>
  );
};

/* Step 4: Build transition */
const Step4 = ({ onDone }) => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1100);
    const t2 = setTimeout(() => setPhase(2), 2300);
    const t3 = setTimeout(() => onDone(), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);
  const headlines = ['BUILDING', 'YOUR GRID IS', 'READY.'];
  const current = phase === 0 ? 'BUILDING' : phase === 1 ? 'YOUR GRID IS' : 'READY.';
  return (
    <div style={{
      flex: 1, background: 'var(--sg-black)', color: 'var(--sg-white)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 48, gap: 48, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background pulse */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: 999,
        background: 'radial-gradient(circle, rgba(255,90,31,0.4) 0%, transparent 60%)',
        animation: 'sg-fade-in 1.2s var(--sg-ease) both',
      }}/>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <Eyebrow onDark accent>STEP 04 OF 4</Eyebrow>
        <h2 key={current} className="sg-display" style={{
          fontSize: 'var(--sg-fs-display-l)', marginTop: 24,
          animation: 'sg-fade-up 600ms var(--sg-ease) both',
        }}>
          {current === 'READY.' ? <span>YOUR GRID IS<br/><span style={{ color: 'var(--sg-accent)' }}>READY.</span></span>
            : current === 'YOUR GRID IS' ? <span>{current}<br/>READY...</span>
            : <span>BUILDING<br/>YOUR GRID<span style={{ color: 'var(--sg-accent)' }}>...</span></span>}
        </h2>
      </div>
      <div className="sg-mono" style={{ position: 'relative', fontSize: 11, letterSpacing: '0.08em', color: 'rgba(250,250,247,0.5)' }}>
        {phase === 0 && '→ MATCHING CAMPS TO YOUR FILTERS'}
        {phase === 1 && '→ MAPPING WEEKS 23–32'}
        {phase === 2 && '→ READY'}
      </div>
    </div>
  );
};

Object.assign(window, { AuthScreen, Onboarding });
