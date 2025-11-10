import React, { useEffect, useRef, useState } from "react";
import RecipeCard from "./RecipeCard";
import { fetchRecipes } from "../api";
import SearchBar from "./SearchBar";

/**
 * Grid that fetches and displays recipes and integrates SearchBar.
 */
// PUBLIC_INTERFACE
export default function RecipeGrid() {
  /** Fetches recipes by query, shows loading and error states, and renders a responsive grid of cards. */
  const [recipes, setRecipes] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error | success
  const [error, setError] = useState("");
  const abortRef = useRef();

  const load = (q) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setError("");
    fetchRecipes({ q, signal: controller.signal })
      .then((data) => {
        setRecipes(Array.isArray(data) ? data : []);
        setStatus("success");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Failed to load recipes");
        setStatus("error");
      });
  };

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <SearchBar onSearch={(q) => load(q)} />
      <div className="spacer" />
      {status === "loading" && <div className="state">Loading recipes…</div>}
      {status === "error" && <div className="state error" role="alert">Error: {error}</div>}
      {status === "success" && recipes.length === 0 && (
        <div className="state">No recipes found. Try a different search.</div>
      )}
      {status === "success" && recipes.length > 0 && (
        <section className="grid" aria-label="Recipe results">
          {recipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </section>
      )}
    </div>
  );
}
