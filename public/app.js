document.addEventListener("DOMContentLoaded", () => {
  const chatMessages = document.getElementById("chatMessages");
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const typingIndicator = document.getElementById("typingIndicator");
  const clearBtn = document.getElementById("clearBtn");

  // Persistent session ID
  let threadId = localStorage.getItem("chatBot1_threadId") || "session-" + Date.now();
  localStorage.setItem("chatBot1_threadId", threadId);

  // Auto resize textarea
  userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
  });

  // Handle Enter key (Shift+Enter for newline)
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event("submit"));
    }
  });

  // Submit Handler
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Reset input height
    userInput.value = "";
    userInput.style.height = "auto";

    // Add user message to UI
    appendMessage(text, "user");

    // Show typing indicator & scroll
    showTyping(true);
    scrollToBottom();

    // Disable input while loading
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, thread_id: threadId }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        appendMessage(data.reply, "bot");
      } else {
        appendMessage("⚠️ Error: " + (data.error || "Failed to get response."), "bot");
      }
    } catch (err) {
      console.error(err);
      appendMessage("⚠️ Network error. Make sure the backend server is running.", "bot");
    } finally {
      showTyping(false);
      setLoading(false);
      scrollToBottom();
    }
  });

  // Clear Session
  clearBtn.addEventListener("click", () => {
    if (confirm("Start a new chat session?")) {
      threadId = "session-" + Date.now();
      localStorage.setItem("chatBot1_threadId", threadId);
      chatMessages.innerHTML = `
        <div class="message bot">
          <div class="avatar">🤖</div>
          <div class="bubble">Session restarted! How can I assist you today?</div>
        </div>
      `;
    }
  });

  function appendMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);

    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("avatar");
    avatarDiv.textContent = sender === "user" ? "👤" : "🤖";

    const bubbleDiv = document.createElement("div");
    bubbleDiv.classList.add("bubble");
    bubbleDiv.textContent = text;

    msgDiv.appendChild(avatarDiv);
    msgDiv.appendChild(bubbleDiv);

    chatMessages.appendChild(msgDiv);
    scrollToBottom();
  }

  function showTyping(show) {
    if (show) {
      typingIndicator.classList.remove("hidden");
    } else {
      typingIndicator.classList.add("hidden");
    }
  }

  function setLoading(loading) {
    userInput.disabled = loading;
    sendBtn.disabled = loading;
    if (!loading) userInput.focus();
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
