(function initMirrors() {
  const cleanUrl = u => u ? u.replace(/\/+$/, '') : '';
  const trimSlash = u => u ? u.replace(/^\/+/, '') : '';
  const getStorage = k => localStorage.getItem(k);
  const setStorage = (k, v) => localStorage.setItem(k, v);

  window.kstuffMirrors = {
    scram: null,
    static: null,
    uv: null,
    truffled: null,
    frogiee: null,
    lastUpdate: 0,
    testing: false
  };

  const MIRROR_TEST_TIMEOUT = 5000;
  const AUTO_REFRESH_INTERVAL = 120000;
  let commitEtag = null;
  let cachedCommitHash = null;

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

  function postMirrorUpdate(mirrors) {
    window.kstuffMirrors = {
      ...window.kstuffMirrors,
      ...mirrors,
      lastUpdate: Date.now()
    };

    window.dispatchEvent(new CustomEvent('kstuff-mirrors-updated', {
      detail: window.kstuffMirrors
    }));

    console.log('Mirrors updated:', window.kstuffMirrors);
  }

  async function testAllMirrors() {
    if (window.kstuffMirrors.testing) return;
    window.kstuffMirrors.testing = true;

    try {
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

      const results = {};

      if (scramJson?.length) {
        const scram = await getWorkingConfig(scramJson, 'scram');
        if (scram) {
          results.scram = cleanUrl(scram.url) + scram.final;
        }
      }

      if (staticJson?.length) {
        const st = await getWorkingConfig(staticJson, 'static');
        if (st) {
          results.static = cleanUrl(st.url) + st.final;
        }
      }

      if (uvJson?.length) {
        const uv = await getWorkingConfig(uvJson, 'uv');
        if (uv) {
          results.uv = cleanUrl(uv.url) + uv.final;
        }
      }

      if (truffledJson?.length) {
        const tr = await getWorkingConfig(truffledJson, 'truffled');
        if (tr) {
          results.truffled = cleanUrl(tr.url);
        } else {
          results.truffled = 'https://boat.strongson.com';
        }
      } else {
        results.truffled = 'https://boat.strongson.com';
      }

      if (staticJson?.length) {
        const fr = await getWorkingConfig(
          staticJson.map(i => ({ url: i.url, img: i.img, final: "" })),
          'frogiee'
        );
        if (fr) {
          results.frogiee = cleanUrl(fr.url);
        }
      }

      postMirrorUpdate(results);

    } catch (err) {
      console.error('testAllMirrors failed:', err);
    } finally {
      window.kstuffMirrors.testing = false;
    }
  }


  async function initMirrors() {
    console.log('Initializing mirrors...');
    await testAllMirrors();
  }


  function startAutoRefresh() {
    setInterval(async () => {
      const changed = await refreshCommitHash();
      if (changed) {
        console.log('Commit changed, testing mirrors...');
        await testAllMirrors();
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

  window.kstuffTestMirrors = testAllMirrors;
})();
