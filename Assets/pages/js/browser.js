
let currentUrl = '';
let mode = 'library';
let history = ['kstuff://home'];
let historyIndex = 0;
let isNavigating = false;
let cachedQuote = "";
let cachedCommitHash = "";
let workingstaticurl = "";
let activePort = null;

let proxyReadyResolve;
const proxyReadyPromise = new Promise(resolve => {
    proxyReadyResolve = resolve;
});

const cleanUrl = u => u ? u.replace(/\/+$/, '') : '';
const trimSlash = u => u ? u.replace(/^\/+/, '') : '';

function encode(str) {
    if (!str) return str;
    return encodeURIComponent(
        str
            .toString()
            .split('')
            .map((char, ind) =>
                ind % 2 ? String.fromCharCode(char.charCodeAt() ^ 2) : char
            )
            .join('')
    );
}

async function getProxyList() {
    if (!cachedCommitHash) {
        try { cachedCommitHash = (await (await fetch("https://api.github.com/repos/lotsacookie/kstuff/commits/main")).json()).sha; } 
        catch { cachedCommitHash = "main"; }
    }
    return ["raw.githack.com", "cdn.jsdelivr.net/gh", "raw.githubusercontent.com", "cdn.statically.io/gh"]
        .map(d => `https://${d}/lotsacookie/kstuff/${cachedCommitHash}/`).concat("");
}

async function fetchWithProxy(path, asText = false) {
    const cb = (path.includes('?') ? '&' : '?') + '_=' + Date.now();
    const proxies = await getProxyList();
    try {
        return await Promise.any(proxies.map(async p => {
            const r = await fetch(p + path + cb, { cache: 'no-store' });
            if (!r.ok) throw new Error();
            return asText ? await r.text() : await r.json();
        }));
    } catch {
        throw new Error("Proxies failed: " + path);
    }
}

async function getWorkingConfig(table) {
    if (!table?.length) return null;
    for (let i = 0; i < table.length; i += 5) {
        const chunk = table.slice(i, i + 5);
        const winner = await new Promise(resolve => {
            let done = false, fail = 0, imgs = [];
            const cleanup = () => imgs.forEach(img => { img.onload = img.onerror = null; img.src = ''; });
            const timer = setTimeout(() => { if (!done) { done = true; cleanup(); resolve(null); } }, 5000);

            chunk.forEach(entry => {
                const img = new Image(); imgs.push(img);
                const url = `${cleanUrl(entry.url)}/${trimSlash(entry.img)}`;
                const handle = ok => {
                    if (done) return;
                    if (ok || ++fail === chunk.length) { done = true; clearTimeout(timer); cleanup(); resolve(ok ? entry : null); }
                };
                img.onload = () => handle(img.naturalWidth > 0);
                img.onerror = () => handle(false);
                img.src = `${url}${url.includes('?') ? '&' : '?'}bridge=${Date.now()}`;
            });
        });
        if (winner) return winner;
    }
    return table[0];
}

async function initProxyBackend() {
    try {
        const staticTable = await fetchWithProxy('Assets/json/mirrors/static.json');
        const workingConfig = await getWorkingConfig(staticTable);
        if (workingConfig && workingConfig.url) {
            workingstaticurl = cleanUrl(workingConfig.url); 
            const proxyIframe = document.createElement('iframe');
            proxyIframe.style.display = 'none';
            proxyIframe.onload = () => proxyReadyResolve(true);
            proxyIframe.onerror = () => proxyReadyResolve(false);
            proxyIframe.src = `${workingstaticurl}/embed.html#https://example.com`;
            document.body.appendChild(proxyIframe);
        } else {
            proxyReadyResolve(false);
        }
    } catch (e) {
        console.error("Could not initialize proxy backend:", e);
        proxyReadyResolve(false);
    }
}

initProxyBackend();

const defaultShortcuts = [
    ['emoH', 'kstuff://ho' + 'me', 'ph-house'],
    ['semaG', 'kstuff://ga' + 'mes', 'ph-game-controller'],
    ['sppA', 'kstuff://ap' + 'ps', 'ph-app-window'],
    ['cisuM', 'kstuff://mu' + 'sic', 'ph-music-notes'],
    ['IA', 'kstuff://a' + 'i', 'ph-robot'],
    ['sMV', 'kstuff://vm' + 's', 'ph-desktop'],
    ['tahC', 'kstuff://ch' + 'at', 'ph-chats']
];

let flashcards = JSON.parse(localStorage.getItem('study_flashcards')) || [];

function addFlashcard(name, url) {
    if (!name || !url) return;
    flashcards.push({ name, url });
    localStorage.setItem('study_flashcards', JSON.stringify(flashcards));
    renderFlashcards();
}

