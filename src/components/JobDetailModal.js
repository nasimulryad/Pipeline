import { useState } from 'react'
import { supabase } from '../supabase'
import { styles } from '../styles/styles'
import { STAGES } from './constants'

function JobDetailModal({ job, onClose, onUpdate }) {
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
        {job.job_url && (
          <a href={job.job_url} target="_blank" rel="noreferrer" style={styles.jobLink}>
            View Job Posting ↗
          </a>
        )}
        {job.recruiter_name && (
          <p style={styles.detailText}>
            Recruiter: {job.recruiter_name} {job.recruiter_email && `— ${job.recruiter_email}`}
          </p>
        )}
        <label style={styles.label}>Status</label>
        <select style={styles.input} value={status} onChange={e => setStatus(e.target.value)}>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <label style={styles.label}>Notes</label>
        <textarea style={{...styles.input, height: '120px', resize: 'vertical'}} value={notes} onChange={e => setNotes(e.target.value)} />
        <div style={styles.modalActions}>
          <button style={{...styles.button, background: '#ef4444', width: 'auto', padding: '10px 20px'}} onClick={handleDelete}>
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