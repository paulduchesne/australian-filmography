console.log('hello')

// initial sparql query for all australian films.
// note: sparql query really needs to be a reusable function.

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
    
    console.log(filmography_data);

    canvas = d3.select('#paper')
        .append('svg')
        .attr('id', 'canvas')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('background-color', 'lime');

    var row_len = 100  
    
    // draw square per entity
    // mouseover returns title/earliest pub date
    // click retrieves actors as seperate query

    // note: you really want to generate wiki link in the object direct, not transform in the d3.
    // see awkward regeneration of wiki qcode at various points!

    d3.select('#canvas')
        .selectAll('rect')
        .data(filmography_data)
        .join('rect')
        .attr('x', function(d, i){ return ( i % row_len * 10) + 10})
        .attr('y', function(d, i){ return Math.floor(i / row_len) * 10 + 10})     
        .attr('width', 8)
        .attr('height', 8)
        .attr('hover', function(d, i) { 
            return d.itemLabel.value + ' (' + d.pub.value + ')'
        })
        .attr('link', function(d, i) {
            var address = d.item.value.split('/')
            return address[address.length-1]
        })
        .style('fill', 'orange')
        .on('mouseover', function(d, i) {
            return console.log(d3.select(this).attr('hover'))
        })
        .on('click', function(d, i) {

            var film_id = d3.select(this).attr('link')
            console.log(film_id)

            var film_summary = d3.select(this).attr('hover')

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

            var film_request = d3.json(`https://query.wikidata.org/sparql?query=${encodeURIComponent(film_query)}`, 
                {headers: {accept: "application/sparql-results+json"}})
            
            film_request.then(function(data) { 

                var film_detail = data.results.bindings
                console.log(film_detail)
        
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
                var actor_data = parse_wikidata(film_detail, 'actorLabel', 'actor')
                var voice_data = parse_wikidata(film_detail, 'voiceLabel', 'voice')
                var writer_data = parse_wikidata(film_detail, 'writerLabel', 'writer')
                var dop_data = parse_wikidata(film_detail, 'dopLabel', 'dop')
                var editor_data = parse_wikidata(film_detail, 'editorLabel', 'editor')
                var composer_data = parse_wikidata(film_detail, 'composerLabel', 'composer')
                var producer_data = parse_wikidata(film_detail, 'producerLabel', 'producer')
        
                console.log(film_summary)
                console.log(director_data)
                console.log(actor_data)
                console.log(voice_data)
                console.log(writer_data)
                console.log(dop_data)
                console.log(editor_data)
                console.log(composer_data)
                console.log(producer_data)

                 /*
                d3.select('#canvas')
                .selectAll('text')
                .data(cast)
                .join('text')
                .attr('x', 100)
                .attr('y', function(d, i) { return i*100+100 })
                .attr('wiki-id', function(d,i) { 
                    var address = d.actor.value.split('/')
                    return address[address.length-1]
                })
                .text(function(d, i) {return d.actorLabel.value})
                */

                /*
                .on('click', function(d, i) { 

                    var link = d3.select(this).attr('wiki-id')

                    var actor_query = `SELECT ?film 
                        WHERE {?film ?prop wd:`+link+`}`
    
                    var actor_request = d3.json(`https://query.wikidata.org/sparql?query=${encodeURIComponent(actor_query)}`, 
                        {headers: {accept: "application/sparql-results+json"}})
                
                    actor_request.then(function(actor_data) { 
                        var matches = actor_data.results.bindings
                    
                        matches = matches.map(wiki_id_extract_again);
                          
                        function wiki_id_extract_again(item) {
                            var elem = item.film.value.split('/')
                            return elem[elem.length-1];
                        }

                        matches = matches.filter(x => x[0] == 'Q' && x.length < 16)

                        d3.select('#canvas')
                            .selectAll('rect')
                            .data(filmography_data)
                            .join('rect')
                            .style('fill', function(d,i) {
                                var address = d.item.value.split('/'); 
                                if (matches.includes(address[address.length-1])) {
                                    return 'blue'
                                } else {
                                    return 'gold'}
                                })
                        return console.log(matches)
                    })
                })

                return console.log('cast', cast)

                */

                // intention would be to draw cast+crew+tech data as seperate infobox
                // these elements can then be highlighted to filter down the original sample

                // so main screen, with umenu to select different plots, node mouseover for label (or maybe auto text+arm)
                // on click load seperate infobox, and on click of element, recolour chart, unused goes to grey and drop labels.
                // probably a "clear" uption to return to original state.

            })
        });
    })