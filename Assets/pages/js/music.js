const SVG_ICONS = {
    play: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
    spinner: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`
};

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsList = document.getElementById("resultsList");
const audioDock = document.getElementById("audioDock");
const audioPlayer = document.getElementById("audioPlayer");
const nowPlayingTitle = document.getElementById("nowPlayingTitle");
const playPauseBtn = document.getElementById("playPauseBtn");
const prevTrackBtn = document.getElementById("prevTrackBtn");
const nextTrackBtn = document.getElementById("nextTrackBtn");
const addToPlaylistBtn = document.getElementById("addToPlaylistBtn");
const downloadBtn = document.getElementById("downloadBtn");
const closePlayerBtn = document.getElementById("closePlayerBtn");
const pipBtn = document.getElementById("pipBtn");
const progressBar = document.getElementById("progressBar");
const volumeBar = document.getElementById("volumeBar");
const currentTime = document.getElementById("currentTime");

const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
const playlistSidebar = document.getElementById("playlistSidebar");
const sidebarPlaylistSelect = document.getElementById("sidebarPlaylistSelect");
const playlistTracks = document.getElementById("playlistTracks");
const playlistModal = document.getElementById("playlistModal");
const modalPlaylistSelect = document.getElementById("modalPlaylistSelect");
const newPlaylistInput = document.getElementById("newPlaylistInput");
const confirmAddBtn = document.getElementById("confirmAddBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");

const BASE_URL = "https://invidious.f5.si";

let playlists = JSON.parse(localStorage.getItem('myPlaylists')) || { "Favorites": [] };

let activePlayingPlaylist = null;
let activePlayingIndex = -1;

let currentSearchResults = [];
let searchQueueIndex = -1;

let currentTrackInfo = null;
let playRequestToken = 0;

const CACHE_DB_NAME = "musicAppCache";
const CACHE_DB_VERSION = 1;
const AUDIO_STORE = "audio";
const THUMB_STORE = "thumbnails";

function openCacheDB() {
    return new Promise((resolve, reject) => {
        if (!("indexedDB" in window)) {
            reject(new Error("IndexedDB unavailable"));
            return;
        }
        const req = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(AUDIO_STORE)) db.createObjectStore(AUDIO_STORE);
            if (!db.objectStoreNames.contains(THUMB_STORE)) db.createObjectStore(THUMB_STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

const cacheDBPromise = openCacheDB().catch(err => {
    console.warn("Track/thumbnail cache disabled:", err);
    return null;
});

function idbGet(storeName, key) {
    return cacheDBPromise.then(db => {
        if (!db) return undefined;
        return new Promise(resolve => {
            try {
                const tx = db.transaction(storeName, "readonly");
                const req = tx.objectStore(storeName).get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(undefined);
            } catch (e) {
                resolve(undefined);
            }
        });
    });
}

function idbSet(storeName, key, value) {
    return cacheDBPromise.then(db => {
        if (!db) return;
        return new Promise(resolve => {
            try {
                const tx = db.transaction(storeName, "readwrite");
                tx.objectStore(storeName).put(value, key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch (e) {
                resolve();
            }
        });
    });
}

const audioObjectUrlCache = new Map();
const thumbObjectUrlCache = new Map();

async function getCachedAudioObjectURL(videoId) {
    if (audioObjectUrlCache.has(videoId)) return audioObjectUrlCache.get(videoId);
    const blob = await idbGet(AUDIO_STORE, videoId);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    audioObjectUrlCache.set(videoId, url);
    return url;
}

async function cacheAudioBlob(videoId, blob) {
    try {
        await idbSet(AUDIO_STORE, videoId, blob);
    } catch (e) {}
    const url = URL.createObjectURL(blob);
    audioObjectUrlCache.set(videoId, url);
    return url;
}

async function getCachedThumbObjectURL(videoId) {
    if (thumbObjectUrlCache.has(videoId)) return thumbObjectUrlCache.get(videoId);
    const blob = await idbGet(THUMB_STORE, videoId);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    thumbObjectUrlCache.set(videoId, url);
    return url;
}

async function cacheThumbBlob(videoId, blob) {
    try {
        await idbSet(THUMB_STORE, videoId, blob);
    } catch (e) {}
    const url = URL.createObjectURL(blob);
    thumbObjectUrlCache.set(videoId, url);
    return url;
}

async function fetchAndCacheThumbnail(videoId) {
    const existing = await getCachedThumbObjectURL(videoId);
    if (existing) return existing;
    for (const url of thumbnailUrlsFor(videoId)) {
        try {
            const resp = await fetch(url);
            if (!resp.ok) continue;
            const blob = await resp.blob();
            if (blob && blob.size > 0) {
                return await cacheThumbBlob(videoId, blob);
            }
        } catch (e) {
        }
    }
    return null;
}

const PIP_SIZE = 480;
const pipCanvas = document.createElement("canvas");
pipCanvas.width = PIP_SIZE;
pipCanvas.height = PIP_SIZE;
const pipCtx = pipCanvas.getContext("2d");

const pipVideo = document.createElement("video");
pipVideo.muted = true;
pipVideo.playsInline = true;
pipVideo.autoplay = true;
pipVideo.setAttribute("autopictureinpicture", "");
pipVideo.style.display = "none";
document.body.appendChild(pipVideo);

let pipStream = null;
let pipTrack = null;
try {
    pipStream = pipCanvas.captureStream(1);
    pipVideo.srcObject = pipStream;
    pipTrack = pipStream.getVideoTracks()[0];
} catch (e) {}

function pushPipFrame() {
    if (pipTrack && typeof pipTrack.requestFrame === "function") {
        try { pipTrack.requestFrame(); } catch (e) {}
    }
}

function getThemeColor(varName, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value || fallback;
}

function drawPipFrame(track, img) {
    const bg = getThemeColor("--bg", "#1a1216");
    const text = getThemeColor("--text", "#ffb8d9");

    pipCtx.fillStyle = bg;
    pipCtx.fillRect(0, 0, pipCanvas.width, pipCanvas.height);

    if (img) {
        const scale = Math.max(pipCanvas.width / img.width, pipCanvas.height / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const dx = (pipCanvas.width - drawWidth) / 2;
        const dy = (pipCanvas.height - drawHeight) / 2;
        pipCtx.drawImage(img, dx, dy, drawWidth, drawHeight);

        const gradient = pipCtx.createLinearGradient(0, pipCanvas.height - 90, 0, pipCanvas.height);
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, "rgba(0,0,0,0.75)");
        pipCtx.fillStyle = gradient;
        pipCtx.fillRect(0, pipCanvas.height - 90, pipCanvas.width, 90);
    }

    pipCtx.fillStyle = text;
    pipCtx.font = "bold 20px Quicksand, sans-serif";
    const title = track && track.title ? track.title : "Nothing playing";
    pipCtx.fillText(truncateForCanvas(pipCtx, title, pipCanvas.width - 30), 15, pipCanvas.height - 40);

    if (track && track.author) {
        pipCtx.font = "bold 14px Quicksand, sans-serif";
        pipCtx.globalAlpha = 0.75;
        pipCtx.fillText(truncateForCanvas(pipCtx, track.author, pipCanvas.width - 30), 15, pipCanvas.height - 18);
        pipCtx.globalAlpha = 1;
    }

    pushPipFrame();
}

function truncateForCanvas(ctx, str, maxWidth) {
    if (ctx.measureText(str).width <= maxWidth) return str;
    let truncated = str;
    while (truncated.length > 1 && ctx.measureText(truncated + "…").width > maxWidth) {
        truncated = truncated.slice(0, -1);
    }
    return truncated + "…";
}

let pipThumbCache = { videoId: null, img: null };

function thumbnailUrlsFor(videoId) {
    return [
        `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        `${BASE_URL}/vi/${videoId}/mqdefault.jpg`
    ];
}

