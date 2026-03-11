"use client";

import { inputClass, primaryButtonClass } from "@/lib/ui";

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  disabled?: boolean;
};

export function SearchBar({ value, onChange, onSubmit, disabled = false }: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(value.trim());
  };

  const handleClear = () => {
    onChange("");
    onSubmit("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <label htmlFor="property-search" className="sr-only">
          Search by address or management company
        </label>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
          <SearchIcon />
        </span>
        <input
          id="property-search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search address or property management company"
          disabled={disabled}
          className={`${inputClass} pl-12 pr-28`}
          aria-label="Search address or property management company"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled}
        className={`${primaryButtonClass} min-w-28 px-5 py-3`}
      >
        Search
      </button>
    </form>
  );
}
