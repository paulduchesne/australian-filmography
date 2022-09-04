import json
import pathlib

with open(pathlib.Path.cwd() / 'entities.js') as ent:
    ent = ent.read().split('\n')
    ent = [x.split('//')[0].strip() for x in ent]
    ent = [{'wikidata':x} for x in ent if 'Q' in x]

export = {'entities': ent}

with open(pathlib.Path.cwd() / 'entities.json', 'w') as exp:
    json.dump(export, exp, indent=2)

print(len(ent), 'entities.')
