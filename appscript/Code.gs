/**
 * Google Apps Script backend for Exam Attendance System
 * StudentSeating columns (0-based):
 * Date(0), Department(1), Batch(2), Hall No(3), Student Roll No(4), Name(5),
 * Seating No(6), Subject Code(7), Subject(8), Year(9), Section(10),
 * Status(11), Reason(12), AcademicYear(13), Semester(14), ExamNumber(15)
 */

const USERS_SHEET = "Users";
const SEATING_SHEET = "StudentSeating";
const LOCK_SHEET = "Settings";
const CONFIG_SHEET = "SystemConfig";

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const action = req.action;

    if (action === "login") return jsonResponse(handleLogin(req));
    if (action === "uploadSeating") return jsonResponse(handleUploadSeating(req));
    if (action === "getHalls") return jsonResponse(handleGetHalls(req));
    if (action === "getHall") return jsonResponse(handleGetHall(req));
    if (action === "saveAttendance") return jsonResponse(handleSaveAttendance(req));
    if (action === "getAbsentees") return jsonResponse(handleGetAbsentees(req));
    if (action === "saveReason") return jsonResponse(handleSaveReason(req));
    if (action === "report") return jsonResponse(handleReport(req));
    if (action === "getLockStatus") return jsonResponse({ success: true, lock: getLockStatus(req.date) });
    if (action === "setLockStatus") return jsonResponse(setLockStatus(req.date, req.value));
    if (action === 'checkLock') return jsonResponse({ success: true, locked: isDateLocked(req.date) });
    if (action === "getStudentSeating") return jsonResponse(handleGetStudentSeating(req));
    if (action === "uploadUsers") return jsonResponse(handleUploadUsers(req.users));
    if (action === "uploadUsersOverwrite") return jsonResponse(handleUploadUsersOverwrite(req.users));
    if (action === "getStudentSeatingData") return jsonResponse(getStudentSeatingData(req.date, req.batch, req.department));
    if (action === "getAllUsers") return jsonResponse(handleGetAllUsers(req));
    if (action === "getStudentStats") return jsonResponse(handleGetStudentStats(req));
    if (action === "getUpcomingExams") return jsonResponse(handleGetUpcomingExams(req));
    if (action === "getExamHistory") return jsonResponse(handleGetExamHistory(req));
    if (action === "getSystemConfig") return jsonResponse(handleGetSystemConfig());
    if (action === "setSystemConfig") return jsonResponse(handleSetSystemConfig(req.config));

    return jsonResponse({ success: false, message: "Unknown action" });
  } catch (err) {
    return jsonResponse({ success: false, message: err && err.message ? err.message : String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------- Helpers ----------------
function parseSheetDateCell(cell) {
  const tz = Session.getScriptTimeZone();
  if (cell === "" || cell === null || cell === undefined) return "";
  if (Object.prototype.toString.call(cell) === "[object Date]") {
    if (!isNaN(cell.getTime())) {
      return Utilities.formatDate(cell, tz, "yyyy-MM-dd");
    }
    return "";
  }
  if (typeof cell === "number") {
    const jsDate = new Date(Math.round((cell - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      return Utilities.formatDate(jsDate, tz, "yyyy-MM-dd");
    }
    return "";
  }
  const s = String(cell).trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split("/");
    return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  }
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) {
    const parts = s.split("-");
    return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return Utilities.formatDate(d, tz, "yyyy-MM-dd");
  return s;
}

function normalizeStatus(raw) {
  if (raw === null || raw === undefined) return "";
  let s = String(raw).trim();
  if (!s) return "";
  const up = s.toUpperCase();
  if (up === "OD" || up === "O D" || up === "ON DUTY" || up === "ON-DUTY") return "OD";
  if (up === "A" || up === "ABS" || up === "ABSENT") return "Absent";
  if (up === "P" || up === "PRESENT") return "Present";
  return s;
}

function normalizeRowToObject(r) {
  return {
    Date: parseSheetDateCell(r[0]),
    Department: r[1],
    Batch: r[2],
    HallNo: r[3],
    RollNo: r[4],
    Name: r[5],
    SeatNo: r[6],
    SubjectCode: r[7],
    Subject: r[8],
    Year: r[9],
    Section: r[10],
    Status: normalizeStatus(r[11]),
    Reason: r[12] || "",
    AcademicYear: r[13] || "",
    Semester: r[14] || "",
    ExamNumber: r[15] || ""
  };
}

// ---------------- System Config ----------------
function handleGetSystemConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG_SHEET);
    sheet.appendRow(["Key", "Value"]);
    sheet.appendRow(["academicYear", "2025 – 2026"]);
    sheet.appendRow(["semester", "EVEN"]);
    sheet.appendRow(["examNumber", "CAT-I"]);
  }
  const data = sheet.getDataRange().getValues();
  const config = { academicYear: "2025 – 2026", semester: "EVEN", examNumber: "CAT-I" };
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) config[data[i][0]] = String(data[i][1]);
  }
  return { success: true, config };
}

