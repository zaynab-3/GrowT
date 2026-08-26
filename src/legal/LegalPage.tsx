import { ArrowLeft, ExternalLink, Sprout } from 'lucide-react'
import { useEffect } from 'react'
import { GrowTLogo } from '../components/GrowTLogo'
import './LegalPage.css'

type LegalDocument = 'privacy' | 'terms'

type LegalPageProps = {
  document: LegalDocument
}

const SUPPORT_EMAIL = 'zaynab10farran@gmail.com'
const LAST_UPDATED = 'August 26, 2026'

function PrivacyPolicy() {
  return (
    <>
      <header className="legal-page__hero">
        <span className="legal-page__eyebrow"><Sprout aria-hidden="true" size={16} /> Your data, explained plainly</span>
        <h1>Privacy Policy</h1>
        <p>
          GrowT helps people organise tasks, projects, and collaboration. This policy explains what
          information GrowT handles, why it is used, and the choices available to you.
        </p>
        <small>Last updated {LAST_UPDATED}</small>
      </header>

      <section aria-labelledby="privacy-scope">
        <h2 id="privacy-scope">1. Information GrowT handles</h2>
        <h3>Account and profile information</h3>
        <p>
          When you create an account, GrowT handles information such as your email address, display
          name, username, profile image or selected avatar, and authentication identifiers.
        </p>
        <h3>Content you create</h3>
        <p>
          GrowT stores the folders, tasks, descriptions, links, due dates, progress updates,
          collaboration choices, and other content you choose to add. When you share a folder or
          task, the people you select can see the information made available to them.
        </p>
        <h3>Service and preference information</h3>
        <p>
          GrowT uses the session, theme, installation, and interface preferences needed to keep you
          signed in and provide the features you request. GrowT does not use Google Tasks data for
          advertising or sell personal information.
        </p>
      </section>

      <section aria-labelledby="google-tasks" id="google-tasks">
        <h2>2. Google Tasks integration</h2>
        <div className="legal-page__callout">
          <strong>Read-only and optional.</strong>
          <p>You choose whether to connect Google Tasks, and GrowT requests the narrow read-only permission.</p>
        </div>
        <p>
          If you connect Google Tasks, GrowT accesses your open task lists and tasks so they can be
          displayed in your personal GrowT task list. The imported information can include task and
          list identifiers, title, notes, due date, update time, status, and a Google-provided link
          to the original task.
        </p>
        <p>
          GrowT stores an imported copy of this task information in its database to provide the sync
          feature. GrowT does not create, edit, complete, or delete tasks in your Google account.
          Images and attachments are not copied into GrowT; when Google provides a link, GrowT lets
          you open the original task in Google to view them.
        </p>
        <p>
          GrowT checks for changes while the app is open or when you select <em>Sync now</em>.
          Imported Google task information is used only to provide and improve this user-facing sync
          feature. It is not sold, used for advertising, or used to train general-purpose AI models.
        </p>
        <p>
          GrowT's use and transfer of information received from Google Workspace APIs adheres to the{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" rel="noopener noreferrer" target="_blank">
            Google API Services User Data Policy
            <ExternalLink aria-hidden="true" size={14} />
          </a>
          , including the Limited Use requirements.
        </p>
      </section>

      <section aria-labelledby="privacy-use">
        <h2 id="privacy-use">3. How information is used</h2>
        <ul>
          <li>Provide authentication, profiles, task management, sharing, and collaboration.</li>
          <li>Sync the Google Tasks information you explicitly authorize.</li>
          <li>Maintain, secure, troubleshoot, and improve GrowT.</li>
          <li>Respond to support, privacy, or account requests.</li>
          <li>Comply with applicable law and protect users from abuse or security threats.</li>
        </ul>
      </section>

      <section aria-labelledby="privacy-sharing">
        <h2 id="privacy-sharing">4. When information is shared</h2>
        <p>GrowT does not sell your personal information or Google user data. Information may be shared:</p>
        <ul>
          <li>With other GrowT users only when you choose to share or collaborate with them.</li>
          <li>
            With infrastructure providers such as Supabase and Vercel, only as needed to host,
            authenticate, store, and operate GrowT.
          </li>
          <li>When required by applicable law or reasonably necessary to protect rights and security.</li>
          <li>As part of a business transfer, subject to appropriate notice and applicable requirements.</li>
        </ul>
        <p>
          Links to Google Tasks or other external services open those services under their own terms
          and privacy policies.
        </p>
      </section>

      <section aria-labelledby="privacy-retention">
        <h2 id="privacy-retention">5. Storage, retention, and security</h2>
        <p>
          GrowT retains information for as long as needed to operate your account and the features you
          use. Completed or removed Google tasks may be hidden from the active GrowT list while their
          imported record is retained for task integrity or restoration. You can delete GrowT content
          using available controls or request account and data deletion by email.
        </p>
        <p>
          GrowT uses access controls and reasonable technical measures designed to protect information.
          No internet service can guarantee absolute security.
        </p>
      </section>

      <section aria-labelledby="privacy-choices">
        <h2 id="privacy-choices">6. Your choices and requests</h2>
        <ul>
          <li>You can update profile and task information inside GrowT.</li>
          <li>
            You can revoke GrowT's Google access from your Google Account connections. Revoking access
            stops future Google Tasks syncing but does not automatically erase copies already imported
            into GrowT.
          </li>
          <li>
            You can request access, correction, export, or deletion of your GrowT account information
            by contacting the address below. Requests may require identity verification.
          </li>
        </ul>
      </section>

      <section aria-labelledby="privacy-children">
        <h2 id="privacy-children">7. Children</h2>
        <p>
          GrowT is not directed to children under 13, and we do not knowingly collect their personal
          information. Contact us if you believe a child has provided information to GrowT.
        </p>
      </section>

      <section aria-labelledby="privacy-updates">
        <h2 id="privacy-updates">8. Updates and contact</h2>
        <p>
          This policy may be updated as GrowT changes. The updated date above will identify the latest
          version, and significant changes will be communicated when required.
        </p>
        <p>
          For privacy questions or data requests, email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </>
  )
}

