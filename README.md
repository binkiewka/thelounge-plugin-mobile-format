# The Lounge Mobile Format

A touch-friendly IRC formatting toolbar for [The Lounge](https://thelounge.chat/) mobile web client.

It adds a compact **T** button inside the message input so mobile users can apply IRC formatting without memorising control codes or using a hardware keyboard.

## Features

- Input-corner **text formatting** button designed for mobile/touch use
- Toolbar for:
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

## Installation

The Lounge plugins are installed into the The Lounge data/config directory. Where that lives depends on how you self-host The Lounge.

### 1. Standard npm install

If The Lounge is installed normally on the host:

```bash
thelounge install thelounge-plugin-mobile-format
thelounge restart
```

If your service is managed by systemd, restart it instead:

```bash
sudo systemctl restart thelounge
```

### 2. Docker / Docker Compose with a mounted data directory

Most Docker installs mount the The Lounge data directory, commonly something like:

```yaml
volumes:
  - /path/on/host/thelounge:/var/opt/thelounge
```

Install the plugin from inside the running container:

```bash
docker exec -it thelounge thelounge install thelounge-plugin-mobile-format
docker restart thelounge
```

If your container has a different name, replace `thelounge` with your container name:

```bash
docker ps
```

With Docker Compose:

```bash
docker compose exec thelounge thelounge install thelounge-plugin-mobile-format
docker compose restart thelounge
```

### 3. Docker install from a local checkout

Useful when testing changes before publishing to npm.

If your local checkout is mounted into the container:

```bash
docker compose exec thelounge thelounge install /path/inside/container/thelounge-plugin-mobile-format
docker compose restart thelounge
```

Or install into the host-mounted packages directory manually:

```bash
cd /path/on/host/thelounge/packages
npm install /path/on/host/thelounge-plugin-mobile-format
docker restart thelounge
```

### 4. Install directly from GitHub

Once the repository is public, you can install from GitHub instead of npm:

```bash
thelounge install github:binkiewka/thelounge-plugin-mobile-format
```

or with npm syntax from the The Lounge packages directory:

```bash
cd /path/to/thelounge/packages
npm install github:binkiewka/thelounge-plugin-mobile-format
```

Docker example:

```bash
docker exec -it thelounge thelounge install github:binkiewka/thelounge-plugin-mobile-format
docker restart thelounge
```

If your GitHub username/org differs, replace `binkiewka` with the actual owner.

### 5. Manual install into The Lounge packages directory

If `thelounge install` is not available in your setup:

```bash
cd /path/to/thelounge/packages
npm install thelounge-plugin-mobile-format
```

Then restart The Lounge.

Common package locations:

- Bare-metal Linux: `~/.thelounge/packages`
- Docker official image with mounted data: `/var/opt/thelounge/packages` inside the container
- Host bind mount: whatever host path you mounted to `/var/opt/thelounge`

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
git clone https://github.com/binkiewka/thelounge-plugin-mobile-format.git
cd thelounge-plugin-mobile-format
npm test
npm pack --dry-run
```

Local install:

```bash
thelounge install /path/to/thelounge-plugin-mobile-format
```

Docker local install example:

```bash
docker exec -it thelounge thelounge install /path/inside/container/thelounge-plugin-mobile-format
docker restart thelounge
```

## Publishing to npm

```bash
npm test
npm pack --dry-run
npm publish
```

Before publishing a new release, update:

- `version` in `package.json`
- `CHANGELOG.md`

## License

MIT © Tomasz Binkiewicz
