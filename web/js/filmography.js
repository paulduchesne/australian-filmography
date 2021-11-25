
// australian-filmography
// paul duchesne
// d3.js interactive visualisation of wikidata australian film data

/*

// live sparql query

var query = `SELECT ?item ?itemLabel (YEAR(MIN(?pub_date)) as ?pub)
  WHERE {?item p:P31/wdt:P279* ?item_s_0Statement .?item_s_0Statement ps:P31/wdt:P279* wd:Q11424.
  ?item  wdt:P495 wd:Q408.
  ?item  wdt:P577 ?pub_date.
  SERVICE wikibase:label {bd:serviceParam wikibase:language "en". }}
  GROUP BY ?item ?itemLabel`

var request = d3.json(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`, 
    {headers: {accept: "application/sparql-results+json"}})

request.then(function(data) { 
    var filmography_data = data.results.bindings;
*/

/*

// full sparql query

var film_query = `SELECT ?director ?directorLabel ?actor ?actorLabel ?voice ?voiceLabel
        ?writer ?writerLabel ?dop ?dopLabel ?editor ?editorLabel ?composer ?composerLabel 
        ?producer ?producerLabel ?genre ?genreLabel ?rating ?ratingLabel
        ?colour ?colourLabel ?aspect ?aspectLabel ?duration
        WHERE {
            OPTIONAL { wd:`+film_id+` wdt:P57 ?director. }
            OPTIONAL { wd:`+film_id+` wdt:P161 ?actor. }
            OPTIONAL { wd:`+film_id+` wdt:P725 ?voice. }
            OPTIONAL { wd:`+film_id+` wdt:P58 ?writer. }
            OPTIONAL { wd:`+film_id+` wdt:P344 ?dop. }
            OPTIONAL { wd:`+film_id+` wdt:P1040 ?editor. }
            OPTIONAL { wd:`+film_id+` wdt:P86 ?composer. }
            OPTIONAL { wd:`+film_id+` wdt:P162 ?producer. }
            OPTIONAL { wd:`+film_id+` wdt:P136 ?genre. }
            OPTIONAL { wd:`+film_id+` wdt:P3156 ?rating. }
            OPTIONAL { wd:`+film_id+` wdt:P462 ?colour. }
            OPTIONAL { wd:`+film_id+` wdt:P2061 ?aspect. }
            OPTIONAL { wd:`+film_id+` wdt:P2047 ?duration. }
        SERVICE wikibase:label {bd:serviceParam wikibase:language "en". }}`

        var director_data = parse_wikidata(film_detail, 'directorLabel', 'director')
        var actor_data = parse_wikidata(film_detail, 'actorLabel', 'actor')
        var voice_data = parse_wikidata(film_detail, 'voiceLabel', 'voice')
        var writer_data = parse_wikidata(film_detail, 'writerLabel', 'writer')
        var dop_data = parse_wikidata(film_detail, 'dopLabel', 'dop')
        var editor_data = parse_wikidata(film_detail, 'editorLabel', 'editor')
        var composer_data = parse_wikidata(film_detail, 'composerLabel', 'composer')
        var producer_data = parse_wikidata(film_detail, 'producerLabel', 'producer')
*/

// offline data

