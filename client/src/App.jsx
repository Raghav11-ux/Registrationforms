import { useEffect, useMemo, useState } from 'react'
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

const landingFeatures = [
  {
    title: 'Smart onboarding',
    text: 'Capture complete member details with secure validation and a friendly experience from the first click.',
  },
  {
    title: 'Profile management',
    text: 'Users can review and update their personal information in a clean, intuitive account dashboard.',
  },
  {
    title: 'Team visibility',
    text: 'Admins can monitor registered users, track growth, and keep the platform organized from one place.',
  },
]

const testimonials = [
  {
    quote: 'The flow feels premium and polished, while still being really easy for users to understand.',
    author: 'Amina K.',
  },
  {
    quote: 'It gives us the feel of a real SaaS product without needing a huge engineering team.',
    author: 'Devon P.',
  },
  {
    quote: 'This is the perfect starting point for a user platform, community app, or membership portal.',
    author: 'Riya S.',
  },
]

function App() {
  const [mode, setMode] = useState('register')
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [activePage, setActivePage] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, signupsThisWeek: 0 })
  const [accountForm, setAccountForm] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactStatus, setContactStatus] = useState({ type: '', message: '' })
  const [darkMode, setDarkMode] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  const passwordScore = [
    form.password.length >= 6,
    /[A-Z]/.test(form.password),
    /\d/.test(form.password),
  ].filter(Boolean).length

  useEffect(() => {
    if (!currentUser) return

    const loadUsers = async () => {
      try {
        const usersResponse = await fetch(`${API_URL}/api/users`)
        const usersResult = await usersResponse.json()
        if (usersResponse.ok) setUsers(usersResult.users || [])
      } catch (error) {
        console.error('Unable to load users', error)
      }
    }

    const loadStats = async () => {
      try {
        const statsResponse = await fetch(`${API_URL}/api/stats`)
        const statsResult = await statsResponse.json()
        if (statsResponse.ok) setStats(statsResult)
      } catch (error) {
        console.error('Unable to load stats', error)
      }
    }

    loadUsers()
    loadStats()
  }, [currentUser])

  useEffect(() => {
    if (currentUser && accountForm === null) {
      setAccountForm({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone,
        dob: currentUser.dob,
        gender: currentUser.gender || 'Male',
      })
    }
  }, [currentUser, accountForm])

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

      if (!response.ok) throw new Error(result.message || 'Request failed')

      setStatus({ type: 'success', message: result.message })
      setCurrentUser(result.user)
      setActivePage('dashboard')
      setForm(mode === 'register' ? initialForm : { ...initialForm, email: '', password: '' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function saveAccount(event) {
    event.preventDefault()

    try {
      const response = await fetch(`${API_URL}/api/account/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm),
      })
      const result = await response.json()

      if (!response.ok) throw new Error(result.message || 'Unable to update account')

      setCurrentUser(result.user)
      setAccountForm({ ...result.user, id: result.user.id })
      setStatus({ type: 'success', message: 'Your profile was updated successfully.' })
      setActivePage('dashboard')
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  async function deleteUser(userId) {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, { method: 'DELETE' })
      const result = await response.json()

      if (!response.ok) throw new Error(result.message || 'Unable to remove member')

      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId))
      setStatus({ type: 'success', message: result.message })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  function handleContactSubmit(event) {
    event.preventDefault()
    setContactStatus({
      type: 'success',
      message: 'Thanks for contacting us. We will reply soon.',
    })
    setContactForm({ name: '', email: '', message: '' })
  }

  function handleForgotPasswordSubmit(event) {
    event.preventDefault()
    setShowForgotPassword(false)
    setStatus({
      type: 'success',
      message: `A password reset link has been sent to ${resetEmail || 'your email'}.`,
    })
    setResetEmail('')
  }

  const filteredUsers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return users

    return users.filter((user) => {
      return [user.name, user.email, user.phone].some((value) => value?.toLowerCase().includes(normalized))
    })
  }, [searchTerm, users])

  function renderLandingPage() {
    return (
      <div className={`landing-page ${darkMode ? 'theme-dark' : 'theme-light'}`}>
        <header className="site-header">
          <div className="brand-wrap">
            <div className="brand-mark">A</div>
            <span>Astera</span>
          </div>

          <nav className="top-nav">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</button>
            <button type="button" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
            <button type="button" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>About</button>
            <button type="button" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</button>
          </nav>

          <div className="header-actions">
            <button type="button" className="secondary-btn" onClick={() => setDarkMode((value) => !value)}>{darkMode ? 'Light' : 'Dark'} mode</button>
            <button type="button" className="secondary-btn" onClick={() => { setMode('login'); setStatus({ type: '', message: '' }) }}>Sign in</button>
            <button type="button" className="primary-btn" onClick={() => { setMode('register'); setStatus({ type: '', message: '' }) }}>Get started</button>
          </div>
        </header>

        <section className="hero-section">
          <div className="hero-copy">
            <p className="hero-badge">Modern member platform</p>
            <h1>Build trust, grow your community, and power every account experience.</h1>
            <p className="hero-text">
              Turn signups into a polished digital journey with secure onboarding, member dashboards, and a complete admin workflow.
            </p>
            <div className="hero-buttons">
              <button type="button" className="primary-btn" onClick={() => { setMode('register'); setStatus({ type: '', message: '' }) }}>Create account</button>
              <button type="button" className="secondary-btn light" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Explore features</button>
            </div>
            <div className="hero-metrics">
              <div><strong>12k+</strong><span>Members</span></div>
              <div><strong>99.9%</strong><span>Uptime</span></div>
              <div><strong>24/7</strong><span>Support</span></div>
            </div>
          </div>

          <div className="hero-card">
            <div className="mini-panel top">
              <span className="panel-label">Active users</span>
              <strong>8,420</strong>
            </div>
            <div className="mini-graph">
              <span style={{ height: '32%' }} />
              <span style={{ height: '46%' }} />
              <span style={{ height: '58%' }} />
              <span style={{ height: '72%' }} />
              <span style={{ height: '96%' }} />
              <span style={{ height: '100%' }} />
            </div>
            <div className="mini-panel bottom">
              <span className="panel-label">Conversion</span>
              <strong>+24.8%</strong>
            </div>
          </div>
        </section>

        <section id="features" className="feature-section">
          <div className="section-heading">
            <p className="eyebrow">What it includes</p>
            <h2>Everything needed for a full user platform</h2>
          </div>

          <div className="feature-grid">
            {landingFeatures.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">✓</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="about-section">
          <div className="about-card">
            <div>
              <p className="eyebrow">Why this works</p>
              <h2>Designed for growth, trust, and long-term engagement.</h2>
            </div>
            <p>
              This site combines a polished customer-facing experience with a secure backend and an admin-ready workflow, making it perfect for memberships, communities, SaaS onboarding, and business portals.
            </p>
          </div>
        </section>

        <section className="testimonial-section">
          <div className="section-heading">
            <p className="eyebrow">User feedback</p>
            <h2>Built to feel premium from day one</h2>
          </div>

          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <article className="testimonial-card" key={item.author}>
                <p>“{item.quote}”</p>
                <strong>{item.author}</strong>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="contact-card">
            <div className="contact-copy">
              <p className="eyebrow">Get in touch</p>
              <h2>Start building your next digital community</h2>
              <p>Connect with users, share updates, and deliver a smooth account experience from day one.</p>
            </div>

            <form onSubmit={handleContactSubmit} className="contact-form">
              <label>
                Your name
                <input value={contactForm.name} onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })} required />
              </label>
              <label>
                Email
                <input type="email" value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} required />
              </label>
              <label>
                Message
                <textarea value={contactForm.message} onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })} rows="4" required />
              </label>
              {contactStatus.message && <p className={`status ${contactStatus.type}`}>{contactStatus.message}</p>}
              <button type="submit" className="primary-btn full-width">Send message</button>
            </form>
          </div>
        </section>

        <section className="auth-section">
          <div className="auth-box">
            <div className="mode-switch" role="tablist" aria-label="Account action">
              <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setStatus({ type: '', message: '' }) }}>Register</button>
              <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setStatus({ type: '', message: '' }) }}>Sign in</button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' ? (
                <div className="form-grid">
                  <label>Full name<input name="name" value={form.name} onChange={handleChange} autoComplete="name" required /></label>
                  <label>Email address<input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" required /></label>
                  <label>Phone number<input name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" required /></label>
                  <label>Date of birth<input type="date" name="dob" value={form.dob} onChange={handleChange} required /></label>
                  <label>Gender<select name="gender" value={form.gender} onChange={handleChange} required><option value="">Select one</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></label>
                  <label>Password
                    <span className="password-field">
                      <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} autoComplete="new-password" minLength="6" required />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? '◉' : '◌'}
                      </button>
                    </span>
                    <span className="password-hint">{form.password ? `${passwordScore}/3 checks complete` : '6+ chars, uppercase and number required.'}</span>
                  </label>
                </div>
              ) : (
                <div className="login-fields">
                  <label>Email address<input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" required /></label>
                  <label>Password
                    <span className="password-field">
                      <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} autoComplete="current-password" required />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? '◉' : '◌'}
                      </button>
                    </span>
                  </label>
                </div>
              )}

              {status.message && <p className={`status ${status.type}`}>{status.message}</p>}

              {mode === 'login' && (
                <button type="button" className="link-button" onClick={() => setShowForgotPassword(true)}>
                  Forgot password?
                </button>
              )}

              <button type="submit" className="primary-btn full-width" disabled={isSubmitting}>{isSubmitting ? 'Working...' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
            </form>
          </div>
        </section>

        {showForgotPassword && (
          <div className="modal-backdrop" onClick={() => setShowForgotPassword(false)}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="modal-close" onClick={() => setShowForgotPassword(false)}>×</button>
              <p className="eyebrow">Reset access</p>
              <h3>Forgot your password?</h3>
              <form onSubmit={handleForgotPasswordSubmit} className="modal-form">
                <label>
                  Email address
                  <input type="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} required />
                </label>
                <button type="submit" className="primary-btn full-width">Send reset link</button>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderDashboard() {
    return (
      <div className="dashboard-page">
        <div className="page-topbar">
          <div>
            <p className="eyebrow">Overview</p>
            <h2>Welcome back, {currentUser.name}</h2>
          </div>
          <button type="button" className="secondary-btn" onClick={() => { setCurrentUser(null); setActivePage('landing'); setStatus({ type: '', message: '' }) }}>Log out</button>
        </div>

        <div className="stats-grid">
          <article className="stat-card">
            <span>Total users</span>
            <strong>{stats.totalUsers}</strong>
            <small>All active members</small>
          </article>
          <article className="stat-card">
            <span>Active today</span>
            <strong>{stats.activeToday}</strong>
            <small>Live engagement</small>
          </article>
          <article className="stat-card">
            <span>New this week</span>
            <strong>{stats.signupsThisWeek}</strong>
            <small>Weekly growth</small>
          </article>
        </div>

        <div className="panel-grid">
          <section className="panel-card">
            <div className="panel-header">
              <h3>Recent activity</h3>
            </div>
            <ul className="activity-list">
              <li><span>Profile update</span><strong>Today</strong></li>
              <li><span>New sign up</span><strong>2 days ago</strong></li>
              <li><span>Security verification</span><strong>4 days ago</strong></li>
              <li><span>Admin review</span><strong>Last week</strong></li>
            </ul>
          </section>

          <section className="panel-card">
            <div className="panel-header">
              <h3>Quick actions</h3>
            </div>
            <div className="action-stack">
              <button type="button" className="secondary-btn full-width" onClick={() => setActivePage('profile')}>Edit profile</button>
              <button type="button" className="primary-btn full-width" onClick={() => setActivePage('admin')}>Open admin panel</button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  function renderProfilePage() {
    return (
      <div className="profile-page">
        <div className="page-topbar">
          <div>
            <p className="eyebrow">Profile</p>
            <h2>Manage your account</h2>
          </div>
        </div>

        <form className="profile-form" onSubmit={saveAccount}>
          <label>Full name<input value={accountForm?.name || ''} onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })} required /></label>
          <label>Email address<input value={accountForm?.email || ''} disabled /></label>
          <label>Phone number<input value={accountForm?.phone || ''} onChange={(event) => setAccountForm({ ...accountForm, phone: event.target.value })} pattern="[0-9]{10}" maxLength="10" required /></label>
          <label>Date of birth<input type="date" value={accountForm?.dob || ''} onChange={(event) => setAccountForm({ ...accountForm, dob: event.target.value })} required /></label>
          <label>Gender<select value={accountForm?.gender || 'Male'} onChange={(event) => setAccountForm({ ...accountForm, gender: event.target.value })} required><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></label>
          {status.message && <p className={`status ${status.type}`}>{status.message}</p>}
          <button type="submit" className="primary-btn">Save changes</button>
        </form>
      </div>
    )
  }

  function renderAdminPage() {
    return (
      <div className="admin-page">
        <div className="page-topbar">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>Member directory</h2>
          </div>
        </div>

        <div className="admin-toolbar">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search members"
          />
        </div>

        <div className="member-grid">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">No members found.</div>
          ) : (
            filteredUsers.map((user) => (
              <article className="member-card" key={user.id}>
                <div className="member-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                <div className="member-meta">
                  <h3>{user.name}</h3>
                  <p>{user.email}</p>
                  <span>{user.phone}</span>
                </div>
                <div className="member-footer">
                  <small>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Member'}</small>
                  <button type="button" className="danger-btn" onClick={() => deleteUser(user.id)}>Remove</button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    )
  }

  if (currentUser) {
    return (
      <div className={`app-shell ${darkMode ? 'theme-dark' : 'theme-light'}`}>
        <aside className="sidebar">
          <div className="brand-wrap sidebar-brand">
            <div className="brand-mark">A</div>
            <span>Astera</span>
          </div>

          <nav className="sidebar-nav">
            <button type="button" className={activePage === 'dashboard' ? 'active' : ''} onClick={() => setActivePage('dashboard')}>Dashboard</button>
            <button type="button" className={activePage === 'profile' ? 'active' : ''} onClick={() => setActivePage('profile')}>Profile</button>
            <button type="button" className={activePage === 'admin' ? 'active' : ''} onClick={() => setActivePage('admin')}>Admin</button>
          </nav>

          <div className="user-card">
            <div className="mini-avatar">{currentUser.name?.charAt(0).toUpperCase() || 'U'}</div>
            <div>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.email}</span>
            </div>
          </div>

          <button type="button" className="secondary-btn theme-toggle" onClick={() => setDarkMode((value) => !value)}>
            {darkMode ? 'Switch to light' : 'Switch to dark'}
          </button>
        </aside>

        <main className="content-panel">
          {activePage === 'dashboard' && renderDashboard()}
          {activePage === 'profile' && renderProfilePage()}
          {activePage === 'admin' && renderAdminPage()}
        </main>
      </div>
    )
  }

  return renderLandingPage()
}

export default App
