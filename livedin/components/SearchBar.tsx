"use client";

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
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl gap-2">
      <div className="relative flex flex-1 items-center rounded-lg border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900">
        <span className="pointer-events-none absolute left-3 text-zinc-400 dark:text-zinc-500">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search address or property management company"
          disabled={disabled}
          className="w-full rounded-lg border-0 bg-transparent py-3 pl-10 pr-4 text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-500"
          aria-label="Search address or property management company"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            aria-label="Clear search"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-foreground px-4 py-3 font-medium text-background transition-colors hover:opacity-90 disabled:opacity-50"
      >
        Search
      </button>
    </form>
  );
}
