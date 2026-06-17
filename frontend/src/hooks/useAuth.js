import { useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem('ai_builder_user') || 'null')
  )

  const login = (userData) => {
    localStorage.setItem('ai_builder_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('ai_builder_user')
    setUser(null)
  }

  return { user, login, logout }
}
