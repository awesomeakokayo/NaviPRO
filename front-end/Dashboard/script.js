// Add this at the top of your file
let progressChart = null;
let momentumChart = null;

// 1) Nav‑button active state
const navButtons = document.querySelectorAll(".nav-button");
navButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  })
);


//  USER PROGRESS TRACKING

/**
 * Get user's overall progress
 */
async function getUserProgress() {
    if (!currentUserId) {
        console.error("No user ID available");
        return null;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/user_progress/${currentUserId}`);
        
        if (response.ok) {
            const progressData = await response.json();
            return progressData;
            /*
            Returns:
            {
                "goal": "Land my first job",
                "total_tasks": 60,
                "completed_tasks": 5,
                "completion_percentage": 8.3,
                "current_month": 1,
                "current_week": 1,
                "current_day": 6,
                "start_date": "2024-01-15T10:00:00"
            }
            */
        } else {
            console.error("Failed to get user progress");
            return null;
        }
    } catch (error) {
        console.error("Error fetching progress:", error);
        return null;
    }
}

/**
 * Display user progress
 */
async function displayUserProgress() {
    const progress = await getUserProgress();
    
    if (!progress) {
        document.getElementById('progressContainer').innerHTML = 
            '<p>Progress data not available.</p>';
        return;
    }

    document.getElementById('progressContainer').innerHTML = `
        <div class="progress-section">
            <h3>📊 Your Learning Progress</h3>
            <p><strong>Goal:</strong> ${progress.goal}</p>
            
            <div class="progress-stats">
                <div class="stat-item">
                    <h4>${progress.completed_tasks}</h4>
                    <p>Tasks Completed</p>
                </div>
                <div class="stat-item">
                    <h4>${progress.total_tasks}</h4>
                    <p>Total Tasks</p>
                </div>
                <div class="stat-item">
                    <h4>${progress.completion_percentage}%</h4>
                    <p>Complete</p>
                </div>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress.completion_percentage}%"></div>
            </div>
            
            <div class="current-position">
                <p><strong>Current Position:</strong> Month ${progress.current_month}, Week ${progress.current_week}, Day ${progress.current_day}</p>
                <p><strong>Started:</strong> ${new Date(progress.start_date).toLocaleDateString()}</p>
            </div>
        </div>
    `;
}

async function initCharts() {
    console.log("Initializing charts...");

    const progressCanvas = document.getElementById("progressChart");
    const momentumCanvas = document.getElementById("momentumChart");

    if (!progressCanvas || !momentumCanvas) {
        console.error("Canvas elements not found!", {
            progressCanvas: !!progressCanvas,
            momentumCanvas: !!momentumCanvas
        });
        return;
    }

    // Set default values
    const chartData = {
        completedTasks: 8,
        inProgressTasks: 12,
        upcomingTasks: 20
    };

    // Clean up existing charts
    if (progressChart) progressChart.destroy();
    if (momentumChart) momentumChart.destroy();

    // Initialize progress chart with center text
    progressChart = new Chart(progressCanvas.getContext('2d'), {
        type: "doughnut",
        data: {
            datasets: [{
                data: [chartData.completedTasks, chartData.inProgressTasks, chartData.upcomingTasks],
                backgroundColor: ["#2ecc71", "#264653", "#b0b0b0"],
                cutout: "75%",
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: { enabled: false },
                legend: { display: false }
            }
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: function(chart) {
                const width = chart.width;
                const height = chart.height;
                const ctx = chart.ctx;
                
                ctx.restore();
                
                // Calculate percentage
                const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                const completed = chart.data.datasets[0].data[0];
                const percentage = Math.round((completed / total) * 100);
                
                // Font size relative to chart size
                const fontSize = (height / 8).toFixed(2);
                ctx.font = `bold ${fontSize}px Poppins`;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                
                // Draw percentage
                const text = `${percentage}%`;
                const textX = width / 2;
                const textY = height / 2;
                
                ctx.fillStyle = '#1B455B';
                ctx.fillText(text, textX, textY);
                
                ctx.save();
            }
        }]
    });

    // Initialize momentum chart
    momentumChart = new Chart(momentumCanvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
                {
                    label: "Completed work",
                    data: [4.5, 6.5, 2.5, 5, 3, 0, 0],
                    backgroundColor: "#264653",
                    stack: "a",
                    barThickness: 30,
                },
                {
                    label: "Proposed effort",
                    data: [1.5, 2, 1, 2, 2, 7, 6],
                    backgroundColor: "#f4a261",
                    stack: "a",
                    borderRadius: { topLeft: 5, topRight: 5 },
                    barThickness: 30,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    display: false 
                }
            },
            scales: {
                x: { 
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 14,
                            family: 'Poppins'
                        },
                        color: '#666'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 8,
                    ticks: { 
                        stepSize: 2,
                        font: {
                            size: 20,
                            family: 'Poppins'
                        },
                        color: '#666',
                        padding: 10
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                },
            },
            layout: {
                padding: {
                    top: 10,
                    right: 25,
                    bottom: 10,
                    left: 10
                }
            }
        },
    });

    console.log("Charts initialized successfully");
}

// DAILY TASK SYSTEM

/**
 * Get today's task for user
 */
async function getTodaysTask() {

  if (!currentUserId) {
    console.error("No user ID available");
    return null;
  }

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/daily_task/${currentUserId}`);

    if (response.ok) {
      const taskData = await response.json();
      return taskData;
      /*
      Returns:
            {
                "task_id": "m1_w1_d1",
                "title": "Learn HTML Basics",
                "description": "Study HTML elements, tags, and document structure",
                "goal": "Understand how HTML creates web page structure",
                "estimated_time": "2 hours",
                "resources": ["MDN HTML Basics", "FreeCodeCamp HTML section"],
                "week_focus": "HTML Fundamentals and Structure",
                "motivation_message": "🚀 Great job! You're 0 steps closer to 'Land my first job'. Every expert was once a beginner!",
                "progress": {
                    "current_day": 1,
                    "current_week": 1,
                    "current_month": 1,
                    "total_completed": 0
                }
            }
            */
    }  else {
      console.error("Failed to get today's task");
      return null;
    }
  } catch (error) {
    console.error("Error fetching task:", error);
    return null;
  }
}


