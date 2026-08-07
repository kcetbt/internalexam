# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-08-07

### Added
- Initial official release from KCET Exam Cell
- Role-based login system (Student, Faculty, Staff, CoE)
- Student dashboard with seating view and batch timing
- Faculty dashboard with hall-wise attendance marking
- Staff dashboard with visual hall grid seat marking
- CoE dashboard with department/year/section summaries
- Data upload via Excel (seating plans + user management)
- Reports with PDF/CSV export (jsPDF + AutoTable)
- Advanced seating manager (ExamSeat Premium v2) with drag-drop
- Date-wise attendance lock/unlock control
- Responsive design for mobile/tablet/desktop

### Technical
- Google Apps Script backend with Google Sheets storage
- Shared API layer (`common.js`) with 14 actions
- CSS custom properties for theming
- CDN dependencies: SheetJS, jsPDF, html2canvas, jsPDF-AutoTable, Font Awesome
- GitHub Pages deployment ready

### Data Schema
- **Users** sheet: email, password, name, role, department, studentRollNo
- **StudentSeating** sheet: Date, Department, Batch, HallNo, RollNo, Name, SeatNo, SubjectCode, Subject, Year, Section, Status, Reason
- **Settings** sheet: Date, LockStatus

---

## [Unreleased]

### Planned
- GitHub Actions / Netlify PR preview deployment
- Password hashing in backend (currently plain text)
- Automated seating algorithm
- Email/SMS notifications for absentees
- Audit trail for attendance modifications
- Offline support with IndexedDB + background sync
- SharePoint/Excel + Microsoft Graph API migration path

### Considered
- Netlify deployment for private repo + preview URLs
- GitHub Pages (requires public repo on free tier)
- Custom domain configuration

---

## Versioning

| Version | Date | Branch | Notes |
|---------|------|--------|-------|
| 1.0.0 | 2025-08-07 | main | Initial production release |
| dev | ongoing | dev | Active development |

---

## Release Process

1. Develop on `dev` branch
2. Create PR: `dev` → `main`
3. Review & test (local or preview)
4. Merge → auto-deploy to production
5. Tag release: `git tag v1.0.0 && git push origin v1.0.0`
6. Update CHANGELOG.md