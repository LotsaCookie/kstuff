const SVG_ICONS = {
    play: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
    pause: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
    spinner: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
    chevronLeft: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`
};

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsList = document.getElementById("resultsList");
const homeView = document.getElementById("homeView");
const homeSections = document.getElementById("homeSections");
const homeStatus = document.getElementById("homeStatus");
const homeRetryBtn = document.getElementById("homeRetryBtn");
const homeBtn = document.getElementById("homeBtn");
const audioDock = document.getElementById("audioDock");
const audioPlayer = document.getElementById("audioPlayer");
const nowPlayingCover = document.getElementById("nowPlayingCover");
const nowPlayingTitle = document.getElementById("nowPlayingTitle");
const nowPlayingArtist = document.getElementById("nowPlayingArtist");
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

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const INVIDIOUS_BASE = "https://invidious.f5.si";

const WISP_URL = "wss://wisp.mercurywork.shop/";
const BAREMUX_URL = "https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.1.9/+esm";
const BAREMUX_WORKER_URL = "https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.1.9/dist/worker.js";
const EPOXY_TRANSPORT_URL = "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs";
const DEEZER_API = "https://api.deezer.com";
const ITUNES_SEARCH_API = "https://itunes.apple.com/search";
const APPLE_CHARTS_API = "https://rss.applemarketingtools.com/api/v2/us/music/most-played";

const HOME_SHELVES = [
    { id: "trending", title: "Trending Now", genre: 0 },
    { id: "pop", title: "Pop", genre: 132 },
    { id: "hiphop", title: "Hip-Hop", genre: 116 },
    { id: "rock", title: "Rock", genre: 152 },
    { id: "dance", title: "Dance", genre: 113 },
    { id: "rnb", title: "R&B", genre: 165 },
    { id: "latin", title: "Latin", genre: 197 },
    { id: "electro", title: "Electronic", genre: 106 },
    { id: "country", title: "Country", genre: 84 },
    { id: "alternative", title: "Alternative", genre: 85 }
];
const SHELF_SIZE = 30;
const SHELF_SKELETONS = 8;
const SHELF_CACHE_KEY = "shelfCacheV2"; // bumped: covers are now the smaller size
const SHELF_TTL_MS = 30 * 60 * 1000;

const MAX_ENRICH_LOOKUPS = 4;
const MAX_VIDEOS_TRIED = 10;

/* ------------------------------------------------------------------ */
/*  Wisp client + fetch helpers                                        */
/* ------------------------------------------------------------------ */

let bareClientPromise = null;

function getBareClient() {
    if (bareClientPromise) return bareClientPromise;

    bareClientPromise = (async () => {
        const { BareMuxConnection, BareClient } = await import(BAREMUX_URL);

        const workerCode = `importScripts("${BAREMUX_WORKER_URL}");`;
        const workerBlob = new Blob([workerCode], { type: "text/javascript" });
        const workerUrl = URL.createObjectURL(workerBlob);

        const conn = new BareMuxConnection(workerUrl);
        await conn.setTransport(EPOXY_TRANSPORT_URL, [{ wisp: WISP_URL }]);

        return new BareClient();
    })();

    bareClientPromise.catch(() => { bareClientPromise = null; });

    return bareClientPromise;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, label = "request") {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
        promise.then(
            v => { clearTimeout(timer); resolve(v); },
            e => { clearTimeout(timer); reject(e); }
        );
    });
}

function fetchWithTimeout(url, ms = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

function createLimiter(max) {
    let active = 0;
    const waiting = [];
    const pump = () => {
        if (active >= max || waiting.length === 0) return;
        const job = waiting.shift();
        active++;
        job.fn().then(job.resolve, job.reject).finally(() => {
            active--;
            pump();
        });
    };
    return fn => new Promise((resolve, reject) => {
        waiting.push({ fn, resolve, reject });
        pump();
    });
}

const externalLimiter = createLimiter(3);
const imageLimiter = createLimiter(6);
const enrichLimiter = createLimiter(2);

let invidiousDirectSkipUntil = 0;
const DIRECT_RETRY_MS = 3 * 60 * 1000;

async function fetchInvidiousJSON(path, directTimeout = 8000, proxyTimeout = 20000) {
    const url = `${INVIDIOUS_BASE}${path}`;

    if (Date.now() >= invidiousDirectSkipUntil) {
        try {
            const response = await fetchWithTimeout(url, directTimeout);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (directError) {
            if (directError.name === "AbortError" || directError instanceof TypeError) {
                invidiousDirectSkipUntil = Date.now() + DIRECT_RETRY_MS;
            }
            console.warn("Direct fetch failed, falling back to Wisp:", directError.message);
        }
    }

    const client = await withTimeout(getBareClient(), proxyTimeout, "Wisp setup");
    const proxyResponse = await withTimeout(client.fetch(url), proxyTimeout, "Wisp fetch");
    if (!proxyResponse.ok) throw new Error(`Proxy HTTP ${proxyResponse.status}`);
    return await proxyResponse.json();
}

async function fetchBlobViaWisp(url, mime, timeoutMs = 60000) {
    const client = await withTimeout(getBareClient(), 20000, "Wisp setup");
    const response = await withTimeout(client.fetch(url), timeoutMs, "Wisp audio fetch");
    if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
    const blob = await response.blob();
    if (!blob || blob.size === 0) throw new Error("Empty audio blob");
    return new Blob([blob], { type: mime || blob.type || "audio/mp4" });
}


async function fetchExternalOnce(url) {
    try {
        return await withTimeout((async () => {
            const client = await getBareClient();
            const response = await client.fetch(url);
            if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
            return await response.json();
        })(), 10000, "Wisp API fetch");
    } catch (wispError) {
        console.warn("Wisp API fetch failed, trying a direct request:", wispError.message);
    }

    const response = await fetchWithTimeout(url, 6000);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

function fetchExternalJSON(url) {
    return externalLimiter(async () => {
        for (let attempt = 0; ; attempt++) {
            const data = await fetchExternalOnce(url);
            if (data && data.error) {
                if (attempt < 2) {
                    await sleep(900 * (attempt + 1));
                    continue;
                }
                throw new Error(`API error: ${JSON.stringify(data.error).slice(0, 120)}`);
            }
            return data;
        }
    });
}

/* ------------------------------------------------------------------ */
/*  Song matching (pure helpers)                                       */
/* ------------------------------------------------------------------ */


function ytThumbUrls(videoId) {
    return [
        `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        `${INVIDIOUS_BASE}/vi/${videoId}/mqdefault.jpg`
    ];
}

