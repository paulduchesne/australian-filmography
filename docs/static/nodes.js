async function drawNodes(nodes) {

    const limit = 50

    let nodes_pos = nodes.map((d, i) => {
        return { ...d, pos: [i % limit, Math.floor(i / limit)] };
    });

    console.log(nodes)

    d3.select("#paper")
        .append("svg")
        .attr("id", "canvas")
        .attr("width", '100%')
        .attr("height", 500)
        .style("background-color", "#FFE5B4");

    d3.select('#canvas')
        .selectAll('.rounds')
        .data(nodes_pos)
        .join('circle')
        .attr("class", "rounds")
        .attr('cx', d => ((d.pos[0]) * 14)+6)
        .attr('cy', d => (d.pos[1] + 1) * 14)
        .attr('r', "5")
        .style('fill', d => {if (d.filter == 'True') {return '#FF7043'} else {return '#FFCCBC'}})
        .on('mouseover', function(k, d) {
            let anchor_x = d3.select(this).attr('cx');
            let anchor_y = d3.select(this).attr('cy');
            d3.select('#tooltext').text(d['label'])
            let text_width = parseInt(d3.select('#tooltext').node().getBBox().width)+40;
            d3.select('#toolsquare').attr('y', anchor_y).attr('x', anchor_x).attr('width', text_width).attr('opacity', 1)
            d3.select('#tooltext').attr('y', parseInt(anchor_y)+20).attr('x', parseInt(anchor_x)+20).attr('opacity', 1)
            d3.select(this).style( 'stroke-width', '2px')
        })
        .on('mouseout', function(k, d) {
            d3.select('#toolsquare').attr('opacity', 0)
            d3.select('#tooltext').attr('opacity', 0)
            d3.selectAll('.rounds').style( 'stroke-width', '1px')

        })
        .on('click', function(k, d) {
            window.location.href = '/film/'+d['id'];
        })

    d3.select('#canvas')
        .append('rect')
        .attr('id', 'toolsquare')
        .attr('x', 100)
        .attr('y', 100)
        .attr('width', 100)
        .attr('height', 30)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr('opacity', 0)
        .attr('fill', '#FF7043')
        .attr('pointer-events', 'none');

    d3.select('#canvas')
        .append('text')
        .attr('id', 'tooltext')
        .attr('x', 100+20)
        .attr('y', 100+20)
        .text('hello')
        .attr('fill', '#FFE5B4')
        .attr('opacity', 0)
        .attr('pointer-events', 'none');

}

drawNodes(nodes_data);
