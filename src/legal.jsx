// Privacy Policy and Terms of Service pages.
// IMPORTANT: These are reasonable starting drafts but NOT a substitute for review by a lawyer
// before launching to the public, especially given children's data is involved (COPPA in the US,
// GDPR in EU, similar laws elsewhere).

import { useNavigate } from 'react-router-dom';
import { Wordmark, Eyebrow, Button } from './ui.jsx';

const LAST_UPDATED = 'May 22, 2026';

function LegalShell({ eyebrow, title, children }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--sg-white)' }}>
      <header style={{ borderBottom: '1px solid var(--sg-ink-10)', padding: '20px 32px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Wordmark size={18}/>
        </button>
        <div style={{ flex: 1 }}/>
        <Button variant="ghost" size="sm" icon="arrowL" onClick={() => navigate(-1)}>BACK</Button>
      </header>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 32px 96px' }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="sg-display" style={{ fontSize: 'clamp(40px, 7vw, 72px)', margin: '16px 0 8px' }}>{title}</h1>
        <div className="sg-mono" style={{ fontSize: 11, color: 'var(--sg-ink-60)', letterSpacing: '0.08em', marginBottom: 48 }}>
          LAST UPDATED · {LAST_UPDATED}
        </div>
        <div style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--sg-ink-90)' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

const H2 = ({ children }) => (
  <h2 style={{ fontFamily: 'var(--sg-font-display)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', margin: '40px 0 12px' }}>
    {children}
  </h2>
);
const P = ({ children }) => <p style={{ margin: '0 0 16px' }}>{children}</p>;
const UL = ({ children }) => <ul style={{ margin: '0 0 16px', paddingLeft: 24 }}>{children}</ul>;
const LI = ({ children }) => <li style={{ margin: '0 0 8px' }}>{children}</li>;

export function PrivacyPage() {
  return (
    <LegalShell eyebrow="LEGAL" title="Privacy Policy">
      <P>
        SummerGrid (we / us) is a tool to help families coordinate summer-camp planning, pickups, and dropoffs. We take your privacy — and especially the privacy of your children's information — seriously. This page explains what we collect, how we use it, and what control you have over it.
      </P>

      <H2>What we collect</H2>
      <UL>
        <LI><strong>Account info:</strong> your name, email address, and (if you sign in with Google) a profile photo URL.</LI>
        <LI><strong>Family info:</strong> first names and ages of children you add to your grid. We do not collect last names, photos, school names, or any other identifying information about children.</LI>
        <LI><strong>Camp info:</strong> the names of camps, weeks, times, and which parent is handling each pickup/dropoff.</LI>
        <LI><strong>Usage info:</strong> standard server logs (IP address, browser type, timestamps) collected automatically by our hosting provider for security and reliability.</LI>
      </UL>

      <H2>How we use it</H2>
      <P>We use the information only to provide the SummerGrid service: showing your grid to you and your group members, sending you a verification email when you sign up, and sending password reset emails if you request them. We do not sell or rent your data to anyone. We do not show advertising. We do not profile users.</P>

      <H2>Who can see your data</H2>
      <UL>
        <LI><strong>You and members of your group.</strong> Anyone who has joined your group via your invite link can see the kids, camps, and pickup assignments in that group.</LI>
        <LI><strong>Google Firebase</strong> stores the data on our behalf. We use Firebase Authentication, Firestore, and Hosting — all are Google products under Google's standard privacy practices.</LI>
        <LI><strong>Nobody else.</strong> We do not share data with advertisers, brokers, or analytics platforms.</LI>
      </UL>

      <H2>Children's privacy</H2>
      <P>SummerGrid is intended to be used by parents and guardians, not by children. Accounts can only be created by adults. The only information about children stored in the system is the first name and age that a parent enters — no contact information, photos, or location data about children is collected.</P>
      <P>If you are a parent who has discovered that information about your child appears in our system and you want it removed, contact us using the address below and we will delete it.</P>

      <H2>Your rights</H2>
      <P>You can:</P>
      <UL>
        <LI>Edit or remove your kids and camps at any time from the MANAGE panel in the app.</LI>
        <LI>Sign out and stop using the service at any time.</LI>
        <LI>Request deletion of your account and all associated data by emailing us (see Contact below).</LI>
        <LI>Request an export of your data in a machine-readable format.</LI>
      </UL>
      <P>If you are in the EU/UK (GDPR), California (CCPA/CPRA), or another jurisdiction with similar rights, those rights apply to you and we will respect them.</P>

      <H2>Cookies and similar technologies</H2>
      <P>We use cookies and browser storage only as required for the service to function — specifically, to keep you signed in. We do not use tracking, advertising, or analytics cookies.</P>

      <H2>Data retention</H2>
      <P>We keep your data for as long as your account is active. If you delete your account, we will permanently delete your data within 30 days, except where retention is required by law (e.g., transaction records for tax purposes — though we don't collect payment info, so this is unlikely to apply).</P>

      <H2>Security</H2>
      <P>Data is transmitted over HTTPS and stored encrypted at rest in Google Cloud / Firebase. Access to your group's data requires authentication. No system is perfectly secure, but we follow industry best practices.</P>

      <H2>Changes to this policy</H2>
      <P>If we make material changes to this policy, we will notify active users by email or with a notice in the app. Continued use of SummerGrid after a change constitutes acceptance.</P>

      <H2>Contact</H2>
      <P>For privacy questions, data requests, or any other concern, email <strong>rene.bhavnani@gmail.com</strong>.</P>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell eyebrow="LEGAL" title="Terms of Service">
      <P>By creating an account or using SummerGrid, you agree to these terms. If you don't agree, please don't use the service.</P>

      <H2>Who can use SummerGrid</H2>
      <P>You must be at least 18 years old (or the age of legal majority in your jurisdiction) and able to enter into a binding contract. SummerGrid is intended for parents and guardians. Children should not create accounts.</P>

      <H2>Your account</H2>
      <P>You are responsible for keeping your password secure and for any activity under your account. Use a strong password, and don't share it. If you suspect unauthorized use, contact us immediately.</P>

      <H2>What you can do</H2>
      <P>You can use SummerGrid to coordinate camp planning with your family and other families you trust. You can invite people via the invite links — but only invite people you actually want to share your kids' schedules with.</P>

      <H2>What you cannot do</H2>
      <UL>
        <LI>Use the service to harass, harm, or impersonate others.</LI>
        <LI>Upload illegal content or content that violates someone's privacy.</LI>
        <LI>Attempt to reverse-engineer, scrape, or attack the service.</LI>
        <LI>Create accounts in bulk, use bots, or evade rate limits.</LI>
        <LI>Use SummerGrid for commercial spam or unsolicited messaging.</LI>
      </UL>

      <H2>Content you provide</H2>
      <P>You own the data you put into SummerGrid. By using the service, you grant us a limited license to store, display, and process that data only as needed to provide the service to you and your group members.</P>

      <H2>Service availability</H2>
      <P>SummerGrid is provided "as is" without warranty of any kind. We try to keep it running smoothly but we can't promise zero downtime or that it will be free of bugs. We may change, suspend, or shut down features at any time.</P>

      <H2>Termination</H2>
      <P>You can stop using SummerGrid at any time. We may suspend or terminate accounts that violate these terms or pose a risk to other users.</P>

      <H2>Limitation of liability</H2>
      <P>To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from your use of the service. Our total liability is limited to the amount you paid for the service in the prior 12 months — which is currently zero, because SummerGrid is free.</P>

      <H2>Governing law</H2>
      <P>These terms are governed by the laws of the United States and the state of residence of the operator, without regard to conflict-of-laws principles.</P>

      <H2>Changes</H2>
      <P>We may update these terms. If we make material changes, we'll notify you. Continued use after changes constitutes acceptance.</P>

      <H2>Contact</H2>
      <P>Questions about these terms? Email <strong>rene.bhavnani@gmail.com</strong>.</P>
    </LegalShell>
  );
}
