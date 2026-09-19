// JustHot — Hotstar content script
//
// Reports on-screen ad UI state to the background worker so it can mute/unmute
// the tab precisely — instant mute when an ad badge appears, unmute once the badge
// has stayed gone for AD_END_GRACE. Also sends a 1s heartbeat (TICK) so unmute
// never gets stuck when seamless SSAI ads show no on-screen UI.

(() => {
  let enabled = false;
  let domAd = false;
  let lastSeen = 0;

  // Hotstar redraws the player constantly, so the ad badge can vanish for a frame
  // mid-break. Ending the break on that flicker unmutes the ad and throws away the
  // network timer behind it, so require the UI to stay gone this long first.
  const AD_END_GRACE = 600;

  const AD_SELECTORS = [
    '[class*="ad-overlay"]',
    '[class*="ad-container"]',
    '[class*="ads-container"]',
    '[class*="player-ad"]',
    '[data-testid*="ad-"]',
  ];

  // "Ad", "Advertisement", "Sponsored", "Ad 1 of 2", "Ad : 0:15".
  // \b matters: without it this matched "Adventure" and "Add to Watchlist".
  const AD_TEXT = /^(ad|ads|advertisement|sponsored)\b|^ad\s*\d+\s*of\s*\d+|^ad\s*[:·]\s*\d/i;

  function detect() {
    if (JH.matchesAdSelector(AD_SELECTORS)) return true;
    return JH.matchesAdText(AD_TEXT, 18, JH.playerScope());
  }

  function evaluate() {
    if (!enabled) {
      if (domAd) { domAd = false; JH.send({ type: "DOM_AD_END" }); }
      return;
    }
    if (detect()) {
      lastSeen = Date.now();
      if (!domAd) { domAd = true; JH.send({ type: "DOM_AD_START" }); }
    } else if (domAd && Date.now() - lastSeen > AD_END_GRACE) {
      domAd = false;
      JH.send({ type: "DOM_AD_END" });
    }
  }

  chrome.storage.local.get({ hotstarEnabled: false }, (r) => { enabled = !!r.hotstarEnabled; evaluate(); });
  chrome.storage.onChanged.addListener((c, a) => {
    if (a === "local" && "hotstarEnabled" in c) { enabled = !!c.hotstarEnabled.newValue; evaluate(); }
  });

  const onMutation = JH.throttle(evaluate, 150);
  new MutationObserver(onMutation).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"],
  });

  // Polls faster than the heartbeat so the grace period is confirmed promptly.
  setInterval(evaluate, 250);
  setInterval(() => { if (enabled) JH.send({ type: "TICK" }); }, 1000);
})();
