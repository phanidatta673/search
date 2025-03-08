import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:4000/autocomplete";

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}?q=${query}`);
        setSuggestions(response.data.suggestions);
      } catch (error) {
        console.error("Error fetching autocomplete results:", error);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300); // Debounce API call
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="search-input"
      />
      {loading && <div className="loader">Loading...</div>}
      <ul className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <li key={index}>{suggestion}</li>
        ))}
      </ul>
    </div>
  );
};

export default SearchBar;
