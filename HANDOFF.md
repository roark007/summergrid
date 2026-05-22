# SummerGrid — Agent Handoff

Read this before doing anything. The user (Rene) is non-technical and learned everything by typing commands you give him. Hand-hold accordingly — give one command at a time, explain what it does, ask what he sees back.

## What this is

A real, deployed, multi-user web app for coordinating summer camps + pickups/dropoffs across families. **Long-term plan is city-wide.** Currently being tested with a handful of families. Not a demo or marketing site. The prototype it was built from is in `extracted/summergrid/` for reference only — don't edit those files.

- **Live at:** https://summergrid.space (hosted on Firebase Hosting, NOT GitHub Pages)
- **Default Firebase URL:** https://summergrid-bd6c5.web.app (same content, useful for debugging)
- **GitHub repo:** https://github.com/roark007/summergrid (owner: `roark007`)
- **Firebase project:** `summergrid-bd6c5` (console.firebase.google.com)
- **Owner email / GitHub:** rene.bhavnani@gmail.com

## Stack

- Vite + React 18 (no Next.js, no server)
- Firebase v10 modular SDK — Firestore (real-time DB) + Auth (Google + Email/Password) + App Check (reCAPTCHA v3)
- react-router-dom v6 with `HashRouter` (URLs use `/#/...` — static-hosting compatible)
- Hosted on **Firebase Hosting** (migrated from GitHub Pages mid-session to fix iOS Chrome OAuth issues)

Build output is ~720 KB gzipped to ~185 KB (Firebase SDK is heavy). Don't add bundle-splitting unless asked.

## Deploy pipeline

**Manual deploy via Firebase CLI.** There is NO auto-deploy on git push right now (the old GitHub Pages workflow was removed). To deploy:

```
npm run build
firebase deploy --only hosting
```

Both commands run from `C:\Summergrid`. Git is still used for version control / GitHub — but git push does NOT trigger a deploy. If you want CI auto-deploy, you'd need to set up a GitHub Actions workflow using `FirebaseExtended/action-hosting-deploy` and add a `FIREBASE_SERVICE_ACCOUNT` GitHub secret. Not urgent.

There is no staging environment. `npm run dev` runs locally against the live Firebase project.

## Firestore data model

```
groups/{groupId}                       — { name, inviteCode, partnerInviteCode, partnerName?, createdBy, createdAt, season }
  ├── members/{userId}                 — { name, short, initials, color, email, isAdmin, joinedAt, partnerOf? }
  ├── children/{childId}               — { name, age, parentId }   (parentId = the family unit's primary user id)
  └── blocks/{blockId}                 — { childId, weekIdx, campName, start, end, pickup, dropoff, pickupByDay?, dropoffByDay?, regDeadline?, regStatus?, notes? }

inviteCodes/{6-char-CODE}              — { groupId, kind, partnerOf?, createdAt }
                                         kind: 'general' | 'partner'
                                         partnerOf: only set on partner codes — userId of the inviter
userGroups/{userId_groupId}            — { userId, groupId }
                                         doc ID format enforced by security rules
```

**Family unit model (important):** A "family unit" is one primary parent + optionally one partner. They share children. Implementation:
- The primary's `members.{id}` has no `partnerOf` field.
- The partner's `members.{id}` has `partnerOf = primary.id`, and inherits the primary's color.
- All children belong to the **primary** (`children.parentId = primary.id`). Partners don't have their own kids — they share.
- In the grid, members are grouped by `familyId = m.partnerOf || m.id`. Each row shows both parents as an AvatarCluster.

Two invite codes per group:
- `inviteCode` → for inviting OTHER families (they get their own row on the grid with their own kids)
- `partnerInviteCode` → for inviting YOUR partner (they join your family unit, share your kids)

Onboarding's StepDone shows the **partner** invite. MANAGE drawer shows both, labeled separately. The standalone InviteModal (header "INVITE" button) shows only the general invite.

## Auth flow

- `AuthProvider` in [app.jsx](src/app.jsx) wraps everything, listens to `onAuthStateChanged`, shows spinner until first auth state resolves. Also calls `getRedirectResult` once on mount (legacy, kept for safety).
- `Protected` route component redirects to `/signin` with `state.from = current path` if not authed. **AND** if the user's email isn't verified, it renders `<VerifyEmailScreen>` instead of the children — gating access behind email verification.
- `useAuth()` hook returns the current Firebase User object (or null). `user.emailVerified` is true for Google signups (auto) and for email/password after they click the verification link.
- **Google sign-in uses `signInWithPopup`** on all platforms. We tried `signInWithRedirect` for mobile but it had two separate issues (silent failures, then cross-origin storage). Popup works once the auth handler is served on the same domain (see below).
- Single navigation path post-login: the `useEffect` watching `currentUser?.uid` in `AuthPage`. Don't add explicit navigations in click handlers — it causes double-navigates and races.

