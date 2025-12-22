const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const questionInput = document.getElementById("questionInput");
const sendBtn = document.getElementById("sendBtn");
const statusEl = document.getElementById("status");
const topKEl = document.getElementById("topK");

function addMessage(role, text, sources = []) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  wrap.appendChild(bubble);

  if (role === "bot" && sources.length) {
    const s = document.createElement("div");
    s.className = "sources";
    s.textContent = `Sources: ${[...new Set(sources)].join(", ")}`;
    wrap.appendChild(s);
  }

  chatBox.appendChild(wrap);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function askApi(question, topK) {
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, topK })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }

  return res.json();
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const q = questionInput.value.trim();
  if (!q) return;

  const topK = Number(topKEl.value || 4);

  addMessage("user", q);
  questionInput.value = "";
  questionInput.focus();

  sendBtn.disabled = true;
  statusEl.textContent = "Thinking...";

  try {
    const data = await askApi(q, topK);
    addMessage("bot", data.answer || "No answer.", data.sources || []);
    statusEl.textContent = "Ready";
  } catch (err) {
    addMessage("bot", `Error: ${err.message}`);
    statusEl.textContent = "Error";
  } finally {
    sendBtn.disabled = false;
  }
});