/**
 * Display today's task 
 */
async function diaplayTodaysTask() {
  const task = await getTodaysTask();

  if (!task) {
    document.getElementById('taskContainer').innerHTML = 
    '<p>No task available or all tasks completed! 🎉</p>';
    return;
  }

  // Display task in UI
  document.getElementById("taskContainer").innerHTML = `
  <div id="taskContainer" class="task">
    <div class="task-header">
        <span class="active-task"> <img width="25" height="25" src="https://img.icons8.com/?size=100&id=KPXIRLDghgMh&format=png&color=737373" alt=""> <span>Active Task</span></span>

        <span> <img width="25" height="25" src="https://img.icons8.com/?size=100&id=16140&format=png&color=737373" alt=""> </span>
    </div>
    <div class="task-list">
        <span class="task-lists">
            <img class="first-icon" width="25" height="25" src="https://img.icons8.com/?size=100&id=rA9oA5mjJS1I&format=png&color=FFFFFF" alt=""> Task: <b> ${task.title}</b>
        </span>

        <span class="task-lists">
            <img class="second-icon" width="25" height="25" src="https://img.icons8.com/?size=100&id=11751&format=png&color=FFFFFF" alt=""> Goal: ${task.goal}
        </span>
        
        <span class="task-lists1">
            <span class="task-lists">
                <img class="third-icon" height="25" width="25" src="https://img.icons8.com/?size=100&id=82767&format=png&color=FFFFFF" alt=""> Estimated time: ${task.estimated_time}
            </span>
            <span class="task-lists">
                <button id="completeTaskBtn" onclick="completeTask()" class="done">
                      Done <img style="margin-left: 6px;" width="15" height="15" src="https://img.icons8.com/?size=100&id=15478&format=png&color=40C057" alt="">
                </button>
            </span>
        </span>
    </div>
    <div class="task-navi">
            <span class="bottom">
                <img width="30" height="30" src="Images/Frame 3.png" alt=""> <span>
                    <span class="task-navi-ai">Navi:</span> ${task.motivation_message}
                </span>
            </span>
    </div>
  </div>
`;
}

/**
 * Mark current task as completed
 */
async function completeTask() {
  if (!currentUserId) {
    alert("No user session found");
    return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/complete_task/${currentUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "task_completed": true
      })
    });
    if (response.ok) {
      const result = await response.json();
      /**
      Returns:
      {
          "status": "success",
          "message": "Task completed! 🎉",
          "completed_task": "Learn HTML Basics",
          "total_completed": 1
      }
       */
      // Show success message
      alert(result.message);

      // Refresh the task display to show next task
      displayTodaysTask();
    } else {
      console.error("Failed to complete task");
      alert("Failed to mark task as complete");
    }
  } catch (error) {
    console.error("Error completing task:", error);
    alert("Error occured while completing task");
  }
}

// YOUTUBE VIDEO RECOMMENDATIONS
/**
 * Get Youtube videos for current week's focus
 */
