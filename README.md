# Pixel Purl

A single page application to facilitate the creation of knit and crochet patterns.
Built with React, TypeScript and Vite.

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
```

Each layer only depends on the ones above it in that list: components and hooks
build on `lib`, and `lib` knows nothing about React.

## Demo

A demo of this project can be found under [www.pixel-purl.com](www.pixel-purl.com).


## Credits

pixel icons are sourced from [https://allsvgicons.com/pack/pixelarticons/](allsvgicons.com/pack/pixelarticons/)