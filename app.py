from flask import Flask, request, jsonify
import pandas as pd
import pickle
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# Load data
new_movies = pd.read_pickle('new_movies.pkl')
similarity = pickle.load(open('similarity.pkl', 'rb'))

def fetch_movie_details(movie_id):
    api_key = "80eb1b3e976ae995601dc6e5462a74fa"
    url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={api_key}"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        poster_path = data.get('poster_path')
        genres = [g['name'] for g in data.get('genres', [])]
        return {
            'poster_url': f"https://image.tmdb.org/t/p/w500/{poster_path}" if poster_path else None,
            'genres': ", ".join(genres)
        }
    return {'poster_url': None, 'genres': ''}

def recommend(movie):
    if movie not in new_movies['title'].values:
        return []
    movie_index = new_movies[new_movies['title'] == movie].index[0]
    distances = similarity[movie_index]
    movies_list = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])[1:6]
    
    recommend_movies = []
    for i in movies_list:
        movie_id = new_movies.iloc[i[0]]['movie_id']
        title = new_movies.iloc[i[0]].title
        details = fetch_movie_details(movie_id)
        recommend_movies.append({
            'title': title,
            'poster_url': details['poster_url'],
            'genres': details['genres']
        })
    
    return recommend_movies

@app.route('/recommend', methods=['POST'])
def recommend_api():
    data = request.get_json()
    movie = data.get('movie')
    recommendations = recommend(movie)
    return jsonify({'recommendations': recommendations})

@app.route('/titles', methods=['GET'])
def get_titles():
    titles = new_movies['title'].tolist()
    return jsonify({'titles': titles})

if __name__ == '__main__':
    app.run(debug=True)