import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInGoogle, signInEmail, signUpEmail, getUserGroups } from './firebase.js';
import { Button, Wordmark, Icon, InputBox, Field, Eyebrow } from './ui.jsx';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null; // null = auto-detect

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const afterLogin = async (user) => {
    if (from) { navigate(from, { replace: true }); return; }
    // Auto-detect: send to existing group or onboarding
    try {
      const groups = await getUserGroups(user.uid);
      navigate(groups.length > 0 ? `/app/${groups[0]}` : '/onboarding', { replace: true });
    } catch {
      navigate('/onboarding', { replace: true });
    }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      const cred = await signInGoogle();
      await afterLogin(cred.user);
    } catch (e) {
      setError(friendlyError(e.code));
      setLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let cred;
      if (mode === 'signup') {
        if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return; }
        cred = await signUpEmail(email, password, name.trim());
      } else {
        cred = await signInEmail(email, password);
      }
      await afterLogin(cred.user);
    } catch (err) {
      setError(friendlyError(err.code));
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sg-white)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <header style={{ padding: '20px 32px', borderBottom: '1px solid var(--sg-ink-10)', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Wordmark size={18}/>
        </button>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <Eyebrow>{mode === 'signup' ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</Eyebrow>
          <h1 className="sg-display" style={{ fontSize: 'clamp(40px, 6vw, 64px)', margin: '16px 0 40px' }}>
            {mode === 'signup' ? <>Join the<br/><span style={{ color: 'var(--sg-accent)' }}>grid.</span></> : <>Sign<br/><span style={{ color: 'var(--sg-accent)' }}>in.</span></>}
          </h1>

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading} style={{
            width: '100%', padding: '14px 20px', background: 'var(--sg-white)',
            border: '1.5px solid var(--sg-ink-20)', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontSize: 15, fontWeight: 600, marginBottom: 24,
            transition: 'background var(--sg-dur-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--sg-paper)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--sg-white)'}>
            <Icon name="google" size={20} stroke={0}/>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--sg-ink-10)' }}/>
            <span className="sg-mono" style={{ fontSize: 10, color: 'var(--sg-ink-40)', letterSpacing: '0.1em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--sg-ink-10)' }}/>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmail} style={{ display: 'grid', gap: 16 }}>
            {mode === 'signup' && (
              <Field label="YOUR NAME">
                <InputBox value={name} onChange={e => setName(e.target.value)} placeholder="Jordan Sato" autoFocus/>
              </Field>
            )}
            <Field label="EMAIL">
              <InputBox type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoFocus={mode === 'signin'}/>
            </Field>
            <Field label="PASSWORD">
              <InputBox type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6}/>
            </Field>

            {error && (
              <div style={{ padding: '10px 14px', background: '#FFF0EE', border: '1px solid #FFD0C8', fontSize: 13, color: '#B93A2A' }}>
                {error}
              </div>
            )}

            <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Working…' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </Button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); }} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sg-font-mono)',
              fontSize: 11, letterSpacing: '0.08em', color: 'var(--sg-ink-60)',
            }}>
              {mode === 'signin' ? "DON'T HAVE AN ACCOUNT? SIGN UP" : 'ALREADY HAVE AN ACCOUNT? SIGN IN'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':       'No account with that email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/invalid-credential':   'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/popup-closed-by-user': 'Sign-in window was closed.',
    'auth/cancelled-popup-request': '',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
