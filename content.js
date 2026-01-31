// Volume Booster - Content Script

(function () {
    let audioCtx;
    let gainNode;
    let bassNode;
    let trebleNode;
    let source;

    function initAudioEngine() {
        if (audioCtx) return; // Singleton

        try {
            const mediaElement = document.querySelector('video') || document.querySelector('audio');
            if (!mediaElement) {
                return;
            }

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

                console.log("Volume Booster: Audio engine initialized.");
            } catch (e) {
                console.warn("Volume Booster: Unable to hook into media element (likely CORS restriction).", e);
                audioCtx = null;
            }

        } catch (e) {
            console.error("Volume Booster: Initialization error.", e);
        }
    }

    // Initialize on load
    initAudioEngine();

    // Restore volume and EQ from session storage
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

    function resumeAudioCtx() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Listen for messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
        } else if (request.action === 'GET_STATE') {
            sendResponse({
                volume: (gainNode && gainNode.gain) ? gainNode.gain.value : 1,
                bass: (bassNode && bassNode.gain) ? bassNode.gain.value : 0,
                treble: (trebleNode && trebleNode.gain) ? trebleNode.gain.value : 0
            });
        }
    });
})();
