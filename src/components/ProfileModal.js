import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { styles } from '../styles/styles'

function ProfileModal({ session, onClose, onProfileUpdate }) {
  const [displayName, setDisplayName] = useState('')
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentCompany, setCurrentCompany] = useState('')
  const [currentSalary, setCurrentSalary] = useState('')
  const [targetSalary, setTargetSalary] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumePath, setResumePath] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingProfile, setFetchingProfile] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (data) {
      setDisplayName(data.display_name || '')
      setCurrentTitle(data.current_title || '')
      setCurrentCompany(data.current_company || '')
      setCurrentSalary(data.current_salary || '')
      setTargetSalary(data.target_salary || '')
      setResumePath(data.resume_path || '')

      if (data.resume_path) {
        const { data: urlData } = await supabase.storage
          .from('resumes')
          .createSignedUrl(data.resume_path, 60)
        if (urlData) setResumeUrl(urlData.signedUrl)
      }
    }
    setFetchingProfile(false)
  }

  const handleResumeUpload = async () => {
    if (!resumeFile) return null
    const filePath = `${session.user.id}/${resumeFile.name}`
    if (resumePath) {
      await supabase.storage.from('resumes').remove([resumePath])
    }
    const { error } = await supabase.storage
      .from('resumes')
      .upload(filePath, resumeFile, { upsert: true })
    if (error) {
      setMessage('Error uploading resume. Please try again.')
      return null
    }
    return filePath
  }

  const handleDeleteResume = async () => {
    if (!window.confirm('Delete your attached resume?')) return
    await supabase.storage.from('resumes').remove([resumePath])
    await supabase.from('profiles').update({ resume_path: null }).eq('id', session.user.id)
    setResumePath('')
    setResumeUrl('')
    setMessage('Resume deleted.')
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage('')
    let newResumePath = resumePath
    if (resumeFile) {
      const uploaded = await handleResumeUpload()
      if (uploaded) newResumePath = uploaded
    }
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      display_name: displayName,
      current_title: currentTitle,
      current_company: currentCompany,
      current_salary: currentSalary ? parseInt(currentSalary) : null,
      target_salary: targetSalary ? parseInt(targetSalary) : null,
      resume_path: newResumePath,
    })
    if (error) {
      setMessage('Error saving profile. Please try again.')
    } else {
      setMessage('Profile saved.')
      onProfileUpdate()
    }
    setLoading(false)
  }

  const isProfileComplete = displayName && resumePath

  if (fetchingProfile) return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <p style={styles.loadingText}>Loading profile...</p>
      </div>
    </div>
  )

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Your Profile</h2>
          <span style={styles.modalClose} onClick={onClose}>✕</span>
        </div>

        {!isProfileComplete && (
          <div style={profileStyles.incompleteWarning}>
            ⚠️ Complete your profile — add your display name and resume to get started.
          </div>
        )}

        <label style={styles.label}>Display Name</label>
        <input style={styles.input} placeholder="Your name" value={displayName} onChange={e => setDisplayName(e.target.value)} />

        <label style={styles.label}>Email</label>
        <input style={{...styles.input, opacity: 0.6, cursor: 'not-allowed'}} value={session.user.email} disabled />

        <label style={styles.label}>Current Job Title</label>
        <input style={styles.input} placeholder="e.g. Technical Solutions Engineer" value={currentTitle} onChange={e => setCurrentTitle(e.target.value)} />

        <label style={styles.label}>Current Company</label>
        <input style={styles.input} placeholder="e.g. Epic Systems" value={currentCompany} onChange={e => setCurrentCompany(e.target.value)} />

        <label style={styles.label}>Current Salary</label>
        <input style={styles.input} placeholder="e.g. 95000" type="number" value={currentSalary} onChange={e => setCurrentSalary(e.target.value)} />

        <label style={styles.label}>Target Salary</label>
        <input style={styles.input} placeholder="e.g. 120000" type="number" value={targetSalary} onChange={e => setTargetSalary(e.target.value)} />

        <label style={styles.label}>Resume (PDF only)</label>

        {resumePath && (
          <div style={profileStyles.resumeRow}>
            <span style={profileStyles.resumeAttached}>✓ Resume attached</span>
            <div style={profileStyles.resumeActions}>
              {resumeUrl && (
                <a href={resumeUrl} target="_blank" rel="noreferrer" style={profileStyles.viewLink}>View</a>
              )}
              <button style={profileStyles.deleteResumeButton} onClick={handleDeleteResume}>Delete</button>
            </div>
          </div>
        )}

        <input style={{...styles.input, padding: '10px', marginTop: resumePath ? '8px' : '0'}} type="file" accept="application/pdf" onChange={e => setResumeFile(e.target.files[0])} />

        {message && (
          <p style={{...styles.message, color: message.includes('Error') ? '#f87171' : '#10b981'}}>
            {message}
          </p>
        )}

        <button style={styles.button} onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}

const profileStyles = {
  incompleteWarning: {
    background: '#2d1f0e',
    border: '1px solid #92400e',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    fontSize: '0.85rem',
    color: '#fbbf24',
  },
  resumeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#0f1117',
    border: '1px solid #2d3148',
    borderRadius: '8px',
    padding: '10px 12px',
    marginBottom: '4px',
  },
  resumeAttached: {
    color: '#10b981',
    fontSize: '0.85rem',
  },
  resumeActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  viewLink: {
    color: '#6366f1',
    fontSize: '0.85rem',
    textDecoration: 'none',
  },
  deleteResumeButton: {
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: 0,
  }
}

export default ProfileModal