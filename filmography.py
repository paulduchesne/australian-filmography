
import pandas
import requests

# first dataset: corpus from dataset repositories.

df1 = pandas.DataFrame()
for dataset in ['pike-cooper', 'murray', 'stratton']:
    url = f'https://raw.githubusercontent.com/paulduchesne/{dataset}/refs/heads/main/dataset.csv'
    df1 = pandas.concat([df1, pandas.read_csv(url)])

df1 = df1.drop_duplicates(subset='wikidata', keep='first')
if len(df1.loc[~df1.wikidata.str.contains('Q', na=False)]):
    raise Exception('Wikidata ID should contains a Q.')

# second dataset: live query from Wikidata.

headers = {
    'User-Agent': 'australian-filmography/1.0 (pxxlhxslxn@proton.me)',
    'Accept': 'application/json'
}

query = '''
    select distinct ?wikidata ?wikidataLabel
    where {
        ?wikidata wdt:P31 wd:Q11424 .
        ?wikidata wdt:P495 wd:Q408 .
        service wikibase:label { bd:serviceParam wikibase:language "en". }
    } '''

r = requests.get('https://query.wikidata.org/sparql', params={'format': 'json', 'query': query}, headers=headers)
if r.status_code != 200:
    raise Exception(f'API {r.status_code}: {r.text}')

df2 = pandas.DataFrame(r.json()['results']['bindings'])
df2['wikidata'] = df2['wikidata'].apply(lambda x: x['value'].split('/')[-1])
df2['wikidataLabel'] = df2['wikidataLabel'].apply(lambda x: x['value'])
df2 = df2.rename(columns={'wikidataLabel':'label'})
df2 = df2.drop_duplicates(subset='wikidata', keep='first')
if len(df2.loc[~df2.wikidata.str.contains('Q', na=False)]):
    raise Exception('Wikidata ID should contains a Q.')

# report crossover, or not.
# TODO: render this as wikidata.json.

# print(f'Entities present in both datasets: {len(df1.loc[df1.wikidata.isin(df2.wikidata)])}.')
# print(f'Entities present in first, but not second dataset: {len(df1.loc[~df1.wikidata.isin(df2.wikidata)])}.')
# print(f'Entities present in second, but not first dataset: {len(df2.loc[~df2.wikidata.isin(df1.wikidata)])}.')
