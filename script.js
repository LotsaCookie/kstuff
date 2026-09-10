function initApp() {
    const $ = id => document.getElementById(id), $$ = sel => document.querySelectorAll(sel);
    const el = (t, p) => Object.assign(document.createElement(t), p);
    const getS = k => localStorage.getItem(k), setS = (k, v) => localStorage.setItem(k, v);
    const cleanU = u => u ? u.replace(/\/+$/, '') : '', trimS = u => u ? u.replace(/^\/+/, '') : '';
    
    const body = document.body, navBar = $('teachertouchbar'), navBtns = $$('.nav-btn'), pages = $$('.page');
    const loader = document.querySelector('.section-loader'), modOverlay = $('resource-modal'), modIframe = $('resource-modal-iframe');
    let port = null, backendReady = false, syncInt = null, user = null, commit = null, rsTimer, savedY = 0, savedTop = 0, gRep = {}, gTruf = new Map(), loadId = 0, sessionSaved = false;

    pages.forEach(p => (p.style.display = p.classList.contains('active') ? 'block' : 'none', p.style.opacity = p.classList.contains('active') ? '1' : '0'));

    try { user = JSON.parse(getS('kstuff_user')); user?.settings?.theme && setS('kstuff_theme', user.settings.theme); } 
    catch { localStorage.removeItem('kstuff_user'); }
    if (!getS('kstuff_theme')) setS('kstuff_theme', 'theme-sakura');

    const tLoader = s => loader && (loader.style.opacity = s ? '1' : '0', loader.classList.toggle('hidden', !s));
    tLoader(true);

    const tip = body.appendChild(el('div', { className: 'js-custom-tooltip', style: 'position:fixed;display:none;padding:6px 10px;background:rgba(0,0,0,0.85);color:#fff;font-size:0.75rem;border-radius:6px;pointer-events:none;z-index:999999;white-space:nowrap;' }));
    const tTip = (e, s) => {
        const t = e?.target?.closest?.('[data-tooltip]');
        if (!t || !s) return tip.style.display = 'none';
        tip.textContent = t.dataset.tooltip; tip.style.cssText += `;display:block;left:${e.clientX + 12}px;top:${e.clientY + 12}px;`;
    };
    ['mouseover', 'mousemove', 'mouseout'].forEach(ev => document.addEventListener(ev, e => tTip(e, ev !== 'mouseout')));

    let ind = navBar?.querySelector('.nav-indicator') || navBar?.prepend(el('div', { className: 'nav-indicator' })) || navBar?.querySelector('.nav-indicator');
    const upInd = b => {
        if (!b || !ind || !navBar) return;
        const v = body.className.includes('nav-left') || body.className.includes('nav-right'), nR = navBar.getBoundingClientRect(), bR = b.getBoundingClientRect();
        ind.style.cssText += `width:${v ? '3px' : bR.width + 'px'};height:${v ? bR.height + 'px' : '3px'};transform:${v ? `translateY(${bR.top - nR.top}px)` : `translateX(${bR.left - nR.left}px)`};`;
    };
    [50, 100, 200, 400, 700, 1000, 1500, 2000, 3000].forEach(ms => setTimeout(() => upInd(document.querySelector('.nav-btn.active')), ms));

    const getProxies = async () => {
        if (!commit) try { commit = (await (await fetch("https://api.github.com/repos/lotsacookie/kstuff/commits/main")).json()).sha; } catch { commit = "main"; }
        return ["raw.githack.com", "cdn.jsdelivr.net/gh", "raw.githubusercontent.com", "cdn.statically.io/gh"].map(d => `https://${d}/lotsacookie/kstuff/${commit}/`).concat("");
    };

    const fetchP = async (path, asText = false) => {
        const p = await getProxies(), cb = `${path.includes('?') ? '&' : '?'}_=${Date.now()}`;
        return Promise.any(p.map(async px => {
            const r = await fetch(px + path + cb, { cache: 'no-store' });
            if (!r.ok) throw Error(); return asText ? r.text() : r.json();
        })).catch(() => { throw Error("Failed: " + path); });
    };

    const getCfg = async (t) => {
        if (!t?.length) return null;
        for (let i = 0; i < t.length; i += 5) {
            const w = await new Promise(res => {
                let d = false, f = 0, imgs = t.slice(i, i+5).map(e => {
                    const img = new Image(), u = `${cleanU(e.url)}/${trimS(e.img)}`;
                    const h = ok => { if(d) return; if(ok || ++f === 5) { d = true; clearTimeout(tm); imgs.forEach(x => x.src = ''); res(ok ? e : null); } };
                    img.onload = () => h(img.naturalWidth > 0); img.onerror = () => h(false);
                    img.src = `${u}${u.includes('?')?'&':'?'}b=${Date.now()}`; return img;
                });
                const tm = setTimeout(() => { if(!d) { d = true; imgs.forEach(x => x.src = ''); res(null); } }, 5000);
            });
            if (w) return w;
        } return t[0];
    };

    const applyUI = s => {
        if (!s) return;
        if (s.theme) setS('kstuff_theme', s.theme);
        [{ i: 'layout-theme-select', k: 'kstuff_theme', v: s.theme }, { i: 'layout-nav-select', k: 'kstuff_nav_pos', v: s.navPos }, { i: 'layout-size-select', k: 'kstuff_nav_size', v: s.navSize }, { i: 'layout-text-select', k: 'kstuff_text_vis', v: s.textVis }].forEach(({ i, k, v }) => {
            const sel = $(i); if (v && sel) {
                setS(k, v); sel.value = v; sel.dispatchEvent(new Event('change'));
                const w = sel.nextElementSibling;
                if (w?.classList.contains('custom-select-wrapper')) {
                    w.querySelector('span').textContent = sel.options[sel.selectedIndex]?.text || '';
                    w.querySelectorAll('.custom-select-option').forEach((o, idx) => o.classList.toggle('selected', idx === sel.selectedIndex));
                }
            }
        });
    };

    const upAuth = () => {
        const btn = $('profile-nav-btn'), p = user?.profilePicture || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cpath fill='%23888' d='M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM74.08,197.5a64,64,0,0,1,107.84,0,87.83,87.83,0,0,1-107.84,0ZM96,120a32,32,0,1,1,32,32A32,32,0,0,1,96,120Zm97.76,66.41a79.66,79.66,0,0,0-36.06-28.75,48,48,0,1,0-61.4,0,79.66,79.66,0,0,0-36.06,28.75,88,88,0,1,1,133.52,0Z'/%3E%3C/svg%3E";
        if (!btn) return;
        if (user) {
            if ($('profile-modal-pic')) $('profile-modal-pic').src = p;
            if ($('profile-modal-username')) $('profile-modal-username').textContent = user.username || "User";
            if ($('profile-modal-desc')) $('profile-modal-desc').textContent = user.description || "No bio.";
            btn.querySelector('i')?.replaceWith(el('i', { className: 'ph profile-avatar-container', innerHTML: `<img src="${p}" onerror="this.src=''">` }));
        } else btn.querySelector('i')?.replaceWith(el('i', { className: 'ph ph-user', id: 'profile-nav-icon' }));
    };

    const handleMsg = (d, pt) => {
        if (!d) return;
        if (d.type === 'ready') {
            backendReady = true; port = pt;
            if (user) { const sync = () => pt.postMessage({ type: 'auto-login', username: user.username }); sync(); syncInt = setInterval(sync, 5000); }
        } else if (['login', 'auto-login', 'signup'].includes(d.type)) {
            if (d.type === 'auto-login' && syncInt) clearInterval(syncInt);
            const err = $('auth-error-msg');
            if (d.success) {
                if (sessionSaved && user?.settings) { d.payload.settings = user.settings; pt.postMessage({ type: 'update-settings', username: d.payload.username, settings: user.settings }); }
                user = d.payload; setS('kstuff_theme', user.settings?.theme || user.theme); setS('kstuff_user', JSON.stringify(user));
                applyUI(user.settings || { theme: user.theme }); upAuth();
                if (err) err.style.display = 'none'; $('auth-modal-overlay')?.classList.remove('active');
            } else if (d.type === 'auto-login') { user = null; localStorage.removeItem('kstuff_user'); upAuth(); }
            else if (err) { err.textContent = d.message || { invalid: 'Fill fields.', exists: 'Username taken.', failed: 'Request failed.', not_found: 'Not found.', invalid_password: 'Bad password.' }[d.reason] || 'Invalid credentials.'; err.style.display = 'block'; }
        }
    };

    const appDD = sel => {
        if (!sel || (sel.dataset.c && !sel.nextElementSibling?.classList.contains('custom-select-wrapper'))) return;
        if (sel.dataset.c) sel.nextElementSibling.remove();
        sel.style.display = 'none'; sel.dataset.c = 'true';
        const w = el('div', { className: 'custom-select-wrapper' }), tr = el('div', { className: 'custom-select-trigger', tabIndex: 0, innerHTML: `<span>${sel.options[sel.selectedIndex]?.text || ''}</span> <i class="ph ph-caret-down"></i>` }), op = el('div', { className: 'custom-select-options' });
        Array.from(sel.options).forEach((o, i) => {
            const d = el('div', { className: `custom-select-option ${i === sel.selectedIndex ? 'selected' : ''}`, textContent: o.text });
            d.onclick = e => { e.stopPropagation(); sel.value = o.value; tr.querySelector('span').textContent = o.text; op.querySelectorAll('.custom-select-option').forEach(x => x.classList.remove('selected')); d.classList.add('selected'); op.classList.remove('open'); sel.dispatchEvent(new Event('change')); };
            op.appendChild(d);
        });
        tr.onclick = e => { e.stopPropagation(); $$('.custom-select-options.open').forEach(m => m !== op && m.classList.remove('open')); op.classList.toggle('open'); };
        w.append(tr, op); sel.parentNode.insertBefore(w, sel.nextSibling);
    };

    document.addEventListener('click', () => $$('.custom-select-options.open').forEach(e => e.classList.remove('open')));
    $$('.setting-group select').forEach(appDD);

    const loadThemes = t => {
        ($('dynamic-themes-style') || document.head.appendChild(el('style', { id: 'dynamic-themes-style' }))).textContent = t.map(x => `.${x.id}{${Object.entries(x.variables).map(([k,v])=>`${k}:${v};`).join('')}}`).join('\n');
        const s = $('layout-theme-select');
        if (s) { s.innerHTML = t.map(x => `<option value="${x.id}">${x.name}</option>`).join(''); const ch = user?.settings?.theme || user?.theme || getS('kstuff_theme') || t[0].id; s.value = ch; setS('kstuff_theme', ch); body.className = body.className.replace(/\btheme-\S+/g, '').trim() + ' ' + ch; appDD(s); }
    };

    try { loadThemes(JSON.parse(getS('kstuff_themes_cache'))); } catch {}
    fetchP('Assets/json/themes.json').then(t => { setS('kstuff_themes_cache', JSON.stringify(t)); loadThemes(t); }).catch(()=>{});

    [['layout-theme-select', 'kstuff_theme', 'theme', v => v && (body.classList.add(v), setS('kstuff_theme', v))], ['layout-nav-select', 'kstuff_nav_pos', 'nav', v => v && body.classList.add(v)], ['layout-size-select', 'kstuff_nav_size', 'size', v => v && body.classList.add(v)], ['layout-text-select', 'kstuff_text_vis', '', v => v && body.classList.toggle('text-hide', v === 'text-hide')]].forEach(([id, k, p, fn]) => {
        const s = $(id); if (!s) return; s.value = getS(k) || s.value; fn(s.value);
        s.addEventListener('change', e => { p && (body.className = body.className.replace(new RegExp(`\\b${p}-\\S+`, 'g'), '').trim()); fn(e.target.value); setS(k, e.target.value); upInd(document.querySelector('.nav-btn.active')); $$('iframe').forEach(i => i.contentWindow?.postMessage('theme-updated', '*')); });
    });

    $('save-settings-btn')?.addEventListener('click', e => {
        const p = { theme: $('layout-theme-select')?.value, navPos: $('layout-nav-select')?.value, navSize: $('layout-size-select')?.value, textVis: $('layout-text-select')?.value, lastUpdated: Date.now() };
        p.theme && setS('kstuff_theme', p.theme); user = user || { settings: {} }; user.settings = p; setS('kstuff_user', JSON.stringify(user)); applyUI(p);
        sessionSaved = true; user.username && backendReady && port && port.postMessage({ type: 'update-settings', username: user.username, settings: p });
        const { background: bg, color: c } = e.target.style; Object.assign(e.target.style, { background: "#4CAF50", color: "#fff" }); e.target.textContent = "Saved!";
        setTimeout(() => { e.target.textContent = "Save Settings"; Object.assign(e.target.style, { background: bg, color: c }); }, 2000);
    });

    const fPgs = { mathworksheets: { id: 'mathworksheets-iframe', p: 'Assets/pages/browser.html' }, gradebook: { id: 'gradebook-iframe', p: 'Assets/pages/music.html' }, lessonplanner: { id: 'lessonplanner-iframe', p: 'Assets/pages/ai.html' }, studyhall: { id: 'studyhall-iframe', p: 'Assets/pages/chat.html' }, vms: { id: 'vms-iframe', p: 'Assets/pages/music.html' } };
    const grids = { readingcorner: { d: [], p: [], el: $('readingcorner-grid'), pg: $('readingcorner-pagination'), c: "All", s: "", pN: 1, id: 'readingcorner', rId: 0 }, sciencequiz: { d: [], p: [], el: $('sciencequiz-grid'), pg: $('sciencequiz-pagination'), c: "All", s: "", pN: 1, id: 'sciencequiz', rId: 0 } };

    const loadIfr = async (id, path) => {
        const f = $(id), lId = ++loadId; if (!f) return; f.removeAttribute('srcdoc'); f.src = 'about:blank';
        if (lId !== loadId) return;
        try {
            let ht = await fetchP(path, true); if (lId !== loadId) return;
            const inj = `<script>function sT(){if(!window.parent)return;const s=window.parent.getComputedStyle(window.parent.document.body),d=document.documentElement.style;d.setProperty('--bg',s.getPropertyValue('--background')||s.backgroundColor);d.setProperty('--text',s.getPropertyValue('--text-color')||s.color);d.setProperty('--nav',s.getPropertyValue('--nav-bg'));d.setProperty('--card',s.getPropertyValue('--card-bg'));}sT();window.addEventListener('message',e=>e.data==='theme-updated'&&sT());<\/script>`;
            f.onload = () => id === 'studyhall-iframe' && user && f.contentWindow?.postMessage({ type: 'set_user', username: user.username }, '*');
            f.srcdoc = ht.includes('</body>') ? ht.replace('</body>', inj + '</body>') : ht + inj;
        } catch { if (lId === loadId) f.srcdoc = `<html style="background:transparent;"><body style="color:var(--text-color, white);display:flex;justify-content:center;align-items:center;height:100vh;"><h2>Failed to load.</h2></body></html>`; }
    };

    const bPool = t => {
        const g = grids[t]; if (!g.el) return;
        g.p.forEach(x => { if (x.i) x.i.onload = x.i.onerror = x.i.src = null; }); g.el.innerHTML = ''; g.p = []; const fr = document.createDocumentFragment();
        for (let i = 0; i < 48; i++) {
            const c = el('div', { className: 'round-btn' }); c.dataset.i = i; c.innerHTML = `<img alt="" style="display:none;"><div class="category-label"></div><div class="overlay"><h3></h3><p></p></div>`;
            g.p.push({ el: c, i: c.querySelector('img'), t: c.querySelector('h3'), d: c.querySelector('p'), c: c.querySelector('.category-label') }); fr.appendChild(c);
        }
        g.el.appendChild(fr); g.el.onclick = e => { const c = e.target.closest('.round-btn'); if (c && c.style.display !== 'none') openRes(g.pD?.[c.dataset.i]); };
    };

    const rGrid = async t => {
        const g = grids[t]; if (!g.el) return;
        const myId = ++g.rId; tLoader(true);
        const f = g.d.filter(x => (g.c === "All" || x.category === g.c) && x.title.toLowerCase().includes(g.s)), tP = Math.ceil(f.length / 48) || 1;
        g.pN = g.pN > tP ? 1 : g.pN; g.pD = f.slice((g.pN - 1) * 48, g.pN * 48);
        const ps = [];
        g.p.forEach((p, idx) => {
            const it = g.pD[idx]; p.el.style.display = it ? 'block' : 'none';
            if (it) {
                if (p.t.textContent !== it.title) p.t.textContent = it.title; if (p.d.textContent !== (it.description || '')) p.d.textContent = it.description || '';
                if (p.c) p.c.textContent = it.category || 'All'; p.el.dataset.tooltip = it.title;
                if (p.i.dataset.src !== (it.image || '')) {
                    p.i.dataset.src = it.image || ''; p.i.onload = p.i.onerror = null; if (p.i.src) p.i.src = '';
                    if (it.image) { ps.push(new Promise(r => { p.i.onload = p.i.onerror = () => { p.i.onload = p.i.onerror = null; r(); }; p.i.src = it.image; })); p.i.style.display = 'block'; } else p.i.style.display = 'none';
                } else if (it.image) p.i.style.display = 'block';
            } else { p.i.dataset.src = ''; p.i.onload = p.i.onerror = null; p.i.src = ''; p.i.style.display = 'none'; if (p.c) p.c.textContent = ''; delete p.el.dataset.tooltip; }
        });
        if (g.pg) {
            g.pg.innerHTML = `<button class="page-btn" data-a="prev" ${g.pN===1?'style="opacity:0.4;cursor:not-allowed;"':''}><i class="ph ph-caret-left"></i></button><span style="font-weight:700;font-size:1.1rem;min-width:80px;text-align:center;user-select:none;">${g.pN} / ${tP}</span><button class="page-btn" data-a="next" ${g.pN===tP?'style="opacity:0.4;cursor:not-allowed;"':''}><i class="ph ph-caret-right"></i></button>`;
            if (!g.pg.dataset.b) { g.pg.dataset.b = 't'; g.pg.onclick = e => { const b = e.target.closest('.page-btn'); if (!b) return; const act = b.dataset.a; if (act === 'prev' && g.pN > 1) { g.pN--; rGrid(t); } else if (act === 'next' && g.pN < (Math.ceil(g.d.filter(x => (g.c === "All" || x.category === g.c) && x.title.toLowerCase().includes(g.s)).length / 48) || 1)) { g.pN++; rGrid(t); } }; }
        }
        await Promise.all(ps); if (g.rId === myId) tLoader(false);
    };

    Object.keys(grids).forEach(t => {
        let tm; $(`${t}-search`)?.addEventListener('input', e => { $(`${t}-search-clear`) && ($(`${t}-search-clear`).style.display = e.target.value ? 'block' : 'none'); clearTimeout(tm); tm = setTimeout(() => { grids[t].s = e.target.value.toLowerCase().trim(); grids[t].pN = 1; rGrid(t); }, 100); });
        $(`${t}-search-clear`)?.addEventListener('click', () => { $(`${t}-search`).value = ''; $(`${t}-search-clear`).style.display = 'none'; grids[t].s = ''; grids[t].pN = 1; rGrid(t); });
    });

    document.addEventListener('keydown', e => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
        const p = document.querySelector('.page.active'); if (!p || !grids[p.id]) return;
        const g = grids[p.id], tP = Math.ceil(g.d.filter(x => (g.c === "All" || x.category === g.c) && x.title.toLowerCase().includes(g.s)).length / 48) || 1;
        if (e.key === 'ArrowLeft' && g.pN > 1) { e.preventDefault(); g.pN--; rGrid(p.id); } else if (e.key === 'ArrowRight' && g.pN < tP) { e.preventDefault(); g.pN++; rGrid(p.id); }
    });

    document.head.appendChild(el('style', { textContent: `i.profile-avatar-container{width:1.2em;height:1.2em;border-radius:50%;overflow:hidden;display:inline-flex;justify-content:center;align-items:center;}i.profile-avatar-container img{width:100%;height:100%;object-fit:cover;}` }));
    upAuth(); if (user) applyUI(user.settings || { theme: user.theme });

    [['auth-modal-overlay', 'auth-close-btn'], ['profile-modal-overlay', 'profile-close-btn'], ['homeworkhelper-modal', 'homeworkhelper-close-btn'], ['changelog-modal', 'changelog-close-btn']].forEach(([m, b]) => { $(b)?.addEventListener('click', () => $(m)?.classList.remove('active')); $(m)?.addEventListener('click', e => e.target === $(m) && $(m).classList.remove('active')); });
    
    const hAuth = t => () => {
        const u = $('auth-user')?.value.trim(), p = $('auth-pass')?.value.trim(), e = $('auth-error-msg');
        if (t === 'signup') {
            if (u.length > 20 || !/^[a-zA-Z0-9_]+$/.test(u) || (u.match(/_/g) || []).length > 2) return e && (e.textContent = "Invalid username format.", e.style.display = 'block');
        }
        u && p && port ? port.postMessage({ type: t, username: u, password: p, ...(t === 'signup' ? { profilePicture: '' } : {}) }) : e && (e.textContent = "Fill fields.", e.style.display = 'block');
    };
    $('do-login-btn')?.addEventListener('click', hAuth('login')); $('do-signup-btn')?.addEventListener('click', hAuth('signup'));
    ['auth-user', 'auth-pass'].forEach(id => $(id)?.addEventListener('input', () => $('auth-error-msg') && ($('auth-error-msg').style.display = 'none')));
    $('do-logout-btn')?.addEventListener('click', () => { user = null; localStorage.removeItem('kstuff_user'); port?.postMessage({ type: 'logout' }); upAuth(); $('profile-modal-overlay')?.classList.remove('active'); });

    $('edit-profile-btn')?.addEventListener('click', () => { if (user) { const e = !$('profile-edit-container').style.display || $('profile-edit-container').style.display === 'none'; if (e) { $('profile-edit-pic-url').value = user.profilePicture || ""; $('profile-edit-desc').value = user.description || ""; } $('profile-edit-container').style.display = e ? 'flex' : 'none'; $('profile-edit-container').style.opacity = e ? '1' : '0'; } });
    $('save-profile-changes-btn')?.addEventListener('click', e => { if (!user || !port) return; const b = e.target, o = b.textContent; b.textContent = "Saving..."; user.profilePicture = $('profile-edit-pic-url').value.trim() || "https://kstuff.neocities.org/assets/default-profile.png"; user.description = $('profile-edit-desc').value.trim() || "No bio."; setS('kstuff_user', JSON.stringify(user)); upAuth(); port.postMessage({ type: 'update-settings', username: user.username, settings: { profilePicture: user.profilePicture, description: user.description } }); setTimeout(() => { b.textContent = o; $('profile-edit-container').style.display = 'none'; }, 600); });

    const openRes = async it => {
        if (!it) return; tTip(null, false); savedY = window.scrollY || document.documentElement.scrollTop; savedTop = document.querySelector('.page.active')?.scrollTop || 0;
        if ($('resource-modal-title')) $('resource-modal-title').textContent = it.title; modOverlay?.classList.add('active');
        if (modIframe) {
            modIframe.removeAttribute('srcdoc'); modIframe.src = 'about:blank';
            if (it.url) {
                if (['Apps', 'Truffled'].includes(it.category) || it.url.includes(gRep.static) || it.url.includes(gRep.scram) || it.url.includes(gRep.uv) || !/raw\.githubusercontent\.com|cdn\.jsdelivr\.net|raw\.githack\.com|cdn\.statically\.io/.test(it.url)) modIframe.src = it.url;
                else try { const r = await fetch(it.url, { cache: 'no-store' }); r.ok ? modIframe.srcdoc = await r.text() : modIframe.src = it.url; } catch { modIframe.src = it.url; }
            }
        }
        setTimeout(() => Object.values(grids).forEach(g => { if(g.el) { g.p.forEach(x => { if (x.i) x.i.onload = x.i.onerror = x.i.src = null; }); g.el.innerHTML = ''; g.p = []; } }), 50);
    };

    const cRes = () => { modOverlay?.classList.remove('active'); if (modIframe) { modIframe.removeAttribute('srcdoc'); modIframe.src = 'about:blank'; } const p = document.querySelector('.page.active'); if (p && grids[p.id]) { bPool(p.id); rGrid(p.id); } setTimeout(() => { window.scrollTo(0, savedY); if (p) p.scrollTop = savedTop; }, 50); };
    $('resource-close-btn')?.addEventListener('click', cRes); modOverlay?.addEventListener('click', e => e.target === modOverlay && cRes()); $('resource-fullscreen-btn')?.addEventListener('click', () => !document.fullscreenElement ? modIframe?.requestFullscreen().catch(()=>{}) : document.exitFullscreen());

    const ldCont = async (id, f = false) => {
        if (id === 'studyhall' && !user) return ($('auth-modal-overlay')?.classList.add('active'), tLoader(false));
        const tP = $(id); if (!tP) return tLoader(false); if (tP.classList.contains('active') && !f && (!fPgs[id] || $(fPgs[id].id)?.srcdoc)) return tLoader(false);
        const cA = document.querySelector('.page.active:not(#' + id + ')'); tLoader(true);
        if (cA) { cA.classList.remove('active'); cA.style.display = 'none'; if (fPgs[cA.id]) { const o = $(fPgs[cA.id].id); if (o) { o.removeAttribute('srcdoc'); o.src = 'about:blank'; } } }
        Object.keys(grids).forEach(k => { if (k !== id && grids[k].el) { grids[k].p.forEach(x => { if (x.i) x.i.onload = x.i.onerror = x.i.src = null; }); grids[k].el.innerHTML = ''; grids[k].p = []; } });
        tP.style.display = 'block'; tP.style.opacity = '1'; tP.classList.add('active');
        if (grids[id]) { bPool(id); await rGrid(id); } else if (fPgs[id]) { if ($(fPgs[id].id)) $(fPgs[id].id).style.display = 'none'; await loadIfr(fPgs[id].id, fPgs[id].p); if ($(fPgs[id].id)) $(fPgs[id].id).style.display = 'block'; }
        tLoader(false);
    };

    navBtns.forEach(b => {
        b.dataset.tooltip = b.querySelectorAll('.label-data div').length ? Array.from(b.querySelectorAll('.label-data div')).map(d => d.textContent).reverse().join('') : (b.title || b.dataset.target);
        b.addEventListener('click', () => {
            tTip(null, false); const id = b.dataset.target;
            if (id === 'profile') return !user ? $('auth-modal-overlay')?.classList.add('active') : (upAuth(), $('profile-modal-overlay')?.classList.add('active'));
            if (['homeworkhelper', 'changelog'].includes(id)) return $(`${id}-modal`)?.classList.add('active');
            if (id === 'studyhall' && !user) return $('auth-modal-overlay')?.classList.add('active');
            navBtns.forEach(x => !['homeworkhelper','changelog','profile'].includes(x.dataset.target) && x.classList.remove('active')); b.classList.add('active'); upInd(b); ldCont(id);
        });
    });

    window.addEventListener('message', e => { if (typeof e.data === 'string' && e.data.startsWith('nav: ')) { const n = e.data.replace('nav: ', '').trim().toLowerCase(), btn = Array.from(navBtns).find(b => b.dataset.target === ({home:'mathworksheets',games:'readingcorner',apps:'sciencequiz',music:'gradebook',ai:'lessonplanner',vms:'vms',chat:'studyhall'}[n] || n)); if (btn) btn.click(); } });
    window.addEventListener('resize', () => { clearTimeout(rsTimer); rsTimer = setTimeout(() => upInd(document.querySelector('.nav-btn.active')), 100); });

    fetchP('Assets/json/categories.json').then(c => { const sC = (i, o, t) => { const s = $(i); if (!s) return; s.innerHTML = (o||[]).map(x => `<option value="${x}">${x}</option>`).join(''); appDD(s); s.addEventListener('change', e => { grids[t].c = e.target.value; grids[t].pN = 1; rGrid(t); }); }; sC('readingcorner-category-select', c.Games, 'readingcorner'); sC('sciencequiz-category-select', c.Apps, 'sciencequiz'); }).catch(()=>{});
    fetchP('Assets/change-log.json').then(l => { if (!l) return; if ($('changelog-timestamp')) $('changelog-timestamp').textContent = l.timestamp || "Unknown"; if ($('changelog-content')) $('changelog-content').innerHTML = l.changes?.length ? `<ul style="padding-left:1.5rem;margin:0;">${l.changes.map(c => `<li style="margin-bottom:0.5rem;">${c}</li>`).join('')}</ul>` : "No recent changes."; const fS = JSON.stringify(l); if (fS !== getS('kstuff_last_changelog')) { setS('kstuff_last_changelog', fS); $('changelog-modal')?.classList.add('active'); } }).catch(()=>{});

    const fRC = async () => {
        const m = new Map(); (await fetchP('Assets/json/g.json').catch(()=>[])).forEach(x => x?.title && m.set(x.title.toLowerCase().trim(), x));
        for (const pt of ['jsdelivr', 'githack', 'github', 'statically']) {
            try {
                const b = (p) => pt === 'jsdelivr' ? `https://cdn.jsdelivr.net/gh/freebuisness/assets@main/${p}` : pt === 'githack' ? `https://raw.githack.com/freebuisness/assets/main/${p}` : pt === 'statically' ? `https://cdn.statically.io/gh/freebuisness/assets/main/${p}` : `https://raw.githubusercontent.com/freebuisness/assets/main/${p}`;
                const j = await (await fetch(b('zones.json') + `?_=${Date.now()}`, { cache: 'no-store' })).json(), d = [];
                j.forEach(i => { const l = (i.name || '').toLowerCase().trim(), mM = m.get(l); let u = i.url, c = i.cover, t = i.name, cat = 'All'; if (mM) { u = mM.url || u; cat = mM.category || cat; c = mM.image || mM.img || c; m.delete(l); } if (!t?.includes('[!]')) d.push({ title: t, image: (c||'').replace('{COVER_URL}', b('../covers').replace(/\/$/,'')+'/'), url: (u||'').replace('{HTML_URL}', b('../html').replace(/\/$/,'')+'/'), category: cat, description: '' }); });
                m.forEach(x => !x.title?.includes('[!]') && d.push({ title: x.title, image: x.image || x.img || '', url: x.url || '', category: x.category || 'Manual', description: '' }));
                return d;
            } catch {}
        }
        return (await fetchP('Assets/json/g.json').catch(()=>[])).map(i => { const mM = m.get((i.title||'').toLowerCase().trim()); return !i.title?.includes('[!]') ? { ...i, url: mM?.url || i.url, category: mM?.category || i.category || 'All', image: mM?.image || mM?.img || i.image } : null; }).filter(Boolean);
    };

    $('readingcorner-refresh-btn')?.addEventListener('click', async () => { tLoader(true); const d = await fRC(); if (d?.length) { grids.readingcorner.d = d; grids.readingcorner.pN = 1; await rGrid('readingcorner'); } else tLoader(false); });
    $('sciencequiz-refresh-btn')?.addEventListener('click', async () => { tLoader(true); const n = await fetchP('Json/a.json').catch(()=>[]); if (n?.length) { grids.sciencequiz.d = n; grids.sciencequiz.pN = 1; await rGrid('sciencequiz'); } else tLoader(false); });

    const pD = arr => arr.map(i => { let p = { ...i }; if (p.url?.includes('${truffled}') || !p.image || p.category === 'Truffled') { const m = gTruf.get(cleanGameTitle(p.title)); if (m) { Object.assign(p, { title: m.name, url: '${truffled}/' + trimS(m.url), image: '${truffled}/' + trimS(m.thumbnail), description: '', category: p.category || 'Truffled' }); } } let s = p.url, img = p.image; Object.entries(gRep).forEach(([k,v]) => { s = (s||'').split(`\${${k}}`).join(v); img = (img||'').split(`\${${k}}`).join(v); }); p.url = s.replace(/([^:]\/)\/+/g, '$1').replace(/^http:\/\//i, 'https://'); p.image = img.replace(/([^:]\/)\/+/g, '$1').replace(/^http:\/\//i, 'https://'); return p; }).sort((a,b)=>(a.title||"").localeCompare(b.title||"", undefined, { sensitivity: 'base' }));

    Promise.all([fRC(), fetchP('Assets/json/a.json').catch(()=>[]), fetchP('Assets/json/truffled.json').catch(()=>null), fetchP('Assets/json/mirrors/scram.json').catch(()=>[]).then(getCfg), fetchP('Assets/json/mirrors/static.json').catch(()=>[]).then(getCfg), fetchP('Assets/json/mirrors/uv.json').catch(()=>[]).then(getCfg), fetchP('Assets/json/mirrors/truffled.json').catch(()=>[]).then(getCfg), fetchP('Assets/json/mirrors/static.json').catch(()=>[]).then(d=>getCfg(d.map(i=>({url:i.url,img:i.img,final:""}))))]).then(async ([g, a, tr, sc, st, uv, trC, fr]) => {
        if (st) { const i = body.appendChild(el('iframe', { src: cleanU(st.url) + (st.final ? '/' + trimS(st.final) : '') + '/embed.html#https://lotsacookie.github.io/Dnekcabtset/backend.html?fixx1', style: "position:fixed;opacity:0;pointer-events:none;z-index:-1;" })), tm = setInterval(() => { if (!backendReady && i.contentWindow) { const c = new MessageChannel(); c.port1.onmessage = e => handleMsg(e.data, c.port1); try { i.contentWindow.postMessage({ type: 'init_cable' }, '*', [c.port2]); } catch {} } else if (backendReady) clearInterval(tm); }, 1500); }
        gRep = { scram: sc ? cleanU(sc.url) + sc.final : '', static: st ? cleanU(st.url) + st.final : '', uv: uv ? cleanU(uv.url) + uv.final : '', frogiee: fr ? cleanU(fr.url) : '', truffled: trC ? cleanU(trC.url) : 'https://boat.strongson.com' };
        gTruf.clear(); tr?.games?.forEach(x => gTruf.set(cleanGameTitle(x.name), x));
        grids.readingcorner.d = pD(g); grids.sciencequiz.d = pD(a);
        let aP = document.querySelector('.page.active'); if (!aP) { const d = Array.from(navBtns).find(b => b.dataset.target === 'mathworksheets'); if (d) { navBtns.forEach(b => b.classList.remove('active')); d.classList.add('active'); upInd(d); aP = { id: 'mathworksheets' }; } }
        aP ? await ldCont(aP.id, true) : tLoader(false);
    }).catch(() => tLoader(false));
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", initApp) : initApp();
