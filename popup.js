function render({ hotstarEnabled, primeEnabled }) {
  document.getElementById(hotstarEnabled ? "hs-on" : "hs-off").checked = true;
  document.getElementById(primeEnabled   ? "pv-on" : "pv-off").checked = true;
  document.getElementById("logo").src =
    (hotstarEnabled || primeEnabled) ? "icons/icon48.png" : "icons/icon48-gray.png";
}

chrome.storage.local.get({ hotstarEnabled: false, primeEnabled: false }, render);

document.querySelectorAll('input[type="radio"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const hotstarEnabled = document.getElementById("hs-on").checked;
    const primeEnabled   = document.getElementById("pv-on").checked;
    chrome.storage.local.set({ hotstarEnabled, primeEnabled }, () =>
      render({ hotstarEnabled, primeEnabled })
    );
  });
});
