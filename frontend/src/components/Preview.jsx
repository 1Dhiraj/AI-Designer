import { useRef, useEffect } from 'react'
import { Globe, Desktop, Tablet, Mobile } from './Icons'
import styles from './Preview.module.css'

const DEVICES = [
  { id: 'desktop', label: 'Desktop', icon: <Desktop /> },
  { id: 'tablet',  label: 'Tablet',  icon: <Tablet /> },
  { id: 'mobile',  label: 'Mobile',  icon: <Mobile /> },
]

export default function Preview({ html, view, device, onViewChange, onDeviceChange, onCopy, onDownload, onNew, isGenerating }) {
  const iframeRef = useRef()

  useEffect(() => {
    // Only write to iframe when generation is fully done — mid-stream updates cause full reload + blink
    if (iframeRef.current && html && !isGenerating) {
      iframeRef.current.srcdoc = html
    }
  }, [html, isGenerating])

  const hasHTML = !!html

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.lights}>
          <div className={`${styles.light} ${styles.red}`} />
          <div className={`${styles.light} ${styles.yellow}`} />
          <div className={`${styles.light} ${styles.green}`} />
        </div>

        <div className={styles.viewTabs}>
          <button className={`${styles.viewTab} ${view === 'preview' ? styles.active : ''}`} onClick={() => onViewChange('preview')}>Preview</button>
          <button className={`${styles.viewTab} ${view === 'code' ? styles.active : ''}`} onClick={() => onViewChange('code')}>Code</button>
        </div>

        {view === 'preview' && (
          <div className={styles.deviceTabs}>
            {DEVICES.map(d => (
              <button key={d.id} title={d.label} className={`${styles.deviceBtn} ${device === d.id ? styles.active : ''}`} onClick={() => onDeviceChange(d.id)}>
                {d.icon}
              </button>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.btn} onClick={onCopy} disabled={!hasHTML || isGenerating}>Copy HTML</button>
          <button className={styles.btn} onClick={onDownload} disabled={!hasHTML || isGenerating}>Download</button>
          <button className={`${styles.btn} ${styles.accent}`} onClick={onNew}>+ New</button>
        </div>
      </div>

      <div className={styles.area}>
        {isGenerating && !hasHTML ? (
          <div className={styles.generating}>
            <div className={styles.genOrb} />
            <div className={styles.genLabel}>Building your website…</div>
            <div className={styles.genBars}>
              <div className={styles.bar} style={{ width: '72%' }} />
              <div className={styles.bar} style={{ width: '55%', animationDelay: '0.15s' }} />
              <div className={styles.bar} style={{ width: '88%', animationDelay: '0.3s' }} />
              <div className={styles.bar} style={{ width: '40%', animationDelay: '0.45s' }} />
              <div className={styles.bar} style={{ width: '65%', animationDelay: '0.6s' }} />
              <div className={styles.bar} style={{ width: '80%', animationDelay: '0.75s' }} />
              <div className={styles.bar} style={{ width: '50%', animationDelay: '0.9s' }} />
            </div>
          </div>
        ) : (
          <>
            {!hasHTML && (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}><Globe /></div>
                <div className={styles.emptyTitle}>Nothing here yet</div>
                <div className={styles.emptySub}>Describe a website on the left and hit Generate to see it live</div>
              </div>
            )}

            {/* Code view — shown/hidden via display, not unmounted */}
            <div className={styles.codeView} style={{ display: hasHTML && view === 'code' ? 'block' : 'none' }}>
              {isGenerating && <div className={styles.streamingBar} />}
              <pre className={styles.code}>{html}</pre>
            </div>

            {/* Preview iframe — always mounted so srcdoc persists across view switches */}
            <div
              className={`${styles.scroll} ${device === 'desktop' ? styles.full : ''}`}
              style={{ display: hasHTML && view === 'preview' ? 'flex' : 'none' }}
            >
              {isGenerating && <div className={styles.iframeOverlay}><div className={styles.streamPill}>Streaming…</div></div>}
              <iframe
                ref={iframeRef}
                className={`${styles.iframe} ${styles[device]}`}
                title="preview"
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
