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
const GROQ_WORKER = 'https://worldai-backend.onrender.com/api/chat';

// â”€â”€ COUNTRY TRANSLATION + CODES DICT â”€â”€
const countryTranslations = {
    'Ð Ð¾ÑÑÐ¸Ñ': 'Russian Federation', 'Ð Ð¤': 'Russian Federation',
    'ÐšÐ°Ð·Ð°Ñ…ÑÑ‚Ð°Ð½': 'Kazakhstan', 'ÐšÐ—': 'Kazakhstan',
    'Ð¯Ð¿Ð¾Ð½Ð¸Ñ': 'Japan', 'ÐšÐ¾Ñ€ÐµÑ': 'South Korea', 'Ð¡ÐµÐ²ÐµÑ€Ð½Ð°Ñ ÐšÐ¾Ñ€ÐµÑ': 'North Korea', 'Ð”ÐŸÐ  ÐšÐ¾Ñ€ÐµÑ': 'North Korea',
    'ÐšÐ¸Ñ‚Ð°Ð¹': 'China', 'Ð¡Ð¨Ð': 'United States', 'Ð¢ÑƒÑ€Ñ†Ð¸Ñ': 'Turkey',
    'Ð“ÐµÑ€Ð¼Ð°Ð½Ð¸Ñ': 'Germany', 'Ð¤Ñ€Ð°Ð½Ñ†Ð¸Ñ': 'France', 'Ð’ÐµÐ»Ð¸ÐºÐ¾Ð±Ñ€Ð¸Ñ‚Ð°Ð½Ð¸Ñ': 'United Kingdom',
    'Ð•Ð³Ð¸Ð¿ÐµÑ‚': 'Egypt', 'ÐžÐÐ­': 'United Arab Emirates', 'ÐÐ²ÑÑ‚Ñ€Ð°Ð»Ð¸Ñ': 'Australia',
    'Ð˜Ð½Ð´Ð¸Ñ': 'India', 'Ð‘Ñ€Ð°Ð·Ð¸Ð»Ð¸Ñ': 'Brazil', 'ÐœÐµÐºÑÐ¸ÐºÐ°': 'Mexico',
    'ÐœÐ¾Ð½Ð³Ð¾Ð»Ð¸Ñ': 'Mongolia', 'Ð“Ñ€ÐµÑ†Ð¸Ñ': 'Greece', 'Ð Ð¸Ð¼': 'Italy',
    'Ð˜ÑÐ¿Ð°Ð½Ð¸Ñ': 'Spain', 'Ð˜Ñ‚Ð°Ð»Ð¸Ñ': 'Italy', 'ÐŸÐ¾Ñ€Ñ‚ÑƒÐ³Ð°Ð»Ð¸Ñ': 'Portugal',
    'Ð¨Ð²ÐµÑ†Ð¸Ñ': 'Sweden', 'ÐÐ¾Ñ€Ð²ÐµÐ³Ð¸Ñ': 'Norway', 'Ð¤Ð¸Ð½Ð»ÑÐ½Ð´Ð¸Ñ': 'Finland',
    'ÐŸÐ¾Ð»ÑŒÑˆÐ°': 'Poland', 'Ð§ÐµÑ…Ð¸Ñ': 'Czech Republic', 'Ð’ÐµÐ½Ð³Ñ€Ð¸Ñ': 'Hungary',
    'Ð ÑƒÐ¼Ñ‹Ð½Ð¸Ñ': 'Romania', 'Ð‘Ð¾Ð»Ð³Ð°Ñ€Ð¸Ñ': 'Bulgaria', 'Ð¡ÐµÑ€Ð±Ð¸Ñ': 'Serbia',
    'Ð£ÐºÑ€Ð°Ð¸Ð½Ð°': 'Ukraine', 'Ð‘ÐµÐ»Ð°Ñ€ÑƒÑÑŒ': 'Belarus', 'ÐœÐ¾Ð»Ð´Ð¾Ð²Ð°': 'Moldova',
    'Ð“Ñ€ÑƒÐ·Ð¸Ñ': 'Georgia', 'ÐÑ€Ð¼ÐµÐ½Ð¸Ñ': 'Armenia', 'ÐÐ·ÐµÑ€Ð±Ð°Ð¹Ð´Ð¶Ð°Ð½': 'Azerbaijan',
    'Ð£Ð·Ð±ÐµÐºÐ¸ÑÑ‚Ð°Ð½': 'Uzbekistan', 'Ð¢ÑƒÑ€ÐºÐ¼ÐµÐ½Ð¸ÑÑ‚Ð°Ð½': 'Turkmenistan', 'ÐšÑ‹Ñ€Ð³Ñ‹Ð·ÑÑ‚Ð°Ð½': 'Kyrgyzstan',
    'Ð¢Ð°Ð´Ð¶Ð¸ÐºÐ¸ÑÑ‚Ð°Ð½': 'Tajikistan', 'ÐÑ„Ð³Ð°Ð½Ð¸ÑÑ‚Ð°Ð½': 'Afghanistan', 'Ð˜Ñ€Ð°Ð½': 'Iran',
    'Ð˜Ñ€Ð°Ðº': 'Iraq', 'Ð¡Ð°ÑƒÐ´Ð¾Ð²ÑÐºÐ°Ñ ÐÑ€Ð°Ð²Ð¸Ñ': 'Saudi Arabia', 'Ð˜Ð·Ñ€Ð°Ð¸Ð»ÑŒ': 'Israel',
    'Ð˜Ð¾Ñ€Ð´Ð°Ð½Ð¸Ñ': 'Jordan', 'Ð›Ð¸Ð²Ð°Ð½': 'Lebanon', 'Ð¡Ð¸Ñ€Ð¸Ñ': 'Syria',
    'ÐŸÐ°ÐºÐ¸ÑÑ‚Ð°Ð½': 'Pakistan', 'Ð‘Ð°Ð½Ð³Ð»Ð°Ð´ÐµÑˆ': 'Bangladesh', 'Ð¨Ñ€Ð¸-Ð›Ð°Ð½ÐºÐ°': 'Sri Lanka',
    'Ð¢Ð°Ð¸Ð»Ð°Ð½Ð´': 'Thailand', 'Ð’ÑŒÐµÑ‚Ð½Ð°Ð¼': 'Vietnam', 'Ð›Ð°Ð¾Ñ': 'Laos',
    'ÐšÐ°Ð¼Ð±Ð¾Ð´Ð¶Ð°': 'Cambodia', 'ÐœÐ°Ð»Ð°Ð¹Ð·Ð¸Ñ': 'Malaysia', 'Ð¡Ð¸Ð½Ð³Ð°Ð¿ÑƒÑ€': 'Singapore',
    'Ð¤Ð¸Ð»Ð¸Ð¿Ð¿Ð¸Ð½Ñ‹': 'Philippines', 'Ð˜Ð½Ð´Ð¾Ð½ÐµÐ·Ð¸Ñ': 'Indonesia',
    'ÐÐ½Ð³Ð»Ð¸Ñ': 'United Kingdom', 'Ð¨Ð¾Ñ‚Ð»Ð°Ð½Ð´Ð¸Ñ': 'United Kingdom', 'Ð£ÑÐ»ÑŒÑ': 'United Kingdom'
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

// â”€â”€ AUTH â”€â”€
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

// â”€â”€ USER PROFILE â”€â”€
let userProfile = { name: '', interests: '' };

async function loadProfile() {
    if (!currentUser) return;
    try {
        const { getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const snap = await getDoc(doc(db, 'users', currentUser.uid, 'profile', 'data'));
        if (snap.exists()) {
            userProfile = snap.data();
        } else {
            setTimeout(() => askForProfile(), 1500);
        }
    } catch(e) { console.error(e); }
}

async function saveProfile(name, interests) {
    if (!currentUser) return;
    try {
        userProfile = { name, interests };
        await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'data'), userProfile);
    } catch(e) { console.error(e); }
}

