(function () {
  'use strict';

  const BARE_MUX_ESM =
    'https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.1.9/+esm';
  const BARE_MUX_WORKER =
    'https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.1.9/dist/worker.js';
  const EPOXY_TRANSPORT =
    'https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs';

  const CLONES_API =
    'https://getwebsiteclones.vercel.app/clones?url=';
  const JSON_API =
    'https://getwebsiteclones.vercel.app/api?url=';

  const COMMITS_API =
    'https://api.github.com/repos/lotsacookie/kstuff/commits?per_page=1';
  const WISP_LIST_BASE =
    'https://cdn.jsdelivr.net/gh/lotsacookie/kstuff';
  const WISP_LIST_PATH = '/Assets/json/mirrors/wisp.json';

  const MIRROR_TIMEOUT = 10000;
  const PROXY_TIMEOUT = 30000;
  const LIST_TIMEOUT = 15000;
  const FETCH_TIMEOUT = 120000;
  const REFRESH_INTERVAL = 120000;

  const targets = [
    {
      domain: 'frogiesarcade.win',
      path: '/stuff/logo.png',
      keys: ['static', 'frogiee']
    },
    {
      domain: 'truffled.lol',
      path: '/favicon.ico',
      keys: ['truffled']
    }
  ];

  const fallback = {
    scram: '',
    static: '',
    uv: '',
    truffled: 'https://boat.strongson.com',
    frogiee: ''
  };

  const style = {
    info: 'color:#4a7dff;font-weight:bold',
    warn: 'color:#ffd74a;font-weight:bold',
    error: 'color:#ff7d4a;font-weight:bold'
  };

  const log = (...args) =>
    console.log('%c[MIRRORS.JS]', style.info, ...args);

  const warn = (...args) =>
    console.warn('%c[MIRRORS.JS]', style.warn, ...args);

  const error = (...args) =>
    console.error('%c[MIRRORS.JS]', style.error, ...args);

  const clean = value => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\/+$/, '');
  };

  const validUrl = value =>
    typeof value === 'string' &&
    /^https?:\/\/[^\s"'{}<>]+$/i.test(value.trim());

  const validWisp = value =>
    typeof value === 'string' &&
    /^wss:\/\/[^\s"'{}<>,\[\]]+$/i.test(value.trim());

  const storageGet = key => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const storageSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      return false;
    }

    return true;
  };

  const storageRemove = key => {
    try {
      localStorage.removeItem(key);
    } catch {
      return false;
    }

    return true;
  };

  const timeout = (promise, milliseconds, label) =>
    new Promise((resolve, reject) => {
      let complete = false;

      const timer = setTimeout(() => {
        if (complete) return;
        complete = true;
        reject(new Error(`${label} timed out`));
      }, milliseconds);

      Promise.resolve(promise).then(
        value => {
          if (complete) return;
          complete = true;
          clearTimeout(timer);
          resolve(value);
        },
        reason => {
          if (complete) return;
          complete = true;
          clearTimeout(timer);
          reject(reason);
        }
      );
    });

  window.kstuffMirrors = {
    ...fallback,
    wisp: '',
    lastUpdate: 0,
    testing: false,
    status: 'initializing',
    sources: {}
  };

  let clientPromise = null;
  let running = false;

  async function fetchDirect(url, milliseconds) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), milliseconds);

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  async function getLatestCommit() {
    const response = await fetchDirect(COMMITS_API, LIST_TIMEOUT);
    const data = await response.json();
    const sha = Array.isArray(data) ? data[0]?.sha : data?.sha;

    if (typeof sha !== 'string' || !/^[0-9a-f]{40}$/i.test(sha)) {
      throw new Error('GitHub API returned no valid commit');
    }

    return sha;
  }

  function parseWispList(text) {
    const raw = String(text || '').trim();

    if (!raw) {
      return [];
    }

    let values = [];

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        values = parsed;
      } else if (parsed && typeof parsed === 'object') {
        const list = Object.values(parsed).find(Array.isArray);

        if (list) {
          values = list;
        }
      }
    } catch {
      values = raw.match(/wss:\/\/[^\s"'<>,\[\]]+/gi) || [];
    }

    return [
      ...new Set(
        values
          .filter(value => typeof value === 'string')
          .map(value => value.trim())
          .filter(validWisp)
      )
    ];
  }

  async function loadWispList() {
    try {
      const sha = await getLatestCommit();

      log(`Latest commit: ${sha.slice(0, 7)}`);

      const response = await fetchDirect(
        `${WISP_LIST_BASE}@${sha}${WISP_LIST_PATH}`,
        LIST_TIMEOUT
      );

      const list = parseWispList(await response.text());

      if (list.length) {
        return list;
      }

      warn('Commit wisp.json had no servers');
    } catch (err) {
      warn(
        'Latest commit fetch failed, using direct fetch:',
        err?.message || err
      );
    }

    try {
      const response = await fetchDirect(
        `${WISP_LIST_BASE}${WISP_LIST_PATH}?cb=${Date.now()}-${Math.random().toString(36).slice(2)}`,
        LIST_TIMEOUT
      );

      return parseWispList(await response.text());
    } catch (err) {
      warn('Direct wisp.json fetch failed:', err?.message || err);
      return [];
    }
  }

  async function getWispServers() {
    const list = await loadWispList();

    log(`Loaded ${list.length} Wisp servers`);

    return list;
  }

  async function setupProxy() {
    try {
      log('Loading BareMux...');

      const module = await import(BARE_MUX_ESM);
      const BareMuxConnection = module.BareMuxConnection;
      const BareClient = module.BareClient;

      if (!BareMuxConnection || !BareClient) {
        throw new Error('BareMux exports were not found');
      }

      const workerCode =
        `importScripts("${BARE_MUX_WORKER}");`;

      const blob = new Blob([workerCode], {
        type: 'text/javascript'
      });

      const workerUrl = URL.createObjectURL(blob);
      const connection = new BareMuxConnection(workerUrl);
      const servers = await getWispServers();

      if (!servers.length) {
        throw new Error('wisp.json returned no Wisp servers');
      }

      for (const server of servers) {
        try {
          log(`Trying Wisp server: ${server}`);

          await timeout(
            connection.setTransport(
              EPOXY_TRANSPORT,
              [{ wisp: server }]
            ),
            PROXY_TIMEOUT,
            'Proxy setup'
          );

          const client = new BareClient();

          window.kstuffMirrors.wisp = server;

          log(`Proxy Ready: ${server}`);

          return client;
        } catch (err) {
          warn(
            `Wisp server failed: ${server}`,
            err?.message || err
          );
        }
      }

      throw new Error('No working Wisp server found');
    } catch (err) {
      error('Proxy setup failed:', err?.message || err);
      return null;
    }
  }

  function getClient() {
    if (!clientPromise) {
      clientPromise = setupProxy().then(client => {
        if (!client) {
          clientPromise = null;
        }

        return client;
      });
    }

    return clientPromise;
  }

  async function fetchText(client, url) {
    log(`Fetching: ${url}`);

    const response = await timeout(
      client.fetch(url),
      FETCH_TIMEOUT,
      'Proxy fetch'
    );

    if (!response || !response.ok) {
      throw new Error(
        `Proxy returned HTTP ${response?.status || 'unknown'}`
      );
    }

    return response.text();
  }

  function parseDomains(text) {
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
          .map(value => clean(value))
          .filter(validUrl)
      )
    ];
  }

  async function getDomains(client, domain) {
    const urls = [
      `${CLONES_API}${domain}`,
      `${JSON_API}${encodeURIComponent(domain)}`
    ];

    let lastError = null;

    for (const url of urls) {
      try {
        const text = await fetchText(client, url);
        const domains = parseDomains(text);

        if (domains.length) {
          log(
            `Received ${domains.length} mirrors for ${domain}`
          );

          return domains;
        }

        warn(`No domains returned from ${url}`);
      } catch (err) {
        lastError = err;
        warn(
          `Request failed for ${url}:`,
          err?.message || err
        );
      }
    }

    clientPromise = null;

    throw (
      lastError ||
      new Error(`No mirrors returned for ${domain}`)
    );
  }

  function testMirror(baseUrl, testPath) {
    return new Promise(resolve => {
      const image = new Image();
      let finished = false;

      const finish = result => {
        if (finished) return;

        finished = true;
        clearTimeout(timer);
        image.onload = null;
        image.onerror = null;
        image.src = '';

        resolve(result);
      };

      const timer = setTimeout(() => {
        finish(false);
      }, MIRROR_TIMEOUT);

      image.onload = () => finish(true);
      image.onerror = () => finish(false);

      const cacheBuster =
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const path = testPath.startsWith('/')
        ? testPath
        : `/${testPath}`;

      image.src =
        `${clean(baseUrl)}${path}?cb=${cacheBuster}`;
    });
  }

  function getSavedMirror(target) {
    for (const key of target.keys) {
      const saved = storageGet(`kstuff_lastgood_${key}`);

      if (saved && validUrl(saved)) {
        return clean(saved);
      }
    }

    return null;
  }

  function saveMirror(target, url) {
    const value = clean(url);

    target.keys.forEach(key => {
      storageSet(`kstuff_lastgood_${key}`, value);
      fallback[key] = value;
    });
  }

  function removeSavedMirror(target) {
    target.keys.forEach(key => {
      storageRemove(`kstuff_lastgood_${key}`);
    });
  }

  function publish(target, url, source) {
    const value = clean(url);
    const sources = {
      ...(window.kstuffMirrors.sources || {})
    };

    target.keys.forEach(key => {
      window.kstuffMirrors[key] = value;
      sources[key] = source;
    });

    window.kstuffMirrors.sources = sources;
    window.kstuffMirrors.lastUpdate = Date.now();
    window.kstuffMirrors.status = 'ready';

    log(`${target.domain}: ${value}`);

    window.dispatchEvent(
      new CustomEvent('kstuff-mirrors-updated', {
        detail: window.kstuffMirrors
      })
    );
  }

  async function findMirror(target) {
    const saved = getSavedMirror(target);

    if (saved) {
      log(`Testing saved mirror: ${saved}`);

      if (await testMirror(saved, target.path)) {
        log(`Saved mirror works: ${saved}`);
        return {
          url: saved,
          source: 'cache'
        };
      }

      warn(`Saved mirror failed: ${saved}`);
      removeSavedMirror(target);
    }

    const client = await getClient();

    if (!client) {
      throw new Error('Proxy client unavailable');
    }

    const domains = await getDomains(
      client,
      target.domain
    );

    for (const domain of domains) {
      log(`Testing mirror: ${domain}`);

      if (await testMirror(domain, target.path)) {
        log(`Working mirror found: ${domain}`);

        saveMirror(target, domain);

        return {
          url: domain,
          source: 'wisp'
        };
      }

      log(`Mirror failed: ${domain}`);
    }

    throw new Error(
      `No working mirror found for ${target.domain}`
    );
  }

  async function findTarget(target) {
    try {
      const result = await findMirror(target);

      publish(
        target,
        result.url,
        result.source
      );
    } catch (err) {
      error(
        `${target.domain} search failed:`,
        err?.message || err
      );

      if (fallback[target.keys[0]]) {
        publish(
          target,
          fallback[target.keys[0]],
          'fallback'
        );
      }
    }
  }

  async function update() {
    if (running) {
      log('Search already running');
      return;
    }

    running = true;
    window.kstuffMirrors.testing = true;

    try {
      log('Starting mirror search');

      await getClient();

      for (const target of targets) {
        await findTarget(target);
      }

      window.kstuffMirrors.status = 'ready';
      window.kstuffMirrors.lastUpdate = Date.now();

      log('Mirror search complete');
    } catch (err) {
      error(
        'Mirror search crashed:',
        err?.message || err
      );
    } finally {
      running = false;
      window.kstuffMirrors.testing = false;
    }
  }

  window.kstuffTestMirrors = update;

  window.kstuffMirrorsDebug = () => {
    console.table({
      scram: window.kstuffMirrors.scram,
      static: window.kstuffMirrors.static,
      uv: window.kstuffMirrors.uv,
      truffled: window.kstuffMirrors.truffled,
      frogiee: window.kstuffMirrors.frogiee,
      wisp: window.kstuffMirrors.wisp,
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

  function start() {
    update().catch(err => {
      error(
        'Startup failed:',
        err?.message || err
      );
    });

    setInterval(() => {
      update().catch(err => {
        error(
          'Refresh failed:',
          err?.message || err
        );
      });
    }, REFRESH_INTERVAL);
  }

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
