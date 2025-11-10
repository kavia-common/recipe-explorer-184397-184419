import React from "react";
import RecipeGrid from "../components/RecipeGrid";

/**
 * Home page with page header and recipe grid.
 */
// PUBLIC_INTERFACE
export default function Home() {
  /** Renders search and grid of recipes on the home page. */
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Explore Recipes</h1>
        <div className="helper">Search and discover delicious dishes</div>
      </div>
      <RecipeGrid />
    </div>
  );
}
