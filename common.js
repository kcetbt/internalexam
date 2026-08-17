const API_BASE = "https://script.google.com/macros/s/AKfycbyYjebp-1_bMooq7zKk8U0PbFLcEc0ICWYaIrA4LZs09ybFvRawJDRmUzRZ4WOdceQ9Cw/exec";

async function apiFetch(payload) {
  // payload is an object with at least `action` property
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      //headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error("apiFetch error:", err);
    return { success: false, message: "Network / fetch error: " + err.message };
  }
}

function requireRole(role) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user || user.role !== role) {
    // Not authorized — redirect to login
    alert("You must login as " + role + " to access this page.");
    window.location.href = "login.html";
    return null;
  }
  return user;
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

/* ================================================================
   DEPARTMENT MAPPING & GLOBAL CONFIGURATION SYSTEM
   ================================================================ */
const DEPT_MAP = {
  "CSE": "COMPUTER SCIENCE AND ENGINEERING",
  "ECE": "ELECTRONICS AND COMMUNICATION ENGINEERING",
  "EEE": "ELECTRICAL AND ELECTRONICS ENGINEERING",
  "IT": "INFORMATION TECHNOLOGY",
  "ME": "MECHANICAL ENGINEERING",
  "CE": "CIVIL ENGINEERING",
  "BT": "BIOTECHNOLOGY",
  "ADS": "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE",
  "FY": "FIRST YEAR DEPARTMENT"
};

function getDepartmentFullName(deptCode) {
  if (!deptCode) return "DEPARTMENT";
  const code = String(deptCode).trim().toUpperCase();
  return DEPT_MAP[code] || code;
}

function getCurrentSemester(nowDate = new Date()) {
  const month = nowDate.getMonth(); // 0-indexed: June (5) to Nov (10) = ODD, Dec (11) to May (4) = EVEN
  return (month >= 5 && month <= 10) ? "ODD" : "EVEN";
}

async function getExamConfigFromBackend() {
  const res = await apiFetch({ action: "getSystemConfig" });
  if (res && res.success && res.config) {
    return res.config;
  }
  return { academicYear: getCurrentAcademicYear(), semester: getCurrentSemester(), examNumber: "I" };
}

async function saveExamConfigToBackend(cfg) {
  const res = await apiFetch({ action: "setSystemConfig", config: cfg });
  return res;
}

function getCurrentAcademicYear(nowDate = new Date()) {
  const year = nowDate.getFullYear();
  const month = nowDate.getMonth(); // 0-indexed (5 = June)
  const startYear = month >= 5 ? year : year - 1;
  const shortNext = String(startYear + 1).slice(-2);
  return `${startYear}-${shortNext}`;
}

function generateAcademicYearList(nowDate = new Date()) {
  const currentAY = getCurrentAcademicYear(nowDate);
  const startYear = 2026;
  const endYear = parseInt(currentAY.split("-")[0]);
  const list = [];
  const maxYear = Math.max(startYear, endYear);
  for (let y = startYear; y <= maxYear; y++) {
    const nextShort = String(y + 1).slice(-2);
    list.push(`${y}-${nextShort}`);
  }
  return { list, currentAY };
}







