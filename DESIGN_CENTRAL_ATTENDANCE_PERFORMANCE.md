# DESIGN.md — CENTRAL ATTENDANCE & EMPLOYEE PERFORMANCE

**Version:** 3.0  
**Status:** Ready for UI implementation  
**Primary use:** Employee mobile PWA + Management responsive web  
**First unit:** Bakso Ujo

---

## 1. Experience strategy

Sistem memiliki dua karakter UI:

1. **Employee Workspace** — sederhana, mobile-first, satu aksi utama per layar.
2. **Management Workspace** — information-dense, filterable, action-oriented.

Tujuan UX:

- Employee memahami apa yang harus dilakukan dalam kurang dari 5 detik.
- Check-in normal selesai maksimal 3 langkah setelah Today.
- Owner menemukan masalah terpenting tanpa membaca seluruh tabel.
- Manager beralih dari monitor → evidence → action tanpa kehilangan filter.
- Performance review terasa transparan, bukan mengejutkan employee.

---

## 2. UX principles

### Action before navigation

Today menunjukkan aksi yang relevan sekarang. Jangan meminta employee mencari menu Clock In.

### Context is always visible

Unit, location, shift, server time, dan status harus terlihat sebelum employee mengirim event.

### Exception-first management

Dashboard memprioritaskan hal yang butuh tindakan, bukan angka dekoratif.

### Progressive disclosure

Ringkasan dahulu, evidence kemudian. Detail lokasi, risk, audit, dan raw value berada di drawer/detail.

### Fair performance

Employee melihat indikator, bobot, target, evidence, dan komentar. Score tanpa penjelasan dilarang.

### Calm interface

Gunakan warna merah hanya untuk critical/blocked. Terlambat ringan memakai amber.

---

## 3. Responsive model

| Breakpoint | Layout |
|---|---|
| 0–599 px | Mobile single column, bottom nav |
| 600–899 px | Tablet, compact sidebar/drawer |
| 900–1279 px | Desktop sidebar + content |
| ≥1280 px | Wide dashboard, 12-column grid |

Rules:

- Employee routes selalu memakai mobile shell sampai tablet.
- Management mobile menggunakan cards; desktop menggunakan tables.
- Filter desktop berupa toolbar; mobile berupa filter sheet.
- Drawer desktop menjadi full-screen sheet pada mobile.
- Minimum touch target 44×44 px.

---

## 4. Design tokens

### Color

Portal neutral:

| Token | Value | Use |
|---|---|---|
| bg-canvas | #F6F7F9 | App background |
| bg-surface | #FFFFFF | Card/panel |
| text-primary | #18212F | Main text |
| text-secondary | #667085 | Supporting text |
| border | #E4E7EC | Dividers |
| primary | #E96A12 | Primary action/Bakso Ujo initial theme |
| primary-hover | #C95408 | Hover |
| success | #16865B | Present/ready |
| warning | #D8890B | Late/at risk |
| danger | #D53F3F | Absent/blocked |
| info | #3178C6 | Information |
| neutral-chip | #EEF1F4 | Neutral status |

Unit theming:

- Theme only changes accent, logo, and subtle background.
- Semantic success/warning/danger remain consistent.
- Contrast must meet WCAG AA.

### Typography

Font stack: Inter/system sans.

| Style | Size/line | Weight |
|---|---|---:|
| Display | 32/40 | 700 |
| H1 | 28/36 | 700 |
| H2 | 22/30 | 700 |
| H3 | 18/26 | 600 |
| Body | 15/22 | 400 |
| Small | 13/18 | 400 |
| Label | 12/16 | 600 |
| Metric | 28/32 | 700 |

Employee mobile memakai minimum body 15 px.

### Spacing

4, 8, 12, 16, 20, 24, 32, 40, 48.

### Radius

- Input/button: 10 px.
- Card: 14 px.
- Modal: 18 px.
- Pill: 999 px.

### Elevation

- Card default: border, no heavy shadow.
- Sticky bar: subtle top shadow.
- Modal/dropdown: medium shadow.

---

## 5. App shells

### Employee shell

Top app bar:

- Unit logo/name.
- Notification.
- Avatar.

Content:

- Page title optional.
- Single-column cards.
- Bottom safe-area padding.

Bottom navigation:

- Today.
- Schedule.
- Activity.
- Performance.
- Profile.

### Management shell

