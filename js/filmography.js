// filmography.js
// pull data from wikidata and plot using d3.js

let colour1 = "#F7F3E3";
let colour2 = "#C03221";

canvas = d3
  .select("#paper")
  .append("svg")
  .attr("id", "canvas")
  .attr("width", "100%")
  .attr("height", "100%")
  .style("background-color", colour1);

const entity_List = d3.json("./entities.json");

const wikidata_list = entity_List.then((data) => {
  let wikidata_items = data.entities.map((d) => {
    return d.wikidata;
  });
  return wikidata_items;
});

const sparql_query = wikidata_list.then((wd) => {
  let wd_list = "wd:" + wd.join(" wd:");
  let query =
    `select ?film ?filmLabel ?dirLabel ?year where {
        values ?film { ` +
    wd_list +
    ` } .
        ?film wdt:P57 ?dir .
        ?film  wdt:P577 ?year .
        service wikibase:label {bd:serviceParam wikibase:language "en". }}`;

  let sparql_request = d3.json(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
    { headers: { accept: "application/sparql-results+json" } }
  );

  return sparql_request;
});

const sparql_parsing = sparql_query.then((data) => {
  data = data.results.bindings;

  data.forEach((d) => {
    d.film = d.film.value;
    d.dirLabel = d.dirLabel.value;
    d.filmLabel = d.filmLabel.value;
    d.year = d.year.value.slice(0, 4);
  });

  let wikidata_entities = [...new Set(data.map((d) => d.film))];

  const films = [];

  wikidata_entities.forEach((wiki_id) => {
    let select = data.filter((k) => {
      return k.film == wiki_id;
    });
    dir = [
      ...new Set(
        select.map((j) => {
          return j.dirLabel;
        })
      ),
    ];
    dir = dir.join(", ");

    year = [
      ...new Set(
        select.map((j) => {
          return parseInt(j.year);
        })
      ),
    ];
    year = Math.min(...year);
    films.push({ id: wiki_id, director: dir, year: year });
  });

  return films;
});

const d3_elements = sparql_parsing.then((y) => {
 
    //   console.log(y);

  let row_length = 4;
  d3.select("#canvas")
    .selectAll("g")
    .data(y)
    .join("circle")
    .attr("cx", function (d, i) {
      return (i % row_length) * 24 + 100;
    })
    .attr("cy", function (d, i) {
      return Math.floor(i / row_length) * 24 + 100;
    })
    .attr("r", 10)
    .style("fill", colour2);
});