function loadCoverImage(urls, index, onSuccess, onFail) {
    if (index >= urls.length) {
        onFail();
        return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => onSuccess(img);
    img.onerror = () => loadCoverImage(urls, index + 1, onSuccess, onFail);
    img.src = urls[index];
}

async function updatePiPCanvas(track) {
    if (!track) {
        drawPipFrame(null, null);
        return;
    }

    if (pipThumbCache.videoId === track.videoId && pipThumbCache.img) {
        drawPipFrame(track, pipThumbCache.img);
        return;
    }

    let cachedUrl = await getCachedThumbObjectURL(track.videoId);
    if (!cachedUrl) cachedUrl = await fetchAndCacheThumbnail(track.videoId);

    const urls = cachedUrl ? [cachedUrl, ...thumbnailUrlsFor(track.videoId)] : thumbnailUrlsFor(track.videoId);

    loadCoverImage(
        urls,
        0,
        (img) => {
            pipThumbCache = { videoId: track.videoId, img };
            drawPipFrame(track, img);
        },
        () => {
            pipThumbCache = { videoId: null, img: null };
            drawPipFrame(track, null);
        }
    );
}

const rootThemeObserver = new MutationObserver(() => {
    if (currentTrackInfo) updatePiPCanvas(currentTrackInfo);
});
rootThemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style", "class"]
});

