// JustHot — background service worker
//
// Hotstar: watches the ad-impression tracking pixel from bifrost-api.hotstar.com,
// then mutes the tab the instant an ad starts and unmutes the instant play resumes.
// Every other platform is handled in-page by its own content script; the worker
// only tracks their toggles so the toolbar icon can reflect them.
//
// Each platform is toggled independently via its own <name>Enabled key.
//
// The MV3 worker is torn down whenever it goes idle, so no mute state is kept in
// memory across restarts — whether a tab is muted *by us* is read back from
// tab.mutedInfo, which Chrome persists for the life of the tab.

const AD_TRACK_URL = "*://bifrost-api.hotstar.com/v1/events/track/ct_impression*";
const HOTSTAR_TABS = ["*://*.hotstar.com/*", "*://*.jiohotstar.com/*"];
const DEFAULT_AD_SECONDS = 15;
const BUFFER_SECONDS = 1;

// Every platform toggle, defaulting to off. Hotstar is the only one this worker
// acts on; the rest are here so updateIcon() knows whether anything is enabled.
const PLATFORM_KEYS = [
  "hotstarEnabled", "primeEnabled", "zee5Enabled",
  "sonylivEnabled", "airtelEnabled", "netflixEnabled", "hbomaxEnabled",
];
const DEFAULTS = Object.fromEntries(PLATFORM_KEYS.map((k) => [k, false]));
const flags = { ...DEFAULTS };

const tabs = new Map(); // tabId -> { networkUntil, domAd, domSeenThisBreak, timer }

const BASE_ICONS  = { 16: "icons/icon16.png",     32: "icons/icon32.png",     48: "icons/icon48.png",     128: "icons/icon128.png"     };
const OFF_ICONS   = { 16: "icons/icon16-gray.png",  32: "icons/icon32-gray.png",  48: "icons/icon48-gray.png",  128: "icons/icon128-gray.png"  };

function updateIcon() {
  const anyOn = PLATFORM_KEYS.some((k) => flags[k]);
  chrome.action.setIcon({ path: anyOn ? BASE_ICONS : OFF_ICONS });
}

// --- Mute ownership ------------------------------------------------------------

// A tab we muted reports reason "extension" with our own id. Anything else — the
// user's own mute, another extension — must be left alone. Reading this back from
// the tab rather than tracking it in memory is what keeps a tab from being stranded
// muted when the worker is torn down mid-ad break.
function mutedByUs(tab) {
  const mi = tab && tab.mutedInfo;
  return !!(mi && mi.muted && mi.reason === "extension" && mi.extensionId === chrome.runtime.id);
}

function unmuteOurTabs() {
  chrome.tabs.query({ url: HOTSTAR_TABS }, (list) => {
    if (chrome.runtime.lastError || !list) return;
    for (const tab of list) if (mutedByUs(tab)) chrome.tabs.update(tab.id, { muted: false });
  });
}

// --- Init ----------------------------------------------------------------------

// A tracking pixel can wake the worker and reach the listener before storage has
// been read back, which would read hotstarEnabled as false and miss the ad. Every
// listener waits on this first.
const ready = new Promise((resolve) => {
  chrome.storage.local.get(DEFAULTS, (r) => {
    for (const k of PLATFORM_KEYS) flags[k] = !!r[k];
    updateIcon();
    // Always sweep, not just when Hotstar is off. An extension reload orphans the
    // content script on an open tab, so no TICK ever arrives and reconcile never
    // runs -- a tab muted at that moment would stay muted for good. If an ad really
    // is playing, the next TICK re-mutes within a second; a brief blip beats a tab
    // the viewer cannot unmute.
    unmuteOurTabs();
    resolve();
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  let touched = false;
  for (const k of PLATFORM_KEYS) {
    if (!(k in changes)) continue;
    flags[k] = !!changes[k].newValue;
    touched = true;
  }
  if (!touched) return;
  if (!flags.hotstarEnabled) {
    for (const s of tabs.values()) if (s.timer) { clearTimeout(s.timer); s.timer = null; }
    tabs.clear();
    unmuteOurTabs();
  }
  updateIcon();
});

// --- Hotstar tab state ---------------------------------------------------------

function getState(tabId) {
  let s = tabs.get(tabId);
  if (!s) {
    s = { networkUntil: 0, domAd: false, domSeenThisBreak: false, timer: null };
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
  const shouldMute = flags.hotstarEnabled && adActive(s);
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    const isMuted = !!(tab.mutedInfo && tab.mutedInfo.muted);
    if (shouldMute && !isMuted) {
      chrome.tabs.update(tabId, { muted: true });
    } else if (!shouldMute && isMuted && mutedByUs(tab)) {
      chrome.tabs.update(tabId, { muted: false });
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
    if (details.tabId < 0) return;
    const { tabId, url } = details;
    ready.then(() => {
      if (!flags.hotstarEnabled) return;
      let adName = "";
      try { adName = new URL(url).searchParams.get("adName") || ""; } catch (_) {}
      const secs = parseAdSeconds(adName) + BUFFER_SECONDS;
      const s = getState(tabId);
      s.networkUntil = Math.max(s.networkUntil, Date.now() + secs * 1000);
      reconcile(tabId);
      scheduleReconcile(tabId, secs * 1000 + 250);
    });
  },
  { urls: [AD_TRACK_URL] }
);

// PRECISION: content.js reports on-screen ad UI state. It only sends DOM_AD_END
// once the ad UI has stayed gone for a grace period, so clearing the network
// timer here cannot be triggered by a single dropped frame mid-break.
chrome.runtime.onMessage.addListener((msg, sender) => {
  const tabId = sender.tab && sender.tab.id;
  if (typeof tabId !== "number") return;
  ready.then(() => {
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
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const s = tabs.get(tabId);
  if (s && s.timer) clearTimeout(s.timer);
  tabs.delete(tabId);
});
