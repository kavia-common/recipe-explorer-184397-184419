import React, { useEffect, useRef, useState } from "react";
import { useSearch } from "../context";

/**
 * SearchBar component. Debounces input and exposes submit for accessibility.
 */
// PUBLIC_INTERFACE
export default function SearchBar({ onSearch }) {
  /** Search input that triggers onSearch with the current query. Includes label for accessibility. */
  const { query, setQuery } = useSearch();
  const [local, setLocal] = useState(query);
  const debounceRef = useRef();

  useEffect(() => {
    setLocal(query);
  }, [query]);

  useEffect(() => {
    // Debounce typing to avoid flooding API
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch?.(local);
      setQuery(local);
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <form
      className="search-bar"
      role="search"
      aria-label="Recipe search form"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch?.(local);
        setQuery(local);
      }}
    >
      <label htmlFor="search" className="visually-hidden" style={{position:'absolute',left:'-9999px'}}>
        Search recipes
      </label>
      <input
        id="search"
        name="search"
        className="search-input"
        type="search"
        placeholder="Search recipes (e.g., chicken, pasta, breakfast)"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        aria-label="Search recipes"
      />
      <button type="submit" className="search-button" aria-label="Submit search">
        Search
      </button>
    </form>
  );
}
