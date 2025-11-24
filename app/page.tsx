"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PokemonCard from "@/components/PokemonCard";

interface Pokemon {
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
  }[];
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCached, setIsCached] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSearchTime = useRef(0);
  const THROTTLE_DELAY = 500; 

  const fetchPokemon = useCallback(async (name: string) => {
    if (!name.trim()) {
      setPokemon(null);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/pokemon/${name.toLowerCase()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Pokémon not found");
      }

      setPokemon(data);
      setIsCached(data.cached || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Pokémon");
      setPokemon(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);

      //Debouncing
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Throttling
      const now = Date.now();
      const timeSinceLastSearch = now - lastSearchTime.current;

      if (timeSinceLastSearch < THROTTLE_DELAY) {
        debounceTimer.current = setTimeout(() => {
          lastSearchTime.current = Date.now();
          fetchPokemon(value);
        }, THROTTLE_DELAY - timeSinceLastSearch);
      } else {
        lastSearchTime.current = now;
        fetchPokemon(value);
      }
    },
    [fetchPokemon]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#E7DEAF] dark:bg-gray-900 py-12 px-4 flex items-center justify-center">
      <div className="max-w-7xl w-full">
        {!pokemon && !loading && (
          <div className="text-center mb-10">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg">
                <svg
                  className="w-12 h-12 text-[#007E6E] dark:text-[#73AF6F]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-[#007E6E] dark:text-white mb-3">
              PokéDex
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Discover and explore Pokémon
            </p>
          </div>
        )}

        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search Pokémon by name or number..."
              className="w-full px-8 py-5 text-lg rounded-full border-2 border-[#73AF6F] dark:border-[#007E6E] bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-[#007E6E] dark:focus:border-[#73AF6F] shadow-xl transition-all hover:shadow-2xl"
              autoFocus
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              {loading ? (
                <div className="w-6 h-6 border-3 border-[#73AF6F] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-2xl text-center">
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">
              {error}
            </p>
          </div>
        )}

        {pokemon && !loading && <PokemonCard pokemon={pokemon} />}

        {!pokemon && !loading && !error && (
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-gray-600 dark:text-gray-400 text-base mb-6 font-medium">
              Popular Pokémon
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {["pikachu", "charizard", "mewtwo", "eevee", "lucario", "dragonite", "gyarados", "gengar"].map(
                (suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSearch(suggestion)}
                    className="px-6 py-3 bg-white dark:bg-gray-800 hover:bg-[#73AF6F] hover:text-white dark:hover:bg-[#73AF6F] text-gray-700 dark:text-gray-300 border-2 border-[#73AF6F] dark:border-[#007E6E] rounded-full text-sm font-semibold transition-all capitalize shadow-md hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    {suggestion}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
