const iframe = document.getElementById('targetIframe');
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
    
    if (document.readyState === 'complete' || iframe.contentDocument) {
        if (!searchInterval) searchInterval = setInterval(findAndClickPlay, 3000);
    }
}