function askForProfile() {
    const name = prompt('\u041a\u0430\u043a \u0442\u0435\u0431\u044f \u0437\u043e\u0432\u0443\u0442?');
    if (!name || !name.trim()) return;
    const interests = prompt('\u0427\u0435\u043c \u0438\u043d\u0442\u0435\u0440\u0435\u0441\u0443\u0435\u0448\u044c\u0441\u044f? (\u043d\u0430\u043f\u0440\u0438\u043c\u0435\u0440: \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435, \u0438\u0441\u0442\u043e\u0440\u0438\u044f, \u043c\u0443\u0437\u044b\u043a\u0430)');
    saveProfile(name.trim(), (interests || '').trim());
    appendMessage('ai', '\u041f\u0440\u0438\u044f\u0442\u043d\u043e \u043f\u043e\u0437\u043d\u0430\u043a\u043e\u043c\u0438\u0442\u044c\u0441\u044f, ' + name.trim() + '! \u0422\u0435\u043f\u0435\u0440\u044c \u044f \u0431\u0443\u0434\u0443 \u043f\u043e\u043c\u043d\u0438\u0442\u044c \u0442\u0435\u0431\u044f. \u0427\u0435\u043c \u043c\u043e\u0433\u0443 \u043f\u043e\u043c\u043e\u0447\u044c?');
}

// â”€â”€ FIRESTORE â”€â”€
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

// â”€â”€ TABS â”€â”€
window.setTab = (sectionId, navId) => {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.getElementById(navId).classList.add('active');
    if (sectionId === 'sec-map') initMap();
    if (sectionId === 'sec-search') { setTimeout(() => document.getElementById('country-input').focus(), 100); }
};

// â”€â”€ NEW CHAT â”€â”€
window.newChat = () => {
    chatHistory = []; currentSessionId = null;
    document.getElementById('messages').innerHTML = `
        <div class="welcome" id="welcome-screen">
            <h1>WORLDAI</h1>
            <p>ÐÐ°ÑÑ‚Ð¾ÑÑ‰Ð¸Ð¹ Ð˜Ð˜ Ð¿Ñ€ÑÐ¼Ð¾ Ð² Ð±Ñ€Ð°ÑƒÐ·ÐµÑ€Ðµ.<br>Ð—Ð°Ð´Ð°Ð¹ Ð»ÑŽÐ±Ð¾Ð¹ Ð²Ð¾Ð¿Ñ€Ð¾Ñ â€” Ð¾Ñ‚ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ð¸ Ð´Ð¾ Ð½Ð°ÑƒÐºÐ¸.</p>
            <div class="chips">
                <div class="chip" onclick="quickSend('Ð Ð°ÑÑÐºÐ°Ð¶Ð¸ Ð¸ÑÑ‚Ð¾Ñ€Ð¸ÑŽ ÐšÐ°Ð·Ð°Ñ…ÑÑ‚Ð°Ð½Ð°')">ðŸ“œ Ð˜ÑÑ‚Ð¾Ñ€Ð¸Ñ ÐšÐ°Ð·Ð°Ñ…ÑÑ‚Ð°Ð½Ð°</div>
                <div class="chip" onclick="quickSend('Ð§Ñ‚Ð¾ Ñ‚Ð°ÐºÐ¾Ðµ ÐºÐ²Ð°Ð½Ñ‚Ð¾Ð²Ð°Ñ Ñ„Ð¸Ð·Ð¸ÐºÐ° Ð¿Ñ€Ð¾ÑÑ‚Ñ‹Ð¼Ð¸ ÑÐ»Ð¾Ð²Ð°Ð¼Ð¸?')">âš›ï¸ ÐšÐ²Ð°Ð½Ñ‚Ð¾Ð²Ð°Ñ Ñ„Ð¸Ð·Ð¸ÐºÐ°</div>
                <div class="chip" onclick="quickSend('ÐÐ°Ð¿Ð¸ÑˆÐ¸ ÑÑÑÐµ Ð¿Ñ€Ð¾ Ð¡Ð¡Ð¡Ð ')">ðŸ‡·ðŸ‡º Ð­ÑÑÐµ Ð¿Ñ€Ð¾ Ð¡Ð¡Ð¡Ð </div>
                <div class="chip" onclick="quickSend('ÐšÐ°Ðº ÑÑ‚Ð°Ñ‚ÑŒ Ð¿Ñ€Ð¾Ð³Ñ€Ð°Ð¼Ð¼Ð¸ÑÑ‚Ð¾Ð¼ Ñ Ð½ÑƒÐ»Ñ?')">ðŸ’» Ð¡Ñ‚Ð°Ñ‚ÑŒ Ð¿Ñ€Ð¾Ð³Ñ€Ð°Ð¼Ð¼Ð¸ÑÑ‚Ð¾Ð¼</div>
                <div class="chip" onclick="quickSend('ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ Ð½ÐµÐ±Ð¾ Ð³Ð¾Ð»ÑƒÐ±Ð¾Ðµ?')">ðŸŒ¤ ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ Ð½ÐµÐ±Ð¾ Ð³Ð¾Ð»ÑƒÐ±Ð¾Ðµ?</div>
            </div>
        </div>`;
    document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active-hist'));
    setTab('sec-ai', 'nav-ai');
};

