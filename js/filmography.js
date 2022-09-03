// filmography.js
// pull data from wikidata and plot using d3.js

// a better solution to dropping circles based on selection box
// would be that we adjust height of box whether active or not
// and circles always redraw based on this

// full wikidata query is also throwing a 403 headers error
// so we need to batch and also break into a module

let colour1 = "#D8DBE2"; // background
let colour2 = "#373F51"; // static
let colour3 = "#58A4B0"; // active

const row_length = 50;

canvas = d3
  .select("#paper")
  .append("svg")
  .attr("id", "canvas")
  .attr("width", "100%")
  .attr("height", "100%")
  .style("background-color", colour1);

d3.select("#canvas")
  .append("text")
  .attr("id", "title")
  .attr("x", 100)
  .attr("y", 40)
  .attr("opacity", 1)
  .style("stroke", colour2)
  .style("fill", colour2)
  .attr("font-family", "Spartan")
  .attr("font-weight", 500)
  .text("AUSTRALIAN FILMOGRAPHY");

d3.select("#canvas")
  .append("line")
  .attr("id", "line")
  .attr("x1", 100)
  .attr("x2", "95%")
  .attr("y1", 65)
  .attr("y2", 65)
  .style("stroke-width", "10px")
  .style("stroke", colour2)
  .style("fill", colour2);

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

    films.push({
      id: wiki_id,
      title_slug: title + " [" + year + "]",
      director_slug: dir,
      title: title,
      year: year,
    });
  });

  console.log(films);
  return films;
});

