import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function MovieCard({ title, poster_url, genres }) {
  return (
    <div className="card fade-in">
      <img src={poster_url || 'https://via.placeholder.com/150'} className="card-img-top" alt={title} />
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        <div className="genres-container">
          {genres.split(', ').map((genre, index) => (
            <span key={index} className="genre-box" style={{ backgroundColor: getRandomColor(index) }}>
              {genre}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [movieTitle, setMovieTitle] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    axios.get('http://localhost:5000/titles')
      .then(response => setSuggestions(response.data.titles))
      .catch(err => console.error('Error fetching titles:', err));
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMovieTitle(value);
    if (value) {
      const filteredSuggestions = suggestions.filter(title =>
        title.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setMovieTitle(suggestion);
    setShowSuggestions(false);
  };

  const handleRecommend = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:5000/recommend', { movie: movieTitle });
      setRecommendations(response.data.recommendations);
      if (response.data.recommendations.length === 0) {
        setError('No recommendations found for this movie.');
      }
    } catch (err) {
      setError('An error occurred while fetching recommendations.');
    }
    setLoading(false);
  };

  // Adjust dropdown position to attach below search bar with a gap
  const getDropdownStyle = () => {
    const inputRect = inputRef.current.getBoundingClientRect();
    return {
      top: inputRect.bottom + window.scrollY + 5 + 'px', // 5px gap
      left: inputRect.left + window.scrollX + 'px',
      width: inputRect.width + 'px',
      zIndex: recommendations.length > 0 ? 1000 : 500, // Higher z-index when cards are present
    };
  };

  return (
    <div className="app-container">
      <h1 className="text-center mb-4">Movie Recommender</h1>
      <div className="input-container fade-in">
        <input
          ref={inputRef}
          type="text"
          className="search-bar"
          placeholder="Enter movie title"
          value={movieTitle}
          onChange={handleInputChange}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => setShowSuggestions(true)}
        />
        {showSuggestions && (
          <ul className="suggestions-list fade-in" style={getDropdownStyle()}>
            {suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSuggestionClick(suggestion)} className="suggestion-item">
                {suggestion}
              </li>
            ))}
          </ul>
        )}
        <button
          className="recommend-button fade-in"
          onClick={handleRecommend}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Recommend'}
        </button>
      </div>
      {error && <div className="alert alert-danger text-center">{error}</div>}
      <div className="row">
        {recommendations.map((movie, index) => (
          <div className="col-md-4" key={index}>
            <MovieCard
              title={movie.title}
              poster_url={movie.poster_url}
              genres={movie.genres}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to generate random colors for genre boxes
const getRandomColor = (index) => {
  const colors = ['#ff9999', '#99ff99', '#9999ff', '#ffcc99', '#cc99ff'];
  return colors[index % colors.length];
};

export default App;