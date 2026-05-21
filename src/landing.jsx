import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Eyebrow, Wordmark, Icon, Avatar, AvatarCluster } from './ui.jsx';

const PREVIEW_PARENTS = [
  { id: 'p1', name: 'Jordan Sato',   initials: 'JS', color: '#FF5A1F' },
  { id: 'p2', name: 'Richard Sato',  initials: 'RS', color: '#D81B60' },
  { id: 'p3', name: 'Hannah Liu',    initials: 'HL', color: '#2F6BD8' },
  { id: 'p4', name: 'David Okonkwo', initials: 'DO', color: '#1F7A3A' },
  { id: 'p5', name: 'Sarah Mendez',  initials: 'SM', color: '#7A4ECC' },
];

const PREVIEW_ROWS = [
  { kid: 'Mira',   parent: PREVIEW_PARENTS[0], blocks: [
    { w: 2, name: 'Cascadia Tech Lab', time: '9–4', linked: true },
    { w: 3, name: 'Cascadia Tech Lab', time: '9–4', linked: true },
    { w: 5, name: 'Trail Camp',        time: '8:30–4:30', linked: true },
  ]},
  { kid: 'Theo',   parent: PREVIEW_PARENTS[0], blocks: [
    { w: 1, name: 'Northshore Soccer', time: '9–12', linked: true },
    { w: 3, name: 'Studio 14 Painting',time: '9–12' },
    { w: 5, name: 'Lakeshore Day',     time: '9–4',  linked: true },
  ]},
  { kid: 'Wren',   parent: PREVIEW_PARENTS[2], blocks: [
    { w: 2, name: 'Cascadia Tech Lab', time: '9–4',  linked: true },
    { w: 3, name: 'Cascadia Tech Lab', time: '9–4',  linked: true },
  ]},
  { kid: 'Femi',   parent: PREVIEW_PARENTS[3], blocks: [
    { w: 1, name: 'Northshore Soccer', time: '9–12', linked: true },
    { w: 5, name: 'Lakeshore Day',     time: '9–4',  linked: true },
  ]},
];

export default function Landing() {
  const navigate = useNavigate();
  const go = () => navigate('/signin');
  return (
    <div style={{ background: 'var(--sg-white)' }}>
      <LandingNav onStart={go}/>
      <Hero onStart={go}/>
      <ProductPreview/>
      <HowItWorks/>
      <FinalCTA onStart={go}/>
      <Footer/>
    </div>
  );
}

function LandingNav({ onStart }) {
  return (
    <header className="sg-landing-nav" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '20px 32px', display: 'flex', alignItems: 'center',
      background: 'transparent', mixBlendMode: 'difference',
    }}>
      <Wordmark size={18} color="#fff"/>
      <div style={{ flex: 1 }}/>
      <button onClick={onStart} style={{
        fontFamily: 'var(--sg-font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em',
        color: '#fff', background: 'transparent', border: '1.5px solid #fff', borderRadius: 999,
        padding: '8px 18px', cursor: 'pointer',
      }}>OPEN A GRID →</button>
    </header>
  );
}