// â”€â”€ HISTORY â”€â”€
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
        item.innerHTML = `<div class="hist-dot"></div><span style="overflow:hidden;text-overflow:ellipsis;flex:1">${escHtml(s.title)}</span><button class="hist-rename" onclick="event.stopPropagation();renameSession(${s.id})" title="ÐŸÐµÑ€ÐµÐ¸Ð¼ÐµÐ½Ð¾Ð²Ð°Ñ‚ÑŒ">âœï¸</button><button class="hist-delete" onclick="event.stopPropagation();deleteOneSession(${s.id})" title="Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ">ðŸ—‘</button>`;
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

// â”€â”€ MESSAGES â”€â”€
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
        div.innerHTML = `<div class="ai-label">â—† ${modelLabel.toUpperCase()}</div><div class="ai-text" id="${msgId}">${mdToHtml(text)}</div><div class="msg-actions"><button class="copy-btn" onclick="copyMsg('${msgId}')">ðŸ“‹ ÐšÐ¾Ð¿Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ</button><button class="speak-btn" onclick="speakMsg('${msgId}', this)">ðŸ”Š ÐžÐ·Ð²ÑƒÑ‡Ð¸Ñ‚ÑŒ</button></div>`;
    }
    msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight; return div;
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
    div.innerHTML = `<div class="ai-label">â—† ${modelLabel.toUpperCase()}</div><div class="ai-text" id="${msgId}">${mdToHtml(initialText)}</div><div class="msg-actions"><button class="copy-btn" onclick="copyMsg('${msgId}')">ðŸ“‹ ÐšÐ¾Ð¿Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ</button><button class="speak-btn" onclick="speakMsg('${msgId}', this)">ðŸ”Š ÐžÐ·Ð²ÑƒÑ‡Ð¸Ñ‚ÑŒ</button></div>`;
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
    div.innerHTML = `<div class="ai-label">â—† WORLDAI</div><div class="typing-indicator"><span></span><span></span><span></span></div>`;
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
async function fetchReplyWithStreaming(url, payload, provider, onDelta) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
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
        throw new Error('ÐŸÑƒÑÑ‚Ð¾Ð¹ Ð¿Ð¾Ñ‚Ð¾ÐºÐ¾Ð²Ñ‹Ð¹ Ð¾Ñ‚Ð²ÐµÑ‚');
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    const reply = extractReplyFromJson(data, provider);
    if (!reply) throw new Error('ÐŸÑƒÑÑ‚Ð¾Ð¹ Ð¾Ñ‚Ð²ÐµÑ‚ Ð¾Ñ‚ Ð¼Ð¾Ð´ÐµÐ»Ð¸');
    await revealReplyGradually(reply, onDelta);
    return reply;
}

// â”€â”€ MODEL SWITCHER â”€â”€
const MODELS = {
    'llama':         { label: 'Llama 3.3 (Groq)', hint: 'Llama 3.3 Â· Groq Â· Ð‘ÐµÑÐ¿Ð»Ð°Ñ‚Ð½Ð¾', provider: 'groq',    apiModel: 'llama-3.3-70b-versatile' },
    'gpt4o-mini':    { label: 'GPT-4o mini',       hint: 'GPT-4o mini Â· OpenAI',          provider: 'openai',  apiModel: 'gpt-4o-mini' },
    'gpt4o':         { label: 'GPT-4o',            hint: 'GPT-4o Â· OpenAI',               provider: 'openai',  apiModel: 'gpt-4o' },
    'claude-haiku':  { label: 'Claude Haiku',      hint: 'Claude Haiku 4.5 Â· Anthropic',  provider: 'claude',  apiModel: 'claude-haiku-4-5-20251001' },
    'claude-sonnet': { label: 'Claude Sonnet',     hint: 'Claude Sonnet 4.6 Â· Anthropic', provider: 'claude',  apiModel: 'claude-sonnet-4-6' },
};
// Worker endpoints â€” Ð·Ð°Ð¼ÐµÐ½Ð¸Ñ‚Ðµ Ð½Ð° ÑÐ²Ð¾Ð¸!
const OPENAI_WORKER  = 'https://empty-sea-c1b4.nkmaster1408.workers.dev/openai';   // Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð¿Ñ€Ð¾ÐºÑÐ¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ api.openai.com/v1/chat/completions
const CLAUDE_WORKER  = 'https://empty-sea-c1b4.nkmaster1408.workers.dev/claude';   // Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð¿Ñ€Ð¾ÐºÑÐ¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ api.anthropic.com/v1/messages
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

