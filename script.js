(function initApp() {
    const scramTable = [
        { url: "https://raw.githack.com/lotsacookie/cg-svg/main", img: "/assets/img/fav.png", final: "/scramjet.svg?target_url=" },
        { url: "https://cdn.jsdelivr.net/gh/lotsacookie/cg-svg@main", img: "/assets/img/fav.png", final: "/scramjet.svg?target_url=" },
    ]; 
    const staticTable = [
        { url: "https://frogiesarcade.win", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://larp.foundation", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://nickolas.industries", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://shrimpy.website", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://gloverschool.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://miku.hair", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://yourfrogiesarcadelink.com", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://tetosarcade.win", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://bogbot.shop", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://nsd160.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://ixl.rocks", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://denisonisd.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://anthonyisgooningat3am.space", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://caisseforsmithfieldschools.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://frogiesarcade.com", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://austinisd.net", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://brooklyn.foundation", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://frog.bar", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://edgy.blog", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://cliffschools.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://columbiapublicschools.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://northfayetteschools.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://smdpschool.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://burrvillees.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://pleasantonmiddleschool.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://hcstemm.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://riversideacademy.site", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://highschoolmathteachers.com", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://oldmillschool.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://frogiesarcade.net", img: "/stuff/logo.png", final: "/embed.html#" }
    ];
    const uvTable = [
        { url: "https://tutoring4free.org", img: "/images/extrememathtextlogo.png", final: "/uv.html?site=" },
        { url: "https://extrememath.org", img: "/images/extrememathtextlogo.png", final: "/uv.html?site=" },
        { url: "https://extrememath.net", img: "/images/extrememathtextlogo.png", final: "/uv.html?site=" },
        { url: "https://extrememath.info", img: "/images/extrememathtextlogo.png", final: "/uv.html?site=" },
        { url: "https://extrememath.icu", img: "/images/extrememathtextlogo.png", final: "/uv.html?site=" },
        { url: "https://extrememath.education", img: "/images/extrememathtextlogo.png", final: "/uv.html?site=" },
        { url: "https://datacrafted.org", img: "/images/extrememathtextlogo.png", final: "/uv.html?site=" },
        { url: "https://extrememath.cyou", img: "/images/extrememathtextlogo.png", final: "/uv.html?site=" }
    ];
    const truffledTable = [
        { url: "https://boat.strongson.com/", img: "/favicon.ico", final: "" },
        { url: "https://lib.stcath.net/", img: "/favicon.ico", final: "" },
        { url: "https://thislinkworks.b-cdn.net/", img: "/favicon.ico", final: "" },
        { url: "https://truffledlinklol.b-cdn.net/", img: "/favicon.ico", final: "" },
        { url: "https://snoopy.patelmortgage.com/", img: "/favicon.ico", final: "" },
        { url: "https://truffled.lol/", img: "/favicon.ico", final: "" },
        { url: "https://boon.busse.li/", img: "/favicon.ico", final: "" },
        { url: "https://buff.loscantarostemuco.cl/", img: "/favicon.ico", final: "" },
        { url: "https://hibrooklyn.site/", img: "/favicon.ico", final: "" },
        { url: "https://for-ravipati03121e3.shared-with.de/", img: "/favicon.ico", final: "" },
        { url: "https://tutoring-services.org", img: "/favicon.ico", final: "" },
        { url: "https://mathteachersforhire.org", img: "/favicon.ico", final: "" },
        { url: "https://classlink.com.de", img: "/favicon.ico", final: "" },
        { url: "https://geometrycalculatorhelprvhs.college", img: "/favicon.ico", final: "" }
    ];
    const frogieeTable = [...staticTable];

    async function getWorkingConfig(table) {
        if (!table || table.length === 0) return null;
        const chunkSize = 5;
        for (let i = 0; i < table.length; i += chunkSize) {
            const chunk = table.slice(i, i + chunkSize);
            const winner = await new Promise((resolve) => {
                let resolved = false;
                let failedCount = 0;
                let activeImages = [];

                chunk.forEach(entry => {
                    const img = new Image();
                    activeImages.push(img);
                    const fullTestUrl = entry.url.replace(/\/+$/, '') + '/' + entry.img.replace(/^\/+/, '');
                    
                    img.onload = () => {
                        if (!resolved) {
                            if (img.naturalWidth > 0) {
                                resolved = true;
                                cleanup();
                                resolve(entry);
                            } else {
                                failedCount++;
                                if (!resolved && failedCount === chunk.length) {
                                    resolved = true;
                                    cleanup();
                                    resolve(null);
                                }
                            }
                        }
                    };
                    
                    img.onerror = () => {
                        failedCount++;
                        if (!resolved && failedCount === chunk.length) {
                            resolved = true;
                            cleanup();
                            resolve(null); 
                        }
                    };
                    
                    function cleanup() {
                        activeImages.forEach(im => {
                            im.onload = null;
                            im.onerror = null;
                            im.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
                        });
                        activeImages.length = 0;
                    }
                    
                    img.src = fullTestUrl + (fullTestUrl.includes('?') ? '&' : '?') + '_=' + Date.now();
                });

                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        activeImages.forEach(im => { 
                            im.onload = null;
                            im.onerror = null;
                            im.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; 
                        });
                        activeImages.length = 0;
                        resolve(null);
                    }
                }, 8000);
            });

            if (winner) return winner; 
        }
        return table[0]; 
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runLogic);
    } else {
        runLogic();
    }

    function runLogic() {
        const navBar = document.getElementById('teachertouchbar');
        const navBtns = document.querySelectorAll('.nav-btn');
        const pages = document.querySelectorAll('.page');
        const themeSelect = document.getElementById('layout-theme-select');
        const navSelect = document.getElementById('layout-nav-select');
        const textSelect = document.getElementById('layout-text-select');
        const sizeSelect = document.getElementById('layout-size-select');
        const body = document.body;

        const modalOverlay = document.getElementById('resource-modal');
        const modalIframe = document.getElementById('resource-modal-iframe');
        const modalTitle = document.getElementById('resource-modal-title');
        const modalCloseBtn = document.getElementById('resource-close-btn');
        const modalFullscreenBtn = document.getElementById('resource-fullscreen-btn');

        const settingsModal = document.getElementById('homeworkhelper-modal');
        const settingsCloseBtn = document.getElementById('homeworkhelper-close-btn');

        let indicator = navBar ? navBar.querySelector('.nav-indicator') : null;
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

            indicator.style.left = ''; indicator.style.right = ''; indicator.style.top = ''; indicator.style.bottom = '';

            if (isVertical) {
                const topOffset = btnRect.top - navRect.top;
                indicator.style.width = '3px';
                indicator.style.height = `${btnRect.height}px`;
                indicator.style.transform = `translateY(${topOffset}px)`;
            } else {
                const leftOffset = btnRect.left - navRect.left;
                indicator.style.width = `${btnRect.width}px`;
                indicator.style.height = '3px';
                indicator.style.transform = `translateX(${leftOffset}px)`;
            }
        }

        const p = [
            "https://raw.githubusercontent.com/lotsacookie/kstuff/main/",
            "https://raw.githack.com/lotsacookie/kstuff/main/",
            "https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@main/",
            "https://cdn.statically.io/gh/lotsacookie/kstuff/main/",
            ""
        ];

        async function fetchAsset(path) {
            const cacheBuster = "?_=" + Date.now();
            for (const proxy of p) {
                try {
                    const response = await fetch(proxy + path + (proxy ? cacheBuster : ""));
                    if (response.ok) return await response.json();
                } catch (err) {}
            }
            throw new Error("All proxies failed for " + path);
        }

        async function loadProxyContentAsIframe(id, path) {
            const iframe = document.getElementById(id);
            if (!iframe) return;
            const cacheBuster = "?_=" + Date.now();
            for (const proxy of p) {
                try {
                    const url = proxy + path + (proxy ? cacheBuster : "");
                    const response = await fetch(url);
                    if (response.ok) {
                        iframe.srcdoc = await response.text();
                        return;
                    }
                } catch (err) {}
            }
        }

        loadProxyContentAsIframe('mathworksheets-iframe', 'Pages/browser.html');
        loadProxyContentAsIframe('gradebook-iframe', 'Pages/music.html');
        loadProxyContentAsIframe('lessonplanner-iframe', 'Pages/ai.html');

        const savedTheme = localStorage.getItem('kstuff_theme') || 'theme-sakura';
        const savedNavPos = localStorage.getItem('kstuff_nav_pos') || 'nav-left';
        const savedTextVis = localStorage.getItem('kstuff_text_vis') || 'text-hide';
        const savedNavSize = localStorage.getItem('kstuff_nav_size') || 'size-small';

        body.classList.add(savedTheme, savedNavPos, savedNavSize);
        if (savedTextVis === 'text-hide') body.classList.add('text-hide');
        if (themeSelect) themeSelect.value = savedTheme;
        if (navSelect) navSelect.value = savedNavPos;
        if (textSelect) textSelect.value = savedTextVis;
        if (sizeSelect) sizeSelect.value = savedNavSize;

        let readingItemsData = [];
        let scienceItemsData = [];
        let currentReadingCategory = "All";
        let currentScienceCategory = "All";
        let currentReadingSearch = "";
        let currentScienceSearch = "";
        let currentReadingPage = 1;
        let currentSciencePage = 1;
        const itemsPerPage = 24;

        const readingGrid = document.getElementById('readingcorner-grid');
        const scienceGrid = document.getElementById('sciencequiz-grid');
        const readingCardPool = [];
        const scienceCardPool = [];

        if (readingGrid) {
            for (let i = 0; i < itemsPerPage; i++) {
                const card = document.createElement('div');
                card.className = 'round-btn';
                card.innerHTML = `<img src="" alt="" loading="lazy" style="display:none;"><div class="overlay"><h3></h3><p></p></div>`;
                readingCardPool.push({
                    element: card,
                    imgEl: card.querySelector('img'),
                    titleEl: card.querySelector('h3'),
                    descEl: card.querySelector('p')
                });
                readingGrid.appendChild(card);
            }
        }

        if (scienceGrid) {
            for (let i = 0; i < itemsPerPage; i++) {
                const card = document.createElement('div');
                card.className = 'round-btn';
                card.innerHTML = `<img src="" alt="" loading="lazy" style="display:none;"><div class="overlay"><h3></h3><p></p></div>`;
                scienceCardPool.push({
                    element: card,
                    imgEl: card.querySelector('img'),
                    titleEl: card.querySelector('h3'),
                    descEl: card.querySelector('p')
                });
                scienceGrid.appendChild(card);
            }
        }

        const readingSearchInput = document.getElementById('readingcorner-search');
        const scienceSearchInput = document.getElementById('sciencequiz-search');

        let readingSearchTimeout;
        if (readingSearchInput) readingSearchInput.addEventListener('input', (e) => {
            clearTimeout(readingSearchTimeout);
            readingSearchTimeout = setTimeout(() => {
                currentReadingSearch = e.target.value.toLowerCase().trim();
                currentReadingPage = 1;
                renderReadingResources(true);
            }, 150);
        });

        let scienceSearchTimeout;
        if (scienceSearchInput) scienceSearchInput.addEventListener('input', (e) => {
            clearTimeout(scienceSearchTimeout);
            scienceSearchTimeout = setTimeout(() => {
                currentScienceSearch = e.target.value.toLowerCase().trim();
                currentSciencePage = 1;
                renderScienceModules(true);
            }, 150);
        });

        function populateCardPool(cardPool, paginatedData) {
            cardPool.forEach((poolItem, index) => {
                const item = paginatedData[index];
                if (item) {
                    poolItem.element.style.display = 'block';
                    
                    const targetImage = item.image || '';
                    if (poolItem.imgEl.dataset.src !== targetImage) {
                        poolItem.imgEl.dataset.src = targetImage;
                        if (targetImage) {
                            poolItem.imgEl.src = targetImage;
                            poolItem.imgEl.style.display = 'block';
                        } else {
                            poolItem.imgEl.removeAttribute('src');
                            poolItem.imgEl.style.display = 'none';
                        }
                    }

                    if (poolItem.titleEl.textContent !== item.title) {
                        poolItem.titleEl.textContent = item.title;
                    }
                    const descText = item.description || '';
                    if (poolItem.descEl.textContent !== descText) {
                        poolItem.descEl.textContent = descText;
                    }

                    poolItem.element.onclick = () => {
                        if (modalTitle) modalTitle.textContent = item.title;
                        if (modalOverlay) modalOverlay.classList.add('active');
                        if (modalIframe) modalIframe.src = item.url;
                    };
                } else {
                    poolItem.element.style.display = 'none';
                    if (poolItem.imgEl.dataset.src !== '') {
                        poolItem.imgEl.dataset.src = '';
                        poolItem.imgEl.removeAttribute('src');
                        poolItem.imgEl.style.display = 'none';
                    }
                    poolItem.element.onclick = null;
                }
            });
        }

        function waitForImagesAndFadeIn(cardPool, paginatedData, gridEl) {
            const imagePromises = [];
            cardPool.forEach((poolItem, index) => {
                const item = paginatedData[index];
                if (item && item.image && poolItem.imgEl) {
                    imagePromises.push(new Promise((resolve) => {
                        const img = poolItem.imgEl;
                        if (img.complete && img.naturalWidth > 0) {
                            resolve();
                        } else {
                            const done = () => {
                                img.onload = null;
                                img.onerror = null;
                                resolve();
                            };
                            img.onload = done;
                            img.onerror = done;
                            setTimeout(done, 3000); // Safety fallback timeout
                        }
                    }));
                }
            });

            Promise.all(imagePromises).then(() => {
                if (gridEl) gridEl.style.opacity = '1';
            });
        }

        function renderReadingResources(withPreload = false) {
            window.requestAnimationFrame(() => {
                const readingPagination = document.getElementById('readingcorner-pagination');
                if (!readingGrid) return;

                const filteredData = readingItemsData.filter(item => {
                    const matchesCategory = currentReadingCategory === "All" || item.category === currentReadingCategory;
                    const matchesSearch = item.title.toLowerCase().includes(currentReadingSearch);
                    return matchesCategory && matchesSearch;
                });

                const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
                if (currentReadingPage > totalPages) currentReadingPage = 1;

                const start = (currentReadingPage - 1) * itemsPerPage;
                const paginatedData = filteredData.slice(start, start + itemsPerPage);

                if (withPreload) {
                    readingGrid.style.opacity = '0';
                    setTimeout(() => {
                        populateCardPool(readingCardPool, paginatedData);
                        renderReadingPagination(totalPages);
                        waitForImagesAndFadeIn(readingCardPool, paginatedData, readingGrid);
                    }, 250); // Slower fade-out delay
                } else {
                    populateCardPool(readingCardPool, paginatedData);
                    renderReadingPagination(totalPages);
                    readingGrid.style.opacity = '1';
                }
            });
        }

        function renderReadingPagination(totalPages) {
            const readingPagination = document.getElementById('readingcorner-pagination');
            if (!readingPagination) return;
            readingPagination.innerHTML = '';
            if (totalPages > 1) {
                for (let i = 1; i <= totalPages; i++) {
                    const pageBtn = document.createElement('button');
                    pageBtn.className = `page-btn ${i === currentReadingPage ? 'active' : ''}`;
                    pageBtn.textContent = i;
                    pageBtn.addEventListener('click', () => {
                        if (currentReadingPage === i) return;
                        currentReadingPage = i;
                        renderReadingResources(true);
                    });
                    readingPagination.appendChild(pageBtn);
                }
            }
        }

        function renderScienceModules(withPreload = false) {
            window.requestAnimationFrame(() => {
                const sciencePagination = document.getElementById('sciencequiz-pagination');
                if (!scienceGrid) return;

                const filteredData = scienceItemsData.filter(item => {
                    const matchesCategory = currentScienceCategory === "All" || item.category === currentScienceCategory;
                    const matchesSearch = item.title.toLowerCase().includes(currentScienceSearch);
                    return matchesCategory && matchesSearch;
                });

                const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
                if (currentSciencePage > totalPages) currentSciencePage = 1;
                const start = (currentSciencePage - 1) * itemsPerPage;
                const paginatedData = filteredData.slice(start, start + itemsPerPage);

                if (withPreload) {
                    scienceGrid.style.opacity = '0';
                    setTimeout(() => {
                        populateCardPool(scienceCardPool, paginatedData);
                        renderSciencePagination(totalPages);
                        waitForImagesAndFadeIn(scienceCardPool, paginatedData, scienceGrid);
                    }, 250); // Slower fade-out delay
                } else {
                    populateCardPool(scienceCardPool, paginatedData);
                    renderSciencePagination(totalPages);
                    scienceGrid.style.opacity = '1';
                }
            });
        }

        function renderSciencePagination(totalPages) {
            const sciencePagination = document.getElementById('sciencequiz-pagination');
            if (!sciencePagination) return;
            sciencePagination.innerHTML = '';
            if (totalPages > 1) {
                for (let i = 1; i <= totalPages; i++) {
                    const pageBtn = document.createElement('button');
                    pageBtn.className = `page-btn ${i === currentSciencePage ? 'active' : ''}`;
                    pageBtn.textContent = i;
                    pageBtn.addEventListener('click', () => {
                        if (currentSciencePage === i) return;
                        currentSciencePage = i;
                        renderScienceModules(true);
                    });
                    sciencePagination.appendChild(pageBtn);
                }
            }
        }

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');

                if (targetId === 'homeworkhelper') {
                    if (settingsModal) settingsModal.classList.add('active');
                    return;
                }

                navBtns.forEach(b => {
                    if (b.getAttribute('data-target') !== 'homeworkhelper') {
                        b.classList.remove('active');
                    }
                });

                pages.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                updateIndicator(btn);

                const targetPage = document.getElementById(targetId);
                if (targetPage) {
                    targetPage.classList.add('active');
                    if (targetId === 'readingcorner') {
                        setTimeout(() => renderReadingResources(false), 15);
                    } else if (targetId === 'sciencequiz') {
                        setTimeout(() => renderScienceModules(false), 15);
                    }
                }
            });
        });

        const initialActive = navBar ? (navBar.querySelector('.nav-btn.active') || navBtns[0]) : null;
        if (initialActive) {
            setTimeout(() => updateIndicator(initialActive), 60);
        }

        window.addEventListener('resize', () => {
            const currentActive = navBar ? navBar.querySelector('.nav-btn.active') : null;
            updateIndicator(currentActive);
        });

        function animateIndicatorUpdate(duration = 500) {
            const start = performance.now();
            function step(timestamp) {
                const currentActive = navBar ? navBar.querySelector('.nav-btn.active') : null;
                if (currentActive) {
                    updateIndicator(currentActive);
                }
                if (timestamp - start < duration) {
                    window.requestAnimationFrame(step);
                }
            }
            window.requestAnimationFrame(step);
        }

        if (themeSelect) themeSelect.addEventListener('change', (e) => {
            body.className = body.className.replace(/\btheme-\S+/g, '').trim();
            body.classList.add(e.target.value);
            localStorage.setItem('kstuff_theme', e.target.value);
            animateIndicatorUpdate(); 
        });

        if (navSelect) navSelect.addEventListener('change', (e) => {
            body.className = body.className.replace(/\bnav-\S+/g, '').trim();
            body.classList.add(e.target.value);
            localStorage.setItem('kstuff_nav_pos', e.target.value);
            animateIndicatorUpdate(); 
        });

        if (textSelect) textSelect.addEventListener('change', (e) => {
            if (e.target.value === 'text-hide') body.classList.add('text-hide');
            else body.classList.remove('text-hide');
            localStorage.setItem('kstuff_text_vis', e.target.value);
            animateIndicatorUpdate();
        });

        if (sizeSelect) sizeSelect.addEventListener('change', (e) => {
            body.className = body.className.replace(/\bsize-\S+/g, '').trim();
            body.classList.add(e.target.value);
            localStorage.setItem('kstuff_nav_size', e.target.value);
            animateIndicatorUpdate();
        });

        if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            modalIframe.src = 'about:blank';
        });
        if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
                modalIframe.src = 'about:blank';
            }
        });
        if (modalFullscreenBtn) modalFullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) modalIframe.requestFullscreen().catch(err => {});
            else document.exitFullscreen();
        });

        if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', () => {
            if (settingsModal) settingsModal.classList.remove('active');
        });
        if (settingsModal) settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.remove('active');
        });

        fetchAsset('Json/categories.json').then(categories => {
            const readingSelect = document.getElementById('readingcorner-category-select');
            const scienceSelect = document.getElementById('sciencequiz-category-select');
            if (readingSelect) {
                readingSelect.innerHTML = '';
                categories.Games.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    readingSelect.appendChild(option);
                });
                readingSelect.addEventListener('change', (e) => {
                    currentReadingCategory = e.target.value;
                    currentReadingPage = 1;
                    renderReadingResources(true);
                });
            }
            if (scienceSelect) {
                scienceSelect.innerHTML = '';
                categories.Apps.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    scienceSelect.appendChild(option);
                });
                scienceSelect.addEventListener('change', (e) => {
                    currentScienceCategory = e.target.value;
                    currentSciencePage = 1;
                    renderScienceModules(true);
                });
            }
        }).catch(err => {});

        const resolvedBases = {};
        const checkPromises = [
            getWorkingConfig(scramTable).then(w => resolvedBases.scram = w),
            getWorkingConfig(staticTable).then(w => resolvedBases.static = w),
            getWorkingConfig(uvTable).then(w => resolvedBases.uv = w),
            getWorkingConfig(truffledTable).then(w => resolvedBases.truffled = w),
            getWorkingConfig(frogieeTable).then(w => resolvedBases.frogiee = w)
        ];

        Promise.all([
            fetchAsset('Json/g.json').catch(() => []),
            fetchAsset('Json/a.json').catch(() => []),
            fetchAsset('Json/truffled.json').catch(() => null),
            ...checkPromises 
        ]).then(([gData, aData, truffledData]) => {

            function applyBases(str) {
                if (!str || typeof str !== 'string') return str;
                let newStr = str;
                
                if (newStr.includes('${scram}')) {
                    const w = resolvedBases.scram;
                    newStr = newStr.split('${scram}').join(w ? w.url.replace(/\/+$/, '') + w.final : '');
                }
                if (newStr.includes('${static}')) {
                    const w = resolvedBases.static;
                    newStr = newStr.split('${static}').join(w ? w.url.replace(/\/+$/, '') + w.final : '');
                }
                if (newStr.includes('${uv}')) {
                    const w = resolvedBases.uv;
                    newStr = newStr.split('${uv}').join(w ? w.url.replace(/\/+$/, '') + w.final : '');
                }
                if (newStr.includes('${frogiee}')) {
                    const w = resolvedBases.frogiee;
                    newStr = newStr.split('${frogiee}').join(w ? w.url.replace(/\/+$/, '') + w.final : '');
                }
                if (newStr.includes('${truffled}')) {
                    const w = resolvedBases.truffled;
                    newStr = newStr.split('${truffled}').join(w ? w.url.replace(/\/+$/, '') : 'https://boat.strongson.com');
                }
                
                return newStr.replace(/([^:]\/)\/+/g, '$1');
            }

            const truffledMap = new Map();
            if (truffledData && truffledData.games) {
                truffledData.games.forEach(g => {
                    truffledMap.set(g.name.toLowerCase().trim(), g);
                });
            }

            let finalResources = [];
            for (const item of gData) {
                let processedItem = { ...item };
                if (processedItem.url && processedItem.url.includes('${truffled}')) {
                    const searchTitle = (processedItem.title || "").toLowerCase().trim();
                    const matchedItem = truffledMap.get(searchTitle);
                    if (matchedItem) {
                        processedItem.title = matchedItem.name;
                        processedItem.url = '${truffled}/' + matchedItem.url.replace(/^\/+/, '');
                        processedItem.image = '${truffled}/' + matchedItem.thumbnail.replace(/^\/+/, '');
                        processedItem.description = processedItem.description || '';
                        processedItem.category = processedItem.category || 'Truffled';
                    }
                }
                processedItem.url = applyBases(processedItem.url);
                processedItem.image = applyBases(processedItem.image);
                finalResources.push(processedItem);
            }
            
            let finalScience = [];
            for (const item of aData) {
                let processedItem = { ...item };
                processedItem.url = applyBases(processedItem.url);
                processedItem.image = applyBases(processedItem.image);
                finalScience.push(processedItem);
            }

            readingItemsData = finalResources;
            scienceItemsData = finalScience;

            const activePage = document.querySelector('.page.active');
            if (activePage && activePage.id === 'sciencequiz') {
                renderScienceModules(false);
            } else {
                renderReadingResources(false);
            }
        });
    }
})();
