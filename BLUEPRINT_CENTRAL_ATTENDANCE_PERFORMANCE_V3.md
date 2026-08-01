# BLUEPRINT CENTRAL ATTENDANCE & EMPLOYEE PERFORMANCE

Versi 3.0 — Implementation Grade  
Tanggal: 1 Agustus 2026  
Unit rollout pertama: Bakso Ujo  
Fondasi: multi-unit, multi-location, single login

---

## 1. Keputusan produk

Central Attendance dikembangkan sebagai sistem terpadu untuk kehadiran, jadwal, izin, lembur, kesiapan shift, catatan operasional, KPI, feedback, coaching, dan evaluasi karyawan.

Keputusan wajib:

- Semua unit menggunakan satu halaman login: /attendance/login.
- Satu orang memiliki satu akun dan satu employee profile.
- Hubungan employee ke unit/lokasi disimpan sebagai assignment.
- Owner melihat semua unit; admin, manager, dan supervisor dibatasi oleh scope.
- Bakso Ujo menjadi unit pertama, bukan nama keseluruhan sistem.
- Employee mobile harus menyelesaikan absen normal maksimal tiga langkah.
- Kamera langsung, lokasi, akurasi GPS, geofence, waktu server, dan device menjadi bukti.
- Event asli immutable; koreksi membuat adjustment yang diaudit.
- Attendance hanya satu dimensi performance, bukan keseluruhan nilai.
- Tidak ada public leaderboard atau hukuman otomatis.

---

## 2. Analisis pola produk modern

Produk attendance modern menggabungkan mobile clock-in/out, GPS/geofence, selfie, monitoring real-time, shift, izin, lembur, timesheet, koreksi, laporan, dan payroll-ready. Produk performance modern menambahkan KPI/goal, feedback, review, calibration, serta development plan. Untuk restoran, manager logbook dan shift feedback penting karena kejadian performance perlu dicatat saat konteks masih segar.

Adaptasi sistem:

| Pola | Implementasi |
|---|---|
| GPS + selfie | Capture langsung, geofence, accuracy, server time, risk flags |
| Attendance dashboard | Organization → unit → location → shift → employee |
| Shift scheduling | Template, rotasi, dini hari, split shift, lintas malam |
| Timesheet | Aktivitas/tugas penting, bukan surveillance |
| Performance log | Catatan positif/perbaikan berbasis evidence |
| KPI | Role-based dan dapat diukur |
| Review | Check-in bulanan + formal cycle |
| Restaurant logbook | Handover, readiness, issue, follow-up |

Referensi:

- Absensi Pro Mobile: https://play.google.com/store/apps/details?id=id.co.solusinegeri.absensipro
- Mekari Talenta Attendance: https://www.talenta.co/fitur/attendance-management/aplikasi-absensi-kehadiran-karyawan-online/
- Mekari Talenta Performance: https://www.talenta.co/en/features/performance-management-tools/
- Hadirr: https://www.hadirr.com/en/features/attendance
- 7shifts Performance: https://www.7shifts.com/restaurant-employee-performance/
- 7shifts Manager Logbook: https://www.7shifts.com/manager-log-book/

---

## 3. Arsitektur organisasi

Hierarchy:

Organization → Business Unit → Location → Work Area → Assignment → Employee

| Level | Bakso Ujo | GG Supply | GUDSKUY |
|---|---|---|---|
| Unit | Bakso Ujo | GG Supply | GUDSKUY |
| Location | Outlet | Workshop | Office/Workshop |
| Area | Produksi, Prep, Service, Kasir, Closing | Cutting, Sewing, QC, Packing | Product, Creative, Marketplace |

Employee dapat memiliki beberapa assignment, tetapi satu primary assignment. Transfer unit tidak membuat akun baru.

---

## 4. Single login dan context resolution

Login menerima username/email/nomor pegawai dan password. Setelah autentikasi, server membaca membership, role, assignment, accessible scope, schedule aktif, dan last context.

