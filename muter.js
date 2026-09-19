// JustHot — ad muter for the mute-based platforms (Zee5, SonyLIV, Airtel Xtream)
//
// All three do the same job: watch the player for an ad break, mute for its
// duration, restore audio when content resumes. Only the storage key differs, so
// they share one script rather than three near-identical copies.
//
// Zee5 uses SSAI (AWS MediaTailor) — ads are stitched server-side into the HLS
// stream, so network-level blocking is impossible and muting is the only option.
// SonyLIV runs client-side ads through the Google IMA SDK, which plays them in a
// separate element, so an ad break mutes every <video> on the page rather than
// just the one that happened to be playing beforehand.
//
// Netflix and HBO Max are the least certain of the set. Both are flagged
// $generichide in the uBlock Origin / AdGuard lists, meaning generic ad-class
// selectors are known to misfire on them, and neither has any published selector
// for an in-stream ad break. Netflix hashes its CSS class names and exposes
// data-uia instead; HBO Max stitches ads server-side via Brightline. Detection on
// those two therefore leans on the data-uia hook and the ad-countdown text, and
// should be treated as best-effort until it is confirmed against a live ad tier.

(() => {
  const PLATFORMS = [
    { key: "zee5Enabled",    host: /(^|\.)zee5\.com$/ },
    { key: "sonylivEnabled", host: /(^|\.)sonyliv\.com$/ },
    { key: "airtelEnabled",  host: /(^|\.)airtelxstream\.in$/ },
    { key: "netflixEnabled", host: /(^|\.)netflix\.com$/ },
    { key: "hbomaxEnabled",  host: /(^|\.)(max|hbomax)\.com$/ },
  ];

  const platform = PLATFORMS.find((p) => p.host.test(location.hostname));
  if (!platform) return;
  const STORAGE_KEY = platform.key;

  let enabled = false;
  let lastSeen = 0;
  const muted = new Set(); // the exact elements we muted; players swap <video> nodes

  const AD_SELECTORS = [
    '[class*="ad-container"]',
    '[class*="ad-overlay"]',
    '[class*="adContainer"]',
    '[class*="adOverlay"]',
    '[class*="advertisement"]',
    '[class*="ad-break"]',
    '[class*="adBreak"]',
    '[class*="linear-ad"]',
    '[class*="linearAd"]',
    '[class*="ad-timer"]',
    '[class*="adTimer"]',
    '[class*="ad-badge"]',
    '[class*="adBadge"]',
    '[class*="ad-label"]',
    '[class*="adLabel"]',
    '[data-testid*="ad-"]',
    '[data-uia*="ad"]',
    '[data-test-id*="ad"]',
  ];

  // Matches "Ad", "Advertisement", "Sponsored", "Ad 1 of 2", "Ad ends in 0:15"
  const AD_TEXT = /^(ad|advertisement|sponsored)\b|ad\s+ends\s+in|\bad\s*\d+\s*of\s*\d+|ad\s*will\s*end/i;

  function adShowing() {
    if (JH.matchesPlayerAd()) return true;
    if (JH.matchesAdSelector(AD_SELECTORS)) return true;
    return JH.matchesAdText(AD_TEXT, 30, JH.playerScope());
  }

  // Runs on every tick of a break, not just the first: IMA and friends can attach a
  // fresh <video> partway through, and bailing out early left that one audible.
  function muteAll() {
    for (const v of document.querySelectorAll("video")) {
      if (!v.muted) { v.muted = true; muted.add(v); }
    }
  }

  function unmuteAll() {
    for (const v of muted) { try { v.muted = false; } catch (_) {} }
    muted.clear();
  }

  function tick() {
    if (!JH.contextAlive()) { unmuteAll(); teardown(); return; }
    if (!enabled) { unmuteAll(); return; }
    if (!document.querySelector("video")) return;
    if (adShowing()) {
      lastSeen = Date.now();
      muteAll();
    } else if (muted.size && Date.now() - lastSeen > JH.AD_END_GRACE) {
      unmuteAll();
    }
  }

  chrome.storage.local.get({ [STORAGE_KEY]: false }, (r) => { enabled = !!r[STORAGE_KEY]; tick(); });
  chrome.storage.onChanged.addListener((c, a) => {
    if (a === "local" && STORAGE_KEY in c) { enabled = !!c[STORAGE_KEY].newValue; tick(); }
  });

  const onMutation = JH.throttle(tick, 150);
  const observer = new MutationObserver(onMutation);
  observer.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"],
  });

  const timer = setInterval(tick, JH.POLL_MS);

  function teardown() {
    clearInterval(timer);
    observer.disconnect();
  }

  window.addEventListener("pagehide", unmuteAll);
})();
