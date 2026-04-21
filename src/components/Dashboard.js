import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { styles } from '../styles/styles'
import Pipeline from './Pipeline'
import Widgets from './Widgets'
import AddJobModal from './AddJobModal'
import JobDetailModal from './JobDetailModal'

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
        <Pipeline
          jobs={jobs}
          loading={loading}
          onJobClick={setSelectedJob}
        />
        <Widgets
          jobs={jobs}
          onJobClick={setSelectedJob}
        />
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

export default Dashboard