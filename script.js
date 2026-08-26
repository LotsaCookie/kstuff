function initApp() {
    const scramTable = [
        { url: "https://raw.githack.com/lotsacookie/kstuff/main", img: "/assets/img/fav.png", final: "/scram.svg?url=" },
        { url: "https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@main", img: "/assets/img/fav.png", final: "/scram.svg?url=" },
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
        { url: "https://dataccrafted.org", img: "/images/extrememathtextlogo.png", final: "/uv.html?site=" },
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
    
    const frogieeTable = staticTable.map(item => ({
        url: item.url,
        img: item.img,
        final: ""
    }));

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
        const style = document.createElement('style');
        style.textContent = `
            section {
                position: relative;
            }
            section .global-loader {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                opacity: 1;
                transition: opacity 0.3s ease;
                pointer-events: none; /* Allows clicking right through the loader */
            }
            section .global-loader.hidden {
                opacity: 0;
            }
            section .loader-spinner {
                width: 60px;
                height: 60px;
                border: 5px solid currentColor;
                border-color: currentColor transparent currentColor transparent;
                border-radius: 50%;
                opacity: 0.85;
                animation: spinLoader 1s linear infinite;
            }
            @keyframes spinLoader {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        const targetSection = document.querySelector('section') || document.body;
        const globalLoader = document.createElement('div');
        globalLoader.className = 'global-loader hidden';
        globalLoader.innerHTML = '<div class="loader-spinner"></div>';
        targetSection.appendChild(globalLoader);

        function showLoader() {
            globalLoader.classList.remove('hidden');
        }

        function hideLoader() {
            globalLoader.classList.add('hidden');
        }

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

        let savedWindowScrollY = 0;
        let savedPageScrollTop = 0;

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

        let cachedCommitHash = null;

        async function getCommitHash() {
            if (cachedCommitHash) return cachedCommitHash;
            try {
                const res = await fetch("https://api.github.com/repos/lotsacookie/kstuff/commits/main");
                if (res.ok) {
                    const data = await res.json();
                    cachedCommitHash = data.sha; 
                    return cachedCommitHash;
                }
            } catch (e) {
                console.warn("GitHub API fetch failed, falling back to 'main'", e);
            }
            cachedCommitHash = "main";
            return cachedCommitHash;
        }

        async function getProxyList() {
            const hash = await getCommitHash();
            return [
                `https://cdn.jsdelivr.net/gh/lotsacookie/kstuff@${hash}/`,
                `https://raw.githubusercontent.com/lotsacookie/kstuff/${hash}/`,
                `https://raw.githack.com/lotsacookie/kstuff/${hash}/`,
                `https://cdn.statically.io/gh/lotsacookie/kstuff/${hash}/`,
                ""
            ];
        }

        async function fetchAsset(path) {
            const proxies = await getProxyList();
            const cacheBuster = "?_=" + Date.now();
            
            for (const proxy of proxies) {
                try {
                    const url = proxy + path + (proxy ? "" : cacheBuster);
                    const response = await fetch(url);
                    if (response.ok) return await response.json();
                } catch (err) {}
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
            showLoader(); 
            
            const proxies = await getProxyList();
            
            for (const proxy of proxies) {
                try {
                    const url = proxy + path + (proxy ? "" : "?_=" + Date.now());
                    const response = await fetch(url);
                    if (response.ok) {
                        const content = await response.text();
                        const activePage = document.querySelector('.page.active');
                        if (activePage && activePage.id === pageId) {
                            iframe.onload = () => { hideLoader(); };
                            iframe.srcdoc = content;
                        } else {
                            hideLoader();
                        }
                        return;
                    }
                } catch (err) {}
            }
            hideLoader(); 
        }

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
        const itemsPerPage = 32;

        const readingGrid = document.getElementById('readingcorner-grid');
        const scienceGrid = document.getElementById('sciencequiz-grid');
        const readingCardPool = [];
        const scienceCardPool = [];

        function buildReadingPool() {
            destroyReadingPool();
            if (!readingGrid) return;
            for (let i = 0; i < itemsPerPage; i++) {
                const card = document.createElement('div');
                card.className = 'round-btn';
                card.innerHTML = `<img src="" alt="" loading="lazy" style="display:none;"><div class="category-label"></div><div class="overlay"><h3></h3><p></p></div>`;
                readingCardPool.push({
                    element: card,
                    imgEl: card.querySelector('img'),
                    titleEl: card.querySelector('h3'),
                    descEl: card.querySelector('p'),
                    catEl: card.querySelector('.category-label') 
                });
                readingGrid.appendChild(card);
            }
        }

        function destroyReadingPool() {
            if (readingGrid) readingGrid.innerHTML = '';
            readingCardPool.length = 0;
            const readingPagination = document.getElementById('readingcorner-pagination');
            if (readingPagination) readingPagination.innerHTML = '';
        }

        function buildSciencePool() {
            destroySciencePool();
            if (!scienceGrid) return;
            for (let i = 0; i < itemsPerPage; i++) {
                const card = document.createElement('div');
                card.className = 'round-btn';
                card.innerHTML = `<img src="" alt="" loading="lazy" style="display:none;"><div class="category-label"></div><div class="overlay"><h3></h3><p></p></div>`;
                scienceCardPool.push({
                    element: card,
                    imgEl: card.querySelector('img'),
                    titleEl: card.querySelector('h3'),
                    descEl: card.querySelector('p'),
                    catEl: card.querySelector('.category-label')
                });
                scienceGrid.appendChild(card);
            }
        }

        function destroySciencePool() {
            if (scienceGrid) scienceGrid.innerHTML = '';
            scienceCardPool.length = 0;
            const sciencePagination = document.getElementById('sciencequiz-pagination');
            if (sciencePagination) sciencePagination.innerHTML = '';
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

                    const categoryText = item.category || 'All';
                    if (poolItem.catEl && poolItem.catEl.textContent !== categoryText) {
                        poolItem.catEl.textContent = categoryText;
                    }

                    poolItem.element.onclick = () => {
                        savedWindowScrollY = window.scrollY || document.documentElement.scrollTop;
                        const activePage = document.querySelector('.page.active');
                        if (activePage) {
                            savedPageScrollTop = activePage.scrollTop;
                        }

                        if (modalTitle) modalTitle.textContent = item.title;
                        if (modalOverlay) modalOverlay.classList.add('active');
                        if (modalIframe) modalIframe.src = item.url;
                        
                        setTimeout(() => {
                            destroyReadingPool();
                            destroySciencePool();
                        }, 50);
                    };
                } else {
                    poolItem.element.style.display = 'none';
                    if (poolItem.imgEl.dataset.src !== '') {
                        poolItem.imgEl.dataset.src = '';
                        poolItem.imgEl.removeAttribute('src');
                        poolItem.imgEl.style.display = 'none';
                    }
                    if (poolItem.catEl) {
                        poolItem.catEl.textContent = '';
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
                            setTimeout(done, 3000); 
                        }
                    }));
                }
            });

            return Promise.all(imagePromises).then(() => {
                if (gridEl) gridEl.style.opacity = '1';
            });
        }

        function renderReadingResources(withPreload = false) {
            window.requestAnimationFrame(() => {
                if (!readingGrid) return;
                showLoader(); 

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
                        waitForImagesAndFadeIn(readingCardPool, paginatedData, readingGrid).then(() => hideLoader());
                    }, 250); 
                } else {
                    populateCardPool(readingCardPool, paginatedData);
                    renderReadingPagination(totalPages);
                    waitForImagesAndFadeIn(readingCardPool, paginatedData, readingGrid).then(() => hideLoader());
                }
            });
        }

        function renderReadingPagination(totalPages) {
            const readingPagination = document.getElementById('readingcorner-pagination');
            if (!readingPagination) return;
            readingPagination.innerHTML = '';
            
            if (totalPages > 1) {
                const prevBtn = document.createElement('button');
                prevBtn.className = 'page-btn';
                prevBtn.innerHTML = '<i class="ph ph-caret-left"></i>';
                
                if (currentReadingPage > 1) {
                    prevBtn.addEventListener('click', () => {
                        currentReadingPage--;
                        renderReadingResources(true);
                    });
                } else {
                    prevBtn.style.opacity = '0.4';
                    prevBtn.style.cursor = 'not-allowed';
                }
                readingPagination.appendChild(prevBtn);

                const pageInfo = document.createElement('span');
                pageInfo.style.fontWeight = '700';
                pageInfo.style.fontSize = '1.1rem';
                pageInfo.style.minWidth = '80px';
                pageInfo.style.textAlign = 'center';
                pageInfo.style.userSelect = 'none';
                pageInfo.textContent = `${currentReadingPage} / ${totalPages}`;
                readingPagination.appendChild(pageInfo);

                const nextBtn = document.createElement('button');
                nextBtn.className = 'page-btn';
                nextBtn.innerHTML = '<i class="ph ph-caret-right"></i>';
                
                if (currentReadingPage < totalPages) {
                    nextBtn.addEventListener('click', () => {
                        currentReadingPage++;
                        renderReadingResources(true);
                    });
                } else {
                    nextBtn.style.opacity = '0.4';
                    nextBtn.style.cursor = 'not-allowed';
                }
                readingPagination.appendChild(nextBtn);
            }
        }

        function renderScienceModules(withPreload = false) {
            window.requestAnimationFrame(() => {
                if (!scienceGrid) return;
                showLoader(); 

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
                        waitForImagesAndFadeIn(scienceCardPool, paginatedData, scienceGrid).then(() => hideLoader());
                    }, 250); 
                } else {
                    populateCardPool(scienceCardPool, paginatedData);
                    renderSciencePagination(totalPages);
                    waitForImagesAndFadeIn(scienceCardPool, paginatedData, scienceGrid).then(() => hideLoader());
                }
            });
        }

        function renderSciencePagination(totalPages) {
            const sciencePagination = document.getElementById('sciencequiz-pagination');
            if (!sciencePagination) return;
            sciencePagination.innerHTML = '';
            
            if (totalPages > 1) {
                const prevBtn = document.createElement('button');
                prevBtn.className = 'page-btn';
                prevBtn.innerHTML = '<i class="ph ph-caret-left"></i>';
                
                if (currentSciencePage > 1) {
                    prevBtn.addEventListener('click', () => {
                        currentSciencePage--;
                        renderScienceModules(true);
                    });
                } else {
                    prevBtn.style.opacity = '0.4';
                    prevBtn.style.cursor = 'not-allowed';
                }
                sciencePagination.appendChild(prevBtn);

                const pageInfo = document.createElement('span');
                pageInfo.style.fontWeight = '700';
                pageInfo.style.fontSize = '1.1rem';
                pageInfo.style.minWidth = '80px';
                pageInfo.style.textAlign = 'center';
                pageInfo.style.userSelect = 'none';
                pageInfo.textContent = `${currentSciencePage} / ${totalPages}`;
                sciencePagination.appendChild(pageInfo);

                const nextBtn = document.createElement('button');
                nextBtn.className = 'page-btn';
                nextBtn.innerHTML = '<i class="ph ph-caret-right"></i>';
                
                if (currentSciencePage < totalPages) {
                    nextBtn.addEventListener('click', () => {
                        currentSciencePage++;
                        renderScienceModules(true);
                    });
                } else {
                    nextBtn.style.opacity = '0.4';
                    nextBtn.style.cursor = 'not-allowed';
                }
                sciencePagination.appendChild(nextBtn);
            }
        }

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');

                if (targetId === 'homeworkhelper') {
                    if (settingsModal) settingsModal.classList.add('active');
                    return;
                }
                
                showLoader(); 

                const currentActiveBtn = document.querySelector('.nav-btn.active');
                if (currentActiveBtn) {
                    const currentId = currentActiveBtn.getAttribute('data-target');
                    if (currentId !== targetId && iframePages[currentId]) {
                        const iframeToClear = document.getElementById(iframePages[currentId].id);
                        if (iframeToClear) {
                            iframeToClear.srcdoc = ''; 
                        }
                    }
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

                    if (targetId !== 'readingcorner') destroyReadingPool();
                    if (targetId !== 'sciencequiz') destroySciencePool();

                    if (targetId === 'readingcorner') {
                        buildReadingPool();
                        setTimeout(() => renderReadingResources(false), 15);
                    } else if (targetId === 'sciencequiz') {
                        buildSciencePool();
                        setTimeout(() => renderScienceModules(false), 15);
                    } else if (iframePages[targetId]) {
                        loadProxyContentAsIframe(iframePages[targetId].id, iframePages[targetId].path, targetId);
                    } else {
                        hideLoader();
                    }
                } else {
                    hideLoader();
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

        function closeResourceModal() {
            if (modalOverlay) modalOverlay.classList.remove('active');
            if (modalIframe) modalIframe.src = 'about:blank';
            
            const activePage = document.querySelector('.page.active');
            if (activePage) {
                if (activePage.id === 'readingcorner') {
                    buildReadingPool();
                    renderReadingResources(false);
                } else if (activePage.id === 'sciencequiz') {
                    buildSciencePool();
                    renderScienceModules(false);
                }
            }

            let scrollAttempts = 0;
            const scrollInterval = setInterval(() => {
                window.scrollTo(0, savedWindowScrollY);
                if (activePage) {
                    activePage.scrollTop = savedPageScrollTop;
                }
                scrollAttempts++;
                if (scrollAttempts >= 20) {
                    clearInterval(scrollInterval);
                }
            }, 50);
        }

        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeResourceModal);
        
        if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeResourceModal();
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

        showLoader(); 

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
                    newStr = newStr.split('${frogiee}').join(w ? w.url.replace(/\/+$/, '') : '');
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

            readingItemsData = finalResources.sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: 'base' }));
            scienceItemsData = finalScience.sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: 'base' }));

            const activePage = document.querySelector('.page.active');
            if (activePage) {
                if (activePage.id === 'sciencequiz') {
                    buildSciencePool();
                    renderScienceModules(false);
                } else if (activePage.id === 'readingcorner') {
                    buildReadingPool();
                    renderReadingResources(false);
                } else if (iframePages[activePage.id]) {
                    loadProxyContentAsIframe(iframePages[activePage.id].id, iframePages[activePage.id].path, activePage.id);
                } else {
                    destroyReadingPool();
                    destroySciencePool();
                    hideLoader();
                }
            } else {
                destroyReadingPool();
                destroySciencePool();
                hideLoader();
            }
        }).catch(err => {
            console.error(err);
            hideLoader();
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
