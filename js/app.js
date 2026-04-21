import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut as fbSignOut }
    from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, orderBy, query }
    from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyBXoibmkjQ_PtKXj9m6ny_vpdrvWVedUmk",
    authDomain: "worldai-bb5e4.firebaseapp.com",
    projectId: "worldai-bb5e4",
    storageBucket: "worldai-bb5e4.firebasestorage.app",
    messagingSenderId: "266783567091",
    appId: "1:266783567091:web:4fbddf123e1910ee5c9b86"
};



const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const provider = new GoogleAuthProvider();
const BACKEND_BASE = 'https://worldai-backend.onrender.com';
const GROQ_WORKER = `${BACKEND_BASE}/api/chat`;
const DOC_ANALYZE_WORKER = `${BACKEND_BASE}/api/analyze-doc`;
const IMAGE_WORKER = `${BACKEND_BASE}/api/image`;

// ── COUNTRY TRANSLATION + CODES DICT ──
const countryTranslations = {
    'Россия': 'Russian Federation', 'РФ': 'Russian Federation',
    'Казахстан': 'Kazakhstan', 'КЗ': 'Kazakhstan',
    'Япония': 'Japan', 'Корея': 'South Korea', 'Северная Корея': 'North Korea', 'ДПР Корея': 'North Korea',
    'Китай': 'China', 'США': 'United States', 'Турция': 'Turkey',
    'Германия': 'Germany', 'Франция': 'France', 'Великобритания': 'United Kingdom',
    'Египет': 'Egypt', 'ОАЭ': 'United Arab Emirates', 'Австралия': 'Australia',
    'Индия': 'India', 'Бразилия': 'Brazil', 'Мексика': 'Mexico',
    'Монголия': 'Mongolia', 'Греция': 'Greece', 'Рим': 'Italy',
    'Испания': 'Spain', 'Италия': 'Italy', 'Португалия': 'Portugal',
    'Швеция': 'Sweden', 'Норвегия': 'Norway', 'Финляндия': 'Finland',
    'Польша': 'Poland', 'Чехия': 'Czech Republic', 'Венгрия': 'Hungary',
    'Румыния': 'Romania', 'Болгария': 'Bulgaria', 'Сербия': 'Serbia',
    'Украина': 'Ukraine', 'Беларусь': 'Belarus', 'Молдова': 'Moldova',
    'Грузия': 'Georgia', 'Армения': 'Armenia', 'Азербайджан': 'Azerbaijan',
    'Узбекистан': 'Uzbekistan', 'Туркменистан': 'Turkmenistan', 'Кыргызстан': 'Kyrgyzstan',
    'Таджикистан': 'Tajikistan', 'Афганистан': 'Afghanistan', 'Иран': 'Iran',
    'Ирак': 'Iraq', 'Саудовская Аравия': 'Saudi Arabia', 'Израиль': 'Israel',
    'Иордания': 'Jordan', 'Ливан': 'Lebanon', 'Сирия': 'Syria',
    'Пакистан': 'Pakistan', 'Бангладеш': 'Bangladesh', 'Шри-Ланка': 'Sri Lanka',
    'Таиланд': 'Thailand', 'Вьетнам': 'Vietnam', 'Лаос': 'Laos',
    'Камбоджа': 'Cambodia', 'Малайзия': 'Malaysia', 'Сингапур': 'Singapore',
    'Филиппины': 'Philippines', 'Индонезия': 'Indonesia',
    'Англия': 'United Kingdom', 'Шотландия': 'United Kingdom', 'Уэльс': 'United Kingdom'
};

const countryCodes = {
    'RU': 'Russian Federation', 'KZ': 'Kazakhstan', 'JP': 'Japan', 'CN': 'China',
    'US': 'United States', 'TR': 'Turkey', 'DE': 'Germany', 'FR': 'France',
    'GB': 'United Kingdom', 'EG': 'Egypt', 'AE': 'United Arab Emirates', 'AU': 'Australia',
    'IN': 'India', 'BR': 'Brazil', 'MX': 'Mexico', 'MN': 'Mongolia',
    'GR': 'Greece', 'IT': 'Italy', 'ES': 'Spain', 'PT': 'Portugal',
    'SE': 'Sweden', 'NO': 'Norway', 'FI': 'Finland', 'PL': 'Poland',
    'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania', 'BG': 'Bulgaria',
    'RS': 'Serbia', 'UA': 'Ukraine', 'BY': 'Belarus', 'MD': 'Moldova',
    'GE': 'Georgia', 'AM': 'Armenia', 'AZ': 'Azerbaijan', 'UZ': 'Uzbekistan',
    'TM': 'Turkmenistan', 'KG': 'Kyrgyzstan', 'TJ': 'Tajikistan', 'AF': 'Afghanistan',
    'IR': 'Iran', 'IQ': 'Iraq', 'SA': 'Saudi Arabia', 'IL': 'Israel',
    'JO': 'Jordan', 'LB': 'Lebanon', 'SY': 'Syria', 'PK': 'Pakistan',
    'BD': 'Bangladesh', 'LK': 'Sri Lanka', 'TH': 'Thailand', 'VN': 'Vietnam',
    'LA': 'Laos', 'KH': 'Cambodia', 'MY': 'Malaysia', 'SG': 'Singapore',
    'PH': 'Philippines', 'ID': 'Indonesia', 'KP': 'North Korea', 'SK': 'South Korea'
};


let currentUser = null;
let chatHistory = [];
let sessions = [];
let currentSessionId = null;
let isLoading = false;
let map = null;
let imageModeEnabled = false;
let pendingAttachment = null;

// ── AUTH ──
window.signInWithGoogle = async () => {
    try {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            await signInWithRedirect(auth, provider);
        } else {
            await signInWithPopup(auth, provider);
        }
    }
    catch(e) { alert('\u041e\u0448\u0438\u0431\u043a\u0430 \u0432\u0445\u043e\u0434\u0430: ' + e.message); }
};
window.signOut = async () => {
    if (!confirm('\u0412\u044b\u0439\u0442\u0438 \u0438\u0437 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430?')) return;
    await fbSignOut(auth);
};
getRedirectResult(auth).catch(() => {});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('user-badge').style.display = 'flex';
        document.getElementById('user-avatar').src = user.photoURL || '';
        document.getElementById('user-name').textContent = user.displayName || user.email;
        await loadSessions();
        await loadProfile();
    } else {
        currentUser = null;
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('user-badge').style.display = 'none';
        sessions = [];
        renderHistory();
    }
});

// ── USER PROFILE ──
const DEFAULT_PROFILE = {
    name: '',
    age: '',
    about: '',
    interests: '',
    goals: '',
    tone: 'friendly'
};
let userProfile = { ...DEFAULT_PROFILE };

async function loadProfile() {
    if (!currentUser) return;
    try {
        const { getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const snap = await getDoc(doc(db, 'users', currentUser.uid, 'profile', 'data'));
        if (snap.exists()) {
            userProfile = { ...DEFAULT_PROFILE, ...snap.data() };
            populateProfileForm();
            renderProfilePreview();
            if (userProfile.name) {
                document.getElementById('user-name').textContent = userProfile.name;
            }
        } else {
            userProfile = { ...DEFAULT_PROFILE };
            populateProfileForm();
            renderProfilePreview();
            setTimeout(() => askForProfile(), 1000);
        }
    } catch(e) { console.error(e); }
}

async function saveProfile(profileData) {
    if (!currentUser) return;
    try {
        userProfile = { ...DEFAULT_PROFILE, ...profileData };
        await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'data'), userProfile);
        if (userProfile.name) {
            document.getElementById('user-name').textContent = userProfile.name;
        }
        renderProfilePreview();
    } catch(e) { console.error(e); }
}

function askForProfile() {
    setTab('sec-profile', 'nav-profile');
    setProfileStatus('Заполни профиль, чтобы ИИ отвечал персонально.', false);
}

// ── FIRESTORE ──
async function saveSess(session) {
    if (!currentUser) return;
    try {
        await setDoc(doc(db, 'users', currentUser.uid, 'sessions', String(session.id)), {
            id: session.id, title: session.title,
            messages: JSON.stringify(session.messages), updatedAt: Date.now()
        });
    } catch(e) { console.error(e); }
}
async function loadSessions() {
    if (!currentUser) return;
    try {
        const q = query(collection(db, 'users', currentUser.uid, 'sessions'), orderBy('updatedAt', 'desc'));
        const snap = await getDocs(q);
        sessions = snap.docs.map(d => {
            const data = d.data();
            return { id: data.id, title: data.title, messages: JSON.parse(data.messages || '[]') };
        });
        renderHistory();
    } catch(e) { console.error(e); }
}
async function deleteSess(id) {
    if (!currentUser) return;
    try { await deleteDoc(doc(db, 'users', currentUser.uid, 'sessions', String(id))); } catch(e) {}
}

function applySectionMotion(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    section.classList.remove('section-animate');
    section.querySelectorAll('.stagger-item').forEach((el) => el.classList.remove('stagger-item'));

    const candidates = section.querySelectorAll(
        '.chip, .stat-card, .compare-col, .quiz-option, .battle-round, .story-option, .story-scene-card, .battle-scoreboard, .mode-loading, .msg, .profile-card, .profile-field'
    );
    [...candidates].slice(0, 8).forEach((el) => el.classList.add('stagger-item'));

    void section.offsetWidth;
    section.classList.add('section-animate');
    setTimeout(() => {
        section.classList.remove('section-animate');
        section.querySelectorAll('.stagger-item').forEach((el) => el.classList.remove('stagger-item'));
    }, 760);
}

// ── TABS ──
window.setTab = (sectionId, navId) => {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.getElementById(navId).classList.add('active');
    applySectionMotion(sectionId);
    if (sectionId === 'sec-map') initMap();
    if (sectionId === 'sec-search') { setTimeout(() => document.getElementById('country-input').focus(), 100); }
};

