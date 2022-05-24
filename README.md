# Australian Filmography

Interactive filmography built using [RDF](https://en.wikipedia.org/wiki/Resource_Description_Framework) and [D3.js](https://d3js.org/)

#### Data

Data claims are pulled from various sources as csv files. These are mapped to the ontology by [RML](https://rml.io/specs/rml/) using [RMLMapper](https://github.com/RMLio/rmlmapper-java). A typical command to build to RDF (Turtle serialisation) would be as follows:

> java -jar rmlmapper-5.0.0-r362-all.jar -s turtle -m pike-cooper.rml -o pike-cooper.ttl