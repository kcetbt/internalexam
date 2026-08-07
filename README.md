# InternalExam — KCET Exam Attendance & Seating System

> **Internal Exam Attendance Management System** for Kamaraj College of Engineering and Technology (KCET).

A client-side web application for managing exam attendance, seating allotment, and reporting. Backend powered by **Google Apps Script + Google Sheets**.

---

## Live Deployment

**Production:** `https://kcetbt.github.io/internalexam/` (GitHub Pages on `main` branch)

> **Note:** Requires repo visibility set to **Public** for GitHub Pages on free tier. See [Deployment](#deployment) section.

---

## Features

| Module | Description |
|--------|-------------|
| **Role-based Login** | Student / Faculty / Staff / CoE dashboards |
| **Student Portal** | View own seating, hall, subject, batch timing |
| **Faculty Portal** | Mark attendance by hall, export PDF/CSV reports |
| **Staff Portal** | Visual hall grid seat marking (Present/Absent/OD) |
| **CoE Dashboard** | Department/year/section attendance summaries |
| **Data Upload** | Excel upload for seating plans & user management |
| **Reports** | Filtered reports with PDF/CSV export |
| **Seating Manager** | Drag-drop multi-hall seat allotment (ExamSeat Premium v2) |
| **Lock Control** | Date-wise attendance lock/unlock by CoE |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3 (Custom Properties), Vanilla ES6+ |
| Styling | Inter font, Font Awesome 6, CSS Grid/Flexbox |
| Libraries (CDN) | SheetJS (xlsx), jsPDF, html2canvas, jsPDF-AutoTable |
| Backend | Google Apps Script (Web App) |
| Database | Google Sheets (3 tabs: Users, StudentSeating, Settings) |
| Deployment | GitHub Pages / Netlify |
| Version | 1.0.0 |

---

## Project Structure

```
internalexam/
├── index.html           # Login page
├── student.html         # Student dashboard
├── faculty.html         # Faculty dashboard
├── staff.html           # Staff hall attendance
├── coe.html             # CoE summary dashboard
├── upload.html          # CoE data upload (Excel)
├── report.html          # CoE reports & export
├── Seating.html         # Advanced seating manager
├── lock.html            # Date-wise lock control
├── common.js            # Shared API layer & auth
├── style.css            # Base utilities
├── logo.jpeg            # KCET logo
├── Logo.png             # Alternate logo
├── Logo-sq.png          # Square logo
├── Attendance.xlsx      # Local data mirror (reference)
├── CONFIG.docx          # Apps Script source (reference)
├── AUDIT_REPORT.md      # Technical audit
├── README.md            # This file
└── CHANGELOG.md         # Version history
```

---

## Quick Start

### Prerequisites

- Google account (KCET institutional recommended)
- GitHub account with access to `kcetbt` organization

### 1. Backend Setup (Google Apps Script)

```bash
# Detailed steps in DEPLOYMENT.md
1. Create Google Sheet from Attendance.xlsx
2. Extensions → Apps Script → paste CONFIG.docx code
3. Set timezone: Asia/Kolkata (GMT+05:30)
4. Deploy → Web App → Execute as Me → Anyone with link
5. Copy Web App URL
```

### 2. Configure Frontend

Edit `common.js`:
```javascript
const API_BASE = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

### 3. Deploy

```bash
# GitHub Pages (requires public repo)
gh repo edit kcetbt/internalexam --visibility public
# Then enable Pages in Settings → Pages → main branch

# OR Netlify (works on private)
netlify init --manual
netlify deploy --prod --dir=.
```

### 4. Seed Users

1. Login as `CoE` / `CoE`
2. Go to `upload.html` → download Users template
3. Add real accounts → upload

---

## Default Test Credentials

| Role | Email | Password |
|------|-------|----------|
| CoE | `CoE` | `CoE` |
| Faculty | `faculty` | `faculty` |
| Staff | `staff` | `staff` |
| Staff (ECE) | `staff1` | `staff1` |

> **Change immediately after first login via upload.html**

---

## Branching Strategy

| Branch | Purpose | Deployment |
|--------|---------|------------|
| `main` | Production-ready | Auto-deploy to production URL |
| `dev` | Development work | Local testing only (no Pages) |

**Workflow:**
```bash
git checkout dev
# make changes
git add . && git commit -m "feat: description"
git push origin dev
# Create PR: dev → main
# Review → Merge → Auto-deploy
```

---

## GitHub Actions Preview (Planned)

Future: PR previews via Netlify or GitHub Actions artifact deployment.

---

## Security

- **API endpoint** stored in `common.js` (client-side)
- **Google Apps Script** deployed as "Anyone with link"
- **Passwords** stored in plain text in Google Sheets (⚠️ hash in production)
- **No secrets in repo** — endpoint is public by design

### GitHub Secrets for Endpoints?

**Not applicable for this architecture.**

| Approach | Works? | Reason |
|----------|--------|--------|
| GitHub Secrets in Actions | ❌ | Static site — no build step to inject secrets |
| Environment variables at runtime | ❌ | Browser has no access to GH secrets |
| Netlify/Vercel env vars | ⚠️ | Only at build time; client still sees value |

**Current design:** The Apps Script URL is inherently public (deployed as "Anyone with link"). Security comes from:
1. Google account ownership of the script
2. Sheet permissions (only script owner can edit)
3. Role checks in backend code

For true secret management, you'd need a **backend proxy** (Cloudflare Worker, Azure Function, etc.) that holds the endpoint server-side.

---

## Documentation

- `AUDIT_REPORT.md` — Complete technical audit
- `CHANGELOG.md` — Version history
- `DEPLOYMENT.md` — Step-by-step deployment guide (to be created)

---

## License

Internal use — Kamaraj College of Engineering and Technology.

---

## Contact

**KCET BT Exam Cell**  
Department of Biotechnology  
Kamaraj College of Engineering and Technology  
Virudhunagar, Tamil Nadu 626001

**Maintainer:** Er. Karl Joseph Samuel  
**Email:** karljsamuelbt@kamarajengg.edu.in