// script.js

// Grab elements
const form = document.getElementById("onboardingForm");
const output = document.getElementById("roadmapOutput");

// Helper: sanitize text in HTML
function sanitize(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Collect radio value by name
function getRadioValue(name) {
  const checked = form.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : "";
}

// Collect all checkbox values by name
function getCheckboxValues(name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(
    (cb) => cb.value
  );
}

// Render the roadmap data into #roadmapOutput
function renderRoadmap({ goal, target_role, why, timeframe, roadmap }) {
  output.innerHTML = `
    <div class="summary">
      <h2>Your Roadmap for “${sanitize(goal)}”</h2>
      <p><strong>Target Role:</strong> ${sanitize(target_role)}</p>
      <p><strong>Why:</strong> ${sanitize(why)}</p>
      <p><strong>Timeline:</strong> ${sanitize(timeframe)}</p>
    </div>
    <div class="roadmap-container"></div>
  `;

  const container = output.querySelector(".roadmap-container");
  roadmap.forEach((monthObj) => {
    const monthDiv = document.createElement("div");
    monthDiv.className = "month-block";
    monthDiv.innerHTML = `
      <h3>🗖 Month ${sanitize(monthObj.month)}</h3>
    `;
    (monthObj.weeks || []).forEach((weekObj) => {
      const weekDiv = document.createElement("div");
      weekDiv.className = "week-block";
      weekDiv.innerHTML = `<h4>Week ${sanitize(weekObj.week)}</h4>`;
      (weekObj.tasks || []).forEach((task) => {
        const taskDiv = document.createElement("div");
        taskDiv.className = "task-item";
        taskDiv.innerHTML = `
          <p>• <strong>${sanitize(task.title)}</strong> (${sanitize(
          task.estimated_time
        )})</p>
        `;
        // optional videos
        if (Array.isArray(task.videos) && task.videos.length) {
          const ul = document.createElement("ul");
          ul.className = "task-videos";
          task.videos.forEach((v) => {
            ul.innerHTML += `
              <li>
                <a href="${sanitize(v.url)}" target="_blank">
                  🎥 ${sanitize(v.title)} (${sanitize(
              formatDuration(v.duration)
            )}) — ${sanitize(v.channel)}
                </a>
              </li>
            `;
          });
          taskDiv.appendChild(ul);
        }
        weekDiv.appendChild(taskDiv);
      });
      monthDiv.appendChild(weekDiv);
    });
    container.appendChild(monthDiv);
  });
}

// Main form handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  output.innerHTML = "<p>Loading roadmap…</p>";

  const formData = new FormData(form);
  const data = {
    goal: formData.get("goal"),
    target_role: formData.get("target_role"),
    why: formData.get("why"),
    timeframe: formData.get("timeframe"),
    hours_per_week: formData.get("hours_per_week"),
    learning_style: formData.get("learning_style"),
    skills: formData.getAll("skills"),
  };

  // validation
  if (!data.goal || !data.why || !data.timeframe) {
    output.innerHTML = "<p>Please fill out all required fields.</p>";
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:8000/api/full_pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      output.innerHTML = `<p>Error ${res.status}: ${res.statusText}</p>`;
      return;
    }

    const json = await res.json();
    console.log("↩️ Response:", json);
    renderRoadmap(json.roadmap);
  } catch (err) {
    console.error(err);
    output.innerHTML = "<p>Something went wrong.</p>";
  }
});
