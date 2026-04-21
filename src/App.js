import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const STAGES = [
  { key: 'considering', label: 'Considering', color: '#6366f1' },
  { key: 'applied', label: 'Applied', color: '#3b82f6' },
  { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { key: 'offer', label: 'Offer', color: '#10b981' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
]

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={styles.center}>Loading...</div>
  return (
    <div style={styles.app}>
      {session ? <Dashboard session={session} /> : <Auth />}
    </div>
  )
}

function Auth() {
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

function Dashboard({ session }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddJob, setShowAddJob] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setJobs(data)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const activeJobs = jobs.filter(j => j.status !== 'considering' && j.status !== 'rejected')
  const potentialJobs = jobs.filter(j => j.status === 'considering')

  return (
    <div style={styles.dashboard}>
      <div style={styles.header}>
        <h1 style={styles.headerLogo}>Pipeline</h1>
        <div style={styles.headerRight}>
          <span style={styles.userEmail}>{session.user.email}</span>
          <button style={styles.addButton} onClick={() => setShowAddJob(true)}>+ Add Job</button>
          <button style={styles.logoutButton} onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.pipelineSection}>
          <h2 style={styles.sectionTitle}>My Pipeline</h2>
          {loading ? (
            <p style={styles.loadingText}>Loading jobs...</p>
          ) : (
            <div style={styles.pipeline}>
              {STAGES.map(stage => (
                <div key={stage.key} style={styles.stageColumn}>
                  <div style={{...styles.stageHeader, borderTop: `3px solid ${stage.color}`}}>
                    <span style={styles.stageLabel}>{stage.label}</span>
                    <span style={{...styles.stageCount, background: stage.color}}>
                      {jobs.filter(j => j.status === stage.key).length}
                    </span>
                  </div>
                  <div style={styles.stageCards}>
                    {jobs.filter(j => j.status === stage.key).map(job => (
                      <div key={job.id} style={styles.jobCard} onClick={() => setSelectedJob(job)}>
                        <div style={styles.jobCardCompany}>{job.company}</div>
                        <div style={styles.jobCardRole}>{job.role}</div>
                      </div>
                    ))}
                    {jobs.filter(j => j.status === stage.key).length === 0 && (
                      <div style={styles.emptyStage}>No jobs</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.widgets}>
          <div style={styles.widget}>
            <h3 style={styles.widgetTitle}>
              Active Jobs <span style={styles.widgetCount}>{activeJobs.length}</span>
            </h3>
            {activeJobs.length === 0 && <p style={styles.emptyWidget}>No active applications yet.</p>}
            {activeJobs.map(job => (
              <div key={job.id} style={styles.widgetRow} onClick={() => setSelectedJob(job)}>
                <span style={styles.widgetCompany}>{job.company}</span>
                <span style={styles.widgetRole}>{job.role}</span>
                <span style={{...styles.widgetBadge, background: STAGES.find(s => s.key === job.status)?.color}}>
                  {STAGES.find(s => s.key === job.status)?.label}
                </span>
              </div>
            ))}
          </div>

          <div style={styles.widget}>
            <h3 style={styles.widgetTitle}>
              Potential Jobs <span style={styles.widgetCount}>{potentialJobs.length}</span>
            </h3>
            {potentialJobs.length === 0 && <p style={styles.emptyWidget}>No potential jobs saved yet.</p>}
            {potentialJobs.map(job => (
              <div key={job.id} style={styles.widgetRow} onClick={() => setSelectedJob(job)}>
                <span style={styles.widgetCompany}>{job.company}</span>
                <span style={styles.widgetRole}>{job.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddJob && (
        <AddJobModal
          onClose={() => setShowAddJob(false)}
          onSave={() => { fetchJobs(); setShowAddJob(false) }}
          userId={session.user.id}
        />
      )}

      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={() => { fetchJobs(); setSelectedJob(null) }}
        />
      )}
    </div>
  )
}

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

const styles = {
  app: { fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', background: '#0f1117', color: '#fff' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f1117', color: '#fff' },
  authContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' },
  logo: { fontSize: '2.5rem', fontWeight: '700', color: '#6366f1', margin: '0 0 8px 0' },
  tagline: { color: '#9ca3af', margin: '0 0 40px 0', fontSize: '1rem' },
  authBox: { background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '400px' },
  authTitle: { margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: '600' },
  input: { width: '100%', padding: '12px', marginBottom: '12px', background: '#0f1117', border: '1px solid #2d3148', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', background: '#6366f1', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', marginTop: '4px' },
  message: { color: '#f87171', fontSize: '0.85rem', margin: '0 0 12px 0' },
  toggle: { textAlign: 'center', marginTop: '20px', color: '#9ca3af', fontSize: '0.9rem' },
  link: { color: '#6366f1', cursor: 'pointer', fontWeight: '600' },
  dashboard: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#1a1d27', borderBottom: '1px solid #2d3148' },
  headerLogo: { fontSize: '1.5rem', fontWeight: '700', color: '#6366f1', margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  userEmail: { color: '#9ca3af', fontSize: '0.9rem' },
  logoutButton: { padding: '8px 16px', background: 'transparent', border: '1px solid #2d3148', borderRadius: '6px', color: '#9ca3af', cursor: 'pointer', fontSize: '0.85rem' },
  addButton: { padding: '8px 16px', background: '#6366f1', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  body: { padding: '32px', flex: 1 },
  pipelineSection: { marginBottom: '32px' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: '#e5e7eb' },
  loadingText: { color: '#4b5563', fontSize: '0.9rem' },
  pipeline: { display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' },
  stageColumn: { minWidth: '200px', flex: 1, background: '#1a1d27', borderRadius: '10px', overflow: 'hidden' },
  stageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1e2130' },
  stageLabel: { fontSize: '0.85rem', fontWeight: '600', color: '#e5e7eb' },
  stageCount: { fontSize: '0.75rem', fontWeight: '700', color: '#fff', borderRadius: '999px', padding: '2px 8px' },
  stageCards: { padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px' },
  jobCard: { background: '#0f1117', border: '1px solid #2d3148', borderRadius: '8px', padding: '12px', cursor: 'pointer' },
  jobCardCompany: { fontSize: '0.85rem', fontWeight: '600', color: '#e5e7eb', marginBottom: '4px' },
  jobCardRole: { fontSize: '0.8rem', color: '#9ca3af' },
  emptyStage: { color: '#4b5563', fontSize: '0.8rem', textAlign: 'center', padding: '16px 0' },
  widgets: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  widget: { background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '10px', padding: '20px' },
  widgetTitle: { fontSize: '0.95rem', fontWeight: '600', marginBottom: '16px', color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' },
  widgetCount: { background: '#2d3148', borderRadius: '999px', padding: '2px 8px', fontSize: '0.75rem' },
  widgetRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #2d3148', cursor: 'pointer' },
  widgetCompany: { fontSize: '0.85rem', fontWeight: '600', color: '#e5e7eb', minWidth: '100px' },
  widgetRole: { fontSize: '0.85rem', color: '#9ca3af', flex: 1 },
  widgetBadge: { fontSize: '0.75rem', color: '#fff', borderRadius: '999px', padding: '2px 8px', whiteSpace: 'nowrap' },
  emptyWidget: { color: '#4b5563', fontSize: '0.85rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#1a1d27', border: '1px solid #2d3148', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  modalTitle: { fontSize: '1.25rem', fontWeight: '700', margin: 0 },
  modalSubtitle: { color: '#9ca3af', margin: '4px 0 0 0', fontSize: '0.9rem' },
  modalClose: { cursor: 'pointer', color: '#9ca3af', fontSize: '1.2rem', lineHeight: 1 },
  modalActions: { display: 'flex', justifyContent: 'space-between', marginTop: '8px' },
  jobLink: { display: 'inline-block', color: '#6366f1', fontSize: '0.9rem', marginBottom: '16px' },
  detailText: { color: '#9ca3af', fontSize: '0.85rem', marginBottom: '16px' },
  label: { display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '6px' },
}

export default App