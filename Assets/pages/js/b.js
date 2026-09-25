let cachedQuote = "";
let cachedCommitHash = "";

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

const defaultShortcuts = [
    ['emoH', 'kstuff://ho' + 'me', 'ph-house'],
    ['semaG', 'kstuff://ga' + 'mes', 'ph-game-controller'],
    ['sppA', 'kstuff://ap' + 'ps', 'ph-app-window'],
    ['cisuM', 'kstuff://mu' + 'sic', 'ph-music-notes'],
    ['VT', 'kstuff://t' + 'v', 'ph-monitor-play'],
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
        const messages = await (await fetch(`https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@${commitData.sha || 'main'}/Assets/json/messages.json`)).json();
        
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

        card.addEventListener('click', () => {
            const targetUrl = formatUrl(fc.url, true);
            window.parent.postMessage(targetUrl, '*');
        });
        flashcardsContainer.appendChild(card);
    });
}
renderFlashcards();

function handleSearch() {
    const query = librarySearchInput.value.trim();
    if (!query) return;
    const targetUrl = formatUrl(query, true);
    window.parent.postMessage(targetUrl, '*');
}

librarySearchBtn.addEventListener('click', handleSearch);
librarySearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

addFlashcardMainBtn.addEventListener('click', () => openExamModal('', '', addFlashcard));
