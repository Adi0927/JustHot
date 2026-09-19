// JustHot — Amazon Prime Video ad skipper
//
// When primeEnabled is ON: detects Prime Video ad breaks, fast-forwards through
// them (muted), clicks any visible ad-skip button, then restores normal playback
// the moment the show resumes.
//
// Prime sometimes locks playback speed during ads — in that case we keep the
// audio muted until the ad UI clears, so you never hear it.

(() => {
  let enabled = false;
  let skipping = false;
  let savedRate = 1;
  let mutedEl = null; // the exact element we muted; Prime swaps <video> nodes

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

  // "remaining" used to be an alternative here, which matched the player's own
  // "Time remaining 04:12" and fast-forwarded the show at 16x.
  const AD_TEXT = /^(ad|ads)\b|\bad\s*\d+\s*of\s*\d+|video will resume|advertisement|\bad\s+ends?\s+in\b|skip\s+in\s+\d/i;

  // Prime's own "Skip Intro" / "Skip Recap" are not ad controls.
  const NOT_AD_SKIP = /\b(intro|recap|credits|preview|episode|season)\b/i;

  function adShowing() {
    if (JH.matchesAdSelector(AD_SELECTORS)) return true;
    const scope = document.querySelector('[class*="atvwebplayersdk"], [class*="webPlayer"]');
    return JH.matchesAdText(AD_TEXT, 28, scope || JH.playerScope());
  }

  function clickSkipButtons() {
    const btns = document.querySelectorAll('button, [role="button"]');
    for (const b of btns) {
      const t = (b.textContent || "").trim();
      if (!/\bskip\b/i.test(t) || NOT_AD_SKIP.test(t)) continue;
      if (JH.visible(b)) { b.click(); return; }
    }
  }

  function startSkip(v) {
    if (!skipping) {
      skipping = true;
      savedRate = v.playbackRate || 1;
      if (!v.muted) { v.muted = true; mutedEl = v; }
    }
    clickSkipButtons();
    try { v.playbackRate = 16; } catch (_) {}
  }

  function stopSkip(v) {
    if (!skipping) return;
    skipping = false;
    if (v) { try { v.playbackRate = savedRate || 1; } catch (_) {} }
    // Unmute the element we actually muted, which may no longer be the current one.
    if (mutedEl) { try { mutedEl.muted = false; } catch (_) {} mutedEl = null; }
  }

  function tick() {
    const v = JH.getVideo();
    if (!enabled) { stopSkip(v); return; }
    if (!v) return;
    if (adShowing()) startSkip(v); else stopSkip(v);
  }

  chrome.storage.local.get({ primeEnabled: false }, (r) => { enabled = !!r.primeEnabled; tick(); });
  chrome.storage.onChanged.addListener((c, a) => {
    if (a === "local" && "primeEnabled" in c) { enabled = !!c.primeEnabled.newValue; tick(); }
  });

  const onMutation = JH.throttle(tick, 150);
  new MutationObserver(onMutation).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"],
  });

  setInterval(tick, 400);
})();
