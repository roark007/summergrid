// SummerGrid v2 — App root: auth, routing, real-time group subscriptions
import { useState, useEffect, useContext, createContext, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { auth, db, signOutUser, joinGroup, addUserGroupIndex, getGoogleRedirectResult, resendVerification } from './firebase.js';
import { DAYS, blockPickupByDay, blockDropoffByDay, blockPickupParents, blockDropoffParents, buildCarpoolIndex } from './data.js';
import Landing from './landing.jsx';
import AuthPage from './auth.jsx';
import Onboarding from './onboarding.jsx';
import Calendar from './calendar.jsx';
import { PrivacyPage, TermsPage } from './legal.jsx';
import { Spinner, Wordmark, Button, Eyebrow } from './ui.jsx';
import { TweaksPanel, TweakSection, TweakColor, useTweaks } from './tweaks-panel.jsx';

// ── Auth context ──────────────────────────────────────────────────────────────

const AuthCtx = createContext(null);
export function useAuth() { return useContext(AuthCtx); }

function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CRITICAL for mobile: must call getRedirectResult on page load to finalize the
    // signInWithRedirect flow. Without this, returning from Google's redirect on iOS
    // doesn't complete the sign-in — onAuthStateChanged may fire too early.
    getGoogleRedirectResult().catch(err => {
      // No pending redirect, or redirect failed — either way, onAuthStateChanged will sort it out
      if (err?.code) console.warn('Redirect result error:', err.code);
    });

    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return <AuthCtx.Provider value={user}>{loading ? <FullPageSpinner /> : children}</AuthCtx.Provider>;
}

// ── Route guards ──────────────────────────────────────────────────────────────

function Protected({ children }) {
  const user     = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/signin" state={{ from: location.pathname + location.search }} replace />;
  // Google sign-in pre-verifies emails. Email/password signups must verify before proceeding.
  if (!user.emailVerified) return <VerifyEmailScreen user={user}/>;
  return children;
}

