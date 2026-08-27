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
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc) return;

        const searchInput = iframeDoc.querySelector('input.search-input') || iframeDoc.querySelector('input[role="searchbox"]');
        if (searchInput && window.gName) {
            searchInput.focus();
            
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(searchInput, window.gName);
            } else {
                searchInput.value = window.gName;
            }
            
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const searchButton = iframeDoc.querySelector('button[aria-label="Search"]') || iframeDoc.querySelector('.feedback-button');
        if (searchButton) {
            searchButton.focus();
            searchButton.click();
        }

        const buttons = iframeDoc.querySelectorAll('button');
        for (let button of buttons) {
            if (button.textContent.toLowerCase().includes('play')) {
                button.click();
            }
        }

    } catch (error) {
        
    }
}

if (iframe) {
    iframe.onload = () => {
        if (automationInterval) clearInterval(automationInterval);
        automationInterval = setInterval(performAutomation, 2000);
    };
}
