import { useEffect, useRef } from 'react'

const KEY = 'ai_builder_session'

export function loadSession() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null }
}

export function useSession(state) {
  const timer = useRef(null)

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      localStorage.setItem(KEY, JSON.stringify(state))
    }, 300)
    return () => clearTimeout(timer.current)
  }, [state])
}
