/**
 * Data access layer for the Recipe app.
 * Reads API base from environment: REACT_APP_API_BASE or REACT_APP_BACKEND_URL
 * Falls back to in-app mock data if not set or on first-request network/CORS failure.
 *
 * This module ensures:
 * - No network requests are made when no backend is configured.
 * - Any configured base URL is sanitized and fully-qualified when needed.
 * - Fetch includes CORS-friendly options.
 * - Clear errors are thrown for better UI messaging and abort classification.
 * - Automatic mock fallback can be enabled after an initial CORS/network failure.
 */

const rawBase =
  (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim()) ||
  (process.env.REACT_APP_BACKEND_URL && process.env.REACT_APP_BACKEND_URL.trim()) ||
  "";

/**
 * Sanitize and validate the API base URL.
 * - Allows relative or absolute URLs.
 * - Removes whitespace and trailing spaces.
 * - Leaves protocol as provided and supports http/https.
 */
function normalizeBase(input) {
  if (!input) return "";
  const trimmed = input.trim();
  if (trimmed === "/" || trimmed === "./" || trimmed === "../") return "";
  // Remove accidental spaces inside
  const compact = trimmed.replace(/\s+/g, "");
  // Accept relative or absolute; if absolute, URL constructor validates
  try {
    // eslint-disable-next-line no-new
    new URL(compact);
    return compact.replace(/\/+$/g, ""); // drop trailing slash for consistency, builder will add when needed
  } catch {
    // Keep relative base as-is, but remove trailing slash for consistency
    return compact.replace(/\/+$/g, "");
  }
}

/**
 * Resolve a base into an absolute base using window.location.origin for relative bases.
 * Ensures trailing slash for URL resolution but returns without double slashes later.
 */
function toAbsoluteBase(base) {
  if (!base) return "";
  const b = base.trim();
  if (b.startsWith("http://") || b.startsWith("https://")) {
    return b.replace(/\/+$/g, "");
  }
  // Relative -> resolve to same-origin
  const abs = new URL(b.replace(/^\//, "") + "/", window.location.origin).toString();
  return abs.replace(/\/+$/g, "");
}

const API_BASE = normalizeBase(rawBase);
const ABS_API_BASE = API_BASE ? toAbsoluteBase(API_BASE) : "";

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

/** Utility to simulate network for mocks */
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Build a request URL based on the absolute API base and path/params.
 * Prevents double slashes and supports query params.
 */
function buildUrl(path, params) {
  if (!ABS_API_BASE) {
    throw new Error("buildUrl called without API base");
  }
  const baseWithSlash = ABS_API_BASE.endsWith("/") ? ABS_API_BASE : `${ABS_API_BASE}/`;
  const safePath = String(path || "").replace(/^\/+/, ""); // remove leading slash from path
  const url = new URL(safePath, baseWithSlash);

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
  // 'omit' to avoid cross-site cookies by default; same-origin cookies not needed here
  credentials: "omit",
  mode: "cors",
  cache: "no-store",
};

/**
 * Abort classification helper
 */
function isAbortError(err) {
  return err?.name === "AbortError" || err?.message?.toLowerCase().includes("aborted");
}

/**
 * Timeout wrapper for fetch using AbortController.
 */
async function fetchWithTimeout(resource, options = {}, timeoutMs = 10000) {
  const { signal: externalSignal, ...rest } = options || {};
  const controller = new AbortController();

  // If an external signal aborts, propagate to our controller
  const onAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onAbort, { once: true });
  }

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(resource, { ...rest, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) externalSignal.removeEventListener("abort", onAbort);
  }
}

/**
 * Retry policy: up to 2 retries for transient network/CORS/timeout errors, with backoff.
 */
async function fetchWithRetry(url, options = {}, { retries = 2, timeoutMs = 10000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options, timeoutMs);
      return res;
    } catch (err) {
      lastErr = err;
      // If explicitly aborted by caller, or it's an AbortError other than timeout, don't retry
      if (isAbortError(err) && !(err.message || "").toLowerCase().includes("timeout")) {
        throw err;
      }
      // Backoff before retrying
      if (attempt < retries) {
        await delay(250 * (attempt + 1));
        continue;
      }
    }
  }
  throw lastErr;
}

/**
 * Internal flag and reason for dynamic mock fallback when first request fails with CORS/TypeError.
 */
let dynamicMockEnabled = false;
let dynamicMockReason = "";

/**
 * Enable dynamic mock mode for this session, with a reason banner.
 */
