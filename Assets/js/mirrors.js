(function initMirrors() {
  const cleanUrl = u => u ? u.replace(/\/+$/, '') : '';
  const trimSlash = u => u ? u.replace(/^\/+/, '') : '';
  const getStorage = k => localStorage.getItem(k);
  const setStorage = (k, v) => localStorage.setItem(k, v);

  let FALLBACK_MIRRORS = {
    scram: '',
    static: '',
    uv: '',
    truffled: 'https://boat.strongson.com',
    frogiee: ''
  };

  window.kstuffMirrors = {
    scram: '',
    static: 'https://frogiesarcade.win',
    uv: 'https://extrememath.net',
    truffled: 'https://truffled.lol',
    frogiee: 'https://frogiesarcade.win',
    lastUpdate: 0,
    testing: false,
    status: 'initializing'
  };

  const MIRROR_TEST_TIMEOUT = 5000;
  const AUTO_REFRESH_INTERVAL = 120000;
  const TEST_TIMEOUT_HARD = 15000;
  let commitEtag = null;
  let cachedCommitHash = null;
  let testingTimeoutId = null;

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

  function probeMirrorImage(entry, timeoutMs) {
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
      const base = `${cleanUrl(entry.url)}/${trimSlash(entry.img)}`;
      const buster = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      img.referrerPolicy = 'no-referrer';
      img.src = `${base}${base.includes('?') ? '&' : '?'}bridge=${buster}`;
    });
  }

  async function testMirrorEntry(entry, timeoutMs = 5000) {
    const cacheKey = `${entry.url}|${entry.img}`;
    if (!mirrorTestCache.has(cacheKey)) {
      mirrorTestCache.set(cacheKey, probeMirrorImage(entry, timeoutMs));
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
      status: 'ready',
      testing: false
    };

    console.log('%c[MIRRORS.JS]', 'color: #4a7dff; font-weight: bold', 'Update:', {
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

  async function testAllMirrors(isInitial = false) {
    if (window.kstuffMirrors.testing) {
      console.log('%c[MIRRORS.JS]', 'color: #4a7dff; font-weight: bold', 'Mirror test already in progress, skipping');
      return;
    }
    
    window.kstuffMirrors.testing = true;
    const results = {};
    let testsFailed = 0;
    let testsPassed = 0;

    testingTimeoutId = setTimeout(() => {
      console.warn('%c[MIRRORS.JS]', 'color: #ff7d4a; font-weight: bold', 'Hard timeout reached, posting fallback results');
      window.kstuffMirrors.testing = false;
      
      const finalResults = {};
      Object.keys(FALLBACK_MIRRORS).forEach(key => {
        try {
          const cached = JSON.parse(getStorage(`kstuff_lastgood_${key}`));
          finalResults[key] = cached?.url || FALLBACK_MIRRORS[key];
        } catch {
          finalResults[key] = FALLBACK_MIRRORS[key];
        }
      });
      
      postMirrorUpdate(finalResults, isInitial);
    }, TEST_TIMEOUT_HARD);

    try {
      console.log('%c[MIRRORS.JS]', 'color: #4a7dff; font-weight: bold', isInitial ? 'Initial mirror test starting...' : 'Auto-refresh test starting...');

      const [
        scramJson,
        staticJson,
        uvJson,
        truffledJson,
        truffledData
      ] = await Promise.allSettled([
        fetchWithProxy('Assets/json/mirrors/scram.json').catch(() => []),
        fetchWithProxy('Assets/json/mirrors/static.json').catch(() => []),
        fetchWithProxy('Assets/json/mirrors/uv.json').catch(() => []),
        fetchWithProxy('Assets/json/mirrors/truffled.json').catch(() => []),
        fetchWithProxy('Assets/json/truffled.json').catch(() => null)
      ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));

      if (scramJson?.length) {
        if (scramJson[0]?.url) {
          FALLBACK_MIRRORS.scram = cleanUrl(scramJson[0].url) + (scramJson[0].final || '');
        }
        try {
          const scram = await getWorkingConfig(scramJson, 'scram');
          if (scram) {
            results.scram = cleanUrl(scram.url) + scram.final;
            testsPassed++;
          } else {
            testsFailed++;
          }
        } catch (e) {
          console.error('%c[MIRRORS.JS]', 'color: #ff7d4a; font-weight: bold', 'Scram test failed:', e.message);
          testsFailed++;
        }
      } else {
        console.warn('%c[MIRRORS.JS]', 'color: #ffd74a; font-weight: bold', 'No scram mirrors available');
        testsFailed++;
      }

      if (staticJson?.length) {
        if (staticJson[0]?.url) {
          FALLBACK_MIRRORS.static = cleanUrl(staticJson[0].url) + (staticJson[0].final || '');
        }
        try {
          const st = await getWorkingConfig(staticJson, 'static');
          if (st) {
            results.static = cleanUrl(st.url) + st.final;
            testsPassed++;
          } else {
            testsFailed++;
          }
        } catch (e) {
          console.error('%c[MIRRORS.JS]', 'color: #ff7d4a; font-weight: bold', 'Static test failed:', e.message);
          testsFailed++;
        }
      } else {
        console.warn('%c[MIRRORS.JS]', 'color: #ffd74a; font-weight: bold', 'No static mirrors available');
        testsFailed++;
      }

      if (uvJson?.length) {
        if (uvJson[0]?.url) {
          FALLBACK_MIRRORS.uv = cleanUrl(uvJson[0].url) + (uvJson[0].final || '');
        }
        try {
          const uv = await getWorkingConfig(uvJson, 'uv');
          if (uv) {
            results.uv = cleanUrl(uv.url) + uv.final;
            testsPassed++;
          } else {
            testsFailed++;
          }
        } catch (e) {
          console.error('%c[MIRRORS.JS]', 'color: #ff7d4a; font-weight: bold', 'UV test failed:', e.message);
          testsFailed++;
        }
      } else {
        console.warn('%c[MIRRORS.JS]', 'color: #ffd74a; font-weight: bold', 'No UV mirrors available');
        testsFailed++;
      }

      if (truffledJson?.length) {
        try {
          const tr = await getWorkingConfig(truffledJson, 'truffled');
          if (tr) {
            results.truffled = cleanUrl(tr.url);
            testsPassed++;
          } else {
            results.truffled = 'https://boat.strongson.com';
            console.warn('%c[MIRRORS.JS]', 'color: #ffd74a; font-weight: bold', 'No truffled mirrors working, using fallback');
            testsFailed++;
          }
        } catch (e) {
          console.error('%c[MIRRORS.JS]', 'color: #ff7d4a; font-weight: bold', 'Truffled test failed:', e.message);
          results.truffled = 'https://boat.strongson.com';
          testsFailed++;
        }
      } else {
        results.truffled = 'https://boat.strongson.com';
        console.warn('%c[MIRRORS.JS]', 'color: #ffd74a; font-weight: bold', 'No truffled mirrors available, using fallback');
        testsFailed++;
      }

      if (staticJson?.length) {
        if (staticJson[0]?.url) {
          FALLBACK_MIRRORS.frogiee = cleanUrl(staticJson[0].url);
        }
        try {
          const fr = await getWorkingConfig(
            staticJson.map(i => ({ url: i.url, img: i.img, final: "" })),
            'frogiee'
          );
          if (fr) {
            results.frogiee = cleanUrl(fr.url);
            testsPassed++;
          } else {
            testsFailed++;
          }
        } catch (e) {
          console.error('%c[MIRRORS.JS]', 'color: #ff7d4a; font-weight: bold', 'Frogiee test failed:', e.message);
          testsFailed++;
        }
      } else {
        testsFailed++;
      }

      Object.keys(FALLBACK_MIRRORS).forEach(key => {
        if (!results[key]) {
          try {
            const cached = JSON.parse(getStorage(`kstuff_lastgood_${key}`));
            results[key] = cached?.url || FALLBACK_MIRRORS[key];
            console.log('%c[MIRRORS.JS]', 'color: #4a7dff; font-weight: bold', `${key}: using cached/fallback`);
          } catch {
            results[key] = FALLBACK_MIRRORS[key];
          }
        }
      });

      console.log('%c[MIRRORS.JS]', 'color: #4a7dff; font-weight: bold', `Tests complete: ${testsPassed} passed, ${testsFailed} failed`);

      postMirrorUpdate(results, isInitial);

    } catch (err) {
      console.error('%c[MIRRORS.JS]', 'color: #ff7d4a; font-weight: bold', 'testAllMirrors exception:', err);
      
      const fallbackResults = {};
      Object.keys(FALLBACK_MIRRORS).forEach(key => {
        try {
          const cached = JSON.parse(getStorage(`kstuff_lastgood_${key}`));
          fallbackResults[key] = cached?.url || FALLBACK_MIRRORS[key];
        } catch {
          fallbackResults[key] = FALLBACK_MIRRORS[key];
        }
      });
      postMirrorUpdate(fallbackResults, isInitial);
      
    } finally {
      clearTimeout(testingTimeoutId);
      window.kstuffMirrors.testing = false;
    }
  }

  async function initMirrors() {
    console.log('%c[MIRRORS.JS]', 'color: #4a7dff; font-weight: bold', 'Initializing mirror system...');
    await testAllMirrors(true);
  }

  function startAutoRefresh() {
    console.log('%c[MIRRORS.JS]', 'color: #4a7dff; font-weight: bold', 'Starting auto-refresh (every 2 minutes)');
    
    setInterval(async () => {
      const changed = await refreshCommitHash();
      if (changed) {
        console.log('%c[MIRRORS.JS]', 'color: #4a7dff; font-weight: bold', 'Commit changed, testing mirrors...');
        await testAllMirrors(false);
      }
    }, AUTO_REFRESH_INTERVAL);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await initMirrors();
      startAutoRefresh();
    });
  } else {
    initMirrors();
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
