// Volume Booster - Content Script

(function() {
    let audioCtx;
    let gainNode;
    let source;

    function initAudioEngine() {
        if (audioCtx) return; // Singleton

        try {
            const mediaElement = document.querySelector('video') || document.querySelector('audio');
            if (!mediaElement) {
                // No media found yet, user might interact later.
                // We'll retry when asked to set volume if still null, or we can observe dom.
                // For now, simple approach: check on demand or when media plays ideally. 
                // But the user requirements say "Find the first <video> or <audio>".
                // We'll rely on the messaging to trigger/re-check if needed or just initialize lazily.
                return; 
            }

            // Cross-browser AudioContext
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
            
            // Create a wrapper to safely hook into the media element
            // We use a try-catch because if the media has cross-origin issues (CORS),
            // createMediaElementSource will fail.
            try {
                source = audioCtx.createMediaElementSource(mediaElement);
                gainNode = audioCtx.createGain();
                
                source.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                
                console.log("Volume Booster: Audio engine initialized.");
            } catch (e) {
                console.warn("Volume Booster: Unable to hook into media element (likely CORS restriction).", e);
                // Clean up to try again content later if needed
                audioCtx = null;
            }

        } catch (e) {
            console.error("Volume Booster: Initialization error.", e);
        }
    }

    // Initialize on load, but also possibly lazily when user interacts
    initAudioEngine();

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'SET_VOLUME') {
            const volume = parseFloat(request.value);
            
            // Ensure engine is ready (in case video loaded dynamically)
            if (!audioCtx) initAudioEngine();

            if (gainNode && audioCtx) {
                gainNode.gain.value = volume;
                // Safely resume if suspended (browser autoplay policies)
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                console.log(`Volume set to: ${volume}`);
            } else {
                 console.log("Volume Booster: No active audio context to control.");
            }
        } else if (request.action === 'GET_VOLUME') {
            // Return current gain or default 1 (100%)
            const currentVol = (gainNode && gainNode.gain) ? gainNode.gain.value : 1;
            sendResponse({ value: currentVol });
        }
    });
})();