function enableDynamicMock(reason) {
  dynamicMockEnabled = true;
  dynamicMockReason = reason || "Network error; switched to mock mode";
}

/**
 * PUBLIC helpers for UI to display mock banner.
 */
// PUBLIC_INTERFACE
export function mockFallbackEnabled() {
  /** Returns true if mock mode is either static (no base) or enabled dynamically due to network error. */
  return !ABS_API_BASE || dynamicMockEnabled;
}

// PUBLIC_INTERFACE
export function getMockFallbackReason() {
  /** Returns the reason why mock fallback was enabled, if any. */
  return dynamicMockEnabled ? dynamicMockReason : "";
}

/**
 * PUBLIC: returns true when static mock mode (no base) is in effect.
 */
// PUBLIC_INTERFACE
export function isMockMode() {
  /** Returns true when the app is using mock data due to no backend configured in env. */
  return !ABS_API_BASE;
}

/**
 * Shared mock filtering for search
 */
function filterMockRecipes(q) {
  if (!q) return mockRecipes;
  const term = q.toLowerCase();
  return mockRecipes.filter(
    (r) =>
      r.title.toLowerCase().includes(term) ||
      r.description.toLowerCase().includes(term)
  );
}

/**
 * Determine if error is a network/CORS TypeError that should trigger dynamic mock mode.
 */
function isCorsOrTypeNetworkError(err) {
  // In browsers, failed fetch due to CORS or network often yields TypeError with generic message.
  const msg = (err && err.message ? err.message : "").toLowerCase();
  return (
    err instanceof TypeError ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("cors") ||
    msg.includes("load failed")
  );
}

// PUBLIC_INTERFACE
export async function fetchRecipes({ q, signal } = {}) {
  /**
   * Fetch a list of recipes. If API base is configured, call GET /recipes?q=...;
   * otherwise use mock data. If first network attempt fails with CORS/TypeError,
   * automatically enable dynamic mock fallback and return mock data.
   */
  if (!ABS_API_BASE || dynamicMockEnabled) {
    await delay(250);
    return filterMockRecipes(q);
  }

  const url = buildUrl("recipes", q ? { q } : undefined);
  let res;
  try {
    res = await fetchWithRetry(url, { signal, ...defaultFetchOptions }, { retries: 2, timeoutMs: 10000 });
  } catch (e) {
    // If it's caller-aborted, bubble up
    if (isAbortError(e)) throw e;
    // If CORS/Type network error, switch to dynamic mock
    if (isCorsOrTypeNetworkError(e)) {
      enableDynamicMock(`Network/CORS error contacting API at ${ABS_API_BASE}. Using mock data.`);
      await delay(200);
      return filterMockRecipes(q);
    }
    const origin = window.location.origin;
    const details = (e && e.message) || "Unknown network error";
    throw new Error(
      `Network error while fetching recipes. Check API base and CORS.\nOrigin: ${origin}\nAPI: ${ABS_API_BASE}\nDetails: ${details}`
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch recipes: ${res.status} ${text}`);
  }
  return res.json();
}

// PUBLIC_INTERFACE
export async function fetchRecipeById(id, { signal } = {}) {
  /**
   * Fetch a single recipe by id. If API base is unset or dynamic fallback enabled, use mock data.
   */
  if (!ABS_API_BASE || dynamicMockEnabled) {
    await delay(200);
    const found = mockRecipes.find((r) => r.id === id);
    if (!found) throw new Error("Recipe not found");
    return found;
  }
  const url = buildUrl(`recipes/${encodeURIComponent(id)}`);
  let res;
  try {
    res = await fetchWithRetry(url, { signal, ...defaultFetchOptions }, { retries: 2, timeoutMs: 10000 });
  } catch (e) {
    if (isAbortError(e)) throw e;
    if (isCorsOrTypeNetworkError(e)) {
      enableDynamicMock(`Network/CORS error contacting API at ${ABS_API_BASE}. Using mock data.`);
      await delay(150);
      const found = mockRecipes.find((r) => r.id === id);
      if (!found) throw new Error("Recipe not found");
      return found;
    }
    const origin = window.location.origin;
    const details = (e && e.message) || "Unknown network error";
    throw new Error(
      `Network error while fetching recipe. Check API base and CORS.\nOrigin: ${origin}\nAPI: ${ABS_API_BASE}\nDetails: ${details}`
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch recipe: ${res.status} ${text}`);
  }
  return res.json();
}
