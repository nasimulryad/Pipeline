import { useState, useRef } from 'react'
import { supabase } from '../supabase'
import { getStyles } from '../styles/styles'
import { useTheme } from '../styles/ThemeContext'
import { STAGE_KEYS } from './constants'

function AddJobModal({ onClose, onSave, userId, cachedResumes, onResumeChange }) {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const fileInputRef = useRef(null)

  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('considering')
  const [jobUrl, setJobUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [recruiterName, setRecruiterName] = useState('')
  const [recruiterEmail, setRecruiterEmail] = useState('')
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [resumeTab, setResumeTab] = useState('existing')
  const [newResumeFile, setNewResumeFile] = useState(null)
  const [newResumeName, setNewResumeName] = useState('')
  const [uploadingResume, setUploadingResume] = useState(false)
  const [resumeMessage, setResumeMessage] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const resumes = [...(cachedResumes || [])].sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  )

  const handleViewResume = async (resume) => {
    const { data } = await supabase.storage
      .from('resumes')
      .createSignedUrl(resume.file_path, 60)
    if (data) window.open(data.signedUrl, '_blank')
  }

  const handleUploadNewResume = async () => {
    if (!newResumeFile) { setResumeMessage('Please select a file.'); return null }
    if (!newResumeName.trim()) { setResumeMessage('Please enter a name for this resume.'); return null }

    const isDuplicate = resumes.some(
      r => r.display_name.toLowerCase() === newResumeName.trim().toLowerCase()
    )
    if (isDuplicate) {
      setResumeMessage('A resume with that name already exists in your profile. Please use a different name.')
      return null
    }

    setUploadingResume(true)
    setResumeMessage('')

    const filePath = `${userId}/${Date.now()}_${newResumeFile.name}`

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, newResumeFile, { upsert: true })

    if (uploadError) {
      setResumeMessage('Error uploading file. Please try again.')
      setUploadingResume(false)
      return null
    }

    const { data, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        display_name: newResumeName.trim(),
        file_path: filePath
      })
      .select()
      .single()

    if (dbError) {
      setResumeMessage('Error saving resume. Please try again.')
      setUploadingResume(false)
      return null
    }

    onResumeChange()
    setUploadingResume(false)
    return data.id
  }

  const handleSave = async () => {
    if (!company.trim()) { setSaveMessage('Please enter a company name.'); return }
    if (!role.trim()) { setSaveMessage('Please enter a role.'); return }
    setLoading(true)
    setSaveMessage('')

    let resumeId = selectedResumeId || null

    if (resumeTab === 'upload' && newResumeFile) {
      const uploadedId = await handleUploadNewResume()
      if (!uploadedId) { setLoading(false); return }
      resumeId = uploadedId
    }

    const { error } = await supabase.from('jobs').insert({
      user_id: userId,
      company: company.trim(),
      role: role.trim(),
      status,
      job_url: jobUrl,
      notes,
      recruiter_name: recruiterName,
      recruiter_email: recruiterEmail,
      resume_id: resumeId,
    })

    if (error) {
      setSaveMessage('Error saving job. Please try again.')
    } else {
      onSave()
    }
    setLoading(false)
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>

        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Add Job</h2>
          <span style={styles.modalClose} onClick={onClose}>✕</span>
        </div>

        <label style={styles.label}>Company *</label>
        <input
          style={styles.input}
          placeholder="e.g. Acme Corp"
          value={company}
          onChange={e => { setCompany(e.target.value); setSaveMessage('') }}
        />

        <label style={styles.label}>Role *</label>
        <input
          style={styles.input}
          placeholder="e.g. Account Manager"
          value={role}
          onChange={e => { setRole(e.target.value); setSaveMessage('') }}
        />

        <label style={styles.label}>Stage</label>
        <select
          style={styles.input}
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          {STAGE_KEYS.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>

        <label style={styles.label}>Job URL</label>
        <input
          style={styles.input}
          placeholder="e.g. https://company.com/jobs/role"
          value={jobUrl}
          onChange={e => setJobUrl(e.target.value)}
        />

        <label style={styles.label}>Recruiter Name</label>
        <input
          style={styles.input}
          placeholder="e.g. Jane Smith"
          value={recruiterName}
          onChange={e => setRecruiterName(e.target.value)}
        />

        <label style={styles.label}>Recruiter Email</label>
        <input
          style={styles.input}
          placeholder="e.g. jane@company.com"
          value={recruiterEmail}
          onChange={e => setRecruiterEmail(e.target.value)}
        />

        <label style={styles.label}>Notes</label>
        <textarea
          style={{...styles.input, height: '80px', resize: 'vertical'}}
          placeholder="Any notes about this role..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        {/* Resume section */}
        <label style={styles.label}>Resume</label>
        <div style={{display: 'flex', gap: '8px', marginBottom: '12px'}}>
          <button
            onClick={() => setResumeTab('existing')}
            style={{
              flex: 1,
              padding: '8px',
              background: resumeTab === 'existing' ? theme.primary : 'transparent',
              border: `1px solid ${resumeTab === 'existing' ? theme.primary : theme.border}`,
              borderRadius: '6px',
              color: resumeTab === 'existing' ? theme.bgBase : theme.textSecondary,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            Choose Existing
          </button>
          <button
            onClick={() => setResumeTab('upload')}
            style={{
              flex: 1,
              padding: '8px',
              background: resumeTab === 'upload' ? theme.primary : 'transparent',
              border: `1px solid ${resumeTab === 'upload' ? theme.primary : theme.border}`,
              borderRadius: '6px',
              color: resumeTab === 'upload' ? theme.bgBase : theme.textSecondary,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            Upload New
          </button>
        </div>

        {/* Choose existing tab */}
        {resumeTab === 'existing' && (
          <div>
            {resumes.length === 0 ? (
              <p style={{color: theme.textMuted, fontSize: '0.85rem', marginBottom: '12px'}}>
                No resumes in your profile yet. Switch to Upload New to add one.
              </p>
            ) : selectedResumeId ? (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: theme.bgBase,
                border: `1px solid ${theme.primary}`,
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '12px'
              }}>
                <span style={{color: theme.primary, fontSize: '0.85rem', fontWeight: '600'}}>
                  ✓ {resumes.find(r => r.id === selectedResumeId)?.display_name}
                </span>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button
                    onClick={() => handleViewResume(resumes.find(r => r.id === selectedResumeId))}
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
                    onClick={() => setSelectedResumeId('')}
                    style={{
                      padding: '4px 12px',
                      background: 'transparent',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '4px',
                      color: theme.textSecondary,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Swap
                  </button>
                </div>
              </div>
            ) : (
              <div style={{marginBottom: '12px'}}>
                {resumes.map(r => (
                  <div key={r.id} style={{
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
                      {r.display_name}
                    </span>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button
                        onClick={() => handleViewResume(r)}
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
                        onClick={() => setSelectedResumeId(r.id)}
                        style={{
                          padding: '4px 12px',
                          background: theme.primary,
                          border: 'none',
                          borderRadius: '4px',
                          color: theme.bgBase,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload new tab */}
        {resumeTab === 'upload' && (
          <div style={{
            background: theme.bgDeep,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <label style={styles.label}>Resume Name</label>
            <input
              style={styles.input}
              placeholder="e.g. Software Engineer Resume"
              value={newResumeName}
              onChange={e => setNewResumeName(e.target.value)}
            />
            <label style={styles.label}>File (PDF only)</label>
            <input
              ref={fileInputRef}
              style={{...styles.input, padding: '10px'}}
              type="file"
              accept="application/pdf"
              onChange={e => setNewResumeFile(e.target.files[0])}
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
          </div>
        )}

        {saveMessage && (
          <p style={{...styles.message, color: theme.danger}}>
            {saveMessage}
          </p>
        )}

        <button
          style={styles.button}
          onClick={handleSave}
          disabled={loading || uploadingResume}
        >
          {loading ? 'Saving...' : 'Save Job'}
        </button>

      </div>
    </div>
  )
}

export default AddJobModal