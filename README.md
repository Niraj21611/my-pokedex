# My Pokédex – Pokemon Search Engine

A modern, production-ready Pokédex built with **Next.js (App Router)** and **TypeScript**. It exposes a small REST-style API layer on top of the public [PokeAPI v2](https://pokeapi.co/docs/v2) and a rich, responsive UI for exploring Pokémon.

This project is built specifically for the coding challenge:

> Develop a search engine for Pokémon using the PokeAPI, with a web service API layer and a rich front-end UI.

It aims to stand out by:

- Providing a **Google-like autocomplete search experience** over ~2000 Pokémon.
- Using an in-memory **LRU cache with TTL** on the server for fast repeat lookups.
- Presenting a **rich, elegant Pokémon card** with moves, evolutions, stats, and even **audio cries**.

---

## 1. Architecture Overview

The app has two conceptual layers that match the challenge requirements:

1. **Web Service API** (REST-style endpoints served by Node.js via Next.js route handlers)
2. **Front-end UI layer** (React + TypeScript + Tailwind CSS)

Even though everything lives in a single Next.js project, the responsibilities are cleanly separated.

### 1.1 High-Level Components

**Web Service / API (Node.js)**

- Implemented with Next.js App Router API routes under `app/api/*`.
- Primary endpoints:
	- `GET /api/pokemon/[name]` – Wraps PokeAPI to return a rich, normalized Pokémon payload.
	- `GET /api/pokemon-suggestions` – Fetches and caches the global list of Pokémon names for autocomplete.
- Uses `lib/cache.ts` – a small, custom **LRU cache with TTL**.

**Front-End UI (React + TS + Tailwind)**

- `app/page.tsx` – Home page with:
	- Debounced + throttled search requests.
	- Smart error handling and empty states.
	- **Autocomplete suggestion pills**.
- `components/PokemonCard.tsx` – Rich Pokémon detail card.
- `app/layout.tsx` + `app/globals.css` – Layout shell, fonts, global styles.

---

## 2. Web Service API Design

### 2.1 `GET /api/pokemon/[name]`

**Purpose:** Single, high-level endpoint that aggregates data from multiple PokeAPI endpoints and returns a UI-friendly JSON.

#### Request

- Method: `GET`
- URL: `/api/pokemon/{name}`
- Path parameter:
	- `name` can be a Pokémon name or ID (case-insensitive).

#### Response (simplified)

```ts
interface PokemonResponse {
	cached: boolean;   
	name: string;
	id: number;
	height: number;        
	weight: number;       
	types: string[];
	abilities: string[];
	stats: { name: string; base: number }[];
	sprites: { default: string | null };
	cries: { latest: string | null; legacy: string | null };
	flavor_text: string;
	egg_groups: string[];
	gender_rate: number;
	base_experience: number;
	evolutions: { name: string }[];
	moves: {
		name: string;
		type: string;
		power: number | null;
		accuracy: number | null;
		pp: number;
		damage_class: string;
		effect: string;
	}[];                    // limited to 20 moves for performance
}
```

#### How it works

- Calls **PokeAPI** endpoints:
	- `/pokemon/{name}` – core stats, types, sprites, cries, move URLs.
	- Species URL from the Pokémon payload – for `flavor_text`, egg groups, gender, and evolution chain URL.
	- Evolution chain URL – to produce a simple linear **evolution sequence**.
	- Up to 20 move URLs – each enriched with power, accuracy, pp, damage class, and English `short_effect`.
- Normalizes everything into a single, compact JSON object.
- Stores the result in the LRU cache under `name.toLowerCase()`.
- Returns:
	- `{ cached: false, ... }` when fetched from PokeAPI.
	- `{ cached: true, ... }` when served from the cache.
- On failure:
	- Returns `404` with `{ error: "Pokémon not found", message }`.

This design keeps the client extremely simple: one REST-style call to one endpoint per search.

### 2.2 `GET /api/pokemon-suggestions`

**Purpose:** Provide the UI with an efficient list of Pokémon names for autocomplete.

#### Request

- Method: `GET`
- URL: `/api/pokemon-suggestions`

#### Response

```ts
interface SuggestionsResponse {
	cached: boolean;
	names: string[]; // all Pokémon names (~2000)
}
```

#### How it works

- Calls `https://pokeapi.co/api/v2/pokemon?limit=2000` once.
- Maps the results to just an array of **names**.
- Stores `names` in the LRU cache under a stable key (e.g. `"pokemon-suggestions"`).
- On subsequent calls, serves from cache for **instant** responses.

This powers the autocomplete without hitting PokeAPI for every keystroke.

---

## 3. LRU Cache with TTL (`lib/cache.ts`)

To meet the performance and caching requirements, the API layer uses a custom, in-memory **LRU cache** with TTL.

### 3.1 Why LRU + TTL?

- **LRU (Least Recently Used):**
	- Keeps the most recently accessed entries in memory.
	- When the capacity is reached, the least recently used entry is evicted.
	- Prevents unbounded memory growth.

- **TTL (Time To Live):**
	- Each entry stores its insertion time.
	- On `get`, expired entries are thrown away and treated as a cache miss.
	- Ensures data eventually refreshes from PokeAPI.

### 3.2 Operations

- `cache.get(key)`
	- If key exists and not expired: returns the value and marks entry as most recently used.
	- If missing or expired: returns `undefined`.

- `cache.set(key, value)`
	- Inserts or updates value for `key`.
	- Applies TTL metadata.
	- If size exceeds capacity, evicts the **least recently used** entry.

### 3.3 Where it’s used

- In `app/api/pokemon/[name]/route.ts` to cache individual Pokémon detail responses.
- In `app/api/pokemon-suggestions/route.ts` to cache the global name list.

This gives a nice balance of **performance**, **simplicity**, and **extensibility**.

---

## 4. Front-End UI & UX

### 4.1 Home Page (`app/page.tsx`)

The home page acts as a **search engine UI** for the Pokédex.

Key behaviors:

- **Search bar with debounce + throttle**
	- Every input change updates `searchTerm`.
	- Calls `GET /api/pokemon/{name}` with:
		- Debounce: wait a short period after typing stops.
		- Throttle: avoid firing too many requests if the user types very quickly.

- **Autocomplete over the full Pokédex**
	- On mount, calls `GET /api/pokemon-suggestions` and stores all names in state.
	- As the user types, filters on the client (**no extra network**) using `startsWith`.
	- Shows up to **8 matching suggestions** as rounded **pill buttons** under the search bar.
	- Clicking a pill sets the search term and triggers the fetch.

- **Smart states to avoid confusion**
	- When the input is empty and no Pokémon is selected:
		- Show a curated **"Popular Searches"** section (e.g. pikachu, charizard, mewtwo...).
	- When the user is typing and there are autocomplete matches:
		- Show **only** the autocomplete pill row (Popular Searches hides).
	- When a Pokémon card is open:
		- Hide the autocomplete pill row to keep focus on the result.
	- When the fetch fails and there are **no** autocomplete matches:
		- Show a friendly error banner like: `No Pokémon found with the name "xyz"`.
	- When suggestions exist for the typed text:
		- Suppress the error banner and let the user pick from suggestions.

These rules make the UX feel deliberate and polished rather than glitchy or noisy.

### 4.2 Pokémon Detail Card (`components/PokemonCard.tsx`)

The `PokemonCard` component turns the structured API response into a **rich, visually appealing card**.

Highlights:

- **Hero section** with:
	- Official artwork sprite (via `next/image`).
	- Name + ID.
	- A type-colored header stripe.
	- A **Play Cry** button (audio) using the `cries.latest` URL.

- **Quick metrics**
	- Height and weight as neat cards.
	- Base experience.

- **About text**
	- English flavor text formatted in a simple content card.

- **Base Stats**
	- Grid of stats (HP, Atk, Def, etc.) with a colored progress bar.

- **Abilities & Evolution Chain**
	- Abilities displayed as pill-shaped tags.
	- Evolution chain shown linearly with arrows between stages.

- **Move Set**
	- Grid of up to 20 moves.
	- Each shows type, power, accuracy, PP, and a short effect description.

This goes beyond a plain list of JSON and demonstrates attention to **UI richness** and **usability**.

---

## 5. Getting Started (Local Setup)

### 5.1 Prerequisites

- Node.js (LTS recommended)
- `pnpm` (preferred) or `npm`

### 5.2 Install Dependencies

```powershell
pnpm install
```

If you prefer npm:

```powershell
npm install
```

### 5.3 Run the Development Server

```powershell
pnpm dev
```

or:

```powershell
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### 5.4 Build & Run in Production Mode

```powershell
pnpm build
pnpm start
```

or with npm:

```powershell
npm run build
npm run start
```

The entire product (API + UI) runs locally on Node.js as required by the challenge.

---

## 6. How This Aligns with the Challenge

**Web service API**

- Follows REST-style principles with clear resource-oriented endpoints.
- Runs on Node.js locally with no external dependencies beyond PokeAPI.
- Uses an in-memory **LRU cache with TTL** for performance and resilience.

**UI layer**

- Built with React + TypeScript + Tailwind CSS.
- Provides a polished, creative interface with autocomplete, rich detail cards, and good empty/error states.

**Code quality & extensibility**

- Strictly typed TypeScript interfaces.
- Shared utilities (`fetchJSON`, `cache`) encourage reuse and extension.
- Clear separation of concerns between API routes and UI components.

**Performance**

- Caching at the web service layer reduces repeated PokeAPI calls.
- Client-side filtering for autocomplete avoids extra network traffic per keystroke.
- Move list capped to 20 items to keep payload size and render cost under control.

---

