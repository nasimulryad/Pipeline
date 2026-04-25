# Pipeline App — QA Report

**Date:** 2026-04-24
**Reviewer:** Claude Code (Senior React Developer Review)
**Scope:** Full source review of `src/` directory, focused on the most recent commit batch (resume system, job modal, theme architecture, profile improvements — ~975 line change across 14 files)

---

## Summary

Pipeline is a clean, well-structured single-page React app backed by Supabase. The component architecture refactor is solid and the theme system is a good foundation. However, the review surfaced **5 bugs**, **3 performance issues**, **4 security concerns**, and several actionable improvement opportunities before this is production-ready. The most critical issues are a missing user-scoping filter on the jobs query (data isolation risk), an unvalidated URL rendered as an `href` (XSS vector), and multiple silent failure paths that leave users with no feedback when operations fail.

---

## Bugs Found

### BUG-1: `fetchJobs` has no user_id filter — relies entirely on RLS
**File:** `src/components/Dashboard.js:30-35`

```js
const { data, error } = await supabase
  .from('jobs')
  .select('*')
  .order('created_at', { ascending: false })
```

There is no `.eq('user_id', session.user.id)` filter. The query fetches all rows from the `jobs` table and trusts Supabase Row Level Security (RLS) alone for data isolation. If RLS is ever misconfigured, disabled, or bypassed during development, every user's jobs become visible to every other user. Defense-in-depth requires filtering in the query itself.

**Fix:** Add `.eq('user_id', session.user.id)` before `.order(...)`.

---

### BUG-2: `handleDeleteResume` updates local state even when deletion fails
**File:** `src/components/ProfileModal.js:104-109`

```js
const handleDeleteResume = async (resume) => {
  if (!window.confirm(`Delete "${resume.display_name}"?`)) return
  await supabase.storage.from('resumes').remove([resume.file_path])
  await supabase.from('resumes').delete().eq('id', resume.id)
  setResumes(resumes.filter(r => r.id !== resume.id))  // always runs
  onResumeChange()
}
```

Neither `await` result is checked. If either the storage delete or the database delete fails, the resume is silently removed from the UI while still existing in the backend. On next load, it reappears — a confusing experience. There is also no error message shown.

**Fix:** Destructure `{ error }` from both calls; only update local state and call `onResumeChange()` if both succeed; show an error message on failure.

---

### BUG-3: `handleUpdate` in `JobDetailModal` silently fails
**File:** `src/components/JobDetailModal.js:14-22`

```js
const handleUpdate = async () => {
  setLoading(true)
  const { error } = await supabase
    .from('jobs')
    .update({ status, notes, updated_at: new Date() })
    .eq('id', job.id)
  if (!error) onUpdate()  // closes modal on success
  setLoading(false)       // but on error: nothing
}
```

When the update fails, `loading` resets to false, the button re-enables, and the modal stays open — but no error message is shown. The user has no idea the save failed.

**Fix:** Add an error state and display a message (e.g. `"Error saving changes. Please try again."`) when `error` is truthy.

---

### BUG-4: Duplicate import in `styles.js`
**File:** `src/styles/styles.js:18-20`

```js
import { theme } from './theme'          // line 18 — never used
import { theme as defaultTheme } from './theme'  // line 20 — used as parameter default
```

Line 18 imports `theme` but it is immediately shadowed/replaced by the aliased import on line 20. The first import is dead code and will generate a lint warning.

**Fix:** Remove line 18.

---

### BUG-5: Hardcoded colors in `ProfileModal` break the theme system
**File:** `src/components/ProfileModal.js:132-140`

```js
<div style={{
  background: '#2d1f0e',
  border: '1px solid #92400e',
  ...
  color: '#fbbf24'
}}>
```

The incomplete-profile warning banner uses hardcoded hex values rather than theme tokens. These colors are specific to a dark amber palette and will look broken or invisible in other themes (e.g. the `mono` or `slate` themes use completely different palettes).

**Fix:** Replace with `theme.warning` (color), and derive a tinted background from `theme.bgDeep` or add a `warningBg`/`warningBorder` token to the theme object.

---

## Performance Issues

