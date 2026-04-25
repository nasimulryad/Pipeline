import { useState, useRef } from 'react'
import { supabase } from '../supabase'
import { getStyles } from '../styles/styles'
import { useTheme } from '../styles/ThemeContext'

function Auth() {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const displayNameRef = useRef(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [showPassword, setShowPassword] = useState(false)

  const showMessage = (text, type = 'error') => {
    setMessage(text)
    setMessageType(type)
  }

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')

    const email = emailRef.current?.value || ''
    const password = passwordRef.current?.value || ''
    const displayName = displayNameRef.current?.value || ''

    if (!email) { showMessage('Please enter your email.'); setLoading(false); return }
    if (!password) { showMessage('Please enter your password.'); setLoading(false); return }

    if (isSignUp) {
      if (!displayName.trim()) {
        showMessage('Please enter your name.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) {
        // Handle common signup errors with friendly messages
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          showMessage('An account with this email already exists. Try logging in instead.')
        } else if (error.message.includes('password')) {
          showMessage('Password must be at least 6 characters.')
        } else {
          showMessage(error.message)
        }
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        // Supabase returns a fake user when email already exists — catch it here
        showMessage('An account with this email already exists. Try logging in instead.')
      } else {
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: displayName.trim()
          })
        }
        showMessage('Check your email to confirm your account.', 'success')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Invalid login')) {
          showMessage('Incorrect email or password. Please try again.')
        } else {
          showMessage(error.message)
        }
      }
    }
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    const email = emailRef.current?.value || ''
    if (!email) { showMessage('Please enter your email address first.'); return }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://pipeline.nasimulryad.workers.dev/reset-password'
    })

    if (error) {
      showMessage(error.message)
    } else {
      showMessage('Password reset email sent. Check your inbox.', 'success')
    }
    setLoading(false)
  }

  const handleSwitch = () => {
    setIsSignUp(!isSignUp)
    setIsForgotPassword(false)
    setMessage('')
    setShowPassword(false)
    if (emailRef.current) emailRef.current.value = ''
    if (passwordRef.current) passwordRef.current.value = ''
    if (displayNameRef.current) displayNameRef.current.value = ''
  }

  const handleForgotSwitch = () => {
    setIsForgotPassword(!isForgotPassword)
    setMessage('')
    setShowPassword(false)
  }

  return (
    <div style={{
      ...styles.authContainer,
      background: isSignUp
        ? `linear-gradient(135deg, ${theme.bgBase} 0%, ${theme.bgSurface} 100%)`
        : theme.bgBase,
      transition: 'background 0.4s ease'
    }}>
      <h1 style={styles.logo}>Pipeline</h1>
      <p style={styles.tagline}>Your job search, organized.</p>

      <div style={{
        ...styles.authBox,
        border: isSignUp
          ? `1px solid ${theme.primary}`
          : `1px solid ${theme.border}`,
        transition: 'border 0.3s ease'
      }}>

        {/* Forgot password view */}
        {isForgotPassword ? (
          <>
            <h2 style={styles.authTitle}>Reset your password</h2>
            <p style={{
              color: theme.textSecondary,
              fontSize: '0.85rem',
              marginBottom: '20px',
              marginTop: '-8px'
            }}>
              Enter your email and we'll send you a reset link.
            </p>

            <label style={styles.label}>Email</label>
            <input
              ref={emailRef}
              style={styles.input}
              type="email"
              placeholder="e.g. jane@email.com"
              onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
            />

            {message && (
              <p style={{
                ...styles.message,
                color: messageType === 'success' ? theme.success : theme.danger
              }}>
                {message}
              </p>
            )}

            <button
              style={{...styles.button, marginTop: '8px'}}
              onClick={handleForgotPassword}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <p style={styles.toggle}>
              <span style={styles.link} onClick={handleForgotSwitch}>
                ← Back to login
              </span>
            </p>
          </>
        ) : (
          <>
            <h2 style={styles.authTitle}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>

            {isSignUp && (
              <p style={{
                color: theme.textSecondary,
                fontSize: '0.85rem',
                marginBottom: '20px',
                marginTop: '-8px'
              }}>
                Join Pipeline and start organizing your job search.
              </p>
            )}

            {isSignUp && (
              <>
                <label style={styles.label}>Your Name</label>
                <input
                  ref={displayNameRef}
                  style={styles.input}
                  placeholder="e.g. Jane Smith"
                  onKeyDown={e => e.key === 'Enter' && handleAuth()}
                />
              </>
            )}

            <label style={styles.label}>Email</label>
            <input
              ref={emailRef}
              style={styles.input}
              type="email"
              placeholder="e.g. jane@email.com"
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />

            <label style={styles.label}>Password</label>
            <div style={{position: 'relative', marginBottom: '12px'}}>
              <input
                ref={passwordRef}
                style={{
                  ...styles.input,
                  marginBottom: 0,
                  paddingRight: '60px'
                }}
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: theme.textSecondary,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  padding: '4px 6px',
                  borderRadius: '4px',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {!isSignUp && (
              <p style={{
                textAlign: 'right',
                marginBottom: '12px',
                marginTop: '-4px'
              }}>
                <span
                  style={{
                    color: theme.textSecondary,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onClick={handleForgotSwitch}
                >
                  Forgot password?
                </span>
              </p>
            )}

            {message && (
              <p style={{
                ...styles.message,
                color: messageType === 'success' ? theme.success : theme.danger
              }}>
                {message}
              </p>
            )}

            <button
              style={{...styles.button, marginTop: '8px'}}
              onClick={handleAuth}
              disabled={loading}
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Log In'}
            </button>

            <p style={styles.toggle}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <span style={styles.link} onClick={handleSwitch}>
                {isSignUp ? ' Log in' : ' Sign up'}
              </span>
            </p>
          </>
        )}
      </div>

      {isSignUp && (
        <p style={{
          color: theme.textMuted,
          fontSize: '0.75rem',
          marginTop: '16px',
          textAlign: 'center'
        }}>
          By signing up you agree to keep your job search organized.
        </p>
      )}
    </div>
  )
}

export default Auth