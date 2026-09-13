<div align="center">

# Popup to Tab

**Converts Edge popup windows into tabs in the window you are actually using.**

![Status](https://img.shields.io/badge/Status-Active-16A34A?style=flat-square)
![Manifest](https://img.shields.io/badge/Manifest-V3-4285F4?style=flat-square)
![Browser](https://img.shields.io/badge/Browser-Microsoft%20Edge-0078D4?style=flat-square&logo=microsoftedge&logoColor=white)
![Casco Digital](https://img.shields.io/badge/Casco-Digital-111827?style=flat-square)

</div>

---

Popup to Tab is a small Manifest V3 extension for Microsoft Edge. It catches ordinary popup windows and moves their tab into the normal Edge window that was last focused, then activates the tab and focuses that window.

This is useful when several Edge windows are open and a site opens a popup in a separate window. The popup becomes a regular tab in the window where you were working instead of landing in an arbitrary "next" Edge window.

## What it does

- Detects newly created popup windows.
- Keeps the popup's single tab and moves it into the last focused normal Edge window.
- Activates the moved tab and brings the target window to the foreground.
- Uses the popup's opener tab as a fallback when Edge has no focused normal window available.
- Leaves common identity-provider popups alone so sign-in flows can continue to work.
- Logs a warning instead of breaking the service worker if a site closes the popup during the move.

## How it chooses the target

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

The important detail is `getLastFocused({ windowTypes: ["normal"] })`. The popup itself may receive focus, but Edge still reports the normal window that was being used immediately before it appeared.

## Installation

1. Download or clone this repository.
2. Open `edge://extensions` in Microsoft Edge.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the repository directory containing `manifest.json`.

After changing the source, return to `edge://extensions` and click **Reload** on the extension card.

## Configuration

The extension intentionally has no options page. To exempt another login or payment flow, add its hostname to `SKIP_HOSTS` in `bg.js`, then reload the extension:

```js
const SKIP_HOSTS = [
  "login.microsoftonline.com",
  "accounts.example.com"
];
```

Host matching is deliberately simple and is applied before any tab movement.

## Permissions

The extension requests only the `tabs` permission. It needs this to inspect popup tabs, move them between windows, and activate the resulting tab.

No page content, browsing history, credentials, or remote service is collected.

## Project files

| File | Purpose |
|---|---|
| `manifest.json` | Manifest V3 metadata, permission, and service-worker entry point |
| `bg.js` | Popup detection, target-window selection, and tab movement |

## Development

There is no build step. The extension is plain JavaScript and can be loaded directly as an unpacked extension. Validate changes with:

```bash
node --check bg.js
python3 -m json.tool manifest.json >/dev/null
```

## License

Released under the [MIT License](LICENSE).

Developed with 🐢 (and coffee) by [Casco Digital](https://github.com/cascodigital).