function handleSetSystemConfig(cfg) {
  if (!cfg) return { success: false, message: "Invalid config" };
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG_SHEET);
    sheet.appendRow(["Key", "Value"]);
  }
  const current = handleGetSystemConfig().config;
  const newConfig = { ...current, ...cfg };
  sheet.clearContents();
  sheet.appendRow(["Key", "Value"]);
  Object.keys(newConfig).forEach(k => {
    sheet.appendRow([k, newConfig[k]]);
  });
  return { success: true, config: newConfig };
}

// ---------------- Login ----------------
function handleLogin(req) {
  const { email, password } = req;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
  if (!sheet) return { success: false, message: "Users sheet not found" };

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { success: false, message: "No users" };
  data.shift();

  for (let row of data) {
    if (row[0] === email && row[1] === password) {
      return { 
        success: true, 
        user: { 
          email: row[0], 
          name: row[2], 
          role: row[3], 
          department: row[4],
          studentRollNo: row[5] || ""
        } 
      };
    }
  }
  return { success: false, message: "Invalid credentials" };
}

// ---------------- Get All Users (for upload page) ----------------
function handleGetAllUsers(req) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
    if (!sheet) return { success: false, message: "Users sheet not found" };

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) return { success: true, users: [] };
    
    data.shift();
    const users = data.map(row => ({
      email: row[0] || "",
      password: row[1] || "",
      name: row[2] || "",
      role: row[3] || "",
      department: row[4] || "",
      studentRollNo: row[5] || ""
    }));

    return { success: true, users: users };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ---------------- Upload Seating ----------------