// ── NEW CHAT ──
window.newChat = () => {
    chatHistory = []; currentSessionId = null;
    document.getElementById('messages').innerHTML = `
        <div class="welcome" id="welcome-screen">
            <h1>WORLDAI</h1>
            <p>Настоящий ИИ прямо в браузере.<br>Задай любой вопрос — от истории до науки.</p>
            <div class="chips">
                <div class="chip" onclick="quickSend('Расскажи историю Казахстана')">📜 История Казахстана</div>
                <div class="chip" onclick="quickSend('Что такое квантовая физика простыми словами?')">⚛️ Квантовая физика</div>
                <div class="chip" onclick="quickSend('Напиши эссе про СССР')">🇷🇺 Эссе про СССР</div>
                <div class="chip" onclick="quickSend('Как стать программистом с нуля?')">💻 Стать программистом</div>
                <div class="chip" onclick="quickSend('Почему небо голубое?')">🌤 Почему небо голубое?</div>
            </div>
        </div>`;
    document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active-hist'));
    setTab('sec-ai', 'nav-ai');
};

// ── HISTORY ──
async function saveSession(title, messages) {
    if (!currentSessionId) currentSessionId = Date.now();
    const idx = sessions.findIndex(s => s.id === currentSessionId);
    const session = { id: currentSessionId, title: title.slice(0, 45), messages };
    if (idx >= 0) sessions[idx] = session; else sessions.unshift(session);
    if (sessions.length > 40) sessions = sessions.slice(0, 40);
    renderHistory();
    await saveSess(session);
}
function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    sessions.forEach(s => {
        const item = document.createElement('div');
        item.className = 'history-item' + (s.id === currentSessionId ? ' active-hist' : '');
        item.innerHTML = `<div class="hist-dot"></div><span style="overflow:hidden;text-overflow:ellipsis;flex:1">${escHtml(s.title)}</span><button class="hist-rename" onclick="event.stopPropagation();renameSession(${s.id})" title="Переименовать">✏️</button><button class="hist-delete" onclick="event.stopPropagation();deleteOneSession(${s.id})" title="Удалить">🗑</button>`;
        item.onclick = () => loadSession(s.id);
        list.appendChild(item);
    });
}
function loadSession(id) {
    const s = sessions.find(x => x.id === id);
    if (!s) return;
    currentSessionId = id; chatHistory = s.messages;
    const msgs = document.getElementById('messages');
    msgs.innerHTML = '';
    s.messages.forEach(m => {
        const text = m.content || m.parts?.[0]?.text || '';
        const role = m.role === 'user' ? 'user' : 'ai';
        if (text) appendMessage(role, text, false);
    });
    setTab('sec-ai', 'nav-ai'); renderHistory(); msgs.scrollTop = msgs.scrollHeight;
}
window.clearHistory = async () => {
    if (!confirm('\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0432\u0441\u044e \u0438\u0441\u0442\u043e\u0440\u0438\u044e \u0447\u0430\u0442\u043e\u0432?')) return;
    for (const s of sessions) await deleteSess(s.id);
    sessions = []; renderHistory(); newChat();
};

// ── MESSAGES ──
function appendMessage(type, text, animate = true) {
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.remove();
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'msg';
    if (!animate) div.style.animation = 'none';
    if (type === 'user') {
        div.classList.add('msg-user');
        div.innerHTML = `<div class="bubble">${escHtml(text)}</div>`;
    } else {
        div.classList.add('msg-ai');
        const msgId = 'msg-' + Date.now();
        const modelLabel = MODELS[currentModel] ? MODELS[currentModel].label : 'WORLDAI';
        div.innerHTML = `<div class="ai-label">◆ ${modelLabel.toUpperCase()}</div><div class="ai-text" id="${msgId}">${mdToHtml(text)}</div><div class="msg-actions"><button class="copy-btn" onclick="copyMsg('${msgId}')">📋 Копировать</button><button class="speak-btn" onclick="speakMsg('${msgId}', this)">🔊 Озвучить</button></div>`;
    }
    msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight; return div;
}
function appendImageMessage(imageUrl, prompt, animate = true) {
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.remove();
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'msg msg-ai';
    if (!animate) div.style.animation = 'none';
    const modelLabel = MODELS[currentModel] ? MODELS[currentModel].label : 'WORLDAI';
    const safePrompt = escHtml(prompt || '');
    const fileName = `worldai-image-${Date.now()}.png`;
    const openId = 'img-open-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const dlId = 'img-dl-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    div.innerHTML = `<div class="ai-label">◆ ${modelLabel.toUpperCase()}</div><div class="ai-text"><p><strong>Изображение сгенерировано:</strong></p><div class="ai-image"><img src="${imageUrl}" alt="Сгенерированное изображение"><div class="ai-image-caption">${safePrompt}</div><div class="ai-image-tools"><button id="${openId}" type="button">Открыть</button><button id="${dlId}" type="button">Скачать</button></div></div></div>`;
    msgs.appendChild(div);
    const openBtn = div.querySelector(`#${openId}`);
    const dlBtn = div.querySelector(`#${dlId}`);
    if (openBtn) openBtn.onclick = () => showImagePreview(imageUrl, fileName);
    if (dlBtn) dlBtn.onclick = () => downloadGeneratedImage(imageUrl, fileName);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
}
function isLikelyImagePrompt(text) {
    const t = String(text || '').toLowerCase();
    if (!t) return false;
    const make = /(создай|сгенерируй|нарисуй|generate|draw)/.test(t);
    const subject = /(картин|изображ|фото|image|art)/.test(t);
    return make && subject;
}
function closeImagePreview() {
    const el = document.getElementById('img-preview-overlay');
    if (el) el.remove();
}
async function downloadGeneratedImage(imageUrl, fileName = `worldai-image-${Date.now()}.png`) {
    try {
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1200);
    } catch {
        // fallback for strict CORS/data URL cases
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }
}
function showImagePreview(imageUrl, fileName = `worldai-image-${Date.now()}.png`) {
    closeImagePreview();
    const overlay = document.createElement('div');
    overlay.className = 'img-preview-overlay';
    overlay.id = 'img-preview-overlay';
    overlay.innerHTML = `<div class="img-preview-panel"><button class="img-preview-close" type="button" title="Закрыть">✕</button><img src="${imageUrl}" alt="Preview"><div class="img-preview-toolbar"><button type="button" id="img-preview-download">Скачать</button><button type="button" id="img-preview-close-btn">Закрыть</button></div></div>`;
    document.body.appendChild(overlay);
    const closeBtn = overlay.querySelector('.img-preview-close');
    const closeBtn2 = overlay.querySelector('#img-preview-close-btn');
    const downloadBtn = overlay.querySelector('#img-preview-download');
    if (closeBtn) closeBtn.onclick = closeImagePreview;
    if (closeBtn2) closeBtn2.onclick = closeImagePreview;
    if (downloadBtn) downloadBtn.onclick = () => downloadGeneratedImage(imageUrl, fileName);
    overlay.onclick = (e) => { if (e.target === overlay) closeImagePreview(); };
}
function appendAiLiveMessage(initialText = '', animate = true) {
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.remove();
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'msg msg-ai';
    if (!animate) div.style.animation = 'none';
    const msgId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const modelLabel = MODELS[currentModel] ? MODELS[currentModel].label : 'WORLDAI';
    div.innerHTML = `<div class="ai-label">◆ ${modelLabel.toUpperCase()}</div><div class="ai-text" id="${msgId}">${mdToHtml(initialText)}</div><div class="msg-actions"><button class="copy-btn" onclick="copyMsg('${msgId}')">📋 Копировать</button><button class="speak-btn" onclick="speakMsg('${msgId}', this)">🔊 Озвучить</button></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return { wrapper: div, textEl: document.getElementById(msgId), msgId };
}
function updateAiLiveMessage(textEl, text) {
    if (!textEl) return;
    textEl.innerHTML = mdToHtml(text);
    const msgs = document.getElementById('messages');
    msgs.scrollTop = msgs.scrollHeight;
}
function appendTyping() {
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.remove();
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'msg msg-ai'; div.id = 'typing-msg';
    div.innerHTML = `<div class="ai-label">◆ WORLDAI</div><div class="typing-indicator"><span></span><span></span><span></span></div>`;
    msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
}
function removeTyping() { const t = document.getElementById('typing-msg'); if (t) t.remove(); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function revealReplyGradually(fullText, onDelta) {
    const chunks = fullText.match(/.{1,20}(\s|$)/g) || [fullText];
    for (const part of chunks) {
        onDelta(part);
        await sleep(14);
    }
}
function extractReplyFromJson(data, provider) {
    if (provider === 'claude') return data?.content?.[0]?.text || '';
    return data?.choices?.[0]?.message?.content || '';
}
function extractDeltaFromEvent(obj, provider) {
    if (!obj || typeof obj !== 'object') return '';
    if (provider === 'claude') {
        return obj?.delta?.text || obj?.content_block?.text || obj?.content?.[0]?.text || '';
    }
    return obj?.choices?.[0]?.delta?.content || obj?.choices?.[0]?.message?.content || '';
}

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;

function shouldAllowCjk(userText = '') {
    const t = String(userText || '').toLowerCase();
    return /(китай|китайск|япон|корей|иероглиф|переведи|translate|chinese|japanese|korean|hanzi|kanji)/i.test(t);
}

function stripUnexpectedCjk(text = '') {
    return String(text || '').replace(CJK_RE, '');
}
async function fetchReplyWithStreaming(url, payload, provider, onDelta) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) {
        let details = '';
        try {
            if (contentType.includes('application/json')) {
                const errJson = await res.json();
                details = errJson?.message || errJson?.error || '';
            } else {
                details = (await res.text()).trim();
            }
        } catch {}
        throw new Error(details ? `HTTP ${res.status}: ${details}` : `HTTP ${res.status}`);
    }

    if (res.body && contentType.includes('text/event-stream')) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let full = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || '';

            for (let line of lines) {
                line = line.trim();
                if (!line || !line.startsWith('data:')) continue;
                const payloadLine = line.slice(5).trim();
                if (payloadLine === '[DONE]') continue;
                try {
                    const obj = JSON.parse(payloadLine);
                    const delta = extractDeltaFromEvent(obj, provider);
                    if (delta) {
                        full += delta;
                        onDelta(delta);
                    }
                } catch {}
            }
        }
        if (full.trim()) return full;
        throw new Error('Пустой потоковый ответ');
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    const reply = extractReplyFromJson(data, provider);
    if (!reply) throw new Error('Пустой ответ от модели');
    await revealReplyGradually(reply, onDelta);
    return reply;
}

// ── MODEL SWITCHER ──
const MODELS = {
    'llama':         { label: 'Llama 3.3 (Groq)', hint: 'Llama 3.3 · Groq · Бесплатно', provider: 'groq',    apiModel: 'llama-3.3-70b-versatile' },
    'gpt4o-mini':    { label: 'GPT-4o mini',       hint: 'GPT-4o mini · OpenAI',          provider: 'openai',  apiModel: 'gpt-4o-mini' },
    'gpt4o':         { label: 'GPT-4o',            hint: 'GPT-4o · OpenAI',               provider: 'openai',  apiModel: 'gpt-4o' },
    'claude-haiku':  { label: 'Claude Haiku',      hint: 'Claude Haiku 4.5 · Anthropic',  provider: 'claude',  apiModel: 'claude-haiku-4-5-20251001' },
    'claude-sonnet': { label: 'Claude Sonnet',     hint: 'Claude Sonnet 4.6 · Anthropic', provider: 'claude',  apiModel: 'claude-sonnet-4-6' },
};
// Worker endpoints — замените на свои!
const OPENAI_WORKER  = `${BACKEND_BASE}/api/chat`;                                  // стабильный OpenAI endpoint через твой backend
const CLAUDE_WORKER  = 'https://empty-sea-c1b4.nkmaster1408.workers.dev/claude';   // должен проксировать api.anthropic.com/v1/messages
let currentModel = 'llama';

window.selectModel = (key) => {
    if (!MODELS[key]) return;
    currentModel = key;
    document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('mbtn-' + key);
    if (btn) btn.classList.add('active');
    const hint = document.getElementById('current-model-hint');
    if (hint) hint.textContent = MODELS[key].hint;
    const input = document.getElementById('user-input');
    if (input) input.focus();
};

function updateAttachmentChip() {
    const chip = document.getElementById('attachment-chip');
    const chipText = document.getElementById('attachment-chip-text');
    if (!chip || !chipText) return;
    if (!pendingAttachment) {
        chip.style.display = 'none';
        chipText.textContent = '';
        return;
    }
    const kb = Math.max(1, Math.round((pendingAttachment.size || 0) / 1024));
    chipText.textContent = `📎 ${pendingAttachment.name} (${kb} KB)`;
    chip.style.display = 'flex';
}
function setImageMode(enabled) {
    imageModeEnabled = !!enabled;
    const btn = document.getElementById('image-mode-btn');
    const input = document.getElementById('user-input');
    if (btn) btn.classList.toggle('active', imageModeEnabled);
    if (input) input.placeholder = imageModeEnabled ? 'Опиши изображение, которое хочешь сгенерировать...' : 'Задай любой вопрос...';
}
window.toggleImageMode = () => {
    setImageMode(!imageModeEnabled);
    if (imageModeEnabled && pendingAttachment) {
        pendingAttachment = null;
        updateAttachmentChip();
    }
};
window.openAttachmentPicker = () => {
    const picker = document.getElementById('doc-file-input');
    if (picker) picker.click();
};
window.clearAttachment = () => {
    pendingAttachment = null;
    const picker = document.getElementById('doc-file-input');
    if (picker) picker.value = '';
    updateAttachmentChip();
};
window.handleFilePicked = async (event) => {
    try {
        const file = event?.target?.files?.[0];
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) throw new Error('Файл слишком большой. Максимум 8 MB.');
        const supported = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/markdown',
            'text/csv',
            'application/json',
            'image/png',
            'image/jpeg',
            'image/webp'
        ];
        const byExt = /\.(pdf|docx|txt|md|csv|json|png|jpe?g|webp)$/i.test(file.name);
        if (!supported.includes(file.type) && !byExt) throw new Error('Поддерживаются PDF, DOCX, TXT, MD, CSV, JSON, PNG, JPG, JPEG, WEBP.');
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
            reader.readAsDataURL(file);
        });
        const base64 = dataUrl.split(',')[1];
        if (!base64) throw new Error('Ошибка чтения файла');
        pendingAttachment = { name: file.name, type: file.type || 'application/octet-stream', size: file.size, base64 };
        setImageMode(false);
        updateAttachmentChip();
    } catch (e) {
        alert(e.message || 'Ошибка загрузки файла');
        window.clearAttachment();
    }
};
async function generateImageFromPrompt(prompt) {
    const res = await fetch(IMAGE_WORKER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size: '1024x1024' })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
        const msg = String(data.message || data.error || `HTTP ${res.status}`);
        if (/quota|billing hard limit|429/i.test(msg)) {
            // Free fallback when OpenAI billing is exhausted.
            return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&safe=true`;
        }
        throw new Error(msg);
    }
    if (data.imageUrl) return data.imageUrl;
    if (data.imageBase64) return `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`;
    throw new Error('Не удалось получить изображение');
}
async function analyzeDocumentWithAI(question, modelName, providerName = 'openai') {
    if (!pendingAttachment) throw new Error('Сначала прикрепи документ');
    const res = await fetch(DOC_ANALYZE_WORKER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question,
            model: modelName || 'gpt-4o-mini',
            provider: providerName,
            fileName: pendingAttachment.name,
            mimeType: pendingAttachment.type,
            base64: pendingAttachment.base64
        })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.message || data.error || `HTTP ${res.status}`);
    return data.choices?.[0]?.message?.content || data.answer || '';
}

