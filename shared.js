// JustHot — shared helpers for the platform content scripts.
//
// Loaded ahead of content.js / prime.js / zee5.js. Content scripts listed in the
// same manifest entry share one isolated world, so this object is visible to them.

// Assigned onto the isolated world's window rather than declared with const, so a
// re-injection cannot throw "Identifier 'JH' has already been declared".
window.JH = window.JH || (() => {
  // Words that begin with "ad" but have nothing to do with advertising.
  const NOT_AD = /^(adaptive|address|administr|admin|adult|advance|add|additional|adjust|adobe|adapter|adopt)/;
  // "ad" glued straight onto a player noun: adbreak, adtimeindicator, adCount...
  const AD_COMPOUND = /^ads?(break|container|overlay|badge|label|timer|time|count|slot|unit|marker|banner|indicator|wrapper|module|display|holder|area|panel|text|ui|video|player)/;

  // CSS substring selectors are blunt: "download-overlay" contains "ad-overlay"
  // and "loading" contains "ad", so a raw [class*="ad"] match means nothing.
  // Normalise camelCase to dashes, then require "ad" to start a whole word.
  function isAdName(raw) {
    if (!raw) return false;
    const norm = String(raw).replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    if (/(^|-)ads?-free(-|$)/.test(norm)) return false; // "ad-free" means the opposite
    if (/(^|-)(pre|mid|post)-?roll/.test(norm)) return true;
    for (const token of norm.split(/[^a-z0-9]+/)) {
      if (!token.startsWith("ad") || NOT_AD.test(token)) continue;
      if (token === "ad" || token === "ads") return true;
      if (token.startsWith("advert")) return true;
      if (AD_COMPOUND.test(token)) return true;
    }
    return false;
  }

  // Stable hooks sites expose for their own test suites. Netflix uses data-uia
  // rather than data-testid (e.g. data-uia="pause-ad"), and its CSS class names are
  // hashed, so for Netflix this attribute is the only thing worth matching on.
  const AD_ATTRS = ["class", "data-testid", "data-uia", "data-test-id"];

  // className is an SVGAnimatedString on SVG nodes, hence getAttribute.
  function isAdElement(el) {
    if (!el) return false;
    for (const attr of AD_ATTRS) if (isAdName(el.getAttribute(attr))) return true;
    return false;
  }

  // Ad markers belonging to the player frameworks themselves, not to any one site.
  // Taken from the uBlock Origin / AdGuard filter lists, so these are names seen in
  // the wild rather than guesses: Google IMA + GPT, JW Player, Video.js, Shaka.
  // Site-agnostic, which is what makes them worth leaning on for a new platform.
  const PLAYER_AD_SELECTORS = [
    '[class*="ima-ad"]',
    '[id*="ima-ad"]',
    'iframe[id*="google_ads_iframe"]',
    '[id^="div-gpt-ad"]',
    '[class*="jw-ad"]',
    '[class*="vjs-ad"]',
    '[class*="shaka-ad"]',
    '[class*="videoAdUi"]',
    '[class*="adDisplayContainer"]',
    '[class*="ad-display-container"]',
  ];

  // These are already specific enough that isAdElement would only throw them away.
  function matchesPlayerAd() {
    for (const sel of PLAYER_AD_SELECTORS) {
      let nodes;
      try { nodes = document.querySelectorAll(sel); } catch (_) { continue; }
      for (const el of nodes) if (visible(el)) return true;
    }
    return false;
  }

  function visible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const s = getComputedStyle(el);
    return s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0";
  }

  // Any element matched by a broad selector still has to survive isAdElement.
  function matchesAdSelector(selectors) {
    for (const sel of selectors) {
      let nodes;
      try { nodes = document.querySelectorAll(sel); } catch (_) { continue; }
      for (const el of nodes) if (isAdElement(el) && visible(el)) return true;
    }
    return false;
  }

  // The leaf-text sweep is the expensive half of detection, so keep it inside the
  // player when we can identify one. closest() walks up from the real <video>, so
  // it can never land on an unrelated subtree.
  function playerScope() {
    const v = document.querySelector("video");
    const root = v && v.closest('[class*="player"], [id*="player"], [data-testid*="player"]');
    return root || document;
  }

  function matchesAdText(re, maxLen, root) {
    const leaves = (root || document).querySelectorAll("span, div, p, button");
    for (const el of leaves) {
      if (el.children.length !== 0) continue;
      const t = (el.textContent || "").trim();
      if (!t || t.length > maxLen) continue;
      if (/ad[-\s]?free/i.test(t)) continue; // "Ad Free", "Ad-free" are not ads
      if (re.test(t) && visible(el)) return true;
    }
    return false;
  }

  function getVideo() {
    const vids = [...document.querySelectorAll("video")].filter((v) => v.readyState >= 1);
    return vids.find((v) => !v.paused) || vids.find((v) => v.readyState >= 2) || vids[0] || null;
  }

  // Runs on the leading edge, then at most once per `ms`. A MutationObserver on a
  // video player fires hundreds of times a second; detection must not.
  function throttle(fn, ms) {
    let last = 0, timer = null;
    return function run() {
      const wait = ms - (Date.now() - last);
      if (wait <= 0) {
        if (timer) { clearTimeout(timer); timer = null; }
        last = Date.now();
        fn();
      } else if (!timer) {
        timer = setTimeout(() => { timer = null; last = Date.now(); fn(); }, wait);
      }
    };
  }

  // An extension reload orphans the content scripts already on the page: they keep
  // running, but their chrome.* bridge is dead, so storage.onChanged never fires
  // again and the user has no way to switch them off. Anything that mutes or
  // changes playback has to notice this and hand control back.
  function contextAlive() {
    try { return !!(chrome.runtime && chrome.runtime.id); } catch (_) { return false; }
  }

  // After an extension reload the old content script keeps running against a dead
  // context; sendMessage then throws on every call.
  function send(msg) {
    try {
      chrome.runtime.sendMessage(msg, () => void chrome.runtime.lastError);
    } catch (_) { /* extension context invalidated */ }
  }

  return { isAdName, isAdElement, visible, matchesAdSelector, matchesPlayerAd, matchesAdText, playerScope, getVideo, throttle, send, contextAlive };
})();
