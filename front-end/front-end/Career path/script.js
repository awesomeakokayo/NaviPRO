// script.js

const loadBtn = document.getElementById("loadBtn");
const form    = document.getElementById("onboardingForm");
const output  = document.getElementById("roadmapOutput");

loadBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  output.innerHTML = "<p>Loading roadmap…</p>";

  // 1. Collect inputs
  const inputs = Object.fromEntries(new FormData(form).entries());
  console.log("▶️ Inputs:", inputs);
  if (!inputs.goal?.trim()) {
    output.innerHTML = "<p>Please enter your career goal.</p>";
    return;
  }

  try {
    // 2. Fetch
    const res  = await fetch("http://127.0.0.1:8000/api/roadmap", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(inputs),
    });
    const text = await res.text();
    console.log(`⬅️ Status ${res.status}`, text);

    if (!res.ok) {
      output.innerHTML = `<p>Error ${res.status}: ${res.statusText}</p>`;
      return;
    }

    const wrapper = JSON.parse(text);
    console.log("🧪 Parsed response:", wrapper);

    // 3. Normalize shape
    let goal      = wrapper.goal;
    let timeframe = wrapper.timeframe;
    let roadmap   = [];

    if (Array.isArray(wrapper.roadmap)) {
      // case: { goal, timeframe, roadmap: [...] }
      roadmap = wrapper.roadmap;
    } else if (
      wrapper.roadmap &&
      Array.isArray(wrapper.roadmap.roadmap)
    ) {
      // case: { roadmap: { goal, timeframe, roadmap: [...] } }
      goal      = wrapper.roadmap.goal   || goal;
      timeframe = wrapper.roadmap.timeframe || timeframe;
      roadmap   = wrapper.roadmap.roadmap;
    } else {
      // fallback: no recognizable roadmap array
      console.warn("No array found in response, defaulting to empty");
    }

    // 4. Render
    renderRoadmap({ goal, timeframe, roadmap });

  } catch (err) {
    console.error("Error loading roadmap:", err);
    output.innerHTML = "<p>Something went wrong.</p>";
  }
});


function renderRoadmap({ goal, timeframe, roadmap }) {
  output.innerHTML = "";

  // 🎯 Goal
  output.insertAdjacentHTML("beforeend", `
    <div class="goal">
      🎯 <strong>Goal:</strong> ${sanitize(goal)}
    </div>
  `);

  // ⏳ Timeframe (if present)
  if (timeframe) {
    output.insertAdjacentHTML("beforeend", `
      <div class="timeframe">
        ⏳ <strong>Timeframe:</strong> ${sanitize(timeframe)}
      </div>
    `);
  }

  // If no roadmap items, show a message
  if (!Array.isArray(roadmap) || !roadmap.length) {
    output.insertAdjacentHTML("beforeend", `<p>No roadmap data available.</p>`);
    return;
  }

  // 📆 Iterate months
  roadmap.forEach(monthObj => {
    const monthDiv = document.createElement("div");
    monthDiv.className = "month-block";

    monthDiv.insertAdjacentHTML("beforeend", `
      <div class="month-title">
        📆 Month ${sanitize(monthObj.month)}${monthObj.title ? `: ${sanitize(monthObj.title)}` : ""}
      </div>
    `);

    // 🗓️ Iterate weeks
    (monthObj.weeks || []).forEach(weekObj => {
      const weekDiv = document.createElement("div");
      weekDiv.className = "week-block";

      weekDiv.insertAdjacentHTML("beforeend", `
        <div class="week-title">
          Week ${sanitize(weekObj.week)}
        </div>
      `);

      // ✅ Iterate tasks
      (weekObj.tasks || []).forEach(task => {
        const taskDiv = document.createElement("div");
        taskDiv.className = "task";

        taskDiv.insertAdjacentHTML("beforeend", `
          <div class="task-title">• ${sanitize(task.title)}</div>
        `);

        // 🎥 Optional videos
        if (Array.isArray(task.videos)) {
          const vids = document.createElement("ul");
          vids.className = "task-videos";
          task.videos.forEach(v => {
            vids.insertAdjacentHTML("beforeend", `
              <li>
                <a href="${sanitize(v.url)}" target="_blank">
                  🎥 ${sanitize(v.title)} (${sanitize(formatDuration(v.duration))}) — ${sanitize(v.channel)}
                </a>
              </li>
            `);
          });
          taskDiv.appendChild(vids);
        }

        weekDiv.appendChild(taskDiv);
      });

      monthDiv.appendChild(weekDiv);
    });

    output.appendChild(monthDiv);
  });
}

// ─── Helpers ──────────────────────────────────

function sanitize(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDuration(iso = "") {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const [, h, min, s] = m;
  return `${h ? h+"h " : ""}${min ? min+"m " : ""}${s ? s+"s" : ""}`.trim();
}
