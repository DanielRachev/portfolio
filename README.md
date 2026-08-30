# Planet Portfolio

An interactive React Three Fiber portfolio deployed to GitHub Pages.

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
