# web application.

import json
import pandas
import pathlib
import pydash
import rdflib
import tqdm
from flask import Flask, render_template, request
from flask_frozen import Freezer

# load rdf source.

g = rdflib.Graph().parse('wikidata.json', format="json-ld")

# define flask web app.

app = Flask(__name__)
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_DESTINATION'] = 'docs'

# index page render.

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

# filter page render.

@app.route('/filter/<entity>/', methods=['GET', 'POST'])
def filter_page(entity):

    # filter_id = 'Q115057988'
    # incoming_filter = request.args.get('filter')
    # if incoming_filter:
    #     filter_id = incoming_filter

    filter_id = entity
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

# film page render.

@app.route('/film/<entity>/', methods=['GET', 'POST'])
def entity_page(entity):

    query = '''
        prefix wd: <http://www.wikidata.org/entity/>
        prefix wpd: <http://www.wikidata.org/prop/direct/>
        select distinct (str(?filmLabel) as ?lab) (YEAR(?date) AS ?year)
            ?director ?directorLabel ?writer ?writerLabel
            ?dop ?dopLabel ?editor ?editorLabel
            ?composer ?composerLabel ?producer ?producerLabel ?cast ?castLabel
            ?genre ?genreLabel ?rating ?ratingLabel
            ?colour ?colourLabel ?aspect ?aspectLabel
        where {
            values ?film { wd:'''+entity+''' }
            ?film wpd:P31 wd:Q11424.
            ?film rdfs:label ?filmLabel .
            ?film wpd:P577 ?date .
            ?film wpd:P57 ?director .
            ?director rdfs:label ?directorLabel .
            optional { ?film wpd:P58 ?writer . ?writer rdfs:label ?writerLabel . }
            optional { ?film wpd:P344 ?dop . ?dop rdfs:label ?dopLabel . }
            optional { ?film wpd:P1040 ?editor . ?editor rdfs:label ?editorLabel . }
            optional { ?film wpd:P86 ?composer . ?composer rdfs:label ?composerLabel . }
            optional { ?film wpd:P162 ?producer . ?producer rdfs:label ?producerLabel . }
            optional { ?film wpd:P161 ?cast . ?cast rdfs:label ?castLabel . }
            optional { ?film wpd:P136 ?genre . ?genre rdfs:label ?genreLabel . }
            optional { ?film wpd:P3156 ?rating . ?rating rdfs:label ?ratingLabel . }
            optional { ?film wpd:P462 ?colour . ?colour rdfs:label ?colourLabel . }
            optional { ?film wpd:P2061 ?aspect . ?aspect rdfs:label ?aspectLabel . }
        }
    '''

    cols = ['label', 'year', 'director', 'directorLabel',
            'writer', 'writerLabel', 'dop', 'dopLabel',
            'editor', 'editorLabel', 'composer', 'composerLabel',
            'producer', 'producerLabel', 'cast', 'castLabel', 'genre', 'genreLabel',
            'rating', 'ratingLabel', 'colour', 'colourLabel',
            'aspect', 'aspectLabel'
    ]

    results = g.query(query)
    df = pandas.DataFrame(results, columns=cols)
    for x in ['director', 'writer', 'dop', 'editor', 'composer', 'producer', 'cast', 'genre', 'rating', 'colour', 'aspect']:
        df[x] = df[x].str.split('/').str[-1]

    data = {
        'label': df[['label']].drop_duplicates().to_dict('records'),
        'year': df[['year']].drop_duplicates().to_dict('records'),
        'info':[]
    }

    crew_array = list()
    for x in ['cast']:
        crew_array.append({'attribute':x, 'data': df[[x, f'{x}Label']].rename(columns={x:'link',f'{x}Label':'label'}).drop_duplicates().to_dict('records')})

    data['info'].append({'section':'cast', 'payload':crew_array})

    crew_array = list()
    for x in ['director', 'writer', 'producer', 'dop', 'editor', 'composer']:
        crew_array.append({'attribute':x, 'data': df[[x, f'{x}Label']].rename(columns={x:'link',f'{x}Label':'label'}).drop_duplicates().to_dict('records')})

    data['info'].append({'section':'crew', 'payload':crew_array})

    crew_array = list()
    for x in ['genre', 'rating', 'colour', 'aspect']:
        crew_array.append({'attribute':x, 'data': df[[x, f'{x}Label']].rename(columns={x:'link',f'{x}Label':'label'}).drop_duplicates().to_dict('records')})

    data['info'].append({'section':'technical', 'payload':crew_array})

    return render_template('entity.html', data=data)

# about page render

@app.route('/about/', methods=['GET', 'POST'])
def about_page():
    return render_template('about.html')

# flask freeze functions.

freezer = Freezer(app)

@freezer.register_generator
def resource_generator():
    query = '''
        prefix wd: <http://www.wikidata.org/entity/>
        prefix wpd: <http://www.wikidata.org/prop/direct/>
        select ?film where {
            ?film wpd:P31 wd:Q11424 .
            ?film rdfs:label ?filmLabel .
            ?film wpd:P577 ?date .
            ?film wpd:P57 ?director .
            ?director rdfs:label ?directorLabel .
            }
        '''

    resources = g.query(query)
    for x in tqdm.tqdm(resources, desc='film'):
        yield 'entity_page', {'entity': str(x.film).split('/')[-1]}

@freezer.register_generator
def filter_generator():
    filters = pydash.uniq([s for s,p,o in g.triples((None, None, None))])
    for f in tqdm.tqdm(filters, desc='filter'):
        yield 'filter_page', {'entity': str(f).split('/')[-1]}

if __name__ == "__main__":
    freezer.freeze()
