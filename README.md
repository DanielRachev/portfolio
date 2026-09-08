# Planet Portfolio

A scrolling portfolio with an optional React Three Fiber universe, configured
for GitHub Pages.

## Content and navigation

Visitors first see Daniel's introduction, then selected work, experience,
education, and contact information. `src/PortfolioPage.jsx` contains the page
layout and identity copy, adapted from `design.html`; `src/Portfolio.css` contains
its responsive styles. `src/App.jsx` manages scene loading and navigation.

Edit projects, experience, and technical-stack groups in `src/content.js`. The project cards, planet
previews, and detail panels all read the same records. Add `liveUrl` and/or
`sourceUrl` only when a project has a destination ready to publish; absent links
are omitted from the panel. The initial case studies are based on the CV and
project documentation, without publishing workplace source files.

The universe is imported during an idle period after the introduction has painted.
On data-saving or slow (2G/3G) connections it loads only when requested. Its entry
button becomes available after the models have loaded and the scene has rendered.
Project-panel code and fonts also load separately from the initial page.
The canvas stops rendering while the written portfolio or another browser tab is
visible. Loading errors, lost WebGL contexts, unsupported WebGL2, or a 45-second
preparation timeout leave the scrolling page usable. The entry button offers a
retry, resetting both the scene boundary and cached model-loading failures.

Entering the universe preserves the page's scroll position. Use the back button
or Escape to return. When a project panel is open, Escape closes that panel first.
Named project buttons also provide keyboard and touch access to every planet.

Planet records have a hand-composed `initialAngle` (radians). Orbital motion starts
only when the 3D view is active, so background loading does not randomize the
opening layout. Projects without an angle use a stable ID-derived fallback.
The overview camera pulls back on narrow screens to keep the opening planets in
frame. Closing a project eases camera position and orientation back over 1.8
seconds; reduced-motion visitors return immediately. Floating labels fade between
22px and 12px projected planet radius and disappear below that range. Hovering
still reveals the popup; featured rings are unchanged. Timing and label thresholds
live in `src/sceneMotion.js`.

## Development

```bash
npm install
npm run dev
```

The application requires a local `.planet-key`. This file is deliberately ignored
and is injected only into the development or minified production bundle.

## Licensed planet assets

The original CGTrader GLBs are private source assets and must remain under
`private-assets/planets/`, which is ignored by Git. Only the three active models
are published. Packaging applies lossless Meshopt geometry compression before
authenticated AES-256-GCM encryption into `.planet` containers. Three.js decrypts
them in browser memory and uses the matching Meshopt decoder to parse them.
The original GLBs are never overwritten; textures are not recompressed.

Expected private source filenames:

- `Planet_24.glb`
- `Planet_30.glb`
- `Planet_45.glb`

The other curated GLBs may remain in the same ignored directory for future use.

For the first local setup:

```bash
npm run assets:setup
```

To rotate the key, replace `.planet-key` with a new 64-character hexadecimal
value and then repackage every active asset before deploying.

To repackage with the existing key:

```bash
npm run assets:package
```

Commit the resulting files under `public/assets/planets/`, but never commit the
GLBs or `.planet-key`. Back up the purchased archive separately. Client-side
encryption deters casual extraction but cannot make browser-rendered geometry
impossible to recover.

## Production

```bash
npm run build
npm run deploy
```

Vite minifies JavaScript with esbuild and does not produce source maps. The
deployment contains only opaque `.planet` containers, not raw GLBs.

## Branding and link previews

The public address is https://danielrachev.github.io/portfolio/. `index.html`
contains the canonical URL, page title, description, theme color, and static
Open Graph / social-card metadata. Sharing crawlers do not need to run React or
load WebGL to read these tags. Keep the canonical URL, `og:url`, and both absolute
image URLs in sync if the deployment address changes. Icon URLs use Vite's base
path so they resolve under `/portfolio/`.

The Orbit favicon (SVG and 32px PNG), 180px Apple touch icon, and 1200×630 social
preview are committed under `public/`. Recreate them with:

```bash
npm run branding:generate
npm test
npm run build
```

Edit the preview layout/text in `scripts/generate-branding.mjs`. It uses the same
Lucide Orbit icon and local Plus Jakarta Sans, Inter, and JetBrains Mono fonts as
the page, with text outlined before rasterization for reproducible rendering.
Sharp and Fontkit are build-time tools only; no image service, additional runtime
code, or purchased planet geometry is involved. The icon attribution is included
in `public/branding-license.txt` and the SVG. Existing GitHub and email links stay
in `src/PortfolioPage.jsx`.

`npm run build` copies these assets but does not regenerate them. Deployment is
still an explicit `npm run deploy` step. Social services may cache old previews;
after changing the preview, use a new filename and update both image meta tags
when a fresh image URL is needed.

## Performance checks

```bash
npm test
npm run lint
npm run assets:benchmark
npm run build:report
```

The benchmark reads the three private GLBs without changing them. It compares
lossless Meshopt against Draco with 16-bit positions and 14-bit normals/UVs,
checks Meshopt vertex data, triangle winding, and textures against the originals,
and reports median warmed Node parsing times. These are not mobile browser or
cold-decoder benchmarks. Meshopt was selected to avoid quantization changes.

Current GLB payload totals: 1,186,064 bytes original, 666,616 bytes lossless Meshopt,
and 117,136 bytes quantized Draco. The published Meshopt containers add 40 bytes
each for authenticated encryption: approximately 44% smaller than before.
KTX2 is deferred: each source has only a ~10 KB embedded PNG.

The initial JavaScript decreased from ~320 KB to ~207 KB (~66 KB gzip estimate).
The project panel is ~115 KB and the 3D chunk ~1.04 MB, loaded separately. The
decoder increases total JS slightly; splitting reduces startup cost, not total
download size. The 3D chunk still triggers Vite's size warning. Inspect actual
network transfer sizes on the deployment; local gzip estimates do not establish
which compression the host uses. The unused direct `glsl-noise` dependency was
removed; Three.js, React Three Fiber, and post-processing remain scene-only.

Quality policy lives in `src/scenePolicy.js`:

| Tier | Stars | Maximum DPR | Bloom | Multisampling |
| --- | ---: | ---: | --- | ---: |
| High | 5,000 | 1.5 | 300px | 4 |
| Balanced | 2,500 | 1.25 | 180px | 0 |
| Low | 1,200 | 1 | Off | 0 |

Coarse-pointer devices and devices reporting <=4 cores or <=4 GB memory start
balanced. Two consecutive two-second samples below 45 FPS lower high to balanced;
below 30 FPS lowers balanced to low. Quality only steps down during a scene visit
to avoid oscillation. Lower tiers draw fewer of the same stars, rather than
regenerating their positions. Planet geometry and texture quality stay unchanged.
Real-device profiling is still recommended before expanding the scene substantially.
