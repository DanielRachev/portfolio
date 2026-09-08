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

The universe is imported after the introduction has had time to paint. Its entry
button becomes available after the models have loaded and the scene has rendered.
The canvas stops rendering while the written portfolio is visible. Loading errors
or a 45-second preparation timeout leave the scrolling page usable.

Entering the universe preserves the page's scroll position. Use the back button
or Escape to return. When a project panel is open, Escape closes that panel first.
Named project buttons also provide keyboard and touch access to every planet.

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
are published. They are packaged into authenticated AES-256-GCM `.planet`
containers; Three.js decrypts them in browser memory before parsing them.

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
