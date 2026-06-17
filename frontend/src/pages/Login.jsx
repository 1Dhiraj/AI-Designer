import { useState, useEffect } from 'react'
import { Moon, Sun } from '../components/Icons'
import Scene3D from '../components/Scene3D'
import styles from './Login.module.css'

const USERS_KEY = 'ai_builder_users'

export default function Login({ onLogin, theme, onToggleTheme }) {
  const [tab, setTab] = useState('login')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')

  const users = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]')

  const handleLogin = () => {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    const u = users().find(u => u.email === email && u.password === password)
    if (!u) { setError('Invalid email or password.'); return }
    onLogin({ name: u.name, email: u.email })
  }

  const handleSignup = () => {
    if (!name || !email || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    const all = users()
    if (all.find(u => u.email === email)) { setError('An account with this email already exists.'); return }
    all.push({ name, email, password })
    localStorage.setItem(USERS_KEY, JSON.stringify(all))
    onLogin({ name, email })
  }

  const demoLogin = () => onLogin({ name: 'Demo User', email: 'demo@aibuilder.app' })

  const submit = () => tab === 'login' ? handleLogin() : handleSignup()

  useEffect(() => { setError('') }, [tab])

  return (
    <div className={styles.page}>
      <button className={styles.themeToggle} onClick={onToggleTheme}>
        {theme === 'dark' ? <Sun /> : <Moon />}
      </button>

      <div className={styles.brand}>
        <div className={styles.brandLogo}>
          <div className={styles.dot} />
          <span className={styles.brandName}>AI Website Builder</span>
        </div>
        <div className={styles.brandText}>
          <div className={styles.tag}><div className={styles.tagDot} />Powered by Gemini</div>
          <h1 className={styles.heading}>Build websites<br />with <span>just words.</span></h1>
          <p className={styles.desc}>Describe any website you can imagine. AI generates a complete, beautiful, production-ready page — instantly.</p>
        </div>
        <div className={styles.sceneWrap}>
          <Scene3D theme={theme} />
          <div className={styles.hint}>Drag to rotate</div>
        </div>

        <div className={styles.pills}>
          <div className={styles.pill}>Live streaming</div>
          <div className={styles.pill}>Edit &amp; enhance</div>
          <div className={styles.pill}>Multi-device preview</div>
          <div className={styles.pill}>Project folders</div>
        </div>
      </div>

      <div className={styles.auth}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{tab === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p className={styles.cardSub}>{tab === 'login' ? 'Sign in to your account to continue building' : 'Start building amazing websites today'}</p>

          <div className={styles.tabs}>
            <button className={`${styles.tabBtn} ${tab === 'login' ? styles.activeTab : ''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`${styles.tabBtn} ${tab === 'signup' ? styles.activeTab : ''}`} onClick={() => setTab('signup')}>Create Account</button>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {tab === 'signup' && (
            <div className={styles.field}>
              <label>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" autoComplete="name" onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
          )}
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>

          <button className={styles.submit} onClick={submit}>{tab === 'login' ? 'Sign In' : 'Create Account'}</button>
          <div className={styles.divider}>or</div>
          <button className={styles.demo} onClick={demoLogin}>Continue as Demo User</button>
        </div>
      </div>
    </div>
  )
}
