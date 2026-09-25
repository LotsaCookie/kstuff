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

const MUSIC_API_BASES = [
    "https://southpadreislandkiteboarding.com",
    "https://kristenblackburnvolleyballcamps.com"
];
const STREAM_SEARCH_LIMIT = 60;
const STREAM_MATCH_LIMIT = 15;
const STREAM_MAX_TRIES = 4;

const CHERRION_API_BASES = ["https://cherrion.top"];
const CHERRION_SEARCH_LIMIT = 60;
const CHERRION_MATCH_LIMIT = 15;

async function fetchFromMirrors(bases, pathBuilder) {
    let lastErr = null;
    for (const base of bases) {
        try {
            return await fetchMusicApiJSON(pathBuilder(base));
        } catch (e) {
            lastErr = e;
        }
    }
    throw lastErr || new Error("All mirrors failed");
}

function richStreamUrl(base, meta) {
    const params = new URLSearchParams();
    params.set("id", meta.id);
    params.set("quality", "HIGH");
    if (meta.isrc) params.set("isrc", meta.isrc);
    params.set("source", meta.providerSource || "qobuz");
    if (meta.artist) params.set("artist", meta.artist);
    params.set("title", meta.title || "");
    if (meta.duration) params.set("duration", Math.round(meta.duration));
    return `${base}/api/music/stream?${params.toString()}`;
}

function richMetaFrom(obj) {
    return {
        id: obj.id,
        isrc: obj.isrc || null,
        providerSource: obj.providerSource || "qobuz",
        artist: obj.artist,
        title: obj.title,
        duration: obj.duration
    };
}

const INVIDIOUS_BASE = "https://invidious.f5.si";

const WISP_URLS = [
    "wss://athollcottage.com/connection/",
    "wss://girlspreples.org/wi/",
    "wss://wisp.mercurywork.shop/"
];
const EPOXY_MODULE_URL = "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-tls/+esm";

const DEEZER_API = "https://api.deezer.com";
const APPLE_CHARTS_API = "https://rss.applemarketingtools.com/api/v2/us/music/most-played";
const ITUNES_SEARCH_API = "https://itunes.apple.com/search";

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
const SHELF_CACHE_KEY = "shelfCacheV3";
const SHELF_TTL_MS = 30 * 60 * 1000;

const MAX_VIDEOS_TRIED = 10;