function handleUploadSeating(req) {
  const rows = req.rows;
  if (!rows || !Array.isArray(rows) || rows.length === 0)
    return { success: false, message: "No rows received" };

  const activeCfg = handleGetSystemConfig().config;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SEATING_SHEET) || ss.insertSheet(SEATING_SHEET);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Date", "Department", "Batch", "Hall No", "Student Roll No", "Name",
      "Seating No", "Subject Code", "Subject", "Year", "Section", "Status", "Reason",
      "AcademicYear", "Semester", "ExamNumber"
    ]);
  }

  let data = sheet.getDataRange().getValues();
  let headers = data.shift() || [
    "Date", "Department", "Batch", "Hall No", "Student Roll No", "Name",
    "Seating No", "Subject Code", "Subject", "Year", "Section", "Status", "Reason",
    "AcademicYear", "Semester", "ExamNumber"
  ];

  // Ensure top header row has AcademicYear, Semester, ExamNumber columns
  let headersModified = false;
  if (headers.indexOf("AcademicYear") === -1) { headers.push("AcademicYear"); headersModified = true; }
  if (headers.indexOf("Semester") === -1) { headers.push("Semester"); headersModified = true; }
  if (headers.indexOf("ExamNumber") === -1) { headers.push("ExamNumber"); headersModified = true; }

  if (headersModified) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  const rollIdx = headers.indexOf("Student Roll No") !== -1 ? headers.indexOf("Student Roll No") : 4;
  const codeIdx = headers.indexOf("Subject Code") !== -1 ? headers.indexOf("Subject Code") : 7;
  const dateIdx = headers.indexOf("Date") !== -1 ? headers.indexOf("Date") : 0;

  const existingMap = {};
  data.forEach((row, i) => {
    const dStr = parseSheetDateCell(row[dateIdx]);
    const roll = String(row[rollIdx] || "").trim();
    const code = String(row[codeIdx] || "").trim();
    if (roll && code) {
      existingMap[`${dStr}_${roll}_${code}`] = i + 2;
      existingMap[`${roll}_${code}`] = i + 2;
    }
  });

  let updated = 0, inserted = 0;
  const rowsToAppend = [];

  rows.forEach(r => {
    let rawDate = r.Date;
    let dateObj = "";
    if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      dateObj = new Date(rawDate + "T00:00:00");
    } else if (typeof rawDate === "number") {
      dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
    } else if (rawDate) {
      dateObj = rawDate;
    }

    const dIso = dateObj ? parseSheetDateCell(dateObj) : "";
    const roll = String(r["Student Roll No"] || r["Roll No"] || r.RollNo || "").trim();
    const code = String(r["Subject Code"] || r.SubjectCode || "").trim();

    const ayVal = r.AcademicYear || activeCfg.academicYear || "2026-27";
    const semVal = r.Semester || activeCfg.semester || "EVEN";
    const exVal = r.ExamNumber || activeCfg.examNumber || "I";

    const newRow = [
      dateObj || "",
      r.Department || "",
      r.Batch || "FN",
      r["Hall No"] || r.Hall || r.HallNo || "",
      roll,
      r.Name || "",
      r["Seating No"] || r["Seat No"] || r.SeatNo || "",
      code,
      r.Subject || "",
      r.Year || "",
      r.Section || "",
      r.Status || "",
      r.Reason || "",
      ayVal,
      semVal,
      exVal
    ];

    const keyWithDate = `${dIso}_${roll}_${code}`;
    const keyRollCode = `${roll}_${code}`;
    const existingRowIndex = existingMap[keyWithDate] || existingMap[keyRollCode];

    if (existingRowIndex) {
      sheet.getRange(existingRowIndex, 1, 1, newRow.length).setValues([newRow]);
      updated++;
    } else {
      rowsToAppend.push(newRow);
      inserted++;
    }
  });

  if (rowsToAppend.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rowsToAppend.length, 16).setValues(rowsToAppend);
  }

  return {
    success: true,
    message: `Upload complete: ${inserted} new inserted, ${updated} updated`,
    inserted,
    updated
  };
}

// ---------------- Get All Halls for a Department ----------------
function handleGetHalls(req) {
  const { department, date, batch, academicYear, semester, examNumber } = req;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEATING_SHEET);
  if (!sheet) return { success: false, message: "Seating sheet not found" };

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { success: true, halls: [] };
  data.shift();

  let targetDateIso = "";
  if (date) {
    targetDateIso = parseSheetDateCell(date);
  }

  const deptUpper = department ? String(department).trim().toUpperCase() : "";

  const halls = Array.from(
    new Set(
      data
        .map(r => normalizeRowToObject(r))
        .filter(r => {
          const rDept = String(r.Department || "").trim().toUpperCase();
          if (deptUpper && rDept !== deptUpper) return false;
          if (!r.HallNo) return false;
          if (targetDateIso && r.Date !== targetDateIso) return false;
          if (batch && String(r.Batch).trim().toUpperCase() !== String(batch).trim().toUpperCase()) return false;
          if (academicYear && r.AcademicYear && r.AcademicYear !== academicYear) return false;
          if (semester && r.Semester && r.Semester !== semester) return false;
          if (examNumber && r.ExamNumber && r.ExamNumber !== examNumber) return false;
          return true;
        })
        .map(r => String(r.HallNo).trim())
    )
  ).filter(Boolean).sort();

  return { success: true, halls };
}

