# Pixel Purl

A single page application to facilitate the creation of knit and crochet patterns.
Built with React, TypeScript and Vite.

## Features

- **Drawing** — paint stitches freehand, flood-fill regions, and reassign one
  colour to another across the whole pattern. Colours are managed through a
  palette and a colour picker.
- **Image tracing** — import an image and turn it into a stitch pattern. Tune
  the colour count, brightness, position, scale and rotation, and optionally
  enhance outlines with Sobel edge detection (with adjustable sensitivity).
- **Selection** — select, copy, paste and move regions of the pattern.
- **Grid & view** — set the pattern's stitch and row dimensions, zoom in and
  out, undo, and clear.
- **Save & share** — export the pattern as an image or as a full project file,
  and re-import a saved project to keep working.

## Development

```bash
npm install     # install dependencies
npm run dev     # start the dev server (http://localhost:5173)
npm run build   # type-check and build for production into dist/
npm run preview # preview the production build locally
```

## Project structure

```
src/
  App.tsx          composition root — lays out the header, toolbars and canvas
  config/          tunable values: control definitions, limits, tolerances
  types/           shared vocabulary (grid cells, tool modes, stitch blocks)
  lib/             pure logic: pattern rendering, grid maths, override transforms
  interactions/    one pointer strategy per tool (pan / draw / select)
  hooks/           one state slice per concern, assembled by usePatternEditor
  components/      presentational UI
  styles/          shared style objects
```

Each layer only depends on the ones above it in that list: components and hooks
build on `lib`, and `lib` knows nothing about React.

## Demo

A demo of this project can be found under [www.pixel-purl.com](www.pixel-purl.com).


## Credits

pixel icons are sourced from [https://allsvgicons.com/pack/pixelarticons/](allsvgicons.com/pack/pixelarticons/)