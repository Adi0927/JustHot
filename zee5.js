// JustHot — Zee5 ad muter
//
// When zee5Enabled is ON: detects ad breaks in the Zee5 player via DOM signals,
// mutes the video element for the duration, and restores audio when content resumes.
//
// Zee5 uses SSAI (AWS MediaTailor) — ads are stitched server-side into the HLS
// stream, so network-level blocking is not possible. DOM-based muting is the only
// viable approach. Selectors below cover known patterns + broad text-based fallback.

(() => {
  let enabled = false;
  let mutedByUs = false;

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
    '[data-testid*="ad"]',
  ];

  // Matches "Ad", "Advertisement", "Sponsored", "Ad 1 of 2", "Ad ends in 0:15"
  const AD_TEXT = /^(ad|advertisement|sponsored)\b|ad\s+ends\s+in|\bad\s*\d+\s*of\s*\d+|ad\s*will\s*end/i;

  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
  }

  function adShowing() {
    for (const sel of AD_SELECTORS) {
      let nodes;
      try { nodes = document.querySelectorAll(sel); } catch (_) { continue; }
      for (const el of nodes) if (visible(el)) return true;
    }
    // Text-based fallback — scan leaf nodes for ad indicator text
    const leaves = document.querySelectorAll('span, div, p, button');
    for (const el of leaves) {
      if (el.children.length !== 0) continue;
      const t = (el.textContent || '').trim();
      if (t && t.length <= 30 && AD_TEXT.test(t) && visible(el)) return true;
    }
    return false;
  }

  function getVideo() {
    const vids = [...document.querySelectorAll('video')].filter((v) => v.readyState >= 1);
    return vids.find((v) => !v.paused) || vids.find((v) => v.readyState >= 2) || vids[0] || null;
  }

  function tick() {
    const v = getVideo();
    if (!enabled || !v) {
      if (mutedByUs && v) { v.muted = false; mutedByUs = false; }
      return;
    }
    if (adShowing()) {
      if (!v.muted) { v.muted = true; mutedByUs = true; }
    } else {
      if (mutedByUs) { v.muted = false; mutedByUs = false; }
    }
  }

  chrome.storage.local.get({ zee5Enabled: false }, (r) => { enabled = !!r.zee5Enabled; tick(); });
  chrome.storage.onChanged.addListener((c, a) => {
    if (a === 'local' && 'zee5Enabled' in c) { enabled = !!c.zee5Enabled.newValue; tick(); }
  });

  new MutationObserver(() => tick()).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'],
  });

  setInterval(tick, 400);
})();
