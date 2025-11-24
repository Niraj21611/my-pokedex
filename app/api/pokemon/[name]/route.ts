import { NextRequest, NextResponse } from "next/server";
import cache from "@/lib/cache";

interface NamedAPIResource {
  name: string;
  url: string;
}

interface PokemonType {
  type: NamedAPIResource;
}

interface PokemonAbility {
  ability: NamedAPIResource;
}

interface PokemonStat {
  base_stat: number;
  stat: NamedAPIResource;
}

interface PokemonMove {
  move: NamedAPIResource;
}

interface PokemonSprites {
  other: {
    ["official-artwork"]: {
      front_default: string | null;
    };
  };
}

interface PokemonAPIResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: PokemonType[];
  abilities: PokemonAbility[];
  stats: PokemonStat[];
  moves: PokemonMove[];
  species: NamedAPIResource;
  sprites: PokemonSprites;
  cries: {
    latest: string | null;
    legacy: string | null;
  };
}

interface SpeciesFlavorEntry {
  flavor_text: string;
  language: NamedAPIResource;
}

interface PokemonSpeciesAPIResponse {
  flavor_text_entries: SpeciesFlavorEntry[];
  egg_groups: NamedAPIResource[];
  gender_rate: number;
  evolution_chain: { url: string };
}

interface EvolutionChainLink {
  species: NamedAPIResource;
  evolves_to: EvolutionChainLink[];
}

interface EvolutionChainAPIResponse {
  chain: EvolutionChainLink;
}

interface MoveEffectEntry {
  short_effect: string;
  language: NamedAPIResource;
}

interface MoveAPIResponse {
  name: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  type: NamedAPIResource;
  damage_class: NamedAPIResource;
  effect_entries: MoveEffectEntry[];
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed fetching ${url}`);
  return res.json();
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const key = name.toLowerCase();
  const cached = cache.get(key);

  if (cached) {
    return NextResponse.json({ cached: true, ...cached });
  }

  try {
    // Base pokemon data
    const pokemon = await fetchJSON<PokemonAPIResponse>(
      `https://pokeapi.co/api/v2/pokemon/${name}`
    );

    // Species data
    const species = await fetchJSON<PokemonSpeciesAPIResponse>(
      pokemon.species.url
    );

    // Flavor text (English)
    const flavor =
      species.flavor_text_entries.find((entry) => entry.language.name === "en")
        ?.flavor_text || "";

    // Evolution Chain
    const evolutionChain = await fetchJSON<EvolutionChainAPIResponse>(
      species.evolution_chain.url
    );

    function extractChain(chain: EvolutionChainLink) {
      const evoList: { name: string }[] = [];
      let current: EvolutionChainLink | undefined = chain;

      while (current) {
        evoList.push({ name: current.species.name });
        current = current.evolves_to[0];
      }

      return evoList;
    }

    const evolutions = extractChain(evolutionChain.chain);

    // Moves (Limit 20)
    const movePromises = pokemon.moves.slice(0, 20).map(async (m) => {
      const moveData = await fetchJSON<MoveAPIResponse>(m.move.url);

      const englishEffect =
        moveData.effect_entries.find((e) => e.language.name === "en")
          ?.short_effect || "";

      return {
        name: moveData.name,
        type: moveData.type.name,
        power: moveData.power,
        accuracy: moveData.accuracy,
        pp: moveData.pp,
        damage_class: moveData.damage_class.name,
        effect: englishEffect,
      };
    });

    const moves = await Promise.all(movePromises);

    // Final structured response
    const response = {
      name: pokemon.name,
      id: pokemon.id,
      height: pokemon.height / 10,
      weight: pokemon.weight / 10,
      types: pokemon.types.map((t) => t.type.name),
      abilities: pokemon.abilities.map((a) => a.ability.name),
      stats: pokemon.stats.map((s) => ({
        name: s.stat.name,
        base: s.base_stat,
      })),
      sprites: {
        default: pokemon.sprites.other["official-artwork"].front_default,
      },
      cries: {
        latest: pokemon.cries?.latest ?? null,
        legacy: pokemon.cries?.legacy ?? null,
      },
      flavor_text: flavor,
      egg_groups: species.egg_groups.map((g) => g.name),
      gender_rate: species.gender_rate,
      base_experience: pokemon.base_experience,
      evolutions,
      moves,
    };

    cache.set(key, response);

    return NextResponse.json({ cached: false, ...response });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";

    return NextResponse.json(
      { error: "Pokémon not found", message },
      { status: 404 }
    );
  }
}
