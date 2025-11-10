/**
 * Simple React context to share search query across components.
 */
import React, { createContext, useContext, useState } from "react";

const SearchContext = createContext(null);

// PUBLIC_INTERFACE
export function useSearch() {
  /** Hook to access and modify the global search query state. */
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch must be used within <SearchProvider>");
  }
  return ctx;
}

// PUBLIC_INTERFACE
export function SearchProvider({ children }) {
  /** Context provider for search state. */
  const [query, setQuery] = useState("");
  return (
    <SearchContext.Provider value={{ query, setQuery }}>
      {children}
    </SearchContext.Provider>
  );
}
