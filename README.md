# popup-to-tab

A Manifest V3 extension for Microsoft Edge that turns popup windows into tabs in the window you were actually using.

![License](https://img.shields.io/badge/license-MIT-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-yellow) ![Status](https://img.shields.io/badge/status-active-green)

## Overview

When several Edge windows are open and a site opens a popup, Edge creates a separate popup window that is
easy to lose. Edge has no built-in setting to force popups into tabs. This extension catches ordinary popup
windows, moves their tab into the normal window that was last focused, activates it and brings that window
to the foreground.

## Features

- Detects newly created popup windows through `chrome.windows.onCreated`.
- Moves the popup's single tab into the last focused normal Edge window.
- Activates the moved tab and focuses the target window.
- Falls back to a remembered window, then the popup's opener tab, then the first normal window.
- Skips common identity-provider popups (Microsoft, Google, Okta) so sign-in flows keep working.
- Logs a warning instead of breaking the service worker if a site closes the popup mid-move.

## How it works

`bg.js` runs as the extension service worker. It tracks the last focused normal window via
`windows.onFocusChanged` and, when a popup with exactly one tab appears, picks a target window:

```text
Popup created
      |
      v
Last focused normal Edge window? ---- yes ----> Move popup tab there
      |
      no
      v
Remembered normal window? ----------- yes ----> Move popup tab there
      |
      no
      v
Opener tab's window? ---------------- yes ----> Move popup tab there
      |
      no
      v
First normal window available
```

The key detail is `getLastFocused({ windowTypes: ["normal"] })`: the popup itself may receive focus, but Edge
still reports the normal window that was in use immediately before it appeared.

## Requirements

- Microsoft Edge (Chromium) with Manifest V3 support. Other Chromium browsers should work but are untested.
- Permission: `tabs` only. No page content, history or credentials are read, and no remote service is contacted.

## Quick start

1. Clone the repository:
   ```bash
   git clone https://github.com/cascodigital/popup-to-tab.git
   ```
2. Open `edge://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Open any site that launches a popup window: it now opens as a tab in your current window.

After changing the source, click **Reload** on the extension card.

## Configuration

There is no options page. Settings live in `bg.js`:

| Variable / key | Required | Default | Description |
|---|---|---|---|
| `SKIP_HOSTS` | No | `login.microsoftonline.com`, `login.live.com`, `accounts.google.com`, `login.okta.com` | Popups whose URL contains any of these strings are left as popups. Add login or payment hosts here and reload the extension. |

## Usage

There is no build step. Validate changes with:

```bash
node --check bg.js
python3 -m json.tool manifest.json >/dev/null
```

| File | Purpose |
|---|---|
| `manifest.json` | Manifest V3 metadata, permission and service-worker entry point |
| `bg.js` | Popup detection, target-window selection and tab movement |

## Limitations

- Only popups with exactly one tab are moved.
- Host matching is a plain substring check on the URL, not a parsed hostname match.
- Flows that rely on `window.opener` staying in a separate window (some OAuth or payment providers not in
  `SKIP_HOSTS`) may need their host added manually.
- Not published to the Edge Add-ons store; install as an unpacked extension.

## License

MIT — see [LICENSE](LICENSE).