function wikidata_individual(wd) {
  let query = `select ?a  where { ?a ?b wd:` + wd + `}`;
  let sparql_request = d3.json(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
    { headers: { accept: "application/sparql-results+json" } }
  );
  return sparql_request;
}

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
  console.log("inside", film_id); // this is inside the sparql query

  let split_film_id = film_id.id.split("/");
  split_film_id = split_film_id[split_film_id.length - 1];

  var film_query =
    `SELECT ?director ?directorLabel ?actor ?actorLabel ?voice ?voiceLabel
  ?writer ?writerLabel ?dop ?dopLabel ?editor ?editorLabel ?composer ?composerLabel 
  ?producer ?producerLabel ?genre ?genreLabel ?rating ?ratingLabel
  ?colour ?colourLabel ?aspect ?aspectLabel ?duration
  WHERE {
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P57 ?director. }
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P161 ?actor. }
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P725 ?voice. }
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P58 ?writer. }
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P344 ?dop. }
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P1040 ?editor. }
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P86 ?composer. }
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P162 ?producer. }
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P136 ?genre. }
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P3156 ?rating. }
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P462 ?colour. }
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P2061 ?aspect. }
    OPTIONAL { wd:` +
    split_film_id +
    ` wdt:P2047 ?duration. }
SERVICE wikibase:label {bd:serviceParam wikibase:language "en". }}`;

  let sparql_request = d3.json(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(film_query)}`,
    { headers: { accept: "application/sparql-results+json" } }
  );

  let cooked_data = sparql_request.then((f) => {
    f = f.results.bindings;
    let resulting = {
      film_general: film_id,
      film_detail: pull_data(f, [
        "actor",
        "voice",
        "director",
        "writer",
        "dop",
        "editor",
        "composer",
        "producer",
        "genre",
        "rating",
        "colour",
        "aspect",
        "duration",
      ]),
    };

    // amalgamate "actor" and "voice" into "cast".
    // resulting['film_cast']['cast'] = [...resulting['film_cast']['actor'], ...resulting['film_cast']['voice']]

    return resulting;
  });

  return cooked_data;
}

function focus_attribute(data) {
  console.log(data);

  let attribute = data.id.split("/");
  attribute = attribute[attribute.length - 1];

  let colour_circles = wikidata_individual(attribute).then((y) => {
    let matches = y.results.bindings;
    let match_list = [...new Set(matches.map((d) => d.a.value))];
    d3.selectAll(".round")
      .style("fill", (d) => {

        // bounce down circles to make room for selection box

        if (match_list.includes(d.id)) {
          return colour2;
        } else {
          return colour3;
        }
      })

      .attr(
        "y_pos",
        (d, i) => (d.y = Math.floor(i / row_length) * 24 + 100 + 70)
      )
      .attr("cy", (d) => d.y);
  });

  colour_circles.then(() => {

    // selection box goes here

    console.log("clear text");

    d3.select("#detail")
      .style("pointer-events", "none")
      .transition()
      .duration(500)
      .style("opacity", 0);
    d3.select("#headertext")
      .style("pointer-events", "none")
      .transition()
      .duration(500)
      .style("opacity", 0);
    d3.selectAll(".casttext")
      .style("pointer-events", "none")
      .transition()
      .duration(500)
      .style("opacity", 0);
    d3.selectAll(".castlabel")
      .style("pointer-events", "none")
      .transition()
      .duration(500)
      .style("opacity", 0);
    d3.selectAll("#testing")
      .style("pointer-events", "none")
      .transition()
      .duration(500)
      .style("opacity", 0);
  });

  d3.select("#selection_text")
    .text(data.label)
    .attr("x", 100 + 20)
    .attr("y", 90 + 30)
    .transition()
    .duration(500)
    .style("opacity", 1);
  let selection_text_size =
    d3.select("#selection_text").node().getBBox().width + 40;
  d3.select("#selection_box")
    .attr("x", 100)
    .attr("y", 90)
    .attr("height", 50)
    .attr("width", selection_text_size)
    .transition()
    .duration(500)
    .style("opacity", 1)
    .style("pointer-events", "all");
}

function draw_detail(k) {

  // this function takes preexiting box/text elements and draws detail.

  sparql_query2(k).then((x) => {
    console.log(x);

    d3.select("#detail")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", "100%")
      .attr("height", "100%")
      .transition()
      .duration(500)
      .style("fill", colour2)
      .style("opacity", 1);

    d3.selectAll("#headertext").remove();
    d3.selectAll(".casttext").remove();
    d3.selectAll(".castlabel").remove();
    d3.selectAll("#testing").remove();

    d3.select("#canvas")

      .append("text")
      .attr("id", "headertext")
      .attr("x", 200)
      .attr("y", (d, i) => {
        return i * 20 + 200;
      })
      .attr("opacity", 0)
      .style("stroke", colour1)
      .style("fill", colour1)
      .attr("font-family", "Spartan")
      .attr("font-weight", 800)
      .attr("font-size", "50px")
      .text(x.film_general.title)

      .append("tspan")
      .attr("font-weight", 200)
      .style("stroke", colour1)
      .style("fill", colour1)
      .text(" (")

      .append("tspan")
      .text(x.film_general.year)

      .style("stroke", colour3)
      .style("fill", colour3)
      .attr("font-weight", 200)
      .on("click", (d, k) => {
        return console.log(x.film_general.year);
      })
      .append("tspan")
      .attr("font-weight", 200)
      .style("stroke", colour1)
      .style("fill", colour1)
      .text(")");

    console.log("director", x.film_detail.director);

    d3.select("#canvas")
      .selectAll("g")
      .data(["blah"])
      .join("text")
      .attr("id", "testing")
      .attr("x", (d, i) => {
        return 200;
      })
      .attr("y", (d, i) => {
        return 250;
      })
      .attr("opacity", 0)
      .style("pointer-events", "all")
      .style("stroke", colour1)
      .style("fill", colour1)
      .attr("font-family", "Spartan")
      .attr("font-weight", 200)
      .text("dir. ");

    let director_list = x.film_detail.director;

    console.log("director list", director_list);

    director_list.forEach((d, i) => {
      if (i != 0) {
        d3.select("#testing").append("tspan").text(", ");
      }

      d3.select("#testing")
        .append("tspan")
        .style("stroke", colour3)
        .style("fill", colour3)
        .text(d.label)
        .on("click", (e, k) => {
          focus_attribute(d);
        });
    });

    let dropdown = 0;

    function print_contributor(key, drop, label, col) {
      console.log(key);

      if (key.length > 0) {
        d3.select("#canvas")
          .selectAll("g")
          .data(["hello"])
          .join("text")
          .attr("class", "castlabel")
          .attr("x", 200 + col * 400)
          .attr("y", (d, i) => {
            return i * 20 + 300 + drop * 20;
          })
          .attr("opacity", 0)
          .style("pointer-events", "all")
          .style("stroke", colour1)
          .style("fill", colour1)
          .attr("font-family", "Spartan")
          .attr("font-weight", 200)
          .text(label);
      }

      d3.select("#canvas")
        .selectAll("g")
        .data(key)
        .join("text")
        .attr("class", "casttext")
        .attr("x", 200 + col * 400 + 100)
        .attr("y", (d, i) => {
          return i * 20 + 300 + drop * 20;
        })
        .attr("opacity", 0)
        .style("pointer-events", "all")
        .style("stroke", colour3)
        .style("fill", colour3)
        .attr("font-family", "Spartan")
        .attr("font-weight", 200)
        .text((d, i) => {
          return d.label;
        })
        .on("click", (d, k) => {
          focus_attribute(k);
        }); 
      return key.length + drop;
    }

    dropdown = 0;
    dropdown = print_contributor(x.film_detail.actor, dropdown, "Actor", 0);
    dropdown = print_contributor(x.film_detail.voice, dropdown, "Voice", 0);

    dropdown = 0;
    dropdown = print_contributor(
      x.film_detail.producer,
      dropdown,
      "Producer",
      1
    );
    dropdown = print_contributor(x.film_detail.writer, dropdown, "Writer", 1);
    dropdown = print_contributor(x.film_detail.dop, dropdown, "DOP", 1);
    dropdown = print_contributor(
      x.film_detail.composer,
      dropdown,
      "Composer",
      1
    );
    dropdown = print_contributor(x.film_detail.editor, dropdown, "Editor", 1);

    dropdown = 0;
    dropdown = print_contributor(x.film_detail.genre, dropdown, "Genre", 2);
    dropdown = print_contributor(x.film_detail.rating, dropdown, "Rating", 2);
    dropdown = print_contributor(
      x.film_detail.aspect,
      dropdown,
      "Aspect Ratio",
      2
    );
    dropdown = print_contributor(x.film_detail.colour, dropdown, "Colour", 2);
    dropdown = print_contributor(
      x.film_detail.duration,
      dropdown,
      "Duration",
      2
    );

    d3.select("#headertext").transition().duration(5000).style("opacity", 1);
    d3.selectAll(".castlabel").transition().duration(5000).style("opacity", 1);
    d3.selectAll(".casttext").transition().duration(5000).style("opacity", 1);
    d3.selectAll("#testing").transition().duration(5000).style("opacity", 1);
  });
}

const d3_elements = sparql_parsing.then((y) => {
  y.sort((a, b) => (a.year > b.year ? 1 : -1));

  d3.select("#canvas")
    .selectAll("g")
    .data(y)
    .join("circle")
    .attr("class", "round")
    .attr("x_pos", (d, i) => (d.x = (i % row_length) * 24 + 100 + 10))
    .attr("y_pos", (d, i) => (d.y = Math.floor(i / row_length) * 24 + 100))
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 10)
    .style("opacity", 1)
    .style("fill", colour3)
    .on("mouseover", (e, k) => {
      d3.select("#tooltext1").transition().duration(200).attr("opacity", 1);
      d3.select("#tooltext1").attr("x", k.x + 20);
      d3.select("#tooltext1").attr("y", k.y + 30);
      d3.select("#tooltext1").text(k.title_slug);
      d3.select("#tooltext2").transition().duration(200).attr("opacity", 1);
      d3.select("#tooltext2").attr("x", k.x + 20);
      d3.select("#tooltext2").attr("y", k.y + 60);
      d3.select("#tooltext2").text(k.director_slug);
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
    .attr("id", "selection_box")
    .attr("x", 500)
    .attr("y", 500)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("width", 400)
    .attr("height", 80)
    .attr("opacity", 0)
    .style("pointer-events", "none")
    .style("stroke", colour2)
    .style("fill", colour2)
    .on("click", () => {

      // reset, so fade out selection box and text, minify, recolour circles and move\

      console.log("hello paul");
      d3.select("#selection_box")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .style("pointer-events", "none");

      d3.select("#selection_text")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .style("pointer-events", "none");

      d3.selectAll(".round")
        .transition()
        .delay(500)
        .duration(500)
        .style("fill", (d) => {
          return colour3;
        })

        // bounce down circles to make room for selection box

        .attr("y_pos", (d, i) => (d.y = Math.floor(i / row_length) * 24 + 100))
        .attr("cy", (d) => d.y);
    });

  d3.select("#canvas")
    .append("text")
    .attr("id", "selection_text")
    .attr("x", 500)
    .attr("y", 500)
    .attr("opacity", 0)
    .style("pointer-events", "none")
    .style("stroke", colour1)
    .style("fill", colour1)
    .attr("font-family", "Spartan")
    .attr("font-weight", 200)
    .text("hello");

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
    .style("stroke", colour2)
    .style("fill", colour3);

  d3.select("#canvas")
    .append("text")
    .attr("id", "tooltext1")
    .attr("x", 100)
    .attr("y", 100)
    .attr("opacity", 0)
    .style("pointer-events", "none")
    .style("stroke", colour2)
    .style("fill", colour2)
    .attr("font-family", "Spartan")
    .attr("font-weight", 500)
    .text("hello");

  d3.select("#canvas")
    .append("text")
    .attr("id", "tooltext2")
    .attr("x", 100)
    .attr("y", 100)
    .attr("opacity", 0)
    .style("pointer-events", "none")
    .style("stroke", colour2)
    .style("fill", colour2)
    .attr("font-family", "Spartan")
    .attr("font-weight", 200)
    .text("hello");

  d3.select("#canvas")
    .append("rect")
    .attr("id", "detail")
    .attr("x", 10)
    .attr("y", 10)
    .attr("width", 10)
    .attr("height", 10)
    .attr("opacity", 0)
    .style("pointer-events", "none")
    .style("stroke", colour1)
    .style("fill", colour1);

  d3.select("#canvas")
    .append("text")
    .attr("id", "casttext")
    .attr("x", 100)
    .attr("y", 100)
    .attr("opacity", 0)
    .style("pointer-events", "none")
    .style("stroke", colour1)
    .style("fill", colour1)
    .attr("font-family", "Spartan")
    .attr("font-weight", 200)
    .text("hello");

  let distance = 15;

  d3.select("#canvas")
    .append("line")
    .attr("id", "cross")
    .attr("x1", 0 + distance)
    .attr("x2", 20 + distance)
    .attr("y1", 20 + distance)
    .attr("y2", 0 + distance)
    .attr("opacity", 1)
    .style("stroke-width", "4px")
    .style("stroke", colour1)
    .style("fill", colour1);

  d3.select("#canvas")
    .append("line")
    .attr("id", "cross")
    .attr("x1", 20 + distance)
    .attr("x2", 0 + distance)
    .attr("y1", 20 + distance)
    .attr("y2", 0 + distance)
    .attr("opacity", 1)
    .style("stroke-width", "4px")
    .style("stroke", colour1)
    .style("fill", colour1);

  // overlay an empty square which triggers return

  d3.select("#canvas")
    .append("rect")
    .attr("x", distance)
    .attr("y", distance)
    .attr("width", 20)
    .attr("height", 20)
    .style("fill", "aqua")
    .style("opacity", 0)
    .on("click", (e, k) => {
      console.log("clear text");

      d3.select("#detail")
        .style("pointer-events", "none")
        .transition()
        .duration(500)
        .style("opacity", 0);
      d3.select("#headertext")
        .style("pointer-events", "none")
        .transition()
        .duration(500)
        .style("opacity", 0);
      d3.selectAll(".casttext")
        .style("pointer-events", "none")
        .transition()
        .duration(500)
        .style("opacity", 0);
      d3.selectAll(".castlabel")
        .style("pointer-events", "none")
        .transition()
        .duration(500)
        .style("opacity", 0);
      d3.selectAll("#testing")
        .style("pointer-events", "none")
        .transition()
        .duration(500)
        .style("opacity", 0);
    });
});

// work to be done:

// ---- split first wikidata query out into a module.

// ---- style focused tooltips differently (light on dark)

// ---- note that two feature currently have no directors listed, so test adding data wikidata side.

// ---- tweak to be able to select year and length

// ---- scroll graphs
