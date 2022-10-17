// pull data from wikidata and plot using d3.js

async function setup_canvas() {
  let colour1 = "#D8DBE2"; // background
  let colour2 = "#373F51"; // static
  let colour3 = "#58A4B0"; // active

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

  // console.log("heck");
}

async function load_json() {
  // load predefined list of accepted Australian feature films.
  let film_list = d3.json("./entities.json");
  return film_list;
}

async function map_entities(x) {
  // map object to array, and cut into batches.
  let j = x.entities.map((d) => {
    return d.wikidata;
  });

  const batch_count = Math.ceil(j.length / 100);
  let batches = Array();
  for (let i = 0; i < batch_count; i++) {
    batches[i] = j.slice(i * 100, (i + 1) * 100);
  }
  return batches;
}

async function query_wikidata(y) {
  // send batches to wikidata.
  return new Promise((resolve) => {
    setTimeout(() => {
      let wd_list = "wd:" + y.join(" wd:");
      let query =
        `select ?film ?filmLabel ?dirLabel ?year where {
           values ?film { wd:` +
        wd_list +
        ` } .
         ?film wdt:P57 ?dir .
         ?film  wdt:P577 ?year .
         service wikibase:label {bd:serviceParam wikibase:language "en". }}`;
      let sparql_request = d3.json(
        `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
        { headers: { accept: "application/sparql-results+json" } }
      );
      resolve(sparql_request);
    }, 500);
  });
}

async function cycle_query(x) {
  // cycle through batches.
  var initial_dataset = [];
  for (const id of x) {
    const data_chunk = await query_wikidata(id);
    initial_dataset.push(data_chunk);
  }
  return initial_dataset;
}

async function sparql_parsing(x) {
  let flat_array = [];

  x.forEach((d1) => {
    let mid = d1.results.bindings;
    mid.forEach((d2) => {
      flat_array.push(d2);
    });
  });

  let film_array = [];

  flat_array.forEach((d4) => {
    if (!film_array.includes(d4.film.value)) {
      film_array.push(d4.film.value);
    }
  });

  film_array = film_array.map((d) => {
    return { film: d };
  });

  film_array.forEach((d) => {
    let select = flat_array.filter((k) => {
      return k.film.value == d.film;
    });
    let years = [];
    select.forEach((b) => {
      years.push(parseInt(b.year.value.slice(0, 4)));
    });
    d.year = Math.min(...years);
    d.title = select.map((a) => {
      return a.filmLabel.value;
    })[0];
    d.director = Array.from(
      new Set(
        select.map((a) => {
          return a.dirLabel.value;
        })
      )
    ).join(", ");
    d.label = d.title + " [" + d.year + "]";
  });

  film_array.sort((a, b) => (a.year > b.year ? 1 : -1));

  return film_array;
}

async function draw_summary(x, y, text1, text2, film_id, col, inj) {

  console.log('my_data_x', x)

  console.log('my_data_y', y)


  console.log('my_data_text1', text1)


  console.log('my_data_text2', text2)
  let colour1 = "#D8DBE2"; // background
  let colour2 = "#373F51"; // static
  let colour3 = "#58A4B0"; // active

  d3.select("#canvas")
    .append("rect")
    .attr("class", 'summary_box'+inj)
    .attr('wikidata', film_id)
    .attr("x", x)
    .attr("y", y)
    .attr("rx", 10)
    .attr("ry", 10)
    .attr("width", 400)
    .attr("height", 80)
    .attr("opacity", 1)
    .style("pointer-events", "none")
    // .style("stroke", col)
    // .style("fill", col);

  d3.select("#canvas")
    .append("text")
    .attr("class", "summary_text1"+inj)
    .attr("x", x + 20)
    .attr("y", y + 30)
    .attr("opacity", 1)
    .style("pointer-events", "none")
    // .style("stroke", colour2) //colour2
    // .style("fill", colour2) //colour2
    .attr("font-family", "Spartan")
    .attr("font-weight", 500)
    .text(text1);

  d3.select("#canvas")
    .append("text")
    .attr("class", "summary_text2"+inj)
    .attr("x", x + 20)
    .attr("y", y + 60)
    .attr("opacity", 1)
    .style("pointer-events", "none")
    // .style("stroke", colour2) //colour2
    // .style("fill", colour2) //colour2
    .attr("font-family", "Spartan")
    .attr("font-weight", 200)
    .text(text2);

    if (inj == '') {
  let text_size1 = d3.select(".summary_text1").node().getBBox().width + 40;
  let text_size2 = d3.select(".summary_text2").node().getBBox().width + 40;
  let text_max = Math.max(text_size1, text_size2);
  d3.select(".summary_box").attr("width", text_max);
    } else {

  let text_size1 = d3.select(".summary_text1-focus").node().getBBox().width + 40;
  let text_size2 = d3.select(".summary_text2-focus").node().getBBox().width + 40;
  let text_max = Math.max(text_size1, text_size2);
  d3.select(".summary_box-focus").attr("width", text_max);

    }

  // d3.select(".summary_box").attr("fill", "green");
}

async function draw_detail_window() {
  // okay we need to draw the blue window and the x mark
  let colour1 = "#D8DBE2"; // background
  let colour2 = "#373F51"; // static
  let colour3 = "#58A4B0"; // active

  d3.select("#canvas")
    .append("rect")
    .attr("class", "detail_back")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("opacity", 0)
    .style("pointer-events", "all")
    .style("fill", colour2)

    .transition()
    .duration(500)
    .style("opacity", 1);

  // return ''
}

async function send_sparql_query(q) {
  let sparql_request = d3.json(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(q)}`,
    { headers: { accept: "application/sparql-results+json" } }
  );

  return sparql_request;
}

async function detail_query(data) {
  let wikidata_id = data.film.split("/");
  wikidata_id = wikidata_id[wikidata_id.length - 1];
  // console.log('hello', wikidata_id)

  // you want to build this up programmatically

  let attributes = {
    director: "P57",
    actor: "P161",
    voice: "P725",
    writer: "P58",
    dop: "P344",
    editor: "P1040",
    composer: "P86",
    producer: "P162",
    genre: "P136",
    rating: "P3156",
    colour: "P462",
    aspect: "P2061",
    duration: "P2047",
  };

  let build_query = "select";
  Object.keys(attributes).forEach((d) => (build_query += " ?" + d));
  Object.keys(attributes).forEach((d) => (build_query += " ?" + d + "Label"));
  build_query += " where {";
  Object.entries(attributes).forEach(
    (d) =>
      (build_query +=
        " optional { wd:" + wikidata_id + " wdt:" + d[1] + " ?" + d[0] + ".}")
  );
  build_query +=
    ' service wikibase:label {bd:serviceParam wikibase:language "en". }}';

  let sparql_request = d3.json(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(
      build_query
    )}`,
    { headers: { accept: "application/sparql-results+json" } }
  );

  // console.log(sparql_request)
  return sparql_request;
}

async function parse_detail_data(d) {
  let adjusted = d.results.bindings;

  // console.log('first instance', adjusted[0])

  let attributes = {
    director: "P57",
    actor: "P161",
    voice: "P725",
    writer: "P58",
    dop: "P344",
    editor: "P1040",
    composer: "P86",
    producer: "P162",
    genre: "P136",
    rating: "P3156",
    colour: "P462",
    aspect: "P2061",
    duration: "P2047",
  };

  let top_collection = {};

  Object.keys(attributes).forEach((a) => {
    if (Object.keys(adjusted[0]).includes(a)) {
      let coll = [];

      adjusted.forEach((b) => {
        coll.push({ link: b[a].value, label: b[a + "Label"].value });
      });

      // console.log(coll)

      filtered = Array.from(new Set(coll.map(JSON.stringify))).map(JSON.parse);

      // console.log(filtered)
      top_collection[a] = filtered;
      // console.log('break')
    }
  });

  return top_collection;
}

async function find_individual(wd) {
  // find triples matching individual.
  let query = `select ?a  where { ?a ?b wd:` + wd + `}`;
  let sparql_request = d3.json(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
    { headers: { accept: "application/sparql-results+json" } }
  );
  return sparql_request;
}

async function focus_attribute(d) {

  console.log(d)
  // focus specific nodes based on selected entity.

  let colour1 = "#D8DBE2"; // background
  let colour2 = "#373F51"; // static
  let colour3 = "#58A4B0"; // active

  let attribute = d.link.split("/");
  attribute = attribute[attribute.length - 1];

  console.log(attribute)
  let associations = await find_individual(attribute);
  associations = associations.results.bindings;
  let association_list = [...new Set(associations.map((d) => d.a.value))];

  console.log(association_list)



  d3.selectAll(".round-focus").attr("class", 'round')

  d3.selectAll(".round").attr("class", (d) => { console.log(d)
    if (association_list.includes(d.wikidata)) { return 'round-focus' } else { return 'round' }});


    d3.selectAll(".round-focus").attr("trigger", (d) => { return d.active = 'pos'})

    d3.selectAll(".round").attr("trigger", (d) => { return d.active = 'neg'})



      // if (association_list.includes(d.wikidata)) { return d.trigger = 'YEAH' } else { return d.trigger ='NOPE' }});
  


    // d3.selectAll(".summary_box").remove();

    // // d3.selectAll(".summary_box-focus").attr("class", 'summary_box')

    // // d3.select(".summary_box").attr("fill", (d) => { console.log(d)
    // //   if (association_list.includes(d.wikidata)) { return 'green' } else { return 'orange' }});
  

    // d3.selectAll(".summary_box").style("stroke", "green");
  
    // d3.selectAll(".summary_box").style("fill", "green");
  
    // d3.selectAll(".summary_box").attr("stroke", "green");
  
    // d3.selectAll(".summary_box").attr("fill", "green");

    // d3.select(".summary_box").style("stroke", "green");
  
    // d3.select(".summary_box").style("fill", "green");
  
    // d3.select(".summary_box").attr("stroke", "green");
  
    // d3.select(".summary_box").attr("fill", "green");
  

  //   if (association_list.includes(d.film)) { return 'round-focus' } else { return 'round' }});


  //   d3.selectAll(".summary_box-focus").attr("class", 'summary_box')

  //   d3.selectAll(".summary_box").attr("class", (d) => {
  //     if (association_list.includes(d.film)) { return 'summary_box-focus' } else { return 'summary_box' }});
  


  d3.select(".detail_back").remove();
  d3.select(".headertext").remove();
  d3.select(".testing").remove();
  d3.selectAll(".castlabel").remove();
  d3.selectAll(".casttext").remove();
  d3.selectAll(".cross").remove();

}

// async function focus_attribute(d) {
//   // focus specific attribute

//   let colour1 = "#D8DBE2"; // background
//   let colour2 = "#373F51"; // static
//   let colour3 = "#58A4B0"; // active

//   let attribute = d.link.split('/');
//   attribute = attribute[attribute.length -1]










// }








async function draw_head_text(data1, data2) {
  let colour1 = "#D8DBE2"; // background
  let colour2 = "#373F51"; // static
  let colour3 = "#58A4B0"; // active

  d3.select("#canvas")

    .append("text")
    .attr("class", "headertext")
    .attr("x", 200)
    .attr("y", (d, i) => {
      return i * 20 + 200;
    })
    .attr("opacity", 0) // make 0 and transition up
    .style("stroke", colour1)
    .style("fill", colour1)
    .attr("font-family", "Spartan")
    .attr("font-weight", 800)
    .attr("font-size", "50px")
    .text(data1.title)

    .append("tspan")
    .attr("font-weight", 200)
    .style("stroke", colour1)
    .style("fill", colour1)
    .text(" (")

    .append("tspan")
    .text(data1.year)

    .style("stroke", colour3)
    .style("fill", colour3)
    .attr("font-weight", 200)
    .on("click", (d, k) => {
      return console.log(data1.year); // search by year
    })
    .append("tspan")
    .attr("font-weight", 200)
    .style("stroke", colour1)
    .style("fill", colour1)
    .text(")");

  d3.select("#canvas")
    .selectAll("g")
    .data(["blah"])
    .join("text")
    .attr("class", "testing")
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

  // let director_list = data2.director;

  data2.director.forEach((d, i) => {
    // console.log(d, i)
    if (i != 0) {
      d3.select(".testing").append("tspan").text(", ");
    }

    d3.select(".testing")
      .append("tspan")
      .style("stroke", colour3) // COLOUR3
      .style("fill", colour3) // COLOUR3
      .style("opacity", 1)
      .text(d.label)
      .on("click", (e, k) => {
        // console.log("clicked");
        focus_attribute(d);
      });
  });

  let sorter = [
    { name: "cast", keys: ["actor", "voice"] },
    { name: "crew", keys: ["writer", "dop", "editor", "composer", "producer"] },
    { name: "info", keys: ["genre", "rating", "colour", "aspect", "duration"] },
  ];

  let detail_body = {};

  sorter.forEach((d) => {
    let detail_role = {};
    Object.entries(data2).forEach((x) => {
      if (d["keys"].includes(x[0])) {
        detail_role[x[0]] = x[1];
      }
    });
    detail_body[d["name"]] = detail_role;
  });

  console.log(detail_body);

  // Is there a point to collecting and then traversing?
  // the below code could probably be integrated above.

  Object.entries(detail_body).forEach((d, i) => {
    // console.log(d,i);

    let drop = 0;

    Object.entries(d[1]).forEach((e, j) => {
      d3.select("#canvas")
        .append("text")
        .attr("class", "castlabel")
        .attr("x", 200 + i * 500)
        .attr("y", drop * 20 + 400)
        .attr("opacity", 0)
        // .style("pointer-events", "all")
        .style("stroke", colour1)
        .style("fill", colour1)
        .attr("font-family", "Spartan")
        .attr("font-weight", 200)
        .text(e[0]);

      Object.entries(e[1]).forEach((f, k) => {
        d3.select("#canvas")
          .append("text")
          .attr("class", "casttext")
          .attr("x", 200 + i * 500 + 100)
          .attr("y", drop * 20 + 400)
          .attr("opacity", 0)
          .style("pointer-events", "all")
          .style("stroke", colour3)
          .style("fill", colour3)
          .attr("font-family", "Spartan")
          .attr("font-weight", 200)
          .text(f[1]["label"])
          .on("click", (d, k) => {
            // console.log("clicked detail");
            focus_attribute(f[1]);
          });

        drop += 1;
      });
    });
  });

  const distance = 15


    d3.select("#canvas")
    .append("line")
    .attr("class", "cross")
    .attr("x1", 0 + distance)
    .attr("x2", 20 + distance)
    .attr("y1", 20 + distance)
    .attr("y2", 0 + distance)
    .attr("opacity", 0)
    .style("stroke-width", "4px")
    .style("stroke", colour1)
    .style("fill", colour1);

  d3.select("#canvas")
    .append("line")
    .attr("class", "cross")
    .attr("x1", 20 + distance)
    .attr("x2", 0 + distance)
    .attr("y1", 20 + distance)
    .attr("y2", 0 + distance)
    .attr("opacity", 0)
    .style("stroke-width", "4px")
    .style("stroke", colour1)
    .style("fill", colour1);


    // actually transparent box is what takes you back


      d3.select("#canvas")
    .append("rect")
    .attr("x", distance)
    .attr("y", distance)
    .attr("width", 20)
    .attr("height", 20)
    .style("fill", "aqua")
    .style("opacity", 0)
    .on("click", (e, k) => {
      console.log("exit detail")
      d3.select(".detail_back").remove();
      d3.select(".headertext").remove();
      d3.select(".testing").remove();
      d3.selectAll(".castlabel").remove();
      d3.selectAll(".casttext").remove();
      d3.selectAll(".cross").remove();
      
    });


  d3.select(".headertext").transition().duration(5000).style("opacity", 1);
  d3.select(".testing").transition().duration(5000).style("opacity", 1);
  d3.selectAll(".castlabel").transition().duration(5000).style("opacity", 1);
  d3.selectAll(".casttext").transition().duration(5000).style("opacity", 1);
  d3.selectAll(".cross").transition().duration(5000).style("opacity", 1);
}

async function draw_detail(data) {
  await draw_detail_window();
  let detail_wikidata = await detail_query(data);

  // console.log(detail_wikidata);

  // parse this into something usable parse_detail_data

  let detail_data = await parse_detail_data(detail_wikidata);

  // okay you can grab this detail data and draw to screen

  // console.log("parsed", detail_data, data); // okay draw this thing to canvas

  await draw_head_text(data, detail_data);
  // await draw_body_text()

  // draw title

  // now we need a dedicated sparql query to pull up the second query
  // this is the detail_query

  // I think I want to bring up the detail window first
  // this allows for "loading" graphic
  // then draw sparql
  // exit is a fade then a destroy
}

async function draw_circles(data) {
  let colour1 = "#D8DBE2"; // background
  let colour2 = "#373F51"; // static
  let colour3 = "#58A4B0"; // active

  const row_length = 50;
  d3.select("#canvas")
    .selectAll("g")
    .data(data)
    .join("circle")
    .attr("class", "round")
    .attr("active", (d) => d.active = "neg")
    .attr('wikidata_id', (d) => d.wikidata = d.film)
    .attr("x_pos", (d, i) => (d.x = (i % row_length) * 24 + 100 + 10))
    .attr("y_pos", (d, i) => (d.y = Math.floor(i / row_length) * 24 + 100))
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 10)
    .style("opacity", 0)
    // .style("fill", colour2)
    .on("mouseover", (k, d) => {

  console.log(k, d)

  console.log(d.trigger)

  if (d.active == 'neg')

  { draw_summary(k.x, k.y, d.label, d.director, d.film, 'aqua', '')
  

  } else{

    draw_summary(k.x, k.y, d.label, d.director, d.film, 'pink', '-focus')



  }

  // console.log(d3.select('this').attr('cx'), 'ehllo paul')

      // if (association_list.includes(d.film)) { 
        
      //   draw_summary(k.x, k.y, d.label, d.director, d.film, 'aqua');
      //    } else {    draw_summary(k.x, k.y, d.label, d.director, d.film, 'pink'); };


      // draw_summary(k.x, k.y, d.label, d.director, d.film, my_colour);
      console.log(d, 'this data?')
    })
    .on("mouseout", () => {
      d3.selectAll(".summary_box").remove();
      d3.selectAll(".summary_box-focus").remove();
      d3.selectAll(".summary_text1").remove();
      d3.selectAll(".summary_text2").remove();
      d3.selectAll(".summary_text1-focus").remove();
      d3.selectAll(".summary_text2-focus").remove();
    })
    .on("click", (e, k) => draw_detail(k));

  d3.selectAll(".round").transition("a").duration(500).style("opacity", 1);
  // d3.selectAll(".round").transition("b").duration(500).style("fill", colour3);
  // .on("click", (d, k) = {});
  // .on("click", (d, k) = {});

  // on mouseover do something
}

async function australian_filmography() {
  // console.log("boing");

  // setup d3 env (possibly with loading status)

  let association_list = [];

  await setup_canvas();

  let data_set = await load_json();
  let mapped_data = await map_entities(data_set);
  let question = await cycle_query(mapped_data);
  let sparql_parsed = await sparql_parsing(question);

  await draw_circles(sparql_parsed);

  console.log(sparql_parsed);

  // populate d3 with start position

  console.log("do something else");
}

australian_filmography();


// // // // work to be done:

// // // // ---- split first wikidata query out into a module.

// // // // ---- note that two feature currently have no directors listed, so test adding data wikidata side.

// // // // ---- tweak to be able to select year and length

// // // // ---- scroll graphs

// // // // ---- add an "edit this data yourself" link

// // // // ---- add an "about this project" page
