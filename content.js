// JustHot — Hotstar content script
//
// Reports on-screen ad UI state to the background worker so it can mute/unmute
// the tab precisely — instant mute when an ad badge appears, instant unmute
// the moment it clears. Also sends a 1s heartbeat (TICK) so unmute never gets
// stuck when seamless SSAI ads show no on-screen UI.

(() => {
  let enabled = false;
  let domAd = false;

  const AD_SELECTORS = [
    '[class*="ad-overlay"]',
    '[class*="ad-container"]',
    '[class*="ads-container"]',
    '[class*="player-ad"]',
    '[data-testid*="ad-"]',
    'button[class*="skip"]',
  ];

  // "Ad", "Advertisement", "Sponsored", "Ad 1 of 2", "Ad : 0:15"
  const AD_TEXT = /^(ad|advertisement|sponsored|ad\s*\d+\s*of\s*\d+|ad\s*[:·]\s*\d)/i;

  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
  }

  function detect() {
    for (const sel of AD_SELECTORS) {
      let nodes;
      try { nodes = document.querySelectorAll(sel); } catch (_) { continue; }
      for (const el of nodes) if (visible(el)) return true;
    }
    const leaves = document.querySelectorAll("span, div, p, button");
    for (const el of leaves) {
      if (el.children.length !== 0) continue;
      const t = (el.textContent || "").trim();
      if (t && t.length <= 18 && AD_TEXT.test(t) && visible(el)) return true;
    }
    return false;
  }

  function evaluate() {
    if (!enabled) {
      if (domAd) { domAd = false; chrome.runtime.sendMessage({ type: "DOM_AD_END" }); }
      return;
    }
    const now = detect();
    if (now !== domAd) {
      domAd = now;
      chrome.runtime.sendMessage({ type: now ? "DOM_AD_START" : "DOM_AD_END" });
    }
  }

  chrome.storage.local.get({ hotstarEnabled: false }, (r) => { enabled = !!r.hotstarEnabled; evaluate(); });
  chrome.storage.onChanged.addListener((c, a) => {
    if (a === "local" && "hotstarEnabled" in c) { enabled = !!c.hotstarEnabled.newValue; evaluate(); }
  });

  new MutationObserver(() => evaluate()).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"],
  });

  setInterval(() => {
    evaluate();
    if (enabled) chrome.runtime.sendMessage({ type: "TICK" });
  }, 1000);
})();
