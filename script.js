function initApp() {
    const $ = id => document.getElementById(id), $$ = sel => document.querySelectorAll(sel);
    const body = document.body, navBar = $('teachertouchbar'), navBtns = $$('.nav-btn'), pages = $$('.page'), loader = document.querySelector('.section-loader');
    const modalOverlay = $('resource-modal'), modalIframe = $('resource-modal-iframe'), modalTitle = $('resource-modal-title');
    let backendPort = null, backendReady = false, syncInterval = null, currentUser = null, cachedCommitHash = null;
    let savedWindowScrollY = 0, savedPageScrollTop = 0;

    try { currentUser = JSON.parse(localStorage.getItem('kstuff_user')); } catch { localStorage.removeItem('kstuff_user'); }

    const toggleLoader = show => loader && (loader.style.opacity = show ? '1' : '0', loader.classList.toggle('hidden', !show));
    toggleLoader(false);

    const tooltipEl = Object.assign(document.createElement('div'), { className: 'js-custom-tooltip' });
    tooltipEl.style.cssText = `position:fixed;display:none;padding:6px 10px;background:rgba(0,0,0,0.85);color:#fff;font-size:0.75rem;border-radius:6px;pointer-events:none;z-index:999999;white-space:nowrap;transition:opacity 0.15s ease;`;
    body.appendChild(tooltipEl);

    const toggleTooltip = (e, show) => {
        const t = e.target?.closest?.('[data-tooltip]');
        if (!t || !show) return tooltipEl.style.display = 'none';
        tooltipEl.textContent = t.dataset.tooltip; tooltipEl.style.display = 'block';
        tooltipEl.style.left = `${e.clientX + 12}px`; tooltipEl.style.top = `${e.clientY + 12}px`;
    };
    document.addEventListener('mouseover', e => toggleTooltip(e, true));
    document.addEventListener('mousemove', e => tooltipEl.style.display === 'block' && toggleTooltip(e, true));
    document.addEventListener('mouseout', e => toggleTooltip(e, false));

    let indicator = navBar?.querySelector('.nav-indicator') || Object.assign(document.createElement('div'), { className: 'nav-indicator' });
    if (!indicator.parentNode) navBar?.prepend(indicator);
    indicator.style.transition = 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'; // Replaces JS animation loop

    const updateIndicator = (activeBtn) => {
        if (!activeBtn || !indicator || !navBar) return;
        const isVert = body.classList.contains('nav-left') || body.classList.contains('nav-right');
        const nRect = navBar.getBoundingClientRect(), bRect = activeBtn.getBoundingClientRect();
        indicator.style.cssText += `width:${isVert ? '3px' : bRect.width+'px'};height:${isVert ? bRect.height+'px' : '3px'};transform:${isVert ? `translateY(${bRect.top - nRect.top}px)` : `translateX(${bRect.left - nRect.left}px)`};`;
    };

    async function getProxyList() {
        if (!cachedCommitHash) {
            try { cachedCommitHash = (await (await fetch("https://api.github.com/repos/lotsacookie/kstuff/commits/main")).json()).sha; } 
            catch { cachedCommitHash = "main"; }
        }
        return [`https://raw.githack.com/lotsacookie/kstuff/${cachedCommitHash}/`, `https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@${cachedCommitHash}/`, `https://raw.githubusercontent.com/lotsacookie/kstuff/${cachedCommitHash}/`, `https://cdn.statically.io/gh/lotsacookie/kstuff/${cachedCommitHash}/`, ""];
    }

    async function fetchWithProxy(path, asText = false) {
        for (const proxy of await getProxyList()) {
            try { const r = await fetch(proxy + path + (proxy ? "" : "?_=" + Date.now())); if (r.ok) return asText ? await r.text() : await r.json(); } catch {}
        }
        throw new Error("Proxies failed: " + path);
    }

    async function getWorkingConfig(table) {
        if (!table?.length) return null;
        for (let i = 0; i < table.length; i += 5) {
            const chunk = table.slice(i, i + 5);
            const winner = await new Promise(resolve => {
                let d = 0, f = 0, imgs = [];
                const cleanup = () => imgs.forEach(im => { im.onload = im.onerror = null; im.src = ''; });
                chunk.forEach(entry => {
                    const img = new Image(); imgs.push(img);
                    const url = `${entry.url.replace(/\/+$/, '')}/${entry.img.replace(/^\/+/, '')}`;
                    const done = (s) => { if (d) return; if (s || ++f === chunk.length) { d = 1; cleanup(); resolve(s ? entry : null); } };
                    img.onload = () => done(img.naturalWidth > 0); img.onerror = () => done(false);
                    img.src = `${url}${url.includes('?') ? '&' : '?'}bridge=${Date.now()}`;
                });
                setTimeout(() => { if (!d) { d = 1; cleanup(); resolve(null); } }, 8000);
            });
            if (winner) return winner;
        }
        return table[0];
    }

    function initBackendBridge(config) {
        if (!config) return;
        const hiddenFrame = Object.assign(document.createElement('iframe'), { style: "position:fixed;opacity:0;pointer-events:none;z-index:-1;" });
        const prefix = (config.url || '').replace(/\/+$/, '') + (config.final ? '/' + config.final.replace(/^\/+/, '') : '');
        hiddenFrame.src = prefix + (prefix.includes('embed.html#') ? '' : '/embed.html#') + 'https://lotsacookie.github.io/Dnekcabtset/backend.html?fixx1';
        body.appendChild(hiddenFrame);
        const cableInterval = setInterval(() => {
            if (!backendReady && hiddenFrame.contentWindow) {
                const chan = new MessageChannel();
                chan.port1.onmessage = e => handleBackendMessage(e.data, chan.port1);
                try { hiddenFrame.contentWindow.postMessage({ type: 'init_cable' }, '*', [chan.port2]); } catch {}
            }
        }, 1500);
    }

    function handleBackendMessage(data, port) {
        if (!data) return;
        if (data.type === 'ready') {
            backendReady = true; backendPort = port;
            if (currentUser) { const sync = () => port.postMessage({ type: 'auto-login', username: currentUser.username }); sync(); syncInterval = setInterval(sync, 5000); }
        } else if (['login', 'auto-login', 'signup'].includes(data.type)) {
            if (data.type === 'auto-login' && syncInterval) clearInterval(syncInterval);
            const errEl = $('auth-error-msg');
            if (data.success) {
                if (currentUser?.settings?.lastUpdated > (data.payload.settings?.lastUpdated || 0)) data.payload.settings = currentUser.settings;
                localStorage.setItem('kstuff_user', JSON.stringify(currentUser = data.payload));
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
        
        const wrapper = document.createElement('div'), trigger = document.createElement('div'), optionsContainer = document.createElement('div');
        wrapper.className = 'custom-select-wrapper'; trigger.className = 'custom-select-trigger'; optionsContainer.className = 'custom-select-options';
        trigger.innerHTML = `<span>${selectEl.options[selectEl.selectedIndex]?.text || ''}</span> <i class="ph ph-caret-down"></i>`;
        
        Array.from(selectEl.options).forEach((opt, idx) => {
            const el = document.createElement('div');
            el.className = `custom-select-option ${idx === selectEl.selectedIndex ? 'selected' : ''}`; el.textContent = opt.text;
            el.onclick = e => {
                e.stopPropagation(); selectEl.value = opt.value; trigger.querySelector('span').textContent = opt.text;
                optionsContainer.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
                el.classList.add('selected'); optionsContainer.classList.remove('open');
                selectEl.dispatchEvent(new Event('change'));
            };
            optionsContainer.appendChild(el);
        });
        trigger.onclick = e => { e.stopPropagation(); $$('.custom-select-options.open').forEach(el => el !== optionsContainer && el.classList.remove('open')); optionsContainer.classList.toggle('open'); };
        wrapper.append(trigger, optionsContainer); selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);
    }
    
    document.addEventListener('click', () => $$('.custom-select-options.open').forEach(el => el.classList.remove('open')));
    $$('.setting-group select').forEach(applyCustomDropdown);

    fetchWithProxy('Json/themes.json').then(themes => {
        let css = '', html = '';
        themes.forEach(t => { css += `.${t.id} { ${Object.entries(t.variables).map(([k,v]) => `${k}:${v};`).join('')} }\n`; html += `<option value="${t.id}">${t.name}</option>`; });
        document.head.appendChild(Object.assign(document.createElement('style'), { id: 'dynamic-themes-style', textContent: css }));
        const sel = $('layout-theme-select');
        if (sel) {
            sel.innerHTML = html; sel.value = localStorage.getItem('kstuff_theme') || themes[0].id;
            body.className = body.className.replace(/\btheme-\S+/g, '').trim(); body.classList.add(sel.value); applyCustomDropdown(sel);
        }
    }).catch(()=>{});

    const setupSetting = (id, key, prefix, fn) => {
        const el = $(id); if (!el) return;
        const saved = localStorage.getItem(key) || el.value; el.value = saved; fn(saved);
        el.addEventListener('change', e => {
            if (prefix) body.className = body.className.replace(new RegExp(`\\b${prefix}-\\S+`, 'g'), '').trim();
            fn(e.target.value); localStorage.setItem(key, e.target.value); updateIndicator(navBar?.querySelector('.nav-btn.active'));
            Object.values(iframePages).forEach(p => $(p.id)?.contentWindow?.postMessage('theme-updated', '*'));
        });
    };
    setupSetting('layout-theme-select', 'kstuff_theme', 'theme', v => body.classList.add(v));
    setupSetting('layout-nav-select', 'kstuff_nav_pos', 'nav', v => body.classList.add(v));
    setupSetting('layout-size-select', 'kstuff_nav_size', 'size', v => body.classList.add(v));
    setupSetting('layout-text-select', 'kstuff_text_vis', '', v => body.classList.toggle('text-hide', v === 'text-hide'));

    function applyCloudSettings(settings) {
        if (!settings) return;
        [{ i: 'layout-theme-select', k: 'kstuff_theme', v: settings.theme }, { i: 'layout-nav-select', k: 'kstuff_nav_pos', v: settings.navPos }, { i: 'layout-size-select', k: 'kstuff_nav_size', v: settings.navSize }, { i: 'layout-text-select', k: 'kstuff_text_vis', v: settings.textVis }].forEach(({ i, k, v }) => {
            const el = $(i);
            if (v && el) {
                localStorage.setItem(k, v); el.value = v; el.dispatchEvent(new Event('change'));
                const wrap = el.nextElementSibling;
                if (wrap?.classList.contains('custom-select-wrapper')) {
                    wrap.querySelector('.custom-select-trigger span').textContent = el.options[el.selectedIndex]?.text || '';
                    wrap.querySelectorAll('.custom-select-option').forEach((o, idx) => o.classList.toggle('selected', idx === el.selectedIndex));
                }
            }
        });
    }

    $('save-settings-btn')?.addEventListener('click', e => {
        const b = e.target, p = { theme: $('layout-theme-select')?.value, navPos: $('layout-nav-select')?.value, navSize: $('layout-size-select')?.value, textVis: $('layout-text-select')?.value, lastUpdated: Date.now() };
        if (currentUser && backendReady && backendPort) {
            currentUser.settings = p; localStorage.setItem('kstuff_user', JSON.stringify(currentUser));
            applyCloudSettings(p); backendPort.postMessage({ type: 'update-settings', username: currentUser.username, settings: p });
            b.textContent = "Saved to Cloud!";
        } else b.textContent = "Saved Locally!";
        const oBg = b.style.background, oC = b.style.color; b.style.background = "#4CAF50"; b.style.color = "#fff";
        setTimeout(() => { b.textContent = "Save Settings"; b.style.background = oBg; b.style.color = oC; }, 2000);
    });

    const iframePages = { mathworksheets: { id: 'mathworksheets-iframe', path: 'Pages/browser.html' }, gradebook: { id: 'gradebook-iframe', path: 'Pages/music.html' }, lessonplanner: { id: 'lessonplanner-iframe', path: 'Pages/ai.html' } };
    async function loadIframePage(id, path) {
        const f = $(id); if (!f || (f.dataset.loadedPath === path && f.srcdoc)) return toggleLoader(false);
        toggleLoader(true);
        try {
            let html = await fetchWithProxy(path, true);
            const inj = `<script>function sT(){if(!window.parent)return;const s=window.parent.getComputedStyle(window.parent.document.body),d=document.documentElement.style;d.setProperty('--bg',s.getPropertyValue('--background')||s.backgroundColor);d.setProperty('--text',s.getPropertyValue('--text-color')||s.color);d.setProperty('--nav',s.getPropertyValue('--nav-bg'));d.setProperty('--card',s.getPropertyValue('--card-bg'));}sT();window.addEventListener('message',e=>e.data==='theme-updated'&&sT());<\/script>`;
            f.onload = () => toggleLoader(false); f.dataset.loadedPath = path; f.srcdoc = html.includes('</body>') ? html.replace('</body>', inj + '</body>') : html + inj;
        } catch { f.onload = () => toggleLoader(false); f.srcdoc = `<html style="background:transparent;"><body style="color:var(--text-color, white);display:flex;justify-content:center;align-items:center;height:100vh;"><h2>Failed to load.</h2></body></html>`; }
    }

    const grids = { readingcorner: { data: [], pool: [], gridEl: $('readingcorner-grid'), pageEl: $('readingcorner-pagination'), category: "All", search: "", page: 1, id: 'readingcorner' }, sciencequiz: { data: [], pool: [], gridEl: $('sciencequiz-grid'), pageEl: $('sciencequiz-pagination'), category: "All", search: "", page: 1, id: 'sciencequiz' } };
    
    const openResource = item => {
        if (!item) return;
        toggleTooltip({target: null}, false);
        savedWindowScrollY = window.scrollY || document.documentElement.scrollTop; savedPageScrollTop = document.querySelector('.page.active')?.scrollTop || 0;
        if (modalTitle) modalTitle.textContent = item.title; if (modalOverlay) modalOverlay.classList.add('active'); if (modalIframe) modalIframe.src = item.url;
        setTimeout(() => Object.values(grids).forEach(g => { if(g.gridEl) g.gridEl.innerHTML = ''; g.pool = []; }), 50); // Destroy pools on open
    };

    const buildPool = type => {
        const grid = grids[type]; if (!grid.gridEl) return;
        grid.gridEl.innerHTML = ''; grid.pool = [];
        for (let i = 0; i < 32; i++) {
            const card = document.createElement('div'); card.className = 'round-btn'; card.dataset.index = i;
            card.innerHTML = `<img alt="" loading="lazy" style="display:none;"><div class="category-label"></div><div class="overlay"><h3></h3><p></p></div>`;
            grid.pool.push({ el: card, img: card.querySelector('img'), t: card.querySelector('h3'), d: card.querySelector('p'), c: card.querySelector('.category-label') });
            grid.gridEl.appendChild(card);
        }
        grid.gridEl.onclick = e => { const c = e.target.closest('.round-btn'); if (c && c.style.display !== 'none') openResource(grid.paginatedData?.[c.dataset.index]); };
    };

    const renderGrid = (type, preload = false) => {
        requestAnimationFrame(() => {
            const grid = grids[type]; if (!grid.gridEl) return;
            const filtered = grid.data.filter(i => (grid.category === "All" || i.category === grid.category) && i.title.toLowerCase().includes(grid.search));
            const totalPages = Math.ceil(filtered.length / 32) || 1; grid.page = grid.page > totalPages ? 1 : grid.page;
            grid.paginatedData = filtered.slice((grid.page - 1) * 32, grid.page * 32);
            
            const exec = () => {
                grid.pool.forEach((p, i) => {
                    const item = grid.paginatedData[i]; p.el.style.display = item ? 'block' : 'none';
                    if (item) {
                        if (p.img.dataset.src !== (item.image || '')) { p.img.dataset.src = item.image || ''; p.img.src = item.image || ''; p.img.style.display = item.image ? 'block' : 'none'; }
                        if (p.t.textContent !== item.title) p.t.textContent = item.title;
                        if (p.d.textContent !== (item.description || '')) p.d.textContent = item.description || '';
                        if (p.c) p.c.textContent = item.category || 'All';
                        p.el.dataset.tooltip = item.title;
                    } else { p.img.dataset.src = ''; p.img.removeAttribute('src'); p.img.style.display = 'none'; if(p.c) p.c.textContent = ''; delete p.el.dataset.tooltip; }
                });
                
                if (grid.pageEl) {
                    grid.pageEl.innerHTML = totalPages > 1 ? `<button class="page-btn" id="${type}-prev" ${grid.page===1?'style="opacity:0.4;cursor:not-allowed;"':''}><i class="ph ph-caret-left"></i></button><span style="font-weight:700;font-size:1.1rem;min-width:80px;text-align:center;user-select:none;">${grid.page} / ${totalPages}</span><button class="page-btn" id="${type}-next" ${grid.page===totalPages?'style="opacity:0.4;cursor:not-allowed;"':''}><i class="ph ph-caret-right"></i></button>` : '';
                    if(totalPages > 1) {
                        $(`${type}-prev`).onclick = () => { if(grid.page > 1) { toggleLoader(true); grid.page--; renderGrid(type, true); } };
                        $(`${type}-next`).onclick = () => { if(grid.page < totalPages) { toggleLoader(true); grid.page++; renderGrid(type, true); } };
                    }
                }
                
                Promise.all(grid.pool.map((p, i) => grid.paginatedData[i]?.image && p.img ? new Promise(res => {
                    if (p.img.complete && p.img.naturalWidth > 0) return res();
                    p.img.onload = p.img.onerror = () => { p.img.onload = p.img.onerror = null; res(); }; setTimeout(res, 3000);
                }) : null)).then(() => { grid.gridEl.style.opacity = '1'; toggleLoader(false); });
            };
            if (preload) { grid.gridEl.style.opacity = '0'; setTimeout(exec, 250); } else exec();
        });
    };

    Object.keys(grids).forEach(type => {
        let tOut;
        $(`${type}-search`)?.addEventListener('input', e => {
            const clr = $(`${type}-search-clear`); if(clr) clr.style.display = e.target.value ? 'block' : 'none';
            clearTimeout(tOut); toggleLoader(true); tOut = setTimeout(() => { grids[type].search = e.target.value.toLowerCase().trim(); grids[type].page = 1; renderGrid(type, true); }, 150);
        });
        $(`${type}-search-clear`)?.addEventListener('click', () => {
            $(`${type}-search`).value = ''; $(`${type}-search-clear`).style.display = 'none';
            grids[type].search = ''; grids[type].page = 1; toggleLoader(true); renderGrid(type, true);
        });
    });

    document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `i.profile-avatar-container { width:1.2em;height:1.2em;border-radius:50%;overflow:hidden;display:inline-flex;justify-content:center;align-items:center; } i.profile-avatar-container img { width:100%;height:100%;object-fit:cover; }` }));
    const defaultPic = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cpath fill='%23888' d='M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-61.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,133.52,0Z'/%3E%3C/svg%3E";

    const updateAuthUI = () => {
        const btn = $('profile-nav-btn'); if (!btn) return;
        const pic = currentUser?.profilePicture || defaultPic;
        if (currentUser) {
            if ($('profile-modal-pic')) $('profile-modal-pic').src = pic;
            if ($('profile-modal-username')) $('profile-modal-username').textContent = currentUser.username || "User";
            if ($('profile-modal-desc')) $('profile-modal-desc').textContent = currentUser.description || "No bio.";
            let i = btn.querySelector('i'); if(i) i.outerHTML = `<i class="ph profile-avatar-container"><img src="${pic}" onerror="this.src='${defaultPic}'"></i>`;
        } else {
            let i = btn.querySelector('i'); if(i) i.outerHTML = `<i class="ph ph-user" id="profile-nav-icon"></i>`;
        }
    };
    
    if (currentUser) { applyCloudSettings(currentUser.settings || { theme: currentUser.theme }); updateAuthUI(); } else updateAuthUI();

    const bindModal = (id, bId) => { const m = $(id); $(bId)?.addEventListener('click', () => m?.classList.remove('active')); m?.addEventListener('click', e => e.target === m && m.classList.remove('active')); return m; };
    const authMod = bindModal('auth-modal-overlay', 'auth-close-btn'), profMod = bindModal('profile-modal-overlay', 'profile-close-btn');
    bindModal('homeworkhelper-modal', 'homeworkhelper-close-btn'); bindModal('changelog-modal', 'changelog-close-btn');

    const handleAuth = t => () => { const u = $('auth-user')?.value.trim(), p = $('auth-pass')?.value.trim(); if (u && p && backendPort) backendPort.postMessage({ type: t, username: u, password: p }); };
    $('do-login-btn')?.addEventListener('click', handleAuth('login')); $('do-signup-btn')?.addEventListener('click', handleAuth('signup'));
    ['auth-user', 'auth-pass'].forEach(id => $(id)?.addEventListener('input', () => $('auth-error-msg') && ($('auth-error-msg').style.display = 'none')));

    $('do-logout-btn')?.addEventListener('click', () => { currentUser = null; localStorage.removeItem('kstuff_user'); backendPort?.postMessage({ type: 'logout' }); updateAuthUI(); profMod?.classList.remove('active'); });

    const pContainer = $('profile-edit-container');
    const toggleProfEdit = s => { if (s) { pContainer.style.display = 'flex'; setTimeout(() => pContainer.style.opacity = '1', 10); } else { pContainer.style.opacity = '0'; setTimeout(() => pContainer.style.display = 'none', 300); } };
    
    $('edit-profile-btn')?.addEventListener('click', () => { if (currentUser) toggleProfEdit(pContainer.style.display === 'none' ? ($('profile-edit-pic-url').value = currentUser.profilePicture || "", $('profile-edit-desc').value = currentUser.description || "", true) : false); });
    
    $('save-profile-changes-btn')?.addEventListener('click', e => {
        if (!currentUser || !backendPort) return;
        const oT = e.target.textContent; e.target.textContent = "Saving...";
        currentUser.profilePicture = $('profile-edit-pic-url').value.trim() || "https://kstuff.neocities.org/assets/default-profile.png";
        currentUser.description = $('profile-edit-desc').value.trim() || "No bio provided yet.";
        localStorage.setItem('kstuff_user', JSON.stringify(currentUser)); updateAuthUI();
        backendPort.postMessage({ type: 'update-settings', username: currentUser.username, settings: { profilePicture: currentUser.profilePicture, description: currentUser.description } });
        setTimeout(() => { e.target.textContent = oT; toggleProfEdit(false); }, 600);
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
        
        btn.addEventListener('click', () => {
            toggleTooltip({target:null}, false);
            const tId = btn.dataset.target;
            if (tId === 'profile') return !currentUser ? authMod?.classList.add('active') : (updateAuthUI(), profMod?.classList.add('active'));
            if (tId === 'homeworkhelper') return $('homeworkhelper-modal')?.classList.add('active');
            if (tId === 'changelog') return $('changelog-modal')?.classList.add('active');

            toggleLoader(true);
            const act = document.querySelector('.nav-btn.active');
            if (act && act.dataset.target !== tId && iframePages[act.dataset.target]) { const f = $(iframePages[act.dataset.target].id); if (f) { f.removeAttribute('srcdoc'); delete f.dataset.loadedPath; } }
            navBtns.forEach(b => !['homeworkhelper','changelog','profile'].includes(b.dataset.target) && b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            btn.classList.add('active'); updateIndicator(btn); loadContent(tId);
        });
    });

    if (navBar?.querySelector('.nav-btn.active') || navBtns[0]) {
        updateIndicator(navBar.querySelector('.nav-btn.active') || navBtns[0]);
        window.addEventListener('load', () => updateIndicator(navBar.querySelector('.nav-btn.active') || navBtns[0]));
    }
    
    let rsTmr; window.addEventListener('resize', () => { clearTimeout(rsTmr); rsTmr = setTimeout(() => updateIndicator(document.querySelector('.nav-btn.active')), 100); });

    const closeRes = () => {
        modalOverlay?.classList.remove('active'); if (modalIframe) modalIframe.src = 'about:blank';
        const aPg = document.querySelector('.page.active');
        if (aPg && grids[aPg.id]) { buildPool(aPg.id); renderGrid(aPg.id, false); }
        setTimeout(() => { window.scrollTo(0, savedWindowScrollY); if (aPg) aPg.scrollTop = savedPageScrollTop; }, 50);
    };
    $('resource-close-btn')?.addEventListener('click', closeRes); modalOverlay?.addEventListener('click', e => e.target === modalOverlay && closeRes());
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
        if($('changelog-timestamp')) $('changelog-timestamp').textContent = l?.timestamp || "Unknown";
        if($('changelog-content')) $('changelog-content').innerHTML = l?.changes?.length ? `<ul style="padding-left:1.5rem;margin:0;">${l.changes.map(c => `<li style="margin-bottom:0.5rem;">${c}</li>`).join('')}</ul>` : "No recent changes found.";
    }).catch(()=>{});

    let gRep = {}, gTruf = new Map();
    const appB = s => { if(typeof s !== 'string') return s; for(const [k,v] of Object.entries(gRep)) s = s.split(`\${${k}}`).join(v); return s.replace(/([^:]\/)\/+/g, '$1'); };
    const proc = arr => arr.map(i => {
        let p = { ...i };
        if (p.url?.includes('${truffled}')) {
            const m = gTruf.get((p.title||"").toLowerCase().trim());
            if (m) { p.title = m.name; p.url = '${truffled}/' + m.url.replace(/^\/+/, ''); p.image = '${truffled}/' + m.thumbnail.replace(/^\/+/, ''); p.description = ''; p.category = p.category || 'Truffled'; }
        }
        p.url = appB(p.url); p.image = appB(p.image); return p;
    }).sort((a, b) => (a.title||"").localeCompare(b.title||"", undefined, { sensitivity: 'base' }));

    const rData = async (t, p) => { toggleLoader(true); try { const n = await fetchWithProxy(p).catch(()=>[]); if(n?.length) { grids[t].data = proc(n); grids[t].page = 1; renderGrid(t, true); } else toggleLoader(false); } catch { toggleLoader(false); } };
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
        gRep = { scram: sc ? sc.url.replace(/\/+$/, '') + sc.final : '', static: st ? st.url.replace(/\/+$/, '') + st.final : '', uv: uv ? uv.url.replace(/\/+$/, '') + uv.final : '', frogiee: fr ? fr.url.replace(/\/+$/, '') : '', truffled: trCfg ? trCfg.url.replace(/\/+$/, '') : 'https://boat.strongson.com' };
        gTruf.clear(); tr?.games?.forEach(x => gTruf.set(x.name.toLowerCase().trim(), x));
        grids.readingcorner.data = proc(g); grids.sciencequiz.data = proc(a);
        loadContent(document.querySelector('.page.active')?.id);
    }).catch(() => toggleLoader(false));
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", initApp) : initApp();
