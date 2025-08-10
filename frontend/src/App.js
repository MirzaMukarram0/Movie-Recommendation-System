import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

function MovieCard({ movie, onOpen }) {
  const { title, poster_url, genres } = movie || {};
  return (
    <div className="card poster-card fade-in" onClick={() => onOpen(movie)} role="button" tabIndex={0}>
      <div className="poster-wrapper">
        <img src={poster_url || 'https://via.placeholder.com/300x450'} className="card-img-top" alt={title} />
        <div className="poster-overlay">
          <h5 className="poster-title">{title}</h5>
        </div>
        <div className="paper-edge" aria-hidden="true" />
      </div>

      <div className="card-body">
        <div className="genres-container">
          {(genres || '').split(',').map((g, i) => {
            const genre = g.trim();
            if (!genre) return null;
            return <span key={i} className="ticket-chip">{genre}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

function MovieModal({ movie, onClose }) {
  if (!movie) return null;
  const { title, poster_url, genres, synopsis } = movie;
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
        <div className="modal-grid">
          <div className="modal-poster">
            <img src={poster_url || 'https://via.placeholder.com/400x600'} alt={title} />
          </div>
          <div className="modal-content">
            <h2 className="modal-title">{title}</h2>
            <p className="meta"><strong>Genres:</strong> {genres || '—'}</p>
            <p className="synopsis">{synopsis || "Synopsis not available. This is a demo layout — replace with real text from your API."}</p>
            <div className="modal-actions">
              <button className="action primary">Watch Trailer</button>
              <button className="action">Save</button>
            </div>
          </div>
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
  const [allTitles, setAllTitles] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [accessible, setAccessible] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    axios.get('http://localhost:5000/titles')
      .then(response => {
        const titles = response.data.titles || [];
        setAllTitles(titles);
        setSuggestions(titles);
      })
      .catch(err => console.error('Error fetching titles:', err));
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMovieTitle(value);
    if (value) {
      const filtered = allTitles.filter(t => t.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions(allTitles);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (s) => {
    setMovieTitle(s);
    setShowSuggestions(false);
  };

  const handleRecommend = async () => {
    if (!movieTitle.trim()) {
      setError('Please enter a movie title.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:5000/recommend', { movie: movieTitle });
      setRecommendations(response.data.recommendations || []);
      if (!response.data.recommendations || response.data.recommendations.length === 0) {
        setError('No recommendations found for this movie.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (movie) => setSelectedMovie(movie);
  const closeModal = () => setSelectedMovie(null);

  return (
    <div className={`app-container ${accessible ? 'accessible' : ''}`}>
      <header className="app-header">
        <div className="logo">
          <div className="reel" aria-hidden="true">🎞️</div>
          <h1>RetroRecs</h1>
        </div>

        <div className="header-controls">
          <label className="accessible-toggle">
            <input type="checkbox" checked={accessible} onChange={(e) => setAccessible(e.target.checked)} />
            Accessible
          </label>
        </div>
      </header>

      <main className="main-content">
        <section className="search-area">
          <div className="input-container fade-in">
            <div className="search-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="search-bar"
                placeholder="Search a cult classic..."
                value={movieTitle}
                onChange={handleInputChange}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls="suggestions-list"
              />

              {showSuggestions && suggestions.length > 0 && (
                <ul id="suggestions-list" className="suggestions-list" role="listbox">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      onMouseDown={() => handleSuggestionClick(s)}
                      className="suggestion-item"
                      role="option"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button className="recommend-button" onClick={handleRecommend} disabled={loading}>
              {loading ? 'Loading...' : 'Recommend'}
            </button>
          </div>

          {error && <div className="alert error">{error}</div>}
        </section>

        <section className="results-grid">
          <div className="row">
            {recommendations.map((movie, idx) => (
              <div className="col" key={idx}>
                <MovieCard movie={movie} onOpen={openModal} />
              </div>
            ))}
          </div>

          {recommendations.length === 0 && !loading && (
            <div className="hint">No recommendations to show. Try searching a cult classic like <strong>The Thing</strong> or <strong>Day of the Dead</strong>.</div>
          )}
        </section>
      </main>

      <MovieModal movie={selectedMovie} onClose={closeModal} />
    </div>
  );
}

export default App;
