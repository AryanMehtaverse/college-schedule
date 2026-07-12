// =====================================================================
// College Schedule — script.js
// Vanilla JS. No frameworks, no build step.
// =====================================================================

// ===== Timetable data =====
const timetable = {
  Monday:    { start: "10:00 AM", break: null,                  end: "2:00 PM" },
  Tuesday:   { start: "10:00 AM", break: null,                  end: "2:00 PM" },
  Wednesday: { start: "8:00 AM",  break: "10:00 AM - 12:00 PM", end: "2:00 PM" },
  Thursday:  { start: "10:00 AM", break: null,                  end: "12:00 PM" },
  Friday:    { start: "9:00 AM",  break: "10:00 AM - 12:00 PM", end: "4:00 PM" },
  Saturday:  null,
  Sunday:    null
};

// ===== Holidays =====
// Add more holidays here any time — { date: "YYYY-MM-DD", name: "..." }
const holidays = [
  { date: "2026-08-15", name: "Independence Day" },
  { date: "2026-10-02", name: "Gandhi Jayanti" },
  { date: "2026-12-25", name: "Christmas" }
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDERED_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const VIEWS = ["today", "next", "weekly", "holidays"];

// ===== Date helpers =====

// Local YYYY-MM-DD (avoids UTC off-by-one from toISOString)
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function findHoliday(date) {
  const key = toDateKey(date);
  return holidays.find((h) => h.date === key) || null;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday, Saturday
}

function isCollegeDay(date) {
  const dayName = DAY_NAMES[date.getDay()];
  return timetable[dayName] !== null && !isWeekend(date) && !findHoliday(date);
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function formatShortDate(date) {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long" });
}

// Walks forward from `startOffset` days until it finds a valid college day.
function getNextCollegeDay(startOffset) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + startOffset);

  let guard = 0;
  while (!isCollegeDay(d) && guard < 365) {
    d.setDate(d.getDate() + 1);
    guard++;
  }
  return d;
}

// ===== Rendering: schedule card =====
function fillScheduleCard(prefix, date) {
  const dayName = DAY_NAMES[date.getDay()];
  const data = timetable[dayName];

  document.getElementById(`${prefix}DayName`).textContent = dayName;
  const dateEl = document.getElementById(`${prefix}Date`) || document.getElementById(`${prefix}DayDate`);
  if (dateEl) dateEl.textContent = formatDate(date);

  const startEl = document.getElementById(`${prefix}Start`);
  const breakEl = document.getElementById(`${prefix}Break`);
  const endEl = document.getElementById(`${prefix}End`);

  startEl.textContent = data ? data.start : "No College";
  endEl.textContent = data ? data.end : "No College";

  if (data && data.break) {
    breakEl.textContent = data.break;
    breakEl.classList.remove("no-break");
  } else {
    breakEl.textContent = "No Break";
    breakEl.classList.add("no-break");
  }
}

// ===== Rendering: Today view =====
function renderToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const holiday = findHoliday(today);
  const dayName = DAY_NAMES[today.getDay()];
  const grid = document.getElementById("todayInfoGrid");
  const card = document.getElementById("todayCard");

  document.getElementById("todayDayName").textContent = dayName;
  document.getElementById("todayDate").textContent = formatDate(today);

  // Remove any previous status message
  const existingStatus = card.querySelector(".status-message");
  if (existingStatus) existingStatus.remove();

  if (holiday) {
    grid.classList.add("hidden");
    insertStatusMessage(card, `🎉 Today is a Holiday`, holiday.name);
    return;
  }

  if (isWeekend(today) || timetable[dayName] === null) {
    grid.classList.add("hidden");
    insertStatusMessage(card, "No College Today", "Enjoy your day off!");
    return;
  }

  grid.classList.remove("hidden");
  fillScheduleCard("today", today);
}

function insertStatusMessage(card, title, sub) {
  const wrap = document.createElement("div");
  wrap.className = "status-message";
  wrap.innerHTML = `
    <p class="status-icon">📅</p>
    <p class="status-title">${title}</p>
    <p class="status-sub">${sub}</p>
  `;
  card.appendChild(wrap);
}