var request = d3.json('/web/json/offline-data.json')
request.then(function(filmography_data) {

    // extract qcode directly for subsequent queries

    filmography_data.forEach((o,i,a) => a[i]['link'] = a[i]['item'].split('/').slice(-1)[0])
    console.log(filmography_data)

    // draw svg canvas

    canvas = d3.select('#paper')
        .append('svg')
        .attr('id', 'canvas')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('background-color', 'lime');

    // scale film by publication date

    let yearScale = d3.scaleLinear().domain([1900, 2020]).range([0, 800]);

    // draw circle nodes for each film
    // note that with live query, may require d.pub.value rather than d.pub

    d3.select('#canvas')
        .selectAll('circle')
        .data(filmography_data)
        .join('circle')
        .attr('class', 'nodes')
        .attr('cx', function(d, i){ return yearScale(d.pub)})
        .attr('cy', function(d, i){ return Math.floor(i / 100) * 10 + 10})   
        .attr('r', 4)  
        .style('fill', 'orange')
        .attr("pointer-events", "all")
        .attr('qcode', d => d.link)
        .attr('hover', function(d, i) { 
            return d.pub+' '+d.itemLabel
        })
        .on('mouseover', function(d, i) {
            return console.log(d3.select(this).attr('hover'))
        })
        .on('click', function(d, i) {

            // on node select, perform second sparql query to return infobox data for specific film

            d3.selectAll('.nodes').attr("pointer-events", "none").style("fill", "orange")
            d3.selectAll(".infotext").remove()

            var film_id = d3.select(this).attr('qcode')
            var film_query = `SELECT ?director ?directorLabel 
                WHERE {
                    OPTIONAL { wd:`+film_id+` wdt:P161 ?director. }
                SERVICE wikibase:label {bd:serviceParam wikibase:language "en". }}`

            var film_request = d3.json(`https://query.wikidata.org/sparql?query=${encodeURIComponent(film_query)}`, 
                {headers: {accept: "application/sparql-results+json"}})
        
            film_request.then(function(film_data) { 
                var film_detail = film_data.results.bindings
             
                function parse_wikidata(dat, lab, val) {
                    if (val in dat[0]) {
                        var subset = dat.map(function(e){
                            return {'label': e[lab].value, 'value': e[val].value}
                        })
                        subset = Array.from(new Set(subset.map(JSON.stringify))).map(JSON.parse);
                        return subset
                    } else {
                        return []
                    }
                }

                var director_data = parse_wikidata(film_detail, 'directorLabel', 'director')  
                director_data.forEach((o,i,a) => a[i]['link'] = a[i]['value'].split('/').slice(-1)[0])
                console.log(director_data)
            
                d3.select('.infobox').attr('opacity', 1)
                d3.select('#canvas')
                    .selectAll('text')
                    .data(director_data)
                    .join('text')
                    .attr('class', 'infotext')
                    .attr('x', 200)
                    .attr('y', function(d, i) { return i*15+200 })
                    .attr('fill', 'green').attr('t', 'green')
                    .attr('qcode', d => d.link)
                    .text(function(d, i) {return d.label})
                    .on('click', function(d, i) {

                        // on infobox link click, filter original nodes by colour
                        
                        var hook = d3.select(this).attr('qcode')
                        console.log(hook)
                        
                        var actor_query = `SELECT ?film WHERE {?film ?prop wd:`+hook+`}`
                        var actor_request = d3.json(`https://query.wikidata.org/sparql?query=${encodeURIComponent(actor_query)}`, 
                            {headers: {accept: "application/sparql-results+json"}})
                        actor_request.then(function(actor_data) { 
                            var matches = actor_data.results.bindings
                            function wiki_id_extract_again(item) {
                                var elem = item.film.value.split('/')
                                return elem[elem.length-1];
                            }
                            
                            matches = matches.map(wiki_id_extract_again);
                            console.log(matches)
                            matches = matches.filter(x => x[0] == 'Q' && x.length < 16)
                            console.log(matches)
                            
                            d3.select('#canvas')
                                .selectAll('circle')
                                .data(filmography_data)
                                .join('circle')
                                .style('fill', function(d,i) {
                                    if (matches.includes(d.link)) {
                                        return 'blue'
                                    } else {
                                        return 'gold'}
                                    })
                            
                            // reset nodes for new selection            

                            d3.selectAll('.nodes').attr("pointer-events", "all")
                            d3.selectAll('.infobox').attr("pointer-events", "none").attr('opacity', 0)
                            d3.selectAll('.infotext').attr("pointer-events", "none").attr('opacity', 0)
                        }) 
                    })
            })
            console.log('CLICK!')
        })
            
        // define infobox

        d3.select('#canvas')
            .selectAll('rect')
            .data(['hello'])
            .join('rect')
            .attr('class', 'infobox')
            .attr('x', 100)
            .attr('y', 100)
            .attr('width', 200)
            .attr('height', 200)
            .attr('fill', 'pink')
            .attr('opacity', 0)
            .attr("pointer-events", "none")
});