Left sidebar:

- Brand.
- Unit switcher.
- Main navigation.
- Settings.
- User menu.

Top bar:

- Breadcrumb.
- Search.
- Date context.
- Alerts.
- Help.

Main:

- Max width none for dashboards.
- 24 px desktop gutter.
- Sticky filter/action bar where useful.

---

## 6. Global components

### Status chip

Variants:

- Present/Ready: green.
- Late/At Risk: amber.
- Absent/Blocked: red.
- Leave/Info: blue.
- Draft/Off: gray.
- Pending Review: purple/neutral.

Chip always includes text, not color only.

### Metric card

Contains label, value, delta, comparison, icon, and optional click action. Maximum six cards in one row.

### Employee row/card

Avatar, name, role/area, shift, check-in/out, status, risk icon, overflow action.

### Timeline

Used for attendance event, approval history, feedback, coaching, audit.

### Evidence tile

Thumbnail/private placeholder, type, timestamp, owner, view action. Sensitive media does not auto-load.

### Empty state

Title, explanation, single primary action. Avoid illustrations on dense admin pages.

### Skeleton

Match final layout. Do not block entire page if only one widget loads.

### Toast

Success 4 seconds; error persists until dismissed/actioned.

---

## 7. Login screen

Route: /attendance/login

### Desktop

Two columns:

- Left 45%: Central Attendance value proposition, security badges, supported units.
- Right 55%: login card centered.

### Mobile

Single column:

- Compact logo.
- Title: Masuk ke Attendance.
- Subtitle: Satu akses untuk seluruh unit bisnis.
- Identity input.
- Password + show/hide.
- Remember device optional.
- Forgot password.
- Primary Masuk.
- Help.

### States

- Default.
- Submitting.
- Invalid credentials.
- No Attendance membership.
- Suspended.
- Password reset sent.
- Too many attempts.
- Offline.

Do not show unit selector before login.

---

## 8. Context picker

Shown only when required.

Card fields:

- Unit.
- Location.
- Shift.
- Work area.
- Time.
- Recommended badge if inferred.

Primary: Lanjutkan.  
Secondary: Keluar.

Do not show inaccessible contexts.

---

## 9. Employee Today

Route: /attendance/today

### Information hierarchy

1. Greeting/date.
2. Active context chip.
3. Shift card.
4. Main attendance action.
5. Shift progress.
6. Quick actions.
7. Tasks/readiness.
8. Recent update.

### Shift card

- Shift name.
- Time.
- Location.
- Work area.
- Status.
- Schedule change note.

### Main attendance card states

Before shift:

- Countdown.
- Earliest check-in.
- Disabled button.

Can check in:

- Large Absen Masuk button.
- Camera/location readiness.

Active:

- Check-in time.
- Duration.
- Break action.
- Check-out availability.

Can check out:

- Large Absen Pulang.
- Incomplete critical task warning.

Complete:

- Check-in/out summary.
- Total work.
- Status.
- View detail.

Exception:

- Missing event.
- Clear corrective action.

### Mobile layout

Primary button full width, height 56 px, thumb reachable. Avoid side-by-side primary actions.

---

## 10. Capture flow

Route: /attendance/capture

### Step 1 — Permission preflight

Rows:

- Camera: Ready/Action needed.
- Location: Ready/Action needed.
- Network: Online/Offline.
- Schedule: Valid/Issue.

Primary enabled only when requirements pass.

### Step 2 — Camera

- Full-width portrait preview.
- Oval face guide.
- Lighting guidance.
- Retake after capture.
- No gallery button.

### Step 3 — Location locking

- Map not required while waiting.
- Show accuracy progress.
- Text: Mencari lokasi yang lebih akurat.
- Retry and troubleshooting after timeout.

### Step 4 — Review

- Photo thumbnail.
- Unit/location.
- Distance.
- Shift/event type.
- Server time.
- Risk warning if any.
- Confirm.

### Receipt

Route: /attendance/result

- Success icon.
- Event: Masuk/Pulang.
- Server time.
- Status.
- Location.
- Receipt ID short.
- Done.

Error does not discard photo unless upload invalid/expired.

---

## 11. Employee Schedule

Route: /attendance/schedule

Views:

- Agenda default on mobile.
- Month with date dots.
- Week on tablet.

Schedule card:

- Date.
- Unit/location.
- Shift.
- Area.
- Publish/change badge.
- Swap/request action.

