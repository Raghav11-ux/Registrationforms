import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'https://registrationforms-1.onrender.com'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  gender: '',
  password: '',
}

function getMemberId(userId) {
  const numericId = Array.from(String(userId)).reduce((total, character) => total + character.charCodeAt(0), 0)
  return `MEM-${String(numericId).padStart(6, '0').slice(-6)}`
}

function App() {
  const [mode, setMode] = useState('register')
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [hasContinued, setHasContinued] = useState(false)
  const [accountView, setAccountView] = useState('details')
  const [accountForm, setAccountForm] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [publicView, setPublicView] = useState('home')
  const passwordScore = [
    form.password.length >= 6,
    /[A-Z]/.test(form.password),
    /\d/.test(form.password),
  ].filter(Boolean).length

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}${mode === 'register' ? '/api/register' : '/api/login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.message || 'Registration failed')

      setStatus({ type: 'success', message: result.message })
      setAccountName(result.user.name)
      setCurrentUser(result.user)
      setAccountView('dashboard')
      setHasContinued(true)
      setForm(mode === 'register' ? initialForm : { ...initialForm, email: '', password: '' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (currentUser) {
    if (hasContinued) {
      if (accountView === 'edit' && accountForm) {
        async function saveAccount(event) {
          event.preventDefault()
          const response = await fetch(`${API_URL}/api/account/${currentUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(accountForm) })
          const result = await response.json()
          if (!response.ok) throw new Error(result.message || 'Unable to update account')
          setCurrentUser(result.user)
          setAccountName(result.user.name)
          setAccountView('details')
        }

        return (
          <main className="account-page">
            <section className="account-card details-card edit-card">
              <button type="button" className="back-button" onClick={() => setAccountView('settings')}>Back</button>
              <p className="eyebrow">Edit profile</p>
              <h1>Edit account</h1>
              <form onSubmit={saveAccount} className="account-form">
                <label>Full name<input value={accountForm.name} onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })} required /></label>
                <label>Phone number<input value={accountForm.phone} onChange={(event) => setAccountForm({ ...accountForm, phone: event.target.value })} pattern="[0-9]{10}" maxLength="10" required /></label>
                <label>Date of birth<input type="date" value={accountForm.dob} onChange={(event) => setAccountForm({ ...accountForm, dob: event.target.value })} required /></label>
                <label>Gender<select value={accountForm.gender} onChange={(event) => setAccountForm({ ...accountForm, gender: event.target.value })} required><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></label>
                <button type="submit">Save changes</button>
              </form>
            </section>
          </main>
        )
      }

      if (accountView === 'details' || accountView === 'settings') {
        return (
          <main className="account-page">
            <section className="account-card details-card">
              <button type="button" className="back-button" onClick={() => setAccountView('dashboard')}>Dashboard</button>
              <button type="button" className="settings-button" onClick={() => setAccountView('settings')} aria-label="Open account settings" title="Account settings">⚙</button>
              <p className="eyebrow">Your profile</p>
              <h1>Account details</h1>
              <p className="account-message">Here is the information saved to your account.</p>
              <dl className="account-details">
                <div><dt>Member ID</dt><dd>{getMemberId(currentUser.id)}</dd></div>
                <div><dt>Full name</dt><dd>{currentUser.name}</dd></div>
                <div><dt>Phone number</dt><dd>{currentUser.phone}</dd></div>
                <div><dt>Date of birth</dt><dd>{currentUser.dob}</dd></div>
                <div><dt>Email address</dt><dd>{currentUser.email}</dd></div>
              </dl>
              {accountView === 'settings' && (
                <div className="settings-overlay" role="dialog" aria-modal="true" aria-label="Account settings">
                  <button type="button" className="settings-close" onClick={() => setAccountView('details')} aria-label="Close settings">×</button>
                  <p className="eyebrow">Account settings</p>
                  <h2>Settings</h2>
                  <p className="account-message">Manage your profile or leave your account.</p>
                  <button type="button" className="edit-account-button" onClick={() => { setAccountForm({ ...currentUser }); setAccountView('edit') }}>Edit account</button>
                  <button type="button" className="details-logout" onClick={() => { setCurrentUser(null); setAccountName(''); setHasContinued(false); setAccountView('details'); setPublicView('home'); setStatus({ type: '', message: '' }) }}>Log out</button>
                </div>
              )}
            </section>
          </main>
        )
      }

      return (
        <main className={`dashboard-page${isDarkMode ? ' dark-dashboard' : ''}`}>
          <header className="dashboard-header">
            <div>
              <p className="eyebrow">Member dashboard</p>
              <h1>Welcome, {currentUser.name}</h1>
            </div>
            <div className="dashboard-actions">
              <button type="button" className="theme-button" onClick={() => setIsDarkMode(!isDarkMode)} aria-label={isDarkMode ? 'Use light theme' : 'Use dark theme'} title={isDarkMode ? 'Use light theme' : 'Use dark theme'}>{isDarkMode ? '☼' : '◐'}</button>
              <button type="button" className="profile-button" onClick={() => setAccountView('details')} aria-label="Open account details" title="Account details">{currentUser.name.charAt(0).toUpperCase()}</button>
            </div>
          </header>
          <section className="dashboard-content">
            <div className="dashboard-intro">
              <p className="dashboard-kicker">You are all set</p>
              <h2>Your account is ready.</h2>
              <p>Keep your details up to date and manage your membership from one place.</p>
            </div>
            <div className="dashboard-signal">
              <div><span className="signal-number">01</span><span><strong>Member space</strong><small>A place for your account and next steps.</small></span></div>
              <div><span className="signal-number">02</span><span><strong>Profile ready</strong><small>Your essential details are complete.</small></span></div>
              <div><span className="signal-number">03</span><span><strong>Stay connected</strong><small>Return anytime to manage your profile.</small></span></div>
            </div>
            <div className="dashboard-grid dashboard-metrics">
              <article className="dashboard-card profile-summary">
                <span className="card-label">Profile status</span>
                <strong>Complete</strong>
                <p>Your registration details have been saved successfully.</p>
                <button type="button" onClick={() => setAccountView('details')}>View account details</button>
              </article>
              <article className="dashboard-card">
                <span className="card-label">Member ID</span>
                <strong>{getMemberId(currentUser.id)}</strong>
                <p>Your unique membership reference.</p>
              </article>
              <article className="dashboard-card">
                <span className="card-label">Account status</span>
                <strong className="status-value"><span className="status-dot" />Active</strong>
                <p>Your account is ready to use.</p>
              </article>
            </div>
            <section className="activity-panel">
              <div><p className="card-label">Recent activity</p><h2>Your membership timeline</h2></div>
              <div className="activity-list"><div><span className="activity-icon">✓</span><p><strong>Account created</strong><small>Your registration was completed successfully.</small></p><time>Now</time></div><div><span className="activity-icon">↗</span><p><strong>Profile ready</strong><small>Your details are available from Account details.</small></p><time>Today</time></div></div>
            </section>
          </section>
        </main>
      )
    }

    return (
      <main className="account-page">
        <section className="account-card">
          <p className="eyebrow">Member area</p>
          <div className="avatar" aria-hidden="true">{currentUser.name.charAt(0).toUpperCase()}</div>
          <h1>Welcome, {currentUser.name}</h1>
          <p className="account-message">{hasContinued ? 'You are all set. Enjoy your experience.' : 'You are signed in and ready to continue.'}</p>
          <div className="account-details">
            <span>Account email</span>
            <strong>{currentUser.email}</strong>
          </div>
          <button type="button" className="continue-button" onClick={() => { setAccountView('dashboard'); setHasContinued(true) }}>Continue</button>
        </section>
      </main>
    )
  }

  if (['home', 'about', 'contact', 'privacy', 'terms'].includes(publicView)) {
    return (
      <main className="public-site">
        <header className="public-header">
          <button type="button" className="public-logo" onClick={() => setPublicView('home')}>From<span>space</span></button>
          <nav className="public-nav" aria-label="Main navigation">
            <button type="button" className={publicView === 'home' ? 'active' : ''} onClick={() => setPublicView('home')}>Home</button>
            <button type="button" className={publicView === 'about' ? 'active' : ''} onClick={() => setPublicView('about')}>About</button>
          </nav>
          <div className="public-actions"><button type="button" className="public-signin" onClick={() => { setMode('login'); setPublicView('auth') }}>Sign in</button><button type="button" className="public-join" onClick={() => { setMode('register'); setPublicView('auth') }}>Join now <span>↗</span></button></div>
        </header>
        {publicView === 'home' ? (
          <>
            <section className="public-hero"><div className="hero-copy"><p className="eyebrow">A simpler way to belong</p><h1>Your details. <em>Your space.</em></h1><p>One thoughtful place to create, manage, and access your member account with confidence.</p><div className="hero-actions"><button type="button" className="hero-primary" onClick={() => { setMode('register'); setPublicView('auth') }}>Create your account <span>↗</span></button><button type="button" className="hero-secondary" onClick={() => setPublicView('about')}>Meet the creator</button></div></div><div className="hero-art" aria-hidden="true"><div className="hero-art-label">MEMBER / 01</div><div className="hero-art-circle"><span>FS</span></div><div className="hero-art-line" /><div className="hero-art-note">Designed for clear<br />digital beginnings.</div></div></section>
            <section className="public-proof"><div><strong>01</strong><span>Simple by design</span></div><div><strong>02</strong><span>Secure account flow</span></div><div><strong>03</strong><span>Built with care</span></div></section>
          </>
        ) : publicView === 'about' ? (
          <section className="about-page"><div className="about-heading"><p className="eyebrow">The person behind the project</p><h1>Built with curiosity,<br /><em>shaped for people.</em></h1></div><div className="about-grid"><div className="creator-mark">RK<span>G</span></div><div className="creator-copy"><p className="creator-role">Student / Creator</p><h2>Raghav Krishnan G</h2><p>I'm a student building approachable digital experiences that make everyday online tasks feel simpler, clearer, and more human.</p><dl><div><dt>Based at</dt><dd>Sri Sairam Engineering College<br />Chennai, Tamil Nadu</dd></div><div><dt>Contact</dt><dd><a href="mailto:raghavkrishnan983@gmail.com">raghavkrishnan983@gmail.com</a></dd></div></dl><button type="button" className="hero-primary" onClick={() => { setMode('register'); setPublicView('auth') }}>Start your account <span>↗</span></button></div></div></section>
        ) : publicView === 'contact' ? (
          <section className="legal-page contact-page"><p className="eyebrow">Get in touch</p><h1>Have a question?</h1><p>For feedback, collaboration, or questions about Fromspace, contact the creator directly.</p><a className="contact-email" href="mailto:raghavkrishnan983@gmail.com">raghavkrishnan983@gmail.com <span>↗</span></a><div className="contact-details"><span>Raghav Krishnan G</span><span>Sri Sairam Engineering College</span><span>Chennai, Tamil Nadu</span></div></section>
        ) : (
          <section className="legal-page"><p className="eyebrow">Fromspace / {publicView === 'privacy' ? 'Privacy' : 'Terms'}</p><h1>{publicView === 'privacy' ? 'Privacy, made clear.' : 'Terms of use.'}</h1>{publicView === 'privacy' ? <><p>Fromspace collects the account information you provide, such as your name, email address, phone number, date of birth, and gender, so the service can create and manage your member account.</p><p>Your information is used for account access, profile management, and service communication. We do not sell your personal information. Keep your password private and contact us if you notice anything unusual.</p></> : <><p>By using Fromspace, you agree to provide accurate information and keep your account credentials secure. You are responsible for activity performed through your account.</p><p>Fromspace is a student-created project provided for account registration and profile management. Features may change as the project develops. Questions can be sent to the creator through the Contact page.</p></>}<button type="button" className="hero-secondary legal-back" onClick={() => setPublicView('home')}>← Back to Fromspace</button></section>
        )}
        <footer className="public-footer"><span>Fromspace / 2026</span><span className="footer-links"><button type="button" onClick={() => setPublicView('contact')}>Contact</button><button type="button" onClick={() => setPublicView('privacy')}>Privacy</button><button type="button" onClick={() => setPublicView('terms')}>Terms</button></span></footer>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="intro-panel">
        <p className="eyebrow">{mode === 'register' ? 'Registration portal' : 'Member sign in'}</p>
        <h1>{mode === 'register' ? 'Create your account' : accountName ? `Welcome back, ${accountName}` : 'Welcome back'}</h1>
        <p className="intro-copy">
          {mode === 'register'
            ? 'Join the community with a secure account built for you.'
            : accountName
              ? 'Good to see you again.'
              : 'Sign in to continue to your account.'}
        </p>
        <div className="accent-line" />
        <div className="intro-visual" aria-hidden="true">
          <div className="intro-orbit"><span className="orbit-ring orbit-ring-one" /><span className="orbit-ring orbit-ring-two" /><strong>RC</strong></div>
          <div className="intro-signal"><span>01</span><i /><span>READY TO BEGIN</span></div>
        </div>
        <p className="panel-note">Your details are sent securely to the registration server.</p>
      </section>

      <section className="form-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-heading">
            <div className="auth-topline"><button type="button" className="auth-back" onClick={() => setPublicView('home')}>← Home</button><div className="mode-switch" role="tablist" aria-label="Account action">
              <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setStatus({ type: '', message: '' }) }}>Register</button>
              <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setStatus({ type: '', message: '' }) }}>Sign in</button>
            </div></div>
            <p className="eyebrow">{mode === 'register' ? 'New member' : 'Welcome back'}</p>
            <h2>{mode === 'register' ? 'Personal details' : 'Sign in to your account'}</h2>
            <p className="form-description">{mode === 'register' ? 'A few details and you are ready to get started.' : 'Enter your details to continue securely.'}</p>
          </div>

          {mode === 'register' ? (
            <div className="form-grid">
              <label>Full name<input name="name" value={form.name} onChange={handleChange} autoComplete="name" required /></label>
              <label>Email address<input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" required /></label>
              <label>Phone number<input name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" required /></label>
              <label>Date of birth<input type="date" name="dob" value={form.dob} onChange={handleChange} autoComplete="bday" required /></label>
              <label>Gender
                <select name="gender" value={form.gender} onChange={handleChange} required>
                  <option value="">Select one</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label>Password
                <span className="password-field">
                  <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} autoComplete="new-password" minLength="6" required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? '◉' : '◌'}
                  </button>
                </span>
                <span className="password-hint">{form.password ? `${passwordScore}/3 password checks complete` : 'Use 6+ characters, one uppercase letter, and one number.'}</span>
              </label>
            </div>
          ) : (
            <div className="login-fields">
              <label>Email address<input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" required /></label>
              <label>Password
                <span className="password-field">
                  <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} autoComplete="current-password" required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? '◉' : '◌'}
                  </button>
                </span>
              </label>
            </div>
          )}

          {status.message && <p className={`status ${status.type}`}>{status.message}</p>}
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  )
}

export default App
