
import hashlib
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
    df = pandas.concat([df, pandas.read_csv(url)])

df = df.drop_duplicates(subset='wikidata', keep='first')
if len(df.loc[~df.wikidata.str.contains('Q', na=False)]):
    raise Exception('Wikidata ID should contains a Q.')

# pull wikidata data locally.

headers = {
    'User-Agent': 'australian-filmography/1.0 (pxxlhxslxn@proton.me)',
    'Accept': 'application/json'
}

for wikidata_id in tqdm.tqdm(df.wikidata.unique()[:10]):
    wikidata_id_hash = hashlib.md5(wikidata_id.encode()).hexdigest()
    json_path = pathlib.Path.cwd() / 'data' / f'{wikidata_id_hash}.json'

    if not json_path.exists():

        time.sleep(47)

        with open(pathlib.Path.cwd() / 'wikidata.rq') as query:
            query = query.read().replace('FILM', wikidata_id)

        r = requests.get("https://query.wikidata.org/sparql", params={"format": "text/xml", "query": query}, headers=headers)
        if r.status_code != 200:
            raise Exception(f'API {r.status_code}: {r.text}')

        json_path.parent.mkdir(exist_ok=True)
        g = rdflib.Graph().parse(data=r.text, format="xml")
        g.serialize(destination=json_path, format='json-ld')
