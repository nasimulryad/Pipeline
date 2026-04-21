import { useState } from 'react'
import { supabase } from '../supabase'
import { styles } from '../styles/styles'
import { STAGES } from './constants'

function AddJobModal({ onClose, onSave, userId }) {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('considering')
  const [jobUrl, setJobUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [recruiterName, setRecruiterName] = useState('')
  const [recruiterEmail, setRecruiterEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!company || !role) return
    setLoading(true)
    const { error } = await supabase.from('jobs').insert({
      user_id: userId,
      company,
      role,
      status,
      job_url: jobUrl,
      notes,
      recruiter_name: recruiterName,
      recruiter_email: recruiterEmail,
    })
    if (!error) onSave()
    setLoading(false)
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Add Job</h2>
          <span style={styles.modalClose} onClick={onClose}>✕</span>
        </div>
        <input style={styles.input} placeholder="Company *" value={company} onChange={e => setCompany(e.target.value)} />
        <input style={styles.input} placeholder="Role *" value={role} onChange={e => setRole(e.target.value)} />
        <select style={styles.input} value={status} onChange={e => setStatus(e.target.value)}>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <input style={styles.input} placeholder="Job URL" value={jobUrl} onChange={e => setJobUrl(e.target.value)} />
        <input style={styles.input} placeholder="Recruiter Name" value={recruiterName} onChange={e => setRecruiterName(e.target.value)} />
        <input style={styles.input} placeholder="Recruiter Email" value={recruiterEmail} onChange={e => setRecruiterEmail(e.target.value)} />
        <textarea style={{...styles.input, height: '100px', resize: 'vertical'}} placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
        <button style={styles.button} onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Job'}
        </button>
      </div>
    </div>
  )
}

export default AddJobModal