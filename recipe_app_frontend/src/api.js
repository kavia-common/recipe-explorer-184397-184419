/**
 * Data access layer for the Recipe app.
 * Reads API base from environment: REACT_APP_API_BASE or REACT_APP_BACKEND_URL
 * Falls back to in-app mock data if not set.
 */

const API_BASE =
  process.env.REACT_APP_API_BASE?.trim() ||
  process.env.REACT_APP_BACKEND_URL?.trim() ||
  "";

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

function buildUrl(path, params) {
  const url = new URL(path, API_BASE.endsWith("/") ? API_BASE : `${API_BASE}/`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && `${v}`.length > 0) {
        url.searchParams.set(k, v);
      }
    });
  }
  return url.toString();
}

// PUBLIC_INTERFACE
export async function fetchRecipes({ q, signal } = {}) {
  /** Fetch a list of recipes. If API base is configured, call GET /recipes?q=...; otherwise use mock data. */
  if (!API_BASE) {
    // mock with simple search
    await delay(300);
    if (!q) return mockRecipes;
    const term = q.toLowerCase();
    return mockRecipes.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term)
    );
  }

  const url = buildUrl("recipes", q ? { q } : undefined);
  const res = await fetch(url, { signal });
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
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch recipe: ${res.status} ${text}`);
  }
  return res.json();
}
