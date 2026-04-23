import { getStyles } from '../styles/styles'
import { useTheme } from '../styles/ThemeContext'
import { STAGE_KEYS } from './constants'

function Pipeline({ jobs, onJobClick, loading }) {
  const { theme } = useTheme()
  const styles = getStyles(theme)

  if (loading) return <p style={styles.loadingText}>Loading jobs...</p>

  return (
    <div style={styles.pipelineSection}>
      <h2 style={styles.sectionTitle}>My Pipeline</h2>
      <div style={styles.pipeline}>
        {STAGE_KEYS.map(stage => {
          const color = theme[stage.colorKey]
          return (
            <div key={stage.key} style={styles.stageColumn}>
              <div style={{...styles.stageHeader, borderTop: `3px solid ${color}`}}>
                <span style={styles.stageLabel}>{stage.label}</span>
                <span style={{...styles.stageCount, background: color}}>
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
          )
        })}
      </div>
    </div>
  )
}

export default Pipeline