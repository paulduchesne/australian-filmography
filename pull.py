# pull down turtle from Wikidata.

import json
import pathlib
import pydash
import requests
import tqdm

with open(pathlib.Path.cwd() / 'corpus.json') as corpus:
    corpus = pydash.get(json.load(corpus), 'works')

for x in tqdm.tqdm(corpus):
    path = f"https://www.wikidata.org/wiki/Special:EntityData/{x['wikidata_id']}.ttl?flavor=simple"
    response = requests.get(path)
    if response.status_code == 200:
        local = pathlib.Path.cwd() / 'data' / f"{x['wikidata_id']}.ttl"
        with open(local, 'w') as export:
            export.write(response.text)
    else:
        raise Exception(f"Cound not fetch {x['wikidata_id']}.")
