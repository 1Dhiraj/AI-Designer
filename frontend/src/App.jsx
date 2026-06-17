import { useState, useCallback } from 'react'
import { useTheme }       from './hooks/useTheme'
import { useAuth }        from './hooks/useAuth'
import { useFileSystem }  from './hooks/useFileSystem'
import { useSession, loadSession } from './hooks/useSession'
import Login              from './pages/Login'
import Navbar             from './components/Navbar'
import Explorer           from './components/Explorer'
import PromptPanel        from './components/PromptPanel'
import Preview            from './components/Preview'
import HistoryPanel, { saveHistory } from './components/HistoryPanel'
import styles             from './App.module.css'

function extractHTML(raw) {
  const fence = raw.match(/```(?:html)?\s*([\s\S]*?)```/i)
  if (fence) return fence[1].trim()
  const dt = raw.indexOf('<!DOCTYPE')
  if (dt >= 0) return raw.slice(dt)
  const ht = raw.indexOf('<html')
  if (ht >= 0) return raw.slice(ht)
  return raw
}

const saved = loadSession()

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const { user, login, logout }         = useAuth()

  const fs = useFileSystem()

  const [mode,     setMode]     = useState(['create','edit'].includes(saved?.mode) ? saved.mode : 'create')
  const [prompt,   setPrompt]   = useState(saved?.prompt   || '')
  const [html,     setHtml]     = useState(saved?.html     || '')
  const [view,     setView]     = useState(saved?.view     || 'preview')
  const [device,   setDevice]   = useState(saved?.device   || 'desktop')
  const [status,   setStatus]   = useState('')
  const [statusTx, setStatusTx] = useState(saved?.html ? 'Session restored' : 'Ready')
  const [generating, setGenerating] = useState(false)
  const [histOpen, setHistOpen]  = useState(false)

  useSession({ html, prompt, mode, view, device, selectedId: fs.selectedId })

  const generate = useCallback(async () => {
    if (generating) return
    if (mode !== 'create' && !html) return

    let fullPrompt = prompt
    if (mode === 'create') {
      const style = document.getElementById('style-select')?.value
      const type  = document.getElementById('type-select')?.value
      if (style) fullPrompt += `. Use a ${style} design style.`
      if (type)  fullPrompt += ` This is a ${type} type page.`
    } else {
      fullPrompt = `Here is the current website HTML:\n\n${html}\n\n---\n\nApply these changes:\n${prompt || 'Improve the overall design.'}\n\nReturn the complete, updated HTML.`
    }

    setGenerating(true)
    if (mode === 'create') setHtml('')   // only clear on new generation, not edit
    setStatus('generating')
    setStatusTx(mode === 'create' ? 'Building your website...' : 'Applying changes...')

    let accumulated = ''
    let rafId = null

    const flush = () => {
      rafId = null
      const clean = extractHTML(accumulated)
      setHtml(clean)
    }

    try {
      const API = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
      })

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const p = JSON.parse(data)
            if (p.error) throw new Error(p.error)
            if (p.text) {
              accumulated += p.text
              if (!rafId) rafId = requestAnimationFrame(flush)
            }
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input') throw e
          }
        }
      }

      const clean = extractHTML(accumulated)
      setHtml(clean)
      setStatus('done')
      saveHistory(prompt, clean)

      // Auto-save to file system
      const slug = prompt.slice(0, 28).replace(/[^a-z0-9 ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'website'
      const name = slug + '.html'
      fs.saveFile(name, clean, null)
      setStatusTx(`Saved as "${name}"`)
    } catch (err) {
      setStatus('error')
      setStatusTx('Error: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }, [generating, mode, html, prompt])

  const handleFileSelect = useCallback((id) => {
    const node = fs.fs.find(n => n.id === id)
    if (!node || node.type === 'folder') { fs.setSelectedId(id); return }
    fs.setSelectedId(id)
    if (node.content) {
      setHtml(node.content)
      setStatus('done')
      setStatusTx('Loaded: ' + node.name)
    } else {
      setHtml('')
      setStatus('')
      setStatusTx(node.name + ' is empty')
    }
  }, [fs])

  const handleSave = useCallback(() => {
    if (!html) return
    const suggested = (prompt.slice(0, 30).replace(/[^a-z0-9 ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase() || 'website') + '.html'
    const name = window.prompt('Save as:', suggested)
    if (!name?.trim()) return
    const parent = (() => {
      if (!fs.selectedId) return null
      const n = fs.fs.find(x => x.id === fs.selectedId)
      if (!n) return null
      return n.type === 'folder' ? n.id : n.parentId
    })()
    fs.saveFile(name.trim(), html, parent)
    setStatusTx(`Saved as "${name.trim()}"`)
  }, [html, prompt, fs])

  const copy = useCallback(() => {
    if (!html) return
    navigator.clipboard.writeText(html).catch(() => {})
  }, [html])

  const download = useCallback(() => {
    if (!html) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    a.download = 'website.html'
    a.click()
  }, [html])

  const newProject = useCallback(() => {
    setHtml(''); setPrompt(''); setStatus(''); setStatusTx('Ready')
    fs.setSelectedId(null)
  }, [fs])

  if (!user) return <Login onLogin={login} theme={theme} onToggleTheme={toggleTheme} />

  return (
    <div className={styles.app} data-theme={theme}>
      <Navbar
        theme={theme} onToggleTheme={toggleTheme}
        onToggleHistory={() => setHistOpen(o => !o)}
        user={user} onLogout={logout}
      />
      <div className={styles.body}>
        <Explorer
          fs={fs.fs}
          selectedId={fs.selectedId}
          expandedIds={fs.expandedIds}
          getChildren={fs.getChildren}
          onSelect={handleFileSelect}
          onToggle={fs.toggleExpand}
          onCreate={fs.createNode}
          onRename={fs.renameNode}
          onDelete={fs.deleteNode}
        />
        <PromptPanel
          mode={mode} onModeChange={setMode}
          prompt={prompt} onPromptChange={setPrompt}
          onGenerate={generate}
          isGenerating={generating}
          hasHTML={!!html}
          status={status} statusText={statusTx}
          onSave={handleSave}
        />
        <Preview
          html={html}
          view={view}   onViewChange={setView}
          device={device} onDeviceChange={setDevice}
          onCopy={copy} onDownload={download} onNew={newProject}
          isGenerating={generating}
        />
      </div>
      <HistoryPanel
        open={histOpen}
        onClose={() => setHistOpen(false)}
        onLoad={({ prompt: p, html: h }) => { setPrompt(p); setHtml(h); setStatus('done'); setStatusTx('Loaded from history') }}
      />
    </div>
  )
}
