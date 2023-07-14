from flask import Flask, render_template
import pandas
import pathlib
import rdflib

graph = rdflib.Graph()
for x in (pathlib.Path.cwd() / 'data').iterdir():
    graph += rdflib.Graph().parse(x)

print(len(graph))

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def home_page():
    
    query = '''
        prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> 
        prefix wd: <http://www.wikidata.org/entity/> 
        prefix wdt: <http://www.wikidata.org/prop/direct/> 
        select distinct ?work ?work_label ?director_label (min(?date) AS ?year) where {
            
            ?work wdt:P31 wd:Q11424 .
            ?work rdfs:label ?work_label .
            filter (lang(?work_label) = 'en')
            
            ?work wdt:P57 ?director .
            ?director rdfs:label ?director_label .
            filter (lang(?director_label) = 'en')

            ?work wdt:P577 ?date .
            } group by ?work ?director_label
            
            '''
    attributes = ['work', 'work_label', 'director_label', 'year']
    dataframe = pandas.DataFrame(columns=attributes)
    for x in graph.query(query):
        dataframe.loc[len(dataframe)] = [str(x[y]) for y in attributes]
    
    dataframe['year'] = dataframe['year'].astype(str).str[:4]
    dataframe = dataframe.pivot_table(index=['work', 'work_label', 'year'], aggfunc=lambda x: '/'.join(x)).reset_index()

    return render_template('home.html', data=dataframe.to_dict('records'))

if __name__ == "__main__":
    app.run(debug=True, port=5000)