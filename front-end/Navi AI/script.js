// chat.js

const firstname = "Awesome";
const textarea = document.querySelector("textarea");
const messageContainer = document.querySelector(".direct-message");

// Auto-resize textarea
textarea.addEventListener("input", () => {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
});

// Send user message
async function sendMessage() {
  const userInput = textarea.value.trim();
  if (!userInput) return;

  // Append user message
  appendToChat(`
    <div class="chat-container user">
      <div class="user-chat">
        <div class="user-name">${sanitize(firstname)}</div>
        <div>${sanitize(userInput)}</div>
      </div>
    </div>
  `);

  textarea.value = "";
  messageContainer.scrollTop = messageContainer.scrollHeight;

  try {
    const res = await fetch("http://127.0.0.1:8000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userInput }),
    });
    if (!res.ok) throw new Error(`Server responded ${res.status}`);

    const data = await res.json();
    console.log("🧪 Raw AI API response:", data);

    const aiReply = typeof data.reply === "string" ? data.reply : "⚠️ No reply";
    appendToChat(`
      <div class="chat-container">
        <div class="ai-chat">
          <div class="ai-name">NaviAI</div>
          <div>${formatText(aiReply)}</div>
        </div>
      </div>
    `);
  } catch (err) {
    console.error("Chat error:", err);
    appendToChat(`
      <div class="chat-container">
        <div class="ai-chat">
          <div class="ai-name">NaviAI</div>
          <div><em>Failed to contact server. Is the backend running?</em></div>
        </div>
      </div>
    `);
  }

  messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Enter to send, Shift+Enter for newline
textarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Sanitize user‐generated text to prevent XSS
function sanitize(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Simple formatting: line breaks & **bold** support
function formatText(str) {
  // escape then replace markdown-like bold and linebreaks
  return sanitize(str)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

// Save chat history to sessionStorage
function saveChatHistory() {
  sessionStorage.setItem("chatHistory", messageContainer.innerHTML);
}

// Append and scroll
function appendToChat(html) {
  messageContainer.insertAdjacentHTML("beforeend", html);
  messageContainer.scrollTop = messageContainer.scrollHeight;
  saveChatHistory();
}

// Load history or send greeting
function loadChatHistory() {
  const saved = sessionStorage.getItem("chatHistory");
  if (saved) {
    messageContainer.innerHTML = saved;
    messageContainer.scrollTop = messageContainer.scrollHeight;
  } else {
    sendInitialGreeting();
  }
}

// Initial greeting
function sendInitialGreeting() {
  const greeting = `Greetings, ${firstname} 👋 I’m Navi—your AI career guide. `;
  appendToChat(`
    <div class="chat-container">
      <div class="ai-chat">
        <div class="ai-name">NaviAI</div>
        <div>${formatText(greeting)}</div>
      </div>
    </div>
  `);
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", loadChatHistory);
