(function initApp() {
    // ==========================================
    // 1. DEFINE TABLES AT THE VERY START
    // ==========================================
    const scramTable = []; 
    
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
        { url: "https://frogiesarcade.net", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://000evvoxvgza.69.164.251.210.nip.io", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://03gaygayguysarebyceandchatchawin.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://03wccheck-b660f6d1-ext.stenspluggsida.duckdns.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://04239940332.myapps.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://06p37dwobhe8udte.www.fastwow.giize.com", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://0cqjao047kgq4i0e.fastwow.giize.com", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://0ojsbhwwwaplolgayfagsskib.frogiee1stoolbox.eu.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://0yd4jtmw99.frogiee1stoolbox.eu.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1.dev.classlink.com.de.cdn.cloudflare.net", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1.pkdk-almuhammadi.com", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://10.casadotricolor.com.br", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://101.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1027yr4df.eastcartermiddleschool.mikata.ru", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1176.yes.frogiee1stoolbox.eu.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://123.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://123.learnhub.dedyn.io", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://123.myapps.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://123123.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://12345.myapps.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://123456789.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://12345678910.myapps.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1234567891011121314151617181920.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://123myapps.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://123www.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://123www.classlink.com.de.cdn.cloudflare.net", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://124u38ty8t3.east.carter.aber.ir", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://15.historyhomework.mypop3.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1npdmmadmin.marialovesmenndechino.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1sandbox.letsbehappy.6536.8236.frog.pxi-fusion.com", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1staging.letsbehappy.6536.8236.frog.pxi-fusion.com", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1test.oluwajuwonlosamuelokanlawon.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1uds5.mesh.mongodb-dev.neten.yes.frogiee1stoolbox.eu.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1uds5.mesh.mongodb-dev.netwww.en.www.admin.yes.frogiee1stoolbox.eu.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1vib36z.ddnss.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1www.api.letsbehappy.6536.8236.frog.pxi-fusion.com", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1www.uat.letsbehappy.6536.8236.frog.pxi-fusion.com", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1wwwwwwapp.ermwhatthesigma.frogiee1stoolbox.eu.org", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://2.frogiesarcade.tk", img: "/stuff/logo.png", final: "/embed.html#" }
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

    const frogieeTable = [
        { url: "https://frogiesarcade.win", img: "/stuff/logo.png", final: "" },
        { url: "https://larp.foundation", img: "/stuff/logo.png", final: "" },
        { url: "https://nickolas.industries", img: "/stuff/logo.png", final: "" },
        { url: "https://shrimpy.website", img: "/stuff/logo.png", final: "" },
        { url: "https://gloverschool.org", img: "/stuff/logo.png", final: "" },
        { url: "https://miku.hair", img: "/stuff/logo.png", final: "" },
        { url: "https://yourfrogiesarcadelink.com", img: "/stuff/logo.png", final: "" },
        { url: "https://tetosarcade.win", img: "/stuff/logo.png", final: "" },
        { url: "https://bogbot.shop", img: "/stuff/logo.png", final: "" },
        { url: "https://nsd160.org", img: "/stuff/logo.png", final: "" },
        { url: "https://ixl.rocks", img: "/stuff/logo.png", final: "" },
        { url: "https://denisonisd.org", img: "/stuff/logo.png", final: "" },
        { url: "https://anthonyisgooningat3am.space", img: "/stuff/logo.png", final: "" },
        { url: "https://caisseforsmithfieldschools.org", img: "/stuff/logo.png", final: "" },
        { url: "https://frogiesarcade.com", img: "/stuff/logo.png", final: "" },
        { url: "https://austinisd.net", img: "/stuff/logo.png", final: "" },
        { url: "https://brooklyn.foundation", img: "/stuff/logo.png", final: "" },
        { url: "https://frog.bar", img: "/stuff/logo.png", final: "" },
        { url: "https://edgy.blog", img: "/stuff/logo.png", final: "" },
        { url: "https://cliffschools.org", img: "/stuff/logo.png", final: "" },
        { url: "https://columbiapublicschools.org", img: "/stuff/logo.png", final: "" },
        { url: "https://northfayetteschools.org", img: "/stuff/logo.png", final: "" },
        { url: "https://smdpschool.org", img: "/stuff/logo.png", final: "" },
        { url: "https://burrvillees.org", img: "/stuff/logo.png", final: "" },
        { url: "https://pleasantonmiddleschool.org", img: "/stuff/logo.png", final: "" },
        { url: "https://hcstemm.org", img: "/stuff/logo.png", final: "" },
        { url: "https://riversideacademy.site", img: "/stuff/logo.png", final: "" },
        { url: "https://highschoolmathteachers.com", img: "/stuff/logo.png", final: "" },
        { url: "https://oldmillschool.org", img: "/stuff/logo.png", final: "" },
        { url: "https://frogiesarcade.net", img: "/stuff/logo.png", final: "" },
        { url: "https://000evvoxvgza.69.164.251.210.nip.io", img: "/stuff/logo.png", final: "" },
        { url: "https://03gaygayguysarebyceandchatchawin.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://03wccheck-b660f6d1-ext.stenspluggsida.duckdns.org", img: "/stuff/logo.png", final: "" },
        { url: "https://04239940332.myapps.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://06p37dwobhe8udte.www.fastwow.giize.com", img: "/stuff/logo.png", final: "" },
        { url: "https://0cqjao047kgq4i0e.fastwow.giize.com", img: "/stuff/logo.png", final: "" },
        { url: "https://0ojsbhwwwaplolgayfagsskib.frogiee1stoolbox.eu.org", img: "/stuff/logo.png", final: "" },
        { url: "https://0yd4jtmw99.frogiee1stoolbox.eu.org", img: "/stuff/logo.png", final: "" },
        { url: "https://1.classlink.com.de", img: "/stuff/logo.png", final: "/embed.html#" },
        { url: "https://1.dev.classlink.com.de.cdn.cloudflare.net", img: "/stuff/logo.png", final: "" },
        { url: "https://1.pkdk-almuhammadi.com", img: "/stuff/logo.png", final: "" },
        { url: "https://10.casadotricolor.com.br", img: "/stuff/logo.png", final: "" },
        { url: "https://101.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://1027yr4df.eastcartermiddleschool.mikata.ru", img: "/stuff/logo.png", final: "" },
        { url: "https://1176.yes.frogiee1stoolbox.eu.org", img: "/stuff/logo.png", final: "" },
        { url: "https://123.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://123.learnhub.dedyn.io", img: "/stuff/logo.png", final: "" },
        { url: "https://123.myapps.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://123123.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://12345.myapps.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://123456789.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://12345678910.myapps.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://1234567891011121314151617181920.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://123myapps.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://123www.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://123www.classlink.com.de.cdn.cloudflare.net", img: "/stuff/logo.png", final: "" },
        { url: "https://124u38ty8t3.east.carter.aber.ir", img: "/stuff/logo.png", final: "" },
        { url: "https://15.historyhomework.mypop3.org", img: "/stuff/logo.png", final: "" },
        { url: "https://1npdmmadmin.marialovesmenndechino.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://1sandbox.letsbehappy.6536.8236.frog.pxi-fusion.com", img: "/stuff/logo.png", final: "" },
        { url: "https://1staging.letsbehappy.6536.8236.frog.pxi-fusion.com", img: "/stuff/logo.png", final: "" },
        { url: "https://1test.oluwajuwonlosamuelokanlawon.classlink.com.de", img: "/stuff/logo.png", final: "" },
        { url: "https://1uds5.mesh.mongodb-dev.neten.yes.frogiee1stoolbox.eu.org", img: "/stuff/logo.png", final: "" },
        { url: "https://1uds5.mesh.mongodb-dev.netwww.en.www.admin.yes.frogiee1stoolbox.eu.org", img: "/stuff/logo.png", final: "" },
        { url: "https://1vib36z.ddnss.de", img: "/stuff/logo.png", final: "" },
        { url: "https://1www.api.letsbehappy.6536.8236.frog.pxi-fusion.com", img: "/stuff/logo.png", final: "" },
        { url: "https://1www.uat.letsbehappy.6536.8236.frog.pxi-fusion.com", img: "/stuff/logo.png", final: "" },
        { url: "https://1wwwwwwapp.ermwhatthesigma.frogiee1stoolbox.eu.org", img: "/stuff/logo.png", final: "" },
        { url: "https://2.frogiesarcade.tk", img: "/stuff/logo.png", final: "" }
    ];

    // ==========================================
    // 2. TRUE-DETECTION CONNECTION CHECKER (8s timeout)
    // ==========================================
    const activeTableIndexes = {};

    function testUrlConnection(testUrl) {
        return new Promise((resolve) => {
            let isDone = false;
            const img = new Image();
            
            img.onload = () => {
                if (!isDone) {
                    isDone = true;
                    resolve(img.naturalWidth > 0);
                }
            };
            
            img.onerror = () => {
                if (!isDone) {
                    isDone = true;
                    resolve(false);
                }
            };
            
            img.src = testUrl + (testUrl.includes('?') ? '&' : '?') + '_=' + Date.now();
            
            setTimeout(() => { 
                if (!isDone) { 
                    isDone = true; 
                    resolve(false); 
                } 
            }, 8000);
        });
    }

    async function getWorkingConfig(table) {
        if (!table || table.length === 0) return null;
        
        if (activeTableIndexes[table] === undefined) {
            activeTableIndexes[table] = 0;
        }

        const checkPromises = table.map(async (entry) => {
            const fullTestUrl = entry.url.replace(/\/+$/, '') + '/' + entry.img.replace(/^\/+/, '');
            const isAlive = await testUrlConnection(fullTestUrl);
            return isAlive ? entry : null;
        });

        try {
            const results = await Promise.all(checkPromises);
            const workingEntry = results.find(entry => entry !== null);
            
            if (workingEntry) {
                activeTableIndexes[table] = table.indexOf(workingEntry);
                return workingEntry;
            }
        } catch (err) {}

        return table[activeTableIndexes[table]] || table[0];
    }

    [scramTable, staticTable, uvTable, truffledTable, frogieeTable].forEach(table => {
        getWorkingConfig(table);
    });

    // ==========================================
    // 3. MAIN APP LOGIC
    // ==========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runLogic);
    } else {
        runLogic();
    }

    function runLogic() {
        const navBtns = document.querySelectorAll('.nav-btn');
        const pages = document.querySelectorAll('.page');
        const themeSelect = document.getElementById('layout-theme-select');
        const navSelect = document.getElementById('layout-nav-select');
        const textSelect = document.getElementById('layout-text-select');
        const sizeSelect = document.getElementById('layout-size-select');
        const eduLogo = document.getElementById('edu-logo');
        const body = document.body;

        const modalOverlay = document.getElementById('resource-modal');
        const modalIframe = document.getElementById('resource-modal-iframe');
        const modalTitle = document.getElementById('resource-modal-title');
        const modalCloseBtn = document.getElementById('resource-close-btn');
        const modalFullscreenBtn = document.getElementById('resource-fullscreen-btn');

        const settingsModal = document.getElementById('homeworkhelper-modal');
        const settingsCloseBtn = document.getElementById('homeworkhelper-close-btn');

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
                    if (response.ok) {
                        return await response.json();
                    }
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
                        const htmlContent = await response.text();
                        iframe.srcdoc = htmlContent;
                        return;
                    }
                } catch (err) {}
            }
        }

        loadProxyContentAsIframe('mathworksheets-iframe', 'Pages/browser.html');
        loadProxyContentAsIframe('gradebook-iframe', 'Pages/music.html');
        loadProxyContentAsIframe('lessonplanner-iframe', 'Pages/ai.html');

        async function resolveAndGetUrl(originalUrl) {
            let resolvedUrl = originalUrl;
            
            async function getFreshUrl(table) {
                const w = await getWorkingConfig(table);
                return w ? w.url + w.final : '';
            }

            if (resolvedUrl.includes('${scram}')) {
                resolvedUrl = resolvedUrl.replace('${scram}', await getFreshUrl(scramTable));
            }
            if (resolvedUrl.includes('${static}')) {
                resolvedUrl = resolvedUrl.replace('${static}', await getFreshUrl(staticTable));
            }
            if (resolvedUrl.includes('${uv}')) {
                resolvedUrl = resolvedUrl.replace('${uv}', await getFreshUrl(uvTable));
            }
            if (resolvedUrl.includes('${truffled}')) {
                resolvedUrl = resolvedUrl.replace('${truffled}', await getFreshUrl(truffledTable));
            }
            if (resolvedUrl.includes('${frogiee}')) {
                resolvedUrl = resolvedUrl.replace('${frogiee}', await getFreshUrl(frogieeTable));
            }
            
            resolvedUrl = resolvedUrl.replace(/([^:]\/)\/+/g, '$1');
            return resolvedUrl;
        }

        // --- Preferences and Settings Management ---
        const savedTheme = localStorage.getItem('kstuff_theme');
        const savedNavPos = localStorage.getItem('kstuff_nav_pos');
        const savedTextVis = localStorage.getItem('kstuff_text_vis');
        const savedNavSize = localStorage.getItem('kstuff_nav_size');

        if (savedTheme) {
            body.className = body.className.replace(/\btheme-\S+/g, '').trim();
            body.classList.add(savedTheme);
            if (themeSelect) themeSelect.value = savedTheme;
        } else {
            body.className = body.className.replace(/\btheme-\S+/g, '').trim();
            body.classList.add('theme-sakura');
            if (themeSelect) themeSelect.value = 'theme-sakura';
        }

        if (savedNavPos) {
            body.className = body.className.replace(/\bnav-\S+/g, '').trim();
            body.classList.add(savedNavPos);
            if (navSelect) navSelect.value = savedNavPos;
        } else {
            body.className = body.className.replace(/\bnav-\S+/g, '').trim();
            body.classList.add('nav-left');
            if (navSelect) navSelect.value = 'nav-left';
        }

        if (savedTextVis) {
            if (savedTextVis === 'text-hide') {
                body.classList.add('text-hide');
                if (textSelect) textSelect.value = 'text-hide';
            } else {
                body.classList.remove('text-hide');
                if (textSelect) textSelect.value = 'text-show';
            }
        } else {
            body.classList.add('text-hide');
            if (textSelect) textSelect.value = 'text-hide';
        }

        if (savedNavSize) {
            body.className = body.className.replace(/\bsize-\S+/g, '').trim();
            body.classList.add(savedNavSize);
            if (sizeSelect) sizeSelect.value = savedNavSize;
        } else {
            body.className = body.className.replace(/\bsize-\S+/g, '').trim();
            body.classList.add('size-small');
            if (sizeSelect) sizeSelect.value = 'size-small';
        }

        // --- Event Listeners ---
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

                const targetPage = document.getElementById(targetId);
                if (targetPage) targetPage.classList.add('active');

                if (targetId === 'mathworksheets') {
                    if (eduLogo) eduLogo.classList.remove('show');
                    body.classList.remove('show-logo');
                } else {
                    if (eduLogo) eduLogo.classList.add('show');
                    body.classList.add('show-logo');
                }
            });
        });

        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                body.className = body.className.replace(/\btheme-\S+/g, '').trim();
                body.classList.add(e.target.value);
                localStorage.setItem('kstuff_theme', e.target.value);
            });
        }
        if (navSelect) {
            navSelect.addEventListener('change', (e) => {
                body.className = body.className.replace(/\bnav-\S+/g, '').trim();
                body.classList.add(e.target.value);
                localStorage.setItem('kstuff_nav_pos', e.target.value);
            });
        }
        if (textSelect) {
            textSelect.addEventListener('change', (e) => {
                if (e.target.value === 'text-hide') body.classList.add('text-hide');
                else body.classList.remove('text-hide');
                localStorage.setItem('kstuff_text_vis', e.target.value);
            });
        }
        if (sizeSelect) {
            sizeSelect.addEventListener('change', (e) => {
                body.className = body.className.replace(/\bsize-\S+/g, '').trim();
                body.classList.add(e.target.value);
                localStorage.setItem('kstuff_nav_size', e.target.value);
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
                    modalIframe.requestFullscreen().catch(err => {});
                } else {
                    document.exitFullscreen();
                }
            });
        }

        if (settingsCloseBtn) {
            settingsCloseBtn.addEventListener('click', () => {
                if (settingsModal) settingsModal.classList.remove('active');
            });
        }
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    settingsModal.classList.remove('active');
                }
            });
        }

        // --- Resource Data Management & Rendering ---
        let readingItemsData = [];
        let scienceItemsData = [];
        let currentReadingCategory = "All";
        let currentScienceCategory = "All";
        let currentReadingSearch = "";
        let currentScienceSearch = "";
        let currentReadingPage = 1;
        let currentSciencePage = 1;
        const itemsPerPage = 50;

        const readingSearchInput = document.getElementById('readingcorner-search');
        const scienceSearchInput = document.getElementById('sciencequiz-search');

        if (readingSearchInput) {
            readingSearchInput.addEventListener('input', (e) => {
                currentReadingSearch = e.target.value.toLowerCase().trim();
                currentReadingPage = 1;
                renderReadingResources();
            });
        }

        if (scienceSearchInput) {
            scienceSearchInput.addEventListener('input', (e) => {
                currentScienceSearch = e.target.value.toLowerCase().trim();
                currentSciencePage = 1;
                renderScienceModules();
            });
        }

        fetchAsset('Json/categories.json')
            .then(categories => {
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
                        renderReadingResources();
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
                        renderScienceModules();
                    });
                }
            })
            .catch(err => {
                const rs = document.getElementById('readingcorner-category-select');
                const ss = document.getElementById('sciencequiz-category-select');
                if (rs) rs.innerHTML = '<option value="All">Error</option>';
                if (ss) ss.innerHTML = '<option value="All">Error</option>';
            });

        function renderReadingResources() {
            const readingGrid = document.getElementById('readingcorner-grid');
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

            readingGrid.innerHTML = '';
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
                readingGrid.appendChild(card);
            });

            if (readingPagination) {
                readingPagination.innerHTML = '';
                if (totalPages > 1) {
                    for (let i = 1; i <= totalPages; i++) {
                        const pageBtn = document.createElement('button');
                        pageBtn.className = `page-btn ${i === currentReadingPage ? 'active' : ''}`;
                        pageBtn.textContent = i;
                        pageBtn.addEventListener('click', () => {
                            currentReadingPage = i;
                            renderReadingResources();
                        });
                        readingPagination.appendChild(pageBtn);
                    }
                }
            }
        }

        function renderScienceModules() {
            const scienceGrid = document.getElementById('sciencequiz-grid');
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

            scienceGrid.innerHTML = '';
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
                scienceGrid.appendChild(card);
            });

            if (sciencePagination) {
                sciencePagination.innerHTML = '';
                if (totalPages > 1) {
                    for (let i = 1; i <= totalPages; i++) {
                        const pageBtn = document.createElement('button');
                        pageBtn.className = `page-btn ${i === currentSciencePage ? 'active' : ''}`;
                        pageBtn.textContent = i;
                        pageBtn.addEventListener('click', () => {
                            currentSciencePage = i;
                            renderScienceModules();
                        });
                        sciencePagination.appendChild(pageBtn);
                    }
                }
            }
        }

        // --- Truffled & Resource Data Loader ---
        Promise.all([
            fetchAsset('Json/g.json'),
            fetchAsset('Json/truffled.json').catch(() => null),
            getWorkingConfig(truffledTable)
        ]).then(([gData, truffledData, w]) => {
            const base = w ? (w.url).replace(/\/+$/, '') : '';
            const truffledMap = new Map();
            
            if (truffledData && truffledData.games) {
                truffledData.games.forEach(g => {
                    truffledMap.set(g.name.toLowerCase().trim(), g);
                });
            }

            let finalResources = [];
            for (const item of gData) {
                if (item.url && item.url.includes('${truffled}')) {
                    const searchTitle = (item.title || "").toLowerCase().trim();
                    const matchedItem = truffledMap.get(searchTitle);

                    if (matchedItem) {
                        finalResources.push({
                            title: matchedItem.name,
                            url: '${truffled}' + matchedItem.url,
                            image: base + '/' + matchedItem.thumbnail.replace(/^\/+/, ''),
                            description: item.description || '',
                            category: item.category || 'Truffled'
                        });
                    } else {
                        finalResources.push(item);
                    }
                } else {
                    finalResources.push(item);
                }
            }
            readingItemsData = finalResources;
            renderReadingResources();
        }).catch(err => {});

        fetchAsset('Json/a.json').then(data => { scienceItemsData = data; renderScienceModules(); }).catch(err => {});
    }
})();
