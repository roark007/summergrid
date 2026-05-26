import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, collection, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, onSnapshot, query, where, serverTimestamp, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAFzfghmV_Qk4fMgPjjboBFD4i3J83dHaw",
  // Custom domain — must match the hosting domain so iOS/Chrome don't treat auth as third-party
  authDomain: "summergrid.space",
  projectId: "summergrid-bd6c5",
  storageBucket: "summergrid-bd6c5.firebasestorage.app",
  messagingSenderId: "36159490130",
  appId: "1:36159490130:web:2f60d9669c53a278ebb78b"
};

const app = initializeApp(firebaseConfig);

// App Check protects the Firebase backend from abuse (bot signups, scraping, spam group creation).
// Only initializes if a reCAPTCHA site key is configured — leaving the key empty disables protection
// but lets the app continue to work (useful during local dev or before App Check is set up).
const RECAPTCHA_SITE_KEY = '6Lc7P_csAAAAANpcK3rUPm_sYMhUCASsQ8qC6Ch5'; // public site key — safe to commit
if (RECAPTCHA_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) { console.warn('App Check init failed:', e); }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ── Auth helpers ────────────────────────────────────────────────────────────

// On mobile use redirect; on desktop use popup.
// iOS Chrome opens popups in an isolated Safari View Controller and the OAuth result
// can't communicate back to the parent tab — popup appears to "work" but the app never gets the user.
// signInWithRedirect navigates the entire page, so there's no cross-tab communication needed.
// CRITICAL: getRedirectResult MUST be called on page load to complete the redirect handoff —
// AuthProvider in app.jsx does this.
const isMobile = () =>
  typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
export const signInGoogle = () =>
  isMobile() ? signInWithRedirect(auth, googleProvider) : signInWithPopup(auth, googleProvider);
export const getGoogleRedirectResult = () => getRedirectResult(auth);
export const signInEmail = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
export const signUpEmail = (email, pw, name) =>
  createUserWithEmailAndPassword(auth, email, pw)
    .then(async cred => {
      await updateProfile(cred.user, { displayName: name });
      try { await sendEmailVerification(cred.user); } catch (e) { console.warn('Could not send verification email:', e); }
      return cred;
    });
export const resendVerification = () => auth.currentUser ? sendEmailVerification(auth.currentUser) : Promise.reject(new Error('Not signed in'));
export const signOutUser = () => signOut(auth);

// ── Member color palette ────────────────────────────────────────────────────

const COLORS = ['#FF5A1F','#D81B60','#2F6BD8','#1F7A3A','#7A4ECC','#C19A0E','#0E8B8B','#8B4513'];

function pickColor(existingMembers) {
  const used = new Set(existingMembers.map(m => m.color));
  return COLORS.find(c => !used.has(c)) || COLORS[existingMembers.length % COLORS.length];
}

function deriveInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function deriveShort(name) {
  return name.trim().split(/\s+/)[0];
}

// ── Group helpers ───────────────────────────────────────────────────────────

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createGroup({ userId, displayName, email, groupName, partnerName, kids, camps }) {
  const inviteCode        = generateCode();
  const partnerInviteCode = generateCode();

  // Create group doc
  const groupRef = await addDoc(collection(db, 'groups'), {
    name: groupName,
    inviteCode,
    partnerInviteCode,
    createdBy: userId,
    createdAt: serverTimestamp(),
    season: 'Summer 2026',
    ...(partnerName ? { partnerName } : {}),
  });
  const groupId = groupRef.id;

  // Register both invite codes. Each is tagged with its kind so joinGroup can branch.
  await setDoc(doc(db, 'inviteCodes', inviteCode),        { groupId, kind: 'general', createdAt: serverTimestamp() });
  await setDoc(doc(db, 'inviteCodes', partnerInviteCode), { groupId, kind: 'partner', partnerOf: userId, createdAt: serverTimestamp() });

  // Add creator as first member
  const memberColor = COLORS[0];
  await setDoc(doc(db, 'groups', groupId, 'members', userId), {
    name: displayName,
    short: deriveShort(displayName),
    initials: deriveInitials(displayName),
    color: memberColor,
    email,
    isAdmin: true,
    joinedAt: serverTimestamp(),
  });

  // Add children
  const childIdMap = {};
  for (const kid of kids) {
    if (!kid.name.trim()) continue;
    const ref = await addDoc(collection(db, 'groups', groupId, 'children'), {
      name: kid.name.trim(),
      age: parseInt(kid.age) || 0,
      parentId: userId,
    });
    childIdMap[kid.id] = ref.id;
  }

  // Add camp blocks
  for (const camp of camps) {
    if (!camp.name.trim()) continue;
    for (const tempKidId of camp.kidIds) {
      const realChildId = childIdMap[tempKidId];
      if (!realChildId) continue;
      await addDoc(collection(db, 'groups', groupId, 'blocks'), {
        childId: realChildId,
        weekIdx: camp.weekIdx,
        campName: camp.name.trim(),
        start: '09:00',
        end: '16:00',
        pickup: userId,
        dropoff: userId,
        ...(camp.deadline ? { regDeadline: camp.deadline, regStatus: camp.knownDeadline === 'registered' ? 'registered' : 'open' } : {}),
        createdBy: userId,
        createdAt: serverTimestamp(),
      });
    }
  }

  return { groupId, inviteCode, partnerInviteCode };
}

