
import hashlib
import json
import pathlib
import pydash
import requests
import rdflib
import tqdm

def encode_identifier(text, cat):

    ''' Encode Wikidata identifiers to hashes. '''

    x = pathlib.Path(text).name
    x = hashlib.md5(x.encode('utf-8')).hexdigest()
    x = rdflib.URIRef(f'//ausfilm/{cat}/{x}')
   
    return x

with open(pathlib.Path.cwd() / 'filmography.json') as corpus:
    corpus = json.load(corpus)

graph = rdflib.Graph()

for x in tqdm.tqdm(corpus['works']):
    path = f"https://www.wikidata.org/wiki/Special:EntityData/{x['wikidata_id']}.ttl"
    response = requests.get(path)
    if response.status_code == 200:
        graph += rdflib.Graph().parse(data=response.text)
    else:
        raise Exception(f"Cound not fetch {x['wikidata_id']}.")

result_graph = rdflib.Graph()

for a,b in {
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P57'): rdflib.URIRef('//ausfilm/property/director'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P161'): rdflib.URIRef('//ausfilm/property/actor'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P725'): rdflib.URIRef('//ausfilm/property/voice'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P58'): rdflib.URIRef('//ausfilm/property/writer'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P344'): rdflib.URIRef('//ausfilm/property/dop'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P1040'): rdflib.URIRef('//ausfilm/property/editor'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P86'): rdflib.URIRef('//ausfilm/property/composer'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P162'): rdflib.URIRef('//ausfilm/property/producer'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P136'): rdflib.URIRef('//ausfilm/property/genre'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P3156'): rdflib.URIRef('//ausfilm/property/rating'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P462'): rdflib.URIRef('//ausfilm/property/colour'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P2061'): rdflib.URIRef('//ausfilm/property/aspect'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P2047'): rdflib.URIRef('//ausfilm/property/duration'),
    rdflib.URIRef('http://www.wikidata.org/prop/direct/P577'): rdflib.URIRef('//ausfilm/property/year'),
    }.items():

    for s,p,o in graph.triples((None, a, None)):

        # okay what if you do the transformation here, but you also log all the wikidata ids you need to pull later
        # so you want to do a rename on the s, transfer it to the expected name which is ausfilm/entity/uuid
        # but you also need to log the original for later processing

        s_label = ''
        for x,y,z in graph.triples((s, rdflib.RDFS.label, None)):
            if z.language == 'en':
                s_label = z

        s = encode_identifier(s, 'entity')
   
        # note that you probably want to keep the wikidata address as you will probably want a triple which links back to wikidata
        # eg, found a mistake, edit here!!

        if len(s_label):
            result_graph.add((s, rdflib.RDFS.label, rdflib.Literal(s_label)))

        if type(o) == type(rdflib.URIRef('')):

            o_label = ''
            for x,y,z in graph.triples((o, rdflib.RDFS.label, None)):
                if z.language == 'en':
                    o_label = z

            o = encode_identifier(o, 'attribute')

            if len(o_label):
                result_graph.add((o, rdflib.RDFS.label, rdflib.Literal(o_label)))

        result_graph.add((s, b, o))

result_graph.serialize(destination=pathlib.Path.cwd() / 'filmography.ttl', format='turtle')

