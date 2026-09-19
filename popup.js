// Radio group name === platform id, so a toggle writes only its own storage key
// rather than rewriting all five and waking every content script.
const PLATFORMS = [
  { id: "hs", key: "hotstarEnabled" },
  { id: "pv", key: "primeEnabled"   },
  { id: "z5", key: "zee5Enabled"    },
  { id: "sl", key: "sonylivEnabled" },
  { id: "ax", key: "airtelEnabled"  },
  { id: "nf", key: "netflixEnabled" },
  { id: "hb", key: "hbomaxEnabled"  },
];
const DEFAULTS = Object.fromEntries(PLATFORMS.map((p) => [p.key, false]));

function paintLogo() {
  const anyOn = PLATFORMS.some((p) => document.getElementById(`${p.id}-on`).checked);
  document.getElementById("logo").src = anyOn ? "icons/icon48.png" : "icons/icon48-gray.png";
}

chrome.storage.local.get(DEFAULTS, (state) => {
  for (const p of PLATFORMS) {
    document.getElementById(state[p.key] ? `${p.id}-on` : `${p.id}-off`).checked = true;
  }
  paintLogo();
});

document.querySelectorAll('input[type="radio"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const platform = PLATFORMS.find((p) => p.id === radio.name);
    if (!platform) return;
    chrome.storage.local.set({ [platform.key]: document.getElementById(`${platform.id}-on`).checked });
    paintLogo();
  });
});