function Hero({ onStart }) {
  return (
    <section className="sg-landing-section sg-landing-hero" style={{
      minHeight: '100vh', background: 'var(--sg-black)', color: 'var(--sg-white)',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      padding: '80px 32px', textAlign: 'center', position: 'relative',
    }}>
      <Eyebrow onDark>SUMMER 2026</Eyebrow>
      <h1 className="sg-display" style={{ fontSize: 'var(--sg-fs-display-xxl)', margin: '32px 0 0', maxWidth: '14ch' }}>
        Summer.<br/>
        <span style={{ color: 'var(--sg-accent)' }}>Handled.</span>
      </h1>
      <p style={{ marginTop: 40, fontSize: 20, lineHeight: 1.4, color: 'rgba(250,250,247,0.72)', maxWidth: 540, fontWeight: 400 }}>
        One shared calendar for the parents managing summer together.
      </p>
      <div style={{ marginTop: 48 }}>
        <Button variant="accent" size="lg" onClick={onStart} iconAfter="arrowR">
          CREATE YOUR SUMMER GRID
        </Button>
      </div>
      <div className="sg-mono" style={{
        position: 'absolute', bottom: 24, left: 0, right: 0,
        fontSize: 10, letterSpacing: '0.1em', color: 'rgba(250,250,247,0.4)', textAlign: 'center',
      }}>
        FREE · NO ACCOUNT REQUIRED FOR BETA
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <section className="sg-landing-section" style={{ background: 'var(--sg-white)', padding: '120px 32px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <Eyebrow>ONE BOARD · ONE GROUP · TEN WEEKS</Eyebrow>
          <h2 className="sg-display" style={{ fontSize: 'var(--sg-fs-display-m)', margin: '20px auto 0', maxWidth: '20ch' }}>
            The whole<br/>summer at a glance.
          </h2>
        </div>
        <div className="sg-landing-preview-wrap">
          <PreviewBoard/>
        </div>
      </div>
    </section>
  );
}

function PreviewBoard() {
  return (
    <div className="sg-landing-preview-card" style={{
      background: 'var(--sg-paper)', padding: 32,
      boxShadow: '0 40px 80px rgba(10,10,10,0.08)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Eyebrow>YOUR GROUP</Eyebrow>
          <div className="sg-display" style={{ fontSize: 28, marginTop: 4 }}>FOREST HILL SUMMER CREW</div>
        </div>
        <AvatarCluster parents={PREVIEW_PARENTS} size={32}/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(6, 1fr)', gap: 4 }}>
        <div/>
        {[1,2,3,4,5,6].map(w => (
          <div key={w} className="sg-mono" style={{ fontSize: 10, padding: 6, color: 'var(--sg-ink-60)' }}>
            WK {22 + w}
          </div>
        ))}
        {PREVIEW_ROWS.map(r => (
          <div key={r.kid} style={{ display: 'contents' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderLeft: `3px solid ${r.parent.color}` }}>
              <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase' }}>{r.kid}</div>
            </div>
            {[1,2,3,4,5,6].map(w => {
              const b = r.blocks.find(x => x.w === w);
              if (!b) return <div key={w} style={{ border: '1px dashed var(--sg-ink-20)', minHeight: 72 }}/>;
              return (
                <div key={w} style={{
                  background: r.parent.color + '12', borderLeft: `3px solid ${r.parent.color}`,
                  padding: 8, minHeight: 72, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 10.5, lineHeight: 1.1, textTransform: 'uppercase' }}>{b.name}</div>
                    <div className="sg-mono" style={{ fontSize: 8.5, color: 'var(--sg-ink-60)', marginTop: 3 }}>{b.time}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {b.linked && <Icon name="link" size={10} style={{ color: 'var(--sg-accent)', marginLeft: 'auto' }}/>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="sg-mono" style={{ marginTop: 16, fontSize: 10, letterSpacing: '0.06em', color: 'var(--sg-ink-60)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="link" size={11} style={{ color: 'var(--sg-accent)' }}/> SHARED PICKUP · KIDS RIDING TOGETHER
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="sg-landing-section" style={{ background: 'var(--sg-paper)', padding: '120px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Eyebrow style={{ textAlign: 'center' }}>HOW IT WORKS</Eyebrow>
        <h2 className="sg-display" style={{ fontSize: 'var(--sg-fs-display-m)', textAlign: 'center', margin: '20px auto 80px', maxWidth: '14ch' }}>
          Three steps.<br/>That's it.
        </h2>
        <div className="sg-landing-hiw" style={{ display: 'grid', gap: 64 }}>
          {[
            { n: '01', t: 'Open a grid.', d: 'Name your group. Add your kids. You\'re done in 30 seconds.' },
            { n: '02', t: 'Invite the others.', d: 'One link. The parents in your group join, add their kids, and start filling in camps.' },
            { n: '03', t: 'Coordinate the chaos.', d: 'Camps show up on a shared board. Kids in the same camp see each other. Pickup gets assigned. Nobody texts at 7am.' },
          ].map(s => (
            <div key={s.n} className="sg-landing-hiw-row" style={{ display: 'grid', gridTemplateColumns: '0.3fr 1fr', gap: 48, alignItems: 'start', borderTop: '1px solid var(--sg-ink-20)', paddingTop: 32 }}>
              <div className="sg-mono" style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--sg-accent)' }}>STEP {s.n}</div>
              <div>
                <h3 className="sg-display" style={{ fontSize: 'clamp(40px, 5vw, 64px)', margin: 0 }}>{s.t}</h3>
                <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.5, color: 'var(--sg-ink-60)', maxWidth: 540 }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ onStart }) {
  return (
    <section className="sg-landing-section sg-landing-cta" style={{
      background: 'var(--sg-black)', color: 'var(--sg-white)',
      padding: '160px 32px', textAlign: 'center', minHeight: '80vh',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    }}>
      <h2 className="sg-display" style={{ fontSize: 'var(--sg-fs-display-xl)', margin: 0, maxWidth: '14ch' }}>
        Take<br/>the <span style={{ color: 'var(--sg-accent)' }}>summer</span>.
      </h2>
      <div style={{ marginTop: 56 }}>
        <Button variant="accent" size="lg" onClick={onStart} iconAfter="arrowR">
          CREATE YOUR SUMMER GRID
        </Button>
      </div>
      <div className="sg-mono" style={{ marginTop: 28, fontSize: 11, letterSpacing: '0.1em', color: 'rgba(250,250,247,0.4)' }}>
        30 SECONDS · FREE · INVITE THE OTHERS BY LINK
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: 'var(--sg-black)', color: 'var(--sg-white)', padding: '32px 48px 40px', borderTop: '1px solid rgba(250,250,247,0.12)' }}>
      <div className="sg-landing-footer" style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Wordmark size={20} color="#fff"/>
        <div className="sg-mono" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'rgba(250,250,247,0.5)' }}>
          © SUMMERGRID 2026
        </div>
      </div>
    </footer>
  );
}
