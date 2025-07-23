// script.js

// 1) Nav‑button active state
const navButtons = document.querySelectorAll(".nav-button");
navButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  })
);

// 2) Chart.js initializations
function initCharts() {
  // Momentum tracker (stacked bar)
  const mctx = document.getElementById("momentumChart").getContext("2d");
  new Chart(mctx, {
    type: "bar",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Completed work",
          data: [4.5, 6.5, 2.5, 5, 3, 0, 0],
          backgroundColor: "#264653",
          stack: "a",
        },
        {
          label: "Proposed effort",
          data: [1.5, 2, 1, 2, 2, 8, 6],
          backgroundColor: "#f4a261",
          stack: "a",
          borderRadius: { topLeft: 5, topRight: 5 },
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 10,
          ticks: { stepSize: 2 },
        },
      },
    },
  });

  // Overall progress doughnut
  const pctx = document.getElementById("progressChart").getContext("2d");
  new Chart(pctx, {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: [8, 12, 20],
          backgroundColor: ["#2ecc71", "#264653", "#b0b0b0"],
          cutout: "75%",
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: { tooltip: { enabled: false }, legend: { display: false } },
    },
    plugins: [
      {
        id: "centerText",
        beforeDraw(chart) {
          const { width, height, ctx } = chart;
          const text = "49%";
          ctx.save();
          ctx.font = `${(height / 5).toFixed(2)}px 'Segoe UI'`;
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#000";
          const x = (width - ctx.measureText(text).width) / 2;
          const y = height / 2;
          ctx.fillText(text, x, y);
          ctx.restore();
        },
      },
    ],
  });
}

// 3) Daily Task generator
const ROADMAP_URL = "http://127.0.0.1:8000/api/roadmap";

async function loadDailyTask() {
  // Fetch or reuse today's roadmap
  const today = new Date().toISOString().slice(0, 10);
  let roadmapData =
    sessionStorage.getItem("roadmap_last") === today
      ? JSON.parse(sessionStorage.getItem("roadmap_cache"))
      : null;

  if (!roadmapData) {
    const res = await fetch(ROADMAP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal: null }), // backend will default appropriately
    });
    if (!res.ok) throw new Error("Could not fetch roadmap");
    roadmapData = await res.json();
    sessionStorage.setItem("roadmap_cache", JSON.stringify(roadmapData));
    sessionStorage.setItem("roadmap_last", today);
  }

  // Flatten to a single list of tasks
  const tasks = [];
  (roadmapData.roadmap || []).forEach((m) =>
    (m.weeks || []).forEach((w) =>
      (w.tasks || []).forEach((t) => tasks.push(t))
    )
  );
  if (!tasks.length) throw new Error("No tasks in roadmap");

  // Determine current index
  let idx = parseInt(localStorage.getItem("task_index") || "0", 10);
  idx = Math.min(idx, tasks.length - 1);
  localStorage.setItem("task_index", idx);

  renderTask(tasks[idx], roadmapData.goal);
}

function renderTask(task, goal) {
  const taskList = document.querySelector(".task .task-list");
  taskList.innerHTML = `
    <span class="task-lists">
      <img class="first-icon" width="25" height="25" src="https://img.icons8.com/?size=100&id=rA9oA5mjJS1I&format=png&color=FFFFFF"/>
      Task: <b>${sanitize(task.title)}</b>
    </span>
    <span class="task-lists">
      <img class="second-icon" width="25" height="25" src="https://img.icons8.com/?size=100&id=11751&format=png&color=FFFFFF"/>
      Goal: ${sanitize(goal)}
    </span>
    <span class="task-lists1">
      <span class="task-lists">
        <img class="third-icon" width="25" height="25" src="https://img.icons8.com/?size=100&id=82767&format=png&color=FFFFFF"/>
        Estimated time: ${sanitize(task.estimated_time || "30 mins")}
      </span>
      <span class="task-lists">
        <button class="done" id="completeBtn">
          <img width="15" height="15" src="https://img.icons8.com/?size=100&id=15478&format=png&color=40C057"/> Done
        </button>
      </span>
    </span>
  `;

  document.getElementById("completeBtn").addEventListener("click", () => {
    // Advance immediately on click
    let next = parseInt(localStorage.getItem("task_index") || "0", 10) + 1;
    localStorage.setItem("task_index", next);
    loadDailyTask().catch(showError);
  });
}

// 4) Video recommendations
async function loadCourses(query = "software engineering for beginners") {
  const container = document.querySelector(".recommendations");
  container.innerHTML = ""; // clear

  try {
    const res = await fetch(
      `http://127.0.0.1:8000/api/search_videos?query=${encodeURIComponent(
        query
      )}`
    );
    if (!res.ok) throw new Error("Failed to fetch courses");
    const list = await res.json();
    if (!Array.isArray(list) || !list.length) {
      container.innerHTML = `<p>No courses found.</p>`;
      return;
    }
    list.forEach((c) => {
      const el = document.createElement("span");
      el.className = "video-content";
      el.innerHTML = `
        <span>
          <a href="${c.url}" target="_blank">
            <img class="video-cover" width="80" height="50" src="${
              c.thumbnail
            }" alt="">
          </a>
        </span>
        <span class="video-about">
          <span class="video-title">
            <a href="${c.url}" target="_blank">${sanitize(c.title)}</a>
          </span>
          <span class="video-detail">
            <span class="author-duration">
              <span class="video-author">${sanitize(c.channel)} • </span>
              <span class="video-duration">${sanitize(
                formatDuration(c.duration)
              )} • </span>
            </span>
            <span class="source">
              <img width="25" height="15" src="https://png.pngtree.com/png-vector/20221018/ourmid/pngtree-youtube-social-media-icon-png-image_6315995.png"/>
            </span>
          </span>
        </span>
        <span class="ratings">
          <span class="star">
            <img width="15" height="15" src="https://img.icons8.com/?size=100&id=MVWV8hpGIZqp&format=png&color=FD7E14"/>
          </span>
          <span class="rating">${sanitize(c.views)}</span>
        </span>
      `;
      container.appendChild(el);
    });
  } catch (e) {
    console.error(e);
    document.querySelector(
      ".recommendations"
    ).innerHTML = `<p>Could not load courses.</p>`;
  }
}


// Helpers & entrypoint

function sanitize(str = "") {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}
function formatDuration(iso = "") {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const [, h, min, s] = m;
  return `${h ? h + "h " : ""}${min ? min + "m " : ""}${
    s ? s + "s" : ""
  }`.trim();
}
function showError(err) {
  console.error("Error:", err);
}

// Initialize everything on load
window.addEventListener("DOMContentLoaded", () => {
  initCharts();
  loadDailyTask().catch(showError);
  loadCourses();
});
