// JustHot — Amazon Prime Video ad skipper
//
// When primeEnabled is ON: detects Prime Video ad breaks, fast-forwards through
// them (muted), clicks any visible ad-skip button, then restores normal playback
// the moment the show resumes.
//
// Prime sometimes locks playback speed during ads — in that case we keep the
// audio muted until the ad UI clears, so you never hear it.

(() => {
  const SKIP_RATE = 16;
  // No Prime ad break runs this long. If detection ever sticks on, bail out rather
  // than fast-forward the actual show; this is the backstop for "it never stopped".
  const MAX_SKIP_MS = 180000;
  const BAIL_COOLDOWN_MS = 30000;

  let enabled = false;
  let skipping = false;
  let skipStartedAt = 0;
  let bailedUntil = 0;
  let mutedEl = null;          // the exact element we muted; Prime swaps <video> nodes
  const rated = new Map();     // video element -> the playbackRate it had before we touched it

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
    if (Date.now() < bailedUntil) return; // bailed out; wait for the ad UI to clear
    if (!skipping) { skipping = true; skipStartedAt = Date.now(); }

    if (!rated.has(v)) {
      const rate = v.playbackRate || 1;
      // Never adopt a rate we set ourselves. Prime tops out at 2x for the viewer, so
      // anything faster is ours -- banking it would make every later "restore" put
      // the show back to 16x, which is how this used to stick on permanently.
      rated.set(v, rate > 4 ? 1 : rate);
    }
    if (!v.muted) { v.muted = true; mutedEl = v; }

    clickSkipButtons();
    try { v.playbackRate = SKIP_RATE; } catch (_) {}

    if (Date.now() - skipStartedAt > MAX_SKIP_MS) {
      bailedUntil = Date.now() + BAIL_COOLDOWN_MS;
      stopSkip();
    }
  }

  // Takes no element and has no early return: it restores every video it ever
  // touched, so a <video> swapped out mid-break cannot be left running at 16x.
  function stopSkip() {
    for (const [el, rate] of rated) { try { el.playbackRate = rate; } catch (_) {} }
    rated.clear();
    if (mutedEl) { try { mutedEl.muted = false; } catch (_) {} mutedEl = null; }
    skipping = false;
    skipStartedAt = 0;
  }

  function tick() {
    // After an extension reload this script keeps running against a dead context.
    // Without this it would go on forcing 16x with no toggle left to switch it off.
    if (!chrome.runtime || !chrome.runtime.id) { stopSkip(); teardown(); return; }
    if (!enabled) { stopSkip(); return; }
    if (adShowing()) {
      const v = JH.getVideo();
      if (v) startSkip(v);
    } else {
      stopSkip();
      bailedUntil = 0; // ad UI cleared, release the safety lock
    }
  }

  chrome.storage.local.get({ primeEnabled: false }, (r) => { enabled = !!r.primeEnabled; tick(); });
  chrome.storage.onChanged.addListener((c, a) => {
    if (a === "local" && "primeEnabled" in c) { enabled = !!c.primeEnabled.newValue; tick(); }
  });

  const onMutation = JH.throttle(tick, 150);
  const observer = new MutationObserver(onMutation);
  observer.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"],
  });

  const timer = setInterval(tick, 400);

  function teardown() {
    clearInterval(timer);
    observer.disconnect();
  }

  // Last resort: if the tab goes away mid-break, hand playback back before we do.
  window.addEventListener("pagehide", stopSkip);
})();