function stripDiacritics(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function tokenize(s) {
    return stripDiacritics(s)
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter(Boolean);
}

function stripFeat(title) {
    return String(title || "")
        .replace(/[\(\[]\s*(?:feat|ft|featuring|with|prod)\b[^\)\]]*[\)\]]/gi, " ")
        .replace(/\s[-–]\s*(?:feat|ft|featuring)\b.*$/i, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function cleanChannelName(name) {
    return String(name || "")
        .replace(/\s*-\s*topic$/i, "")
        .replace(/\s*vevo$/i, "")
        .replace(/\s*official$/i, "")
        .trim();
}

function cleanVideoTitle(raw) {
    return String(raw || "")
        .replace(/[\(\[\{【「『][^\)\]\}】」』]*[\)\]\}】」』]/g, " ")
        .replace(/\bofficial\s+(?:music\s+|lyric\s+|hd\s+)?(?:video|audio|visuali[sz]er|lyrics?)\b/gi, " ")
        .replace(/\b(?:lyric|lyrics)\s+video\b/gi, " ")
        .replace(/\b(?:music\s+video|full\s+video|video\s+oficial|audio\s+oficial)\b/gi, " ")
        .replace(/\b(?:hd|hq|4k|1080p|720p|explicit)\b/gi, " ")
        .replace(/\blyrics?\s*$/gi, " ")
        .replace(/\b(?:feat|ft|featuring)\b\.?.*$/i, " ")
        .replace(/\s+[|｜]\s+.*$/, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function guessArtistTitle(video) {
    const cleaned = cleanVideoTitle(video.title);
    const match = cleaned.match(/^(.+?)\s+[-–—―~:]\s+(.+)$/);
    if (match) return { artist: match[1].trim(), title: match[2].trim() };
    return { artist: cleanChannelName(video.author), title: cleaned };
}

const VERSION_PATTERNS = [
    ["live", /\blive\b/],
    ["remix", /\bremix(?:ed)?\b|\brmx\b|\bbootleg\b/],
    ["cover", /\bcovers?\b(?!\s+art)/],
    ["karaoke", /\bkaraoke\b/],
    ["instrumental", /\binstrumental\b/],
    ["acoustic", /\bacoustic\b/],
    ["sped", /\bsped\s+up\b|\bspeed\s+up\b|\bnightcore\b/],
    ["slowed", /\bslowed\b|\breverb\b/],
    ["8d", /\b8d\b/],
    ["reaction", /\breaction\b|\breacts?\b|\breview\b/],
    ["tutorial", /\btutorial\b|\blesson\b|\bhow to play\b/],
    ["mashup", /\bmashup\b|\bmedley\b/],
    ["loop", /\b\d+\s*hours?\b|\bloop\b/]
];

function versionFlags(text) {
    const s = stripDiacritics(text).toLowerCase();
    const flags = new Set();
    for (const [name, re] of VERSION_PATTERNS) {
        if (re.test(s)) flags.add(name);
    }
    return flags;
}

function makeSong({ source, id, title, titleShort, artist, cover, duration }) {
    return {
        key: `${source}:${id}`,
        source,
        id,
        title,
        titleShort: titleShort || title,
        artist: artist || "Unknown artist",
        cover: cover || "",
        duration: Number(duration) || 0,
        videoId: null,
        videos: []
    };
}

function rawTrackFromVideo(video) {
    return {
        key: `yt:${video.videoId}`,
        source: "youtube",
        id: video.videoId,
        title: video.title || "Untitled",
        titleShort: video.title || "Untitled",
        artist: cleanChannelName(video.author) || video.author || "Unknown artist",
        cover: ytThumbUrls(video.videoId)[0],
        duration: Number(video.lengthSeconds) || 0,
        videoId: video.videoId,
        videos: [video]
    };
}

function songTokenInfo(song) {
    if (!song._tok) {
        song._tok = {
            title: [...new Set(tokenize(stripFeat(song.titleShort || song.title)))],
            artist: [...new Set(tokenize(song.artist))],
            flags: versionFlags(song.title)
        };
    }
    return song._tok;
}

function matchVideoToSong(video, song) {
    const info = songTokenInfo(song);
    if (!info.title.length) return { score: 0, confident: false };

    const channel = cleanChannelName(video.author);
    const vTokens = tokenize(`${video.title || ""} ${channel}`);
    const vSet = new Set(vTokens);
    const compact = vTokens.join("");
    const coverage = list => (list.length ? list.filter(t => vSet.has(t)).length / list.length : 0);

    const titleCov = coverage(info.title);
    let artistCov = coverage(info.artist);
    const artistCompact = info.artist.join("");
    if (artistCov < 1 && artistCompact.length >= 4 && compact.includes(artistCompact)) artistCov = 1;

    const durDiff = (video.lengthSeconds && song.duration)
        ? Math.abs(Number(video.lengthSeconds) - song.duration)
        : null;
    const mismatch = [...versionFlags(video.title)].some(flag => !info.flags.has(flag));

    let score = titleCov * 0.6 + artistCov * 0.3 + Math.min(info.title.length, 6) * 0.005;
    if (durDiff !== null) {
        if (durDiff <= 8) score += 0.12;
        else if (durDiff <= 25) score += 0.05;
        else if (durDiff > 90) score -= 0.2;
    }
    const author = video.author || "";
    if (/\s-\s*topic$/i.test(author)) score += 0.1;
    else if (/vevo$/i.test(author)) score += 0.04;
    if (/official audio/i.test(video.title || "")) score += 0.03;
    if (mismatch) score -= 0.3;

    const needTitle = info.title.length <= 2 ? 1 : 0.75;
    const confident = titleCov >= needTitle
        && artistCov >= 0.5
        && !mismatch
        && (durDiff === null || durDiff <= 120);

    return { score, confident };
}

function rankVideos(videos, song) {
    const good = [];
    const poor = [];
    const seen = new Set();
    for (const video of videos) {
        if (!video || !video.videoId || seen.has(video.videoId)) continue;
        seen.add(video.videoId);
        const m = matchVideoToSong(video, song);
        (m.confident ? good : poor).push({ video, score: m.score });
    }
    const byScore = (a, b) => b.score - a.score;
    good.sort(byScore);
    poor.sort(byScore);
    return { good: good.map(x => x.video), poor: poor.map(x => x.video) };
}

function songSignature(song) {
    const flags = [...versionFlags(song.title)].sort().join(",");
    return `${tokenize(song.artist).join(" ")}|${tokenize(stripFeat(song.titleShort || song.title)).join(" ")}|${flags}`;
}

function dedupeSongs(songs) {
    const seen = new Set();
    return songs.filter(song => {
        const sig = songSignature(song);
        if (seen.has(sig)) return false;
        seen.add(sig);
        return true;
    });
}

function addVideo(track, video) {
    if (!track.videos.some(v => v.videoId === video.videoId)) track.videos.push(video);
}

function buildSearchTracks(videos, songs, query = "") {
    const unique = dedupeSongs(songs);
    const byKey = new Map();
    const tracks = [];

    for (const video of videos) {
        let best = null;
        let bestScore = -Infinity;
        for (const song of unique) {
            const m = matchVideoToSong(video, song);
            if (m.confident && m.score > bestScore) {
                best = song;
                bestScore = m.score;
            }
        }
        if (best) {
            let track = byKey.get(best.key);
            if (!track) {
                track = { ...best, videos: [] };
                byKey.set(best.key, track);
                tracks.push(track);
            }
            addVideo(track, video);
        } else {
            tracks.push(rawTrackFromVideo(video));
        }
    }

    if (byKey.size > 0 || videos.length === 0) {
        const q = new Set(tokenize(query));
        let extra = 0;
        for (const song of unique) {
            if (byKey.has(song.key) || extra >= 8) continue;
            const info = songTokenInfo(song);
            const relevant = videos.length === 0
                || info.title.some(t => q.has(t))
                || info.artist.some(t => q.has(t));
            if (relevant) {
                tracks.push({ ...song, videos: [] });
                extra++;
            }
        }
    }

    return tracks;
}

function buildSongQueries(song) {
    const title = stripFeat(song.titleShort || song.title);
    const artist = song.artist || "";
    const queries = [
        `${artist} - ${title}`,
        `${title} ${artist} official audio`,
        `${title} ${artist} lyrics`,
        `${artist} ${title} topic`
    ].map(q => q.replace(/\s+/g, " ").trim());
    return [...new Set(queries)];
}

function serializeTrack(t) {
    return {
        key: t.key,
        source: t.source,
        id: t.id,
        title: t.title,
        titleShort: t.titleShort,
        artist: t.artist,
        cover: t.cover,
        duration: t.duration,
        videoId: t.videoId || null
    };
}

/* ------------------------------------------------------------------ */
/*  External API -> song objects                                       */
/* ------------------------------------------------------------------ */

function songFromDeezer(t) {
    if (!t || !t.id || !t.title) return null;
    const album = t.album || {};
    return makeSong({
        source: "deezer",
        id: t.id,
        title: t.title,
        titleShort: t.title_short || t.title,
        artist: t.artist && t.artist.name,
        cover: album.cover_medium || album.cover_big || album.cover || "",
        duration: t.duration
    });
}

function hiResArtwork(url) {
    return String(url || "").replace(/\/\d+x\d+(bb)?\./, "/300x300bb.");
}

function upscaleCover(url, px = 500) {
    return String(url || "")
        .replace(/\/\d+x\d+-/, `/${px}x${px}-`)            // Deezer
        .replace(/\/\d+x\d+(bb)?\./, `/${px}x${px}bb.`);   // Apple
}

function songFromItunes(r) {
    const id = r && (r.trackId || r.id);
    const title = r && (r.trackName || r.name);
    if (!id || !title) return null;
    return makeSong({
        source: "itunes",
        id,
        title,
        artist: r.artistName,
        cover: hiResArtwork(r.artworkUrl100),
        duration: r.trackTimeMillis ? r.trackTimeMillis / 1000 : 0
    });
}

async function deezerSearch(query, limit) {
    const data = await fetchExternalJSON(`${DEEZER_API}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return dedupeSongs(((data && data.data) || []).map(songFromDeezer).filter(Boolean));
}

async function itunesSearch(query, limit) {
    const data = await fetchExternalJSON(
        `${ITUNES_SEARCH_API}?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`
    );
    return dedupeSongs(((data && data.results) || []).map(songFromItunes).filter(Boolean));
}

const songSearchCache = new Map();

async function searchSongsMeta(query, limit = 25) {
    const cacheKey = `${limit}|${query.toLowerCase()}`;
    if (songSearchCache.has(cacheKey)) return songSearchCache.get(cacheKey);

    let songs = [];
    try {
        songs = await deezerSearch(query, limit);
    } catch (e) {
        console.warn("Deezer search failed:", e.message);
    }
    if (songs.length === 0) {
        try {
            songs = await itunesSearch(query, limit);
        } catch (e) {
            console.warn("iTunes search failed:", e.message);
        }
    }

    if (songSearchCache.size > 100) songSearchCache.clear();
    songSearchCache.set(cacheKey, songs);
    return songs;
}

async function fetchDeezerChart(genreId) {
    const data = await fetchExternalJSON(`${DEEZER_API}/chart/${genreId}/tracks?limit=${SHELF_SIZE}`);
    return dedupeSongs(((data && data.data) || []).map(songFromDeezer).filter(Boolean));
}

async function fetchAppleTrending() {
    const data = await fetchExternalJSON(`${APPLE_CHARTS_API}/${SHELF_SIZE}/songs.json`);
    const results = (data && data.feed && data.feed.results) || [];
    return dedupeSongs(results.map(songFromItunes).filter(Boolean));
}

/* ------------------------------------------------------------------ */
/*  YouTube search through Invidious                                   */
/* ------------------------------------------------------------------ */

const videoSearchCache = new Map();

async function searchVideosCached(query) {
    if (videoSearchCache.has(query)) return videoSearchCache.get(query);
    const data = await fetchInvidiousJSON(`/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
    const videos = (Array.isArray(data) ? data : []).filter(v => v && v.videoId && !v.liveNow);
    if (videoSearchCache.size > 80) videoSearchCache.clear();
    videoSearchCache.set(query, videos);
    return videos;
}

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

function normalizeTrack(t) {
    if (!t) return t;
    if (!t.artist && t.author) t.artist = t.author;
    if (!t.source) t.source = "youtube";
    if (!t.key) t.key = `yt:${t.videoId}`;
    if (!t.titleShort) t.titleShort = t.title;
    if (!t.cover && t.videoId) t.cover = ytThumbUrls(t.videoId)[0];
    if (!Array.isArray(t.videos)) t.videos = [];
    return t;
}

let playlists = {};
try {
    playlists = JSON.parse(localStorage.getItem("myPlaylists")) || { "Favorites": [] };
} catch (e) {
    playlists = { "Favorites": [] };
}
Object.values(playlists).forEach(list => list.forEach(normalizeTrack));

let workingVideos = {};
try {
    workingVideos = JSON.parse(localStorage.getItem("songVideoMap")) || {};
} catch (e) {
    workingVideos = {};
}

function rememberWorkingVideo(key, videoId) {
    delete workingVideos[key];
    workingVideos[key] = videoId;
    const keys = Object.keys(workingVideos);
    if (keys.length > 800) keys.slice(0, keys.length - 800).forEach(k => delete workingVideos[k]);
    try { localStorage.setItem("songVideoMap", JSON.stringify(workingVideos)); } catch (e) {}
}

function forgetWorkingVideo(key) {
    if (!(key in workingVideos)) return;
    delete workingVideos[key];
    try { localStorage.setItem("songVideoMap", JSON.stringify(workingVideos)); } catch (e) {}
}

let activePlayingPlaylist = null;
let activePlayingIndex = -1;
let activeList = null;

let currentSearchResults = [];
let searchToken = 0;
const tileEls = new Map();

let currentTrackInfo = null;
let playRequestToken = 0;

/* ------------------------------------------------------------------ */
/*  IndexedDB cache                                                    */
/* ------------------------------------------------------------------ */

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

const cacheDBPromise = openCacheDB().catch(() => null);

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

/* ------------------------------------------------------------------ */
/*  Images (always through Wisp, cached as blobs, loaded lazily)       */
/* ------------------------------------------------------------------ */

const thumbObjectUrlCache = new Map();
const thumbInflight = new Map();

async function fetchImageBlobViaWisp(url) {
    return imageLimiter(async () => {
        const client = await withTimeout(getBareClient(), 20000, "Wisp setup");
        const response = await withTimeout(client.fetch(url), 15000, "Wisp image fetch");
        if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
        const blob = await withTimeout(response.blob(), 15000, "Wisp image body");
        if (!blob || blob.size === 0) throw new Error("Empty image");
        if (blob.type && blob.type.startsWith("text/")) throw new Error("Not an image");
        return blob;
    });
}

function getImageBlobURL(url) {
    const known = thumbObjectUrlCache.get(url);
    if (known) return Promise.resolve(known);
    if (thumbInflight.has(url)) return thumbInflight.get(url);

    const job = (async () => {
        let blob = await idbGet(THUMB_STORE, url);

        if (!blob || blob.size === 0) {
            blob = await fetchImageBlobViaWisp(url);
            blob = new Blob([blob], { type: blob.type || "image/jpeg" });
            idbSet(THUMB_STORE, url, blob);
        }

        const objectUrl = URL.createObjectURL(blob);
        thumbObjectUrlCache.set(url, objectUrl);
        return objectUrl;
    })();

    thumbInflight.set(url, job);
    job.then(() => thumbInflight.delete(url), () => thumbInflight.delete(url));
    return job;
}

function trackCoverUrls(track, big = false) {
    const urls = [];
    if (track.cover) {
        if (big) urls.push(upscaleCover(track.cover));
        urls.push(track.cover);
    }
    const videoId = track.videoId || (track.videos && track.videos[0] && track.videos[0].videoId);
    if (videoId) urls.push(...ytThumbUrls(videoId));
    return [...new Set(urls)];
}

let imageObserver = null;

function getImageObserver() {
    if (!imageObserver) {
        imageObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const img = entry.target;
                imageObserver.unobserve(img);
                const start = img._startLoad;
                img._startLoad = null;
                if (start) start();
            });
        }, { rootMargin: "300px" });
    }
    return imageObserver;
}

