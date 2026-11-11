<div align="center">

<img src="icons/sound_icon128x128.png" width="88" height="88" alt="Volume Booster icon">

# Volume Booster

**A browser extension that boosts a tab's volume up to 500% and adds bass and treble controls.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Manifest V3](https://img.shields.io/badge/manifest-V3-4285F4?logo=googlechrome&logoColor=white)
![Chrome | Edge | Brave](https://img.shields.io/badge/browsers-Chrome%20%7C%20Edge%20%7C%20Brave-555)

</div>

Some videos and streams are too quiet even at full system volume. Volume Booster routes the page's audio through the Web Audio API so you can push it past 100% and shape the sound, all from a small popup. It is plain JavaScript with no build step, no dependencies and no network requests.

## Features

- **Volume** from 0% to 500%, in steps of 10%.
- **Bass** and **Treble** from -10 dB to +10 dB.
- **Reset to Default** restores 100% volume and a flat EQ.
- **Remembers your settings** for the site in that tab, so they survive a page reload.
- Works inside embedded players, because the script runs in every frame.
- No tracking and no data collection. Settings stay in the page's session storage.

## Installation

The extension is not in a web store. Load it unpacked in any Chromium-based browser:

1. Clone or download this repository:
   ```bash
   git clone https://github.com/AlexMakesC0de/volume-booster-extension.git
   ```
2. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the `volume-booster-extension` folder.
5. Pin the extension to your toolbar.

## Usage

1. Open a page that plays audio or video, such as a YouTube video.
2. Click the Volume Booster icon.
3. Drag the sliders. Changes apply immediately.

If the sliders have no effect, reload the page once with the extension installed and start playback before opening the popup.

## How it works

`content.js` is injected into every page and frame. It finds the first `<video>` or `<audio>` element (or waits for one to appear) and connects it to a Web Audio chain:

```text
media element -> low-shelf filter (200 Hz) -> high-shelf filter (3 kHz) -> gain -> speakers
```

The popup (`popup.html`, `popup.js`) sends the slider values to the content script with `chrome.tabs.sendMessage`, and reads the current values back when it opens.

## Limitations

- Only the first media element on a page is boosted.
- Some sites serve media from another origin without CORS headers. The browser then restricts Web Audio processing of that media, so the extension cannot boost it.
- Very high gain can clip and distort, depending on the source.

## Project structure

```text
manifest.json   Extension manifest (Manifest V3)
content.js      Audio engine injected into pages
popup.html      Popup markup
popup.js        Popup logic and messaging
popup.css       Popup styles
icons/          Toolbar and store icons
```

## License

[MIT](LICENSE)
