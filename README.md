# The Lounge Mobile Format

A small The Lounge plugin that adds a touch-friendly IRC formatting toolbar to the mobile web client.

It gives mobile users quick access to common IRC control codes without needing a hardware keyboard or memorising formatting shortcuts.

## Features

- Floating **text formatting** button inside the message input
- Touch-friendly toolbar for:
  - **Bold**
  - *Italic*
  - Underline
  - Strikethrough
  - Monospace
  - IRC foreground colours
  - Reset formatting
- Compact 16-colour IRC palette
- Works with selected text or inserts formatting codes at the cursor
- Tracks active formatting state near the cursor
- Keeps The Lounge's native scroll-to-bottom button usable on mobile
- No runtime dependencies

## Screenshots

Screenshots are not included yet. Add mobile screenshots here once the GitHub repo is ready.

```md
![Mobile formatting toolbar](docs/screenshot-toolbar.png)
![Colour palette](docs/screenshot-colours.png)
```

## Installation

From your The Lounge config directory, install the package:

```bash
thelounge install thelounge-plugin-mobile-format
```

Then restart The Lounge.

If you are installing from a local checkout while developing:

```bash
thelounge install /path/to/thelounge-plugin-mobile-format
```

## Usage

1. Open The Lounge on a phone or touch device.
2. Tap the **T** button in the message input.
3. Tap a formatting option.
4. Type normally, or select text first and then apply formatting.
5. Tap the colour button to open the colour palette.
6. Pick a colour to apply it; the palette closes automatically.
7. Tap the colour button again if you opened the palette and changed your mind.

## How it works

The plugin registers a small client-side script and stylesheet with The Lounge:

- `index.js` registers public assets and injects the client script into The Lounge's HTML template.
- `plugin.js` creates the formatting toggle, toolbar, colour palette, and IRC control-code insertion logic.
- `plugin.css` handles mobile-friendly positioning and styling.

The inserted formatting codes are standard IRC control characters, so messages remain compatible with other IRC clients.

## IRC formatting controls

| Format | IRC control |
| --- | --- |
| Bold | `\x02` |
| Colour | `\x03NN` |
| Italic | `\x1D` |
| Strikethrough | `\x1E` |
| Underline | `\x1F` |
| Monospace | `\x11` |
| Reset | `\x0F` |

## Compatibility

- The Lounge: `>= 4.0.0`
- Designed primarily for mobile/touch layouts
- Also works on desktop browsers

## Development

Clone the repo, edit the files, then install the local package into your The Lounge instance:

```bash
thelounge install /path/to/thelounge-plugin-mobile-format
```

Useful checks:

```bash
npm test
npm pack --dry-run
```

## Publishing checklist

Before publishing to npm:

1. Update `version` in `package.json`.
2. Add the GitHub `repository`, `bugs`, and `homepage` URLs once the repo exists.
3. Run:

   ```bash
   npm test
   npm pack --dry-run
   ```

4. Publish:

   ```bash
   npm publish
   ```

## License

MIT