function decodeInto(img, src) {
    return new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image failed to decode"));
        img.src = src;
    });
}

function setImage(img, urls, lazy = false) {
    const list = urls.filter(Boolean);
    const token = (img._imgToken = (img._imgToken || 0) + 1);

    if (imageObserver) imageObserver.unobserve(img);
    img._startLoad = null;
    img.classList.remove("no-art");

    if (list.length === 0) {
        img.classList.add("no-art");
        return;
    }

    // Already fetched this session: show it instantly
    const ready = thumbObjectUrlCache.get(list[0]);
    if (ready) {
        img.src = ready;
        return;
    }

    const load = async () => {
        for (const url of list) {
            if (img._imgToken !== token) return;
            try {
                const objectUrl = await getImageBlobURL(url);
                if (img._imgToken !== token) return;
                await decodeInto(img, objectUrl);
                return;
            } catch (e) {}
        }
        if (img._imgToken === token) img.classList.add("no-art");
    };

    if (lazy && "IntersectionObserver" in window) {
        img._startLoad = load;
        getImageObserver().observe(img);
    } else {
        load();
    }
}

/* ------------------------------------------------------------------ */
/*  Picture-in-Picture canvas                                          */
/* ------------------------------------------------------------------ */

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

function truncateForCanvas(ctx, str, maxWidth) {
    if (ctx.measureText(str).width <= maxWidth) return str;
    let truncated = str;
    while (truncated.length > 1 && ctx.measureText(truncated + "…").width > maxWidth) {
        truncated = truncated.slice(0, -1);
    }
    return truncated + "…";
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

    if (track && track.artist) {
        pipCtx.font = "bold 14px Quicksand, sans-serif";
        pipCtx.globalAlpha = 0.75;
        pipCtx.fillText(truncateForCanvas(pipCtx, track.artist, pipCanvas.width - 30), 15, pipCanvas.height - 18);
        pipCtx.globalAlpha = 1;
    }

    pushPipFrame();
}