// ---------------- Get Hall ----------------
function handleGetHall(req) {
  const { hallNo, department, date, batch, academicYear, semester, examNumber } = req;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEATING_SHEET);
  if (!sheet) return { success: false, message: "Seating sheet not found" };
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { success: true, hallData: [] };
  data.shift();

  const targetDateIso = date ? parseSheetDateCell(date) : "";
  const deptUpper = department ? String(department).trim().toUpperCase() : "";

  let rows = data
    .map(r => normalizeRowToObject(r))
    .filter(r => {
      const rDept = String(r.Department || "").trim().toUpperCase();
      if (deptUpper && rDept !== deptUpper) return false;
      if (hallNo && String(r.HallNo).trim() !== String(hallNo).trim()) return false;
      if (targetDateIso && r.Date !== targetDateIso) return false;
      if (batch && String(r.Batch).trim().toUpperCase() !== String(batch).trim().toUpperCase()) return false;
      if (academicYear && r.AcademicYear && r.AcademicYear !== academicYear) return false;
      if (semester && r.Semester && r.Semester !== semester) return false;
      if (examNumber && r.ExamNumber && r.ExamNumber !== examNumber) return false;
      return true;
    });

  return { success: true, hallData: rows };
}

// ---------------- Save Attendance ----------------
function handleSaveAttendance(req) {
  const { hallNo, date, updates, batch } = req;
  if (!Array.isArray(updates)) return { success: false, message: "Invalid updates" };

  if (isDateLocked(date)) {
    return { success: false, message: "Editing locked by CoE for this date." };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEATING_SHEET);
  if (!sheet) return { success: false, message: "Seating sheet not found" };

  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return { success: false, message: "No data" };
  values.shift();
  const targetDateIso = date ? parseSheetDateCell(date) : "";
  let updated = 0;

  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    const rowDate = parseSheetDateCell(r[0]);
    const rowHall = r[3];
    const rowRoll = r[4];
    const u = updates.find(x => String(x.RollNo).trim() === String(rowRoll).trim());
    if (u && String(rowHall).trim() === String(hallNo).trim() && (!targetDateIso || rowDate === targetDateIso)) {
      sheet.getRange(i + 2, 12).setValue(u.Status);
      updated++;
    }
  }

  return { success: true, message: "Attendance updated", updatedCount: updated };
}

// ---------------- Get Absentees ----------------
function handleGetAbsentees(req) {
  const { department, date, batch, academicYear, semester, examNumber } = req;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEATING_SHEET);
  if (!sheet) return { success: false, message: "Seating sheet not found" };
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { success: true, absentees: [], totals: {}, yearSummary: {} };
  data.shift();

  const targetDateIso = date ? parseSheetDateCell(date) : "";
  const deptUpper = department ? String(department).trim().toUpperCase() : "";

  const deptRows = data
    .map(r => normalizeRowToObject(r))
    .filter(r => {
      const rDept = String(r.Department || "").trim().toUpperCase();
      if (deptUpper && rDept !== deptUpper) return false;
      if (targetDateIso && r.Date !== targetDateIso) return false;
      if (batch && String(r.Batch).trim().toUpperCase() !== String(batch).trim().toUpperCase()) return false;
      if (academicYear && r.AcademicYear && r.AcademicYear !== academicYear) return false;
      if (semester && r.Semester && r.Semester !== semester) return false;
      if (examNumber && r.ExamNumber && r.ExamNumber !== examNumber) return false;
      return true;
    });

  const absentees = deptRows.filter(r => {
    const st = (r.Status || "").trim().toUpperCase();
    return st === "ABSENT" || st === "OD";
  });

  const total = deptRows.length;
  const present = deptRows.filter(r => (r.Status || "").toUpperCase() === "PRESENT").length;
  const absent = deptRows.filter(r => (r.Status || "").toUpperCase() === "ABSENT").length;
  const od = deptRows.filter(r => (r.Status || "").toUpperCase() === "OD").length;
  const attendancePercent = total === 0 ? 0 : Math.round((present / total) * 10000) / 100;

  const yearSummary = {};
  deptRows.forEach(r => {
    const yr = r.Year || "NA";
    const sec = r.Section || "NA";
    if (!yearSummary[yr]) yearSummary[yr] = { sections: {} };
    if (!yearSummary[yr].sections[sec]) yearSummary[yr].sections[sec] = { total: 0, present: 0, absent: 0, od: 0 };
    const s = yearSummary[yr].sections[sec];
    s.total++;
    if ((r.Status || "").toUpperCase() === "PRESENT") s.present++;
    if ((r.Status || "").toUpperCase() === "ABSENT") s.absent++;
    if ((r.Status || "").toUpperCase() === "OD") s.od++;
  });

  return { success: true, absentees, totals: { total, present, absent, od, attendancePercent }, yearSummary };
}

