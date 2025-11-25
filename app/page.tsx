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
  const [allNames, setAllNames] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSearchTime = useRef(0);
  const THROTTLE_DELAY = 500;

  const fetchPokemon = useCallback(
    async (name: string) => {
      if (!name.trim()) {
        setPokemon(null);
        setError("");
        setSuggestions([]);
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
        const hasSuggestions = suggestions.length > 0;
        setError(
          hasSuggestions
            ? ""
            : err instanceof Error
            ? `No Pokémon found with the name "${name.trim()}"`
            : "Failed to fetch Pokémon"
        );
        setPokemon(null);
      } finally {
        setLoading(false);
      }
    },
    [suggestions.length]
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);

      const normalized = value.toLowerCase().trim();
      if (!normalized) {
        setSuggestions([]);
      } else {
        const matches = allNames
          .filter((name) => name.startsWith(normalized))
          .slice(0, 8);
        setSuggestions(matches);
      }

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
    [allNames, fetchPokemon]
  );

  useEffect(() => {
    const loadNames = async () => {
      try {
        const res = await fetch("/api/pokemon-suggestions");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.names)) {
          setAllNames(data.names);
        }
      } catch {}
    };

    loadNames();

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 flex items-center justify-center transition-colors duration-300">
      <div className="max-w-7xl w-full">
        {!pokemon && !loading && (
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-full shadow-xl ring-1 ring-slate-200 dark:ring-slate-700">
                <svg
                  className="w-14 h-14 text-[#007E6E] dark:text-[#73AF6F]"
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
            <h1
              className="text-6xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Poké<span className="text-[#007E6E]">Dex</span>
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-xl font-light">
              Discover and explore the world of Pokémon
            </p>
          </div>
        )}

        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-[#73AF6F] to-[#007E6E] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search Pokémon by name or number..."
              className="relative w-full px-8 py-6 text-xl rounded-full border-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-[#007E6E] dark:focus:ring-[#73AF6F] shadow-2xl transition-all"
              autoFocus
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              {loading ? (
                <div className="w-6 h-6 border-3 border-[#73AF6F] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  className="w-6 h-6 text-slate-400 group-hover:text-[#007E6E] transition-colors"
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

          {searchTerm.trim() && !pokemon && suggestions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSearch(name)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-[#007E6E] hover:text-white dark:hover:bg-[#73AF6F] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 capitalize"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && !pokemon && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center animate-fade-in">
            <p className="text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
          </div>
        )}

        {pokemon && !loading && (
          <div className="animate-fade-in-up">
            <PokemonCard pokemon={pokemon} />
          </div>
        )}

        {!pokemon && !loading && !error && !searchTerm.trim() && (
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <p className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider font-semibold mb-6">
              Popular Searches
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "pikachu",
                "charizard",
                "mewtwo",
                "eevee",
                "lucario",
                "dragonite",
                "gyarados",
                "gengar",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSearch(suggestion)}
                  className="px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-[#007E6E] hover:text-white dark:hover:bg-[#73AF6F] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 capitalize"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
