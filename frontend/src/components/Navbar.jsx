import { useState } from 'react'
import { Moon, Sun, Clock } from './Icons'
import styles from './Navbar.module.css'

export default function Navbar({ theme, onToggleTheme, onToggleHistory, user, onLogout }) {
  const [open, setOpen] = useState(false)

  return (
    <nav className={styles.nav}>
      <a className={styles.logo} href="/">
        <div className={styles.dot} />
        <span className={styles.brand}>AI Website Builder</span>
      </a>
      <div className={styles.sep} />
      <span className={styles.tag}>Gemini</span>

      <div className={styles.right}>
        <button className={styles.iconBtn} onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun /> : <Moon />}
        </button>
        <button className={styles.iconBtn} onClick={onToggleHistory} title="History">
          <Clock />
        </button>
        <div className={styles.pill} onClick={() => setOpen(o => !o)}>
          <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase() || '?'}</div>
          <span className={styles.name}>{user?.name?.split(' ')[0] || 'Guest'}</span>
          {open && (
            <div className={styles.dropdown}>
              <div className={`${styles.ddItem} ${styles.danger}`} onClick={onLogout}>Sign Out</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
