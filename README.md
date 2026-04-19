# Australian Filmography

[![License: CC0-1.0](https://img.shields.io/badge/License-CC0_1.0-lightgrey.svg)](http://creativecommons.org/publicdomain/zero/1.0/)

An interactive filmography built using [Wikidata](https://www.wikidata.org) and [d3.js](https://d3js.org/).

### Corpus

The films featured in this project are aggregated from those present in [Australian Film (1900-1977)](https://github.com/paulduchesne/pike-cooper), [Australian Film (1978-1994)](https://github.com/paulduchesne/murray) and [Australia at the Movies (1990-2020)](https://github.com/paulduchesne/stratton). Aside from identification of the film themselves, no data is sourced from these resources.

### Collect

Data pertaining to the corpus is collected from Wikidata using the following script, which downloads the data fragments from Wikidata as individual JSON-LD files, which are aggregated into a single `wikidata.json` file.

```sh
uv run wikidata.py
```

### Deploy

This project makes use of [Frozen Flask](https://frozen-flask.readthedocs.io) to render all of the pages to a static site, for deployment via [GitHub Pages](https://docs.github.com/en/pages). The static site components are build using the following command

```sh
uv run app.py
```

If you wish you run a dev copy locally, use the following command from within the `docs` directory.

```sh
python3 -m http.server 8642
```

The service should be available at http://localhost:8642/.