function VerifyEmailScreen({ user }) {
  const navigate     = useNavigate();
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [checking, setChecking] = useState(false);

  const resend = async () => {
    setError(''); setSent(false);
    try { await resendVerification(); setSent(true); }
    catch (e) { setError(e.message || 'Could not send. Try again in a minute.'); }
  };

  const recheck = async () => {
    setChecking(true);
    try {
      await user.reload();
      if (user.emailVerified) {
        // Force a re-render at the top-level so Protected re-evaluates
        window.location.reload();
      } else {
        setError('Still not verified. Check your inbox (and spam folder).');
      }
    } finally { setChecking(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32, background: 'var(--sg-white)' }}>
      <Wordmark />
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <Eyebrow>VERIFY YOUR EMAIL</Eyebrow>
        <h1 className="sg-display" style={{ fontSize: 'clamp(36px, 6vw, 56px)', margin: '16px 0 24px' }}>
          Check your<br/>
          <span style={{ color: 'var(--sg-accent)' }}>inbox.</span>
        </h1>
        <p style={{ color: 'var(--sg-ink-60)', lineHeight: 1.6, marginBottom: 24 }}>
          We sent a verification link to <strong style={{ color: 'var(--sg-black)' }}>{user.email}</strong>. Click it to confirm your account, then come back here.
        </p>
        {sent && <div style={{ padding: '10px 14px', background: '#E8F5E9', border: '1px solid #A5D6A7', fontSize: 13, color: '#1F7A3A', marginBottom: 16 }}>Verification email sent.</div>}
        {error && <div style={{ padding: '10px 14px', background: '#FFF0EE', border: '1px solid #FFD0C8', fontSize: 13, color: '#B93A2A', marginBottom: 16 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" onClick={recheck} disabled={checking}>{checking ? 'CHECKING…' : "I'VE VERIFIED"}</Button>
          <Button variant="ghost" onClick={resend}>RESEND EMAIL</Button>
        </div>
        <div style={{ marginTop: 32 }}>
          <button onClick={async () => { await signOutUser(); navigate('/'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--sg-font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--sg-ink-60)' }}>
            SIGN OUT AND USE DIFFERENT ACCOUNT
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Real-time group data ──────────────────────────────────────────────────────

function useGroup(groupId) {
  const [group,    setGroup]    = useState(null);
  const [members,  setMembers]  = useState([]);
  const [children, setChildren] = useState([]);
  const [blocks,   setBlocks]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!groupId) return;
    let loaded = { group: false, members: false, children: false, blocks: false };
    const checkLoaded = () => {
      if (Object.values(loaded).every(Boolean)) setLoading(false);
    };

    const unsubGroup = onSnapshot(doc(db, 'groups', groupId), snap => {
      setGroup(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      loaded.group = true;
      checkLoaded();
    });

    const unsubMembers = onSnapshot(collection(db, 'groups', groupId, 'members'), snap => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loaded.members = true;
      checkLoaded();
    });

    const unsubChildren = onSnapshot(collection(db, 'groups', groupId, 'children'), snap => {
      setChildren(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loaded.children = true;
      checkLoaded();
    });

    const unsubBlocks = onSnapshot(collection(db, 'groups', groupId, 'blocks'), snap => {
      setBlocks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      loaded.blocks = true;
      checkLoaded();
    });

    return () => { unsubGroup(); unsubMembers(); unsubChildren(); unsubBlocks(); };
  }, [groupId]);

  return { group, members, children, blocks, loading };
}

// ── GroupApp — wraps Calendar with live Firestore data ────────────────────────

function GroupApp() {
  const { groupId }                          = useParams();
  const user                                 = useAuth();
  const navigate                             = useNavigate();
  const { group, members, children, blocks,
          loading }                          = useGroup(groupId);

  if (loading) return <FullPageSpinner label="Loading your grid…" />;
  if (!group)  return <NotFound message="Group not found." onHome={() => navigate('/')} />;

  const isMember = members.some(m => m.id === user?.uid);
  if (!isMember) return <NotFound message="You're not a member of this group." onHome={() => navigate('/')} />;

  return (
    <Calendar
      groupId={groupId}
      group={group}
      members={members}
      children={children}
      blocks={blocks}
      currentUser={user}
      goLanding={() => navigate('/')}
    />
  );
}

// ── JoinPage — handles /#/join/:code invite links ─────────────────────────────

function JoinPage() {
  const { code }      = useParams();
  const user          = useAuth();
  const navigate      = useNavigate();
  const [status, setStatus] = useState('joining'); // joining | error
  const [error,  setError]  = useState('');
  const joinedRef     = useRef(false);

  useEffect(() => {
    if (!user || !code || joinedRef.current) return;
    joinedRef.current = true;
    (async () => {
      try {
        const groupId = await joinGroup({
          userId:      user.uid,
          displayName: user.displayName || user.email,
          email:       user.email,
          inviteCode:  code,
        });
        await addUserGroupIndex(user.uid, groupId);
        navigate(`/app/${groupId}`, { replace: true });
      } catch (e) {
        console.error(e);
        joinedRef.current = false;
        setError(e.message || 'Could not join group. The invite link may have expired.');
        setStatus('error');
      }
    })();
  }, [user, code, navigate]);

  if (!user) return <Navigate to="/signin" state={{ from: `/join/${code}` }} replace />;

  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 }}>
        <Wordmark />
        <p style={{ color: 'var(--sg-ink-60)', maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>{error}</p>
        <Button variant="ghost" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return <FullPageSpinner label="Joining group…" />;
}

// ── Accent tweak (wraps the whole app) ───────────────────────────────────────

const ACCENT_OPTIONS = ['#FF5A1F', '#E63946', '#1F8A5B', '#2A6FDB', '#7A4ECC', '#0A0A0A'];

function AppWithTweaks({ children }) {
  const [t, setTweak] = useTweaks({ accent: '#FF5A1F' });

  useEffect(() => {
    document.documentElement.style.setProperty('--sg-accent', t.accent);
    document.documentElement.style.setProperty('--sg-accent-soft', t.accent + '26');
    document.documentElement.style.setProperty('--sg-accent-deep', t.accent);
  }, [t.accent]);

  return (
    <>
      {children}
      <TweaksPanel title="SummerGrid">
        <TweakSection label="Brand">
          <TweakColor label="Accent" value={t.accent} options={ACCENT_OPTIONS}
                      onChange={v => setTweak('accent', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AppWithTweaks>
        <HashRouter>
          <Routes>
            <Route path="/"           element={<Landing />} />
            <Route path="/signin"     element={<AuthPage />} />
            <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
            <Route path="/app/:groupId" element={<Protected><GroupApp /></Protected>} />
            <Route path="/join/:code"   element={<JoinPage />} />
            <Route path="/privacy"      element={<PrivacyPage />} />
            <Route path="/terms"        element={<TermsPage />} />
            <Route path="*"             element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AppWithTweaks>
    </AuthProvider>
  );
}

// ── Shared micro-components ───────────────────────────────────────────────────

function FullPageSpinner({ label }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Spinner size={32} />
      {label && <p style={{ color: 'var(--sg-ink-60)', fontFamily: 'var(--sg-font-mono)', fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>}
    </div>
  );
}

function NotFound({ message, onHome }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 }}>
      <Wordmark />
      <p style={{ color: 'var(--sg-ink-60)', maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>{message}</p>
      <Button variant="ghost" onClick={onHome}>Go Home</Button>
    </div>
  );
}
