// JustHot — Amazon Prime Video ad skipper
//
// When primeEnabled is ON: detects Prime Video ad breaks, fast-forwards through
// them (muted), clicks any visible skip button, then restores normal playback
// the moment the show resumes.
//
// Prime sometimes locks playback speed during ads — in that case we keep the
// audio muted until the ad UI clears, so you never hear it.

(() => {
  let enabled = false;
  let skipping = false;
  let savedRate = 1;
  let mutedByUs = false;

  const AD_SELECTORS = [
    '[class*="adtimeindicator"]',
    '[class*="atvwebplayersdk-ad"]',
    '[class*="adCount"]',
    '[class*="ad-countdown"]',
    '[data-testid*="ad-"]',
    '[class*="preroll"]',
    '[class*="pre-roll"]',
    '[class*="adOverlay"]',
    '[class*="adBadge"]',
  ];

  const AD_TEXT = /(^|\s)(ad|ads)\b|video will resume|ad\s*\d+\s*of\s*\d+|remaining|advertisement|skip\s+in\s+\d/i;

  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
  }

  function adShowing() {
    for (const sel of AD_SELECTORS) {
      let nodes;
      try { nodes = document.querySelectorAll(sel); } catch (_) { continue; }
      for (const el of nodes) if (visible(el)) return true;
    }
    const scope = document.querySelectorAll(
      '[class*="atvwebplayersdk"] span, [class*="atvwebplayersdk"] div, [class*="webPlayer"] span'
    );
    for (const el of scope) {
      if (el.children.length) continue;
      const t = (el.textContent || "").trim();
      if (t && t.length <= 28 && AD_TEXT.test(t) && visible(el)) return true;
    }
    return false;
  }

  function getVideo() {
    const vids = [...document.querySelectorAll("video")].filter((v) => v.readyState >= 1);
    return vids.find((v) => !v.paused) || vids.find((v) => v.readyState >= 2) || vids[0] || null;
  }

  function clickSkipButtons() {
    const btns = document.querySelectorAll('button, [role="button"]');
    for (const b of btns) {
      const t = (b.textContent || "").trim().toLowerCase();
      if (/\bskip\b/.test(t) && visible(b)) { b.click(); return; }
    }
  }

  function startSkip(v) {
    if (!skipping) {
      skipping = true;
      savedRate = v.playbackRate || 1;
      if (!v.muted) { v.muted = true; mutedByUs = true; }
    }
    clickSkipButtons();
    try { v.playbackRate = 16; } catch (_) {}
  }

  function stopSkip(v) {
    if (!skipping) return;
    skipping = false;
    if (v) {
      try { v.playbackRate = savedRate || 1; } catch (_) {}
      if (mutedByUs) v.muted = false;
    }
    mutedByUs = false;
  }

  function tick() {
    const v = getVideo();
    if (!enabled) { stopSkip(v); return; }
    if (!v) return;
    if (adShowing()) startSkip(v); else stopSkip(v);
  }

  chrome.storage.local.get({ primeEnabled: false }, (r) => { enabled = !!r.primeEnabled; tick(); });
  chrome.storage.onChanged.addListener((c, a) => {
    if (a === "local" && "primeEnabled" in c) { enabled = !!c.primeEnabled.newValue; tick(); }
  });

  new MutationObserver(() => tick()).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"],
  });

  setInterval(tick, 400);
})();