const DEFAULT_ART_DATA_URI = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#2a1c22"/><circle cx="100" cy="78" r="32" fill="#57323f"/><rect x="42" y="128" width="116" height="42" rx="10" fill="#57323f"/></svg>`
);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, label = "request") {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
        Promise.resolve(promise).then(
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

let epoxyClientPromise = null;
let epoxyClientInstance = null;
let epoxyClientGeneration = 0;

const WISP_FAIL_LIMIT = 2;
const BLOCKED_STATUSES = new Set([403, 429, 503]);
const wispFails = WISP_URLS.map(() => 0);
let wispIndex = 0;
const failedClients = new WeakSet();
const clientServer = new WeakMap();

function nextWispIndex(startFrom) {
    return ((startFrom % WISP_URLS.length) + WISP_URLS.length) % WISP_URLS.length;
}

function penalizeWisp(client, hard) {
    let idx = wispIndex;
    if (client) {
        if (clientServer.has(client)) idx = clientServer.get(client);
        if (failedClients.has(client)) return;
        failedClients.add(client);
    }
    wispFails[idx]++;
    if (hard || wispFails[idx] >= WISP_FAIL_LIMIT) {
        wispFails[idx] = 0;
        if (idx === wispIndex) {
            wispIndex = nextWispIndex(idx + 1);
        }
    }
}

function disposeEpoxyClient(client) {
    if (!client) return;
    setTimeout(() => {
        try { client.free && client.free(); } catch (e) {}
    }, 30000);
}

function resetEpoxyClient(failedClient) {
    if (failedClient && epoxyClientInstance && failedClient !== epoxyClientInstance) return;
    const old = epoxyClientInstance;
    epoxyClientPromise = null;
    epoxyClientInstance = null;
    epoxyClientGeneration++;
    disposeEpoxyClient(old);
}

let epoxyBindingsPromise = null;

function getEpoxyBindings() {
    if (!epoxyBindingsPromise) {
        epoxyBindingsPromise = (async () => {
            const mod = await import(EPOXY_MODULE_URL);
            if (typeof mod.default === "function") {
                await mod.default();
            }
            if (!mod.EpoxyClient || !mod.EpoxyClientOptions) throw new Error("Epoxy bindings unavailable from module");
            return mod;
        })().catch(err => {
            epoxyBindingsPromise = null;
            throw err;
        });
    }
    return epoxyBindingsPromise;
}

async function createEpoxyClient(serverIndex) {
    const { EpoxyClient, EpoxyClientOptions } = await getEpoxyBindings();
    const options = new EpoxyClientOptions();
    options.user_agent = navigator.userAgent;
    const client = await new EpoxyClient(WISP_URLS[serverIndex], options);
    try { clientServer.set(client, serverIndex); } catch (e) {}
    return client;
}

function getEpoxyClient() {
    if (epoxyClientPromise) return epoxyClientPromise;
    const serverIndex = nextWispIndex(wispIndex);
    wispIndex = serverIndex;
    const myGeneration = ++epoxyClientGeneration;
    const promise = createEpoxyClient(serverIndex).then(client => {
        if (epoxyClientGeneration === myGeneration) {
            epoxyClientInstance = client;
        } else {
            disposeEpoxyClient(client);
        }
        return client;
    });
    epoxyClientPromise = promise;
    promise.catch(() => {
        if (epoxyClientPromise === promise) epoxyClientPromise = null;
        penalizeWisp(null, true);
    });
    return promise;
}

function isConnectionError(err) {
    const msg = (err && err.message ? err.message : String(err || "")).toLowerCase();
    return msg.includes("websocket")
        || msg.includes("closed")
        || msg.includes("network")
        || msg.includes("failed to fetch")
        || msg.includes("not ready")
        || msg.includes("wisp server")
        || msg.includes("setup")
        || msg.includes("reset")
        || msg.includes("panic")
        || msg.includes("unreachable")
        || msg.includes("recursive use")
        || msg.includes("null pointer")
        || msg.includes("wasm");
}

async function readWispBody(response, idleMs = 20000) {
    const status = response.status;
    const type = (response.headers && response.headers.get("content-type")) || "";
    const noBody = status === 204 || status === 205 || status === 304;
    let blob = null;

    if (!noBody) {
        const stream = response.body;
        if (stream && typeof stream.getReader === "function") {
            const reader = stream.getReader();
            const chunks = [];
            try {
                for (;;) {
                    const { done, value } = await withTimeout(reader.read(), idleMs, "Wisp body");
                    if (done) break;
                    if (value) chunks.push(value);
                }
            } catch (err) {
                Promise.resolve(reader.cancel()).catch(() => {});
                throw err;
            }
            blob = new Blob(chunks, { type });
        } else {
            blob = await withTimeout(response.blob(), idleMs * 2, "Wisp body");
        }
    }

    return new Response(noBody ? null : blob, {
        status,
        statusText: response.statusText || "",
        headers: type ? { "content-type": type } : {}
    });
}

async function wispFetch(url, timeoutMs = 15000, critical = true) {
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
        let client = null;
        try {
            client = await withTimeout(getEpoxyClient(), 10000, "Wisp setup");
            const raw = await withTimeout(client.fetch(url), timeoutMs, "Wisp fetch");
            const result = await readWispBody(raw, timeoutMs > 30000 ? 45000 : 20000);

            if (critical && attempt === 0 && WISP_URLS.length > 1 && BLOCKED_STATUSES.has(result.status)) {
                penalizeWisp(client, true);
                resetEpoxyClient(client);
                continue;
            }

            if (client && clientServer.has(client)) wispFails[clientServer.get(client)] = 0;
            return result;
        } catch (err) {
            lastErr = err;
            const errMsg = (err && err.message ? err.message : String(err || "")).toLowerCase();
            const softTimeout = errMsg.includes("timed out") && timeoutMs <= 30000;
            if (!(isConnectionError(err) || softTimeout) || !critical) throw err;
            penalizeWisp(client, isConnectionError(err));
            resetEpoxyClient(client);
            await sleep(150);
        }
    }
    throw lastErr || new Error("Wisp fetch failed");
}

getEpoxyClient().catch(() => {});

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
const musicApiLimiter = createLimiter(4);
const imageLimiter = createLimiter(3);
const cacheDownloadLimiter = createLimiter(2);

async function fetchInvidiousJSON(path, proxyTimeout = 20000, directTimeout = 8000) {
    const url = `${INVIDIOUS_BASE}${path}`;

    try {
        const response = await wispFetch(url, proxyTimeout);
        if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
        return await response.json();
    } catch (proxyError) {
        console.warn("Wisp fetch failed, trying direct:", proxyError && proxyError.message ? proxyError.message : proxyError);
    }

    const response = await fetchWithTimeout(url, directTimeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

async function fetchBlobViaWisp(url, mime, timeoutMs = 60000, critical = true) {
    const response = await wispFetch(url, timeoutMs, critical);
    if (!response.ok) {
        let bodyText = "";
        try { bodyText = (await response.text()).slice(0, 200); } catch (e) {}
        throw new Error(`Proxy HTTP ${response.status} ${response.statusText || ""} ${bodyText}`.trim());
    }
    const blob = await response.blob();
    if (!blob || blob.size === 0) throw new Error("Empty audio blob");
    return new Blob([blob], { type: mime || blob.type || "audio/mp4" });
}

async function fetchExternalOnce(url, wispMs = 10000, directMs = 6000) {
    try {
        const response = await wispFetch(url, wispMs);
        if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
        return await response.json();
    } catch (proxyError) {
        console.warn("Wisp API fetch failed, trying a direct request:", proxyError && proxyError.message ? proxyError.message : proxyError);
    }

    const response = await fetchWithTimeout(url, directMs);
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

function fetchMusicApiJSON(url) {
    return musicApiLimiter(async () => {
        const data = await fetchExternalOnce(url, 8000, 5000);
        if (data && data.error) {
            throw new Error(`API error: ${JSON.stringify(data.error).slice(0, 120)}`);
        }
        return data;
    });
}

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

function makeSong({ source, id, title, titleShort, artist, cover, duration, streamId, isrc, providerSource }) {
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
        streamId: streamId || null,
        isrc: isrc || null,
        providerSource: providerSource || null,
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
        streamId: null,
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
    if (!info.title.length) {
        return { score: 0, confident: false, titleCov: 0, artistCov: 0, mismatch: false };
    }

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

    return { score, confident, titleCov, artistCov, mismatch };
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

function streamSongAsVideo(song) {
    return { title: song.title, author: song.artist, lengthSeconds: song.duration };
}

function rankStreamSongs(songs, target) {
    const good = [];
    const loose = [];
    const seen = new Set();
    for (const song of songs) {
        if (!song || !song.streamId || seen.has(song.streamId)) continue;
        seen.add(song.streamId);
        const m = matchVideoToSong(streamSongAsVideo(song), target);
        if (m.confident) {
            good.push({ song, score: m.score });
        } else if (!m.mismatch && m.titleCov >= 0.6 && m.artistCov >= 0.3) {
            loose.push({ song, score: m.score });
        }
    }
    const byScore = (a, b) => b.score - a.score;
    good.sort(byScore);
    loose.sort(byScore);
    return { good: good.map(x => x.song), loose: loose.map(x => x.song) };
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

function buildStreamQueries(song) {
    const title = stripFeat(song.titleShort || song.title);
    const artist = song.artist && song.artist !== "Unknown artist" ? song.artist : "";
    const queries = [
        `${artist} ${title}`,
        title
    ].map(q => q.replace(/\s+/g, " ").trim()).filter(Boolean);
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
        videoId: t.videoId || null,
        streamId: t.streamId || null,
        isrc: t.isrc || null,
        providerSource: t.providerSource || null
    };
}

function songFromStreamItem(item) {
    if (!item || item.id === undefined || item.id === null || item.id === "" || !item.title) return null;
    return makeSong({
        source: "ripple",
        id: item.id,
        title: item.title,
        artist: item.artist,
        cover: item.artwork || "",
        duration: item.duration,
        streamId: String(item.id),
        isrc: item.isrc || null,
        providerSource: item.source || "qobuz"
    });
}

const streamSearchCache = new Map();

async function searchStreamApi(query, limit = STREAM_SEARCH_LIMIT) {
    const cacheKey = `${limit}|${query.toLowerCase()}`;
    if (streamSearchCache.has(cacheKey)) return streamSearchCache.get(cacheKey);

    const data = await fetchFromMirrors(MUSIC_API_BASES, base => `${base}/api/music/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    const items = Array.isArray(data && data.items) ? data.items : [];
    const songs = dedupeSongs(items.map(songFromStreamItem).filter(Boolean));

    if (streamSearchCache.size > 100) streamSearchCache.clear();
    streamSearchCache.set(cacheKey, songs);
    return songs;
}

function songFromCherrionItem(item) {
    if (!item || item.id === undefined || item.id === null || item.id === "" || !item.title) return null;
    return makeSong({
        source: "cherrion",
        id: item.id,
        title: item.title,
        artist: item.artist,
        cover: item.artwork || "",
        duration: item.duration,
        streamId: String(item.id),
        isrc: item.isrc || null,
        providerSource: item.source || "qobuz"
    });
}

const cherrionSearchCache = new Map();

async function searchCherrionApi(query, limit = CHERRION_SEARCH_LIMIT) {
    const cacheKey = `${limit}|${query.toLowerCase()}`;
    if (cherrionSearchCache.has(cacheKey)) return cherrionSearchCache.get(cacheKey);

    const data = await fetchFromMirrors(CHERRION_API_BASES, base => `${base}/api/music/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    const items = Array.isArray(data && data.items) ? data.items : [];
    const songs = dedupeSongs(items.map(songFromCherrionItem).filter(Boolean));

    if (cherrionSearchCache.size > 100) cherrionSearchCache.clear();
    cherrionSearchCache.set(cacheKey, songs);
    return songs;
}

function cherrionStreamUrlFor(meta) {
    return richStreamUrl(CHERRION_API_BASES[0], meta);
}

function cherrionMetaFrom(obj) {
    return {
        id: obj.id,
        isrc: obj.isrc || null,
        providerSource: obj.providerSource || "qobuz",
        artist: obj.artist,
        title: obj.title,
        duration: obj.duration
    };
}

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
        .replace(/\/\d+x\d+-/, `/${px}x${px}-`)
        .replace(/\/\d+x\d+(bb)?\./, `/${px}x${px}bb.`);
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

async function fetchDeezerChart(genreId) {
    const data = await fetchExternalJSON(`${DEEZER_API}/chart/${genreId}/tracks?limit=${SHELF_SIZE}`);
    return dedupeSongs(((data && data.data) || []).map(songFromDeezer).filter(Boolean));
}

async function fetchDeezerChartAlt(genreId) {
    const data = await fetchExternalJSON(`${DEEZER_API}/chart/${genreId}`);
    const tracks = (data && data.tracks && data.tracks.data) || [];
    return dedupeSongs(tracks.map(songFromDeezer).filter(Boolean));
}

async function fetchAppleTrending() {
    const data = await fetchExternalJSON(`${APPLE_CHARTS_API}/${SHELF_SIZE}/songs.json`);
    const results = (data && data.feed && data.feed.results) || [];
    return dedupeSongs(results.map(songFromItunes).filter(Boolean));
}

async function fetchItunesSearchChart(term) {
    const data = await fetchExternalJSON(`${ITUNES_SEARCH_API}?media=music&entity=song&limit=${SHELF_SIZE}&term=${encodeURIComponent(term)}`);
    const results = (data && data.results) || [];
    return dedupeSongs(results.map(songFromItunes).filter(Boolean));
}

const videoSearchCache = new Map();

async function searchVideosCached(query) {
    if (videoSearchCache.has(query)) return videoSearchCache.get(query);
    const data = await fetchInvidiousJSON(`/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
    const videos = (Array.isArray(data) ? data : []).filter(v => v && v.videoId && !v.liveNow);
    if (videoSearchCache.size > 80) videoSearchCache.clear();
    videoSearchCache.set(query, videos);
    return videos;
}

function normalizeTrack(t) {
    if (!t) return t;
    if (!t.artist && t.author) t.artist = t.author;
    if (!t.source) t.source = "youtube";
    if (!t.key) t.key = `yt:${t.videoId}`;
    if (!t.titleShort) t.titleShort = t.title;
    if (!t.cover && t.videoId) t.cover = ytThumbUrls(t.videoId)[0];
    if (!t.streamId && t.source === "ripple") t.streamId = String(t.id);
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

let workingStreams = {};
try {
    workingStreams = JSON.parse(localStorage.getItem("songStreamMap")) || {};
} catch (e) {
    workingStreams = {};
}

function rememberWorkingStream(key, streamId) {
    delete workingStreams[key];
    workingStreams[key] = streamId;
    const keys = Object.keys(workingStreams);
    if (keys.length > 800) keys.slice(0, keys.length - 800).forEach(k => delete workingStreams[k]);
    try { localStorage.setItem("songStreamMap", JSON.stringify(workingStreams)); } catch (e) {}
}

function forgetWorkingStream(key) {
    if (!(key in workingStreams)) return;
    delete workingStreams[key];
    try { localStorage.setItem("songStreamMap", JSON.stringify(workingStreams)); } catch (e) {}
}

let workingCherrion = {};
try {
    workingCherrion = JSON.parse(localStorage.getItem("songCherrionMap")) || {};
} catch (e) {
    workingCherrion = {};
}

function rememberWorkingCherrion(key, meta) {
    delete workingCherrion[key];
    workingCherrion[key] = meta;
    const keys = Object.keys(workingCherrion);
    if (keys.length > 800) keys.slice(0, keys.length - 800).forEach(k => delete workingCherrion[k]);
    try { localStorage.setItem("songCherrionMap", JSON.stringify(workingCherrion)); } catch (e) {}
}

function forgetWorkingCherrion(key) {
    if (!(key in workingCherrion)) return;
    delete workingCherrion[key];
    try { localStorage.setItem("songCherrionMap", JSON.stringify(workingCherrion)); } catch (e) {}
}

let activePlayingPlaylist = null;
let activePlayingIndex = -1;
let activeList = null;

let currentSearchResults = [];
let searchToken = 0;

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

function idbDelete(storeName, key) {
    return cacheDBPromise.then(db => {
        if (!db) return;
        return new Promise(resolve => {
            try {
                const tx = db.transaction(storeName, "readwrite");
                tx.objectStore(storeName).delete(key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            } catch (e) {
                resolve();
            }
        });
    });
}

function trackDiskCacheOrder(storageKey, cacheKey, maxEntries, storeName) {
    let order = [];
    try { order = JSON.parse(localStorage.getItem(storageKey)) || []; } catch (e) {}
    order = order.filter(k => k !== cacheKey);
    order.push(cacheKey);
    while (order.length > maxEntries) {
        const evictKey = order.shift();
        idbDelete(storeName, evictKey);
    }
    try { localStorage.setItem(storageKey, JSON.stringify(order)); } catch (e) {}
}

const AUDIO_DISK_CACHE_MAX = 20;
const THUMB_DISK_CACHE_MAX = 300;

function createObjectUrlCache(maxEntries) {
    const map = new Map();
    return {
        get(key) {
            if (!map.has(key)) return undefined;
            const url = map.get(key);
            map.delete(key);
            map.set(key, url);
            return url;
        },
        has(key) {
            return map.has(key);
        },
        set(key, url) {
            if (map.has(key)) map.delete(key);
            map.set(key, url);
            while (map.size > maxEntries) {
                const oldestKey = map.keys().next().value;
                const oldestUrl = map.get(oldestKey);
                map.delete(oldestKey);
                try { URL.revokeObjectURL(oldestUrl); } catch (e) {}
            }
        }
    };
}

const audioObjectUrlCache = createObjectUrlCache(6);
const thumbObjectUrlCache = createObjectUrlCache(220);
const thumbInflight = new Map();

async function getCachedAudioObjectURL(cacheKey) {
    const known = audioObjectUrlCache.get(cacheKey);
    if (known) return known;
    const blob = await idbGet(AUDIO_STORE, cacheKey);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    audioObjectUrlCache.set(cacheKey, url);
    return url;
}

async function cacheAudioBlob(cacheKey, blob) {
    try {
        await idbSet(AUDIO_STORE, cacheKey, blob);
        trackDiskCacheOrder("audioCacheOrder", cacheKey, AUDIO_DISK_CACHE_MAX, AUDIO_STORE);
    } catch (e) {}
    const url = URL.createObjectURL(blob);
    audioObjectUrlCache.set(cacheKey, url);
    return url;
}

async function fetchImageBlobViaWisp(url) {
    return imageLimiter(async () => {
        let lastErr = null;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await wispFetch(url, 15000, false);
                if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);
                const blob = await withTimeout(response.blob(), 15000, "Wisp image body");
                if (!blob || blob.size === 0) throw new Error("Empty image");
                if (blob.type && blob.type.startsWith("text/")) throw new Error("Not an image");
                return blob;
            } catch (e) {
                lastErr = e;
                await sleep(200);
            }
        }
        throw lastErr;
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
            trackDiskCacheOrder("thumbCacheOrder", url, THUMB_DISK_CACHE_MAX, THUMB_STORE);
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

const artworkLookupCache = new Map();

function lookupArtworkUrl(track) {
    const cacheKey = `${track.artist || ""}|${track.titleShort || track.title || ""}`.toLowerCase();
    if (artworkLookupCache.has(cacheKey)) return artworkLookupCache.get(cacheKey);

    const job = (async () => {
        const term = `${track.artist || ""} ${stripFeat(track.titleShort || track.title || "")}`.trim();
        if (!term) return null;
        try {
            const data = await fetchExternalJSON(`${ITUNES_SEARCH_API}?media=music&entity=song&limit=1&term=${encodeURIComponent(term)}`);
            const hit = data && data.results && data.results[0];
            return hit ? hiResArtwork(hit.artworkUrl100) : null;
        } catch (e) {
            return null;
        }
    })();

    if (artworkLookupCache.size > 200) artworkLookupCache.clear();
    artworkLookupCache.set(cacheKey, job);
    return job;
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

function setImage(img, urls, lazy = false, track = null) {
    const list = urls.filter(Boolean);
    const token = (img._imgToken = (img._imgToken || 0) + 1);

    if (imageObserver) imageObserver.unobserve(img);
    img._startLoad = null;
    img.classList.remove("no-art");

    const ready = list.length && thumbObjectUrlCache.get(list[0]);
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
        if (track) {
            try {
                const fallbackUrl = await lookupArtworkUrl(track);
                if (img._imgToken !== token) return;
                if (fallbackUrl) {
                    const objectUrl = await getImageBlobURL(fallbackUrl);
                    if (img._imgToken !== token) return;
                    await decodeInto(img, objectUrl);
                    return;
                }
            } catch (e) {}
        }
        if (img._imgToken === token) {
            img.classList.add("no-art");
            img.src = DEFAULT_ART_DATA_URI;
        }
    };

    if (lazy && "IntersectionObserver" in window) {
        img._startLoad = load;
        getImageObserver().observe(img);
    } else {
        load();
    }
}

function setImageDirect(img, urls, track = null) {
    const list = urls.filter(Boolean);
    const token = (img._imgToken = (img._imgToken || 0) + 1);

    if (imageObserver) imageObserver.unobserve(img);
    img._startLoad = null;
    img.classList.remove("no-art");

    let i = 0;
    const tryNext = async () => {
        if (img._imgToken !== token) return;
        if (i >= list.length) {
            if (track) {
                try {
                    const fallbackUrl = await lookupArtworkUrl(track);
                    if (img._imgToken !== token) return;
                    if (fallbackUrl) {
                        img.onerror = () => {
                            if (img._imgToken !== token) return;
                            img.classList.add("no-art");
                            img.src = DEFAULT_ART_DATA_URI;
                        };
                        img.onload = null;
                        img.src = fallbackUrl;
                        return;
                    }
                } catch (e) {}
            }
            img.classList.add("no-art");
            img.src = DEFAULT_ART_DATA_URI;
            return;
        }
        const url = list[i++];
        img.onerror = tryNext;
        img.onload = () => { if (img._imgToken === token) img.onerror = null; };
        img.src = url;
    };

    if ("IntersectionObserver" in window) {
        img._startLoad = tryNext;
        getImageObserver().observe(img);
    } else {
        tryNext();
    }
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

function truncateForCanvas(ctx, str, maxWidth) {
    if (ctx.measureText(str).width <= maxWidth) return str;
    let truncated = str;
    while (truncated.length > 1 && ctx.measureText(truncated + "...").width > maxWidth) {
        truncated = truncated.slice(0, -1);
    }
    return truncated + "...";
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

    const urls = trackCoverUrls(track, true);
    const fallback = await lookupArtworkUrl(track).catch(() => null);
    if (fallback) urls.push(fallback);
    urls.push(DEFAULT_ART_DATA_URI);

    for (const url of urls) {
        try {
            const objectUrl = url.startsWith("data:") ? url : await getImageBlobURL(url);
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

    setMeta(null);

    const urls = trackCoverUrls(track, true);
    const fallback = await lookupArtworkUrl(track).catch(() => null);
    if (fallback) urls.push(fallback);

    for (const url of urls) {
        try {
            const blobUrl = await getImageBlobURL(url);
            if (currentTrackInfo === track) setMeta(blobUrl);
            return;
        } catch (e) {}
    }
    if (currentTrackInfo === track) setMeta(DEFAULT_ART_DATA_URI);
}

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
    postPlayerState();
}

const MINI_STATE_MSG = "kstuff-music-state";
const MINI_CMD_MSG = "kstuff-music-cmd";

let trackStatus = "idle";
let bridgeCover = { key: null, data: "" };

function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

async function loadBridgeCover(track) {
    const key = track.key;
    bridgeCover = { key, data: "" };

    const urls = trackCoverUrls(track);
    const fallback = await lookupArtworkUrl(track).catch(() => null);
    if (fallback) urls.push(fallback);

    for (const url of urls) {
        try {
            const objectUrl = await getImageBlobURL(url);
            const blob = await (await fetch(objectUrl)).blob();
            const data = await blobToDataURL(blob);
            if (bridgeCover.key !== key) return;
            bridgeCover.data = data;
            if (currentTrackInfo && currentTrackInfo.key === key) postPlayerState();
            return;
        } catch (e) {}
    }
}

function postPlayerState() {
    if (window.parent === window) return;

    const track = currentTrackInfo;
    if (track && bridgeCover.key !== track.key) loadBridgeCover(track);

    let status = "idle";
    if (track) {
        if (trackStatus === "loading" || trackStatus === "error") status = trackStatus;
        else status = audioPlayer.paused ? "paused" : "playing";
    }

    try {
        window.parent.postMessage({
            type: MINI_STATE_MSG,
            state: {
                hasTrack: !!track,
                status,
                title: track ? track.title : "",
                artist: track ? (track.artist || "") : "",
                cover: track && bridgeCover.key === track.key ? bridgeCover.data : "",
                hasPrev: hasPrevious(),
                hasNext: hasNext()
            }
        }, "*");
    } catch (e) {}
}

window.addEventListener("message", event => {
    const msg = event.data;
    if (!msg || msg.type !== MINI_CMD_MSG || event.source !== window.parent) return;

    if (msg.action === "toggle") {
        if (!audioPlayer.src) return;
        if (audioPlayer.paused) audioPlayer.play().catch(() => {});
        else audioPlayer.pause();
    } else if (msg.action === "prev") {
        playPrevious();
    } else if (msg.action === "next") {
        playNext();
    } else if (msg.action === "state") {
        postPlayerState();
    }
});

function initPlaylists() {
    updatePlaylistDropdowns();
    renderSidebarTracks();
}

function savePlaylists() {
    const plain = {};
    for (const [name, tracks] of Object.entries(playlists)) plain[name] = tracks.map(serializeTrack);
    localStorage.setItem("myPlaylists", JSON.stringify(plain));
}

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

function extensionForBlob(blob) {
    const type = (blob.type || "").toLowerCase();
    if (type.includes("flac")) return "flac";
    if (type.includes("webm")) return "webm";
    if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
    if (type.includes("ogg")) return "ogg";
    if (type.includes("wav")) return "wav";
    return "m4a";
}

if (downloadBtn) {
    downloadBtn.addEventListener("click", async () => {
        if (!audioPlayer.src) return;
        const src = audioPlayer.src;
        const track = currentTrackInfo;
        const rawName = track ? `${track.artist ? track.artist + " - " : ""}${track.title}` : "audio";

        downloadBtn.disabled = true;
        try {
            let blob = null;

            try {
                const response = await fetch(src);
                if (!response.ok) throw new Error("bad response");
                blob = await response.blob();
            } catch (e) {
                if (!src.startsWith("blob:")) {
                    try {
                        blob = await fetchBlobViaWisp(src, null, 120000);
                    } catch (e2) {}
                }
            }

            if (!blob) {
                window.open(src, "_blank");
                return;
            }

            const filename = rawName.replace(/[^\w\- ]+/g, "").trim().slice(0, 80) + "." + extensionForBlob(blob);
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
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

function fillTile(button, track) {
    button.querySelector(".tile-title").textContent = track.title;
    button.querySelector(".tile-artist").textContent = track.artist;
    button.setAttribute("aria-label", `${track.title} by ${track.artist}`);
    setImageDirect(button.querySelector("img"), trackCoverUrls(track), track);
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

    const sources = [
        () => fetchDeezerChart(shelf.genre),
        () => fetchDeezerChartAlt(shelf.genre),
        () => fetchAppleTrending(),
        () => fetchItunesSearchChart(shelf.title)
    ];

    let songs = [];
    let lastError = null;
    for (const source of sources) {
        try {
            songs = await source();
            if (songs.length > 0) break;
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

function showMessage(html) {
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

    let songs = [];
    try {
        songs = await searchStreamApi(query, STREAM_SEARCH_LIMIT);
    } catch (e) {
        console.warn("Music API search failed, falling back to Cherrion:", e.message);
    }
    if (myToken !== searchToken) return;

    if (songs.length === 0) {
        try {
            songs = await searchCherrionApi(query, CHERRION_SEARCH_LIMIT);
        } catch (e) {
            console.warn("Cherrion search failed, falling back to Invidious:", e.message);
        }
        if (myToken !== searchToken) return;
    }

    if (songs.length > 0) {
        renderSearchResults(songs.map(song => ({ ...song, videos: [] })));
        return;
    }

    showMessage(`${SVG_ICONS.spinner} Searching backup source...`);

    let videos = [];
    let videoError = null;
    try {
        videos = await searchVideosCached(query);
    } catch (e) {
        videoError = e;
    }
    if (myToken !== searchToken) return;

    if (videos.length === 0) {
        if (videoError) {
            console.error("Search failed:", videoError);
            showMessage(`${SVG_ICONS.warning} Search error: Unable to connect to streaming network.`);
        } else {
            showMessage("No results found.");
        }
        return;
    }

    renderSearchResults(videos.map(rawTrackFromVideo));
}

function renderSearchResults(tracks) {
    currentSearchResults = tracks;
    resultsList.innerHTML = "";
    tracks.forEach(track => {
        resultsList.appendChild(createTile(track, () => playFromList(currentSearchResults, track)));
    });
}

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

async function tryPlayStream(meta, myToken) {
    const streamId = String(meta.id);
    const cacheKey = `ripple:${streamId}`;

    const cachedUrl = await getCachedAudioObjectURL(cacheKey);
    if (myToken !== playRequestToken) return "stale";
    if (cachedUrl) {
        try {
            audioPlayer.src = cachedUrl;
            audioPlayer.volume = volumeBar.value;
            await attemptToPlay(audioPlayer);
            return myToken === playRequestToken ? "ok" : "stale";
        } catch (e) {}
    }

    for (const base of MUSIC_API_BASES) {
        if (myToken !== playRequestToken) return "stale";
        const url = richStreamUrl(base, meta);

        try {
            audioPlayer.src = url;
            audioPlayer.volume = volumeBar.value;
            await attemptToPlay(audioPlayer, 9000);
            return myToken === playRequestToken ? "ok" : "stale";
        } catch (err) {
            console.warn(`Direct stream playback failed for ${streamId} @ ${base}:`, err && err.message ? err.message : err);
        }

        if (myToken !== playRequestToken) return "stale";

        try {
            setLoadingHint(currentTrackInfo, "downloading via proxy");
            const blob = await fetchBlobViaWisp(url, null, 90000);
            if (myToken !== playRequestToken) return "stale";

            const objectUrl = await cacheAudioBlob(cacheKey, blob);
            audioPlayer.src = objectUrl;
            audioPlayer.volume = volumeBar.value;
            await attemptToPlay(audioPlayer, 10000);
            if (myToken === playRequestToken) return "ok";
            return "stale";
        } catch (err) {
            console.warn(`Wisp stream fetch failed for ${streamId} @ ${base}:`, err && err.message ? err.message : err);
        }
    }

    return "fail";
}

async function tryPlayCherrionStream(meta, myToken) {
    const cacheKey = `cherrion:${meta.id}`;

    const cachedUrl = await getCachedAudioObjectURL(cacheKey);
    if (myToken !== playRequestToken) return "stale";
    if (cachedUrl) {
        try {
            audioPlayer.src = cachedUrl;
            audioPlayer.volume = volumeBar.value;
            await attemptToPlay(audioPlayer);
            return myToken === playRequestToken ? "ok" : "stale";
        } catch (e) {}
    }

    const url = cherrionStreamUrlFor(meta);

    try {
        audioPlayer.src = url;
        audioPlayer.volume = volumeBar.value;
        await attemptToPlay(audioPlayer, 9000);
        return myToken === playRequestToken ? "ok" : "stale";
    } catch (err) {
        console.warn(`Direct cherrion playback failed for ${meta.id}:`, err && err.message ? err.message : err);
    }

    if (myToken !== playRequestToken) return "stale";

    try {
        const blob = await fetchBlobViaWisp(url, null, 90000);
        if (myToken !== playRequestToken) return "stale";

        const objectUrl = await cacheAudioBlob(cacheKey, blob);
        audioPlayer.src = objectUrl;
        audioPlayer.volume = volumeBar.value;
        await attemptToPlay(audioPlayer, 10000);
        return myToken === playRequestToken ? "ok" : "stale";
    } catch (err) {
        console.warn(`Wisp cherrion fetch failed for ${meta.id}:`, err && err.message ? err.message : err);
    }

    return "fail";
}

async function playViaStreamApi(track, myToken) {
    const triedRipple = new Set();
    const triedCherrion = new Set();
    const totalTried = () => triedRipple.size + triedCherrion.size;

    const attemptRipple = async (meta) => {
        if (!meta || meta.id === undefined || meta.id === null || meta.id === "") return "fail";
        const idKey = String(meta.id);
        if (triedRipple.has(idKey)) return "fail";
        triedRipple.add(idKey);
        setLoadingHint(track, totalTried() > 1 ? `trying stream ${totalTried()}` : "loading stream");

        let result = "fail";
        try {
            result = await tryPlayStream(meta, myToken);
        } catch (err) {
            console.warn(`tryPlayStream threw for ${idKey}:`, err && err.message ? err.message : err);
        }
        if (result === "ok") onPlaybackStarted(track, { type: "stream", id: idKey });
        return result;
    };

    const attemptCherrion = async (meta) => {
        if (!meta || meta.id === undefined || meta.id === null || meta.id === "") return "fail";
        const idKey = String(meta.id);
        if (triedCherrion.has(idKey)) return "fail";
        triedCherrion.add(idKey);
        setLoadingHint(track, totalTried() > 1 ? `trying stream ${totalTried()}` : "loading stream");

        let result = "fail";
        try {
            result = await tryPlayCherrionStream(meta, myToken);
        } catch (err) {
            console.warn(`tryPlayCherrionStream threw for ${idKey}:`, err && err.message ? err.message : err);
        }
        if (result === "ok") onPlaybackStarted(track, { type: "cherrion", id: idKey, meta });
        return result;
    };

    if (track.source === "ripple") {
        const result = await attemptRipple(richMetaFrom(track));
        if (result !== "fail") return result;
    } else if (track.source === "cherrion") {
        const result = await attemptCherrion(cherrionMetaFrom(track));
        if (result !== "fail") return result;
    }
    if (myToken !== playRequestToken) return "stale";

    const rememberedRipple = workingStreams[track.key];
    if (rememberedRipple) {
        const result = await attemptRipple({ ...richMetaFrom(track), id: rememberedRipple });
        if (result !== "fail") return result;
        forgetWorkingStream(track.key);
    }
    if (myToken !== playRequestToken) return "stale";

    const rememberedCherrion = workingCherrion[track.key];
    if (rememberedCherrion) {
        const result = await attemptCherrion(rememberedCherrion);
        if (result !== "fail") return result;
        forgetWorkingCherrion(track.key);
    }
    if (myToken !== playRequestToken) return "stale";

    const leftovers = [];

    for (const query of buildStreamQueries(track)) {
        if (totalTried() >= STREAM_MAX_TRIES) break;
        setLoadingHint(track, "finding stream");

        const [rippleResult, cherrionResult] = await Promise.allSettled([
            searchStreamApi(query, STREAM_MATCH_LIMIT),
            searchCherrionApi(query, CHERRION_MATCH_LIMIT)
        ]);
        if (myToken !== playRequestToken) return "stale";

        const rippleSongs = rippleResult.status === "fulfilled" ? rippleResult.value : [];
        const cherrionSongs = cherrionResult.status === "fulfilled" ? cherrionResult.value : [];
        if (rippleResult.status === "rejected") console.warn("Ripple match search failed:", rippleResult.reason && rippleResult.reason.message);
        if (cherrionResult.status === "rejected") console.warn("Cherrion match search failed:", cherrionResult.reason && cherrionResult.reason.message);

        const rankedRipple = rankStreamSongs(rippleSongs, track);
        const rankedCherrion = rankStreamSongs(cherrionSongs, track);

        for (const song of rankedRipple.good) {
            if (totalTried() >= STREAM_MAX_TRIES) break;
            const result = await attemptRipple(richMetaFrom(song));
            if (result !== "fail") return result;
        }
        for (const song of rankedCherrion.good) {
            if (totalTried() >= STREAM_MAX_TRIES) break;
            const result = await attemptCherrion(cherrionMetaFrom(song));
            if (result !== "fail") return result;
        }

        leftovers.push(...rankedRipple.loose.map(song => ({ kind: "ripple", song })));
        leftovers.push(...rankedCherrion.loose.map(song => ({ kind: "cherrion", song })));
    }

    if (totalTried() < STREAM_MAX_TRIES && leftovers.length > 0) {
        const { kind, song } = leftovers[0];
        const result = kind === "ripple" ? await attemptRipple(richMetaFrom(song)) : await attemptCherrion(cherrionMetaFrom(song));
        if (result !== "fail") return result;
    }

    return "fail";
}

async function getAudioFormats(videoId) {
    const data = await fetchInvidiousJSON(`/api/v1/videos/${encodeURIComponent(videoId)}`, 25000, 8000);

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

            if (myToken === playRequestToken) {
                cacheDownloadLimiter(() => fetchWithTimeout(fmt.url, 15000))
                    .then(r => (r.ok ? r.blob() : null))
                    .then(blob => {
                        if (blob && blob.size > 0 && myToken === playRequestToken) cacheAudioBlob(videoId, blob);
                    })
                    .catch(() => {});
            }

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

async function playViaInvidious(track, myToken) {
    const tried = new Set();
    let attempts = 0;

    const attempt = async (videoId) => {
        if (!videoId || tried.has(videoId)) return "fail";
        tried.add(videoId);
        attempts++;
        if (attempts > 1) setLoadingHint(track, `trying backup source ${attempts}`);

        const result = await tryPlayVideo(videoId, myToken);
        if (result === "ok") onPlaybackStarted(track, { type: "video", id: videoId });
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
        setLoadingHint(track, "searching backup source");

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

function showTrackInDock(track, loading) {
    nowPlayingTitle.innerHTML = loading
        ? `${SVG_ICONS.spinner} ${escapeHTML(track.title)}`
        : escapeHTML(track.title);
    nowPlayingArtist.textContent = track.artist || "";
    setImage(nowPlayingCover, trackCoverUrls(track), false, track);
}

function setLoadingHint(track, hint) {
    if (track !== currentTrackInfo) return;
    nowPlayingArtist.textContent = `${track.artist || ""}${hint ? " • " + hint : ""}`;
}

function onPlaybackStarted(track, via) {
    trackStatus = "ready";
    if (via.type === "stream") {
        track.streamId = via.id;
        if (track.source !== "ripple") rememberWorkingStream(track.key, via.id);
    } else if (via.type === "cherrion") {
        track.streamId = via.id;
        if (track.source !== "cherrion") rememberWorkingCherrion(track.key, via.meta);
    } else if (via.type === "video") {
        track.videoId = via.id;
        if (track.source !== "youtube") rememberWorkingVideo(track.key, via.id);
    }
    showTrackInDock(track, false);
    updatePlayButton();
    updateNavButtons();
    renderSidebarTracks();
    updatePiPCanvas(track);
    updateMediaSessionMetadata(track);
}

async function resolveAndPlay(track, myToken) {
    if (track.source !== "youtube") {
        const result = await playViaStreamApi(track, myToken);
        if (result !== "fail") return result;
        if (myToken !== playRequestToken) return "stale";
        setLoadingHint(track, "using backup source");
    }

    return playViaInvidious(track, myToken);
}

async function playTrack(track) {
    const myToken = ++playRequestToken;
    currentTrackInfo = track;
    trackStatus = "loading";

    audioPlayer.pause();
    audioDock.classList.add("visible");
    showTrackInDock(track, true);
    updateNavButtons();
    renderSidebarTracks();

    let result = "fail";
    try {
        result = await resolveAndPlay(track, myToken);
    } catch (err) {
        console.error("playTrack failed unexpectedly:", err);
        result = "fail";
    }
    if (myToken !== playRequestToken || result === "stale") return;

    if (result !== "ok") {
        trackStatus = "error";
        nowPlayingTitle.textContent = "Error: Cannot load audio stream.";
        nowPlayingArtist.textContent = `${track.title} • ${track.artist || ""}`;
        updateNavButtons();
    }
}

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
        if (!entry.streamId) entry.streamId = workingStreams[currentTrackInfo.key] || null;
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
    trackStatus = "idle";
    renderSidebarTracks();
    updateNavButtons();
    updatePiPCanvas(null);
});

audioPlayer.addEventListener("play", () => {
    updatePlayButton();
    postPlayerState();
    pipVideo.play().catch(() => {});
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
    updatePositionState();
});

audioPlayer.addEventListener("pause", () => {
    updatePlayButton();
    postPlayerState();
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

initPlaylists();
updateNavButtons();
buildHomeSkeleton();
