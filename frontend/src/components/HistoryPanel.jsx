import { X } from './Icons'
import styles from './HistoryPanel.module.css'

const HISTORY_KEY = 'ai_builder_history'

function load() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}

export function saveHistory(prompt, html) {
  const hist = load()
  hist.push({ prompt, html, time: new Date().toLocaleString() })
  if (hist.length > 20) hist.shift()
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist))
}

export default function HistoryPanel({ open, onClose, onLoad }) {
  const hist = load().slice().reverse()

  return (
    <div className={`${styles.panel} ${open ? styles.open : ''}`}>
      <div className={styles.head}>
        <span className={styles.title}>History</span>
        <button className={styles.close} onClick={onClose}><X /></button>
      </div>
      <div className={styles.list}>
        {hist.length === 0 ? (
          <div className={styles.empty}>No history yet</div>
        ) : hist.map((item, i) => (
          <div key={i} className={styles.item} onClick={() => { onLoad(item); onClose() }}>
            <div className={styles.itemPrompt}>{item.prompt}</div>
            <div className={styles.itemTime}>{item.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
