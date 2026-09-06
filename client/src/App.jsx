import { useEffect, useState } from 'react'
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

const starterTasks = [
  { id: 1, title: 'Review your account details', description: 'Make sure your contact information is up to date.', completed: false },
  { id: 2, title: 'Explore your member area', description: 'Take a moment to see what you can manage here.', completed: true },
]

function getSavedTasks(email) {
  const savedTasks = window.localStorage.getItem(`member-tasks-${email}`)
  return savedTasks ? JSON.parse(savedTasks) : starterTasks
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
  const [tasks, setTasks] = useState(starterTasks)
  const [taskForm, setTaskForm] = useState({ title: '', description: '' })
  const [editingTaskId, setEditingTaskId] = useState(null)
  const passwordScore = [
    form.password.length >= 6,
    /[A-Z]/.test(form.password),
    /\d/.test(form.password),
  ].filter(Boolean).length

  useEffect(() => {
    if (currentUser) window.localStorage.setItem(`member-tasks-${currentUser.email}`, JSON.stringify(tasks))
  }, [currentUser, tasks])

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
      setTasks(getSavedTasks(result.user.email))
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

      if (accountView === 'tasks') {
        function handleTaskSubmit(event) {
          event.preventDefault()
          const title = taskForm.title.trim()
          const description = taskForm.description.trim()
          if (!title) return

          if (editingTaskId) {
            setTasks((currentTasks) => currentTasks.map((task) => task.id === editingTaskId ? { ...task, title, description } : task))
          } else {
            setTasks((currentTasks) => [...currentTasks, { id: Date.now(), title, description, completed: false }])
          }

          setTaskForm({ title: '', description: '' })
          setEditingTaskId(null)
        }

        const completedTasks = tasks.filter((task) => task.completed).length

        return (
          <main className="tasks-page">
            <header className="tasks-header">
              <button type="button" className="text-button" onClick={() => setAccountView('dashboard')}>← Dashboard</button>
              <button type="button" className="profile-button" onClick={() => setAccountView('details')} aria-label="Open account details" title="Account details">
                {currentUser.name.charAt(0).toUpperCase()}
              </button>
            </header>
            <section className="tasks-layout">
              <div className="tasks-heading">
                <p className="eyebrow">Your workspace</p>
                <h1>Tasks that move you forward.</h1>
                <p>Keep your next steps in one calm, focused place.</p>
                <div className="task-progress" aria-label={`${completedTasks} of ${tasks.length} tasks complete`}>
                  <span style={{ width: tasks.length ? `${(completedTasks / tasks.length) * 100}%` : '0%' }} />
                </div>
                <small>{completedTasks} of {tasks.length} tasks complete</small>
              </div>

              <form className="task-form" onSubmit={handleTaskSubmit}>
                <div>
                  <p className="card-label">{editingTaskId ? 'Edit task' : 'Add a task'}</p>
                  <h2>{editingTaskId ? 'Make a quick update' : 'What needs your attention?'}</h2>
                </div>
                <label>Task title<input value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} placeholder="e.g. Update my profile" required /></label>
                <label>Notes <span className="optional-label">Optional</span><textarea value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} placeholder="Add a little context" rows="3" /></label>
                <div className="task-form-actions">
                  <button type="submit">{editingTaskId ? 'Save task' : 'Add task'}</button>
                  {editingTaskId && <button type="button" className="cancel-button" onClick={() => { setEditingTaskId(null); setTaskForm({ title: '', description: '' }) }}>Cancel</button>}
                </div>
              </form>

              <section className="task-list" aria-label="Your tasks">
                <div className="task-list-heading"><div><p className="card-label">Task list</p><h2>{tasks.length ? 'Your current priorities' : 'Nothing on your list yet'}</h2></div><span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span></div>
                {tasks.length ? tasks.map((task) => (
                  <article className={`task-item${task.completed ? ' completed' : ''}`} key={task.id}>
                    <button type="button" className="task-check" onClick={() => setTasks((currentTasks) => currentTasks.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item))} aria-label={task.completed ? `Mark ${task.title} as incomplete` : `Mark ${task.title} as complete`}>
                      {task.completed ? '✓' : ''}
                    </button>
                    <div className="task-copy"><h3>{task.title}</h3><p>{task.description || 'No notes added.'}</p></div>
                    <div className="task-actions"><button type="button" onClick={() => { setEditingTaskId(task.id); setTaskForm({ title: task.title, description: task.description }) }}>Edit</button><button type="button" className="delete-task" onClick={() => setTasks((currentTasks) => currentTasks.filter((item) => item.id !== task.id))}>Delete</button></div>
                  </article>
                )) : <p className="empty-tasks">Add your first task above to get started.</p>}
              </section>
            </section>
          </main>
        )
      }

      return (
        <main className="dashboard-page">
          <header className="dashboard-header">
            <div>
              <p className="eyebrow">Member dashboard</p>
              <h1>Welcome, {currentUser.name}</h1>
            </div>
            <button type="button" className="profile-button" onClick={() => setAccountView('details')} aria-label="Open account details" title="Account details">
              {currentUser.name.charAt(0).toUpperCase()}
            </button>
          </header>
          <section className="dashboard-content">
            <div className="dashboard-intro">
              <p className="dashboard-kicker">You are all set</p>
              <h2>Your account is ready.</h2>
              <p>Keep your details up to date and manage your membership from one place.</p>
            </div>
            <div className="dashboard-grid">
              <article className="dashboard-card profile-summary">
                <span className="card-label">Profile status</span>
                <strong>Complete</strong>
                <p>Your registration details have been saved successfully.</p>
                <button type="button" onClick={() => setAccountView('details')}>View account details</button>
              </article>
              <article className="dashboard-card">
                <span className="card-label">Registered email</span>
                <strong>{currentUser.email}</strong>
                <p>Use this email address whenever you sign in.</p>
              </article>
            </div>
            <button type="button" className="explore-button" onClick={() => setAccountView('tasks')}>Continue to explore <span aria-hidden="true">→</span></button>
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
