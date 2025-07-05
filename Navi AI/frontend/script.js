const textarea = document.querySelector("textarea");
const messageContainer = document.querySelector(".direct-message");

textarea.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

async function sendMessage() {
  const userInput = textarea.value.trim();
  if (!userInput) return;

  // Append user message to chat
  const userMessageHTML = `
    <div class="chat-container user">
      <div class="user-chat">
        <div class="user-name"></div>
        <div>${sanitize(userInput)}</div>
      </div>
    </div>`;
  messageContainer.insertAdjacentHTML("beforeend", userMessageHTML);
  textarea.value = "";
  messageContainer.scrollTop = messageContainer.scrollHeight;

  try {
    const response = await fetch("http://127.0.0.1:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userInput }),
    });
    

    const data = await response.json();

    const aiMessageHTML = `
      <div class="chat-container">
        <div><img src="Images/Frame 3.png" alt="logo"></div>
        <div class="ai-chat">
          <div class="ai-name">NaviAI</div>
          <div>${formatText(data.reply)}</div>
        </div>
      </div>`;
    messageContainer.insertAdjacentHTML("beforeend", aiMessageHTML);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  } catch (error) {
    console.error("Chat error:", error);
    alert("Failed to get response. Is Flask running?");
  }
}

// Allow Enter to send, Shift+Enter for new line
textarea.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Prevent XSS
function sanitize(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatText(str) {
  const clean = sanitize(str);

  const formatted = clean
    // bold: **text**
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // italic: *text*
    .replace(/\*(.*?)\*/g, "<em>$1</em>");

  return formatted
    .split("\n\n")
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function sendInitialGreeting() {
  const greeting = `Greetings, Alex! 👋 I'm Navi, your AI career guide — here to help you get real results, with step-by-step plans, helpful resources, and a routine designed just for you! \n\nRespond 'Yes' if you'd like me to go on.`;

  const aiMessageHTML = `
    <div class="chat-container">
      <div><img src="Images/Frame 3.png" alt="logo"></div>
      <div class="ai-chat">
        <div class="ai-name">NaviAI</div>
        <div>${formatText(greeting)}</div>
      </div>
    </div>`;
  messageContainer.insertAdjacentHTML("beforeend", aiMessageHTML);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}


// Send first greeting when page loads
window.addEventListener("load", sendInitialGreeting);

function saveChatHistory() {
  const messages = messageContainer.innerHTML;
  sessionStorage.setItem("chatHistory", messages);
}

function loadChatHistory() {
  const messages = sessionStorage.getItem("chatHistory");
  if (messages) {
    messageContainer.innerHTML = messages;
    messageContainer.scrollTop = messageContainer.scrollHeight;
  } else {
    sendInitialGreeting(); // first-time visit
  }
}

// Save after each message is added
function appendToChat(html) {
  messageContainer.insertAdjacentHTML("beforeend", html);
  messageContainer.scrollTop = messageContainer.scrollHeight;
  saveChatHistory();
}