// ---------------- Save Reason ----------------
function handleSaveReason(req) {
  const { rollNo, reason, date } = req;
  if (!rollNo) return { success: false, message: "Missing rollNo" };

  if (isDateLocked(date)) {
    return { success: false, message: "Editing not allowed. This date is locked by CoE." };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEATING_SHEET);
  if (!sheet) return { success: false, message: "Seating sheet not found" };

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { success: false, message: "No data" };
  data.shift();

  const targetDate = date ? String(date).trim() : "";
  let saved = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowDate = parseSheetDateCell(row[0]);
    const rowRoll = String(row[4]).trim();
    const rowStatus = normalizeStatus(row[11]);

    if (
      rowRoll === String(rollNo).trim() &&
      (rowStatus === "Absent" || rowStatus === "OD") &&
      (!targetDate || rowDate === targetDate)
    ) {
      sheet.getRange(i + 2, 13).setValue(reason || "");
      saved++;
    }
  }

  return { success: true, saved };
}

// ---------------- Report Summary for CoE ----------------
function handleReport(req) {
  const { department, hallNo, date, academicYear, semester, examNumber } = req;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEATING_SHEET);
  if (!sheet) return { success: false, message: "Seating sheet not found" };
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { success: true, total: 0, present: 0, absent: 0, od: 0, rows: [], deptSummary: {} };
  data.shift();

  const allRows = data.map(r => normalizeRowToObject(r));
  const activeCfg = handleGetSystemConfig().config;
  const targetAy = academicYear || activeCfg.academicYear;
  const targetSem = semester || activeCfg.semester;
  const targetEx = examNumber || activeCfg.examNumber;

  const targetDateIso = date ? parseSheetDateCell(date) : "";

  let rows = allRows.filter(r => {
    if (department && r.Department !== department) return false;
    if (hallNo && String(r.HallNo).trim() !== String(hallNo).trim()) return false;
    if (targetDateIso && r.Date !== targetDateIso) return false;
    if (academicYear && r.AcademicYear && r.AcademicYear !== academicYear) return false;
    if (semester && r.Semester && r.Semester !== semester) return false;
    if (examNumber && r.ExamNumber && r.ExamNumber !== examNumber) return false;
    return true;
  });

  const total = rows.length;
  const present = rows.filter(r => r.Status === "Present").length;
  const absent = rows.filter(r => r.Status === "Absent").length;
  const od = rows.filter(r => r.Status === "OD").length;
  const attendancePercent = total === 0 ? 0 : Math.round((present / total) * 10000) / 100;

  const deptMap = {};
  rows.forEach(r => {
    const dept = r.Department || "Unknown";
    const yr = r.Year || "Unknown";
    const sec = r.Section || "Unknown";
    if (!deptMap[dept]) deptMap[dept] = { total: 0, present: 0, absent: 0, od: 0, years: {} };
    const D = deptMap[dept];
    D.total++; if (r.Status === "Present") D.present++; if (r.Status === "Absent") D.absent++; if (r.Status === "OD") D.od++;
    if (!D.years[yr]) D.years[yr] = { total: 0, present: 0, absent: 0, od: 0, sections: {} };
    const Y = D.years[yr];
    Y.total++; if (r.Status === "Present") Y.present++; if (r.Status === "Absent") Y.absent++; if (r.Status === "OD") Y.od++;
    if (!Y.sections[sec]) Y.sections[sec] = { total: 0, present: 0, absent: 0, od: 0 };
    const S = Y.sections[sec];
    S.total++; if (r.Status === "Present") S.present++; if (r.Status === "Absent") S.absent++; if (r.Status === "OD") S.od++;
  });

  return {
    success: true,
    total, present, absent, od, attendancePercent,
    rows,
    deptSummary: deptMap
  };
}

