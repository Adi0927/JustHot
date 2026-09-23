<div align="center">
  <img src="icons/icon128.png" width="88" alt="JustHot logo" />
  <h1>JustHot</h1>
  <p><strong>Auto-mutes ads on Hotstar, Zee5, SonyLIV, Airtel Xtream,<br/>Netflix &amp; HBO Max. Fast-forwards Prime Video ads.<br/>So you never have to lose your cool.</strong></p>
  <p>
    <a href="https://chromewebstore.google.com/detail/justhot/ighfnhjcjdohmphddhcmgliedmiaeeaf"><img src="https://img.shields.io/badge/Add_to_Chrome-Free-ff7a00?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Add to Chrome — free" /></a>
  </p>
  <a href="https://chromewebstore.google.com/detail/justhot/ighfnhjcjdohmphddhcmgliedmiaeeaf"><img src="https://img.shields.io/chrome-web-store/v/ighfnhjcjdohmphddhcmgliedmiaeeaf?style=flat-square&color=orange&label=chrome%20web%20store" alt="Chrome Web Store version" /></a>
  <img src="https://img.shields.io/badge/Manifest-V3-orange?style=flat-square" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/license-MIT-orange?style=flat-square" alt="MIT license" />
</div>

---

## Install

**[Add JustHot from the Chrome Web Store →](https://chromewebstore.google.com/detail/justhot/ighfnhjcjdohmphddhcmgliedmiaeeaf)**

Free. Works in Chrome, Edge, Brave, Opera and Vivaldi. After installing, click the
JustHot icon in your toolbar and switch on the platforms you watch — every
platform starts off.

<details>
<summary>Install from source instead</summary>

1. Download this repository (**Code → Download ZIP**) and unzip it
2. Open `chrome://extensions` (or `edge://extensions` in Edge)
3. Turn on **Developer mode**
4. Click **Load unpacked** and select the unzipped folder

</details>

---

## Product details

JustHot is a lightweight Chrome extension (Manifest V3) built for streaming viewers who are tired of ad interruptions. It runs silently in the background — no accounts, no setup, no data collection.

- **Version:** 5.2.1
- **Size:** ~120 KB
- **Platform:** Google Chrome (Manifest V3)

### Browser compatibility

| Browser | Works? | Notes |
|---------|--------|-------|
| Chrome | ✅ Yes | Primary platform |
| Edge | ✅ Yes | Install from the Chrome Web Store; allow extensions from other stores when Edge asks |
| Brave | ✅ Yes | Install directly from Chrome Web Store |
| Opera | ✅ Yes | Enable "Install Chrome Extensions" first |
| Vivaldi | ✅ Yes | Chrome extensions work out of the box |
| Firefox | 🚧 WIP | Coming soon.. |
| Safari | 🚧 WIP | Coming soon... |

---

## Logo and brand identity

| Asset | Usage |
|-------|-------|
| <img src="icons/icon48.png" width="28" /> | Active state (any platform enabled) |
| <img src="icons/icon48-gray.png" width="28" /> | Inactive state (all platforms off) |

Primary color: `#ff7a00` — used for the active toggle pill and brand accent.  
Background: `#0f1014` — deep dark, easy on the eyes during night matches.

---

## Features

### Hotstar — Live Match Ad Muting
- Detects ad breaks in real time using Hotstar's ad-impression tracking signal
- Mutes the browser tab the instant an ad starts
- Unmutes automatically when the match resumes
- Parses ad duration from the tracking URL for precise timing

### Zee5 — Ad Muting

- Detects ad breaks in real time using DOM signals in the Zee5 player
- Mutes the video the instant an ad starts
- Unmutes automatically when content resumes
- Works despite Zee5's SSAI architecture (AWS MediaTailor server-side ad stitching)

### SonyLIV — Ad Muting

- Detects ad breaks from the Google IMA SDK markers SonyLIV's player exposes
- Mutes every video element for the break, since IMA plays ads in a separate element
- Unmutes automatically when content resumes

### Airtel Xtream — Ad Muting

- Detects ad breaks in real time using DOM signals in the Xtream player
- Mutes the video the instant an ad starts
- Unmutes automatically when content resumes

### Netflix — Ad Muting

- Targets the ad-supported tier
- Detects ads via Netflix's `data-uia` attribute hooks and ad-countdown text
- Mutes every video element for the break, unmutes when content resumes

### HBO Max — Ad Muting

- Covers `max.com` and `hbomax.com`
- Mutes ad breaks detected from player and ad-countdown signals
- Works despite HBO Max stitching ads into the stream server-side (Brightline SSAI)

### Prime Video — Ad Fast-Forward
- Detects Prime Video ad UI using DOM selectors and text patterns
- Speeds through ads at 16× playback (muted)
- Clicks visible ad-skip buttons automatically (leaves Skip Intro/Recap alone)
- Restores original playback speed and audio the moment the show resumes
- Restores every video element it touched, so a player that swaps `<video>` nodes
  mid-break cannot leave one running fast
- Gives up after 3 minutes of continuous skipping, so a mis-detected ad can never
  fast-forward the show itself

### Independent Controls
Each platform has its own On/Off toggle — enabling one does not affect the others.

---

## Response times

Muting is immediate; unmuting waits 0.6s to confirm the break really ended, so a
flicker in the player's ad UI cannot let a burst of ad audio through.

| Platform | Mute | Unmute |
|----------|------|--------|
| Hotstar | instant | 0.6 – 0.85 s |
| Prime Video | 0 – 0.25 s | 0.6 – 0.85 s |
| Zee5 | 0 – 0.25 s | 0.6 – 0.85 s |
| SonyLIV | 0 – 0.25 s | 0.6 – 0.85 s |
| Airtel Xtream | 0 – 0.25 s | 0.6 – 0.85 s |
| Netflix | 0 – 0.25 s | 0.6 – 0.85 s |
| HBO Max | 0 – 0.25 s | 0.6 – 0.85 s |

Hotstar mutes at zero because it watches the ad-impression request rather than
the screen. The rest have no such signal — their ads are stitched into the video
stream — so they read the player's DOM instead.

On Prime Video the two halves are separate: normal speed resumes the instant the
ad clears, while audio waits out the same 0.6s. Delaying the speed too would
spend 0.6s at 16×, skipping roughly 10 seconds of the show.

---

## Platform status

All seven platforms are verified working on live ad breaks as of v5.2.1.

| Platform | Status |
|----------|--------|
| Hotstar | ✅ Verified |
| Prime Video | ✅ Verified |
| Zee5 | ✅ Verified |
| SonyLIV | ✅ Verified |
| Airtel Xtream | ✅ Verified |
| Netflix | ✅ Verified |
| HBO Max | ✅ Verified |

### Known limitations

Ad detection reads the player's page, so a redesign by a streaming service can
stop JustHot recognising its ad breaks until the extension is updated. If muting
stops working on a platform, please report it and include what the player showed
on screen.

Nothing here blocks ads or touches DRM — the extension only mutes audio and, on
Prime Video, changes playback speed.

---

## Support and queries

Found a bug? Ad slipping through? Feature idea?

Reach out at **[feelfreewithnu@gmail.com](mailto:feelfreewithnu@gmail.com)**

Please include:
- Browser version
- Which platform (Hotstar / Prime Video / Zee5 / SonyLIV / Airtel Xtream / Netflix / HBO Max)
- What happened vs. what you expected

---

## Open source policy

JustHot is open source under the [MIT License](LICENSE). You are free to use, study, and fork this code. The source is published for transparency — particularly so users and reviewers can verify that no data is collected or transmitted.

This is a personal project, not a company product. Contributions are welcome but selective — see below.

---

## Contribution and selection policy

Pull requests are reviewed and merged at the maintainer's discretion. To keep things focused:

**Will consider:**
- Bug fixes with clear reproduction steps
- Improved ad detection selectors for any supported platform
- Performance improvements with measurable impact

**Out of scope:**
- Adding new platforms (for now)
- UI redesigns
- Feature additions not discussed in an issue first

**How to contribute:**
1. Open an issue first — describe the problem or idea
2. Wait for maintainer acknowledgment before writing code
3. Fork, make changes, open a PR referencing the issue
4. All PRs require review approval before merge

---

## Privacy policy

JustHot collects **no user data**. The only local storage used is your on/off toggle preference per platform — it never leaves your device.

Full details: [PRIVACY.md](PRIVACY.md)

---

<div align="center">
  <a href="https://chromewebstore.google.com/detail/justhot/ighfnhjcjdohmphddhcmgliedmiaeeaf"><img src=".github/social-preview.png" width="100%" alt="JustHot — Auto-mutes or Fast-forwards ads on seven streaming platforms." /></a>
</div>

---

<div align="center">
  <sub>© 2026 NUBEGINNINGS INDIA PRIVATE LIMITED · MIT License</sub>
</div>
