
import hashlib
import json
import pandas
import pathlib
import pydash
import requests
import rdflib
import tqdm

def encode_identifier(text, cat):

    ''' Encode Wikidata identifiers to hashes. '''

    x = pathlib.Path(text).name
    x = hashlib.md5(x.encode('utf-8')).hexdigest()
    x = rdflib.URIRef(f'http://ausfilm/{cat}/{x}')
   
    return x

def pull_label(graph, uri):

    temp = rdflib.Graph()
    for a,b,c in graph.triples((uri, rdflib.RDFS.label, None)):
        if c.language == 'en':
            temp.add((uri, rdflib.RDFS.label, c))

    return temp


# parse film corpus.

graph = rdflib.Graph().parse(pathlib.Path.cwd() / 'corpus.ttl')
film_list = [s for s, p, o in graph.triples((None, rdflib.RDF.type, rdflib.URIRef('http://ausfilm/model/film')))]

# for each film pull data from wikidata 
# note to self, this should really be XSLT direct to html.

for s in tqdm.tqdm(film_list):
 
    wikidata_id = pathlib.Path(s).stem
    
    path = f'https://www.wikidata.org/wiki/Special:EntityData/{wikidata_id}.ttl'
    response = requests.get(path)
    if response.status_code != 200:
        raise Exception('Something went wrong!')

    wikidata_graph = rdflib.Graph().parse(data=response.text)
    graph += pull_label(wikidata_graph, s)

    for x in ['P161', 'P725']:

        cast_query = '''
            select ?actor ?role where {
                wd:'''+wikidata_id+''' ?p ?state.
                ?state ps:'''+x+''' ?actor.
                optional {?state pq:P4633 ?role }.  
                }'''

        for y in wikidata_graph.query(cast_query):
            cast_bnode = rdflib.BNode()
            graph.add((s, rdflib.URIRef('http://ausfilm/model/hasCast'), cast_bnode))
            graph.add((cast_bnode, rdflib.URIRef('http://ausfilm/model/hasAttribute'), y[0]))
            graph += pull_label(wikidata_graph, y[0])
            if y[1]:
                graph.add((cast_bnode, rdflib.RDFS.label, y[1]))
                
    for a,b in {
        rdflib.URIRef('http://www.wikidata.org/prop/direct/P57'): 'director',
        rdflib.URIRef('http://www.wikidata.org/prop/direct/P58'): 'writer',
        rdflib.URIRef('http://www.wikidata.org/prop/direct/P344'): 'dop',
        rdflib.URIRef('http://www.wikidata.org/prop/direct/P1040'): 'editor',
        rdflib.URIRef('http://www.wikidata.org/prop/direct/P86'): 'composer',
        rdflib.URIRef('http://www.wikidata.org/prop/direct/P162'): 'producer',
       }.items():
        for j,k,l in wikidata_graph.triples((s, rdflib.URIRef(a), None)):
            cast_bnode = rdflib.BNode()
            graph.add((s, rdflib.URIRef('http://ausfilm/model/hasCrew'), cast_bnode))
            graph.add((cast_bnode, rdflib.URIRef('http://ausfilm/model/hasAttribute'), l))
            graph.add((cast_bnode, rdflib.RDFS.label, rdflib.Literal(b)))
            graph += pull_label(wikidata_graph, l)
                
    for a,b in {
        rdflib.URIRef('http://www.wikidata.org/prop/direct/P136'): 'genre',
        rdflib.URIRef('http://www.wikidata.org/prop/direct/P3156'): 'rating',
        rdflib.URIRef('http://www.wikidata.org/prop/direct/P462'): 'colour',
        rdflib.URIRef('http://www.wikidata.org/prop/direct/P2061'): 'aspect',
        rdflib.URIRef('http://www.wikidata.org/prop/direct/P2047'): 'duration',
        rdflib.URIRef('http://www.wikidata.org/prop/direct/P577'): 'year',
        }.items():
        for j,k,l in wikidata_graph.triples((s, rdflib.URIRef(a), None)):
            cast_bnode = rdflib.BNode()
            graph.add((s, rdflib.URIRef('http://ausfilm/model/hasDetail'), cast_bnode))
            graph.add((cast_bnode, rdflib.URIRef('http://ausfilm/model/hasAttribute'), l))
            graph.add((cast_bnode, rdflib.RDFS.label, rdflib.Literal(b)))
            graph += pull_label(wikidata_graph, l)

    graph.add((s, rdflib.URIRef('http://ausfilm/model/link'), rdflib.Literal(wikidata_id)))

result_graph = rdflib.Graph()
for s,p,o in graph.triples((None, None, None)):

    if type(s) == type(rdflib.URIRef('')):
        if 'wikidata' in str(s):
            s = encode_identifier(s, 'entity')

    if type(o) == type(rdflib.URIRef('')):
        if 'wikidata' in str(o):
            o = encode_identifier(o, 'entity')

    result_graph.add((s, p, o))

for s,p,o in result_graph.triples((None, rdflib.RDF.type, rdflib.URIRef('http://ausfilm/model/film'))):
    slug_query = '''
        select distinct ?director where {
            <'''+str(s)+'''> ?b ?c.
            ?c ?d "director" .
            ?c <http://ausfilm/model/hasAttribute> ?e.
            ?e rdfs:label ?director .
        }'''

    director_df = pandas.DataFrame(result_graph.query(slug_query), columns=['director'])
    slug = '/'.join([str(x) for x in list(director_df.director.unique())])+' '

    slug_query = '''
        select distinct ?year where {
            <'''+str(s)+'''> ?b ?c.
            ?c ?d "year" .
            ?c <http://ausfilm/model/hasAttribute> ?year.
        }'''

  
    year_df = pandas.DataFrame(result_graph.query(slug_query), columns=['year'])
    slug += str(min([int(x[:4]) for x in list(year_df.year.unique())]))
    result_graph.add((s, rdflib.URIRef('http://purl.org/dc/elements/1.1/description'), rdflib.Literal(slug)))

result_graph.serialize(destination=pathlib.Path.cwd() / 'filmography.ttl', format='ttl')

print(result_graph.serialize(format='ttl'))
