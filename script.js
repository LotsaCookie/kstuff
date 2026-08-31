function initApp() {
    async function getWorkingConfig(table) {
        if (!table || !table.length) return null;
        const chunkSize = 5;
        for (let i = 0; i < table.length; i += chunkSize) {
            const chunk = table.slice(i, i + chunkSize);
            const winner = await new Promise((resolve) => {
                let resolved = false, failedCount = 0;
                const activeImages = [];

                const cleanup = () => {
                    activeImages.forEach(im => {
                        im.onload = im.onerror = null;
                        im.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                    });
                    activeImages.length = 0;
                };

                chunk.forEach(entry => {
                    const img = new Image();
                    activeImages.push(img);
                    const fullTestUrl = entry.url.replace(/\/+$/, '') + '/' + entry.img.replace(/^\/+/, '');
                    
                    img.onload = () => {
                        if (!resolved) {
                            if (img.naturalWidth > 0) { resolved = true; cleanup(); resolve(entry); } 
                            else if (++failedCount === chunk.length) { resolved = true; cleanup(); resolve(null); }
                        }
                    };
                    
                    img.onerror = () => {
                        if (!resolved && ++failedCount === chunk.length) { resolved = true; cleanup(); resolve(null); }
                    };
                    
                    img.src = fullTestUrl + (fullTestUrl.includes('?') ? '&' : '?') + '_=' + Date.now();
                });

                setTimeout(() => {
                    if (!resolved) { resolved = true; cleanup(); resolve(null); }
                }, 8000);
            });
            if (winner) return winner; 
        }
        return table[0]; 
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runLogic);
    else runLogic();

    function runLogic() {
        const body = document.body;
        const navBar = document.getElementById('teachertouchbar');
        const navBtns = document.querySelectorAll('.nav-btn');
        const pages = document.querySelectorAll('.page');
        const loader = document.querySelector('.section-loader');
        
        const showLoader = () => { if (loader) { loader.style.opacity = '1'; loader.classList.remove('hidden'); } };
        const hideLoader = () => { if (loader) { loader.style.opacity = '0'; loader.classList.add('hidden'); } };
        if (loader) loader.style.opacity = '0';

        const modalOverlay = document.getElementById('resource-modal');
        const modalIframe = document.getElementById('resource-modal-iframe');
        const modalTitle = document.getElementById('resource-modal-title');
        
        let savedWindowScrollY = 0, savedPageScrollTop = 0, cachedCommitHash = null;

        let indicator = navBar?.querySelector('.nav-indicator');
        if (navBar && !indicator) {
            indicator = document.createElement('div');
            indicator.className = 'nav-indicator';
            navBar.prepend(indicator);
        }

        function updateIndicator(activeBtn) {
            if (!activeBtn || !indicator || !navBar) return;
            const isVertical = body.classList.contains('nav-left') || body.classList.contains('nav-right');
            const navRect = navBar.getBoundingClientRect();
            const btnRect = activeBtn.getBoundingClientRect();
            
            indicator.style.cssText = ''; 
            if (isVertical) {
                indicator.style.width = '3px';
                indicator.style.height = `${btnRect.height}px`;
                indicator.style.transform = `translateY(${btnRect.top - navRect.top}px)`;
            } else {
                indicator.style.width = `${btnRect.width}px`;
                indicator.style.height = '3px';
                indicator.style.transform = `translateX(${btnRect.left - navRect.left}px)`;
            }
        }

        async function getProxyList() {
            if (!cachedCommitHash) {
                try {
                    const res = await fetch("https://api.github.com/repos/lotsacookie/kstuff/commits/main");
                    cachedCommitHash = res.ok ? (await res.json()).sha : "main";
                } catch { cachedCommitHash = "main"; }
            }
            return [
                `https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@${cachedCommitHash}/`,
                `https://raw.githubusercontent.com/lotsacookie/kstuff/${cachedCommitHash}/`,
                `https://raw.githack.com/lotsacookie/kstuff/${cachedCommitHash}/`,
                `https://cdn.statically.io/gh/lotsacookie/kstuff/${cachedCommitHash}/`,
                ""
            ];
        }

        async function fetchAsset(path) {
            const proxies = await getProxyList();
            for (const proxy of proxies) {
                try {
                    const res = await fetch(proxy + path + (proxy ? "" : "?_=" + Date.now()));
                    if (res.ok) return await res.json();
                } catch {}
            }
            throw new Error("All proxies failed for " + path);
        }

        const iframePages = {
            'mathworksheets': { id: 'mathworksheets-iframe', path: 'Pages/browser.html' },
            'gradebook': { id: 'gradebook-iframe', path: 'Pages/music.html' },
            'lessonplanner': { id: 'lessonplanner-iframe', path: 'Pages/ai.html' }
        };

        async function loadProxyContentAsIframe(id, path, pageId) {
            const iframe = document.getElementById(id);
            if (!iframe) return;
            const proxies = await getProxyList();
            for (const proxy of proxies) {
                try {
                    const res = await fetch(proxy + path + (proxy ? "" : "?_=" + Date.now()));
                    if (res.ok) {
                        const activePage = document.querySelector('.page.active');
                        if (activePage?.id === pageId) iframe.srcdoc = await res.text();
                        return;
                    }
                } catch {}
            }
        }

        const itemsPerPage = 32;
        const grids = {
            readingcorner: { data: [], pool: [], gridEl: document.getElementById('readingcorner-grid'), pageEl: document.getElementById('readingcorner-pagination'), category: "All", search: "", page: 1 },
            sciencequiz: { data: [], pool: [], gridEl: document.getElementById('sciencequiz-grid'), pageEl: document.getElementById('sciencequiz-pagination'), category: "All", search: "", page: 1 }
        };

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

        function bindSearch(inputEl, type) {
            let timeout;
            if (inputEl) inputEl.addEventListener('input', (e) => {
                clearTimeout(timeout);
                showLoader();
                timeout = setTimeout(() => {
                    grids[type].search = e.target.value.toLowerCase().trim();
                    grids[type].page = 1;
                    renderGrid(type, true);
                }, 150);
            });
        }
        bindSearch(document.getElementById('readingcorner-search'), 'readingcorner');
        bindSearch(document.getElementById('sciencequiz-search'), 'sciencequiz');

        function populateCardPool(cardPool, paginatedData) {
            cardPool.forEach((poolItem, index) => {
                const item = paginatedData[index];
                if (item) {
                    poolItem.element.style.display = 'block';
                    const targetImage = item.image || '';
                    if (poolItem.imgEl.dataset.src !== targetImage) {
                        poolItem.imgEl.dataset.src = targetImage;
                        poolItem.imgEl.src = targetImage;
                        poolItem.imgEl.style.display = targetImage ? 'block' : 'none';
                        if (!targetImage) poolItem.imgEl.removeAttribute('src');
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
                    if ((isNext && grid.page < totalPages) || (!isNext && grid.page > 1)) {
                        btn.addEventListener('click', () => { showLoader(); grid.page += isNext ? 1 : -1; renderGrid(type, true); });
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

        function waitForImagesAndFadeIn(cardPool, paginatedData, gridEl) {
            const promises = cardPool.map((poolItem, index) => {
                const item = paginatedData[index];
                if (item?.image && poolItem.imgEl) {
                    return new Promise((res) => {
                        const img = poolItem.imgEl;
                        if (img.complete && img.naturalWidth > 0) res();
                        else {
                            const done = () => { img.onload = img.onerror = null; res(); };
                            img.onload = img.onerror = done;
                            setTimeout(done, 3000); 
                        }
                    });
                }
            });
            return Promise.all(promises).then(() => { if (gridEl) gridEl.style.opacity = '1'; hideLoader(); });
        }

        function renderGrid(type, withPreload = false) {
            window.requestAnimationFrame(() => {
                const grid = grids[type];
                if (!grid.gridEl) return;

                const filtered = grid.data.filter(item => 
                    (grid.category === "All" || item.category === grid.category) && 
                    item.title.toLowerCase().includes(grid.search)
                );

                const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
                if (grid.page > totalPages) grid.page = 1;

                const start = (grid.page - 1) * itemsPerPage;
                const paginated = filtered.slice(start, start + itemsPerPage);

                const exec = () => {
                    populateCardPool(grid.pool, paginated);
                    renderPagination(type, totalPages);
                    waitForImagesAndFadeIn(grid.pool, paginated, grid.gridEl);
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

        function setupSetting(selectEl, storageKey, classPrefix, classFn) {
            if (!selectEl) return;
            const saved = localStorage.getItem(storageKey) || selectEl.value;
            selectEl.value = saved;
            classFn(saved);
            selectEl.addEventListener('change', (e) => {
                if (classPrefix) body.className = body.className.replace(new RegExp(`\\b${classPrefix}-\\S+`, 'g'), '').trim();
                classFn(e.target.value);
                localStorage.setItem(storageKey, e.target.value);
                animateIndicatorUpdate(); 
            });
        }

        setupSetting(document.getElementById('layout-theme-select'), 'kstuff_theme', 'theme', v => body.classList.add(v));
        setupSetting(document.getElementById('layout-nav-select'), 'kstuff_nav_pos', 'nav', v => body.classList.add(v));
        setupSetting(document.getElementById('layout-size-select'), 'kstuff_nav_size', 'size', v => body.classList.add(v));
        setupSetting(document.getElementById('layout-text-select'), 'kstuff_text_vis', '', v => body.classList.toggle('text-hide', v === 'text-hide'));

        function applyCustomDropdown(selectEl) {
            if (!selectEl) return;
            
            if (selectEl.dataset.customized) {
                const existing = selectEl.nextElementSibling;
                if (existing && existing.classList.contains('custom-select-wrapper')) existing.remove();
            }
            
            selectEl.style.display = 'none';
            selectEl.dataset.customized = 'true';
            
            const wrapper = document.createElement('div');
            wrapper.className = 'custom-select-wrapper';
            
            const trigger = document.createElement('div');
            trigger.className = 'custom-select-trigger';
            const selectedText = selectEl.options[selectEl.selectedIndex]?.text || '';
            trigger.innerHTML = `<span>${selectedText}</span> <i class="ph ph-caret-down"></i>`;
            
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'custom-select-options';
            
            Array.from(selectEl.options).forEach((opt, idx) => {
                const optionEl = document.createElement('div');
                optionEl.className = 'custom-select-option' + (idx === selectEl.selectedIndex ? ' selected' : '');
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
                document.querySelectorAll('.custom-select-options.open').forEach(el => { if (el !== optionsContainer) el.classList.remove('open'); });
                optionsContainer.classList.toggle('open');
            });
            
            wrapper.appendChild(trigger);
            wrapper.appendChild(optionsContainer);
            selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);
        }

        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select-options.open').forEach(el => el.classList.remove('open'));
        });

        document.querySelectorAll('.setting-group select').forEach(applyCustomDropdown);

        function bindModal(modalId, closeBtnId) {
            const modal = document.getElementById(modalId), closeBtn = document.getElementById(closeBtnId);
            if (closeBtn) closeBtn.addEventListener('click', () => modal?.classList.remove('active'));
            if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
            return modal;
        }
        
        const settingsModal = bindModal('homeworkhelper-modal', 'homeworkhelper-close-btn');
        const changelogModal = bindModal('changelog-modal', 'changelog-close-btn');

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                if (targetId === 'homeworkhelper') return settingsModal?.classList.add('active');
                if (targetId === 'changelog') return changelogModal?.classList.add('active');

                showLoader();
                const activeBtn = document.querySelector('.nav-btn.active');
                if (activeBtn) {
                    const currentId = activeBtn.getAttribute('data-target');
                    if (currentId !== targetId && iframePages[currentId]) {
                        const frame = document.getElementById(iframePages[currentId].id);
                        if (frame) frame.srcdoc = '';
                    }
                }

                navBtns.forEach(b => { if (!['homeworkhelper', 'changelog'].includes(b.dataset.target)) b.classList.remove('active'); });
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
                        loadProxyContentAsIframe(iframePages[targetId].id, iframePages[targetId].path, targetId);
                        setTimeout(hideLoader, 300);
                    } else hideLoader();
                } else hideLoader();
            });
        });

        if (navBar?.querySelector('.nav-btn.active') || navBtns[0]) {
            animateIndicatorUpdate(1000);
            window.addEventListener('load', () => updateIndicator(navBar.querySelector('.nav-btn.active') || navBtns[0]));
        }
        window.addEventListener('resize', () => updateIndicator(navBar?.querySelector('.nav-btn.active')));

        function closeResourceModal() {
            if (modalOverlay) modalOverlay.classList.remove('active');
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
        modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) closeResourceModal(); });
        
        document.getElementById('resource-fullscreen-btn')?.addEventListener('click', () => {
            if (!document.fullscreenElement) modalIframe?.requestFullscreen().catch(()=>{});
            else document.exitFullscreen();
        });

        fetchAsset('Json/categories.json').then(cats => {
            const setupCatSelect = (id, options, type) => {
                const select = document.getElementById(id);
                if (!select) return;
                select.innerHTML = '';
                (options || []).forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = opt.textContent = c;
                    select.appendChild(opt);
                });
                
                applyCustomDropdown(select);

                select.addEventListener('change', (e) => {
                    showLoader();
                    grids[type].category = e.target.value;
                    grids[type].page = 1;
                    renderGrid(type, true);
                });
            };
            setupCatSelect('readingcorner-category-select', cats.Games, 'readingcorner');
            setupCatSelect('sciencequiz-category-select', cats.Apps, 'sciencequiz');
        }).catch(()=>{});

        fetchAsset('Json/change-log.json').then(log => {
            const contentEl = document.getElementById('changelog-content'), tsEl = document.getElementById('changelog-timestamp');
            if (log) {
                if (tsEl) tsEl.textContent = log.timestamp || "Unknown";
                if (contentEl) contentEl.innerHTML = log.changes?.length ? `<ul style="padding-left: 1.5rem; margin: 0;">${log.changes.map(c => `<li style="margin-bottom: 0.5rem;">${c}</li>`).join('')}</ul>` : "No recent changes found.";
            }
        }).catch(() => {
            const contentEl = document.getElementById('changelog-content'), tsEl = document.getElementById('changelog-timestamp');
            if (contentEl) contentEl.innerHTML = "Failed to load update log.";
            if (tsEl) tsEl.textContent = "Unknown";
        });

        const resolvedBases = {};
        const staticDataPromise = fetchAsset('Json/urls/static.json').catch(() => []);
        
        Promise.all([
            fetchAsset('Json/g.json').catch(() => []),
            fetchAsset('Json/a.json').catch(() => []),
            fetchAsset('Json/truffled.json').catch(() => null),
            fetchAsset('Json/urls/scram.json').catch(() => []).then(getWorkingConfig).then(w => resolvedBases.scram = w),
            staticDataPromise.then(getWorkingConfig).then(w => resolvedBases.static = w),
            fetchAsset('Json/urls/uv.json').catch(() => []).then(getWorkingConfig).then(w => resolvedBases.uv = w),
            fetchAsset('Json/urls/truffled.json').catch(() => []).then(getWorkingConfig).then(w => resolvedBases.truffled = w),
            staticDataPromise.then(data => 
                getWorkingConfig(data.map(item => ({ url: item.url, img: item.img, final: "" })))
            ).then(w => resolvedBases.frogiee = w)
            
        ]).then(([gData, aData, truffledData]) => {

            function applyBases(str) {
                if (!str || typeof str !== 'string') return str;
                const replacements = {
                    'scram': resolvedBases.scram ? resolvedBases.scram.url.replace(/\/+$/, '') + resolvedBases.scram.final : '',
                    'static': resolvedBases.static ? resolvedBases.static.url.replace(/\/+$/, '') + resolvedBases.static.final : '',
                    'uv': resolvedBases.uv ? resolvedBases.uv.url.replace(/\/+$/, '') + resolvedBases.uv.final : '',
                    'frogiee': resolvedBases.frogiee ? resolvedBases.frogiee.url.replace(/\/+$/, '') : '',
                    'truffled': resolvedBases.truffled ? resolvedBases.truffled.url.replace(/\/+$/, '') : 'https://boat.strongson.com'
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
                    loadProxyContentAsIframe(iframePages[activePage.id].id, iframePages[activePage.id].path, activePage.id);
                } else { Object.keys(grids).forEach(destroyPool); hideLoader(); }
            } else { Object.keys(grids).forEach(destroyPool); hideLoader(); }

        }).catch(() => hideLoader());
    }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initApp);
else initApp();
