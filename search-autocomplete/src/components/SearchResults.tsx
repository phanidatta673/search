import React from "react";
import { Post } from "../types";

interface SearchResultsProps {
    results: Post[];
}

const SearchResults: React.FC<SearchResultsProps> = ({results}) => {
    return (
        <div className="results-container">
            { (! results || results.length === 0) ? (
                <p>No results found</p>
            ) : (
                results.map((post,index) => (
                    <div key={index} className="result-card">
                        <h3 className="result-title">{post.title || "No Title"}</h3>
                        <p className="result-body" dangerouslySetInnerHTML={{ __html: post.body || "" }} />
                        <div className="result-meta">
                            <div className="tags">
                            {post.tags && post.tags.split("|").map((tag) =>
                                tag ? (
                                <span key={tag} className="tag" style={{ marginRight: "8px" }}>{tag}</span>) : null
                            )}
                            </div>
                            <div className="stats">
                                <span className="score">⬆️ {post.score || "0"}</span>
                                <span className="views">👁️ {post.viewcount || "0"} views</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default SearchResults;