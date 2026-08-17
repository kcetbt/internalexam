# Project Outline — InternalExam

## Overview
**InternalExam** is an Exam Attendance & Seating Management system for Kamaraj College of Engineering and Technology (KCET). It is a client-side Web Application deployed on GitHub Pages with a Google Apps Script (Web App) + Google Sheets database backend.

## System Architecture
- **Frontend Layer**: HTML5, CSS3, Vanilla ES6 JavaScript (`common.js`).
- **External Libraries**: SheetJS (XLSX parsing), jsPDF & html2canvas (PDF generation), Font Awesome 6.
- **Backend Layer**: Google Apps Script Web App providing JSON API actions.
- **Data Layer**: Google Sheets storing 3 core tables: `Users`, `StudentSeating`, `Settings`.
- **Deployment**: GitHub Pages (`https://kcetbt.github.io/internalexam/`).

## Roles & Core Modules
1. **Login Page** ([index.html](file:///e:/WebDesignProjects/internalexam/index.html)): Authentication & role selection (Student, Faculty, Staff, CoE).
2. **Student Portal** ([student.html](file:///e:/WebDesignProjects/internalexam/student.html)): Personal seating details, hall number, subject, and batch timings.
3. **Faculty Portal** ([faculty.html](file:///e:/WebDesignProjects/internalexam/faculty.html)): Mark hall attendance, export PDF/CSV reports.
4. **Staff Portal** ([staff.html](file:///e:/WebDesignProjects/internalexam/staff.html)): Visual grid-based seat marking (Present / Absent / On-Duty).
5. **CoE Dashboard** ([coe.html](file:///e:/WebDesignProjects/internalexam/coe.html)): Department/year/section attendance overview.
6. **Data Upload** ([upload.html](file:///e:/WebDesignProjects/internalexam/upload.html)): Excel upload module for seating plans and user accounts.
7. **Reports Engine** ([report.html](file:///e:/WebDesignProjects/internalexam/report.html)): Multi-filter attendance report generation & PDF export.
8. **Seating Manager** ([Seating.html](file:///e:/WebDesignProjects/internalexam/Seating.html)): Interactive drag-and-drop seating arrangement editor (ExamSeat Premium v2).
9. **Lock Control** ([lock.html](file:///e:/WebDesignProjects/internalexam/lock.html)): Date-wise attendance lock/unlock toggles.

## Shared Utility & API Layer
- [common.js](file:///e:/WebDesignProjects/internalexam/common.js): Shared authentication, session management, and API action handler (`apiCall`).
- [style.css](file:///e:/WebDesignProjects/internalexam/style.css): Master design system, color palette, custom CSS variables, and layout utilities.

## Version & Deployment Environment
- **Current Version**: `v1.0.0`
- **Target Host**: GitHub Pages (Static site deployment on `main` branch). No `.env` or GitHub Secrets required.
