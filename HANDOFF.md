# SummerGrid — Agent Handoff

Read this before doing anything. The user (Rene) is non-technical and learned everything by typing commands you give him. Hand-hold accordingly — give one command at a time, explain what it does, ask what he sees back.

## What this is

A real, deployed, multi-user web app for a handful of families to coordinate summer camps + pickups/dropoffs. **Not a demo, not marketing.** Rene uses it personally. The pretty prototype it was built from is in `extracted/summergrid/` for reference only — don't edit those files.

- **Live at:** https://summergrid.space
- **GitHub repo:** https://github.com/roark007/summergrid (owner: `roark007`)
- **Firebase project:** `summergrid-bd6c5` (console.firebase.google.com)
- **Owner email / GitHub:** rene.bhavnani@gmail.com

## Stack

- Vite + React 18 (NO Next.js, NO server)
- Firebase v10 modular SDK — Firestore (real-time) + Auth (Google + Email/Password)
- react-router-dom v6 with `HashRouter` (required for GitHub Pages — no server rewrites)
- GitHub Actions → gh-pages branch → custom domain `summergrid.space` (CNAME in `public/`)

Build size is ~700 KB (Firebase SDK is heavy). Don't add bundle-splitting unless asked — the warning is fine.

## Deploy pipeline

`git push origin main` → GitHub Actions runs `npm ci && npm run build` → pushes `dist/` to `gh-pages` branch → live in ~60 seconds. Watch progress at github.com/roark007/summergrid/actions.

There is no staging environment. Test locally with `npm run dev` before pushing.

## Firestore data model

```
groups/{groupId}                       — { name, inviteCode, partnerName?, createdBy, createdAt, season }
  ├── members/{userId}                 — { name, short, initials, color, email, isAdmin, joinedAt }
  ├── children/{childId}               — { name, age, parentId }
  └── blocks/{blockId}                 — { childId, weekIdx, campName, start, end, pickup, dropoff, pickupByDay?, dropoffByDay?, regDeadline?, regStatus?, notes? }

inviteCodes/{6-char-CODE}              — { groupId, createdAt }
userGroups/{userId_groupId}            — { userId, groupId }   (index — no cross-subcollection queries in Firestore)
```

`inviteCode` is a 6-char uppercase alphanumeric. **Don't confuse it with `groupId`** — that was a real bug. The invite URL format is `https://summergrid.space/#/join/{inviteCode}`.

## Auth flow

- `AuthProvider` in [app.jsx](src/app.jsx) wraps everything, listens to `onAuthStateChanged`, shows spinner until first auth state resolves
- `Protected` route component redirects to `/signin` with `state.from = current path` if not authed
- `useAuth()` hook returns the current Firebase User object (or null)
- **Google sign-in uses `signInWithPopup` everywhere** (desktop AND mobile). We previously used `signInWithRedirect` on mobile but it silently never fired on iOS Safari and some Android browsers ("nothing happens" when tapping the button). Popups work universally — on mobile they open as a new tab. The `sessionStorage` FROM_KEY plumbing in auth.jsx is left in place as a safety net but unused.
- Single navigation path post-login: the `useEffect` watching `currentUser?.uid` in `AuthPage` is the only place that navigates. Don't add explicit navigations in click handlers — it causes double-navigates and races.

## Invite/join flow