function formatUrl(rawUrl, allowSearch = false) {
    let validUrl = rawUrl.trim();
    if (!validUrl) return '';
    if (validUrl === 'kstuff://home') return 'kstuff://home';
    if (validUrl.startsWith('http://') || validUrl.startsWith('https://')) return validUrl;
    
    if (allowSearch && (!validUrl.includes('.') || validUrl.includes(' '))) {
        return 'https://duckduckgo.com/?q=' + encodeURIComponent(validUrl);
    }
    return 'https://' + validUrl;
}

const libraryHome = document.getElementById('library-home');
const studyIframe = document.getElementById('study-iframe');
const textbookInput = document.getElementById('textbook-input');
const studyEnterBtn = document.getElementById('study-enter-btn');
const reloadStudyBtn = document.getElementById('reload-study-btn');
const homeStudyBtn = document.getElementById('home-study-btn');
const flashcardShortcutBtn = document.getElementById('flashcard-shortcut-btn');
const studyBackBtn = document.getElementById('study-back-btn');
const studyForwardBtn = document.getElementById('study-forward-btn');
const addFlashcardMainBtn = document.getElementById('add-flashcard-main-btn');
const flashcardsContainer = document.getElementById('flashcards-container');

const librarySearchInput = document.getElementById('library-search-input');
const librarySearchBtn = document.getElementById('library-search-btn');

const examModal = document.getElementById('exam-modal');
const examNameInput = document.getElementById('exam-name-input');
const examUrlInput = document.getElementById('exam-url-input');
const examSaveBtn = document.getElementById('exam-save-btn');
const examCancelBtn = document.getElementById('exam-cancel-btn');

let currentModalCallback = null;

async function fetchLatestQuote() {
    try {
        const commitData = await (await fetch('https://api.github.com/repos/lotsacookie/kstuff/commits/main')).json();
        const messages = await (await fetch(`https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@${commitData.sha || 'main'}/Assets/messages.json`)).json();
        
        if (Array.isArray(messages) && messages.length > 0) {
            cachedQuote = `"${messages[Math.floor(Math.random() * messages.length)]}"`;
            document.querySelectorAll('.library-home-quote').forEach(el => el.textContent = cachedQuote);
        }
    } catch (err) {
        console.warn('Could not load random quote:', err);
    }
}
fetchLatestQuote();

function openExamModal(defaultName, defaultUrl, callback) {
    examNameInput.value = defaultName || '';
    examUrlInput.value = defaultUrl || '';
    currentModalCallback = callback;
    examModal.classList.add('active');
    examNameInput.focus();
}

function closeExamModal() {
    examModal.classList.remove('active');
    currentModalCallback = null;
}

examSaveBtn.addEventListener('click', () => {
    if (currentModalCallback) currentModalCallback(examNameInput.value.trim(), examUrlInput.value.trim());
    closeExamModal();
});
examCancelBtn.addEventListener('click', closeExamModal);

function updateNavButtons() {
    studyBackBtn.disabled = historyIndex <= 0;
    studyForwardBtn.disabled = historyIndex >= history.length - 1;
}