// ---------------- DATE-WISE LOCK CONTROL ----------------
function getLockStatus(date) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(LOCK_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(LOCK_SHEET);
    sheet.appendRow(["Date", "Status"]);
  }
  const data = sheet.getDataRange().getValues();
  const targetIso = parseSheetDateCell(date);
  for (let i = 1; i < data.length; i++) {
    const dIso = parseSheetDateCell(data[i][0]);
    if (dIso === targetIso) return String(data[i][1]).toLowerCase() === "locked" ? "Locked" : "Unlocked";
  }
  return "Unlocked";
}

function setLockStatus(date, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(LOCK_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(LOCK_SHEET);
    sheet.appendRow(["Date", "Status"]);
  }
  const data = sheet.getDataRange().getValues();
  const targetIso = parseSheetDateCell(date);
  for (let i = 1; i < data.length; i++) {
    const dIso = parseSheetDateCell(data[i][0]);
    if (dIso === targetIso) {
      sheet.getRange(i + 1, 2).setValue(value);
      return { success: true, lock: value };
    }
  }
  sheet.appendRow([targetIso, value]);
  return { success: true, lock: value };
}

function isDateLocked(date) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOCK_SHEET);
  if (!sheet) return false;
  const data = sheet.getDataRange().getValues();
  const targetIso = parseSheetDateCell(date);
  if (!targetIso) return false;
  for (let i = 1; i < data.length; i++) {
    const dIso = parseSheetDateCell(data[i][0]);
    if (dIso === targetIso && String(data[i][1]).toLowerCase() === "locked") return true;
  }
  return false;
}

// ---------------- Get Student Seating (student view) ----------------
function handleGetStudentSeating(req) {
  const { email, date } = req;
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
  if (!userSheet) return { success: false, message: "Users sheet not found" };

  const users = userSheet.getDataRange().getValues();
  if (!users || users.length < 2) return { success: false, message: "No users found" };
  users.shift();

  const user = users.find(u => u[0] === email && u[3] === "Student");
  if (!user) return { success: false, message: "Student not found" };

  const studentRoll = user[5];
  const dept = user[4];

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEATING_SHEET);
  if (!sheet) return { success: false, message: "Seating sheet not found" };

  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { success: true, seating: [] };
  data.shift();

  const today = date ? String(date) : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const activeCfg = handleGetSystemConfig().config;

  const now = new Date();
  const batchAccessTime = { "FN": new Date(), "AN": new Date() };
  batchAccessTime["FN"].setHours(8, 30, 0, 0);
  batchAccessTime["AN"].setHours(13, 0, 0, 0);

  const rows = data
    .map(r => normalizeRowToObject(r))
    .filter(r => r.RollNo === studentRoll && r.Department === dept && r.Date === today &&
                 (!activeCfg.academicYear || !r.AcademicYear || r.AcademicYear === activeCfg.academicYear) &&
                 (!activeCfg.semester || !r.Semester || r.Semester === activeCfg.semester) &&
                 (!activeCfg.examNumber || !r.ExamNumber || r.ExamNumber === activeCfg.examNumber))
    .map(r => {
      const batch = r.Batch.toUpperCase();
      const canView = now >= (batchAccessTime[batch] || now);
      return canView ? r : { ...r, HallNo: "Locked", SeatNo: "Locked" };
    });

  return { success: true, seating: rows };
}

