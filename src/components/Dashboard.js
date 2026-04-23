import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getStyles } from '../styles/styles'
import { useTheme } from '../styles/ThemeContext'
import Pipeline from './Pipeline'
import Widgets from './Widgets'
import AddJobModal from './AddJobModal'
import JobDetailModal from './JobDetailModal'
import ProfileModal from './ProfileModal'

function Dashboard({ session }) {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddJob, setShowAddJob] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [profileComplete, setProfileComplete] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [cachedProfile, setCachedProfile] = useState(null)
  const [cachedResumes, setCachedResumes] = useState([])

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
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    const { data: resumeData } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (profileData) {
      setCachedProfile(profileData)
      setDisplayName(profileData.display_name || '')
      setProfileComplete(!!(profileData.display_name && resumeData && resumeData.length > 0))
    } else {
      setProfileComplete(false)
    }

    if (resumeData) setCachedResumes(resumeData)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={styles.dashboard}>
      <div style={styles.header}>
        <h1 style={styles.headerLogo}>Pipeline</h1>
        <div style={styles.headerRight}>

          <div style={{position: 'relative', cursor: 'pointer'}} onClick={() => setShowProfile(true)}>
            <button style={styles.profileButton}>
              {displayName || session.user.email}
            </button>
            {!profileComplete && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '10px',
                height: '10px',
                background: theme.danger,
                borderRadius: '50%',
                border: `2px solid ${theme.bgBase}`
              }} />
            )}
          </div>

          <button style={styles.addButton} onClick={() => setShowAddJob(true)}>
            + Add Job
          </button>

          <button style={styles.logoutButton} onClick={handleLogout}>
            Log Out
          </button>

        </div>
      </div>

      <div style={styles.body}>
        <Pipeline jobs={jobs} loading={loading} onJobClick={setSelectedJob} />
        <Widgets jobs={jobs} onJobClick={setSelectedJob} />
      </div>

      {showProfile && (
        <ProfileModal
          session={session}
          cachedProfile={cachedProfile}
          cachedResumes={cachedResumes}
          onClose={() => setShowProfile(false)}
          onProfileUpdate={() => { fetchProfile(); setShowProfile(false) }}
          onResumeChange={fetchProfile}
        />
      )}

      {showAddJob && (
     <AddJobModal
        onClose={() => setShowAddJob(false)}
        onSave={() => { fetchJobs(); setShowAddJob(false) }}
        userId={session.user.id}
        cachedResumes={cachedResumes}
        onResumeChange={fetchProfile}
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