Change is highlighted until acknowledged.

---

## 12. Employee Activity

Route: /attendance/activity

Tabs:

- Attendance.
- Requests.
- Overtime.
- Tasks.

Attendance list grouped by month. Summary card: present, on-time, late, leave, total hours.

Detail:

- Schedule.
- Event timeline.
- Own photo.
- Location summary.
- Exception.
- Correction timeline.
- Ajukan Koreksi.

---

## 13. Employee Performance

Route: /attendance/performance

### Overview

- Current cycle.
- Overall score + label + confidence.
- Four dimensions.
- Goal progress.
- Recent feedback.
- Recognition.
- Next check-in.

Do not show score alone; display explanation and data freshness.

### Tabs

- Overview.
- Goals.
- Feedback.
- Reviews.
- Development.

### Goal card

- Goal.
- Weight.
- Progress.
- Due date.
- Status.
- Last update.
- Add progress.

### Feedback card

- Type.
- From.
- Date/shift.
- Specific observation.
- Related KPI/value.
- Employee response if enabled.

### Review

- Cycle status.
- Self-review action.
- Manager status.
- Final score.
- Strengths.
- Improvement.
- Action plan.
- Acknowledgement.

---

## 14. Owner organization dashboard

Route: /attendance/admin/dashboard

### Header

- Page title.
- Date range.
- Unit/location filter.
- Export.
- Last refresh.

### Grid

Row 1: Scheduled, Present, Late, Absent, Leave, Exceptions.

Row 2:

- Unit readiness matrix (8 columns).
- Attendance trend (4 columns).

Row 3:

- Unit comparison table (8 columns).
- Action queue (4 columns).

Row 4:

- Performance distribution.
- Review completion.
- Coaching due.
- Recognition pulse.

### Action queue priority

1. No-show critical role.
2. Not Ready location.
3. Outside geofence/high risk.
4. Missing check-out.
5. Approval overdue.
6. Review/coaching overdue.

Each item has owner, age, and primary action.

---

## 15. Unit dashboard Bakso Ujo

Route: /attendance/admin/unit/:unitId

Bakso Ujo dashboard top:

- Produksi ready.
- Prep ready.
- Service ready.
- Kasir available.
- Closing coverage.

Then:

- Live attendance by area.
- Timeline to opening.
- Late/no-show.
- Critical checklist.
- Shift logbook.
- Performance pulse.

Readiness card displays reason, not only color:

At Risk — Kasir belum hadir; shift mulai 10.00.

---

## 16. Live Monitor

Route: /attendance/admin/live

### Desktop table

Columns:

- Employee.
- Unit/location.
- Area.
- Shift.
- Check-in.
- Check-out.
- Status.
- Distance/risk.
- Action.

Sticky header and first employee column.

### Mobile

Employee cards with filter chips:

- All.
- Not Yet.
- Late.
- Present.
- Leave.
- Exception.

### Detail drawer

- Profile.
- Schedule.
- Event timeline.
- Evidence.
- Risk.
- Request/correction.
- Audit.

Actions require permission and reason.

---

## 17. Scheduler

Route: /attendance/admin/schedules

### Desktop

Left:

- Employee/work area rows.

Top:

- Date columns.

Cells:

- Shift pill.
- Location.
- Conflict icon.
- Publish state.

Right inspector:

- Shift details.
- Assignment.
- Note.
- Validation.

### Actions

- Drag/drop.
- Multi-select.
- Apply template.
- Copy week.
- Fill pattern.
- Open shift.
- Publish.

### Publish review modal

- Added/changed/removed.
- Conflicts.
- Employees notified.
- Reason if republishing.

Mobile management uses agenda editor, not grid drag/drop.

---

## 18. Shift Templates

Route: /attendance/admin/shifts

List shows name, time, unit/location, cross-midnight, grace, break, employees assigned, active.

Editor sections:

1. Identity.
2. Work time.
3. Attendance windows.
4. Break.
5. Overtime.
6. Location/area.
7. Staffing requirement.
8. Preview.

Sticky Save Draft / Activate.

---

## 19. Requests and approvals

Route: /attendance/admin/requests

Queue tabs:

- Waiting.
- Needs info.
- Approved.
- Rejected.

Table/card:

- Employee.
- Type.
- Date.
- Impacted shift.
- Submitted.
- SLA.
- Approver.

