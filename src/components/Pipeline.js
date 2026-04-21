import { styles } from '../styles/styles'
import { STAGES } from './constants'

function Pipeline({ jobs, onJobClick, loading }) {
  if (loading) return <p style={styles.loadingText}>Loading jobs...</p>

  return (
    <div style={styles.pipelineSection}>
      <h2 style={styles.sectionTitle}>My Pipeline</h2>
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
                <div key={job.id} style={styles.jobCard} onClick={() => onJobClick(job)}>
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
    </div>
  )
}

export default Pipeline