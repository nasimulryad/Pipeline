import { useState, useRef } from 'react'
import { supabase } from '../supabase'
import { getStyles } from '../styles/styles'
import { useTheme } from '../styles/ThemeContext'

function ProfileModal({ session, cachedProfile, cachedResumes, onClose, onProfileUpdate, onResumeChange }) {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const fileInputRef = useRef(null)

  const [displayName, setDisplayName] = useState(cachedProfile?.display_name || '')
  const [currentTitle, setCurrentTitle] = useState(cachedProfile?.current_title || '')
  const [currentCompany, setCurrentCompany] = useState(cachedProfile?.current_company || '')
  const [currentSalary, setCurrentSalary] = useState(
    cachedProfile?.current_salary ? parseInt(cachedProfile.current_salary).toLocaleString() : ''
  )
  const [targetSalary, setTargetSalary] = useState(
    cachedProfile?.target_salary ? parseInt(cachedProfile.target_salary).toLocaleString() : ''
  )
  const [resumes, setResumes] = useState(
    [...(cachedResumes || [])].sort((a, b) => a.display_name.localeCompare(b.display_name))
  )
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeDisplayName, setResumeDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [message, setMessage] = useState('')
  const [resumeMessage, setResumeMessage] = useState('')

  const handleSalaryChange = (value, setter) => {
    const raw = value.replace(/,/g, '')
    if (!/^\d*$/.test(raw)) return
    setter(raw ? parseInt(raw).toLocaleString() : '')
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      display_name: displayName,
      current_title: currentTitle,
      current_company: currentCompany,
      current_salary: currentSalary ? parseInt(currentSalary.toString().replace(/,/g, '')) : null,
      target_salary: targetSalary ? parseInt(targetSalary.toString().replace(/,/g, '')) : null,
    })
    if (error) {
      setMessage('Error saving profile. Please try again.')
    } else {
      setMessage('Profile saved.')
      onProfileUpdate()
    }
    setLoading(false)
  }

  const handleUploadResume = async () => {
    if (!resumeFile) { setResumeMessage('Please select a file.'); return }
    if (!resumeDisplayName.trim()) { setResumeMessage('Please enter a name for this resume.'); return }

    const isDuplicate = resumes.some(
      r => r.display_name.toLowerCase() === resumeDisplayName.trim().toLowerCase()
    )
    if (isDuplicate) { setResumeMessage('A resume with that name already exists. Please use a different name.'); return }

    setUploadingResume(true)
    setResumeMessage('')

    const filePath = `${session.user.id}/${Date.now()}_${resumeFile.name}`

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, resumeFile, { upsert: true })

    if (uploadError) {
      setResumeMessage('Error uploading file. Please try again.')
      setUploadingResume(false)
      return
    }

    const { data, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: session.user.id,
        display_name: resumeDisplayName.trim(),
        file_path: filePath
      })
      .select()
      .single()

    if (dbError) {
      setResumeMessage('Error saving resume. Please try again.')
    } else {
      const updated = [data, ...resumes].sort((a, b) => a.display_name.localeCompare(b.display_name))
      setResumes(updated)
      setResumeFile(null)
      setResumeDisplayName('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setResumeMessage('Resume uploaded.')
      onResumeChange()
    }
    setUploadingResume(false)
  }

  const handleDeleteResume = async (resume) => {
    if (!window.confirm(`Delete "${resume.display_name}"?`)) return
    await supabase.storage.from('resumes').remove([resume.file_path])
    await supabase.from('resumes').delete().eq('id', resume.id)
    setResumes(resumes.filter(r => r.id !== resume.id))
    onResumeChange()
  }

  const handleViewResume = async (resume) => {
    const { data } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resume.file_path, 60)
    if (data) window.open(data.signedUrl, '_blank')
  }

  const isProfileComplete = displayName && resumes.length > 0

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>

        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Your Profile</h2>
          <span style={styles.modalClose} onClick={onClose}>✕</span>
        </div>

        {!isProfileComplete && (
          <div style={{
            background: '#2d1f0e',
            border: '1px solid #92400e',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '0.85rem',
            color: '#fbbf24'
          }}>
            ⚠️ Complete your profile — add your display name and at least one resume.
          </div>
        )}

        <label style={styles.label}>Display Name</label>
        <input
          style={styles.input}
          placeholder="Your name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
        />

        <label style={styles.label}>Email</label>
        <input
          style={{...styles.input, opacity: 0.6, cursor: 'not-allowed'}}
          value={session.user.email}
          disabled
        />

        <label style={styles.label}>Current Job Title</label>
        <input
          style={styles.input}
          placeholder="e.g. Software Engineer"
          value={currentTitle}
          onChange={e => setCurrentTitle(e.target.value)}
        />

        <label style={styles.label}>Current Company</label>
        <input
          style={styles.input}
          placeholder="e.g. Acme Corp"
          value={currentCompany}
          onChange={e => setCurrentCompany(e.target.value)}
        />

        <label style={styles.label}>Current Salary</label>
        <input
          style={styles.input}
          placeholder="e.g. 95,000"
          type="text"
          value={currentSalary}
          onChange={e => handleSalaryChange(e.target.value, setCurrentSalary)}
        />

        <label style={styles.label}>Target Salary</label>
        <input
          style={styles.input}
          placeholder="e.g. 120,000"
          type="text"
          value={targetSalary}
          onChange={e => handleSalaryChange(e.target.value, setTargetSalary)}
        />

        {message && (
          <p style={{
            ...styles.message,
            color: message.includes('Error') ? theme.danger : theme.success
          }}>
            {message}
          </p>
        )}

        <button style={styles.button} onClick={handleSaveProfile} disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </button>

        <div style={{borderTop: `1px solid ${theme.border}`, margin: '24px 0'}} />

        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: theme.textPrimary,
          marginBottom: '16px'
        }}>
          My Resumes
        </h3>

        {resumes.length === 0 && (
          <p style={{color: theme.textMuted, fontSize: '0.85rem', marginBottom: '16px'}}>
            No resumes uploaded yet.
          </p>
        )}

        {resumes.map(resume => (
          <div key={resume.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: theme.bgBase,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '8px'
          }}>
            <span style={{color: theme.textPrimary, fontSize: '0.85rem', fontWeight: '500'}}>
              {resume.display_name}
            </span>
            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
              <button
                onClick={() => handleViewResume(resume)}
                style={{
                  padding: '4px 12px',
                  background: 'transparent',
                  border: `1px solid ${theme.primary}`,
                  borderRadius: '4px',
                  color: theme.primary,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                View
              </button>
              <button
                onClick={() => handleDeleteResume(resume)}
                style={{
                  padding: '4px 12px',
                  background: 'transparent',
                  border: `1px solid ${theme.danger}`,
                  borderRadius: '4px',
                  color: theme.danger,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        <div style={{
          background: theme.bgDeep,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '16px',
          marginTop: '16px'
        }}>
          <label style={styles.label}>Resume Name</label>
          <input
            style={styles.input}
            placeholder="e.g. Software Engineer Resume"
            value={resumeDisplayName}
            onChange={e => setResumeDisplayName(e.target.value)}
          />

          <label style={styles.label}>File (PDF only)</label>
          <input
            ref={fileInputRef}
            style={{...styles.input, padding: '10px'}}
            type="file"
            accept="application/pdf"
            onChange={e => setResumeFile(e.target.files[0])}
          />

          {resumeMessage && (
            <p style={{
              ...styles.message,
              color: resumeMessage.includes('Error') || resumeMessage.includes('Please') || resumeMessage.includes('already exists')
                ? theme.danger
                : theme.success
            }}>
              {resumeMessage}
            </p>
          )}

          <button
            style={{
              ...styles.button,
              background: (resumeFile && resumeDisplayName.trim()) ? theme.primary : theme.border
            }}
            onClick={handleUploadResume}
            disabled={uploadingResume}
          >
            {uploadingResume ? 'Uploading...' : '+ Upload Resume'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ProfileModal