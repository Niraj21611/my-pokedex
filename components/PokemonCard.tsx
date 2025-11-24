"use client";

import Image from "next/image";
import { useState, useRef } from "react";

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

interface PokemonCardProps {
  pokemon: Pokemon;
}

const COLORS = {
  primary: "#73AF6F",
  secondary: "#007E6E",
  accent: "#E7DEAF",
  neutral: "#D7C097",
};

const TYPE_COLORS: Record<string, string> = {
  normal: "#D7C097",
  fire: "#73AF6F",
  water: "#007E6E",
  electric: "#E7DEAF",
  grass: "#73AF6F",
  ice: "#007E6E",
  fighting: "#73AF6F",
  poison: "#007E6E",
  ground: "#D7C097",
  flying: "#E7DEAF",
  psychic: "#73AF6F",
  bug: "#73AF6F",
  rock: "#D7C097",
  ghost: "#007E6E",
  dragon: "#007E6E",
  dark: "#007E6E",
  steel: "#D7C097",
  fairy: "#E7DEAF",
};

export default function PokemonCard({ pokemon }: PokemonCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playCry = () => {
    if (!pokemon.cries.latest) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(pokemon.cries.latest);
    audioRef.current = audio;

    setIsPlaying(true);
    audio.play().catch((err) => {
      console.error("Error playing audio:", err);
      setIsPlaying(false);
    });

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
  };

  const primaryType = pokemon.types[0];
  const typeColor = TYPE_COLORS[primaryType] || COLORS.neutral;

  return (
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
      <div
        className="px-8 py-6 border-b border-gray-200 dark:border-gray-800"
        style={{ backgroundColor: `${typeColor}15` }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-bold capitalize text-gray-900 dark:text-white">
              {pokemon.name}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              #{String(pokemon.id).padStart(3, "0")}
            </p>
          </div>

          {pokemon.cries.latest && (
            <button
              onClick={playCry}
              disabled={isPlaying}
              className="p-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              style={{
                backgroundColor: typeColor,
                color: "white",
              }}
              aria-label="Play Pokémon cry"
            >
              {isPlaying ? (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="p-8">
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            {pokemon.sprites.default && (
              <div className="relative w-full aspect-square mb-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <Image
                  src={pokemon.sprites.default}
                  alt={pokemon.name}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  className="px-4 py-2 rounded-lg text-white font-semibold uppercase text-xs tracking-wide"
                  style={{
                    backgroundColor: TYPE_COLORS[type] || COLORS.neutral,
                  }}
                >
                  {type}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center">
                <svg
                  className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Height
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {pokemon.height}m
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center">
                <svg
                  className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                  />
                </svg>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Weight
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {pokemon.weight}kg
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center">
              <svg
                className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Base Experience
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {pokemon.base_experience}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                About
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                {pokemon.flavor_text.replace(/\f/g, " ")}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Base Stats
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {pokemon.stats.map((stat) => (
                  <div
                    key={stat.name}
                    className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl"
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span className="capitalize text-gray-700 dark:text-gray-300 font-medium">
                        {stat.name.replace("-", " ")}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {stat.base}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((stat.base / 255) * 100, 100)}%`,
                          backgroundColor: typeColor,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                Abilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {pokemon.abilities.map((ability) => (
                  <span
                    key={ability}
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white capitalize text-sm font-medium border border-gray-200 dark:border-gray-700"
                  >
                    {ability.replace("-", " ")}
                  </span>
                ))}
              </div>
            </div>

            {pokemon.evolutions.length > 1 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  Evolution Chain
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {pokemon.evolutions.map((evo, index) => (
                    <div key={evo.name} className="flex items-center">
                      <span className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white capitalize text-sm font-medium border border-gray-200 dark:border-gray-700">
                        {evo.name}
                      </span>
                      {index < pokemon.evolutions.length - 1 && (
                        <svg
                          className="w-5 h-5 mx-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {pokemon.moves && pokemon.moves.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Move Set
              <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                ({pokemon.moves.length} moves)
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {pokemon.moves.map((move) => (
                <div
                  key={move.name}
                  className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#73AF6F] dark:hover:border-[#007E6E] transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white capitalize text-sm flex-1 mr-2">
                      {move.name.replace("-", " ")}
                    </h4>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold text-white whitespace-nowrap"
                      style={{
                        backgroundColor:
                          TYPE_COLORS[move.type] || COLORS.neutral,
                      }}
                    >
                      {move.type}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <span className="flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      {move.power || "—"}
                    </span>
                    <span className="flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {move.accuracy || "—"}%
                    </span>
                    <span className="flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                          clipRule="evenodd"
                        />
                      </svg>
                      PP {move.pp}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {move.effect}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