let pipThumbCache = { key: null, img: null };

function loadImageElement(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function updatePiPCanvas(track) {
    if (!track) {
        drawPipFrame(null, null);
        return;
    }

    if (pipThumbCache.key === track.key && pipThumbCache.img) {
        drawPipFrame(track, pipThumbCache.img);
        return;
    }

    drawPipFrame(track, null);

    for (const url of trackCoverUrls(track, true)) {
        try {
            const objectUrl = await getImageBlobURL(url);
            const img = await loadImageElement(objectUrl);
            if (currentTrackInfo !== track) return;
            pipThumbCache = { key: track.key, img };
            drawPipFrame(track, img);
            return;
        } catch (e) {}
    }
}

const rootThemeObserver = new MutationObserver(() => {
    if (currentTrackInfo) updatePiPCanvas(currentTrackInfo);
});
rootThemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style", "class"]
});

/* ------------------------------------------------------------------ */
/*  Media Session                                                      */
/* ------------------------------------------------------------------ */

function updatePositionState() {
    if (!("mediaSession" in navigator)) return;
    if (!audioPlayer.duration || !isFinite(audioPlayer.duration)) return;
    try {
        navigator.mediaSession.setPositionState({
            duration: audioPlayer.duration,
            playbackRate: audioPlayer.playbackRate || 1,
            position: Math.min(audioPlayer.currentTime, audioPlayer.duration)
        });
    } catch (e) {}
}

