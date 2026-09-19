(function () {
  const cleanUrl = u => u ? u.replace(/\/+$/, '') : '';
  const trimSlash = u => u ? u.replace(/^\/+/, '') : '';
  const getStorage = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const setStorage = (k, v) => { try { localStorage.setItem(k, v); } catch { } };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const withTimeout = (promise, ms, label) => new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label + ' timed out')), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });

  const STYLE = {
    info: 'color: #4a7dff; font-weight: bold',
    warn: 'color: #ffd74a; font-weight: bold',
    error: 'color: #ff7d4a; font-weight: bold'
  };
  const log = (...a) => console.log('%c[MIRRORS.JS]', STYLE.info, ...a);
  const warn = (...a) => console.warn('%c[MIRRORS.JS]', STYLE.warn, ...a);
  const fail = (...a) => console.error('%c[MIRRORS.JS]', STYLE.error, ...a);

  let FALLBACK_MIRRORS = {
    scram: '',
    static: '',
    uv: '',
    truffled: 'https://boat.strongson.com',
    frogiee: ''
  };

  window.kstuffMirrors = {
    scram: '',
    static: '',
    uv: '',
    truffled: 'https://boat.strongson.com',
    frogiee: '',
    lastUpdate: 0,
    testing: false,
    status: 'initializing'
  };

  const MIRROR_TEST_TIMEOUT = 5000;
  const AUTO_REFRESH_INTERVAL = 120000;

  const WISP_SETUP_TIMEOUT = 15000;
  const CLONE_LIST_TIMEOUT = 15000;
  const CLONE_LIST_RETRIES = 3;
  const CLONE_RETRY_DELAY = 2000;
  const CLONE_PASS_DELAY = 3000;

  let commitEtag = null;
  let cachedCommitHash = null;

  const CLONE_API = 'https://getwebsiteclones.vercel.app/clones?url=';
  const WISP_SERVER = 'wss://wisp.mercurywork.shop/';
  const BARE_MUX_ESM = 'https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.1.9/+esm';
  const BARE_MUX_WORKER = 'https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.1.9/dist/worker.js';
  const EPOXY_TRANSPORT = 'https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs';

  const CLONE_TARGETS = [
    { domain: 'truffled.lol', testPath: '/favicon.ico', keys: ['truffled'], jsonFile: 'truffled.json' },
    { domain: 'frogiesarcade.win', testPath: '/stuff/logo.png', keys: ['static', 'frogiee'], jsonFile: 'frogiee.json' }
  ];
  const CLONE_KEYS = CLONE_TARGETS.flatMap(t => t.keys);

  const CACHE_VERSION = '2';
  (function purgeOldCloneCache() {
    if (getStorage('kstuff_mirror_cache_version') === CACHE_VERSION) return;
    CLONE_KEYS.forEach(k => { try { localStorage.removeItem(`kstuff_lastgood_${k}`); } catch { } });
    setStorage('kstuff_mirror_cache_version', CACHE_VERSION);
    log('Cleared old clone mirror cache');
  })();

  const isPlainUrl = s => typeof s === 'string' && /^https?:\/\/[^\s{}"']+$/.test(s);
  const clearCloneCache = keys => keys.forEach(k => { try { localStorage.removeItem(`kstuff_lastgood_${k}`); } catch { } });
  const mirrorSources = {};

  function probeImage(url, timeoutMs = MIRROR_TEST_TIMEOUT) {
    return new Promise(resolve => {
      let done = false;
      const img = new Image();
      const timer = setTimeout(() => finish(false), timeoutMs);
      function finish(ok) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        img.onload = img.onerror = null;
        img.src = '';
        resolve(ok);
      }
      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.referrerPolicy = 'no-referrer';
      const buster = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      img.src = url + (url.includes('?') ? '&' : '?') + 'cb=' + buster;
    });
  }

  const testCloneUrl = (baseUrl, testPath) => probeImage(cleanUrl(baseUrl) + testPath);

  let bareClientPromise = null;

  async function setupBareClient() {
    try {
      const { BareMuxConnection, BareClient } = await import(BARE_MUX_ESM);
      const workerCode = `importScripts("${BARE_MUX_WORKER}");`;
      const blob = new Blob([workerCode], { type: 'text/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const conn = new BareMuxConnection(workerUrl);
      await conn.setTransport(EPOXY_TRANSPORT, [{ wisp: WISP_SERVER }]);
      log('Wisp proxy ready');
      return new BareClient();
    } catch (err) {
      fail('Wisp proxy setup failed:', err?.message || err);
      return null;
    }
  }

  function getBareClient() {
    if (!bareClientPromise) {
      bareClientPromise = withTimeout(setupBareClient(), WISP_SETUP_TIMEOUT, 'Wisp setup')
        .catch(e => { fail(e?.message || e); return null; })
        .then(client => {
          if (!client) bareClientPromise = null;   // allow a fresh attempt on the next refresh
          return client;
        });
    }
    return bareClientPromise;
  }

  async function fetchCloneList(client, domain) {
    const load = async () => {
      const res = await client.fetch(CLONE_API + domain);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    };
    const text = await withTimeout(load(), CLONE_LIST_TIMEOUT, 'Clone list fetch');
    return text.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
  }

  function rememberMirror(keys, url) {
    keys.forEach(k => {
      setStorage(`kstuff_lastgood_${k}`, url);
      FALLBACK_MIRRORS[k] = url;
    });
  }

  async function findCloneViaWisp(target) {
    const { domain, testPath, keys } = target;

    const cached = getStorage(`kstuff_lastgood_${keys[0]}`);
    if (cached) {
      if (isPlainUrl(cached) && await testCloneUrl(cached, testPath)) {
        log(`Cached clone for ${domain} still works:`, cleanUrl(cached));
        return { url: cleanUrl(cached), via: 'cache' };
      }
      warn(`Cached clone for ${domain} is dead or invalid, dropping it`);
      clearCloneCache(keys);
    }

    log(`Starting Wisp search for ${domain}`);
    const client = await getBareClient();
    if (!client) return null;

    for (let pass = 1; ; pass++) {
      let list = null;
      for (let attempt = 1; attempt <= CLONE_LIST_RETRIES && !list; attempt++) {
        try {
          list = await fetchCloneList(client, domain);
        } catch (e) {
          warn(`Clone list fetch for ${domain} failed (attempt ${attempt}/${CLONE_LIST_RETRIES}):`, e?.message || e);
          if (attempt < CLONE_LIST_RETRIES) await sleep(CLONE_RETRY_DELAY);
        }
      }
      if (!list || !list.length) {
        warn(`Wisp could not provide a clone list for ${domain}`);
        return null;
      }

      log(`Testing ${list.length} clones for ${domain} (pass ${pass})`);

      for (const url of list) {
        if (await testCloneUrl(url, testPath)) {
          const found = cleanUrl(url);
          rememberMirror(keys, found);
          log(`Found working clone for ${domain}:`, found);
          return { url: found, via: 'wisp' };
        }
      }

      warn(`No working clone for ${domain} in pass ${pass}, trying again`);
      await sleep(CLONE_PASS_DELAY);
    }
  }

  const timedFetch = async (url, asText = false, ms = 10000) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return asText ? await r.text() : await r.json();
    } finally {
      clearTimeout(timer);
    }
  };

  async function refreshCommitHash() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const headers = commitEtag ? { 'If-None-Match': commitEtag } : {};
      const res = await fetch(
        'https://api.github.com/repos/lotsacookie/kstuff/commits/main',
        { headers, signal: ctrl.signal }
      );

      if (res.status === 304) return false;
      if (!res.ok) return false;

      const newEtag = res.headers.get('ETag');
      if (newEtag) commitEtag = newEtag;

      const json = await res.json();
      const newSha = json?.sha;
      if (!newSha) return false;

      const isFirstCheck = cachedCommitHash === null;
      const changed = newSha !== cachedCommitHash;
      cachedCommitHash = newSha;

      return changed && !isFirstCheck;
    } catch (err) {
      console.error('refreshCommitHash failed', err);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  async function getProxyList() {
    if (!cachedCommitHash) {
      await refreshCommitHash();
      if (!cachedCommitHash) cachedCommitHash = 'main';
    }
    return [
      `https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@${cachedCommitHash}/`,
      ""
    ];
  }

  async function fetchWithProxy(path, asText = false) {
    const cb = (path.includes('?') ? '&' : '?') + '_=' + Date.now();
    const proxies = await getProxyList();
    try {
      return await Promise.any(proxies.map(p => timedFetch(p + path + cb, asText)));
    } catch (err) {
      console.error('All proxies failed for', path, err);
      throw new Error("Proxies failed: " + path);
    }
  }

  const mirrorTestCache = new Map();

  async function testMirrorEntry(entry) {
    const cacheKey = `${entry.url}|${entry.img}`;
    if (!mirrorTestCache.has(cacheKey)) {
      const base = `${cleanUrl(entry.url)}/${trimSlash(entry.img)}`;
      mirrorTestCache.set(cacheKey, probeImage(base));
    }
    const ok = await mirrorTestCache.get(cacheKey);
    return ok ? entry : null;
  }

  async function getWorkingConfig(table, storageKey = null) {
    if (!table?.length) return null;
    const results = await Promise.allSettled(table.map(entry => testMirrorEntry(entry)));

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value) {
        if (storageKey) {
          try {
            setStorage(`kstuff_lastgood_${storageKey}`, JSON.stringify(r.value));
          } catch { }
        }
        return r.value;
      }
    }

    if (storageKey) {
      try {
        const cached = JSON.parse(getStorage(`kstuff_lastgood_${storageKey}`));
        if (cached && table.some(e => e.url === cached.url)) return cached;
      } catch { }
    }
    return table[0];
  }

  async function jsonFallbackFor(target) {
    const { keys, jsonFile } = target;
    let table = [];
    try {
      table = await fetchWithProxy(`Assets/json/mirrors/${jsonFile}`);
    } catch (e) {
      warn(`JSON fallback ${jsonFile} unavailable:`, e?.message || e);
    }
    if (!Array.isArray(table) || !table.length) return null;

    const tested = await Promise.all(table.map(e => testMirrorEntry(e)));
    const hit = tested.find(Boolean);
    if (!hit) {
      warn(`None of the ${jsonFile} entries passed a probe`);
      return null;  
    }
    const url = cleanUrl(hit.url);
    rememberMirror(keys, url);
    return { url, via: 'json' };
  }

  function postMirrorUpdate(mirrors, isInitial = false) {
    window.kstuffMirrors = {
      ...window.kstuffMirrors,
      ...mirrors,
      lastUpdate: Date.now(),
      status: 'ready'
    };

    log('Update:', {
      timestamp: new Date(window.kstuffMirrors.lastUpdate).toLocaleTimeString(),
      scram: window.kstuffMirrors.scram ? '✓' : '✗',
      static: window.kstuffMirrors.static ? '✓' : '✗',
      uv: window.kstuffMirrors.uv ? '✓' : '✗',
      truffled: window.kstuffMirrors.truffled ? '✓' : '✗',
      frogiee: window.kstuffMirrors.frogiee ? '✓' : '✗',
      isInitial: isInitial
    });

    window.dispatchEvent(new CustomEvent('kstuff-mirrors-updated', {
      detail: window.kstuffMirrors
    }));
  }

  function buildFallbackResults() {
    const finalResults = {};
    Object.keys(FALLBACK_MIRRORS).forEach(key => {
      if (key === 'scram' || key === 'uv') {
        try {
          const cached = JSON.parse(getStorage(`kstuff_lastgood_${key}`));
          finalResults[key] = cached?.url ? cleanUrl(cached.url) + (cached.final || '') : FALLBACK_MIRRORS[key];
        } catch {
          finalResults[key] = FALLBACK_MIRRORS[key];
        }
      } else {
        const cached = getStorage(`kstuff_lastgood_${key}`);
        finalResults[key] = cached || FALLBACK_MIRRORS[key];
      }
    });
    return finalResults;
  }

  function fillMissing(results) {
    const fb = buildFallbackResults();
    Object.keys(FALLBACK_MIRRORS).forEach(key => {
      if (results[key] || CLONE_KEYS.includes(key)) return;
      results[key] = fb[key];
    });
    return results;
  }

  const activeCloneSearches = new Map();

  function startCloneSearch(target, isInitial) {
    if (activeCloneSearches.has(target.domain)) {
      log(`Clone search for ${target.domain} is still running, leaving it alone`);
      return activeCloneSearches.get(target.domain);
    }

    const search = (async () => {
      try {
        let found = null;
        try {
          found = await findCloneViaWisp(target);
        } catch (e) {
          fail(`Wisp search for ${target.domain} threw:`, e?.message || e);
        }

        if (!found) {
          warn(`Wisp path failed for ${target.domain}, using JSON fallback`);
          found = await jsonFallbackFor(target);
        }

        if (found) {
          const update = {};
          target.keys.forEach(k => {
            update[k] = found.url;
            mirrorSources[k] = found.via;
          });
          update.sources = { ...mirrorSources };
          log(`${target.domain} -> ${found.url} (via ${found.via})`);
          postMirrorUpdate(update, isInitial);
        } else {
          warn(`No tested mirror found for ${target.domain}; leaving the current value unchanged`);
        }
      } finally {
        activeCloneSearches.delete(target.domain);
      }
    })();

    activeCloneSearches.set(target.domain, search);
    return search;
  }

  async function testAllMirrors(isInitial = false) {
    if (window.kstuffMirrors.testing) {
      log('Mirror test already in progress, skipping');
      return;
    }

    window.kstuffMirrors.testing = true;
    mirrorTestCache.clear();
    const results = {};
    let testsPassed = 0;
    let testsFailed = 0;

    try {
      log(isInitial ? 'Initial mirror test starting...' : 'Auto-refresh test starting...');
      CLONE_TARGETS.forEach(t => startCloneSearch(t, isInitial));

      if (!isInitial) await refreshCommitHash();

      const [scramJson, uvJson] = await Promise.all([
        fetchWithProxy('Assets/json/mirrors/scram.json').catch(() => []),
        fetchWithProxy('Assets/json/mirrors/uv.json').catch(() => [])
      ]);

      for (const [key, table] of [['scram', scramJson], ['uv', uvJson]]) {
        if (!table?.length) {
          warn(`No ${key} mirrors available`);
          testsFailed++;
          continue;
        }
        if (table[0]?.url) {
          FALLBACK_MIRRORS[key] = cleanUrl(table[0].url) + (table[0].final || '');
        }
        try {
          const pick = await getWorkingConfig(table, key);
          if (pick?.url) {
            results[key] = cleanUrl(pick.url) + (pick.final || '');
            testsPassed++;
          } else {
            results[key] = FALLBACK_MIRRORS[key];
            testsFailed++;
          }
        } catch (e) {
          fail(`${key} test failed:`, e.message);
          results[key] = FALLBACK_MIRRORS[key];
          testsFailed++;
        }
      }

      log(`scram/uv tests complete: ${testsPassed} passed, ${testsFailed} failed`);
      postMirrorUpdate(fillMissing(results), isInitial);

    } catch (err) {
      fail('testAllMirrors exception:', err);
      postMirrorUpdate(fillMissing({}), isInitial);
    } finally {
      window.kstuffMirrors.testing = false;
    }
  }

  async function startMirrors() {
    log('Initializing mirror system...');
    await testAllMirrors(true);
  }

  function startAutoRefresh() {
    log('Starting auto-refresh (every 2 minutes)');
    setInterval(() => {
      testAllMirrors(false);
    }, AUTO_REFRESH_INTERVAL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await startMirrors();
      startAutoRefresh();
    });
  } else {
    startMirrors();
    startAutoRefresh();
  }

  window.kstuffTestMirrors = () => testAllMirrors(false);

  window.kstuffMirrorsDebug = () => {
    console.table({
      scram: window.kstuffMirrors.scram,
      static: window.kstuffMirrors.static,
      uv: window.kstuffMirrors.uv,
      truffled: window.kstuffMirrors.truffled,
      frogiee: window.kstuffMirrors.frogiee,
      status: window.kstuffMirrors.status,
      testing: window.kstuffMirrors.testing,
      lastUpdate: new Date(window.kstuffMirrors.lastUpdate).toLocaleTimeString()
    });
    return window.kstuffMirrors;
  };
})();
