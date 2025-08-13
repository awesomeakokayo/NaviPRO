// aichat.js

console.log("JavaScript file loaded successfully!");

const firstname = "Alex";
let currentUserId = null;
let messageContainer = null;
let chatInput = null;

/**
 * Initialize DOM elements after page loads
 */
function initializeElements() {
    messageContainer = document.querySelector(".direct-message");
    chatInput = document.querySelector(".send-message input");
    
    console.log("Message container found:", messageContainer);
    console.log("Chat input found:", chatInput);
    
    if (!messageContainer) {
        console.error("Could not find .direct-message container");
    }
    
    if (!chatInput) {
        console.error("Could not find .send-message input");
        // Try alternative selectors
        chatInput = document.querySelector("input[type='text']");
        console.log("Alternative input search:", chatInput);
    }
    
    const textarea = document.querySelector('.auto-expand');
    if (textarea) {
        // Auto-expand function
        function autoExpand() {
            // Reset height to auto first to shrink if needed
            textarea.style.height = 'auto';
            // Set new height based on scrollHeight
            textarea.style.height = textarea.scrollHeight + 'px';
            
            // Adjust container padding if textarea is getting too tall
            const container = document.querySelector('.container');
            if (container) {
                const textareaHeight = textarea.offsetHeight;
                container.style.marginBottom = (textareaHeight + 70) + 'px';
            }
        }

        // Add event listeners for content changes
        textarea.addEventListener('input', autoExpand);
        textarea.addEventListener('change', autoExpand);
        
        // Handle Enter key
        textarea.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });

        // Initial expansion
        autoExpand();
    }
    
    // Add event listeners only if elements exist
    if (chatInput) {
        chatInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
            }
        });
        console.log("Enter key listener added to input");
    }
}

/**
 * Send message to AI chatbot
 */
async function sendChatMessage(message) {
    if (!currentUserId) {
        console.error("No user ID available");
        return null;
    }

    if (!message.trim()) {
        return null;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/chat/${currentUserId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "message": message,
                "user_id": currentUserId
            })
        });

        if (response.ok) {
            const chatResponse = await response.json();
            return chatResponse;
        } else {
            console.error("Failed to get chat response:", await response.text());
            return null;
        }
    } catch (error) {
        console.error("Error sending chat message:", error);
        return null;
    }
}

/**
 * Add a new user message to the chat
 */
function addUserMessage(message) {
    if (!messageContainer) {
        console.error("Message container not available");
        return;
    }
    
    const userMessageHTML = `
        <div class="chat-container user">
            <div class="user-chat">
                <div class="user-name"></div>
                <div>${message}</div>
            </div>
        </div>
    `;
    messageContainer.innerHTML += userMessageHTML;
}

/**
 * Add a new AI message to the chat
 */
function addAIMessage(message, timestamp = null) {
    if (!messageContainer) {
        console.error("Message container not available");
        return;
    }
    
    const timestampStr = timestamp ? `<small class="timestamp">${new Date(timestamp).toLocaleTimeString()}</small>` : '';
    const aiMessageHTML = `
        <div class="chat-container">
            <div><img src="Images/Frame 3.png" alt="logo"></div>
            <div class="ai-chat">
                <div class="ai-name">NaviAI</div>
                <div>${message}${timestampStr}</div>
            </div>
        </div>
    `;
    messageContainer.innerHTML += aiMessageHTML;
}

/**
 * Add typing indicator
 */
function addTypingIndicator() {
    if (!messageContainer) return;
    
    const typingHTML = `
        <div class="chat-container" id="typingIndicator">
            <div><img src="Images/Frame 3.png" alt="logo"></div>
            <div class="ai-chat">
                <div class="ai-name">NaviAI</div>
                <div>Navi is typing...</div>
            </div>
        </div>
    `;
    messageContainer.innerHTML += typingHTML;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
    if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
}

/**
 * Handle sending a chat message
 */
async function sendMessage() {
    console.log("sendMessage function called!");
    
    const textarea = document.querySelector('.auto-expand');
    if (!textarea) {
        console.error("Textarea not found!");
        alert("Textarea not found. Please refresh the page.");
        return;
    }
    
    const message = textarea.value.trim();
    console.log("Message to send:", message);
    
    if (!message) {
        console.log("Empty message, returning");
        return;
    }
    
    // Add user message to chat
    addUserMessage(message);
    
    // Clear input and reset height
    textarea.value = '';
    textarea.style.height = 'auto';
    document.querySelector('.container').style.marginBottom = '120px';
    
    // Show typing indicator
    addTypingIndicator();
    
    // Scroll to bottom
    scrollToBottom();
    
    try {
        // Get AI response
        const response = await sendChatMessage(message);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        if (response && response.response) {
            // Add AI message to chat
            addAIMessage(response.response, response.timestamp);
        } else {
            // Handle error case
            addAIMessage("I'm having trouble responding right now. Please try again.");
        }
        
        // Scroll to bottom after new message
        scrollToBottom();
        
    } catch (error) {
        console.error("Error getting AI response:", error);
        removeTypingIndicator();
        addAIMessage("Sorry, there was an error processing your message.");
        scrollToBottom();
    }
}

/**
 * Initialize chat functionality
 */
function initializeChat() {
    // Set a temporary user ID
    currentUserId = "user_" + Date.now();
    console.log("Chat initialized for user:", currentUserId);
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing...");
    initializeElements();
    initializeChat();
});

// Fallback: if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeElements();
        initializeChat();
    });
} else {
    // DOM already loaded
    initializeElements();
    initializeChat();
}

// Make sendMessage globally accessible for onclick handler
window.sendMessage = sendMessage;

console.log("Script setup complete");