if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => {
        if (audioPlayer.src) audioPlayer.play();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
        audioPlayer.pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
        playPrevious();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
        playNext();
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (!audioPlayer.duration) return;
        if (details.fastSeek && "fastSeek" in audioPlayer) {
            audioPlayer.fastSeek(details.seekTime);
        } else {
            audioPlayer.currentTime = details.seekTime;
        }
        updatePositionState();
    });
    try {
        navigator.mediaSession.setActionHandler("seekbackward", (details) => {
            audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - (details.seekOffset || 10));
            updatePositionState();
        });
        navigator.mediaSession.setActionHandler("seekforward", (details) => {
            audioPlayer.currentTime = Math.min(audioPlayer.duration || Infinity, audioPlayer.currentTime + (details.seekOffset || 10));
            updatePositionState();
        });
    } catch (e) {}
}

async function updateMediaSessionMetadata(track) {
    if (!("mediaSession" in navigator) || !track) return;

    const setMeta = (src) => {
        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: track.artist || "",
                artwork: src ? [{ src, sizes: "512x512" }] : []
            });
        } catch (e) {}
    };

    // Text first; artwork is added once the Wisp copy is ready
    setMeta(null);

    for (const url of trackCoverUrls(track, true)) {
        try {
            const blobUrl = await getImageBlobURL(url);
            if (currentTrackInfo === track) setMeta(blobUrl);
            return;
        } catch (e) {}
    }
}

/* ------------------------------------------------------------------ */
/*  Queue navigation                                                   */
/* ------------------------------------------------------------------ */

function getQueue() {
    if (activePlayingPlaylist && playlists[activePlayingPlaylist]) {
        return { kind: "playlist", tracks: playlists[activePlayingPlaylist], index: activePlayingIndex };
    }
    if (activeList) {
        return { kind: "list", tracks: activeList, index: activeList.indexOf(currentTrackInfo) };
    }
    return null;
}

function hasPrevious() {
    const q = getQueue();
    return !!q && q.index > 0;
}

function hasNext() {
    const q = getQueue();
    return !!q && q.index >= 0 && q.index < q.tracks.length - 1;
}

function playQueueIndex(q, index) {
    if (q.kind === "playlist") window.playFromPlaylist(activePlayingPlaylist, index);
    else playTrack(q.tracks[index]);
}

function playPrevious() {
    const q = getQueue();
    if (q && q.index > 0) playQueueIndex(q, q.index - 1);
}

function playNext() {
    const q = getQueue();
    if (q && q.index >= 0 && q.index < q.tracks.length - 1) playQueueIndex(q, q.index + 1);
}

function playFromList(list, track) {
    activePlayingPlaylist = null;
    activePlayingIndex = -1;
    activeList = list;
    playTrack(track);
}

function updateNavButtons() {
    prevTrackBtn.disabled = !hasPrevious();
    nextTrackBtn.disabled = !hasNext();
    if (downloadBtn) downloadBtn.disabled = !audioPlayer.src;
}

function initPlaylists() {
    updatePlaylistDropdowns();
    renderSidebarTracks();
}

function savePlaylists() {
    const plain = {};
    for (const [name, tracks] of Object.entries(playlists)) plain[name] = tracks.map(serializeTrack);
    localStorage.setItem("myPlaylists", JSON.stringify(plain));
}

/* ------------------------------------------------------------------ */
/*  UI events                                                          */
/* ------------------------------------------------------------------ */

searchBtn.addEventListener("click", search);
searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") search();
});

homeBtn.addEventListener("click", showHome);
homeRetryBtn.addEventListener("click", buildHomeSkeleton);

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

