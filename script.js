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
        { url: "https://2.frogiesarcade.tk", img: "/stuff/logo.png", final: "" },
    ];

    // ==========================================
    // 2. DYNAMIC AUTO-ROTATING CONNECTION CHECKER
    // ==========================================
    const activeTableIndexes = {};

    function testUrlConnection(testUrl) {
        return new Promise((resolve) => {
            let isDone = false;
            
            fetch(testUrl + "?_=" + Date.now(), { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
                .then(() => {
                    if (!isDone) {
                        isDone = true;
                        resolve(true);
                    }
                })
                .catch(() => {
                    if (!isDone) {
                        isDone = true;
                        resolve(false);
                    }
                });
            
            setTimeout(() => { 
                if (!isDone) { 
                    isDone = true; 
                    resolve(false); 
                } 
            }, 3000);
        });
    }

    // Automatically cycles through mirrors on demand if one drops or blocks
    async function getWorkingConfig(table) {
        if (!table || table.length === 0) return null;
        
        if (activeTableIndexes[table] === undefined) {
            activeTableIndexes[table] = 0;
        }

        let startIndex = activeTableIndexes[table];
        let attempts = 0;

        while (attempts < table.length) {
            const entry = table[startIndex];
            const fullTestUrl = entry.url.replace(/\/+$/, '') + '/' + entry.img.replace(/^\/+/, '');
            
            const isAlive = await testUrlConnection(fullTestUrl);
            if (isAlive) {
                activeTableIndexes[table] = startIndex; // Lock in the healthy mirror
                return entry;
            }

            // Move to the next mirror index seamlessly
            startIndex = (startIndex + 1) % table.length;
            attempts++;
        }

        // Failsafe fallback if all mirrors block
        return table[0];
    }

    // Eagerly trigger background tests
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
        const themeSelect = document.getElementById('theme-select');
        const navSelect = document.getElementById('nav-select');
        const textSelect = document.getElementById('text-select');
        const sizeSelect = document.getElementById('size-select');
        const navLogo = document.getElementById('nav-logo');
        const body = document.body;

        const modalOverlay = document.getElementById('content-modal');
        const modalIframe = document.getElementById('modal-iframe');
        const modalTitle = document.getElementById('modal-title');
        const modalCloseBtn = document.getElementById('modal-close-btn');
        const modalFullscreenBtn = document.getElementById('modal-fullscreen-btn');

        const settingsModal = document.getElementById('settings-modal');
        const settingsCloseBtn = document.getElementById('settings-modal-close-btn');

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

        loadProxyContentAsIframe('home-iframe', 'Pages/browser.html');
        loadProxyContentAsIframe('music-iframe', 'Pages/music.html');
        loadProxyContentAsIframe('ai-iframe', 'Pages/ai.html');

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

        // --- Theme and Settings Management ---
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

                if (targetId === 'settings') {
                    if (settingsModal) settingsModal.classList.add('active');
                    return;
                }

                navBtns.forEach(b => {
                    if (b.getAttribute('data-target') !== 'settings') {
                        b.classList.remove('active');
                    }
                });
                pages.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');

                const targetPage = document.getElementById(targetId);
                if (targetPage) targetPage.classList.add('active');

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

        // --- Data Management & Rendering ---
        let gamesData = [];
        let appsData = [];
        let currentGameCategory = "All";
        let currentAppCategory = "All";
        let currentGameSearch = "";
        let currentAppSearch = "";
        let currentGamePage = 1;
        let currentAppPage = 1;
        const itemsPerPage = 50;

        const gamesSearch = document.getElementById('games-search');
        const appsSearch = document.getElementById('apps-search');

        if (gamesSearch) {
            gamesSearch.addEventListener('input', (e) => {
                currentGameSearch = e.target.value.toLowerCase().trim();
                currentGamePage = 1;
                renderGames();
            });
        }

        if (appsSearch) {
            appsSearch.addEventListener('input', (e) => {
                currentAppSearch = e.target.value.toLowerCase().trim();
                currentAppPage = 1;
                renderApps();
            });
        }

        fetchAsset('Json/categories.json')
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
                const gs = document.getElementById('games-category-select');
                const as = document.getElementById('apps-category-select');
                if (gs) gs.innerHTML = '<option value="All">Error</option>';
                if (as) as.innerHTML = '<option value="All">Error</option>';
            });

        function renderGames() {
            const gamesGrid = document.getElementById('games-grid');
            const gamesPagination = document.getElementById('games-pagination');
            if (!gamesGrid) return;
            
            const filteredData = gamesData.filter(item => {
                const matchesCategory = currentGameCategory === "All" || item.category === currentGameCategory;
                const matchesSearch = item.title.toLowerCase().includes(currentGameSearch);
                return matchesCategory && matchesSearch;
            });

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
            
            const filteredData = appsData.filter(item => {
                const matchesCategory = currentAppCategory === "All" || item.category === currentAppCategory;
                const matchesSearch = item.title.toLowerCase().includes(currentAppSearch);
                return matchesCategory && matchesSearch;
            });

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

        // --- Truffled & Game Data Loader ---
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

            let finalGames = [];
            for (const item of gData) {
                if (item.url && item.url.includes('${truffled}')) {
                    const searchTitle = (item.title || "").toLowerCase().trim();
                    const matchedGame = truffledMap.get(searchTitle);

                    if (matchedGame) {
                        finalGames.push({
                            title: matchedGame.name,
                            url: '${truffled}' + matchedGame.url,
                            image: base + '/' + matchedGame.thumbnail.replace(/^\/+/, ''),
                            description: item.description || '',
                            category: item.category || 'Truffled'
                        });
                    } else {
                        finalGames.push(item);
                    }
                } else {
                    finalGames.push(item);
                }
            }
            gamesData = finalGames;
            renderGames();
        }).catch(err => {});

        fetchAsset('Json/a.json').then(data => { appsData = data; renderApps(); }).catch(err => {});
    }
})();