function TermsOfService() {
  return (
    <>
      <header className="legal-page__hero">
        <span className="legal-page__eyebrow"><Sprout aria-hidden="true" size={16} /> Clear expectations</span>
        <h1>Terms of Service</h1>
        <p>These terms govern your access to and use of GrowT.</p>
        <small>Last updated {LAST_UPDATED}</small>
      </header>

      <section>
        <h2>1. Accepting these terms</h2>
        <p>
          By creating an account or using GrowT, you agree to these terms and the Privacy Policy. If
          you do not agree, do not use the service. You must be able to enter into a binding agreement
          where you live and must provide accurate account information.
        </p>
      </section>

      <section>
        <h2>2. Your account</h2>
        <p>
          You are responsible for activity under your account and for keeping access to your email and
          credentials secure. Tell us promptly if you believe your account has been compromised. Do not
          impersonate another person or use GrowT in a way that interferes with other users.
        </p>
      </section>

      <section>
        <h2>3. Using GrowT</h2>
        <p>You may use GrowT for lawful personal and collaborative task management. You may not:</p>
        <ul>
          <li>Use GrowT to violate law, infringe rights, harass others, or distribute harmful content.</li>
          <li>Attempt unauthorized access, disrupt the service, or bypass security controls.</li>
          <li>Upload malware, automate abusive traffic, scrape the service, or misuse invitations.</li>
          <li>Resell or misrepresent GrowT or use it to build a competing copy without permission.</li>
        </ul>
      </section>

      <section>
        <h2>4. Your content and collaboration</h2>
        <p>
          You keep ownership of content you add. You give GrowT permission to host, process, display,
          and transmit that content only as needed to operate and improve the service. You must have
          the right to add and share your content. People you invite may view or act on shared content
          according to the permissions and features available in GrowT.
        </p>
      </section>

      <section>
        <h2>5. Google Tasks and third-party services</h2>
        <p>
          The Google Tasks connection is optional and read-only. By connecting it, you authorize GrowT
          to retrieve and store the task information described in the Privacy Policy. Your use of Google
          services remains subject to Google's terms. You may revoke GrowT's Google access through your
          Google Account.
        </p>
        <p>
          GrowT may link to third-party services. GrowT does not control those services and is not
          responsible for their content, availability, or separate terms.
        </p>
      </section>

      <section>
        <h2>6. Service changes and availability</h2>
        <p>
          GrowT may change, improve, suspend, or discontinue features. We aim to keep the service
          reliable but do not guarantee uninterrupted or error-free availability. Features may depend
          on third-party providers such as Google, Supabase, and Vercel.
        </p>
      </section>

      <section>
        <h2>7. Suspension and termination</h2>
        <p>
          You may stop using GrowT at any time and may request account deletion. GrowT may restrict or
          terminate access when reasonably necessary for security, legal compliance, serious misuse,
          or violation of these terms. Where appropriate, we will provide notice or an opportunity to
          address the issue.
        </p>
      </section>

      <section>
        <h2>8. Disclaimers and responsibility</h2>
        <p>
          GrowT is provided on an “as is” and “as available” basis to the extent permitted by law.
          GrowT is a productivity tool and should not be your only record for critical information.
          To the extent permitted by law, GrowT is not liable for indirect, incidental, special,
          consequential, or punitive losses arising from use of the service. Nothing in these terms
          excludes rights or liability that cannot legally be excluded.
        </p>
      </section>

      <section>
        <h2>9. Changes and contact</h2>
        <p>
          These terms may be updated as the service changes. Continued use after an effective update
          means you accept the revised terms where permitted by law. For questions, email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </>
  )
}

export function LegalPage({ document }: LegalPageProps) {
  const title = document === 'privacy' ? 'Privacy Policy' : 'Terms of Service'

  useEffect(() => {
    const previousTitle = window.document.title
    window.document.title = `${title} — GrowT`
    window.scrollTo({ top: 0 })

    return () => {
      window.document.title = previousTitle
    }
  }, [title])

  return (
    <main className="legal-page">
      <nav aria-label="Legal page navigation" className="legal-page__nav">
        <a className="legal-page__brand" href="/">
          <GrowTLogo size={30} />
          <span>GrowT</span>
        </a>
        <a className="legal-page__back" href="/">
          <ArrowLeft aria-hidden="true" size={17} />
          Back to GrowT
        </a>
      </nav>

      <article className="legal-page__document">
        {document === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
      </article>

      <footer className="legal-page__footer">
        <span>© {new Date().getFullYear()} GrowT</span>
        <nav aria-label="Legal documents">
          <a aria-current={document === 'privacy' ? 'page' : undefined} href="/privacy">Privacy Policy</a>
          <a aria-current={document === 'terms' ? 'page' : undefined} href="/terms">Terms of Service</a>
        </nav>
      </footer>
    </main>
  )
}