### PERF-1: `getStyles(theme)` creates a new object on every render
**Files:** All components (`App.js`, `Dashboard.js`, `Pipeline.js`, `Widgets.js`, `AddJobModal.js`, `ProfileModal.js`, `JobDetailModal.js`, `Auth.js`)

Every component calls `getStyles(theme)` at the top of its render function, allocating a large new plain object (70+ style rules) on every render cycle. Since `theme` is a stable reference from context, this work is identical across renders unless the theme actually changes.

**Fix:** Wrap each call in `useMemo`:
```js
const styles = useMemo(() => getStyles(theme), [theme])
```

---

### PERF-2: `Pipeline.js` filters the jobs array three times per stage
**File:** `src/components/Pipeline.js:22-32`

```js
// Three separate .filter() calls for the same predicate per stage:
const color = theme[stage.colorKey]           // fine
{jobs.filter(j => j.status === stage.key).length}   // 1st pass
{jobs.filter(j => j.status === stage.key).map(...)} // 2nd pass
{jobs.filter(j => j.status === stage.key).length === 0 && ...} // 3rd pass
```

With 5 stages and any number of jobs, this is 15 total filter passes per render. The third filter call is also redundant — its result is implied by whether the second produces an empty array.

**Fix:** Store the filtered result in a variable at the top of the `STAGE_KEYS.map()` callback:
```js
const stageJobs = jobs.filter(j => j.status === stage.key)
```
Then use `stageJobs` for count, mapping, and empty-state check.

---

### PERF-3: Resume list re-sorted on every render in `AddJobModal`
**File:** `src/components/AddJobModal.js:28-30`

```js
const resumes = [...(cachedResumes || [])].sort((a, b) =>
  a.display_name.localeCompare(b.display_name)
)
```

This spread+sort runs on every render of `AddJobModal`. Since `cachedResumes` is a prop that rarely changes, this is unnecessary work.

**Fix:** Wrap in `useMemo`:
```js
const resumes = useMemo(() =>
  [...(cachedResumes || [])].sort((a, b) => a.display_name.localeCompare(b.display_name)),
  [cachedResumes]
)
```

---

## Security Concerns

### SEC-1: Unvalidated user-supplied URL rendered as `href`
**File:** `src/components/JobDetailModal.js:52`

```js
{job.job_url && (
  <a href={job.job_url} target="_blank" rel="noreferrer">View Job Posting ↗</a>
)}
```

`job.job_url` is a raw string stored from user input and rendered directly as an `href`. A malicious value like `javascript:alert(document.cookie)` would execute JavaScript in the user's browser when clicked (`rel="noreferrer"` does not protect against `javascript:` URIs). While this is a self-XSS scenario (a user attacking themselves), it's still bad practice and could matter in shared/team contexts.

**Fix:** Validate the URL scheme before rendering the link:
```js
const isSafeUrl = (url) => /^https?:\/\//i.test(url)
// Only render the anchor if isSafeUrl(job.job_url)
```

---

### SEC-2: File upload uses original filename in storage path
**Files:** `src/components/AddJobModal.js:54`, `src/components/ProfileModal.js:68`

```js
const filePath = `${userId}/${Date.now()}_${newResumeFile.name}`
```

The original filename (controlled by the user) is embedded in the storage path. Filenames can contain special characters, spaces, unicode, or sequences like `../` that — depending on the storage backend and how paths are processed — can cause unexpected behavior. The `Date.now()` prefix reduces collision risk but doesn't eliminate it for concurrent uploads within the same millisecond.

**Fix:** Use a UUID for the storage filename and preserve the original name only in the database record:
```js
import { v4 as uuidv4 } from 'uuid'
const filePath = `${userId}/${uuidv4()}.pdf`
```

---

### SEC-3: No validation of Supabase environment variables
**File:** `src/supabase.js:3-5`

