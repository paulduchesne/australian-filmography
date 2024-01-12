
from flask import Flask, render_template
import json
import pathlib
import rdflib

def single_field(subj, pred):

    label = [o for s,p,o in graph.triples((rdflib.URIRef(subj), pred, None))]  
    if len(label) != 1:
        raise Exception('Excepected one label.')

    return str(label[0])

def multi_field(subj, pred):

    cast_collect = list()
    for s,p,o in graph.triples((rdflib.URIRef(subj),pred, None)):
        role = ''
        link = ''  
        link_text = ''
        for a,b,c in graph.triples((o, rdflib.RDFS.label, None)):
            role = c        
        for a,b,c in graph.triples((o, rdflib.URIRef('http://ausfilm/model/hasAttribute'), None)):
            link = c
            for d,e,f in graph.triples((c, rdflib.RDFS.label, None)):
                link_text = f

        cast_collect.append({'role':str(role), 'link':str(link), 'link_text':str(link_text)})
    
    return cast_collect

graph = rdflib.Graph().parse(pathlib.Path.cwd() / 'filmography.ttl')

app = Flask(__name__)

entity_list = ['79e59e72aa7e88bfef67061df94e7e5e', '1f19bbe728063fbfdddbb910ccd88309']

@app.route('/<entity>', methods=['GET'])
def entity_page(entity):
    if entity in entity_list:
        entity_url = f'http://ausfilm/entity/{entity}'

        payload = {}
        payload['label'] = single_field(entity_url, rdflib.RDFS.label)
        payload['description'] = single_field(entity_url, rdflib.URIRef('http://purl.org/dc/elements/1.1/description'))
        payload['cast'] = multi_field(entity_url, rdflib.URIRef('http://ausfilm/model/hasCast'))
        payload['crew'] = multi_field(entity_url, rdflib.URIRef('http://ausfilm/model/hasCrew'))
        payload['detail'] = multi_field(entity_url, rdflib.URIRef('http://ausfilm/model/hasDetail'))    
        payload['link'] = single_field(entity_url, rdflib.URIRef('http://ausfilm/model/link'))

        return render_template('entity.html', data=payload)
    else:
        return render_template('404.html')

if __name__ == "__main__":
    app.run(debug=True, port=5000)