import { NextResponse } from "next/server";
import cache from "@/lib/cache";

interface NamedAPIResource {
  name: string;
  url: string;
}

interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: NamedAPIResource[];
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed fetching ${url}`);
  return res.json();
}

export async function GET() {
  const cacheKey = "pokemon-suggestions";
  const cached = cache.get(cacheKey);

  if (cached) {
    return NextResponse.json({ cached: true, names: cached as string[] });
  }

  try {
    const data = await fetchJSON<PokemonListResponse>(
      "https://pokeapi.co/api/v2/pokemon?limit=2000"
    );

    const names = data.results.map((p) => p.name);

    cache.set(cacheKey, names);

    return NextResponse.json({ cached: false, names });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch pokemon list";

    return NextResponse.json(
      { error: "Unable to load suggestions", message },
      { status: 500 }
    );
  }
}
