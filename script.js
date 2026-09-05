function initApp() {
    const $ = id => document.getElementById(id), $$ = sel => document.querySelectorAll(sel);
    const el = (tag, props) => Object.assign(document.createElement(tag), props);
    const getStorage = k => localStorage.getItem(k), setStorage = (k, v) => localStorage.setItem(k, v);
    const cleanUrl = u => u ? u.replace(/\/+$/, '') : '', trimSlash = u => u ? u.replace(/^\/+/, '') : '';

    const body = document.body, navBar = $('teachertouchbar'), navBtns = $$('.nav-btn'), pages = $$('.page');
    const loader = document.querySelector('.section-loader'), modalOverlay = $('resource-modal');
    const modalIframe = $('resource-modal-iframe'), modalTitle = $('resource-modal-title'), pContainer = $('profile-edit-container');

    const ITEMS_PER_PAGE = 48;
    const DEFAULT_PIC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cpath fill='%23888' d='M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-61.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,133.52,0Z'/%3E%3C/svg%3E";

    const MAX_UNDERSCORES = 2;
    const MAX_USERNAME_LENGTH = 20;

    let backendPort = null, backendReady = false, syncInterval = null, currentUser = null, cachedCommitHash = null;
    let savedWindowScrollY = 0, savedPageScrollTop = 0, gRep = {}, gTruf = new Map();
    let activeIframeLoadId = 0;

    try { 
        currentUser = JSON.parse(getStorage('kstuff_user')); 
        const uTheme = currentUser?.settings?.theme || currentUser?.theme;
        if (uTheme) setStorage('kstuff_theme', uTheme);
    } catch { localStorage.removeItem('kstuff_user'); }

    if (!getStorage('kstuff_theme')) setStorage('kstuff_theme', 'theme-sakura');

    const toggleLoader = show => loader && (loader.style.opacity = show ? '1' : '0', loader.classList.toggle('hidden', !show));
    toggleLoader(false);

    const tooltipEl = body.appendChild(el('div', { className: 'js-custom-tooltip' }));
    tooltipEl.style.cssText = `position:fixed;display:none;padding:6px 10px;background:rgba(0,0,0,0.85);color:#fff;font-size:0.75rem;border-radius:6px;pointer-events:none;z-index:999999;white-space:nowrap;transition:opacity 0.15s ease;`;

    const toggleTooltip = (e, show) => {
        const t = e?.target?.closest?.('[data-tooltip]');
        if (!t || !show) return tooltipEl.style.display = 'none';
        tooltipEl.textContent = t.dataset.tooltip;
        tooltipEl.style.cssText += `;display:block;left:${e.clientX + 12}px;top:${e.clientY + 12}px;`;
    };
    ['mouseover', 'mousemove', 'mouseout'].forEach(evt => document.addEventListener(evt, e => toggleTooltip(e, evt !== 'mouseout')));

    let indicator = navBar?.querySelector('.nav-indicator') || navBar?.prepend(el('div', { className: 'nav-indicator' })) || navBar?.querySelector('.nav-indicator');
    if (indicator) indicator.style.transition = 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)';

    const updateIndicator = btn => {
        if (!btn || !indicator || !navBar) return;
        const isVert = body.className.includes('nav-left') || body.className.includes('nav-right');
        const nR = navBar.getBoundingClientRect(), bR = btn.getBoundingClientRect();
        indicator.style.cssText += `width:${isVert ? '3px' : bR.width + 'px'};height:${isVert ? bR.height + 'px' : '3px'};transform:${isVert ? `translateY(${bR.top - nR.top}px)` : `translateX(${bR.left - nR.left}px)`};`;
    };

    async function getProxyList() {
        if (!cachedCommitHash) {
            try { cachedCommitHash = (await (await fetch("https://api.github.com/repos/lotsacookie/kstuff/commits/main")).json()).sha; } 
            catch { cachedCommitHash = "main"; }
        }
        return ["raw.githack.com", "cdn.jsdelivr.net/gh", "raw.githubusercontent.com", "cdn.statically.io/gh"]
            .map(d => `https://${d}/lotsacookie/kstuff/${cachedCommitHash}/`).concat("");
    }

    async function fetchWithProxy(path, asText = false) {
        const cb = (path.includes('?') ? '&' : '?') + '_=' + Date.now();
        for (const p of await getProxyList()) {
            try { 
                const r = await fetch(p + path + cb, { cache: 'no-store' }); 
                if (r.ok) return asText ? await r.text() : await r.json(); 
            } catch {}
        }
        throw new Error("Proxies failed: " + path);
    }

    async function getWorkingConfig(table) {
        if (!table?.length) return null;
        for (let i = 0; i < table.length; i += 5) {
            const chunk = table.slice(i, i + 5);
            const winner = await new Promise(resolve => {
                let done = false, fail = 0, imgs = [];
                const cleanup = () => imgs.forEach(img => { img.onload = img.onerror = null; img.src = ''; });
                const timer = setTimeout(() => { if (!done) { done = true; cleanup(); resolve(null); } }, 5000);

                chunk.forEach(entry => {
                    const img = new Image(); imgs.push(img);
                    const url = `${cleanUrl(entry.url)}/${trimSlash(entry.img)}`;
                    const handle = ok => {
                        if (done) return;
                        if (ok || ++fail === chunk.length) { done = true; clearTimeout(timer); cleanup(); resolve(ok ? entry : null); }
                    };
                    img.onload = () => handle(img.naturalWidth > 0);
                    img.onerror = () => handle(false);
                    img.src = `${url}${url.includes('?') ? '&' : '?'}bridge=${Date.now()}`;
                });
            });
            if (winner) return winner;
        }
        return table[0];
    }

    function initBackendBridge(config) {
        if (!config) return;
        const iframe = el('iframe', { style: "position:fixed;opacity:0;pointer-events:none;z-index:-1;" });
        const pfx = cleanUrl(config.url) + (config.final ? '/' + trimSlash(config.final) : '');
        iframe.src = pfx + (pfx.includes('embed.html#') ? '' : '/embed.html#') + 'https://lotsacookie.github.io/Dnekcabtset/backend.html?fixx1';
        body.appendChild(iframe);

        const timer = setInterval(() => {
            if (!backendReady && iframe.contentWindow) {
                const chan = new MessageChannel();
                chan.port1.onmessage = e => handleBackendMessage(e.data, chan.port1);
                try { iframe.contentWindow.postMessage({ type: 'init_cable' }, '*', [chan.port2]); } catch {}
            } else if (backendReady) clearInterval(timer);
        }, 1500);
    }

    function handleBackendMessage(data, port) {
        if (!data) return;
        if (data.type === 'ready') {
            backendReady = true; backendPort = port;
            if (currentUser) {
                const sync = () => port.postMessage({ type: 'auto-login', username: currentUser.username });
                sync(); syncInterval = setInterval(sync, 5000);
            }
        } else if (['login', 'auto-login', 'signup'].includes(data.type)) {
            if (data.type === 'auto-login' && syncInterval) clearInterval(syncInterval);
            const errEl = $('auth-error-msg');
            if (data.success) {
                if (currentUser?.settings?.lastUpdated > (data.payload.settings?.lastUpdated || 0)) data.payload.settings = currentUser.settings;
                currentUser = data.payload;
                const cTheme = currentUser.settings?.theme || currentUser.theme;
                if (cTheme) setStorage('kstuff_theme', cTheme);
                setStorage('kstuff_user', JSON.stringify(currentUser));
                applyCloudSettings(currentUser.settings || { theme: currentUser.theme }); updateAuthUI();
                if (errEl) errEl.style.display = 'none'; $('auth-modal-overlay')?.classList.remove('active');
            } else if (data.type === 'auto-login') {
                currentUser = null; localStorage.removeItem('kstuff_user'); updateAuthUI();
            } else if (errEl) {
                const msgs = { invalid: 'Fill out all fields.', exists: 'Username taken.', failed: 'Request failed.', not_found: 'Account not found.', invalid_password: 'Bad password.' };
                errEl.textContent = data.message || msgs[data.reason] || 'Invalid credentials.'; errEl.style.display = 'block';
            }
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

    const handleThemesLoaded = themes => {
        let css = '', html = '';
        themes.forEach(t => {
            css += `.${t.id}{${Object.entries(t.variables).map(([k,v]) => `${k}:${v};`).join('')}}\n`;
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
    };

    try { handleThemesLoaded(JSON.parse(getStorage('kstuff_themes_cache'))); } catch {}
    fetchWithProxy('Json/themes.json').then(t => { setStorage('kstuff_themes_cache', JSON.stringify(t)); handleThemesLoaded(t); }).catch(()=>{});

    const setupSetting = (id, key, prefix, fn) => {
        const select = $(id); if (!select) return;
        const val = getStorage(key) || select.value; select.value = val; fn(val);
        select.addEventListener('change', e => {
            if (prefix) body.className = body.className.replace(new RegExp(`\\b${prefix}-\\S+`, 'g'), '').trim();
            fn(e.target.value); setStorage(key, e.target.value);
            updateIndicator(navBar?.querySelector('.nav-btn.active'));
            Object.values(iframePages).forEach(p => $(p.id)?.contentWindow?.postMessage('theme-updated', '*'));
        });
    };

    setupSetting('layout-theme-select', 'kstuff_theme', 'theme', v => { body.classList.add(v); setStorage('kstuff_theme', v); });
    setupSetting('layout-nav-select', 'kstuff_nav_pos', 'nav', v => body.classList.add(v));
    setupSetting('layout-size-select', 'kstuff_nav_size', 'size', v => body.classList.add(v));
    setupSetting('layout-text-select', 'kstuff_text_vis', '', v => body.classList.toggle('text-hide', v === 'text-hide'));

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
        const p = { theme: $('layout-theme-select')?.value, navPos: $('layout-nav-select')?.value, navSize: $('layout-size-select')?.value, textVis: $('layout-text-select')?.value, lastUpdated: Date.now() };
        if (p.theme) setStorage('kstuff_theme', p.theme);
        if (currentUser && backendReady && backendPort) {
            currentUser.settings = p; setStorage('kstuff_user', JSON.stringify(currentUser));
            applyCloudSettings(p); backendPort.postMessage({ type: 'update-settings', username: currentUser.username, settings: p });
            btn.textContent = "Saved to Cloud!";
        } else btn.textContent = "Saved Locally!";
        const { background: oBg, color: oC } = btn.style; btn.style.background = "#4CAF50"; btn.style.color = "#fff";
        setTimeout(() => { btn.textContent = "Save Settings"; btn.style.background = oBg; btn.style.color = oC; }, 2000);
    });

    const iframePages = { 
        mathworksheets: { id: 'mathworksheets-iframe', path: 'Pages/browser.html' }, 
        gradebook: { id: 'gradebook-iframe', path: 'Pages/music.html' }, 
        lessonplanner: { id: 'lessonplanner-iframe', path: 'Pages/ai.html' },
        studyhall: { id: 'studyhall-iframe', path: 'Pages/music.html' },
        vms: { id: 'vms-iframe', path: 'Pages/music.html' }
    };

    async function loadIframePage(id, path) {
        const loadId = ++activeIframeLoadId;
        const f = $(id); 
        if (!f) return toggleLoader(false);
        
        f.style.display = 'none';
        toggleLoader(true);
        f.removeAttribute('srcdoc');
        f.src = 'about:blank';
        
        await new Promise(res => setTimeout(res, 10));
        if (loadId !== activeIframeLoadId) return;

        try {
            let html = await fetchWithProxy(path, true);
            if (loadId !== activeIframeLoadId) return;
            const inj = `<script>function sT(){if(!window.parent)return;const s=window.parent.getComputedStyle(window.parent.document.body),d=document.documentElement.style;d.setProperty('--bg',s.getPropertyValue('--background')||s.backgroundColor);d.setProperty('--text',s.getPropertyValue('--text-color')||s.color);d.setProperty('--nav',s.getPropertyValue('--nav-bg'));d.setProperty('--card',s.getPropertyValue('--card-bg'));}sT();window.addEventListener('message',e=>e.data==='theme-updated'&&sT());<\/script>`;
            
            f.onload = () => { 
                if (loadId === activeIframeLoadId) {
                    f.style.display = 'block';
                    toggleLoader(false); 
                }
            };
            
            await new Promise(res => setTimeout(res, 20));
            if (loadId !== activeIframeLoadId) return;
            f.srcdoc = html.includes('</body>') ? html.replace('</body>', inj + '</body>') : html + inj;
        } catch {
            if (loadId === activeIframeLoadId) {
                f.onload = () => {
                    f.style.display = 'block';
                    toggleLoader(false);
                };
                f.srcdoc = `<html style="background:transparent;"><body style="color:var(--text-color, white);display:flex;justify-content:center;align-items:center;height:100vh;"><h2>Failed to load.</h2></body></html>`;
            }
        }
    }

    const grids = {
        readingcorner: { data: [], pool: [], gridEl: $('readingcorner-grid'), pageEl: $('readingcorner-pagination'), category: "All", search: "", page: 1, id: 'readingcorner' },
        sciencequiz: { data: [], pool: [], gridEl: $('sciencequiz-grid'), pageEl: $('sciencequiz-pagination'), category: "All", search: "", page: 1, id: 'sciencequiz' }
    };

    const openResource = item => {
        if (!item) return;
        toggleTooltip(null, false);
        savedWindowScrollY = window.scrollY || document.documentElement.scrollTop;
        savedPageScrollTop = document.querySelector('.page.active')?.scrollTop || 0;
        if (modalTitle) modalTitle.textContent = item.title;
        if (modalOverlay) modalOverlay.classList.add('active');
        if (modalIframe) modalIframe.src = item.url;
        setTimeout(() => Object.values(grids).forEach(g => { if(g.gridEl) g.gridEl.innerHTML = ''; g.pool = []; }), 50);
    };

    const buildPool = type => {
        const grid = grids[type]; if (!grid.gridEl) return;
        grid.gridEl.innerHTML = ''; grid.pool = [];
        const frag = document.createDocumentFragment();
        for (let i = 0; i < ITEMS_PER_PAGE; i++) {
            const card = el('div', { className: 'round-btn' }); card.dataset.index = i;
            card.innerHTML = `<img alt="" loading="lazy" style="display:none;"><div class="category-label"></div><div class="overlay"><h3></h3><p></p></div>`;
            grid.pool.push({ el: card, img: card.querySelector('img'), t: card.querySelector('h3'), d: card.querySelector('p'), c: card.querySelector('.category-label') });
            frag.appendChild(card);
        }
        grid.gridEl.appendChild(frag);
        grid.gridEl.onclick = e => { const c = e.target.closest('.round-btn'); if (c && c.style.display !== 'none') openResource(grid.paginatedData?.[c.dataset.index]); };
    };

    const renderGrid = async (type, preload = false) => {
        const grid = grids[type]; if (!grid.gridEl) return;
        toggleLoader(true);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const filtered = grid.data.filter(i => (grid.category === "All" || i.category === grid.category) && i.title.toLowerCase().includes(grid.search));
        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
        grid.page = grid.page > totalPages ? 1 : grid.page;
        grid.paginatedData = filtered.slice((grid.page - 1) * ITEMS_PER_PAGE, grid.page * ITEMS_PER_PAGE);

        const exec = () => {
            requestAnimationFrame(() => {
                grid.pool.forEach((p, i) => {
                    const item = grid.paginatedData[i]; p.el.style.display = item ? 'block' : 'none';
                    if (item) {
                        if (p.img.dataset.src !== (item.image || '')) { p.img.dataset.src = p.img.src = item.image || ''; p.img.style.display = item.image ? 'block' : 'none'; }
                        if (p.t.textContent !== item.title) p.t.textContent = item.title;
                        if (p.d.textContent !== (item.description || '')) p.d.textContent = item.description || '';
                        if (p.c) p.c.textContent = item.category || 'All';
                        p.el.dataset.tooltip = item.title;
                    } else {
                        p.img.dataset.src = ''; p.img.removeAttribute('src'); p.img.style.display = 'none';
                        if (p.c) p.c.textContent = ''; delete p.el.dataset.tooltip;
                    }
                });

                if (grid.pageEl) {
                    grid.pageEl.innerHTML = totalPages > 1 ? `<button class="page-btn" id="${type}-prev" ${grid.page===1?'style="opacity:0.4;cursor:not-allowed;"':''}><i class="ph ph-caret-left"></i></button><span style="font-weight:700;font-size:1.1rem;min-width:80px;text-align:center;user-select:none;">${grid.page} / ${totalPages}</span><button class="page-btn" id="${type}-next" ${grid.page===totalPages?'style="opacity:0.4;cursor:not-allowed;"':''}><i class="ph ph-caret-right"></i></button>` : '';
                    if (totalPages > 1) {
                        $(`${type}-prev`).onclick = () => { if (grid.page > 1) { grid.page--; renderGrid(type, true); } };
                        $(`${type}-next`).onclick = () => { if (grid.page < totalPages) { grid.page++; renderGrid(type, true); } };
                    }
                }

                Promise.all(grid.pool.map((p, i) => grid.paginatedData[i]?.image && p.img ? new Promise(res => {
                    if (p.img.complete && p.img.naturalWidth > 0) return res();
                    p.img.onload = p.img.onerror = () => { p.img.onload = p.img.onerror = null; res(); };
                    setTimeout(res, 4000);
                }) : null)).then(() => { grid.gridEl.style.opacity = '1'; toggleLoader(false); });
            });
        };

        if (preload) { 
            grid.gridEl.style.opacity = '0'; 
            setTimeout(exec, 100); 
        } else {
            exec();
        }
    };

    Object.keys(grids).forEach(type => {
        let timer;
        $(`${type}-search`)?.addEventListener('input', e => {
            const clr = $(`${type}-search-clear`); if (clr) clr.style.display = e.target.value ? 'block' : 'none';
            clearTimeout(timer); toggleLoader(true);
            timer = setTimeout(() => { grids[type].search = e.target.value.toLowerCase().trim(); grids[type].page = 1; renderGrid(type, true); }, 150);
        });
        $(`${type}-search-clear`)?.addEventListener('click', () => {
            $(`${type}-search`).value = ''; $(`${type}-search-clear`).style.display = 'none';
            grids[type].search = ''; grids[type].page = 1; toggleLoader(true); renderGrid(type, true);
        });
    });

    document.addEventListener('keydown', e => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
        const activePage = document.querySelector('.page.active');
        if (!activePage) return;
        const type = activePage.id;
        if (grids[type]) {
            const grid = grids[type];
            const filtered = grid.data.filter(i => (grid.category === "All" || i.category === grid.category) && i.title.toLowerCase().includes(grid.search));
            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
            if (e.key === 'ArrowLeft' && grid.page > 1) {
                e.preventDefault();
                grid.page--;
                renderGrid(type, true);
            } else if (e.key === 'ArrowRight' && grid.page < totalPages) {
                e.preventDefault();
                grid.page++;
                renderGrid(type, true);
            }
        }
    });

    document.head.appendChild(el('style', { textContent: `i.profile-avatar-container{width:1.2em;height:1.2em;border-radius:50%;overflow:hidden;display:inline-flex;justify-content:center;align-items:center;}i.profile-avatar-container img{width:100%;height:100%;object-fit:cover;}` }));

    const updateAuthUI = () => {
        const btn = $('profile-nav-btn'); if (!btn) return;
        const pic = currentUser?.profilePicture || DEFAULT_PIC;
        if (currentUser) {
            if ($('profile-modal-pic')) $('profile-modal-pic').src = pic;
            if ($('profile-modal-username')) $('profile-modal-username').textContent = currentUser.username || "User";
            if ($('profile-modal-desc')) $('profile-modal-desc').textContent = currentUser.description || "No bio.";
            btn.querySelector('i')?.replaceWith(el('i', { className: 'ph profile-avatar-container', innerHTML: `<img src="${pic}" onerror="this.src='${DEFAULT_PIC}'">` }));
        } else {
            btn.querySelector('i')?.replaceWith(el('i', { className: 'ph ph-user', id: 'profile-nav-icon' }));
        }
    };

    updateAuthUI();
    if (currentUser) applyCloudSettings(currentUser.settings || { theme: currentUser.theme });

    const bindModal = (id, bId) => {
        const m = $(id);
        $(bId)?.addEventListener('click', () => m?.classList.remove('active'));
        m?.addEventListener('click', e => e.target === m && m.classList.remove('active'));
        return m;
    };

    const authMod = bindModal('auth-modal-overlay', 'auth-close-btn'), profMod = bindModal('profile-modal-overlay', 'profile-close-btn');
    bindModal('homeworkhelper-modal', 'homeworkhelper-close-btn'); bindModal('changelog-modal', 'changelog-close-btn');

    const handleAuth = t => () => {
        const u = $('auth-user')?.value.trim(), p = $('auth-pass')?.value.trim();
        const errEl = $('auth-error-msg');

        if (t === 'signup') {
            if (u.length > MAX_USERNAME_LENGTH) {
                if (errEl) { errEl.textContent = "Username cannot exceed 20 characters."; errEl.style.display = 'block'; }
                return;
            }
            if (!/^[a-zA-Z0-9_]+$/.test(u)) {
                if (errEl) { errEl.textContent = "Username can only contain letters, numbers, and underscores."; errEl.style.display = 'block'; }
                return;
            }
            const underscoreCount = (u.match(/_/g) || []).length;
            if (underscoreCount > MAX_UNDERSCORES) {
                if (errEl) { errEl.textContent = `Username can only contain up to ${MAX_UNDERSCORES} underscores.`; errEl.style.display = 'block'; }
                return;
            }
        }

        if (u && p && backendPort) {
            backendPort.postMessage({ type: t, username: u, password: p, ...(t === 'signup' ? { profilePicture: DEFAULT_PIC } : {}) });
        } else if (!u || !p) {
            if (errEl) { errEl.textContent = "Fill out all fields."; errEl.style.display = 'block'; }
        }
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

    const loadContent = tId => {
        if (!$(tId)) return toggleLoader(false);
        $(tId).classList.add('active');
        Object.keys(grids).forEach(k => k !== tId && ($(`${k}-grid`).innerHTML = '', grids[k].pool = []));
        if (grids[tId]) { buildPool(tId); setTimeout(() => renderGrid(tId, false), 50); }
        else if (iframePages[tId]) loadIframePage(iframePages[tId].id, iframePages[tId].path);
        else toggleLoader(false);
    };

    navBtns.forEach(btn => {
        const lDivs = btn.querySelectorAll('.label-data div');
        btn.dataset.tooltip = lDivs.length ? Array.from(lDivs).map(d => d.textContent).reverse().join('') : (btn.title || btn.dataset.target);

        btn.addEventListener('click', async () => {
            toggleTooltip(null, false);
            const tId = btn.dataset.target;
            if (tId === 'profile') return !currentUser ? authMod?.classList.add('active') : (updateAuthUI(), profMod?.classList.add('active'));
            if (tId === 'homeworkhelper') return $('homeworkhelper-modal')?.classList.add('active');
            if (tId === 'changelog') return $('changelog-modal')?.classList.add('active');

            toggleLoader(true);
            navBtns.forEach(b => !['homeworkhelper','changelog','profile'].includes(b.dataset.target) && b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            btn.classList.add('active'); updateIndicator(btn);
            
            await new Promise(resolve => setTimeout(resolve, 30));
            loadContent(tId);
        });
    });

    const activeNavBtn = navBar?.querySelector('.nav-btn.active') || navBtns[0];
    if (activeNavBtn) {
        updateIndicator(activeNavBtn);
        window.addEventListener('load', () => updateIndicator(navBar.querySelector('.nav-btn.active') || navBtns[0]));
    }

    let rsTimer;
    window.addEventListener('resize', () => { clearTimeout(rsTimer); rsTimer = setTimeout(() => updateIndicator(document.querySelector('.nav-btn.active')), 100); });

    const closeRes = () => {
        modalOverlay?.classList.remove('active'); if (modalIframe) modalIframe.src = 'about:blank';
        const aPg = document.querySelector('.page.active');
        if (aPg && grids[aPg.id]) { buildPool(aPg.id); renderGrid(aPg.id, false); }
        setTimeout(() => { window.scrollTo(0, savedWindowScrollY); if (aPg) aPg.scrollTop = savedPageScrollTop; }, 50);
    };

    $('resource-close-btn')?.addEventListener('click', closeRes);
    modalOverlay?.addEventListener('click', e => e.target === modalOverlay && closeRes());
    $('resource-fullscreen-btn')?.addEventListener('click', () => !document.fullscreenElement ? modalIframe?.requestFullscreen().catch(()=>{}) : document.exitFullscreen());

    fetchWithProxy('Json/categories.json').then(c => {
        const setC = (id, opts, type) => {
            const s = $(id); if (!s) return;
            s.innerHTML = (opts||[]).map(o => `<option value="${o}">${o}</option>`).join(''); applyCustomDropdown(s);
            s.addEventListener('change', e => { toggleLoader(true); grids[type].category = e.target.value; grids[type].page = 1; renderGrid(type, true); });
        };
        setC('readingcorner-category-select', c.Games, 'readingcorner'); setC('sciencequiz-category-select', c.Apps, 'sciencequiz');
    }).catch(()=>{});

    fetchWithProxy('Json/change-log.json').then(l => {
        if ($('changelog-timestamp')) $('changelog-timestamp').textContent = l?.timestamp || "Unknown";
        if ($('changelog-content')) $('changelog-content').innerHTML = l?.changes?.length ? `<ul style="padding-left:1.5rem;margin:0;">${l.changes.map(c => `<li style="margin-bottom:0.5rem;">${c}</li>`).join('')}</ul>` : "No recent changes found.";
    }).catch(()=>{});

    const appB = s => {
        if (typeof s !== 'string') return s;
        for (const [k,v] of Object.entries(gRep)) s = s.split(`\${${k}}`).join(v);
        return s.replace(/([^:]\/)\/+/g, '$1');
    };

    const proc = arr => arr.map(i => {
        let p = { ...i };
        if (p.url?.includes('${truffled}')) {
            const m = gTruf.get((p.title||"").toLowerCase().trim());
            if (m) { p.title = m.name; p.url = '${truffled}/' + trimSlash(m.url); p.image = '${truffled}/' + trimSlash(m.thumbnail); p.description = ''; p.category = p.category || 'Truffled'; }
        }
        p.url = appB(p.url); p.image = appB(p.image); return p;
    }).sort((a, b) => (a.title||"").localeCompare(b.title||"", undefined, { sensitivity: 'base' }));

    const rData = async (t, p) => {
        toggleLoader(true);
        try {
            const n = await fetchWithProxy(p).catch(()=>[]);
            if (n?.length) { grids[t].data = proc(n); grids[t].page = 1; renderGrid(t, true); } else toggleLoader(false);
        } catch { toggleLoader(false); }
    };

    $('readingcorner-refresh-btn')?.addEventListener('click', () => rData('readingcorner', 'Json/g.json'));
    $('sciencequiz-refresh-btn')?.addEventListener('click', () => rData('sciencequiz', 'Json/a.json'));

    const fCfg = u => fetchWithProxy(u).catch(()=>[]).then(getWorkingConfig);
    const sDP = fetchWithProxy('Json/urls/static.json').catch(()=>[]);

    Promise.all([
        fetchWithProxy('Json/g.json').catch(()=>[]), fetchWithProxy('Json/a.json').catch(()=>[]), fetchWithProxy('Json/truffled.json').catch(()=>null),
        fCfg('Json/urls/scram.json'), sDP.then(getWorkingConfig), fCfg('Json/urls/uv.json'), fCfg('Json/urls/truffled.json'),
        sDP.then(d => getWorkingConfig(d.map(i => ({ url: i.url, img: i.img, final: "" }))))
    ]).then(([g, a, tr, sc, st, uv, trCfg, fr]) => {
        if (st) initBackendBridge(st);
        gRep = {
            scram: sc ? cleanUrl(sc.url) + sc.final : '',
            static: st ? cleanUrl(st.url) + st.final : '',
            uv: uv ? cleanUrl(uv.url) + uv.final : '',
            frogiee: fr ? cleanUrl(fr.url) : '',
            truffled: trCfg ? cleanUrl(trCfg.url) : 'https://boat.strongson.com'
        };
        gTruf.clear(); tr?.games?.forEach(x => gTruf.set(x.name.toLowerCase().trim(), x));
        grids.readingcorner.data = proc(g); grids.sciencequiz.data = proc(a);
        loadContent(document.querySelector('.page.active')?.id);
    }).catch(() => toggleLoader(false));
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", initApp) : initApp();
