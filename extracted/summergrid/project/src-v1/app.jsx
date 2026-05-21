// SummerGrid — App shell + routing + tweaks

const SG_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FF5A1F",
  "heroHeadline": "handled",
  "displayWeight": 900,
  "warmth": "warm",
  "gridDensity": "comfy",
  "showOverlapAvatars": true
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ['#FF5A1F', '#E63946', '#1F8A5B', '#2A6FDB', '#000000'];
const HEADLINE_OPTIONS = [
  { value: 'handled', label: 'Handled' },
  { value: 'own', label: 'Own it' },
  { value: 'twelve', label: '12 weeks' },
];
const WARMTH_PRESETS = {
  warm: { white: '#FAFAF7', paper: '#F2F0EB', paper2: '#E9E6DF' },
  cool: { white: '#F9FAFB', paper: '#F1F3F6', paper2: '#E5E8EC' },
  neutral: { white: '#FFFFFF', paper: '#F6F6F6', paper2: '#ECECEC' },
};
const DENSITY = {
  compact: { cellHeight: 108, cellMin: 116 },
  comfy: { cellHeight: 132, cellMin: 132 },
  roomy: { cellHeight: 168, cellMin: 152 },
};

const App = () => {
  const [route, setRoute] = useState('landing');
  // App state
  const [children, setChildren] = useState(SG_INITIAL_CHILDREN);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const connections = SG_CONNECTIONS;

  // Tweaks
  const [t, setTweak] = useTweaks(SG_DEFAULTS);

  // Apply theme tokens
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--sg-accent', t.accent);
    root.style.setProperty('--sg-accent-soft', t.accent + '26');
    const warmth = WARMTH_PRESETS[t.warmth] || WARMTH_PRESETS.warm;
    root.style.setProperty('--sg-white', warmth.white);
    root.style.setProperty('--sg-paper', warmth.paper);
    root.style.setProperty('--sg-paper-2', warmth.paper2);
    root.style.setProperty('--sg-display-weight', t.displayWeight);
    const d = DENSITY[t.gridDensity] || DENSITY.comfy;
    root.style.setProperty('--sg-cell-height', d.cellHeight + 'px');
    root.style.setProperty('--sg-cell-min', d.cellMin + 'px');
  }, [t.accent, t.warmth, t.displayWeight, t.gridDensity]);

  // Override display weight via dynamic style
  useEffect(() => {
    let styleEl = document.getElementById('sg-display-override');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'sg-display-override';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `.sg-display { font-weight: ${t.displayWeight} !important; }`;
  }, [t.displayWeight]);

  // Window-level reset on logo click
  const goLanding = () => setRoute('landing');
  const goAuth = () => setRoute('auth');
  const goOnboarding = () => setRoute('onboarding');
  const goApp = () => setRoute('grid');

  // For onboarding to write back
  const handleOnboardingDone = () => setRoute('grid');

  const authedNav = (key) => setRoute(key);

  return (
    <div data-app-root>
      {route === 'landing' && (
        <Landing onStart={goAuth} hero={t.heroHeadline} onJump={setRoute} />
      )}
      {route === 'auth' && (
        <AuthScreen onSignIn={goOnboarding} onBack={goLanding} />
      )}
      {route === 'onboarding' && (
        <Onboarding
          onDone={handleOnboardingDone}
          onBack={goLanding}
          initialChildren={[]}
          setChildren={setChildren}
        />
      )}
      {(route === 'grid' || route === 'discover' || route === 'coordinate' || route === 'settings') && (
        <>
          <NavBar route={route} onNav={authedNav} calendarConnected={calendarConnected}/>
          {route === 'grid' && (
            <GridScreen
              children={children}
              setChildren={setChildren}
              openDiscover={() => setRoute('discover')}
              calendarConnected={calendarConnected}
              connections={connections}
            />
          )}
          {route === 'discover' && (
            <DiscoverScreen
              children={children}
              setChildren={setChildren}
              calendarConnected={calendarConnected}
            />
          )}
          {route === 'coordinate' && (
            <CoordinateScreen
              children={children}
              connections={connections}
              calendarConnected={calendarConnected}
              setCalendarConnected={setCalendarConnected}
            />
          )}
          {route === 'settings' && (
            <SettingsScreen children={children} setChildren={setChildren} calendarConnected={calendarConnected} setCalendarConnected={setCalendarConnected} />
          )}
        </>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Identity">
          <TweakRadio
            label="Headline"
            value={t.heroHeadline}
            onChange={v => setTweak('heroHeadline', v)}
            options={HEADLINE_OPTIONS}
          />
          <TweakColor
            label="Accent"
            value={t.accent}
            onChange={v => setTweak('accent', v)}
            options={ACCENT_OPTIONS}
          />
        </TweakSection>
        <TweakSection label="Type & feel">
          <TweakRadio
            label="Warmth"
            value={t.warmth}
            onChange={v => setTweak('warmth', v)}
            options={[
              { value: 'warm', label: 'Warm' },
              { value: 'neutral', label: 'Neutral' },
              { value: 'cool', label: 'Cool' },
            ]}
          />
          <TweakRadio
            label="Display weight"
            value={t.displayWeight}
            onChange={v => setTweak('displayWeight', v)}
            options={[
              { value: 800, label: '800' },
              { value: 900, label: '900' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Grid">
          <TweakRadio
            label="Density"
            value={t.gridDensity}
            onChange={v => setTweak('gridDensity', v)}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'comfy', label: 'Comfy' },
              { value: 'roomy', label: 'Roomy' },
            ]}
          />
        </TweakSection>
        <TweakSection label="Jump to">
          <div style={{ display: 'grid', gap: 6 }}>
            {[
              { k: 'landing', l: '01 · Landing page' },
              { k: 'auth', l: '02 · Auth' },
              { k: 'onboarding', l: '03 · Onboarding (4-step)' },
              { k: 'grid', l: '04 · The Grid' },
              { k: 'discover', l: '05 · Discover' },
              { k: 'coordinate', l: '06 · Coordinate' },
            ].map(s => (
              <button key={s.k} onClick={() => setRoute(s.k)} style={{
                textAlign: 'left', padding: '8px 12px', borderRadius: 6,
                background: route === s.k ? 'var(--sg-black)' : 'transparent',
                color: route === s.k ? 'var(--sg-white)' : 'inherit',
                border: '1px solid var(--sg-ink-20)', cursor: 'pointer',
                fontFamily: 'var(--sg-font-mono)', fontSize: 11, letterSpacing: '0.06em',
              }}>{s.l}</button>
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
};

const SettingsScreen = ({ children, calendarConnected }) => (
  <div style={{ padding: '48px 32px', maxWidth: 900 }}>
    <Eyebrow>SETTINGS</Eyebrow>
    <h1 className="sg-display" style={{ fontSize: 'clamp(48px, 6vw, 80px)', margin: '12px 0 32px' }}>Profile.</h1>
    <div style={{ padding: 24, background: 'var(--sg-paper)' }}>
      <Eyebrow>YOUR KIDS</Eyebrow>
      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {children.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--sg-white)', border: '1px solid var(--sg-ink-10)' }}>
            <ChildAvatar child={c} size={48}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase' }}>{c.name}</div>
              <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)' }}>AGE {c.age} · {c.interests.join(' · ')}</div>
            </div>
            <SGButton variant="ghost" size="sm" icon="edit">EDIT</SGButton>
          </div>
        ))}
      </div>
    </div>
    <div style={{ marginTop: 24, padding: 24, background: 'var(--sg-paper)' }}>
      <Eyebrow>CALENDAR</Eyebrow>
      <div style={{ marginTop: 12 }}>
        {calendarConnected ? 'Google Calendar connected.' : 'Not connected yet.'}
      </div>
    </div>
  </div>
);

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
