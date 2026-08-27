const iframe = document.getElementById('targetIframe');

if (iframe && window.gameId) {
    iframe.src = 'https://play.geforcenow.com/games?game-id=' + window.gameId;
}

let searchInterval;

function findAndClickPlay() {
    if (!iframe) return;

    try {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDocument) return;

        const buttons = iframeDocument.querySelectorAll('button');
        for (let button of buttons) {
            if (button.textContent.toLowerCase().includes('play')) {
                button.click();
                return; 
            }
        }
    } catch (error) {
        clearInterval(searchInterval);
    }
}

if (iframe) {
    iframe.onload = () => {
        if (searchInterval) clearInterval(searchInterval);
        searchInterval = setInterval(findAndClickPlay, 3000);
    };
}
