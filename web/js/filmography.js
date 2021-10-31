console.log('hello')

// initial sparql query for all australian films.

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
        .attr('height', '50%')
        .style('background-color', 'lime');

    var row_len = 100  
    
    // draw square per entity
    // mouseover returns title/earliest pub date
    // click retrieves actors as seperate query

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

            var film_query = `SELECT ?actor ?actorLabel 
                WHERE {wd:`+film_id+` wdt:P161 ?actor
                SERVICE wikibase:label {bd:serviceParam wikibase:language "en". }}`

            var film_request = d3.json(`https://query.wikidata.org/sparql?query=${encodeURIComponent(film_query)}`, 
                {headers: {accept: "application/sparql-results+json"}})
            
            film_request.then(function(data) { 
                return console.log(data.results.bindings)
            })
        });
    })