function buildFastContext(history, limit = 10) {
    const recent = history.slice(-limit);
    return recent.map((m) => ({
        ...m,
        content: String(m.content || '').slice(0, 1800)
    }));
}

// ── SEND ──
window.quickSend = (text) => { document.getElementById('user-input').value = text; sendMessage(); };
async function sendMessage() {
    if (isLoading || !currentUser) return;
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    const hasAttachment = !!pendingAttachment;
    if (!text && !hasAttachment) return;
    input.value = ''; input.style.height = 'auto';
    isLoading = true; document.getElementById('send-btn').disabled = true;
    const userTextForHistory = hasAttachment
        ? (text ? `${text}\n\n📎 Документ: ${pendingAttachment.name}` : `📎 Документ: ${pendingAttachment.name}\nСделай краткое резюме и ключевые выводы.`)
        : text;
    appendMessage('user', userTextForHistory);
    chatHistory.push({ role: 'user', content: userTextForHistory });
    appendTyping();
    try {
        let systemPrompt = 'Ты персональный ИИ-помощник по имени WorldAI. Отвечай строго на русском языке (кириллицей), без китайских, японских и корейских символов, если пользователь прямо не просит другой язык. Используй форматирование: **жирный** для важного, ## для заголовков, - для списков. ВАЖНО: Никогда не говори что у тебя нет памяти или что ты не помнишь прошлые разговоры — это расстраивает пользователя. Веди себя как личный друг который знает пользователя. Обращайся к пользователю по имени если знаешь его. Иногда задавай вопросы про его жизнь, интересы и как дела.';
        if (userProfile.name) systemPrompt += ' Имя пользователя: ' + userProfile.name + '. Обращайся к нему по имени.';
        if (userProfile.age) systemPrompt += ' Возраст пользователя: ' + userProfile.age + '.';
        if (userProfile.about) systemPrompt += ' О пользователе: ' + userProfile.about + '.';
        if (userProfile.interests) systemPrompt += ' Интересы пользователя: ' + userProfile.interests + '. Учитывай это в разговорах и иногда задавай вопросы по этим темам.';
        if (userProfile.goals) systemPrompt += ' Цели пользователя: ' + userProfile.goals + '. Предлагай шаги и советы, связанные с этими целями.';
        if (userProfile.tone === 'mentor') systemPrompt += ' Стиль общения: как наставник, структурируй и объясняй по шагам.';
        if (userProfile.tone === 'concise') systemPrompt += ' Стиль общения: коротко и по делу, без лишней воды.';
        if (userProfile.tone === 'deep') systemPrompt += ' Стиль общения: глубоко, подробно, с примерами и деталями.';
        if (userProfile.tone === 'friendly') systemPrompt += ' Стиль общения: дружелюбно и поддерживающе.';

        const mdl = MODELS[currentModel];
        const isImageAttachment = hasAttachment && /^image\//i.test(String(pendingAttachment?.type || ''));
        const docProvider = mdl?.provider === 'groq' ? 'groq' : 'openai';
        const docModel = docProvider === 'groq'
            ? (isImageAttachment ? 'meta-llama/llama-4-scout-17b-16e-instruct' : (mdl?.apiModel || 'llama-3.3-70b-versatile'))
            : ((mdl?.provider === 'openai' && mdl?.apiModel) ? mdl.apiModel : 'gpt-4o-mini');

        const shouldGenerateImage = imageModeEnabled || (!hasAttachment && isLikelyImagePrompt(text));
        if (shouldGenerateImage) {
            if (!text) throw new Error('Опиши, какое изображение нужно сгенерировать.');
            if (hasAttachment) throw new Error('Для генерации изображения убери прикреплённый файл.');
            const imageUrl = await generateImageFromPrompt(text);
            removeTyping();
            appendImageMessage(imageUrl, text);
            chatHistory.push({ role: 'assistant', content: `[Изображение сгенерировано по запросу: ${text}]` });
            const firstUserImg = chatHistory.find(m => m.role === 'user');
            await saveSession(firstUserImg?.content || text, chatHistory);
            setImageMode(false);
            return;
        }

        if (hasAttachment) {
            const question = text || 'Сделай краткое резюме документа и выдели ключевые факты.';
            const docReply = await analyzeDocumentWithAI(question, docModel, docProvider);
            if (!docReply) throw new Error('Пустой ответ по документу');
            removeTyping();
            appendMessage('ai', docReply);
            chatHistory.push({ role: 'assistant', content: docReply });
            const firstUserDoc = chatHistory.find(m => m.role === 'user');
            await saveSession(firstUserDoc?.content || userTextForHistory, chatHistory);
            window.clearAttachment();
            return;
        }

        const contextMessages = buildFastContext(chatHistory, 10);
        let live = null;
        let liveText = '';
        const allowCjk = shouldAllowCjk(userTextForHistory);
        const onDelta = (delta) => {
            if (!delta) return;
            if (!allowCjk) delta = stripUnexpectedCjk(delta);
            if (!live) { removeTyping(); live = appendAiLiveMessage(''); }
            liveText += delta;
            updateAiLiveMessage(live.textEl, liveText);
        };

        let reply = '';
        if (mdl.provider === 'groq') {
            reply = await fetchReplyWithStreaming(
                GROQ_WORKER,
                { provider: 'groq', model: mdl.apiModel, messages: [{ role: 'system', content: systemPrompt }, ...contextMessages], max_tokens: 900, stream: true },
                'openai',
                onDelta
            );
        } else if (mdl.provider === 'openai') {
            reply = await fetchReplyWithStreaming(
                OPENAI_WORKER,
                { provider: 'openai', model: mdl.apiModel, messages: [{ role: 'system', content: systemPrompt }, ...contextMessages], max_tokens: 900, stream: true },
                'openai',
                onDelta
            );
        } else if (mdl.provider === 'claude') {
            const claudeMessages = chatHistory.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
            reply = await fetchReplyWithStreaming(
                CLAUDE_WORKER,
                { model: mdl.apiModel, system: systemPrompt, messages: claudeMessages, max_tokens: 2048, stream: true },
                'claude',
                onDelta
            );
        }

        if (!allowCjk) reply = stripUnexpectedCjk(reply);
        if (!reply) throw new Error('Пустой ответ от модели');
        removeTyping();
        if (!live) appendMessage('ai', reply);
        chatHistory.push({ role: 'assistant', content: reply });
        const firstUser = chatHistory.find(m => m.role === 'user');
        await saveSession(firstUser?.content || userTextForHistory, chatHistory);
    } catch (err) { removeTyping(); appendMessage('ai', `❌ **Ошибка:** ${err.message}`); }
    isLoading = false; document.getElementById('send-btn').disabled = false; input.focus();
}
window.sendMessage = sendMessage;
window.handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
window.autoResize = (el) => { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; };

