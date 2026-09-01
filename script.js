function initApp() {
    async function getWorkingConfig(table) {
        if (!table?.length) return null;
        for (let i = 0; i < table.length; i += 5) {
            const chunk = table.slice(i, i + 5);
            const winner = await new Promise((resolve) => {
                let resolved = false, failedCount = 0;
                const activeImages = [];

                const cleanup = () => {
                    activeImages.forEach(im => {
                        im.onload = im.onerror = null;
                        im.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                    });
                };

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
    const navBar = document.getElementById('teachertouchbar');
    const navBtns = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');
    const loader = document.querySelector('.section-loader');
    
    let backendPort = null;
    let backendReady = false;
    let currentUser = null;

    const toggleLoader = (show) => {
        if (!loader) return;
        loader.style.opacity = show ? '1' : '0';
        loader.classList.toggle('hidden', !show);
    };
    toggleLoader(false);

    const modalOverlay = document.getElementById('resource-modal');
    const modalIframe = document.getElementById('resource-modal-iframe');
    const modalTitle = document.getElementById('resource-modal-title');
    
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
        const navRect = navBar.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        
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

    function initBackendBridge(workingStaticUrl) {
        const hiddenFrame = document.createElement('iframe');
        
        hiddenFrame.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            opacity: 0;
            pointer-events: none;
            border: none;
            z-index: 999999;
        `;
        
        const backendTargetUrl = (workingStaticUrl ? workingStaticUrl.replace(/\/+$/, '') + '/' : '') + 'https://lotsacookie.github.io/Dnekcabtset/backend.html';
        hiddenFrame.src = backendTargetUrl;
        document.body.appendChild(hiddenFrame);

        const cableInterval = setInterval(() => {
            if (!backendReady && hiddenFrame.contentWindow) {
                const channel = new MessageChannel();
                channel.port1.onmessage = (e) => handleBackendMessage(e.data);
                try {
                    hiddenFrame.contentWindow.postMessage({ type: 'init_cable' }, '*', [channel.port2]);
                    backendPort = channel.port1;
                } catch (err) {}
            }
        }, 1500);

        function handleBackendMessage(data) {
            if (!data) return;
            
            // DEBUG ALERT: See what the backend actually sends back
            alert("Frontend received message: " + JSON.stringify(data));

            if (data.type === 'ready') {
                backendReady = true;
                clearInterval(cableInterval);
            } else if (data.type === 'login' || data.type === 'auto-login' || data.type === 'signup') {
                if (data.success) {
                    currentUser = data.payload;
                    updateAuthUI(true);
                    document.getElementById('auth-modal-overlay')?.classList.remove('active');
                } else {
                    alert("Authentication action failed: " + (data.reason || 'unknown'));
                }
            } else if (data.type === 'settings-saved') {
                alert("Settings successfully saved to cloud storage!");
            }
        }
    }

    const iframePages = {
        'mathworksheets': { id: 'mathworksheets-iframe', path: 'Pages/browser.html' },
        'gradebook': { id: 'gradebook-iframe', path: 'Pages/music.html' },
        'lessonplanner': { id: 'lessonplanner-iframe', path: 'Pages/ai.html' }
    };

    async function loadIframePage(id, path, pageId) {
        const iframe = document.getElementById(id);
        if (!iframe) return;
        try {
            const html = await fetchWithProxy(path, true);
            if (document.querySelector('.page.active')?.id === pageId) iframe.srcdoc = html;
        } catch {}
    }

    const initGrid = (id) => ({ data: [], pool: [], gridEl: document.getElementById(`${id}-grid`), pageEl: document.getElementById(`${id}-pagination`), category: "All", search: "", page: 1 });
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
        document.getElementById(`${type}-search`)?.addEventListener('input', (e) => {
            clearTimeout(timeout);
            toggleLoader(true);
            timeout = setTimeout(() => {
                grids[type].search = e.target.value.toLowerCase().trim();
                grids[type].page = 1;
                renderGrid(type, true);
            }, 150);
        });
    });

    function populateCardPool(cardPool, paginatedData) {
        cardPool.forEach((poolItem, index) => {
            const item = paginatedData[index];
            if (item) {
                poolItem.element.style.display = 'block';
                const targetImg = item.image || '';
                if (poolItem.imgEl.dataset.src !== targetImg) {
                    poolItem.imgEl.dataset.src = targetImg;
                    poolItem.imgEl.src = targetImg;
                    poolItem.imgEl.style.display = targetImg ? 'block' : 'none';
                    if (!targetImg) poolItem.imgEl.removeAttribute('src');
                }
                if (poolItem.titleEl.textContent !== item.title) poolItem.titleEl.textContent = item.title;
                if (poolItem.descEl.textContent !== (item.description || '')) poolItem.descEl.textContent = item.description || '';
                if (poolItem.catEl && poolItem.catEl.textContent !== (item.category || 'All')) poolItem.catEl.textContent = item.category || 'All';

                poolItem.element.onclick = () => {
                    savedWindowScrollY = window.scrollY || document.documentElement.scrollTop;
                    const activePage = document.querySelector('.page.active');
                    if (activePage) savedPageScrollTop = activePage.scrollTop;
                    if (modalTitle) modalTitle.textContent = item.title;
                    if (modalOverlay) modalOverlay.classList.add('active');
                    if (modalIframe) modalIframe.src = item.url;
                    setTimeout(() => Object.keys(grids).forEach(destroyPool), 50);
                };
            } else {
                poolItem.element.style.display = 'none';
                if (poolItem.imgEl.dataset.src !== '') {
                    poolItem.imgEl.dataset.src = '';
                    poolItem.imgEl.removeAttribute('src');
                    poolItem.imgEl.style.display = 'none';
                }
                if (poolItem.catEl) poolItem.catEl.textContent = '';
                poolItem.element.onclick = null;
            }
        });
    }

    function renderPagination(type, totalPages) {
        const grid = grids[type];
        if (!grid.pageEl) return;
        grid.pageEl.innerHTML = '';
        
        if (totalPages > 1) {
            const addBtn = (icon, isNext) => {
                const btn = document.createElement('button');
                btn.className = 'page-btn';
                btn.innerHTML = `<i class="ph ph-caret-${icon}"></i>`;
                const canClick = (isNext && grid.page < totalPages) || (!isNext && grid.page > 1);
                if (canClick) {
                    btn.addEventListener('click', () => { toggleLoader(true); grid.page += isNext ? 1 : -1; renderGrid(type, true); });
                } else {
                    btn.style.opacity = '0.4';
                    btn.style.cursor = 'not-allowed';
                }
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

            const start = (grid.page - 1) * itemsPerPage;
            const paginated = filtered.slice(start, start + itemsPerPage);

            const exec = () => {
                populateCardPool(grid.pool, paginated);
                renderPagination(type, totalPages);
                
                Promise.all(grid.pool.map((pItem, idx) => {
                    const item = paginated[idx];
                    if (item?.image && pItem.imgEl) {
                        return new Promise(res => {
                            const img = pItem.imgEl;
                            if (img.complete && img.naturalWidth > 0) return res();
                            const done = () => { img.onload = img.onerror = null; res(); };
                            img.onload = img.onerror = done;
                            setTimeout(done, 3000); 
                        });
                    }
                })).then(() => { grid.gridEl.style.opacity = '1'; toggleLoader(false); });
            };

            if (withPreload) {
                grid.gridEl.style.opacity = '0';
                setTimeout(exec, 250);
            } else exec();
        });
    }

    function animateIndicatorUpdate(duration = 500) {
        const start = performance.now();
        requestAnimationFrame(function step(time) {
            updateIndicator(navBar?.querySelector('.nav-btn.active'));
            if (time - start < duration) window.requestAnimationFrame(step);
        });
    }

    function setupSetting(id, storageKey, classPrefix, classFn) {
        const el = document.getElementById(id);
        if (!el) return;
        const saved = localStorage.getItem(storageKey) || el.value;
        el.value = saved;
        classFn(saved);
        el.addEventListener('change', (e) => {
            if (classPrefix) body.className = body.className.replace(new RegExp(`\\b${classPrefix}-\\S+`, 'g'), '').trim();
            classFn(e.target.value);
            localStorage.setItem(storageKey, e.target.value);
            animateIndicatorUpdate(); 
        });
    }

    setupSetting('layout-theme-select', 'kstuff_theme', 'theme', v => body.classList.add(v));
    setupSetting('layout-nav-select', 'kstuff_nav_pos', 'nav', v => body.classList.add(v));
    setupSetting('layout-size-select', 'kstuff_nav_size', 'size', v => body.classList.add(v));
    setupSetting('layout-text-select', 'kstuff_text_vis', '', v => body.classList.toggle('text-hide', v === 'text-hide'));

    const settingsBody = document.querySelector('.modal-settings-body');
    if (settingsBody && !document.getElementById('save-settings-btn')) {
        const authActionCard = document.createElement('div');
        authActionCard.className = 'setting-group';
        authActionCard.style.cssText = 'flex-direction: column; gap: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; margin-top: 15px;';
        authActionCard.innerHTML = `
            <div id="auth-status-display" style="font-size: 0.9rem; opacity: 0.8;">Not logged in.</div>
            <button id="open-auth-modal-btn" class="page-btn" style="width: 100%; justify-content: center; background: var(--text-color); color: var(--bg-color);">Log In / Sign Up</button>
            <button id="save-settings-btn" class="page-btn" style="width: 100%; justify-content: center; background: #00ffcc; color: #000;">Save Changes to Cloud</button>
        `;
        settingsBody.appendChild(authActionCard);

        document.getElementById('save-settings-btn').addEventListener('click', () => {
            if (!backendReady || !backendPort) {
                alert("Backend cable not yet established.");
                return;
            }
            const settingsPayload = {
                theme: document.getElementById('layout-theme-select').value,
                navPos: document.getElementById('layout-nav-select').value,
                navSize: document.getElementById('layout-size-select').value
            };
            if (currentUser) {
                backendPort.postMessage({ type: 'update-settings', username: currentUser.username, settings: settingsPayload });
            } else {
                alert("Please log in to sync settings to your specific cloud account profile.");
            }
        });
    }

    function updateAuthUI(isLoggedIn) {
        const statusEl = document.getElementById('auth-status-display');
        const authBtn = document.getElementById('open-auth-modal-btn');
        if (statusEl && authBtn) {
            if (isLoggedIn && currentUser) {
                statusEl.textContent = `Logged in as: ${currentUser.username}`;
                authBtn.textContent = 'Log Out';
                authBtn.onclick = () => {
                    currentUser = null;
                    if (backendPort) backendPort.postMessage({ type: 'logout' });
                    updateAuthUI(false);
                };
            } else {
                statusEl.textContent = 'Not logged in.';
                authBtn.textContent = 'Log In / Sign Up';
                authBtn.onclick = () => openAuthModal();
            }
        }
    }

    function applyCustomDropdown(selectEl) {
        if (!selectEl || selectEl.dataset.customized) {
            if (selectEl?.dataset.customized) selectEl.nextElementSibling?.classList.contains('custom-select-wrapper') && selectEl.nextElementSibling.remove();
            else return;
        }
        
        selectEl.style.display = 'none';
        selectEl.dataset.customized = 'true';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        trigger.innerHTML = `<span>${selectEl.options[selectEl.selectedIndex]?.text || ''}</span> <i class="ph ph-caret-down"></i>`;
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-select-options';
        
        Array.from(selectEl.options).forEach((opt, idx) => {
            const optionEl = document.createElement('div');
            optionEl.className = `custom-select-option ${idx === selectEl.selectedIndex ? 'selected' : ''}`;
            optionEl.textContent = opt.text;
            
            optionEl.addEventListener('click', (e) => {
                e.stopPropagation();
                selectEl.value = opt.value;
                trigger.querySelector('span').textContent = opt.text;
                optionsContainer.querySelectorAll('.custom-select-option').forEach(el => el.classList.remove('selected'));
                optionEl.classList.add('selected');
                optionsContainer.classList.remove('open');
                selectEl.dispatchEvent(new Event('change'));
            });
            optionsContainer.appendChild(optionEl);
        });
        
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select-options.open').forEach(el => el !== optionsContainer && el.classList.remove('open'));
            optionsContainer.classList.toggle('open');
        });
        
        wrapper.append(trigger, optionsContainer);
        selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);
    }

    document.addEventListener('click', () => document.querySelectorAll('.custom-select-options.open').forEach(el => el.classList.remove('open')));
    document.querySelectorAll('.setting-group select').forEach(applyCustomDropdown);

    const bindModal = (id, btnId) => {
        const m = document.getElementById(id), b = document.getElementById(btnId);
        b?.addEventListener('click', () => m?.classList.remove('active'));
        m?.addEventListener('click', (e) => e.target === m && m.classList.remove('active'));
        return m;
    };
    
    const settingsModal = bindModal('homeworkhelper-modal', 'homeworkhelper-close-btn');
    const changelogModal = bindModal('changelog-modal', 'changelog-close-btn');
    const authModal = bindModal('auth-modal-overlay', 'auth-close-btn');

    function openAuthModal() {
        authModal?.classList.add('active');
    }

    document.getElementById('do-login-btn')?.addEventListener('click', () => {
        const u = document.getElementById('auth-user')?.value.trim();
        const p = document.getElementById('auth-pass')?.value.trim();
        
        alert(`Attempting login for: ${u} | Port ready: ${!!backendPort}`);

        if (u && p && backendPort) {
            backendPort.postMessage({ type: 'login', username: u, password: p });
        } else {
            alert("Missing credentials or backend port not connected!");
        }
    });

    document.getElementById('do-signup-btn')?.addEventListener('click', () => {
        const u = document.getElementById('auth-user')?.value.trim();
        const p = document.getElementById('auth-pass')?.value.trim();
        
        alert(`Attempting signup for: ${u} | Port ready: ${!!backendPort}`);

        if (u && p && backendPort) {
            backendPort.postMessage({ type: 'signup', username: u, password: p });
        } else {
            alert("Missing credentials or backend port not connected!");
        }
    });

    const navTitles = {
        'mathworksheets': 'emoH',
        'readingcorner': 'semaG',
        'sciencequiz': 'sppA',
        'gradebook': 'cisuM',
        'lessonplanner': 'IA',
        'changelog': 'golegnahC',
        'homeworkhelper': 'sgnitteS',
        'profile': 'eliforP'
    };

    navBtns.forEach(btn => {
        btn.style.position = 'relative';
        const tooltip = document.createElement('div');
        tooltip.className = 'nav-tooltip';
        const rawTitle = navTitles[btn.dataset.target] || 'egaP';
        const targetTitle = rawTitle.split('').reverse().join('');
        
        targetTitle.split('').forEach(letter => {
            const letterDiv = document.createElement('div');
            letterDiv.textContent = letter;
            tooltip.appendChild(letterDiv);
        });
        
        btn.appendChild(tooltip);

        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            if (targetId === 'profile') {
                if (!currentUser) {
                    openAuthModal();
                } else {
                    settingsModal?.classList.add('active');
                }
                return;
            }
            
            if (targetId === 'homeworkhelper') return settingsModal?.classList.add('active');
            if (targetId === 'changelog') return changelogModal?.classList.add('active');

            toggleLoader(true);
            const activeBtn = document.querySelector('.nav-btn.active');
            if (activeBtn) {
                const currentId = activeBtn.dataset.target;
                if (currentId !== targetId && iframePages[currentId]) {
                    const frame = document.getElementById(iframePages[currentId].id);
                    if (frame) frame.srcdoc = '';
                }
            }

            navBtns.forEach(b => !['homeworkhelper', 'changelog', 'profile'].includes(b.dataset.target) && b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            updateIndicator(btn);

            const targetPage = document.getElementById(targetId);
            if (targetPage) {
                targetPage.classList.add('active');
                Object.keys(grids).forEach(k => k !== targetId && destroyPool(k));
                
                if (grids[targetId]) {
                    buildPool(targetId);
                    setTimeout(() => renderGrid(targetId, false), 50);
                } else if (iframePages[targetId]) {
                    loadIframePage(iframePages[targetId].id, iframePages[targetId].path, targetId);
                    setTimeout(() => toggleLoader(false), 300);
                } else toggleLoader(false);
            } else toggleLoader(false);
        });
    });

    if (navBar?.querySelector('.nav-btn.active') || navBtns[0]) {
        animateIndicatorUpdate(1000);
        window.addEventListener('load', () => updateIndicator(navBar.querySelector('.nav-btn.active') || navBtns[0]));
    }
    window.addEventListener('resize', () => updateIndicator(navBar?.querySelector('.nav-btn.active')));

    function closeResourceModal() {
        modalOverlay?.classList.remove('active');
        if (modalIframe) modalIframe.src = 'about:blank';
        
        const activePage = document.querySelector('.page.active');
        if (activePage && grids[activePage.id]) {
            buildPool(activePage.id);
            renderGrid(activePage.id, false);
        }

        let attempts = 0;
        const scrollInt = setInterval(() => {
            window.scrollTo(0, savedWindowScrollY);
            if (activePage) activePage.scrollTop = savedPageScrollTop;
            if (++attempts >= 20) clearInterval(scrollInt);
        }, 50);
    }

    document.getElementById('resource-close-btn')?.addEventListener('click', closeResourceModal);
    modalOverlay?.addEventListener('click', (e) => e.target === modalOverlay && closeResourceModal());
    document.getElementById('resource-fullscreen-btn')?.addEventListener('click', () => !document.fullscreenElement ? modalIframe?.requestFullscreen().catch(()=>{}) : document.exitFullscreen());

    fetchWithProxy('Json/categories.json').then(cats => {
        const setupCatSelect = (id, options, type) => {
            const select = document.getElementById(id);
            if (!select) return;
            select.innerHTML = (options || []).map(c => `<option value="${c}">${c}</option>`).join('');
            applyCustomDropdown(select);
            select.addEventListener('change', (e) => {
                toggleLoader(true);
                grids[type].category = e.target.value;
                grids[type].page = 1;
                renderGrid(type, true);
            });
        };
        setupCatSelect('readingcorner-category-select', cats.Games, 'readingcorner');
        setupCatSelect('sciencequiz-category-select', cats.Apps, 'sciencequiz');
    }).catch(()=>{});

    fetchWithProxy('Json/change-log.json').then(log => {
        const contentEl = document.getElementById('changelog-content'), tsEl = document.getElementById('changelog-timestamp');
        if (log) {
            if (tsEl) tsEl.textContent = log.timestamp || "Unknown";
            if (contentEl) contentEl.innerHTML = log.changes?.length ? `<ul style="padding-left: 1.5rem; margin: 0;">${log.changes.map(c => `<li style="margin-bottom: 0.5rem;">${c}</li>`).join('')}</ul>` : "No recent changes found.";
        }
    }).catch(() => {
        const contentEl = document.getElementById('changelog-content');
        if (contentEl) contentEl.innerHTML = "Failed to load update log.";
        const tsEl = document.getElementById('changelog-timestamp');
        if (tsEl) tsEl.textContent = "Unknown";
    });

    const fetchCfg = (url) => fetchWithProxy(url).catch(() => []).then(getWorkingConfig);
    const staticDataPromise = fetchWithProxy('Json/urls/static.json').catch(() => []);
    
    Promise.all([
        fetchWithProxy('Json/g.json').catch(() => []),
        fetchWithProxy('Json/a.json').catch(() => []),
        fetchWithProxy('Json/truffled.json').catch(() => null),
        fetchCfg('Json/urls/scram.json'),
        staticDataPromise.then(getWorkingConfig),
        fetchCfg('Json/urls/uv.json'),
        fetchCfg('Json/urls/truffled.json'),
        staticDataPromise.then(data => getWorkingConfig(data.map(item => ({ url: item.url, img: item.img, final: "" }))))
    ]).then(([gData, aData, truffledData, scram, stat, uv, truffled, frogiee]) => {
        
        if (stat) {
            initBackendBridge(stat.url);
        }

        function applyBases(str) {
            if (!str || typeof str !== 'string') return str;
            const replacements = {
                'scram': scram ? scram.url.replace(/\/+$/, '') + scram.final : '',
                'static': stat ? stat.url.replace(/\/+$/, '') + stat.final : '',
                'uv': uv ? uv.url.replace(/\/+$/, '') + uv.final : '',
                'frogiee': frogiee ? frogiee.url.replace(/\/+$/, '') : '',
                'truffled': truffled ? truffled.url.replace(/\/+$/, '') : 'https://boat.strongson.com'
            };
            for (const [key, val] of Object.entries(replacements)) str = str.split(`\${${key}}`).join(val);
            return str.replace(/([^:]\/)\/+/g, '$1');
        }

        const truffledMap = new Map();
        truffledData?.games?.forEach(g => truffledMap.set(g.name.toLowerCase().trim(), g));

        const processItems = (dataArr) => dataArr.map(item => {
            let processed = { ...item };
            if (processed.url?.includes('${truffled}')) {
                const match = truffledMap.get((processed.title || "").toLowerCase().trim());
                if (match) {
                    processed.title = match.name;
                    processed.url = '${truffled}/' + match.url.replace(/^\/+/, '');
                    processed.image = '${truffled}/' + match.thumbnail.replace(/^\/+/, '');
                    processed.description = '';
                    processed.category = processed.category || 'Truffled';
                }
            }
            processed.url = applyBases(processed.url);
            processed.image = applyBases(processed.image);
            return processed;
        }).sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: 'base' }));

        grids.readingcorner.data = processItems(gData);
        grids.sciencequiz.data = processItems(aData);

        const activePage = document.querySelector('.page.active');
        if (activePage) {
            if (grids[activePage.id]) {
                buildPool(activePage.id);
                renderGrid(activePage.id, false);
            } else if (iframePages[activePage.id]) {
                loadIframePage(iframePages[activePage.id].id, iframePages[activePage.id].path, activePage.id);
            } else { Object.keys(grids).forEach(destroyPool); toggleLoader(false); }
        } else { Object.keys(grids).forEach(destroyPool); toggleLoader(false); }

    }).catch(() => toggleLoader(false));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initApp);
else initApp();
