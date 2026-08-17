# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-08-17

### Added
- **Multi-Semester Database Isolation**: Added `AcademicYear`, `Semester`, and `ExamNumber` schema columns to `StudentSeating` in `DB.xlsx` and backend Apps Script.
- **Salted HMAC-SHA256 Password Security**: Native zero-dependency password hashing (`$pbkdf$v1$<SALT>$<HASH>`) using per-user 16-byte random salts and server-side secret keying.
- **Automatic Plaintext Password Migration**: Real-time automatic password hashing and database cell upgrades upon user login without requiring manual re-registration.
- **Dynamic Academic Year Dropdown**: Integrated June 1 academic year calculation starting from `2026-27` and auto-expanding year lists based on real-time date.
- **Dynamic Semester Calculator**: Automatic term detection for `ODD` (June–Nov) and `EVEN` (Dec–May) semesters.

### Changed
- **Exam Notation**: Updated exam notation across dropdowns, forms, and PDF exports from `CAT-I` / `CAT-II` to `I` / `II`.
- **Excel Upload Parsing**: Enhanced Excel header normalization to support flexible column aliases (`Roll No`, `Student Roll No`, `Hall`, `Hall No`, `Seat No`, `Seating No`, `Subject Code`, `Subject Name`) without requiring pre-filled `Status` values.
- **PDF Report Layouts**: Fixed PDF logo dimensions to 85px height (Landscape) and 70px height (Portrait) while strictly maintaining image aspect ratio; auto-mapped department code `BT` to `DEPARTMENT OF BIOTECHNOLOGY`.
- **Dynamic Term Binding**: All PDF report generators dynamically pull `AcademicYear`, `Semester`, and `ExamNumber` directly from database rows.

### Fixed
- **Date Normalization**: Resolved date string mismatches (`YYYY-MM-DD` vs `DD/MM/YYYY` vs Date objects) across `parseSheetDateCell()` in backend Google Apps Script and date-wise lock checking.
- **Case-Insensitive Department & Hall Matching**: Fixed hall lookup filtering by trimming and normalizing department codes and hall numbers.
- **Atomic Bulk Upload**: Converted row-by-row append loop in `handleUploadSeating` to matrix bulk `.setValues()` to prevent Apps Script timeouts.

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
- **StudentSeating** sheet: Date, Department, Batch, HallNo, RollNo, Name, SeatNo, SubjectCode, Subject, Year, Section, Status, Reason, AcademicYear, Semester, ExamNumber
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
| 1.1.0 | 2026-08-17 | main | Multi-semester isolation, date normalization, & PDF enhancements |
| 1.0.0 | 2025-08-07 | main | Initial production release |
| dev | ongoing | dev | Active development |

---

## Release Process

1. Develop on `dev` branch
2. Create PR: `dev` → `main`
3. Review & test (local or preview)
4. Merge → auto-deploy to production
5. Tag release: `git tag v1.1.0 && git push origin v1.1.0`
6. Update CHANGELOG.md