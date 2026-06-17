import { useRef } from 'react'
import styles from './PromptPanel.module.css'

const MODES = ['create', 'edit']

const MODE_CFG = {
  create: { title: 'Create', sub: 'Describe the website you want', label: 'Prompt',         btn: 'Generate Website', ph: 'e.g. A stunning SaaS landing page with animated hero, features grid, and dark theme...' },
  edit:   { title: 'Edit',   sub: 'Describe changes to make',      label: 'What to change', btn: 'Apply Changes',    ph: 'e.g. Make the header sticky, change colors to green, add animations, add dark mode...' },
}

const EXAMPLES = {
  'Portfolio':    'A stunning personal portfolio for a full-stack developer. Hero with animated text, skills section with progress bars, project cards with hover effects, contact form. Dark purple theme.',
  'Landing Page': 'A modern SaaS landing page for "Flowly", an AI productivity tool. Animated hero, feature highlights, pricing cards (3 tiers), testimonials, sticky CTA. Clean white & blue.',
  'Todo App':     'A beautiful todo list web app with add/complete/delete tasks, categories (Work, Personal, Shopping), priority tags, and smooth animations. Dark theme.',
  'Calculator':   'A sleek scientific calculator with standard and scientific mode toggle, history panel, keyboard support, smooth animations. Glassmorphism dark design.',
  'Restaurant':   'An elegant restaurant website for "Bella Vista". Hero, menu sections with item cards and prices, reservation form, and reviews. Warm beige and gold theme.',
  'Dashboard':    'An analytics dashboard with sidebar navigation, stat cards, line chart placeholder, recent activity table, notifications. Dark modern theme.',
  'Blog':         'A modern blog homepage with hero post, featured articles grid, categories sidebar, newsletter signup. Clean minimal light theme with great typography.',
  'E-Commerce':   'A clean e-commerce product listing page with filter sidebar, product cards with images, cart, search. Light minimal theme.',
}

const ENHANCEMENTS = ['More animations', 'Better colors', 'Add dark mode', 'Glassmorphism', 'Mobile first', 'Better typography', 'Hover effects', 'More professional']
const ENH_PROMPTS = {
  'More animations': 'Add smooth CSS animations throughout: entrance animations, hover effects, scroll-triggered reveals, and micro-interactions. Keep existing content.',
  'Better colors': 'Improve the color scheme with a harmonious, modern palette. Keep all content and structure.',
  'Add dark mode': 'Add a dark/light mode toggle using CSS variables. Default to dark. Keep all content.',
  'Glassmorphism': 'Redesign with glassmorphism: frosted glass cards, backdrop-filter blur, semi-transparent backgrounds. Keep all content.',
  'Mobile first': 'Make fully mobile-responsive with better mobile layout and touch targets. Keep all content.',
  'Better typography': 'Improve typography with better font sizes, weights, line heights, import a Google Font pair. Keep all content.',
  'Hover effects': 'Add rich hover effects to all interactive elements: scale transforms, color transitions, shadow effects.',
  'More professional': 'Make the design more polished and professional. Improve spacing, alignment, and visual hierarchy.',
}

const STATUS_DOT = { '': '', generating: 'generating', done: 'done', error: 'error' }

export default function PromptPanel({ mode, onModeChange, prompt, onPromptChange, onGenerate, isGenerating, hasHTML, status, statusText, onSave }) {
  const cfg = MODE_CFG[mode]
  const textareaRef = useRef()

  const useExample = (text) => { onPromptChange(EXAMPLES[text] || text); textareaRef.current?.focus() }
  const useEnhance = (text) => { onPromptChange(ENH_PROMPTS[text] || text); textareaRef.current?.focus() }

  const noSite = mode !== 'create' && !hasHTML

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <div className={styles.title}>{cfg.title}</div>
        <div className={styles.sub}>{cfg.sub}</div>
      </div>

      <div className={styles.body}>
        <div className={styles.modeTabs}>
          {MODES.map(m => (
            <button key={m} className={`${styles.modeTab} ${mode === m ? styles.active : ''}`} onClick={() => onModeChange(m)}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {noSite && <div className={styles.warn}>Generate a website first, then edit it.</div>}

        {mode === 'create' && (
          <div>
            <div className={styles.sectionLabel}>Quick Start</div>
            <div className={styles.chips}>
              {Object.keys(EXAMPLES).map(ex => (
                <span key={ex} className={styles.chip} onClick={() => useExample(ex)}>{ex}</span>
              ))}
            </div>
          </div>
        )}

        {mode === 'edit' && hasHTML && (
          <div>
            <div className={styles.sectionLabel}>Quick Edits</div>
            <div className={styles.chips}>
              {ENHANCEMENTS.map(e => (
                <span key={e} className={`${styles.chip} ${styles.enhChip}`} onClick={() => useEnhance(e)}>{e}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className={styles.labelRow}>
            <span className={styles.sectionLabel}>{cfg.label}</span>
            <span className={styles.charCount}>{prompt.length}/2000</span>
          </div>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={prompt}
            onChange={e => onPromptChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onGenerate() }}
            placeholder={cfg.ph}
            maxLength={2000}
          />
        </div>

        {mode === 'create' && (
          <div className={styles.selects}>
            <select className={styles.select} id="style-select">
              <option value="">Any Style</option>
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
              <option value="glassmorphism">Glassmorphism</option>
              <option value="minimal">Minimal</option>
              <option value="colorful">Colorful</option>
            </select>
            <select className={styles.select} id="type-select">
              <option value="">Any Type</option>
              <option value="landing">Landing Page</option>
              <option value="app">Web App</option>
              <option value="portfolio">Portfolio</option>
              <option value="ecommerce">E-Commerce</option>
              <option value="blog">Blog</option>
            </select>
          </div>
        )}

        <button className={styles.genBtn} onClick={onGenerate} disabled={isGenerating || noSite}>
          {isGenerating ? 'Generating…' : cfg.btn}
        </button>

      </div>

      <div className={styles.statusBar}>
        <div className={`${styles.dot} ${styles[STATUS_DOT[status] || '']}`} />
        <span className={styles.statusText}>{statusText}</span>
      </div>
    </div>
  )
}
