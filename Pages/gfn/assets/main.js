const iframe = document.getElementById('targetIframe');

if (iframe && window.gameId && window.assetId) {
    iframe.src = 'https://play.geforcenow.com/games?game-id=' + window.gameId + 
                 '&lang=en_US&asset-id=' + window.assetId + 
                 '&utm_source=shortcut?$rfp=same-origin&$io=https://play.geforcenow.com';
}

let searchInterval;
function findAndClickPlay() {
    if (!iframe) return;

    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc) return;

        const buttons = iframeDoc.querySelectorAll('button');
        for (let button of buttons) {
            if (button.textContent.toLowerCase().includes('play')) {
                button.click();
                return; 
            }
        }
    } catch (error) {
        
    }
}

if (iframe) {
    iframe.onload = () => {
        if (searchInterval) clearInterval(searchInterval);
        searchInterval = setInterval(findAndClickPlay, 3000);
    };
}
