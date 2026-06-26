// ===========================
// AI Chat Component
// ===========================
// Uses Claude API (claude-sonnet-4-6) for health advisories

let cityContext = [];   // filled after map loads, passed to Claude as context

function buildSystemPrompt() {
  const citySnapshot = cityContext.length
    ? cityContext.map(c => `${c.name}: AQI ${c.aqi} (${getAQILabel(c.aqi)}), PM2.5 ${c.pm25 ?? '--'} µg/m³`).join('\n')
    : 'Live data loading...';

  return `You are AirSense, an AI health advisory assistant for urban air quality in India.
You help citizens, health workers, and city officials understand air quality risks and take protective action.

Current live AQI snapshot for major Indian cities:
${citySnapshot}

Guidelines:
- Be concise, warm, and practical. No jargon.
- Always mention the AQI number and category when discussing a city.
- Give specific, actionable advice (mask type, activity restrictions, vulnerable groups).
- Reference CPCB/WHO standards where relevant.
- If asked about a city not in the snapshot, give general advice based on typical ranges.
- Keep responses under 120 words unless detail is specifically requested.
- Respond in English unless the user writes in another language.`;
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const messages = document.getElementById('chat-messages');

  const text = input.value.trim();
  if (!text) return;

  // Show user bubble
  appendBubble(text, 'user');
  input.value = '';
  sendBtn.disabled = true;

  // Show loading
  const loadingId = 'loading-' + Date.now();
  appendBubble('Thinking...', 'loading', loadingId);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: buildSystemPrompt(),
        messages: [{ role: 'user', content: text }],
      }),
    });

    const data = await response.json();
    const reply = data.content?.map(b => b.text || '').join('') || 'Sorry, I could not get a response. Please try again.';

    // Remove loading, show reply
    document.getElementById(loadingId)?.remove();
    appendBubble(reply, 'ai');
  } catch (err) {
    document.getElementById(loadingId)?.remove();
    appendBubble('Connection error. Please check your internet and try again.', 'ai');
  }

  sendBtn.disabled = false;
  messages.scrollTop = messages.scrollHeight;
}

function appendBubble(text, type, id = null) {
  const messages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-bubble ${type}`;
  if (id) div.id = id;
  div.innerHTML = text.replace(/\n/g, '<br/>');
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// Allow Enter key to send
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) sendMessage();
  });
});
