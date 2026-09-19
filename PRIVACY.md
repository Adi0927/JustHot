# Privacy Policy — JustHot

**Last updated: September 2026**

## What JustHot does

JustHot is a Chrome extension that mutes ad breaks on Hotstar, Zee5, SonyLIV,
Airtel Xtream, Netflix and HBO Max, and fast-forwards ads on Amazon Prime Video.
Each platform has its own on/off toggle and all of them are off until you turn
them on.

## Data collection

JustHot collects **no user data** of any kind.

- No personal information is collected, stored, or transmitted.
- No browsing history, page content, or usage analytics are recorded.
- No data is sent to any external server.

## Local storage

JustHot stores one value per platform locally on your device using
`chrome.storage.local`. Each is a simple on/off flag — nothing else is stored:

| Key | Value | Purpose |
|-----|-------|---------|
| `hotstarEnabled` | `true` / `false` | Remember your Hotstar toggle state |
| `primeEnabled` | `true` / `false` | Remember your Prime Video toggle state |
| `zee5Enabled` | `true` / `false` | Remember your Zee5 toggle state |
| `sonylivEnabled` | `true` / `false` | Remember your SonyLIV toggle state |
| `airtelEnabled` | `true` / `false` | Remember your Airtel Xtream toggle state |
| `netflixEnabled` | `true` / `false` | Remember your Netflix toggle state |
| `hbomaxEnabled` | `true` / `false` | Remember your HBO Max toggle state |

These values never leave your device.

## Permissions used

| Permission | Why it is needed |
|-----------|-----------------|
| `storage` | Save your on/off toggle preferences locally |
| `webRequest` | Monitor Hotstar's ad-impression tracking URL to detect when a live-stream ad break starts. Used for Hotstar only, and only to read the ad's name and duration from that one URL |
| `tabs` | Mute and unmute the Hotstar browser tab during detected ad breaks |
| Host permissions | Inject content scripts that detect ad UI on the page |

### Sites JustHot can access

JustHot runs only on the sites below, and only the ones whose toggle you have
turned on. It has no access to any other site you visit.

| Platform | Sites |
|----------|-------|
| Hotstar | `hotstar.com`, `jiohotstar.com`, `bifrost-api.hotstar.com` |
| Prime Video | `primevideo.com`, `amazon.com/gp/video/`, `amazon.in/gp/video/` |
| Zee5 | `zee5.com` |
| SonyLIV | `sonyliv.com` |
| Airtel Xtream | `airtelxstream.in` |
| Netflix | `netflix.com` |
| HBO Max | `max.com`, `hbomax.com` |

Access to Amazon is limited to the `/gp/video/` path — JustHot cannot see the
rest of Amazon's site.

## What JustHot changes on a page

On an ad break JustHot mutes the video, and on Prime Video it also raises the
playback speed until the ad ends. It does not block, remove or alter ads, read
what you are watching, or interfere with playback in any other way.

## Contact

Questions or concerns: [feelfreewithnu@gmail.com](mailto:feelfreewithnu@gmail.com)
