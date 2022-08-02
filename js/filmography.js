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

    let title = select.map((m) => {
      return m.filmLabel;
    })[0];

    films.push({ id: wiki_id, title: title, director: dir, year: year });
  });

  return films;
});

function wikidata_collect(data, attribute) {
  let collected_entities = [];

  data.forEach((a) => {
    if (
      Object.keys(a).includes(attribute) &&
      Object.keys(a).includes(attribute + "Label")
    ) {
      collected_entities.push({
        id: a[attribute].value,
        label: a[attribute + "Label"].value,
      });
    } else if (Object.keys(a).includes(attribute)) {
      collected_entities.push({
        id: a[attribute].value,
        label: a[attribute].value,
      });
    }
  });

  var unique = Array.from(new Set(collected_entities.map(JSON.stringify))).map(
    JSON.parse
  );

  return unique;
}

function pull_data(y, e) {
  data_object = {};
  let data_key = e;
  data_key.forEach((a) => {
    data_object[a] = wikidata_collect(y, a);
  });
  return data_object;
}

function sparql_query2(film_id) {

  let split_film_id = film_id.id.split("/");
  split_film_id = split_film_id[split_film_id.length - 1];

  var film_query =
  `SELECT ?director ?directorLabel ?actor ?actorLabel ?voice ?voiceLabel
  ?writer ?writerLabel ?dop ?dopLabel ?editor ?editorLabel ?composer ?composerLabel 
  ?producer ?producerLabel ?genre ?genreLabel ?rating ?ratingLabel
  ?colour ?colourLabel ?aspect ?aspectLabel ?duration
  WHERE {
    OPTIONAL { wd:` + split_film_id + ` wdt:P57 ?director. }
    OPTIONAL { wd:` + split_film_id + ` wdt:P161 ?actor. }
    OPTIONAL { wd:` + split_film_id + ` wdt:P725 ?voice. }
    OPTIONAL { wd:` + split_film_id + ` wdt:P58 ?writer. }
    OPTIONAL { wd:` + split_film_id + ` wdt:P344 ?dop. }
    OPTIONAL { wd:` + split_film_id + ` wdt:P1040 ?editor. }
    OPTIONAL { wd:` + split_film_id + ` wdt:P86 ?composer. }
    OPTIONAL { wd:` + split_film_id + ` wdt:P162 ?producer. }
    OPTIONAL { wd:` + split_film_id + ` wdt:P136 ?genre. }
    OPTIONAL { wd:` + split_film_id + ` wdt:P3156 ?rating. }
    OPTIONAL { wd:` + split_film_id + ` wdt:P462 ?colour. }
    OPTIONAL { wd:` + split_film_id + ` wdt:P2061 ?aspect. }
    OPTIONAL { wd:` + split_film_id + ` wdt:P2047 ?duration. }
SERVICE wikibase:label {bd:serviceParam wikibase:language "en". }}`;

  let sparql_request = d3.json(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(film_query)}`,
    { headers: { accept: "application/sparql-results+json" } }
  );

  let cooked_data = sparql_request.then((f) => {
    f = f.results.bindings;
    let resulting = {
      film_cast: pull_data(f, ["actor", "voice"]),
      film_credit: pull_data(f, [
        "writer",
        "dop",
        "editor",
        "composer",
        "producer",
      ]),

      film_tech: pull_data(f, [
        "genre",
        "rating",
        "colour",
        "aspect",
        "duration",
      ]),
    };
    return resulting;
  });
  return cooked_data;
}

function draw_detail(k) {

  // this function takes preexiting box/text elements and draws detail.

  sparql_query2(k).then((x) => console.log(x))

}

const d3_elements = sparql_parsing.then((y) => {
  let row_length = 4;

  d3.select("#canvas")
    .selectAll("g")
    .data(y)
    .join("circle")
    .attr("x_pos", (d, i) => (d.x = (i % row_length) * 24 + 100))
    .attr("y_pos", (d, i) => (d.y = Math.floor(i / row_length) * 24 + 100))
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 10)
    .style("fill", colour2)
    .on("mouseover", (e, k) => {
      d3.select("#tooltext1").transition().duration(200).attr("opacity", 1);
      d3.select("#tooltext1").attr("x", k.x + 20);
      d3.select("#tooltext1").attr("y", k.y + 30);
      d3.select("#tooltext1").text(k.title + " [" + k.year + "]");
      d3.select("#tooltext2").transition().duration(200).attr("opacity", 1);
      d3.select("#tooltext2").attr("x", k.x + 20);
      d3.select("#tooltext2").attr("y", k.y + 60);
      d3.select("#tooltext2").text(k.director);
      let text_size1 = d3.select("#tooltext1").node().getBBox().width + 40;
      let text_size2 = d3.select("#tooltext2").node().getBBox().width + 40;
      let text_max = Math.max(text_size1, text_size2);
      d3.select("#tool").transition().duration(200).attr("opacity", 1);
      d3.select("#tool").attr("x", k.x);
      d3.select("#tool").attr("y", k.y);
      d3.select("#tool").attr("width", text_max);
    })
    .on("mouseout", () => {
      d3.select("#tool").transition().duration(200).attr("opacity", 0);
      d3.select("#tooltext1").transition().duration(200).attr("opacity", 0);
      d3.select("#tooltext2").transition().duration(200).attr("opacity", 0);
    })
    .on("click", (e, k) => draw_detail(k));

  d3.select("#canvas")
    .append("rect")
    .attr("id", "tool")
    .attr("x", 400)
    .attr("y", 400)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("width", 400)
    .attr("height", 80)
    .attr("opacity", 0)
    .style("pointer-events", "none")
    .style("stroke", "black")
    .style("fill", "black");

  d3.select("#canvas")
    .append("text")
    .attr("id", "tooltext1")
    .attr("x", 100)
    .attr("y", 100)
    .attr("opacity", 0)
    .style("pointer-events", "none")
    .style("stroke", colour1)
    .style("fill", colour1)
    .attr("font-family", "Spartan")
    .attr("font-weight", 800)
    .text("hello");

  d3.select("#canvas")
    .append("text")
    .attr("id", "tooltext2")
    .attr("x", 100)
    .attr("y", 100)
    .attr("opacity", 0)
    .style("pointer-events", "none")
    .style("stroke", colour1)
    .style("fill", colour1)
    .attr("font-family", "Spartan")
    .attr("font-weight", 200)
    .text("hello");
});

// sparql function, on click of circle pull cast, credit and technical data.
// second query will be per agent or technical, pull ids that conform and then colour original graph accourdingly.
