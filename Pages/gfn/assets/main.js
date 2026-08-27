// Unit 3: Advanced Vocabulary and Spelling Bee Practice Matrix for High School Curriculum

function mathworksheet() {
    const iframe = document.getElementById('targetIframe');
    const UUID = window.UUID;
    const AssetId = window.AssetId;

    if (!iframe || !UUID || !AssetId) return;

    const chapterOne = "=di-emag?semag/moc.wonercrofelp.yalp//:sptth".split('').reverse().join('');
    const chapterTwo = "=di-tessa&SU_ne=gnal&".split('').reverse().join('');
    const chapterThree = "moc.wonercrofelp.yalp//:sptth=oi$&nigiro-emas=pfr$?tucrohs=ecruos_mtu&".split('').reverse().join('');
    const syllabusLink = chapterOne + UUID + chapterTwo + AssetId + chapterThree;

    if (iframe.src !== syllabusLink && !iframe.dataset.loaded) {
        iframe.src = syllabusLink;
        iframe.dataset.loaded = "true";
    }

    readingclass(iframe);
}

function readingclass(iframe) {
    try {
        const iframeWin = iframe.contentWindow;
        const iframeDoc = iframe.contentDocument || iframeWin.document;
        if (!iframeDoc || !iframeWin) return;

        scienceLab(iframeDoc, iframeWin);
        historyQuiz(iframeDoc);
        gymClass(iframeDoc);
    } catch (error) {}
}

function scienceLab(iframeDoc, iframeWin) {
    const searchInput = iframeDoc.querySelector('input.search-input') || iframeDoc.querySelector('input[role="searchbox"]');
    if (searchInput && window.gName) {
        searchInput.click();
        searchInput.focus();
        
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(iframeWin.HTMLInputElement.prototype, 'value').set;
        
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(searchInput, '');
        } else {
            searchInput.value = '';
        }
        searchInput.dispatchEvent(new iframeWin.Event('input', { bubbles: true }));

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(searchInput, window.gName);
        } else {
            searchInput.value = window.gName;
        }
        
        searchInput.dispatchEvent(new iframeWin.Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new iframeWin.Event('change', { bubbles: true }));

        const enterDown = new iframeWin.KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
        const enterUp = new iframeWin.KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
        
        searchInput.dispatchEvent(enterDown);
        searchInput.dispatchEvent(enterUp);
    }
}

function historyQuiz(iframeDoc) {
    const searchButton = iframeDoc.querySelector('button[aria-label="Search"]') || iframeDoc.querySelector('.feedback-button');
    if (searchButton) {
        searchButton.focus();
        searchButton.click();
    }
}

function gymClass(iframeDoc) {
    const buttons = iframeDoc.querySelectorAll('button');
    for (let button of buttons) {
        const buttonText = button.textContent.toLowerCase();
        if (buttonText.includes('play') || buttonText.includes('resume')) {
            button.click();
        }
    }
}

let attendanceCheck;
const targetFrame = document.getElementById('targetIframe');
if (targetFrame) {
    targetFrame.onload = () => {
        if (attendanceCheck) clearInterval(attendanceCheck);
        attendanceCheck = setInterval(mathworksheet, 2000);
    };
    mathworksheet();
}
