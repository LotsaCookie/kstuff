const iframe = document.getElementById('targetIframe');

if (iframe && window.gameId && window.assetId) {
    iframe.src = 'https://play.geforcenow.com/games?game-id=' + window.gameId + 
                 '&lang=en_US&asset-id=' + window.assetId + 
                 '&utm_source=shortcut?$rfp=same-origin&$io=https://play.geforcenow.com';
}

let automationInterval;

function performAutomation() {
    if (!iframe) return;

    try {
        const iframeWin = iframe.contentWindow;
        const iframeDoc = iframe.contentDocument || iframeWin.document;
        if (!iframeDoc || !iframeWin) return;

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

        const searchButton = iframeDoc.querySelector('button[aria-label="Search"]') || iframeDoc.querySelector('.feedback-button');
        if (searchButton) {
            searchButton.focus();
            searchButton.click();
        }

        const buttons = iframeDoc.querySelectorAll('button');
        for (let button of buttons) {
            const buttonText = button.textContent.toLowerCase();
            if (buttonText.includes('play') || buttonText.includes('resume')) {
                button.click();
            }
        }

    } catch (error) {}
}

if (iframe) {
    iframe.onload = () => {
        if (automationInterval) clearInterval(automationInterval);
        automationInterval = setInterval(performAutomation, 2000);
    };
}