| Kondisi | Landing |
|---|---|
| Employee satu unit | Today |
| Employee multi-unit, satu jadwal aktif | Today, unit otomatis |
| Employee multi-unit, jadwal konflik | Context Picker |
| Admin satu unit | Unit Dashboard |
| Admin beberapa unit | Last context / Unit Picker |
| Owner | Organization Dashboard |
| Tidak punya membership | Access Denied |

Unit switcher tersedia setelah login dan tidak meminta password ulang.

---

## 5. Role dan permission

| Capability | Owner | Unit Admin | Location Manager | Supervisor | Employee |
|---|---:|---:|---:|---:|---:|
| Organization overview | Ya | Tidak | Tidak | Tidak | Tidak |
| Unit overview | Semua | Assigned | Assigned | Team | Tidak |
| Manage employee | Semua | Unit | Location | View team | Self |
| Schedule | Semua | Unit | Location | Propose | View |
| Attendance live | Semua | Unit | Location | Team | Self |
| Corrections | Approve | Approve | Policy | Propose | Request |
| KPI template | Semua | Unit | Use | Tidak | View |
| Goals/review | Semua | Unit | Team | Team | Self |
| Sensitive notes | Policy | Scope | Direct report | Direct report | Tidak |
| Audit/export | Semua | Scope | Limited | Limited | Own |

Permission diperiksa oleh server dan RLS, bukan hanya menu UI.

---

## 6. Information architecture

Employee mobile:

- Today.
- Schedule.
- Activity.
- Performance.
- Profile.

Management:

- Overview.
- Attendance: Live, History, Exceptions, Corrections.
- Scheduling: Calendar, Templates, Availability, Swap.
- Leave & Overtime.
- Operations: Readiness, Checklist, Logbook, Handover.
- Performance: Overview, Employees, KPI, Goals, Feedback, Review, Coaching.
- People.
- Reports.
- Organization.
- Settings.
- Audit.

---

## 7. Attendance workflow

### Check-in

1. Today menampilkan shift, unit, lokasi, dan status permission.
2. Employee menekan Absen Masuk.
3. Preflight memeriksa auth, schedule, camera, location, network, dan device.
4. Kamera depan membuka capture langsung; galeri tidak ditawarkan.
5. GPS menunggu accuracy sesuai policy atau timeout.
6. Review menampilkan foto, unit, location, distance, shift, server time.
7. Confirm mengirim idempotency key.
8. Server memvalidasi scope, policy, event order, geofence, media, dan schedule.
9. Receipt menampilkan jam dan status.

### Check-out

1. Today menampilkan durasi shift dan unfinished critical task.
2. Employee capture sesuai policy.
3. Shift feedback singkat dapat diminta: rating 1–5, kendala, butuh follow-up.
4. Server membuat event dan attendance day summary.
5. Exception muncul bila pulang cepat, missing break, atau task critical tertunda.

### Break

- Break Start/End memiliki state sendiri.
- Tidak boleh overlap.
- Durasi berlebih membuat exception.
- Selfie break opsional per policy.

### Offline

- MVP online-first.
- Fase offline menyimpan encrypted pending event.
- UI menampilkan Pending Sync.
- Server memberi delayed-sync flag.
- Retry tetap idempotent.

---

## 8. Location, camera, dan risk

Policy inheritance:

Location → Unit → Organization.

| Geofence result | Aksi |
|---|---|
| Inside | Accept |
| Borderline karena accuracy | Accept + flag atau review |
| Outside | Reject / request outside attendance |
| Unknown | Retry / manual review |

Server menghitung distance dengan PostGIS/Haversine dan menyimpan accuracy, radius, algorithm version.

Risk flags:

- NEW_DEVICE.
- LOW_ACCURACY.
- OUTSIDE_GEOFENCE.
- MOCK_LOCATION_SUSPECTED.
- CLIENT_TIME_DRIFT.
- DELAYED_SYNC.
- DUPLICATE_ATTEMPT.
- RAPID_LOCATION_CHANGE.
- PHOTO_INVALID.
- MULTIPLE_EMPLOYEE_DEVICE.

