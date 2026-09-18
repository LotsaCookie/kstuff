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

// Playlist queue state
let activePlayingPlaylist = null;
let activePlayingIndex = -1;

// Search-results queue state (lets prev/next work even when not playing from a saved playlist)
let currentSearchResults = [];
let searchQueueIndex = -1;

let currentTrackInfo = null;

/* ----------------------- Picture-in-Picture setup ----------------------- */
// Square canvas so the PiP window itself is square.
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

// Low base frame rate (theme/thumbnail changes are rare) but we push frames
// on demand via requestFrame() so updates are instant, not delayed up to 1s.
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

// Read the live CSS custom properties instead of hardcoding colors, so the
// PiP canvas stays in sync when the parent window updates :root dynamically.
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
        // Cover-fit: crop the thumbnail to fill the square instead of
        // letterboxing it.
        const scale = Math.max(pipCanvas.width / img.width, pipCanvas.height / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const dx = (pipCanvas.width - drawWidth) / 2;
        const dy = (pipCanvas.height - drawHeight) / 2;
        pipCtx.drawImage(img, dx, dy, drawWidth, drawHeight);

        // subtle scrim so the title stays legible over any thumbnail
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

function updatePiPCanvas(track) {
    if (!track) {
        drawPipFrame(null, null);
        return;
    }

    if (pipThumbCache.videoId === track.videoId && pipThumbCache.img) {
        drawPipFrame(track, pipThumbCache.img);
        return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = `${BASE_URL}/vi/${track.videoId}/mqdefault.jpg`;

    img.onload = () => {
        pipThumbCache = { videoId: track.videoId, img };
        drawPipFrame(track, img);
    };

    img.onerror = () => {
        pipThumbCache = { videoId: null, img: null };
        drawPipFrame(track, null);
    };
}

// Redraw the PiP canvas (colors only need the cached thumbnail, no refetch)
// whenever the parent window mutates :root's inline style/class.
const rootThemeObserver = new MutationObserver(() => {
    if (currentTrackInfo) updatePiPCanvas(currentTrackInfo);
});
rootThemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style", "class"]
});

/* ------------------------- Media Session wiring -------------------------- */
// This is what actually gives the PiP overlay (and OS media controls) a
// working, draggable scrubber: the canvas-captured stream has no intrinsic
// duration, but setPositionState()/the 'seekto' handler are independent of
// that and drive the native seek bar directly against audioPlayer.
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

function updateMediaSessionMetadata(track) {
    if (!('mediaSession' in navigator) || !track) return;
    navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.author || "",
        artwork: [{ src: `https://i.ytimg.com/vi/${track.videoId}/mqdefault.jpg`, sizes: '320x180', type: 'image/jpeg' }]
    });
}

/* ---------------------------- Queue navigation --------------------------- */
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

    // Keep a flat queue of these results so prev/next work outside playlists too.
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

        li.addEventListener("click", () => {
            playFromSearchResults(index);
        });

        resultsList.appendChild(li);
    });
}

async function playAudio(videoId, title, attempt = 1) {
    nowPlayingTitle.textContent = "Loading: " + title;
    audioDock.classList.add("visible");
    updateNavButtons();

    try {
        const response = await fetch(`${BASE_URL}/api/v1/videos/${videoId}`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();

        let format = data.adaptiveFormats?.find(item => item.type?.includes("audio/mp4") && item.url);
        if (!format) format = data.adaptiveFormats?.find(item => item.type?.startsWith("audio/") && item.url);

        if (format && format.url) {
            audioPlayer.src = format.url;
        } else {
            audioPlayer.src = `${BASE_URL}/latest_version?id=${videoId}&itag=140`;
        }

        audioPlayer.volume = volumeBar.value;
        await audioPlayer.play();
        nowPlayingTitle.textContent = title;
        updatePlayButton();
        updateNavButtons();
        renderSidebarTracks();

        if (currentTrackInfo) {
            updatePiPCanvas(currentTrackInfo);
            updateMediaSessionMetadata(currentTrackInfo);
        }

    } catch (error) {
        if (attempt < 2) {
            setTimeout(() => playAudio(videoId, title, attempt + 1), 1000);
        } else {
            audioPlayer.src = `${BASE_URL}/latest_version?id=${videoId}&itag=140`;
            audioPlayer.play().then(() => {
                nowPlayingTitle.textContent = title;
                updatePlayButton();
                updateNavButtons();
                if (currentTrackInfo) {
                    updatePiPCanvas(currentTrackInfo);
                    updateMediaSessionMetadata(currentTrackInfo);
                }
            }).catch(e => {
                nowPlayingTitle.textContent = `Error: Cannot load audio stream.`;
            });
        }
    }
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