// â”€â”€ SEND â”€â”€
window.quickSend = (text) => { document.getElementById('user-input').value = text; sendMessage(); };
async function sendMessage() {
    if (isLoading || !currentUser) return;
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = ''; input.style.height = 'auto';
    isLoading = true; document.getElementById('send-btn').disabled = true;
    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });
    appendTyping();
    try {
        let systemPrompt = 'Ð¢Ñ‹ Ð¿ÐµÑ€ÑÐ¾Ð½Ð°Ð»ÑŒÐ½Ñ‹Ð¹ Ð˜Ð˜-Ð¿Ð¾Ð¼Ð¾Ñ‰Ð½Ð¸Ðº Ð¿Ð¾ Ð¸Ð¼ÐµÐ½Ð¸ WorldAI. ÐžÑ‚Ð²ÐµÑ‡Ð°Ð¹ Ð½Ð° Ñ€ÑƒÑÑÐºÐ¾Ð¼ ÑÐ·Ñ‹ÐºÐµ. Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐ¹ Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ: **Ð¶Ð¸Ñ€Ð½Ñ‹Ð¹** Ð´Ð»Ñ Ð²Ð°Ð¶Ð½Ð¾Ð³Ð¾, ## Ð´Ð»Ñ Ð·Ð°Ð³Ð¾Ð»Ð¾Ð²ÐºÐ¾Ð², - Ð´Ð»Ñ ÑÐ¿Ð¸ÑÐºÐ¾Ð². Ð’ÐÐ–ÐÐž: ÐÐ¸ÐºÐ¾Ð³Ð´Ð° Ð½Ðµ Ð³Ð¾Ð²Ð¾Ñ€Ð¸ Ñ‡Ñ‚Ð¾ Ñƒ Ñ‚ÐµÐ±Ñ Ð½ÐµÑ‚ Ð¿Ð°Ð¼ÑÑ‚Ð¸ Ð¸Ð»Ð¸ Ñ‡Ñ‚Ð¾ Ñ‚Ñ‹ Ð½Ðµ Ð¿Ð¾Ð¼Ð½Ð¸ÑˆÑŒ Ð¿Ñ€Ð¾ÑˆÐ»Ñ‹Ðµ Ñ€Ð°Ð·Ð³Ð¾Ð²Ð¾Ñ€Ñ‹ â€” ÑÑ‚Ð¾ Ñ€Ð°ÑÑÑ‚Ñ€Ð°Ð¸Ð²Ð°ÐµÑ‚ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»Ñ. Ð’ÐµÐ´Ð¸ ÑÐµÐ±Ñ ÐºÐ°Ðº Ð»Ð¸Ñ‡Ð½Ñ‹Ð¹ Ð´Ñ€ÑƒÐ³ ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ð¹ Ð·Ð½Ð°ÐµÑ‚ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»Ñ. ÐžÐ±Ñ€Ð°Ñ‰Ð°Ð¹ÑÑ Ðº Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŽ Ð¿Ð¾ Ð¸Ð¼ÐµÐ½Ð¸ ÐµÑÐ»Ð¸ Ð·Ð½Ð°ÐµÑˆÑŒ ÐµÐ³Ð¾. Ð˜Ð½Ð¾Ð³Ð´Ð° Ð·Ð°Ð´Ð°Ð²Ð°Ð¹ Ð²Ð¾Ð¿Ñ€Ð¾ÑÑ‹ Ð¿Ñ€Ð¾ ÐµÐ³Ð¾ Ð¶Ð¸Ð·Ð½ÑŒ, Ð¸Ð½Ñ‚ÐµÑ€ÐµÑÑ‹ Ð¸ ÐºÐ°Ðº Ð´ÐµÐ»Ð°.';
        if (userProfile.name) systemPrompt += ' Ð˜Ð¼Ñ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»Ñ: ' + userProfile.name + '. ÐžÐ±Ñ€Ð°Ñ‰Ð°Ð¹ÑÑ Ðº Ð½ÐµÐ¼Ñƒ Ð¿Ð¾ Ð¸Ð¼ÐµÐ½Ð¸.';
        if (userProfile.interests) systemPrompt += ' Ð˜Ð½Ñ‚ÐµÑ€ÐµÑÑ‹ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»Ñ: ' + userProfile.interests + '. Ð£Ñ‡Ð¸Ñ‚Ñ‹Ð²Ð°Ð¹ ÑÑ‚Ð¾ Ð² Ñ€Ð°Ð·Ð³Ð¾Ð²Ð¾Ñ€Ð°Ñ… Ð¸ Ð¸Ð½Ð¾Ð³Ð´Ð° Ð·Ð°Ð´Ð°Ð²Ð°Ð¹ Ð²Ð¾Ð¿Ñ€Ð¾ÑÑ‹ Ð¿Ð¾ ÑÑ‚Ð¸Ð¼ Ñ‚ÐµÐ¼Ð°Ð¼.';

        const mdl = MODELS[currentModel];
        let live = null;
        let liveText = '';
        const onDelta = (delta) => {
            if (!delta) return;
            if (!live) { removeTyping(); live = appendAiLiveMessage(''); }
            liveText += delta;
            updateAiLiveMessage(live.textEl, liveText);
        };

        let reply = '';
        if (mdl.provider === 'groq') {
            reply = await fetchReplyWithStreaming(
                GROQ_WORKER,
                { model: mdl.apiModel, messages: [{ role: 'system', content: systemPrompt }, ...chatHistory], max_tokens: 2048, stream: true },
                'openai',
                onDelta
            );
        } else if (mdl.provider === 'openai') {
            reply = await fetchReplyWithStreaming(
                OPENAI_WORKER,
                { model: mdl.apiModel, messages: [{ role: 'system', content: systemPrompt }, ...chatHistory], max_tokens: 2048, stream: true },
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

        if (!reply) throw new Error('ÐŸÑƒÑÑ‚Ð¾Ð¹ Ð¾Ñ‚Ð²ÐµÑ‚ Ð¾Ñ‚ Ð¼Ð¾Ð´ÐµÐ»Ð¸');
        removeTyping();
        if (!live) appendMessage('ai', reply);
        chatHistory.push({ role: 'assistant', content: reply });
        const firstUser = chatHistory.find(m => m.role === 'user');
        await saveSession(firstUser?.content || text, chatHistory);
    } catch (err) { removeTyping(); appendMessage('ai', `âŒ **ÐžÑˆÐ¸Ð±ÐºÐ°:** ${err.message}`); }
    isLoading = false; document.getElementById('send-btn').disabled = false; input.focus();
}
window.sendMessage = sendMessage;
window.handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
window.autoResize = (el) => { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; };

// â”€â”€ SIDEBAR TOGGLE â”€â”€
window.toggleSidebar = () => {
    document.querySelector('aside').classList.toggle('open');
};

// â”€â”€ THEME â”€â”€
window.toggleTheme = () => {
    const isLight = document.documentElement.classList.toggle('light');
    document.getElementById('theme-btn').textContent = isLight ? 'ðŸŒ‘ Ð¢Ñ‘Ð¼Ð½Ð°Ñ Ñ‚ÐµÐ¼Ð°' : 'ðŸŒ™ Ð¢Ñ‘Ð¼Ð½Ð°Ñ Ñ‚ÐµÐ¼Ð°';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
};
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light');
    setTimeout(() => { const b = document.getElementById('theme-btn'); if(b) b.textContent = 'ðŸŒ‘ Ð¢Ñ‘Ð¼Ð½Ð°Ñ Ñ‚ÐµÐ¼Ð°'; }, 100);
}