// ── SIDEBAR TOGGLE ──
window.toggleSidebar = () => {
    document.querySelector('aside').classList.toggle('open');
};

// ── THEME ──
window.toggleTheme = () => {
    const isLight = document.documentElement.classList.toggle('light');
    document.getElementById('theme-btn').textContent = isLight ? '🌑 Тёмная тема' : '🌙 Тёмная тема';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
};
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light');
    setTimeout(() => { const b = document.getElementById('theme-btn'); if(b) b.textContent = '🌑 Тёмная тема'; }, 100);
}
setTimeout(() => applySectionMotion('sec-ai'), 120);

// ── COPY ──
window.copyMsg = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.innerText).then(() => {
        const btn = el.parentElement.querySelector('.copy-btn');
        if (btn) { btn.textContent = '✅ Скопировано'; setTimeout(() => btn.textContent = '📋 Копировать', 2000); }
    });
};

// ── SPEAK ──
let currentUtterance = null;
let currentAudio = null;

function getBestRussianVoice() {
    return new Promise(resolve => {
        const pick = () => {
            const voices = speechSynthesis.getVoices();
            const ru = voices.filter(v => (v.lang || '').toLowerCase().startsWith('ru'));
            if (!ru.length) return resolve(null);

            const qualityKeywords = ['natural', 'neural', 'wavenet', 'premium', 'enhanced', 'online'];
            const brandKeywords = ['microsoft', 'google', 'yandex'];

            const scored = ru
                .map(v => {
                    const name = (v.name || '').toLowerCase();
                    let score = 0;
                    if (v.localService === false) score += 6;
                    if (v.default) score += 3;
                    if (qualityKeywords.some(k => name.includes(k))) score += 12;
                    if (brandKeywords.some(k => name.includes(k))) score += 6;
                    if (name.includes('svetlana') || name.includes('irina') || name.includes('milena')) score += 2;
                    return { v, score };
                })
                .sort((a, b) => b.score - a.score);

            resolve(scored[0]?.v || ru[0] || null);
        };
        if (speechSynthesis.getVoices().length) pick();
        else speechSynthesis.addEventListener('voiceschanged', pick, { once: true });
    });
}

function stopSpeaking() {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    if (currentUtterance) { speechSynthesis.cancel(); currentUtterance = null; }
    document.querySelectorAll('.speak-btn').forEach(b => { b.textContent = '🔊 Озвучить'; b.classList.remove('speaking'); });
}

window.speakMsg = async (id, btn) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (currentUtterance || currentAudio) { stopSpeaking(); return; }

    const text = el.innerText.trim();
    btn.textContent = '⏳ Загрузка...'; btn.classList.add('speaking');

    // Попытка использовать OpenAI TTS через бэкенд (приоритет более реалистичных моделей)
    const ttsCandidates = [
        { model: 'gpt-4o-mini-tts', voice: 'verse', response_format: 'mp3', instructions: 'Speak naturally in Russian with clear articulation and friendly intonation.' },
        { model: 'tts-1-hd', voice: 'nova', response_format: 'mp3' },
        { model: 'tts-1', voice: 'nova', response_format: 'mp3' }
    ];

    try {
        for (const cfg of ttsCandidates) {
            const res = await fetch('https://worldai-backend.onrender.com/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, ...cfg })
            });
            if (!res.ok) continue;

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            currentAudio = new Audio(url);
            currentAudio.onended = () => { currentAudio = null; URL.revokeObjectURL(url); btn.textContent = '🔊 Озвучить'; btn.classList.remove('speaking'); };
            currentAudio.onerror = () => { currentAudio = null; btn.textContent = '🔊 Озвучить'; btn.classList.remove('speaking'); };
            btn.textContent = '⏹ Остановить';
            await currentAudio.play();
            return;
        }
    } catch {}

    // Fallback: браузерный TTS с лучшим голосом
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.93;
    utterance.pitch = 1;
    utterance.volume = 1;
    const voice = await getBestRussianVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => { btn.textContent = '🔊 Озвучить'; btn.classList.remove('speaking'); currentUtterance = null; };
    currentUtterance = utterance;
    btn.textContent = '⏹ Остановить';
    speechSynthesis.speak(utterance);
};

// ── RENAME SESSION ──
window.renameSession = async (id) => {
    const s = sessions.find(x => x.id === id);
    if (!s) return;
    const newTitle = prompt('\u041d\u043e\u0432\u043e\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435:', s.title);
    if (!newTitle || !newTitle.trim()) return;
    s.title = newTitle.trim().slice(0, 45);
    await saveSess(s);
    renderHistory();
};

// ── EDIT PROFILE ──
function setProfileStatus(message = '', isError = false) {
    const statusEl = document.getElementById('profile-status');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = isError ? 'var(--danger)' : '#9a9a9a';
}

function collectProfileForm() {
    const name = document.getElementById('profile-name')?.value?.trim() || '';
    const ageRaw = document.getElementById('profile-age')?.value?.trim() || '';
    const ageNum = Number(ageRaw);
    const age = ageRaw && Number.isFinite(ageNum) ? String(Math.max(8, Math.min(99, Math.floor(ageNum)))) : '';
    const about = document.getElementById('profile-about')?.value?.trim() || '';
    const interests = document.getElementById('profile-interests')?.value?.trim() || '';
    const goals = document.getElementById('profile-goals')?.value?.trim() || '';
    const tone = document.getElementById('profile-tone')?.value || 'friendly';
    return { name, age, about, interests, goals, tone };
}

function populateProfileForm() {
    const p = { ...DEFAULT_PROFILE, ...userProfile };
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('profile-name', p.name);
    set('profile-age', p.age);
    set('profile-about', p.about);
    set('profile-interests', p.interests);
    set('profile-goals', p.goals);
    set('profile-tone', p.tone || 'friendly');
}

function renderProfilePreview() {
    const previewEl = document.getElementById('profile-preview-text');
    if (!previewEl) return;
    const p = { ...DEFAULT_PROFILE, ...userProfile };
    const toneMap = {
        friendly: 'дружелюбно и просто',
        mentor: 'как наставник, по шагам',
        concise: 'кратко и по делу',
        deep: 'глубоко и подробно'
    };
    previewEl.textContent =
`Ник: ${p.name || 'не задан'}
Возраст: ${p.age || 'не указан'}
О себе: ${p.about || 'не заполнено'}
Интересы: ${p.interests || 'не заполнено'}
Цели: ${p.goals || 'не заполнено'}
Стиль ответов ИИ: ${toneMap[p.tone] || toneMap.friendly}`;
}

