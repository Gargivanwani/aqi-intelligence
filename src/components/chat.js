// ===========================
// AI Chat Component
// Uses Groq API (FREE) — llama-3.3-70b-versatile
// ===========================

let cityContext = [];
let groqApiKey = null;

// ── API Key Modal ─────────────────────────────────────
function showApiKeyModal() {
  document.getElementById('api-key-modal').classList.remove('hidden');
}

function hideApiKeyModal() {
  document.getElementById('api-key-modal').classList.add('hidden');
}

function saveApiKey() {
  const input = document.getElementById('api-key-input');
  const key = input.value.trim();
  if (!key.startsWith('gsk_')) {
    document.getElementById('api-key-error').textContent = '⚠️ Groq keys start with gsk_ — please check your key.';
    return;
  }
  groqApiKey = key;
  document.getElementById('api-key-error').textContent = '';
  hideApiKeyModal();

  // Update chat UI to show it's ready
  appendBubble('✅ API key connected! I\'m ready to help. Ask me anything about air quality in any Indian city.', 'ai');
  document.getElementById('chat-send').disabled = false;
  document.getElementById('chat-input').disabled = false;
  document.getElementById('chat-input').placeholder = 'Ask about air quality, health risks...';
  document.getElementById('api-key-btn').textContent = '🔑 Key Connected';
  document.getElementById('api-key-btn').style.background = '#2ea04322';
  document.getElementById('api-key-btn').style.borderColor = '#2ea043';
  document.getElementById('api-key-btn').style.color = '#2ea043';
}

// ── System Prompt ─────────────────────────────────────
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
- Keep responses under 150 words unless detail is specifically requested.
- Respond in English unless the user writes in another language.
- Format responses with line breaks for readability. Use emojis sparingly.`;
}

// ── Send Message ──────────────────────────────────────
async function sendMessage() {
  if (!groqApiKey) {
    showApiKeyModal();
    return;
  }

  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const text = input.value.trim();
  if (!text) return;

  appendBubble(text, 'user');
  input.value = '';
  sendBtn.disabled = true;

  const loadingId = 'loading-' + Date.now();
  appendBubble('⏳ Thinking...', 'loading', loadingId);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 400,
        temperature: 0.7,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user',   content: text },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API error');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, no response received.';

    document.getElementById(loadingId)?.remove();
    appendBubble(reply, 'ai');

  } catch (err) {
    document.getElementById(loadingId)?.remove();
    const msg = err.message.includes('401')
      ? '❌ Invalid API key. Click "Change Key" to update it.'
      : err.message.includes('429')
      ? '⚠️ Rate limit hit — wait a moment and try again.'
      : `❌ Error: ${err.message}`;
    appendBubble(msg, 'ai');
  }

  sendBtn.disabled = false;
  document.getElementById('chat-messages').scrollTop = 99999;
}

// ── Append Bubble ─────────────────────────────────────
function appendBubble(text, type, id = null) {
  const messages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-bubble ${type}`;
  if (id) div.id = id;
  div.innerHTML = text.replace(/\n/g, '<br/>');
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Disable chat until key is set
  document.getElementById('chat-send').disabled = true;
  document.getElementById('chat-input').disabled = true;
  document.getElementById('chat-input').placeholder = 'Connect your Groq API key to start chatting...';

  // Enter key to send
  document.getElementById('chat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) sendMessage();
  });
});
