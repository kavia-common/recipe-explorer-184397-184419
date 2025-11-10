import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchRecipeById } from "../api";

/**
 * RecipeDetails page shows one recipe with image, ingredients, and instructions.
 */
// PUBLIC_INTERFACE
export default function RecipeDetails() {
  /** Renders the details for a specific recipe; fetches data by id and displays loading/error states. */
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const abortRef = useRef();

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setError("");
    fetchRecipeById(id, { signal: controller.signal })
      .then((data) => {
        setRecipe(data);
        setStatus("success");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Failed to load recipe");
        setStatus("error");
      });
  }, [id]);

  if (status === "loading") return <div className="state">Loading recipe…</div>;
  if (status === "error")
    return (
      <div className="state error" role="alert">
        Error: {error}
        <div className="spacer" />
        <Link to="/" className="card-cta" aria-label="Back to home">
          ← Back to recipes
        </Link>
      </div>
    );
  if (!recipe) return null;

  return (
    <article className="details">
      <img
        src={recipe.image}
        alt={`Photo of ${recipe.title}`}
        className="details-banner"
      />
      <div className="details-content">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{recipe.title}</h1>
          <div>
            {recipe.time ? <span className="badge" aria-label={`Cooking time ${recipe.time}`}>⏱ {recipe.time}</span> : null}
            {recipe.servings ? <span className="badge" aria-label={`Servings ${recipe.servings}`}>🍽 {recipe.servings}</span> : null}
          </div>
        </div>

        <p className="helper">{recipe.description}</p>

        <h2 className="section-title">Ingredients</h2>
        <ul className="list">
          {(recipe.ingredients || []).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <h2 className="section-title">Instructions</h2>
        <ol className="list">
          {(recipe.instructions || []).map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        <div className="spacer" />
        <Link to="/" className="card-cta" aria-label="Back to home">
          ← Back to recipes
        </Link>
      </div>
    </article>
  );
}