// â”€â”€ COPY â”€â”€
window.copyMsg = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.innerText).then(() => {
        const btn = el.parentElement.querySelector('.copy-btn');
        if (btn) { btn.textContent = 'âœ… Ð¡ÐºÐ¾Ð¿Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¾'; setTimeout(() => btn.textContent = 'ðŸ“‹ ÐšÐ¾Ð¿Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ', 2000); }
    });
};

// â”€â”€ SPEAK â”€â”€
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
    document.querySelectorAll('.speak-btn').forEach(b => { b.textContent = 'ðŸ”Š ÐžÐ·Ð²ÑƒÑ‡Ð¸Ñ‚ÑŒ'; b.classList.remove('speaking'); });
}

window.speakMsg = async (id, btn) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (currentUtterance || currentAudio) { stopSpeaking(); return; }

    const text = el.innerText.trim();
    btn.textContent = 'â³ Ð—Ð°Ð³Ñ€ÑƒÐ·ÐºÐ°...'; btn.classList.add('speaking');

    // ÐŸÐ¾Ð¿Ñ‹Ñ‚ÐºÐ° Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÑŒ OpenAI TTS Ñ‡ÐµÑ€ÐµÐ· Ð±ÑÐºÐµÐ½Ð´ (Ð¿Ñ€Ð¸Ð¾Ñ€Ð¸Ñ‚ÐµÑ‚ Ð±Ð¾Ð»ÐµÐµ Ñ€ÐµÐ°Ð»Ð¸ÑÑ‚Ð¸Ñ‡Ð½Ñ‹Ñ… Ð¼Ð¾Ð´ÐµÐ»ÐµÐ¹)
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
            currentAudio.onended = () => { currentAudio = null; URL.revokeObjectURL(url); btn.textContent = 'ðŸ”Š ÐžÐ·Ð²ÑƒÑ‡Ð¸Ñ‚ÑŒ'; btn.classList.remove('speaking'); };
            currentAudio.onerror = () => { currentAudio = null; btn.textContent = 'ðŸ”Š ÐžÐ·Ð²ÑƒÑ‡Ð¸Ñ‚ÑŒ'; btn.classList.remove('speaking'); };
            btn.textContent = 'â¹ ÐžÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ';
            await currentAudio.play();
            return;
        }
    } catch {}

    // Fallback: Ð±Ñ€Ð°ÑƒÐ·ÐµÑ€Ð½Ñ‹Ð¹ TTS Ñ Ð»ÑƒÑ‡ÑˆÐ¸Ð¼ Ð³Ð¾Ð»Ð¾ÑÐ¾Ð¼
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.93;
    utterance.pitch = 1;
    utterance.volume = 1;
    const voice = await getBestRussianVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => { btn.textContent = 'ðŸ”Š ÐžÐ·Ð²ÑƒÑ‡Ð¸Ñ‚ÑŒ'; btn.classList.remove('speaking'); currentUtterance = null; };
    currentUtterance = utterance;
    btn.textContent = 'â¹ ÐžÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ';
    speechSynthesis.speak(utterance);
};

// â”€â”€ RENAME SESSION â”€â”€
window.renameSession = async (id) => {
    const s = sessions.find(x => x.id === id);
    if (!s) return;
    const newTitle = prompt('\u041d\u043e\u0432\u043e\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435:', s.title);
    if (!newTitle || !newTitle.trim()) return;
    s.title = newTitle.trim().slice(0, 45);
    await saveSess(s);
    renderHistory();
};

// â”€â”€ EDIT PROFILE â”€â”€
window.editProfile = () => {
    const name = prompt('\u0418\u043c\u044f:', userProfile.name || '');
    if (name === null) return;
    const interests = prompt('\u0418\u043d\u0442\u0435\u0440\u0435\u0441\u044b:', userProfile.interests || '');
    if (interests === null) return;
    saveProfile(name.trim(), interests.trim());
    alert('\u041f\u0440\u043e\u0444\u0438\u043b\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d!');
};

// â”€â”€ DELETE ONE SESSION â”€â”€
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

