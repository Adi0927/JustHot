<div align="center">
  <img src="icons/icon128.png" width="88" alt="JustHot logo" />
  <h1>JustHot</h1>
  <p><strong>Auto-mutes ads on Hotstar, Zee5, SonyLIV, Airtel Xtream,<br/>Netflix &amp; HBO Max. Fast-forwards Prime Video ads.<br/>So you never have to lose your cool.</strong></p>
  <img src="https://img.shields.io/badge/Manifest-V3-orange?style=flat-square" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/version-5.2.0-orange?style=flat-square" alt="v5.2.0" />
  <img src="https://img.shields.io/badge/license-MIT-orange?style=flat-square" alt="MIT license" />
</div>

---

## Product details

JustHot is a lightweight Chrome extension (Manifest V3) built for streaming viewers who are tired of ad interruptions. It runs silently in the background — no accounts, no setup, no data collection.

- **Version:** 5.2.0
- **Size:** < 50 KB
- **Platform:** Google Chrome (Manifest V3)

### Browser compatibility

| Browser | Works? | Notes |
|---------|--------|-------|
| Chrome | ✅ Yes | Primary platform |
| Edge | ✅ Yes | Install directly from Chrome Web Store |
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

### Netflix — Ad Muting (best-effort)

- Targets the ad-supported tier
- Detects ads via Netflix's `data-uia` attribute hooks and ad-countdown text
- Mutes every video element for the break, unmutes when content resumes
- Netflix hashes its CSS class names and is flagged `$generichide` in the public
  filter lists, so there is no published selector for an in-stream ad break. This
  one is unverified against a live ad tier — see Known limitations.

### HBO Max — Ad Muting (best-effort)

- Covers `max.com` and `hbomax.com`
- Mutes ad breaks detected from player and ad-countdown signals
- HBO Max stitches ads server-side (Brightline SSAI) and is also flagged
  `$generichide`, so this one is likewise unverified — see Known limitations.

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

## Known limitations

Ad detection reads the page, so it depends on what each player puts in the DOM.

- **Hotstar, Prime Video, Zee5** — detection is built on signals confirmed against
  those players and is the most reliable of the set.
- **SonyLIV, Airtel Xtream** — detection uses the Google IMA / GPT / JW / Video.js
  ad markers that these players expose, taken from the public uBlock Origin and
  AdGuard filter lists rather than guessed.
- **Netflix, HBO Max** — best-effort. Both are marked `$generichide` in those same
  lists, meaning generic ad-class selectors are known to misfire on them, and
  neither publishes a selector for an in-stream ad break. If muting does not
  trigger on an ad there, that is the reason; please report it and include what
  the player showed on screen.

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
  <img src=".github/social-preview.png" width="100%" alt="JustHot — Auto-mutes ads on six streaming platforms. Fast-forwards Prime Video ads." />
</div>

---

<div align="center">
  <sub>© 2026 NUBEGINNINGS INDIA PRIVATE LIMITED · MIT License</sub>
</div>