function updatePositionState() {
    if (!('mediaSession' in navigator)) return;
    if (!audioPlayer.duration || !isFinite(audioPlayer.duration)) return;
    try {
        navigator.mediaSession.setPositionState({
            duration: audioPlayer.duration,
            playbackRate: audioPlayer.playbackRate || 1,
            position: Math.min(audioPlayer.currentTime, audioPlayer.duration)
        });
    } catch (e) {}
}

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => {
        if (audioPlayer.src) audioPlayer.play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        audioPlayer.pause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
        playPrevious();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNext();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (!audioPlayer.duration) return;
        if (details.fastSeek && 'fastSeek' in audioPlayer) {
            audioPlayer.fastSeek(details.seekTime);
        } else {
            audioPlayer.currentTime = details.seekTime;
        }
        updatePositionState();
    });
    try {
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - (details.seekOffset || 10));
            updatePositionState();
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            audioPlayer.currentTime = Math.min(audioPlayer.duration || Infinity, audioPlayer.currentTime + (details.seekOffset || 10));
            updatePositionState();
        });
    } catch (e) {}
}

async function updateMediaSessionMetadata(track) {
    if (!('mediaSession' in navigator) || !track) return;
    let artworkUrl = await getCachedThumbObjectURL(track.videoId);
    if (!artworkUrl) artworkUrl = `https://i.ytimg.com/vi/${track.videoId}/mqdefault.jpg`;
    navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.author || "",
        artwork: [{ src: artworkUrl, sizes: '320x180', type: 'image/jpeg' }]
    });
}

function hasPrevious() {
    if (activePlayingPlaylist) return activePlayingIndex > 0;
    if (searchQueueIndex !== -1) return searchQueueIndex > 0;
    return false;
}

function hasNext() {
    if (activePlayingPlaylist) return activePlayingIndex < playlists[activePlayingPlaylist].length - 1;
    if (searchQueueIndex !== -1) return searchQueueIndex < currentSearchResults.length - 1;
    return false;
}

function playPrevious() {
    if (activePlayingPlaylist && activePlayingIndex > 0) {
        window.playFromPlaylist(activePlayingPlaylist, activePlayingIndex - 1);
    } else if (searchQueueIndex > 0) {
        playFromSearchResults(searchQueueIndex - 1);
    }
}

function playNext() {
    if (activePlayingPlaylist) {
        const next = activePlayingIndex + 1;
        if (next < playlists[activePlayingPlaylist].length) window.playFromPlaylist(activePlayingPlaylist, next);
    } else if (searchQueueIndex !== -1) {
        const next = searchQueueIndex + 1;
        if (next < currentSearchResults.length) playFromSearchResults(next);
    }
}

function playFromSearchResults(index) {
    activePlayingPlaylist = null;
    activePlayingIndex = -1;
    searchQueueIndex = index;
    const track = currentSearchResults[index];
    currentTrackInfo = track;
    playAudio(track.videoId, track.title);
}

function updateNavButtons() {
    prevTrackBtn.disabled = !hasPrevious();
    nextTrackBtn.disabled = !hasNext();
    downloadBtn.disabled = !audioPlayer.src;
}

function initPlaylists() {
    updatePlaylistDropdowns();
    renderSidebarTracks();
}
function savePlaylists() {
    localStorage.setItem('myPlaylists', JSON.stringify(playlists));
}

searchBtn.addEventListener("click", search);
searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") search();
});

toggleSidebarBtn.addEventListener("click", () => {
    playlistSidebar.classList.toggle("open");
});

cancelModalBtn.addEventListener("click", () => {
    playlistModal.classList.remove("active");
});

sidebarPlaylistSelect.addEventListener("change", renderSidebarTracks);