### Why mobile Chrome on iPhone is now fixed

The breakthrough: **`authDomain` in firebaseConfig is `summergrid.space`** (not the default `summergrid-bd6c5.firebaseapp.com`). Combined with Firebase Hosting serving the same domain, this means the OAuth redirect chain stays on a single origin. iOS no longer treats it as a third-party tracker and lets cookies flow.

This required:
1. Firebase Hosting custom domain setup at summergrid.space
2. SSL cert provisioning (took ~30 min)
3. Manually adding `https://summergrid.space` to Authorized JavaScript origins AND `https://summergrid.space/__/auth/handler` to Authorized redirect URIs in **Google Cloud Console → APIs & Services → Credentials** (the auto-sync from Firebase didn't pick this up)
4. Adding `summergrid.space` to Firebase Auth's Authorized Domains list

If iPhone Chrome sign-in ever breaks again, check those four things first.

## Invite/join flow

1. Onboarding creates a group → `createGroup()` returns `{ groupId, inviteCode, partnerInviteCode }`. Don't regress to returning just `groupId`.
2. `StepDone` shows the partner invite URL (only displayed if a partner name was entered during onboarding).
3. `ManageDrawer` has separate partner-invite and general-invite sections.
4. `InviteModal` (header → INVITE) shows only the general invite, with copy directing users to MANAGE for the partner invite.
5. Recipient clicks `/#/join/{code}` → `JoinPage` in app.jsx.
6. If not logged in: `<Navigate to="/signin" state={{from: '/join/CODE'}}>`. `sessionStorage(FROM_KEY)` preserves this across any auth redirect.
7. `joinGroup()` looks up `inviteCodes/{code}`, reads `kind` and `partnerOf`.
8. If `kind === 'partner'`, sets the new member's `partnerOf` field and inherits the inviter's color. Otherwise picks a new color from the palette.
9. Early-returns if user is already a member (preserves admin status).

The join flow has NOT been tested with a second real Google account as of handoff. Be ready to debug live.

## Firestore security rules

Source of truth: [firestore.rules](firestore.rules). **Manually publish in Firebase Console → Firestore → Rules → Publish after every change.** Always remind the user. There is no automated rules deployment.

Key constraints:
- Only members can read group/children/blocks subcollections
- A user can always read their **own** member doc (so `joinGroup` can check existing membership without permission errors)
- `inviteCodes` are world-readable to authed users (so anyone with a link can resolve groupId)
- `userGroups` are scoped: doc ID must match `^{request.auth.uid}_.*` — prevents enumeration across users

If you change `joinGroup`, `createGroup`, or add new collections, **you almost certainly need to update the rules too** and tell Rene to republish.

## Onboarding flow

`['welcome', 'partner', 'kids', 'done']` — that's it. No "name your group" (auto-generated as `${firstName} & ${partnerName}'s Summer` or `${firstName}'s Summer Crew`). No "add camps" step (deliberately removed — quote: *"it doesn't make sense to add camps on onboarding this is just mostly for planning in the beginning"*). Camps are added from the empty cells in the grid.

## Security posture (current)

Live and active:
- **Email verification** — required before access for email/password signups. Google users skip (Google pre-verifies).
- **Terms + Privacy** — at `/#/terms` and `/#/privacy`. Signup form has a required "I agree" checkbox. Content is reasonable but not lawyer-reviewed. ⚠️ A lawyer must review before any public launch — especially the COPPA section, since this app touches children's data.
- **Firestore rules** — restrictive, scoped to membership. `userGroups` rules use doc-id pattern matching to prevent enumeration.
- **App Check** — registered with reCAPTCHA v3 (`6Lc7P_csAAAAANpcK3rUPm_sYMhUCASsQ8qC6Ch5` is the public site key, in `src/firebase.js`). Secret key lives in Firebase Console. App Check is registered but NOT enforced — it's in monitoring mode. Don't enforce until Rene has reviewed metrics for several days to confirm legit traffic shows 100% verified.
- **HTTPS only** — Firebase Hosting auto-provisions Let's Encrypt certs.
- **Cache-control meta tags** in `index.html` to prevent stale HTML / stuck-on-old-version issues on mobile.

Still to do before "city-wide" public launch:
- **Enforce App Check** on Firestore + Auth (after monitoring period)
- **Move to Blaze plan** — free tier (Spark) limits at ~50K reads/day, would be exhausted very quickly at city scale. Set up budget alerts.
- **Backups** — Firestore auto-backup requires Blaze plan.
- **Abuse reporting + moderation** — none currently. At city scale you'll need at minimum a "Report group" link.
- **Privacy policy lawyer review.**

## What's solid

- Desktop + mobile sign-in (Google AND email/password), including iPhone Chrome
- Group creation, dual invite codes, partner vs general distinction
- Calendar with real-time Firestore subscriptions (onSnapshot on group, members, children, blocks)
- Adding/editing/deleting blocks from the grid
- Adding/editing/removing kids from MANAGE
- Adding partner name + showing partner invite from MANAGE
- Sign-out (in MANAGE drawer, with confirmation)
- Empty grid callout banner + "ADD CAMP" labeled cells
- Auto-redirect of logged-in users from `/` to their group
- Family unit grouping (primary + partner share kids and color)
- Email verification gate
- Privacy + Terms pages

## What's still untested or has caveats

- **Joining a group as a second user (any flow).** Code paths look right but no real-world test with two real Google accounts.
- **Partner join specifically.** The "shared family unit" UX is implemented but never observed in production.
- **App Check enforcement.** Currently monitoring only — turning enforcement on could lock out legit users if reCAPTCHA misclassifies them.
- **Old groups created before the partnerInviteCode feature.** They have a fallback path in MANAGE that reuses the general invite code as the partner invite — works, but it's the same code in both places.

## File map

```
src/
  main.jsx           — React entry
  app.jsx            — AuthProvider, HashRouter, all routes, useGroup hook, JoinPage, GroupApp, useAuth(), VerifyEmailScreen
  firebase.js        — Firebase init + App Check + ALL data helpers (createGroup, joinGroup, addBlock, addChild, etc.)
  data.js            — WEEKS, DAYS, pickup/dropoff helpers, buildCarpoolIndex (pure, no hardcoded users)
  tokens.css         — Design tokens + mobile media queries + cache-bust meta tags
  ui.jsx             — Shared primitives (Button, Icon, Avatar, AvatarCluster, Drawer, Modal, Wordmark, Field, InputBox, Spinner, Eyebrow)
  landing.jsx        — Public landing; auto-redirects logged-in users to their grid; footer links to /privacy and /terms
  auth.jsx           — Sign-in/sign-up; terms checkbox; sessionStorage(FROM_KEY) fallback
  onboarding.jsx     — 4-step flow → createGroup → setGroupId + setInviteCode + setPartnerInviteCode → done screen
  calendar.jsx       — The grid (overview + weekly + block editor + InviteModal + ManageDrawer + ExportModal). Uses CalCtx context.
  legal.jsx          — PrivacyPage + TermsPage. Lawyer review needed before public launch.
  tweaks-panel.jsx   — Dev-only floating panel (Ctrl+Shift+T to open). Don't show to end users.

firestore.rules      — Security rules. Manually publish via Firebase Console after edits.
firebase.json        — Firebase Hosting config (public: 'dist', SPA rewrites)
.firebaserc          — Project alias
SETUP.md             — Original one-time setup guide (a bit stale post-Firebase-Hosting migration)
HANDOFF.md           — This file
```

## Conventions Rene cares about

- Don't ship "demo" or "marketing" features unless asked. This is a real tool.
- Don't add validation/error states that block obvious flows. Quote: *"why would you design it like that?"* (re: original onboarding letting camps through without kids assigned)
- Auto-defaults when there's an obvious right answer (e.g. one kid → auto-assigned to new camps)
- Use his vocabulary: "the grid", "camp", "pickup/dropoff", not generic UI terms
- Minimal styling — black/white/orange palette in [tokens.css](src/tokens.css). Don't reinvent it.
- Don't suggest 30-min refactors when 10-min ones get most of the value. He gets frustrated by long estimates.

## Common operations

```
npm run dev                          # localhost:5173 against live Firebase
npm run build                        # local production build to dist/
firebase deploy --only hosting       # deploy dist/ to summergrid.space
git push                             # push to GitHub (does NOT deploy — see above)
```

## Manual things only Rene can do (recurring reminders)

- **Republish Firestore rules** after any change to `firestore.rules`
- **Enforce App Check** when ready (Firebase Console → App Check → click your app → switch to enforced)
- **Add domains to Authorized Domains** if you ever need a new one (Firebase Console → Authentication → Settings)
- **Update OAuth redirect URIs** in Google Cloud Console if authDomain changes again
- **Set up billing budget alert** before enabling Blaze plan

## Known commits worth knowing

- `b1ed7e1` — App Check live (reCAPTCHA v3 monitoring mode)
- `cfd3550` — Email verification + Privacy/Terms pages
- `b24b80c` — authDomain switched to summergrid.space, GitHub Pages workflow removed
- `0c2a7d4` — Partner vs general invite separation, family unit rendering
- `1d32861` — Sign-out button in MANAGE
- `e567476` — Critical invite/auth bug fixes (the audit commit)
- `7389565` — Simplified onboarding to 4 steps + empty grid callout

`git log --oneline` for full history.
