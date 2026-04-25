import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { getStyles } from './styles/styles'
import { useTheme } from './styles/ThemeContext'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import ResetPassword from './components/ResetPassword'

function App() {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordReset, setIsPasswordReset] = useState(false)

  useEffect(() => {
    // Check for password reset token in URL hash
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      setIsPasswordReset(true)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setIsPasswordReset(true)
        return
      }
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={styles.center}>Loading...</div>

  if (isPasswordReset) return (
    <div style={styles.app}>
      <ResetPassword onComplete={() => {
        setIsPasswordReset(false)
        window.location.hash = ''
      }} />
    </div>
  )

  return (
    <div style={styles.app}>
      {session ? <Dashboard session={session} /> : <Auth />}
    </div>
  )
}

export default App