Detail:

- Request.
- Attachment.
- Attendance/schedule context.
- Impact preview.
- Approval timeline.
- Approve, Reject, Needs Info.

Reject and correction require reason.

---

## 20. Shift Readiness

Route: /attendance/admin/readiness

Matrix:

- Rows: location/area.
- Columns: Current/next shift.
- Cell: Ready/At Risk/Not Ready.

Detail:

- Required vs present headcount.
- Critical role.
- Checklist.
- Open issues.
- Assigned manager.
- Recommended action.

Owner can drill down from organization to employee.

---

## 21. Checklists

Route: /attendance/admin/checklists

Employee view:

- Tasks in due order.
- Critical pinned.
- Complete with optional/required evidence.

Manager view:

- Completion by shift/area.
- Overdue.
- Verification required.
- Recurring failures.

Do not use excessive confirmation for noncritical tasks.

---

## 22. Manager Logbook

Route: /attendance/admin/logbook

Feed grouped by shift/date.

Entry card:

- Category.
- Location/shift.
- Author.
- Timestamp.
- Note.
- Linked employee optional.
- Evidence.
- Follow-up owner/date.
- Visibility.

Composer:

- Quick category.
- Structured prompt.
- Attach evidence.
- Create task.
- Private management toggle.

Search/filter by category, employee, issue, unresolved.

---

## 23. Performance Overview

Route: /attendance/admin/performance

Top:

- Active cycle.
- Review completion.
- Goal progress.
- Coaching overdue.
- Low-confidence scorecards.

Charts:

- Distribution by role/unit.
- Trend.
- Four dimension comparison.
- Feedback coverage.

Action queue:

- Missing self-review.
- Manager review overdue.
- Rating without evidence.
- Calibration needed.
- Development action overdue.

Never expose team ranking to general employees.

---

## 24. KPI Library and Scorecard Builder

Route: /attendance/admin/performance/kpis

KPI library filters:

- Unit.
- Role.
- Area.
- Type.
- Data source.
- Active version.

Builder:

1. Choose role.
2. Add indicator.
3. Configure target/rubric.
4. Set weight.
5. Set evidence source.
6. Preview score.
7. Validate total 100%.
8. Save draft/publish version.

Show warning when data source unavailable.

---

## 25. Employee Performance Profile

Route: /attendance/admin/performance/employees/:employeeId

Header:

- Employee identity.
- Assignment.
- Current cycle.
- Score/label/confidence.
- Manager.

Tabs:

- Overview.
- Attendance.
- KPI/Goals.
- Feedback/Recognition.
- Reviews.
- Coaching.
- Development.
- Sensitive Notes, permission only.

Overview widgets:

- Trend.
- Dimension scores.
- Evidence completeness.
- Strength.
- Improvement.
- Next conversation.

---

## 26. Review Cycle

Route: /attendance/admin/performance/reviews/:cycleId

Cycle setup:

- Name/period.
- Population.
- Scorecard version.
- Reviewers.
- Weight.
- Timeline.
- Calibration policy.
- Visibility.

Employee self-review:

- Progress per goal.
- Evidence.
- Strengths.
- Challenges.
- Support needed.

Manager review:

- Self-review side-by-side.
- Auto-data.
- Evidence timeline.
- Rubric selector.
- Narrative.
- Action plan.

Calibration:

- Distribution.
- Outlier.
- Evidence completeness.
- Previous adjustment.
- Required reason.

Published review:

- Summary.
- Detail.
- Employee comment.
- Acknowledge.

---

## 27. Coaching and Development

Route: /attendance/admin/performance/coaching

Coaching detail:

- Topic.
- Trigger/evidence.
- Employee perspective.
- Agreed action.
- Support.
- Due date.
- Follow-up.
- Outcome.

Development plan:

- Skill/competency.
- Current level.
- Target.
- Learning action.
- Mentor.
- Due.
- Evidence.

PIP is separate, highly permissioned, and never auto-created.

---

## 28. People and Access

Route: /attendance/admin/people

Employee list:

- Status.
- Primary assignment.
- Additional assignment.
- Role.
- Manager.
- Shift default.
- Last attendance.
- Access status.

Employee editor:

1. Identity.
2. Employment.
3. Assignment.
4. Access/role.
5. Attendance policy.
6. Performance template.
7. Device/session.

Deactivate preserves history and requires effective date.

