document.addEventListener('DOMContentLoaded', () => {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const bassSlider = document.getElementById('bassSlider');
    const bassValue = document.getElementById('bassValue');
    const trebleSlider = document.getElementById('trebleSlider');
    const trebleValue = document.getElementById('trebleValue');

    if (!volumeSlider || !volumeValue) return;

    function updateDisplay(vol) {
        const percentage = Math.round(vol * 100);
        volumeValue.textContent = `${percentage}%`;
    }

    // Initialize: Get current state from active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        const tabId = tabs[0].id;

        function checkConnection() {
            chrome.tabs.sendMessage(tabId, { action: 'GET_STATE' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("Volume Booster: Content script not ready. Injecting...");
                    // Content script likely not injected -> Inject it now (Hot Injection)
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['content.js']
                    }, () => {
                        if (chrome.runtime.lastError) {
                            console.error("Volume Booster: Injection failed.", chrome.runtime.lastError);
                        } else {
                            // Retry after short delay (let script initialize)
                            setTimeout(checkConnection, 50);
                        }
                    });
                    return;
                }

                if (response) {
                    if (response.volume !== undefined) {
                        volumeSlider.value = response.volume;
                        updateDisplay(response.volume);
                    }
                    if (response.bass !== undefined) {
                        bassSlider.value = response.bass;
                        bassValue.textContent = `${response.bass}dB`;
                    }
                    if (response.treble !== undefined) {
                        trebleSlider.value = response.treble;
                        trebleValue.textContent = `${response.treble}dB`;
                    }
                }
            });
        }
        checkConnection();
    });

    // Volume Change
    volumeSlider.addEventListener('input', () => {
        const value = volumeSlider.value;
        updateDisplay(value);
        sendMessage('SET_VOLUME', value);
    });

    // Bass Change
    bassSlider.addEventListener('input', () => {
        const value = bassSlider.value;
        bassValue.textContent = `${value}dB`;
        sendMessage('SET_BASS', value);
    });

    // Treble Change
    trebleSlider.addEventListener('input', () => {
        const value = trebleSlider.value;
        trebleValue.textContent = `${value}dB`;
        sendMessage('SET_TREBLE', value);
    });

    // Reset Click
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // Update UI
            volumeSlider.value = 1;
            updateDisplay(1);
            bassSlider.value = 0;
            bassValue.textContent = '0dB';
            trebleSlider.value = 0;
            trebleValue.textContent = '0dB';

            // Send Message
            sendMessage('RESET', null);
        });
    }

    function sendMessage(action, value) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;
            chrome.tabs.sendMessage(tabs[0].id, {
                action: action,
                value: value
            });
        });
    }
});
