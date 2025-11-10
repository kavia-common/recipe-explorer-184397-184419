import React from "react";
import { Link } from "react-router-dom";

/**
 * Top navigation bar with brand.
 */
// PUBLIC_INTERFACE
export default function NavBar() {
  /** Renders the top navigation bar with app branding and link to Home. */
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        <Link to="/" className="brand" aria-label="Go to home">
          <span className="brand-logo" aria-hidden="true">R</span>
          <span className="brand-title">Recipe Explorer</span>
        </Link>
        <div aria-hidden="true" style={{ fontWeight: 700, color: "var(--color-secondary)" }}>
          Ocean Professional
        </div>
      </div>
    </nav>
  );
}