---

## 29. Reports

Route: /attendance/admin/reports

Report library:

- Daily attendance.
- Monthly recap.
- Late/absence.
- Overtime.
- Leave.
- Schedule adherence.
- Readiness.
- Checklist.
- Performance.
- Review completion.

Flow:

Select report → configure scope/period → preview → export.

Export shows scope, generated by, time, expiry, and row count.

---

## 30. Settings

Sections:

- Organization.
- Units.
- Locations/geofence.
- Work areas.
- Attendance policy.
- Requests/approval.
- Retention/privacy.
- Performance governance.
- Notifications.
- Integrations.
- Audit.

Policy editor shows inheritance:

Organization default → Unit override → Location override.

Show effective policy preview before save.

---

## 31. Interaction states

Every screen must define:

- Loading.
- Empty.
- Partial data.
- Offline.
- Permission denied.
- Validation error.
- Server error.
- Stale data.
- Success.
- Unsaved change.
- Concurrent update.

Optimistic update only for low-risk actions. Attendance, approval, schedule publish, and review publish require server confirmation.

---

## 32. Form behavior

- Labels always visible.
- Inline validation after blur/submit.
- Preserve values after recoverable error.
- Destructive/high-impact actions show impact.
- Reason required for reject, void, republish, calibration adjustment.
- Mobile numeric/time input uses appropriate keyboard.
- Long forms divided into sections with progress.

---

## 33. Microcopy

Use:

- Absen Masuk.
- Absen Pulang.
- Lokasi belum cukup akurat.
- Anda berada di luar area absen.
- Absen sudah tercatat pada 07.58.
- Jadwal diperbarui oleh manager.
- Perlu ditinjau.
- Beri alasan perubahan.
- Bukti belum cukup untuk nilai ini.

Avoid:

- Submit Attendance.
- Geolocation failed.
- Invalid state transition.
- User unauthorized.

---

## 34. Accessibility

- WCAG AA contrast.
- Visible focus.
- Keyboard access management.
- Screen reader label.
- Status has text/icon.
- Error summary.
- Touch target 44 px.
- Reduced motion.
- Camera guide has text alternative.
- Charts have table alternative.

---

## 35. Performance and loading

- Route-level code splitting.
- Lazy load private images.
- Server pagination.
- Virtualize long lists.
- Cache reference data.
- Realtime only on Live Monitor/action queue.
- Use skeleton for first load.
- Preserve filter in URL/session.

---

## 36. Analytics events

- login_success/failure.
- context_resolved/switched.
- attendance_started/completed/failed.
- permission_denied.
- low_accuracy_retry.
- correction_submitted.
- schedule_published.
- readiness_opened/actioned.
- logbook_created/resolved.
- feedback_created/viewed.
- review_started/submitted/published/acknowledged.

Do not place precise GPS or sensitive review text in analytics payload.

---

## 37. UI acceptance checklist

- Employee check-in is reachable immediately after login.
- Unit selector absent when unnecessary.
- Server time and context visible before confirmation.
- Primary action reachable with one hand.
- Camera has no gallery action.
- Error provides recovery.
- Owner sees action queue above decorative analytics.
- Manager can go monitor → employee detail → correction without losing filters.
- KPI weight validator prevents publish unless 100%.
- Score always accompanied by label, confidence, and explanation.
- Rating 1/5 requires evidence.
- Employee can comment/acknowledge review.
- Mobile, tablet, desktop states verified.
- Empty/loading/error/offline states implemented.

---

## 38. Prototype scenarios

Prototype before coding:

1. Dede check-in 03.00 at Bakso Ujo.
2. Uus has two possible shift templates; only published schedule becomes active.
3. Employee outside geofence requests review.
4. Citra checks out after closing with unfinished warning.
5. Manager sees Kasir not ready and assigns replacement.
6. Manager records positive service feedback.
7. Employee views KPI and monthly check-in.
8. Manager completes review with evidence.
9. Owner calibrates outlier with reason.
10. Multi-unit employee switches context without login.

---

## 39. Recommended build order

1. Tokens and app shells.
2. Login/context.
3. Today/capture/receipt.
4. Schedule/activity.
5. Management dashboard/live.
6. Scheduler/request.
7. Readiness/checklist/logbook.
8. Employee performance.
9. KPI builder/profile.
10. Review/coaching.
11. Reports/settings/audit.
