function render({ hotstarEnabled, primeEnabled, zee5Enabled }) {
  document.getElementById(hotstarEnabled ? "hs-on" : "hs-off").checked = true;
  document.getElementById(primeEnabled   ? "pv-on" : "pv-off").checked = true;
  document.getElementById(zee5Enabled    ? "z5-on" : "z5-off").checked = true;
  document.getElementById("logo").src =
    (hotstarEnabled || primeEnabled || zee5Enabled) ? "icons/icon48.png" : "icons/icon48-gray.png";
}

chrome.storage.local.get({ hotstarEnabled: false, primeEnabled: false, zee5Enabled: false }, render);

document.querySelectorAll('input[type="radio"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const hotstarEnabled = document.getElementById("hs-on").checked;
    const primeEnabled   = document.getElementById("pv-on").checked;
    const zee5Enabled    = document.getElementById("z5-on").checked;
    chrome.storage.local.set({ hotstarEnabled, primeEnabled, zee5Enabled }, () =>
      render({ hotstarEnabled, primeEnabled, zee5Enabled })
    );
  });
});
