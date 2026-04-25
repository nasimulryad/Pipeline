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
  diff = execSync('git diff HEAD~1').toString().slice(0, 6000)
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

// Check if this commit was already reviewed
if (!fs.existsSync('qa-reports')) fs.mkdirSync('qa-reports')

const existingReports = fs.readdirSync('qa-reports')
const commitHash = commitInfo.split(' ')[0]
const alreadyReviewed = existingReports.some(r => r.includes(commitHash))

if (alreadyReviewed) {
  console.log(`QA already completed for commit ${commitHash}. Skipping.`)
  process.exit(0)
}

// Get file contents for changed JS files
let fileContents = ''
changedFiles.split('\n')
  .filter(f => f.endsWith('.js') && fs.existsSync(f))
  .forEach(f => {
    fileContents += `\n\n=== ${f} ===\n${fs.readFileSync(f, 'utf8').slice(0, 2000)}`
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

// Write prompt to temp file
const tempPrompt = 'qa-temp-prompt.txt'
fs.writeFileSync(tempPrompt, prompt)

console.log(`Reviewing commit: ${commitInfo}`)
console.log(`Changed files:\n${changedFiles}`)
console.log('Sending to Claude...')

// Use spawn to pipe the prompt file to claude via stdin
const claude = spawn('claude', ['--print'], {
  stdio: ['pipe', 'pipe', 'pipe']
})

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
  if (fs.existsSync(tempPrompt)) fs.unlinkSync(tempPrompt)

  if (result) {
    const reportContent = `# QA Report\n\n**Commit:** ${commitInfo}\n**Date:** ${now.toLocaleString()}\n\n**Files Changed:**\n${changedFiles.split('\n').map(f => `- ${f}`).join('\n')}\n\n## Review\n\n${result}`
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