Risk flag memicu review, bukan hukuman otomatis.

---

## 9. Shift dan schedule

Shift template berisi code, name, start/end, cross-midnight, check-in/out window, grace period, early leave threshold, break, overtime, location, work area, skill requirement, dan minimum headcount.

Schedule editor memiliki Day/Week/Month, Employee View, Area View, drag-drop, copy week, bulk assign, open shift, swap, dan publish.

Validasi sebelum publish:

- Shift overlap.
- Rest period tidak cukup.
- Assignment inactive.
- Location conflict.
- Leave conflict.
- Skill wajib tidak terpenuhi.
- Excess hours.
- Area understaffed.

Flow:

Draft → Validate → Preview Impact → Publish → Notify.

Perubahan setelah publish wajib reason, notification, dan audit.

---

## 10. Request dan approval

Request types:

- Izin, sakit, cuti.
- Dinas luar.
- Terlambat terencana.
- Pulang awal.
- Lupa check-in/out.
- Tukar shift.
- Lembur.

State:

Draft → Submitted → In Review → Approved/Rejected/Needs Info → Cancelled.

Rules:

- Tidak boleh self-approve.
- Approval dapat satu atau beberapa tingkat.
- Policy berdasarkan unit/location/type.
- Delegation dan SLA reminder.
- Correction menyimpan before/after.
- Attendance event asli tidak diubah.
- Approved overtime berbeda dari actual overtime.

---

## 11. Operations layer

### Shift readiness

Readiness memakai:

- Headcount hadir vs minimum.
- Role kritis hadir.
- Checklist pra-operasional.
- Open issue shift sebelumnya.
- Device/POS status bila terintegrasi.

Status: Ready, At Risk, Not Ready, Unknown.

### Checklist

Template per area:

- Pre-opening.
- During service.
- Handover.
- Closing.
- Cleaning.
- Stock critical check.

Item memiliki title, instruction, due time, assignee, proof, criticality, completion, dan verification.

### Manager logbook

Category:

- Staffing.
- Production.
- Service.
- Customer.
- Stock/supplier.
- Maintenance.
- Hygiene/safety.
- Performance.
- Follow-up.

Entry dapat terkait shift, location, employee, evidence, visibility, dan follow-up task.

### Handover

Outgoing manager mengisi status, staffing, stock, equipment, customer issue, unfinished task, dan priority. Incoming manager melakukan acknowledgement.

---

## 12. Performance framework

Performance terdiri dari:

| Layer | Default weight |
|---|---:|
| Reliability | 20% |
| Execution | 40% |
| Behavior | 30% |
| Growth | 10% |

Attendance hanya masuk ke Reliability. Approved leave, system failure, dan approved correction tidak menurunkan nilai.

Rating:

| Score | Label | Meaning |
|---:|---|---|
| 1 | Perlu Perbaikan Serius | Jauh di bawah standar |
| 2 | Perlu Perbaikan | Belum konsisten |
| 3 | Memenuhi Harapan | Sesuai standar |
| 4 | Melebihi Harapan | Konsisten di atas standar |
| 5 | Sangat Baik | Dampak luar biasa |

Rating ekstrem wajib evidence. Template dan bobot harus versioned.

---

## 13. KPI model

KPI field:

- Name/description.
- Measurement unit.
- Direction: higher/lower/range.
- Target/threshold.
- Weight.
- Data source.
- Frequency.
- Evidence requirement.
- Role/work area.
- Owner.
- Version.

Scorecard formula:

Σ(normalized indicator score × weight).

Tampilkan confidence High/Medium/Low berdasarkan kelengkapan data.

### KPI Bakso Ujo

Produksi:

- Kesiapan produksi tepat waktu.
- Konsistensi kualitas.
- SOP dan hygiene.
- Waste control.
- Teamwork/handover.
- Reliability.

Service:

