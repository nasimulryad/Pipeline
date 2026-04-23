import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { getStyles } from './styles/styles'
import { useTheme } from './styles/ThemeContext'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'

function App() {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={styles.center}>Loading...</div>

  return (
    <div style={styles.app}>
      {session ? <Dashboard session={session} /> : <Auth />}
    </div>
  )
}

export default App