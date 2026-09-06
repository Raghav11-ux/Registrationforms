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

const initialIdeas = [
  {
    id: 1,
    title: 'Affordable irrigation for small farms',
    description: 'Many farmers lose crops when the monsoon arrives late. What low-cost water solutions could work for small plots?',
    category: 'Water & irrigation',
    location: 'Maharashtra',
    status: 'Open for ideas',
    votes: 28,
    ideas: 7,
  },
  {
    id: 2,
    title: 'Better local access to crop storage',
    description: 'A shared, nearby storage space could help families wait for fair market prices instead of selling immediately after harvest.',
    category: 'Farming & markets',
    location: 'Karnataka',
    status: 'Open for ideas',
    votes: 19,
    ideas: 4,
  },
  {
    id: 3,
    title: 'Reliable transport to the health centre',
    description: 'Families in nearby villages need a dependable way to reach healthcare during evenings and emergencies.',
    category: 'Healthcare',
    location: 'Odisha',
    status: 'Being explored',
    votes: 34,
    ideas: 11,
  },
]

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
  const [ideas, setIdeas] = useState(initialIdeas)
  const [ideaForm, setIdeaForm] = useState({ title: '', description: '', category: 'Farming & markets', location: '' })
  const [ideaFilter, setIdeaFilter] = useState('All topics')
  const [showIdeaForm, setShowIdeaForm] = useState(false)
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
                  <button type="button" className="details-logout" onClick={() => { setCurrentUser(null); setAccountName(''); setHasContinued(false); setAccountView('details'); setStatus({ type: '', message: '' }) }}>Log out</button>
                </div>
              )}
            </section>
          </main>
        )
      }

      if (accountView === 'ideas') {
        const categories = ['All topics', ...new Set(ideas.map((idea) => idea.category))]
        const visibleIdeas = ideaFilter === 'All topics' ? ideas : ideas.filter((idea) => idea.category === ideaFilter)

        function submitIdea(event) {
          event.preventDefault()
          if (!ideaForm.title.trim() || !ideaForm.description.trim() || !ideaForm.location.trim()) return
          setIdeas((currentIdeas) => [{
            id: Date.now(),
            title: ideaForm.title.trim(),
            description: ideaForm.description.trim(),
            category: ideaForm.category,
            location: ideaForm.location.trim(),
            status: 'Open for ideas',
            votes: 0,
            ideas: 0,
          }, ...currentIdeas])
          setIdeaForm({ title: '', description: '', category: 'Farming & markets', location: '' })
          setShowIdeaForm(false)
        }

        return (
          <main className="ideas-page">
            <header className="ideas-header">
              <button type="button" className="brand-mark" onClick={() => setAccountView('dashboard')} aria-label="Return to dashboard">Rural<span>Commons</span></button>
              <nav className="ideas-nav" aria-label="Community navigation"><button type="button" className="nav-active">Explore ideas</button><button type="button" onClick={() => setAccountView('dashboard')}>Dashboard</button></nav>
              <button type="button" className="profile-button" onClick={() => setAccountView('details')} aria-label="Open account details" title="Account details">{currentUser.name.charAt(0).toUpperCase()}</button>
            </header>
            <section className="ideas-hero">
              <div><p className="eyebrow">Community noticeboard</p><h1>Small ideas can change everyday life.</h1><p>Share a challenge from your village, learn from someone else's experience, and help useful ideas travel further.</p></div>
              <div className="ideas-hero-stat"><strong>{ideas.length}</strong><span>community challenges<br />open to ideas</span></div>
            </section>
            <section className="ideas-toolbar"><div className="topic-filters" aria-label="Filter ideas">{categories.map((category) => <button type="button" className={ideaFilter === category ? 'selected' : ''} onClick={() => setIdeaFilter(category)} key={category}>{category}</button>)}</div><button type="button" className="share-idea-button" onClick={() => setShowIdeaForm(!showIdeaForm)}>{showIdeaForm ? 'Close form' : '+ Share a problem'}</button></section>
            {showIdeaForm && <form className="idea-form" onSubmit={submitIdea}><div><p className="card-label">Start a conversation</p><h2>What is your community facing?</h2><p>Keep it specific so people can offer practical ideas.</p></div><label>Problem title<input value={ideaForm.title} onChange={(event) => setIdeaForm({ ...ideaForm, title: event.target.value })} placeholder="e.g. No cold storage near our village" required /></label><label>Describe the problem<textarea value={ideaForm.description} onChange={(event) => setIdeaForm({ ...ideaForm, description: event.target.value })} placeholder="What happens today, and who is affected?" rows="4" required /></label><div className="idea-form-row"><label>Topic<select value={ideaForm.category} onChange={(event) => setIdeaForm({ ...ideaForm, category: event.target.value })}><option>Farming & markets</option><option>Water & irrigation</option><option>Healthcare</option><option>Education</option><option>Transport & roads</option><option>Energy</option></select></label><label>Village or district<input value={ideaForm.location} onChange={(event) => setIdeaForm({ ...ideaForm, location: event.target.value })} placeholder="e.g. Nashik" required /></label></div><button type="submit">Publish problem</button></form>}
            <section className="ideas-list"><div className="ideas-list-heading"><div><p className="eyebrow">Voices from rural communities</p><h2>What people are working through</h2></div><span>{visibleIdeas.length} stories</span></div>{visibleIdeas.length ? visibleIdeas.map((idea) => <article className="idea-card" key={idea.id}><div className="idea-card-top"><span className="idea-category">{idea.category}</span><span className="idea-status">{idea.status}</span></div><h3>{idea.title}</h3><p>{idea.description}</p><div className="idea-card-footer"><span className="idea-location">⌖ {idea.location}</span><div className="idea-actions"><button type="button" onClick={() => setIdeas((currentIdeas) => currentIdeas.map((item) => item.id === idea.id ? { ...item, votes: item.votes + 1 } : item))}>♡ {idea.votes}</button><span>{idea.ideas} ideas</span></div></div></article>) : <p className="empty-ideas">No stories in this topic yet. Be the first to share one.</p>}</section>
          </main>
        )
      }

      return (
        <main className="dashboard-page">
          <header className="dashboard-header">
            <div>
              <p className="eyebrow">RuralCommons member</p>
              <h1>Welcome back, {currentUser.name}</h1>
            </div>
            <button type="button" className="profile-button" onClick={() => setAccountView('details')} aria-label="Open account details" title="Account details">
              {currentUser.name.charAt(0).toUpperCase()}
            </button>
          </header>
          <section className="dashboard-content">
            <div className="dashboard-intro">
              <p className="dashboard-kicker">Your voice matters</p>
              <h2>Turn local challenges into shared progress.</h2>
              <p>RuralCommons brings community problems and practical ideas into one welcoming space.</p>
            </div>
            <div className="dashboard-grid">
              <article className="dashboard-card community-card">
                <span className="card-label">Community board</span>
                <strong>Share a problem</strong>
                <p>Help others understand what your village needs and discover ideas from across rural communities.</p>
                <button type="button" onClick={() => setAccountView('ideas')}>Explore community ideas <span>→</span></button>
              </article>
              <article className="dashboard-card dashboard-profile-card">
                <span className="card-label">Your membership</span>
                <strong>Member</strong>
                <p>Your profile is ready. Add your voice to the community board.</p>
                <button type="button" onClick={() => setAccountView('details')}>View account details</button>
              </article>
            </div>
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
        <p className="panel-note">Your details are sent securely to the registration server.</p>
      </section>

      <section className="form-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-heading">
            <div className="mode-switch" role="tablist" aria-label="Account action">
              <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setStatus({ type: '', message: '' }) }}>Register</button>
              <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setStatus({ type: '', message: '' }) }}>Sign in</button>
            </div>
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