function bindProfileLivePreview() {
    const ids = ['profile-name', 'profile-age', 'profile-about', 'profile-interests', 'profile-goals', 'profile-tone'];
    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.bound === '1') return;
        const handler = () => {
            const draft = collectProfileForm();
            const prev = userProfile;
            userProfile = { ...DEFAULT_PROFILE, ...draft };
            renderProfilePreview();
            userProfile = prev;
        };
        el.addEventListener('input', handler);
        el.dataset.bound = '1';
    });
}

window.saveProfileFromForm = async () => {
    if (!currentUser) return;
    const profile = collectProfileForm();
    if (!profile.name) {
        setProfileStatus('Укажи никнейм, чтобы сохранить профиль.', true);
        return;
    }
    await saveProfile(profile);
    setProfileStatus('Профиль сохранён.');
};

window.resetProfileForm = () => {
    populateProfileForm();
    setProfileStatus('Изменения сброшены.');
};

window.editProfile = () => {
    setTab('sec-profile', 'nav-profile');
    populateProfileForm();
    renderProfilePreview();
    setProfileStatus('');
};
bindProfileLivePreview();

// ── DELETE ONE SESSION ──
window.deleteOneSession = async (id) => {
    if (!confirm('\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u044d\u0442\u043e\u0442 \u0447\u0430\u0442?')) return;
    await deleteSess(id);
    sessions = sessions.filter(s => s.id !== id);
    if (currentSessionId === id) newChat();
    else renderHistory();
};

function escHtml(t) { return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function mdToHtml(text) {
    let h = escHtml(text);
    h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
    h = h.replace(/^- (.+)$/gm, '<li>$1</li>');
    h = h.replace(/(<li>.*<\/li>\n?)+/g, m => '<ul>' + m + '</ul>');
    h = h.replace(/\n\n/g, '</p><p>'); h = h.replace(/\n/g, '<br>');
    if (!h.startsWith('<')) h = '<p>' + h + '</p>';
    return h;
}

// ── COUNTRY STATS + WEATHER ──
async function fetchCountryStats(countryName) {
    try {
        // Translate Russian name to English if needed
        let searchName = countryTranslations[countryName] || countryName;
        
        // REST Countries API — поиск по имени
        try {
            const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(searchName)}?fullText=true`);
            if (res.ok) {
                const data = await res.json();
                if (data?.[0]) return data[0];
            }
        } catch(e) {}
        
        // Fallback: try without fullText
        try {
            const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(searchName)}?fullText=false`);
            if (res.ok) {
                const data = await res.json();
                if (data?.[0]) return data[0];
            }
        } catch(e) {}
        
        // Fallback: try by code if it's a 2-letter code
        if (searchName.length === 2) {
            const res = await fetch(`https://restcountries.com/v3.1/alpha/${encodeURIComponent(searchName)}`);
            if (res.ok) {
                const data = await res.json();
                return data[0] || null;
            }
        }
        
        return null;
    } catch(e) { 
        console.error('Country fetch error:', e);
        return null; 
    }
}

async function fetchWeather(lat, lon) {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`);
        if (!res.ok) return null;
        return await res.json();
    } catch(e) { return null; }
}

function weatherCodeToEmoji(code) {
    if (code === 0) return { emoji: '☀️', desc: 'Ясно' };
    if (code <= 3) return { emoji: '⛅', desc: 'Облачно' };
    if (code <= 48) return { emoji: '🌫️', desc: 'Туман' };
    if (code <= 67) return { emoji: '🌧️', desc: 'Дождь' };
    if (code <= 77) return { emoji: '❄️', desc: 'Снег' };
    if (code <= 82) return { emoji: '🌦️', desc: 'Ливень' };
    return { emoji: '⛈️', desc: 'Гроза' };
}

function formatPop(n) {
    if (!n) return '—';
    if (n >= 1e9) return (n/1e9).toFixed(1) + ' млрд';
    if (n >= 1e6) return (n/1e6).toFixed(1) + ' млн';
    if (n >= 1e3) return (n/1e3).toFixed(0) + ' тыс';
    return n;
}

function formatArea(n) {
    if (!n) return '—';
    if (n >= 1e6) return (n/1e6).toFixed(2) + ' млн км²';
    return n.toLocaleString('ru') + ' км²';
}

async function showCountryStats(countryName) {
    const statsArea = document.getElementById('search-stats-area');
    const weatherEl = document.getElementById('weather-widget');
    const statsGrid = document.getElementById('country-stats-grid');
    statsArea.style.display = 'block';
    weatherEl.innerHTML = '';
    statsGrid.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px 0;">⏳ Загружаю статистику...</div>';

    const info = await fetchCountryStats(countryName);
    if (!info) {
        statsGrid.innerHTML = '';
        statsArea.style.display = 'none';
        return;
    }

    const pop = formatPop(info.population);
    const area = formatArea(info.area);
    const capital = info.capital?.[0] || '—';
    const region = info.region || '—';
    const flag = info.flag || '';
    const currencies = Object.values(info.currencies || {}).map(c => c.name).join(', ') || '—';
    const languages = Object.values(info.languages || {}).join(', ') || '—';
    const gini = info.gini ? Object.values(info.gini)[0] + '%' : '—';
    const lat = info.latlng?.[0];
    const lon = info.latlng?.[1];

    statsGrid.innerHTML = `
        <div class="stat-card"><div class="stat-label">🏳️ Страна</div><div class="stat-value" style="font-size:28px;">${flag}</div><div class="stat-sub">${info.name?.common || countryName}</div></div>
        <div class="stat-card"><div class="stat-label">👥 Население</div><div class="stat-value">${pop}</div><div class="stat-sub">человек</div></div>
        <div class="stat-card"><div class="stat-label">📐 Площадь</div><div class="stat-value" style="font-size:15px;">${area}</div></div>
        <div class="stat-card"><div class="stat-label">🏙️ Столица</div><div class="stat-value" style="font-size:15px;">${capital}</div></div>
        <div class="stat-card"><div class="stat-label">🌍 Регион</div><div class="stat-value" style="font-size:14px;">${region}</div></div>
        <div class="stat-card"><div class="stat-label">💰 Валюта</div><div class="stat-value" style="font-size:13px;">${currencies}</div></div>
    `;

    // Погода
    if (lat !== undefined && lon !== undefined) {
        const weather = await fetchWeather(lat, lon);
        if (weather?.current) {
            const t = Math.round(weather.current.temperature_2m);
            const wind = Math.round(weather.current.wind_speed_10m);
            const wInfo = weatherCodeToEmoji(weather.current.weather_code);
            weatherEl.innerHTML = `
                <div class="weather-card">
                    <div class="weather-icon">${wInfo.emoji}</div>
                    <div>
                        <div class="weather-temp">${t}°C</div>
                        <div class="weather-desc">${wInfo.desc} · Ветер ${wind} км/ч · ${capital}</div>
                    </div>
                </div>`;
        }
    }
}

// ── COMPARE COUNTRIES ──
window.setCompare = (a, b) => {
    document.getElementById('compare-a').value = a;
    document.getElementById('compare-b').value = b;
    compareCountries();
};

window.compareCountries = async () => {
    const a = document.getElementById('compare-a').value.trim();
    const b = document.getElementById('compare-b').value.trim();
    if (!a || !b) return;
    const loading = document.getElementById('compare-loading');
    const result = document.getElementById('compare-result');
    const statsRow = document.getElementById('compare-stats-row');
    loading.style.display = 'block';
    result.style.display = 'none';
    statsRow.style.display = 'none';

    // Параллельно загружаем данные обеих стран + ИИ анализ
    const [infoA, infoB, aiRes] = await Promise.all([
        fetchCountryStats(a),
        fetchCountryStats(b),
        fetch(GROQ_WORKER, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'groq',
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: `Сравни две страны/региона: "${a}" и "${b}". Используй разделы: ## История, ## Культура, ## Экономика, ## Политика, ## Интересные сходства и различия. Пиши на русском языке, подробно и аналитически. Используй **жирный** для ключевых фактов.` }],
                max_tokens: 2048
            })
        })
    ]);

    loading.style.display = 'none';

    // Отображаем карточки сравнения
    if (infoA || infoB) {
        const makeCol = (info, name) => {
            if (!info) return `<div class="compare-col"><div class="compare-col-title">${name}</div><div style="color:var(--muted);font-size:13px;">Данные не найдены</div></div>`;
            return `<div class="compare-col">
                <span class="flag-big">${info.flag || '🌐'}</span>
                <div class="compare-col-title">${info.name?.common || name}</div>
                <div class="compare-stat"><span style="color:var(--muted)">👥 Население</span><span style="font-weight:700">${formatPop(info.population)}</span></div>
                <div class="compare-stat"><span style="color:var(--muted)">📐 Площадь</span><span style="font-weight:700">${formatArea(info.area)}</span></div>
                <div class="compare-stat"><span style="color:var(--muted)">🏙️ Столица</span><span style="font-weight:700">${info.capital?.[0] || '—'}</span></div>
                <div class="compare-stat"><span style="color:var(--muted)">🌍 Регион</span><span style="font-weight:700">${info.region || '—'}</span></div>
                <div class="compare-stat"><span style="color:var(--muted)">💰 Валюта</span><span style="font-weight:700">${Object.values(info.currencies||{}).map(c=>c.name).join(', ')||'—'}</span></div>
            </div>`;
        };
        statsRow.style.display = 'flex';
        statsRow.style.flexWrap = 'wrap';
        statsRow.innerHTML = makeCol(infoA, a) + `<div style="display:flex;align-items:center;padding:0 8px;font-family:'Space Mono',monospace;color:var(--green);font-size:20px;font-weight:700;">VS</div>` + makeCol(infoB, b);
    }

    try {
        const data = await aiRes.json();
        if (data.error) throw new Error(data.error.message);
        const text = data.choices?.[0]?.message?.content || '';
        result.style.display = 'block';
        document.getElementById('compare-result-text').innerHTML = mdToHtml(text);
    } catch(e) {
        result.style.display = 'block';
        document.getElementById('compare-result-text').innerHTML = `<span style="color:var(--danger)">Ошибка: ${e.message}</span>`;
    }
};