// ---------------- Upload Users ----------------
function handleUploadUsers(users) {
  try {
    if (!Array.isArray(users) || users.length === 0)
      return { success: false, message: "No users provided" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(USERS_SHEET) || ss.insertSheet(USERS_SHEET);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["email", "password", "Name", "Role", "Department", "Student Roll No"]);
    }

    const existingData = sheet.getDataRange().getValues();
    existingData.shift();
    const existingEmails = existingData.map(r => (r[0] || "").toLowerCase());

    const toAdd = [];

    users.forEach(u => {
      const email = (u.email || "").trim();
      const password = (u.password || "").trim();
      const name = (u.name || "").trim();
      const role = (u.role || "").trim();
      const dept = (u.department || "").trim();
      const roll = (u.studentRollNo || "").trim();

      if (!email || existingEmails.includes(email.toLowerCase())) return;

      toAdd.push([email, password, name, role, dept, roll]);
      existingEmails.push(email.toLowerCase());
    });

    if (toAdd.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, toAdd.length, toAdd[0].length).setValues(toAdd);
    }

    return { success: true, count: toAdd.length };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function handleUploadUsersOverwrite(users) {
  try {
    if (!Array.isArray(users) || users.length === 0)
      return { success: false, message: "No users provided" };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(USERS_SHEET) || ss.insertSheet(USERS_SHEET);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["email", "password", "Name", "Role", "Department", "Student Roll No"]);
    }

    const data = sheet.getDataRange().getValues();
    const headers = data.shift();
    const emailCol = headers.indexOf("email");

    let updated = 0, added = 0;

    users.forEach(u => {
      const email = (u.email || "").trim().toLowerCase();
      if (!email) return;

      const rowIndex = data.findIndex(r => (r[emailCol] || "").toLowerCase() === email);

      const newRow = [
        u.email || "",
        u.password || "",
        u.name || "",
        u.role || "",
        u.department || "",
        u.studentRollNo || ""
      ];

      if (rowIndex !== -1) {
        sheet.getRange(rowIndex + 2, 1, 1, newRow.length).setValues([newRow]);
        updated++;
      } else {
        sheet.appendRow(newRow);
        added++;
      }
    });

    return { success: true, count: updated + added, updated, added };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getStudentSeatingData(date, batch, department) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("StudentSeating");
  if (!sheet) return { success: false, message: "StudentSeating sheet not found" };
  const data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return { success: true, data: [] };
  const headers = data.shift();

  let targetFormatted = "";
  if (date) {
    if (date.includes("-")) {
      const parts = date.split("-");
      targetFormatted = parts.length === 3 && parts[0].length === 4 ? `${parts[0]}-${parts[1].padStart(2,"0")}-${parts[2].padStart(2,"0")}` : date;
    } else if (date.includes("/")) {
      const parts = date.split("/");
      if (parts.length === 3) {
        targetFormatted = parts[2].length === 4 ? `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}` : date;
      }
    }
  }

  const result = data
    .filter(r => {
      const rowDateIso = parseSheetDateCell(r[0]);
      const sheetBatch = String(r[2]).trim().toUpperCase();
      const sheetDept = String(r[1]).trim().toUpperCase();
      return (
        (!targetFormatted || rowDateIso === targetFormatted) &&
        (!batch || sheetBatch === batch.trim().toUpperCase()) &&
        (!department || sheetDept === department.trim().toUpperCase())
      );
    })
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = r[i]));
      return obj;
    });

  return { success: true, data: result };
}

// ---------------- Student Statistics Functions ----------------

