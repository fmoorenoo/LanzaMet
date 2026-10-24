// Chromium can offer installation before the app has started: keep the offer
// for InstallStore, and hold back the browser's own banner (the app asks once,
// and only on a return visit). A file, not an inline script, so the
// Content-Security-Policy can forbid inline scripts (see public/_headers).
addEventListener('beforeinstallprompt', function (event) {
  event.preventDefault();
  window.lmInstallPrompt = event;
});