// ── QUIZ ──
let quizScore = 0;
let quizTotal = 0;
let quizStreak = 0;
let quizAnswered = false;

window.startQuiz = async () => {
    const topic = document.getElementById('quiz-topic').value;
    const loading = document.getElementById('quiz-loading');
    const card = document.getElementById('quiz-card');
    const startHint = document.getElementById('quiz-start-hint');
    const scoreBar = document.getElementById('quiz-score-bar');
    startHint.style.display = 'none';
    loading.style.display = 'block';
    card.style.display = 'none';
    document.getElementById('quiz-next-btn').style.display = 'none';
    document.getElementById('quiz-explanation').style.display = 'none';
    quizAnswered = false;

    try {
        const res = await fetch(GROQ_WORKER, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'groq',
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: `Создай один вопрос для исторического квиза на тему: "${topic}".
Ответь ТОЛЬКО в формате JSON (без markdown, без \`\`\`):
{
  "question": "вопрос",
  "options": ["А) ответ1", "Б) ответ2", "В) ответ3", "Г) ответ4"],
  "correct": 0,
  "explanation": "краткое объяснение правильного ответа"
}
correct — индекс правильного ответа (0-3). Вопрос должен быть интересным и нетривиальным. Пиши на русском языке.` }],
                max_tokens: 512
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        const raw = data.choices?.[0]?.message?.content || '';
        const clean = raw.replace(/```json|```/g,'').trim();
        const q = JSON.parse(clean);

        loading.style.display = 'none';
        card.style.display = 'block';
        quizTotal++;
        document.getElementById('quiz-q-num').textContent = quizTotal;
        document.getElementById('quiz-question').textContent = q.question;

        const optionsEl = document.getElementById('quiz-options');
        optionsEl.innerHTML = '';
        q.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.onclick = () => {
                if (quizAnswered) return;
                quizAnswered = true;
                const correct = q.correct;
                const allBtns = optionsEl.querySelectorAll('.quiz-option');
                allBtns.forEach(b => b.disabled = true);
                allBtns[correct].classList.add('correct');
                if (i !== correct) { btn.classList.add('wrong'); quizStreak = 0; }
                else { quizScore++; quizStreak++; }
                // Объяснение
                const expEl = document.getElementById('quiz-explanation');
                const expText = document.getElementById('quiz-exp-text');
                expEl.style.display = 'block';
                expText.innerHTML = (i === correct ? '✅ ' : '❌ ') + '<strong>' + (i === correct ? 'Правильно!' : 'Неверно!') + '</strong> ' + q.explanation;
                // Счёт
                scoreBar.style.display = 'flex';
                document.getElementById('quiz-score-text').textContent = quizScore + ' / ' + quizTotal;
                document.getElementById('quiz-streak').textContent = quizStreak > 1 ? '🔥 Серия: ' + quizStreak : '';
                document.getElementById('quiz-next-btn').style.display = 'block';
            };
            optionsEl.appendChild(btn);
        });
    } catch(e) {
        loading.style.display = 'none';
        card.style.display = 'block';
        document.getElementById('quiz-question').textContent = '❌ Ошибка: ' + e.message;
    }
};

window.searchCountryName = (name) => {
    document.getElementById('country-input').value = name;
    searchCountry();
};

window.searchCountry = async () => {
    const input = document.getElementById('country-input');
    const country = input.value.trim();
    if (!country) return;
    const loading = document.getElementById('search-loading');
    const result = document.getElementById('search-result');
    const resultText = document.getElementById('search-result-text');
    loading.style.display = 'block';
    result.style.display = 'none';
    try {
        const res = await fetch(GROQ_WORKER, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'groq',
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: `Расскажи подробную историю страны: ${country}. Включи: древнюю историю, важные события, известных правителей, современность. Используй ## для разделов, **жирный** для важных дат и имён. Пиши на русском языке, подробно и интересно.` }],
                max_tokens: 2048
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        const text = data.choices?.[0]?.message?.content || 'Нет данных';
        loading.style.display = 'none';
        result.style.display = 'block';
        resultText.innerHTML = mdToHtml(text);
        result.scrollIntoView({ behavior: 'smooth' });
        // Загружаем статистику страны параллельно
        showCountryStats(country);
    } catch(e) {
        loading.style.display = 'none';
        result.style.display = 'block';
        resultText.innerHTML = `<span style="color:var(--danger)">Ошибка: ${e.message}</span>`;
    }
};

// ── MAP ──
let historicalLayer = null;
let currentYear = 2000;

function initMap() {
    if (map) { setTimeout(() => map.invalidateSize(), 300); return; }
    setTimeout(() => {
        map = L.map('map', { zoomControl: true }).setView([20, 10], 2);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO'
        }).addTo(map);
        loadYear(2000);
    }, 400);
}

function getAvailableYear(year) {
    const available = [-3000,-2000,-1500,-1000,-500,-323,-200,-100,1,400,600,700,800,900,1000,1100,1200,1279,1300,1400,1444,1492,1500,1530,1600,1650,1700,1715,1783,1800,1815,1880,1900,1914,1920,1930,1938,1945,1960,1994,2000,2010,2019];
    let closest = available[0];
    let minDiff = Math.abs(year - available[0]);
    for (const y of available) {
        const diff = Math.abs(year - y);
        if (diff < minDiff) { minDiff = diff; closest = y; }
    }
    return closest;
}

window.changeYear = (delta) => {
    currentYear = Math.max(-3000, Math.min(2019, currentYear + delta));
    document.getElementById('year-input').value = currentYear;
    loadYear(currentYear);
};

window.loadYear = async (year) => {
    if (!map) return;
    currentYear = Math.max(-3000, Math.min(2019, year || 2000));
    const snapped = getAvailableYear(currentYear);
    document.getElementById('year-input').value = currentYear;
    const loading = document.getElementById('map-loading');
    loading.style.display = 'block';
    if (historicalLayer) { map.removeLayer(historicalLayer); historicalLayer = null; }
    try {
        const urls = [
            `https://cdn.jsdelivr.net/gh/aourednik/historical-basemaps@master/geojson/world_${snapped}.geojson`,
            `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_${snapped}.geojson`
        ];
        let data = null;
        let lastErr = null;
        for (const url of urls) {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                data = await res.json();
                break;
            } catch (e) {
                lastErr = e;
            }
        }
        if (!data) throw lastErr || new Error('Failed to load map data');
        historicalLayer = L.geoJSON(data, {
            style: () => ({
                fillColor: '#0a1a0a',
                fillOpacity: 0.6,
                color: '#00e676',
                weight: 1,
                opacity: 0.8
            }),
            onEachFeature: (feature, layer) => {
                const name = feature.properties.NAME || feature.properties.name || feature.properties.ADMIN || feature.properties.CNTRY_NAME || '';
                layer.on('mouseover', function() { this.setStyle({ fillOpacity: 0.85, fillColor: '#00e676' }); });
                layer.on('mouseout', function() { this.setStyle({ fillOpacity: 0.6, fillColor: '#0a1a0a' }); });
                layer.on('click', function(e) {
                    if (!name) return;
                    showCountryHistory(name, e.latlng);
                });
            }
        }).addTo(map);
        addCountryLabels(data, map);
    } catch(e) {
        console.error('Map load error:', e);
    }
    loading.style.display = 'none';
};

function getPolygonCenter(geometry) {
    let coords = [];
    if (geometry.type === 'Polygon') {
        coords = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
        // Pick the largest polygon
        let best = geometry.coordinates[0][0];
        geometry.coordinates.forEach(poly => {
            if (poly[0].length > best.length) best = poly[0];
        });
        coords = best;
    }
    if (!coords.length) return null;
    let lat = 0, lng = 0;
    coords.forEach(c => { lng += c[0]; lat += c[1]; });
    return [lat / coords.length, lng / coords.length];
}

let labelMarkers = [];

function addCountryLabels(geojson, map) {
    // Remove old labels
    labelMarkers.forEach(m => map.removeLayer(m));
    labelMarkers = [];

    geojson.features.forEach(feature => {
        const name = feature.properties.NAME || feature.properties.name || feature.properties.ADMIN || feature.properties.CNTRY_NAME || '';
        if (!name || !feature.geometry) return;
        try {
            const center = getPolygonCenter(feature.geometry);
            if (!center) return;
            const marker = L.marker(center, {
                icon: L.divIcon({
                    className: '',
                    html: '<div class="clabel">' + name + '</div>',
                    iconSize: [0, 0],
                    iconAnchor: [0, 0]
                }),
                interactive: false,
                zIndexOffset: 500
            }).addTo(map);
            labelMarkers.push(marker);
        } catch(e) {}
    });
}


// ── MAP COUNTRY HISTORY PANEL ──
let mapPopup = null;