// â”€â”€ COUNTRY STATS + WEATHER â”€â”€
async function fetchCountryStats(countryName) {
    try {
        // Translate Russian name to English if needed
        let searchName = countryTranslations[countryName] || countryName;
        
        // REST Countries API â€” Ð¿Ð¾Ð¸ÑÐº Ð¿Ð¾ Ð¸Ð¼ÐµÐ½Ð¸
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
    if (code === 0) return { emoji: 'â˜€ï¸', desc: 'Ð¯ÑÐ½Ð¾' };
    if (code <= 3) return { emoji: 'â›…', desc: 'ÐžÐ±Ð»Ð°Ñ‡Ð½Ð¾' };
    if (code <= 48) return { emoji: 'ðŸŒ«ï¸', desc: 'Ð¢ÑƒÐ¼Ð°Ð½' };
    if (code <= 67) return { emoji: 'ðŸŒ§ï¸', desc: 'Ð”Ð¾Ð¶Ð´ÑŒ' };
    if (code <= 77) return { emoji: 'â„ï¸', desc: 'Ð¡Ð½ÐµÐ³' };
    if (code <= 82) return { emoji: 'ðŸŒ¦ï¸', desc: 'Ð›Ð¸Ð²ÐµÐ½ÑŒ' };
    return { emoji: 'â›ˆï¸', desc: 'Ð“Ñ€Ð¾Ð·Ð°' };
}

function formatPop(n) {
    if (!n) return 'â€”';
    if (n >= 1e9) return (n/1e9).toFixed(1) + ' Ð¼Ð»Ñ€Ð´';
    if (n >= 1e6) return (n/1e6).toFixed(1) + ' Ð¼Ð»Ð½';
    if (n >= 1e3) return (n/1e3).toFixed(0) + ' Ñ‚Ñ‹Ñ';
    return n;
}

function formatArea(n) {
    if (!n) return 'â€”';
    if (n >= 1e6) return (n/1e6).toFixed(2) + ' Ð¼Ð»Ð½ ÐºÐ¼Â²';
    return n.toLocaleString('ru') + ' ÐºÐ¼Â²';
}

async function showCountryStats(countryName) {
    const statsArea = document.getElementById('search-stats-area');
    const weatherEl = document.getElementById('weather-widget');
    const statsGrid = document.getElementById('country-stats-grid');
    statsArea.style.display = 'block';
    weatherEl.innerHTML = '';
    statsGrid.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px 0;">â³ Ð—Ð°Ð³Ñ€ÑƒÐ¶Ð°ÑŽ ÑÑ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÑƒ...</div>';

    const info = await fetchCountryStats(countryName);
    if (!info) {
        statsGrid.innerHTML = '';
        statsArea.style.display = 'none';
        return;
    }

    const pop = formatPop(info.population);
    const area = formatArea(info.area);
    const capital = info.capital?.[0] || 'â€”';
    const region = info.region || 'â€”';
    const flag = info.flag || '';
    const currencies = Object.values(info.currencies || {}).map(c => c.name).join(', ') || 'â€”';
    const languages = Object.values(info.languages || {}).join(', ') || 'â€”';
    const gini = info.gini ? Object.values(info.gini)[0] + '%' : 'â€”';
    const lat = info.latlng?.[0];
    const lon = info.latlng?.[1];

    statsGrid.innerHTML = `
        <div class="stat-card"><div class="stat-label">ðŸ³ï¸ Ð¡Ñ‚Ñ€Ð°Ð½Ð°</div><div class="stat-value" style="font-size:28px;">${flag}</div><div class="stat-sub">${info.name?.common || countryName}</div></div>
        <div class="stat-card"><div class="stat-label">ðŸ‘¥ ÐÐ°ÑÐµÐ»ÐµÐ½Ð¸Ðµ</div><div class="stat-value">${pop}</div><div class="stat-sub">Ñ‡ÐµÐ»Ð¾Ð²ÐµÐº</div></div>
        <div class="stat-card"><div class="stat-label">ðŸ“ ÐŸÐ»Ð¾Ñ‰Ð°Ð´ÑŒ</div><div class="stat-value" style="font-size:15px;">${area}</div></div>
        <div class="stat-card"><div class="stat-label">ðŸ™ï¸ Ð¡Ñ‚Ð¾Ð»Ð¸Ñ†Ð°</div><div class="stat-value" style="font-size:15px;">${capital}</div></div>
        <div class="stat-card"><div class="stat-label">ðŸŒ Ð ÐµÐ³Ð¸Ð¾Ð½</div><div class="stat-value" style="font-size:14px;">${region}</div></div>
        <div class="stat-card"><div class="stat-label">ðŸ’° Ð’Ð°Ð»ÑŽÑ‚Ð°</div><div class="stat-value" style="font-size:13px;">${currencies}</div></div>
    `;

    // ÐŸÐ¾Ð³Ð¾Ð´Ð°
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
                        <div class="weather-temp">${t}Â°C</div>
                        <div class="weather-desc">${wInfo.desc} Â· Ð’ÐµÑ‚ÐµÑ€ ${wind} ÐºÐ¼/Ñ‡ Â· ${capital}</div>
                    </div>
                </div>`;
        }
    }
}

// â”€â”€ COMPARE COUNTRIES â”€â”€
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

    // ÐŸÐ°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ð¾ Ð·Ð°Ð³Ñ€ÑƒÐ¶Ð°ÐµÐ¼ Ð´Ð°Ð½Ð½Ñ‹Ðµ Ð¾Ð±ÐµÐ¸Ñ… ÑÑ‚Ñ€Ð°Ð½ + Ð˜Ð˜ Ð°Ð½Ð°Ð»Ð¸Ð·
    const [infoA, infoB, aiRes] = await Promise.all([
        fetchCountryStats(a),
        fetchCountryStats(b),
        fetch(GROQ_WORKER, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: `Ð¡Ñ€Ð°Ð²Ð½Ð¸ Ð´Ð²Ðµ ÑÑ‚Ñ€Ð°Ð½Ñ‹/Ñ€ÐµÐ³Ð¸Ð¾Ð½Ð°: "${a}" Ð¸ "${b}". Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐ¹ Ñ€Ð°Ð·Ð´ÐµÐ»Ñ‹: ## Ð˜ÑÑ‚Ð¾Ñ€Ð¸Ñ, ## ÐšÑƒÐ»ÑŒÑ‚ÑƒÑ€Ð°, ## Ð­ÐºÐ¾Ð½Ð¾Ð¼Ð¸ÐºÐ°, ## ÐŸÐ¾Ð»Ð¸Ñ‚Ð¸ÐºÐ°, ## Ð˜Ð½Ñ‚ÐµÑ€ÐµÑÐ½Ñ‹Ðµ ÑÑ…Ð¾Ð´ÑÑ‚Ð²Ð° Ð¸ Ñ€Ð°Ð·Ð»Ð¸Ñ‡Ð¸Ñ. ÐŸÐ¸ÑˆÐ¸ Ð½Ð° Ñ€ÑƒÑÑÐºÐ¾Ð¼ ÑÐ·Ñ‹ÐºÐµ, Ð¿Ð¾Ð´Ñ€Ð¾Ð±Ð½Ð¾ Ð¸ Ð°Ð½Ð°Ð»Ð¸Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸. Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐ¹ **Ð¶Ð¸Ñ€Ð½Ñ‹Ð¹** Ð´Ð»Ñ ÐºÐ»ÑŽÑ‡ÐµÐ²Ñ‹Ñ… Ñ„Ð°ÐºÑ‚Ð¾Ð².` }],
                max_tokens: 2048
            })
        })
    ]);

    loading.style.display = 'none';

    // ÐžÑ‚Ð¾Ð±Ñ€Ð°Ð¶Ð°ÐµÐ¼ ÐºÐ°Ñ€Ñ‚Ð¾Ñ‡ÐºÐ¸ ÑÑ€Ð°Ð²Ð½ÐµÐ½Ð¸Ñ
    if (infoA || infoB) {
        const makeCol = (info, name) => {
            if (!info) return `<div class="compare-col"><div class="compare-col-title">${name}</div><div style="color:var(--muted);font-size:13px;">Ð”Ð°Ð½Ð½Ñ‹Ðµ Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ñ‹</div></div>`;
            return `<div class="compare-col">
                <span class="flag-big">${info.flag || 'ðŸŒ'}</span>
                <div class="compare-col-title">${info.name?.common || name}</div>
                <div class="compare-stat"><span style="color:var(--muted)">ðŸ‘¥ ÐÐ°ÑÐµÐ»ÐµÐ½Ð¸Ðµ</span><span style="font-weight:700">${formatPop(info.population)}</span></div>
                <div class="compare-stat"><span style="color:var(--muted)">ðŸ“ ÐŸÐ»Ð¾Ñ‰Ð°Ð´ÑŒ</span><span style="font-weight:700">${formatArea(info.area)}</span></div>
                <div class="compare-stat"><span style="color:var(--muted)">ðŸ™ï¸ Ð¡Ñ‚Ð¾Ð»Ð¸Ñ†Ð°</span><span style="font-weight:700">${info.capital?.[0] || 'â€”'}</span></div>
                <div class="compare-stat"><span style="color:var(--muted)">ðŸŒ Ð ÐµÐ³Ð¸Ð¾Ð½</span><span style="font-weight:700">${info.region || 'â€”'}</span></div>
                <div class="compare-stat"><span style="color:var(--muted)">ðŸ’° Ð’Ð°Ð»ÑŽÑ‚Ð°</span><span style="font-weight:700">${Object.values(info.currencies||{}).map(c=>c.name).join(', ')||'â€”'}</span></div>
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
        document.getElementById('compare-result-text').innerHTML = `<span style="color:var(--danger)">ÐžÑˆÐ¸Ð±ÐºÐ°: ${e.message}</span>`;
    }
};

// â”€â”€ QUIZ â”€â”€
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
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: `Ð¡Ð¾Ð·Ð´Ð°Ð¹ Ð¾Ð´Ð¸Ð½ Ð²Ð¾Ð¿Ñ€Ð¾Ñ Ð´Ð»Ñ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ñ‡ÐµÑÐºÐ¾Ð³Ð¾ ÐºÐ²Ð¸Ð·Ð° Ð½Ð° Ñ‚ÐµÐ¼Ñƒ: "${topic}". 
ÐžÑ‚Ð²ÐµÑ‚ÑŒ Ð¢ÐžÐ›Ð¬ÐšÐž Ð² Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ðµ JSON (Ð±ÐµÐ· markdown, Ð±ÐµÐ· \`\`\`):
{
  "question": "Ð²Ð¾Ð¿Ñ€Ð¾Ñ",
  "options": ["Ð) Ð¾Ñ‚Ð²ÐµÑ‚1", "Ð‘) Ð¾Ñ‚Ð²ÐµÑ‚2", "Ð’) Ð¾Ñ‚Ð²ÐµÑ‚3", "Ð“) Ð¾Ñ‚Ð²ÐµÑ‚4"],
  "correct": 0,
  "explanation": "ÐºÑ€Ð°Ñ‚ÐºÐ¾Ðµ Ð¾Ð±ÑŠÑÑÐ½ÐµÐ½Ð¸Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»ÑŒÐ½Ð¾Ð³Ð¾ Ð¾Ñ‚Ð²ÐµÑ‚Ð°"
}
correct â€” Ð¸Ð½Ð´ÐµÐºÑ Ð¿Ñ€Ð°Ð²Ð¸Ð»ÑŒÐ½Ð¾Ð³Ð¾ Ð¾Ñ‚Ð²ÐµÑ‚Ð° (0-3). Ð’Ð¾Ð¿Ñ€Ð¾Ñ Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð±Ñ‹Ñ‚ÑŒ Ð¸Ð½Ñ‚ÐµÑ€ÐµÑÐ½Ñ‹Ð¼ Ð¸ Ð½ÐµÑ‚Ñ€Ð¸Ð²Ð¸Ð°Ð»ÑŒÐ½Ñ‹Ð¼. ÐŸÐ¸ÑˆÐ¸ Ð½Ð° Ñ€ÑƒÑÑÐºÐ¾Ð¼ ÑÐ·Ñ‹ÐºÐµ.` }],
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
                // ÐžÐ±ÑŠÑÑÐ½ÐµÐ½Ð¸Ðµ
                const expEl = document.getElementById('quiz-explanation');
                const expText = document.getElementById('quiz-exp-text');
                expEl.style.display = 'block';
                expText.innerHTML = (i === correct ? 'âœ… ' : 'âŒ ') + '<strong>' + (i === correct ? 'ÐŸÑ€Ð°Ð²Ð¸Ð»ÑŒÐ½Ð¾!' : 'ÐÐµÐ²ÐµÑ€Ð½Ð¾!') + '</strong> ' + q.explanation;
                // Ð¡Ñ‡Ñ‘Ñ‚
                scoreBar.style.display = 'flex';
                document.getElementById('quiz-score-text').textContent = quizScore + ' / ' + quizTotal;
                document.getElementById('quiz-streak').textContent = quizStreak > 1 ? 'ðŸ”¥ Ð¡ÐµÑ€Ð¸Ñ: ' + quizStreak : '';
                document.getElementById('quiz-next-btn').style.display = 'block';
            };
            optionsEl.appendChild(btn);
        });
    } catch(e) {
        loading.style.display = 'none';
        card.style.display = 'block';
        document.getElementById('quiz-question').textContent = 'âŒ ÐžÑˆÐ¸Ð±ÐºÐ°: ' + e.message;
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
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: `Ð Ð°ÑÑÐºÐ°Ð¶Ð¸ Ð¿Ð¾Ð´Ñ€Ð¾Ð±Ð½ÑƒÑŽ Ð¸ÑÑ‚Ð¾Ñ€Ð¸ÑŽ ÑÑ‚Ñ€Ð°Ð½Ñ‹: ${country}. Ð’ÐºÐ»ÑŽÑ‡Ð¸: Ð´Ñ€ÐµÐ²Ð½ÑŽÑŽ Ð¸ÑÑ‚Ð¾Ñ€Ð¸ÑŽ, Ð²Ð°Ð¶Ð½Ñ‹Ðµ ÑÐ¾Ð±Ñ‹Ñ‚Ð¸Ñ, Ð¸Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ñ… Ð¿Ñ€Ð°Ð²Ð¸Ñ‚ÐµÐ»ÐµÐ¹, ÑÐ¾Ð²Ñ€ÐµÐ¼ÐµÐ½Ð½Ð¾ÑÑ‚ÑŒ. Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐ¹ ## Ð´Ð»Ñ Ñ€Ð°Ð·Ð´ÐµÐ»Ð¾Ð², **Ð¶Ð¸Ñ€Ð½Ñ‹Ð¹** Ð´Ð»Ñ Ð²Ð°Ð¶Ð½Ñ‹Ñ… Ð´Ð°Ñ‚ Ð¸ Ð¸Ð¼Ñ‘Ð½. ÐŸÐ¸ÑˆÐ¸ Ð½Ð° Ñ€ÑƒÑÑÐºÐ¾Ð¼ ÑÐ·Ñ‹ÐºÐµ, Ð¿Ð¾Ð´Ñ€Ð¾Ð±Ð½Ð¾ Ð¸ Ð¸Ð½Ñ‚ÐµÑ€ÐµÑÐ½Ð¾.` }],
                max_tokens: 2048
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        const text = data.choices?.[0]?.message?.content || 'ÐÐµÑ‚ Ð´Ð°Ð½Ð½Ñ‹Ñ…';
        loading.style.display = 'none';
        result.style.display = 'block';
        resultText.innerHTML = mdToHtml(text);
        result.scrollIntoView({ behavior: 'smooth' });
        // Ð—Ð°Ð³Ñ€ÑƒÐ¶Ð°ÐµÐ¼ ÑÑ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÑƒ ÑÑ‚Ñ€Ð°Ð½Ñ‹ Ð¿Ð°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ð¾
        showCountryStats(country);
    } catch(e) {
        loading.style.display = 'none';
        result.style.display = 'block';
        resultText.innerHTML = `<span style="color:var(--danger)">ÐžÑˆÐ¸Ð±ÐºÐ°: ${e.message}</span>`;
    }
};

