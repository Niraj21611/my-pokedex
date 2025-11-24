import { NextRequest, NextResponse } from "next/server";
import cache from "@/lib/cache";

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed fetching ${url}`);
  return res.json();
}

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  const name = params.name.toLowerCase();

  const cached = cache.get(name);
  if (cached) {
    return NextResponse.json({ cached: true, ...cached });
  }

  try {
    // Base pokemon data
    const pokemon = await fetchJSON(
      `https://pokeapi.co/api/v2/pokemon/${name}`
    );

    // Species data
    const species = await fetchJSON(pokemon.species.url);

    // English flavor text data 
    const flavor = species.flavor_text_entries.find(
      (entry: any) => entry.language.name === "en"
    )?.flavor_text;

    // Evolution chain data
    const evolutionChain = await fetchJSON(species.evolution_chain.url);

    // Extract evolution chain
    function extractChain(chain: any) {
      const evo: any[] = [];
      let current = chain;
      while (current) {
        evo.push({
          name: current.species.name,
        });
        current = current.evolves_to[0];
      }
      return evo;
    }

    const evolutions = extractChain(evolutionChain.chain);

    // Fetch move details
    const movePromises = pokemon.moves.map(async (m: any) => {
      const moveData = await fetchJSON(m.move.url);

      const englishEffect =
        moveData.effect_entries.find((e: any) => e.language.name === "en")
          ?.short_effect || "";

      return {
        name: m.move.name,
        type: moveData.type.name,
        power: moveData.power,
        accuracy: moveData.accuracy,
        pp: moveData.pp,
        damage_class: moveData.damage_class.name,
        effect: englishEffect,
      };
    });

    // Limit to first 20 moves for performance
    const moves = await Promise.all(movePromises.slice(0, 20)); 

    // Final Response
    const response = {
      name: pokemon.name,
      id: pokemon.id,
      height: pokemon.height / 10, 
      weight: pokemon.weight / 10, // kg
      types: pokemon.types.map((t: any) => t.type.name),
      abilities: pokemon.abilities.map((a: any) => a.ability.name),
      stats: pokemon.stats.map((s: any) => ({
        name: s.stat.name,
        base: s.base_stat,
      })),
      sprites: {
        default: pokemon.sprites.other["official-artwork"].front_default,
        all: pokemon.sprites,
      },
      flavor_text: flavor || "",
      egg_groups: species.egg_groups.map((g: any) => g.name),
      gender_rate: species.gender_rate, // -1 = genderless
      base_experience: pokemon.base_experience,
      evolutions,
      moves,
    };

    // Cache the response
    cache.set(name, response);

    return NextResponse.json({ cached: false, ...response });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Pokémon not found", message: err.message },
      { status: 404 }
    );
  }
}
