import { styles } from '../styles/styles'
import { STAGES } from './constants'

function Widgets({ jobs, onJobClick }) {
  const activeJobs = jobs.filter(j => j.status !== 'considering' && j.status !== 'rejected')
  const potentialJobs = jobs.filter(j => j.status === 'considering')

  return (
    <div style={styles.widgets}>
      <div style={styles.widget}>
        <h3 style={styles.widgetTitle}>
          Active Jobs <span style={styles.widgetCount}>{activeJobs.length}</span>
        </h3>
        {activeJobs.length === 0 && <p style={styles.emptyWidget}>No active applications yet.</p>}
        {activeJobs.map(job => (
          <div key={job.id} style={styles.widgetRow} onClick={() => onJobClick(job)}>
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
          <div key={job.id} style={styles.widgetRow} onClick={() => onJobClick(job)}>
            <span style={styles.widgetCompany}>{job.company}</span>
            <span style={styles.widgetRole}>{job.role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Widgets