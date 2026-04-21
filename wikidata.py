
import hashlib
import io
import json
import pandas
import pathlib
import rdflib
import requests
import time
import tqdm

# filmography corpus.

df = pandas.DataFrame()
for dataset in ['pike-cooper', 'murray', 'stratton']:
    url = f'https://raw.githubusercontent.com/paulduchesne/{dataset}/refs/heads/develop/dataset.csv'
    datum = requests.get(url).content
    df = pandas.concat([df, pandas.read_csv(io.StringIO(datum.decode('utf-8')))])

df = df.drop_duplicates(subset='wikidata', keep='first')
if len(df.loc[~df.wikidata.str.contains('Q', na=False)]):
    raise Exception('Wikidata ID should contains a Q.')

# pull wikidata data locally.

headers = {
    'User-Agent': 'australian-filmography/1.0 (pxxlhxslxn@proton.me)',
    'Accept': 'application/json'
}

for wikidata_id in tqdm.tqdm(df.wikidata.unique()):
    wikidata_id_hash = hashlib.md5(wikidata_id.encode()).hexdigest()
    json_path = pathlib.Path.cwd() / 'data' / f'{wikidata_id_hash}.json'

    if not json_path.exists():

        time.sleep(17)

        with open(pathlib.Path.cwd() / 'wikidata.rq') as query:
            query = query.read().replace('FILM', wikidata_id)

        r = requests.get("https://query.wikidata.org/sparql", params={"format": "text/xml", "query": query}, headers=headers)
        if r.status_code != 200:
            raise Exception(f'API {r.status_code}: {r.text}')

        json_path.parent.mkdir(exist_ok=True)
        g = rdflib.Graph().parse(data=r.text, format="xml")
        g.serialize(destination=json_path, format='json-ld')

aggregated_file = list()
for json_file in (pathlib.Path.cwd() / 'data').iterdir():
    if json_file.suffix != '.json':
        continue

    with open(json_file) as json_data:
        json_data = json.load(json_data)

    aggregated_file += json_data

with open(pathlib.Path.cwd() / 'wikidata.json', 'w') as aggregated_out:
    json.dump(aggregated_file, aggregated_out, ensure_ascii=False, indent=4)

# TODO: it would be good to add a survey of available data points for each record.
#

print(len(aggregated_file))

g = rdflib.Graph().parse('wikidata.json', format="json-ld")

# derive a list of all films.

query = '''
    prefix au: <http://ausfilmography/>
    prefix wd: <http://www.wikidata.org/entity/>
    prefix wpd: <http://www.wikidata.org/prop/direct/>
    select distinct ?film
    where {
        ?film wpd:P31 wd:Q11424
        }
    '''

result = g.query(query)
wikidata_ids = ['wd:'+pathlib.Path(x.film).stem for x in result]

# derive a list of film properties.

query = '''
    prefix au: <http://ausfilmography/>
    prefix wd: <http://www.wikidata.org/entity/>
    prefix wpd: <http://www.wikidata.org/prop/direct/>
    select distinct ?prop
    where {
        values ?film {'''+' '.join(wikidata_ids)+'''}
        ?film ?prop ?value .
        }
    '''

result = g.query(query)
props = [x.prop for x in result]

# report on coverage of each property.

for p in sorted(props):

    p = pathlib.Path(p).stem
    if p[0] != 'P':
        continue

    query = '''
        prefix au: <http://ausfilmography/>
        prefix wd: <http://www.wikidata.org/entity/>
        prefix wpd: <http://www.wikidata.org/prop/direct/>
        select distinct ?film
        where {
            values ?prop { wpd:'''+p+''' }
            ?film ?prop ?value .
            }
        '''

    result = g.query(query)
    matching_films = [x.film for x in result]
    ratio = round(len(matching_films)/len(wikidata_ids), 2)
    print(p, ratio)

# TODO: this needs some further work,
# likely due to not all films being "films", ie Q11424.
# First pass should probably be to assess what are in scope entities
# which we can do explicitly as we have source ids from the datasets.