addToPlaylistBtn.addEventListener("click", () => {
    if (!currentTrackInfo) return;
    newPlaylistInput.value = "";
    updatePlaylistDropdowns();
    playlistModal.classList.add("active");
});

prevTrackBtn.addEventListener("click", playPrevious);
nextTrackBtn.addEventListener("click", playNext);

downloadBtn.addEventListener("click", async () => {
    if (!audioPlayer.src) return;
    const rawName = (currentTrackInfo && currentTrackInfo.title) ? currentTrackInfo.title : "audio";
    const filename = rawName.replace(/[^\w\- ]+/g, "").trim().slice(0, 80) + ".m4a";

    downloadBtn.disabled = true;
    try {
        const response = await fetch(audioPlayer.src);
        if (!response.ok) throw new Error("bad response");
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (e) {
        window.open(audioPlayer.src, "_blank");
    } finally {
        downloadBtn.disabled = !audioPlayer.src;
    }
});

pipBtn.addEventListener("click", async () => {
    if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
    } else {
        try {
            await pipVideo.requestPictureInPicture();
        } catch (e) {}
    }
});

document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "hidden" && !audioPlayer.paused) {
        try {
            if (pipVideo !== document.pictureInPictureElement) {
                await pipVideo.requestPictureInPicture();
            }
        } catch (e) {}
    }
});

