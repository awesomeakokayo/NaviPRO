// tasks.js

console.log("🤖 tasks.js loaded");

const ROADMAP_URL = "http://127.0.0.1:8000/api/roadmap";
const DEFAULT_GOAL = "Become a product designer";

// Storage keys
const STORAGE = {
  goal: "dailyTask_goal",
  currentTaskDate: "dailyTask_date",
  currentTaskIndex: "dailyTask_index",
  cachedRoadmap: "dailyTask_roadmap", // sessionStorage
  lastFetch: "dailyTask_lastFetch", // sessionStorage date
};

window.addEventListener("DOMContentLoaded", () => {
  loadDailyTask().catch(showError);
});

async function loadDailyTask() {
  // 1️⃣ Fetch or reuse cached roadmap for today
  const today = new Date().toISOString().slice(0, 10);
  let data;
  if (sessionStorage.getItem(STORAGE.lastFetch) === today) {
    data = JSON.parse(sessionStorage.getItem(STORAGE.cachedRoadmap) || "{}");
  }
  if (!data || !data.roadmap) {
    const res = await fetch(ROADMAP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: getStoredGoal() }),
    });
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    data = await res.json();
    sessionStorage.setItem(STORAGE.lastFetch, today);
    sessionStorage.setItem(STORAGE.cachedRoadmap, JSON.stringify(data));
  }

  // 2️⃣ Use the fetched data's goal
  const goal = data.goal || DEFAULT_GOAL;
  localStorage.setItem(STORAGE.goal, goal);

  // 3️⃣ Flatten roadmap into tasks
  const tasks = [];
  (data.roadmap || []).forEach((month) => {
    (month.weeks || []).forEach((week) => {
      (week.tasks || []).forEach((task) => tasks.push(task));
    });
  });
  if (!tasks.length) throw new Error("No tasks available");

  // 4️⃣ Determine today's index, advancing only once per day
  const lastDate = localStorage.getItem(STORAGE.currentTaskDate);
  let index = parseInt(
    localStorage.getItem(STORAGE.currentTaskIndex) || "0",
    10
  );
  if (lastDate !== today) {
    // new day, keep index (show next pending) and update date
    localStorage.setItem(STORAGE.currentTaskDate, today);
  }
  index = Math.min(index, tasks.length - 1);
  localStorage.setItem(STORAGE.currentTaskIndex, index);

  // 5️⃣ Render the one daily task
  renderDailyTask(tasks, index, goal);
}

function renderDailyTask(tasks, idx, overallGoal) {
  const container = document.getElementById("daily-tasks-list");
  container.innerHTML = "";

  if (idx >= tasks.length) {
    container.innerHTML = "<li>🎉 All tasks complete! Come back tomorrow.</li>";
    return;
  }

  const task = tasks[idx];
  const card = document.createElement("div");
  card.className = "task-card";
  card.innerHTML = `
    <div class="card-content">
      <h3>Today's Task</h3>
      <div class="task-row">
        <span class="icon">🗓️</span>
        <strong>Task :</strong> ${sanitize(task.title)}
      </div>
      <div class="task-row">
        <span class="icon">✅</span>
        <strong>Goal :</strong> ${sanitize(overallGoal)}
      </div>
      <div class="task-row">
        <span class="icon">⏰</span>
        <strong>Estimated time :</strong> ${sanitize(
          task.estimated_time || "30 mins"
        )}
      </div>
      <div class="task-actions">
        <button id="completeBtn">✔️ Mark complete</button>
      </div>
      <div class="navi-message">
        Navi : <span style="color: orange;">${getMotivationalQuote(idx)}</span>
      </div>
    </div>
  `;
  container.appendChild(card);

  document.getElementById("completeBtn").addEventListener("click", () => {
    const today = new Date().toISOString().slice(0, 10);
    // only advance once per day
    if (localStorage.getItem(STORAGE.currentTaskDate) === today) {
      const next = idx + 1;
      localStorage.setItem(STORAGE.currentTaskIndex, next);
      renderDailyTask(tasks, next, overallGoal);
    }
  });
}

function getStoredGoal() {
  return localStorage.getItem(STORAGE.goal) || DEFAULT_GOAL;
}

function getMotivationalQuote(i) {
  const quotes = [
    "Let’s build momentum – one step at a time.",
    "Nice! Keep it going – you're leveling up.",
    "You're halfway there – time to see design through the user’s lens.",
    "You're doing great – next task sharpens your edge.",
    "Final stretch! Bring your A-game.",
  ];
  return quotes[i % quotes.length];
}

function showError(err) {
  console.error("Daily tasks error:", err);
  document.getElementById(
    "daily-tasks-list"
  ).innerHTML = `<li>Could not load today's task: ${sanitize(
    err.message
  )}</li>`;
}

function sanitize(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