if (downloadBtn) {
    downloadBtn.addEventListener("click", async () => {
        if (!audioPlayer.src) return;
        const track = currentTrackInfo;
        const rawName = track ? `${track.artist ? track.artist + " - " : ""}${track.title}` : "audio";

        downloadBtn.disabled = true;
        try {
            const response = await fetch(audioPlayer.src);
            if (!response.ok) throw new Error("bad response");
            const blob = await response.blob();
            const ext = (blob.type || "").includes("webm") ? "webm" : "m4a";
            const filename = rawName.replace(/[^\w\- ]+/g, "").trim().slice(0, 80) + "." + ext;
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
}

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

/* ------------------------------------------------------------------ */
/*  Tiles                                                              */
/* ------------------------------------------------------------------ */

function fillTile(button, track) {
    button.querySelector(".tile-title").textContent = track.title;
    button.querySelector(".tile-artist").textContent = track.artist;
    button.setAttribute("aria-label", `${track.title} by ${track.artist}`);
    setImage(button.querySelector("img"), trackCoverUrls(track), true);
}

function createTile(track, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tile";
    button.innerHTML = `
        <img alt="" decoding="async">
        <div class="tile-overlay">
            <div class="tile-title"></div>
            <div class="tile-artist"></div>
        </div>
    `;
    fillTile(button, track);
    button.addEventListener("click", onClick);
    return button;
}

/* ------------------------------------------------------------------ */
/*  Home page shelves                                                  */
/* ------------------------------------------------------------------ */

let shelfObserver = null;

function readShelfCache() {
    try {
        return JSON.parse(localStorage.getItem(SHELF_CACHE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function writeShelfCache(id, tracks) {
    const cache = readShelfCache();
    cache[id] = { t: Date.now(), tracks: tracks.map(serializeTrack) };
    try { localStorage.setItem(SHELF_CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
}

async function getShelfTracks(shelf) {
    const cached = readShelfCache()[shelf.id];
    const hydrate = list => list.map(t => normalizeTrack({ ...t, videos: [] }));

    if (cached && Array.isArray(cached.tracks) && cached.tracks.length && Date.now() - cached.t < SHELF_TTL_MS) {
        return hydrate(cached.tracks);
    }

    let songs = [];
    let lastError = null;
    try {
        songs = await fetchDeezerChart(shelf.genre);
    } catch (e) {
        lastError = e;
    }

    if (songs.length === 0 && shelf.genre === 0) {
        try {
            songs = await fetchAppleTrending();
        } catch (e) {
            lastError = e;
        }
    }

    if (songs.length === 0) {
        if (cached && Array.isArray(cached.tracks) && cached.tracks.length) return hydrate(cached.tracks);
        throw lastError || new Error("Empty shelf");
    }

    writeShelfCache(shelf.id, songs);
    return songs;
}

function shelfSkeletonHTML() {
    return Array.from({ length: SHELF_SKELETONS }, () => `<div class="tile skeleton"></div>`).join("");
}

function buildHomeSkeleton() {
    if (shelfObserver) shelfObserver.disconnect();
    homeStatus.hidden = true;
    homeSections.innerHTML = "";

    const sections = HOME_SHELVES.map(shelf => {
        const section = document.createElement("section");
        section.className = "shelf";
        section.dataset.shelf = shelf.id;
        section.dataset.state = "idle";
        section.innerHTML = `
            <div class="shelf-head">
                <h2>${escapeHTML(shelf.title)}</h2>
                <div class="shelf-nav">
                    <button type="button" class="shelf-arrow" data-dir="-1" aria-label="Scroll left">${SVG_ICONS.chevronLeft}</button>
                    <button type="button" class="shelf-arrow" data-dir="1" aria-label="Scroll right">${SVG_ICONS.chevronRight}</button>
                </div>
            </div>
            <div class="shelf-row">${shelfSkeletonHTML()}</div>
        `;
        homeSections.appendChild(section);
        return section;
    });

    if ("IntersectionObserver" in window) {
        shelfObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                shelfObserver.unobserve(entry.target);
                loadShelfSection(entry.target);
            });
        }, { rootMargin: "300px 0px" });
        sections.forEach(section => shelfObserver.observe(section));
    } else {
        sections.forEach(section => loadShelfSection(section));
    }
}

homeSections.addEventListener("click", event => {
    const arrow = event.target.closest(".shelf-arrow");
    if (!arrow) return;
    const row = arrow.closest(".shelf").querySelector(".shelf-row");
    row.scrollBy({ left: Number(arrow.dataset.dir) * row.clientWidth * 0.85, behavior: "smooth" });
});

function renderShelfTracks(section, tracks) {
    const row = section.querySelector(".shelf-row");
    row.innerHTML = "";
    tracks.forEach(track => {
        row.appendChild(createTile(track, () => playFromList(tracks, track)));
    });
}

function updateHomeStatus() {
    const anyDone = homeSections.querySelector('[data-state="done"]');
    const anyBusy = homeSections.querySelector('[data-state="loading"]');
    homeStatus.hidden = !!(anyDone || anyBusy);
}

async function loadShelfSection(section) {
    const shelf = HOME_SHELVES.find(s => s.id === section.dataset.shelf);
    const state = section.dataset.state;
    if (!shelf || state === "loading" || state === "done") return;

    section.dataset.state = "loading";
    try {
        const tracks = await getShelfTracks(shelf);
        renderShelfTracks(section, tracks);
        section.dataset.state = "done";
    } catch (e) {
        console.warn(`Shelf "${shelf.title}" failed:`, e.message);
        section.dataset.state = "failed";
        section.hidden = true;
    }
    updateHomeStatus();
}

function showHome() {
    searchToken++;
    searchInput.value = "";
    resultsList.hidden = true;
    homeView.hidden = false;
    window.scrollTo({ top: 0 });
}

/* ------------------------------------------------------------------ */
/*  Search                                                             */
/* ------------------------------------------------------------------ */

function showMessage(html) {
    tileEls.clear();
    currentSearchResults = [];
    resultsList.innerHTML = `<div class="grid-message">${html}</div>`;
}

async function search() {
    const query = searchInput.value.trim();
    if (!query) {
        showHome();
        return;
    }

    const myToken = ++searchToken;
    homeView.hidden = true;
    resultsList.hidden = false;
    showMessage(`${SVG_ICONS.spinner} Searching...`);

    // Both lookups start together, but the songs don't wait on Invidious.
    // (searchSongsMeta catches its own errors, so it always resolves.)
    let videoError = null;
    const songsPromise = searchSongsMeta(query, 25);
    const videosPromise = searchVideosCached(query).catch(e => {
        videoError = e;
        return [];
    });

    const songs = await songsPromise;
    if (myToken !== searchToken) return;

    if (songs.length > 0) {
        renderSearchResults(songs.map(song => ({ ...song, videos: [] })));
    }

    const videos = await videosPromise;
    if (myToken !== searchToken) return;

    if (songs.length === 0) {
        if (videos.length === 0) {
            if (videoError) {
                console.error("Search failed:", videoError);
                showMessage(`${SVG_ICONS.warning} Search error: Unable to connect to streaming network.`);
            } else {
                showMessage("No results found.");
            }
            return;
        }
        renderSearchResults(buildSearchTracks(videos, [], query));
    } else if (videos.length > 0) {
        appendSearchTracks(attachVideosToTracks(currentSearchResults, videos));
    }

    enrichRawTracks(currentSearchResults, myToken);
}

function renderSearchResults(tracks) {
    tileEls.clear();
    currentSearchResults = tracks;
    resultsList.innerHTML = "";
    appendTiles(tracks);
}

function appendTiles(tracks) {
    tracks.forEach(track => {
        const tile = createTile(track, () => playFromList(currentSearchResults, track));
        tileEls.set(track, tile);
        resultsList.appendChild(tile);
    });
}

// Adds to the list that's already on screen (same array, so prev/next keep working)
function appendSearchTracks(extra) {
    if (extra.length === 0) return;
    currentSearchResults.push(...extra);
    appendTiles(extra);
}

// Attach each video to the song it matches; anything left over becomes its own raw tile
function attachVideosToTracks(tracks, videos) {
    const extras = [];
    for (const video of videos) {
        let best = null;
        let bestScore = -Infinity;
        for (const track of tracks) {
            if (track.source === "youtube") continue;
            const m = matchVideoToSong(video, track);
            if (m.confident && m.score > bestScore) {
                best = track;
                bestScore = m.score;
            }
        }
        if (best) addVideo(best, video);
        else extras.push(rawTrackFromVideo(video));
    }
    return extras;
}

async function enrichRawTracks(tracks, myToken) {
    const candidates = tracks
        .filter(t => t.source === "youtube" && (!t.duration || (t.duration >= 60 && t.duration <= 900)))
        .slice(0, MAX_ENRICH_LOOKUPS);

    await Promise.all(candidates.map(raw => enrichLimiter(async () => {
        // Queued by a search the user has already left: skip the network call
        if (myToken !== searchToken || currentSearchResults !== tracks) return;

        const video = raw.videos[0];
        if (!video) return;
        const { artist, title } = guessArtistTitle(video);
        if (!title) return;

        let songs = [];
        try {
            songs = await searchSongsMeta(`${artist} ${title}`.trim(), 5);
        } catch (e) {
            return;
        }
        if (myToken !== searchToken || currentSearchResults !== tracks) return;

        let best = null;
        let bestScore = -Infinity;
        for (const song of songs) {
            const m = matchVideoToSong(video, song);
            if (m.confident && m.score > bestScore) {
                best = song;
                bestScore = m.score;
            }
        }
        if (best) upgradeRawTrack(raw, best);
    })));
}

function upgradeRawTrack(raw, song) {
    const list = currentSearchResults;
    const tile = tileEls.get(raw);
    const existing = list.find(t => t !== raw && t.key === song.key);

    if (existing && raw !== currentTrackInfo) {
        raw.videos.forEach(v => addVideo(existing, v));
        const index = list.indexOf(raw);
        if (index !== -1) list.splice(index, 1);
        if (tile) tile.remove();
        tileEls.delete(raw);
        return;
    }

    const videos = raw.videos;
    Object.assign(raw, song, { videos, videoId: null });
    if (tile) fillTile(tile, raw);
}

/* ------------------------------------------------------------------ */
/*  Audio playback                                                     */
/* ------------------------------------------------------------------ */

function attemptToPlay(audio, timeoutMs = 12000) {
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

async function getAudioFormats(videoId) {
    const data = await fetchInvidiousJSON(`/api/v1/videos/${encodeURIComponent(videoId)}`, 8000, 25000);

    const adaptive = (data && data.adaptiveFormats) || [];
    if (adaptive.length === 0) throw new Error("No adaptiveFormats found in the response.");

    let audioFormats = adaptive.filter(f => {
        const type = f.type || f.mimeType || "";
        return type.includes("audio") && f.url;
    });
    if (audioFormats.length === 0) throw new Error("No audio formats found for this video.");

    const playable = audioFormats.filter(f => {
        const type = f.type || f.mimeType || "";
        return audioPlayer.canPlayType(type) !== "";
    });
    if (playable.length > 0) audioFormats = playable;

    audioFormats.sort((a, b) => (Number(b.bitrate) || 0) - (Number(a.bitrate) || 0));

    return audioFormats.map(f => {
        const type = f.type || f.mimeType || "";
        return { url: f.url, mime: type.split(";")[0].trim(), bitrate: Number(f.bitrate) || 0 };
    });
}

async function tryPlayVideo(videoId, myToken) {
    const cachedUrl = await getCachedAudioObjectURL(videoId);
    if (myToken !== playRequestToken) return "stale";
    if (cachedUrl) {
        try {
            audioPlayer.src = cachedUrl;
            audioPlayer.volume = volumeBar.value;
            await attemptToPlay(audioPlayer);
            return myToken === playRequestToken ? "ok" : "stale";
        } catch (e) {}
    }

    let formats = [];
    try {
        formats = await getAudioFormats(videoId);
    } catch (e) {
        console.warn(`Could not get audio formats for ${videoId}:`, e.message);
    }
    if (myToken !== playRequestToken) return "stale";
    if (formats.length === 0) return "fail";

    for (const fmt of formats.slice(0, 3)) {
        if (myToken !== playRequestToken) return "stale";
        try {
            audioPlayer.src = fmt.url;
            audioPlayer.volume = volumeBar.value;
            await attemptToPlay(audioPlayer, 9000);
            if (myToken !== playRequestToken) return "stale";

            fetchWithTimeout(fmt.url, 15000)
                .then(r => (r.ok ? r.blob() : null))
                .then(blob => {
                    if (blob && blob.size > 0) cacheAudioBlob(videoId, blob);
                })
                .catch(() => {});

            return "ok";
        } catch (err) {}
    }

    for (const fmt of formats.slice(0, 2)) {
        if (myToken !== playRequestToken) return "stale";
        try {
            const blob = await fetchBlobViaWisp(fmt.url, fmt.mime);
            if (myToken !== playRequestToken) return "stale";

            const objectUrl = await cacheAudioBlob(videoId, blob);
            audioPlayer.src = objectUrl;
            audioPlayer.volume = volumeBar.value;
            await attemptToPlay(audioPlayer, 10000);
            return myToken === playRequestToken ? "ok" : "stale";
        } catch (err) {
            console.warn("Wisp audio fallback failed:", err);
        }
    }

    return "fail";
}

function showTrackInDock(track, loading) {
    nowPlayingTitle.innerHTML = loading
        ? `${SVG_ICONS.spinner} ${escapeHTML(track.title)}`
        : escapeHTML(track.title);
    nowPlayingArtist.textContent = track.artist || "";
    setImage(nowPlayingCover, trackCoverUrls(track));
}

function setLoadingHint(track, hint) {
    if (track !== currentTrackInfo) return;
    nowPlayingArtist.textContent = `${track.artist || ""}${hint ? " • " + hint : ""}`;
}

function onPlaybackStarted(track, videoId) {
    if (track.source !== "youtube") {
        track.videoId = videoId;
        rememberWorkingVideo(track.key, videoId);
    }
    showTrackInDock(track, false);
    updatePlayButton();
    updateNavButtons();
    renderSidebarTracks();
    updatePiPCanvas(track);
    updateMediaSessionMetadata(track);
}

async function resolveAndPlay(track, myToken) {
    const tried = new Set();
    let attempts = 0;

    const attempt = async (videoId) => {
        if (!videoId || tried.has(videoId)) return "fail";
        tried.add(videoId);
        attempts++;
        if (attempts > 1) setLoadingHint(track, `trying source ${attempts}`);

        const result = await tryPlayVideo(videoId, myToken);
        if (result === "ok") onPlaybackStarted(track, videoId);
        return result;
    };

    const attemptAll = async (videos) => {
        for (const video of videos) {
            if (tried.size >= MAX_VIDEOS_TRIED) break;
            const result = await attempt(video.videoId || video);
            if (result !== "fail") return result;
        }
        return "fail";
    };

    if (track.source === "youtube") {
        return attempt(track.videoId);
    }

    const remembered = workingVideos[track.key];
    for (const id of [remembered, track.videoId]) {
        const result = await attempt(id);
        if (result !== "fail") return result;
        if (id && id === remembered) forgetWorkingVideo(track.key);
    }

    const initial = rankVideos(track.videos || [], track);
    let result = await attemptAll(initial.good);
    if (result !== "fail") return result;

    const leftovers = [...initial.poor];
    for (const query of buildSongQueries(track)) {
        if (tried.size >= MAX_VIDEOS_TRIED) break;
        setLoadingHint(track, "searching for a source");

        let found = [];
        try {
            found = await searchVideosCached(query);
        } catch (e) {
            console.warn("Source search failed:", e.message);
        }
        if (myToken !== playRequestToken) return "stale";

        const ranked = rankVideos(found, track);
        result = await attemptAll(ranked.good);
        if (result !== "fail") return result;
        leftovers.push(...ranked.poor);
    }

    result = await attemptAll(leftovers.slice(0, 3));
    return result;
}

async function playTrack(track) {
    const myToken = ++playRequestToken;
    currentTrackInfo = track;

    audioPlayer.pause();
    audioDock.classList.add("visible");
    showTrackInDock(track, true);
    updateNavButtons();
    renderSidebarTracks();

    const result = await resolveAndPlay(track, myToken);
    if (myToken !== playRequestToken || result === "stale") return;

    if (result !== "ok") {
        nowPlayingTitle.textContent = "Error: Cannot load audio stream.";
        nowPlayingArtist.textContent = `${track.title} • ${track.artist || ""}`;
        updateNavButtons();
    }
}

/* ------------------------------------------------------------------ */
/*  Playlists                                                          */
/* ------------------------------------------------------------------ */

function updatePlaylistDropdowns() {
    const playlistNames = Object.keys(playlists);
    const options = playlistNames.map(name => `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join("");
    sidebarPlaylistSelect.innerHTML = options;
    modalPlaylistSelect.innerHTML = options;
    if (!playlistNames.includes(sidebarPlaylistSelect.value) && playlistNames.length > 0) {
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

    if (targetPlaylist && playlists[targetPlaylist] && currentTrackInfo) {
        const entry = serializeTrack(currentTrackInfo);
        if (!entry.videoId) entry.videoId = workingVideos[currentTrackInfo.key] || null;
        playlists[targetPlaylist].push(normalizeTrack({ ...entry, videos: [] }));
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
            <div class="track-artist">${escapeHTML(track.artist || "")}</div>
            <div class="track-controls">
                <button type="button" class="track-play" title="Play">${SVG_ICONS.play}</button>
                <button type="button" class="track-remove" title="Remove">${SVG_ICONS.trash}</button>
            </div>
        `;

        li.querySelector(".track-play").addEventListener("click", () => window.playFromPlaylist(selectedPlaylist, index));
        li.querySelector(".track-remove").addEventListener("click", () => window.removeTrack(selectedPlaylist, index));

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

window.playFromPlaylist = function (playlistName, index) {
    activePlayingPlaylist = playlistName;
    activePlayingIndex = index;
    activeList = null;
    playTrack(playlists[playlistName][index]);
};

window.removeTrack = function (playlistName, index) {
    playlists[playlistName].splice(index, 1);
    if (activePlayingPlaylist === playlistName) {
        if (activePlayingIndex === index) activePlayingIndex = -1;
        else if (activePlayingIndex > index) activePlayingIndex--;
    }
    savePlaylists();
    renderSidebarTracks();
    updateNavButtons();
};

/* ------------------------------------------------------------------ */
/*  Player controls                                                    */
/* ------------------------------------------------------------------ */

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
    playRequestToken++;
    audioPlayer.pause();
    audioPlayer.removeAttribute("src");
    audioPlayer.load();
    audioDock.classList.remove("visible");
    activePlayingPlaylist = null;
    activePlayingIndex = -1;
    activeList = null;
    currentTrackInfo = null;
    renderSidebarTracks();
    updateNavButtons();
    updatePiPCanvas(null);
});

audioPlayer.addEventListener("play", () => {
    updatePlayButton();
    pipVideo.play().catch(() => {});
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
    updatePositionState();
});

audioPlayer.addEventListener("pause", () => {
    updatePlayButton();
    pipVideo.pause();
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
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

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[character]));
}

/* ------------------------------------------------------------------ */
/*  Start                                                              */
/* ------------------------------------------------------------------ */

initPlaylists();
updateNavButtons();
buildHomeSkeleton();
