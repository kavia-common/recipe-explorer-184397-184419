import React from "react";
import { Link } from "react-router-dom";

/**
 * Recipe card showing image, title, and short description.
 */
// PUBLIC_INTERFACE
export default function RecipeCard({ recipe }) {
  /** Displays a recipe summary card and links to the details page. */
  return (
    <article className="card" aria-label={`Recipe ${recipe.title}`}>
      <div className="card-image-wrapper">
        <img
          className="card-image"
          src={recipe.image}
          alt={`Photo of ${recipe.title}`}
          loading="lazy"
        />
      </div>
      <div className="card-body">
        <h3 className="card-title">{recipe.title}</h3>
        <p className="card-desc">{recipe.description}</p>
        <Link className="card-cta" to={`/recipe/${encodeURIComponent(recipe.id)}`} aria-label={`View details for ${recipe.title}`}>
          View Recipe →
        </Link>
      </div>
    </article>
  );
}