// â”€â”€ MAP â”€â”€
let historicalLayer = null;
let currentYear = 2000;

function initMap() {
    if (map) { setTimeout(() => map.invalidateSize(), 300); return; }
    setTimeout(() => {
        map = L.map('map', { zoomControl: true }).setView([20, 10], 2);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: 'Â© OpenStreetMap Â© CARTO'
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
        const url = `https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_${snapped}.geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
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
        console.error(e);
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


// â”€â”€ MAP COUNTRY HISTORY PANEL â”€â”€
let mapPopup = null;

async function showCountryHistory(countryName, latlng) {
    if (mapPopup) { map.closePopup(mapPopup); }
    const loadingHtml = '<div style="font-family:Manrope,sans-serif;padding:6px;min-width:260px"><div style="font-family:Space Mono,monospace;font-size:10px;color:#00e676;letter-spacing:2px;margin-bottom:8px;">â—† WORLDAI</div><b style="font-size:15px;color:#111">' + countryName + '</b><div style="margin-top:10px;color:#555;font-size:13px;">â³ Ð—Ð°Ð³Ñ€ÑƒÐ¶Ð°ÑŽ Ð¸ÑÑ‚Ð¾Ñ€Ð¸ÑŽ...</div></div>';
    mapPopup = L.popup({ maxWidth: 360 }).setLatLng(latlng).setContent(loadingHtml).openOn(map);
    try {
        const res = await fetch(GROQ_WORKER, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'ÐšÑ€Ð°Ñ‚ÐºÐ¾ Ñ€Ð°ÑÑÐºÐ°Ð¶Ð¸ Ð¸ÑÑ‚Ð¾Ñ€Ð¸ÑŽ ÑÑ‚Ñ€Ð°Ð½Ñ‹ Ð¸Ð»Ð¸ Ñ€ÐµÐ³Ð¸Ð¾Ð½Ð° "' + countryName + '" â€” 4-5 Ð¿Ñ€ÐµÐ´Ð»Ð¾Ð¶ÐµÐ½Ð¸Ð¹. Ð¡Ð°Ð¼Ñ‹Ðµ Ð¸Ð½Ñ‚ÐµÑ€ÐµÑÐ½Ñ‹Ðµ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ Ñ„Ð°ÐºÑ‚Ñ‹. ÐŸÐ¸ÑˆÐ¸ Ð½Ð° Ñ€ÑƒÑÑÐºÐ¾Ð¼ ÑÐ·Ñ‹ÐºÐµ.' }],
                max_tokens: 512
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        const text = (data.choices?.[0]?.message?.content || 'ÐÐµÑ‚ Ð´Ð°Ð½Ð½Ñ‹Ñ…')
            .replace(/\*\*/g,'').replace(/##[^\n]*/g,'').replace(/\n\n/g,'<br><br>').replace(/\n/g,' ');
        const html = '<div style="font-family:Manrope,sans-serif;padding:6px;min-width:260px;max-width:340px">'
            + '<div style="font-family:Space Mono,monospace;font-size:10px;color:#00e676;letter-spacing:2px;margin-bottom:8px;">â—† WORLDAI</div>'
            + '<b style="font-size:15px;color:#111">' + countryName + '</b>'
            + '<div style="margin-top:10px;font-size:13px;line-height:1.7;color:#333">' + text + '</div>'
            + '<div style="margin-top:12px"><button onclick="window.setTab(\'sec-search\',\'nav-search\');" style="background:#00e676;color:#000;border:none;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;">ÐŸÐ¾Ð´Ñ€Ð¾Ð±Ð½ÐµÐµ â†’</button></div>'
            + '</div>';
        mapPopup.setContent(html);
    } catch(e) {
        mapPopup.setContent('<div style="font-family:sans-serif;padding:6px"><b>' + countryName + '</b><br><span style="color:red;font-size:12px">ÐžÑˆÐ¸Ð±ÐºÐ°: ' + e.message + '</span></div>');
    }
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e','#e91e63','#00bcd4','#8bc34a','#ff5722','#607d8b','#795548','#ff9800','#673ab7','#03a9f4','#4caf50','#ffc107','#009688'];
    return colors[Math.abs(hash) % colors.length];
}
