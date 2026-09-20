(function () {
  'use strict';

  const WISP_SERVER = 'wss://wisp.mercurywork.shop/';
  const BARE_MUX_ESM =
    'https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.1.9/+esm';
  const BARE_MUX_WORKER =
    'https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.1.9/dist/worker.js';
  const EPOXY_TRANSPORT =
    'https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs';

  const CLONES_ENDPOINT =
    'https://getwebsiteclones.vercel.app/clones?url=';
  const API_ENDPOINT =
    'https://getwebsiteclones.vercel.app/api?url=';

  const MIRROR_TEST_TIMEOUT = 10000;
  const WISP_SETUP_TIMEOUT = 30000;
  const CLONE_FETCH_TIMEOUT = 120000;
  const AUTO_REFRESH_INTERVAL = 120000;
  const JSON_STOPGAP_DELAY = 10000;

  const FALLBACK_MIRRORS = {
    scram: '',
    static: '',
    uv: '',
    truffled: 'https://boat.strongson.com',
    frogiee: ''
  };

  const CLONE_TARGETS = [
    {
      domain: 'truffled.lol',
      testPath: '/favicon.ico',
      keys: ['truffled'],
      jsonFile: 'truffled.json'
    },
    {
      domain: 'frogiesarcade.win',
      testPath: '/stuff/logo.png',
      keys: ['static', 'frogiee'],
      jsonFile: 'frogiee.json'
    }
  ];

  const CLONE_KEYS = CLONE_TARGETS.flatMap(target => target.keys);

  const STYLE = {
    info: 'color:#4a7dff;font-weight:bold',
    warn: 'color:#ffd74a;font-weight:bold',
    error: 'color:#ff7d4a;font-weight:bold'
  };

  const log = (...args) =>
    console.log('%c[MIRRORS.JS]', STYLE.info, ...args);

  const warn = (...args) =>
    console.warn('%c[MIRRORS.JS]', STYLE.warn, ...args);

  const fail = (...args) =>
    console.error('%c[MIRRORS.JS]', STYLE.error, ...args);

  const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  const cleanUrl = value => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\/+$/, '');
  };

  const isHttpUrl = value =>
    typeof value === 'string' &&
    /^https?:\/\/[^\s"'{}<>]+$/i.test(value.trim());

  const getStorage = key => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const setStorage = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
    }
  };

  const removeStorage = key => {
    try {
      localStorage.removeItem(key);
    } catch {
    }
  };

  window.kstuffMirrors = {
    scram: '',
    static: '',
    uv: '',
    truffled: FALLBACK_MIRRORS.truffled,
    frogiee: '',
    lastUpdate: 0,
    testing: false,
    status: 'initializing'
  };

  function withTimeout(promise, milliseconds, label) {
    return new Promise((resolve, reject) => {
      let finished = false;

      const timer = setTimeout(() => {
        if (finished) return;
        finished = true;
        reject(
          new Error(`${label} timed out after ${milliseconds}ms`)
        );
      }, milliseconds);

      Promise.resolve(promise).then(
        value => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          resolve(value);
        },
        error => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  }

  let clientPromise = null;

  async function setupBareClient() {
    try {
      const {
        BareMuxConnection,
        BareClient
      } = await import(BARE_MUX_ESM);

      const workerCode =
        `importScripts("${BARE_MUX_WORKER}");`;

      const blob = new Blob([workerCode], {
        type: 'text/javascript'
      });

      const workerUrl = URL.createObjectURL(blob);
      const connection = new BareMuxConnection(workerUrl);

      await connection.setTransport(
        EPOXY_TRANSPORT,
        [{ wisp: WISP_SERVER }]
      );

      log('Proxy Ready');

      return new BareClient();
    } catch (error) {
      fail(
        'Proxy setup failed:',
        error?.message || error
      );

      return null;
    }
  }

  function getBareClient() {
    if (!clientPromise) {
      clientPromise = withTimeout(
        setupBareClient(),
        WISP_SETUP_TIMEOUT,
        'Wisp setup'
      ).catch(error => {
        fail(error?.message || error);
        clientPromise = null;
        return null;
      });
    }

    return clientPromise;
  }

  async function fetchThroughWisp(client, url) {
    const response = await withTimeout(
      client.fetch(url),
      CLONE_FETCH_TIMEOUT,
      'Wisp request'
    );

    if (!response || !response.ok) {
      throw new Error(
        `Proxy returned ${response?.status || 'no response'}`
      );
    }

    return response.text();
  }

  function parseCloneList(text) {
    const raw = String(text || '').trim();

    if (!raw) {
      return [];
    }

    let values = [];

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        values = parsed;
      } else if (Array.isArray(parsed.domains)) {
        values = parsed.domains;
      } else if (Array.isArray(parsed.clones)) {
        values = parsed.clones;
      } else if (typeof parsed === 'string') {
        values = parsed.split(/\r?\n/);
      }
    } catch {
      values = raw.split(/\r?\n/);
    }

    return [
      ...new Set(
        values
          .filter(value => typeof value === 'string')
          .map(value => value.trim())
          .filter(isHttpUrl)
          .map(cleanUrl)
      )
    ];
  }

  async function getCloneList(client, domain) {
    const endpoints = [
      `${CLONES_ENDPOINT}${domain}`,
      `${API_ENDPOINT}${encodeURIComponent(domain)}`
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        log(`Fetching clone list: ${endpoint}`);

        const text = await fetchThroughWisp(
          client,
          endpoint
        );

        const list = parseCloneList(text);

        if (list.length > 0) {
          log(
            `Received ${list.length} clone URLs for ${domain}`
          );

          return list;
        }

        warn(`Empty clone list received from ${endpoint}`);
      } catch (error) {
        lastError = error;

        warn(
          `Clone-list request failed: ${endpoint}`,
          error?.message || error
        );
      }
    }

    throw (
      lastError ||
      new Error(`No clone URLs were returned for ${domain}`)
    );
  }

  function testMirror(baseUrl, testPath) {
    return new Promise(resolve => {
      const image = new Image();
      let completed = false;

      const finish = result => {
        if (completed) return;

        completed = true;
        clearTimeout(timer);

        image.onload = null;
        image.onerror = null;
        image.src = '';

        resolve(result);
      };

      const timer = setTimeout(() => {
        finish(false);
      }, MIRROR_TEST_TIMEOUT);

      image.onload = () => finish(true);
      image.onerror = () => finish(false);

      const cacheBuster =
        `${Date.now()}${Math.random().toString(36).slice(2)}`;

      const path = testPath.startsWith('/')
        ? testPath
        : `/${testPath}`;

      image.src =
        `${cleanUrl(baseUrl)}${path}?cb=${cacheBuster}`;
    });
  }

  function readStoredMirror(target) {
    for (const key of target.keys) {
      const value = getStorage(
        `kstuff_lastgood_${key}`
      );

      if (value && isHttpUrl(value)) {
        return cleanUrl(value);
      }
    }

    return null;
  }

  function storeMirror(target, url) {
    const clean = cleanUrl(url);

    target.keys.forEach(key => {
      setStorage(
        `kstuff_lastgood_${key}`,
        clean
      );
    });

    target.keys.forEach(key => {
      FALLBACK_MIRRORS[key] = clean;
    });
  }

  function removeStoredMirror(target) {
    target.keys.forEach(key => {
      removeStorage(
        `kstuff_lastgood_${key}`
      );
    });
  }

  async function findWorkingMirror(target) {
    const savedMirror = readStoredMirror(target);

    if (savedMirror) {
      log(`Found saved mirror: ${savedMirror}`);
      log('Testing saved mirror...');

      if (
        await testMirror(
          savedMirror,
          target.testPath
        )
      ) {
        log('Saved mirror is still working');
        return {
          url: savedMirror,
          via: 'cache'
        };
      }

      warn(
        'Saved mirror failed; removing it from storage'
      );

      removeStoredMirror(target);
    }

    const client = await getBareClient();

    if (!client) {
      throw new Error('Proxy failed to initialize');
    }

    let cloneList;

    try {
      log(`Fetching URL list for ${target.domain}...`);
      cloneList = await getCloneList(
        client,
        target.domain
      );

      log(
        `Successfully fetched ${cloneList.length} URLs ` +
        `for ${target.domain}`
      );
    } catch (error) {
      throw new Error(
        `Failed to fetch clone list: ` +
        `${error?.message || error}`
      );
    }

    for (const url of cloneList) {
      log(`Testing: ${url}`);

      const working = await testMirror(
        url,
        target.testPath
      );

      if (working) {
        log(`Found working mirror: ${url}`);

        storeMirror(target, url);

        return {
          url,
          via: 'wisp'
        };
      }

      log(`Mirror failed: ${url}`);
    }

    throw new Error(
      `Exhausted all ${cloneList.length} URLs; ` +
      `no working mirror was found`
    );
  }

  let commitHash = 'main';

  async function refreshCommitHash() {
    try {
      const response = await fetch(
        'https://api.github.com/repos/lotsacookie/kstuff/commits/main',
        {
          cache: 'no-store'
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data?.sha) {
        commitHash = data.sha;
      }
    } catch (error) {
      warn(
        'Could not refresh repository commit:',
        error?.message || error
      );
    }
  }

  async function fetchJsonAsset(path) {
    await refreshCommitHash();

    const urls = [
      `https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@${commitHash}/${path}`,
      path
    ];

    for (const url of urls) {
      try {
        const response = await fetch(
          `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`,
          {
            cache: 'no-store'
          }
        );

        if (!response.ok) {
          continue;
        }

        return await response.json();
      } catch {
      }
    }

    throw new Error(`Unable to fetch ${path}`);
  }

  async function tryLocalJsonFallback(target, isInitial) {
    if (window.kstuffMirrors[target.keys[0]]) {
      return;
    }

    try {
      warn(
        `Trying local JSON fallback for ${target.domain}`
      );

      const table = await fetchJsonAsset(
        `Assets/json/mirrors/${target.jsonFile}`
      );

      if (!Array.isArray(table)) {
        return;
      }

      for (const entry of table) {
        if (!entry || !isHttpUrl(entry.url)) {
          continue;
        }

        const working = await testMirror(
          entry.url,
          entry.img || target.testPath
        );

        if (working) {
          const url = cleanUrl(entry.url);

          storeMirror(target, url);
          publishMirror(target, url, 'json', isInitial);

          return;
        }
      }
    } catch (error) {
      warn(
        `Local JSON fallback failed for ${target.domain}:`,
        error?.message || error
      );
    }
  }

  function publishMirror(
    target,
    url,
    via,
    isInitial
  ) {
    const clean = cleanUrl(url);
    const update = {};

    target.keys.forEach(key => {
      update[key] = clean;
    });

    const sources = {
      ...(window.kstuffMirrors.sources || {})
    };

    target.keys.forEach(key => {
      sources[key] = via;
    });

    window.kstuffMirrors = {
      ...window.kstuffMirrors,
      ...update,
      sources,
      lastUpdate: Date.now(),
      status: 'ready'
    };

    log(`${target.domain} -> ${clean} (${via})`);

    window.dispatchEvent(
      new CustomEvent('kstuff-mirrors-updated', {
        detail: window.kstuffMirrors
      })
    );
  }

  function publishGeneralMirrors(
    mirrors,
    isInitial
  ) {
    const update = {
      ...mirrors,
      lastUpdate: Date.now(),
      status: 'ready'
    };

    window.kstuffMirrors = {
      ...window.kstuffMirrors,
      ...update
    };

    log('General mirror update:', {
      scram: Boolean(window.kstuffMirrors.scram),
      uv: Boolean(window.kstuffMirrors.uv),
      isInitial
    });

    window.dispatchEvent(
      new CustomEvent('kstuff-mirrors-updated', {
        detail: window.kstuffMirrors
      })
    );
  }

  async function updateGeneralMirror(
    key,
    fileName
  ) {
    try {
      const table = await fetchJsonAsset(
        `Assets/json/mirrors/${fileName}`
      );

      if (!Array.isArray(table) || !table.length) {
        return '';
      }

      for (const entry of table) {
        if (!entry || !isHttpUrl(entry.url)) {
          continue;
        }

        const working = await testMirror(
          entry.url,
          entry.img || '/favicon.ico'
        );

        if (working) {
          const result =
            cleanUrl(entry.url) +
            (entry.final || '');

          setStorage(
            `kstuff_lastgood_${key}`,
            JSON.stringify(entry)
          );

          FALLBACK_MIRRORS[key] = result;

          return result;
        }
      }

      return cleanUrl(table[0].url) +
        (table[0].final || '');
    } catch (error) {
      warn(
        `${key} mirror update failed:`,
        error?.message || error
      );

      return FALLBACK_MIRRORS[key] || '';
    }
  }

  let activeSearches = new Map();

  function startCloneSearch(target, isInitial) {
    if (activeSearches.has(target.domain)) {
      return activeSearches.get(target.domain);
    }

    const search = (async () => {
      let fallbackTimer = null;

      try {
        fallbackTimer = setTimeout(() => {
          tryLocalJsonFallback(
            target,
            isInitial
          ).catch(() => {});
        }, JSON_STOPGAP_DELAY);

        const result = await findWorkingMirror(target);

        publishMirror(
          target,
          result.url,
          result.via,
          isInitial
        );
      } catch (error) {
        fail(
          `${target.domain} mirror search failed:`,
          error?.message || error
        );
      } finally {
        clearTimeout(fallbackTimer);
        activeSearches.delete(target.domain);
      }
    })();

    activeSearches.set(target.domain, search);

    return search;
  }

  async function testAllMirrors(isInitial = false) {
    if (window.kstuffMirrors.testing) {
      log('Mirror test already running');
      return;
    }

    window.kstuffMirrors.testing = true;

    try {
      log(
        isInitial
          ? 'Initial mirror search starting...'
          : 'Mirror refresh starting...'
      );

      CLONE_TARGETS.forEach(target => {
        startCloneSearch(target, isInitial);
      });

      const [scram, uv] = await Promise.all([
        updateGeneralMirror('scram', 'scram.json'),
        updateGeneralMirror('uv', 'uv.json')
      ]);

      publishGeneralMirrors(
        {
          scram,
          uv
        },
        isInitial
      );
    } catch (error) {
      fail(
        'Mirror update failed:',
        error?.message || error
      );
    } finally {
      window.kstuffMirrors.testing = false;
    }
  }

  function start() {
    log('Initializing mirror system...');

    testAllMirrors(true).catch(error => {
      fail(error?.message || error);
    });

    setInterval(() => {
      testAllMirrors(false).catch(error => {
        fail(error?.message || error);
      });
    }, AUTO_REFRESH_INTERVAL);
  }

  window.kstuffTestMirrors = () =>
    testAllMirrors(false);

  window.kstuffMirrorsDebug = () => {
    console.table({
      scram: window.kstuffMirrors.scram,
      static: window.kstuffMirrors.static,
      uv: window.kstuffMirrors.uv,
      truffled: window.kstuffMirrors.truffled,
      frogiee: window.kstuffMirrors.frogiee,
      status: window.kstuffMirrors.status,
      testing: window.kstuffMirrors.testing,
      lastUpdate: window.kstuffMirrors.lastUpdate
        ? new Date(
            window.kstuffMirrors.lastUpdate
          ).toLocaleTimeString()
        : 'never'
    });

    return window.kstuffMirrors;
  };

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      start,
      { once: true }
    );
  } else {
    start();
  }
})();
