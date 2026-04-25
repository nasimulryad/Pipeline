import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getStyles } from '../styles/styles'
import { useTheme } from '../styles/ThemeContext'
import { STAGE_KEYS } from './constants'

function JobDetailModal({ job, onClose, onUpdate, cachedResumes }) {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const [isEditing, setIsEditing] = useState(false)
  const [activePanel, setActivePanel] = useState('details')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [status, setStatus] = useState(job.status)
  const [notes, setNotes] = useState(job.notes || '')
  const [company, setCompany] = useState(job.company)
  const [role, setRole] = useState(job.role)
  const [jobUrl, setJobUrl] = useState(job.job_url || '')
  const [recruiterName, setRecruiterName] = useState(job.recruiter_name || '')
  const [recruiterEmail, setRecruiterEmail] = useState(job.recruiter_email || '')
  const [selectedResumeId, setSelectedResumeId] = useState(job.resume_id || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const resumes = [...(cachedResumes || [])].sort((a, b) =>
    a.display_name.localeCompare(b.display_name)
  )

  const currentStage = STAGE_KEYS.find(s => s.key === job.status)
  const stageColor = currentStage ? theme[currentStage.colorKey] : theme.primary

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleUpdate = async () => {
    if (!company.trim() || !role.trim()) {
      setMessage('Company and role are required.')
      return
    }
    setLoading(true)
    setMessage('')
    const { error } = await supabase
      .from('jobs')
      .update({
        company: company.trim(),
        role: role.trim(),
        status,
        job_url: jobUrl,
        notes,
        recruiter_name: recruiterName,
        recruiter_email: recruiterEmail,
        resume_id: selectedResumeId || null,
        updated_at: new Date()
      })
      .eq('id', job.id)
    if (error) {
      setMessage('Error saving changes. Please try again.')
    } else {
      onUpdate()
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this job?')) return
    await supabase.from('jobs').delete().eq('id', job.id)
    onUpdate()
  }

  const handleCancel = () => {
    setIsEditing(false)
    setMessage('')
    setStatus(job.status)
    setNotes(job.notes || '')
    setCompany(job.company)
    setRole(job.role)
    setJobUrl(job.job_url || '')
    setRecruiterName(job.recruiter_name || '')
    setRecruiterEmail(job.recruiter_email || '')
    setSelectedResumeId(job.resume_id || '')
  }

  const attachedResume = resumes.find(r => r.id === selectedResumeId)

  const handleViewResume = async () => {
    if (!attachedResume) return
    const { data } = await supabase.storage
      .from('resumes')
      .createSignedUrl(attachedResume.file_path, 60)
    if (data) window.open(data.signedUrl, '_blank')
  }

  const renderDetails = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '32px',
      overflowY: 'auto',
      gap: '20px'
    }}>

      {/* Company and role */}
      <div>
        {isEditing ? (
          <>
            <input
              style={{...styles.input, fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px'}}
              value={company}
              onChange={e => setCompany(e.target.value)}
            />
            <input
              style={{...styles.input, fontSize: '0.95rem'}}
              value={role}
              onChange={e => setRole(e.target.value)}
            />
          </>
        ) : (
          <>
            <h2 style={{...styles.modalTitle, marginBottom: '6px', fontSize: '1.4rem'}}>{job.company}</h2>
            <p style={{...styles.modalSubtitle, fontSize: '1rem'}}>{job.role}</p>
          </>
        )}
      </div>

      {/* Edit / Cancel button */}
      <div>
        {isEditing ? (
          <button
            onClick={handleCancel}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              color: theme.textSecondary,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              color: theme.textSecondary,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Edit
          </button>
        )}
      </div>

      {/* Stage */}
      <div>
        {isEditing ? (
          <>
            <label style={styles.label}>Stage</label>
            <select style={styles.input} value={status} onChange={e => setStatus(e.target.value)}>
              {STAGE_KEYS.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </>
        ) : (
          <span style={{
            background: stageColor,
            color: theme.bgBase,
            borderRadius: '999px',
            padding: '6px 16px',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}>
            {currentStage?.label}
          </span>
        )}
      </div>

      {/* Job URL */}
      {isEditing ? (
        <div>
          <label style={styles.label}>Job URL</label>
          <input
            style={styles.input}
            placeholder="https://company.com/jobs/role"
            value={jobUrl}
            onChange={e => setJobUrl(e.target.value)}
          />
        </div>
      ) : job.job_url ? (
        <a href={job.job_url} target="_blank" rel="noreferrer" style={{...styles.jobLink, fontSize: '0.95rem'}}>
          View Job Posting ↗
        </a>
      ) : null}

      {/* Recruiter */}
      {isEditing ? (
        <div>
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
        </div>
      ) : (job.recruiter_name || job.recruiter_email) ? (
        <div>
          <p style={{...styles.label, marginBottom: '6px'}}>Recruiter</p>
          <p style={{color: theme.textPrimary, fontSize: '0.95rem'}}>
            {job.recruiter_name}
            {job.recruiter_email && (
              <span style={{color: theme.textSecondary}}> — {job.recruiter_email}</span>
            )}
          </p>
        </div>
      ) : null}

      {/* Resume */}
      <div>
        <p style={{...styles.label, marginBottom: '8px'}}>Resume</p>
        {isEditing ? (
          <select
            style={styles.input}
            value={selectedResumeId}
            onChange={e => setSelectedResumeId(e.target.value)}
          >
            <option value="">— No resume selected —</option>
            {resumes.map(r => (
              <option key={r.id} value={r.id}>{r.display_name}</option>
            ))}
          </select>
        ) : attachedResume ? (
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <span style={{color: theme.textPrimary, fontSize: '0.95rem'}}>{attachedResume.display_name}</span>
            <button
              onClick={handleViewResume}
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
          </div>
        ) : (
          <p style={{color: theme.textMuted, fontSize: '0.9rem'}}>No resume attached</p>
        )}
      </div>

      {/* Notes */}
      <div style={{flex: 1}}>
        <label style={styles.label}>Notes</label>
        {isEditing ? (
          <textarea
            style={{...styles.input, height: '120px', resize: 'vertical'}}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        ) : (
          <p style={{
            color: job.notes ? theme.textPrimary : theme.textMuted,
            fontSize: '0.9rem',
            lineHeight: '1.6'
          }}>
            {job.notes || 'No notes added.'}
          </p>
        )}
      </div>

      {/* Edit actions */}
      {isEditing && (
        <div style={{marginTop: 'auto'}}>
          {message && (
            <p style={{...styles.message, color: theme.danger, marginBottom: '8px'}}>{message}</p>
          )}
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <button
              style={{...styles.button, background: theme.danger, width: 'auto', padding: '10px 20px'}}
              onClick={handleDelete}
            >
              Delete
            </button>
            <button
              style={{...styles.button, width: 'auto', padding: '10px 20px'}}
              onClick={handleUpdate}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderFeatures = () => (
    <div style={{
      height: '100%',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Close button */}
      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '16px'}}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            color: theme.textSecondary,
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '6px 12px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Placeholder */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <span style={{fontSize: '3rem'}}>🚧</span>
        <p style={{
          color: theme.textSecondary,
          fontSize: '1.1rem',
          textAlign: 'center',
          fontWeight: '600'
        }}>
          {currentStage?.label} Features
        </p>
        <p style={{color: theme.textMuted, fontSize: '0.9rem', textAlign: 'center'}}>
          New features coming soon.
        </p>
      </div>
    </div>
  )

  const renderTab = (side) => (
    <div
      onClick={() => setActivePanel(side === 'right' ? 'features' : 'details')}
      style={{
        width: '28px',
        background: stageColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        borderRadius: side === 'right' ? '0 8px 8px 0' : '8px 0 0 8px',
        gap: '8px',
        padding: '12px 0',
        flexShrink: 0
      }}
    >
      <span style={{
        color: theme.bgBase,
        fontSize: '0.65rem',
        fontWeight: '700',
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        transform: side === 'right' ? 'rotate(180deg)' : 'none',
        letterSpacing: '1px'
      }}>
        {side === 'right' ? currentStage?.label : 'Details'}
      </span>
      <span style={{color: theme.bgBase, fontSize: '1rem', fontWeight: '700'}}>
        {side === 'right' ? '›' : '‹'}
      </span>
    </div>
  )

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px',
    }}>
      {isMobile ? (
        <div style={{
          background: theme.bgSurface,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden'
        }}>
          {activePanel === 'details' ? (
            <>
              {renderDetails()}
              {renderTab('right')}
            </>
          ) : (
            <>
              {renderTab('left')}
              {renderFeatures()}
            </>
          )}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          width: '100%',
          maxWidth: '1200px',
          height: '85vh',
        }}>
          {/* Details card — 35% */}
          <div style={{
            flex: '0 0 35%',
            background: theme.bgSurface,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {renderDetails()}
          </div>

          {/* Features card — 65% */}
          <div style={{
            flex: '0 0 calc(65% - 16px)',
            background: theme.bgSurface,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {renderFeatures()}
          </div>
        </div>
      )}
    </div>
  )
}

export default JobDetailModal