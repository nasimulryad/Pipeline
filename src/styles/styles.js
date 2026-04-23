// OLD COLORS (purple scheme)
// primary: #6366f1
// success: #10b981
// danger: #ef4444
// border: #2d3148
// surface: #1a1d27
// background: #0f1117

// NEW COLORS (pastel blue/teal scheme)
// primary: #7dd3fc (sky blue)
// accent: #5eead4 (pastel teal)
// success: #86efac (soft green)
// danger: #fca5a5 (pastel red)
// border: #1e3a4a
// surface: #0f2030
// background: #080f17

import { theme } from './theme'

import { theme as defaultTheme } from './theme'

export const getStyles = (theme = defaultTheme) => ({
  app: { fontFamily: 'Inter, system-ui, sans-serif', minHeight: '100vh', background: theme.bgBase, color: theme.textPrimary },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: theme.bgBase, color: theme.textPrimary },
  authContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' },
  logo: { fontSize: '2.5rem', fontWeight: '700', color: theme.primary, margin: '0 0 8px 0' },
  tagline: { color: theme.textSecondary, margin: '0 0 40px 0', fontSize: '1rem' },
  authBox: { background: theme.bgSurface, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '400px' },
  authTitle: { margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: '600', color: theme.textPrimary },
  input: { width: '100%', padding: '12px', marginBottom: '12px', background: theme.bgBase, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.textPrimary, fontSize: '0.95rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', background: theme.primary, border: 'none', borderRadius: '8px', color: theme.bgBase, fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', marginTop: '4px' },
  message: { color: theme.danger, fontSize: '0.85rem', margin: '0 0 12px 0' },
  toggle: { textAlign: 'center', marginTop: '20px', color: theme.textSecondary, fontSize: '0.9rem' },
  link: { color: theme.primary, cursor: 'pointer', fontWeight: '600' },
  dashboard: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: theme.bgSurface, borderBottom: `1px solid ${theme.border}` },
  headerLogo: { fontSize: '1.5rem', fontWeight: '700', color: theme.primary, margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  userEmail: { color: theme.textSecondary, fontSize: '0.9rem' },
  logoutButton: { padding: '8px 16px', background: theme.danger, border: 'none', borderRadius: '6px', color: theme.bgBase, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  addButton: { padding: '8px 16px', background: theme.primary, border: 'none', borderRadius: '6px', color: theme.bgBase, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  profileButton: { padding: '8px 16px', background: theme.success, border: 'none', borderRadius: '6px', color: theme.bgBase, cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  body: { padding: '32px', flex: 1, background: theme.bgBase },
  pipelineSection: { marginBottom: '32px' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: theme.textPrimary },
  loadingText: { color: theme.textMuted, fontSize: '0.9rem' },
  pipeline: { display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' },
  stageColumn: { minWidth: '200px', flex: 1, background: theme.bgSurface, borderRadius: '10px', overflow: 'hidden' },
  stageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: theme.bgDeep },
  stageLabel: { fontSize: '0.85rem', fontWeight: '600', color: theme.textPrimary },
  stageCount: { fontSize: '0.75rem', fontWeight: '700', color: theme.bgBase, borderRadius: '999px', padding: '2px 8px' },
  stageCards: { padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px' },
  jobCard: { background: theme.bgBase, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '12px', cursor: 'pointer' },
  jobCardCompany: { fontSize: '0.85rem', fontWeight: '600', color: theme.textPrimary, marginBottom: '4px' },
  jobCardRole: { fontSize: '0.8rem', color: theme.textSecondary },
  emptyStage: { color: theme.textMuted, fontSize: '0.8rem', textAlign: 'center', padding: '16px 0' },
  widgets: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  widget: { background: theme.bgSurface, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '20px' },
  widgetTitle: { fontSize: '0.95rem', fontWeight: '600', marginBottom: '16px', color: theme.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' },
  widgetCount: { background: theme.border, borderRadius: '999px', padding: '2px 8px', fontSize: '0.75rem', color: theme.textPrimary },
  widgetRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' },
  widgetCompany: { fontSize: '0.85rem', fontWeight: '600', color: theme.textPrimary, minWidth: '100px' },
  widgetRole: { fontSize: '0.85rem', color: theme.textSecondary, flex: 1 },
  widgetBadge: { fontSize: '0.75rem', color: theme.bgBase, borderRadius: '999px', padding: '2px 8px', whiteSpace: 'nowrap' },
  emptyWidget: { color: theme.textMuted, fontSize: '0.85rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: theme.bgSurface, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  modalTitle: { fontSize: '1.25rem', fontWeight: '700', margin: 0, color: theme.textPrimary },
  modalSubtitle: { color: theme.textSecondary, margin: '4px 0 0 0', fontSize: '0.9rem' },
  modalClose: { cursor: 'pointer', color: theme.textSecondary, fontSize: '1.2rem', lineHeight: 1 },
  modalActions: { display: 'flex', justifyContent: 'space-between', marginTop: '8px' },
  jobLink: { display: 'inline-block', color: theme.primary, fontSize: '0.9rem', marginBottom: '16px' },
  detailText: { color: theme.textSecondary, fontSize: '0.85rem', marginBottom: '16px' },
  label: { display: 'block', fontSize: '0.85rem', color: theme.textSecondary, marginBottom: '6px' },
})