```js
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

If either env var is missing (e.g. `.env` file not present in a new dev setup), `createClient` is called with `undefined`. This produces a confusing runtime error deep in Supabase internals rather than a clear message at startup.

**Fix:** Add a guard at the top of the file:
```js
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}
```

---

### SEC-4: File type validation is client-side only
**Files:** `src/components/AddJobModal.js:350`, `src/components/ProfileModal.js:289`

```js
<input type="file" accept="application/pdf" ... />
```

The `accept` attribute is a browser hint only — it can be trivially bypassed by modifying the request. Any file type can be uploaded to Supabase storage if not validated server-side.

**Fix:** Add client-side MIME type validation before upload as a first line of defense:
```js
if (file.type !== 'application/pdf') {
  setResumeMessage('Only PDF files are accepted.')
  return
}
```
Also enforce file type restrictions in Supabase storage bucket policies.

---

## Improvement Recommendations

### REC-1: No user feedback when `fetchJobs` fails
**File:** `src/components/Dashboard.js:29-36`

If the Supabase query returns an error, `jobs` stays as `[]` and `loading` is set to `false`. The Pipeline renders "No jobs" in every stage with no indication that a network/auth error occurred. Add an error state and display a banner or retry prompt.

---

### REC-2: Theme selection is not persisted across sessions
**File:** `src/styles/ThemeContext.js:7`

The default theme is hardcoded to `'aurora'`. When a user switches themes (if the UI is ever exposed), it resets on every page reload. Store the selection in `localStorage`:
```js
const [currentThemeKey, setCurrentThemeKey] = useState(
  () => localStorage.getItem('pipeline-theme') || 'aurora'
)
// In setTheme and cycleTheme, also call localStorage.setItem('pipeline-theme', key)
```

---

### REC-3: `setCustomTheme` mutates the shared module-level `themes` object
**File:** `src/styles/ThemeContext.js:23-26`

```js
const setCustomTheme = (customTheme) => {
  themes['custom'] = { name: 'Custom', ...customTheme }  // mutates imported module object
  setCurrentThemeKey('custom')
}
```

Mutating the `themes` object from `theme.js` is a side effect that persists for the lifetime of the module but isn't tracked by React state. If multiple `ThemeProvider` instances existed (e.g. in tests), they would share and overwrite each other's custom theme. Use a separate piece of state to hold the custom theme object instead.

---

### REC-4: Auth form has no Enter key support
**File:** `src/components/Auth.js`

Pressing Enter after typing credentials does nothing — the user must click the button. This is a basic UX expectation for login forms.

**Fix:** Add `onKeyDown` to the password input:
```js
onKeyDown={e => e.key === 'Enter' && handleAuth()}
```

---

### REC-5: Modals have no Escape key handler
**Files:** `AddJobModal.js`, `ProfileModal.js`, `JobDetailModal.js`

None of the modals close when the user presses Escape. This is a standard accessibility expectation for modal dialogs.

**Fix:** Add a `useEffect` with a `keydown` listener in each modal:
```js
useEffect(() => {
  const handler = (e) => e.key === 'Escape' && onClose()
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}, [onClose])
```

---

### REC-6: `profileComplete` check is inconsistent between Dashboard and ProfileModal
**File:** `src/components/Dashboard.js:54` vs `src/components/ProfileModal.js:119`

Dashboard:
```js
setProfileComplete(!!(profileData.display_name && resumeData && resumeData.length > 0))
```
ProfileModal:
```js
const isProfileComplete = displayName && resumes.length > 0
```

Both compute "profile complete" differently and in separate places. If the definition ever changes (e.g. adding `current_title` as required), it must be updated in two places. Extract this into a shared utility:
```js
// utils/profile.js
export const isProfileComplete = (profile, resumes) =>
  !!(profile?.display_name && resumes?.length > 0)
```

---

### REC-7: `handleSaveProfile` closes the modal on success — potentially unexpected
**File:** `src/components/Dashboard.js:112` (`onProfileUpdate` prop)

```js
onProfileUpdate={() => { fetchProfile(); setShowProfile(false) }}
```

Saving profile info immediately closes the modal. If the user wants to then upload a resume in the same session, they must re-open the modal. Consider keeping the modal open after a profile save and only closing it on an explicit "Close" action.

---

### REC-8: `updated_at` set client-side in `handleUpdate`
**File:** `src/components/JobDetailModal.js:18`

```js
.update({ status, notes, updated_at: new Date() })
```

Setting `updated_at` from the client clock is unreliable — clocks can be wrong, and it bypasses any server-side `updated_at` trigger. Rely on a Supabase `DEFAULT now()` column with a trigger, or simply omit `updated_at` from the client update and let the database manage it.

---

*End of report. 5 bugs, 3 performance issues, 4 security concerns, 8 improvement recommendations.*
