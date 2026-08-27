const iframe = document.getElementById('targetIframe');

if (iframe && window.gameId) {
    iframe.src = 'https://play.geforcenow.com/games?game-id=' + window.gameId;
}

let searchInterval;
let videoCheckInterval;

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

function initIframeLogic() {
    try {
        const iframeWin = iframe.contentWindow;
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc || !iframeWin) return;

        try {
            iframeWin.Object.defineProperty(iframeDoc, 'hidden', { get: () => false, configurable: true });
        } catch (e) {}

        function checkForVideo() {
            const video = iframeDoc.getElementById('preStreamVideo');
            if (video) {
                video.style.width = '0.1px';
                video.style.height = '0.1px';
                video.muted = true;
                const observer = new iframeWin.MutationObserver(() => {
                    if (!iframeDoc.contains(video)) {
                        observer.disconnect();
                    }
                });
                observer.observe(iframeDoc.body, { childList: true, subtree: true });
            }
        }

        if (!videoCheckInterval) {
            videoCheckInterval = setInterval(() => {
                try {
                    if (iframeDoc.getElementById('preStreamVideo')) {
                        clearInterval(videoCheckInterval);
                        checkForVideo();
                    }
                } catch (e) {}
            }, 1000);
        }
    } catch (error) {
        
    }
}

if (iframe) {
    iframe.onload = () => {
        if (searchInterval) clearInterval(searchInterval);
        searchInterval = setInterval(findAndClickPlay, 3000);
        setInterval(initIframeLogic, 1000);
    };
}