- Kecepatan dan ketepatan pelayanan.
- Akurasi pesanan.
- Kebersihan area.
- Keramahan.
- Handover.
- Reliability.

Kasir:

- Akurasi transaksi.
- Selisih kas.
- Kecepatan proses.
- Kepatuhan prosedur.
- Service.
- Reliability.

Closing:

- Checklist closing.
- Kebersihan.
- Ketepatan selesai.
- Pelaporan masalah.
- Teamwork.

Manager:

- Outlet readiness.
- Schedule coverage.
- Critical task completion.
- Issue resolution.
- Coaching completion.
- Team stability.

Target final ditetapkan setelah baseline 4–8 minggu.

---

## 14. Performance lifecycle

Daily:

- Attendance evidence.
- Checklist/task.
- Recognition.
- Performance log.
- Shift feedback.

Weekly:

- Exception review.
- Manager pulse.
- Goal update.
- Short coaching.

Monthly:

- Self-check.
- Manager check-in.
- KPI snapshot.
- Strength.
- Improvement.
- Action plan.

Quarterly/Semester:

Draft Cycle → Active → Self Review → Manager Review → Calibration → Shared → Acknowledged → Closed.

Employee dapat memberi komentar dan acknowledgement, bukan dipaksa menyetujui isi review.

---

## 15. Feedback, recognition, coaching, PIP

Feedback type: positive, constructive, observation, customer mention, SOP/quality, teamwork.

Visibility: employee visible, manager-only, review committee.

Recognition wajib menyebut perilaku spesifik, nilai/KPI terkait, pemberi, tanggal/shift.

Coaching mencatat topic, evidence, employee perspective, agreed action, owner, due date, follow-up, dan outcome.

PIP:

Concern → Manager Review → Meeting → Expectation → Support/Training → Checkpoint → Outcome.

PIP tidak dibuat otomatis hanya karena satu score rendah.

---

## 16. Dashboard

Organization dashboard:

- Scheduled, Present, Late, Absent, Leave, Exceptions.
- Unit readiness.
- Attendance trend.
- Performance distribution.
- Pending approvals.
- Unit comparison.
- Critical action queue.
- Recognition.
- Coaching/review due.

Unit dashboard:

- Today attendance.
- Staffing by area.
- Shift readiness.
- Late/no-show.
- Open checklist.
- Logbook follow-up.
- Performance pulse.
- Upcoming review.

Employee Performance Profile tabs:

- Overview.
- Attendance.
- Goals/KPI.
- Feedback.
- Reviews.
- Coaching.
- Development.
- Documents.

---

## 17. Data model

Organization:

- organizations, business_units, work_locations, work_areas, organization_settings.

Identity:

- app_users, employees, employee_assignments, attendance_memberships, role_permissions, scope_grants, employee_devices.

Attendance:

- attendance_policies, attendance_policy_versions, shift_templates, employee_schedules, schedule_changes, attendance_events, attendance_days, attendance_media, attendance_risk_flags, attendance_corrections, holidays.

Requests:

- request_types, employee_requests, request_attachments, approval_workflows, approval_steps, approval_actions.

Operations:

- checklist_templates, checklist_template_items, shift_checklists, shift_task_items, task_evidence, shift_readiness, manager_log_entries, shift_handovers.

Performance:

- competency_libraries, competency_items, kpi_templates, kpi_template_versions, performance_cycles, employee_scorecards, scorecard_indicators, goals, goal_updates, performance_logs, feedback_entries, recognitions, review_assignments, review_responses, calibration_sessions, calibration_adjustments, coaching_sessions, development_plans, development_actions, performance_improvement_plans.

System:

- notifications, notification_preferences, audit_logs, exports, integration_jobs.

---

## 18. Server functions

- resolve-login-context.
- switch-context.
- attendance-preflight.
- create-media-upload.
- submit-attendance-event.
- calculate-attendance-day.
- submit/approve-request.
- publish-schedule.
- compute-shift-readiness.
- submit-handover.
- create-performance-log.
- submit-feedback.
- calculate-scorecard.
- submit/calibrate/publish-review.
- generate-report.

