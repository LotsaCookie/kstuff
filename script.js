function initApp() {
  const $ = id => document.getElementById(id), $$ = sel => document.querySelectorAll(sel);
  const el = (tag, props) => Object.assign(document.createElement(tag), props);
  const getStorage = k => localStorage.getItem(k), setStorage = (k, v) => localStorage.setItem(k, v);
  const cleanUrl = u => u ? u.replace(/\/+$/, '') : '', trimSlash = u => u ? u.replace(/^\/+/, '') : '';
  const cleanGameTitle = t => (t || '').toLowerCase().replace(/,\s*webport/gi, '').trim();
  const urlMap = { 'mathworksheets': 'home', 'readingcorner': 'games', 'sciencequiz': 'apps', 'gradebook': 'music', 'lessonplanner': 'ai', 'vms': 'vms', 'studyhall': 'chat' };
  const reverseUrlMap = Object.entries(urlMap).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});
  let history = ['kstuff://home'], historyIndex = 0;

  const iframePages = {
    mathworksheets: { id: 'mathworksheets-iframe', path: 'Assets/pages/browser.html' },
    gradebook: { id: 'gradebook-iframe', path: 'Assets/pages/music.html' },
    lessonplanner: { id: 'lessonplanner-iframe', path: 'Assets/pages/ai.html' },
    studyhall: { id: 'studyhall-iframe', path: 'Assets/pages/chat.html' },
    vms: { id: 'vms-iframe', path: 'Assets/pages/vms.html' }
  };

  const encodeUv = str => !str ? str : encodeURIComponent(str.toString().split('').map((char, ind) => ind % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char).join(''));

  const formatWebUrl = rawUrl => {
    let val = rawUrl.trim();
    if (!val) return '';
    if (val.startsWith('kstuff://')) return val;
    if (val.match(/^https?:\/\//)) return val;
    if (val.includes('.') && !val.includes(' ')) return 'https://' + val;
    return 'https://duckduckgo.com/?q=' + encodeURIComponent(val);
  };

  const tbInput = $('textbook-input') || $('textbook-url');
  const studyIframe = $('study-iframe') || $('browser-iframe');
  const sBack = $('study-back-btn') || $('browser-back');
  const sFwd = $('study-forward-btn') || $('browser-forward');
  const sReload = $('reload-study-btn') || $('browser-refresh');
  const sHome = $('home-study-btn') || $('browser-home');
  const pageAddress = id => 'kstuff://' + (urlMap[id] || id);
  const setAddress = value => { if (tbInput) tbInput.value = value; };
  const body = document.body, navBar = $('teachertouchbar'), navBtns = $$('.nav-btn'), pages = $$('.page');
  const loader = document.querySelector('.section-loader'), modalOverlay = $('resource-modal');
  const modalIframe = $('resource-modal-iframe'), modalTitle = $('resource-modal-title'), pContainer = $('profile-edit-container');

  const ITEMS_PER_PAGE = 48;
  const IMAGE_LOAD_TIMEOUT = 5000;
  const FETCH_TIMEOUT = 10000;
  const SHA_FETCH_TIMEOUT = 6000;
  const SHA_TTL = 30000;
  const IFRAME_SHOW_TIMEOUT = 2500;
  const BACKEND_LINK_TIMEOUT = 15000;
  const BACKEND_WATCHDOG_INTERVAL = 4000;
  const AUTH_TIMEOUT = 90000;
  const BACKEND_URLS = [
    'https://cdn.jsdelivr.net/gh/lotsacookie/Dnekcabtset/backend.svg',
    'https://cdn.jsdelivr.net/gh/lotsacookie/Dnekcabtset@main/backend.svg',
    'https://fastly.jsdelivr.net/gh/lotsacookie/Dnekcabtset/backend.svg',
    'https://gcore.jsdelivr.net/gh/lotsacookie/Dnekcabtset/backend.svg',
    'https://testingcf.jsdelivr.net/gh/lotsacookie/Dnekcabtset/backend.svg'
  ];
  const DEFAULT_PIC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cpath fill='%23888' d='M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-61.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,133.52,0Z'/%3E%3C/svg%3E";
  const MAX_UNDERSCORES = 2, MAX_USERNAME_LENGTH = 20;
  const dbg = (...args) => console.log('[kstuff-backend]', ...args);

  let backendPort = null, backendLinked = false, backendReady = false, syncInterval = null, currentUser = null;
  let backendFrame = null, backendLinkTimer = null, backendAttempts = 0, backendUrlIndex = 0;
  let authBusyTimer = null;
  const backendQueue = [];
  let gRep = {}, gTruf = new Map();

  let mirrorsScriptFailed = false;
  let mirrorsScriptLoaded = false;

  const MIRROR_PH = /\$\{(scram|static|uv|frogiee|truffled)\}/;

  const lastGoodMirror = key => {
    try {
      const value = getStorage(`kstuff_lastgood_${key}`);
      return /^https?:\/\/[^\s{}"']+$/i.test(value || '')
        ? cleanUrl(value)
        : '';
    } catch {
      return '';
    }
  };

  const getMirrorValue = (mirrors, key) => {
    const value = mirrors?.[key];

    if (
      typeof value === 'string' &&
      /^https?:\/\//i.test(value)
    ) {
      return cleanUrl(value);
    }

    return lastGoodMirror(key);
  };

  function mirrorsToGRep(mirrors = window.kstuffMirrors || {}) {
    const result = {};

    ['scram', 'static', 'uv', 'frogiee', 'truffled'].forEach(key => {
      result[key] = getMirrorValue(mirrors, key);
    });

    if (!result.truffled) {
      result.truffled = 'https://boat.strongson.com';
    }

    return result;
  }

  function syncMirrors(mirrors = window.kstuffMirrors || {}) {
    const next = mirrorsToGRep(mirrors);
    const changed = JSON.stringify(next) !== JSON.stringify(gRep);

    gRep = next;

    return changed;
  }

  const lastIframeHtml = {};
  const iframeLoadFailed = {};
  const iframeLoadTokens = {};
  const iframeInFlight = {};

  const MUSIC_IFRAME_ID = 'gradebook-iframe';
  const KEEP_ALIVE_IFRAMES = new Set([MUSIC_IFRAME_ID]);
  let musicState = null;

  const isKeepAliveLoaded = id =>
    KEEP_ALIVE_IFRAMES.has(id) && !!$(id)?.srcdoc && !iframeLoadFailed[id] && !iframeInFlight[id];

  const MINI_ICONS = {
    prev: '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
  };

  document.head.appendChild(el('style', {
    textContent: `
      .mini-player{display:flex;align-items:center;gap:6px;flex-shrink:0;max-width:340px;margin-left:8px;}
      .mini-player[hidden]{display:none;}
      .mini-player-cover{width:30px;height:30px;border-radius:6px;object-fit:cover;flex-shrink:0;background:rgba(128,128,128,.25);}
      .mini-player-cover.no-art{display:none;}
      .mini-player-text{display:flex;flex-direction:column;min-width:0;max-width:170px;line-height:1.15;}
      .mini-player-title,.mini-player-artist{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .mini-player-title{font-size:.78rem;font-weight:700;}
      .mini-player-artist{font-size:.68rem;opacity:.7;}
      .mini-player .study-nav-btn:disabled{opacity:.35;cursor:not-allowed;}
      @media (max-width:760px){.mini-player-text{display:none;}}
    `
  }));

  const miniPlayer = el('div', {
    className: 'mini-player',
    hidden: false,
    innerHTML: `
      <img class="mini-player-cover no-art" alt="">
      <div class="mini-player-text">
        <div class="mini-player-title">Nothing playing</div>
        <div class="mini-player-artist"></div>
      </div>
      <button type="button" class="study-nav-btn" data-act="prev" title="Previous song">${MINI_ICONS.prev}</button>
      <button type="button" class="study-nav-btn" data-act="toggle" title="Play / Pause">${MINI_ICONS.play}</button>
      <button type="button" class="study-nav-btn" data-act="next" title="Next song">${MINI_ICONS.next}</button>
    `
  });
  document.querySelector('.learning-header')?.appendChild(miniPlayer);

  const miniCover = miniPlayer.querySelector('.mini-player-cover');
  const miniTitle = miniPlayer.querySelector('.mini-player-title');
  const miniArtist = miniPlayer.querySelector('.mini-player-artist');
  const miniPrev = miniPlayer.querySelector('[data-act="prev"]');
  const miniToggle = miniPlayer.querySelector('[data-act="toggle"]');
  const miniNext = miniPlayer.querySelector('[data-act="next"]');

  function renderMiniPlayer(state) {
    musicState = state && state.hasTrack ? state : null;
    if (!musicState) {
      miniPlayer.hidden = false;
      return;
    }

    miniPlayer.hidden = false;
    miniTitle.textContent = state.title || '';
    miniTitle.title = state.title || '';
    miniArtist.textContent =
      state.status === 'loading' ? 'Loading...' :
      state.status === 'error' ? "Couldn't load audio" :
      (state.artist || '');

    if (state.cover) {
      if (miniCover.src !== state.cover) miniCover.src = state.cover;
      miniCover.classList.remove('no-art');
    } else {
      miniCover.removeAttribute('src');
      miniCover.classList.add('no-art');
    }

    miniToggle.innerHTML = state.status === 'playing' ? MINI_ICONS.pause : MINI_ICONS.play;
    miniToggle.disabled = state.status === 'loading' || state.status === 'error';
    miniPrev.disabled = !state.hasPrev;
    miniNext.disabled = !state.hasNext;
  }

  function sendMusicCmd(action) {
    try {
      $(MUSIC_IFRAME_ID)?.contentWindow?.postMessage({ type: 'kstuff-music-cmd', action }, '*');
    } catch {}
  }

  miniPlayer.addEventListener('click', e => {
    const btn = e.target.closest('button[data-act]');
    if (btn && !btn.disabled) sendMusicCmd(btn.dataset.act);
  });

  window.addEventListener('message', e => {
    const data = e.data;
    if (!data || data.type !== 'kstuff-music-state') return;
    if (e.source !== $(MUSIC_IFRAME_ID)?.contentWindow) return;
    renderMiniPlayer(data.state);
  });

  $(MUSIC_IFRAME_ID)?.addEventListener('load', () => renderMiniPlayer(null));
  let savedWindowScrollY = 0, savedPageScrollTop = 0;
  let sessionSettingsUpdated = false, initPromise = null;
  let isNavigating = false, autoRefreshBusy = false, firstNavStarted = false;

  pages.forEach(p => {
    p.style.opacity = p.classList.contains('active') ? '1' : '0';
    if (!p.classList.contains('active')) p.style.display = 'none';
  });

  const initialActivePage = document.querySelector('.page.active');
  if (initialActivePage && urlMap[initialActivePage.id]) setAddress(pageAddress(initialActivePage.id));

  try {
    currentUser = JSON.parse(getStorage('kstuff_user'));
    if (currentUser && !currentUser.username) {
      currentUser = null;
      localStorage.removeItem('kstuff_user');
    }
    if (currentUser?.password) {
      delete currentUser.password;
      setStorage('kstuff_user', JSON.stringify(currentUser));
    }
    const uTheme = currentUser?.settings?.theme || currentUser?.theme;
    if (uTheme) setStorage('kstuff_theme', uTheme);
  } catch { localStorage.removeItem('kstuff_user'); }

  if (!getStorage('kstuff_theme')) setStorage('kstuff_theme', 'theme-sakura');

  const loaderTextEl = loader?.querySelector('.loading-text');
  const toggleLoader = (show, mode = 'loading') => {
    if (!loader) return;
    if (show && loaderTextEl) loaderTextEl.textContent = mode === 'updating' ? 'Updating' : 'Loading';
    loader.style.opacity = show ? '1' : '0';
    loader.classList.toggle('hidden', !show);
  };
  toggleLoader(true);

  const tooltipEl = body.appendChild(el('div', { className: 'js-custom-tooltip' }));
  tooltipEl.style.cssText = 'position:fixed;display:none;padding:6px 10px;background:rgba(0,0,0,0.85);color:#fff;font-size:0.75rem;border-radius:6px;pointer-events:none;z-index:999999;white-space:nowrap;';
  let tooltipPending = false, lastPointerEvent = null;
  function updateTooltip() {
    tooltipPending = false;
    const e = lastPointerEvent;
    if (!e) return tooltipEl.style.display = 'none';
    const t = e.target?.closest?.('[data-tooltip]');
    if (!t) return tooltipEl.style.display = 'none';
    tooltipEl.textContent = t.dataset.tooltip;
    tooltipEl.style.left = (e.clientX + 12) + 'px';
    tooltipEl.style.top = (e.clientY + 12) + 'px';
    tooltipEl.style.display = 'block';
  }
  document.addEventListener('pointermove', e => {
    lastPointerEvent = e;
    if (!tooltipPending) { tooltipPending = true; requestAnimationFrame(updateTooltip); }
  });
  document.addEventListener('pointerout', e => {
    if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-tooltip]')) tooltipEl.style.display = 'none';
  });

  let indicator = navBar?.querySelector('.nav-indicator') || (navBar && (navBar.prepend(el('div', { className: 'nav-indicator' })), navBar.querySelector('.nav-indicator')));
  const updateIndicator = btn => {
    if (!btn || !indicator || !navBar) return;
    const isVert = body.className.includes('nav-left') || body.className.includes('nav-right');
    const nR = navBar.getBoundingClientRect(), bR = btn.getBoundingClientRect();
    indicator.style.cssText = `transition:transform .22s ease,width .22s ease,height .22s ease;` +
      (isVert ? `width:3px;height:${bR.height}px;transform:translateY(${bR.top - nR.top}px);` : `width:${bR.width}px;height:3px;transform:translateX(${bR.left - nR.left}px);`);
  };
  if (navBar) {
    new MutationObserver(() => {
      const activeBtn = navBar.querySelector('.nav-btn.active');
      if (activeBtn) updateIndicator(activeBtn);
    }).observe(navBar, { subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  if (navBar && window.ResizeObserver) {
    new ResizeObserver(() => updateIndicator(document.querySelector('.nav-btn.active'))).observe(navBar);
  } else {
    let rs; window.addEventListener('resize', () => { clearTimeout(rs); rs = setTimeout(() => updateIndicator(document.querySelector('.nav-btn.active')), 120); });
  }

  const timedFetch = async (url, asText = false, ms = FETCH_TIMEOUT) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return asText ? await r.text() : await r.json();
    } finally { clearTimeout(timer); }
  };

  const shaState = { sha: '', at: 0, pending: null };

  async function getLatestSha(force = false) {
    const now = Date.now();
    if (!force && shaState.sha && now - shaState.at < SHA_TTL) return shaState.sha;
    if (shaState.pending) return shaState.pending;
    shaState.pending = (async () => {
      try {
        const data = await timedFetch('https://api.github.com/repos/lotsacookie/kstuff/commits/main', false, SHA_FETCH_TIMEOUT);
        const sha = data?.sha;
        if (typeof sha === 'string' && /^[0-9a-f]{40}$/i.test(sha)) {
          shaState.sha = sha;
          shaState.at = Date.now();
          return sha;
        }
      } catch {}
      shaState.sha = '';
      return '';
    })();
    try {
      return await shaState.pending;
    } finally {
      shaState.pending = null;
    }
  }

  async function fetchWithProxy(path, asText = false) {
    const cb = (path.includes('?') ? '&' : '?') + '_=' + Date.now();
    const sha = await getLatestSha();
    const sources = [];
    if (sha) sources.push([`https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@${sha}/`, SHA_FETCH_TIMEOUT]);
    sources.push(['', FETCH_TIMEOUT]);
    sources.push([`https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@main/`, FETCH_TIMEOUT]);
    let lastErr = null;
    for (const [base, ms] of sources) {
      try {
        return await timedFetch(base + path + cb, asText, ms);
      } catch (err) {
        lastErr = err;
      }
    }
    console.error('All sources failed for', path, lastErr);
    throw new Error("Proxies failed: " + path);
  }

  function applyCustomDropdown(selectEl) {
    if (!selectEl || (selectEl.dataset.customized && !selectEl.nextElementSibling?.classList.contains('custom-select-wrapper'))) return;
    if (selectEl.dataset.customized) selectEl.nextElementSibling.remove();
    selectEl.style.display = 'none'; selectEl.dataset.customized = 'true';
    const wrap = el('div', { className: 'custom-select-wrapper' }),
      trig = el('div', { className: 'custom-select-trigger', tabIndex: 0 }),
      opts = el('div', { className: 'custom-select-options' });
    trig.innerHTML = `<span>${selectEl.options[selectEl.selectedIndex]?.text || ''}</span> <i class="ph ph-caret-down"></i>`;
    Array.from(selectEl.options).forEach((opt, idx) => {
      const o = el('div', { className: `custom-select-option ${idx === selectEl.selectedIndex ? 'selected' : ''}`, textContent: opt.text });
      o.onclick = e => {
        e.stopPropagation(); selectEl.value = opt.value;
        trig.querySelector('span').textContent = opt.text;
        opts.querySelectorAll('.custom-select-option').forEach(item => item.classList.remove('selected'));
        o.classList.add('selected'); opts.classList.remove('open');
        selectEl.dispatchEvent(new Event('change'));
      };
      opts.appendChild(o);
    });
    trig.onclick = e => {
      e.stopPropagation();
      $$('.custom-select-options.open').forEach(m => m !== opts && m.classList.remove('open'));
      opts.classList.toggle('open');
    };
    wrap.append(trig, opts); selectEl.parentNode.insertBefore(wrap, selectEl.nextSibling);
  }

  document.addEventListener('click', () => $$('.custom-select-options.open').forEach(el => el.classList.remove('open')));
  $$('.setting-group select').forEach(applyCustomDropdown);

  const notifyIframesTheme = () => Object.values(iframePages).forEach(p => {
    try { $(p.id)?.contentWindow?.postMessage('theme-updated', '*'); } catch {}
  });

  const handleThemesLoaded = themes => {
    let css = '', html = '';
    themes.forEach(t => {
      css += `.${t.id}{${Object.entries(t.variables).map(([k, v]) => `${k}:${v};`).join('')}}\n`;
      html += `<option value="${t.id}">${t.name}</option>`;
    });
    const style = $('dynamic-themes-style') || document.head.appendChild(el('style', { id: 'dynamic-themes-style' }));
    style.textContent = css;
    const sel = $('layout-theme-select');
    if (sel) {
      sel.innerHTML = html;
      const chosen = currentUser?.settings?.theme || currentUser?.theme || getStorage('kstuff_theme') || themes[0].id;
      sel.value = chosen; setStorage('kstuff_theme', chosen);
      body.className = body.className.replace(/\btheme-\S+/g, '').trim() + ' ' + chosen;
      applyCustomDropdown(sel);
    }
    notifyIframesTheme();
  };

  try { handleThemesLoaded(JSON.parse(getStorage('kstuff_themes_cache'))); } catch {}
  fetchWithProxy('Assets/json/themes.json').then(t => { setStorage('kstuff_themes_cache', JSON.stringify(t)); handleThemesLoaded(t); }).catch(err => console.error('themes.json failed', err));

  [
    ['layout-theme-select', 'kstuff_theme', 'theme', v => { if (v) { body.classList.add(v); setStorage('kstuff_theme', v); } }],
    ['layout-nav-select', 'kstuff_nav_pos', 'nav', v => { if (v) body.classList.add(v); }],
    ['layout-size-select', 'kstuff_nav_size', 'size', v => { if (v) body.classList.add(v); }],
    ['layout-text-select', 'kstuff_text_vis', '', v => { if (v) body.classList.toggle('text-hide', v === 'text-hide'); }]
  ].forEach(([id, key, prefix, fn]) => {
    const select = $(id); if (!select) return;
    const val = getStorage(key) || select.value; select.value = val; fn(val);
    select.addEventListener('change', e => {
      if (prefix) body.className = body.className.replace(new RegExp(`\\b${prefix}-\\S+`, 'g'), '').trim();
      fn(e.target.value); setStorage(key, e.target.value);
      updateIndicator(navBar?.querySelector('.nav-btn.active'));
      notifyIframesTheme();
    });
  });

  function applyCloudSettings(s) {
    if (!s) return;
    if (s.theme) setStorage('kstuff_theme', s.theme);
    [
      { i: 'layout-theme-select', k: 'kstuff_theme', v: s.theme },
      { i: 'layout-nav-select', k: 'kstuff_nav_pos', v: s.navPos },
      { i: 'layout-size-select', k: 'kstuff_nav_size', v: s.navSize },
      { i: 'layout-text-select', k: 'kstuff_text_vis', v: s.textVis }
    ].forEach(({ i, k, v }) => {
      const select = $(i);
      if (v && select) {
        setStorage(k, v); select.value = v; select.dispatchEvent(new Event('change'));
        const wrap = select.nextElementSibling;
        if (wrap?.classList.contains('custom-select-wrapper')) {
          wrap.querySelector('.custom-select-trigger span').textContent = select.options[select.selectedIndex]?.text || '';
          wrap.querySelectorAll('.custom-select-option').forEach((o, idx) => o.classList.toggle('selected', idx === select.selectedIndex));
        }
      }
    });
  }

  const userSettings = u => u?.settings || { theme: u?.theme, navPos: u?.navPos, navSize: u?.navSize, textVis: u?.textVis };

  const AUTH_ERRORS = {
    invalid: 'Fill out all fields.',
    exists: 'That username is already taken.',
    not_found: 'No account with that username.',
    invalid_password: 'Incorrect password.',
    failed: 'Something went wrong. Please try again.'
  };

  const showAuthError = msg => {
    const errEl = $('auth-error-msg');
    if (!errEl) return;
    errEl.textContent = msg;
    errEl.style.display = 'block';
  };

  const setAuthBusy = (busy, label = '', which = '') => {
    clearTimeout(authBusyTimer);
    [['login', $('do-login-btn')], ['signup', $('do-signup-btn')]].forEach(([kind, btn]) => {
      if (!btn) return;
      if (!btn.dataset.label) btn.dataset.label = btn.textContent;
      btn.disabled = busy;
      btn.textContent = busy && kind === which ? label : btn.dataset.label;
    });
    if (busy) {
      authBusyTimer = setTimeout(() => {
        setAuthBusy(false);
        showAuthError('The server took too long to respond. Please try again.');
      }, AUTH_TIMEOUT);
    }
  };

  $('save-settings-btn')?.addEventListener('click', e => {
    const btn = e.target;
    const p = {
      theme: $('layout-theme-select')?.value,
      navPos: $('layout-nav-select')?.value,
      navSize: $('layout-size-select')?.value,
      textVis: $('layout-text-select')?.value,
      lastUpdated: Date.now()
    };
    if (p.theme) setStorage('kstuff_theme', p.theme);
    if (currentUser) {
      currentUser.settings = p;
      setStorage('kstuff_user', JSON.stringify(currentUser));
    }
    applyCloudSettings(p);
    sessionSettingsUpdated = true;
    if (currentUser?.username) sendBackend({ type: 'update-settings', username: currentUser.username, settings: p });
    const oBg = btn.style.background, oC = btn.style.color;
    btn.textContent = "Saved!"; btn.style.background = "#4CAF50"; btn.style.color = "#fff";
    setTimeout(() => { btn.textContent = "Save Settings"; btn.style.background = oBg; btn.style.color = oC; }, 1500);
  });
  const THEME_SYNC_SCRIPT = `<script>(function(){function g(cs,n){return(cs.getPropertyValue(n)||'').trim();}function sT(){try{var p=window.parent;if(!p||p===window)return;var cs=p.getComputedStyle(p.document.body),d=document.documentElement.style;var bg=g(cs,'--background');if(!bg&&cs.backgroundColor!=='rgba(0, 0, 0, 0)'&&cs.backgroundColor!=='transparent')bg=cs.backgroundColor;var tx=g(cs,'--text-color')||cs.color;if(bg&&tx&&bg===tx){bg='';tx='';}var m={'--bg':bg,'--text':tx,'--nav':g(cs,'--nav-bg'),'--card':g(cs,'--card-bg')};for(var k in m){if(m[k])d.setProperty(k,m[k]);else d.removeProperty(k);}}catch(e){}}sT();window.addEventListener('message',function(e){if(e.data==='theme-updated')sT();});})();<\/script>`;

  const buildErrorHtml = id => `<html style="background:#1b1b1f;margin:0;"><body style="margin:0;color:#f5f5f5;background:#1b1b1f;font-family:sans-serif;display:flex;flex-direction:column;gap:14px;justify-content:center;align-items:center;height:100vh;"><h2 style="margin:0;">Failed to load.</h2><button id="js-iframe-retry" style="padding:8px 18px;border:none;border-radius:6px;background:#4a7dff;color:#fff;cursor:pointer;font-size:0.9rem;">Retry</button><script>document.getElementById('js-iframe-retry').onclick=()=>window.parent.postMessage({type:'retry-iframe',id:'${id}'},'*');<\/script></body></html>`;

  const pageIsHidden = f => { const pg = f.closest('.page'); return !!pg && !pg.classList.contains('active'); };
  function cancelIframeLoads(id) {
    iframeLoadTokens[id] = (iframeLoadTokens[id] || 0) + 1;
    delete iframeInFlight[id];
    const f = $(id);
    if (f) {
      clearTimeout(f.__kShowTimer);
      if (f.__kLoadHandler) { f.removeEventListener('load', f.__kLoadHandler); f.__kLoadHandler = null; }
    }
  }

  function loadIframePage(id, path, preFetchedHtml = null, isRetry = false) {
    return new Promise(async resolve => {
      const f = $(id);
      if (!f) return resolve();

      if (isKeepAliveLoaded(id)) {
        if (!pageIsHidden(f)) {
          f.style.display = 'block';
          toggleLoader(false);
        }
        return resolve();
      }

      const token = iframeLoadTokens[id] = (iframeLoadTokens[id] || 0) + 1;
      iframeInFlight[id] = token;
      const stale = () => iframeLoadTokens[id] !== token;
      const done = () => { if (iframeInFlight[id] === token) delete iframeInFlight[id]; resolve(); };

      clearTimeout(f.__kShowTimer);
      if (f.__kLoadHandler) { f.removeEventListener('load', f.__kLoadHandler); f.__kLoadHandler = null; }
      const mount = html => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          clearTimeout(f.__kShowTimer);
          if (!stale() && !pageIsHidden(f)) {
            f.style.display = 'block';
            toggleLoader(false);
          }
          done();
        };
        const onLoad = () => {
          try { if (f.contentWindow.location.href === 'about:blank') return; } catch {}
          f.removeEventListener('load', onLoad);
          if (f.__kLoadHandler === onLoad) f.__kLoadHandler = null;
          if (!stale() && id === 'studyhall-iframe' && currentUser) {
            try { f.contentWindow?.postMessage({ type: 'set_user', username: currentUser.username }, '*'); } catch {}
          }
          finish();
        };
        f.__kLoadHandler = onLoad;
        f.addEventListener('load', onLoad);
        f.__kShowTimer = setTimeout(finish, IFRAME_SHOW_TIMEOUT);
        f.removeAttribute('srcdoc');
        f.srcdoc = html;
      };

      try {
        const html = preFetchedHtml !== null ? preFetchedHtml : await fetchWithProxy(path, true);
        if (stale() || pageIsHidden(f)) return done();
        iframeLoadFailed[id] = false;
        lastIframeHtml[id] = html;
        const i = html.lastIndexOf('</body>');
        mount(i === -1 ? html + THEME_SYNC_SCRIPT : html.slice(0, i) + THEME_SYNC_SCRIPT + html.slice(i));
      } catch (err) {
        console.error('loadIframePage failed for', path, err);
        if (stale() || pageIsHidden(f)) return done();
        if (!isRetry) {
          setTimeout(() => {
            if (stale()) return done();
            loadIframePage(id, path, null, true).then(done);
          }, 900);
          return;
        }
        iframeLoadFailed[id] = true;
        mount(buildErrorHtml(id));
      }
    });
  }

  window.addEventListener('message', event => {
    if (event.data && event.data.type === 'retry-iframe' && event.data.id) {
      const entry = Object.values(iframePages).find(p => p.id === event.data.id);
      if (entry) {
        toggleLoader(true);
        loadIframePage(entry.id, entry.path).then(() => { const f = $(entry.id); if (f) f.style.display = 'block'; });
      }
    }
  });

  const grids = {
    readingcorner: { data: [], pool: [], gridEl: $('readingcorner-grid'), pageEl: $('readingcorner-pagination'), category: "All", search: "", page: 1, id: 'readingcorner', renderId: 0 },
    sciencequiz: { data: [], pool: [], gridEl: $('sciencequiz-grid'), pageEl: $('sciencequiz-pagination'), category: "All", search: "", page: 1, id: 'sciencequiz', renderId: 0 }
  };

  const openResource = async item => {
    if (!item) return;
    tooltipEl.style.display = 'none';
    savedWindowScrollY = window.scrollY || document.documentElement.scrollTop;
    savedPageScrollTop = document.querySelector('.page.active')?.scrollTop || 0;
    if (modalTitle) modalTitle.textContent = item.title;
    if (modalOverlay) modalOverlay.classList.add('active');
    if (!modalIframe) return;
    modalIframe.removeAttribute('srcdoc'); modalIframe.src = 'about:blank';

    if (item.url) {
      let targetUrl = item.url.trim();

      for (let i = 0; i < 5 && MIRROR_PH.test(targetUrl); i++) {
        const match = targetUrl.match(MIRROR_PH);
        if (!match) break;

        const key = match[1];
        syncMirrors();

        let mirror = gRep[key];

        if (!mirror) {
          if (modalTitle) {
            modalTitle.textContent = `${item.title} - finding a mirror...`;
          }

          mirror = await waitForMirrorKey(key, 30000);
        }

        if (modalOverlay && !modalOverlay.classList.contains('active')) return;

        if (!mirror) break;

        const replacements = {
          ...gRep,
          [key]: mirror
        };

        const next = appB(targetUrl, replacements, true);

        if (next === targetUrl) break;

        targetUrl = next;
      }

      syncMirrors();

      if (modalTitle) {
        modalTitle.textContent = item.title;
      }

      if (MIRROR_PH.test(targetUrl)) {
        modalIframe.srcdoc =
          '<body style="font-family:sans-serif;background:#1b1b1f;color:#f5f5f5;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">No mirror is available right now.</body>';

        return;
      }

      const isHtmlRepo = targetUrl.includes('freebuisness/html') || targetUrl.includes('{HTML_URL}') || targetUrl.includes('htm@main') || !targetUrl.startsWith('http');
      if (isHtmlRepo) {
        const cleanPath = targetUrl.replace(/\$?\{HTML_URL\}\/?/gi, '').replace(/^https?:\/\/[^\/]+\/(?:gh\/)?freebuisness\/html(?:@|\/)?(?:main\/)?/gi, '').replace(/^https?:\/\/[^\/]+\/freebuisness\/html\//gi, '').replace(/^\/+/, '');
        const launchSha = await getLatestSha();
        const launchBase = launchSha ? `https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@${launchSha}/` : `https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@main/`;
        modalIframe.src = `${launchBase}Assets/embed/launch.svg?url=https://cdn.jsdelivr.net/gh/freebuisness/html@main/${cleanPath}`;
      } else {
        const hasMirror = v => !!v && targetUrl.includes(v);
        const isProxyUrl = hasMirror(gRep.static) || hasMirror(gRep.scram) || hasMirror(gRep.uv) || hasMirror(gRep.truffled) || hasMirror(gRep.frogiee) || item.category === 'Apps' || (!targetUrl.includes('raw.githubusercontent.com') && !targetUrl.includes('cdn.jsdelivr.net'));
        if (isProxyUrl) modalIframe.src = targetUrl;
        else {
          try {
            const res = await fetch(targetUrl, { cache: 'no-store' });
            if (res.ok) modalIframe.srcdoc = await res.text(); else modalIframe.src = targetUrl;
          } catch { modalIframe.src = targetUrl; }
        }
      }
    }
    setTimeout(() => Object.values(grids).forEach(g => {
      if (g.gridEl && g.pool) {
        g.pool.forEach(p => { if (p.img) { p.img.onload = p.img.onerror = null; p.img.src = ''; } });
        g.gridEl.innerHTML = ''; g.pool = [];
      }
    }), 50);
  };

  const buildPool = type => {
    const grid = grids[type]; if (!grid.gridEl) return;
    if (grid.pool) grid.pool.forEach(p => { if (p.img) { p.img.onload = p.img.onerror = null; p.img.src = ''; } });
    grid.gridEl.innerHTML = ''; grid.pool = [];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < ITEMS_PER_PAGE; i++) {
      const card = el('div', { className: 'round-btn' }); card.dataset.index = i;
      card.innerHTML = `<img alt="" style="display:none;width:100%;height:100%;object-fit:contain;object-position:center;"><div class="category-label"></div><div class="overlay"><h3></h3><p></p></div>`;
      grid.pool.push({ el: card, img: card.querySelector('img'), t: card.querySelector('h3'), d: card.querySelector('p'), c: card.querySelector('.category-label') });
      frag.appendChild(card);
    }
    grid.gridEl.appendChild(frag);
    grid.gridEl.onclick = e => { const c = e.target.closest('.round-btn'); if (c && c.style.display !== 'none') openResource(grid.paginatedData?.[c.dataset.index]); };
  };

  const gridImageStyle = document.createElement('style');
  gridImageStyle.textContent = `
    .round-btn {
      overflow: hidden;
    }

    .round-btn > img {
      display: block;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      object-position: center;
    }

    .round-btn img[src=""] {
      display: none !important;
    }
  `;
  document.head.appendChild(gridImageStyle);

  const renderGrid = (type, preload = false, mode = 'loading') => {
    return new Promise(async resolve => {
      const grid = grids[type]; if (!grid.gridEl) return resolve();
      grid.renderId = (grid.renderId || 0) + 1;
      const myRenderId = grid.renderId;
      toggleLoader(true, mode);
      const filtered = (grid.data || []).filter(i => (grid.category === "All" || i.category === grid.category) && i.title.toLowerCase().includes(grid.search));
      const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
      if (grid.page > totalPages) grid.page = 1;
      grid.paginatedData = filtered.slice((grid.page - 1) * ITEMS_PER_PAGE, grid.page * ITEMS_PER_PAGE);

      const imagePromises = [];
      for (let idx = 0; idx < grid.pool.length; idx++) {
        const p = grid.pool[idx];
        const item = grid.paginatedData[idx];
        p.el.style.display = item ? 'block' : 'none';

        if (item) {
          if (p.t.textContent !== item.title) p.t.textContent = item.title;
          if (p.d.textContent !== (item.description || '')) p.d.textContent = item.description || '';
          if (p.c) p.c.textContent = item.category || 'All';
          p.el.dataset.tooltip = item.title;

          if (p.img.dataset.src !== (item.image || '')) {
            p.img.onload = p.img.onerror = null;
            if (p.img.src) p.img.src = '';
            p.img.dataset.src = item.image || '';
            if (item.image) {
              p.img.style.display = 'block';
              try {
                p.img.loading = 'eager';
              } catch (e) {}
              const pr = new Promise(res => {
                let done = false;
                const doneFn = () => { if (done) return; done = true; p.img.onload = p.img.onerror = null; res(); };
                p.img.onload = doneFn; p.img.onerror = doneFn;
                p.img.src = item.image;
              });
              imagePromises.push(pr);
            } else {
              p.img.removeAttribute('src'); p.img.style.display = 'none';
            }
          } else if (item.image) {
            p.img.style.display = 'block';
          }
        } else {
          if (p.img) { p.img.onload = p.img.onerror = null; p.img.src = ''; p.img.removeAttribute('src'); p.img.style.display = 'none'; }
          if (p.c) p.c.textContent = ''; delete p.el.dataset.tooltip;
        }
      }

      if (grid.pageEl) {
        grid.pageEl.innerHTML = `<button class="page-btn" data-action="prev" ${grid.page===1?'style="opacity:0.4;cursor:not-allowed;"':''}><i class="ph ph-caret-left"></i></button><span style="font-weight:700;font-size:1.1rem;min-width:80px;text-align:center;user-select:none;">${grid.page} / ${totalPages}</span><button class="page-btn" data-action="next" ${grid.page===totalPages?'style="opacity:0.4;cursor:not-allowed;"':''}><i class="ph ph-caret-right"></i></button>`;
        if (!grid.pageEl.dataset.bound) {
          grid.pageEl.dataset.bound = 'true';
          grid.pageEl.onclick = e => {
            const btn = e.target.closest('.page-btn'); if (!btn) return;
            const f = (grid.data || []).filter(i => (grid.category === "All" || i.category === grid.category) && i.title.toLowerCase().includes(grid.search));
            const tp = Math.max(1, Math.ceil(f.length / ITEMS_PER_PAGE));
            const act = btn.dataset.action;
            if (act === 'prev' && grid.page > 1) { grid.page--; renderGrid(type, true); }
            else if (act === 'next' && grid.page < tp) { grid.page++; renderGrid(type, true); }
          };
        }
      }

      const waitPromise = (imagePromises.length ? Promise.allSettled(imagePromises) : Promise.resolve());
      const timeout = new Promise(r => setTimeout(r, IMAGE_LOAD_TIMEOUT));
      await Promise.race([waitPromise, timeout]);

      if (grid.renderId === myRenderId) {
        toggleLoader(false);
      }
      resolve();
    });
  };

  Object.keys(grids).forEach(type => {
    let timer;
    $(`${type}-search`)?.addEventListener('input', e => {
      const clr = $(`${type}-search-clear`); if (clr) clr.style.display = e.target.value ? 'block' : 'none';
      clearTimeout(timer);
      timer = setTimeout(() => { grids[type].search = e.target.value.toLowerCase().trim(); grids[type].page = 1; renderGrid(type, true); }, 120);
    });
    $(`${type}-search-clear`)?.addEventListener('click', () => {
      $(`${type}-search`).value = ''; $(`${type}-search-clear`).style.display = 'none';
      grids[type].search = ''; grids[type].page = 1; renderGrid(type, true);
    });
  });

  document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    const activePage = document.querySelector('.page.active'); if (!activePage) return;
    const type = activePage.id; if (!grids[type]) return;
    const grid = grids[type];
    const filtered = (grid.data || []).filter(i => (grid.category === "All" || i.category === grid.category) && i.title.toLowerCase().includes(grid.search));
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    if (e.key === 'ArrowLeft' && grid.page > 1) { e.preventDefault(); grid.page--; renderGrid(type, true); }
    else if (e.key === 'ArrowRight' && grid.page < totalPages) { e.preventDefault(); grid.page++; renderGrid(type, true); }
  });

  document.head.appendChild(el('style', { textContent: `i.profile-avatar-container{width:1.2em;height:1.2em;border-radius:50%;overflow:hidden;display:inline-flex;justify-content:center;align-items:center;}i.profile-avatar-container img{width:100%;height:100%;object-fit:cover;}` }));

  const updateAuthUI = () => {
    const btn = $('profile-nav-btn'); if (!btn) return;
    const pic = currentUser?.profilePicture || DEFAULT_PIC;
    if (currentUser) {
      if ($('profile-modal-pic')) $('profile-modal-pic').src = pic;
      if ($('profile-modal-username')) $('profile-modal-username').textContent = currentUser.username || "User";
      if ($('profile-modal-desc')) $('profile-modal-desc').textContent = currentUser.description || "No bio.";
      const newI = el('i', { className: 'ph profile-avatar-container', innerHTML: `<img src="${pic}" onerror="this.src='${DEFAULT_PIC}'">` });
      btn.querySelector('i')?.replaceWith(newI);
    } else {
      btn.querySelector('i')?.replaceWith(el('i', { className: 'ph ph-user', id: 'profile-nav-icon' }));
    }
  };

  updateAuthUI();
  if (currentUser) applyCloudSettings(userSettings(currentUser));

  [['auth-modal-overlay', 'auth-close-btn'], ['profile-modal-overlay', 'profile-close-btn'], ['homeworkhelper-modal', 'homeworkhelper-close-btn'], ['changelog-modal', 'changelog-close-btn']]
    .forEach(([mId, bId]) => {
      const m = $(mId);
      $(bId)?.addEventListener('click', () => m?.classList.remove('active'));
      m?.addEventListener('click', e => e.target === m && m.classList.remove('active'));
    });

  const authMod = $('auth-modal-overlay'), profMod = $('profile-modal-overlay');

  const applyBackendUser = (payload, isAuto) => {
    const { password, ...safeUser } = payload;
    const keepLocalSettings = isAuto && sessionSettingsUpdated;
    const localSettings = currentUser?.settings;
    currentUser = safeUser;
    if (keepLocalSettings && localSettings) currentUser.settings = localSettings;
    setStorage('kstuff_user', JSON.stringify(currentUser));
    updateAuthUI();
    if (!keepLocalSettings) applyCloudSettings(userSettings(currentUser));
  };

  const flushBackendQueue = () => {
    while (backendQueue.length && backendLinked && backendPort) {
      const message = backendQueue.shift();
      try {
        backendPort.postMessage(message);
      } catch (err) {
        backendQueue.unshift(message);
        break;
      }
    }
  };

  const handleBackendMessage = data => {
    if (!data || typeof data !== 'object') return;

    dbg('received', data.type, data.reason || '');

    if (data.type === 'ready') {
      backendReady = true;
      backendAttempts = 0;
      flushBackendQueue();
      return;
    }

    if (data.type === 'auto-login') {
      if (data.success && data.payload) applyBackendUser(data.payload, true);
      return;
    }

    if (data.type === 'login' || data.type === 'signup') {
      setAuthBusy(false);
      if (data.success && data.payload) {
        applyBackendUser(data.payload, false);
        if ($('auth-pass')) $('auth-pass').value = '';
        authMod?.classList.remove('active');
      } else {
        showAuthError(AUTH_ERRORS[data.reason] || AUTH_ERRORS.failed);
      }
    }
  };

  const closeBackendPort = () => {
    backendLinked = false;
    backendReady = false;
    if (backendPort) {
      backendPort.onmessage = null;
      try { backendPort.close(); } catch {}
      backendPort = null;
    }
  };

  const linkBackend = frame => {
    if (frame !== backendFrame) return;

    closeBackendPort();

    const channel = new MessageChannel();
    backendPort = channel.port1;
    backendPort.onmessage = e => handleBackendMessage(e.data);
    backendPort.start();

    try {
      frame.contentWindow.postMessage({ type: 'init_cable' }, '*', [channel.port2]);
    } catch (err) {
      console.error('backend init_cable failed', err);
      closeBackendPort();
      return;
    }

    backendLinked = true;
    backendAttempts = 0;
    clearTimeout(backendLinkTimer);
    dbg('linked, init_cable sent, queued messages:', backendQueue.length);
    flushBackendQueue();
  };

  const mountBackendFrame = url => {
    clearTimeout(backendLinkTimer);
    closeBackendPort();

    if (backendFrame) {
      backendFrame.remove();
      backendFrame = null;
    }

    const frame = document.createElement('iframe');
    frame.id = 'kstuff-backend-frame';
    frame.title = 'kstuff-backend';
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('hidden', '');
    frame.style.setProperty('display', 'none', 'important');
    frame.addEventListener('load', () => linkBackend(frame));
    frame.src = url;

    backendFrame = frame;
    body.appendChild(frame);
    dbg('iframe mounted', url);

    backendLinkTimer = setTimeout(() => {
      if (backendLinked || frame !== backendFrame) return;
      dbg('link timeout, trying next backend url');
      backendAttempts = Math.min(backendAttempts + 1, 6);
      backendUrlIndex++;
      startBackend();
    }, BACKEND_LINK_TIMEOUT);
  };

  function startBackend() {
    mountBackendFrame(BACKEND_URLS[backendUrlIndex % BACKEND_URLS.length]);
  }

  function ensureBackend() {
    if (!backendFrame || !backendFrame.isConnected || !backendFrame.contentWindow) {
      closeBackendPort();
      backendFrame = null;
      startBackend();
    }
  }

  function sendBackend(message) {
    dbg('send', message && message.type, backendLinked ? '(linked)' : '(queued)');
    if (backendLinked && backendPort) {
      try {
        backendPort.postMessage(message);
        return true;
      } catch {}
    }
    if (backendQueue.length < 20) backendQueue.push(message);
    ensureBackend();
    return false;
  }

  startBackend();
  setInterval(ensureBackend, BACKEND_WATCHDOG_INTERVAL);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) ensureBackend();
  });

  const handleAuth = t => () => {
    const u = ($('auth-user')?.value || '').trim(), p = ($('auth-pass')?.value || '').trim();
    if (!u || !p) return showAuthError(AUTH_ERRORS.invalid);
    if (t === 'signup') {
      if (u.length > MAX_USERNAME_LENGTH) return showAuthError('Username cannot exceed 20 characters.');
      if (!/^[a-zA-Z0-9_]+$/.test(u)) return showAuthError('Username can only contain letters, numbers, and underscores.');
      if ((u.match(/_/g) || []).length > MAX_UNDERSCORES) return showAuthError(`Username can only contain up to ${MAX_UNDERSCORES} underscores.`);
    }
    setAuthBusy(true, t === 'signup' ? 'Signing up...' : 'Logging in...', t);
    sendBackend({ type: t, username: u, password: p, ...(t === 'signup' ? { profilePicture: DEFAULT_PIC } : {}) });
  };

  $('do-login-btn')?.addEventListener('click', handleAuth('login'));
  $('do-signup-btn')?.addEventListener('click', handleAuth('signup'));
  ['auth-user', 'auth-pass'].forEach(id => $(id)?.addEventListener('input', () => $('auth-error-msg') && ($('auth-error-msg').style.display = 'none')));

  $('do-logout-btn')?.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('kstuff_user');
    localStorage.removeItem('neocities_last_user');
    sendBackend({ type: 'logout' });
    updateAuthUI(); profMod?.classList.remove('active');
  });

  const toggleProfEdit = show => {
    if (!pContainer) return;
    pContainer.style.display = show ? 'flex' : 'none';
    pContainer.style.opacity = show ? '1' : '0';
  };

  $('edit-profile-btn')?.addEventListener('click', () => {
    if (currentUser) {
      const isHidden = pContainer.style.display === 'none' || !pContainer.style.display;
      if (isHidden) { $('profile-edit-pic-url').value = currentUser.profilePicture || ""; $('profile-edit-desc').value = currentUser.description || ""; }
      toggleProfEdit(isHidden);
    }
  });

  $('save-profile-changes-btn')?.addEventListener('click', e => {
    if (!currentUser) return;
    const btn = e.target, oT = btn.textContent; btn.textContent = "Saving...";
    currentUser.profilePicture = $('profile-edit-pic-url').value.trim() || "https://kstuff.neocities.org/assets/default-profile.png";
    currentUser.description = $('profile-edit-desc').value.trim() || "No bio provided yet.";
    setStorage('kstuff_user', JSON.stringify(currentUser)); updateAuthUI();
    sendBackend({ type: 'update-settings', username: currentUser.username, settings: { profilePicture: currentUser.profilePicture, description: currentUser.description } });
    setTimeout(() => { btn.textContent = oT; toggleProfEdit(false); }, 600);
  });

  const loadContent = async (tId, forceReload = false, customSrc = null) => {
    firstNavStarted = true;
    isNavigating = true;

    try {
      if (tId === 'studyhall' && !currentUser) {
        authMod?.classList.add('active');
        toggleLoader(false);
        return;
      }

      const targetPage = $(tId);
      if (!targetPage) {
        toggleLoader(false);
        return;
      }

      if (!customSrc) setAddress(pageAddress(tId));

      if (targetPage.classList.contains('active') && !forceReload && !customSrc) {
        const ifr = iframePages[tId];
        if (ifr && iframeInFlight[ifr.id]) return;
        if (!(ifr && (iframeLoadFailed[ifr.id] || !$(ifr.id)?.srcdoc))) {
          toggleLoader(false);
          return;
        }
      }

      const currentActive = document.querySelector('.page.active:not(#' + tId + ')');
      toggleLoader(true);

      if (currentActive) {
        currentActive.classList.remove('active');
        currentActive.style.display = 'none';

        if (iframePages[currentActive.id]) {
          const oldId = iframePages[currentActive.id].id;
          if (!isKeepAliveLoaded(oldId)) {
            cancelIframeLoads(oldId);
            const oldIframe = $(oldId);
            if (oldIframe) {
              oldIframe.removeAttribute('srcdoc');
              oldIframe.src = 'about:blank';
            }
          }
        }
      }

      Object.keys(grids).forEach(k => {
        if (k !== tId && grids[k].gridEl) {
          if (grids[k].pool) grids[k].pool.forEach(p => { if (p.img) { p.img.onload = p.img.onerror = null; p.img.src = ''; } });
          grids[k].gridEl.innerHTML = ''; grids[k].pool = [];
        }
      });

      targetPage.style.display = 'block';
      targetPage.style.opacity = '1';
      targetPage.classList.add('active');

      if (grids[tId]) {
        buildPool(tId);
        await renderGrid(tId, false);
      } else if (iframePages[tId]) {
        const iframeData = iframePages[tId];
        const iframeEl = $(iframeData.id);
        if (iframeEl) iframeEl.style.display = 'block';
        if (customSrc && iframeEl) {
          cancelIframeLoads(iframeData.id);
          iframeEl.removeAttribute('srcdoc');
          iframeEl.src = customSrc;
          toggleLoader(false);
        } else {
          await loadIframePage(iframeData.id, iframeData.path);
        }
      }
    } finally {
      isNavigating = false;
    }
  };

  navBtns.forEach(btn => {
    const labelDivs = btn.querySelectorAll('.label-data div');

    btn.dataset.tooltip = labelDivs.length
      ? Array.from(labelDivs)
          .map(item => item.textContent)
          .reverse()
          .join('')
      : (btn.title || btn.dataset.target);

    btn.addEventListener('click', event => {
      event.preventDefault();

      tooltipEl.style.display = 'none';

      const targetId = btn.dataset.target;

      if (targetId === 'profile') {
        if (!currentUser) {
          authMod?.classList.add('active');
        } else {
          updateAuthUI();
          profMod?.classList.add('active');
        }

        return;
      }

      if (targetId === 'homeworkhelper') {
        $('homeworkhelper-modal')?.classList.add('active');
        return;
      }

      if (targetId === 'changelog') {
        $('changelog-modal')?.classList.add('active');
        return;
      }

      if (targetId === 'studyhall' && !currentUser) {
        authMod?.classList.add('active');
        return;
      }

      navBtns.forEach(other => {
        if (!['homeworkhelper', 'changelog', 'profile'].includes(other.dataset.target)) {
          other.classList.remove('active');
        }
      });

      btn.classList.add('active');
      updateIndicator(btn);
      toggleLoader(true);

      loadContent(targetId).catch(error => {
        console.error(`Navigation to ${targetId} failed:`, error);
        toggleLoader(false);
      });
    });
  });

  window.addEventListener('message', event => {
    if (typeof event.data === 'string' && event.data.startsWith('nav: ')) {
      const pageName = event.data.replace('nav: ', '').trim().toLowerCase();
      const targetMap = { 'home': 'mathworksheets', 'games': 'readingcorner', 'apps': 'sciencequiz', 'music': 'gradebook', 'ai': 'lessonplanner', 'vms': 'vms', 'chat': 'studyhall' };
      const targetId = targetMap[pageName] || pageName;
      const targetBtn = Array.from(navBtns).find(btn => btn.dataset.target === targetId);
      if (targetBtn) targetBtn.click();
    }
  });

  const closeRes = () => {
    modalOverlay?.classList.remove('active');
    if (modalIframe) { modalIframe.removeAttribute('srcdoc'); modalIframe.src = 'about:blank'; }
    const aPg = document.querySelector('.page.active');
    if (aPg && grids[aPg.id]) { buildPool(aPg.id); renderGrid(aPg.id, false); }
    setTimeout(() => { window.scrollTo(0, savedWindowScrollY); if (aPg) aPg.scrollTop = savedPageScrollTop; }, 50);
  };

  $('resource-close-btn')?.addEventListener('click', closeRes);
  modalOverlay?.addEventListener('click', e => e.target === modalOverlay && closeRes());
  $('resource-fullscreen-btn')?.addEventListener('click', () => !document.fullscreenElement ? modalIframe?.requestFullscreen().catch(()=>{}) : document.exitFullscreen());

  fetchWithProxy('Assets/json/categories.json').then(c => {
    const setC = (id, opts, type) => {
      const s = $(id); if (!s) return;
      s.innerHTML = (opts||[]).map(o => `<option value="${o}">${o}</option>`).join(''); applyCustomDropdown(s);
      s.addEventListener('change', e => { grids[type].category = e.target.value; grids[type].page = 1; renderGrid(type, true); });
    };
    setC('readingcorner-category-select', c.Games, 'readingcorner'); setC('sciencequiz-category-select', c.Apps, 'sciencequiz');
  }).catch(err => console.error('categories.json failed', err));

  fetchWithProxy('Assets/change-log.json').then(l => {
    if (!l) return;
    if ($('changelog-timestamp')) $('changelog-timestamp').textContent = l.timestamp || "Unknown";
    if ($('changelog-content')) $('changelog-content').innerHTML = l.changes?.length ? `<ul style="padding-left:1.5rem;margin:0;">${l.changes.map(c => `<li style="margin-bottom:0.5rem;">${c}</li>`).join('')}</ul>` : "No recent changes found.";
    const fetchedJsonString = JSON.stringify(l), savedJsonString = getStorage('kstuff_last_changelog');
    if (fetchedJsonString !== savedJsonString) { setStorage('kstuff_last_changelog', fetchedJsonString); $('changelog-modal')?.classList.add('active'); }
  }).catch(err => console.error('change-log.json failed', err));

  const appB = (s, rep = gRep, isPage = false) => {
    if (typeof s !== 'string') return s;
    for (const [k, v] of Object.entries(rep)) {
      if (!v) continue;
      if (k === 'static' && isPage) s = s.replace(/\$\{static\}(?!\/?embed\.html)/g, () => cleanUrl(v) + '/embed.html#');
      s = s.split(`\${${k}}`).join(v);
    }
    if (MIRROR_PH.test(s)) return s;
    return s.replace(/([^:]\/)\/+/g, '$1').replace(/(\/embed\.html#)\/+/g, '$1').replace(/^http:\/\//i, 'https://');
  };

  const proc = arr => (Array.isArray(arr) ? arr : []).map(i => {
    let p = { ...i };
    if (p.url?.includes('${truffled}') || !p.image || p.category === 'Truffled') {
      const m = gTruf.get(cleanGameTitle(p.title));
      if (m) {
        p.title = m.name;
        p.url = '${truffled}/' + trimSlash(m.url);
        p.image = '${truffled}/' + trimSlash(m.thumbnail);
        p.description = '';
        p.category = p.category || 'Truffled';
      }
    }
    p.url = appB(p.url, gRep, true); p.image = appB(p.image);
    if (MIRROR_PH.test(p.image || '')) p.image = '';
    return p;
  }).sort((a, b) => (a.title||"").localeCompare(b.title||"", undefined, { sensitivity: 'base' }));

  const rData = async (t, p, resetPage = true, mode = 'updating', silent = false) => {
    try {
      const n = await fetchWithProxy(p).catch(err => { console.error('rData fetch failed', p, err); return null; });
      if (!n?.length) { if (!silent) toggleLoader(false); return false; }

      if (t === 'sciencequiz') rawSciencequizData = n;
      const processed = proc(n);
      if (JSON.stringify(processed) === JSON.stringify(grids[t].data)) {
        if (!silent) toggleLoader(false);
        return false;
      }

      toggleLoader(true, mode);
      grids[t].data = processed;
      if (resetPage) grids[t].page = 1;
      await renderGrid(t, true, mode);
      return true;
    } catch (err) {
      console.error('rData failed', t, p, err);
      if (!silent) toggleLoader(false);
      return false;
    }
  };

  const fetchReadingCornerRaw = async () => {
    const pTypes = ['jsdelivr'];
    const getUrl = (repo, path, pt) => `https://cdn.jsdelivr.net/gh/freebuisness/${repo}@main/${path}`;
    const manualRes = await fetchWithProxy('Assets/json/g.json').catch(() => []);
    const manualMap = new Map();
    if (Array.isArray(manualRes)) manualRes.forEach(item => { if (item && item.title) manualMap.set(item.title.toLowerCase().trim(), item); });
    for (const pt of pTypes) {
      try {
        const zUrl = getUrl('assets', 'zones.json', pt) + `?_=${Date.now()}`;
        const json = await timedFetch(zUrl, false, 12000);
        if (!Array.isArray(json)) continue;
        const coverBase = getUrl('covers', '', pt).replace(/\/$/, '');
        const htmlBase = getUrl('html', '', pt).replace(/\/$/, '');
        const mappedData = [];
        json.forEach(item => {
          const titleLower = (item.name || '').toLowerCase().trim();
          const manualMatch = manualMap.get(titleLower);
          let finalUrl = item.url, finalCover = item.cover, finalTitle = item.name, finalCategory = 'All';
          if (manualMatch) {
            if (manualMatch.url) finalUrl = manualMatch.url;
            if (manualMatch.category) finalCategory = manualMatch.category;
            if (manualMatch.image || manualMatch.img) finalCover = manualMatch.image || manualMatch.img;
            manualMap.delete(titleLower);
          }
          if (finalTitle && finalTitle.includes('[!]')) return;
          mappedData.push({
            title: finalTitle,
            image: (finalCover || '').replace('{COVER_URL}', coverBase + '/'),
            url: (finalUrl || '').replace('{HTML_URL}', htmlBase + '/'),
            category: finalCategory,
            description: ''
          });
        });
        manualMap.forEach((manualItem) => {
          if (manualItem.title && !manualItem.title.includes('[!]')) {
            mappedData.push({
              title: manualItem.title,
              image: manualItem.image || manualItem.img || '',
              url: manualItem.url || '',
              category: manualItem.category || 'Manual',
              description: ''
            });
          }
        });
        return { data: mappedData };
      } catch (e) { console.error('fetchReadingCornerRaw proxy type failed', pt, e); }
    }
    const fallbackRaw = await fetchWithProxy('Assets/json/g.json').catch(()=>[]);
    const fallbackJson = Array.isArray(fallbackRaw) ? fallbackRaw : [];
    const fallbackMapped = [];
    fallbackJson.forEach(item => {
      const titleLower = (item.title || '').toLowerCase().trim();
      const manualMatch = manualMap.get(titleLower);
      let finalUrl = item.url, finalCategory = item.category || 'All', finalImage = item.image;
      if (manualMatch) {
        if (manualMatch.url) finalUrl = manualMatch.url;
        if (manualMatch.category) finalCategory = manualMatch.category;
        if (manualMatch.image || manualMatch.img) finalImage = manualMatch.image || manualMatch.img;
      }
      if (item.title && item.title.includes('[!]')) return;
      fallbackMapped.push({ ...item, url: finalUrl, category: finalCategory, image: finalImage });
    });
    return { data: fallbackMapped };
  };

  const refreshReadingCorner = async (resetPage = true, mode = 'updating', silent = false) => {
    try {
      const result = await fetchReadingCornerRaw();
      if (!result?.data?.length) { if (!silent) toggleLoader(false); return false; }

      rawReadingCornerData = result.data;
      const processed = proc(result.data);
      if (JSON.stringify(processed) === JSON.stringify(grids.readingcorner.data)) {
        if (!silent) toggleLoader(false);
        return false;
      }

      toggleLoader(true, mode);
      grids.readingcorner.data = processed;
      if (resetPage) grids.readingcorner.page = 1;
      await renderGrid('readingcorner', true, mode);
      return true;
    } catch (err) {
      console.error('refreshReadingCorner failed', err);
      if (!silent) toggleLoader(false);
      return false;
    }
  };

  $('readingcorner-refresh-btn')?.addEventListener('click', () => refreshReadingCorner());
  $('sciencequiz-refresh-btn')?.addEventListener('click', () => rData('sciencequiz', 'Assets/json/a.json'));

  let rawReadingCornerData = [];
  let rawSciencequizData = [];

  async function getMirrorsScriptSources() {
    const path = 'Assets/js/mirrors.js';
    const sources = [];
    const sha = await getLatestSha();
    if (sha) sources.push(`https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@${sha}/${path}`);
    sources.push(`https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@main/${path}`, `https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@HEAD/${path}`);
    return [...new Set(sources)];
  }

  function loadMirrorsScript() {
    return new Promise(async resolve => {
      const sources = await getMirrorsScriptSources();

      const loadNext = index => {
        if (index >= sources.length) {
          mirrorsScriptFailed = true;
          mirrorsScriptLoaded = false;
          resolve(false);
          return;
        }

        const script = document.createElement('script');
        script.src = `${sources[index]}?cb=${Date.now()}`;
        script.async = true;

        script.onload = () => {
          if (!window.kstuffMirrors || typeof window.kstuffMirrors !== 'object') {
            script.remove();
            loadNext(index + 1);
            return;
          }

          mirrorsScriptLoaded = true;
          mirrorsScriptFailed = false;
          syncMirrors();

          resolve(true);
        };

        script.onerror = () => {
          script.remove();
          loadNext(index + 1);
        };

        document.head.appendChild(script);
      };

      loadNext(0);
    });
  }

  function waitForMirrors(timeoutMs = 30000) {
    return new Promise(resolve => {
      let done = false;
      let timer = null;
      let poll = null;

      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        clearInterval(poll);
        window.removeEventListener('kstuff-mirrors-updated', check);
        syncMirrors(window.kstuffMirrors || {});
        resolve(window.kstuffMirrors || {});
      };

      const check = () => {
        const mirrors = window.kstuffMirrors || {};
        syncMirrors(mirrors);

        const hasRelevantMirror =
          Boolean(gRep.static) ||
          Boolean(gRep.frogiee) ||
          Boolean(gRep.truffled) ||
          Boolean(gRep.scram) ||
          Boolean(gRep.uv);

        if (mirrorsScriptFailed || (mirrorsScriptLoaded && hasRelevantMirror)) {
          finish();
        }
      };

      window.addEventListener('kstuff-mirrors-updated', check);
      poll = setInterval(check, 250);
      timer = setTimeout(finish, timeoutMs);
      check();
    });
  }

  function waitForMirrorKey(key, timeoutMs = 30000) {
    return new Promise(resolve => {
      let done = false;
      let timer = null;
      let poll = null;

      const finish = value => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        clearInterval(poll);
        window.removeEventListener('kstuff-mirrors-updated', check);
        resolve(value || '');
      };

      const check = () => {
        syncMirrors(window.kstuffMirrors || {});
        const value = gRep[key] || lastGoodMirror(key);

        if (value) {
          finish(value);
          return;
        }

        if (mirrorsScriptFailed) {
          finish('');
        }
      };

      window.addEventListener('kstuff-mirrors-updated', check);
      poll = setInterval(check, 250);
      timer = setTimeout(() => {
        syncMirrors(window.kstuffMirrors || {});
        finish(gRep[key] || lastGoodMirror(key));
      }, timeoutMs);

      check();
    });
  }

  function reprocessGridsWithMirrors() {
    if (rawReadingCornerData.length) {
      grids.readingcorner.data = proc(rawReadingCornerData);
    }

    if (rawSciencequizData.length) {
      grids.sciencequiz.data = proc(rawSciencequizData);
    }

    const activePage = document.querySelector('.page.active');

    if (activePage && grids[activePage.id]) {
      const grid = grids[activePage.id];

      if (!grid.pool.length) {
        buildPool(activePage.id);
      }

      renderGrid(activePage.id, false, 'updating');
    }
  }

  function setupMirrorListener() {
    window.addEventListener('kstuff-mirrors-updated', event => {
      const mirrors = event.detail || window.kstuffMirrors || {};
      if (!mirrors) return;

      const changed = syncMirrors(mirrors);

      if (changed) {
        reprocessGridsWithMirrors();
      }
    });
  }

  setupMirrorListener();

  const mirrorsPromise = loadMirrorsScript()
    .catch(error => {
      console.error('mirrors.js failed:', error);
      mirrorsScriptFailed = true;
      return false;
    });

  initPromise = Promise.all([
    fetchReadingCornerRaw().catch(error => {
      console.error('Reading Corner initialization failed:', error);
      return { data: [] };
    }),
    fetchWithProxy('Assets/json/a.json').catch(error => {
      console.error('Science Quiz initialization failed:', error);
      return [];
    }),
    fetchWithProxy('Assets/json/truffled.json').catch(error => {
      console.error('Truffled initialization failed:', error);
      return null;
    })
  ]).then(async ([readingResult, scienceData, truffledData]) => {
    gTruf.clear();

    if (Array.isArray(truffledData?.games)) {
      truffledData.games.forEach(game => {
        if (game?.name) {
          gTruf.set(cleanGameTitle(game.name), game);
        }
      });
    }

    rawReadingCornerData = readingResult?.data || [];
    rawSciencequizData = Array.isArray(scienceData) ? scienceData : [];

    grids.readingcorner.data = proc(rawReadingCornerData);
    grids.sciencequiz.data = proc(rawSciencequizData);

    Object.keys(grids).forEach(type => {
      if (!grids[type].gridEl) return;

      if (!grids[type].pool.length) {
        buildPool(type);
      }
    });

    const activePage = document.querySelector('.page.active');

    if (activePage && grids[activePage.id]) {
      await renderGrid(activePage.id, false, 'loading');
    }

    toggleLoader(false);

    mirrorsPromise.then(() => {
      syncMirrors();

      if (gRep.static || gRep.frogiee || gRep.truffled) {
        reprocessGridsWithMirrors();
      }
    });
  }).catch(error => {
    console.error('init failed:', error);
    toggleLoader(false);
  });

  const updateBrowserNav = () => {
    if (sBack) sBack.disabled = historyIndex <= 0;
    if (sFwd) sFwd.disabled = historyIndex >= history.length - 1;
  };

  const loadBrowserUrl = (val, isHistory = false) => {
    const targetUrl = formatWebUrl(val);
    if (!targetUrl) return;

    if (targetUrl.startsWith('kstuff://')) {
      const pageName = targetUrl.replace('kstuff://', '').toLowerCase();
      const targetId = reverseUrlMap[pageName] || pageName;
      const btn = Array.from(navBtns).find(b => b.dataset.target === targetId);
      if (btn) btn.click();
      return;
    }

    if (!isHistory && history[historyIndex] !== targetUrl) {
      history = history.slice(0, historyIndex + 1);
      history.push(targetUrl);
      historyIndex++;
    }

    if (tbInput) tbInput.value = targetUrl;
    updateBrowserNav();

    if (gRep.uv) {
      const baseStatic = gRep.uv.replace('/uv.html?site=', '');
      const proxiedUrl = `${baseStatic}/service/${encodeUv('https://lotsacookie.github.io/kstuff/Assets/pages/browser-content.html?site=' + targetUrl)}`;
      loadContent('mathworksheets', true, proxiedUrl);
    }
  };

  if (tbInput) {
    tbInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadBrowserUrl(e.target.value); });
    $('study-enter-btn')?.addEventListener('click', () => loadBrowserUrl(tbInput.value));
  }

  sBack?.addEventListener('click', () => { if (historyIndex > 0) { historyIndex--; loadBrowserUrl(history[historyIndex], true); } });
  sFwd?.addEventListener('click', () => { if (historyIndex < history.length - 1) { historyIndex++; loadBrowserUrl(history[historyIndex], true); } });
  sReload?.addEventListener('click', () => { if (studyIframe) { try { studyIframe.contentWindow.location.reload(); } catch(e) { studyIframe.src = studyIframe.src; } } });
  sHome?.addEventListener('click', () => loadBrowserUrl('kstuff://home'));

  let activePort = null;
  const mathworksIframe = $('mathworksheets-iframe');

  if (mathworksIframe) {
    mathworksIframe.addEventListener('load', () => {
      try {
        const channel = new MessageChannel();
        activePort = channel.port1;

        activePort.onmessage = (event) => {
          if (event.data && event.data.type === 'tabData') {
            const reportedUrl = event.data.url;

            if (document.activeElement === tbInput) return;
            if (document.querySelector('.page.active')?.id !== 'mathworksheets') return;

            const normalize = u => u ? u.replace(/\/$/, '').trim().toLowerCase() : '';
            const currentVal = tbInput ? tbInput.value : '';
            if (reportedUrl && normalize(reportedUrl) !== normalize(currentVal) && reportedUrl !== 'about:blank') {
              if (tbInput) tbInput.value = reportedUrl;

              if (history[historyIndex] !== reportedUrl) {
                history = history.slice(0, historyIndex + 1);
                history.push(reportedUrl);
                historyIndex++;
                updateBrowserNav();
              }
            }
          }
        };

        if (mathworksIframe.contentWindow) {
          mathworksIframe.contentWindow.postMessage('init-port', '*', [channel.port2]);
        }
      } catch (e) {
      }
    });
  }

  window.addEventListener('message', (event) => {
    if (event.data && typeof event.data === 'string') {
      const data = event.data.trim();
      if (
        data.startsWith('http://') ||
        data.startsWith('https://') ||
        data.startsWith('kstuff://') ||
        (data.includes('.') && !data.includes(' '))
      ) {
        loadBrowserUrl(data);
      }
    }
  });

  initPromise
    .then(async () => {
      if (firstNavStarted) return;

      let activePage = document.querySelector('.page.active');

      if (!activePage) {
        const defaultHomeButton = Array.from(navBtns).find(button => button.dataset.target === 'mathworksheets');

        if (defaultHomeButton) {
          navBtns.forEach(button => {
            button.classList.remove('active');
          });

          defaultHomeButton.classList.add('active');
          updateIndicator(defaultHomeButton);

          activePage = { id: 'mathworksheets' };
        }
      }

      if (activePage) {
        await loadContent(activePage.id, true);
      } else {
        toggleLoader(false);
      }
    })
    .catch(error => {
      console.error('Initial page load failed:', error);
      toggleLoader(false);
    });

  const isAnyModalActive = () => !!document.querySelector('.modal-overlay.active');

  async function maybeReloadIframe(id, path) {
    if (isKeepAliveLoaded(id)) return false;
    try {
      const html = await fetchWithProxy(path, true);
      if (!iframeLoadFailed[id] && lastIframeHtml[id] === html) return false;
      const currentIfr = Object.values(iframePages).find(p => p.id === id);
      const currentPage = currentIfr && document.querySelector('.page.active');
      if (!currentPage || !$(id) || pageIsHidden($(id))) return false;
      toggleLoader(true, 'updating');
      await loadIframePage(id, path, html);
      toggleLoader(false);
      return true;
    } catch (err) {
      console.error('maybeReloadIframe failed for', path, err);
      return false;
    }
  }

  async function autoRefreshActivePage() {
    if (autoRefreshBusy || isNavigating || isAnyModalActive() || document.hidden) return;
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    const tId = activePage.id;

    if (tId === 'mathworksheets' && tbInput && tbInput.value && tbInput.value !== 'kstuff://home') return;

    autoRefreshBusy = true;
    try {
      const ifr = iframePages[tId];

      if (ifr) {
        await maybeReloadIframe(ifr.id, ifr.path);
        return;
      }

      const upstreamChanged = window.kstuffMirrors?.lastUpdate > (window.kstuffLastRefresh || 0);
      if (!upstreamChanged) return;
      window.kstuffLastRefresh = Date.now();

      if (tId === 'readingcorner') {
        await refreshReadingCorner(false, 'updating', true);
      } else if (tId === 'sciencequiz') {
        await rData('sciencequiz', 'Assets/json/a.json', false, 'updating', true);
      }
    } finally {
      autoRefreshBusy = false;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) autoRefreshActivePage();
  });

  setInterval(autoRefreshActivePage, 200000);
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", initApp) : initApp();
