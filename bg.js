// Popup to Tab - converts popup windows into tabs.
// Edit SKIP_HOSTS if a login flow needs to keep its popup window.
const SKIP_HOSTS = [
  "login.microsoftonline.com",
  "login.live.com",
  "accounts.google.com",
  "login.okta.com"
];

// Keep the last normal window focused by the user. When Edge focuses the new
// popup, the normal window that was in use remains the target.
let lastNormalWindowId = null;

async function rememberNormalWindow(windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;

  try {
    const window = await chrome.windows.get(windowId);
    if (window.type === "normal") lastNormalWindowId = window.id;
  } catch (_) {
    // The window may have been closed between the event and the query.
  }
}

chrome.windows.onFocusChanged.addListener(rememberNormalWindow);
chrome.windows
  .getLastFocused({ windowTypes: ["normal"] })
  .then((window) => {
    if (window?.type === "normal") lastNormalWindowId = window.id;
  })
  .catch(() => {});

async function getNormalWindow(windowId) {
  if (windowId == null) return null;

  try {
    const window = await chrome.windows.get(windowId);
    return window.type === "normal" ? window : null;
  } catch (_) {
    return null;
  }
}

async function findTargetWindow(popupTab) {
  // Normal case: the normal window that was in use before the popup.
  const focused = await chrome.windows
    .getLastFocused({ windowTypes: ["normal"] })
    .catch(() => null);
  if (focused?.type === "normal") return focused;

  const remembered = await getNormalWindow(lastNormalWindowId);
  if (remembered) return remembered;

  // Some sites expose the tab that opened the popup. Use it if no focused
  // window is available, for example while Edge is starting.
  if (popupTab.openerTabId != null) {
    try {
      const openerTab = await chrome.tabs.get(popupTab.openerTabId);
      const openerWindow = await getNormalWindow(openerTab.windowId);
      if (openerWindow) return openerWindow;
    } catch (_) {
      // openerTabId may no longer exist if the source tab was closed.
    }
  }

  const normals = await chrome.windows.getAll({ windowTypes: ["normal"] });
  return normals[0] ?? null;
}

chrome.windows.onCreated.addListener(async (win) => {
  try {
    if (win.type !== "popup") return;

    const tabs = await chrome.tabs.query({ windowId: win.id });
    if (tabs.length !== 1) return;

    const tab = tabs[0];
    const url = tab.pendingUrl || tab.url || "";
    if (SKIP_HOSTS.some((host) => url.includes(host))) return;

    const target = await findTargetWindow(tab);
    if (!target || target.id === win.id) return;

    await chrome.tabs.move(tab.id, { windowId: target.id, index: -1 });
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(target.id, { focused: true });
  } catch (error) {
    // The site may close the popup/tab before the move finishes.
    console.warn("Popup to Tab: could not move popup", error);
  }
});