async function showCountryHistory(countryName, latlng) {
    if (mapPopup) { map.closePopup(mapPopup); }
    const loadingHtml = '<div style="font-family:Manrope,sans-serif;padding:6px;min-width:260px"><div style="font-family:Space Mono,monospace;font-size:10px;color:#00e676;letter-spacing:2px;margin-bottom:8px;">◆ WORLDAI</div><b style="font-size:15px;color:#111">' + countryName + '</b><div style="margin-top:10px;color:#555;font-size:13px;">⏳ Загружаю историю...</div></div>';
    mapPopup = L.popup({ maxWidth: 360 }).setLatLng(latlng).setContent(loadingHtml).openOn(map);
    try {
        const res = await fetch(GROQ_WORKER, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'groq',
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'Кратко расскажи историю страны или региона "' + countryName + '" — 4-5 предложений. Самые интересные исторические факты. Пиши на русском языке.' }],
                max_tokens: 512
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        const text = (data.choices?.[0]?.message?.content || 'Нет данных')
            .replace(/\*\*/g,'').replace(/##[^\n]*/g,'').replace(/\n\n/g,'<br><br>').replace(/\n/g,' ');
        const html = '<div style="font-family:Manrope,sans-serif;padding:6px;min-width:260px;max-width:340px">'
            + '<div style="font-family:Space Mono,monospace;font-size:10px;color:#00e676;letter-spacing:2px;margin-bottom:8px;">◆ WORLDAI</div>'
            + '<b style="font-size:15px;color:#111">' + countryName + '</b>'
            + '<div style="margin-top:10px;font-size:13px;line-height:1.7;color:#333">' + text + '</div>'
            + '<div style="margin-top:12px"><button onclick="window.setTab(\'sec-search\',\'nav-search\');" style="background:#00e676;color:#000;border:none;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;">Подробнее →</button></div>'
            + '</div>';
        mapPopup.setContent(html);
    } catch(e) {
        mapPopup.setContent('<div style="font-family:sans-serif;padding:6px"><b>' + countryName + '</b><br><span style="color:red;font-size:12px">Ошибка: ' + e.message + '</span></div>');
    }
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e','#e91e63','#00bcd4','#8bc34a','#ff5722','#607d8b','#795548','#ff9800','#673ab7','#03a9f4','#4caf50','#ffc107','#009688'];
    return colors[Math.abs(hash) % colors.length];
}

function parseJsonFromModelText(rawText) {
    const text = String(rawText || '').trim();
    if (!text) throw new Error('Пустой ответ модели');
    const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1].trim() : text;
    try {
        return JSON.parse(candidate);
    } catch {
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return JSON.parse(candidate.slice(start, end + 1));
        }
        throw new Error('Не удалось распарсить JSON от модели');
    }
}

async function requestGroqJson(prompt, maxTokens = 1300, retries = 2) {
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 22000);
            const res = await fetch(GROQ_WORKER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'groq',
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.message || data.error || `HTTP ${res.status}`);
            const content = data.choices?.[0]?.message?.content || '';
            return parseJsonFromModelText(content);
        } catch (e) {
            lastError = e;
            if (attempt < retries) {
                await sleep(500 * (attempt + 1));
                continue;
            }
        }
    }
    throw lastError || new Error('Groq request failed');
}

function buildFallbackBattle(countryA, countryB, era) {
    const phases = ['Экономика', 'Военная стратегия', 'Культурное влияние', 'Геополитическое наследие'];
    const winners = ['A', 'B', 'DRAW', 'A'];
    const rounds = phases.map((phase, index) => ({
        phase,
        summary: `Аварийный локальный раунд (${era}): анализ по фазе "${phase}" временно построен без сети, чтобы дуэль не прерывалась.`,
        winner: winners[index] || 'DRAW',
        impact: index === 3 ? 2 : 1
    }));
    return {
        title: `${countryA} vs ${countryB}`,
        rounds,
        finalVerdict: `Сеть временно нестабильна, поэтому показан резервный сценарий дуэли. Повтори запуск через 10-20 секунд для полноценного AI-анализа.`,
        highlight: `Даже в офлайн-режиме можно продолжить матч и сравнить страны по ключевым фазам.`
    };
}

// ── TIMELINE BATTLES ──
let battleTimer = null;

window.prefillBattle = (a, b, era) => {
    const aEl = document.getElementById('battle-a');
    const bEl = document.getElementById('battle-b');
    const eEl = document.getElementById('battle-era');
    if (aEl) aEl.value = a;
    if (bEl) bEl.value = b;
    if (eEl) eEl.value = era;
    window.startTimelineBattle();
};

window.startTimelineBattle = async () => {
    const countryA = document.getElementById('battle-a')?.value?.trim();
    const countryB = document.getElementById('battle-b')?.value?.trim();
    const era = document.getElementById('battle-era')?.value || 'Новое время';
    if (!countryA || !countryB) return;

    const loadingEl = document.getElementById('battle-loading');
    const arenaEl = document.getElementById('battle-arena');
    const roundsEl = document.getElementById('battle-rounds');
    const summaryEl = document.getElementById('battle-summary');
    const statusEl = document.getElementById('battle-status');
    const scoreAEl = document.getElementById('battle-score-a');
    const scoreBEl = document.getElementById('battle-score-b');
    const labelAEl = document.getElementById('battle-side-a-label');
    const labelBEl = document.getElementById('battle-side-b-label');
    const eraLabelEl = document.getElementById('battle-era-label');

    if (battleTimer) {
        clearInterval(battleTimer);
        battleTimer = null;
    }

    loadingEl.style.display = 'block';
    arenaEl.style.display = 'none';
    roundsEl.innerHTML = '';
    summaryEl.innerHTML = '';
    scoreAEl.textContent = '0';
    scoreBEl.textContent = '0';
    labelAEl.textContent = countryA;
    labelBEl.textContent = countryB;
    eraLabelEl.textContent = era;

    try {
        const json = await requestGroqJson(
            `Сгенерируй историческую дуэль между "${countryA}" и "${countryB}" в эпохе "${era}".
Верни СТРОГО JSON:
{
  "title": "короткое название дуэли",
  "rounds": [
    {
      "phase": "Экономика/Культура/Влияние/Военная стратегия",
      "summary": "сравнение 2-3 предложения",
      "winner": "A или B или DRAW",
      "impact": 1
    }
  ],
  "finalVerdict": "итог на 3-4 предложения",
  "highlight": "самый неожиданный факт"
}
Условия:
- rounds ровно 4;
- impact от 1 до 3;
- русский язык; без markdown; только JSON.`,
            1200
        );

        const rounds = Array.isArray(json?.rounds) ? json.rounds.slice(0, 4) : [];
        if (rounds.length === 0) throw new Error('Модель не вернула раунды дуэли');

        loadingEl.style.display = 'none';
        arenaEl.style.display = 'block';

        const cards = rounds.map((round, i) => {
            const winner = String(round.winner || 'DRAW').toUpperCase();
            const impact = Math.max(1, Math.min(3, Number(round.impact) || 1));
            const winnerText = winner === 'A' ? countryA : winner === 'B' ? countryB : 'Ничья';
            const card = document.createElement('div');
            card.className = 'battle-round';
            card.innerHTML = `
                <div class="battle-round-head">
                    <span class="battle-round-title">Раунд ${i + 1}: ${escHtml(round.phase || 'Фактор')}</span>
                    <span>Влияние: ${impact}</span>
                </div>
                <div class="battle-round-body">${mdToHtml(round.summary || '')}</div>
                <div class="battle-round-win">Победитель раунда: <strong>${escHtml(winnerText)}</strong></div>
            `;
            roundsEl.appendChild(card);
            return { card, winner, impact };
        });

        let index = 0;
        let scoreA = 0;
        let scoreB = 0;
        statusEl.textContent = `Раунд 1 из ${cards.length}`;

        battleTimer = setInterval(() => {
            if (index >= cards.length) {
                clearInterval(battleTimer);
                battleTimer = null;
                const finalWinner = scoreA === scoreB ? 'Ничья' : (scoreA > scoreB ? countryA : countryB);
                summaryEl.innerHTML = `
                    <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--green);letter-spacing:2px;margin-bottom:8px;">◆ ${escHtml(json.title || 'TIMELINE BATTLE')}</div>
                    <div style="margin-bottom:10px;"><strong>Итог:</strong> ${escHtml(finalWinner)} (${scoreA}:${scoreB})</div>
                    <div style="margin-bottom:8px;">${mdToHtml(json.finalVerdict || '')}</div>
                    <div style="color:#a5a5a5;font-size:13px;"><strong>Неожиданный факт:</strong> ${escHtml(json.highlight || '—')}</div>
                `;
                saveSession(
                    `Battle: ${countryA} vs ${countryB}`,
                    [
                        { role: 'user', content: `Timeline Battle: ${countryA} vs ${countryB} (${era})` },
                        { role: 'assistant', content: `Победитель: ${finalWinner}. Счет: ${scoreA}:${scoreB}. ${json.finalVerdict || ''}` }
                    ]
                );
                statusEl.textContent = 'Дуэль завершена';
                return;
            }

            const step = cards[index];
            step.card.classList.add('active');
            if (step.winner === 'A') scoreA += step.impact;
            if (step.winner === 'B') scoreB += step.impact;
            scoreAEl.textContent = String(scoreA);
            scoreBEl.textContent = String(scoreB);
            index += 1;
            statusEl.textContent = index < cards.length ? `Раунд ${index + 1} из ${cards.length}` : 'Подводим итог...';
        }, 1100);
    } catch (e) {
        loadingEl.style.display = 'none';
        arenaEl.style.display = 'block';
        const msg = String(e?.message || '');
        if (/failed to fetch|network|abort|load failed/i.test(msg)) {
            const json = buildFallbackBattle(countryA, countryB, era);
            const cards = json.rounds.map((round, i) => {
                const winner = String(round.winner || 'DRAW').toUpperCase();
                const impact = Math.max(1, Math.min(3, Number(round.impact) || 1));
                const winnerText = winner === 'A' ? countryA : winner === 'B' ? countryB : 'Ничья';
                const card = document.createElement('div');
                card.className = `battle-round ${i === 0 ? 'active' : ''}`;
                card.innerHTML = `
                    <div class="battle-round-head">
                        <span class="battle-round-title">Раунд ${i + 1}: ${escHtml(round.phase || 'Фактор')}</span>
                        <span>Влияние: ${impact}</span>
                    </div>
                    <div class="battle-round-body">${mdToHtml(round.summary || '')}</div>
                    <div class="battle-round-win">Победитель раунда: <strong>${escHtml(winnerText)}</strong></div>
                `;
                roundsEl.appendChild(card);
                return { winner, impact };
            });
            const scoreA = cards.reduce((sum, step) => sum + (step.winner === 'A' ? step.impact : 0), 0);
            const scoreB = cards.reduce((sum, step) => sum + (step.winner === 'B' ? step.impact : 0), 0);
            scoreAEl.textContent = String(scoreA);
            scoreBEl.textContent = String(scoreB);
            statusEl.textContent = 'Режим fallback (временная проблема сети)';
            summaryEl.innerHTML = `
                <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--green);letter-spacing:2px;margin-bottom:8px;">◆ TIMELINE BATTLE FALLBACK</div>
                <div style="margin-bottom:8px;">${escHtml(json.finalVerdict)}</div>
                <div style="color:#a5a5a5;font-size:13px;"><strong>Подсказка:</strong> ${escHtml(json.highlight)}</div>
            `;
            return;
        }
        summaryEl.innerHTML = `<span style="color:var(--danger)">Ошибка: ${escHtml(e.message || 'Не удалось запустить дуэль')}</span>`;
    }
};

