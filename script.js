(function initApp() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runLogic);
    } else {
        runLogic();
    }

    function runLogic() {
        const navBtns = document.querySelectorAll('.nav-btn');
        const pages = document.querySelectorAll('.page');
        const themeSelect = document.getElementById('theme-select');
        const navSelect = document.getElementById('nav-select');
        const textSelect = document.getElementById('text-select');
        const navLogo = document.getElementById('nav-logo');
        const body = document.body;

        const modalOverlay = document.getElementById('content-modal');
        const modalIframe = document.getElementById('modal-iframe');
        const modalTitle = document.getElementById('modal-title');
        const modalCloseBtn = document.getElementById('modal-close-btn');
        const modalFullscreenBtn = document.getElementById('modal-fullscreen-btn');

        const scramTable = [
            { url: "https://kstuff.neocities.org", img: "/kstuff.png", final: "/embed.html#" },
            { url: "https://example-scram-backup.com", img: "/favicon.ico", final: "/embed.html#" }
        ];

        const staticTable = [
            { url: "https://kstuff.neocities.org", img: "/kstuff.png", final: "/embed.html#" },
            { url: "https://example-static-backup.com", img: "/favicon.ico", final: "/embed.html#" }
        ];

        const uvTable = [
            { url: "https://kstuff.neocities.org", img: "/kstuff.png", final: "/embed.html#" },
            { url: "https://example-uv-backup.com", img: "/favicon.ico", final: "/embed.html#" }
        ];

        function testImageUrl(testUrl) {
            return new Promise((resolve) => {
                let isDone = false;
                const img = new Image();

                img.onload = () => {
                    if (!isDone) {
                        isDone = true;
                        resolve(true);
                    }
                };

                img.onerror = () => {
                    if (!isDone) {
                        isDone = true;
                        resolve(false);
                    }
                };

                img.src = testUrl;

                setTimeout(() => {
                    if (!isDone) {
                        isDone = true;
                        resolve(false);
                    }
                }, 3000);
            });
        }

        async function getWorkingConfig(table) {
            for (const entry of table) {
                const testUrl = entry.url + entry.img;
                const success = await testImageUrl(testUrl);
                if (success) {
                    return entry;
                }
            }
            return table[0];
        }

        async function resolveAndGetUrl(originalUrl) {
            let resolvedUrl = originalUrl;

            if (resolvedUrl.includes('${scram}')) {
                const working = await getWorkingConfig(scramTable);
                resolvedUrl = resolvedUrl.replace('${scram}', working.url + working.final);
            }
            if (resolvedUrl.includes('${static}')) {
                const working = await getWorkingConfig(staticTable);
                resolvedUrl = resolvedUrl.replace('${static}', working.url + working.final);
            }
            if (resolvedUrl.includes('${uv}')) {
                const working = await getWorkingConfig(uvTable);
                resolvedUrl = resolvedUrl.replace('${uv}', working.url + working.final);
            }

            return resolvedUrl;
        }

        const savedTheme = localStorage.getItem('kstuff_theme');
        const savedNavPos = localStorage.getItem('kstuff_nav_pos');
        const savedTextVis = localStorage.getItem('kstuff_text_vis');

        if (savedTheme && themeSelect) {
            body.className = body.className.replace(/\btheme-\S+/g, '').trim();
            body.classList.add(savedTheme);
            themeSelect.value = savedTheme;
        }

        if (savedNavPos && navSelect) {
            body.className = body.className.replace(/\bnav-\S+/g, '').trim();
            body.classList.add(savedNavPos);
            navSelect.value = savedNavPos;
        }

        if (savedTextVis && textSelect) {
            if (savedTextVis === 'text-hide') {
                body.classList.add('text-hide');
                textSelect.value = 'text-hide';
            } else {
                body.classList.remove('text-hide');
                textSelect.value = 'text-show';
            }
        }

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                navBtns.forEach(b => b.classList.remove('active'));
                pages.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');

                const targetId = btn.getAttribute('data-target');
                const targetPage = document.getElementById(targetId);
                if (targetPage) {
                    targetPage.classList.add('active');
                }

                if (targetId === 'home') {
                    if (navLogo) navLogo.classList.remove('show');
                    body.classList.remove('show-logo');
                } else {
                    if (navLogo) navLogo.classList.add('show');
                    body.classList.add('show-logo');
                }
            });
        });

        if (themeSelect) {
            themeSelect.addEventListener('change', (event) => {
                const newTheme = event.target.value;
                body.className = body.className.replace(/\btheme-\S+/g, '').trim();
                body.classList.add(newTheme);
                localStorage.setItem('kstuff_theme', newTheme);
            });
        }

        if (navSelect) {
            navSelect.addEventListener('change', (event) => {
                const newPosition = event.target.value;
                body.className = body.className.replace(/\bnav-\S+/g, '').trim();
                body.classList.add(newPosition);
                localStorage.setItem('kstuff_nav_pos', newPosition);
            });
        }

        if (textSelect) {
            textSelect.addEventListener('change', (event) => {
                const textValue = event.target.value;
                if (textValue === 'text-hide') {
                    body.classList.add('text-hide');
                } else {
                    body.classList.remove('text-hide');
                }
                localStorage.setItem('kstuff_text_vis', textValue);
            });
        }

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => {
                modalOverlay.classList.remove('active');
                modalIframe.src = '';
            });
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    modalOverlay.classList.remove('active');
                    modalIframe.src = '';
                }
            });
        }

        if (modalFullscreenBtn) {
            modalFullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    modalIframe.requestFullscreen().catch(err => {
                        console.error(err);
                    });
                } else {
                    document.exitFullscreen();
                }
            });
        }

        let gamesData = [];
        let appsData = [];
        let currentGameCategory = "All";
        let currentAppCategory = "All";
        let currentGamePage = 1;
        let currentAppPage = 1;
        const itemsPerPage = 50;

        fetch('JSON/categories.json')
            .then(response => response.json())
            .then(categories => {
                const gamesSelect = document.getElementById('games-category-select');
                const appsSelect = document.getElementById('apps-category-select');

                if (gamesSelect) {
                    gamesSelect.innerHTML = '';
                    categories.Games.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat;
                        option.textContent = cat;
                        gamesSelect.appendChild(option);
                    });
                    gamesSelect.addEventListener('change', (e) => {
                        currentGameCategory = e.target.value;
                        currentGamePage = 1;
                        renderGames();
                    });
                }

                if (appsSelect) {
                    appsSelect.innerHTML = '';
                    categories.Apps.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat;
                        option.textContent = cat;
                        appsSelect.appendChild(option);
                    });
                    appsSelect.addEventListener('change', (e) => {
                        currentAppCategory = e.target.value;
                        currentAppPage = 1;
                        renderApps();
                    });
                }
            })
            .catch(err => {
                console.error(err);
                const gamesSelect = document.getElementById('games-category-select');
                const appsSelect = document.getElementById('apps-category-select');
                if (gamesSelect) gamesSelect.innerHTML = '<option value="All">Error</option>';
                if (appsSelect) appsSelect.innerHTML = '<option value="All">Error</option>';
            });

        function renderGames() {
            const gamesGrid = document.getElementById('games-grid');
            const gamesPagination = document.getElementById('games-pagination');
            if (!gamesGrid) return;
            
            const filteredData = currentGameCategory === "All" 
                ? gamesData 
                : gamesData.filter(item => item.category === currentGameCategory);

            const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
            if (currentGamePage > totalPages) currentGamePage = 1;

            const start = (currentGamePage - 1) * itemsPerPage;
            const paginatedData = filteredData.slice(start, start + itemsPerPage);

            gamesGrid.innerHTML = '';
            paginatedData.forEach(item => {
                const card = document.createElement('div');
                card.className = 'round-btn';
                card.style.backgroundImage = `url('${item.image}')`;
                card.innerHTML = `
                    <div class="overlay">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                    </div>
                `;
                card.addEventListener('click', async () => {
                    if (modalTitle) modalTitle.textContent = `Loading ${item.title}...`;
                    if (modalOverlay) modalOverlay.classList.add('active');

                    const finalUrl = await resolveAndGetUrl(item.url);
                    if (modalTitle) modalTitle.textContent = item.title;
                    if (modalIframe) modalIframe.src = finalUrl;
                });
                gamesGrid.appendChild(card);
            });

            if (gamesPagination) {
                gamesPagination.innerHTML = '';
                if (totalPages > 1) {
                    for (let i = 1; i <= totalPages; i++) {
                        const pageBtn = document.createElement('button');
                        pageBtn.className = `page-btn ${i === currentGamePage ? 'active' : ''}`;
                        pageBtn.textContent = i;
                        pageBtn.addEventListener('click', () => {
                            currentGamePage = i;
                            renderGames();
                        });
                        gamesPagination.appendChild(pageBtn);
                    }
                }
            }
        }

        function renderApps() {
            const appsGrid = document.getElementById('apps-grid');
            const appsPagination = document.getElementById('apps-pagination');
            if (!appsGrid) return;
            
            const filteredData = currentAppCategory === "All" 
                ? appsData 
                : appsData.filter(item => item.category === currentAppCategory);

            const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
            if (currentAppPage > totalPages) currentAppPage = 1;

            const start = (currentAppPage - 1) * itemsPerPage;
            const paginatedData = filteredData.slice(start, start + itemsPerPage);

            appsGrid.innerHTML = '';
            paginatedData.forEach(item => {
                const card = document.createElement('div');
                card.className = 'round-btn';
                card.style.backgroundImage = `url('${item.image}')`;
                card.innerHTML = `
                    <div class="overlay">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                    </div>
                `;
                card.addEventListener('click', async () => {
                    if (modalTitle) modalTitle.textContent = `Loading ${item.title}...`;
                    if (modalOverlay) modalOverlay.classList.add('active');

                    const finalUrl = await resolveAndGetUrl(item.url);
                    if (modalTitle) modalTitle.textContent = item.title;
                    if (modalIframe) modalIframe.src = finalUrl;
                });
                appsGrid.appendChild(card);
            });

            if (appsPagination) {
                appsPagination.innerHTML = '';
                if (totalPages > 1) {
                    for (let i = 1; i <= totalPages; i++) {
                        const pageBtn = document.createElement('button');
                        pageBtn.className = `page-btn ${i === currentAppPage ? 'active' : ''}`;
                        pageBtn.textContent = i;
                        pageBtn.addEventListener('click', () => {
                            currentAppPage = i;
                            renderApps();
                        });
                        appsPagination.appendChild(pageBtn);
                    }
                }
            }
        }

        fetch('JSON/games.json')
            .then(response => response.json())
            .then(data => {
                gamesData = data;
                renderGames();
            })
            .catch(err => console.error(err));

        fetch('JSON/apps.json')
            .then(response => response.json())
            .then(data => {
                appsData = data;
                renderApps();
            })
            .catch(err => console.error(err));
    }
})();
