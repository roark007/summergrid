import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup, addUserGroupIndex } from './firebase.js';
import { useAuth } from './app.jsx';
import { WEEKS } from './data.js';
import { Button, Eyebrow, Wordmark, Icon, Field, InputBox } from './ui.jsx';

const STEPS = ['welcome', 'partner', 'name', 'kids', 'camps', 'done'];

export default function Onboarding() {
  const navigate = useNavigate();
  const user = useAuth();
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  const [groupName, setGroupName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [kids, setKids] = useState([{ id: 'k1', name: '', age: '' }]);
  const [camps, setCamps] = useState([{ id: 'cm1', name: '', weekIdx: 1, kidIds: [], deadline: '', knownDeadline: null }]);
  const [groupId, setGroupId] = useState(null);
  const [saving, setSaving] = useState(false);

  const next = () => setStepIdx(i => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIdx(i => Math.max(i - 1, 0));

  const finish = async () => {
    setSaving(true);
    try {
      const gid = await createGroup({
        userId: user.uid,
        displayName: user.displayName || user.email,
        email: user.email,
        groupName: groupName.trim(),
        partnerName: partnerName.trim(),
        kids,
        camps,
      });
      await addUserGroupIndex(user.uid, gid);
      setGroupId(gid);
      next();
    } catch (e) {
      console.error(e);
      alert('Something went wrong saving your group. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: 'var(--sg-white)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <OnbHeader stepIdx={stepIdx} onCancel={() => navigate('/')}/>
      <main className="sg-onb-shell" style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 32px 80px' }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          {step === 'welcome' && <StepWelcome user={user} onNext={next}/>}
          {step === 'partner' && <StepPartner partnerName={partnerName} setPartnerName={setPartnerName} onNext={next} onBack={back}/>}
          {step === 'name'    && <StepName groupName={groupName} setGroupName={setGroupName} onNext={next} onBack={back}/>}
          {step === 'kids'    && <StepKids kids={kids} setKids={setKids} onNext={next} onBack={back}/>}
          {step === 'camps'   && <StepCamps camps={camps} setCamps={setCamps} kids={kids} onNext={finish} onBack={back} saving={saving}/>}
          {step === 'done'    && groupId && <StepDone groupId={groupId} groupName={groupName} partnerName={partnerName} kids={kids} camps={camps} onFinish={() => navigate(`/app/${groupId}`)}/>}
        </div>
      </main>
    </div>
  );
}

function OnbHeader({ stepIdx, onCancel }) {
  const total = STEPS.length;
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
}

function StepTitle({ eyebrow, children, sub }) {
  return (
    <div style={{ marginBottom: 48, paddingBottom: 8 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="sg-display" style={{ fontSize: 'clamp(40px, 6vw, 76px)', margin: '16px 0 0', maxWidth: '14ch', paddingBottom: 8 }}>
        {children}
      </h1>
      {sub && <p style={{ marginTop: 24, fontSize: 17, lineHeight: 1.5, color: 'var(--sg-ink-60)', maxWidth: 560 }}>{sub}</p>}
    </div>
  );
}

function StepFooter({ onBack, onNext, nextLabel = 'CONTINUE', nextDisabled, saving }) {
  return (
    <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--sg-ink-10)', display: 'flex', alignItems: 'center', gap: 12 }}>
      {onBack && <Button variant="ghost" icon="arrowL" onClick={onBack}>BACK</Button>}
      <div style={{ flex: 1 }}/>
      <Button variant="primary" iconAfter="arrowR" onClick={onNext} disabled={nextDisabled || saving}
        style={{ opacity: nextDisabled || saving ? 0.5 : 1 }}>
        {saving ? 'SAVING…' : nextLabel}
      </Button>
    </div>
  );
}

// ── Step 1: Welcome ──────────────────────────────────────────────────────────

function StepWelcome({ user, onNext }) {
  const firstName = (user?.displayName || user?.email || 'there').split(/[\s@]/)[0];
  return (
    <div>
      <StepTitle eyebrow={`WELCOME, ${firstName.toUpperCase()}`}
        sub="Three quick steps and your group is on the board. Skip anything you don't have yet — you can always come back.">
        Let's build your<br/>
        <span style={{ color: 'var(--sg-accent)' }}>summer crew.</span>
      </StepTitle>
      <div style={{ display: 'grid', gap: 12, maxWidth: 540 }}>
        {[
          { n: '01', t: 'Name your group',    d: '"Forest Hill Summer Crew." Something the other parents will recognize.' },
          { n: '02', t: 'Add your kids',      d: 'Names and ages. They become rows on the grid.' },
          { n: '03', t: 'Add a few camps',    d: 'Plus the registration deadline — so other parents know when to sign up.' },
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
}

// ── Step 2: Partner ──────────────────────────────────────────────────────────

function StepPartner({ partnerName, setPartnerName, onNext, onBack }) {
  return (
    <div>
      <StepTitle eyebrow="STEP 01 · YOUR PARTNER"
        sub="If someone else — a spouse, co-parent, or partner — will also manage pickups and dropoffs, add their first name here. You'll get a link to share with them at the end.">
        Do you manage<br/>
        <span style={{ color: 'var(--sg-accent)' }}>with a partner?</span>
      </StepTitle>
      <div style={{ maxWidth: 520, display: 'grid', gap: 16 }}>
        <Field label="PARTNER'S FIRST NAME (optional)">
          <InputBox
            value={partnerName}
            onChange={e => setPartnerName(e.target.value)}
            placeholder="e.g. Sarah"
            autoFocus
          />
        </Field>
        <div className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>
          THEY'LL GET THEIR OWN SIGN-IN — YOU'LL SHARE AN INVITE LINK AT THE END
        </div>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} nextLabel={partnerName.trim() ? 'CONTINUE' : 'SKIP — JUST ME'}/>
    </div>
  );
}

// ── Step 3: Group name ───────────────────────────────────────────────────────

function StepName({ groupName, setGroupName, onNext, onBack }) {
  return (
    <div>
      <StepTitle eyebrow="STEP 01 · YOUR GROUP" sub="This is how the group appears at the top of the grid. Other parents will see this when they join.">
        What should we<br/>
        <span style={{ color: 'var(--sg-accent)' }}>call the crew?</span>
      </StepTitle>
      <div style={{ maxWidth: 520 }}>
        <Field label="GROUP NAME">
          <InputBox
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="e.g. Forest Hill Summer Crew"
            autoFocus
          />
        </Field>
        <div className="sg-mono" style={{ marginTop: 10, fontSize: 10, color: 'var(--sg-ink-60)', letterSpacing: '0.06em' }}>
          YOU CAN CHANGE THIS LATER
        </div>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} nextDisabled={!groupName.trim()}/>
    </div>
  );
}

// ── Step 3: Kids ─────────────────────────────────────────────────────────────

function StepKids({ kids, setKids, onNext, onBack }) {
  const update = (id, patch) => setKids(prev => prev.map(k => k.id === id ? { ...k, ...patch } : k));
  const add    = () => setKids(prev => [...prev, { id: 'k' + Date.now(), name: '', age: '' }]);
  const remove = (id) => setKids(prev => prev.filter(k => k.id !== id));
  const valid  = kids.filter(k => k.name.trim().length > 0);

  return (
    <div>
      <StepTitle eyebrow="STEP 02 · KIDS" sub="Each kid becomes a row on the grid. Ages help you pick age-appropriate camps later.">
        Who are we<br/>planning for?
      </StepTitle>
      <div style={{ display: 'grid', gap: 8, maxWidth: 560 }}>
        {kids.map((k, i) => (
          <div key={k.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 92px 36px', gap: 12, alignItems: 'center', padding: 12, background: 'var(--sg-paper)' }}>
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
          fontSize: 13, fontWeight: 500,
        }}>
          <Icon name="plus" size={14} stroke={2}/> ADD ANOTHER KID
        </button>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} nextDisabled={valid.length === 0}
        nextLabel={valid.length === 0 ? 'NEED AT LEAST ONE' : `CONTINUE WITH ${valid.length} KID${valid.length > 1 ? 'S' : ''}`}/>
    </div>
  );
}

// ── Step 4: Camps ─────────────────────────────────────────────────────────────

function StepCamps({ camps, setCamps, kids, onNext, onBack, saving }) {
  const validKids = kids.filter(k => k.name.trim());
  const update = (id, patch) => setCamps(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  const add    = () => setCamps(prev => [...prev, { id: 'cm' + Date.now(), name: '', weekIdx: 1, kidIds: validKids.length === 1 ? [validKids[0].id] : [], deadline: '', knownDeadline: null }]);

  // Auto-assign the only kid to any camp that has no kids selected
  useEffect(() => {
    if (validKids.length !== 1) return;
    setCamps(prev => prev.map(c => c.kidIds.length === 0 ? { ...c, kidIds: [validKids[0].id] } : c));
  }, [validKids.length > 0 ? validKids[0].id : null]);
  const remove = (id) => setCamps(prev => prev.filter(c => c.id !== id));

  const namedCamps = camps.filter(c => c.name.trim());
  const missingKids = namedCamps.filter(c => c.kidIds.length === 0);
  const canProceed = namedCamps.length === 0 || missingKids.length === 0;

  return (
    <div>
      <StepTitle eyebrow="STEP 03 · CAMPS" sub="Add what you've got so far — even ideas you're considering. Skip what you don't know.">
        What camps<br/>are you eyeing?
      </StepTitle>
      <div style={{ display: 'grid', gap: 16 }}>
        {camps.map((c, i) => (
          <CampForm key={c.id} camp={c} index={i} kids={validKids}
            onChange={patch => update(c.id, patch)}
            onRemove={() => camps.length > 1 && remove(c.id)}
            canRemove={camps.length > 1}
            hasError={c.name.trim() && c.kidIds.length === 0}/>
        ))}
        <button onClick={add} style={{
          padding: '16px 20px', background: 'transparent', border: '1px dashed var(--sg-ink-20)',
          cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10,
          color: 'var(--sg-ink-60)', fontSize: 13, fontWeight: 500,
        }}>
          <Icon name="plus" size={14} stroke={2}/> ADD ANOTHER CAMP
        </button>
      </div>
      {!canProceed && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#FFF0EE', border: '1px solid #FFD0C8', fontSize: 13, color: '#B93A2A' }}>
          Every camp needs at least one kid assigned. Click the kid's name under "Which Kids" for each camp.
        </div>
      )}
      <StepFooter onBack={onBack} onNext={canProceed ? onNext : undefined} saving={saving}
        nextDisabled={!canProceed}
        nextLabel={namedCamps.length === 0 ? 'SKIP FOR NOW' : `ADD ${namedCamps.length} CAMP${namedCamps.length > 1 ? 'S' : ''}`}/>
    </div>
  );
}

function CampForm({ camp, index, kids, onChange, onRemove, canRemove, hasError }) {
  const toggleKid = (kidId) => {
    const set = new Set(camp.kidIds);
    if (set.has(kidId)) set.delete(kidId); else set.add(kidId);
    onChange({ kidIds: [...set] });
  };
  return (
    <div style={{ padding: 20, background: 'var(--sg-paper)', display: 'grid', gap: 16, border: hasError ? '1.5px solid #FFD0C8' : '1px solid var(--sg-ink-10)', background: hasError ? '#FFF8F7' : 'var(--sg-paper)' }}>
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
      <div style={{ padding: 14, background: 'var(--sg-white)', border: '1px solid var(--sg-ink-10)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Icon name="calendar" size={14} style={{ color: 'var(--sg-accent)' }}/>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registration deadline</div>
          <div style={{ flex: 1 }}/>
          <span className="sg-mono" style={{ fontSize: 9.5, color: 'var(--sg-accent)', letterSpacing: '0.06em' }}>VISIBLE TO YOUR GROUP</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { v: true,         l: 'I KNOW THE DEADLINE' },
            { v: false,        l: 'NOT SURE YET' },
            { v: 'registered', l: 'ALREADY REGISTERED' },
          ].map(opt => (
            <button key={String(opt.v)} onClick={() => onChange({ knownDeadline: opt.v, deadline: opt.v === true ? camp.deadline : '' })}
              style={chipStyle(camp.knownDeadline === opt.v)}>{opt.l}</button>
          ))}
        </div>
        {camp.knownDeadline === true && (
          <div style={{ marginTop: 12 }}>
            <InputBox placeholder="e.g. Jun 1" value={camp.deadline} onChange={e => onChange({ deadline: e.target.value })}/>
          </div>
        )}
      </div>
    </div>
  );
}

const chipStyle = (active) => ({
  padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--sg-font-mono)',
  background: active ? 'var(--sg-black)' : 'var(--sg-white)',
  color: active ? 'var(--sg-white)' : 'var(--sg-black)',
  border: '1px solid ' + (active ? 'var(--sg-black)' : 'var(--sg-ink-20)'),
  fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em',
});

// ── Step 5: Done ──────────────────────────────────────────────────────────────

function StepDone({ groupId, groupName, partnerName, kids, camps, onFinish }) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${window.location.origin}${window.location.pathname}#/join/${groupId}`;
  const copy = () => {
    navigator.clipboard?.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const validKids  = kids.filter(k => k.name.trim());
  const validCamps = camps.filter(c => c.name.trim());

  return (
    <div>
      <StepTitle eyebrow="ALL SET">
        Your grid is<br/>
        <span style={{ color: 'var(--sg-accent)' }}>live.</span>
      </StepTitle>

      <div style={{ display: 'grid', gap: 16, maxWidth: 560, marginBottom: 32 }}>
        <SummaryRow icon="users" label="GROUP">{groupName}</SummaryRow>
        <SummaryRow icon="users" label={`${validKids.length} KID${validKids.length === 1 ? '' : 'S'}`}>
          {validKids.length > 0 ? validKids.map(k => `${k.name}${k.age ? ' (' + k.age + ')' : ''}`).join(' · ') : <span style={{ color: 'var(--sg-ink-40)' }}>add later</span>}
        </SummaryRow>
        {validCamps.length > 0 && (
          <SummaryRow icon="calendar" label={`${validCamps.length} CAMP${validCamps.length === 1 ? '' : 'S'}`}>
            {validCamps.map(c => c.name).join(' · ')}
          </SummaryRow>
        )}
      </div>

      {/* Invite block */}
      <div style={{ padding: 20, background: 'var(--sg-black)', color: 'var(--sg-white)', marginBottom: 32, maxWidth: 560 }}>
        <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(250,250,247,0.6)', marginBottom: 12 }}>
          {partnerName ? `SEND THIS LINK TO ${partnerName.toUpperCase()}` : 'INVITE YOUR PARTNER OR OTHER PARENTS'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="sg-mono" style={{ flex: 1, padding: '6px 8px', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(250,250,247,0.85)' }}>
            {inviteUrl}
          </div>
          <button onClick={copy} style={{
            padding: '8px 14px', background: copied ? 'var(--sg-accent)' : 'var(--sg-white)',
            color: copied ? '#fff' : 'var(--sg-black)', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--sg-font-mono)', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}>
            <Icon name={copied ? 'check' : 'copy'} size={12} stroke={2.5}/>
            {copied ? 'COPIED!' : 'COPY LINK'}
          </button>
        </div>
        <div style={{ marginTop: 12, fontSize: 13, color: 'rgba(250,250,247,0.6)', lineHeight: 1.5 }}>
          {partnerName
            ? `${partnerName} clicks this link, signs in with Google or email, and lands straight in your group. They can then add their own pickups and dropoffs.`
            : 'Anyone with this link can sign in and join your group. They\'ll be able to add pickups, dropoffs, and camps.'}
        </div>
      </div>

      <Button variant="accent" size="lg" iconAfter="arrowR" onClick={onFinish}>OPEN MY GRID</Button>
    </div>
  );
}

function SummaryRow({ icon, label, children }) {
  return (
    <div style={{ padding: '16px 18px', background: 'var(--sg-paper)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <Icon name={icon} size={16} style={{ color: 'var(--sg-ink-60)', marginTop: 2 }}/>
      <div style={{ flex: 1 }}>
        <div className="sg-mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--sg-ink-60)', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 500 }}>{children}</div>
      </div>
    </div>
  );
}
