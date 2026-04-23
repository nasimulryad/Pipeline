import { useState } from 'react'
import { supabase } from '../supabase'
import { getStyles } from '../styles/styles'
import { useTheme } from '../styles/ThemeContext'
import { STAGE_KEYS } from './constants'

function JobDetailModal({ job, onClose, onUpdate }) {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const [status, setStatus] = useState(job.status)
  const [notes, setNotes] = useState(job.notes || '')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('jobs')
      .update({ status, notes, updated_at: new Date() })
      .eq('id', job.id)
    if (!error) onUpdate()
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this job?')) return
    await supabase.from('jobs').delete().eq('id', job.id)
    onUpdate()
  }

  const currentStage = STAGE_KEYS.find(s => s.key === job.status)
  const stageColor = currentStage ? theme[currentStage.colorKey] : theme.primary

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>

        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>{job.company}</h2>
            <p style={styles.modalSubtitle}>{job.role}</p>
          </div>
          <span style={styles.modalClose} onClick={onClose}>✕</span>
        </div>

        <div style={{marginBottom: '16px'}}>
          <span style={{background: stageColor, color: theme.bgBase, borderRadius: '999px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: '600'}}>
            {currentStage?.label}
          </span>
        </div>

        {job.job_url && (
          <a href={job.job_url} target="_blank" rel="noreferrer" style={styles.jobLink}>View Job Posting ↗</a>
        )}

        {job.recruiter_name && (
          <p style={styles.detailText}>
            Recruiter: {job.recruiter_name}{job.recruiter_email && ` — ${job.recruiter_email}`}
          </p>
        )}

        <label style={styles.label}>Status</label>
        <select style={styles.input} value={status} onChange={e => setStatus(e.target.value)}>
          {STAGE_KEYS.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>

        <label style={styles.label}>Notes</label>
        <textarea style={{...styles.input, height: '120px', resize: 'vertical'}} value={notes} onChange={e => setNotes(e.target.value)} />

        <div style={styles.modalActions}>
          <button style={{...styles.button, background: theme.danger, width: 'auto', padding: '10px 20px'}} onClick={handleDelete}>
            Delete
          </button>
          <button style={{...styles.button, width: 'auto', padding: '10px 20px'}} onClick={handleUpdate} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default JobDetailModal