function handleGetStudentStats(req) {
  try {
    const { email } = req;

    const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
    if (!userSheet) return { success: false, message: "Users sheet not found" };

    const users = userSheet.getDataRange().getValues();
    if (!users || users.length < 2) return { success: false, message: "No users found" };
    users.shift();

    const user = users.find(u => u[0] === email && u[3] === "Student");
    if (!user) return { success: false, message: "Student not found" };

    const studentRoll = user[5];
    const dept = user[4];

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEATING_SHEET);
    if (!sheet) return { success: false, message: "Seating sheet not found" };

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) {
      return {
        success: true,
        stats: {
          todayCount: 0,
          upcomingCount: 0,
          completedCount: 0,
          attendanceRate: 0,
          totalExams: 0,
          presentCount: 0
        }
      };
    }
    data.shift();

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const fnEnd = 12 * 60;
    const anEnd = 17 * 60;

    const studentExams = data
      .map(r => normalizeRowToObject(r))
      .filter(r => r.RollNo === studentRoll && r.Department === dept);

    let todayCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;
    let presentCount = 0;

    studentExams.forEach(r => {
      if (!r.Date) return;

      const examDate = new Date(r.Date);
      examDate.setHours(0, 0, 0, 0);
      const batch = (r.Batch || "").toUpperCase();

      if (examDate > today) {
        upcomingCount++;
      }
      else if (examDate < today) {
        completedCount++;
        if ((r.Status || "").toUpperCase() === "PRESENT") presentCount++;
      }
      else {
        if (batch === "FN") {
          if (currentMinutes >= fnEnd) {
            completedCount++;
            if ((r.Status || "").toUpperCase() === "PRESENT") presentCount++;
          } else {
            todayCount++;
          }
        }
        else if (batch === "AN") {
          if (currentMinutes >= anEnd) {
            completedCount++;
            if ((r.Status || "").toUpperCase() === "PRESENT") presentCount++;
          } else {
            todayCount++;
          }
        }
      }
    });

    const attendanceRate =
      completedCount === 0 ? 0 : Math.round((presentCount / completedCount) * 100);

    return {
      success: true,
      stats: {
        todayCount,
        upcomingCount,
        completedCount,
        attendanceRate,
        totalExams: studentExams.length,
        presentCount
      }
    };

  } catch (err) {
    return { success: false, message: err.message };
  }
}

function handleGetUpcomingExams(req) {
  try {
    const { email } = req;
    
    const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
    if (!userSheet) return { success: false, message: "Users sheet not found" };

    const users = userSheet.getDataRange().getValues();
    if (!users || users.length < 2) return { success: false, message: "No users found" };
    users.shift();

    const user = users.find(u => u[0] === email && u[3] === "Student");
    if (!user) return { success: false, message: "Student not found" };

    const studentRoll = user[5];
    const dept = user[4];

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEATING_SHEET);
    if (!sheet) return { success: false, message: "Seating sheet not found" };

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) return { success: true, exams: [] };
    data.shift();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingExams = data
      .map(r => normalizeRowToObject(r))
      .filter(r => {
        if (r.RollNo !== studentRoll || r.Department !== dept) return false;
        if (!r.Date) return false;
        const examDate = new Date(r.Date);
        examDate.setHours(0, 0, 0, 0);
        return examDate > today;
      })
      .sort((a, b) => {
        const dateA = new Date(a.Date);
        const dateB = new Date(b.Date);
        return dateA - dateB;
      });

    return { success: true, exams: upcomingExams };

  } catch (err) {
    return { success: false, message: err.message };
  }
}

function handleGetExamHistory(req) {
  try {
    const { email } = req;

    const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
    if (!userSheet) return { success: false, message: "Users sheet not found" };

    const users = userSheet.getDataRange().getValues();
    if (!users || users.length < 2) return { success: false, message: "No users found" };
    users.shift();

    const user = users.find(u => u[0] === email && u[3] === "Student");
    if (!user) return { success: false, message: "Student not found" };

    const studentRoll = user[5];
    const dept = user[4];

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SEATING_SHEET);
    if (!sheet) return { success: false, message: "Seating sheet not found" };

    const data = sheet.getDataRange().getValues();
    if (!data || data.length < 2) return { success: true, history: [] };
    data.shift();

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const fnEnd = 12 * 60;
    const anEnd = 17 * 60;

    const history = data
      .map(r => normalizeRowToObject(r))
      .filter(r => {
        if (r.RollNo !== studentRoll || r.Department !== dept) return false;
        if (!r.Date) return false;

        const examDate = new Date(r.Date);
        examDate.setHours(0, 0, 0, 0);
        const batch = (r.Batch || "").toUpperCase();

        if (examDate < today) return true;

        if (examDate.getTime() === today.getTime()) {
          if (batch === "FN" && currentMinutes >= fnEnd) return true;
          if (batch === "AN" && currentMinutes >= anEnd) return true;
        }

        return false;
      })
      .sort((a, b) => new Date(b.Date) - new Date(a.Date));

    return { success: true, history };

  } catch (err) {
    return { success: false, message: err.message };
  }
}