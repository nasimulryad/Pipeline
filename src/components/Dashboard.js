import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { styles } from '../styles/styles'
import Pipeline from './Pipeline'
import Widgets from './Widgets'
import AddJobModal from './AddJobModal'
import JobDetailModal from './JobDetailModal'
import ProfileModal from './ProfileModal'

function Dashboard({ session }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddJob, setShowAddJob] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [profileComplete, setProfileComplete] = useState(true)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    fetchJobs()
    fetchProfile()
  }, [])

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setJobs(data)
    setLoading(false)
  }

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, resume_path')
      .eq('id', session.user.id)
      .single()

    if (data) {
      setDisplayName(data.display_name || '')
      // Red dot shows if either display name OR resume is missing
      setProfileComplete(!!(data.display_name && data.resume_path))
    } else {
      setProfileComplete(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={styles.dashboard}>
      <div style={styles.header}>
        <h1 style={styles.headerLogo}>Pipeline</h1>
        <div style={styles.headerRight}>

          <div style={dashboardStyles.profileButtonWrapper} onClick={() => setShowProfile(true)}>
            <button style={dashboardStyles.profileButton}>
              {/* Show display name if set, otherwise fall back to email */}
              {displayName || session.user.email}
            </button>
            {!profileComplete && <span style={dashboardStyles.notificationDot} />}
          </div>

          <button style={styles.addButton} onClick={() => setShowAddJob(true)}>+ Add Job</button>
          <button style={styles.logoutButton} onClick={handleLogout}>Log out</button>
        </div>
      </div>

      <div style={styles.body}>
        <Pipeline jobs={jobs} loading={loading} onJobClick={setSelectedJob} />
        <Widgets jobs={jobs} onJobClick={setSelectedJob} />
      </div>

      {showProfile && (
        <ProfileModal
          session={session}
          onClose={() => setShowProfile(false)}
          onProfileUpdate={() => { fetchProfile(); setShowProfile(false) }}
        />
      )}

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

const dashboardStyles = {
  profileButtonWrapper: {
    position: 'relative',
    cursor: 'pointer',
  },
  profileButton: {
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid #2d3148',
    borderRadius: '6px',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  notificationDot: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '10px',
    height: '10px',
    background: '#ef4444',
    borderRadius: '50%',
    border: '2px solid #0f1117',
  }
}

export default Dashboard