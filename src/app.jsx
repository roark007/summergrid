// SummerGrid v2 — App root: auth, routing, real-time group subscriptions
import { useState, useEffect, useContext, createContext, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { auth, db, signOutUser, joinGroup, addUserGroupIndex, getGoogleRedirectResult } from './firebase.js';
import { DAYS, blockPickupByDay, blockDropoffByDay, blockPickupParents, blockDropoffParents, buildCarpoolIndex } from './data.js';
import Landing from './landing.jsx';
import AuthPage from './auth.jsx';
import Onboarding from './onboarding.jsx';
import Calendar from './calendar.jsx';
import { Spinner, Wordmark, Button } from './ui.jsx';
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
  return children;
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
