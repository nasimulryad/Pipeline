import { useState, useRef } from 'react'
import { supabase } from '../supabase'
import { getStyles } from '../styles/styles'
import { useTheme } from '../styles/ThemeContext'

function ResetPassword({ onComplete }) {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const passwordRef = useRef(null)
  const confirmPasswordRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleReset = async () => {
    const password = passwordRef.current?.value || ''
    const confirmPassword = confirmPasswordRef.current?.value || ''

    if (!password) { setMessage('Please enter a new password.'); setMessageType('error'); return }
    if (password.length < 6) { setMessage('Password must be at least 6 characters.'); setMessageType('error'); return }
    if (password !== confirmPassword) { setMessage('Passwords do not match.'); setMessageType('error'); return }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage(error.message)
      setMessageType('error')
    } else {
      setMessage('Password updated successfully. Redirecting...')
      setMessageType('success')
      setTimeout(() => {
        onComplete()
      }, 2000)
    }
    setLoading(false)
  }

  return (
    <div style={styles.authContainer}>
      <h1 style={styles.logo}>Pipeline</h1>
      <p style={styles.tagline}>Your job search, organized.</p>

      <div style={styles.authBox}>
        <h2 style={styles.authTitle}>Set new password</h2>
        <p style={{
          color: theme.textSecondary,
          fontSize: '0.85rem',
          marginBottom: '20px',
          marginTop: '-8px'
        }}>
          Choose a strong password for your account.
        </p>

        <label style={styles.label}>New Password</label>
        <div style={{position: 'relative', marginBottom: '12px'}}>
          <input
            ref={passwordRef}
            style={{...styles.input, marginBottom: 0, paddingRight: '60px'}}
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 6 characters"
            onKeyDown={e => e.key === 'Enter' && handleReset()}
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
            }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <label style={styles.label}>Confirm Password</label>
        <div style={{position: 'relative', marginBottom: '12px'}}>
          <input
            ref={confirmPasswordRef}
            style={{...styles.input, marginBottom: 0, paddingRight: '60px'}}
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repeat your password"
            onKeyDown={e => e.key === 'Enter' && handleReset()}
          />
          <button
            onClick={() => setShowConfirm(!showConfirm)}
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
            }}
          >
            {showConfirm ? 'Hide' : 'Show'}
          </button>
        </div>

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
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  )
}

export default ResetPassword