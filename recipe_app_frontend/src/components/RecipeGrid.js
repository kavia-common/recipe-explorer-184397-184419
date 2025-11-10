import React, { useEffect, useRef, useState } from "react";
import RecipeCard from "./RecipeCard";
import { fetchRecipes, isMockMode, mockFallbackEnabled, getMockFallbackReason } from "../api";
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
  const abortRef = useRef(null);

  const load = (q) => {
    // Abort any in-flight request before starting a new one
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setError("");

    fetchRecipes({ q, signal: controller.signal })
      .then((data) => {
        // Only update if this response is from the latest request
        if (abortRef.current === controller) {
          setRecipes(Array.isArray(data) ? data : []);
          setStatus("success");
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError") return; // stale request
        if (abortRef.current === controller) {
          // Classify abort/timeout vs others
          const msg = (err?.message || "").toLowerCase();
          const friendly = msg.includes("aborted") || msg.includes("timeout")
            ? "Request timed out. Please try again."
            : err?.message || "Failed to load recipes";
          setError(friendly);
          setStatus("error");
        }
      });
  };

  useEffect(() => {
    load("");
    return () => {
      // abort on unmount
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showStaticMock = isMockMode();
  const showDynamicMock = mockFallbackEnabled() && !showStaticMock;
  const mockReason = getMockFallbackReason();

  return (
    <div>
      <SearchBar onSearch={(q) => load(q)} />
      <div className="spacer" />
      {(showStaticMock || showDynamicMock) && status !== "error" && (
        <div className="state" role="note" aria-live="polite">
          {showStaticMock
            ? "Running in mock mode (no backend configured). Set REACT_APP_API_BASE or REACT_APP_BACKEND_URL to connect to a server."
            : `Mock mode enabled due to network error: ${mockReason}`}
        </div>
      )}
      {status === "loading" && <div className="state">Loading recipes…</div>}
      {status === "error" && (
        <div className="state error" role="alert">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Failed to load recipes</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{error}</div>
          <div className="spacer" />
          <div className="helper">
            If you configured a backend, ensure CORS allows this origin and that REACT_APP_API_BASE/REACT_APP_BACKEND_URL is correct.
          </div>
        </div>
      )}
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
