# web application.

import json
import pandas
import rdflib
from flask import Flask, render_template, request

g = rdflib.Graph().parse('wikidata.json', format="json-ld")

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def home_page():

    filter_id = 'Q115057988'
    incoming_filter = request.args.get('filter')
    if incoming_filter:
        filter_id = incoming_filter

    query = '''
        prefix au: <http://ausfilmography/>
        prefix wd: <http://www.wikidata.org/entity/>
        prefix wpd: <http://www.wikidata.org/prop/direct/>
        construct {
            ?film rdfs:label ?filmLabel .
            ?film au:director ?directorLabel .
            ?film au:year ?year .
            ?film au:filter ?filter .
            }
        where {
            ?film wpd:P31 wd:Q11424.
            ?film rdfs:label ?filmLabel .
            ?film wpd:P57 ?director .
            ?director rdfs:label ?directorLabel .
            ?film wpd:P577 ?date .
            optional {
                ?film ?prop wd:'''+filter_id+''' .
                bind(?film as ?response)
            }
            bind(year(?date) AS ?year)
            bind(if(bound(?response), "true", "false") AS ?filter)
    }
    '''

    res = rdflib.Graph()
    res += g.query(query)

    submit_data = list()
    data = json.loads(res.serialize(format="json-ld", indent=4))

    for x in data:
        label_string = x["http://www.w3.org/2000/01/rdf-schema#label"][0]['@value']
        director_str = ', '.join(sorted([y['@value'] for y in x["http://ausfilmography/director"]]))
        year_str = min([y['@value'] for y in x["http://ausfilmography/year"]])

        new_dict = dict()
        new_dict['id'] = x['@id'].split('/')[-1]
        new_dict['year'] = int(year_str)
        new_dict['label'] = f'{label_string} ({year_str}, dir. {director_str})'.replace('"','')
        new_dict['filter'] = x["http://ausfilmography/filter"][0]['@value'].title()
        submit_data.append(new_dict)

    submit_data = sorted(submit_data, key=lambda x: x["year"])


    return render_template('index.html', data=json.loads(json.dumps(submit_data)))



if __name__ == "__main__":
    app.run(debug=True, port=5000)