async function search() {
    const query = searchInput.value.trim();
    if (!query) return;
    resultsList.innerHTML = `<li style="grid-column:1/-1;text-align:center;">${SVG_ICONS.spinner} Searching...</li>`;
    try {
        const response = await fetch(`${BASE_URL}/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        renderResults(data);
    } catch (error) {
        resultsList.innerHTML = `<li style="grid-column:1/-1;text-align:center;">${SVG_ICONS.warning} Search error: ${escapeHTML(error.message)}</li>`;
    }
}

function renderResults(videos) {
    if (!videos || videos.length === 0) {
        resultsList.innerHTML = `<li style="grid-column:1/-1;text-align:center;">No videos found.</li>`;
        currentSearchResults = [];
        searchQueueIndex = -1;
        return;
    }
    resultsList.innerHTML = "";

    currentSearchResults = videos.map(video => ({
        videoId: video.videoId,
        title: video.title || "Untitled",
        author: video.author || "Unknown author",
        duration: formatDuration(video.lengthSeconds)
    }));
    searchQueueIndex = -1;

    videos.forEach((video, index) => {
        const li = document.createElement("li");
        li.className = "video-item";

        const thumbnail = `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`;
        const title = video.title || "Untitled";
        const author = video.author || "Unknown author";
        const duration = formatDuration(video.lengthSeconds);

        li.innerHTML = `
            <img src="${thumbnail}" alt="Thumbnail" loading="lazy">
            <div class="video-info">
                <div class="video-title">${escapeHTML(title)}</div>
                <div class="video-author">${escapeHTML(author)}${duration ? ` • ${duration}` : ""}</div>
            </div>
        `;

        getCachedThumbObjectURL(video.videoId).then(cachedUrl => {
            if (cachedUrl) {
                const imgEl = li.querySelector("img");
                if (imgEl) imgEl.src = cachedUrl;
            }
        });

        li.addEventListener("click", () => {
            playFromSearchResults(index);
        });

        resultsList.appendChild(li);
    });
}

function attemptToPlay(audio, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        let done = false;
        const cleanup = () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            audio.removeEventListener("playing", onPlaying);
            audio.removeEventListener("error", onError);
        };
        const onPlaying = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(audio.error || new Error("media error")); };
        const timer = setTimeout(() => { cleanup(); reject(new Error("timeout waiting for playback")); }, timeoutMs);

        audio.addEventListener("playing", onPlaying, { once: true });
        audio.addEventListener("error", onError, { once: true });

        audio.play().catch(err => { cleanup(); reject(err); });
    });
}

function fetchWithTimeout(url, ms = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function getStreamCandidates(videoId) {
    const candidates = [];
    try {
        const response = await fetch(`${BASE_URL}/api/v1/videos/${videoId}`);
        if (response.ok) {
            const data = await response.json();
            const formats = data.adaptiveFormats || [];
            formats
                .filter(f => f.type?.includes("audio/mp4") && f.url)
                .forEach(f => candidates.push(f.url));
            formats
                .filter(f => f.type?.startsWith("audio/") && !f.type?.includes("audio/mp4") && f.url)
                .forEach(f => candidates.push(f.url));
        }
    } catch (e) {
    }

    ["140", "251", "250", "249", "171"].forEach(itag => {
        candidates.push(`${BASE_URL}/latest_version?id=${videoId}&itag=${itag}`);
    });

    return candidates;
}

function onPlaybackStarted(title) {
    nowPlayingTitle.textContent = title;
    updatePlayButton();
    updateNavButtons();
    renderSidebarTracks();
    if (currentTrackInfo) {
        updatePiPCanvas(currentTrackInfo);
        updateMediaSessionMetadata(currentTrackInfo);
    }
}

async function playAudio(videoId, title) {
    const myToken = ++playRequestToken;

    nowPlayingTitle.innerHTML = `${SVG_ICONS.spinner} Loading: ${escapeHTML(title)}`;
    audioDock.classList.add("visible");
    updateNavButtons();


    const cachedUrl = await getCachedAudioObjectURL(videoId);
    if (myToken !== playRequestToken) return;
    if (cachedUrl) {
        try {
            audioPlayer.src = cachedUrl;
            audioPlayer.volume = volumeBar.value;
            await attemptToPlay(audioPlayer);
            if (myToken !== playRequestToken) return;
            onPlaybackStarted(title);
            return;
        } catch (e) {
        }
    }

    const candidates = await getStreamCandidates(videoId);
    if (myToken !== playRequestToken) return;

    let lastError = null;

    for (const url of candidates) {
        if (myToken !== playRequestToken) return; // user moved on to another track

        let objectUrl = null;
        try {
            const resp = await fetchWithTimeout(url, 10000);
            if (resp.ok) {
                const blob = await resp.blob();
                if (blob && blob.size > 0) {
                    objectUrl = await cacheAudioBlob(videoId, blob);
                }
            }
        } catch (fetchErr) {
        }

        if (myToken !== playRequestToken) return;

        try {
            audioPlayer.src = objectUrl || url;
            audioPlayer.volume = volumeBar.value;
            await attemptToPlay(audioPlayer);
            if (myToken !== playRequestToken) return;
            onPlaybackStarted(title);
            fetchAndCacheThumbnail(videoId); // fire and forget
            return;
        } catch (err) {
            lastError = err;
        }
    }

    if (myToken !== playRequestToken) return;
    console.error("All playback candidates failed for", videoId, lastError);
    nowPlayingTitle.textContent = `Cannot load audio stream.`;
    updateNavButtons();
}

function updatePlaylistDropdowns() {
    const playlistNames = Object.keys(playlists);
    const options = playlistNames.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join('');
    sidebarPlaylistSelect.innerHTML = options;
    modalPlaylistSelect.innerHTML = options;
    if(!playlistNames.includes(sidebarPlaylistSelect.value) && playlistNames.length > 0) {
        sidebarPlaylistSelect.value = playlistNames[0];
    }
}

confirmAddBtn.addEventListener("click", () => {
    let targetPlaylist = modalPlaylistSelect.value;
    const newName = newPlaylistInput.value.trim();
    
    if (newName) {
        targetPlaylist = newName;
        if (!playlists[targetPlaylist]) playlists[targetPlaylist] = [];
    }

    if (targetPlaylist && currentTrackInfo) {
        playlists[targetPlaylist].push(currentTrackInfo);
        savePlaylists();
        updatePlaylistDropdowns();
        sidebarPlaylistSelect.value = targetPlaylist;
        renderSidebarTracks();
        playlistModal.classList.remove("active");
    }
});

function renderSidebarTracks() {
    playlistTracks.innerHTML = "";
    const selectedPlaylist = sidebarPlaylistSelect.value;
    if (!selectedPlaylist || !playlists[selectedPlaylist]) return;

    const tracks = playlists[selectedPlaylist];
    tracks.forEach((track, index) => {
        const li = document.createElement("li");
        li.className = "playlist-track-item";
        li.setAttribute("draggable", "true");
        li.dataset.index = index;
        
        if (activePlayingPlaylist === selectedPlaylist && activePlayingIndex === index) {
            li.classList.add("active");
        }

        li.innerHTML = `
            <div class="track-title">${index + 1}. ${escapeHTML(track.title)}</div>
            <div class="track-controls">
                <button onclick="playFromPlaylist('${escapeHTML(selectedPlaylist)}', ${index})" title="Play">
                    ${SVG_ICONS.play}
                </button>
                <button onclick="removeTrack('${escapeHTML(selectedPlaylist)}', ${index})" title="Remove">
                    ${SVG_ICONS.trash}
                </button>
            </div>
        `;

        li.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", index);
            li.classList.add("dragging");
        });

        li.addEventListener("dragend", () => {
            li.classList.remove("dragging");
            document.querySelectorAll(".playlist-track-item").forEach(el => el.classList.remove("drag-over"));
        });

        li.addEventListener("dragover", (e) => {
            e.preventDefault();
            li.classList.add("drag-over");
        });

        li.addEventListener("dragleave", () => {
            li.classList.remove("drag-over");
        });

        li.addEventListener("drop", (e) => {
            e.preventDefault();
            li.classList.remove("drag-over");
            const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
            const toIndex = index;
            if (isNaN(fromIndex) || fromIndex === toIndex) return;

            reorderPlaylistTrack(selectedPlaylist, fromIndex, toIndex);
        });

        playlistTracks.appendChild(li);
    });
}

function reorderPlaylistTrack(playlistName, fromIndex, toIndex) {
    const arr = playlists[playlistName];
    const [movedTrack] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, movedTrack);

    if (activePlayingPlaylist === playlistName) {
        if (activePlayingIndex === fromIndex) {
            activePlayingIndex = toIndex;
        } else if (fromIndex < activePlayingIndex && toIndex >= activePlayingIndex) {
            activePlayingIndex--;
        } else if (fromIndex > activePlayingIndex && toIndex <= activePlayingIndex) {
            activePlayingIndex++;
        }
    }

    savePlaylists();
    renderSidebarTracks();
    updateNavButtons();
}

window.playFromPlaylist = function(playlistName, index) {
    activePlayingPlaylist = playlistName;
    activePlayingIndex = index;
    searchQueueIndex = -1;
    const track = playlists[playlistName][index];
    currentTrackInfo = track;
    playAudio(track.videoId, track.title);
};

window.removeTrack = function(playlistName, index) {
    playlists[playlistName].splice(index, 1);
    if(activePlayingPlaylist === playlistName) {
        if(activePlayingIndex === index) activePlayingIndex = -1;
        else if(activePlayingIndex > index) activePlayingIndex--;
    }
    savePlaylists();
    renderSidebarTracks();
    updateNavButtons();
};

audioPlayer.addEventListener("ended", () => {
    playNext();
});

playPauseBtn.addEventListener("click", () => {
    if (!audioPlayer.src) return;
    if (audioPlayer.paused) audioPlayer.play();
    else audioPlayer.pause();
    updatePlayButton();
});

closePlayerBtn.addEventListener("click", () => {
    playRequestToken++; // cancel any in-flight load/retry loop
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
    audioDock.classList.remove("visible");
    activePlayingPlaylist = null;
    activePlayingIndex = -1;
    searchQueueIndex = -1;
    currentTrackInfo = null;
    renderSidebarTracks();
    updateNavButtons();
    updatePiPCanvas(null);
});

audioPlayer.addEventListener("play", () => {
    updatePlayButton();
    pipVideo.play().catch(()=>{});
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    updatePositionState();
});

audioPlayer.addEventListener("pause", () => {
    updatePlayButton();
    pipVideo.pause();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    updatePositionState();
});

audioPlayer.addEventListener("loadedmetadata", () => {
    progressBar.value = 0;
    updateTime();
    updatePositionState();
});

audioPlayer.addEventListener("seeked", updatePositionState);

audioPlayer.addEventListener("timeupdate", () => {
    if (audioPlayer.duration) {
        progressBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    }
    updateTime();
    updatePositionState();
});

progressBar.addEventListener("input", () => {
    if (audioPlayer.duration) {
        audioPlayer.currentTime = (progressBar.value / 100) * audioPlayer.duration;
        updatePositionState();
    }
});

volumeBar.addEventListener("input", () => {
    audioPlayer.volume = volumeBar.value;
});

function updatePlayButton() {
    playPauseBtn.innerHTML = audioPlayer.paused ? SVG_ICONS.play : SVG_ICONS.pause;
}

function updateTime() {
    currentTime.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);
    return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function formatDuration(seconds) {
    if (!seconds) return "";
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[character]));
}

initPlaylists();
updateNavButtons();
search();
