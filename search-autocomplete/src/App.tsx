import React, { useState } from "react";
import SearchBar from './components/SearchBar';
import SearchResults from "./components/SearchResults";
import { Post } from "./types";
import "./App.css";

const App = () => {
  const [results,setResults] = useState<Post[]>([]);

  return (
    <div className="App">
        <h1>Search your Posts here!!</h1>
        <SearchBar onSearchResults={setResults} />
        <SearchResults results={results} />
    </div>
  );
};

export default App;