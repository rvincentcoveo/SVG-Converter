# SVG Converter

A Vue 3 application that converts SVG `fill` and `stroke` paints to `currentColor`. It accepts individual SVG files or ZIP archives, processes them locally, previews the results in a recolorable logo garden, and downloads one SVG or a ZIP of all converted files.

## Run locally

```sh
npm install
npm run dev
```

## Verify

```sh
npm test
npm run build
```

## Conversion model

The first version uses a deterministic browser-side conversion engine. Standard artwork stays on the device. Embedded raster artwork is wrapped in a self-contained alpha mask, while complex effects and external images are flagged for review.

The conversion service is isolated from the UI so a future server-side AI review can be added for flagged artwork without changing the upload and preview experience.