async function getWeeklyVideos() {
  if (!currentUserId) {
    console.error("No user ID available");
    return null;
  }

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/week_videos/${currentUserId}`);

    if (response.ok) {
      const videoData = await response.json();
      return videoData;
      /*
      Returns:
      {
        "week_focus": "HTML Fundamentals and Structure",
        "week_info": "Month 1, Week 1",
        "videos": [
          {
            "title": "HTML Fundamentals - Complete Tutorial",
            "url": "https://www.youtube.com/watch?v=xyz123",
            "thumbnail": "https://i.ytimg.com/vi/xyz123/mqdefault.jpg",
            "channel": "Programming with Mosh",
            "duration": "PT25M30S",
            "views": "150000",
            "description": "Learn HTML fundamentals in this comprehensive tutorial..."
          }
        ],
        "total_videos": 6
      }
      */
    } else {
      console.error("Failed to get weekly videos");
      return null;
    }
  } catch (error) {
    console.error("Error fetching videos:", error);
    return null;
  }
}

/**
 * Display weekly videos in UI
 */
async function displayWeeklyVideos() {
  const videoData = await getWeeklyVideos();

  if (!videoData) {
    document.getElementById('videoContainer').innerHTML =
    '<p>No videos available at the moment.</P>';
    return;
  }

  // Function to format video duration
  function formatDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    if (hours < 0) {
      return `<1h`;
    } else if (hours >= 3) {
      return `>3h`;
    } else if (hours >= 2) {
      return `>2h`;
    } else if (hours >= 1) {
      return `>1h`;
    } else {
      return `${hours}h`;
  }
}

// Display videos in UI
  document.getElementById("videoContainer").innerHTML = `
    <div id="videoContainer" class="recommendations">
      <span class="video-content">
        ${videoData.videos.map(video => `
          <span><a href="${
            video.url
          }"><img class="video-cover" width="80" height="50" src="${video.thumbnail}" alt=""></a></span>
        <span class="video-about">
          <span class="video-title">
              <a class="video-title" href="${video.url}">${video.title}</a>
          </span>
          <span class="video-detail">
            <span class="author-duration">
              <span class="video-author">${video.channel} • </span>
              <span class="video-duration"> ${formatDuration(
                video.duration
              )} • </span>
            </span>
            <span class="source"> <img width="25" height="15" src="https://png.pngtree.com/png-vector/20221018/ourmid/pngtree-youtube-social-media-icon-png-image_6315995.png" alt=""></span>
          </span>
        </span>
        <span class="ratings">
          <span class="star">
            <img width="15" height="15" src="https://img.icons8.com/?size=100&id=MVWV8hpGIZqp&format=png&color=FD7E14" alt="">
          </span> 
          <span class="rating">${video.rating || 4.5}</span>
        </span>
        `
          )
          .join("")}
      </span>

      <button onclick="refreshWeeklyVideos()" class="refresh-btn">
         Refresh Videos
      </button>
    </div>
  `;
}

/**
 * Refresh weekly videos (useful if user wants new recommendations)
 */
async function refreshWeeklyVideos() {
  document.getElementById('videoContainer').innerHTML = '<p>Loading fresh video recommendations</p>';
  await displayWeeklyVideos();
}

// Refresh chart when needed
function refreshChart() {
  if (momentumChart) momentumChart.destroy();
  if (progressChart) progressChart.destroy();
  initCharts();
}

// Add this function to update the milestone and summary boxes
async function updateProgressSection() {
    const progress = await getUserProgress();
    if (!progress) {
        console.error("Could not fetch progress data");
        return;
    }

    try {
        // Update completed tasks
        const completedTasksElement = document.querySelector('.completed-tasks');
        if (completedTasksElement) {
            completedTasksElement.textContent = progress.completed_tasks;
        }

        // Calculate and update in-progress tasks
        const inProgressElement = document.querySelector('.in-progress-tasks');
        if (inProgressElement) {
            const weeklyTasks = 5;
            const inProgressTasks = weeklyTasks - (progress.completed_tasks % weeklyTasks);
            inProgressElement.textContent = inProgressTasks;
        }

        // Calculate and update upcoming tasks
        const upcomingElement = document.querySelector('.upcoming-tasks');
        if (upcomingElement) {
            const upcomingTasks = progress.total_tasks - progress.completed_tasks;
            upcomingElement.textContent = upcomingTasks;
        }
    } catch (error) {
        console.error("Error updating progress section:", error);
    }
}

// Modify the window.addEventListener to include the new function
window.addEventListener("DOMContentLoaded", () => {
    initCharts();
    loadDailyTask().catch(showError);
    loadCourses();
    updateProgressSection(); // Add this line
});

// Add refresh function for periodic updates
function refreshProgressSection() {
    updateProgressSection();
}

// Optional: Refresh every 5 minutes
setInterval(refreshProgressSection, 300000);

// Add at the end of your existing JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const navigation = document.getElementById('navigation');
    
    menuToggle.addEventListener('click', function() {
        navigation.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navigation.contains(e.target) && !menuToggle.contains(e.target)) {
            navigation.classList.remove('active');
            menuToggle.classList.remove('active');
        }
    });

    // Adjust charts on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            if (momentumChart) {
                momentumChart.options.maintainAspectRatio = false;
                momentumChart.update();
            }
            if (progressChart) {
                progressChart.options.maintainAspectRatio = false;
                progressChart.update();
            }
        } else {
            if (momentumChart) {
                momentumChart.options.maintainAspectRatio = true;
                momentumChart.update();
            }
            if (progressChart) {
                progressChart.options.maintainAspectRatio = true;
                progressChart.update();
            }
        }
    });
});
