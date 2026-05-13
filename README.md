# SVG Animation Container

Docker-based pipeline for animating SVGs with GSAP and exporting the result as an animated WebP.

**Why WebP?** GitHub proxies SVGs through Camo, stripping all JavaScript. GSAP cannot run inside an SVG embedded in a README; the rasterized WebP is the workaround.

## Prerequisites

- Docker with Compose

## Workflow

### 1. Prepare the SVG

Place your SVG in `public/`. Elements you intend to animate need unique, semantic IDs (or be wrapped in `<g>` groups with IDs).

### 2. Set up working files

Copy the example templates:

```
cp public/index.example.html public/index.html
cp public/animation.example.js public/animation.js
```

These working copies are gitignored; the `.example.*` files are the tracked source of truth.

### 3. Write the animation

Edit `public/animation.js`. The contract with the capture script is that `window.animTimeline` must be assigned a GSAP timeline:

```js
function animate() {
    window.animTimeline = buildScene();  // required — capture.js seeks this
}
```

GSAP is loaded from CDN in `index.html`; no import needed in `animation.js`.

### 4. Start the server

```
docker compose up -d
```

Serves `public/` on port 3000. The `public/` directory is volume-mounted, so edits to `animation.js` and SVG files take effect on browser refresh without rebuilding the image.

### 5. Preview

Open `http://localhost:3000/`. The animation plays in a loop. Iterate by editing `animation.js` and refreshing.

### 6. Set the capture duration

Open `capture.js` and update `DURATION_S` to match your animation's full cycle length:

```js
const DURATION_S = 11;   // change this to match your timeline
```

For a `yoyo: true` timeline, the full cycle is:

```
(forward duration) + repeatDelay + (reverse duration) + repeatDelay
```

Example: 5 s forward with `repeatDelay: 0.5` → `5 + 0.5 + 5 + 0.5 = 11 s`.

Because `capture.js` is baked into the image (not volume-mounted), a rebuild is required after changing it:

```
docker compose build && docker compose up -d
```

> **TODO:** make `DURATION_S` configurable via an environment variable so rebuilds are not needed.

### 7. Capture

```
docker compose exec gsap-viewer node capture.js
```

This:
1. Waits for the server health check
2. Pauses `window.animTimeline`
3. Steps through it frame by frame at 24 fps for `DURATION_S` seconds
4. Assembles frames into `public/output.webp` via ffmpeg
5. Deletes the frames directory on success (leaves it on failure for inspection)

Output lands at `./public/output.webp` on the host via the volume mount.

### 8. Embed

```markdown
![Animation](public/output.webp)
```

## File structure

```
public/
  index.example.html     # template — tracked
  animation.example.js   # template — tracked
  example.svg            # minimal placeholder SVG — tracked
  index.html             # working copy — gitignored
  animation.js           # working copy — gitignored
  *.svg                  # your SVG files — gitignored
  output.webp            # generated output — gitignored
capture.js               # frame capture + ffmpeg assembly
server.js                # minimal static file server
Dockerfile
docker-compose.yml
```
