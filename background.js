// JustHot — background service worker
//
// Hotstar: watches the ad-impression tracking pixel from bifrost-api.hotstar.com,
// then mutes the tab the instant an ad starts and unmutes the instant play resumes.
// Prime Video: prime.js handles everything in-page; no background work needed.
//
// Each platform is toggled independently via hotstarEnabled / primeEnabled keys.

const AD_TRACK_URL = "*://bifrost-api.hotstar.com/v1/events/track/ct_impression*";
const DEFAULT_AD_SECONDS = 15;
const BUFFER_SECONDS = 1;

let hotstarEnabled = false;
let primeEnabled = false;
const tabs = new Map(); // tabId -> { networkUntil, domAd, domSeenThisBreak, mutedByUs, timer }

const BASE_ICONS  = { 16: "icons/icon16.png",     32: "icons/icon32.png",     48: "icons/icon48.png",     128: "icons/icon128.png"     };
const OFF_ICONS   = { 16: "icons/icon16-gray.png",  32: "icons/icon32-gray.png",  48: "icons/icon48-gray.png",  128: "icons/icon128-gray.png"  };

function updateIcon() {
  chrome.action.setIcon({ path: (hotstarEnabled || primeEnabled) ? BASE_ICONS : OFF_ICONS });
}

chrome.storage.local.get({ hotstarEnabled: false, primeEnabled: false }, (r) => {
  hotstarEnabled = !!r.hotstarEnabled;
  primeEnabled   = !!r.primeEnabled;
  updateIcon();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if ("hotstarEnabled" in changes) {
    hotstarEnabled = !!changes.hotstarEnabled.newValue;
    if (!hotstarEnabled) {
      for (const [id, s] of tabs) {
        if (s.mutedByUs) { chrome.tabs.update(id, { muted: false }); s.mutedByUs = false; }
        if (s.timer) { clearTimeout(s.timer); s.timer = null; }
      }
    }
  }
  if ("primeEnabled" in changes) primeEnabled = !!changes.primeEnabled.newValue;
  updateIcon();
});

// --- Hotstar tab state ---------------------------------------------------------

function getState(tabId) {
  let s = tabs.get(tabId);
  if (!s) {
    s = { networkUntil: 0, domAd: false, domSeenThisBreak: false, mutedByUs: false, timer: null };
    tabs.set(tabId, s);
  }
  return s;
}

// Ad names encode length e.g. "...20sEng..." or "ENG_15".
function parseAdSeconds(adName) {
  if (!adName) return DEFAULT_AD_SECONDS;
  let m = adName.match(/(\d{1,3})s(?:Eng(?:lish)?|Hin(?:di)?)/i);
  if (m) return parseInt(m[1], 10);
  m = adName.match(/(?:HIN|ENG|HINDI|ENGLISH)[^\d]*(\d{1,3})/i);
  if (m) return parseInt(m[1], 10);
  return DEFAULT_AD_SECONDS;
}

function adActive(s) {
  if (s.domSeenThisBreak) return s.domAd;
  return Date.now() < s.networkUntil;
}

function reconcile(tabId) {
  const s = tabs.get(tabId);
  if (!s) return;
  const shouldMute = hotstarEnabled && adActive(s);
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) { s.mutedByUs = false; return; }
    const isMuted = tab.mutedInfo && tab.mutedInfo.muted;
    if (shouldMute && !isMuted) {
      chrome.tabs.update(tabId, { muted: true });
      s.mutedByUs = true;
    } else if (!shouldMute && isMuted && s.mutedByUs) {
      chrome.tabs.update(tabId, { muted: false });
      s.mutedByUs = false;
    }
  });
}

function scheduleReconcile(tabId, ms) {
  const s = getState(tabId);
  if (s.timer) clearTimeout(s.timer);
  s.timer = setTimeout(() => reconcile(tabId), ms);
}

// PRIMARY: ad-impression pixel fires at ad start → mute immediately.
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!hotstarEnabled || details.tabId < 0) return;
    let adName = "";
    try { adName = new URL(details.url).searchParams.get("adName") || ""; } catch (_) {}
    const secs = parseAdSeconds(adName) + BUFFER_SECONDS;
    const s = getState(details.tabId);
    s.networkUntil = Math.max(s.networkUntil, Date.now() + secs * 1000);
    reconcile(details.tabId);
    scheduleReconcile(details.tabId, secs * 1000 + 250);
  },
  { urls: [AD_TRACK_URL] }
);

// PRECISION: content.js reports on-screen ad UI state.
chrome.runtime.onMessage.addListener((msg, sender) => {
  const tabId = sender.tab && sender.tab.id;
  if (typeof tabId !== "number") return;
  const s = getState(tabId);

  if (msg.type === "DOM_AD_START") {
    s.domAd = true;
    s.domSeenThisBreak = true;
    reconcile(tabId);
  } else if (msg.type === "DOM_AD_END") {
    s.domAd = false;
    s.networkUntil = 0;
    reconcile(tabId);
    s.domSeenThisBreak = false;
  } else if (msg.type === "TICK") {
    reconcile(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const s = tabs.get(tabId);
  if (s && s.timer) clearTimeout(s.timer);
  tabs.delete(tabId);
});
