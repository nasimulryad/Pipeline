import { useState } from 'react'
import { supabase } from '../supabase'
import { getStyles } from '../styles/styles'
import { useTheme } from '../styles/ThemeContext'

function Auth() {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Check your email to confirm your account.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    }
    setLoading(false)
  }

  return (
    <div style={styles.authContainer}>
      <h1 style={styles.logo}>Pipeline</h1>
      <p style={styles.tagline}>Your job search, organized.</p>
      <div style={styles.authBox}>
        <h2 style={styles.authTitle}>{isSignUp ? 'Create account' : 'Welcome back'}</h2>
        <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {message && <p style={styles.message}>{message}</p>}
        <button style={styles.button} onClick={handleAuth} disabled={loading}>
          {loading ? 'Please wait...' : isSignUp ? 'Sign up' : 'Log in'}
        </button>
        <p style={styles.toggle}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <span style={styles.link} onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? ' Log in' : ' Sign up'}
          </span>
        </p>
      </div>
    </div>
  )
}

export default Auth