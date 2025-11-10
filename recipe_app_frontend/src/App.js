import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./theme.css";
import "./index.css";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import RecipeDetails from "./pages/RecipeDetails";
import { SearchProvider } from "./context";

/**
 * Root application component.
 */
// PUBLIC_INTERFACE
function App() {
  /** Sets up the app shell, routing for list and details pages, and provides search context. */
  return (
    <BrowserRouter>
      <SearchProvider>
        <div className="app-shell">
          <NavBar />
          <main className="container" role="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/recipe/:id" element={<RecipeDetails />} />
            </Routes>
          </main>
        </div>
      </SearchProvider>
    </BrowserRouter>
  );
}

export default App;
