// ClashOfPens - Secure preload script
// Context isolation is enabled. No Node APIs are leaked into the renderer.

window.addEventListener('DOMContentLoaded', () => {
  try {
    // Flag to inform client that it is running in Electron desktop container
    window.isElectronApp = true;
  } catch {}
});
