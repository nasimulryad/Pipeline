const { execSync, spawn } = require('child_process')
const fs = require('fs')

// Get changed files
let changedFiles = ''
try {
  changedFiles = execSync('git diff HEAD~1 --name-only').toString().trim()
} catch (e) {
  console.log('Could not get changed files:', e.message)
  process.exit(1)
}

if (!changedFiles) {
  console.log('No changed files found.')
  process.exit(0)
}

// Get the diff content
let diff = ''
try {
  const rawDiff = execSync('git diff HEAD~1').toString()
  if (rawDiff.length > 6000) console.warn('Warning: diff truncated, some changes omitted.')
  diff = rawDiff.slice(0, 6000)
} catch (e) {
  diff = 'Could not get diff.'
}

// Get last commit info
let commitInfo = ''
try {
  commitInfo = execSync('git log -1 --oneline').toString().trim()
} catch (e) {
  commitInfo = 'Unknown commit'
}

// Sanitize commit hash
const commitHash = commitInfo.split(' ')[0].replace(/[^a-f0-9]/g, '')

// Check if this commit was already reviewed
if (!fs.existsSync('qa-reports')) fs.mkdirSync('qa-reports')

const existingReports = fs.readdirSync('qa-reports')
const alreadyReviewed = existingReports.some(r => r.startsWith(`report-${commitHash}-`))

if (alreadyReviewed) {
  console.log(`QA already completed for commit ${commitHash}. Skipping.`)
  process.exit(0)
}

// Get file contents for changed JS/JSX files — exclude qa.js itself
let fileContents = ''
changedFiles.split('\n')
  .filter(f => /\.(js|jsx|ts|tsx)$/.test(f) && fs.existsSync(f) && f !== 'qa.js')
  .forEach(f => {
    const content = fs.readFileSync(f, 'utf8')
    if (content.length > 2000) console.warn(`Warning: ${f} truncated to 2000 chars.`)
    fileContents += `\n\n=== ${f} ===\n${content.slice(0, 2000)}`
  })

// Build timestamp for report filename
const now = new Date()
const timestamp = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`
const reportFile = `qa-reports/report-${commitHash}-${timestamp}.md`

// Build the prompt
const prompt = `You are a senior React developer reviewing the Pipeline job search app.

Commit: ${commitInfo}

Changed files:
${changedFiles}

Git diff:
${diff}

File contents:
${fileContents}

Please review the above changes and provide a detailed QA report with these sections:
- Summary
- Bugs Found (with line numbers)
- Performance Issues
- Security Concerns
- Improvement Recommendations

Be specific and actionable. Focus on meaningful issues only.

Write the full report as plain markdown text in your response.`

console.log(`Reviewing commit: ${commitInfo}`)
console.log(`Changed files:\n${changedFiles}`)
console.log('Sending to Claude...')

// Use spawn to pipe prompt to claude via stdin
const claude = spawn('claude', ['--print'], {
  stdio: ['pipe', 'pipe', 'pipe']
})

// Kill claude if it hangs for more than 120 seconds
const timeout = setTimeout(() => {
  console.log('\n⏱ Timeout — Claude took too long. Killing process.')
  claude.kill()
}, 120000)

let result = ''
let errorOutput = ''

claude.stdout.on('data', data => {
  result += data.toString()
  process.stdout.write('.')
})

claude.stderr.on('data', data => {
  errorOutput += data.toString()
})

claude.on('close', code => {
  clearTimeout(timeout)

  if (result) {
    const reportContent = `# QA Report\n\n**Commit:** ${commitInfo}\n**Date:** ${now.toLocaleString()}\n\n**Files Changed:**\n${changedFiles.split('\n').map(f => `- ${f}`).join('\n')}\n\n## Review\n\n${result}\n`
    fs.writeFileSync(reportFile, reportContent)
    console.log(`\n✅ QA report saved to ${reportFile}`)
  } else {
    console.log('\n❌ No response from Claude.')
    if (errorOutput) console.log('Error:', errorOutput)
  }
})

// Pipe the prompt to claude's stdin
claude.stdin.write(prompt)
claude.stdin.end()