// ===== Rendering: Next College Day view =====
function renderNextDay() {
  const banner = document.getElementById("skipBanner");
  const bannerIcon = document.getElementById("skipBannerIcon");
  const bannerTitle = document.getElementById("skipBannerTitle");
  const bannerSub = document.getElementById("skipBannerSub");

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowHoliday = findHoliday(tomorrow);
  const tomorrowIsWeekend = isWeekend(tomorrow);

  if (tomorrowHoliday) {
    banner.classList.remove("hidden");
    bannerIcon.textContent = "🎉";
    bannerTitle.textContent = "Tomorrow is a Holiday";
    bannerSub.textContent = `${tomorrowHoliday.name} — ${formatShortDate(tomorrow)}`;
  } else if (tomorrowIsWeekend) {
    banner.classList.remove("hidden");
    bannerIcon.textContent = "🛌";
    bannerTitle.textContent = "No College Tomorrow";
    bannerSub.textContent = DAY_NAMES[tomorrow.getDay()];
  } else {
    banner.classList.add("hidden");
  }

  // Next college day search starts tomorrow
  const nextDay = getNextCollegeDay(1);
  fillScheduleCard("next", nextDay);
}

// ===== Rendering: Weekly Timetable view =====
function renderWeeklyTable() {
  const tbody = document.getElementById("weeklyTableBody");
  tbody.innerHTML = "";
  const todayName = DAY_NAMES[new Date().getDay()];

  ORDERED_DAYS.forEach((day) => {
    const data = timetable[day];
    const tr = document.createElement("tr");
    if (day === todayName) tr.classList.add("current-day");
    if (data === null) tr.classList.add("weekend-row");

    const start = data ? data.start : "No College";
    const end = data ? data.end : "No College";
    const breakText = data && data.break ? data.break : "No Break";
    const breakClass = !data || !data.break ? "no-break-cell" : "";

    tr.innerHTML = `
      <td>${day}</td>
      <td>${start}</td>
      <td class="${breakClass}">${breakText}</td>
      <td>${end}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== Rendering: Holidays view =====
function renderHolidays() {
  const list = document.getElementById("holidayList");
  const emptyState = document.getElementById("noHolidays");
  list.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toDateKey(today);

  const upcoming = holidays
    .filter((h) => h.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  upcoming.forEach((h) => {
    const d = new Date(`${h.date}T00:00:00`);
    const card = document.createElement("div");
    card.className = "glass-card holiday-card";
    card.innerHTML = `
      <div class="holiday-icon">🎊</div>
      <div class="holiday-info">
        <span class="holiday-name">${h.name}</span>
        <span class="holiday-date">${formatDate(d)}</span>
        <span class="holiday-weekday">${DAY_NAMES[d.getDay()]}</span>
      </div>
    `;
    list.appendChild(card);
  });
}

// ===== View switching =====
let currentView = "next";

function switchView(view) {
  currentView = view;

  VIEWS.forEach((v) => {
    const el = document.getElementById(`${v === "today" ? "today" : v === "next" ? "next" : v === "weekly" ? "weekly" : "holidays"}View`);
    el.classList.add("hidden");
  });

  const activeEl = document.getElementById(`${view === "today" ? "today" : view === "next" ? "next" : view === "weekly" ? "weekly" : "holidays"}View`);
  activeEl.classList.remove("hidden");
  activeEl.style.animation = "none";
  void activeEl.offsetWidth;
  activeEl.style.animation = "";

  if (view === "today") renderToday();
  if (view === "next") renderNextDay();
  if (view === "weekly") renderWeeklyTable();
  if (view === "holidays") renderHolidays();

  updateTabUI(view);
}

function updateTabUI(view) {
  const buttons = document.querySelectorAll(".tab-btn");
  const indicator = document.getElementById("tabIndicator");

  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  const index = VIEWS.indexOf(view);
  indicator.style.transform = `translateX(${index * 100}%)`;
}

// ===== Live clock + greeting =====
function updateClock() {
  const now = new Date();

  document.getElementById("clock").textContent = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  document.getElementById("dateLine").textContent =
    `${DAY_NAMES[now.getDay()]}, ${formatDate(now)}`;

  const hour = now.getHours();
  let greeting;
  if (hour < 12) greeting = "Good Morning 🌞";
  else if (hour < 17) greeting = "Good Afternoon ☀️";
  else greeting = "Good Evening 🌙";
  document.getElementById("greeting").textContent = greeting;
}

// ===== Theme =====
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("themeIcon").textContent = theme === "light" ? "🌙" : "☀️";
  localStorage.setItem("scheduleTheme", theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
}

// ===== Init =====
function init() {
  const savedTheme = localStorage.getItem("scheduleTheme") || "dark";
  applyTheme(savedTheme);

  updateClock();
  setInterval(updateClock, 1000);

  switchView("next"); // Next College Day is the default view

  document.getElementById("tabBar").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    switchView(btn.dataset.view);
  });

  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
}

document.addEventListener("DOMContentLoaded", init);