1. Onboarding creates a group → `createGroup()` returns `{ groupId, inviteCode }` (it used to just return `groupId` and the invite URL was broken — don't regress).
2. `StepDone` shows the invite URL using `inviteCode`.
3. `InviteModal` in [calendar.jsx](src/calendar.jsx) reads `group.inviteCode` from the live Firestore group doc.
4. Recipient clicks `/#/join/{code}` → `JoinPage` in app.jsx.
5. If not logged in: `<Navigate to="/signin" state={{from: '/join/CODE'}}>` (preserved across mobile redirect via sessionStorage).
6. `joinGroup()` looks up `inviteCodes/{code}`, gets `groupId`, creates a member doc keyed by `userId`.
7. Early-returns if user is already a member (preserves admin status — don't regress that either).

The join flow has **never been tested end-to-end with a second real Google account** as of handoff. The user said he wants to test with families but hasn't yet. There's a high chance something there is still broken — be ready to debug live.

## Firestore security rules

Source of truth: [firestore.rules](firestore.rules). **They are NOT auto-deployed** — every change requires the user to manually copy/paste them in Firebase Console → Firestore → Rules → Publish. Always remind him.

Key constraints the rules enforce:
- Only members can read group/children/blocks
- A user can always read their **own** member doc (so `joinGroup` can check if they're already a member before joining — without this, brand-new joiners hit permission-denied)
- `inviteCodes` are world-readable to authed users (so anyone with a link can resolve groupId)
- `userGroups` are read/write by any authed user (acceptable privacy tradeoff for a personal tool with ~5 users)

If you change `joinGroup` or `createGroup` to touch new paths, **you almost certainly need to update the rules too** and remind the user to republish.

## Onboarding flow

`['welcome', 'partner', 'kids', 'done']` — that's the whole thing. No "name your group" (auto-generated as `${firstName} & ${partnerName}'s Summer` or `${firstName}'s Summer Crew`). No "add camps" step (deliberately removed — Rene's quote: *"it doesn't make sense to add camps on onboarding this is just mostly for planning in the beginning, you may not have a camp yet"*). Camps are added from the empty cells in the grid.

## What's solid

- Sign-in (both Google and email/password) on desktop
- Group creation, invite code generation
- Calendar with real-time Firestore subscriptions (onSnapshot)
- Adding/editing/deleting blocks from the grid
- Empty grid callout banner + "ADD CAMP" labeled cells
- Auto-redirect of logged-in users from `/` to their group
- **MANAGE drawer** (button in calendar header) — add partner after onboarding, add/edit/remove kids, view partner-specific or general invite link. The partner section auto-collapses once the partner actually joins.

## What's untested / probably has bugs

- **Mobile Google sign-in.** Reworked twice. Last user feedback: "had trouble logging in on mobile, you sure you fixed everything there?" Not fully verified.
- **Mobile invite link flow.** Theoretically works via sessionStorage, but no real device test.
- **Joining a group as a second user.** Code paths exercised but not run with two real accounts.
- **Multiple parents on one grid.** Color-uniqueness logic has a fallback path (hash-based) that triggers when rules block reading the members list pre-join.
- **The partner step's `partnerName`.** Now persisted to the group doc, but nothing in the calendar reads it back yet. It just personalizes the Done-screen invite message.

## File map

```
src/
  main.jsx           — React entry
  app.jsx            — AuthProvider, HashRouter, routes, useGroup hook, JoinPage, GroupApp, useAuth()
  firebase.js        — Firebase init + ALL Firestore helpers (createGroup, joinGroup, addBlock, etc.)
  data.js            — WEEKS, DAYS, blockPickupByDay, buildCarpoolIndex (pure helpers, no hardcoded users)
  tokens.css         — Design tokens + mobile media queries
  ui.jsx             — Shared primitives (Button, Icon, Avatar, Drawer, Modal, Wordmark, Field, InputBox, Spinner)
  landing.jsx        — Public landing; auto-redirects logged-in users to their grid
  auth.jsx           — Sign-in/sign-up; handles mobile redirect via sessionStorage(FROM_KEY)
  onboarding.jsx     — 4-step flow → createGroup → setGroupId + setInviteCode → done screen
  calendar.jsx       — The grid (overview + weekly + block editor + invite modal). Uses CalCtx context.
  tweaks-panel.jsx   — Dev-only floating panel (Ctrl+Shift+T). Don't show to end users.

firestore.rules      — Security rules. Manually publish via Firebase Console after edits.
.github/workflows/deploy.yml — CI deploy
public/CNAME         — `summergrid.space`
SETUP.md             — User-facing one-time setup steps (Firebase auth, GitHub, DNS). Don't rewrite.
```

## Conventions Rene seems to care about

- Don't ship "demo" or "marketing" features unless asked. This is a real tool.
- Don't add validation/error states that block obvious flows (e.g. the original onboarding let camps through without kids assigned — quote: *"why would you design it like that?"*).
- Auto-defaults when there's an obvious right answer (e.g. one kid → auto-assigned to new camps).
- Use his vocabulary: "the grid", "camp", "pickup/dropoff", not generic UI terms.
- Pretty/minimal styling — black/white/orange palette in [tokens.css](src/tokens.css). Don't reinvent it.

## Common operations

```
npm run dev              # localhost:5173 against live Firebase
npm run build            # local production build, output to dist/
git push                 # auto-deploys via GitHub Actions
gh run watch             # watch the in-flight deploy from terminal (if gh CLI is installed)
```

## Known commits worth re-reading

- `e567476` — Critical invite/auth bug fixes (the audit commit)
- `7389565` — Simplified onboarding to 4 steps + empty grid callout

`git log --oneline` for the rest.
