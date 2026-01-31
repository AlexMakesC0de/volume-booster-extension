// Volume Booster - Content Script

(function () {
    let audioCtx;
    let gainNode;
    let bassNode;
    let trebleNode;
    let source;

    function initAudioEngine() {
        if (audioCtx) return; // Audio Context already exists

        // Try to find media element
        const mediaElement = document.querySelector('video') || document.querySelector('audio');

        if (!mediaElement) {
            // Not found yet? Watch for it.
            if (!window._observerActive) {
                const observer = new MutationObserver(() => {
                    const el = document.querySelector('video') || document.querySelector('audio');
                    if (el) {
                        observer.disconnect();
                        window._observerActive = false;
                        initAudioEngine();
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
                window._observerActive = true;
            }
            return;
        }

        try {
            // Cross-browser AudioContext
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();

            try {
                source = audioCtx.createMediaElementSource(mediaElement);

                // Create nodes
                bassNode = audioCtx.createBiquadFilter();
                bassNode.type = 'lowshelf';
                bassNode.frequency.value = 200;

                trebleNode = audioCtx.createBiquadFilter();
                trebleNode.type = 'highshelf';
                trebleNode.frequency.value = 3000;

                gainNode = audioCtx.createGain();

                // Connect: Source -> Bass -> Treble -> Gain -> Destination
                source.connect(bassNode);
                bassNode.connect(trebleNode);
                trebleNode.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                console.log("Volume Booster: Audio engine initialized in frame:", window.location.href);

                // Restore settings if present
                restoreSettings();

            } catch (e) {
                console.warn("Volume Booster: Unable to hook into media element (likely CORS restriction).", e);
                audioCtx = null;
            }

        } catch (e) {
            console.error("Volume Booster: Initialization error.", e);
        }
    }

    function restoreSettings() {
        if (sessionStorage.getItem('volume-booster-gain')) {
            const val = parseFloat(sessionStorage.getItem('volume-booster-gain'));
            if (gainNode) gainNode.gain.value = val;
        }
        if (sessionStorage.getItem('volume-booster-bass')) {
            const val = parseFloat(sessionStorage.getItem('volume-booster-bass'));
            if (bassNode) bassNode.gain.value = val;
        }
        if (sessionStorage.getItem('volume-booster-treble')) {
            const val = parseFloat(sessionStorage.getItem('volume-booster-treble'));
            if (trebleNode) trebleNode.gain.value = val;
        }
    }

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAudioEngine);
    } else {
        initAudioEngine();
    }

    function resumeAudioCtx() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Listen for messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Try to init if not ready
        if (!audioCtx) initAudioEngine();

        if (request.action === 'SET_VOLUME') {
            const val = parseFloat(request.value);
            if (gainNode) {
                gainNode.gain.value = val;
                resumeAudioCtx();
                sessionStorage.setItem('volume-booster-gain', val);
            }
        } else if (request.action === 'SET_BASS') {
            const val = parseFloat(request.value);
            if (bassNode) {
                bassNode.gain.value = val;
                resumeAudioCtx();
                sessionStorage.setItem('volume-booster-bass', val);
            }
        } else if (request.action === 'SET_TREBLE') {
            const val = parseFloat(request.value);
            if (trebleNode) {
                trebleNode.gain.value = val;
                resumeAudioCtx();
                sessionStorage.setItem('volume-booster-treble', val);
            }
        } else if (request.action === 'RESET') {
            if (gainNode) gainNode.gain.value = 1;
            if (bassNode) bassNode.gain.value = 0;
            if (trebleNode) trebleNode.gain.value = 0;

            sessionStorage.removeItem('volume-booster-gain');
            sessionStorage.removeItem('volume-booster-bass');
            sessionStorage.removeItem('volume-booster-treble');
            console.log("Volume Booster: Reset to defaults.");
        } else if (request.action === 'GET_STATE') {
            // Only respond if we actually have an active audio engine
            // This prevents empty frames from sending "default" zero values and overriding the actual player frame
            if (gainNode && audioCtx) {
                sendResponse({
                    volume: gainNode.gain.value,
                    bass: (bassNode && bassNode.gain) ? bassNode.gain.value : 0,
                    treble: (trebleNode && trebleNode.gain) ? trebleNode.gain.value : 0
                });
            }
        }
    });
})();
