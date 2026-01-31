document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('volumeSlider');
    const valueDisplay = document.getElementById('volumeValue');

    if (!slider || !valueDisplay) return;

    function updateDisplay(value) {
        const percentage = Math.round(value * 100);
        valueDisplay.textContent = `${percentage}%`;
    }

    // Initialize: Get current volume from active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;

        chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_VOLUME' }, (response) => {
            if (chrome.runtime.lastError) {
                // Content script might not be injected on this page (e.g. chrome:// urls)
                // Just default to 100%
                return;
            }
            if (response && response.value) {
                slider.value = response.value;
                updateDisplay(response.value);
            }
        });
    });

    // Event: Slider change
    slider.addEventListener('input', () => {
        const value = slider.value;
        updateDisplay(value);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'SET_VOLUME',
                value: value
            });
        });
    });
});