export async function joinGroup({ userId, displayName, email, inviteCode }) {
  const codeSnap = await getDoc(doc(db, 'inviteCodes', inviteCode.toUpperCase()));
  if (!codeSnap.exists()) throw new Error('This invite link is invalid or has expired.');
  // Legacy invite codes (created before the `kind` field existed) default to 'general'
  const data      = codeSnap.data();
  const groupId   = data.groupId;
  const kind      = data.kind || 'general';
  const partnerOf = data.partnerOf;

  // If the user is already a member, skip — don't overwrite their record (preserves admin status)
  try {
    const existing = await getDoc(doc(db, 'groups', groupId, 'members', userId));
    if (existing.exists()) {
      // Treat existing primary (no partnerOf) with no kids as still needing onboarding
      const wasPartnerJoin = !!existing.data().partnerOf;
      return { groupId, kind: wasPartnerJoin ? 'partner' : kind };
    }
  } catch { /* permission denied = definitely not a member, fall through */ }

  // For partner joins, inherit the inviter's color (visually one family unit).
  // For general joins, pick an unused color from the palette.
  let memberColor;
  if (kind === 'partner' && partnerOf) {
    try {
      const partnerSnap = await getDoc(doc(db, 'groups', groupId, 'members', partnerOf));
      if (partnerSnap.exists()) memberColor = partnerSnap.data().color;
    } catch {}
  }
  if (!memberColor) {
    try {
      const membersSnap = await getDocs(collection(db, 'groups', groupId, 'members'));
      memberColor = pickColor(membersSnap.docs.map(d => d.data()));
    } catch {
      let hash = 0;
      for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
      memberColor = COLORS[Math.abs(hash) % COLORS.length];
    }
  }

  await setDoc(doc(db, 'groups', groupId, 'members', userId), {
    name: displayName,
    short: deriveShort(displayName),
    initials: deriveInitials(displayName),
    color: memberColor,
    email,
    isAdmin: false,
    joinedAt: serverTimestamp(),
    ...(kind === 'partner' && partnerOf ? { partnerOf } : {}),
  });

  return { groupId, kind };
}

export async function getUserGroups(userId) {
  // Find all groups where this user is a member by checking subcollections
  // Firestore doesn't support cross-collection queries on subcollections directly,
  // so we store a user→groups index
  const snap = await getDocs(query(collection(db, 'userGroups'), where('userId', '==', userId)));
  return snap.docs.map(d => d.data().groupId);
}

export async function addUserGroupIndex(userId, groupId) {
  await setDoc(doc(db, 'userGroups', `${userId}_${groupId}`), { userId, groupId });
}

// ── Block CRUD ──────────────────────────────────────────────────────────────

export async function addBlock(groupId, data) {
  return addDoc(collection(db, 'groups', groupId, 'blocks'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateBlock(groupId, blockId, patch) {
  return updateDoc(doc(db, 'groups', groupId, 'blocks', blockId), patch);
}

export async function removeBlock(groupId, blockId) {
  return deleteDoc(doc(db, 'groups', groupId, 'blocks', blockId));
}

// ── Group CRUD ──────────────────────────────────────────────────────────────

export async function updateGroup(groupId, patch) {
  return updateDoc(doc(db, 'groups', groupId), patch);
}

// Upgrade legacy groups (created before the partner-invite-code feature) by generating
// a distinct partner code and registering it in inviteCodes. Idempotent — safe to call
// on already-upgraded groups.
export async function ensurePartnerInviteCode(group) {
  if (!group || group.partnerInviteCode) return group?.partnerInviteCode;
  const code = generateCode();
  await updateDoc(doc(db, 'groups', group.id), { partnerInviteCode: code });
  await setDoc(doc(db, 'inviteCodes', code), {
    groupId: group.id,
    kind: 'partner',
    partnerOf: group.createdBy,
    createdAt: serverTimestamp(),
  });
  return code;
}

// ── Child CRUD ──────────────────────────────────────────────────────────────

export async function addChild(groupId, data) {
  return addDoc(collection(db, 'groups', groupId, 'children'), data);
}

export async function updateChild(groupId, childId, patch) {
  return updateDoc(doc(db, 'groups', groupId, 'children', childId), patch);
}

export async function removeChild(groupId, childId) {
  return deleteDoc(doc(db, 'groups', groupId, 'children', childId));
}

// Remove a member (and their partner + kids + blocks) from the group.
// Does not ban — they can rejoin via the invite link at any time.
export async function removeMember(groupId, memberId, allMembers, allChildren, allBlocks) {
  const member = allMembers.find(m => m.id === memberId);
  if (!member) return;

  const familyPrimaryId = member.partnerOf || memberId;
  const memberIdsToRemove = allMembers
    .filter(m => m.id === familyPrimaryId || m.partnerOf === familyPrimaryId)
    .map(m => m.id);

  const kidIds = allChildren
    .filter(c => c.parentId === familyPrimaryId)
    .map(c => c.id);

  const blockIds = allBlocks
    .filter(b => kidIds.includes(b.childId))
    .map(b => b.id);

  const batch = writeBatch(db);
  memberIdsToRemove.forEach(mid => batch.delete(doc(db, 'groups', groupId, 'members', mid)));
  kidIds.forEach(kid  => batch.delete(doc(db, 'groups', groupId, 'children', kid)));
  blockIds.forEach(bid => batch.delete(doc(db, 'groups', groupId, 'blocks', bid)));
  await batch.commit();

  // Clean up userGroups index (best-effort, outside batch)
  await Promise.all(memberIdsToRemove.map(mid =>
    deleteDoc(doc(db, 'userGroups', `${mid}_${groupId}`)).catch(() => {})
  ));
}

export { onSnapshot, doc, collection, serverTimestamp };
