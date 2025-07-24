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
  console.log("🎨 Rendering roadmap:", {
    goal,
    target_role,
    why,
    timeframe,
    roadmap,
  });

  output.innerHTML = `
    <div class="summary">
      <h2>Your Roadmap for "${sanitize(goal)}"</h2>
      <p><strong>Target Role:</strong> ${sanitize(target_role)}</p>
      <p><strong>Why:</strong> ${sanitize(why)}</p>
      <p><strong>Timeline:</strong> ${sanitize(timeframe)}</p>
    </div>
    <div class="roadmap-container"></div>
  `;

  const container = output.querySelector(".roadmap-container");

  // Handle both nested (months/weeks) and flat structures
  if (!roadmap || !Array.isArray(roadmap)) {
    container.innerHTML = "<p>No roadmap data available.</p>";
    return;
  }

  roadmap.forEach((monthObj, index) => {
    const monthDiv = document.createElement("div");
    monthDiv.className = "month-block";

    // Handle both month structure and flat structure
    const monthNumber = monthObj.month || index + 1;
    const monthFocus = monthObj.focus || "Learning Phase";

    monthDiv.innerHTML = `
      <h3>📅 Month ${sanitize(monthNumber.toString())}</h3>
      ${
        monthObj.focus
          ? `<p><em>Focus: ${sanitize(monthObj.focus)}</em></p>`
          : ""
      }
    `;

    // Handle weeks structure
    if (monthObj.weeks && Array.isArray(monthObj.weeks)) {
      monthObj.weeks.forEach((weekObj) => {
        const weekDiv = document.createElement("div");
        weekDiv.className = "week-block";
        weekDiv.innerHTML = `<h4>Week ${sanitize(
          weekObj.week?.toString() || "TBD"
        )}</h4>`;

        (weekObj.tasks || []).forEach((task) => {
          const taskDiv = document.createElement("div");
          taskDiv.className = "task-item";
          taskDiv.innerHTML = `
            <p>• <strong>${sanitize(task.title)}</strong> 
               ${
                 task.estimated_time ? `(${sanitize(task.estimated_time)})` : ""
               }
            </p>
            ${
              task.description
                ? `<p class="task-description">${sanitize(
                    task.description
                  )}</p>`
                : ""
            }
          `;
          weekDiv.appendChild(taskDiv);
        });
        monthDiv.appendChild(weekDiv);
      });
    }
    // Handle flat tasks structure (fallback)
    else if (monthObj.tasks && Array.isArray(monthObj.tasks)) {
      monthObj.tasks.forEach((task) => {
        const taskDiv = document.createElement("div");
        taskDiv.className = "task-item";
        taskDiv.innerHTML = `
          <p>• <strong>${sanitize(task.title)}</strong> 
             ${task.estimated_time ? `(${sanitize(task.estimated_time)})` : ""}
          </p>
          ${
            task.description
              ? `<p class="task-description">${sanitize(task.description)}</p>`
              : ""
          }
        `;
        monthDiv.appendChild(taskDiv);
      });
    } else {
      // No tasks found
      monthDiv.innerHTML += "<p>No tasks defined for this month.</p>";
    }

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
    learning_speed: formData.get("learning_speed"), // Add this if you have it in your form
    skill_level: formData.get("skill_level"), // Add this if you have it in your form
    skills: formData.getAll("skills"),
  };

  console.log("📤 Sending request:", data);

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
      const errorText = await res.text();
      console.error("❌ API Error:", errorText);
      output.innerHTML = `<p>Error ${res.status}: ${res.statusText}</p>`;
      return;
    }

    const json = await res.json();
    console.log("📥 Response:", json);

    // FIX: Pass the roadmap object, not just json.roadmap
    if (json.roadmap) {
      renderRoadmap(json.roadmap);
    } else {
      output.innerHTML = "<p>No roadmap data received from server.</p>";
      console.error("❌ No roadmap in response:", json);
    }
  } catch (err) {
    console.error("❌ Request failed:", err);
    output.innerHTML =
      "<p>Something went wrong. Check console for details.</p>";
  }
});