function renderFlashcards() {
    flashcardsContainer.innerHTML = '';
    
    defaultShortcuts.forEach(([name, url, icon]) => {
        const card = document.createElement('div');
        card.className = 'flashcard-card';
        
        const normalName = name.split('').reverse().join('');
        const letterDivs = normalName.split('').map(letter => `<div>${letter}</div>`).join('');

        card.innerHTML = `
            <div class="flashcard-icon-wrapper">
                <div class="flashcard-icon">
                    <i class="ph ${icon}"></i>
                </div>
            </div>
            <span class="flashcard-name" title="${normalName}">${letterDivs}</span>
        `;
        card.addEventListener('click', () => {
            window.parent.postMessage(`nav: ${normalName}`, '*');
        });
        flashcardsContainer.appendChild(card);
    });

    flashcards.forEach((fc, index) => {
        const card = document.createElement('div');
        card.className = 'flashcard-card';
        
        let faviconUrl = '';
        try { faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(formatUrl(fc.url)).hostname}&sz=64`; } catch(e) {}

        card.innerHTML = `
            <div class="flashcard-icon-wrapper">
                <button class="remove-flashcard-btn" title="Remove Shortcut">&times;</button>
                <div class="flashcard-icon">
                    ${faviconUrl ? `<img src="${faviconUrl}" alt="${fc.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" /><span style="display:none;">${fc.name.charAt(0).toUpperCase()}</span>` : `<span>${fc.name.charAt(0).toUpperCase()}</span>`}
                </div>
            </div>
            <span class="flashcard-name" title="${fc.name}">${fc.name}</span>
        `;

        card.querySelector('.remove-flashcard-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            flashcards.splice(index, 1);
            localStorage.setItem('study_flashcards', JSON.stringify(flashcards));
            renderFlashcards();
        });

        card.addEventListener('click', () => loadUrl(fc.url, true));
        flashcardsContainer.appendChild(card);
    });
}
renderFlashcards();

async function loadUrl(inputVal, updateInput = true, isHistoryNav = false) {
    if (!inputVal) return;
    const targetUrl = formatUrl(inputVal, true);

    if (targetUrl === 'kstuff://home') {
        showLibraryPage(isHistoryNav);
        return;
    }

    currentUrl = targetUrl;
    mode = 'iframe';
    isNavigating = true;

    if (!isHistoryNav && history[historyIndex] !== targetUrl) {
        history = history.slice(0, historyIndex + 1);
        history.push(targetUrl);
        historyIndex++;
    }

    libraryHome.classList.add('hidden');
    studyIframe.classList.add('active');
    studyIframe.src = 'about:blank';

    const isProxyReady = await proxyReadyPromise;
    if (!isProxyReady || !workingstaticurl) {
        console.error("Proxy is not ready or failed to connect.");
        return; 
    }

    const wrapperUrl = `https://lotsacookie.github.io/kstuff/Assets/pages/browser-content.html?site=${targetUrl}`;
    const proxiedUrl = `${workingstaticurl}/frog/default/ixl/${encode(wrapperUrl)}`;
    studyIframe.src = proxiedUrl;

    if (updateInput) {
        textbookInput.value = targetUrl;
        librarySearchInput.value = targetUrl;
    }
    updateNavButtons();
}

function showLibraryPage(isHistoryNav = false) {
    mode = 'library';
    currentUrl = '';
    isNavigating = false;

    if (!isHistoryNav && history[historyIndex] !== 'kstuff://home') {
        history = history.slice(0, historyIndex + 1);
        history.push('kstuff://home');
        historyIndex++;
    }

    studyIframe.classList.remove('active');
    studyIframe.src = 'about:blank';
    libraryHome.classList.remove('hidden');

    textbookInput.value = 'kstuff://home';
    librarySearchInput.value = '';
    updateNavButtons();
}

function navigateHistory(offset) {
    const newIndex = historyIndex + offset;
    if (newIndex >= 0 && newIndex < history.length) {
        historyIndex = newIndex;
        const targetUrl = history[newIndex];
        if (targetUrl === 'kstuff://home' || targetUrl === '') {
            showLibraryPage(true);
        } else {
            loadUrl(targetUrl, true, true);
        }
    }
}

studyBackBtn.addEventListener('click', () => navigateHistory(-1));
studyForwardBtn.addEventListener('click', () => navigateHistory(1));

studyIframe.onload = () => {
    isNavigating = false;

    if (mode === 'iframe') {
        const channel = new MessageChannel();
        activePort = channel.port1;

        activePort.onmessage = (event) => {
            if (event.data && event.data.type === 'tabData') {
                const reportedUrl = event.data.url;
                if (reportedUrl && reportedUrl !== currentUrl && reportedUrl !== 'about:blank') {
                    currentUrl = reportedUrl;
                    textbookInput.value = currentUrl;
                    librarySearchInput.value = currentUrl;
                    
                    if (history[historyIndex] !== currentUrl) {
                        history = history.slice(0, historyIndex + 1);
                        history.push(currentUrl);
                        historyIndex++;
                        updateNavButtons();
                    }
                }
            }
        };

        if (studyIframe.contentWindow) {
            studyIframe.contentWindow.postMessage('init-port', '*', [channel.port2]);
        }
    }
};

window.addEventListener('message', (event) => {
    if (typeof event.data === 'string' && event.data.startsWith('nav: ')) {
        loadUrl(event.data.substring(5));
    }
});

studyEnterBtn.addEventListener('click', () => loadUrl(textbookInput.value));
textbookInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') loadUrl(textbookInput.value); });

librarySearchBtn.addEventListener('click', () => loadUrl(librarySearchInput.value));
librarySearchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') loadUrl(librarySearchInput.value); });

reloadStudyBtn.addEventListener('click', () => {
    if (mode === 'iframe') {
        try { studyIframe.contentWindow.location.reload(); } 
        catch (e) { studyIframe.src = studyIframe.src; }
    }
});

homeStudyBtn.addEventListener('click', () => showLibraryPage(false));
addFlashcardMainBtn.addEventListener('click', () => openExamModal('', '', addFlashcard));

flashcardShortcutBtn.addEventListener('click', () => {
    const currentVal = textbookInput.value;
    if (!currentVal || currentVal === 'kstuff://home') return openExamModal('', '', addFlashcard);
    
    let defaultName = currentVal;
    try { defaultName = new URL(currentVal).hostname.replace('www.', ''); } catch(e) {}
    openExamModal(defaultName, currentVal, addFlashcard);
});