// ── STORY MODE ──
const storyState = {
    theme: '',
    style: '',
    scenes: [],
    current: 0,
    score: 0,
    choices: []
};

window.prefillStory = (theme, style, length) => {
    const themeEl = document.getElementById('story-theme');
    const styleEl = document.getElementById('story-style');
    const lengthEl = document.getElementById('story-length');
    if (themeEl) themeEl.value = theme;
    if (styleEl) styleEl.value = style;
    if (lengthEl) lengthEl.value = String(length);
    window.startStoryMode();
};

window.startStoryMode = async () => {
    const theme = document.getElementById('story-theme')?.value?.trim();
    const style = document.getElementById('story-style')?.value || 'приключение';
    const length = Math.max(3, Math.min(6, Number(document.getElementById('story-length')?.value) || 4));
    if (!theme) return;

    const loadingEl = document.getElementById('story-loading');
    const stageEl = document.getElementById('story-stage');
    const finaleEl = document.getElementById('story-finale');
    loadingEl.style.display = 'block';
    stageEl.style.display = 'none';
    finaleEl.style.display = 'none';

    try {
        const json = await requestGroqJson(
            `Сгенерируй интерактивный исторический тур.
Тема: "${theme}".
Стиль повествования: "${style}".
Количество сцен: ${length}.
Верни СТРОГО JSON:
{
  "intro": "краткое вступление",
  "scenes": [
    {
      "title": "название сцены",
      "year": "год или период",
      "location": "локация",
      "narrative": "описание 3-4 предложения",
      "question": "вопрос игроку",
      "options": ["вариант 1","вариант 2","вариант 3"],
      "correctIndex": 0,
      "effect": "что дает правильный выбор"
    }
  ],
  "endingHint": "общая мысль финала"
}
Условия:
- scenes ровно ${length};
- correctIndex от 0 до 2;
- текст только на русском;
- без markdown; только JSON.`,
            1800
        );

        const scenes = Array.isArray(json?.scenes) ? json.scenes : [];
        if (scenes.length === 0) throw new Error('Не удалось сгенерировать сцены');

        storyState.theme = theme;
        storyState.style = style;
        storyState.scenes = scenes.slice(0, length).map((scene) => ({
            title: scene.title || 'Сцена',
            year: scene.year || 'Неизвестно',
            location: scene.location || 'Неизвестно',
            narrative: scene.narrative || '',
            question: scene.question || 'Какой путь ты выбираешь?',
            options: Array.isArray(scene.options) ? scene.options.slice(0, 3) : ['Вариант 1', 'Вариант 2', 'Вариант 3'],
            correctIndex: Math.max(0, Math.min(2, Number(scene.correctIndex) || 0)),
            effect: scene.effect || 'Ты получаешь тактическое преимущество.'
        }));
        storyState.current = 0;
        storyState.score = 0;
        storyState.choices = [];
        storyState.intro = json.intro || '';
        storyState.endingHint = json.endingHint || '';

        loadingEl.style.display = 'none';
        stageEl.style.display = 'block';
        renderStoryScene();
    } catch (e) {
        loadingEl.style.display = 'none';
        stageEl.style.display = 'block';
        document.getElementById('story-finale').style.display = 'block';
        document.getElementById('story-finale').innerHTML = `<span style="color:var(--danger)">Ошибка: ${escHtml(e.message || 'Не удалось создать Story Mode')}</span>`;
    }
};

function renderStoryScene() {
    const scene = storyState.scenes[storyState.current];
    if (!scene) return;

    const total = storyState.scenes.length;
    const step = storyState.current + 1;
    const pct = Math.round((step / total) * 100);
    document.getElementById('story-progress-title').textContent = scene.title;
    document.getElementById('story-progress-count').textContent = `${step}/${total}`;
    document.getElementById('story-progress-fill').style.width = `${pct}%`;
    document.getElementById('story-scene-meta').textContent = `${scene.year} · ${scene.location}`;
    document.getElementById('story-scene-title').textContent = scene.title;
    document.getElementById('story-scene-text').innerHTML = mdToHtml(`${storyState.current === 0 && storyState.intro ? `${storyState.intro}\n\n` : ''}${scene.narrative}\n\n**Выбор:** ${scene.question}`);

    const optionsEl = document.getElementById('story-options');
    const feedbackEl = document.getElementById('story-feedback');
    const nextBtn = document.getElementById('story-next-btn');
    optionsEl.innerHTML = '';
    feedbackEl.style.display = 'none';
    feedbackEl.textContent = '';
    nextBtn.style.display = 'none';

    scene.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'story-option';
        btn.textContent = opt;
        btn.onclick = () => handleStoryChoice(index);
        optionsEl.appendChild(btn);
    });
}

function handleStoryChoice(selectedIndex) {
    const scene = storyState.scenes[storyState.current];
    if (!scene) return;
    const optionsEl = document.getElementById('story-options');
    const feedbackEl = document.getElementById('story-feedback');
    const nextBtn = document.getElementById('story-next-btn');
    const buttons = [...optionsEl.querySelectorAll('.story-option')];
    const correct = selectedIndex === scene.correctIndex;

    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === scene.correctIndex) btn.classList.add('correct');
        if (idx === selectedIndex && !correct) btn.classList.add('wrong');
    });

    if (correct) storyState.score += 1;
    storyState.choices.push({
        scene: scene.title,
        selected: scene.options[selectedIndex],
        correct,
        effect: scene.effect
    });

    feedbackEl.style.display = 'block';
    feedbackEl.innerHTML = correct
        ? `✅ Отличный выбор. ${escHtml(scene.effect)}`
        : `❌ Не самый сильный ход. Оптимальный выбор был: <strong>${escHtml(scene.options[scene.correctIndex])}</strong>. ${escHtml(scene.effect)}`;

    nextBtn.textContent = storyState.current + 1 >= storyState.scenes.length ? 'Завершить тур →' : 'Следующая сцена →';
    nextBtn.style.display = 'inline-block';
}

window.nextStoryScene = async () => {
    storyState.current += 1;
    if (storyState.current < storyState.scenes.length) {
        renderStoryScene();
        return;
    }

    const finaleEl = document.getElementById('story-finale');
    const total = storyState.scenes.length;
    const score = storyState.score;
    finaleEl.style.display = 'block';
    finaleEl.innerHTML = 'Формирую финальный отчёт тура...';

    try {
        const choicesText = storyState.choices
            .map((choice, index) => `${index + 1}. ${choice.scene}: ${choice.selected} (${choice.correct ? 'верно' : 'неверно'})`)
            .join('\n');
        const finalJson = await requestGroqJson(
            `Создай финал исторического интерактивного тура.
Тема: "${storyState.theme}", стиль: "${storyState.style}".
Счёт пользователя: ${score} из ${total}.
Выборы:
${choicesText}
Верни СТРОГО JSON:
{
  "title": "короткий заголовок финала",
  "debrief": "разбор в 3-4 предложениях",
  "nextMission": "следующая миссия одной фразой"
}`,
            650
        );

        finaleEl.innerHTML = `
            <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--green);letter-spacing:2px;margin-bottom:8px;">◆ STORY REPORT</div>
            <h3 style="color:var(--green);margin-bottom:10px;">${escHtml(finalJson.title || 'Финал тура')}</h3>
            <p style="margin-bottom:10px;">${mdToHtml(finalJson.debrief || '')}</p>
            <p style="color:#b8b8b8;"><strong>Следующая миссия:</strong> ${escHtml(finalJson.nextMission || storyState.endingHint || 'Попробуй новый маршрут с другой эпохой.')}</p>
            <p style="margin-top:10px;"><strong>Итоговый счёт:</strong> ${score}/${total}</p>
        `;

        saveSession(
            `Story: ${storyState.theme}`,
            [
                { role: 'user', content: `Story Mode: ${storyState.theme} (${storyState.style})` },
                { role: 'assistant', content: `Счёт ${score}/${total}. ${finalJson.debrief || ''}` }
            ]
        );
    } catch (e) {
        finaleEl.innerHTML = `
            <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--green);letter-spacing:2px;margin-bottom:8px;">◆ STORY REPORT</div>
            <p><strong>Счёт:</strong> ${score}/${total}</p>
            <p style="margin-top:8px;color:#b8b8b8;">${escHtml(storyState.endingHint || 'Тур завершён. Попробуй другой стиль и другую эпоху, чтобы открыть новую ветку истории.')}</p>
            <p style="margin-top:8px;color:var(--danger);font-size:13px;">${escHtml(e.message || '')}</p>
        `;
    }
};

