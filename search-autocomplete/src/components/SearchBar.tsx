import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import { Post } from "../types";
import "../App.css";

const API_URL = "http://localhost:4000/search";

interface SearchBarProps {
  onSearchResults: (results: Post[]) => void; // Accept search results callback
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchResults }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor,setCursor] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:4000/autocomplete?q=${query}`);
        setSuggestions(response.data.suggestions);
      } catch (error) {
        console.error("Error fetching autocomplete results:", error);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300); // Debounce API call
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);

    try{
      const response = await axios.get(`${API_URL}?q=${query}${cursor ? `&cursor` : ''}`);
      onSearchResults(response.data.results);
      setCursor(response.data.cursor);
      setSuggestions([]);
    } catch (error){
      console.error("Error fetching search results:", error);
    }
    setLoading(false);
  };
  return (
    <div className="search-container">
      <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key == "Enter" && handleSearch()}
        placeholder="Search..."
        className="search-input"
      />
        <button onClick={handleSearch} className="search-button">
          < FaSearch />
        </button>
      </div>
      {loading && <div className="loader">Loading...</div>}
      {suggestions.length>0 && (
      <ul className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <li key={index}>{suggestion}</li>
        ))}
      </ul>
      )}
    </div>
  );
};

export default SearchBar;
