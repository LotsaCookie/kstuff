function initApp() {
    const $ = id => document.getElementById(id);
    const $$ = sel => document.querySelectorAll(sel);
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'js-custom-tooltip';
    tooltipEl.style.cssText = `
        position: fixed; display: none; padding: 6px 10px; background: rgba(0, 0, 0, 0.85);
        color: #fff; font-size: 0.75rem; border-radius: 6px; pointer-events: none;
        z-index: 999999; white-space: nowrap; transition: opacity 0.15s ease;
    `;
    document.body.appendChild(tooltipEl);

    function showTooltip(e, text) {
        if (!text) return;
        tooltipEl.textContent = text;
        tooltipEl.style.display = 'block';
        tooltipEl.style.left = `${e.clientX + 12}px`;
        tooltipEl.style.top = `${e.clientY + 12}px`;
    }

    function hideTooltip() {
        tooltipEl.style.display = 'none';
    }

    async function getWorkingConfig(table) {
        if (!table?.length) return null;
        for (let i = 0; i < table.length; i += 5) {
            const chunk = table.slice(i, i + 5);
            const winner = await new Promise((resolve) => {
                let resolved = false, failedCount = 0;
                const activeImages = [];
                const cleanup = () => activeImages.forEach(im => {
                    im.onload = im.onerror = null;
                    im.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                });
                chunk.forEach(entry => {
                    const img = new Image();
                    activeImages.push(img);
                    const fullTestUrl = entry.url.replace(/\/+$/, '') + '/' + entry.img.replace(/^\/+/, '');
                    const done = (success) => {
                        if (resolved) return;
                        if (success) { resolved = true; cleanup(); resolve(entry); } 
                        else if (++failedCount === chunk.length) { resolved = true; cleanup(); resolve(null); }
                    };
                    img.onload = () => done(img.naturalWidth > 0);
                    img.onerror = () => done(false);
                    img.src = fullTestUrl + (fullTestUrl.includes('?') ? '&' : '?') + '_=' + Date.now();
                });
                setTimeout(() => { if (!resolved) { resolved = true; cleanup(); resolve(null); } }, 8000);
            });
            if (winner) return winner; 
        }
        return table[0]; 
    }

    const body = document.body;
    const navBar = $('teachertouchbar');
    const navBtns = $$('.nav-btn');
    const pages = $$('.page');
    const loader = document.querySelector('.section-loader');
    
    let backendPort = null, backendReady = false, syncInterval = null, currentUser = null;

    try {
        const cachedUser = localStorage.getItem('kstuff_user');
        if (cachedUser) currentUser = JSON.parse(cachedUser);
    } catch { localStorage.removeItem('kstuff_user'); }

    const toggleLoader = (show) => {
        if (!loader) return;
        loader.style.opacity = show ? '1' : '0';
        loader.classList.toggle('hidden', !show);
    };
    toggleLoader(false);

    const modalOverlay = $('resource-modal'), modalIframe = $('resource-modal-iframe'), modalTitle = $('resource-modal-title');
    let savedWindowScrollY = 0, savedPageScrollTop = 0, cachedCommitHash = null;
    let indicator = navBar?.querySelector('.nav-indicator') || (() => {
        const ind = document.createElement('div');
        ind.className = 'nav-indicator';
        navBar?.prepend(ind);
        return ind;
    })();

    function updateIndicator(activeBtn) {
        if (!activeBtn || !indicator || !navBar) return;
        const isVertical = body.classList.contains('nav-left') || body.classList.contains('nav-right');
        const navRect = navBar.getBoundingClientRect(), btnRect = activeBtn.getBoundingClientRect();
        indicator.style.cssText = `
            width: ${isVertical ? '3px' : `${btnRect.width}px`};
            height: ${isVertical ? `${btnRect.height}px` : '3px'};
            transform: ${isVertical ? `translateY(${btnRect.top - navRect.top}px)` : `translateX(${btnRect.left - navRect.left}px)`};
        `;
    }

    async function getProxyList() {
        if (!cachedCommitHash) {
            try {
                const res = await fetch("https://api.github.com/repos/lotsacookie/kstuff/commits/main");
                cachedCommitHash = res.ok ? (await res.json()).sha : "main";
            } catch { cachedCommitHash = "main"; }
        }
        return [
            `https://raw.githack.com/lotsacookie/kstuff/${cachedCommitHash}/`,
            `https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@${cachedCommitHash}/`,
            `https://raw.githubusercontent.com/lotsacookie/kstuff/${cachedCommitHash}/`,
            `https://cdn.statically.io/gh/lotsacookie/kstuff/${cachedCommitHash}/`,
            ""
        ];
    }

    async function fetchWithProxy(path, asText = false) {
        const proxies = await getProxyList();
        for (const proxy of proxies) {
            try {
                const res = await fetch(proxy + path + (proxy ? "" : "?_=" + Date.now()));
                if (res.ok) return asText ? await res.text() : await res.json();
            } catch {}
        }
        throw new Error("All proxies failed for " + path);
    }

    function initBackendBridge(workingConfig) {
        if (!workingConfig) return;
        const hiddenFrame = document.createElement('iframe');
        hiddenFrame.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;opacity:0;pointer-events:none;border:none;z-index:999999;`;
        
        const proxyPrefix = (workingConfig.url || '').replace(/\/+$/, '') + (workingConfig.final ? '/' + workingConfig.final.replace(/^\/+/, '') : '');
        const rawBackendUrl = 'https://lotsacookie.github.io/Dnekcabtset/backend.html?j990x11';
        hiddenFrame.src = proxyPrefix.includes('embed.html#') ? proxyPrefix + rawBackendUrl : proxyPrefix.replace(/\/+$/, '') + '/embed.html#' + rawBackendUrl;
        (document.body || document.documentElement).appendChild(hiddenFrame);

        const cableInterval = setInterval(() => {
            if (!backendReady && hiddenFrame.contentWindow) {
                const channel = new MessageChannel();
                channel.port1.onmessage = (e) => handleBackendMessage(e.data, channel.port1);
                try { hiddenFrame.contentWindow.postMessage({ type: 'init_cable' }, '*', [channel.port2]); } catch {}
            }
        }, 1500);

    function handleBackendMessage(data, activePort) {
            if (!data) return;
            if (data.type === 'ready') {
                backendReady = true; backendPort = activePort;
                clearInterval(cableInterval);
                if (currentUser) {
                    const attemptSync = () => backendPort.postMessage({ type: 'auto-login', username: currentUser.username }); 
                    attemptSync(); syncInterval = setInterval(attemptSync, 5000);
                }
            } else if (['login', 'auto-login', 'signup'].includes(data.type)) {
                if (data.type === 'auto-login' && syncInterval) { clearInterval(syncInterval); syncInterval = null; }
                
                const authError = $('auth-error-msg'); 
                
                if (data.success) {
                    const incomingUser = data.payload;
                    if (currentUser?.settings?.lastUpdated && currentUser.settings.lastUpdated > (incomingUser.settings?.lastUpdated || 0)) {
                        incomingUser.settings = currentUser.settings; 
                    }
                    currentUser = incomingUser;
                    localStorage.setItem('kstuff_user', JSON.stringify(currentUser)); 
                    applyCloudSettings(currentUser.settings || { theme: currentUser.theme });
                    updateAuthUI();
                    
                    if (authError) authError.style.display = 'none'; 
                    $('auth-modal-overlay')?.classList.remove('active');
                } else if (data.type === 'auto-login') {
                    currentUser = null; localStorage.removeItem('kstuff_user'); updateAuthUI();
                } else {
                    if (authError) {
                        const reasonMap = {
                            'invalid': 'Please fill out all required fields.',
                            'exists': 'Username is already taken.',
                            'failed': 'Authentication request failed. Please try again.',
                            'not_found': 'Account does not exist.',
                            'invalid_password': 'Incorrect password.'
                        };
                        authError.textContent = data.message || reasonMap[data.reason] || (data.type === 'login' ? 'Invalid username or password.' : 'Username already taken or invalid.');
                        authError.style.display = 'block';
                    }
                }
            }
    }

    async function loadDynamicThemes() {
        try {
            const themes = await (typeof fetchWithProxy === 'function' ? fetchWithProxy('Json/themes.json') : fetch('Json/themes.json').then(r => r.json()));
            let cssString = '', optionsHTML = '';
            themes.forEach(theme => {
                cssString += `.${theme.id} {\n${Object.entries(theme.variables).map(([p, v]) => `    ${p}: ${v};`).join('\n')}\n}\n\n`;
                optionsHTML += `<option value="${theme.id}">${theme.name}</option>`;
            });
            const styleTag = document.createElement('style');
            styleTag.id = 'dynamic-themes-style'; styleTag.textContent = cssString;
            document.head.appendChild(styleTag);
            
            const selectEl = $('layout-theme-select');
            if (selectEl) {
                const currentVal = localStorage.getItem('kstuff_theme') || themes[0].id;
                if (selectEl.dataset.customized) {
                    selectEl.nextElementSibling?.classList.contains('custom-select-wrapper') && selectEl.nextElementSibling.remove();
                    delete selectEl.dataset.customized; selectEl.style.display = ''; 
                }
                selectEl.innerHTML = optionsHTML; selectEl.value = currentVal;
                document.body.className = document.body.className.replace(/\btheme-\S+/g, '').trim();
                document.body.classList.add(currentVal);
                if (typeof applyCustomDropdown === 'function') applyCustomDropdown(selectEl);
            }
        } catch {}
    }
    loadDynamicThemes();

    const iframePages = {
        'mathworksheets': { id: 'mathworksheets-iframe', path: 'Pages/browser.html' },
        'gradebook': { id: 'gradebook-iframe', path: 'Pages/music.html' },
        'lessonplanner': { id: 'lessonplanner-iframe', path: 'Pages/ai.html' }
    };

    async function loadIframePage(iframeId, path) {
        const iframe = $(iframeId);
        if (!iframe || (iframe.dataset.loadedPath === path && iframe.srcdoc)) return toggleLoader(false);
        toggleLoader(true);
        try {
            const htmlContent = await fetchWithProxy(path, true);
            iframe.onload = () => toggleLoader(false);
            iframe.dataset.loadedPath = path; iframe.srcdoc = htmlContent;
        } catch {
            iframe.onload = () => toggleLoader(false);
            iframe.srcdoc = `<html style="background:transparent;"><body style="color:var(--text-color, white); font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;"><h2>Failed to load page content. Please try again.</h2></body></html>`;
        }
    }

    const initGrid = (id) => ({ data: [], pool: [], gridEl: $(`${id}-grid`), pageEl: $(`${id}-pagination`), category: "All", search: "", page: 1 });
    const grids = { readingcorner: initGrid('readingcorner'), sciencequiz: initGrid('sciencequiz') };
    const itemsPerPage = 32;

    function buildPool(type) {
        destroyPool(type);
        const grid = grids[type];
        if (!grid.gridEl) return;
        for (let i = 0; i < itemsPerPage; i++) {
            const card = document.createElement('div');
            card.className = 'round-btn';
            card.innerHTML = `<img src="" alt="" loading="lazy" style="display:none;"><div class="category-label"></div><div class="overlay"><h3></h3><p></p></div>`;
            grid.pool.push({ element: card, imgEl: card.querySelector('img'), titleEl: card.querySelector('h3'), descEl: card.querySelector('p'), catEl: card.querySelector('.category-label') });
            grid.gridEl.appendChild(card);
        }
    }

    function destroyPool(type) {
        const grid = grids[type];
        if (grid.gridEl) grid.gridEl.innerHTML = '';
        grid.pool = [];
        if (grid.pageEl) grid.pageEl.innerHTML = '';
    }

    Object.keys(grids).forEach(type => {
        let timeout;
        const searchInput = $(`${type}-search`);
        const clearBtn = $(`${type}-search-clear`);

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (clearBtn) clearBtn.style.display = e.target.value.length > 0 ? 'block' : 'none';
                clearTimeout(timeout); 
                toggleLoader(true);
                timeout = setTimeout(() => { 
                    grids[type].search = e.target.value.toLowerCase().trim(); 
                    grids[type].page = 1; 
                    renderGrid(type, true); 
                }, 150);
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                clearBtn.style.display = 'none';
                grids[type].search = '';
                grids[type].page = 1;
                toggleLoader(true);
                renderGrid(type, true);
            });
        }
    });

    function renderPagination(type, totalPages) {
        const grid = grids[type];
        if (!grid.pageEl) return;
        grid.pageEl.innerHTML = '';
        if (totalPages > 1) {
            const addBtn = (icon, isNext) => {
                const btn = document.createElement('button');
                btn.className = 'page-btn'; btn.innerHTML = `<i class="ph ph-caret-${icon}"></i>`;
                if ((isNext && grid.page < totalPages) || (!isNext && grid.page > 1)) {
                    btn.addEventListener('click', () => { toggleLoader(true); grid.page += isNext ? 1 : -1; renderGrid(type, true); });
                } else { btn.style.opacity = '0.4'; btn.style.cursor = 'not-allowed'; }
                grid.pageEl.appendChild(btn);
            };
            addBtn('left', false);
            const pageInfo = document.createElement('span');
            pageInfo.style.cssText = 'font-weight:700;font-size:1.1rem;min-width:80px;text-align:center;user-select:none;';
            pageInfo.textContent = `${grid.page} / ${totalPages}`;
            grid.pageEl.appendChild(pageInfo);
            addBtn('right', true);
        }
    }

    function renderGrid(type, withPreload = false) {
        window.requestAnimationFrame(() => {
            const grid = grids[type];
            if (!grid.gridEl) return;
            const filtered = grid.data.filter(item => (grid.category === "All" || item.category === grid.category) && item.title.toLowerCase().includes(grid.search));
            const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
            if (grid.page > totalPages) grid.page = 1;
            const paginated = filtered.slice((grid.page - 1) * itemsPerPage, (grid.page - 1) * itemsPerPage + itemsPerPage);
            
            const exec = () => {
                grid.pool.forEach((poolItem, index) => {
                    const item = paginated[index];
                    poolItem.element.style.display = item ? 'block' : 'none';
                    if (item) {
                        const targetImg = item.image || '';
                        if (poolItem.imgEl.dataset.src !== targetImg) {
                            poolItem.imgEl.dataset.src = targetImg; poolItem.imgEl.src = targetImg;
                            poolItem.imgEl.style.display = targetImg ? 'block' : 'none';
                            if (!targetImg) poolItem.imgEl.removeAttribute('src');
                        }
                        if (poolItem.titleEl.textContent !== item.title) poolItem.titleEl.textContent = item.title;
                        if (poolItem.descEl.textContent !== (item.description || '')) poolItem.descEl.textContent = item.description || '';
                        if (poolItem.catEl && poolItem.catEl.textContent !== (item.category || 'All')) poolItem.catEl.textContent = item.category || 'All';
                        
                        poolItem.element.onmouseenter = (e) => showTooltip(e, item.title);
                        poolItem.element.onmousemove = (e) => {
                            tooltipEl.style.left = `${e.clientX + 12}px`;
                            tooltipEl.style.top = `${e.clientY + 12}px`;
                        };
                        poolItem.element.onmouseleave = hideTooltip;

                        poolItem.element.onclick = () => {
                            hideTooltip();
                            savedWindowScrollY = window.scrollY || document.documentElement.scrollTop;
                            savedPageScrollTop = document.querySelector('.page.active')?.scrollTop || 0;
                            if (modalTitle) modalTitle.textContent = item.title;
                            if (modalOverlay) modalOverlay.classList.add('active');
                            if (modalIframe) modalIframe.src = item.url;
                            setTimeout(() => Object.keys(grids).forEach(destroyPool), 50);
                        };
                    } else {
                        if (poolItem.imgEl.dataset.src !== '') { poolItem.imgEl.dataset.src = ''; poolItem.imgEl.removeAttribute('src'); poolItem.imgEl.style.display = 'none'; }
                        if (poolItem.catEl) poolItem.catEl.textContent = ''; 
                        poolItem.element.onclick = null;
                        poolItem.element.onmouseenter = null;
                        poolItem.element.onmousemove = null;
                        poolItem.element.onmouseleave = null;
                    }
                });
                renderPagination(type, totalPages);
                Promise.all(grid.pool.map((p, i) => paginated[i]?.image && p.imgEl ? new Promise(res => {
                    if (p.imgEl.complete && p.imgEl.naturalWidth > 0) return res();
                    const done = () => { p.imgEl.onload = p.imgEl.onerror = null; res(); };
                    p.imgEl.onload = p.imgEl.onerror = done; setTimeout(done, 3000); 
                }) : null)).then(() => { grid.gridEl.style.opacity = '1'; toggleLoader(false); });
            };
            if (withPreload) { grid.gridEl.style.opacity = '0'; setTimeout(exec, 250); } else exec();
        });
    }

    function animateIndicatorUpdate(duration = 300) {
        const start = performance.now();
        requestAnimationFrame(function step(time) {
            updateIndicator(navBar?.querySelector('.nav-btn.active'));
            if (time - start < duration) window.requestAnimationFrame(step);
        });
    }

    const setupSetting = (id, storageKey, classPrefix, classFn) => {
        const el = $(id);
        if (!el) return;
        const saved = localStorage.getItem(storageKey) || el.value;
        el.value = saved; classFn(saved);
        el.addEventListener('change', (e) => {
            if (classPrefix) body.className = body.className.replace(new RegExp(`\\b${classPrefix}-\\S+`, 'g'), '').trim();
            classFn(e.target.value); localStorage.setItem(storageKey, e.target.value); animateIndicatorUpdate(); 
        });
    };

    setupSetting('layout-theme-select', 'kstuff_theme', 'theme', v => body.classList.add(v));
    setupSetting('layout-nav-select', 'kstuff_nav_pos', 'nav', v => body.classList.add(v));
    setupSetting('layout-size-select', 'kstuff_nav_size', 'size', v => body.classList.add(v));
    setupSetting('layout-text-select', 'kstuff_text_vis', '', v => body.classList.toggle('text-hide', v === 'text-hide'));

    function applyCloudSettings(settings) {
        if (!settings) return;
        [
            { id: 'layout-theme-select', val: settings.theme, key: 'kstuff_theme' },
            { id: 'layout-nav-select', val: settings.navPos, key: 'kstuff_nav_pos' },
            { id: 'layout-size-select', val: settings.navSize, key: 'kstuff_nav_size' },
            { id: 'layout-text-select', val: settings.textVis, key: 'kstuff_text_vis' }
        ].forEach(({ id, val, key }) => {
            const el = $(id);
            if (val && el) {
                localStorage.setItem(key, val); el.value = val; el.dispatchEvent(new Event('change'));
                const wrapper = el.nextElementSibling;
                if (wrapper?.classList.contains('custom-select-wrapper')) {
                    const span = wrapper.querySelector('.custom-select-trigger span');
                    if (span) span.textContent = el.options[el.selectedIndex]?.text || '';
                    wrapper.querySelectorAll('.custom-select-option').forEach((opt, idx) => opt.classList.toggle('selected', idx === el.selectedIndex));
                }
            }
        });
    }

    function applyCustomDropdown(selectEl) {
        if (!selectEl || (selectEl.dataset.customized && !selectEl.nextElementSibling?.classList.contains('custom-select-wrapper'))) return;
        if (selectEl.dataset.customized) selectEl.nextElementSibling.remove();
        selectEl.style.display = 'none'; selectEl.dataset.customized = 'true';
        
        const wrapper = document.createElement('div'), trigger = document.createElement('div'), optionsContainer = document.createElement('div');
        wrapper.className = 'custom-select-wrapper'; trigger.className = 'custom-select-trigger'; optionsContainer.className = 'custom-select-options';
        trigger.innerHTML = `<span>${selectEl.options[selectEl.selectedIndex]?.text || ''}</span> <i class="ph ph-caret-down"></i>`;
        
        Array.from(selectEl.options).forEach((opt, idx) => {
            const optionEl = document.createElement('div');
            optionEl.className = `custom-select-option ${idx === selectEl.selectedIndex ? 'selected' : ''}`;
            optionEl.textContent = opt.text;
            optionEl.addEventListener('click', (e) => {
                e.stopPropagation(); selectEl.value = opt.value; trigger.querySelector('span').textContent = opt.text;
                optionsContainer.querySelectorAll('.custom-select-option').forEach(el => el.classList.remove('selected'));
                optionEl.classList.add('selected'); optionsContainer.classList.remove('open');
                selectEl.dispatchEvent(new Event('change'));
            });
            optionsContainer.appendChild(optionEl);
        });
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation(); $$('.custom-select-options.open').forEach(el => el !== optionsContainer && el.classList.remove('open'));
            optionsContainer.classList.toggle('open');
        });
        wrapper.append(trigger, optionsContainer); selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);
    }

    document.addEventListener('click', () => $$('.custom-select-options.open').forEach(el => el.classList.remove('open')));
    $$('.setting-group select').forEach(applyCustomDropdown);

    $('save-settings-btn')?.addEventListener('click', (e) => {
        const btn = e.target, origT = btn.textContent, origBg = btn.style.background, origC = btn.style.color;
        const payload = { theme: $('layout-theme-select')?.value, navPos: $('layout-nav-select')?.value, navSize: $('layout-size-select')?.value, textVis: $('layout-text-select')?.value, lastUpdated: Date.now() };
        if (currentUser && backendReady && backendPort) {
            currentUser.settings = payload; localStorage.setItem('kstuff_user', JSON.stringify(currentUser));
            applyCloudSettings(payload); backendPort.postMessage({ type: 'update-settings', username: currentUser.username, settings: payload });
            btn.textContent = "Saved to Cloud!";
        } else btn.textContent = "Saved Locally!";
        btn.style.background = "#4CAF50"; btn.style.color = "#fff";
        setTimeout(() => { btn.textContent = origT; btn.style.background = origBg; btn.style.color = origC; }, 2000);
    });

    document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `i.profile-avatar-container { width: 1.2em; height: 1.2em; border-radius: 50%; overflow: hidden; display: inline-flex; justify-content: center; align-items: center; } i.profile-avatar-container img { width: 100%; height: 100%; object-fit: cover; }` }));

    const defaultPic = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cpath fill='%23888' d='M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-61.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,133.52,0Z'/%3E%3C/svg%3E";

    function updateAuthUI() {
        const navBtn = $('profile-nav-btn');
        if (currentUser) {
            const userPic = currentUser.profilePicture || defaultPic;
            if ($('profile-modal-pic')) $('profile-modal-pic').src = userPic;
            if ($('profile-modal-username')) $('profile-modal-username').textContent = currentUser.username || "User";
            if ($('profile-modal-desc')) $('profile-modal-desc').textContent = currentUser.description || "No description provided.";
            
            if (navBtn) {
                const oldIcon = navBtn.querySelector('i');
                if (oldIcon && !oldIcon.classList.contains('profile-avatar-container')) {
                    const newIcon = document.createElement('i');
                    newIcon.className = 'ph profile-avatar-container';
                    newIcon.innerHTML = `<img src="${userPic}" alt="Profile" onerror="this.src='${defaultPic}'">`;
                    navBtn.replaceChild(newIcon, oldIcon);
                } else if (oldIcon) {
                    oldIcon.querySelector('img').src = userPic;
                }
            }
        } else if (navBtn) {
            const oldIcon = navBtn.querySelector('i');
            if (oldIcon && oldIcon.classList.contains('profile-avatar-container')) {
                const newIcon = document.createElement('i');
                newIcon.className = 'ph ph-user';
                newIcon.id = 'profile-nav-icon';
                navBtn.replaceChild(newIcon, oldIcon);
            }
        }
    }

    if (currentUser) { applyCloudSettings(currentUser.settings || { theme: currentUser.theme }); updateAuthUI(); } else updateAuthUI();

    const bindModal = (id, btnId) => {
        const m = $(id), b = $(btnId);
        b?.addEventListener('click', () => m?.classList.remove('active'));
        m?.addEventListener('click', (e) => e.target === m && m.classList.remove('active'));
        return m;
    };
    
    const settingsModal = bindModal('homeworkhelper-modal', 'homeworkhelper-close-btn');
    const changelogModal = bindModal('changelog-modal', 'changelog-close-btn');
    const authModal = bindModal('auth-modal-overlay', 'auth-close-btn');
    const profileModal = bindModal('profile-modal-overlay', 'profile-close-btn');

    const handleAuth = (type) => () => {
        const u = $('auth-user')?.value.trim(), p = $('auth-pass')?.value.trim();
        if (u && p && backendReady && backendPort) backendPort.postMessage({ type, username: u, password: p });
    };
    $('do-login-btn')?.addEventListener('click', handleAuth('login'));
    $('do-signup-btn')?.addEventListener('click', handleAuth('signup'));

    const clearAuthError = () => { 
        const err = $('auth-error-msg'); 
        if (err) err.style.display = 'none'; 
    };
    $('auth-user')?.addEventListener('input', clearAuthError);
    $('auth-pass')?.addEventListener('input', clearAuthError);

    $('do-logout-btn')?.addEventListener('click', () => {
        currentUser = null; localStorage.removeItem('kstuff_user'); 
        if (backendPort) backendPort.postMessage({ type: 'logout' });
        updateAuthUI(); profileModal?.classList.remove('active');
    });

    const profileEditContainer = $('profile-edit-container'), profileEditPicUrl = $('profile-edit-pic-url'), profileEditDesc = $('profile-edit-desc'), saveProfileChangesBtn = $('save-profile-changes-btn');

    const toggleProfileEdit = (show) => {
        if (show) { profileEditContainer.style.display = 'flex'; setTimeout(() => profileEditContainer.style.opacity = '1', 10); } 
        else { profileEditContainer.style.opacity = '0'; setTimeout(() => profileEditContainer.style.display = 'none', 300); }
    };

    $('edit-profile-btn')?.addEventListener('click', () => {
        if (!currentUser) return;
        if (profileEditContainer.style.display === 'none') {
            profileEditPicUrl.value = currentUser.profilePicture || ""; profileEditDesc.value = currentUser.description || "";
            toggleProfileEdit(true);
        } else toggleProfileEdit(false);
    });

    saveProfileChangesBtn?.addEventListener('click', () => {
        if (!currentUser || !backendReady || !backendPort) return;
        const originalText = saveProfileChangesBtn.textContent; saveProfileChangesBtn.textContent = "Saving to Cloud...";
        currentUser.profilePicture = profileEditPicUrl.value.trim() || "https://kstuff.neocities.org/assets/default-profile.png";
        currentUser.description = profileEditDesc.value.trim() || "No bio provided yet.";
        localStorage.setItem('kstuff_user', JSON.stringify(currentUser));
        updateAuthUI();
        backendPort.postMessage({ type: 'update-settings', username: currentUser.username, settings: { profilePicture: currentUser.profilePicture, description: currentUser.description } });
        setTimeout(() => { saveProfileChangesBtn.textContent = originalText; toggleProfileEdit(false); }, 600);
    });

    const loadContent = (targetId) => {
        const targetPage = $(targetId);
        if (targetPage) {
            targetPage.classList.add('active');
            Object.keys(grids).forEach(k => k !== targetId && destroyPool(k));
            if (grids[targetId]) { buildPool(targetId); setTimeout(() => renderGrid(targetId, false), 50); } 
            else if (iframePages[targetId]) loadIframePage(iframePages[targetId].id, iframePages[targetId].path);
            else toggleLoader(false);
        } else toggleLoader(false);
    };

    navBtns.forEach(btn => {
        btn.style.position = 'relative';
        const letterDivs = btn.querySelectorAll('.label-data div');
        const label = letterDivs.length > 0 ? Array.from(letterDivs).map(div => div.textContent).reverse().join('') : (btn.getAttribute('data-tooltip') || btn.getAttribute('title') || btn.getAttribute('data-target'));

        btn.addEventListener('mouseenter', (e) => showTooltip(e, label));
        btn.addEventListener('mousemove', (e) => {
            tooltipEl.style.left = `${e.clientX + 12}px`;
            tooltipEl.style.top = `${e.clientY + 12}px`;
        });
        btn.addEventListener('mouseleave', hideTooltip);

        btn.addEventListener('click', () => {
            hideTooltip();
            const targetId = btn.dataset.target;
            if (targetId === 'profile') return !currentUser ? authModal?.classList.add('active') : (updateAuthUI(), profileModal?.classList.add('active'));
            if (targetId === 'homeworkhelper') return settingsModal?.classList.add('active');
            if (targetId === 'changelog') return changelogModal?.classList.add('active');

            toggleLoader(true);
            const activeBtn = document.querySelector('.nav-btn.active');
            if (activeBtn && activeBtn.dataset.target !== targetId && iframePages[activeBtn.dataset.target]) {
                const frame = $(iframePages[activeBtn.dataset.target].id);
                if (frame) { frame.srcdoc = ''; frame.removeAttribute('srcdoc'); delete frame.dataset.loadedPath; }
            }
            navBtns.forEach(b => !['homeworkhelper', 'changelog', 'profile'].includes(b.dataset.target) && b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            btn.classList.add('active'); updateIndicator(btn); loadContent(targetId);
        });
    });

    if (navBar?.querySelector('.nav-btn.active') || navBtns[0]) {
        animateIndicatorUpdate(600); window.addEventListener('load', () => updateIndicator(navBar.querySelector('.nav-btn.active') || navBtns[0]));
    }
    
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer); resizeTimer = setTimeout(() => updateIndicator(navBar?.querySelector('.nav-btn.active')), 100);
    });

    function closeResourceModal() {
        modalOverlay?.classList.remove('active'); if (modalIframe) modalIframe.src = 'about:blank';
        const activePage = document.querySelector('.page.active');
        if (activePage && grids[activePage.id]) { buildPool(activePage.id); renderGrid(activePage.id, false); }
        setTimeout(() => { window.scrollTo(0, savedWindowScrollY); if (activePage) activePage.scrollTop = savedPageScrollTop; }, 50);
    }

    $('resource-close-btn')?.addEventListener('click', closeResourceModal);
    modalOverlay?.addEventListener('click', (e) => e.target === modalOverlay && closeResourceModal());
    $('resource-fullscreen-btn')?.addEventListener('click', () => !document.fullscreenElement ? modalIframe?.requestFullscreen().catch(()=>{}) : document.exitFullscreen());

    fetchWithProxy('Json/categories.json').then(cats => {
        const setupCatSelect = (id, options, type) => {
            const select = $(id); if (!select) return;
            select.innerHTML = (options || []).map(c => `<option value="${c}">${c}</option>`).join('');
            applyCustomDropdown(select);
            select.addEventListener('change', (e) => { toggleLoader(true); grids[type].category = e.target.value; grids[type].page = 1; renderGrid(type, true); });
        };
        setupCatSelect('readingcorner-category-select', cats.Games, 'readingcorner');
        setupCatSelect('sciencequiz-category-select', cats.Apps, 'sciencequiz');
    }).catch(()=>{});

    fetchWithProxy('Json/change-log.json').then(log => {
        const contentEl = $('changelog-content'), tsEl = $('changelog-timestamp');
        if (log) {
            if (tsEl) tsEl.textContent = log.timestamp || "Unknown";
            if (contentEl) contentEl.innerHTML = log.changes?.length ? `<ul style="padding-left:1.5rem;margin:0;">${log.changes.map(c => `<li style="margin-bottom:0.5rem;">${c}</li>`).join('')}</ul>` : "No recent changes found.";
        }
    }).catch(() => {
        if ($('changelog-content')) $('changelog-content').innerHTML = "Failed to load update log.";
        if ($('changelog-timestamp')) $('changelog-timestamp').textContent = "Unknown";
    });

    let globalReplacements = {};
    let globalTruffledMap = new Map();

    const applyBases = (str) => {
        if (!str || typeof str !== 'string') return str;
        for (const [key, val] of Object.entries(globalReplacements)) str = str.split(`\${${key}}`).join(val);
        return str.replace(/([^:]\/)\/+/g, '$1');
    };

    const processItems = (dataArr) => dataArr.map(item => {
        let processed = { ...item };
        if (processed.url?.includes('${truffled}')) {
            const match = globalTruffledMap.get((processed.title || "").toLowerCase().trim());
            if (match) {
                processed.title = match.name; processed.url = '${truffled}/' + match.url.replace(/^\/+/, '');
                processed.image = '${truffled}/' + match.thumbnail.replace(/^\/+/, ''); processed.description = '';
                processed.category = processed.category || 'Truffled';
            }
        }
        processed.url = applyBases(processed.url); processed.image = applyBases(processed.image);
        return processed;
    }).sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: 'base' }));

    async function refreshData(type, jsonPath) {
        toggleLoader(true);
        try {
            const newData = await fetchWithProxy(jsonPath).catch(() => []);
            if (newData && newData.length) {
                grids[type].data = processItems(newData);
                grids[type].page = 1;
                renderGrid(type, true);
            } else {
                toggleLoader(false);
            }
        } catch (e) {
            toggleLoader(false);
        }
    }

    $('readingcorner-refresh-btn')?.addEventListener('click', () => refreshData('readingcorner', 'Json/g.json'));
    $('sciencequiz-refresh-btn')?.addEventListener('click', () => refreshData('sciencequiz', 'Json/a.json'));

    const fetchCfg = (url) => fetchWithProxy(url).catch(() => []).then(getWorkingConfig);
    const staticDataPromise = fetchWithProxy('Json/urls/static.json').catch(() => []);
    
    Promise.all([
        fetchWithProxy('Json/g.json').catch(() => []), fetchWithProxy('Json/a.json').catch(() => []), fetchWithProxy('Json/truffled.json').catch(() => null),
        fetchCfg('Json/urls/scram.json'), staticDataPromise.then(getWorkingConfig), fetchCfg('Json/urls/uv.json'), fetchCfg('Json/urls/truffled.json'),
        staticDataPromise.then(data => getWorkingConfig(data.map(item => ({ url: item.url, img: item.img, final: "" }))))
    ]).then(([gData, aData, truffledData, scram, stat, uv, truffled, frogiee]) => {
        if (stat) initBackendBridge(stat);
        
        globalReplacements = {
            'scram': scram ? scram.url.replace(/\/+$/, '') + scram.final : '',
            'static': stat ? stat.url.replace(/\/+$/, '') + stat.final : '',
            'uv': uv ? uv.url.replace(/\/+$/, '') + uv.final : '',
            'frogiee': frogiee ? frogiee.url.replace(/\/+$/, '') : '',
            'truffled': truffled ? truffled.url.replace(/\/+$/, '') : 'https://boat.strongson.com'
        };

        globalTruffledMap.clear();
        truffledData?.games?.forEach(g => globalTruffledMap.set(g.name.toLowerCase().trim(), g));
        
        grids.readingcorner.data = processItems(gData); grids.sciencequiz.data = processItems(aData);
        loadContent(document.querySelector('.page.active')?.id);

    }).catch(() => toggleLoader(false));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initApp); else initApp();