Semua mutation memerlukan JWT, scope check, schema validation, idempotency, server time, audit, dan structured error.

---

## 19. Privacy dan fairness

- Kamera/lokasi hanya saat event.
- Bucket private dan signed URL singkat.
- Data minimization dan configurable retention.
- Employee dapat mengetahui data yang dikumpulkan.
- Performance indicator terlihat sebelum cycle aktif.
- Evidence wajib untuk rating ekstrem.
- Calibration adjustment wajib reason.
- Dilarang menilai atribut pribadi yang tidak relevan.
- Tidak ada automatic termination/reward.
- Tidak ada ranking publik.

---

## 20. Bakso Ujo seed

Jam layanan 10.00–21.00; closing sekitar 22.00; produksi dimulai dini hari.

| Shift | Time |
|---|---:|
| Produksi Dini Hari | 03.00–15.00 |
| Produksi Pagi A | 05.00–17.00 |
| Produksi Pagi B | 06.00–18.00 |
| Persiapan & Service | 09.00–21.00 |
| Outlet & Closing | 10.00–22.00 |

| Employee | Initial schedule |
|---|---|
| Dede | 03.00–15.00 |
| Uus | 05.00–17.00 atau 06.00–18.00 dipilih per jadwal |
| Findy | 09.00–21.00 |
| Citra | 10.00–22.00 |
| Onong | 10.00–22.00 |

Seed dapat diedit dan tidak hard-coded.

---

## 21. Roadmap

Phase 0: policy, workflow baseline, role, location, KPI governance.  
Phase 1: multi-unit foundation, login, assignment, RLS, audit.  
Phase 2: attendance MVP Bakso Ujo.  
Phase 3: scheduler, leave, overtime, reports.  
Phase 4: readiness, checklist, logbook, handover.  
Phase 5: KPI, performance log, feedback, recognition, monthly check-in.  
Phase 6: formal review, calibration, coaching, development, PIP.  
Phase 7: GG Supply/GUDSKUY, POS, payroll, offline, kiosk.

---

## 22. Acceptance criteria

- Satu login untuk semua unit.
- Multi-unit isolation lulus RLS test.
- Employee hanya melihat data sendiri.
- Kamera, GPS, server time, dan idempotency valid.
- Cross-midnight shift benar.
- Event asli tidak berubah saat koreksi.
- Schedule conflict tervalidasi.
- Readiness menunjukkan role kritis kurang.
- Logbook dan handover memiliki owner/follow-up.
- KPI versioned dan weight total 100%.
- Approved leave tidak menurunkan reliability.
- Rating ekstrem wajib evidence.
- Employee dapat self-review dan acknowledge.
- Calibration audited.
- Public ranking tidak tersedia.

---

## 23. Test strategy

Unit: time window, cross-midnight, geofence accuracy, score normalization, policy inheritance, permission.  
Integration: login context, upload-event, schedule-summary, request-approval, KPI-review.  
E2E: normal check-in/out, multi-unit conflict, outside geofence, correction, schedule publish, readiness, review cycle.  
Security: cross-tenant, IDOR, signed URL, privilege escalation, export leak, rate limit.  
Usability: low-end Android, one-hand use, poor network, indoor GPS, desktop scheduling.

---

## 24. Rollout

1. Pilot owner, manager, 2–3 employee.
2. Shadow attendance selama satu minggu.
3. Rollout seluruh Bakso Ujo.
4. Kumpulkan baseline performance 4–8 minggu.
5. Aktifkan feedback/logbook.
6. Aktifkan scorecard setelah data dan rubric tervalidasi.
7. Ekspansi ke unit lain.

---

## 25. Definition of done

- Requirement dan screen specification approved.
- RLS/security reviewed.
- Happy path dan exception pass.
- Loading/empty/error state tersedia.
- Audit dan notification bekerja.
- Mobile/desktop verified.
- Analytics event terpasang.
- Owner/manager UAT sign-off.
