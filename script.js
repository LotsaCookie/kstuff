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
  const body = document.body, navBar = $('teachertouchbar'), navBtns = $$('.nav-btn'), pages = $$('.page');
  const loader = document.querySelector('.section-loader'), modalOverlay = $('resource-modal');
  const modalIframe = $('resource-modal-iframe'), modalTitle = $('resource-modal-title'), pContainer = $('profile-edit-container');

  const ITEMS_PER_PAGE = 48;
  const IMAGE_LOAD_TIMEOUT = 5000;
  const FETCH_TIMEOUT = 10000;
  const IFRAME_SHOW_TIMEOUT = 2500;
  const DEFAULT_PIC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cpath fill='%23888' d='M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-61.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,133.52,0Z'/%3E%3C/svg%3E";
  const MAX_UNDERSCORES = 2, MAX_USERNAME_LENGTH = 20;

  let backendPort = null, backendReady = false, syncInterval = null, currentUser = null;
  let gRep = {}, gTruf = new Map();
  const lastIframeHtml = {};
  const iframeLoadFailed = {};
  const iframeLoadTokens = {};
  const iframeInFlight = {};
  let savedWindowScrollY = 0, savedPageScrollTop = 0;
  let sessionSettingsUpdated = false, initPromise = null;
  let isNavigating = false, autoRefreshBusy = false, firstNavStarted = false;

  pages.forEach(p => {
    p.style.opacity = p.classList.contains('active') ? '1' : '0';
    if (!p.classList.contains('active')) p.style.display = 'none';
  });

  try {
    currentUser = JSON.parse(getStorage('kstuff_user'));
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

  async function getProxyList() {

    return [
      `https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@main/`,
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
    if (!currentUser) currentUser = { settings: {} };
    currentUser.settings = p; setStorage('kstuff_user', JSON.stringify(currentUser));
    applyCloudSettings(p);
    sessionSettingsUpdated = true;
    if (currentUser.username && backendReady && backendPort) backendPort.postMessage({ type: 'update-settings', username: currentUser.username, settings: p });
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
      const isHtmlRepo = targetUrl.includes('freebuisness/html') || targetUrl.includes('{HTML_URL}') || targetUrl.includes('htm@main') || !targetUrl.startsWith('http');
      if (isHtmlRepo) {
        const cleanPath = targetUrl.replace(/\$?\{HTML_URL\}\/?/gi, '').replace(/^https?:\/\/[^\/]+\/(?:gh\/)?freebuisness\/html(?:@|\/)?(?:main\/)?/gi, '').replace(/^https?:\/\/[^\/]+\/freebuisness\/html\//gi, '').replace(/^\/+/, '');
        modalIframe.src = `https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@main/Assets/embed/launch.svg?url=https://cdn.jsdelivr.net/gh/freebuisness/html@main/${cleanPath}`;
      } else {
        const isProxyUrl = targetUrl.includes(gRep.static) || targetUrl.includes(gRep.scram) || targetUrl.includes(gRep.uv) || targetUrl.includes(gRep.truffled) || item.category === 'Apps' || (!targetUrl.includes('raw.githubusercontent.com') && !targetUrl.includes('cdn.jsdelivr.net'));
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
      card.innerHTML = `<img alt="" style="display:none;"><div class="category-label"></div><div class="overlay"><h3></h3><p></p></div>`;
      grid.pool.push({ el: card, img: card.querySelector('img'), t: card.querySelector('h3'), d: card.querySelector('p'), c: card.querySelector('.category-label') });
      frag.appendChild(card);
    }
    grid.gridEl.appendChild(frag);
    grid.gridEl.onclick = e => { const c = e.target.closest('.round-btn'); if (c && c.style.display !== 'none') openResource(grid.paginatedData?.[c.dataset.index]); };
  };

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
  if (currentUser) applyCloudSettings(currentUser.settings || { theme: currentUser.theme });

  [['auth-modal-overlay', 'auth-close-btn'], ['profile-modal-overlay', 'profile-close-btn'], ['homeworkhelper-modal', 'homeworkhelper-close-btn'], ['changelog-modal', 'changelog-close-btn']]
    .forEach(([mId, bId]) => {
      const m = $(mId);
      $(bId)?.addEventListener('click', () => m?.classList.remove('active'));
      m?.addEventListener('click', e => e.target === m && m.classList.remove('active'));
    });

  const authMod = $('auth-modal-overlay'), profMod = $('profile-modal-overlay');
  const handleAuth = t => () => {
    const u = $('auth-user')?.value.trim(), p = $('auth-pass')?.value.trim();
    const errEl = $('auth-error-msg');
    if (t === 'signup') {
      if (u.length > MAX_USERNAME_LENGTH) return errEl && (errEl.textContent = "Username cannot exceed 20 characters.", errEl.style.display = 'block');
      if (!/^[a-zA-Z0-9_]+$/.test(u)) return errEl && (errEl.textContent = "Username can only contain letters, numbers, and underscores.", errEl.style.display = 'block');
      if ((u.match(/_/g) || []).length > MAX_UNDERSCORES) return errEl && (errEl.textContent = `Username can only contain up to ${MAX_UNDERSCORES} underscores.`, errEl.style.display = 'block');
    }
    if (u && p && backendPort) backendPort.postMessage({ type: t, username: u, password: p, ...(t === 'signup' ? { profilePicture: DEFAULT_PIC } : {}) });
    else if (!u || !p) errEl && (errEl.textContent = "Fill out all fields.", errEl.style.display = 'block');
  };

  $('do-login-btn')?.addEventListener('click', handleAuth('login'));
  $('do-signup-btn')?.addEventListener('click', handleAuth('signup'));
  ['auth-user', 'auth-pass'].forEach(id => $(id)?.addEventListener('input', () => $('auth-error-msg') && ($('auth-error-msg').style.display = 'none')));

  $('do-logout-btn')?.addEventListener('click', () => {
    currentUser = null; localStorage.removeItem('kstuff_user');
    backendPort?.postMessage({ type: 'logout' });
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
    if (!currentUser || !backendPort) return;
    const btn = e.target, oT = btn.textContent; btn.textContent = "Saving...";
    currentUser.profilePicture = $('profile-edit-pic-url').value.trim() || "https://kstuff.neocities.org/assets/default-profile.png";
    currentUser.description = $('profile-edit-desc').value.trim() || "No bio provided yet.";
    setStorage('kstuff_user', JSON.stringify(currentUser)); updateAuthUI();
    backendPort.postMessage({ type: 'update-settings', username: currentUser.username, settings: { profilePicture: currentUser.profilePicture, description: currentUser.description } });
    setTimeout(() => { btn.textContent = oT; toggleProfEdit(false); }, 600);
  });

  const loadContent = async (tId, forceReload = false, customSrc = null) => {
    firstNavStarted = true;
    isNavigating = true;
    try {
      if (tId === 'studyhall' && !currentUser) { authMod?.classList.add('active'); toggleLoader(false); return; }
      const targetPage = $(tId); if (!targetPage) return toggleLoader(false);

      if (targetPage.classList.contains('active') && !forceReload && !customSrc) {
        const ifr = iframePages[tId];
        if (ifr && iframeInFlight[ifr.id]) return;
        if (!(ifr && (iframeLoadFailed[ifr.id] || !$(ifr.id)?.srcdoc))) return toggleLoader(false);
      }

      const currentActive = document.querySelector('.page.active:not(#' + tId + ')');
      toggleLoader(true);
      if (currentActive) {
        currentActive.classList.remove('active'); currentActive.style.display = 'none';
        if (iframePages[currentActive.id]) {
          const oldId = iframePages[currentActive.id].id;
          cancelIframeLoads(oldId);
          const oldIframe = $(oldId);
          if (oldIframe) { oldIframe.removeAttribute('srcdoc'); oldIframe.src = 'about:blank'; }
        }
      }
      Object.keys(grids).forEach(k => {
        if (k !== tId && grids[k].gridEl) {
          if (grids[k].pool) grids[k].pool.forEach(p => { if (p.img) { p.img.onload = p.img.onerror = null; p.img.src = ''; } });
          grids[k].gridEl.innerHTML = ''; grids[k].pool = [];
        }
      });

      targetPage.style.display = 'block'; targetPage.style.opacity = '1'; targetPage.classList.add('active');

      if (grids[tId]) {
        buildPool(tId);
        await renderGrid(tId, false);
      }
      else if (iframePages[tId]) {
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
    const lDivs = btn.querySelectorAll('.label-data div');
    btn.dataset.tooltip = lDivs.length ? Array.from(lDivs).map(d => d.textContent).reverse().join('') : (btn.title || btn.dataset.target);
    btn.addEventListener('click', async () => {
      tooltipEl.style.display = 'none';
      const tId = btn.dataset.target;
      if (tId === 'profile') return !currentUser ? authMod?.classList.add('active') : (updateAuthUI(), profMod?.classList.add('active'));
      if (tId === 'homeworkhelper') return $('homeworkhelper-modal')?.classList.add('active');
      if (tId === 'changelog') return $('changelog-modal')?.classList.add('active');
      if (tId === 'studyhall' && !currentUser) { authMod?.classList.add('active'); return; }
      navBtns.forEach(b => !['homeworkhelper','changelog','profile'].includes(b.dataset.target) && b.classList.remove('active'));
      btn.classList.add('active'); updateIndicator(btn);
      toggleLoader(true);
      if (grids[tId] && initPromise) {
        await initPromise;
        if (!btn.classList.contains('active')) return;
      }
      loadContent(tId);
    });
  });

  window.addEventListener('message', (event) => {
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

  const appB = s => {
    if (typeof s !== 'string') return s;
    for (const [k, v] of Object.entries(gRep)) s = s.split(`\${${k}}`).join(v);
    let parsed = s.replace(/([^:]\/)\/+/g, '$1');
    return parsed.replace(/^http:\/\//i, 'https://');
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
    p.url = appB(p.url); p.image = appB(p.image); return p;
  }).sort((a, b) => (a.title||"").localeCompare(b.title||"", undefined, { sensitivity: 'base' }));

  const rData = async (t, p, resetPage = true, mode = 'updating', silent = false) => {
    try {
      const n = await fetchWithProxy(p).catch(err => { console.error('rData fetch failed', p, err); return null; });
      if (!n?.length) { if (!silent) toggleLoader(false); return false; }

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

  $('sciencequiz-refresh-btn')?.addEventListener('click', () => rData('sciencequiz', 'Json/a.json'));

  let rawReadingCornerData = [];
  let rawSciencequizData = [];

  function loadMirrorsScript() {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@main/Assets/js/mirrors.js?v=1101';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => { console.error('Failed to load mirrors.js'); resolve(false); };
      document.head.appendChild(script);
    });
  }

  function mirrorsToGRep(mirrors) {
    return {
      scram: mirrors?.scram || '',
      static: mirrors?.static || '',
      uv: mirrors?.uv || '',
      frogiee: mirrors?.frogiee || '',
      truffled: mirrors?.truffled || 'https://boat.strongson.com'
    };
  }

  function waitForMirrors(timeoutMs = 10000) {
    return new Promise(resolve => {
      if (window.kstuffMirrors && window.kstuffMirrors.status === 'ready') {
        return resolve(window.kstuffMirrors);
      }
      let done = false;
      const finish = m => {
        if (done) return;
        done = true;
        window.removeEventListener('kstuff-mirrors-updated', onUpdate);
        clearTimeout(timer);
        resolve(m);
      };
      const onUpdate = e => finish(e.detail || window.kstuffMirrors);
      window.addEventListener('kstuff-mirrors-updated', onUpdate);
      const timer = setTimeout(() => finish(window.kstuffMirrors || {}), timeoutMs);
    });
  }

  function reprocessGridsWithMirrors() {
    if (rawReadingCornerData.length) grids.readingcorner.data = proc(rawReadingCornerData);
    if (rawSciencequizData.length) grids.sciencequiz.data = proc(rawSciencequizData);
    const activePage = document.querySelector('.page.active');
    if (activePage && grids[activePage.id]) {
      buildPool(activePage.id);
      renderGrid(activePage.id, false, 'updating');
    }
  }

  function setupMirrorListener() {
    window.addEventListener('kstuff-mirrors-updated', (e) => {
      const mirrors = e.detail || window.kstuffMirrors;
      if (!mirrors) return;
      const newGRep = mirrorsToGRep(mirrors);
      const changed = JSON.stringify(newGRep) !== JSON.stringify(gRep);
      gRep = newGRep;
      if (changed) reprocessGridsWithMirrors();
    });
  }

  setupMirrorListener();
  loadMirrorsScript();

  initPromise = Promise.all([
    fetchReadingCornerRaw(),
    fetchWithProxy('Assets/json/a.json').catch(()=>[]),
    fetchWithProxy('Assets/json/truffled.json').catch(()=>null),
    waitForMirrors()
  ]).then(async ([gResult, a, tr, mirrors]) => {
    gTruf.clear();
    if (Array.isArray(tr?.games)) tr.games.forEach(x => gTruf.set(cleanGameTitle(x.name), x));

    gRep = mirrorsToGRep(mirrors);

    rawReadingCornerData = gResult?.data || [];
    rawSciencequizData = a || [];
    grids.readingcorner.data = proc(rawReadingCornerData);
    grids.sciencequiz.data = proc(rawSciencequizData);
  }).catch(err => console.error('init failed', err));

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

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tId = btn.dataset.target;
      if (urlMap[tId] && tbInput) {
        const newUrl = `kstuff://${urlMap[tId]}`;
        if (tbInput.value !== newUrl) {
          tbInput.value = newUrl;
          if (history[historyIndex] !== newUrl) {
            history = history.slice(0, historyIndex + 1);
            history.push(newUrl);
            historyIndex++;
            updateBrowserNav();
          }
        }
      }
    });
  });

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

  initPromise.then(async () => {
    if (firstNavStarted) return;
    let activePg = document.querySelector('.page.active');
    if (!activePg) {
      const defaultHomeBtn = Array.from(navBtns).find(b => b.dataset.target === 'mathworksheets');
      if (defaultHomeBtn) { navBtns.forEach(b => b.classList.remove('active')); defaultHomeBtn.classList.add('active'); updateIndicator(defaultHomeBtn); activePg = { id: 'mathworksheets' }; }
    }
    if (activePg) await loadContent(activePg.id, true); else toggleLoader(false);
  }).catch(err => { console.error('initPromise failed', err); toggleLoader(false); });

  const isAnyModalActive = () => !!document.querySelector('.modal-overlay.active');

  async function maybeReloadIframe(id, path) {
    try {
      const html = await fetchWithProxy(path, true);
      if (!iframeLoadFailed[id] && lastIframeHtml[id] === html) return false;
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
    if (autoRefreshBusy || isNavigating || isAnyModalActive()) return;
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    const tId = activePage.id;

    if (tId === 'mathworksheets' && tbInput && tbInput.value && tbInput.value !== 'kstuff://home') return;

    autoRefreshBusy = true;
    try {
      const ifr = iframePages[tId];
      const forcedByFailure = ifr && iframeLoadFailed[ifr.id];

      const upstreamChanged = window.kstuffMirrors?.lastUpdate > (window.kstuffLastRefresh || 0);
      if (!upstreamChanged && !forcedByFailure) return;
      window.kstuffLastRefresh = Date.now();

      if (tId === 'readingcorner') {
        await refreshReadingCorner(false, 'updating', true);
      } else if (tId === 'sciencequiz') {
        await rData('sciencequiz', 'Json/a.json', false, 'updating', true);
      } else if (ifr) {
        await maybeReloadIframe(ifr.id, ifr.path);
      }
    } finally {
      autoRefreshBusy = false;
    }
  }

  setInterval(autoRefreshActivePage, 200000);
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", initApp) : initApp();
