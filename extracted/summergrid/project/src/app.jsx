// SummerGrid v2 — App shell

const SG_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FF5A1F"
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ['#FF5A1F', '#E63946', '#1F8A5B', '#2A6FDB', '#0A0A0A'];

const App = () => {
  const [route, setRoute] = useState('landing');
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [t, setTweak] = useTweaks(SG_DEFAULTS);

  useEffect(() => {
    document.documentElement.style.setProperty('--sg-accent', t.accent);
    document.documentElement.style.setProperty('--sg-accent-soft', t.accent + '26');
  }, [t.accent]);

  return (
    <div data-app-root>
      {route === 'landing' && <Landing onStart={() => setRoute('onboarding')} />}
      {route === 'onboarding' && (
        <Onboarding
          onFinish={() => setRoute('app')}
          onCancel={() => setRoute('landing')}
        />
      )}
      {route === 'app' && (
        <Calendar blocks={blocks} setBlocks={setBlocks} goLanding={() => setRoute('landing')} />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Brand">
          <TweakColor
            label="Accent"
            value={t.accent}
            onChange={v => setTweak('accent', v)}
            options={ACCENT_OPTIONS}
          />
        </TweakSection>
        <TweakSection label="Jump to">
          <div style={{ display: 'grid', gap: 6 }}>
            {[
              { k: 'landing',    l: '01 · Landing' },
              { k: 'onboarding', l: '02 · Onboarding' },
              { k: 'app',        l: '03 · The Grid' },
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
        <TweakSection label="Demo data">
          <TweakButton onClick={() => setBlocks(INITIAL_BLOCKS)}>Reset to sample data</TweakButton>
          <TweakButton onClick={() => setBlocks([])}>Clear the grid</TweakButton>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
