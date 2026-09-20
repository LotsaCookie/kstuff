(function () {
  const cleanUrl = u => u ? u.replace(/\/+$/, '') : '';
  const trimSlash = u => u ? u.replace(/^\/+/, '') : '';
  const getStorage = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const setStorage = (k, v) => { try { localStorage.setItem(k, v); } catch { } };
  const removeStorage = k => { try { localStorage.removeItem(k); } catch { } };
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

  const WISP_SETUP_TIMEOUT = 20000;        
  const CLONE_LIST_BASE_TIMEOUT = 10000; 
  const CLONE_LIST_MAX_TIMEOUT = 60000;    
  const CLONE_VALIDATE_TIMEOUT = 8000;     
  const CLONE_CONCURRENCY = 6;             
  const CLONE_PASS_DELAY = 3000;           
  const JSON_STOPGAP_DELAY = 8000;         
  const MAX_STORED_LIST = 100;

  let commitEtag = null;
  let cachedCommitHash = null;

  const CLONE_API = 'https://getwebsiteclones.vercel.app/api?url=';
  const WISP_SERVER = 'wss://wisp.mercurywork.shop/';
  const BARE_MUX_ESM = 'https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.1.9/+esm';
  const BARE_MUX_WORKER = 'https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.1.9/dist/worker.js';
  const EPOXY_TRANSPORT = 'https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs';
  const CLONE_TARGETS = [
    { domain: 'truffled.lol', testPath: '/favicon.ico', keys: ['truffled'], jsonFile: 'truffled.json' },
    { domain: 'frogiesarcade.win', testPath: '/stuff/logo.png', keys: ['static', 'frogiee'], jsonFile: 'frogiee.json' }
  ];
  const CLONE_KEYS = CLONE_TARGETS.flatMap(t => t.keys);
  const CACHE_VERSION = '3';
  (function purgeOldCloneCache() {
    if (getStorage('kstuff_mirror_cache_version') === CACHE_VERSION) return;
    CLONE_TARGETS.forEach(t => {
      t.keys.forEach(k => removeStorage(`kstuff_lastgood_${k}`));
      removeStorage(`kstuff_clonelist_${t.keys[0]}`);
    });
    setStorage('kstuff_mirror_cache_version', CACHE_VERSION);
    log('Cleared old clone mirror cache');
  })();

  const isPlainUrl = s => typeof s === 'string' && /^https?:\/\/[^\s{}"']+$/.test(s);
  const clearCloneCache = keys => keys.forEach(k => removeStorage(`kstuff_lastgood_${k}`));
  const mirrorSources = {};

  const normalizeCloneUrl = u => {
    if (typeof u !== 'string') return '';
    let s = u.trim();
    if (!s) return '';
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    return cleanUrl(s.replace(/^http:\/\//i, 'https://'));
  };

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
          if (!client) bareClientPromise = null;
          return client;
        });
    }
    return bareClientPromise;
  }

  async function fetchTextViaWisp(client, url, ms) {
    const load = async () => {
      const res = await client.fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    };
    return withTimeout(load(), ms, 'Wisp fetch');
  }

  async function fetchCloneList(client, domain, ms) {
    const text = await fetchTextViaWisp(client, CLONE_API + encodeURIComponent(domain), ms);
    const data = JSON.parse(text);
    const raw = Array.isArray(data?.domains) ? data.domains : [];
    const list = raw.map(normalizeCloneUrl).filter(isPlainUrl);
    return [...new Set(list)];
  }

  const INCONCLUSIVE_TITLE = /just a moment|attention required|checking your browser|verify you are human/i;
  const BLOCK_TITLE = /access denied|blocked|forbidden|not found|404|suspended|deployment|parked|for sale|can.t be reached|bad gateway|service unavailable|error/i;
  const normTitle = t => (t || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const extractTitle = html => {
    const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html || '');
    return m ? normTitle(m[1]) : '';
  };

  const referenceTitles = new Map();
  function getReferenceTitle(client, domain) {
    if (!referenceTitles.has(domain)) {
      const p = (async () => {
        try {
          const html = await fetchTextViaWisp(client, `https://${domain}/`, CLONE_VALIDATE_TIMEOUT);
          const t = extractTitle(html);
          return t && !INCONCLUSIVE_TITLE.test(t) ? t : null;
        } catch {
          return null;
        }
      })();
      referenceTitles.set(domain, p);
      p.then(t => { if (!t) setTimeout(() => referenceTitles.delete(domain), 30000); });
    }
    return referenceTitles.get(domain);
  }

  async function validatePage(target, url, client) {
    let html;
    try {
      html = await fetchTextViaWisp(client, cleanUrl(url) + '/', CLONE_VALIDATE_TIMEOUT);
    } catch {
      return false;
    }
    if (!html || html.length < 100) return false;

    const title = extractTitle(html);
    if (INCONCLUSIVE_TITLE.test(title)) return true;   // bot challenge aimed at the proxy; trust the image probe

    const ref = await getReferenceTitle(client, target.domain);
    if (ref) return !!title && (title.includes(ref) || ref.includes(title));
    return !BLOCK_TITLE.test(title);
  }


  async function checkCandidate(target, url, { validate = true } = {}) {
    if (!(await testCloneUrl(url, target.testPath))) return { ok: false, validated: false };
    if (!validate) return { ok: true, validated: false };
    const client = await getBareClient();
    if (!client) return { ok: true, validated: false };
    const real = await validatePage(target, url, client);
    return { ok: real, validated: real };
  }

  function firstPassing(list, check, concurrency = CLONE_CONCURRENCY) {
    return new Promise(resolve => {
      if (!list.length) return resolve(null);
      let next = 0, active = 0, done = false;
      const launch = () => {
        while (!done && active < concurrency && next < list.length) {
          const url = list[next++];
          active++;
          Promise.resolve()
            .then(() => check(url))
            .catch(() => null)
            .then(res => {
              active--;
              if (done) return;
              if (res?.ok) { done = true; resolve({ url, validated: res.validated }); return; }
              if (next >= list.length && active === 0) { done = true; resolve(null); return; }
              launch();
            });
        }
      };
      launch();
    });
  }

  const readStoredList = key => {
    try {
      const a = JSON.parse(getStorage(`kstuff_clonelist_${key}`));
      return Array.isArray(a) ? a.filter(isPlainUrl) : [];
    } catch {
      return [];
    }
  };
  const storeList = (key, list) => setStorage(`kstuff_clonelist_${key}`, JSON.stringify(list.slice(0, MAX_STORED_LIST)));

  function rememberMirror(keys, url) {
    keys.forEach(k => {
      setStorage(`kstuff_lastgood_${k}`, url);
      FALLBACK_MIRRORS[k] = url;
    });
  }

  async function fetchListForever(target, ctx) {
    for (let attempt = 1; !ctx.cancelled; attempt++) {
      const client = await getBareClient();
      if (client) {
        const ms = Math.min(CLONE_LIST_BASE_TIMEOUT + (attempt - 1) * 10000, CLONE_LIST_MAX_TIMEOUT);
        try {
          const list = await fetchCloneList(client, target.domain, ms);
          if (list.length) {
            storeList(target.keys[0], list);
            return list;
          }
          warn(`Clone API returned an empty list for ${target.domain} (attempt ${attempt}), retrying`);
        } catch (e) {
          warn(`Clone list for ${target.domain} failed (attempt ${attempt}), retrying:`, e?.message || e);
        }
      } else {
        warn(`Wisp not ready for ${target.domain} (attempt ${attempt}), retrying`);
      }
      await sleep(Math.min(1000 * attempt, 10000));
    }
    return [];
  }

  async function jsonFallbackFor(target) {
    let table = [];
    try {
      table = await fetchWithProxy(`Assets/json/mirrors/${target.jsonFile}`);
    } catch (e) {
      warn(`JSON list ${target.jsonFile} unavailable:`, e?.message || e);
    }
    if (!Array.isArray(table) || !table.length) return null;

    const tested = await Promise.all(table.map(e => testMirrorEntry(e)));
    const hit = tested.find(Boolean);
    if (!hit) {
      warn(`None of the ${target.jsonFile} entries passed a probe`);
      return null;
    }
    return cleanUrl(hit.url);
  }

  async function jsonStopgap(target, isInitial) {
    if (mirrorSources[target.keys[0]]) return;
    warn(`Wisp is slow or failing for ${target.domain}, trying the JSON list while it keeps searching`);
    const url = await jsonFallbackFor(target);
    if (url && !mirrorSources[target.keys[0]]) postFound(target, url, 'json', isInitial);
  }

  async function findCloneMirror(target, isInitial) {
    const { domain, keys } = target;

    const cached = getStorage(`kstuff_lastgood_${keys[0]}`);
    if (cached) {
      if (isPlainUrl(cached)) {
        const r = await checkCandidate(target, cached, { validate: isInitial });
        if (r.ok) {
          log(`Cached clone for ${domain} still works:`, cleanUrl(cached));
          return { url: cleanUrl(cached), via: 'cache', validated: true };
        }
      }
      warn(`Cached clone for ${domain} is dead or invalid, dropping it`);
      clearCloneCache(keys);
    }

    const ctx = { cancelled: false };
    const stopgapTimer = mirrorSources[keys[0]]
      ? null
      : setTimeout(() => { jsonStopgap(target, isInitial).catch(() => { }); }, JSON_STOPGAP_DELAY);

    try {
      for (let pass = 1; ; pass++) {
        const listPromise = fetchListForever(target, ctx);   // runs alongside the tests below
        const tried = new Set();

        if (pass === 1) {
          const stored = readStoredList(keys[0]);
          if (stored.length) {
            log(`Testing ${stored.length} previously seen clones for ${domain} while the API loads`);
            stored.forEach(u => tried.add(u));
            const hit = await firstPassing(stored, u => checkCandidate(target, u));
            if (hit) return { url: hit.url, via: 'cache-list', validated: hit.validated };
          }
        }

        const list = await listPromise;
        const fresh = list.filter(u => !tried.has(u));
        log(`Testing ${fresh.length} clones for ${domain} (pass ${pass})`);
        const hit = await firstPassing(fresh, u => checkCandidate(target, u));
        if (hit) {
          log(`Found working clone for ${domain}:`, hit.url);
          return { url: hit.url, via: 'wisp', validated: hit.validated };
        }

        warn(`No working clone for ${domain} in pass ${pass}, trying again`);
        await sleep(CLONE_PASS_DELAY);
      }
    } finally {
      ctx.cancelled = true;
      clearTimeout(stopgapTimer);
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

  function postFound(target, url, via, isInitial) {
    const update = {};
    target.keys.forEach(k => {
      update[k] = url;
      mirrorSources[k] = via;
    });
    update.sources = { ...mirrorSources };
    log(`${target.domain} -> ${url} (via ${via})`);
    postMirrorUpdate(update, isInitial);
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
        const found = await findCloneMirror(target, isInitial);
        const via = found.validated || found.via === 'cache' ? found.via : found.via + '-unvalidated';
        if (found.validated && found.via !== 'cache') rememberMirror(target.keys, found.url);
        postFound(target, found.url, via, isInitial);
      } catch (e) {
        fail(`Clone search for ${target.domain} crashed (it will restart on the next refresh):`, e?.message || e);
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
