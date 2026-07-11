# Privacy Policy — JustHot

**Last updated: July 2026**

## What JustHot does

JustHot is a Chrome extension that mutes ad breaks on Hotstar live streams and fast-forwards ads on Amazon Prime Video.

## Data collection

JustHot collects **no user data** of any kind.

- No personal information is collected, stored, or transmitted.
- No browsing history, page content, or usage analytics are recorded.
- No data is sent to any external server.

## Local storage

JustHot stores two values locally on your device using `chrome.storage.local`:

| Key | Value | Purpose |
|-----|-------|---------|
| `hotstarEnabled` | `true` / `false` | Remember your Hotstar toggle state |
| `primeEnabled` | `true` / `false` | Remember your Prime Video toggle state |

These values never leave your device.

## Permissions used

| Permission | Why it is needed |
|-----------|-----------------|
| `storage` | Save your on/off toggle preferences locally |
| `webRequest` | Monitor Hotstar's ad-impression tracking URL to detect when a live-stream ad break starts |
| `tabs` | Mute and unmute the Hotstar browser tab during detected ad breaks |
| Host permissions (hotstar.com, primevideo.com, amazon.com, etc.) | Inject content scripts that detect ad UI on the page |

## Contact

Questions or concerns: [feelfreewithnu@gmail.com](mailto:feelfreewithnu@gmail.com)
