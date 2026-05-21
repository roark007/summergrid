# SummerGrid — Setup Guide

Everything you need to go from this folder to a live site at summergrid.space.

---

## Step 1 — Firebase: finish the setup

You already created a Firebase project and added the config. Now do these in the Firebase console (console.firebase.google.com → your project):

### Enable Authentication

1. Left sidebar → **Build → Authentication**
2. Click **Get started**
3. **Sign-in method** tab → **Google** → Enable → set your support email → Save
4. Still on Sign-in method → **Email/Password** → Enable the first toggle (leave passwordless off) → Save

### Set up Firestore Database

1. Left sidebar → **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** → pick a region (us-central1 is fine) → Done
4. Once created, click the **Rules** tab and replace everything with the contents of `firestore.rules` in this repo → **Publish**

### Add your domain to Authorized Domains

1. Authentication → **Settings** → **Authorized domains**
2. Click **Add domain** → type `summergrid.space` → Add
3. Also add `www.summergrid.space` if you want the www to work

---

## Step 2 — Create a GitHub repository

1. Go to github.com → **New repository**
2. Name it `summergrid` (or anything — the domain is what matters)
3. Set it to **Public** (GitHub Pages is free for public repos)
4. Don't initialize with README — leave it empty

Then in this folder:
```bash
cd C:\Summergrid
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/summergrid.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3 — Enable GitHub Pages

1. In your GitHub repo → **Settings** → **Pages** (left sidebar)
2. Under **Source** select **Deploy from a branch**
3. Branch: `gh-pages` / folder: `/ (root)` → Save
4. Under **Custom domain** type `summergrid.space` → Save
5. Check **Enforce HTTPS** once the DNS is verified (may take a few minutes)

The first GitHub Actions deploy happens automatically when you push to `main`. Watch the **Actions** tab in your repo — the deploy job runs in ~1 minute. After it succeeds a `gh-pages` branch appears.

---

## Step 4 — Point your domain at GitHub Pages

In your domain registrar's DNS settings for `summergrid.space`, add these records:

| Type  | Name | Value                  |
|-------|------|------------------------|
| A     | @    | 185.199.108.153        |
| A     | @    | 185.199.109.153        |
| A     | @    | 185.199.110.153        |
| A     | @    | 185.199.111.153        |
| CNAME | www  | YOUR_USERNAME.github.io |

DNS changes can take minutes to 24 hours to propagate. Once they propagate, GitHub will issue a free HTTPS certificate automatically.

---

## Step 5 — Test locally

```bash
npm run dev
```

Opens at http://localhost:5173. Sign in with Google, go through onboarding, and confirm data appears in your Firebase console (Firestore → groups collection).

---

## Ongoing deployment

Every `git push origin main` triggers a fresh deploy via GitHub Actions. The workflow file is at `.github/workflows/deploy.yml`. You never need to run `npm run build` manually — Actions handles it.

---

## Inviting other families

Once the site is live:

1. Sign in and complete onboarding
2. On the Done screen copy the invite link (e.g. `https://summergrid.space/#/join/ABC123`)
3. Send it to other parents — they click it, sign in with Google or email, and land in your group automatically

---

## File structure reference

```
C:\Summergrid\
├── src\
│   ├── main.jsx          React entry point
│   ├── app.jsx           Auth, routing, real-time subscriptions
│   ├── firebase.js       Firebase config + all DB helpers
│   ├── data.js           WEEKS/DAYS constants + helper fns (no hardcoded families)
│   ├── tokens.css        Design tokens (colors, fonts, spacing)
│   ├── ui.jsx            Shared UI primitives (Button, Icon, Avatar, etc.)
│   ├── landing.jsx       Public landing page
│   ├── auth.jsx          Sign-in / sign-up page
│   ├── onboarding.jsx    5-step new group setup
│   ├── calendar.jsx      The main grid + weekly view + block editor
│   └── tweaks-panel.jsx  Dev-only floating design tweaks (Ctrl+Shift+T)
├── public\
│   ├── favicon.svg
│   └── CNAME             summergrid.space
├── firestore.rules       Firestore security rules (deploy via Firebase console)
├── .github\workflows\
│   └── deploy.yml        Auto-deploy to GitHub Pages on push to main
├── index.html
├── vite.config.js
└── package.json
```
