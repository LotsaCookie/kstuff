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
    let syncInterval = null;
    
    let currentUser = null;
    try {
        const cachedUser = localStorage.getItem('kstuff_user');
        if (cachedUser) {
            currentUser = JSON.parse(cachedUser);
        }
    } catch (e) {
        localStorage.removeItem('kstuff_user');
    }

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

    function initBackendBridge(workingConfig) {
        if (!workingConfig) return;
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
        
        const baseUrl = (workingConfig.url || '').replace(/\/+$/, '');
        const finalPath = (workingConfig.final || '').replace(/^\/+/, '');
        const proxyPrefix = baseUrl + (finalPath ? '/' + finalPath : '');
        
        const rawBackendUrl = 'https://lotsacookie.github.io/Dnekcabtset/backend.html?jsxx';
        
        let backendTargetUrl;
        if (proxyPrefix.includes('embed.html#')) {
            backendTargetUrl = proxyPrefix + rawBackendUrl;
        } else {
            backendTargetUrl = proxyPrefix.replace(/\/+$/, '') + '/embed.html#' + rawBackendUrl;
        }
        
        hiddenFrame.src = backendTargetUrl;
        (document.body || document.documentElement).appendChild(hiddenFrame);

        const cableInterval = setInterval(() => {
            if (!backendReady && hiddenFrame.contentWindow) {
                const channel = new MessageChannel();
                channel.port1.onmessage = (e) => handleBackendMessage(e.data, channel.port1);
                try {
                    hiddenFrame.contentWindow.postMessage({ type: 'init_cable' }, '*', [channel.port2]);
                } catch (err) {}
            }
        }, 1500);

        function handleBackendMessage(data, activePort) {
            if (!data) return;
            
            if (data.type === 'ready') {
                backendReady = true;
                backendPort = activePort;
                clearInterval(cableInterval);
                if (currentUser) {
                    const attemptSync = () => {
                        backendPort.postMessage({ type: 'auto-login', username: currentUser.username }); 
                    };
                    attemptSync();
                    syncInterval = setInterval(attemptSync, 5000);
                }
            } else if (data.type === 'login' || data.type === 'auto-login' || data.type === 'signup') {
                if (data.type === 'auto-login' && syncInterval) {
                    clearInterval(syncInterval);
                    syncInterval = null;
                }

                if (data.success) {
                    const incomingUser = data.payload;
                    if (currentUser?.settings?.lastUpdated) {
                        const localTime = currentUser.settings.lastUpdated;
                        const cloudTime = incomingUser.settings?.lastUpdated || 0;
                        if (localTime > cloudTime) {
                            incomingUser.settings = currentUser.settings; 
                        }
                    }

                    currentUser = incomingUser;
                    localStorage.setItem('kstuff_user', JSON.stringify(currentUser)); 
                    
                    const settingsToApply = currentUser.settings || { theme: currentUser.theme };
                    applyCloudSettings(settingsToApply);
                    
                    updateAuthUI(true);
                    document.getElementById('auth-modal-overlay')?.classList.remove('active');
                } else {
                    if (data.type === 'auto-login') {
                        currentUser = null;
                        localStorage.removeItem('kstuff_user'); 
                        updateAuthUI(false);
                    }
                }
            }
        }
    }

    async function loadDynamicThemes() {
        try {
            const res = await (typeof fetchWithProxy === 'function' 
                ? fetchWithProxy('Json/themes.json') 
                : fetch('Json/themes.json').then(r => r.json()));
            const themes = res;
            let cssString = '';
            let optionsHTML = '';
            themes.forEach(theme => {
                cssString += `.${theme.id} {\n`;
                for (const [prop, val] of Object.entries(theme.variables)) {
                    cssString += `    ${prop}: ${val};\n`;
                }
                cssString += `}\n\n`;
                optionsHTML += `<option value="${theme.id}">${theme.name}</option>`;
            });
            const styleTag = document.createElement('style');
            styleTag.id = 'dynamic-themes-style';
            styleTag.textContent = cssString;
            document.head.appendChild(styleTag);
            const selectEl = document.getElementById('layout-theme-select');
            if (selectEl) {
                const currentVal = localStorage.getItem('kstuff_theme') || themes[0].id;
                if (selectEl.dataset.customized) {
                    const wrapper = selectEl.nextElementSibling;
                    if (wrapper && wrapper.classList.contains('custom-select-wrapper')) {
                        wrapper.remove();
                    }
                    delete selectEl.dataset.customized;
                    selectEl.style.display = ''; 
                }
                selectEl.innerHTML = optionsHTML;
                selectEl.value = currentVal;
                document.body.className = document.body.className.replace(/\btheme-\S+/g, '').trim();
                document.body.classList.add(currentVal);
                if (typeof applyCustomDropdown === 'function') {
                    applyCustomDropdown(selectEl);
                }
            }
        } catch (error) {
            console.error("Failed to load themes from Json/themes.json:", error);
        }
    }
    loadDynamicThemes();

    const iframePages = {
        'mathworksheets': { id: 'mathworksheets-iframe', path: 'Pages/browser.html' },
        'gradebook': { id: 'gradebook-iframe', path: 'Pages/music.html' },
        'lessonplanner': { id: 'lessonplanner-iframe', path: 'Pages/ai.html' }
    };

    async function loadIframePage(iframeId, path) {
        const iframe = document.getElementById(iframeId);
        if (!iframe) {
            toggleLoader(false);
            return;
        }
        
        if (iframe.dataset.loadedPath === path && iframe.srcdoc) {
            toggleLoader(false);
            return;
        }

        toggleLoader(true);
        
        try {
            const htmlContent = await fetchWithProxy(path, true);
            
            iframe.onload = () => {
                toggleLoader(false);
            };
            
            iframe.dataset.loadedPath = path;
            iframe.srcdoc = htmlContent;

        } catch (error) {
            console.error("Failed to load page content:", error);
            iframe.onload = () => toggleLoader(false);
            iframe.srcdoc = `<html style="background:transparent;"><body style="color:var(--text-color, white); font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh; margin:0;"><h2>Failed to load page content. Please try again.</h2></body></html>`;
        }
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

    function animateIndicatorUpdate(duration = 300) {
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

    function applyCloudSettings(settings) {
        if (!settings) return;
        const updates = [
            { id: 'layout-theme-select', val: settings.theme, key: 'kstuff_theme' },
            { id: 'layout-nav-select', val: settings.navPos, key: 'kstuff_nav_pos' },
            { id: 'layout-size-select', val: settings.navSize, key: 'kstuff_nav_size' },
            { id: 'layout-text-select', val: settings.textVis, key: 'kstuff_text_vis' }
        ];
        updates.forEach(({ id, val, key }) => {
            if (!val) return; 
            const el = document.getElementById(id);
            if (el) {
                localStorage.setItem(key, val);
                el.value = val;
                el.dispatchEvent(new Event('change'));
                const wrapper = el.nextElementSibling;
                if (wrapper && wrapper.classList.contains('custom-select-wrapper')) {
                    const triggerSpan = wrapper.querySelector('.custom-select-trigger span');
                    if (triggerSpan) triggerSpan.textContent = el.options[el.selectedIndex]?.text || '';
                    const options = wrapper.querySelectorAll('.custom-select-option');
                    options.forEach((opt, idx) => {
                        if (idx === el.selectedIndex) opt.classList.add('selected');
                        else opt.classList.remove('selected');
                    });
                }
            }
        });
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

    document.getElementById('save-settings-btn')?.addEventListener('click', (e) => {
        const btn = e.target;
        const originalText = btn.textContent;
        const originalBg = btn.style.background;
        const originalColor = btn.style.color;
        
        const settingsPayload = {
            theme: document.getElementById('layout-theme-select')?.value,
            navPos: document.getElementById('layout-nav-select')?.value,
            navSize: document.getElementById('layout-size-select')?.value,
            textVis: document.getElementById('layout-text-select')?.value,
            lastUpdated: Date.now() 
        };
        
        if (currentUser && backendReady && backendPort) {
            currentUser.settings = settingsPayload;
            localStorage.setItem('kstuff_user', JSON.stringify(currentUser));
            applyCloudSettings(settingsPayload); 
            backendPort.postMessage({ type: 'update-settings', username: currentUser.username, settings: settingsPayload });
            btn.textContent = "Saved to Cloud!";
        } else {
            btn.textContent = "Saved Locally!";
        }

        btn.style.background = "#4CAF50"; 
        btn.style.color = "#fff";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = originalBg;
            btn.style.color = originalColor;
        }, 2000);
    });

    function updateProfileModal() {
        if (!currentUser) return;
        const defaultPic = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cpath fill='%23888' d='M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-61.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,133.52,0Z'/%3E%3C/svg%3E";
        
        const pic = document.getElementById('profile-modal-pic');
        const name = document.getElementById('profile-modal-username');
        const desc = document.getElementById('profile-modal-desc');
        const navBtn = document.getElementById('profile-nav-btn');
        
        const userPic = currentUser.profilePicture || defaultPic;
        
        if (pic) pic.src = userPic;
        if (name) name.textContent = currentUser.username || "User";
        if (desc) desc.textContent = currentUser.description || "No description provided.";
        
        if (navBtn) {
            navBtn.innerHTML = `<div class="profile-avatar-container"><img src="${userPic}" alt="Profile" onerror="this.src='${defaultPic}'"></div>`;
        }
    }

    function updateAuthUI(isLoggedIn) {
        const navBtn = document.getElementById('profile-nav-btn');
        if (isLoggedIn && currentUser) {
            updateProfileModal();
        } else {
            if (navBtn) navBtn.innerHTML = '<i class="ph ph-user" id="profile-nav-icon"></i>';
        }
    }

    if (currentUser) {
        const initialSettings = currentUser.settings || { theme: currentUser.theme };
        applyCloudSettings(initialSettings);
        updateAuthUI(true);
    } else {
        updateAuthUI(false);
    }

    const bindModal = (id, btnId) => {
        const m = document.getElementById(id), b = document.getElementById(btnId);
        b?.addEventListener('click', () => m?.classList.remove('active'));
        m?.addEventListener('click', (e) => e.target === m && m.classList.remove('active'));
        return m;
    };
    
    const settingsModal = bindModal('homeworkhelper-modal', 'homeworkhelper-close-btn');
    const changelogModal = bindModal('changelog-modal', 'changelog-close-btn');
    const authModal = bindModal('auth-modal-overlay', 'auth-close-btn');
    const profileModal = bindModal('profile-modal-overlay', 'profile-close-btn');

    document.getElementById('do-login-btn')?.addEventListener('click', () => {
        const u = document.getElementById('auth-user')?.value.trim();
        const p = document.getElementById('auth-pass')?.value.trim();
        
        if (u && p && backendReady && backendPort) {
            backendPort.postMessage({ type: 'login', username: u, password: p });
        }
    });

    document.getElementById('do-signup-btn')?.addEventListener('click', () => {
        const u = document.getElementById('auth-user')?.value.trim();
        const p = document.getElementById('auth-pass')?.value.trim();
        
        if (u && p && backendReady && backendPort) {
            backendPort.postMessage({ type: 'signup', username: u, password: p });
        }
    });

    document.getElementById('do-logout-btn')?.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('kstuff_user'); 
        if (backendPort) backendPort.postMessage({ type: 'logout' });
        updateAuthUI(false);
        profileModal?.classList.remove('active');
    });

    const editProfileBtn = document.getElementById('edit-profile-btn');
    const profileEditContainer = document.getElementById('profile-edit-container');
    const profileEditPicUrl = document.getElementById('profile-edit-pic-url');
    const profileEditDesc = document.getElementById('profile-edit-desc');
    const saveProfileChangesBtn = document.getElementById('save-profile-changes-btn');

    editProfileBtn?.addEventListener('click', () => {
        if (!currentUser) return;
        const isHidden = profileEditContainer.style.display === 'none';
        
        if (isHidden) {
            profileEditPicUrl.value = currentUser.profilePicture || "";
            profileEditDesc.value = currentUser.description || "";
            profileEditContainer.style.display = 'flex';
            setTimeout(() => profileEditContainer.style.opacity = '1', 10);
        } else {
            profileEditContainer.style.opacity = '0';
            setTimeout(() => profileEditContainer.style.display = 'none', 300);
        }
    });

    saveProfileChangesBtn?.addEventListener('click', () => {
        if (!currentUser || !backendReady || !backendPort) return;
        
        const originalText = saveProfileChangesBtn.textContent;
        saveProfileChangesBtn.textContent = "Saving to Cloud...";
        
        const newPic = profileEditPicUrl.value.trim();
        const newDesc = profileEditDesc.value.trim();
        
        currentUser.profilePicture = newPic || "https://kstuff.neocities.org/assets/default-profile.png";
        currentUser.description = newDesc || "No bio provided yet.";
        
        localStorage.setItem('kstuff_user', JSON.stringify(currentUser));
        
        updateProfileModal();
        
        backendPort.postMessage({ 
            type: 'update-settings', 
            username: currentUser.username, 
            settings: { 
                profilePicture: currentUser.profilePicture, 
                description: currentUser.description 
            } 
        });

        setTimeout(() => {
            saveProfileChangesBtn.textContent = originalText;
            profileEditContainer.style.opacity = '0';
            setTimeout(() => profileEditContainer.style.display = 'none', 300);
        }, 600);
    });

    navBtns.forEach(btn => {
        btn.style.position = 'relative';
        
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            if (targetId === 'profile') {
                if (!currentUser) {
                    authModal?.classList.add('active');
                } else {
                    updateProfileModal();
                    profileModal?.classList.add('active');
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
                    if (frame) {
                        frame.srcdoc = ''; 
                        frame.removeAttribute('srcdoc'); 
                        delete frame.dataset.loadedPath;
                    }
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
                    loadIframePage(iframePages[targetId].id, iframePages[targetId].path);
                } else {
                    toggleLoader(false);
                }
            } else {
                toggleLoader(false);
            }
        });
    });

    if (navBar?.querySelector('.nav-btn.active') || navBtns[0]) {
        animateIndicatorUpdate(600);
        window.addEventListener('load', () => updateIndicator(navBar.querySelector('.nav-btn.active') || navBtns[0]));
    }
    
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => updateIndicator(navBar?.querySelector('.nav-btn.active')), 100);
    });

    function closeResourceModal() {
        modalOverlay?.classList.remove('active');
        if (modalIframe) modalIframe.src = 'about:blank';
        
        const activePage = document.querySelector('.page.active');
        if (activePage && grids[activePage.id]) {
            buildPool(activePage.id);
            renderGrid(activePage.id, false);
        }

        setTimeout(() => {
            window.scrollTo(0, savedWindowScrollY);
            if (activePage) activePage.scrollTop = savedPageScrollTop;
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
            initBackendBridge(stat);
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
                loadIframePage(iframePages[activePage.id].id, iframePages[activePage.id].path);
            } else { Object.keys(grids).forEach(destroyPool); toggleLoader(false); }
        } else { Object.keys(grids).forEach(destroyPool); toggleLoader(false); }

    }).catch(() => toggleLoader(false));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initApp);
else initApp();
