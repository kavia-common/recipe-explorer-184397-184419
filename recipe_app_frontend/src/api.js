/**
 * Data access layer for the Recipe app.
 * Reads API base from environment: REACT_APP_API_BASE or REACT_APP_BACKEND_URL
 * Falls back to in-app mock data if not set.
 *
 * This module ensures:
 * - No network requests are made when no backend is configured.
 * - Any configured base URL is sanitized.
 * - Fetch includes CORS-friendly options.
 * - Clear errors are thrown for better UI messaging.
 */

const rawBase =
  (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim()) ||
  (process.env.REACT_APP_BACKEND_URL && process.env.REACT_APP_BACKEND_URL.trim()) ||
  "";

/**
 * Sanitize and validate the API base URL.
 * - Allows relative or absolute URLs.
 * - Removes accidental double slashes when building requests.
 */
function normalizeBase(input) {
  if (!input) return "";
  // If it's a bare slash or only whitespace, treat as empty
  if (input === "/" || input === "./" || input === "../") return "";
  // If relative path without protocol, keep as-is (browser will resolve to same-origin)
  // If absolute, ensure it's a valid URL
  try {
    // For absolute URLs, URL() with base omitted works
    // This will throw if invalid absolute URL
    // eslint-disable-next-line no-new
    new URL(input);
    return input.replace(/\s+/g, "");
  } catch {
    // Likely a relative path; trim spaces
    return input.replace(/\s+/g, "");
  }
}

const API_BASE = normalizeBase(rawBase);

// Simple in-memory mock data for offline preview
const mockRecipes = [
  {
    id: "1",
    title: "Lemon Herb Grilled Chicken",
    description: "Juicy chicken marinated in lemon, herbs, and olive oil.",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
    ingredients: [
      "4 chicken breasts",
      "2 lemons (zest and juice)",
      "3 tbsp olive oil",
      "2 cloves garlic, minced",
      "1 tbsp fresh rosemary, chopped",
      "Salt and pepper",
    ],
    instructions: [
      "Whisk lemon juice, zest, olive oil, garlic, rosemary, salt, and pepper.",
      "Marinate chicken for at least 30 minutes.",
      "Grill on medium-high heat 6–7 minutes per side until cooked through.",
      "Rest for 5 minutes, then serve.",
    ],
    time: "30 min",
    servings: 4,
  },
  {
    id: "2",
    title: "Creamy Mushroom Pasta",
    description: "Rich and comforting pasta with sautéed mushrooms and cream.",
    image:
      "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1200&auto=format&fit=crop",
    ingredients: [
      "250g pasta (fettuccine)",
      "200g mushrooms, sliced",
      "1 tbsp butter",
      "2 cloves garlic, minced",
      "200ml heavy cream",
      "Parmesan, salt and pepper",
      "Parsley for garnish",
    ],
    instructions: [
      "Cook pasta until al dente, reserve some pasta water.",
      "Sauté mushrooms in butter until browned.",
      "Add garlic, then cream; simmer until slightly thick.",
      "Toss with pasta; adjust with pasta water. Season and serve with Parmesan.",
    ],
    time: "25 min",
    servings: 2,
  },
  {
    id: "3",
    title: "Berry Breakfast Parfait",
    description: "Layers of yogurt, granola, and fresh berries.",
    image:
      "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1200&auto=format&fit=crop",
    ingredients: [
      "2 cups Greek yogurt",
      "1 cup granola",
      "1 cup mixed berries",
      "Honey to taste",
    ],
    instructions: [
      "Layer yogurt, granola, and berries in a glass.",
      "Drizzle with honey and serve immediately.",
    ],
    time: "10 min",
    servings: 2,
  },
];

// Utility to simulate network
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Build a request URL based on the API base and path/params.
 * Supports both absolute and relative bases.
 */
function buildUrl(path, params) {
  // If API_BASE is empty, this function shouldn't be used (we don't fetch).
  // If base is relative (e.g., "/api" or "api"), URL() with window.location.origin as base.
  let base = API_BASE;
  if (!base) {
    throw new Error("buildUrl called without API base");
  }

  // Ensure a trailing slash for URL constructor to correctly resolve "path"
  const withSlash = base.endsWith("/") ? base : `${base}/`;
  const url = new URL(path, withSlash.startsWith("http") ? withSlash : new URL(withSlash, window.location.origin));

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && `${v}`.length > 0) {
        url.searchParams.set(k, v);
      }
    });
  }
  return url.toString();
}

/**
 * Common fetch options to avoid CORS preflight surprises where possible.
 * Note: Actual CORS enforcement is server-side; this just ensures we aren't
 * sending problematic headers by default and include credentials only when needed.
 */
const defaultFetchOptions = {
  // 'same-origin' allows cookies for same-origin; for cross-origin, consider 'include' only if server supports it.
  credentials: "same-origin",
  mode: "cors",
  // Avoid extra custom headers by default to reduce preflights
};

// PUBLIC_INTERFACE
export function isMockMode() {
  /** Returns true when the app is using mock data (no backend configured). */
  return !API_BASE;
}

// PUBLIC_INTERFACE
export async function fetchRecipes({ q, signal } = {}) {
  /** Fetch a list of recipes. If API base is configured, call GET /recipes?q=...; otherwise use mock data. */
  if (!API_BASE) {
    // mock with simple search
    await delay(250);
    if (!q) return mockRecipes;
    const term = q.toLowerCase();
    return mockRecipes.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term)
    );
  }

  const url = buildUrl("recipes", q ? { q } : undefined);
  let res;
  try {
    res = await fetch(url, { signal, ...defaultFetchOptions });
  } catch (e) {
    // Likely CORS/network/DNS issues
    const origin = window.location.origin;
    const details = (e && e.message) || "Unknown network error";
    throw new Error(
      `Network error while fetching recipes. Check API base and CORS.\nOrigin: ${origin}\nAPI: ${API_BASE}\nDetails: ${details}`
    );
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch recipes: ${res.status} ${text}`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function fetchRecipeById(id, { signal } = {}) {
  /** Fetch a single recipe by id. If API base is unset, find in mock data. */
  if (!API_BASE) {
    await delay(200);
    const found = mockRecipes.find((r) => r.id === id);
    if (!found) throw new Error("Recipe not found");
    return found;
  }
  const url = buildUrl(`recipes/${encodeURIComponent(id)}`);
  let res;
  try {
    res = await fetch(url, { signal, ...defaultFetchOptions });
  } catch (e) {
    const origin = window.location.origin;
    const details = (e && e.message) || "Unknown network error";
    throw new Error(
      `Network error while fetching recipe. Check API base and CORS.\nOrigin: ${origin}\nAPI: ${API_BASE}\nDetails: ${details}`
    );
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch recipe: ${res.status} ${text}`);
  }
  return res.json();
}
